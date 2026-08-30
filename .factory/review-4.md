# Adversarial first-read review 4 — Alert Config Ledger

- Work order: `alert-config-change-ledger-review-4`
- Repository head: `4c68842bb97ea24a8a8fddc1e48a7a48c477b9a3`
- Live release: `1fa6e8252e05e7a2471205ce631e8611e1fb761c` (the only later commit changes factory documentation)
- Live URL: <https://alert-config-change-ledger.sociobot.in>
- Reviewed: 30 August 2026 UTC
- Verdict: **FAIL**

## Verdict

**FAIL: two findings remain (one major, one minor; no blocking finding).**
The first screen, one-click demo, storage isolation, offline reload, CLI demo,
all 24 clean-clone claim commands, full test suite, build, routes, metadata,
internal links, accessibility scan, and all 30 earlier findings pass. The
privacy route still makes a specific license-data promise without a matching
claim entry or complete observable test. The paid download is also called
three different things. Zero findings are required for PASS.

## 1. Cold first read

I opened the production URL in new Chromium contexts at 390 × 844 and
1366 × 768. I recorded the first viewport before scrolling.

| Question | My first-read answer | Exact text | Result |
| --- | --- | --- | --- |
| What does this do? | It compares reviewed alert routes with the live configuration. | “Compare reviewed and live alert routes” | Pass |
| For whom? | Platform teams that need to confirm live routing still matches review. | “For platform teams who need to prove whether live alert routes match the reviewed baseline.” | Pass |
| What should I click first? | Open the populated sample comparison. | “Try it with sample data” and “Loads three sample route changes in an isolated demo.” | Pass |

The primary action and all three facts fit in both first viewports. There was
no horizontal overflow and no console error. Evidence: `qa-artifacts/review-4/live-first-read-mobile.png`,
`qa-artifacts/review-4/live-first-read-desktop.png`, and
`qa-artifacts/review-4/live-audit.json`.

No first-read blocking finding applies.

## 2. Findings

### Major

#### F-4-1 — The license privacy boundary is not registered as a claim

- Location: live `/privacy`, **License data**.
- Exact quotes: “If you paste a license, this browser stores the token and its
  latest verdict.” and “Verification sends the token to the Sociobot billing
  API. No alert configuration is included.”
- Why this fails: these are concrete storage and network privacy promises.
  `paid-template` proves that a valid test license can reveal the paid file and
  observes the verification URL, but its claim text covers access control only.
  It does not register or fully assert persistent token/verdict storage, the
  request method and body, or the absence of alert configuration. A visitor can
  rely on these privacy statements, so they need their own ledger entry.
- Concrete fix: add `license-data-boundary` to `.factory/claims.json`. From a
  fresh browser context, paste a fixture license, intercept verification,
  assert the exact localStorage keys and values before and after reload, assert
  the verification method/URL/body contain only the license, and assert no
  alert configuration is sent. Alternatively remove or narrow both sentences.

### Minor

#### F-4-2 — The paid artifact has three public names

- Locations: landing Pro section, valid-license action, README **Privacy and
  security**, and `.factory/claims.json`.
- Exact quotes: “reusable review template,” “Download approval report pack,”
  and “The protected template.”
- Why this fails: a first-time visitor cannot tell whether the license unlocks
  one template or a pack containing several files. The terminology table does
  not define this concept.
- Concrete fix: use **“approval report template”** everywhere. Suggested
  landing sentence: “A Pro license adds an approval report template with a
  sign-off checklist.” Rename the action **“Download approval report
  template”**, use that term in README and claim copy, and add it to the
  terminology table.

## 3. Copy audit

Counts use whitespace-separated visible words. Headings, labels, actions, and
literal terminal output are included because visitors encounter them. README
code blocks are executable commands rather than sentences, so the surrounding
instructions are counted. No item exceeds 22 words and no banned marketing
word appears.

