# Independent verification 9 — FAIL

- Candidate: `b7422ea2f881f932ee439c666bf0ab1c2703f4de`
- Live URL: <https://alert-config-change-ledger.sociobot.in>
- Work order: `alert-config-change-ledger-verify-9`
- Verified: 29 August 2026 UTC
- Decision: **FAIL — the deployment is healthy and matches the candidate, but the CLI accepts empty or unrelated JSON as a real alert configuration and fabricates a route.**

No product code was changed during verification.

## Release-blocking finding

### P1 — invalid provider data becomes a fabricated successful snapshot

`alert-ledger snapshot` does not validate that a Grafana or Alertmanager object has the minimum shape of an alert-routing export. An empty object, or a JSON error envelope returned with HTTP 200, exits successfully and writes a made-up `default route` with an `unassigned` recipient.

Fresh packaged-consumer reproductions:

```text
$ printf '{}' > empty.json
$ alert-ledger snapshot --provider grafana --input empty.json --source empty --output empty-snapshot.json
Wrote 1 routes to empty-snapshot.json
$ echo $?
0

$ printf '{"message":"Access denied"}' > response.json
$ alert-ledger snapshot --provider grafana --input response.json --source grafana:live --output response-snapshot.json
Wrote 1 routes to response-snapshot.json
$ echo $?
0
```

Both outputs contain:

```json
{
  "name": "default route",
  "path": "root",
  "recipients": [{ "name": "unassigned", "channels": [], "fingerprints": [] }]
}
```

The same empty-object case also exits `0` for `--provider alertmanager`. This is release-blocking for an audit tool: a wrong export or a provider/proxy error body can be recorded as live configuration instead of stopping with an actionable input error. That can create misleading drift evidence during an incident or handoff. Expected behavior is exit `1`, no snapshot, and a message naming the missing route/policy fields.

Evidence: [invalid-input results](qa-artifacts/verification-9/invalid-input.txt).

## First-read gate

The cold live first screen passes at desktop and 390 px mobile.

- What it does: **“Compare reviewed and live alert routes.”**
- Who it is for: **“For platform teams who need to prove whether live alert routes match the reviewed baseline.”**
- What to click first: **“Try it with sample data.”** Adjacent copy says it loads three sample route changes in an isolated demo.
- The action is visible without scrolling at 1440 × 900 and 390 × 844. It opens a working demo in one click.

Evidence: [desktop](qa-artifacts/verification-9/cold-desktop.png), [mobile](qa-artifacts/verification-9/cold-mobile.png), and [browser results](qa-artifacts/verification-9/live-browser.json).

## Mandatory claims gate

`.factory/claims.json` exists with 17 unique claims. After the documented clean installs (`npm ci` and `npm ci --prefix api`), every listed command passed exactly as written.

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

Evidence: [claim summary](qa-artifacts/verification-9/claims-summary.txt). Landing and README claims map to the registered checks; no material unlisted marketing claim was found.

## Clean install, gates, and package consumer

- `npm ci`: pass; 24 packages, zero audit findings.
- `npm ci --prefix api`: pass; 25 packages, zero audit findings.
- `npm test`: pass; 22 Rust tests, 12 API tests, and 52 Playwright tests.
- `npm run lint`: pass; rustfmt, Clippy with warnings denied, and TypeScript.
- `npm run build`: pass; release binary and `dist/site/` produced.
- `npm audit --omit=dev` and `npm audit --prefix api --omit=dev`: pass, zero vulnerabilities.
- `cargo package`: pass; 21 files, 119.0 KiB unpacked and 30.0 KiB compressed.
- The `.crate` was extracted into a new temporary consumer and installed into an isolated Cargo root. `alert-ledger --version` returned `0.1.0`; `demo` and `demo --json` both exited `0` and reported three changes.

## Independent CLI workflow

- Grafana baseline/live snapshots: four reviewed routes, five live routes.
- JSON and Markdown diffs: three changes, two matches, drift exit `2`.
- Self-diff: no changes, exit `0`.
- Timeline across two snapshots: one entry with three changes, exit `2`.
- Alertmanager through stdin: one route, exit `0`.
- Output to a missing nested directory: parent directory created and snapshot written.
- Unsupported provider, malformed ledger JSON, insecure remote HTTP URL, missing input, missing timeline directory, and invalid RFC 3339 timestamp: exit `1` with recovery guidance.
- Generated JSON and Markdown contained no sample email address or webhook URL; recipient values were represented by SHA-256 fingerprints.
- `--help` exposes only `snapshot`, `diff`, `timeline`, and `demo`; no write command exists.

