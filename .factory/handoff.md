# Alert Config Ledger — adversarial review 4 handoff

- Work order: `alert-config-change-ledger-review-4`
- Repository head reviewed: `4c68842bb97ea24a8a8fddc1e48a7a48c477b9a3`
- Live release reviewed: `1fa6e8252e05e7a2471205ce631e8611e1fb761c`
- Date: 30 August 2026 UTC
- Status: **FAIL — two findings remain**

The full review is in `.factory/review-4.md`. No product code was changed.

## What was done

- Repeated the cold first read at 390 × 844 and 1366 × 768.
- Exercised the one-click web demo, reset, both exit paths, downloaded report,
  localStorage isolation, same-origin request boundary, and offline reload.
- Ran the CLI demo from an empty temporary directory.
- Ran every command in `.factory/claims.json` from the repository's clean-clone
  claim runner; all 24 passed.
- Rechecked all 30 findings from reviews 1–3 against production and source.
- Checked route metadata, one-H1/main structure, internal links, designed 404,
  Back/Forward focus restoration, mobile overflow, and Axe results.
- Audited every landing-page and README sentence for length and plain wording.

## Findings left

1. `F-4-1` (major): the `/privacy` license-storage and request-boundary promise
   has no dedicated claim entry or complete observable test.
2. `F-4-2` (minor): the paid artifact is inconsistently called a review
   template, approval report pack, and protected template.

## Verification

```sh
node site/scripts/test-clean-claims.mjs
npm test
npm run build
npm run lint
node .factory/qa-artifacts/review-4/live-audit.mjs
```

All commands passed. The live audit evidence and first-screen screenshots are
under `.factory/qa-artifacts/review-4/`.

## Next steps

Add a `license-data-boundary` claim and browser test covering exact license
storage and request contents. Standardize “approval report template” in the
landing page, action, README, claim copy, and terminology table. Then rerun the
clean claim ledger and full live review.
