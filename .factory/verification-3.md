# Independent product verification 3 — FAIL

Verified on 28 August 2026 against candidate commit
`637a5a9a9bbe4867b062a12e49d1fa2053dd7ae8` and
`https://alert-config-change-ledger.sociobot.in`.

## Verdict

**FAIL — do not release.** The deployed static site is byte-for-byte aligned
with the candidate build, but its required server-side approval-pack function
is absent in production. This makes the existing-Pro-license workflow fail and
prevents the required production rate-limit behavior from operating.

## Release-blocking defects

### Critical — deployed approval-pack endpoint is missing

Fresh `GET /api/approval-pack` returned **HTTP 404** with an empty response.
The candidate contains `api/approval-pack/index.js`, declares the
`approval-pack` function route, and the browser sends a `POST` to this exact
same-origin URL after a cached valid license chooses **Download approval report
pack**. In a fresh live browser session, a deliberately cached valid verdict
revealed that button; clicking it received the 404 and announced:

> The approval pack could not be authorized. Verify the license and retry.

Thus an advertised existing-license feature cannot work on the canonical
deployment. This is a deployment-only mismatch: live static JS and CSS
SHA-256 hashes exactly equal this candidate's fresh production build:

- `index-CTCpFeGq.js`: `71b6cf6ea64ff94b4e376494025c4721ae23f85890275da3c67335f61672e650`
- `index-Bmc-NBld.css`: `61f38fd8fef0547b67c5b2a8fbc48065b2799d5ecf5280fa240da3660315822c`

### High — production endpoint cannot meet required rate limiting

The candidate's function source implements a 20-request/60-second limiter
and returns `429` with `Retry-After`. On the canonical deployment, a fresh
25-request rapid burst to `/api/approval-pack` returned **25 × 404**, with no
`429` and no `Retry-After`. The observed live throttle threshold is therefore
**not reached / unavailable**, because the function is not deployed. The work
order requires every server-side endpoint to throttle a rapid burst.

## Required claim gate — PASS after clean install

`.factory/claims.json` exists. After `npm ci` from the clean checkout (24
packages installed; 0 vulnerabilities), every listed command passed exactly:

- 9 Rust CLI/demo claims: core workflow, provider inputs, Grafana contact
  points, read-only GET import, recipient redaction, token exclusion, exit
  codes, free core commands, and no telemetry.
- 6 browser demo claims: demo privacy, offline reload, report download,
  web/CLI parity, paid template (mocked function), and closed sales.

The initial attempt before dependency installation correctly exposed the clean
checkout's missing `@playwright/test`; that is resolved by the documented
`npm ci` setup step, after which every exact claim command passed. Playwright's
last-run record is `passed` with no failed tests.

## First-read and product workflow — PASS

Cold opening the live page states, in plain words:

- **What:** “Trace every alert route change.”
- **For whom:** platform teams checking live alert routes against a reviewed
  baseline.
- **First action:** **Try it with sample data**, with adjacent copy that it
  loads three realistic route changes in an isolated demo.

The one-click `/demo` flow loaded three attributable changes. It selected a
route with `aria-pressed`, showed empty and reset recovery states, and
downloaded `alert-ledger-sample-report.json` containing 3 changes and 2
matched routes. Demo browser storage contained only
`demo:alert-config-ledger:state`; its normal flow made no cross-origin
requests. After service-worker installation and one online reload, the live
demo reloaded offline and displayed both the offline notice and `3 changed ·
2 matched`.

The release binary also exercised the real job: `alert-ledger demo --json`
reported three redacted changes and two matches; `diff` returned 2 for drift
and 0 for no drift; `snapshot --provider grafana` wrote five routes without
recipient endpoint values. `cargo package --allow-dirty` passed (57 files,
305.3 KiB unpacked / 83.9 KiB compressed), and a clean temporary-prefix
install ran `alert-ledger 0.1.0` and the same three-change demo.

## Quality evidence — PASS except deployed function

- `npm test` passed: 17 Rust tests, 7 API tests, and 36 Playwright tests.
- `npm run lint` passed `cargo fmt --check`, strict Clippy, and TypeScript
  `tsc --noEmit`.
- Exact `npm run build` passed and produced `target/release/alert-ledger` and
  `dist/site/`. Initial build payload: 6.12 KB gzip JS and 3.78 KB gzip CSS.
- Live cold browser checks had no console/page errors. Axe found no
  serious/critical violations on `/`, `/demo`, `/privacy`, `/terms`, the SPA
  404 route, or `/404.html`. Keyboard skip-link and route selection worked
  with a visible 3 px focus outline.
- At 390×844, `/demo` had `scrollWidth === clientWidth === 390`; reduced-motion
  styles reduced animation and transition durations to `1e-05s`.
- Live Lighthouse mobile: Performance **99**, Accessibility **100**, LCP
  **1.68 s**, CLS **0** (INP not measured for this page).
- `/`, `/demo`, `/privacy`, `/terms`, `/robots.txt`, `/sitemap.xml`, `/sw.js`,
  and the manifest returned 200; an unknown path returned 404. Responses
  include HSTS, CSP, `nosniff`, strict referrer policy, and permissions policy.
  Hashed assets are immutable; the hero image correctly uses one-hour
  revalidation.

## Deployment remediation

Deploy the `api/` Azure Function together with the static `dist/site/` output,
then verify `POST /api/approval-pack` returns its expected unauthenticated 401
and a `429` plus positive `Retry-After` after 20 rapid requests. Re-run this
verification against the canonical URL after deployment.
