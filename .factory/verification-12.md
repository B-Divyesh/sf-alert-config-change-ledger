# Independent verification 12 — PASS

- Candidate: `5f26ae5e2f8e01cdbfba140346ebe23a4930b9a0`
- Live URL: <https://alert-config-change-ledger.sociobot.in>
- Work order: `alert-config-change-ledger-verify-12`
- Verified: 29 August 2026 UTC
- Decision: **PASS — no release-blocking, major, or minor defects found.**

No product code was changed. The verification report, handoff, and fresh QA
captures are the only repository changes.

## Mandatory first gates

### Claims

`.factory/claims.json` exists and contains 20 unique claims. Every exact `test`
command ran in ledger order before repository inspection and passed. The final
bootstrap claim cloned the repository into a new temporary directory with no
installed Node dependencies and replayed every preceding claim command.

| Claim | Result |
| --- | --- |
| `core-workflow` | Pass |
| `change-timestamps` | Pass |
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
| `pro-pack-contents` | Pass |
| `sales-closed` | Pass |
| `clean-claim-bootstrap` | Pass |

Landing, demo, legal-page, and README promises map to these tests. No material
unlisted claim was found.

### Cold first read

**Pass.** A fresh 1440 × 900 browser context showed, without scrolling:

- What it does: **“Compare reviewed and live alert routes.”**
- Who it serves: **platform teams proving whether live routes match the reviewed baseline.**
- What to do first: **“Try it with sample data.”** Adjacent copy says it loads
  three sample changes in an isolated demo.

At 390 × 844, the same job, audience, primary action, action explanation, and
three facts all ended above pixel 734. One click opened `/?demo=1`, displayed
the persistent “Demo — sample data, nothing is saved” banner, and immediately
showed three changes and two matched routes.

Evidence: [desktop](verification-artifacts/live-first-read-desktop.png),
[mobile](verification-artifacts/live-first-read-mobile-390x844.png), and
[mobile demo](verification-artifacts/live-demo-mobile-390x844.png).

## Clean install, checks, and production build

- `npm ci`: pass; 24 packages, zero audit findings.
- `npm ci --prefix api`: pass; 25 packages, zero audit findings.
- `npm test`: pass; 25 Rust tests, 13 API tests, and 52 Playwright tests.
- `npm run lint`: pass; rustfmt, Clippy with warnings denied, and TypeScript.
- `npm run build`: pass; release CLI plus `dist/site/` production output.
- Both production-dependency audits passed with zero vulnerabilities.

The production site contains 20,308 bytes raw / 7,049 bytes gzip JavaScript,
13,336 bytes raw / 3,822 bytes gzip CSS, no downloaded font, and a 169,978-byte
hero image. All are below the contract budgets.

## Packaged CLI and end-to-end job

`cargo package --locked --allow-dirty` passed: 21 files, 125.1 KiB unpacked and
31.3 KiB compressed. The crate was unpacked and installed with `cargo install`
into a separate temporary consumer root.

- Installed version: `alert-ledger 0.1.0`.
- Help exposes `snapshot`, `diff`, `timeline`, and `demo`; there is no write
  command or interactive prompt.
- `alert-ledger demo --json` produced three attributed changes, two matches,
  redacted recipients, and a new temporary output folder.
- Grafana reviewed/live snapshots contained four and five routes; the diff
  reported three changes and exited 2.
- Comparing a snapshot with itself returned an empty change list and exited 0.
- Alertmanager YAML normalized two routes; recipient values appeared only as
  SHA-256 fingerprints.
- A two-snapshot timeline contained the three expected changes and exited 2.
- A missing input named the unreadable path, exited 1, and created no output.
- Automated adversarial cases passed for duplicate sibling routes, negative
  regex matchers, provider error envelopes, malformed input, tokens, contact
  point types, timestamps, and documented formats.

This completes the brief's smallest useful workflow with normal, boundary, and
invalid input. The core job does not need an AI step; import, normalization,
comparison, attribution, timeline, and report export are present.

## Live product, accessibility, and recovery

- `/`, `/demo`, `/privacy`, `/terms`, and `/404.html` returned 200; a missing
  path returned the designed 404 page with HTTP 404.
- The factory URL verifier passed: correct title and `lang`, one H1, one main,
  complete image alternatives, labeled buttons, and no runtime errors.
