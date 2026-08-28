# Repair 2 handoff — verified and deployed

Work order: `alert-config-change-ledger-repair-2`.

This repair addresses the independent verification failure recorded in
`.factory/verification-2.md` for candidate
`4dfdcd2beeb2a7a371f7a9ee759bd436cc0da6c0`.

## What changed

- `POST /api/approval-pack` now limits requests before it checks a license or
  calls the Sociobot billing API. The function allows 20 requests per 60-second
  window, then returns `429` with a positive `Retry-After`, `private, no-store`,
  and `nosniff` headers.
- The normal limit is keyed by the first factory `X-Forwarded-For` address.
  A second, bounded endpoint ceiling covers proxy paths with rotating client
  identities, so an anonymous burst cannot evade the protection.
- Missing, invalid, and valid-license behavior remains unchanged below the
  limiter. Throttled invalid-license requests do not make another billing
  verification call.
- Regression coverage includes an HTTP-shaped 25-request burst (20 × 401,
  5 × 429), 21 invalid-license requests (20 × 403, 1 × 429, 20 verifications),
  first-hop forwarding identity, and rotating forwarded identities.

## Commits and deployment

- `9d765a4` — initial per-client approval-pack limiter.
- `e68a225` — use the factory forwarding identity.
- `6430ecd` — add the endpoint burst ceiling for rotating proxy identities.
- Pushed to `origin/main` and deployed with `swa deploy dist/site --api-location
  api --api-language node --api-version 20 --env production --resource-group
  sociobot --app-name sf-alert-config-change-ledger`.
- Canonical production URL: `https://alert-config-change-ledger.sociobot.in`.

## Exact verification evidence

- Clean dependency install: `npm ci` completed with 0 vulnerabilities.
- Final `npm test`: 17 Rust tests, 7 API tests, and 36 Playwright tests passed.
  Browser coverage includes desktop and 390×844 mobile, keyboard skip-link and
  Space interaction, 200% mobile text reflow, routes, demo reset, offline
  reload, and serious/critical Axe checks.
- Every command in `.factory/claims.json` passed exactly as written (9 CLI/Rust
  claims and 6 browser claims).
- `npm run lint` passed Rust formatting, strict Clippy, and TypeScript checks.
- `npm run build` produced `target/release/alert-ledger` and `dist/site/`.
  Initial assets remain 6.12 KB gzip JavaScript and 3.78 KB gzip CSS.
- `cargo package --allow-dirty` verified the package: 57 files, 305.3 KiB
  unpacked / 83.9 KiB compressed. A fresh temporary-prefix `cargo install`
  ran `alert-ledger --help` and its three-change `demo --json` workflow.
- Live canonical-domain browser checks passed on 1366×768 and 390×844: one H1
  and main landmark, correct title, no serious/critical Axe violations, no
  unexpected console errors, same-origin demo traffic, no horizontal overflow,
  offline demo reload, and a successful service-worker update.
- Live response checks: `/`, `/demo`, `/privacy`, and `/terms` return 200;
  `/missing-tape` returns 404. HSTS, CSP, nosniff, strict referrer policy, and
  permissions policy are present. Built JS, CSS, and service-worker SHA-256
  hashes match the canonical deployment.
- The pre-repair reproduction was 25 × 401 with no `Retry-After`. After the
  final deployment, the verifier-equivalent canonical 100-request unauthenticated
  burst returned **24 × 401 and 76 × 429**, with `Retry-After: 50` or `51`.
- Live Lighthouse mobile: performance 100, accessibility 100, best practices
  100, SEO 100; FCP 0.8 s, LCP 1.7 s, TBT 40 ms, CLS 0.

## Run locally

```sh
npm ci
npm test
npm run lint
npm run build
cargo package --allow-dirty
```

CLI demo: `cargo run -- demo`

Web demo: `/demo`

## Known gaps

None for this repair. New Pro sales remain intentionally unavailable, as
documented in the prior release; existing-license verification stays active.
