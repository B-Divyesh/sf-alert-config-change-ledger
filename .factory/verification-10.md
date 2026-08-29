# Independent verification 10 — FAIL

- Requested candidate: `690a08bcc3ad8f49602916f45e5fcda49bf843e3`
- Available/tested commit: `690a08b11e786c509459a204f4abb1bed7bceabb`
- Live URL: <https://alert-config-change-ledger.sociobot.in>
- Work order: `alert-config-change-ledger-verify-10`
- Verified: 29 August 2026 UTC
- Decision: **FAIL — the requested candidate does not exist in the clone or remote, so it cannot be built, tested, or matched to production. The mandatory first clean-clone claims run also failed before dependency installation.**

No product code was changed during verification.

## Release-blocking findings

### P0 — requested candidate is unavailable and cannot be verified

The clean workspace and `origin/main` both resolve to `690a08b11e786c509459a204f4abb1bed7bceabb`, the work-order base. The requested candidate `690a08bcc3ad8f49602916f45e5fcda49bf843e3` is not a local Git object and is not advertised by the remote.

Fresh checks:

```text
$ git cat-file -e 690a08bcc3ad8f49602916f45e5fcda49bf843e3^{commit}
fatal: Not a valid object name ...
exit 128

$ git fetch origin 690a08bcc3ad8f49602916f45e5fcda49bf843e3
fatal: remote error: upload-pack: not our ref ...
exit 128

$ git ls-remote origin
690a08b11e786c509459a204f4abb1bed7bceabb  HEAD
690a08b11e786c509459a204f4abb1bed7bceabb  refs/heads/main
```

Production assets match the build from the available base byte-for-byte, but that cannot establish a match to a nonexistent candidate. Evidence: [identity checks](qa-artifacts/verification-10/identity.txt).

### P1 — mandatory first clean-clone claims gate fails before install

Before repository inspection or dependency installation, every command in `.factory/claims.json` was run in order, as required by this work order. Claims 1–10 passed. Claim 11, `npm test -- --grep @claim:demo-privacy`, failed in `npm run test:api`:

```text
not ok 11 - deployment-provided storage selects the atomic Azure Table counter
Error: Cannot find module '@azure/data-tables'
Require stack:
- /work/repo/api/approval-pack/rate-limit.js
- /work/repo/api/approval-pack/index.js
- /work/repo/api/approval-pack/index.test.cjs
```

The browser runner was also unavailable before install (`Cannot find module 'playwright'`). The contract says any failing claim test is release blocking. After `npm ci` and `npm ci --prefix api`, all 17 claim commands passed exactly as written on the available base commit. This confirms the tests themselves are healthy after setup, but it does not erase the required first-run failure or verify the missing candidate.

## First-read gate — pass on the live deployment

The cold first screen passes at 1440 × 900 and 390 × 844.

- What it does: **“Compare reviewed and live alert routes.”**
- Who it is for: **platform teams who need to prove whether live routes match the reviewed baseline.**
- What to click first: **“Try it with sample data.”** Adjacent text says it loads three route changes in an isolated demo.
- The sample action is visible without scrolling and opens the working demo in one keyboard or pointer action.

Evidence: [desktop screenshot](qa-artifacts/verification-10/cold-desktop.png), [mobile screenshot](qa-artifacts/verification-10/cold-mobile.png), and [first-read capture](qa-artifacts/verification-10/first-read.json).

## Claims after documented install

`.factory/claims.json` exists with 17 unique entries. After the documented clean installs, every command passed on `690a08b11e786c509459a204f4abb1bed7bceabb`:

| Claim | Result |
| --- | --- |
| `core-workflow` | Pass |
| `provider-inputs` | Pass |
| `normalized-snapshot-input` | Pass |
| `grafana-contact-points` | Pass |
| `read-only-import` | Pass |
| `recipient-redaction` | Pass |
| `token-exclusion` | Pass |
| `exit-codes` | Pass |
| `free-core-cli` | Pass |
| `no-telemetry` | Pass |
| `demo-privacy` | Pass |
| `demo-exit-clears-state` | Pass |
| `offline-reload` | Pass |
| `report-download` | Pass |
| `web-cli-parity` | Pass |
| `paid-template` | Pass |
| `sales-closed` | Pass |

Landing-page and README claims map to these entries; no material unlisted product claim was found.

Evidence: [claim summary](qa-artifacts/verification-10/claims-summary.txt).

## Clean install and local quality gates

All following results are for the only available commit, not the missing requested candidate.

- `npm ci`: pass; 24 packages, zero audit findings.
- `npm ci --prefix api`: pass; 25 packages, zero audit findings.
- `npm test`: pass; 24 Rust tests, 12 API tests, and 52 Playwright tests across desktop Chromium and 390 px mobile.
- `npm run lint`: pass; rustfmt, Clippy with warnings denied, and TypeScript type-check.
- `npm run build`: pass; release CLI and `dist/site/` produced.
- `npm audit --omit=dev`: pass, zero vulnerabilities.
- `npm audit --prefix api --omit=dev`: pass, zero vulnerabilities.
- `cargo package --allow-dirty --locked`: pass; 21 files, 122.8 KiB unpacked and 30.7 KiB compressed.

## Packaged CLI and end-to-end workflow

The generated `.crate` was unpacked into a new temporary consumer, installed with `cargo install --path … --root … --locked`, and exercised through that installed binary.

