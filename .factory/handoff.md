# Alert Config Ledger — Polish 4 handoff

- Work order: `alert-config-change-ledger-polish-4`
- Repaired and deployed release: `d54f36d51d1b9f6788adfd1c47888211fc801746`
- Product URL: <https://alert-config-change-ledger.sociobot.in>
- Date: 30 August 2026 UTC
- Status: **PASS — all 32 cumulative adversarial-review findings are closed**

## What changed

- Added the `license-data-boundary` claim and its browser test. It starts with
  empty storage, verifies the exact token and verdict keys, reloads without
  changing them, and records the sole external request. That request is a
  bodyless verification `GET` with the fixture license as its only query value.
- Standardized the paid download as **approval report template** in the landing
  section, valid-license action, error/announcement copy, terms, README,
  claims ledger, and terminology table.
- Updated the catalog description to a verb-first product sentence.

## Verification

The following passed for the deployed candidate:

```sh
npm test
npm run lint
npm run build
node site/scripts/test-clean-claims.mjs
cargo package --locked --allow-dirty
npm run verify:release -- d54f36d51d1b9f6788adfd1c47888211fc801746
/opt/fleet/lib/verify-url.sh https://alert-config-change-ledger.sociobot.in .factory/qa-artifacts/polish-4/verify-url
```

- The clean-clone ledger ran all 25 claim commands from a dependency-free
  checkout of `d54f36d`, including `license-data-boundary`.
- `npm test` passed 25 Rust tests, 13 API tests, 5 script tests, and 60
  Chromium/mobile Playwright tests. Lint passed rustfmt, Clippy with warnings
  denied, and TypeScript checking.
- Release verification matched all 14 static artifact digests and the API
  build header to `d54f36d`.
- Cold live audit: desktop and 390 px first screens contain the headline,
  action, and all three facts; no horizontal overflow or normal-route console
  errors. `/`, `/demo`, `/privacy`, `/terms`, and `/404.html` have one H1 and
  one main landmark; unknown routes give the designed HTTP 404. Live Axe found
  no serious or critical violations.
- The live demo opens from `?demo=1`, has only
  `demo:alert-config-ledger:state`, makes no cross-origin request, downloads
  three changes, resets, exits without touching real-mode data, and reloads
  offline after its first visit.
- Lighthouse JSON: performance 99, accessibility 100, best practices 100,
  SEO 100; LCP 1.8 s, CLS 0, TBT 90 ms.

Evidence is in `.factory/qa-artifacts/polish-4/`, especially
`live-audit.json`, `live-first-read-desktop.png`, `live-first-read-mobile.png`,
`live-demo-mobile.png`, `verify-url/verify.json`, and `lighthouse.json`.
The full finding map is `.factory/polish-4.md`.

## Run and deploy

```sh
npm test
npm run build
cargo run -- demo
npm run deploy
```

The CLI is ready to package with `cargo package --locked`; registry publishing
remains a factory operation.

## Known gaps

None.
