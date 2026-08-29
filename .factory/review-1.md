# Adversarial first-read review 1 — Alert Config Ledger

- Work order: `alert-config-change-ledger-review-1`
- Candidate: `c1b4d52d66cfdc9a8e8231a5054e47d9c792fc4d`
- Live URL: <https://alert-config-change-ledger.sociobot.in>
- Reviewed: 29 August 2026 UTC
- Verdict: **FAIL**

## Verdict

**FAIL: 22 findings remain (0 blocking, 2 major, 20 minor).** The first read, demo, claim tests, sandbox, routes, accessibility checks, and build all pass. The product still fails this review because the acceptance rule is zero findings. Most remaining defects are in the words: cassette lore appears in interface copy even though the visual treatment already carries that identity, three workflow headings do not name their user-facing outcome, and terminology is not consistently plain. Two claim-like statements are not fully represented in `.factory/claims.json`. Route-specific descriptions and social metadata are also missing.

## 1. Cold first read

I opened `/` in fresh Chromium contexts at 390 × 844 and 1366 × 768, captured the viewport before scrolling, and did not use repository context to interpret it.

| Question | My first-read answer | Result |
| --- | --- | --- |
| What does this do? | It compares reviewed and live alert routes and identifies changes. | Pass |
| For whom? | Platform teams that need evidence that live alert routing still matches a reviewed baseline. | Pass |
| What should I click first? | **Try it with sample data**. | Pass |

The exact first-screen text that supplied those answers was “Trace every alert route change,” “For platform teams who need to prove whether live alert routes match the reviewed baseline,” and “Try it with sample data.” The mobile viewport also showed the three facts. At 1366 × 768, the three facts began below the fold; see F-1-4.

No first-read blocking finding applies because all three required questions were answerable without scrolling at both sizes.

## Findings

### Major

#### F-1-1 — The headline makes an unlisted absolute claim

- Location: landing H1.
- Quote: “Trace **every** alert route change.”
- Why this fails: “every” promises complete coverage. The registered tests prove selected Grafana and Alertmanager inputs and the bundled sample; no claim entry establishes that every possible alert-route change is detected. A first-time visitor can reasonably read this as universal provider and change coverage.
- Concrete fix: change the H1 to **“Compare reviewed and live alert routes”**. If universal coverage is intended, add a bounded claim that names the supported providers and change types, then test each one.

#### F-1-2 — A documented input capability is absent from the claims ledger

- Location: README introduction and **Supported input**.
- Quotes: “Alert Config Ledger is a read-only CLI for platform teams using Grafana, Alertmanager, or **normalized JSON exports**.” and “Alert Config Ledger snapshot JSON for scripted pipelines.”
- Why this fails: `provider-inputs` registers only Grafana JSON and Alertmanager YAML. No claim entry names importing normalized or Alert Config Ledger snapshot JSON, although readers can rely on that documented capability.
- Concrete fix: add a `normalized-snapshot-input` entry to `.factory/claims.json` with one tagged clean-sandbox test that imports a previously generated ledger snapshot and verifies the resulting comparison. Alternatively, remove both normalized-snapshot statements.

### Minor

#### F-1-3 — “Realistic” is subjective, unnecessary claim copy

- Locations: landing hero action explanation and README demo description.
- Quotes: “Loads three **realistic** route changes in an isolated demo.” and “The command compares two **realistic** Grafana exports in a new temporary folder.”
- Why this fails: the count and isolation are testable; “realistic” is an unmeasured marketing adjective.
- Concrete fix: use **“Loads three sample route changes in an isolated demo.”** and **“The command compares two sample Grafana exports in a new temporary folder.”**

#### F-1-4 — Desktop first screen omits the three required facts

- Location: `/` at 1366 × 768 before scrolling.
- Quote/location: “Runs offline after the first visit,” “Recipient endpoints stay redacted,” and “Core CLI needs no license” start below the viewport; only the action and its explanation are visible at the bottom edge.
- Why this fails: the plain-words first-screen shape requires all three facts, not only their presence later in the hero. A short desktop viewport receives less decision information than the phone viewport.
- Concrete fix: reduce the desktop H1 size/line count or hero spacing so the three fact lines fit above 768 px without hiding the primary action.

