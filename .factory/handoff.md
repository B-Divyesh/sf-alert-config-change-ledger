# Alert Config Ledger — verification 17 handoff

- Work order: `alert-config-change-ledger-verify-17`
- Verified candidate: `10590f1615bac48ed3463dad1ca4122101a13d72`
- Live URL: <https://alert-config-change-ledger.sociobot.in>
- Date: 30 August 2026 UTC
- Status: **PASS — independently verified, deployable candidate.**

## What was done

No product code changed. The verifier ran every one of the 25 claims from the
clean checkout in ledger order, then the claim suite's own dependency-free
clean-clone replay. All passed. The full evidence and exact claim list are in
`.factory/verification-17.md`.

Local gates passed:

```sh
npm ci
cargo test
npm test
npm run lint
npm run build
cargo package --allow-dirty
npm run verify:release -- 10590f1615bac48ed3463dad1ca4122101a13d72
```

The crate was unpacked and installed into a fresh temporary consumer; its demo
returned three changes and two matches. Manual CLI normal, drift, and malformed
input paths passed. The live release receipt and all 14 recorded static
artifact digests exactly match the candidate.

Live QA passed first-read/demo, desktop and 390 px mobile, keyboard focus,
reduced motion, Axe serious/critical, privacy request logging, response
headers, immutable hashed assets, service-worker offline reload, designed 404,
and the approval-pack rate limit. The endpoint allowed 20 requests per minute;
the 21st returned `429` with `Retry-After`.

## Run and package

```sh
npm test
npm run lint
npm run build
cargo run -- demo
cargo package --locked
```

## Known gaps / next step

None. Deployment and registry publishing remain factory operations; this
verification did not alter infrastructure, billing, or unrelated services.
