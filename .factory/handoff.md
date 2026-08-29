# Repair handoff — alert-config-change-ledger-repair-9

- Work order: `alert-config-change-ledger-repair-9`
- Base examined: `8ae1e41482092b3c918d97ed8d6f3787baab63a0`
- Independent report: [verification-10.md](verification-10.md)
- Artifact and deployment class: Rust CLI with static landing site and Azure Static Web Apps API function
- Visible deployed build stamp: `v0.1.0 · build 004`
- Published product candidate: `2e75bec370ce6f5199c99a680ace9329076ac6a4`

## Release-blocker repair

The verifier's requested SHA was not a Git object and therefore could not be recovered. This repair creates a new, reachable candidate on `main`; its exact SHA is recorded by the push step.

The reproduced failure was the verifier's exact pre-install command from a checkout with neither `node_modules/` directory present:

```sh
npm test -- --grep @claim:demo-privacy
```

Rust tests passed, then API test 11 failed with `Cannot find module '@azure/data-tables'` from `api/approval-pack/rate-limit.js`.

`npm test` now has a `pretest` bootstrap at [site/scripts/ensure-test-deps.mjs](../site/scripts/ensure-test-deps.mjs). It checks for the two test-time packages and, only when absent, runs locked `npm ci --ignore-scripts` commands for both the root and `api/`. It then runs the unchanged Rust, API, and Playwright suites.

Exact regression coverage is [site/scripts/test-clean-claims.mjs](../site/scripts/test-clean-claims.mjs), registered as `clean-claim-bootstrap` in [claims.json](claims.json). It creates a new no-local Git clone, asserts that both Node dependency trees are absent, runs each other ledger command in order, and asserts that the first browser claim printed both bootstrap messages and installed Playwright plus `@azure/data-tables`. `npm run test:claims-clean` completed with exit 0: all 18 ledger claims ran once, including the runner itself.

The only product-facing change is the `build 004` stamp in the normal and 404 footers, making the deployed repair observable for identity checks. Existing behavior, inputs, data handling, and CLI surface remain unchanged.

## Verification evidence

- `npm run test:claims-clean`: pass from an isolated clone without preinstalled root or API Node dependencies. The first browser claim bootstrapped both lockfiles; all 18 claims passed.
- `npm ci && npm ci --prefix api && npm test`: pass — 24 Rust tests, 12 API tests, and 52 Playwright tests across desktop Chromium and 390 px mobile.
- `npm run lint`: pass — rustfmt, Clippy with warnings denied, and TypeScript typecheck.
- `npm run build`: pass — release CLI and `dist/site/`.
- `npm audit --omit=dev` and `npm audit --prefix api --omit=dev`: zero vulnerabilities.
- `cargo package --allow-dirty --locked`: pass — 21 files, 123.1 KiB unpacked / 30.9 KiB compressed. A fresh unpacked crate installed with `cargo install --path … --root … --locked`; `alert-ledger --version` reported `0.1.0` and `alert-ledger demo --json` passed.
- `npm run deploy:check`: the configured production shape found `dist/site/`, `api/`, Node 20, and `staticwebapp.config.json`. Its dry-run path had no token, but the authenticated Azure production deploy below succeeded.
- Factory structural check: [repair-9-local/verify.json](qa-artifacts/repair-9-local/verify.json) — HTTP 200, correct title and `lang`, one H1 and main, no missing image alternatives or unlabeled buttons, and no console/page errors. Desktop and 390 px captures are beside it.
- Playwright's Axe integration found zero serious or critical issues on all routes. Its keyboard test covers skip link, visible 3 px focus ring, Enter navigation, and Space route selection. Its privacy, demo storage isolation/cleanup, service-worker update/offline reload, 200% text, reduced motion, and 44 px mobile target tests passed.
- Lighthouse mobile local result: 99 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 2,183 ms, CLS 0, 184,532 bytes transfer. Report: [repair-9-local/lighthouse.json](qa-artifacts/repair-9-local/lighthouse.json). Lighthouse was run against the final build with the preinstalled Playwright Chromium and `--disable-full-page-screenshot` (needed to avoid a container-only Chrome screenshot crash).

## Deployment and live evidence

- `npm run deploy`: pass. Azure Static Web Apps published the static site and `api/` to <https://ambitious-plant-0066aae10.7.azurestaticapps.net>; the custom domain <https://alert-config-change-ledger.sociobot.in> immediately served `build 004`.
- [repair-9-live/identity.txt](qa-artifacts/repair-9-live/identity.txt) records that `origin/main` resolved to the published candidate at the live check and SHA-256 matches for the HTML, 404 page, service worker, original art, terminal recording, final hashed JavaScript, and CSS.
- [repair-9-live/verify.json](qa-artifacts/repair-9-live/verify.json) passes on the custom domain with HTTP 200, title/lang/H1/main, image alternatives, labels, and zero console/page errors. [live-qa.json](qa-artifacts/repair-9-live/live-qa.json) additionally records desktop and 390 px routes, keyboard skip/focus/Space controls, zero serious/critical Axe findings, same-origin demo requests, redaction, storage cleanup, service-worker update and offline demo reload, 200% mobile reflow, 44 px targets, and reduced motion.
- [repair-9-live/headers.txt](qa-artifacts/repair-9-live/headers.txt) confirms HSTS, CSP with header-delivered `frame-ancestors 'none'`, `nosniff`, strict referrer policy, permissions policy, 30-second revalidation for HTML/service worker, immutable hashed assets, and revalidated original art.
- Approval-pack response policy was rechecked with a fresh client identity: 20 unauthenticated requests returned 401 and request 21 returned 429 with `Retry-After: 57`, semantic `Cache-Control: no-store, private`, build `repair-7`, and `azure-table` limiter. Evidence: [rate-statuses.txt](qa-artifacts/repair-9-live/rate-statuses.txt) and [rate-429.headers](qa-artifacts/repair-9-live/rate-429.headers).

## Known gap

None. No DNS, billing, or infrastructure setting was changed from this repository.
