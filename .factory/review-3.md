# Adversarial first-read review 3 — Alert Config Ledger

- Work order: `alert-config-change-ledger-review-3`
- Candidate: `b64ecc111e7713527b69f7f37ab50a8ab118e185`
- Live URL: <https://alert-config-change-ledger.sociobot.in>
- Reviewed: 29 August 2026 UTC
- Verdict: **FAIL**

## Verdict

**FAIL: six findings remain (one blocking, five minor).** The cold first read,
one-click demo, demo isolation, offline reload, all 20 clean-clone claim
commands, build, lint, accessibility scan, metadata, dead-link crawl, and
designed 404 pass. Browser history does not restore prior focus, which is a
blocking routing failure under the review contract.
Five README statements are also claims without matching ledger entries.

## 1. Cold first read

I opened `/` in fresh Chromium contexts at 390 × 844 and 1366 × 768 without
stored data or scrolling.

| Question | First-read answer | Exact text | Result |
| --- | --- | --- | --- |
| What does it do? | Compares reviewed and live alert routes. | “Compare reviewed and live alert routes” | Pass |
| For whom? | Platform teams checking live routes against a reviewed baseline. | “For platform teams who need to prove whether live alert routes match the reviewed baseline.” | Pass |
| What should I click first? | Open the sample comparison. | “Try it with sample data” | Pass |

The action, “Loads three sample route changes in an isolated demo,” and all
three facts were fully visible in both viewports. No first-read blocking
finding applies.

## 2. Findings

### Blocking

#### F-3-1 — Browser Back loses the prior focused control

- Location: live SPA navigation from the landing footer to `/privacy`, then
  browser Back; source `site/src/main.ts`, `render` and the `popstate` handler.
- Exact behavior: after scrolling the 390 px landing page to the footer,
  focusing and activating **Privacy**, and pressing Back, the page position
  returns to the footer but focus moves to “Compare reviewed and live alert
  routes” instead of returning to the Privacy link.
- Exact source: `window.addEventListener('popstate', () => render({ focus: true }))`;
  that render path calls `window.scrollTo(0, 0)` and focuses the new H1.
- Why this fails: the attached site-structure standard requires back/forward
  navigation to restore scroll and focus. A keyboard or screen-reader visitor
  who checks Privacy must traverse the landing page again from its H1. This is
  broken routing and is therefore blocking.
- Concrete fix: save the focused element in each history entry before
  navigation. On `popstate`, restore that element with `preventScroll` while
  retaining the live route announcement and the browser's scroll restoration.
  Add a browser test that focuses the footer Privacy link, goes Back and
  Forward, and asserts the restored control and scroll position.

### Minor

#### F-3-2 — Alertmanager JSON support is an unlisted and untested claim

- Location: README, **Supported input**.
- Exact quote: “Alertmanager YAML or JSON with nested routes and receiver configs.”
- Why this fails: `provider-inputs` claims and tests Alertmanager YAML only.
  Its test passes `examples/alertmanager.yml`; no ledger entry or clean-sandbox
  test supplies Alertmanager JSON. A user could choose this tool specifically
  because the README says JSON works.
- Concrete fix: extend the `provider-inputs` claim text to include Alertmanager
  JSON, add a bundled JSON fixture, and assert its nested routes and receiver
  configs normalize correctly. Otherwise remove “or JSON.”

#### F-3-3 — The minimum runtime versions are unlisted quantitative claims

- Location: README, **Development**.
- Exact quote: “Requirements: Rust 1.85+ and Node 22+.”
- Why this fails: the clean run used Rust 1.98.0 and Node 22.23.2. Nothing in
  `.factory/claims.json` proves the Rust 1.85 minimum, and `Cargo.toml` has no
  `rust-version`. The lower bound is a number a contributor can rely on.
- Concrete fix: set `rust-version = "1.85"`, add a `minimum-runtimes` claim,
  and run its build/test command under Rust 1.85 and the lowest supported Node
  22 release in CI. Otherwise state only the versions actually tested.

#### F-3-4 — The documented build outputs have no claim entry

- Location: README, **Development**.
- Exact quote: “`npm run build` produces the Rust release binary in
  `target/release/` and the static site in `dist/site/`.”
- Why this fails: the statement is true in this review run, but no
  `.factory/claims.json` entry makes that result part of the clean claim gate.
  A later build-script regression could leave the README claim green.
- Concrete fix: add a `build-artifacts` claim whose clean-clone test runs
  `npm run build`, executes `target/release/alert-ledger --help`, and checks the
  built site entry point and assets under `dist/site/`.

