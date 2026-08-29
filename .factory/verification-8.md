# Independent verification 8 — PASS

- Candidate: `c8579b97e4c6bff63bc72abbff5eb1b17b5b7d2d`
- Live URL: <https://alert-config-change-ledger.sociobot.in>
- Work order: `alert-config-change-ledger-verify-8`
- Verified: 29 August 2026 UTC
- Decision: **PASS — the candidate satisfies the researched brief and acceptance contract. No release-blocking or secondary product defect was found.**

No product code was changed during this verification.

## First-read gate

The cold live first screen passes at desktop and 390 px mobile.

- What it does: **“Trace every alert route change.”**
- Who it is for: **“For platform teams who need to prove whether live alert routes match the reviewed baseline.”**
- What to click first: **“Try it with sample data.”** The adjacent sentence says it loads three realistic route changes in an isolated demo.
- The one-click action is fully visible without scrolling at 1440 × 900 and 390 × 844. On mobile it occupies y=434.22–483.02 px.
- The demo opens directly with three changed routes, two matched routes, source/revision/timestamp attribution, a persistent “Demo — sample data, nothing is saved” banner, **Reset demo**, and **Start for real**.

Evidence: [desktop first read](qa-artifacts/verification-8-live/screenshot-desktop.png), [mobile first read](qa-artifacts/verification-8-live/first-read-mobile.png), and [live browser results](qa-artifacts/verification-8-live/live-qa.json).

## Findings by severity

- P0: none.
- P1: none.
- P2: none.
- P3: none.

Operational observation, not a release defect: `/api/health` returns 404. The product is a CLI/static site with one ancillary function, and that function exposes build and limiter identity on its functional responses (`repair-7`, `azure-table`). Its 401, 403, and 429 paths were healthy during this verification.

## Mandatory claims gate

`.factory/claims.json` exists and contains 16 unique entries. From the clean candidate, I ran the documented clean install first: `npm ci` and `npm ci --prefix api`, both with zero audit findings. I then ran every claim's exact `test` command independently. All passed.

| Claim ID | Result | Observable evidence |
| --- | --- | --- |
| `core-workflow` | Pass | Bundled CLI demo attributed three Grafana route changes. |
| `provider-inputs` | Pass | Grafana JSON and Alertmanager YAML fixtures normalized. |
| `grafana-contact-points` | Pass | Five provider types changed with secret values excluded. |
| `read-only-import` | Pass | Captured server request was GET; help has no write command. |
| `recipient-redaction` | Pass | Outputs contain SHA-256 fingerprints and no raw endpoints. |
| `token-exclusion` | Pass | Token reached authorization only and was absent from the snapshot. |
| `exit-codes` | Pass | No drift `0`, drift `2`, invalid input `1`. |
| `free-core-cli` | Pass | Snapshot, diff, timeline, terminal, JSON, and Markdown worked without a license. |
| `no-telemetry` | Pass | Bundled CLI demo completed with HTTP(S) proxies pointed at a closed port. |
| `demo-privacy` | Pass | Browser demo made only same-origin requests and used only its demo namespace. |
| `demo-exit-clears-state` | Pass | **Start for real** removed demo keys and retained a non-demo sentinel. |
| `offline-reload` | Pass | Service-worker update and offline `/demo` reload retained the three-change comparison. |
| `report-download` | Pass | Downloaded JSON contained all three sample changes. |
| `web-cli-parity` | Pass | Canonical live download and release CLI report had identical SHA-256 `49479a83dc77f21e4f8ad4fbb84b993114fe6cb0799794cc2a991184bd1a690d`. |
| `paid-template` | Pass | Missing, invalid, and recorded-valid license boundaries were enforced in the registered test. |
| `sales-closed` | Pass | Live unlicensed UI showed the closed-sales notice and no checkout or paid download action. |

The landing page and README claims map to these registered checks. I found no material unlisted claim. Deterministic normalization, comparison, and redaction are the correct mechanisms for this job; adding generative AI would not close a missing user loop.

## Clean install, tests, lint, and production build

- `npm ci`: pass; 24 packages installed, zero vulnerabilities.
- `npm ci --prefix api`: pass; 25 packages installed, zero vulnerabilities.
- `npm test`: pass; 21 Rust tests, 12 API tests, and 50 Playwright tests across desktop Chromium and 390 × 844 mobile.
- `npm run lint`: pass; rustfmt, strict Clippy, and TypeScript checks passed.
- `npm run build`: pass; produced `target/release/alert-ledger` and `dist/site/`.
- `npm audit --omit=dev`: pass; zero vulnerabilities.
- `npm audit --prefix api --omit=dev`: pass; zero vulnerabilities.
- `cargo package --locked`: pass; 21 intended files, 117.7 KiB unpacked and 29.9 KiB compressed. No `node_modules` file was included.

