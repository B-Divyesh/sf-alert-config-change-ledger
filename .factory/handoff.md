# Polish 2 handoff

- Work order: `alert-config-change-ledger-polish-2`
- Date: 29 August 2026 UTC
- Base: `49f1585aadb40afb7a397e64fb19d324ebba8017`
- Repair commit: `8d4e28c0a6e6674f46527511a496db3688b4d61e`
- Production: <https://alert-config-change-ledger.sociobot.in>
- Result: **PASS — zero unresolved review findings**

## What changed

- Added the `change-timestamps` claim. JSON already attributed each change to
  the live snapshot; Markdown reports now put that timestamp beside every
  change in a dedicated column.
- Added the `pro-pack-contents` claim against the real approval-pack handler.
  It verifies the reusable Route changes, Evidence, and Sign-off sections and
  the Reviewer, Date, and Follow-up fields.
- Expanded `.factory/claims.json` from 18 to 20 entries and supplied an exact,
  independently runnable test command for each new claim.
- Updated the catalog line to a 109-character verb-first description and
  refreshed the full landing copy audit.
- Preserved and rechecked all 22 Polish 1 repairs, including first-screen
  copy, the isolated `?demo=1` path, mobile layout, route metadata, focus,
  404 behavior, legal links, terminology, and the cassette-zine identity.
- Recorded every finding-to-fix-to-evidence mapping in
  [`.factory/polish-2.md`](polish-2.md).

## Verification

Commands run for the release:

```sh
npm test
npm run lint
npm run build
npm run test:claims-clean
npm run deploy:check
cargo package --allow-dirty
npm run deploy
node .factory/qa-artifacts/polish-2/live-audit.mjs
/opt/fleet/lib/verify-url.sh https://alert-config-change-ledger.sociobot.in .factory/qa-artifacts/polish-2/live
```

Observed results:

- Full suite: 25 Rust, 13 API, and 52 browser tests passed.
- Clean clone: all 20 claim commands passed in ledger order, including the new
  timestamp and real-handler Pro pack tests.
- Production build: `dist/site/` exists; initial JavaScript is 7.00 KB gzip
  and CSS is 3.82 KB gzip.
- CLI package: 21 files, 125.1 KiB unpacked, 31.3 KiB compressed.
- Deployment check: the dry-run build and path validation completed; the SWA
  client then reported that dry-run mode had no deployment token. The following
  production command authenticated through Azure and deployed successfully.
- Live Lighthouse: performance 100, accessibility 100, best practices 100,
  SEO 100; LCP 1.7 s, CLS 0, TBT 50 ms.
- Cold live browser: first-screen action and three facts fit at 1366 × 768 and
  390 × 844; no 390 px or 200% text overflow; no sub-44 px touch targets.
- Live routes: `/`, `/demo`, `/privacy`, `/terms`, and `/404.html` returned
  their designed pages; an unknown path returned HTTP 404. Titles, metadata,
  canonicals, H1/main structure, focus, Back navigation, and links passed.
- Live accessibility: zero serious or critical Axe violations on all checked
  routes; visible 3 px focus; reduced motion passed; normal routes had no
  console errors.
- Live demo: `/?demo=1` opened sample data directly, stayed same-origin, used
  only `demo:alert-config-ledger:` storage, reset correctly, downloaded three
  timestamped changes, cleared demo data on exit, and reloaded offline.
- Live approval API: an unlicensed POST returned 401, private/no-store,
  `nosniff`, and the deployed Azure Table limiter marker. Valid-content shape
  is proved without a live paid token by the real-handler claim fixture.

Evidence:

- [Cumulative finding map](polish-2.md)
- [Clean-clone claim log](qa-artifacts/polish-2/clean-claims.txt)
- [Cold live browser audit](qa-artifacts/polish-2/live/live-audit.json)
- [Live URL verifier](qa-artifacts/polish-2/live/verify.json)
- [Live Lighthouse](qa-artifacts/polish-2/live/lighthouse.json)
- [Desktop first screen](qa-artifacts/polish-2/live/landing-desktop-1366x768.png)
- [Mobile first screen](qa-artifacts/polish-2/live/landing-mobile-390x844.png)
- [Mobile demo](qa-artifacts/polish-2/live/demo-mobile-390x844.png)
- [Mobile offline demo](qa-artifacts/polish-2/live/demo-mobile-offline.png)

## Known gaps and next steps

None. New Pro sales remain intentionally closed, as documented and claim-tested;
existing licenses continue to work through the deployed same-origin handler.
