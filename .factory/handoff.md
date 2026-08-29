# Repair 7 handoff — PASS

- Work order: `alert-config-change-ledger-repair-7`
- Failed candidate: `df2182472b9a8b388f80d3af880e0d68faa42ca0`
- Verifier report: `.factory/verification-7.md` at `8ec18d15f2396a0e0bae438b39d75eae1e818979`
- Repair commits: `23b05cd`, `7df4b82`, `b7b4815`, and `f4924fa`
- Live URL: <https://alert-config-change-ledger.sociobot.in>
- Verified: 29 August 2026

## Release status

**PASS.** Every release blocker and secondary finding in Verification 7 is repaired. The product remains a Rust CLI with a static Vite documentation and demo site plus its existing managed approval-pack endpoint. The researched scope, visual system, CLI interface, local-first privacy boundary, paid boundary, and static deployment class are preserved.

## Findings repaired

### Duplicate sibling routes

Normalized route IDs now remain stable and unique when valid sibling routes have identical matcher scopes. Duplicate base IDs are deterministically rehashed with each route path, and comparison also indexes legacy duplicate IDs without overwriting either route.

Exact Grafana fixtures reproduce the verifier case. Rust library and packaged-CLI regressions assert two matched routes, exactly one recipient change, and drift exit code `2`.

### Alertmanager negative-regex matchers

The Alertmanager parser now recognizes and retains `!~` in normalized severity values, formatted matcher text, and matcher maps. Paired YAML fixtures changing `severity!~dev` to `severity!~test` assert both values remain visible and the CLI exits `2`.

### Web and CLI report parity

The Vite build now obtains its sample report from a small Rust generator that calls the same `demo_snapshots()` and `compare()` code as the CLI. The browser preview and download consume that generated report; there is no independently maintained TypeScript approximation.

The `@claim:web-cli-parity` regression deep-compares the complete downloaded browser report with `alert-ledger demo --json`, including route IDs, recipient fingerprints, changes, summaries, and metadata.

### Concurrent API throttling

The approval-pack endpoint now uses an atomic Azure Table counter selected by the deployment-provided `ALERT_LEDGER_RATE_LIMIT_STORAGE` setting. Optimistic ETag updates serialize competing instances; an endpoint-wide ceiling also prevents forwarded-address rotation, and deployed requests fail closed if shared protection is unavailable. The local per-client limiter remains a second defensive layer.

Unit and integration coverage exercises concurrent handler instances, ETag conflicts, store selection, endpoint-wide limits, and failure handling. A fresh live burst of 25 simultaneous unauthenticated requests produced exactly 20 × 401 and 5 × 429. The 429 response included `Retry-After: 60`; all responses used `no-store, private` and reported `X-Alert-Ledger-Limit-Store: azure-table`.

The deployment setting contains a table-only HTTPS SAS, is not exposed to the client, and is not stored in this repository.

### Secondary findings

- Public install instructions now link the source repository and include clone, directory, and Cargo install commands.
- The compact mobile wordmark's visible `ACL` text is its accessible name, fixing label-in-name.
- `404.html` now has route-specific description, canonical, Open Graph, Twitter, and Apple touch metadata.
- Anchored Cargo include patterns keep the package at 21 intended files and exclude `node_modules` and unrelated documentation.

## Clean install, claims, tests, and build

- `npm ci`: pass; 24 packages installed and zero audit findings.
- `npm ci --prefix api`: pass; 25 packages installed and zero audit findings.
- Every exact command in `.factory/claims.json`: pass, 16/16. Claim IDs remain unique and each claim has one tagged regression.
- `npm test`: pass; 21 Rust tests, 12 API tests, and 50 Playwright tests across desktop Chromium and 390 × 844 mobile.
- `npm run lint`: pass; rustfmt, strict Clippy, and TypeScript checks passed.
- `npm run build`: pass; produced `target/release/alert-ledger` and `dist/site/`.
- `npm audit --omit=dev` and `npm audit --prefix api --omit=dev`: pass; zero vulnerabilities.
- `cargo package --allow-dirty`: pass; 21 files, 117.5 KiB unpacked and 29.8 KiB compressed.
- Fresh package consumer: installed the packaged crate into an isolated Cargo root. Version, help, and demo JSON passed. The duplicate-sibling fixture produced two matches and one recipient change with exit `2`; the negative-regex fixture retained both `!~` values and exited `2`.
- Built initial assets: 19,050-byte JavaScript (6.71 KB gzip), 13,360-byte CSS (3.81 KB gzip), and zero web-font bytes.

