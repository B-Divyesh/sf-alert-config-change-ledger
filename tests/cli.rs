use assert_cmd::Command;
use predicates::prelude::*;
use tempfile::tempdir;

#[test]
fn demo_runs_without_setup() {
    Command::cargo_bin("alert-ledger")
        .unwrap()
        .arg("demo")
        .assert()
        .success()
        .stdout(predicate::str::contains("! DRIFT  3 changed routes"))
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
