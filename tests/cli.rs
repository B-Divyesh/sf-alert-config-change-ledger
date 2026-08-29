use assert_cmd::Command;
use predicates::prelude::*;
use std::io::{Read, Write};
use std::net::TcpListener;
use tempfile::tempdir;

#[test]
fn demo_runs_without_setup() {
    Command::cargo_bin("alert-ledger")
        .unwrap()
        .arg("demo")
        .assert()
        .success()
        .stdout(predicate::str::contains("! CHANGE  3 changed routes"))
        .stdout(predicate::str::contains("Demo files:"));
}

#[test]
fn json_demo_is_scriptable_and_redacted() {
    Command::cargo_bin("alert-ledger")
        .unwrap()
        .args(["demo", "--json"])
        .assert()
        .success()
        .stdout(predicate::str::contains("\"changes\""))
        .stdout(predicate::str::contains("fp:"))
        .stdout(predicate::str::contains("example.test").not());
}

#[test]
fn invalid_input_explains_recovery() {
    Command::cargo_bin("alert-ledger")
        .unwrap()
        .args([
            "snapshot",
            "--provider",
            "grafana",
            "--input",
            "missing.json",
            "--source",
            "live",
            "--output",
            "out.json",
        ])
        .assert()
        .failure()
        .stderr(predicate::str::contains(
            "cannot read input file missing.json",
        ));
}

#[test]
fn invalid_provider_shapes_exit_one_without_writing_snapshots() {
    let folder = tempdir().unwrap();
    for (name, provider, body, message) in [
        (
            "grafana-empty",
            "grafana",
            "{}",
            "grafana export has no policy route",
        ),
        (
            "grafana-error-envelope",
            "grafana",
            r#"{"message":"Access denied"}"#,
            "grafana export has no policy route",
        ),
        (
            "alertmanager-empty",
            "alertmanager",
            "{}",
            "alertmanager export has no route",
        ),
    ] {
        let input = folder.path().join(format!("{name}.json"));
        let output = folder.path().join(format!("{name}-snapshot.json"));
        std::fs::write(&input, body).unwrap();

        Command::cargo_bin("alert-ledger")
            .unwrap()
            .args([
                "snapshot",
                "--provider",
                provider,
                "--input",
                input.to_str().unwrap(),
                "--source",
                "invalid-response",
                "--output",
                output.to_str().unwrap(),
            ])
            .assert()
            .code(1)
            .stderr(predicate::str::contains(message))
            .stderr(predicate::str::contains("non-empty 'receiver' field"));

        assert!(!output.exists(), "{name} must not produce a snapshot");
    }
}

#[test]
fn http_200_error_envelope_exits_one_without_writing_snapshot() {
    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let address = listener.local_addr().unwrap();
    std::thread::spawn(move || {
        let (mut stream, _) = listener.accept().unwrap();
        let mut request = [0_u8; 2048];
        let request_size = stream.read(&mut request).unwrap();
        assert!(request_size > 0);
        let body = r#"{"message":"Access denied"}"#;
        write!(
            stream,
            "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
            body.len()
        )
        .unwrap();
    });

    let folder = tempdir().unwrap();
    let output = folder.path().join("error-envelope-snapshot.json");
    Command::cargo_bin("alert-ledger")
        .unwrap()
        .args([
            "snapshot",
            "--provider",
            "grafana",
            "--url",
            &format!("http://{address}"),
            "--source",
            "grafana-live",
            "--output",
            output.to_str().unwrap(),
        ])
        .assert()
        .code(1)
        .stderr(predicate::str::contains(
            "grafana export has no policy route",
        ))
        .stderr(predicate::str::contains("non-empty 'receiver' field"));

    assert!(
        !output.exists(),
        "an error response must not become a snapshot"
    );
}

#[test]
fn duplicate_sibling_recipient_change_exits_with_drift() {
    let folder = tempdir().unwrap();
    let baseline = folder.path().join("baseline.json");
    let live = folder.path().join("live.json");
    for (input, output) in [
        (
            "tests/fixtures/grafana-duplicate-siblings-reviewed.json",
            &baseline,
        ),
        ("tests/fixtures/grafana-duplicate-siblings-live.json", &live),
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
                "test",
                "--output",
                output.to_str().unwrap(),
            ])
            .assert()
            .success()
            .stdout(predicate::str::contains("Wrote 3 routes"));
    }

    Command::cargo_bin("alert-ledger")
        .unwrap()
        .args([
            "diff",
            "--baseline",
            baseline.to_str().unwrap(),
            "--live",
            live.to_str().unwrap(),
            "--format",
            "json",
        ])
        .assert()
        .code(2)
        .stdout(predicate::str::contains("\"matched_routes\": 2"))
        .stdout(predicate::str::contains("\"recipients\""));
}

#[test]
fn alertmanager_negative_regex_change_exits_with_drift() {
    let folder = tempdir().unwrap();
    let baseline = folder.path().join("baseline.json");
    let live = folder.path().join("live.json");
    for (input, output) in [
        (
            "tests/fixtures/alertmanager-negative-regex-reviewed.yml",
            &baseline,
        ),
        ("tests/fixtures/alertmanager-negative-regex-live.yml", &live),
    ] {
        Command::cargo_bin("alert-ledger")
            .unwrap()
            .args([
                "snapshot",
                "--provider",
                "alertmanager",
                "--input",
                input,
                "--source",
                "test",
                "--output",
                output.to_str().unwrap(),
            ])
            .assert()
            .success();
    }

    Command::cargo_bin("alert-ledger")
        .unwrap()
        .args([
            "diff",
            "--baseline",
            baseline.to_str().unwrap(),
            "--live",
            live.to_str().unwrap(),
            "--format",
            "json",
        ])
        .assert()
        .code(2)
        .stdout(predicate::str::contains("!~dev"))
        .stdout(predicate::str::contains("!~test"));
}
