# Repair 5 handoff — PASS

- Work order: `alert-config-change-ledger-repair-5`
- Repaired candidate: `75236bfef7604dedf74ce8d61530a9739c777ea2`
- Verifier report: `.factory/verification-5.md` at `ffc5abe08c9bd7545775303911e226e49917778c`
- Repair commit: `fd14cfa43c8bb2f36128c2812f06b04811d7d09a`
- Live URL: `https://alert-config-change-ledger.sociobot.in`
- Verified: 29 August 2026

## Release status

**PASS.** The sole Verification 5 release blocker is repaired. The product remains a Rust CLI with its static Vite documentation and demo site. No researched behavior, claim, paid boundary, or deployment class changed.

## Finding, reproduction, and root-cause repair

The existing mobile regression measured only the home wordmark and Demo header link. It did not inspect inline legal links or the separate static 404 document.

A new Playwright test audits every visible link, button, input, select, textarea, summary, ARIA button, and keyboard-tab control at 390 x 844 on `/`, `/demo`, `/privacy`, `/terms`, `/missing-tape`, and `/404.html`. Before the CSS repair, it failed exactly as the verifier reported: `/privacy` `privacy@sociobot.in` measured 182.4 x 18 px.

The repair gives the legal mail links an inline-flex 44 px minimum height on mobile. It also gives every static-404 footer link an inline-flex 44 x 44 px minimum target and a wrapping footer layout. The route-wide regression now passes in both Playwright projects. Live measurements report a minimum of exactly 44 x 44 px on every audited route, including `support@sociobot.in`, both 404 legal links, and `Built by Param Factory`.

## Clean install, claims, tests, and build

- `npm ci`: pass; 24 packages installed, zero audit findings.
- Every exact command in `.factory/claims.json`: pass, 15/15.
- `npm test`: pass; 17 Rust tests, 7 API tests, and 38 Playwright tests across desktop Chromium and the 390 x 844 mobile project.
- `npm run lint`: pass; rustfmt, strict Clippy, and TypeScript checks passed.
- `npm run build`: pass; produced `target/release/alert-ledger` and `dist/site/`.
- `npm audit --omit=dev`: pass; zero vulnerabilities.
- `cargo package --allow-dirty`: pass; 57 files, 306.3 KiB unpacked and 84.1 KiB compressed.
- Fresh package consumer: installed `target/package/alert-config-change-ledger-0.1.0` into a new temporary Cargo root. Version `0.1.0`, help, and `demo --json` passed; malformed syntax returned exit `1`.
- Built initial assets: 16.97 KB JavaScript (6.12 KB gzip), 13.29 KB CSS (3.80 KB gzip), and zero web-font bytes.

## Browser and accessibility evidence

- Factory `verify-url.sh` against production: pass in 1,073 ms; correct title and `lang=en`, one H1, one main landmark, no missing image alternatives, no unlabeled buttons, and no console errors.
- Playwright axe on all six public routes at 390 x 844: zero serious or critical findings.
- Mobile interaction audit: `/` 13 controls, `/demo` 15, and each other route 9; every route's smallest control is 44 x 44 px.
- Responsive checks: zero horizontal overflow on every route at 390 px and at 200% root text size.
- Desktop first action: at 1366 x 768 the sample action spans y=694.44–743.23; at 1440 x 900 it spans y=715.77–764.56. It is fully visible in both first screens.
- Keyboard: the skip link receives first focus and moves focus to `main`; Enter opens Demo; Space selects a route and updates `aria-pressed`; no trap was found.
- Reduced motion: root scrolling resolves to `auto`; the reel animation resolves to 0.01 ms and one iteration.
- Evidence: `.factory/qa-artifacts/repair-5-live/` and `.factory/qa-artifacts/repair-5-lighthouse.json`.

## Privacy, offline, response policy, and API

- The live demo flow made no cross-origin request and used only its namespaced demo state.
- Service-worker `update()` passed. The page was controlled under cache `alert-ledger-shell-v2`; an offline `/demo` reload returned 200 and displayed its offline notice and comparison.
- Live `/`, `/demo`, `/privacy`, `/terms`, and `/404.html` return 200; `/missing-tape` returns the designed 404.
- HTML and `sw.js` use `public, must-revalidate, max-age=30`; hashed assets use one-year immutable caching; mutable WebP art uses one-hour must-revalidate caching.
- Live HTML sends HSTS, CSP with response-header `frame-ancestors 'none'`, `nosniff`, strict referrer policy, and camera/microphone/geolocation restrictions.
- An unlicensed live `POST /api/approval-pack` returns 401, `private, no-store`, `nosniff`, and no paid content.

## Deployment and identity

`npm run deploy` completed with the existing Azure Static Web App deployment token and the checked-in `production` configuration. It deployed both `dist/site/` and `api/`; the provider confirmed `https://ambitious-plant-0066aae10.7.azurestaticapps.net`, and the product custom domain serves the release over HTTPS.

Local and live SHA-256 values match for all checked release assets. Key identities:

- `index.html`: `7e53b5cbdee269868d9443b92a08779c7796b1e916aafe14e0e033d090dd81c1`
- `assets/index-BSDiTf0P.css`: `f406ea9d0844c45d782121fcfd10936968ee82dbe798a061b1ad739e6b22b985`
- `assets/index-DKeTnJBg.js`: `71b6cf6ea64ff94b4e376494025c4721ae23f85890275da3c67335f61672e650`
- `404.css`: `e68c0fc87921756b6f4e49f82dce3671534ba22b515b5ba62988c0e09fe04001`
- `404.html`: `2e1cab30a8bb7a7031e70ce9b8e1d0c6beb2e78b4fddebc0ae7754208ac287c1`
- `sw.js`: `6fdf4caf614a339d586205ce82cf475883eaa31cdd1ec0d81da5f24d7b8708b5`

The repair commit is present on `origin/main`.

## Performance

Fresh Lighthouse 12.8.2 mobile run against production:

| Measure | Result |
| --- | ---: |
| Performance | 100 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| FCP | 0.828 s |
| LCP | 1.680 s |
| Total blocking time | 7 ms |
| CLS | 0 |
| Transfer bytes | 183,983 |

## Known gaps and next steps

No release-blocking gap remains from Verification 5. New Pro license sales remain intentionally closed in this release; existing-license verification and the server-side paid-content boundary remain in place.
