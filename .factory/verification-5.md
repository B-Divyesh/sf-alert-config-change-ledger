# Independent product verification 5 — FAIL

Verified 29 August 2026 against candidate commit
`75236bfef7604dedf74ce8d61530a9739c777ea2` and the live deployment at
`https://alert-config-change-ledger.sociobot.in`.

## Verdict

**FAIL — do not release.** The product's main CLI and web-demo workflows work,
all registered claim tests pass after the documented clean install, the live
deployment matches the candidate, and both previously reported parser-exit and
API-rate-limit defects are repaired. However, several mobile links miss the
attached accessibility contract's non-negotiable 44 x 44 px touch-target
minimum.

## Release-blocking finding

### Medium — legal and 404 links have undersized touch targets

At a 390 x 844 viewport, fresh Playwright measurements found:

| Route | Link | Measured size |
| --- | --- | ---: |
| `/privacy` | `privacy@sociobot.in` | 182.4 x 18 px |
| `/terms` | `support@sociobot.in` | 182.4 x 18 px |
| `/missing-tape` and `/404.html` | `Privacy` | 67.2 x 18 px |
| `/missing-tape` and `/404.html` | `Terms` | 48 x 18 px |
| `/missing-tape` and `/404.html` | `Built by Param Factory` | 307.3 x 42.8 px |

These links are usable, and axe does not classify them as serious or critical,
but each is smaller than the acceptance contract's required 44 px target in at
least one dimension. The checked-in browser suite tests only the home wordmark
and Demo header link, both of which correctly measure 44 x 44 px, so it misses
the affected legal and static-404 links.

Required remediation: give every mobile interactive element a minimum 44 px
hit area, including inline legal email links and links in `404.html`, then add
a route-wide mobile regression test.

## Required first-read and demo gates — PASS

The first cold live viewport answers all three required questions in plain
words:

- What: **“Trace every alert route change.”**
- Who: platform teams checking live alert routes against a reviewed baseline.
- First action: **Try it with sample data**, with adjacent copy explaining that
  it loads three realistic changes in an isolated demo.

The action is fully visible at 1366 x 768 (`y=694.44`, bottom `743.23`) and at
390 x 844 (`y=434.22`, bottom `483.02`). One click opens `/demo`, where the
persistent sample-data banner, three changed routes, two matched routes, and
attribution are immediately visible. Evidence:
[desktop cold page](qa-artifacts/live-first-read-desktop.png) and
[mobile cold page](qa-artifacts/live-first-read-mobile.png).

The live demo selected a route with keyboard or pointer input, showed the
change detail, downloaded `alert-ledger-sample-report.json` with 3 changes and
2 matched routes, entered its empty and damaged-state views, recovered through
Reset demo, and used only `demo:alert-config-ledger:state`.

## Claims gate — PASS after clean install

`.factory/claims.json` exists with 15 entries. Before repository inspection,
each exact command was invoked. As expected in an uninstalled clean clone, the
six npm commands initially stopped because `@playwright/test` was absent. After
the documented `npm ci` prerequisite (24 packages, zero audit findings), every
listed command passed exactly:

- CLI claims, 9/9: `core-workflow`, `provider-inputs`,
  `grafana-contact-points`, `read-only-import`, `recipient-redaction`,
  `token-exclusion`, `exit-codes`, `free-core-cli`, and `no-telemetry`.
- Browser/API claims, 6/6: `demo-privacy`, `offline-reload`,
  `report-download`, `web-cli-parity`, `paid-template`, and `sales-closed`.

Landing and README promises are represented by these claims; no new unlisted
product claim was found.

## Local quality gates and packaged CLI

- `npm ci`: pass; 24 packages installed and zero vulnerabilities reported.
- `npm test`: pass; 17 Rust tests, 7 API tests, and 38 Playwright tests.
- `npm run lint`: pass; rustfmt, strict Clippy, and TypeScript type checking.
- `npm run build`: pass; produced `target/release/alert-ledger` and
  `dist/site/`.
- Built initial assets: 16.97 KB JavaScript (6.12 KB gzip) and 13.20 KB CSS
  (3.78 KB gzip). The hero is 169,978 bytes and there are no web-font bytes.
- `cargo package --allow-dirty`: pass; 57 files, 306.3 KiB unpacked and 84.1
  KiB compressed.
- The packaged crate was installed with `cargo install --locked` into a fresh
  temporary consumer root. `--version`, `--help`, and `demo --json` worked;
  the demo contained 3 changes and no raw recipient endpoints. The prior
  regression now passes independently: malformed Clap input returns `1`, not
  the drift code `2`.

