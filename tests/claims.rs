use alert_config_change_ledger::{Source, compare, demo_snapshots, parse_export};
use assert_cmd::Command;
use chrono::Utc;
use predicates::prelude::*;
use std::io::{Read, Write};
use std::net::TcpListener;
use std::sync::mpsc;
use tempfile::tempdir;

/// @claim:core-workflow
#[test]
fn claim_core_workflow_no_license() {
    Command::cargo_bin("alert-ledger")
        .unwrap()
        .arg("demo")
        .env_remove("ALERT_LEDGER_LICENSE")
        .assert()
        .success()
        .stdout(predicate::str::contains("3 changed routes"))
        .stdout(predicate::str::contains("grafana:production#live-1842"));
}

/// @claim:provider-inputs
#[test]
fn claim_provider_inputs() {
    let grafana = parse_export(
        include_bytes!("../examples/grafana-reviewed.json"),
        "grafana",
        Source {
            name: "test".into(),
            revision: None,
        },
        Utc::now(),
    )
    .unwrap();
    let alertmanager = parse_export(
        include_bytes!("../examples/alertmanager.yml"),
        "alertmanager",
        Source {
            name: "test".into(),
            revision: None,
        },
        Utc::now(),
    )
    .unwrap();
    assert_eq!(grafana.provider, "grafana");
    assert_eq!(alertmanager.provider, "alertmanager");
    assert!(!grafana.routes.is_empty());
    assert!(!alertmanager.routes.is_empty());
}

/// @claim:grafana-contact-points
#[test]
fn claim_grafana_contact_points_and_provider_fields() {
    let baseline = parse_export(
        include_bytes!("../examples/grafana-contact-points-reviewed.json"),
        "grafana",
        Source {
            name: "reviewed".into(),
            revision: None,
        },
        "2026-08-27T09:00:00Z".parse().unwrap(),
    )
    .unwrap();
    let live = parse_export(
        include_bytes!("../examples/grafana-contact-points-live.json"),
        "grafana",
        Source {
            name: "live".into(),
            revision: None,
        },
        "2026-08-28T10:15:00Z".parse().unwrap(),
    )
    .unwrap();
    let report = compare(&baseline, &live);
    let output = serde_json::to_string(&baseline).unwrap();

    assert_eq!(baseline.routes.len(), 5);
    assert_eq!(report.changes.len(), 5);
    assert!(
        report
            .changes
            .iter()
            .all(|change| change.fields == ["recipients"])
    );
    assert!(baseline.routes.iter().any(|route| {
        route.provider_updated_at.as_deref() == Some("2026-08-27T09:00:00Z")
            && route.recipients[0].provider_fields["provenance"] == "file"
    }));
    for secret in [
        "pd-reviewed-key",
        "ops-reviewed-key",
        "hooks.slack.test",
        "webhook-reviewed-token",
        "ops-reviewed@example.test",
    ] {
        assert!(!output.contains(secret));
    }
}

/// @claim:read-only-import
#[test]
fn claim_read_only_get_and_command_surface() {
    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let address = listener.local_addr().unwrap();
    let (sender, receiver) = mpsc::channel();
    let body = include_bytes!("../examples/grafana-reviewed.json").to_vec();
    std::thread::spawn(move || {
        let (mut stream, _) = listener.accept().unwrap();
        let mut request = [0_u8; 4096];
        let size = stream.read(&mut request).unwrap();
        sender
            .send(String::from_utf8_lossy(&request[..size]).to_string())
            .unwrap();
        write!(stream, "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n", body.len()).unwrap();
        stream.write_all(&body).unwrap();
    });

    let folder = tempdir().unwrap();
    Command::cargo_bin("alert-ledger")
        .unwrap()
        .args([
            "snapshot",
            "--provider",
            "grafana",
            "--url",
            &format!("http://{address}"),
            "--source",
            "test-live",
            "--output",
            folder.path().join("live.json").to_str().unwrap(),
        ])
        .assert()
        .success();
    assert!(receiver.recv().unwrap().starts_with("GET / HTTP/1.1"));

    Command::cargo_bin("alert-ledger")
        .unwrap()
        .arg("--help")
        .assert()
        .success()
        .stdout(predicate::str::contains("snapshot"))
        .stdout(predicate::str::contains("diff"))
        .stdout(predicate::str::contains("timeline"))
        .stdout(predicate::str::contains("apply").not())
        .stdout(predicate::str::contains("send").not());
}