#### F-3-5 — The deployment-shape statement is tested outside the claims ledger

- Location: README, **Deploy**.
- Exact quote: “The checked-in `swa-cli.config.json` deploys both `dist/site/`
  and the license-gated function in `api/` to
  `https://alert-config-change-ledger.sociobot.in`.”
- Why this fails: `site/tests/site.spec.ts` checks much of this shape, but the
  test is not tagged or listed in `.factory/claims.json`. The clean claim gate
  does not identify this deployer-facing promise as a claim.
- Concrete fix: register a `deployment-shape` claim and tag the existing test;
  assert the app, API, function route, and production target configuration.

#### F-3-6 — The production secret-setting statement is unlisted and not locally verifiable

- Location: README, **Deploy**.
- Exact quote: “The deployment supplies `ALERT_LEDGER_RATE_LIMIT_STORAGE` as a
  secret application setting for the shared approval-pack request counter.”
- Why this fails: neither the repository nor a claims entry can confirm that
  production currently supplies this secret. The sentence presents external
  deployment state as fact, while the review contract forbids assuming it.
- Concrete fix: rewrite it as the deployer instruction **“Set
  `ALERT_LEDGER_RATE_LIMIT_STORAGE` as a secret application setting for the
  shared approval-pack request counter.”** Add a claim for the observable
  rate-limit behavior if that production behavior remains public copy.

## 3. Copy audit

Counts use whitespace-separated visible words. Headings, labels, actions, and
literal terminal output are included. Executable README code blocks are
commands rather than sentences; their surrounding instructions are included.
No item exceeds 22 words, contains a banned marketing word, uses a mood
heading, or presents a non-result-naming button. The only copy findings are
the five unlisted claims above.

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
| Loads three sample route changes in an isolated demo. | 9 | Pass |
| Runs offline after the first visit. | 6 | Pass: `offline-reload` |
| Recipient endpoints stay redacted. | 4 | Pass: `recipient-redaction` |
| Core CLI needs no license. | 5 | Pass: `free-core-cli` |
| Reviewed baseline on the left. | 5 | Pass |
| Live configuration on the right. | 5 | Pass |
| CLI demo / actual command | 5 | Pass |
| Sample CLI comparison | 3 | Pass |
| The bundled demo runs the same comparison as the CLI. | 10 | Pass: `web-cli-parity` |
| Read the terminal transcript | 4 | Pass: result-naming action |
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
| Get the source on GitHub (external site). | 7 | Pass: result-naming link |
| `git clone https://github.com/B-Divyesh/sf-alert-config-change-ledger.git` | 3 | Literal command |
| `cd sf-alert-config-change-ledger` | 2 | Literal command |
| `cargo install --path .` | 4 | Literal command |
| `alert-ledger demo` | 2 | Literal command |
| Copy install command | 3 | Pass: result-naming action |
| Read-only limits | 2 | Pass |
| What it does not do | 5 | Pass |
| It does not send alerts. | 5 | Pass: `read-only-import` |
| It does not change provider config. | 6 | Pass: `read-only-import` |
| It does not replace Git review. | 6 | Pass: boundary statement |
| It does not send telemetry. | 5 | Pass: `no-telemetry` |
| Optional Pro feature | 3 | Pass |
| Use an existing Pro license | 5 | Pass |
| A Pro license adds a reusable review template and sign-off checklist. | 11 | Pass: `pro-pack-contents` |
| The snapshot, diff, timeline, JSON, and Markdown commands need no license. | 12 | Pass: `free-core-cli` |
| New license sales are not open in this release. | 9 | Pass: `sales-closed` |
| No active license in this browser. | 6 | Pass: observed state |
| Have a license? Paste it | 5 | Pass |
| Verify license | 2 | Pass: result-naming action |
| Compare alert route changes with their sources. | 7 | Pass |
| Terms | 1 | Pass |
| Built by Param Factory (external site) | 6 | Pass |
| v0.1.0 · build 004 | 4 | Pass |

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
| Build the single binary from source: | 6 | Pass: instruction |
| The project starts at version `0.1.0`. | 6 | Pass: manifest fact |
| The factory owns registry publishing; this repository does not publish itself. | 11 | Pass: project boundary |
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
| Alertmanager YAML or JSON with nested routes and receiver configs. | 10 | **F-3-2** |
| Alert Config Ledger snapshot JSON for scripted pipelines. | 8 | Pass: `normalized-snapshot-input` |
| The CLI performs `GET` requests only. | 6 | Pass: `read-only-import` |
| It has no write command and sends no telemetry. | 9 | Pass: `read-only-import`, `no-telemetry` |
| Development | 1 | Pass |
| Requirements: Rust 1.85+ and Node 22+. | 6 | **F-3-3** |
| `npm test` runs Rust tests, site tests, and browser claim tests. | 11 | Pass: `clean-claim-bootstrap` |
| `npm run build` produces the Rust release binary in `target/release/` and the static site in `dist/site/`. | 16 | **F-3-4** |
| Every claim command in `.factory/claims.json` runs from a clean clone in ledger order. | 13 | Pass: `clean-claim-bootstrap` |
| On its first run, `npm test` installs the locked root and `api/` test dependencies it needs, including the API rate-limit dependency. | 21 | Pass: `clean-claim-bootstrap` |
| For a direct regression check of that clean-clone path, run: | 11 | Pass |
| CI can install explicitly with `npm ci` and `npm ci --prefix api` before running the same commands. | 16 | Pass: instruction |
| Run each part separately: | 4 | Pass |
| The landing-page demo is available at `/?demo=1` and `/demo` and uses only bundled data. | 15 | Pass: `demo-privacy` |
| It stores browser data only under keys that start with `demo:alert-config-ledger:`. | 12 | Pass: `demo-privacy` |
| The deployed demo URL is `https://alert-config-change-ledger.sociobot.in/demo`. | 6 | Pass |
| Privacy and security | 3 | Pass |
| Configuration is processed by the CLI on your machine. | 9 | Pass: `no-telemetry` |
| API tokens are read from the environment and are not written to snapshots. | 13 | Pass: `token-exclusion` |
| Recipient endpoints are stored only as SHA-256 identifiers. | 8 | Pass: `recipient-redaction` |
| Non-secret provider fields and timestamps remain in snapshots. | 8 | Pass: `grafana-contact-points` |
| The static demo makes no cross-origin requests. | 7 | Pass: `demo-privacy` |
| Existing Pro approval-report licenses are verified through the Sociobot billing API. | 11 | Pass: `paid-template` |
| The protected template comes from a same-origin function only after that check. | 12 | Pass: `paid-template` |
| New license sales are not open in this release. | 9 | Pass: `sales-closed` |
| The CLI's snapshot, diff, timeline, JSON, and Markdown output remain free. | 11 | Pass: `free-core-cli` |
| Deploy | 1 | Pass |
| The checked-in `swa-cli.config.json` deploys both `dist/site/` and the license-gated function in `api/` to `https://alert-config-change-ledger.sociobot.in`. | 14 | **F-3-5** |
| Verify that deployment shape without publishing with `npm run deploy:check`; publish the production build with `npm run deploy`. | 18 | Pass: instruction |
| The deployment supplies `ALERT_LEDGER_RATE_LIMIT_STORAGE` as a secret application setting for the shared approval-pack request counter. | 15 | **F-3-6** |
| This repository does not manage DNS, infrastructure, billing registration, or registry credentials. | 12 | Pass: repository boundary |
| License | 1 | Pass |
| MIT. | 1 | Pass: `LICENSE` |
| See `LICENSE`. | 2 | Pass |

