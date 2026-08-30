# Landing copy audit

Audited 29 August 2026 after Polish 3 against the release-candidate landing page. Counts treat route labels and command names as one word. Terminal output is literal output. No prose item exceeds 22 words or contains a banned plain-words term.

| Copy | Words | Result |
| --- | ---: | --- |
| Skip to main content | 4 | Pass |
| ACL | 1 | Pass |
| Alert Config Ledger | 3 | Pass |
| Demo | 1 | Pass |
| Install | 1 | Pass |
| Privacy | 1 | Pass |
| Read-only alert route comparison | 4 | Pass |
| Compare reviewed and live alert routes | 6 | Pass |
| For platform teams who need to prove whether live alert routes match the reviewed baseline. | 15 | Pass |
| Try it with sample data | 5 | Pass |
| Loads three sample route changes in an isolated demo. | 9 | Pass |
| Runs offline after the first visit. | 6 | Pass: `offline-reload` |
| Recipient endpoints stay redacted. | 4 | Pass: `recipient-redaction` |
| Core CLI needs no license. | 5 | Pass: `free-core-cli` |
| Reviewed baseline on the left. | 5 | Pass |
| Live configuration on the right. | 5 | Pass |
| CLI demo / actual command | 5 | Pass |
| Sample CLI comparison | 3 | Pass |
| The bundled demo runs the same comparison as the CLI. | 10 | Pass: `web-cli-parity` |
| Read the terminal transcript | 4 | Pass |
| `$ alert-ledger demo` | 3 | Literal command |
| `! CHANGE 3 changed routes · 2 matched` | 8 | Literal CLI output |
| `~ team = payments · recipients` | 6 | Literal CLI output |
| `~ service = checkout · severity, recipients` | 7 | Literal CLI output |
| `+ team = security · route` | 6 | Literal CLI output |
| `Demo files: /tmp/alert-ledger-demo-…` | 3 | Literal CLI output |
| Three steps | 2 | Pass |
| How the ledger works | 4 | Pass |
| Import provider exports | 3 | Pass |
| Read Grafana or Alertmanager exports from a file or read-only URL. | 11 | Pass: `provider-inputs`, `read-only-import` |
| Put routes in one format | 5 | Pass |
| Keep non-secret provider fields and replace recipient endpoints with SHA-256 identifiers. | 11 | Pass: `grafana-contact-points`, `recipient-redaction` |
| Show route changes | 3 | Pass |
| Compare the baseline with live state and show each change with its timestamp. | 13 | Pass: `change-timestamps` |
| Install the CLI | 3 | Pass |
| Run the ledger locally | 4 | Pass |
| The demo ships inside the binary and needs no account. | 10 | Pass: `core-workflow`, `no-telemetry` |
| Get the source on GitHub (external site). | 7 | Pass |
| `git clone https://github.com/B-Divyesh/sf-alert-config-change-ledger.git` | 3 | Literal command |
| `cd sf-alert-config-change-ledger` | 2 | Literal command |
| `cargo install --path .` | 4 | Literal command |
| `alert-ledger demo` | 2 | Literal command |
| Copy install command | 3 | Pass |
| Read-only limits | 2 | Pass |
| What it does not do | 5 | Pass |
| It does not send alerts. | 5 | Pass: `read-only-import` |
| It does not change provider config. | 6 | Pass: `read-only-import` |
| It does not replace Git review. | 6 | Pass |
| It does not send telemetry. | 5 | Pass: `no-telemetry` |
| Optional Pro feature | 3 | Pass |
| Use an existing Pro license | 5 | Pass |
| A Pro license adds an approval report template with a sign-off checklist. | 12 | Pass: `pro-pack-contents` |
| The snapshot, diff, timeline, JSON, and Markdown commands need no license. | 12 | Pass: `free-core-cli` |
| New license sales are not open in this release. | 9 | Pass: `sales-closed` |
| No active license in this browser. | 6 | Pass |
| Have a license? Paste it | 5 | Pass |
| Verify license | 2 | Pass |
| Compare alert route changes with their sources. | 7 | Pass |
| Terms | 1 | Pass |
| Built by Param Factory (external site) | 6 | Pass |
| v0.1.0 · build 004 | 4 | Pass |

## Terminology

| Concept | One word or phrase used |
| --- | --- |
| Approved Git state | reviewed baseline |
| Provider state now | live configuration |
| One routing rule | route |
| Captured provider state | snapshot |
| Difference between states | change |
| Downloadable result | report |
| One-click sample environment | demo |
| Protected contact value | recipient endpoint |
| Paid proof of purchase | license |
| Paid download | approval report template |

## First-screen read-aloud

“Compare reviewed and live alert routes. For platform teams who need to prove whether live alert routes match the reviewed baseline. Try it with sample data.”

This states the job, audience, situation, and first action in one breath.