### Landing page

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
| Try it with sample data | 5 | Pass: result-naming action |
| Loads three sample route changes in an isolated demo. | 9 | Pass: `core-workflow`, `demo-privacy` |
| Runs offline after the first visit. | 6 | Pass: `offline-reload` |
| Recipient endpoints stay redacted. | 4 | Pass: `recipient-redaction` |
| Core CLI needs no license. | 5 | Pass: `free-core-cli` |
| Reviewed baseline on the left. | 5 | Pass |
| Live configuration on the right. | 5 | Pass |
| CLI demo / actual command | 5 | Pass |
| Sample CLI comparison | 3 | Pass |
| The bundled demo runs the same comparison as the CLI. | 10 | Pass: `web-cli-parity` |
| Read the terminal transcript | 4 | Pass: result-naming control |
| `$ alert-ledger demo` | 3 | Literal command |
| `! CHANGE 3 changed routes · 2 matched` | 8 | Literal output |
| `~ team = payments · recipients` | 6 | Literal output |
| `~ service = checkout · severity, recipients` | 7 | Literal output |
| `+ team = security · route` | 6 | Literal output |
| `Demo files: /tmp/alert-ledger-demo-…` | 3 | Literal output |
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
| Copy install command | 3 | Pass: result-naming action |
| Read-only limits | 2 | Pass |
| What it does not do | 5 | Pass |
| It does not send alerts. | 5 | Pass: `read-only-import` |
| It does not change provider config. | 6 | Pass: `read-only-import` |
| It does not replace Git review. | 6 | Pass: product boundary |
| It does not send telemetry. | 5 | Pass: `no-telemetry` |
| Optional Pro feature | 3 | Pass |
| Use an existing Pro license | 5 | Pass |
| A Pro license adds a reusable review template and sign-off checklist. | 11 | **F-4-2** |
| The snapshot, diff, timeline, JSON, and Markdown commands need no license. | 12 | Pass: `free-core-cli` |
| New license sales are not open in this release. | 9 | Pass: `sales-closed` |
| No active license in this browser. | 6 | Pass: observed state |
| Have a license? Paste it | 5 | Pass |
| Verify license | 2 | Pass: result-naming action |
| Compare alert route changes with their sources. | 7 | Pass |
| Terms | 1 | Pass |
| Built by Param Factory (external site) | 6 | Pass |
| v0.1.0 · build 004 | 4 | Pass |

The demo-only actions also describe their outcomes: **Reset demo**, **Start
for real**, **Install the CLI**, **Download sample report**, and **Clear
comparison**. “Start for real” is the required demo-exit control and now
returns to `/`; installation is a separate action.

### README

