# Alert Config Ledger — Polish 3 handoff

- Work order: `alert-config-change-ledger-polish-3`
- Base candidate: `5f26ae5e2f8e01cdbfba140346ebe23a4930b9a0`
- Repair commits: `7f13583`, `af42294`, `2a19cc3`
- Production: <https://alert-config-change-ledger.sociobot.in>
- Date: 29 August 2026 UTC
- Status: complete — committed, pushed, deployed, and cold-checked in production.

## Delivered repairs

- Preserved the cassette-ledger visual identity while making every first-screen and section label concrete, bounded, and plain.
- Kept `?demo=1` as an isolated one-click sample path with a persistent banner, reset, explicit exit, and demo-prefixed browser storage only.
- Added the missing claim coverage: Alertmanager JSON, Rust/Node minimum versions, release build artifacts, and production deployment shape.
- Added route metadata, real route handling, 404 behavior, responsive layout checks, and Back/Forward scroll-plus-focus restoration.
- Reworded the deployment secret sentence as an actionable deployer instruction instead of an unprovable production assertion.

## Verification completed locally

```sh
npm test
npm run lint
npm run build
cargo package --allow-dirty
npm run test:claim:minimum-runtimes
npm run test:claim:build-artifacts
node site/scripts/test-clean-claims.mjs
/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173 .factory/qa-artifacts/polish-3/local
```

- `npm test`: passed — 25 Rust tests, 13 API tests, and 54 Playwright tests.
- The clean-clone ledger passed all 23 `.factory/claims.json` entries. It runs each recorded command once from a fresh dependency-free copy; the bootstrap entry accounts for the runner itself.
- Minimum runtime claim passed with Rust 1.85.0 and Node 22.12.0.
- Build-artifact claim produced and executed `target/release/alert-ledger`, then verified the Vite site entry and hashed assets under `dist/site/`.
- Lint, release build, and `cargo package --allow-dirty` passed.
- Local URL verification reported no console errors, `lang=en`, exactly one H1 and one main landmark, and no images without alt text.
- Playwright Axe coverage passed with no serious or critical findings on landing, demo, legal, and 404 routes.
- Lighthouse (mobile): Performance 99, Accessibility 100, Best Practices 100, SEO 100; LCP 2.12 s, CLS 0, TBT 60 ms.

Evidence lives in [`.factory/qa-artifacts/polish-3`](qa-artifacts/polish-3) and the complete finding map is [`.factory/polish-3.md`](polish-3.md).

## Production deployment and cold check

- Deployed through `npm run deploy` using `swa-cli.config.json`; Static Web Apps accepted both `dist/site` and `api` and published the revision to the configured production app.
- Opened <https://alert-config-change-ledger.sociobot.in> cold after deployment. [The production audit](qa-artifacts/polish-3/live/live-audit.json) passed all landing, demo, legal, 404, metadata, focus/history, offline, and mobile checks.
- The audit confirms the F-3-1 state transition: footer Privacy was focused at scroll position 1815, browser Back restored that same control at 1815, and Forward focused the Privacy H1 at position 0.
- [Production verification](qa-artifacts/polish-3/live/verify.json) reports HTTP 200, no console errors, `lang=en`, one H1, a main landmark, and no missing image alt text. Production screenshots are saved beside that report.

## Run, test, and deploy

```sh
npm ci
npm test
npm run build
npm run deploy
```

For the CLI only: `cargo run -- demo`. The browser demo opens directly at `/?demo=1` or `/demo`; Reset demo reseeds isolated sample keys, and Install the CLI clears them before returning home.

## Known gaps

None.
