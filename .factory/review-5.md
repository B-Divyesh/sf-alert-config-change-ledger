# Adversarial first-read review 5 — Alert Config Ledger

- Work order: alert-config-change-ledger-review-5
- Repository head: afb596014be6ae5c8437b898394b4b07812ab217
- Live release source: 10590f1615bac48ed3463dad1ca4122101a13d72
- Live URL: https://alert-config-change-ledger.sociobot.in
- Reviewed: 30 August 2026 UTC
- Verdict: PASS

## Verdict

PASS — zero findings. The product is clear on a cold mobile and desktop read,
directly tryable, and its public capability and privacy statements have
clean-sandbox claim coverage. No earlier finding regressed. No untested claim,
dead link, routing defect, or accessibility failure was found.

## Cold first read

Fresh Chromium browser contexts were opened at 390 × 844 and 1366 × 768,
without scrolling or stored browser state.

| Question | First-read answer | Exact first-screen text | Result |
| --- | --- | --- | --- |
| What does this do? | It compares reviewed alert routes with live configuration. | “Compare reviewed and live alert routes” | Pass |
| For whom? | Platform teams checking that live routing still matches review. | “For platform teams who need to prove whether live alert routes match the reviewed baseline.” | Pass |
| What should I click first? | Open the populated sample comparison. | “Try it with sample data” and “Loads three sample route changes in an isolated demo.” | Pass |

The action was visible at y=526 on mobile and y=542 on desktop. All three
facts were completely visible in both viewports. No first-read blocking finding
applies.

## Copy audit

Word counts use whitespace-separated visible words. Commands and terminal
output are counted as visible strings, not judged as prose. No prose sentence
exceeds 22 words. No banned marketing adjective, unexplained metaphor,
inconsistent public term, context-free heading, or non-result action was found.
No rewrite is required.

### Landing page — sentences

| Copy | Words | Check |
| --- | ---: | --- |
| For platform teams who need to prove whether live alert routes match the reviewed baseline. | 15 | Pass |
| Loads three sample route changes in an isolated demo. | 9 | core-workflow; demo-privacy |
| Runs offline after the first visit. | 6 | offline-reload |
| Recipient endpoints stay redacted. | 4 | recipient-redaction |
| Core CLI needs no license. | 5 | free-core-cli |
| Reviewed baseline on the left. | 5 | Pass |
| Live configuration on the right. | 5 | Pass |
| The bundled demo runs the same comparison as the CLI. | 10 | web-cli-parity |
| Read Grafana or Alertmanager exports from a file or read-only URL. | 11 | provider-inputs; read-only-import |
| Keep non-secret provider fields and replace recipient endpoints with SHA-256 identifiers. | 11 | grafana-contact-points; recipient-redaction |
| Compare the baseline with live state and show each change with its timestamp. | 13 | change-timestamps |
| The demo ships inside the binary and needs no account. | 10 | core-workflow; no-telemetry |
| It does not send alerts. | 5 | read-only-import |
| It does not change provider config. | 6 | read-only-import |
| It does not replace Git review. | 6 | Product boundary |
| It does not send telemetry. | 5 | no-telemetry |
| A Pro license adds an approval report template with a sign-off checklist. | 12 | pro-pack-contents |
| The snapshot, diff, timeline, JSON, and Markdown commands need no license. | 12 | free-core-cli |
| New license sales are not open in this release. | 9 | sales-closed |
| No active license in this browser. | 6 | Observed empty state |
| Compare alert route changes with their sources. | 7 | Pass |

Headings, actions, and literal output were separately checked. “Read-only alert
route comparison,” “Compare reviewed and live alert routes,” “CLI demo / actual
command,” “Sample CLI comparison,” “Three steps,” “How the ledger works,”
“Import provider exports,” “Put routes in one format,” “Show route changes,”
“Install the CLI,” “Run the ledger locally,” “Read-only limits,” “What it does
not do,” “Optional Pro feature,” and “Use an existing Pro license” are direct
section names. “Try it with sample data,” “Read the terminal transcript,” “Get
the source on GitHub,” “Copy install command,” “Verify license,” and “Download
approval report template” name their results. All are under 22 words.

### README — sentences