The invalid-empty/envelope cases above are the sole core-workflow failure found.

## Live deployment, privacy, and accessibility

- Factory `verify-url.sh`: pass; HTTP 200, correct title and `lang`, one H1, one main, image alternatives, labeled buttons, and no console errors.
- Axe on `/`, `/demo`, `/privacy`, `/terms`, `/404.html`, and a missing route: zero serious or critical findings.
- Keyboard: first Tab exposes the skip link with a 3 px teal focus ring; Enter focuses `main`; Enter opens the sample demo; Space selects a route and updates `aria-pressed`.
- At 390 × 844, there is no horizontal overflow and no visible control is below 44 × 44 CSS px. At 200% root text size, there is still no horizontal overflow.
- Reduced motion changes scrolling to `auto` and motion durations to `0.00001s`.
- Demo download contains three changes and two matches, with no raw recipient contact data.
- The live demo made only same-origin requests and produced no console/page errors. Leaving demo mode removed all demo-prefixed storage while retaining a non-demo sentinel.
- The service worker updated successfully; `/demo` reloaded offline with its notice and the same three-change comparison.
- All rendered HTTP links returned 200; mail links were valid `mailto:` links. The designed missing route returned the custom 404 with HTTP 404.
- There is no sign-in flow, so the Microsoft Entra tenant requirement does not apply.

Evidence: [browser audit](qa-artifacts/verification-9/live-browser.json), [factory check](qa-artifacts/verification-9/verify.json), and [link check](qa-artifacts/verification-9/link-check.json).

## Headers, caching, request allowance, and identity

- HTML responses carry HSTS; CSP with `frame-ancestors 'none'`; `nosniff`; strict-origin referrer policy; and camera, microphone, and geolocation restrictions.
- HTML and `sw.js`: `public, must-revalidate, max-age=30`.
- Hashed JavaScript/CSS: `public, max-age=31536000, immutable`.
- Hero WebP: `public, max-age=3600, must-revalidate`.
- The approval-pack allowance is **20 requests per 60 seconds**. From one client, requests 1–20 returned 401 and requests 21–25 returned 429. The first 429 included `Retry-After: 52`, `Cache-Control: no-store, private`, `X-Alert-Ledger-Build: repair-7`, and `X-Alert-Ledger-Limit-Store: azure-table`.
- Local API tests passed concurrent-request, multiple-handler shared-store, Azure Table ETag, endpoint-wide ceiling, and fail-closed cases. Only rate counters persist server-side; the demo remains browser-local.
- This is a CLI/static product with one ancillary function, not a general backend. `/api/health` is not defined; functional responses expose build and limiter identity.
- Candidate and live `index.html`, hashed JS, hashed CSS, `sw.js`, `404.html`, hero art, and terminal demo match byte-for-byte.

Evidence: [headers](qa-artifacts/verification-9/headers.txt), [rate statuses](qa-artifacts/verification-9/rate-statuses.txt), [429 headers](qa-artifacts/verification-9/rate-429.headers), and [identity hashes](qa-artifacts/verification-9/identity.txt).

## Performance and budgets

Fresh production Lighthouse mobile results:

| Measure | Result |
| --- | ---: |
| Performance | 95 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| FCP | 0.870 s |
| LCP | 1.742 s |
| Total blocking time | 259 ms |
| CLS | 0 |
| Initial transfer | 184,943 bytes |

The production build contains 20,308 bytes raw / 7,049 bytes gzip JavaScript, 13,336 bytes raw / 3,822 bytes gzip CSS, a 169,978-byte hero, and no web font. Three two-frame route-selection probes took 28.3–62.8 ms; Lighthouse does not report lab INP.

Evidence: [Lighthouse JSON](qa-artifacts/verification-9/lighthouse.json).

## Result and next step

**FAIL.** Deployment, claims, accessibility, privacy, packaging, and performance pass. Release remains blocked until Grafana and Alertmanager imports reject objects that are not valid routing exports, with regression tests for `{}` and HTTP-200 error envelopes. After repair, rerun all 17 claim commands and this invalid-input matrix.
