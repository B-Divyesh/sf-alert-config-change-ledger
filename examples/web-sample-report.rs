use alert_config_change_ledger::{compare, demo_snapshots};

fn main() {
    let (baseline, live) = demo_snapshots().expect("bundled demo fixtures must parse");
    let report = compare(&baseline, &live);
    println!(
        "{}",
        serde_json::to_string(&report).expect("bundled demo report must serialize")
    );
}