- Axe found zero serious or critical findings on every route above, including
  the real 404, on desktop and 390 px mobile.
- Keyboard-only flow passed: first Tab exposed the skip link with a visible
  3 px teal outline; Enter focused `main`; Enter opened the demo; Space selected
  a route and exposed its detail with correct `aria-pressed` state.
- No tested route overflowed at 390 px. No visible target was below 44 × 44 CSS
  px. The landing page still reflowed without horizontal overflow at 200% text.
- Reduced motion changed scrolling to `auto` and the reel animation to one
  effectively instant iteration.
- Empty comparison, Reset demo, and corrupted-storage recovery all worked. The
  damaged-state error states the cause and provides one successful reset action.
- The downloaded sample report had three timestamped changes, two matches, and
  no raw email address or URL.
- Every rendered HTTP link returned below 400. Normal routes had no console or
  page errors; the only console message was the expected resource 404 on the
  deliberate missing-path test.

Fresh visual evidence: [desktop demo](verification-artifacts/live-demo-desktop.png),
[200% mobile text](verification-artifacts/live-mobile-text-200.png), and
[factory verifier output](verification-artifacts/verify-12-live/verify.json).

## Privacy, storage, PWA, and headers

- The complete sample flow made only same-origin requests. There were no
  analytics, third-party fonts, scripts, or runtime services.
- Demo state used only `demo:alert-config-ledger:*`. Leaving demo removed every
  demo key and preserved a non-demo sentinel.
- An invalid returned license was removed from the address bar, stored under
  `sb_license:alert-config-change-ledger`, and sent only to the documented
  Sociobot verification URL. No alert configuration was included.
- The service worker was activated, updated, controlled the next reload, and
  reloaded `/demo` offline with the comparison and offline notice intact.
- HTML and `sw.js` use `public, must-revalidate, max-age=30`; hashed JS/CSS use
  one-year immutable caching; mutable WebP art uses one-hour revalidation.
- Browser-observed headers include HSTS, `nosniff`, strict-origin referrer
  policy, camera/microphone/geolocation restrictions, and a CSP whose header
  includes `frame-ancestors 'none'` and the one allowed API connection.
- No sign-in exists, so the Microsoft Entra External ID requirement does not
  apply.

Offline evidence: [offline demo](verification-artifacts/live-demo-mobile-offline.png).

## Server limits, concurrency, and persistence boundaries

The deployed same-origin approval-pack function allowed **20 requests per 60
seconds**. Requests 1–20 returned 401 without a license; request 21 returned 429
with `Retry-After: 57`, `Cache-Control: no-store, private`, build `repair-7`,
and limiter store `azure-table`.

The Sociobot product verifier allowed **30 requests**; request 31 returned 429
with `Retry-After: 4`. Local API tests independently passed concurrent bursts,
cross-handler concurrency, Azure Table ETag serialization, endpoint-wide
protection, invalid-license throttling, and fail-closed behavior.

Only request counters persist server-side. Demo configuration remains in the
browser's isolated local namespace. The product is a CLI/static site with one
protected-download function, not a general backend; functional responses expose
the function build and limiter identity instead of a separate health route.

## Deployment identity and performance

`HEAD`, `origin/main`, and the requested candidate all resolved to
`5f26ae5e2f8e01cdbfba140346ebe23a4930b9a0`. Fresh `npm run build` output was
byte-for-byte identical to every production-served file checked: HTML, 404
assets, hashed JS/CSS, service worker, manifest, icons, original images,
terminal recording, robots file, and sitemap. The live API build marker also
matched the candidate's `repair-7` function.

Fresh Lighthouse 13.0.1 mobile results:

| Measure | Result |
| --- | ---: |
| Performance | 96 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| FCP | 0.870 s |
| LCP | 1.738 s |
| Total blocking time | 212 ms |
| CLS | 0 |
| Initial transfer | 184,901 bytes |

Evidence: [Lighthouse JSON](verification-artifacts/lighthouse-live.json).

## Findings and final result

No defects were found.

**PASS.** Candidate `5f26ae5e2f8e01cdbfba140346ebe23a4930b9a0`
meets the original builder work order and researched brief. The live deployment
is healthy and matches the candidate; no prior deployment-only failure
reproduced.
