# Verification 14 — FAIL

- Work order: `alert-config-change-ledger-verify-14`
- Candidate: `317958d56b9e17cd277a5161354c1754ee8953fd`
- Live URL: <https://alert-config-change-ledger.sociobot.in>
- Verified: 30 August 2026 UTC
- Result: **FAIL**

This is an independent product verification. No product source was changed.
The candidate and `origin/main` were both the requested SHA when testing began.

## Release-blocking findings

### High — demo state changes lose keyboard focus and are not announced

The core demo's keyboard flow fails when its state is cleared or reset.

1. On `/demo`, focus **Clear comparison** and press Space.
2. The visible result correctly changes to **No comparison is loaded**.
3. The focused button is removed and `document.activeElement` becomes `<body>`.
4. The new heading has no `tabindex`, `aria-live`, `role=status`,
   `role=alert`, or live-region ancestor. The global `#route-status` live
   region remains empty.
5. Focus the empty state's **Reset demo** button and press Space. The three
   sample changes return, but focus again becomes `<body>`. The attempted
   focus target, `#ledger-title`, is an H2 without `tabindex` and cannot take
   programmatic focus.

This leaves a keyboard and screen-reader user at the top-level document with
no announcement of the result or recovery. It violates the attached
non-negotiable keyboard, focus-management, async-result, and empty-state
accessibility contract. Static Axe analysis cannot detect this interaction
failure.

### Medium — license verification loses focus and does not announce its verdict

On the landing page, keyboard activation of **Verify license** with an invalid
token successfully receives the real Sociobot response and displays
**License no longer active.** However, replacing the form removes the focused
button and leaves focus on `<body>`. The notice and license panel have no
`aria-live`, status/alert role, or live-region ancestor, and `#route-status`
remains empty.

The visible recovery UI works, but a screen-reader user is not notified that
verification finished or failed. This independently violates the attached
form-error and async-result accessibility baseline.

## Mandatory gates

### Claims ledger — PASS

`.factory/claims.json` exists with 23 entries. Before any repository or
implementation inspection, every listed command was run in manifest order
from the clean checkout. The aggregate runner exited 0, including
`clean-claim-bootstrap`, which creates another clean clone and runs the other
ledger commands in order. Each claim ID occurs in exactly one tagged test.

| Claim | Result |
| --- | --- |
| `core-workflow` | Pass |
| `change-timestamps` | Pass |
| `provider-inputs` | Pass |
| `normalized-snapshot-input` | Pass |
| `grafana-contact-points` | Pass |
| `read-only-import` | Pass |
| `recipient-redaction` | Pass |
| `token-exclusion` | Pass |
| `exit-codes` | Pass |
| `free-core-cli` | Pass |
| `no-telemetry` | Pass |
| `demo-privacy` | Pass |
| `demo-exit-clears-state` | Pass |
| `offline-reload` | Pass |
| `report-download` | Pass |
| `web-cli-parity` | Pass |
| `paid-template` | Pass |
| `pro-pack-contents` | Pass |
| `sales-closed` | Pass |
| `minimum-runtimes` | Pass |
| `build-artifacts` | Pass |
| `deployment-shape` | Pass |
| `clean-claim-bootstrap` | Pass |

The landing page, legal pages, README, demo documentation, and copy audit were
cross-checked against the ledger. No material unlisted product claim was
found.

### First-read test — PASS

The cold first screen plainly answers all three required questions:

- What: **Compare reviewed and live alert routes**.
- For whom: platform teams proving whether live routes match the reviewed
  baseline.
- First action: **Try it with sample data**, with adjacent text saying it
  loads three isolated sample route changes.

The action is one click. At 390 x 844, the headline, audience sentence,
action, its outcome, and all three facts fit in the initial viewport without
horizontal overflow.

## Clean install, tests, build, and package

- `npm ci`: pass; 24 packages, zero audit findings.
- `npm ci` in `api/`: pass; 25 packages, zero audit findings.
- `cargo fetch --locked`: pass.
- `npm test`: pass. Totals: 25 Rust tests, 13 API tests, 2 runtime-bootstrap
  tests, and 54 Playwright desktop/mobile tests.
- `npm run lint`: pass. Rustfmt, Clippy with warnings denied, and TypeScript
  checking all passed.
- `npm run build`: pass. It produced `target/release/alert-ledger` and
  `dist/site/`.
- `cargo package --locked`: pass, including Cargo's package verification;
  22 files, 30.5 KiB compressed.
- The packaged crate was extracted and installed with `cargo install --path`
  into a new temporary consumer root. The installed binary reported v0.1.0,
  exposed the documented command surface, and ran `demo --json` with three
  changes, two matched routes, and no raw recipient values.

Production bundle sizes are 22,169 bytes raw / 7,536 bytes gzip JavaScript
and 13,336 bytes raw / 3,822 bytes gzip CSS. There are no downloaded fonts;
the hero WebP is 169,978 bytes.

## CLI product workflow

The fresh-consumer binary was exercised outside the source tree.

- Grafana reviewed and live exports normalized to four and five routes.
- Diff returned exit 2 with three changes, two matched routes, the expected
  route/recipient/severity changes, and the live timestamp on every change.
- Self-comparison returned exit 0 with no drift.
- Markdown and JSON reports were written successfully.
- A two-snapshot timeline returned exit 2 and one attributed change set.
- Alertmanager YAML, Alertmanager JSON through stdin, and normalized ledger
  input all imported successfully.
- Missing and empty input, unsupported provider, malformed timestamp,
  insecure non-local HTTP URL, missing token environment variable,
  conflicting input options, missing/empty timeline directories, and an
  unwritable output path all returned exit 1 with actionable text. Failed
  snapshot operations left no output file.