#### F-1-5 — Hero eyebrow contains cassette lore

- Location: landing hero eyebrow.
- Quote: “Read-only config audit · tape 01”
- Why this fails: “tape 01” is invented visual lore and gives the visitor no product information.
- Concrete fix: **“Read-only alert route comparison”**.

#### F-1-6 — Hero caption describes the baseline through a metaphor

- Location: hero-art caption.
- Quote: “Baseline on reel A.”
- Why this fails: a reel is not a product concept. The sentence requires the decorative cassette analogy to explain configuration state.
- Concrete fix: **“Reviewed baseline on the left.”**

#### F-1-7 — Hero caption describes live state through a metaphor

- Location: hero-art caption.
- Quote: “Live state on reel B.”
- Why this fails: “reel B” is decorative lore rather than a location or product behavior.
- Concrete fix: **“Live configuration on the right.”**

#### F-1-8 — Preview label mixes a metaphor with its real meaning

- Location: label above the terminal preview.
- Quote: “Playback / actual command”
- Why this fails: “playback” adds no usable meaning and makes the user decode the cassette theme.
- Concrete fix: **“CLI demo / actual command”**.

#### F-1-9 — Preview heading does not name the section plainly

- Location: terminal preview H2.
- Quote: “See drift before the handoff”
- Why this fails: “drift” and “handoff” both need context; the heading does not say that the section is sample CLI output.
- Concrete fix: **“Sample CLI comparison”**.

#### F-1-10 — Workflow label is decorative shorthand

- Location: label above **How the ledger works**.
- Quote: “A / B / source”
- Why this fails: it does not name a section when read alone and depends on the cassette A/B motif.
- Concrete fix: **“Three steps”**.

#### F-1-11 — Install label contains unnecessary cassette language

- Location: label above **Run the ledger locally**.
- Quote: “Side A / install”
- Why this fails: “Side A” carries no installation information.
- Concrete fix: **“Install the CLI”**.

#### F-1-12 — Boundary label relies on a tape-machine metaphor

- Location: label above **What it does not do**.
- Quote: “Write protect / on”
- Why this fails: the user has to translate a cassette control into read-only product behavior.
- Concrete fix: **“Read-only limits”**.

#### F-1-13 — Pro label contains unnecessary cassette language

- Location: label above **Use an existing Pro license**.
- Quote: “Side B / optional”
- Why this fails: “Side B” adds lore, while the useful fact is only that the feature is optional.
- Concrete fix: **“Optional Pro feature”**.

#### F-1-14 — Demo exit button does not name its result

- Location: persistent demo banner.
- Quote: “Start for real”
- Why this fails: the control actually deletes demo state, returns to `/`, and scrolls to installation. “Start for real” does not tell the user which result to expect.
- Concrete fix: rename it **“Install the CLI”**. If the intended result changes, name that concrete destination instead.

#### F-1-15 — “Snapshot exports” is grammatically ambiguous

- Location: first H3 under **How the ledger works**.
- Quote: “Snapshot exports”
- Why this fails: it can mean either “create exported snapshots” or “take snapshots of exports.” A heading read out of context does not identify the step.
- Concrete fix: **“Import provider exports”**.

#### F-1-16 — “Normalize routes” exposes implementation jargon

- Location: second H3 under **How the ledger works**.
- Quote: “Normalize routes”
- Why this fails: a first-time user does not learn what normalization changes or why it matters.
- Concrete fix: **“Put routes in one format”**.

#### F-1-17 — “Compare sources” is too vague for the actual outcome

- Location: third H3 under **How the ledger works**.
- Quote: “Compare sources”
- Why this fails: the product compares route snapshots and reports changes; it does not compare source systems in the general sense.
- Concrete fix: **“Show route changes”**.

#### F-1-18 — The README introduces “fingerprints” before explaining it

- Location: README introduction.
- Quote: “It fingerprints recipient endpoints during import.”
- Why this fails: “fingerprints” is a security implementation term used as a verb. The later privacy section is more precise, but the first explanation is not.
- Concrete fix: **“It replaces recipient addresses and URLs with SHA-256 identifiers during import.”**

