use assert_cmd::Command;
use predicates::prelude::*;

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