- Snapshot/report inspection found SHA-256 recipient fingerprints and no raw
  example email, webhook, PagerDuty, Opsgenie, or Slack value.

Automated coverage also passed GET-only URL import, token exclusion, duplicate
sibling routes, negative-regex matchers, invalid HTTP-200 provider envelopes,
and concurrent API limiter behavior.

## Live browser, privacy, and accessibility

### Passing evidence

- Factory `verify-url.sh` passed: HTTP 200, title, `lang=en`, one H1, one main,
  image alternatives, labelled buttons, and no load errors.
- Playwright Axe found zero serious or critical issues on `/`, `/demo`,
  `/privacy`, `/terms`, and the designed HTTP 404 page.
- Normal routes produced no console or page errors. The ambiguous 404 console
  line in a combined sweep was traced to the deliberate `/missing-tape`
  request; an isolated demo workflow produced no errors.
- The first Tab exposes the skip link with a 3 px teal focus outline; Enter
  focuses main. Keyboard navigation opens the demo and Space selects a route,
  retains focus, updates `aria-pressed`, and announces the changed detail.
- Browser Back restores the focused footer Privacy link inside the 390 px
  viewport. Forward restoration settles in 5 ms, focuses the Privacy H1, and
  restores scroll to 0. This clears verification 13's intermittent history
  defect.
- Every visible interactive element on all routes is at least 44 x 44 CSS px.
  At 200% text, every tested 390 px route reflows without horizontal overflow.
- Reduced-motion mode changes smooth scrolling to `auto` and limits the reel
  animation to one 0.00001-second iteration.
- The demo visibly provides its required persistent banner, **Reset demo**,
  **Start for real**, and **Install the CLI**. Downloaded sample JSON has three
  changes and two matches with no raw contact data. Start for real removes all
  `demo:alert-config-ledger:` keys while preserving a non-demo sentinel.
- Damaged demo storage displays an alert with a specific recovery action, and
  Reset demo restores the sample. The separate focus defect is documented
  above.
- A fresh service worker registration updated and controlled `/demo` from
  `/sw.js`; the active cache was `alert-ledger-shell-v2`. Offline reload
  returned HTTP 200 and retained the offline notice and three-change result.

### Request privacy

The complete cold landing and demo interaction log contained only same-origin
HTML, hashed JS/CSS, and bundled image requests. There was no analytics,
telemetry, CDN font/script, or third-party runtime request. License
verification occurred only after explicit form submission and contacted only
the documented `https://api.sociobot.in` endpoint. There is no sign-in flow,
so the Microsoft Entra tenant requirement does not apply.

## Deployment identity, headers, caching, and limits

The candidate build and live deployment match byte-for-byte for all checked
primary artifacts:

- `index.html`
- `assets/index-DJ9adSWg.js`
- `assets/index-Bfp0AagM.css`
- `cassette-ledger.webp`
- `terminal-demo.svg`
- `sw.js`
- `404.html`
- `manifest.webmanifest`

For example, both copies of `index.html` have SHA-256
`7ebc344f5e734c8258fd5b3e6446d8676ac8ff0fc9656d220e7751635c131471`,
and both JS copies have
`4b96d65e32425402cab206d2be6cfcc2190b8e937e1470649d69ae4ab42d0fd8`.
The live footer is build 004. The approval handler returns
`X-Alert-Ledger-Build: repair-7`, matching the candidate source.

HTML responses include HSTS, `nosniff`, strict-origin referrer policy,
restrictive permissions policy, and a header-delivered CSP with
`frame-ancestors 'none'`. HTML and `sw.js` revalidate after 30 seconds; hashed
JS/CSS are immutable for one year; mutable WebP art revalidates after one
hour. Conditional requests returned 304 for HTML, the service worker, hashed
JS, and hero art. Internal and external rendered links returned 200; the
unknown route returned the designed page with HTTP 404.

Rate limits were checked live from one isolated client identity:

- `POST /api/approval-pack`: requests 1-20 returned 401 without a license;
  request 21 returned 429 with `Retry-After: 56`. Requests 21-25 were all 429.
  Observed allowance: **20 requests per 60 seconds**. Responses identify the
  shared store as `azure-table` and use `private, no-store`.
- Sociobot product verification: requests 1-30 returned the normal invalid
  verdict; request 31 returned 429 with `Retry-After: 3`. Requests 31-35 were
  all 429. Observed allowance: **30 requests per window**.

## Performance and visual review

Fresh Lighthouse 13 mobile results on the live URL:

| Measure | Result |
| --- | ---: |
| Performance | 99 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| First contentful paint | 1.02 s |
| Largest contentful paint | 1.81 s |
| Total blocking time | 70 ms |
| Cumulative layout shift | 0 |
| Initial transfer | 185,435 bytes |

Desktop and 390 px screenshots were reviewed. The cassette-era incident-zine
visual thesis is implemented consistently, the hierarchy is clear, content
does not overlap, and the demo remains readable when stacked on mobile.

## Required remediation

1. After **Clear comparison**, move focus to the empty-state heading or Reset
   button and announce the new state through a persistent live region.
2. Make the Reset demo focus target programmatically focusable (for example,
   `tabindex=-1`) and verify that focus actually lands there after rerender.
3. Keep the license panel as a persistent live region, preserve/move focus
   after async verification, and announce valid, invalid, offline, and service
   error outcomes.
4. Add Playwright regressions that use keyboard activation and assert both
   focus and live-region output for these dynamic transitions, then rerun the
   full clean claims ledger and independent verification.