#### F-1-19 — The same difference is called both “drift” and “change”

- Locations: landing preview, terminal output, demo action explanation, and README demo/exit-code text.
- Quotes: “See drift before the handoff,” “It prints the drift report,” “no drift was found,” “when drift exists,” and multiple uses of “change.”
- Why this fails: the existing terminology table says the concept is a “change,” but public copy switches to “drift” without defining it.
- Concrete fix: use **“change”** in prose: “It prints the change report,” “no changes were found,” and “when changes exist.” Keep `DRIFT` only as literal CLI output and define it once if it must remain.

#### F-1-20 — Recipient terminology changes in the README

- Location: README **Privacy and security**.
- Quote: “Recipient **targets** are stored only as SHA-256 fingerprints.”
- Why this fails: the landing page and claims ledger use “recipient endpoints.” “Targets” introduces a second term for the same data.
- Concrete fix: **“Recipient endpoints are stored only as SHA-256 identifiers.”**

#### F-1-21 — “Storage namespace” is avoidable browser jargon

- Location: README **Development**.
- Quote: “Its storage namespace is `demo:alert-config-ledger:*`.”
- Why this fails: the sentence is meant to explain isolation but assumes the reader knows what a storage namespace is.
- Concrete fix: **“The demo stores browser data only under keys that start with `demo:alert-config-ledger:`.”**

#### F-1-22 — Non-landing routes reuse landing-page metadata

- Locations: `/demo`, `/privacy`, and `/terms` document head.
- Exact values: all three routes use “Compare live alert routes with reviewed config and trace route, recipient, and severity changes.” as the meta description and “Alert Config Ledger — trace alert route changes” as `og:title`.
- Why this fails: a privacy or terms link preview claims to be the route-comparison product page. Titles and canonicals change correctly, but descriptions and Open Graph/Twitter titles do not describe the current route.
- Concrete fix: set route-specific description, `og:title`, `og:description`, `twitter:title`, and `twitter:description` values alongside `document.title` and canonical. Add a route metadata test.

## 2. Copy audit

Counts use whitespace-separated visible tokens; punctuation-only separators count as tokens. Raw install commands are listed because they are visible, although they are not prose sentences. Repeated runtime copy is listed each time it appears. No item exceeds 22 words and no banned plain-words term appears. “Realistic” is still flagged as an unmeasured adjective.

### Landing page

