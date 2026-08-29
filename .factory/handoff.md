# Adversarial review 3 handoff

- Work order: `alert-config-change-ledger-review-3`
- Candidate: `b64ecc111e7713527b69f7f37ab50a8ab118e185`
- Production: <https://alert-config-change-ledger.sociobot.in>
- Date: 29 August 2026 UTC
- Result: **FAIL — one blocking and five minor findings**

No product code was changed. The full evidence, copy audit, claim results, and
fix instructions are in [`.factory/review-3.md`](review-3.md).

## What was done

- Opened production cold in fresh 390 × 844 and 1366 × 768 Chromium contexts.
- Exercised the one-click demo, clear/reset/exit, demo storage isolation,
  same-origin request log, report state, service worker, and offline reload.
- Ran all 20 `.factory/claims.json` commands from the repository's clean-clone
  runner, plus the CLI demo from a new temporary working directory.
- Audited every landing and README sentence, prior review/polish finding,
  route, metadata field, link, 404, history behavior, and visual identity.
- Ran live Axe scans and checked normal-route console output and mobile overflow.
- Ran the complete local tests, build, and lint/type checks.

## Verification commands

```sh
npm ci
node site/scripts/test-clean-claims.mjs
npm test
npm run build
npm run lint
cargo build --bin alert-ledger
```

All commands passed. `npm test` completed 25 Rust tests, 13 API tests, and 52
browser tests. The build produced the release binary and `dist/site/`.

## Known gaps and next steps

1. Fix Back/Forward restoration so the prior focused control returns without
   disrupting scroll restoration; add an explicit browser test. This is blocking.
2. Register and test Alertmanager JSON, minimum runtime versions, build
   artifacts, and deployment shape, or narrow their README wording.
3. Rewrite the production secret-setting statement as a deployer instruction,
   unless an observable claim test can prove it.

After those changes, rerun the clean claim ledger and the complete review.
