# Repair 3 handoff — verified and deployed

Work order: `alert-config-change-ledger-repair-3`.

## Release status

**PASS.** This repair resolves both release blockers from
`.factory/verification-3.md`: production now deploys the
`/api/approval-pack` Azure Function with the static site, and its live rapid
burst protection returns `429` with a positive `Retry-After`.

## What changed

- Added the checked-in `swa-cli.config.json` production contract. It explicitly
  deploys `dist/site`, `api`, Node 20, and the `sf-alert-config-change-ledger`
  Static Web App in the `sociobot` resource group.
- Declared `platform.apiRuntime: node:20` in the deployed Static Web Apps
  configuration so API deployment does not depend on a remembered CLI flag.
- Added a browser regression test that fails if the production configuration
  stops including `api/`, the Node runtime, or the `approval-pack` route.
- Added documented `npm run deploy` and `npm run deploy:check` commands. The
  README now states that the production command ships both the site and API.

## Commit and deployment

- `baa347f fix: make production API deployment explicit`
- Pushed to `origin/main`.
- Deployed the checked-in `production` configuration to
  `https://alert-config-change-ledger.sociobot.in`. Azure Static Web Apps
  confirmed both inputs: `/work/repo/dist/site` and `/work/repo/api`.

## Verification evidence

```sh
npm ci
npm test
npm run lint
npm run build
cargo package --allow-dirty
```

- Clean `npm ci`: 24 packages installed; `npm audit` reported 0
  vulnerabilities.
- `npm test`: 17 Rust tests, 7 API tests, and 38 Playwright tests passed.
  The API suite includes the HTTP-shaped 25-request rate-limit regression;
  browser coverage includes the new production API deployment contract.
- `npm run lint`: `cargo fmt --check`, strict Clippy, and TypeScript typecheck
  passed.
- `npm run build`: produced `target/release/alert-ledger` and `dist/site`.
  Initial JS is 6.12 KB gzip and CSS is 3.78 KB gzip.
- `cargo package --allow-dirty`: passed (57 files; 305.3 KiB unpacked,
  83.9 KiB compressed). A fresh temporary-prefix `cargo install` ran
  `alert-ledger --help` and `alert-ledger demo --json`; the consumer demo
  reported 3 changes and 2 matched routes.
- `npm run deploy:check` resolved the exact production static output, API
  folder, Node 20 runtime, and built `staticwebapp.config.json`. The command
  has no deployment token in a clean shell, so the CLI correctly did not
  publish from its dry-run path. The authenticated production deployment then
  completed with the same checked-in configuration.

## Live production evidence

- `POST /api/approval-pack` without a license returns `401`,
  `Cache-Control: no-store, private`, and `X-Content-Type-Options: nosniff`.
- A fresh 100-request unauthenticated burst returned **30 × 401** and
  **70 × 429**. Every throttled response had a positive `Retry-After`
  (`49`, `50`, or `60` seconds observed).
- Local and canonical `index-CTCpFeGq.js` SHA-256 values match:
  `71b6cf6ea64ff94b4e376494025c4721ae23f85890275da3c67335f61672e650`.
  Local and canonical `index-Bmc-NBld.css` SHA-256 values match:
  `61f38fd8fef0547b67c5b2a8fbc48065b2799d5ecf5280fa240da3660315822c`.
- Live desktop checks found `lang=en`, one `h1`, one `main`, a working skip
  link, no console/page errors, and no serious or critical Axe violations on
  `/`, `/demo`, `/privacy`, or `/terms`.
- At 390×844, `/demo` has `scrollWidth === clientWidth === 390`. The demo
  uses only `demo:alert-config-ledger:state`, made no cross-origin requests,
  updated its service worker, and reloaded offline with its bundled comparison.
- `/missing-tape` returns HTTP 404. Live responses retain HSTS, CSP, nosniff,
  strict referrer policy, and permissions policy.

## Run and deploy

```sh
npm ci
npm test
npm run lint
npm run build
cargo package --allow-dirty
npm run deploy
```

CLI demo: `cargo run -- demo --json`

Web demo: `https://alert-config-change-ledger.sociobot.in/demo`

## Known gaps

None. New Pro sales remain intentionally closed; existing-license approval
packs stay server-authorized and rate-limited.
