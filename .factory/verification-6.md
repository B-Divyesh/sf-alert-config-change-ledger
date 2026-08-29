# Independent verification 6 — FAIL

- Candidate: `784d9778eeae05c970d8e82ec13c2fb8ccfeba5a`
- Live URL: <https://alert-config-change-ledger.sociobot.in>
- Verified: 2026-08-29
- Decision: **FAIL — release blocked by two published claims that are false or lack a registered sandbox test.**

## First-read result

Cold live-page reading passed the plain-words and demo gate.

- It does: “Trace every alert route change.”
- It is for: “platform teams who need to prove whether live alert routes match the reviewed baseline.”
- First action: visible “Try it with sample data,” with adjacent plain explanation that it loads three realistic route changes in an isolated demo.

The main landing screenshot is [verify-6-live-cold-desktop.png](verification-artifacts/verify-6-live-cold-desktop.png).

## Release-blocking findings

### P1 — unsafe and untested shell-history promise

[README.md](../README.md:39) says putting a bearer token in an environment variable means it “does not enter shell history,” then tells the user to type:

```sh
export ALERT_LEDGER_TOKEN='...'
```

That command is normally recorded by an interactive shell. The application correctly keeps tokens out of snapshots and sends them in authorization, but it cannot make this shell-history promise. Registered claim `token-exclusion` tests request authorization and snapshot exclusion; it neither names nor tests shell history.

This is inaccurate security guidance and an unlisted claim, which the claims contract makes release-blocking. Remove the assertion (or replace the example with documented shell-safe secret injection) and keep wording within a tested claim.

### P1 — published demo-state deletion promise has no claim test

The live Privacy page, generated at [site/src/main.ts](../site/src/main.ts:153), promises: “Leaving demo mode removes that demo state.” This promise is absent from [claims.json](claims.json:1), and no tagged test exists.

Manual live verification confirms the implementation currently works: `/demo` created only `demo:alert-config-ledger:state`; activating **Start for real** navigated to `/#install` and left localStorage empty. Manual observation does not satisfy the required claim sandbox.

Add a dedicated claim (for example `demo-exit-clears-state`) with a fresh-context browser test that enters `/demo`, activates **Start for real**, and asserts the demo namespace is absent. Alternatively, remove the sentence.

## Claims gate

`.factory/claims.json` exists and has 15 entries. From a clean install, every listed test passed:

| Group | Result |
| --- | --- |
| Rust/CLI claims | 9/9 passed: core workflow, provider inputs, Grafana contact points, read-only import, redaction, token exclusion, exit codes, free core, no telemetry |
| Browser/API claims | 6/6 passed: demo privacy, offline reload, report download, web/CLI parity, paid template, sales closed |
| Full suite rerun | `npm test`: 17 Rust tests, 7 API tests, and 38 Playwright tests passed (1.3 min) |

The candidate fails because the claims gate also requires every published claim to be listed and tested.

## Local quality and CLI evidence

- `npm ci` passed; 24 packages installed, zero audit vulnerabilities.
- `cargo fmt --all -- --check`, `cargo clippy --all-targets --all-features -- -D warnings`, and `npm run typecheck` passed.
- `npm run build` produced `target/release/alert-ledger` and `dist/site/`.
- `cargo package --allow-dirty` passed; package verified (57 files, 306.3 KiB unpacked / 84.1 KiB compressed).
- A clean `cargo install --path . --locked --root <temp>` succeeded; installed `alert-ledger 0.1.0` demo JSON returned three changes with no raw recipient endpoint.
- Release binary normalized 4 reviewed and 5 live Grafana routes; diff reported 3 changes and 2 matches with exit 2. A self-diff exited 0; unsupported provider exited 1.
- Initial JavaScript is 16,972 bytes (6,178 gzip) and CSS is 13,291 bytes (3,805 gzip), within static budgets. No third-party scripts or fonts are loaded.

## Live deployment, privacy, and API

- Fresh local/live SHA-256 hashes matched for `index.html`, hashed JS/CSS, `sw.js`, hero art, terminal SVG, and favicon. The live footer is `v0.1.0 · build 002`. This is not a deployment-only failure.
- `/`, `/demo`, `/privacy`, `/terms`, robots, sitemap, and designed `/404.html` return 200; an unknown route returns designed 404.
- Normal desktop and 390 px demo flows made only same-origin requests. Demo storage contained only `demo:alert-config-ledger:state`. Downloaded report contained exactly 3 changes and no raw email/webhook endpoint.
- Normal routes recorded no console/page errors. The intentional unknown-route request produced only the expected browser failed-resource 404 diagnostic.
- Response headers include CSP with response-header `frame-ancestors`, HSTS, `nosniff`, strict referrer policy, and permissions policy. HTML/service worker revalidate after 30 seconds; hashed JS is one-year immutable.
- The POST-only approval-pack endpoint was rate-limited live. A fresh single-client 25-request burst returned 20 × 401 then 5 × 429. Each 429 supplied `Retry-After` (57 seconds observed) and `Cache-Control: no-store, private`. Observed allowance: **20 requests per 60 seconds**.
- There is no sign-in flow, so no identity tenant applies.

## Accessibility, responsive, and offline

- On `/`, `/demo`, `/privacy`, `/terms`, `/missing-tape`, and `/404.html`: one h1, one main, route-specific titles, and no axe serious/critical violations.
- At desktop and 390 px mobile the demo had no horizontal overflow. First Tab targets the skip link, its focus outline is 3 px, and Enter moves focus to `main`.
- With reduced motion, computed scroll behavior is `auto`.
- The live service worker controls the demo. After first visit/reload, offline reload returned 200 and showed the offline notice plus the three-change comparison.

## Retest required

1. Remove/correct the false shell-history wording and ensure remaining privacy promises map to registered claims.
2. Add the missing demo-exit claim test, or remove that public statement.
3. Rerun every `claims.json` command, `npm test`, lint/typecheck, build/package, and live privacy checks.

No product code was modified during this verification; only this report and the handoff were added/updated.