Terminology is consistent: reviewed baseline, live configuration, route,
snapshot, change, report, demo, recipient endpoint, and license.

## 4. Demo and sandbox

**Pass.** One click on **Try it with sample data** opened `/?demo=1`. The
first rendered screen already showed a reviewed Grafana baseline, live revision
`live-1842`, three named changed routes, two matched routes, and an attributed
source. The persistent banner said “Demo — sample data, nothing is saved” and
offered **Reset demo** and **Install the CLI**.

Clear comparison produced the useful empty state; Reset restored all three
changes. Exiting removed `demo:alert-config-ledger:*` while a seeded
`real:sentinel` key remained. The request log contained only same-origin
documents and assets. Offline reload retained the demo and displayed its
offline status. Running `target/debug/alert-ledger demo --json` from a new
temporary working directory produced three attributed changes and wrote
`01-reviewed.json`, `02-live.json`, and `changes.md` only to its generated
`/tmp/alert-ledger-demo-*` directory.

## 5. Claims gate

`.factory/claims.json` has 20 entries. `node
site/scripts/test-clean-claims.mjs` created a dependency-free local clone and
ran every listed command once in ledger order. Every listed test passed:

| Claim | Result |
| --- | --- |
| core-workflow | Pass |
| change-timestamps | Pass |
| provider-inputs | Pass for its declared Grafana JSON and Alertmanager YAML scope; F-3-2 is extra README scope |
| normalized-snapshot-input | Pass |
| grafana-contact-points | Pass |
| read-only-import | Pass |
| recipient-redaction | Pass |
| token-exclusion | Pass |
| exit-codes | Pass |
| free-core-cli | Pass |
| no-telemetry | Pass |
| demo-privacy | Pass |
| demo-exit-clears-state | Pass |
| offline-reload | Pass |
| report-download | Pass |
| web-cli-parity | Pass |
| paid-template | Pass |
| pro-pack-contents | Pass |
| sales-closed | Pass |
| clean-claim-bootstrap | Pass |

