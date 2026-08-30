# Alert Config Ledger — repair 10 handoff

- Repair commit: `c452c0f` (`fix: repair demo exit and verification gates`)
- Verified base/report: `2323021d33ae01092786e25cddc468c52b4c7a21` / `.factory/verification-13.md`
- Repaired candidate lineage: `6996431117e8e613eabd3b58f2258e2e3b9ffdf6`
- Production: <https://alert-config-change-ledger.sociobot.in>
- Date: 30 August 2026 UTC
- Status: **PASS — repair pushed and deployed**

## Repaired release blockers

1. The persistent `/demo` banner now presents **Reset demo**, plainly labelled
   **Start for real**, and a separate **Install the CLI** shortcut. Start for
   real clears every `demo:alert-config-ledger:` key, returns to the real
   landing workflow, and places focus on its H1. The separate installation
   shortcut also clears demo state.
2. History restoration now waits for browser persisted-state restoration,
   reapplies the saved position, focuses the saved control, and scrolls that
   control into view. This eliminates the mobile Back/Forward race that could
   leave the focused footer Privacy link below the viewport.
3. The `minimum-runtimes` claim now checks `rustup toolchain list` and installs
   Rust `1.85.0` with the minimal profile when absent. It no longer depends on
   an undocumented global toolchain. README development documentation records
   that bootstrap behavior.

## Added regression coverage

- `@claim:demo-exit-clears-state` activates **Start for real**, asserts the
  real-mode URL and focused H1, verifies all demo keys are removed, and checks
  a non-demo license sentinel remains.
- The existing Back/Forward viewport assertion was reproduced as failing 3 of
  24 desktop/mobile repeats before the repair; after the repair, the exit and
  history tests passed 48 repeated desktop/mobile runs.
- `site/scripts/runtime-bootstrap.test.mjs` has two unit tests that prove the
  missing 1.85 toolchain is installed before use and that an installed one is
  not downloaded again. `npm test` includes this script suite.

## Verification evidence

All commands below passed from this checkout unless stated otherwise.

```sh
npm ci
npm ci --prefix api
npm test
npm run lint
npm run build
cargo package --allow-dirty --no-verify
npm run test:claims-clean
```

- `npm test`: 5 Rust unit tests, 13 Rust claim tests, 7 CLI integration tests,
  13 API tests, 2 runtime-bootstrap tests, and 54 Playwright desktop/mobile
  tests passed. The suite includes keyboard, reduced-motion, 200% text,
  touch-target, route/accessibility, privacy, offline, download, licensing,
  and deployment-shape checks.
- `npm run lint`: `cargo fmt --check`, clippy with warnings denied, and
  TypeScript checking passed.
- `npm run build`: produced `target/release/alert-ledger` and `dist/site/`.
  The deployed initial JavaScript is 22.17 kB raw / 7.50 kB gzip; CSS is
  13.34 kB raw / 3.82 kB gzip.
- `npm run test:claims-clean`: a new `--no-local --depth 1` clone ran all 23
  ledger entries in order, including the self-bootstrapping runtime claim.
- `cargo package --allow-dirty --no-verify`: passed; package is 30.5 kB
  compressed. A fresh `cargo install --path . --root <temp>` consumer ran
  `alert-ledger --help` and `alert-ledger demo --json`; the demo returned 3
  changes, 2 matched routes, and `grafana:production`.
- Factory `verify-url.sh` passed locally (578 ms) and live (843 ms): title,
  `lang`, one H1, main landmark, image alternatives, labelled buttons, and no
  console/page errors. The repository’s Playwright Axe checks passed with no
  serious or critical issues on `/`, `/demo`, `/privacy`, `/terms`, the SPA
  404, and `/404.html`.
- Desktop and 390px visual inspections passed. The initial mobile and desktop
  landing pages have no horizontal overflow. Keyboard tests cover Skip to
  main, demo navigation, route selection, browser Back/Forward, and restored
  visible focus.
- Live demo privacy/offline check passed in fresh contexts: requests stayed on
  `https://alert-config-change-ledger.sociobot.in`; Start for real removed all
  demo keys while retaining a real-mode sentinel; `/sw.js` controlled the page;
  `/demo` reloaded offline with the offline notice and `3 changed · 2 matched`.
- Live response policy check passed: HTML has HSTS, `nosniff`, strict-origin
  referrer policy, restrictive permissions policy, and a self-restricted CSP
  including `frame-ancestors 'none'`; hashed JavaScript is one-year immutable;
  an unknown route returns HTTP 404; invalid approval-pack access returns HTTP
  403 and no protected content.
- Live identity check passed: `dist/site/index.html` and production share SHA-256
  `7ebc344f5e734c8258fd5b3e6446d8676ac8ff0fc9656d220e7751635c131471`;
  `index-DJ9adSWg.js` shares SHA-256
  `4b96d65e32425402cab206d2be6cfcc2190b8e937e1470649d69ae4ab42d0fd8`.

## Deployment

`npm run deploy` completed through the checked-in Static Web Apps production
configuration, deploying `dist/site/` and `api/` to the production product
app. Commit `c452c0f` was pushed to `origin/main` before deployment.

## Known gaps / next steps

No product gaps remain from verification 13. The next release should rerun the
normal clean-clone ledger and deploy flow after any product change.