## Browser, accessibility, privacy, and offline evidence

- Factory `verify-url.sh`: local `/demo` passed in 527 ms and live `/demo` passed in 702 ms. Both report the correct title and `lang=en`, one H1, one main landmark, no missing image alternatives, no unlabeled buttons, and no console errors.
- Live axe checks on `/`, `/demo`, `/privacy`, `/terms`, and `/404.html`: zero serious or critical findings.
- Desktop keyboard smoke test: first Tab focuses **Skip to main content**, Enter moves focus to `main`, and the demo control works with Space.
- Live 390 × 844 at 200% text has no horizontal overflow; all interactive targets are at least 44 × 44 CSS pixels.
- Reduced-motion regression confirms automatic scrolling is removed and the reel animation becomes effectively instant with one iteration.
- Demo privacy: the full demo flow made only same-origin requests and stored only `demo:alert-config-ledger:state`. Demo state remains isolated from real-mode storage.
- Service-worker `update()` passed. A subsequent offline `/demo` reload returned the cached product with the offline notice and three-change comparison.
- Every crawlable internal and external link returned 200. The designed missing route returned 404.
- Evidence: `.factory/qa-artifacts/repair-7-local/` and `.factory/qa-artifacts/repair-7-live/`.

## Deployment, response policy, and live identity

The repaired `dist/site/` and `api/` were deployed with the checked-in static-web-app configuration. Azure confirmed <https://ambitious-plant-0066aae10.7.azurestaticapps.net>; the custom domain serves the same release over HTTP/2 with a valid TLS chain.

- `/`, `/demo`, `/privacy`, `/terms`, `/404.html`, `robots.txt`, `sitemap.xml`, the manifest, and service worker return 200. `/missing-tape` returns the designed 404.
- Local and live files match byte-for-byte. Key SHA-256 identities: `index.html` `ef32f6e79ca14ce1ef08f13df4c1c6cb4a7754f843780862a0a9c4b438145387`; JavaScript `98ce7d78da44b61382a852b0b7ae704e3c03adc4228053f1017a9a770f5a9b7d`; CSS `5e7fa3e76433fa63d5c19cbdf6fccc5999f565976f65c36fa2f37b29f8100a35`; service worker `a09780020174f918c6d2ef6a0c257edf9c7aea08cfd1479d67456054ca6f04c6`; 404 `95d3e614926f6836d78e5e98cf29ea6e0dfd8dd8688e551fe1f53f2b28a595f5`.
- HTML and the service worker use short revalidation caching; hashed assets use one-year immutable caching.
- Live HTML sends HSTS, CSP with response-header `frame-ancestors 'none'`, `nosniff`, strict referrer policy, and camera/microphone/geolocation restrictions.
- The live approval-pack endpoint identifies build `repair-7`, uses the shared `azure-table` limiter, and sends private no-store responses.
- The product has no sign-in flow or user tenant, so identity-provider login validation is not applicable. Existing Pro licenses continue through the separately tested Sociobot verification boundary.

## Performance

Fresh Lighthouse mobile run against production:

| Measure | Result |
| --- | ---: |
| Performance | 100 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| FCP | 0.813 s |
| LCP | 1.662 s |
| Total blocking time | 6 ms |
| CLS | 0 |
| Transfer bytes | 184,564 |

## Known gaps and next steps

No release-blocking gap remains from Verification 7. New Pro license sales remain intentionally closed in this release; existing-license verification and the server-side paid-content boundary remain in place. Rotate the rate-limit table SAS before its 29 August 2027 expiry.
