# Adversarial first-read review 2 — Alert Config Ledger

- Work order: `alert-config-change-ledger-review-2`
- Candidate reviewed: `19e5f3f6286d14f72787a121b9db8b85c78b0945`
- Live URL: <https://alert-config-change-ledger.sociobot.in>
- Reviewed: 29 August 2026 UTC
- Verdict: **FAIL**

## Verdict

**FAIL: two minor findings remain.** The cold first read, one-click demo,
CLI demo, claim commands, route structure, mobile layout, keyboard flow,
offline reload claim, privacy request log, and earlier-review repairs all
checked out. The acceptance rule is zero findings. Two useful landing claims
are not represented by an observable claim test, so this cannot pass yet.

## 1. Cold first read

I opened the live URL in new Chromium browser contexts at 390 × 844 and
1366 × 768, with no stored browser data and without scrolling.

| Question | First-read answer | Evidence | Result |
| --- | --- | --- | --- |
| What does it do? | Compares a reviewed alert-route baseline with live alert routes. | “Compare reviewed and live alert routes” | Pass |
| For whom? | Platform teams checking that live routing still matches review. | “For platform teams who need to prove whether live alert routes match the reviewed baseline.” | Pass |
| What should I click first? | Try the sample route comparison. | “Try it with sample data” and its adjacent result text | Pass |

The action was fully visible at y=526 on mobile and y=542 on desktop. All
three facts were visible before 768 px on desktop and before 844 px on mobile.
No first-read blocking finding applies.

## Findings

### Minor

#### F-2-1 — The landing promise to show a timestamp for each change has no claim entry

- Location: landing, **Show route changes**, paragraph.
- Exact quote: “Compare the baseline with live state and show each change with its timestamp.”
- Why this fails: this is a useful, externally observable report promise. No
  `.factory/claims.json` entry says that every reported change carries its
  source timestamp. `core-workflow` asserts only the change count and a source
  identifier; `grafana-contact-points` asserts an input field, not report
  timestamps.
- Concrete fix: add a `change-timestamps` claim with a clean temporary-folder
  test that runs the bundled comparison, reads JSON and Markdown report output,
  and asserts the live-source timestamp beside each of the three change records.
  Alternatively rewrite the sentence to “Compare the baseline with live state
  and show each change.”

#### F-2-2 — The Pro pack contents are promised but not claim-tested

- Location: landing, **Use an existing Pro license**, paragraph.
- Exact quote: “A Pro license adds a reusable review template and sign-off checklist.”
- Why this fails: `paid-template` proves access control and a downloadable
  file, but its browser fixture supplies only `# Alert route approval`; it does
  not confirm a review template or the sign-off checklist that the visitor is
  promised. This is an unlisted compound capability claim.
- Concrete fix: add a `pro-pack-contents` claim and test a valid mocked license
  against the real pack handler, asserting the `Route changes`, `Evidence`, and
  `Sign-off` sections. Alternatively rewrite the sentence to “A Pro license
  can download the approval report pack.” and keep the existing access claim.

## 2. Copy audit

Counts use visible whitespace-separated words. Buttons, headings, labels, and
literal command output are included because they are read by visitors. No
item exceeds 22 words. No marketing adjective, mood heading, or non-result
button was found. The two `F-2-*` rows are the only claim-ledger flags.

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
| Compare the baseline with live state and show each change with its timestamp. | 13 | **F-2-1** |
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
| It does not replace Git review. | 6 | Pass: boundary, not a capability claim |
| It does not send telemetry. | 5 | Pass: `no-telemetry` |
| Optional Pro feature | 3 | Pass |
| Use an existing Pro license | 5 | Pass |
| A Pro license adds a reusable review template and sign-off checklist. | 11 | **F-2-2** |
| The snapshot, diff, timeline, JSON, and Markdown commands need no license. | 12 | Pass: `free-core-cli` |
| New license sales are not open in this release. | 9 | Pass: `sales-closed` |
| No active license in this browser. | 6 | Pass |
| Have a license? Paste it | 5 | Pass |
| Verify license | 2 | Pass: result-naming action |
| Compare alert route changes with their sources. | 7 | Pass |
| Terms | 1 | Pass |
| Built by Param Factory (external site) | 6 | Pass |
| v0.1.0 · build 004 | 4 | Pass |

The demo-only copy also passes: “Demo — sample data, nothing is saved” (7),
“Reset demo” (2), “Install the CLI” (3), “Review three live route changes”
(6), “Compare a reviewed Grafana baseline with a later live snapshot.” (10),
“Download sample report” (3), and “Clear comparison” (2).

### README

