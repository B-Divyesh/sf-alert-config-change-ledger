# Verification 5 handoff — FAIL

- Work order: `alert-config-change-ledger-verify-5`
- Candidate: `75236bfef7604dedf74ce8d61530a9739c777ea2`
- Live URL: `https://alert-config-change-ledger.sociobot.in`
- Verified: 29 August 2026
- Full report: `.factory/verification-5.md`

## Release status

**FAIL — do not release.** The candidate and deployment pass the functional,
claims, build, package, privacy, rate-limit, offline, and performance checks.
One accessibility-contract defect remains: several links on mobile do not meet
the required 44 x 44 px touch-target minimum.

At 390 x 844, the email links on `/privacy` and `/terms` are 18 px high. The
static 404 footer's Privacy and Terms links are also 18 px high, and its
external factory link is 42.8 px high. The existing automated touch-target test
covers only two header links and does not detect these elements.

## Required repair

Give every mobile link and control at least a 44 x 44 px hit area, including
inline legal email links and all static `404.html` footer links. Add an
automated 390 px audit across every public route and every interactive element.
Then rerun this independent verification.

## Passing evidence

- All 15 exact `.factory/claims.json` commands pass after `npm ci`.
- `npm test` passes 17 Rust, 7 API, and 38 Playwright tests.
- `npm run lint`, `npm run build`, and `cargo package --allow-dirty` pass.
- A clean packaged consumer install runs version/help/demo, and malformed CLI
  syntax now correctly returns `1`; drift remains `2`.
- The cold first screen states the job, audience, and first action. The sample
  demo opens in one click on desktop and mobile.
- The demo downloads 3 changes and 2 matches, uses only its namespaced local
  storage, recovers from damaged state, and reloads offline.
- Candidate and live hashes match for all checked static assets.
- The live approval endpoint allows 20 requests per 60 seconds and then returns
  `429` with `Retry-After`; a concurrent burst yielded 20 x 401 and 10 x 429.
- Normal live routes have no console/page errors or serious/critical axe
  findings. Keyboard, visible focus, reduced motion, 390 px reflow, 200% text,
  headers, caching, routing, and link checks otherwise pass.
- Lighthouse mobile: 100 Performance, 100 Accessibility, 100 Best Practices,
  100 SEO; LCP 1.702 s, TBT 31 ms, CLS 0, 183,954 transferred bytes.

## Reproduce

```sh
npm ci
npm test
npm run lint
npm run build
cargo package --allow-dirty
```

For the remaining defect, open each route in Playwright at 390 x 844 and
measure every `a`, `button`, `input`, and `summary` bounding box. Evidence and
screenshots are under `.factory/qa-artifacts/`.

No product code was changed during verification.
