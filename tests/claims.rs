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