| Copy | Words | Result |
| --- | ---: | --- |
| Alert Config Ledger | 3 | Pass |
| Compare live alert routes with a reviewed baseline. | 8 | Pass |
| Alert Config Ledger is a read-only CLI for platform teams using Grafana, Alertmanager, or Alert Config Ledger snapshot JSON. | 19 | Pass: `provider-inputs`, `normalized-snapshot-input` |
| It replaces recipient addresses and URLs with SHA-256 identifiers during import. | 11 | Pass: `recipient-redaction` |
| Reports show that a recipient changed without printing an email address, phone number, or webhook URL. | 16 | Pass: `recipient-redaction` |
| Try the bundled demo | 4 | Pass |
| The command compares two sample Grafana exports in a new temporary folder. | 12 | Pass: `core-workflow` |
| It prints the change report and the folder containing the generated snapshots. | 12 | Pass: `core-workflow` |
| Nothing is uploaded. | 3 | Pass: `no-telemetry` |
| Install | 1 | Pass |
| Build the single binary from source: | 6 | Pass |
| The project starts at version `0.1.0`. | 6 | Pass |
| The factory owns registry publishing; this repository does not publish itself. | 11 | Pass |
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
| Alertmanager YAML or JSON with nested routes and receiver configs. | 10 | Pass: `provider-inputs` |
| Alert Config Ledger snapshot JSON for scripted pipelines. | 8 | Pass: `normalized-snapshot-input` |
| The CLI performs `GET` requests only. | 6 | Pass: `read-only-import` |
| It has no write command and sends no telemetry. | 9 | Pass: `read-only-import`, `no-telemetry` |
| Development | 1 | Pass |
| Requirements: Rust 1.85+ and Node 22+. | 6 | Pass |
| `npm test` runs Rust tests, site tests, and browser claim tests. | 11 | Pass |
| `npm run build` produces the Rust release binary in `target/release/` and the static site in `dist/site/`. | 16 | Pass |
| Every claim command in `.factory/claims.json` runs from a clean clone in ledger order. | 13 | Pass: `clean-claim-bootstrap` |
| On its first run, `npm test` installs the locked root and `api/` test dependencies it needs, including the API rate-limit dependency. | 21 | Pass: `clean-claim-bootstrap` |
| For a direct regression check of that clean-clone path, run: | 11 | Pass |
| CI can install explicitly with `npm ci` and `npm ci --prefix api` before running the same commands. | 16 | Pass |
| Run each part separately: | 4 | Pass |
| The landing-page demo is available at `/?demo=1` and `/demo` and uses only bundled data. | 15 | Pass: `demo-privacy` |
| It stores browser data only under keys that start with `demo:alert-config-ledger:`. | 12 | Pass: `demo-privacy` |
| The deployed demo URL is `https://alert-config-change-ledger.sociobot.in/demo`. | 6 | Pass |
| Privacy and security | 3 | Pass |
| Configuration is processed by the CLI on your machine. | 9 | Pass: local CLI scope and `no-telemetry` |
| API tokens are read from the environment and are not written to snapshots. | 13 | Pass: `token-exclusion` |
| Recipient endpoints are stored only as SHA-256 identifiers. | 8 | Pass: `recipient-redaction` |
| Non-secret provider fields and timestamps remain in snapshots. | 8 | Pass: `grafana-contact-points` |
| The static demo makes no cross-origin requests. | 7 | Pass: `demo-privacy` |
| Existing Pro approval-report licenses are verified through the Sociobot billing API. | 11 | Pass: `paid-template` |
| The protected template comes from a same-origin function only after that check. | 12 | Pass: `paid-template` |
| New license sales are not open in this release. | 9 | Pass: `sales-closed` |
| The CLI's snapshot, diff, timeline, JSON, and Markdown output remain free. | 11 | Pass: `free-core-cli` |
| Deploy | 1 | Pass |
| The checked-in `swa-cli.config.json` deploys both `dist/site/` and the license-gated function in `api/` to the product URL. | 17 | Pass |
| Verify that deployment shape without publishing with `npm run deploy:check`; publish the production build with `npm run deploy`. | 18 | Pass |
| The deployment supplies `ALERT_LEDGER_RATE_LIMIT_STORAGE` as a secret application setting for the shared approval-pack request counter. | 15 | Pass |
| This repository does not manage DNS, infrastructure, billing registration, or registry credentials. | 12 | Pass |
| License | 1 | Pass |
| MIT. | 1 | Pass |

Executable code blocks are instructions rather than prose sentences; they were
also run where applicable. Terminology is consistent: reviewed baseline, live
configuration, route, snapshot, change, report, demo, recipient endpoint, and
license. No decorative slogan or ambiguous button was found.

