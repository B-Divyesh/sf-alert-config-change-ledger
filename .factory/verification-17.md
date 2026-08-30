# Independent verification 17 — PASS

- Candidate and tested commit: `10590f1615bac48ed3463dad1ca4122101a13d72`
- Live URL: <https://alert-config-change-ledger.sociobot.in>
- Work order: `alert-config-change-ledger-verify-17`
- Verified: 30 August 2026 UTC
- Decision: **PASS — the candidate is deployable. No release-blocking, major, or minor defect was found.**

No product code changed. This report and `.factory/handoff.md` are the only
repository changes made by verification.

## Mandatory first claims gate

The clean candidate checkout was at the requested SHA. After the locked root
dependency bootstrap, I ran **every exact `test` command** in
`.factory/claims.json`, in ledger order, against the shipped CLI demo or the
web demo as applicable. All 25 passed. The final `clean-claim-bootstrap` test
then made its own dependency-free temporary Git clone and replayed every other
ledger command successfully.

| Claims | Result |
| --- | --- |
| `core-workflow`, `change-timestamps`, `provider-inputs`, `normalized-snapshot-input`, `grafana-contact-points` | Pass |
| `read-only-import`, `recipient-redaction`, `token-exclusion`, `exit-codes`, `free-core-cli`, `no-telemetry` | Pass |
| `demo-privacy`, `demo-exit-clears-state`, `offline-reload`, `report-download`, `web-cli-parity` | Pass |
| `paid-template`, `pro-pack-contents`, `license-data-boundary`, `sales-closed` | Pass |
| `minimum-runtimes`, `build-artifacts`, `release-identity`, `deployment-shape`, `clean-claim-bootstrap` | Pass |

I cross-checked landing, demo, legal-page, and README claims against this
ledger. The asserted offline, privacy, redaction, no-license, provider,
timestamp, sample-report, and closed-sales statements each have a matching
observable claim test; no material unlisted visitor claim was found.

## First read and live deployment

The cold 1440 × 900 page passes the first-read release gate:

- **What it does:** “Compare reviewed and live alert routes.”
- **For whom:** “For platform teams who need to prove whether live alert routes match the reviewed baseline.”
- **First action:** “Try it with sample data,” with adjacent text saying it loads three sample route changes in an isolated demo.

The action opens `/?demo=1` in one click and immediately shows a persistent
“Demo — sample data, nothing is saved” banner, Reset demo, Start for real, and
three attributed route changes. The deployed `/release.json` identifies this
exact SHA with `sourceDirty: false`; it is byte-for-byte identical to the
local production receipt. Its 14 listed static artifact digests match the
fresh build; the live JS and CSS SHA-256 values also match directly.

## Functional QA

- `cargo test`: pass — 25 Rust tests.
- `npm test`: pass — Rust, 13 API tests, 5 script tests, and 60 Playwright tests.
- `npm run lint`: pass — rustfmt, Clippy with warnings denied, and TypeScript.
- `npm run build`: pass — release binary and `dist/site/` produced.
- `cargo package --allow-dirty`: pass — package verification completed.
- A fresh consumer installed the packed `.crate`; `alert-ledger --help` exposed only `snapshot`, `diff`, `timeline`, and `demo`. `alert-ledger demo --json` returned three changes, two matched routes, and `grafana:production` attribution.
- Independent normal flow: Grafana reviewed/live exports produced four and five normalized routes, respectively; Markdown diff reported three changes, two matches, live timestamps on all three records, redacted recipient values, and drift exit code `2`.
- Invalid JSON returned exit code `1` with an actionable `Grafana input is not valid JSON` message. No snapshot was written. The claims suite additionally covers empty/error-envelope imports, duplicate sibling routes, Alertmanager nested routes, token exclusion, and no-drift exit `0`.
- Live demo route selection, report download (three JSON changes), clear empty state, Reset demo, deliberately damaged demo-state recovery, and reset recovery all worked without browser errors.

## Browser, accessibility, privacy, and offline QA

The factory URL verifier passed: HTTP 200; title; `lang=en`; one H1; main
landmark; no missing image alt text; no unlabeled buttons; no load errors.

- Playwright Axe found **zero serious/critical findings** on `/`, `/demo`,
  `/privacy`, `/terms`, and the designed HTTP 404 page.
- Keyboard-only navigation starts on the skip link and presents a visible
  `3px` teal focus ring. Tab reaches every tested navigation, sample action,
  disclosure, install-copy button, and license input; Enter on the sample
  action opens the demo.
- At 390 × 844 the demo has no horizontal overflow (`390px` scroll width) and
  every visible tested interactive target is at least `44px` in both
  dimensions. The mobile page was visually inspected.
- With `prefers-reduced-motion: reduce`, the demo spool animation completes at
  `0.01ms`; the reduced-motion media query is active.
- A fresh live Playwright context recorded only same-origin requests during
  landing-to-demo use: document, local JS/CSS, hero WebP, and terminal SVG.
  There were no console errors, page errors, analytics, or third-party runtime
  assets. Demo storage and exit behavior are separately covered by the
  passing claims.
- The live service worker was activated and controlling `/demo`; after the
  first online visit it reloaded successfully offline with the demo banner and
  three-change view intact.

There is no sign-in flow, so the Entra tenant requirement does not apply.

## Headers, caching, rate limit, and budgets

Live document and asset responses include HSTS, header-delivered CSP with
`frame-ancestors 'none'`, `nosniff`, strict-origin referrer policy, and a
camera/microphone/geolocation Permissions Policy. HTML and `sw.js` revalidate
after 30 seconds; hashed JS/CSS are `public, max-age=31536000, immutable`.

The sole same-origin server endpoint was exercised without a license, so no
billing verification or paid content retrieval occurred. Its allowance is
**20 requests per 60 seconds**: requests 1–20 returned `401` and request 21
returned `429 Too Many Requests` with `Retry-After: 55`, `no-store` response
handling, `azure-table` limiter identity, and the exact candidate build ID.

Fresh build budgets: JavaScript is 23,523 bytes raw / 7,850 bytes gzip; CSS is
13,336 bytes raw / 3,822 bytes gzip; hero WebP is 169,978 bytes; no web fonts
are loaded. This is below the static-product JS, CSS, font, and hero budgets.

## Known gaps and next step

None. The release can proceed. Factory deployment remains the next operational
step; this work order did not deploy, alter infrastructure, or access other
services.