| Copy | Words | Result |
| --- | ---: | --- |
| Alert Config Ledger | 3 | Pass |
| Compare live alert routes with a reviewed baseline. | 8 | Pass |
| Alert Config Ledger is a read-only CLI for platform teams using Grafana, Alertmanager, or Alert Config Ledger snapshot JSON. | 19 | Pass |
| It replaces recipient addresses and URLs with SHA-256 identifiers during import. | 11 | Pass: `recipient-redaction` |
| Reports show that a recipient changed without printing an email address, phone number, or webhook URL. | 16 | Pass: `recipient-redaction` |
| Try the bundled demo | 4 | Pass |
| The command compares two sample Grafana exports in a new temporary folder. | 12 | Pass: `core-workflow` |
| It prints the change report and the folder containing the generated snapshots. | 12 | Pass: `core-workflow` |
| Nothing is uploaded. | 3 | Pass: `no-telemetry` |
| Install | 1 | Pass |
| Build the single binary from source: | 6 | Pass |
| The project starts at version `0.1.0`. | 6 | Pass: manifest fact |
| The factory owns registry publishing; this repository does not publish itself. | 11 | Pass: repository boundary |
| Usage | 1 | Pass |
| Snapshot an Alertmanager YAML export: | 5 | Pass: `provider-inputs` |
| Snapshot Grafana's read-only provisioning API using a bearer token from an environment variable: | 13 | Pass: `read-only-import`, `token-exclusion` |
| Compare live state with the reviewed baseline: | 7 | Pass |
| Render changes across a folder of snapshots: | 7 | Pass |
| Exit code `0` means the command completed and no changes were found. | 12 | Pass: `exit-codes` |
| `diff` and `timeline` return `2` when changes exist. | 8 | Pass: `exit-codes` |
| Invalid input, network failures, and other command errors return `1`. | 10 | Pass: `exit-codes` |
| Supported input | 2 | Pass |
| Grafana notification-policy JSON and contact-point array exports. | 7 | Pass: `grafana-contact-points` |
| Alertmanager YAML and JSON with nested routes and receiver configs. | 10 | Pass: `provider-inputs` |
| Alert Config Ledger snapshot JSON for scripted pipelines. | 8 | Pass: `normalized-snapshot-input` |
| The CLI performs `GET` requests only. | 6 | Pass: `read-only-import` |
| It has no write command and sends no telemetry. | 9 | Pass: `read-only-import`, `no-telemetry` |
| Development | 1 | Pass |
| Minimum supported runtimes: Rust 1.85.0 and Node 22.12.0. | 8 | Pass: `minimum-runtimes` |
| `npm test` runs Rust tests, site tests, and browser claim tests. | 11 | Pass: `clean-claim-bootstrap` |
| `npm run build` produces the Rust release binary in `target/release/` and the static site in `dist/site/`. | 16 | Pass: `build-artifacts` |
| Every claim command in `.factory/claims.json` runs from a clean clone in ledger order. | 13 | Pass: `clean-claim-bootstrap` |
| On its first run, `npm test` installs the locked root and `api/` test dependencies it needs, including the API rate-limit dependency. | 21 | Pass: `clean-claim-bootstrap` |
| The minimum-runtime claim installs Rust 1.85.0 with the minimal rustup profile when that toolchain is absent. | 16 | Pass: `minimum-runtimes` |
| For a direct regression check of that clean-clone path, run: | 10 | Pass |
| CI can install explicitly with `npm ci` and `npm ci --prefix api` before running the same commands. | 17 | Pass: instruction |
| Run each part separately: | 4 | Pass |
| The landing-page demo is available at `/?demo=1` and `/demo` and uses only bundled data. | 14 | Pass: `demo-privacy` |
| It stores browser data only under keys that start with `demo:alert-config-ledger:`. | 11 | Pass: `demo-privacy` |
| The deployed demo URL is `https://alert-config-change-ledger.sociobot.in/demo`. | 6 | Pass |
| Privacy and security | 3 | Pass |
| Configuration is processed by the CLI on your machine. | 9 | Pass: local CLI workflow |
| API tokens are read from the environment and are not written to snapshots. | 13 | Pass: `token-exclusion` |
| Recipient endpoints are stored only as SHA-256 identifiers. | 8 | Pass: `recipient-redaction` |
| Non-secret provider fields and timestamps remain in snapshots. | 8 | Pass: `grafana-contact-points` |
| The static demo makes no cross-origin requests. | 7 | Pass: `demo-privacy` |
| Existing Pro approval-report licenses are verified through the Sociobot billing API. | 11 | **F-4-2** for terminology; behavior covered by `paid-template` |
| The protected template comes from a same-origin function only after that check. | 12 | **F-4-2** for terminology; behavior covered by `paid-template` |
| New license sales are not open in this release. | 9 | Pass: `sales-closed` |
| The CLI's snapshot, diff, timeline, JSON, and Markdown output remain free. | 11 | Pass: `free-core-cli` |
| Deploy | 1 | Pass |
| The checked-in `swa-cli.config.json` deploys both `dist/site/` and the license-gated function in `api/` to the product URL. | 14 | Pass: `deployment-shape` |
| Verify that deployment shape without publishing with `npm run deploy:check`; publish the production build with `npm run deploy`. | 18 | Pass: instruction |
| Each build writes the full source commit and static-file digests to `dist/site/release.json`, and gives the same commit to the API build header. | 22 | Pass: `release-identity` |
| After pushing and deploying a clean candidate, verify its exact source and live artifacts with: | 15 | Pass: instruction |
| Set `ALERT_LEDGER_RATE_LIMIT_STORAGE` as a secret application setting for the shared approval-pack request counter. | 13 | Pass: deployer instruction |
| This repository does not manage DNS, infrastructure, billing registration, or registry credentials. | 12 | Pass: repository boundary |
| License | 1 | Pass |
| MIT. | 1 | Pass |
| See `LICENSE`. | 2 | Pass |

