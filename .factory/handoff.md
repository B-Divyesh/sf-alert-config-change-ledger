# Polish 1 handoff — PASS

- Work order: `alert-config-change-ledger-polish-1`
- Repair commit: `04e4f79` (`fix: close review one polish findings`)
- Base reviewed: `c1b4d52d66cfdc9a8e8231a5054e47d9c792fc4d`
- Released URL: <https://alert-config-change-ledger.sociobot.in>
- Detailed finding map: [`.factory/polish-1.md`](polish-1.md)

## Done

All 22 findings from [review 1](review-1.md) are closed. The landing now uses plain, bounded language; every workflow label names its outcome; the direct `?demo=1` sample path is isolated and resettable; normalized snapshot input is covered by a registered claim; and route-specific metadata is verified. The static 404 was updated to match the SPA 404 so fallback delivery cannot restore old wording.

The cassette-era zine visual system remains intact. Its cassette language is now visual rather than task copy.

## Verification

From a clean clone of `04e4f79` after `npm ci` and `npm ci --prefix api`, every exact command in `.factory/claims.json` passed: 17/17.

```sh
npm test                 # 22 Rust tests, 12 API tests, 52 Playwright tests
npm run build            # target/release/alert-ledger and dist/site/
npm run lint             # rustfmt, clippy, TypeScript
```

Additional evidence:

- `VERIFY_NODE_MODULES=/work/repo/node_modules /opt/fleet/lib/verify-url.sh https://alert-config-change-ledger.sociobot.in …` passed: HTTP 200, title, `lang`, one `h1`, one `main`, image alternatives, labeled buttons, and no console errors.
- Playwright Axe passed with zero serious/critical violations on `/`, `/demo`, `/privacy`, and `/terms`, locally and on the cold live site.
- The cold live browser check verified all route metadata, all desktop first-screen facts at 1366×768, `?demo=1` banner/reset/isolation, same-origin-only demo requests, and the 404 page.
- Mobile Lighthouse: Performance 99, Accessibility 100. Report: [`qa-artifacts/polish-1-lighthouse.json`](qa-artifacts/polish-1-lighthouse.json).
- Live screenshots: [`qa-artifacts/polish-1-live-desktop.png`](qa-artifacts/polish-1-live-desktop.png) and [`qa-artifacts/polish-1-live-demo-mobile.png`](qa-artifacts/polish-1-live-demo-mobile.png).
- Production deployment used `swa-cli.config.json` and the factory-managed Static Web Apps credential. Azure confirmed deployment to the product Static Web App; the custom product URL was then checked cold.

## Run and publish

```sh
npm ci
npm ci --prefix api
npm test
npm run build
cargo run -- demo
```

The factory owns registry publishing. To prepare the CLI package, run `cargo package`; do not publish from this repository.

## Known gaps

None.
