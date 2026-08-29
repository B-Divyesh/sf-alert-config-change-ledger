# Independent verification 11 — PASS

- Candidate: `63be2fb4ae95d37225cb668e5779b26404b59f13`
- Live URL: <https://alert-config-change-ledger.sociobot.in>
- Work order: `alert-config-change-ledger-verify-11`
- Verified: 29 August 2026 UTC
- Decision: **PASS — no release-blocking, major, or minor defects found.**

No product code was changed. This report, the handoff, and verification artifacts are the only repository changes.

## Prior blockers retested

The previous verification failed because its requested SHA was unavailable and claim tests could not bootstrap from a dependency-free checkout. Fresh evidence resolves both issues:

- `HEAD`, `origin/main`, and the requested candidate all resolved to `63be2fb4ae95d37225cb668e5779b26404b59f13` before testing.
- `.factory/claims.json` exists and contains 18 unique claims.
- Every listed claim command passed in ledger order before other repository inspection.
- `clean-claim-bootstrap` created a new temporary Git clone with neither Node dependency tree installed, replayed every other claim command, and exited 0: `Clean-clone claim regression passed: every ledger command ran once.`

## First-read release gate

**Pass.** In a fresh browser context at 1440 × 900, the first viewport answers all three required questions:

- What it does: **“Compare reviewed and live alert routes.”**
- Who it serves: **platform teams who need to prove whether live routes match the reviewed baseline.**
- What to do first: **“Try it with sample data.”** The adjacent text says it loads three sample changes in an isolated demo.

The action is also above the fold at 390 × 844. One click opens `/?demo=1`, shows the persistent “Demo — sample data, nothing is saved” notice, and immediately renders three changed routes with source attribution. Evidence: [desktop](qa-artifacts/verification-11/live-first-read-desktop.png), [mobile](qa-artifacts/verification-11/live-first-read-mobile.png), and [demo](qa-artifacts/verification-11/live-demo-mobile.png).

## Claims gate

Every exact `test` value in `.factory/claims.json` passed directly, then all preceding commands passed again through the clean-clone bootstrap:

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
| `clean-claim-bootstrap` | Pass |

Landing, legal-page, demo, and README claims map to the ledger. No material unlisted claim was found.

## Clean install, tests, checks, and build

- `npm ci`: pass; 24 packages installed, zero audit findings.
- `npm ci --prefix api`: pass; 25 packages installed, zero audit findings.
- `npm test`: pass; 24 Rust tests, 12 API tests, and 52 Playwright tests across desktop Chromium and 390 px mobile.
- `npm run lint`: pass; rustfmt, Clippy with warnings denied, and TypeScript type-check.
- `npm run build`: pass; optimized CLI at `target/release/alert-ledger` and production site at `dist/site/`.
- `npm audit --omit=dev`: pass, zero vulnerabilities.
- `npm audit --prefix api --omit=dev`: pass, zero vulnerabilities.
- `npm run deploy:check`: build and deployment shape passed; the dry-run found `dist/site/`, `api/`, and `staticwebapp.config.json`. Its deployment sub-process correctly stopped without a deployment token, while the npm wrapper returned 0. No deployment was attempted by this work order.

## Packaged CLI and end-to-end workflow

`cargo package --allow-dirty --locked` passed with 21 files, 123.1 KiB unpacked and 30.9 KiB compressed. The crate was unpacked into a new temporary consumer and installed with `cargo install --path … --root … --locked`.

- Installed `alert-ledger --version`: `0.1.0`.
- Help exposes `snapshot`, `diff`, `timeline`, and `demo`; no write command or prompt exists.
- Bundled demo: three changes, two matched routes, attribution to `grafana:production #live-1842`, and no plaintext sample recipient value.
- Grafana reviewed/live flow: four baseline routes, five live routes, three changes, two matches; exit 2.
- Self-comparison: no changes; exit 0.
- Alertmanager YAML: two normalized routes with recipient values stored only as fingerprints; exit 0.
- Timeline over two snapshots: one entry containing three changes; exit 2.
- Missing file and unsupported provider: clear stderr recovery messages, exit 1, and no output file.
- Automated boundary coverage passes for duplicate sibling routes, negative regex matchers, empty provider payloads, HTTP 200 error envelopes, token exclusion, and all documented output formats.