The five unlisted README claims are findings even though this candidate's
build and some corresponding non-ledger tests passed.

## 6. Earlier-review regression check

I read `review-1.md`, `review-2.md`, `polish-1.md`, `polish-2.md`, and the prior
handoff. Each of the 24 earlier findings remains fixed live and in source.

| Earlier finding | Independent confirmation |
| --- | --- |
| F-1-1 | H1 remains the bounded “Compare reviewed and live alert routes.” |
| F-1-2 | `normalized-snapshot-input` remains registered and passed clean. |
| F-1-3 | Landing and README use “sample,” not “realistic.” |
| F-1-4 | Action and all facts fit both cold viewports. |
| F-1-5 | Eyebrow remains “Read-only alert route comparison.” |
| F-1-6 | Caption says “Reviewed baseline on the left.” |
| F-1-7 | Caption says “Live configuration on the right.” |
| F-1-8 | Label says “CLI demo / actual command.” |
| F-1-9 | H2 says “Sample CLI comparison.” |
| F-1-10 | Workflow label says “Three steps.” |
| F-1-11 | Install label says “Install the CLI.” |
| F-1-12 | Limit label says “Read-only limits.” |
| F-1-13 | Paid label says “Optional Pro feature.” |
| F-1-14 | Demo exit says “Install the CLI” and deletes only demo-prefixed state. |
| F-1-15 | Step one says “Import provider exports.” |
| F-1-16 | Step two says “Put routes in one format.” |
| F-1-17 | Step three says “Show route changes.” |
| F-1-18 | README explains replacement with SHA-256 identifiers. |
| F-1-19 | Public prose consistently uses “change.” |
| F-1-20 | README consistently uses “recipient endpoints.” |
| F-1-21 | README describes demo-prefixed browser keys plainly. |
| F-1-22 | Every live route has route-specific title, description, canonical, OG, and Twitter metadata. |
| F-2-1 | `change-timestamps` exists and passed for JSON and Markdown. |
| F-2-2 | `pro-pack-contents` exists and passed against the real handler. |

F-3-1 is newly exposed by testing focus restoration, not merely the destination
URL after Back. The five claim findings are additional uncovered README scope.

## 7. Structure, accessibility, and visual identity

Apart from F-3-1, structure checks pass. `/`, `/demo`, `/privacy`, and `/terms`
return 200 and have route-specific titles, descriptions, canonicals, OG data,
one H1, one main, `lang="en"`, SVG favicon, and apple-touch icon. A missing URL
returns the designed 404 with HTTP 404 and a home action. `robots.txt` and
`sitemap.xml` cover the public routes. Every rendered link returned 200 or was
an explicit mail link. Normal routes logged no console errors; the deliberate
missing document produced only its expected browser 404 resource message.

Mobile Axe scans of all four routes and the missing route found no violations.
The 390 px pages had no horizontal overflow. Route activation focuses the new
H1 and announces it; only history restoration fails. The warm-paper,
oxide-red, signal-teal cassette-zine system, monospace copy, offset controls,
original cassette art, and matching 404 are recognizably product-specific and
not a generic SaaS template.

## 8. Missed leverage

No missed-leverage finding. The brief implies provider import, deterministic
normalization, comparison, source attribution, timeline, JSON/Markdown export,
and a runnable sample; all are present. An AI feature would add uncertainty to
an audit comparison and is not justified. No decorative AI or embedded
provider key is present.

## 9. Quality gates run

- `node site/scripts/test-clean-claims.mjs` — pass, all 20 ledger commands.
- `npm test` — pass: 25 Rust tests, 13 API tests, 52 browser tests.
- `npm run build` — pass; release binary and `dist/site/` produced.
- `npm run lint` — pass: formatting, Clippy, and TypeScript checks.
- Live link crawl, mobile/desktop first read, Axe, metadata, demo isolation,
  request logging, offline reload, and 404 checks — pass except F-3-1.

## What would make this perfect

Restore focus through Back/Forward without disrupting the browser's scroll
restoration, and add its regression test. Then either register and test the
five unlisted README claims or narrow their copy exactly as proposed. Rerun
the clean claim ledger and this whole review. Only zero findings would qualify
for PASS.
