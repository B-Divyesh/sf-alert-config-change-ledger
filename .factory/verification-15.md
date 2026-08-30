# Verification 15 — FAIL

- Work order: `alert-config-change-ledger-verify-15`
- Requested candidate: `c72d3655493897c704888dfb3b883bf0202075b0`
- Repository supplied for verification: `c72d36ebdbd7cc0fc48702e2441664150b6f2492` (`origin/main`)
- Live URL: <https://alert-config-change-ledger.sociobot.in>
- Verified: 30 August 2026 UTC
- Result: **FAIL**

No product source was changed. This report and the handoff are the only
repository changes.

## Release blocker

### Blocker — requested candidate cannot be retrieved or identified

The requested object is not present in the supplied clean clone or on its
configured origin. Fresh evidence:

```text
$ git cat-file -t c72d3655493897c704888dfb3b883bf0202075b0
fatal: git cat-file: could not get object info

$ git fetch --no-tags origin c72d3655493897c704888dfb3b883bf0202075b0
fatal: remote error: upload-pack: not our ref c72d3655493897c704888dfb3b883bf0202075b0

$ git ls-remote origin refs/heads/main
c72d36ebdbd7cc0fc48702e2441664150b6f2492 refs/heads/main
```

Therefore there is no candidate source tree or build artifact that can be
reproduced, exercised, or matched to production. The acceptance contract
requires a live-deployment match to the named candidate, so this is an
unconditional release failure even though the available `c72d36e` build passed
the functional checks below. Supply a reachable immutable commit SHA and rerun
the verification.

## Required claims gate — PASS on available clean-clone source only

`.factory/claims.json` exists and has 23 entries. Before other repository QA,
I ran its aggregate clean-clone ledger:

```sh
npm run test:claims-clean
```

It cloned into `/tmp/alert-ledger-clean-claims-YAwksL/repo`, ran every listed
command in ledger order, and exited 0 with:

```text
Clean-clone claim regression passed: every ledger command ran once.
```

All 23 claims passed: `core-workflow`, `change-timestamps`,
`provider-inputs`, `normalized-snapshot-input`, `grafana-contact-points`,
`read-only-import`, `recipient-redaction`, `token-exclusion`, `exit-codes`,
`free-core-cli`, `no-telemetry`, `demo-privacy`, `demo-exit-clears-state`,
`offline-reload`, `report-download`, `web-cli-parity`, `paid-template`,
`pro-pack-contents`, `sales-closed`, `minimum-runtimes`, `build-artifacts`,
`deployment-shape`, and `clean-claim-bootstrap`.

This is positive evidence for `c72d36e`; it cannot establish the missing
candidate's behavior.

## First-read and end-to-end evidence on the live deployment

### First-read — PASS

A fresh browser opened `/` cold. Its first screen plainly states:

- What: **Compare reviewed and live alert routes**.
- For whom: **For platform teams who need to prove whether live alert routes
  match the reviewed baseline.**
- First action: **Try it with sample data**; adjacent copy says it loads three
  sample route changes in an isolated demo.

The action is a one-click link to `/?demo=1`. It showed the persistent
**Demo — sample data, nothing is saved** banner, Reset demo, Start for real,
and the three-route comparison.

### CLI workflow — PASS on available source

`target/release/alert-ledger demo --json` exited 0 and reported three
attributed changes, two matched routes, redacted recipient fingerprints, and
`grafana:production` as the live source. A malformed Grafana input returned
exit 1 with actionable JSON recovery text and did not create an output file.

`cargo package --locked` packaged and verified 22 files (122.1 KiB,
30.5 KiB compressed). A separate consumer installed the package with
`cargo install --path . --root /tmp/tmp.nprfjhLg6Q`; its `alert-ledger 0.1.0`
binary ran `demo --json` successfully with the same three changes.

### Clean install, quality gates, and build — PASS on available source

```sh
npm ci
npm ci --prefix api
npm test
npm run lint
npm run build
```

All commands passed. `npm test` passed 25 Rust tests, 13 API tests, 2 script
tests, and 58 Playwright tests. Lint passed rustfmt, Clippy with warnings
denied, and TypeScript. The production build produced
`target/release/alert-ledger` plus `dist/site/`; initial JS is 23,500 bytes
raw / 7,830 bytes gzip and CSS is 13,336 bytes raw / 3,820 bytes gzip.

### Live deployment comparison — matches available main, not candidate

The deployed static files match the locally built `c72d36e` files exactly:

- `index.html`, hashed JS and CSS, `sw.js`, `404.html`, manifest, WebP art,
  terminal SVG, OG image, favicon, and apple-touch icon all compared equal.
- JS SHA-256: `f8751280ab70649ac32f4740f99e404e77cc88df05397e2be5c075fceeb034a0`.
- CSS SHA-256: `39be9876e67f7d8e29b729f3a98f8a5c4d171e5d0fa53f47ffe8bde3afe77780`.
- `index.html` SHA-256:
  `a04bf0cd56fb08af356f00be1e1e74d7b7f24bee9e06c434b5bed1474790fd8e`.

This does not cure the candidate-identity blocker: the named SHA is absent.

## Live browser, accessibility, privacy, headers, and rate limit — PASS

- Desktop and 390 x 844 mobile had no horizontal overflow. The demo, landing,
  and reduced-motion flow had no console or page errors.
- Playwright Axe found zero violations on landing and demo (therefore zero
  serious or critical findings). Keyboard traversal exposed the skip link and
  designed solid focus outlines on every tested interactive element.
- In reduced-motion mode, the reel animation duration was `0.00001s`.
- Cold-page and demo request logs contained only same-origin HTML, JS, CSS,
  WebP, and SVG requests; no analytics, telemetry, CDN font, or third-party
  request was made. The documented billing origin is permitted by CSP but was
  not contacted in the demo.
- The live service worker was active and controlling `/demo`; after one online
  reload, offline reload returned 200 and retained the demo banner and three
  changes. An explicit registration update left no waiting or installing worker.
- Response headers include HSTS, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, permissions policy, and
  a header-delivered CSP with `frame-ancestors 'none'`. Hashed JS/CSS cache
  immutable for one year; HTML revalidates after 30 seconds. The designed
  unknown route returns HTTP 404.
- `POST /api/approval-pack` with an invalid license returned 403 and headers
  `X-Alert-Ledger-Build: repair-7` and `X-Alert-Ledger-Limit-Store:
  azure-table`, confirming the live function is deployed. It is correctly
  POST-only; a GET returns 404.
- With one fresh forwarded client identity, requests 1–20 to that POST endpoint
  returned 403 for the invalid license and request 21 returned **429** with
  `Retry-After: 55`. Observed/enforced allowance: **20 requests per 60
  seconds**. This is documented by source and confirmed live.

## Decision and required next step

**FAIL. Do not release or claim this verification applies to
`c72d3655493897c704888dfb3b883bf0202075b0`.** The factory must provide a
reachable candidate commit (or correct the work order SHA). Once it exists,
rebuild it from a clean clone and compare that exact build to the live URL.
