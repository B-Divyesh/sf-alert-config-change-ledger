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

/// @claim:change-timestamps
#[test]
fn claim_change_timestamps_appear_on_every_report_change() {
    let output = Command::cargo_bin("alert-ledger")
        .unwrap()
        .args(["demo", "--json"])
        .output()
        .unwrap();
    assert!(output.status.success());

    let demo: serde_json::Value = serde_json::from_slice(&output.stdout).unwrap();
    let report = demo.get("report").unwrap();
    let changes = report
        .get("changes")
        .and_then(|value| value.as_array())
        .unwrap();
    let live_timestamp = report
        .pointer("/live/captured_at")
        .and_then(|value| value.as_str())
        .unwrap();
    assert_eq!(changes.len(), 3);
    assert!(changes.iter().all(|change| {
        change
            .pointer("/attributed_to/captured_at")
            .and_then(|value| value.as_str())
            == Some(live_timestamp)
    }));

    let output_dir = demo
        .get("output_dir")
        .and_then(|value| value.as_str())
        .unwrap();
    let markdown =
        std::fs::read_to_string(std::path::Path::new(output_dir).join("changes.md")).unwrap();
    for change in changes {
        let route = change
            .get("route")
            .and_then(|value| value.as_str())
            .unwrap();
        let row = markdown.lines().find(|line| line.contains(route)).unwrap();
        assert!(
            row.contains(live_timestamp),
            "missing timestamp in row: {row}"
        );
    }
    std::fs::remove_dir_all(output_dir).unwrap();
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

    let negative_regex = parse_export(
        include_bytes!("fixtures/alertmanager-negative-regex-reviewed.yml"),
        "alertmanager",
        Source {
            name: "test".into(),
            revision: None,
        },
        Utc::now(),
    )
    .unwrap();
    assert_eq!(
        negative_regex.routes[1]
            .matchers
            .get("team")
            .map(String::as_str),
        Some("!~dev")
    );
}

/// @claim:normalized-snapshot-input
#[test]
fn claim_normalized_snapshot_input_can_be_compared() {
    let folder = tempdir().unwrap();
    let (baseline, live) = demo_snapshots().unwrap();
    let original = folder.path().join("reviewed.json");
    let imported = folder.path().join("reviewed-imported.json");
    let live_path = folder.path().join("live.json");
    std::fs::write(&original, serde_json::to_vec_pretty(&baseline).unwrap()).unwrap();
    std::fs::write(&live_path, serde_json::to_vec_pretty(&live).unwrap()).unwrap();

    Command::cargo_bin("alert-ledger")
        .unwrap()
        .args([
            "snapshot",
            "--provider",
            "normalized",
            "--input",
            original.to_str().unwrap(),
            "--source",
            "scripted-pipeline",
            "--output",
            imported.to_str().unwrap(),
        ])
        .assert()
        .success();

    Command::cargo_bin("alert-ledger")
        .unwrap()
        .args([
            "diff",
            "--baseline",
            imported.to_str().unwrap(),
            "--live",
            live_path.to_str().unwrap(),
            "--format",
            "json",
        ])
        .assert()
        .code(2)
        .stdout(predicate::str::contains("\"changes\""));
}

#[test]
fn duplicate_sibling_routes_keep_unique_ids_and_recipient_drift() {
    let baseline = parse_export(
        include_bytes!("fixtures/grafana-duplicate-siblings-reviewed.json"),
        "grafana",
        Source {
            name: "reviewed".into(),
            revision: None,
        },
        "2026-08-27T09:00:00Z".parse().unwrap(),
    )
    .unwrap();
    let live = parse_export(
        include_bytes!("fixtures/grafana-duplicate-siblings-live.json"),
        "grafana",
        Source {
            name: "live".into(),
            revision: None,
        },
        "2026-08-28T09:00:00Z".parse().unwrap(),
    )
    .unwrap();
    let ids = baseline
        .routes
        .iter()
        .map(|route| &route.id)
        .collect::<std::collections::BTreeSet<_>>();
    let baseline_ids = baseline
        .routes
        .iter()
        .map(|route| &route.id)
        .collect::<Vec<_>>();
    let live_ids = live
        .routes
        .iter()
        .map(|route| &route.id)
        .collect::<Vec<_>>();
    let report = compare(&baseline, &live);

    assert_eq!(baseline.routes.len(), 3);
    assert_eq!(ids.len(), 3, "every normalized route ID must be unique");
    assert_eq!(
        baseline_ids, live_ids,
        "recipient edits must not change IDs"
    );
    assert_eq!(report.matched_routes, 2);
    assert_eq!(report.changes.len(), 1);
    assert_eq!(report.changes[0].fields, ["recipients"]);
}

#[test]
fn alertmanager_negative_regex_matcher_drift_is_detected() {
    let baseline = parse_export(
        include_bytes!("fixtures/alertmanager-negative-regex-reviewed.yml"),
        "alertmanager",
        Source {
            name: "reviewed".into(),
            revision: None,
        },
        "2026-08-27T09:00:00Z".parse().unwrap(),
    )
    .unwrap();
    let live = parse_export(
        include_bytes!("fixtures/alertmanager-negative-regex-live.yml"),
        "alertmanager",
        Source {
            name: "live".into(),
            revision: None,
        },
        "2026-08-28T09:00:00Z".parse().unwrap(),
    )
    .unwrap();
    let report = compare(&baseline, &live);

    assert_eq!(baseline.routes[1].matchers["team"], "!~dev");
    assert_eq!(live.routes[1].matchers["team"], "!~test");
    assert!(!report.changes.is_empty());
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
    Command::cargo_bin("alert-ledger")
        .unwrap()
        .args([
            "snapshot",
            "--provider",
            "grafana",
            "--source",
            "reviewed",
            "--output",
            folder.path().join("unused.json").to_str().unwrap(),
            "--unknown-option",
        ])
        .assert()
        .code(1)
        .stderr(predicate::str::contains(
            "unexpected argument '--unknown-option'",
        ));
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