| Copy | Words | Check |
| --- | ---: | --- |
| Compare live alert routes with a reviewed baseline. | 8 | Pass |
| Alert Config Ledger is a read-only CLI for platform teams using Grafana, Alertmanager, or Alert Config Ledger snapshot JSON. | 19 | provider-inputs; normalized-snapshot-input |
| It replaces recipient addresses and URLs with SHA-256 identifiers during import. | 11 | recipient-redaction |
| Reports show that a recipient changed without printing an email address, phone number, or webhook URL. | 16 | recipient-redaction |
| The command compares two sample Grafana exports in a new temporary folder. | 12 | core-workflow |
| It prints the change report and the folder containing the generated snapshots. | 12 | core-workflow |
| Nothing is uploaded. | 3 | read-only-import; no-telemetry |
| Build the single binary from source. | 6 | Pass |
| The project starts at version 0.1.0. | 6 | Checked package version |
| The factory owns registry publishing; this repository does not publish itself. | 11 | Deployer instruction |
| Snapshot an Alertmanager YAML export. | 5 | provider-inputs |
| Snapshot Grafana's read-only provisioning API using a bearer token from an environment variable. | 13 | read-only-import; token-exclusion |
| Compare live state with the reviewed baseline. | 7 | core-workflow |
| Render changes across a folder of snapshots. | 7 | free-core-cli |
| Exit code 0 means the command completed and no changes were found. | 12 | exit-codes |
| diff and timeline return 2 when changes exist. | 8 | exit-codes |
| Invalid input, network failures, and other command errors return 1. | 10 | exit-codes |
| The CLI performs GET requests only. | 6 | read-only-import |
| It has no write command and sends no telemetry. | 9 | read-only-import; no-telemetry |
| Minimum supported runtimes: Rust 1.85.0 and Node 22.12.0. | 8 | minimum-runtimes |
| npm test runs Rust tests, site tests, and browser claim tests. | 10 | Verified |
| npm run build produces the Rust release binary in target/release/ and the static site in dist/site/. | 15 | build-artifacts |
| Every claim command in .factory/claims.json runs from a clean clone in ledger order. | 13 | clean-claim-bootstrap |
| On its first run, npm test installs locked root and api test dependencies, including the API rate-limit dependency. | 19 | clean-claim-bootstrap |
| The minimum-runtime claim installs Rust 1.85.0 with minimal rustup when that toolchain is absent. | 15 | minimum-runtimes |
| For a direct regression check of that clean-clone path, run: | 11 | Pass |
| CI can install explicitly with npm ci and npm ci --prefix api before running the same commands. | 17 | Pass |
| Run each part separately: | 4 | Pass |
| The landing-page demo is available at /?demo=1 and /demo and uses only bundled data. | 14 | demo-privacy |
| It stores browser data only under keys that start with demo:alert-config-ledger:. | 12 | demo-privacy |
| The deployed demo URL is https://alert-config-change-ledger.sociobot.in/demo. | 5 | Pass |
| Configuration is processed by the CLI on your machine. | 9 | Architecture |
| API tokens are read from the environment and are not written to snapshots. | 13 | token-exclusion |
| Recipient endpoints are stored only as SHA-256 identifiers. | 8 | recipient-redaction |
| Non-secret provider fields and timestamps remain in snapshots. | 8 | grafana-contact-points; change-timestamps |
| The static demo makes no cross-origin requests. | 7 | demo-privacy |
| Existing Pro licenses are verified through the Sociobot billing API. | 10 | license-data-boundary |
| The approval report template comes from a same-origin function only after that check. | 13 | paid-template |
| New license sales are not open in this release. | 9 | sales-closed |
| The CLI's snapshot, diff, timeline, JSON, and Markdown output remain free. | 11 | free-core-cli |
| The checked-in swa-cli.config.json deploys both dist/site and the license-gated function in api to the product URL. | 17 | deployment-shape |
| Verify that deployment shape without publishing with npm run deploy:check; publish the production build with npm run deploy. | 16 | Deployer instruction |
| Each build writes the full source commit and static-file digests to dist/site/release.json, and gives the same commit to the API build header. | 21 | release-identity |
| After pushing and deploying a clean candidate, verify its exact source and live artifacts with: | 15 | Pass |
| Set ALERT_LEDGER_RATE_LIMIT_STORAGE as a secret application setting for the shared approval-pack request counter. | 12 | Deployer instruction |
| This repository does not manage DNS, infrastructure, billing registration, or registry credentials. | 11 | Deployer boundary |
| MIT. | 1 | Pass |
| See LICENSE. | 2 | Pass |

README headings are direct labels: “Try the bundled demo,” “Install,” “Usage,”
“Supported input,” “Development,” “Privacy and security,” “Deploy,” and
“License.” Code blocks are executable commands, not prose sentences.

## Demo, sandbox, and CLI

- Direct /demo entry showed the persistent “Demo — sample data, nothing is
  saved” banner and a populated comparison immediately: three changed and two
  matched routes.
- Selecting a route showed baseline and live values. Reset demo restored the
  sample. Start for real removed seeded state and a deliberately added
  demo:alert-config-ledger:probe key, while preserving a deliberately added
  non-demo key.
- The fresh-context request log contained only the product origin. The rendered
  sample and downloaded report contained no sample email or webhook endpoint.
- After service-worker installation and one online reload, live /demo reloaded
  offline and displayed the offline notice plus the populated comparison.