| Copy | Words | Result |
| --- | ---: | --- |
| Skip to main content | 4 | Pass |
| ACL | 1 | Pass |
| Alert Config Ledger | 3 | Pass |
| Demo | 1 | Pass |
| Install | 1 | Pass |
| Privacy | 1 | Pass |
| Read-only config audit · tape 01 | 6 | F-1-5 |
| Trace every alert route change | 5 | F-1-1 |
| For platform teams who need to prove whether live alert routes match the reviewed baseline. | 15 | Pass |
| Try it with sample data | 5 | Pass: result-naming action |
| Loads three realistic route changes in an isolated demo. | 9 | F-1-3 |
| Runs offline after the first visit. | 6 | Pass |
| Recipient endpoints stay redacted. | 4 | Pass |
| Core CLI needs no license. | 5 | Pass |
| Baseline on reel A. | 4 | F-1-6 |
| Live state on reel B. | 5 | F-1-7 |
| Playback / actual command | 4 | F-1-8 |
| See drift before the handoff | 5 | F-1-9, F-1-19 |
| The bundled demo runs the same comparison as the CLI. | 10 | Pass |
| Read the terminal transcript | 4 | Pass: result-naming action |
| `$ alert-ledger demo` | 3 | Pass: literal output |
| `! DRIFT 3 changed routes · 2 matched` | 8 | F-1-19: literal output may remain after “drift” is defined |
| `~ team = payments · recipients` | 6 | Pass: literal output |
| `~ service = checkout · severity, recipients` | 7 | Pass: literal output |
| `+ team = security · route` | 6 | Pass: literal output |
| `Demo files: /tmp/alert-ledger-demo-…` | 3 | Pass: literal output |
| A / B / source | 4 | F-1-10 |
| How the ledger works | 4 | Pass |
| Snapshot exports | 2 | F-1-15 |
| Read Grafana or Alertmanager exports from a file or read-only URL. | 11 | Pass |
| Normalize routes | 2 | F-1-16 |
| Keep non-secret provider fields and replace recipient endpoints with fingerprints. | 10 | Pass: “fingerprints” is explained by adjacent context and privacy copy |
| Compare sources | 2 | F-1-17 |
| Compare the baseline with live state and show each change with its timestamp. | 13 | Pass |
| Side A / install | 4 | F-1-11 |
| Run the ledger locally | 4 | Pass |
| The demo ships inside the binary and needs no account. | 10 | Pass |
| Get the source on GitHub (external site). | 7 | Pass: result-naming link |
| `git clone https://github.com/B-Divyesh/sf-alert-config-change-ledger.git` | 3 | Pass: command |
| `cd sf-alert-config-change-ledger` | 2 | Pass: command |
| `cargo install --path .` | 4 | Pass: command |
| `alert-ledger demo` | 2 | Pass: command |
| Copy install command | 3 | Pass: result-naming action |
| Write protect / on | 4 | F-1-12 |
| What it does not do | 5 | Pass |
| It does not send alerts. | 5 | Pass |
| It does not change provider config. | 6 | Pass |
| It does not replace Git review. | 6 | Pass |
| It does not send telemetry. | 5 | Pass |
| Side B / optional | 4 | F-1-13 |
| Use an existing Pro license | 5 | Pass |
| A Pro license adds a reusable review template and sign-off checklist. | 11 | Pass |
| The snapshot, diff, timeline, JSON, and Markdown commands need no license. | 12 | Pass |
| New license sales are not open in this release. | 9 | Pass |
| No active license in this browser. | 6 | Pass |
| New license sales are not open in this release. | 9 | Pass: repeated in the panel |
| Have a license? | 3 | Pass |
| Paste it | 2 | Pass |
| Verify license | 2 | Pass: result-naming action |
| Trace live alert route changes back to their source. | 9 | Pass |
| Privacy | 1 | Pass |
| Terms | 1 | Pass |
| Built by Param Factory (external site) | 6 | Pass |
| v0.1.0 · build 003 | 4 | Pass |

The demo-only banner controls were also checked: **Reset demo** passes; **Start for real** is F-1-14.

### README

Code blocks are executable examples, not sentences, so their surrounding instruction and every prose sentence or list fragment are counted below. Headings are included because they must make sense out of context.

