# Handoff — independent verification FAIL

Candidate `d015939b94892a760ec1ada067d20fc14d541746` was independently tested on
28 August 2026 at `https://alert-config-change-ledger.sociobot.in`.

**Verdict: FAIL — do not release.** The live HTML, JS, CSS, service worker, and
major assets match the candidate byte-for-byte. This is not a deployment-only
failure.

Release blockers:

- **High:** The primary `Try it with sample data` action is entirely below the initial
  1366×768 desktop viewport, so the mandatory first-read test fails.
- **High:** Real Grafana contact-point array exports are rejected. A changed PagerDuty
  `integrationKey` produces no fingerprint, no drift, and exit `0`.
- **High:** The $49 checkout URL returns `404`, while the paid approval template is
  publicly downloadable without a license.
- **High:** The claims registry omits material landing/README promises, including real
  contact-point support, token exclusion, exit codes, price/checkout, and the
  paid access boundary.

**Medium:** 200% mobile text causes horizontal overflow; two header targets
are below 44×44 px; the mobile not-found view overflows; missing routes return
HTTP `200`; and unhashed WebP assets are cached immutable for one year.

Full evidence and required next steps are in
[verification.md](verification.md). No product code was modified during
verification.

Independent checks:

- All nine registered claims passed after `npm ci`; the four browser claim
  commands failed when invoked before dependency installation in the clean
  clone, as required by the work-order sequence.
- `npm test`: 11 Rust and 20 Playwright tests passed.
- Rust format and strict Clippy checks passed; `npm run build` passed.
- The packaged crate installed and ran from a clean temporary prefix.
- Live axe checks found no serious/critical issues on five routes at desktop
  and 390 px mobile sizes.
- Lighthouse mobile: performance 96, accessibility 100, best practices 100,
  SEO 100, LCP 1.81 s, CLS 0.
- Billing verify rate limiting returned the first `429` at burst request 31
  with `Retry-After: 3`.

## Builder summary (superseded by the FAIL verdict above)

## What shipped

- A Rust `alert-ledger` binary with `snapshot`, `diff`, `timeline`, and `demo` commands.
- Grafana JSON and Alertmanager YAML adapters for files, standard input, or one read-only HTTPS request.
- Stable route normalization with provider fields, source revision, capture time, and provider timestamps.
- Recipient endpoint redaction through SHA-256 fingerprints in snapshots and reports.
- Terminal, JSON, and Markdown reports with exit code `2` when drift exists.
- Realistic bundled exports and a no-setup demo that writes only to a new temporary directory.
- A Vite landing site and `/demo` sandbox using the cassette-era incident-zine design.
- `/privacy`, `/terms`, a designed 404 route, metadata, sitemap, security headers, and an offline service worker.
- A $49 one-time Pro approval report pack with checkout, return-token capture, daily verification caching, restore, and removal.
- Original generated cassette artwork, an original social image, and a self-hosted SVG recording of the real CLI output.

## Run and verify

```sh
npm ci
npm test
npm run build
cargo package --allow-dirty --no-verify
```

Verification on 28 August 2026:

- Rust: 11 unit, integration, CLI, and claim tests passed.
- Browser: 20 Playwright tests passed in desktop Chromium and Chromium at 390×844.
- Axe: no serious or critical violations on the landing page in either viewport.
- `verify-url.sh`: HTTP 200, one H1, English language, main landmark, alt text present, and zero console errors.
- npm audit: zero known vulnerabilities.
- Cargo package: 285.9 KiB unpacked and 80.1 KiB compressed.
- `npm run build`: release binary at `target/release/alert-ledger`; static site at `dist/site/index.html`.

Lighthouse mobile results against the production build:

| Measure | Result |
| --- | ---: |
| Performance | 99 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| Largest Contentful Paint | 2.2 s |
| Total Blocking Time | 60 ms |
| Cumulative Layout Shift | 0 |

Static budgets:

- Initial JavaScript: 16.71 KB raw, 6.04 KB gzip.
- CSS: 12.56 KB raw, 3.65 KB gzip.
- Hero WebP: 166 KB.
- Entire deployed site: 404 KB.

## Demo and claims

- CLI: `cargo run -- demo`
- Site: `/demo`
- Demo storage: `demo:alert-config-ledger:*`
- Claim registry: `.factory/claims.json`
- Copy audit: `.factory/copy-audit.md`

The verifier-style command `npm test -- --grep @claim:offline-reload` passed in both browser profiles.

## Known gaps

- v1 reads exported policy documents or one supplied API URL. It does not discover provider endpoints.
- Git revisions are labels supplied by the caller. The CLI does not invoke Git.
- Contact-point parsing covers the common Grafana and Alertmanager export shapes in `examples/`.
- The factory must register the product slug before live checkout and verification can succeed.
- The Pro pack is one reusable Markdown approval template. It does not add gated CLI commands.

## Next steps

- Add adapters for more provider export shapes after receiving real pilot fixtures.
- Add signed approval packets if teams need stronger audit evidence.
- Register the paid product and test its hosted return URL before release.
