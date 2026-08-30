# Verification 16 — PASS

- Work order: `alert-config-change-ledger-verify-16`
- Candidate and checked-out commit: `1fa6e8252e05e7a2471205ce631e8611e1fb761c`
- Remote `origin/main`: `1fa6e8252e05e7a2471205ce631e8611e1fb761c`
- Live URL: <https://alert-config-change-ledger.sociobot.in>
- Verified: 30 August 2026 UTC
- Result: **PASS**

No product code was changed. This report and the handoff update are the only
repository changes made by this verification.

## Release identity and production match

The live `/release.json` receipt names the requested commit, has
`sourceDirty: false`, and records 14 public artifact hashes. A clean local
production build produced the same receipt. The independent release verifier
passed:

```text
$ npm run verify:release -- 1fa6e8252e05e7a2471205ce631e8611e1fb761c
Verified 1fa6e8252e05e7a2471205ce631e8611e1fb761c: 14 static artifacts and API status 401.
```

This hashes every delivered static artifact and confirms the live
`X-Alert-Ledger-Build` API header. The deployment-only failure previously
reported is therefore not present for this candidate.

## Required claims gate — PASS

`.factory/claims.json` exists and contains 24 entries. Before product QA, I
installed locked dependencies with `npm ci` and ran every `test` command in
ledger order, including the self-hosting clean-clone claim. All commands
exited 0. The final command, `node site/scripts/test-clean-claims.mjs`, made a
new clone under `/tmp/alert-ledger-clean-claims-*`, installed its own
dependencies, and reran every other ledger command from its bundled demo
inputs.

All claims passed: `core-workflow`, `change-timestamps`, `provider-inputs`,
`normalized-snapshot-input`, `grafana-contact-points`, `read-only-import`,
`recipient-redaction`, `token-exclusion`, `exit-codes`, `free-core-cli`,
`no-telemetry`, `demo-privacy`, `demo-exit-clears-state`, `offline-reload`,
`report-download`, `web-cli-parity`, `paid-template`, `pro-pack-contents`,
`sales-closed`, `minimum-runtimes`, `build-artifacts`, `release-identity`,
`deployment-shape`, and `clean-claim-bootstrap`.

## First read and end-to-end result — PASS

A fresh browser opened the live landing page cold. Its first screen plainly
answers the required questions:

- What it does: **Compare reviewed and live alert routes**.
- For whom: **For platform teams who need to prove whether live alert routes
  match the reviewed baseline.**
- What to do first: **Try it with sample data**, with adjacent copy explaining
  that it loads three sample route changes in an isolated demo.

The one-click action opened `/?demo=1`, showed the persistent **Demo — sample
data, nothing is saved** banner, Reset demo, Start for real, and the seeded
three-changed/two-matched comparison.

The release CLI exercised the normal flow with
`target/release/alert-ledger demo --json`: it returned three attributed
changes, two matched routes, Grafana live-source timestamps, and SHA-256
recipient fingerprints. A malformed `{}` Grafana export returned exit 1 with
an actionable recovery message and did not create an output snapshot.

`cargo package --locked` passed (22 files; 122.5 KiB, 30.6 KiB compressed).
A fresh consumer installation using `cargo install --path . --root <temp>`
ran `alert-ledger demo --json` and returned `consumer_changes=3 matched=2`.

## Local quality gates — PASS

All applicable commands passed from the requested checkout:

```text
npm ci
npm test
npm run lint
npm run build
cargo package --locked
```

`npm test` passed 25 Rust tests, 13 API tests, 5 script tests, and 58
Playwright tests. Lint passed rustfmt, Clippy with warnings denied, and
TypeScript checking. The exact production build created
`target/release/alert-ledger` and `dist/site/`; its receipt is clean and names
the candidate. Initial JS is 23,500 bytes raw / 7,862 bytes gzip and CSS is
13,336 bytes raw / 3,822 bytes gzip, comfortably within static-product
budgets.

## Live browser, privacy, accessibility, and response policy — PASS

- Desktop (1366 x 768) and mobile (390 x 844) were exercised. The mobile demo
  measured `scrollWidth = clientWidth = 390`; there were no console or page
  errors.
- Axe on live `/` and `/demo` returned no violations, therefore no serious or
  critical findings. Keyboard use exposed the skip link, moved focus to main,
  gave the Demo link a 3 px visible outline, and Space selected a route and
  revealed its severity detail.
- With `prefers-reduced-motion`, the document scroll behavior was `auto` and
  the reel had a `0.00001s` one-iteration animation.
- The cold landing and demo request log contained only the product origin:
  HTML, JS, CSS, the bundled WebP, and terminal SVG. No analytics, telemetry,
  third-party fonts, or cross-origin demo request occurred.
- After one online load, the live service worker was controlling the page with
  no waiting/installing worker. Offline reload of the demo returned HTTP 200
  and retained both the demo banner and three-change sample.
- Live headers include HSTS, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, a restrictive permissions
  policy, and a header-delivered CSP with `frame-ancestors 'none'`. HTML
  revalidates after 30 seconds and `/release.json` is `no-store`.
- All ordinary rendered links returned HTTP 200. The self skip-link on the
  deliberately HTTP-404 unknown-route page naturally retains that page's 404
  response and is not a dead navigation target.

## Server endpoint allowance — PASS

The only server-side endpoint, `POST /api/approval-pack`, was tested with one
fresh forwarded client identity. Requests 1–20 returned the expected 401 for
an absent license. Request 21 returned **429** with `Retry-After: 57`; request
22 remained 429. The observed and enforced allowance is **20 requests per 60
seconds**. Responses carried build
`1fa6e8252e05e7a2471205ce631e8611e1fb761c` and
`X-Alert-Ledger-Limit-Store: azure-table`.

## Defects

None found. There are no blocker, critical, serious, or minor release defects
from this verification.

## Decision

**PASS.** Candidate `1fa6e8252e05e7a2471205ce631e8611e1fb761c` is built,
functionally verified, and exactly matches the live deployment.
