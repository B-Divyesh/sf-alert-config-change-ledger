# Repair handoff — alert-config-change-ledger-repair-9

- Work order: `alert-config-change-ledger-repair-9`
- Base examined: `8ae1e41482092b3c918d97ed8d6f3787baab63a0`
- Independent report: [verification-10.md](verification-10.md)
- Artifact and deployment class: Rust CLI with static landing site and Azure Static Web Apps API function
- Visible deployed build stamp: `v0.1.0 · build 004`

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
- `npm run deploy:check`: the configured production shape found `dist/site/`, `api/`, Node 20, and `staticwebapp.config.json`. The CLI reported that no `deployment_token` is available in this container, so the dry-run did not publish.
- Factory structural check: [repair-9-local/verify.json](qa-artifacts/repair-9-local/verify.json) — HTTP 200, correct title and `lang`, one H1 and main, no missing image alternatives or unlabeled buttons, and no console/page errors. Desktop and 390 px captures are beside it.
- Playwright's Axe integration found zero serious or critical issues on all routes. Its keyboard test covers skip link, visible 3 px focus ring, Enter navigation, and Space route selection. Its privacy, demo storage isolation/cleanup, service-worker update/offline reload, 200% text, reduced motion, and 44 px mobile target tests passed.
- Lighthouse mobile local result: 99 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 2,183 ms, CLS 0, 184,532 bytes transfer. Report: [repair-9-local/lighthouse.json](qa-artifacts/repair-9-local/lighthouse.json). Lighthouse was run against the final build with the preinstalled Playwright Chromium and `--disable-full-page-screenshot` (needed to avoid a container-only Chrome screenshot crash).

## Deploy and live follow-up

Run `npm run deploy` after a Static Web Apps deployment token is made available to the deployment environment, then verify the custom domain and `build 004` footer with `/opt/fleet/lib/verify-url.sh`, the live response headers, and local/live SHA-256 asset comparison. No DNS, billing, or infrastructure setting was changed from this repository.

## Known gap

No production publish was possible in this worker because the configured SWA CLI has no `deployment_token`; this is an environment credential gap, not a product or build failure. All local release gates, clean-clone claim coverage, package-consumer coverage, and deployment-shape checks pass.
