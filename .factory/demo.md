# Demo sandbox

## CLI

Run `cargo run -- demo` from a clean clone. The command loads `examples/grafana-reviewed.json` and `examples/grafana-live.json`, writes normalized snapshots and a Markdown report to a new system temporary directory, and prints that path. Each run uses a new directory.

## Web

Open `/?demo=1`, `/demo`, or `https://alert-config-change-ledger.sociobot.in/?demo=1`. It loads the same reviewed and live scenario with three route changes. The first screen already contains the comparison.

Demo state uses only keys beginning with `demo:alert-config-ledger:`. **Reset demo** replaces that state with the bundled sample. **Install the CLI** deletes the demo state before returning to the installation instructions. The sample is cached by the site service worker and reloads after the browser goes offline.

The sandbox includes a changed payments recipient, a checkout severity increase, and a new security route. Recipient contact values are not present in the browser sample or its downloaded report.
