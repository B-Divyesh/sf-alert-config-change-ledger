# Alert Config Ledger

Compare live alert routes with a reviewed baseline. Alert Config Ledger is a read-only CLI for platform teams using Grafana, Alertmanager, or normalized JSON exports.

It fingerprints recipient endpoints during import. Reports show that a recipient changed without printing an email address, phone number, or webhook URL.

## Try the bundled demo

```sh
cargo run -- demo
```

The command compares two realistic Grafana exports in a new temporary folder. It prints the drift report and the folder containing the generated snapshots. Nothing is uploaded.

## Install

Build the single binary from source:

```sh
git clone https://github.com/B-Divyesh/sf-alert-config-change-ledger.git
cd sf-alert-config-change-ledger
cargo install --path .
alert-ledger --help
```

The project starts at version `0.1.0`. The factory owns registry publishing; this repository does not publish itself.

## Usage

Snapshot an Alertmanager YAML export:

```sh
alert-ledger snapshot \
  --provider alertmanager \
  --input alertmanager.yml \
  --source git \
  --revision 8d3f441 \
  --output baseline.json
```

Snapshot Grafana's read-only provisioning API using a bearer token from an environment variable:

```sh
export ALERT_LEDGER_TOKEN='...'
alert-ledger snapshot \
  --provider grafana \
  --url 'https://grafana.example/api/v1/provisioning/policies' \
  --token-env ALERT_LEDGER_TOKEN \
  --source grafana-live \
  --output live.json
```

Compare live state with the reviewed baseline:

```sh
alert-ledger diff --baseline baseline.json --live live.json
alert-ledger diff --baseline baseline.json --live live.json --format json
alert-ledger diff --baseline baseline.json --live live.json --format markdown --output drift.md
```

Render changes across a folder of snapshots:

```sh
alert-ledger timeline --dir snapshots/
alert-ledger timeline --dir snapshots/ --format json
```

Exit code `0` means the command completed and no drift was found. `diff` and `timeline` return `2` when drift exists. Invalid input, network failures, and other command errors return `1`.

## Supported input

- Grafana notification-policy JSON and contact-point array exports.
- Alertmanager YAML or JSON with nested routes and receiver configs.
- Alert Config Ledger snapshot JSON for scripted pipelines.

The CLI performs `GET` requests only. It has no write command and sends no telemetry.

## Development

Requirements: Rust 1.85+ and Node 22+.

```sh
npm install
npm install --prefix api
npm test
npm run build
```

`npm test` runs Rust tests, site tests, and browser claim tests. `npm run build` produces the Rust release binary in `target/release/` and the static site in `dist/site/`.

Use `npm ci` and `npm ci --prefix api` instead in a clean CI checkout.

Run each part separately:

```sh
cargo test
cargo build --release
npm run dev
npm run build:site
npm run test:site
```

The landing-page demo is available at `/demo` and uses only bundled data. Its storage namespace is `demo:alert-config-ledger:*`.

The deployed demo URL is `https://alert-config-change-ledger.sociobot.in/demo`.

## Privacy and security

Configuration is processed by the CLI on your machine. API tokens are read from the environment and are not written to snapshots. Recipient targets are stored only as SHA-256 fingerprints. Non-secret provider fields and timestamps remain in snapshots. The static demo makes no cross-origin requests.

Existing Pro approval-report licenses are verified through the Sociobot billing API. The protected template comes from a same-origin function only after that check. New license sales are not open in this release. The CLI's snapshot, diff, timeline, JSON, and Markdown output remain free.

## Deploy

The checked-in `swa-cli.config.json` deploys both `dist/site/` and the
license-gated function in `api/` to
`https://alert-config-change-ledger.sociobot.in`. Verify that deployment shape
without publishing with `npm run deploy:check`; publish the production build
with `npm run deploy`. This repository does not manage DNS, infrastructure,
billing registration, or registry credentials.

## License

MIT. See [LICENSE](LICENSE).