| Copy | Words | Result |
| --- | ---: | --- |
| Alert Config Ledger | 3 | Pass |
| Compare live alert routes with a reviewed baseline. | 8 | Pass |
| Alert Config Ledger is a read-only CLI for platform teams using Grafana, Alertmanager, or normalized JSON exports. | 17 | F-1-2 |
| It fingerprints recipient endpoints during import. | 6 | F-1-18 |
| Reports show that a recipient changed without printing an email address, phone number, or webhook URL. | 16 | Pass |
| Try the bundled demo | 4 | Pass |
| The command compares two realistic Grafana exports in a new temporary folder. | 12 | F-1-3 |
| It prints the drift report and the folder containing the generated snapshots. | 12 | F-1-19 |
| Nothing is uploaded. | 3 | Pass |
| Install | 1 | Pass |
| Build the single binary from source: | 6 | Pass |
| The project starts at version `0.1.0`. | 6 | Pass |
| The factory owns registry publishing; this repository does not publish itself. | 11 | Pass |
| Usage | 1 | Pass |
| Snapshot an Alertmanager YAML export: | 5 | Pass |
| Snapshot Grafana's read-only provisioning API using a bearer token from an environment variable: | 13 | Pass |
| Compare live state with the reviewed baseline: | 7 | Pass |
| Render changes across a folder of snapshots: | 7 | Pass |
| Exit code `0` means the command completed and no drift was found. | 12 | F-1-19 |
| `diff` and `timeline` return `2` when drift exists. | 8 | F-1-19 |
| Invalid input, network failures, and other command errors return `1`. | 10 | Pass |
| Supported input | 2 | Pass |
| Grafana notification-policy JSON and contact-point array exports. | 7 | Pass |
| Alertmanager YAML or JSON with nested routes and receiver configs. | 10 | Pass |
| Alert Config Ledger snapshot JSON for scripted pipelines. | 8 | F-1-2 |
| The CLI performs `GET` requests only. | 6 | Pass |
| It has no write command and sends no telemetry. | 9 | Pass |
| Development | 1 | Pass |
| Requirements: Rust 1.85+ and Node 22+. | 6 | Pass |
| `npm test` runs Rust tests, site tests, and browser claim tests. | 11 | Pass |
| `npm run build` produces the Rust release binary in `target/release/` and the static site in `dist/site/`. | 16 | Pass |
| Use `npm ci` and `npm ci --prefix api` instead in a clean CI checkout. | 14 | Pass |
| Run each part separately: | 4 | Pass |
| The landing-page demo is available at `/demo` and uses only bundled data. | 12 | Pass |
| Its storage namespace is `demo:alert-config-ledger:*`. | 5 | F-1-21 |
| The deployed demo URL is `https://alert-config-change-ledger.sociobot.in/demo`. | 6 | Pass |
| Privacy and security | 3 | Pass |
| Configuration is processed by the CLI on your machine. | 9 | Pass |
| API tokens are read from the environment and are not written to snapshots. | 13 | Pass |
| Recipient targets are stored only as SHA-256 fingerprints. | 8 | F-1-20 |
| Non-secret provider fields and timestamps remain in snapshots. | 8 | Pass |
| The static demo makes no cross-origin requests. | 7 | Pass |
| Existing Pro approval-report licenses are verified through the Sociobot billing API. | 11 | Pass |
| The protected template comes from a same-origin function only after that check. | 12 | Pass |
| New license sales are not open in this release. | 9 | Pass |
| The CLI's snapshot, diff, timeline, JSON, and Markdown output remain free. | 11 | Pass |
| Deploy | 1 | Pass |
| The checked-in `swa-cli.config.json` deploys both `dist/site/` and the license-gated function in `api/` to `https://alert-config-change-ledger.sociobot.in`. | 14 | Pass |
| Verify that deployment shape without publishing with `npm run deploy:check`; publish the production build with `npm run deploy`. | 18 | Pass |
| The deployment supplies `ALERT_LEDGER_RATE_LIMIT_STORAGE` as a secret application setting for the shared approval-pack request counter. | 15 | Pass |
| This repository does not manage DNS, infrastructure, billing registration, or registry credentials. | 12 | Pass |
| License | 1 | Pass |
| MIT. | 1 | Pass |
| See `LICENSE`. | 2 | Pass |

## 3. Demo and sandbox

The one-click path passes.

- Clicking **Try it with sample data** once opens `/demo`.
- The first 390 × 844 demo viewport shows “Review three live route changes,” the reviewed Git revision, the live Grafana revision, timestamps, and “3 changed · 2 matched.” This is already a realistic product state rather than setup instructions.
- The persistent banner says “Demo — sample data, nothing is saved” and contains **Reset demo** and **Start for real**.
- Clearing the comparison and activating **Reset demo** restores all three changes.
- A seeded non-demo key, `review:real-state=untouched`, survived reset and exit. **Start for real** removed all `demo:alert-config-ledger:*` keys.
- The whole observed demo request log was same-origin. After service-worker installation, `/demo` reloaded offline and retained the sample plus its offline notice.
- Running `/work/repo/target/debug/alert-ledger demo` from a new temporary working directory completed without setup, reported three changed and two matched routes, and wrote only to `/tmp/alert-ledger-demo-20260829-153235-7056`.

No demo or sandbox blocking finding applies.

## 4. Claims

I ran every exact `test` command in `.factory/claims.json` after `npm ci` and `npm ci --prefix api`. All 16 passed.