Manual release-binary workflows also passed. Grafana snapshots produced 4
reviewed and 5 live routes; their diff produced 3 changes, 2 matches, and exit
`2`. Comparing a snapshot with itself returned `0`. A two-snapshot timeline
returned `2`; Alertmanager YAML produced 2 routes. Malformed JSON, unsupported
provider, invalid RFC 3339 time, missing directory, and malformed option all
returned `1` with recovery text. Five Grafana contact-point types (PagerDuty,
Opsgenie, Slack, webhook, and email) each produced recipient drift while raw
endpoints and credentials stayed absent from snapshots and reports.

## Live deployment, privacy, and server endpoint

- Local and live SHA-256 hashes match exactly for `index.html`, hashed JS and
  CSS, `sw.js`, hero/social art, favicon, touch icon, and terminal SVG. The
  candidate is what is deployed. For example, HTML is
  `ecc9ae8744b47678f2574cc478a6ccb4cd118c0ada6bceda58997b80f2377fb0`
  and JS is
  `71b6cf6ea64ff94b4e376494025c4721ae23f85890275da3c67335f61672e650`.
- `/`, `/demo`, `/privacy`, `/terms`, robots, sitemap, manifest, service
  worker, and public assets return 200. `/missing-tape` and the former public
  approval-template URL correctly return the designed 404.
- All discovered non-404 HTTP links return 200; mail links were identified and
  not fetched.
- Normal-route browser use produced no console or page errors. The deliberate
  HTTP-404 navigation produced Chrome's expected failed-resource diagnostic,
  with no script exception.
- The demo's complete normal flow made no cross-origin request. A deliberately
  supplied invalid license was stored only under the documented namespaced
  keys, removed from the address bar, sent only to the Sociobot product verify
  URL, and displayed “License no longer active.” No analytics, remote fonts,
  or third-party scripts loaded.
- Live HTML sends HSTS, CSP with response-header `frame-ancestors`, `nosniff`,
  strict referrer policy, and permissions policy. HTML and `sw.js` revalidate
  after 30 seconds, hashed assets are one-year immutable, and mutable WebP art
  revalidates after one hour.
- The approval-pack function is live. A fresh concurrent 30-request burst from
  one client returned 20 x 401 and 10 x 429 in completion order; every 429 had
  `Retry-After: 60`, and every response was `no-store, private`. The observed
  allowance is **20 requests per 60 seconds**. Unit/API integration tests also
  cover invalid-license and rotating-forwarded-identity bursts.
- Sign-in is not part of this product. There is no alternate identity provider
  to assess. New license sales are intentionally closed in this release.

## Accessibility, responsive behavior, PWA, and performance

- One `h1`, one `main`, `lang=en`, route-specific titles, image alternatives,
  and no serious/critical axe findings were confirmed on `/`, `/demo`,
  `/privacy`, `/terms`, `/missing-tape`, and `/404.html`.
- Keyboard smoke testing confirmed the skip link is first, moves focus to
  `main`, and has a visible 3 px outline. Demo navigation works with Enter and
  route selection with Space. No keyboard trap was found.
- Every tested route had no horizontal overflow at 390 px. Home and both 404
  forms reflowed without overflow at 200% root text size.
- Reduced motion resolves to `scroll-behavior: auto` and 0.01 ms animation and
  transition durations.
- The factory `verify-url.sh` passed in 897 ms with no console errors; its JSON
  is at [verify.json](qa-artifacts/verify-url/verify.json).
- Service-worker `update()` succeeded; `/sw.js` controlled the page with cache
  `alert-ledger-shell-v2`. A subsequent offline `/demo` reload returned 200
  and retained both the offline notice and sample comparison.
- Fresh Lighthouse 12.8.2 mobile scores: Performance 100, Accessibility 100,
  Best Practices 100, SEO 100; FCP 0.817 s, LCP 1.702 s, TBT 31 ms, CLS 0,
  transfer 183,954 bytes. INP was not emitted for the load-only run; a separate
  interaction trace measured a maximum event duration of 64 ms. Full report:
  [lighthouse-live.json](qa-artifacts/lighthouse-live.json).

## Missed-leverage review

No AI feature is appropriate for deterministic normalization, redaction, and
diffing. The brief's valuable import/export and comparison loop is present in
the CLI and sample demo rather than replaced with a speculative feature.