## 3. Demo and sandbox

**Pass.** The first action opened `/?demo=1` in one click. Its first rendered
screen already showed a reviewed Grafana baseline, a later live snapshot, and
three changed routes. The persistent banner read “Demo — sample data, nothing
is saved” and exposed **Reset demo** and **Install the CLI**. Clear → Reset
restored the three-change view. Install the CLI navigated to `/#install` and
removed `demo:alert-config-ledger:state`.

The observed demo storage was only `demo:alert-config-change-ledger:state`.
The live request log contained only the product origin (document, CSS,
JavaScript, hero art, and terminal image); it contained no analytics or
cross-origin request. The CLI command `alert-ledger demo` created a new
`/tmp/alert-ledger-demo-*` folder and reported three changes and two matched
routes without an account or network dependency.

## 4. Claims gate

`.factory/claims.json` contains 18 entries. `npm run test:claims-clean` made a
new dependency-free Git clone and ran every listed command once in ledger
order; it completed successfully. Results:

| Claim | Result |
| --- | --- |
| core-workflow | Pass |
| provider-inputs | Pass |
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
| sales-closed | Pass |
| clean-claim-bootstrap | Pass |

The unlisted claim findings above are a copy-to-ledger coverage defect, not a
failing existing test.

## 5. Earlier-review regression check

I read `review-1.md`, `polish-1.md`, and the previous handoff, then checked
each earlier finding against the live page and current source. All are fixed,
not merely marked fixed.

| Earlier finding | Confirmation |
| --- | --- |
| F-1-1 | Live H1 is “Compare reviewed and live alert routes”; no absolute “every”. |
| F-1-2 | `normalized-snapshot-input` is in the ledger and clean-tested. |
| F-1-3 | Live/README use “sample”, not “realistic”. |
| F-1-4 | Action and all facts fit at 1366 × 768. |
| F-1-5 | Hero label is “Read-only alert route comparison”. |
| F-1-6 | Caption says “Reviewed baseline on the left.” |
| F-1-7 | Caption says “Live configuration on the right.” |
| F-1-8 | Preview label says “CLI demo / actual command”. |
| F-1-9 | Preview H2 is “Sample CLI comparison”. |
| F-1-10 | Method label is “Three steps”. |
| F-1-11 | Install label is “Install the CLI”. |
| F-1-12 | Boundary label is “Read-only limits”. |
| F-1-13 | Paid label is “Optional Pro feature”. |
| F-1-14 | Demo exit is “Install the CLI” and deletes demo keys. |
| F-1-15 | Step one is “Import provider exports”. |
| F-1-16 | Step two is “Put routes in one format”. |
| F-1-17 | Step three is “Show route changes”. |
| F-1-18 | README explains replacement with SHA-256 identifiers. |
| F-1-19 | Public prose uses “change”; old “drift” remains only in code history. |
| F-1-20 | README uses “recipient endpoints” consistently. |
| F-1-21 | README documents browser keys rather than “storage namespace”. |
| F-1-22 | Live route titles, descriptions, canonical, OG, and Twitter metadata vary by route. |

## 6. Structure, accessibility, and visual identity

**Pass.** Live checks found a 200 landing page and 404 missing route, route
titles in the required pattern, one H1 and one main landmark per route,
`lang="en"`, description, canonical, OG/Twitter metadata, SVG favicon and
apple touch icon. `robots.txt` and `sitemap.xml` are present. `/demo`,
`/privacy`, and `/terms` deep-link, update title, focus the new H1, and work
with the back button. All rendered HTTP links returned 200; mail links were
valid. The repeated header/footer include Demo, Install, Privacy, Terms, and
the Param Factory link.

Mobile Axe scans of `/`, `/demo`, `/privacy`, `/terms`, the missing route, and
`/404.html` had no serious or critical violations. Normal page loads had no
console errors; the expected browser 404 console entry occurred only while
requesting the deliberately missing document. Keyboard skip navigation and
visible focus passed. The cassette-zine, warm paper, red/teal inks, mono type,
and original cassette art are distinct from a generic SaaS template and match
the recorded design thesis.

## 7. Missed leverage

No finding. The brief's obvious workflows are present: read-only provider
import, normalized snapshot input, compare/report, JSON/Markdown output,
timeline, one-click web sample, and `alert-ledger demo`. An AI step is not
implied by this deterministic audit task, and no decorative or key-embedding
AI feature is present.

## What would make this perfect

Add the two precise claim tests (or narrow their two sentences), then rerun
the clean-clone ledger and this full first-read review. With zero remaining
findings, the product would meet the stated acceptance standard.