| Claim ID | Result | Evidence observed |
| --- | --- | --- |
| `core-workflow` | Pass | Bundled comparison attributed three route changes. |
| `provider-inputs` | Pass | Grafana JSON and Alertmanager YAML fixtures normalized. |
| `grafana-contact-points` | Pass | PagerDuty, Opsgenie, Slack, webhook, and email changes were detected without secret values. |
| `read-only-import` | Pass | URL import used GET; help exposed no write command. |
| `recipient-redaction` | Pass | Reports contained SHA-256 identifiers rather than endpoint values. |
| `token-exclusion` | Pass | Authorization used the token and snapshots did not contain it. |
| `exit-codes` | Pass | Clean, changed, and error cases returned 0, 2, and 1. |
| `free-core-cli` | Pass | Core commands and formats ran without a license. |
| `no-telemetry` | Pass | The CLI demo completed with HTTP(S) proxies pointed at a closed port. |
| `demo-privacy` | Pass | Browser demo requests stayed same-origin and storage used the demo prefix. |
| `demo-exit-clears-state` | Pass | Exit removed demo keys and preserved a non-demo sentinel. |
| `offline-reload` | Pass | The service-worker-controlled demo reloaded offline. |
| `report-download` | Pass | Downloaded JSON contained three changes. |
| `web-cli-parity` | Pass | Browser and CLI sample reports matched. |
| `paid-template` | Pass | Only a recorded valid license exposed the approval pack. |
| `sales-closed` | Pass | Closed-sales copy appeared without checkout or paid-content access. |

There is no failing claim test. F-1-1 and F-1-2 are unlisted-claim findings.

## 5. History re-check

No `.factory/review-*.md` or `.factory/polish-*.md` file existed before this review, so there are no earlier finding IDs to re-open. The prior `.factory/handoff.md` was the Verification 8 PASS handoff. Its functional assertions were independently rechecked:

- 16/16 registered claims pass.
- `npm test` passes: 21 Rust tests, 12 API tests, and 50 Playwright tests.
- `npm run build` passes and creates `dist/site/` plus the release binary.
- The live first read, demo isolation, offline reload, accessibility, links, routes, and headers pass.
- Its “no product defect” conclusion does not survive this stricter plain-words and unlisted-claim audit; F-1-1 through F-1-22 are newly identified findings, not regressions of an earlier review ID.

## 6. Structure, navigation, accessibility, and identity

Confirmed passes:

- `/`, `/demo`, `/privacy`, and `/terms` return 200; an unknown path returns the designed 404 with a way home.
- Every checked route has `lang="en"`, one H1, one `main`, ordered headings, a canonical, favicon, Apple touch icon, Open Graph image, and Twitter card.
- Titles follow the required route patterns: landing “Product — what it does”; Demo, Privacy, Terms, and Page not found use their route label before the product name.
- SPA navigation uses real paths. Forward navigation and browser Back update the URL/title and focus the destination H1.
- The crawl found no dead product link. All internal links, GitHub, and Sociobot returned 200; `mailto:` links were exempt. The intentional current-page anchor on a 404 remains a 404 by design.
- The factory `verify-url.sh` check passes with no normal-load console errors, one H1, one main, complete image alternatives, and labeled buttons.
- Playwright Axe on `/`, `/demo`, `/privacy`, `/terms`, and the designed 404 reports zero violations, including zero serious or critical issues.
- Security headers include CSP with header-delivered `frame-ancestors`, HSTS, `nosniff`, strict-origin referrer policy, and restrictive permissions policy.
- The cassette-era incident-zine visual system is distinct and matches `.factory/design.md`; it is not a generic SaaS template. The finding is the metaphor in copy, not the visual art direction.

F-1-22 records the route metadata defect.

## 7. Missed leverage

No additional product feature is an obvious requirement from the brief. The CLI already imports files and read-only URLs, exports terminal/JSON/Markdown results, provides timelines, and has browser/CLI demos. A generative AI step would make deterministic configuration comparison less auditable and is not justified. No AI feature, provider key, decorative assistant, or sync claim is present.

## What would make this perfect

Resolve every finding above, then rerun the audit from a fresh context. In practical terms: narrow and register claims, remove metaphor from words while keeping it in the visual system, replace the three implementation-oriented workflow headings, use one term each for changes and recipient endpoints, rename the demo exit action for its result, fit all three facts into the 1366 × 768 first viewport, and set route-specific metadata. Perfect means that rerun produces zero findings; the current functional pass is not enough.