### Terminology

The existing terms remain consistent for reviewed baseline, live
configuration, route, snapshot, change, report, demo, recipient endpoint, and
license. F-4-2 is the sole terminology conflict: review template / approval
report pack / protected template.

## 4. Demo and sandbox

**Pass.** One click on **Try it with sample data** opened `/?demo=1`. The first
390 px screen showed the demo banner, a reviewed Grafana baseline, live
revision `live-1842`, “3 changed · 2 matched,” and named changes. It was already
usable without setup.

- The persistent banner says “Demo — sample data, nothing is saved” and offers
  **Reset demo**, **Start for real**, and **Install the CLI**.
- Clear produced an empty state with a reset action. Reset restored all three
  changes.
- The live report download was `alert-ledger-sample-report.json` with three
  changes and two matched routes.
- The only demo key was `demo:alert-config-ledger:state`. Both exit actions
  removed every demo-prefixed key and preserved `review-4:real-sentinel`.
- The full demo flow made no cross-origin request. Offline reload retained the
  sample and showed “You are offline. The bundled demo still works.”
- `target/debug/alert-ledger demo --json`, launched from an empty temporary
  working directory, wrote only `01-reviewed.json`, `02-live.json`, and
  `changes.md` under a new `/tmp/alert-ledger-demo-*` directory. It reported
  three changed and two matched routes with redacted recipients.

## 5. Claims gate

`node site/scripts/test-clean-claims.mjs` cloned repository head into a new
dependency-free temporary directory and ran the 24 ledger commands in order.
Every registered test passed.

| Claim | Result | Claim | Result |
| --- | --- | --- | --- |
| `core-workflow` | Pass | `change-timestamps` | Pass |
| `provider-inputs` | Pass | `normalized-snapshot-input` | Pass |
| `grafana-contact-points` | Pass | `read-only-import` | Pass |
| `recipient-redaction` | Pass | `token-exclusion` | Pass |
| `exit-codes` | Pass | `free-core-cli` | Pass |
| `no-telemetry` | Pass | `demo-privacy` | Pass |
| `demo-exit-clears-state` | Pass | `offline-reload` | Pass |
| `report-download` | Pass | `web-cli-parity` | Pass |
| `paid-template` | Pass | `pro-pack-contents` | Pass |
| `sales-closed` | Pass | `minimum-runtimes` | Pass |
| `build-artifacts` | Pass | `release-identity` | Pass |
| `deployment-shape` | Pass | `clean-claim-bootstrap` | Pass |

There is no failing listed claim. F-4-1 is an unlisted privacy claim and is the
only untested public promise found.

## 6. Earlier-finding regression check

I read `review-1.md`, `review-2.md`, `review-3.md`, all three `polish-*.md`
files, and the prior handoff. Every earlier finding was rechecked live and in
current source.