- `alert-ledger --version`: `0.1.0`; help exposes `snapshot`, `diff`, `timeline`, and `demo`, with no write command.
- Bundled demo: three changes, two matched routes, no raw example email or webhook value.
- Grafana reviewed/live comparison: four baseline routes, five live routes, three attributed changes; exit `2`.
- Self-comparison: no drift; exit `0`.
- Alertmanager YAML: two normalized routes; exit `0`.
- Two-snapshot timeline: one timeline entry with drift; exit `2`.
- Empty Grafana JSON, an HTTP-style error envelope, malformed Alertmanager YAML, unsupported provider, and missing timeline folder: exit `1`, recovery text on stderr, and no snapshot output.
- JSON output remains scriptable and uses SHA-256 recipient fingerprints.

Automated coverage also passes duplicate sibling routes, negative regex matchers, GET-only URL imports, token exclusion, and concurrent limiter behavior.

## Live browser, accessibility, privacy, and recovery

- Factory `verify-url.sh`: pass locally and live; title, `lang`, one H1, one main, image alternatives, labeled buttons, and zero landing-page console/page errors.
- Axe: zero serious or critical findings on `/`, `/demo`, `/privacy`, `/terms`, `/404.html`, and a real 404 route.
- Keyboard: first Tab exposes the skip link with a 3 px teal outline; Enter focuses `main`; the next Tab reaches “Try it with sample data”; Enter opens the demo; Space selects a route and changes `aria-pressed`.
- Mobile 390 × 844: no horizontal overflow and no visible interactive target below 44 × 44 CSS px.
- At 200% root text size, the page remains within 390 px without horizontal overflow.
- Reduced motion: media query matches, scroll behavior is `auto`, and the reel animation becomes `0.00001s` for one iteration.
- Demo requests are same-origin only. There are no demo console/page errors and no analytics or third-party runtime assets.
- The downloaded report contains three changes and two matches with no plaintext contact values.
- Demo state uses only `demo:alert-config-ledger:*`; leaving demo removes it while preserving an unrelated non-demo sentinel.
- Clear comparison shows the designed empty state. Damaged storage shows an actionable error and **Reset demo** restores the three-change result.
- The service worker updates and `/demo` reloads offline with the same comparison and offline notice.
- Every rendered HTTP link returns 200; `mailto:` links are valid. A missing route returns the designed page with HTTP 404.
- There is no sign-in flow, so the Microsoft Entra tenant requirement does not apply.

Evidence: [live browser audit](qa-artifacts/verification-10/live-browser.json), [link crawl](qa-artifacts/verification-10/link-check.json), [live structural check](qa-artifacts/verification-10/verify-url-live/verify.json), and [offline screenshot](qa-artifacts/verification-10/demo-mobile-offline.png).

The one console entry captured during the combined route sweep is Chromium reporting the deliberately requested `/missing-tape` document's expected HTTP 404. Normal landing and demo loads have zero errors.

## Headers, caching, limits, and deployment identity

- HTML responses include HSTS, CSP with header-delivered `frame-ancestors 'none'`, `nosniff`, strict-origin referrer policy, and camera/microphone/geolocation restrictions.
- HTML and `sw.js`: `public, must-revalidate, max-age=30`.
- Hashed JavaScript and CSS: `public, max-age=31536000, immutable`.
- Hero WebP: `public, max-age=3600, must-revalidate`.
- The same-origin approval-pack API allows **20 requests per 60 seconds**. Requests 1–20 returned 401 without a license; request 21 returned 429 with `Retry-After: 55`, `Cache-Control: no-store, private`, build `repair-7`, and limiter store `azure-table`.
- The Sociobot license-verification endpoint separately allowed **30 requests** from one client; request 31 returned 429 with `Retry-After: 3`.
- Local API tests pass concurrent-request, shared-store, Azure Table ETag, endpoint ceiling, and fail-closed cases. Only limiter counters persist server-side; demo data stays browser-local.
- Live primary assets match the production build from available commit `690a08b11e…` byte-for-byte.

Evidence: [response headers](qa-artifacts/verification-10/headers.txt), [approval API statuses](qa-artifacts/verification-10/rate-statuses.txt), [approval API 429](qa-artifacts/verification-10/rate-429.headers), [license API statuses](qa-artifacts/verification-10/license-rate-statuses.txt), and [license API 429](qa-artifacts/verification-10/license-rate-429.headers).

## Performance and bundle budgets

Fresh Lighthouse 13.4.1 mobile results against the live custom domain:

| Measure | Result |
| --- | ---: |
| Performance | 100 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| FCP | 0.820 s |
| LCP | 1.666 s |
| Total blocking time | 64 ms |
| CLS | 0 |
| Initial transfer | 184,895 bytes |

The production build has 20,308 bytes raw / 7,049 bytes gzip JavaScript, 13,336 bytes raw / 3,822 bytes gzip CSS, no web font, and a 169,978-byte hero. Nine two-frame mobile route-selection probes measured a maximum 100.4 ms and median 66.5 ms. Evidence: [Lighthouse report](qa-artifacts/verification-10/lighthouse.json).

## Result and required next step

**FAIL.** The available base and its live deployment are healthy across functionality, accessibility, privacy, offline behavior, packaging, rate limiting, and performance. Release remains blocked because the requested candidate is absent and therefore unverifiable, and because the mandatory pre-install claim run failed. Push the intended candidate to the named remote, ensure the clean-clone claim commands can run in the mandated order, then issue a new verification work order for that exact SHA.