- target/debug/alert-ledger demo created a new /tmp/alert-ledger-demo-*
  directory and reported three changes, two matches, source timestamps, and
  endpoint fingerprints. It did not require an account or network.

## Claims

.factory/claims.json contains 25 entries. npm run test:claims-clean was run
from this checkout. It created a --no-local --depth 1 clone without root or API
dependencies, bootstrapped locked test dependencies, and replayed every ledger
command in order while accounting for its own clean-claim-bootstrap invocation.
All entries passed:

core-workflow, change-timestamps, provider-inputs, normalized-snapshot-input,
grafana-contact-points, read-only-import, recipient-redaction, token-exclusion,
exit-codes, free-core-cli, no-telemetry, demo-privacy, demo-exit-clears-state,
offline-reload, report-download, web-cli-parity, paid-template,
pro-pack-contents, license-data-boundary, sales-closed, minimum-runtimes,
build-artifacts, release-identity, deployment-shape, and clean-claim-bootstrap.

The claim-like public copy was cross-checked against that ledger in the tables
above. No unlisted claim remains. The brief implies a read-only comparison CLI;
it already includes the expected imports, JSON and Markdown exports, a
timeline, and a one-command sample run. An AI feature would not improve this
deterministic comparison workflow, so no missed AI leverage finding applies.

## Structure and accessibility

- Live /, /demo, /privacy, /terms, and /404.html returned 200; an unknown URL
  returned the designed 404 with HTTP 404. The navigable product links plus
  GitHub and Param Factory returned 200; mail links are explicit.
- Each regular route had exactly one main and one h1, lang=en, a route-specific
  title, description, canonical URL, Open Graph/Twitter metadata, favicon, and
  apple-touch icon. The 404 had matching metadata.
- A live Back/Forward check restored the previously focused footer Privacy
  control and scroll position (5022 px), and moved focus to the Privacy h1 on
  forward navigation.
- Live Axe scans at 390 px found no serious or critical issue on /, /demo,
/privacy, /terms, or /404.html. Normal route loads logged no console errors.
The browser console error for a deliberately requested HTTP 404 was expected.
- The cassette-zine visual system is distinct from a generic SaaS template and
  matches .factory/design.md: warm paper, ink, oxide, and teal; mono body copy;
  original cassette collage; square print-like controls; and reduced-motion-safe
  reel motion.

## Earlier findings regression check

Each prior finding was confirmed against the deployed UI and current source;
none is merely marked fixed.

| Finding | Current confirmation |
| --- | --- |
| F-1-1 | Bounded H1 is “Compare reviewed and live alert routes.” |
| F-1-2 | Normalized snapshot input has its own clean claim test. |
| F-1-3 | Public demo copy says “sample,” not “realistic.” |
| F-1-4 | Action and all three facts fit both first viewports. |
| F-1-5 | Eyebrow says “Read-only alert route comparison.” |
| F-1-6 | Caption identifies the reviewed baseline by location. |
| F-1-7 | Caption identifies live configuration by location. |
| F-1-8 | Preview label is “CLI demo / actual command.” |
| F-1-9 | Preview heading is “Sample CLI comparison.” |
| F-1-10 | Workflow label is “Three steps.” |
| F-1-11 | Installation label is “Install the CLI.” |
| F-1-12 | Boundary label is “Read-only limits.” |
| F-1-13 | Paid label is “Optional Pro feature.” |
| F-1-14 | Separate Start-for-real and installation exits clear demo-only keys. |
| F-1-15 | First workflow step is “Import provider exports.” |
| F-1-16 | Second workflow step is “Put routes in one format.” |
| F-1-17 | Third workflow step is “Show route changes.” |
| F-1-18 | README explains SHA-256 identifiers plainly. |
| F-1-19 | Public prose consistently uses “change.” |
| F-1-20 | Public privacy term is “recipient endpoint.” |
| F-1-21 | Demo browser-key prefix is explained in plain language. |
| F-1-22 | Every regular route has its own description and social metadata. |
| F-2-1 | Every report change has a tested source timestamp. |
| F-2-2 | Approval template Route changes, Evidence, and Sign-off sections are tested. |
| F-3-1 | Live Back/Forward restores focus and scroll. |
| F-3-2 | Alertmanager JSON nested-route support is in provider-inputs. |
| F-3-3 | Minimum Rust and Node versions have a clean claim test. |
| F-3-4 | Release binary and static artifacts have a clean claim test. |
| F-3-5 | Static site/API deployment shape is a registered claim. |
| F-3-6 | README gives a deployer instruction, not an unverifiable assertion. |
| F-4-1 | License storage and request boundary have a dedicated browser claim. |
| F-4-2 | Paid artifact is consistently “approval report template.” |

## What would make this perfect

Nothing actionable remains in the current scope. Maintain the clean-clone
ledger replay and repeat the cold mobile demo check whenever product copy,
storage, routing, or deployment output changes.
