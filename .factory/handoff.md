# Alert Config Ledger — verification 16 handoff

- Work order: `alert-config-change-ledger-verify-16`
- Verified candidate: `1fa6e8252e05e7a2471205ce631e8611e1fb761c`
- Production: <https://alert-config-change-ledger.sociobot.in>
- Date: 30 August 2026 UTC
- Status: **PASS — the live deployment exactly matches the verified candidate**

The full evidence and release decision are in `.factory/verification-16.md`.
The verifier changed no product code.

## Verification summary

- All 24 claim-ledger commands passed, including the clean-clone bootstrap.
- `npm test`, `npm run lint`, `npm run build`, `cargo package --locked`, and a
  fresh consumer CLI install all passed.
- Live release receipt, all 14 public artifact SHA-256 digests, and the API
  build header match candidate `1fa6e8252e05e7a2471205ce631e8611e1fb761c`.
- The live demo, offline reload, keyboard flow, Axe checks, 390 px layout,
  privacy request log, response headers, caching, and rate limiting passed.
- Approval-pack allowance observed live: 20 requests per 60 seconds; request
  21 returned 429 with `Retry-After`.
- No release defects were found.

## How to reproduce

```sh
npm ci
npm test
npm run lint
npm run build
npm run verify:release -- 1fa6e8252e05e7a2471205ce631e8611e1fb761c
cargo run -- demo
```

The bundled browser sandbox is available at `/demo` or `/?demo=1`.

## Prior repair context

## Finding reproduced

Verification 15 had one release blocker. Its work order named nonexistent SHA
`c72d3655493897c704888dfb3b883bf0202075b0`, while the real candidate was
`c72d36ebdbd7cc0fc48702e2441664150b6f2492`. `git cat-file` rejects the first
object and resolves the second as a commit. The verifier therefore could not
tie a build or deployment to its requested candidate. It reported no product
behavior failures; all checks against the available candidate passed.

## Root-cause repair

- Every production build now creates `dist/site/release.json` with the exact
  40-character Git commit, clean/dirty state, and SHA-256 digests for all 14
  public static artifacts. The receipt is served with `Cache-Control: no-store`.
- The same generated commit is packaged with the approval-pack function and
  returned as `X-Alert-Ledger-Build` on success and error responses.
- `npm run verify:release -- <full-sha>` now refuses malformed, missing, dirty,
  checked-out-but-different, or unpushed candidates. It then compares the local
  and live receipts, downloads and hashes every live artifact, and checks the
  live function build header.
- The CLI, sample data, site behavior, visual system, privacy model, offline
  behavior, paid boundary, and static deployment class are unchanged.

## Exact regression coverage

- `release identity rejects a one-character candidate transcription error`
  recreates the verifier's failure with a valid-looking 40-character SHA that
  differs from the real candidate by one character.
- `release identity accepts the exact checked-out candidate published on main`
  proves the expected path in an isolated repository and bare origin.
- `release identity rejects a local commit that is not the remote candidate`
  prevents an unpushed build from being attested.
- Claim `release-identity` builds from a clean clone, checks the receipt against
  Git HEAD, and recomputes every recorded artifact digest.
- Browser coverage asserts the receipt's no-store deployment policy.

## Local verification

All commands passed:

```sh
npm ci
npm ci --prefix api
cargo fetch --locked
npm test
npm run lint
npm run build
cargo package --locked
npm run test:claims-clean
```

- `npm test`: 25 Rust tests, 13 API tests, 5 script tests, and 58 Playwright
  tests passed. Playwright ran desktop and 390 x 844 mobile projects covering
  keyboard, focus, Axe, 200% text, 44 px targets, privacy, offline reload,
  routing, errors, demo state, licensing, and claims.
- The clean-clone ledger passed all 24 claims in manifest order. It built the
  new release receipt from commit `da7f4fd…` with a clean source state.
- Lint passed rustfmt, Clippy with warnings denied, and TypeScript.
- The production build created `target/release/alert-ledger` and `dist/site`.
  Initial JavaScript is 23,500 bytes raw / 7,830 bytes gzip; CSS is 13,336
  bytes raw / 3,820 bytes gzip.
- `cargo package --locked` verified 22 files: 122.5 KiB raw and 30.6 KiB
  compressed. A fresh `cargo install --path . --root <temp> --locked` consumer
  ran `--help` and `demo --json`, yielding 3 changes, 2 matched routes, and
  source `grafana:production`.
- Local `verify-url.sh`: HTTP 200, 659 ms, no console/page errors, title,
  `lang=en`, one H1, one main, all image alt text, and all button names present.
- Local mobile Lighthouse: Performance 99, Accessibility 100, Best Practices
  100, SEO 100; LCP 2.183 s, CLS 0, 185,384 bytes transferred.

## Deployment and live verification

`npm run deploy` used the checked-in `swa-cli.config.json` production target
and deployed `dist/site` plus `api` to Azure Static Web Apps.

- Exact release verification passed for implementation commit `da7f4fda9b445e359ad00ac9ef81b22462fe676e`:
  all 14 public artifacts matched their local SHA-256 digests and the live API
  returned that same commit with HTTP 401 for the expected unlicensed request.
- Live `verify-url.sh`: HTTP 200, 649 ms, zero console/page errors, and all
  title, language, landmark, image-alt, and button-name checks passed.
- Live Axe found zero serious or critical issues on `/`, `/demo`, `/privacy`,
  `/terms`, `/404.html`, and the designed HTTP 404 route. All pages had one H1,
  one main, no horizontal overflow, and no unexpected console errors.
- Desktop first-screen content fit at 1366 x 768. At 390 x 844 there was no
  overflow, every visible control was at least 44 x 44 px, and 200% text did
  not overflow. Keyboard clear/reset actions moved focus to the new state and
  populated the polite status region.
- The demo made three same-origin requests and zero cross-origin requests. Its
  only browser key used the `demo:alert-config-ledger:` namespace.
- The live service worker was active with no waiting or installing update.
  Offline reload returned HTTP 200 and retained the offline notice and the
  three-change sample. Reduced motion set reel duration to `0.00001s` once.
- Every rendered HTTP link returned below 400; mail links were recognized.
- Response policy passed: HSTS, `nosniff`, strict-origin referrer policy,
  restrictive permissions policy, header CSP with `frame-ancestors 'none'`,
  30-second HTML revalidation, one-year immutable hashed JS, no-store release
  receipt, designed HTTP 404, and no-store API error responses.
- Live mobile Lighthouse: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; LCP 1.651 s, CLS 0, 185,866 bytes transferred.

Evidence is in `.factory/qa-artifacts/repair-12-local/` and
`.factory/qa-artifacts/repair-12-live/`.

## Known gaps / next steps

No release-blocking gaps remain. Release closure uses
`npm run verify:release -- "$(git rev-parse HEAD)"`; it requires the live
receipt and API header to identify the exact delivered tree.
