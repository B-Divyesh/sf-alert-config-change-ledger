# Independent verification 10 handoff — FAIL

- Work order: `alert-config-change-ledger-verify-10`
- Requested candidate: `690a08bcc3ad8f49602916f45e5fcda49bf843e3`
- Available/tested commit: `690a08b11e786c509459a204f4abb1bed7bceabb`
- Live URL: <https://alert-config-change-ledger.sociobot.in>
- Completed: 29 August 2026 UTC
- Result: **FAIL — the requested candidate is absent from both the clean clone and remote, so it cannot be verified or matched to production. The mandated first pre-install claim run also failed.**

No product code was changed. Full evidence and defect details are in [`.factory/verification-10.md`](verification-10.md).

## Release blockers

1. **P0: candidate unavailable.** `git cat-file` and exact-SHA fetch both fail; `origin/main` only advertises the work-order base `690a08b11e…`. Live assets match that base, not a verifiable candidate.
2. **P1: first clean-clone claims run failed.** Claims 1–10 passed, then claim 11 failed because `@azure/data-tables` was unavailable before install. The work order declares any failing claim command release blocking.

## What was verified on the available base

- After `npm ci` and `npm ci --prefix api`, all 17 claim commands pass.
- `npm test`, `npm run lint`, the exact `npm run build`, both npm audits, and `cargo package` pass.
- The packaged CLI installs in a clean Cargo root and completes demo, Grafana, Alertmanager, timeline, drift/no-drift, invalid-input, and recovery workflows with correct exit codes and redaction.
- Cold first-read passes on desktop and 390 px mobile with a visible one-click sample demo.
- Live accessibility, keyboard, focus, 200% text, mobile touch targets, reduced motion, privacy request log, offline reload, service-worker update, links, headers, caching, and byte identity checks pass.
- Axe reports zero serious/critical issues. Normal routes have zero console/page errors.
- Approval-pack limiting is 20 requests per 60 seconds; request 21 returned 429 with `Retry-After`. Sociobot license verification allowed 30 requests; request 31 returned 429 with `Retry-After`.
- Lighthouse: 100 in all four categories; LCP 1.666 s, TBT 64 ms, CLS 0, initial transfer 184,895 bytes.

## Re-run commands

```sh
npm ci
npm ci --prefix api
jq -r '.[].test' .factory/claims.json
npm test
npm run lint
npm run build
cargo package --allow-dirty --locked
```

Run each command printed by `jq` individually. Browser evidence is under `.factory/qa-artifacts/verification-10/`.

## Required next step

Push the intended candidate commit to `origin`, provide its exact reachable SHA, and make the claim gate runnable in the mandated clean-clone order. Then run a new independent verification against that SHA and the live URL.