| Earlier finding | Independent confirmation |
| --- | --- |
| F-1-1 | The H1 remains the bounded “Compare reviewed and live alert routes.” |
| F-1-2 | Normalized snapshot input remains registered and passed clean. |
| F-1-3 | Landing and README use “sample,” not “realistic.” |
| F-1-4 | The action and all three facts fit both cold viewports. |
| F-1-5 | The hero label remains “Read-only alert route comparison.” |
| F-1-6 | The caption says “Reviewed baseline on the left.” |
| F-1-7 | The caption says “Live configuration on the right.” |
| F-1-8 | The preview label says “CLI demo / actual command.” |
| F-1-9 | The preview heading says “Sample CLI comparison.” |
| F-1-10 | The workflow label says “Three steps.” |
| F-1-11 | The install label says “Install the CLI.” |
| F-1-12 | The limits label says “Read-only limits.” |
| F-1-13 | The paid label says “Optional Pro feature.” |
| F-1-14 | Demo exit and install are now separate controls; each clears only demo state and reaches its named destination. |
| F-1-15 | Step one says “Import provider exports.” |
| F-1-16 | Step two says “Put routes in one format.” |
| F-1-17 | Step three says “Show route changes.” |
| F-1-18 | README explains replacement with SHA-256 identifiers. |
| F-1-19 | Public prose consistently uses “change.” |
| F-1-20 | Public prose consistently uses “recipient endpoints.” |
| F-1-21 | README describes demo-prefixed browser keys plainly. |
| F-1-22 | Live routes have route-specific title, description, canonical, OG, and Twitter values. |
| F-2-1 | `change-timestamps` passed for every JSON and Markdown change. |
| F-2-2 | `pro-pack-contents` passed against the real handler. |
| F-3-1 | Back restored the footer Privacy link and its visible region; Forward focused the Privacy H1 at the top. |
| F-3-2 | Alertmanager JSON remains bundled and passed `provider-inputs`. |
| F-3-3 | Rust 1.85.0 and Node 22.12.0 passed `minimum-runtimes`. |
| F-3-4 | `build-artifacts` produced and executed the release CLI and checked the static site. |
| F-3-5 | `deployment-shape` remains registered and passed. |
| F-3-6 | README keeps the rate-limit setting as a deployer instruction, not an assertion about live settings. |

No earlier finding is unfixed, half-fixed, or regressed.

## 7. Structure, accessibility, and visual identity

**Pass.** `/`, `/demo`, `/privacy`, and `/terms` returned 200. An unknown URL
returned the designed 404 with a home action. Every route had the required
title pattern, route-specific description and social metadata, canonical,
favicon, Apple touch icon, `lang="en"`, one H1, one main landmark, and ordered
headings. The sitemap lists all public routes.

The same-origin crawl found no dead link. External destinations were not
requested because this work order forbids connecting to resources outside the
product; the GitHub href exactly matches the configured repository remote.
Back/Forward restored focus and route context. Axe found zero serious or
critical violations on every route and the 404. Normal routes logged no
console errors. The expected failed-document message appeared only for the
intentional HTTP 404. Mobile width and reduced-motion behavior pass in the
suite. Initial JavaScript is 23,500 bytes raw and 7,830 bytes gzip.

The cassette-era incident-zine identity is distinct, consistent with
`.factory/design.md`, and not a generic SaaS template. Its visual metaphor is
kept out of task copy.

## 8. Missed leverage

No missed-leverage finding. The brief's useful workflow is complete: provider
file and read-only URL import, normalization, source-attributed comparison,
timeline, JSON/Markdown export, and one-click web and CLI samples. Generative
AI would make this deterministic audit task less predictable and is not
justified. No decorative AI feature or embedded provider key exists.

## 9. Other quality gates

- `npm test` — pass: 25 Rust tests, 13 API tests, 5 script tests, and 58
  browser tests.
- `npm run build` — pass; produced `target/release/alert-ledger` and
  `dist/site/`.
- `npm run lint` — pass: rustfmt, Clippy with warnings denied, and TypeScript.
- Live first-read, demo, offline, storage, request log, route metadata,
  internal-link crawl, Axe, and history audit — pass; evidence is under
  `.factory/qa-artifacts/review-4/`.

## What would make this perfect

Register and test the two license privacy sentences as one explicit claim, and
use “approval report template” everywhere for the paid artifact. Then rerun the
24 clean-clone claim commands and the full live audit. With those two findings
closed and no regression, the review can pass.