## CLI and clean-consumer verification

The packaged crate was extracted into a new temporary consumer and installed into an isolated Cargo root. `alert-ledger --version` returned `0.1.0`; help exposed only `snapshot`, `diff`, `timeline`, and `demo`; the installed demo returned three changes.

Independent release-binary cases:

- Bundled terminal demo: three changed routes and two matched; output went to a new temporary directory.
- Bundled JSON demo: exit `0`, three changes, sources and timestamps retained, no plaintext recipient endpoint.
- Grafana baseline/live: four reviewed routes, five live routes, three changes, drift exit `2`.
- Self-diff: zero changes, exit `0`.
- Markdown output: created a 455-byte drift report, exit `2`.
- Alertmanager through stdin: one route written, exit `0`.
- Malformed JSON: exit `1` with the parse cause.
- Invalid timestamp: exit `1` and explains RFC 3339.
- Unsupported provider: exit `1` and lists supported values.
- Unreachable URL: exit `1` with URL, network, and token recovery guidance.
- Duplicate same-scope Grafana siblings: two matches, one recipient change, exit `2`.
- Alertmanager negative-regex change `!~dev` → `!~test`: visible as removed/added route drift, exit `2`.
- Grafana contact-point arrays: PagerDuty, Opsgenie, Slack, webhook, and email each produced a recipient change, exit `2`.

## Live workflow, privacy, and accessibility

- Factory `/opt/fleet/lib/verify-url.sh`: pass in 700 ms; correct title and `lang=en`, one H1, one main landmark, no missing image alternatives, no unlabeled buttons, and no load errors.
- Axe on `/`, `/demo`, `/privacy`, `/terms`, `/missing-tape`, and `/404.html`: zero serious or critical findings.
- Normal live routes produced no console or page errors. Directly requesting the intentional missing route returns HTTP 404 and Chromium logs the expected failed-document diagnostic.
- Keyboard only: first Tab reached the skip link with a 3 px teal outline; Enter focused `main`; the next Tab reached **Try it with sample data**; Enter opened `/demo`; Space selected a route and updated `aria-pressed` plus its detail heading.
- SPA navigation focused the destination H1, and browser Back restored `/` and its title.
- At 390 × 844 there was no horizontal overflow. Every visible control was at least 44 × 44 CSS px. The landing page still reflowed without horizontal overflow at 200% root text.
- Reduced motion set scroll behavior to `auto` and the reel animation to one effectively instant iteration (`0.00001s`).
- Clear comparison, reset, route selection, report download, and damaged-local-state recovery all worked with plain recovery copy.
- The live demo request log contained only same-origin document/JS/CSS requests. It stored only `demo:alert-config-ledger:state`; leaving demo mode deleted every demo-prefixed key while preserving a non-demo sentinel.
- The downloaded live report contained three changes, matched the CLI value-for-value, and contained no email, webhook URL, or PagerDuty endpoint.
- No analytics, telemetry, CDN font, or third-party script request was observed.
- The product has no sign-in flow, so the Microsoft Entra tenant requirement does not apply.

## PWA, headers, caching, and links

- `navigator.serviceWorker.ready` resolved to `/sw.js`; `registration.update()` succeeded. After a controlled reload and offline switch, `/demo` reloaded with the offline notice and the same three changes.
- Browser response headers include HSTS, CSP with `frame-ancestors 'none'`, `nosniff`, strict-origin referrer policy, and camera/microphone/geolocation restrictions.
- HTML and `sw.js`: `public, must-revalidate, max-age=30`.
- Hashed JS/CSS: `public, max-age=31536000, immutable`.
- Hero WebP: `public, max-age=3600, must-revalidate`.
- `/`, `/demo`, `/privacy`, `/terms`, `/404.html`, `robots.txt`, and `sitemap.xml` returned 200. `/missing-tape` returned the designed 404.
- Every rendered internal/external HTTP link returned 200; mail links were recognized as `mailto:`.

## Serverless boundary and request allowance

The approval-pack function's documented allowance is **20 requests per 60 seconds**.

