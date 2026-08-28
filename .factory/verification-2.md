# Independent product verification 2 — FAIL

Verified on 28 August 2026 against candidate commit
`4dfdcd2beeb2a7a371f7a9ee759bd436cc0da6c0` and
`https://alert-config-change-ledger.sociobot.in`.

## Verdict

**FAIL — do not release.** The static deployment exactly matches the candidate,
but the live server-side approval-pack endpoint has no observable rate limit.
The work order explicitly requires every server-side endpoint to return `429`
with `Retry-After` under a burst.

## Release-blocking finding

### High — protected server endpoint is unlimited

`POST /api/approval-pack` is live and correctly rejects an unauthenticated
request with `401` (`A Pro license is required.`), and an invalid
`X-Alert-Ledger-License` with `403` (`This Pro license is not active.`). It
sets `Cache-Control: no-store, private` and `X-Content-Type-Options: nosniff`.
It does not rate-limit either path:

- 30 concurrent requests without a license: **30 × 401**, no `Retry-After`.
- 30 concurrent requests with an invalid license: **30 × 403**, no
  `Retry-After`.
- 100 concurrent unauthenticated requests: **100 × 401**, no `429` and no
  `Retry-After`.

The observed threshold is therefore **not reached through 100 rapid POSTs**.
There is also no rate-limit or `429` handling in the function source. This
permits an inexpensive denial-of-service burst against a public function and
does not meet the explicit acceptance contract.

## First-read and demo gate — pass

Cold opening the live 1366×768 page answers all three questions in plain
words. It is a read-only tool to “Trace every alert route change,” for
“platform teams” verifying a live baseline, and the first action is **Try it
with sample data**. The action is fully visible from y=694.44 to y=743.23 and
says it loads three realistic route changes in an isolated demo.

The action opens `/demo` in one click. The live demo shows the three
attributable changes, downloads a JSON report containing three changes, uses
only `demo:alert-config-ledger:state`, stays exactly 390 px wide at a 390 px
viewport, and made only same-origin requests. Evidence:
[cold desktop capture](verification-artifacts/verification-2-live-cold-desktop.png).

## Claims gate — pass

`.factory/claims.json` exists. After `npm ci`, every test command listed in it
passed exactly as written:

- 9 Rust demo/CLI claims: core workflow, provider inputs, Grafana contact
  points, read-only import, recipient redaction, token exclusion, exit codes,
  free core CLI, and no telemetry.
- 6 browser claims: demo privacy, offline reload, report download, web/CLI
  parity, paid template, and closed sales.

No claim test failed.

## Other verification evidence — pass

- `npm ci` completed with zero audit vulnerabilities.
- `npm test` passed: 5 library tests, 9 Rust claim tests, 3 CLI tests, 3 API
  tests, and 36 Playwright tests across desktop and 390×844 mobile.
- `npm run lint` passed Rust formatting, strict Clippy, and TypeScript checks.
- `npm run build` passed and produced `target/release/alert-ledger` and
  `dist/site/`. Initial assets are 6,178 B gzip JavaScript and 3,778 B gzip
  CSS, comfortably within budget.
- `cargo package --allow-dirty` passed package verification (57 files,
  305.3 KiB unpacked / 83.9 KiB compressed). Installing the resulting crate
  into a clean temporary prefix produced a working `alert-ledger`; its
  `--help` documented the public commands and `demo --json` returned three
  changes with recipient values redacted.
- Fresh live static hashes equal this candidate's build for
  `index-CTCpFeGq.js`, `index-Bmc-NBld.css`, and `sw.js`. Thus the failed
  rate-limit condition is a deployed product defect, not static deployment
  skew.
- Live `/`, `/demo`, `/privacy`, and `/terms` returned 200; an unknown route
  and the former public approval-template URL returned the designed HTTP 404.
  Security response policy includes HSTS, CSP, `nosniff`, strict referrer
  policy, and permissions policy.
- The deployed service worker controls `/demo`; after one online reload the
  demo reloaded offline with HTTP 200 and heading “REVIEW THREE LIVE ROUTE
  CHANGES.” The checked-in Playwright suite found no serious/critical axe
  findings, console errors, keyboard failures, desktop-first-screen issue, or
  390 px overflow across its tested routes.

## Required remediation

Add per-client rate limiting to `POST /api/approval-pack` (including rejected
license requests), returning `429` and a positive `Retry-After` after a
documented threshold. Add an integration/claim test that bursts the deployed
function or an equivalent production-shaped host. Re-run this verification
after deployment.