/// @claim:token-exclusion
#[test]
fn claim_api_tokens_never_enter_snapshots() {
    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let address = listener.local_addr().unwrap();
    let (sender, receiver) = mpsc::channel();
    let body = include_bytes!("../examples/grafana-reviewed.json").to_vec();
    std::thread::spawn(move || {
        let (mut stream, _) = listener.accept().unwrap();
        let mut request = [0_u8; 4096];
        let size = stream.read(&mut request).unwrap();
        sender
            .send(String::from_utf8_lossy(&request[..size]).to_string())
            .unwrap();
        write!(stream, "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n", body.len()).unwrap();
        stream.write_all(&body).unwrap();
    });

    let folder = tempdir().unwrap();
    let output = folder.path().join("live.json");
    Command::cargo_bin("alert-ledger")
        .unwrap()
        .args([
            "snapshot",
            "--provider",
            "grafana",
            "--url",
            &format!("http://{address}"),
            "--token-env",
            "CLAIM_TEST_TOKEN",
            "--source",
            "test-live",
            "--output",
            output.to_str().unwrap(),
        ])
        .env("CLAIM_TEST_TOKEN", "never-write-this-token")
        .assert()
        .success();
    assert!(
        receiver
            .recv()
            .unwrap()
            .to_ascii_lowercase()
            .contains("authorization: bearer never-write-this-token")
    );
    assert!(
        !std::fs::read_to_string(output)
            .unwrap()
            .contains("never-write-this-token")
    );
}

/// @claim:recipient-redaction
#[test]
fn claim_recipient_values_are_redacted() {
    let (baseline, live) = demo_snapshots().unwrap();
    let report = serde_json::to_string(&compare(&baseline, &live)).unwrap();
    assert!(!report.contains("@example.test"));
    assert!(!report.contains("https://"));
    assert!(report.contains("fp:"));
}

/// @claim:no-telemetry
#[test]
fn claim_demo_needs_no_network_or_telemetry() {
    Command::cargo_bin("alert-ledger")
        .unwrap()
        .arg("demo")
        .env("HTTP_PROXY", "http://127.0.0.1:1")
        .env("HTTPS_PROXY", "http://127.0.0.1:1")
        .assert()
        .success();
}

/// @claim:exit-codes
#[test]
fn claim_documented_exit_codes() {
    let folder = tempdir().unwrap();
    let (baseline, live) = demo_snapshots().unwrap();
    let baseline_path = folder.path().join("baseline.json");
    let live_path = folder.path().join("live.json");
    let bad_path = folder.path().join("bad.txt");
    std::fs::write(&baseline_path, serde_json::to_vec(&baseline).unwrap()).unwrap();
    std::fs::write(&live_path, serde_json::to_vec(&live).unwrap()).unwrap();
    std::fs::write(&bad_path, b"not json").unwrap();

    Command::cargo_bin("alert-ledger")
        .unwrap()
        .args([
            "diff",
            "--baseline",
            baseline_path.to_str().unwrap(),
            "--live",
            baseline_path.to_str().unwrap(),
        ])
        .assert()
        .code(0);
    Command::cargo_bin("alert-ledger")
        .unwrap()
        .args([
            "diff",
            "--baseline",
            baseline_path.to_str().unwrap(),
            "--live",
            live_path.to_str().unwrap(),
        ])
        .assert()
        .code(2);
    Command::cargo_bin("alert-ledger")
        .unwrap()
        .args([
            "diff",
            "--baseline",
            bad_path.to_str().unwrap(),
            "--live",
            live_path.to_str().unwrap(),
        ])
        .assert()
        .code(1);
}

/// @claim:free-core-cli
#[test]
fn claim_core_commands_and_formats_need_no_license() {
    let folder = tempdir().unwrap();
    let baseline = folder.path().join("baseline.json");
    let live = folder.path().join("live.json");
    for (input, source, output) in [
        ("examples/grafana-reviewed.json", "reviewed", &baseline),
        ("examples/grafana-live.json", "live", &live),
    ] {
        Command::cargo_bin("alert-ledger")
            .unwrap()
            .args([
                "snapshot",
                "--provider",
                "grafana",
                "--input",
                input,
                "--source",
                source,
                "--output",
                output.to_str().unwrap(),
            ])
            .env_remove("ALERT_LEDGER_LICENSE")
            .assert()
            .success();
    }
    for format in ["terminal", "json", "markdown"] {
        Command::cargo_bin("alert-ledger")
            .unwrap()
            .args([
                "diff",
                "--baseline",
                baseline.to_str().unwrap(),
                "--live",
                live.to_str().unwrap(),
                "--format",
                format,
            ])
            .env_remove("ALERT_LEDGER_LICENSE")
            .assert()
            .code(2);
    }
    Command::cargo_bin("alert-ledger")
        .unwrap()
        .args(["timeline", "--dir", folder.path().to_str().unwrap()])
        .env_remove("ALERT_LEDGER_LICENSE")
        .assert()
        .code(2);
}