- A fresh 25-request concurrent burst from one client returned exactly **20 × 401** and **5 × 429**. This proves concurrent calls cannot bypass the shared ceiling.
- Every 429 carried `Retry-After: 58`, `Cache-Control: no-store, private`, `X-Alert-Ledger-Build: repair-7`, and `X-Alert-Ledger-Limit-Store: azure-table`.
- A later invalid-license request returned 403, private/no-store, with the same build and store identity.
- Local API tests passed the ETag-conflict concurrency case, multiple-handler shared-store case, deployment store selection, endpoint-wide ceiling, invalid-license throttling, and fail-closed behavior.
- Persistence boundaries are correct: only rate counters use the shared table; the demo stays browser-local and alert configuration is not sent to this endpoint.

## Candidate/deployment identity

The live static release matches candidate `c8579b97e4c6bff63bc72abbff5eb1b17b5b7d2d` byte-for-byte for all primary generated assets checked:

| File | SHA-256 |
| --- | --- |
| `index.html` | `ef32f6e79ca14ce1ef08f13df4c1c6cb4a7754f843780862a0a9c4b438145387` |
| `assets/index-CRE9ftmn.js` | `98ce7d78da44b61382a852b0b7ae704e3c03adc4228053f1017a9a770f5a9b7d` |
| `assets/index-Xzwkw3PS.css` | `5e7fa3e76433fa63d5c19cbdf6fccc5999f565976f65c36fa2f37b29f8100a35` |
| `sw.js` | `a09780020174f918c6d2ef6a0c257edf9c7aea08cfd1479d67456054ca6f04c6` |
| `404.html` | `95d3e614926f6836d78e5e98cf29ea6e0dfd8dd8688e551fe1f53f2b28a595f5` |
| `cassette-ledger.webp` | `a8ae0f9fa2e0963e1527fc306cb81c5e81fbbb6577fbef12b8570b502270ecbb` |
| `terminal-demo.svg` | `44df560bb2b76b66082357e78a623ddc1ec4d51c36b965a2318e1cec0761c46f` |

The ancillary function identifies itself as candidate source build `repair-7` and reproduces the candidate's expected response bodies, headers, shared-store behavior, and 20/60 allowance.

## Performance and bundle budgets

Fresh Lighthouse 12.8.2 mobile run against production:

| Measure | Result |
| --- | ---: |
| Performance | 94 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| FCP | 0.858 s |
| LCP | 1.734 s |
| Total blocking time | 268 ms |
| CLS | 0 |
| Initial transfer | 184,573 bytes |

Production assets remain under contract budgets: JavaScript 19,054 bytes raw / 6.71 KiB gzip, CSS 13,357 bytes raw / 3.81 KiB gzip, hero WebP 169,978 bytes, and no web fonts. Lighthouse does not emit lab INP; three measured route-selection updates completed in 94–101 ms, below the 200 ms interaction budget.

## Product and documentation contract

- The CLI performs the brief's real job: read-only import, normalization, source/time-preserving comparison, recipient redaction, and route/severity/recipient timeline reporting.
- It does not send alerts or mutate provider configuration.
- `README.md`, MIT `LICENSE`, `CHANGELOG.md`, `/privacy`, `/terms`, `.factory/demo.md`, `.factory/copy-audit.md`, and the product-specific `.factory/design.md` are present.
- The cassette-era incident-zine visual system is implemented consistently, original asset provenance is recorded, and the desktop/mobile UI does not resemble a generic framework template.

## Evidence

- [Live browser QA JSON](qa-artifacts/verification-8-live/live-qa.json)
- [Factory verify-url result](qa-artifacts/verification-8-live/verify.json)
- [Lighthouse JSON](qa-artifacts/verification-8-live/lighthouse.json)
- [Claims summary](qa-artifacts/verification-8-live/claims-summary.txt)
- [Deployment identity](qa-artifacts/verification-8-live/identity.txt)
- [Live rate-limit result](qa-artifacts/verification-8-live/rate-limit.json)
- [Desktop demo](qa-artifacts/verification-8-live/demo-desktop.png)
- [Mobile demo](qa-artifacts/verification-8-live/demo-mobile.png)
- [Mobile offline demo](qa-artifacts/verification-8-live/demo-mobile-offline.png)

## Known gaps and next steps

No release-blocking gap remains. New Pro sales are intentionally closed; the existing-license path remains tested. For operational convenience, a future release may add a dedicated read-only `/api/health` endpoint, although functional responses already expose build and limiter identity. Rotate the rate-limit table SAS before its documented 29 August 2027 expiry.
