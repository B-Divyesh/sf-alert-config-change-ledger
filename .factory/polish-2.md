# Polish 2 — cumulative review findings closed

- Work order: `alert-config-change-ledger-polish-2`
- Reviewed base: `49f1585aadb40afb7a397e64fb19d324ebba8017`
- Repaired release: `8d4e28c0a6e6674f46527511a496db3688b4d61e`
- Reviews: [`review-1.md`](review-1.md), [`review-2.md`](review-2.md)
- Live URL: <https://alert-config-change-ledger.sociobot.in>
- Result: **PASS — all 24 cumulative findings closed**

Every row was checked again after the production deployment. The main live
record is [`live/live-audit.json`](qa-artifacts/polish-2/live/live-audit.json).
It covers the cold first screen, exact copy, real routes and metadata, focus,
links, 404, Axe, mobile reflow, touch targets, demo storage, reset and exit,
same-origin requests, report download, offline reload, and reduced motion.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Kept the bounded H1, “Compare reviewed and live alert routes.” | `landing has the required structure and no serious accessibility issues`; [live desktop](qa-artifacts/polish-2/live/landing-desktop-1366x768.png); live audit `firstScreen`. |
| F-1-2 | Kept normalized ledger snapshots as a registered input with a temporary-directory comparison test. | `@claim:normalized-snapshot-input`; [clean-clone log](qa-artifacts/polish-2/clean-claims.txt). |
| F-1-3 | Kept “sample” in the landing action and README; removed the subjective “realistic.” | [`copy-audit.md`](copy-audit.md); live audit rejects the retired copy. |
| F-1-4 | Kept the reduced hero scale and spacing so the action and all three facts fit at 1366 × 768 and 390 × 844. | `first screen includes the action and all three facts on common desktop viewports`; [desktop](qa-artifacts/polish-2/live/landing-desktop-1366x768.png); [mobile](qa-artifacts/polish-2/live/landing-mobile-390x844.png). |
| F-1-5 | Kept the factual eyebrow, “Read-only alert route comparison.” | Live audit exact-copy check; [`copy-audit.md`](copy-audit.md). |
| F-1-6 | Kept “Reviewed baseline on the left.” | Live audit exact-copy check; live desktop screenshot. |
| F-1-7 | Kept “Live configuration on the right.” | Live audit exact-copy check; live desktop screenshot. |
| F-1-8 | Kept “CLI demo / actual command.” | Live audit exact-copy check; [`copy-audit.md`](copy-audit.md). |
| F-1-9 | Kept the plain heading “Sample CLI comparison.” | Live audit exact-copy check; [`copy-audit.md`](copy-audit.md). |
| F-1-10 | Kept the workflow label “Three steps.” | Live audit exact-copy check; [`copy-audit.md`](copy-audit.md). |
| F-1-11 | Kept the installation label “Install the CLI.” | Live audit exact-copy check; live link crawl confirms the source and install destinations. |
| F-1-12 | Kept the boundary label “Read-only limits.” | Live audit exact-copy check; [`copy-audit.md`](copy-audit.md). |
| F-1-13 | Kept the paid label “Optional Pro feature.” | Live audit exact-copy check; [`copy-audit.md`](copy-audit.md). |
| F-1-14 | Kept the demo exit action “Install the CLI”; it deletes only demo-prefixed data and opens `/#install`. | `@claim:demo-exit-clears-state`; live audit `demo.exit`; [live demo](qa-artifacts/polish-2/live/demo-mobile-390x844.png). |
| F-1-15 | Kept “Import provider exports.” | Live audit exact-copy check; [`copy-audit.md`](copy-audit.md). |
| F-1-16 | Kept “Put routes in one format,” followed by a concrete SHA-256 explanation. | Live audit exact-copy check; `@claim:recipient-redaction`. |
| F-1-17 | Kept “Show route changes.” | Live audit exact-copy check; [`copy-audit.md`](copy-audit.md). |
| F-1-18 | Kept the README explanation that recipient addresses and URLs become SHA-256 identifiers during import. | `@claim:recipient-redaction`; clean-clone log. |
| F-1-19 | Kept “change” throughout public prose and reports; `DRIFT` is not exposed as a second public term. | [`copy-audit.md`](copy-audit.md); full Rust and browser suites. |
| F-1-20 | Kept “recipient endpoints” as the single README and landing term. | [`copy-audit.md`](copy-audit.md); `@claim:recipient-redaction`. |
| F-1-21 | Kept the plain README explanation that demo browser keys start with `demo:alert-config-ledger:`. | `@claim:demo-privacy`; live audit `demo.storageKeys` and `demo.exit`. |
| F-1-22 | Kept route-specific titles, descriptions, canonicals, Open Graph, and Twitter values for `/`, `/demo`, `/privacy`, and `/terms`. | `each route sets route-specific metadata`; live audit `routes`; live `verify.json`. |
| F-2-1 | Added `change-timestamps`; Markdown now has a Source timestamp column, and the clean test checks the JSON attribution and every Markdown change row. | `cargo test --test claims claim_change_timestamps_appear_on_every_report_change`; clean-clone log; live demo download check in `live-audit.json`. |
| F-2-2 | Added `pro-pack-contents`; the claim calls the real approval-pack handler with a recorded valid verdict and asserts Route changes, Evidence, Sign-off, and all sign-off fields. | `npm run test:claim:pro-pack-contents`; clean-clone log; live endpoint returns the expected gated 401 in [`approval-unauthorized-headers.txt`](qa-artifacts/polish-2/live/approval-unauthorized-headers.txt). |

## Release evidence

- All 20 claim commands ran once from a dependency-free Git clone and passed:
  [`clean-claims.txt`](qa-artifacts/polish-2/clean-claims.txt).
- `npm test`: 25 Rust tests, 13 API tests, and 52 Chromium/mobile browser
  tests passed.
- `npm run lint`, `npm run build`, and `cargo package --allow-dirty` passed.
  The deployment dry run validated the build and paths before the authenticated
  production deployment. The site build is 7.00 KB
  gzip JavaScript and 3.82 KB gzip CSS; the crate is 31.3 KiB compressed.
- Local Lighthouse: 99 performance and 100 accessibility, best practices,
  and SEO. Production Lighthouse: 100 in all four categories, LCP 1.7 s,
  CLS 0, and TBT 50 ms.
- The factory URL verifier found HTTP 200, one H1, one main, `lang="en"`,
  complete image alternatives, labeled buttons, and no console errors:
  [`verify.json`](qa-artifacts/polish-2/live/verify.json).
- The cold live audit returned PASS after deployment. The intended unknown URL
  returned the designed HTTP 404; its browser resource message is recorded as
  the expected result, while normal routes logged no errors.

No finding of any severity remains open.