## Live functionality, accessibility, and privacy

- The factory `verify-url.sh` passed live: HTTP 200, correct title and `lang`, one H1, one main, all image alternatives, labeled buttons, and zero console/page errors.
- Playwright Axe found zero serious or critical findings on `/`, `/demo`, `/privacy`, `/terms`, `/404.html`, and a real HTTP 404, on desktop and mobile.
- Keyboard-only use passes: first Tab exposes the skip link with a 3 px teal outline and 3 px offset; Enter focuses `main`; Tab reaches the sample action; Enter opens the demo; Space selects a route and updates `aria-pressed`.
- At 390 px, every tested route has `scrollWidth === clientWidth`; no visible target is below 44 × 44 CSS px. At 200% root text size, the landing page still reflows within 390 px.
- Reduced motion matches and changes reel motion to 0.00001 seconds for one iteration with automatic scroll behavior.
- The complete demo flow made only same-origin requests for HTML, hashed JS/CSS, and the two original assets. There were no analytics, third-party runtime files, console errors, or page errors.
- The downloaded JSON report contains three changes and two matches with no raw contact value.
- Demo state uses only `demo:alert-config-ledger:*`. Leaving it removes all demo keys and preserves an unrelated real-mode sentinel.
- Clear comparison shows the designed empty state. Damaged storage shows an actionable error; **Reset demo** restores the sample.
- The registered service worker updated successfully, then `/demo` reloaded offline with the comparison and offline notice intact.
- Every rendered HTTP link returned 200; the two `mailto:` links are valid. An unknown route returns the designed page with HTTP 404.
- No sign-in exists, so the Microsoft Entra tenant requirement does not apply.

Browser evidence and browser-observed response headers: [live-browser.json](qa-artifacts/verification-11/live-browser.json). Factory captures: [verify.json](qa-artifacts/verification-11/verify.json).

## Headers, caching, deployment identity, and server limits

Browser-observed HTML responses include HSTS, `nosniff`, strict-origin referrer policy, camera/microphone/geolocation restrictions, and a CSP with header-delivered `frame-ancestors 'none'`. HTML and `sw.js` use `public, must-revalidate, max-age=30`; hashed JS/CSS use `public, max-age=31536000, immutable`; the hero uses one-hour revalidation.

Fresh production output matches the live deployment byte-for-byte for `index.html`, `404.html`, `sw.js`, hashed JS and CSS, hero art, terminal recording, and favicon. Evidence: [identity.txt](qa-artifacts/verification-11/identity.txt).

The same-origin approval-pack endpoint allowed **20 requests per 60 seconds**: requests 1–20 returned 401 without a license; request 21 returned 429 with `Retry-After: 53`, `Cache-Control: no-store, private`, build `repair-7`, and limiter store `azure-table`. The Sociobot license verifier allowed **30 requests**; request 31 returned 429 with `Retry-After: 3`. Local concurrency tests pass across handler instances and verify Azure Table ETag serialization, endpoint-wide limits, and fail-closed behavior. Only rate counters persist server-side; demo data remains browser-local. Evidence: [rate-limits.txt](qa-artifacts/verification-11/rate-limits.txt).

This is a CLI/static product with one ancillary protected-download function, not a general backend. It has no `/api/health` route; functional responses expose the function build and limiter identity.

## Performance and bundle budgets

Fresh Lighthouse 13.0.1 mobile results against the live custom domain:

| Measure | Result |
| --- | ---: |
| Performance | 94 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| FCP | 0.910 s |
| LCP | 1.765 s |
| Total blocking time | 279 ms |
| CLS | 0 |
| Initial transfer | 184,964 bytes |

The production build has 20,308 bytes raw / 7,049 bytes gzip JavaScript, 13,336 bytes raw / 3,822 bytes gzip CSS, no web font, and a 169,978-byte hero. Nine two-frame mobile route-selection probes measured a 22.5 ms median and 55.2 ms maximum. Evidence: [Lighthouse JSON](qa-artifacts/verification-11/lighthouse-live.json).

## Final result

**PASS.** Candidate `63be2fb4ae95d37225cb668e5779b26404b59f13` meets the original work order and researched brief. The previously reported deployment-only and clean-bootstrap failures do not reproduce. No defects remain from this verification.
