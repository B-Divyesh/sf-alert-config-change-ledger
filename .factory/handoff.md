# Repair 6 handoff — PASS

- Work order: `alert-config-change-ledger-repair-6`
- Failed candidate: `784d9778eeae05c970d8e82ec13c2fb8ccfeba5a`
- Verifier report: `.factory/verification-6.md` at `a49cf0aa384729daab98b1aa58b0df617cd8f59c`
- Repair commit: `baab1aa`
- Live URL: <https://alert-config-change-ledger.sociobot.in>
- Verified: 29 August 2026

## Release status

**PASS.** Both Verification 6 release blockers are repaired. The product remains a Rust CLI with a static Vite documentation and demo site. Its scope, visual system, deployment class, CLI behavior, privacy boundary, and paid boundary are unchanged.

## Findings repaired

### Shell-history wording

The README no longer says that typing an `export` command keeps a token out of shell history. It now states only the tested behavior: Grafana URL imports read the bearer token from an environment variable, send it as request authorization, and do not write it to snapshots.

The regression `README token guidance makes no shell-history promise` rejects the verifier's exact unsafe wording and confirms the existing tested token-exclusion statement remains present.

### Demo-state deletion claim

The Privacy page's existing promise is now registered as claim `demo-exit-clears-state`. `Start for real` clears every localStorage item under `demo:alert-config-ledger:` instead of removing only the current state key.

The tagged browser regression starts in a fresh `/demo` context, proves the normal state exists, adds a second demo-prefixed key and a real-mode verdict, activates **Start for real**, checks the `/#install` destination, confirms no demo-prefixed key remains, and confirms the real-mode verdict remains. It passes in desktop Chromium and the 390 px mobile project.

## Clean install, claims, tests, and build

- `npm ci`: pass; 24 packages installed, zero audit findings.
- Every exact command in `.factory/claims.json`: pass, 16/16. Every claim ID is unique and has exactly one tagged test.
- `npm test`: pass; 17 Rust tests, 7 API tests, and 42 Playwright tests across desktop Chromium and 390 × 844 mobile.
- `npm run lint`: pass; rustfmt, strict Clippy, and TypeScript checks passed.
- `npm run build`: pass; produced `target/release/alert-ledger` and `dist/site/`.
- `npm audit --omit=dev`: pass; zero vulnerabilities.
- `cargo package --allow-dirty`: pass; 57 files, 306.2 KiB unpacked and 84.1 KiB compressed.
- Fresh package consumer: installed the packaged crate into a new Cargo root. Version `0.1.0`, help, and `demo --json` passed; the demo reported three changes and invalid input returned exit `1`.
- Built initial assets: 17,088-byte JavaScript (6.19 KB gzip), 13,291-byte CSS (3.80 KB gzip), and zero web-font bytes.

## Browser, accessibility, privacy, and offline evidence

- Factory `verify-url.sh`: local `/demo` passed in 537 ms and live `/demo` passed in 753 ms. Both report the correct title and `lang=en`, one H1, one main landmark, no missing image alternatives, no unlabeled buttons, and no console errors.
- Live axe checks on `/`, `/demo`, `/privacy`, `/terms`, and `/404.html`: zero serious or critical findings.
- Desktop keyboard smoke test: first Tab focuses **Skip to main content** and Enter moves focus to `main`.
- Live 390 × 844 demo: document and viewport widths both equal 390 px; smallest interactive target is exactly 44 × 44 px.
- Reduced motion: root scroll behavior is `auto`; reel animation is 0.01 ms and one iteration.
- Demo privacy: normal flow made no cross-origin request and initially stored only `demo:alert-config-ledger:state`. Exit removed the full demo namespace while leaving real-mode state intact.
- Service-worker `update()` passed. An offline `/demo` reload returned 200 and showed both the offline notice and the three-change comparison.
- Every same-page anchor resolves. Every crawlable internal link and the external Param Factory link returned 200; mail links were identified and skipped.
- Evidence: `.factory/qa-artifacts/repair-6-local/`, `.factory/qa-artifacts/repair-6-live/`, and `.factory/qa-artifacts/repair-6-lighthouse.json`.

## Deployment, response policy, and live identity

`npm run deploy` rebuilt and deployed `dist/site/` plus `api/` using the checked-in `production` configuration. Azure confirmed <https://ambitious-plant-0066aae10.7.azurestaticapps.net>; the custom domain serves the same release over HTTP/2 with a valid TLS chain.

- `/`, `/demo`, `/privacy`, `/terms`, `/404.html`, `robots.txt`, and `sitemap.xml` return 200. `/missing-tape` returns the designed 404.
- Local and live files match byte-for-byte. Key SHA-256 identities: `index.html` `e1393a5315e464d249bd3f3c02d34d8bd14985358b47b5e6c7e6b652d2901060`; JavaScript `78fe1f6284f6f571fc48175f209df0b912f9b8fbff77f696527448c0beedfa81`; CSS `f406ea9d0844c45d782121fcfd10936968ee82dbe798a061b1ad739e6b22b985`; service worker `afbad2be2362ab340387a33b39c8ee45cca6786379ee8bb8382a41fe33418f15`.
- HTML and the service worker use `public, must-revalidate, max-age=30`; hashed assets use one-year immutable caching.
- Live HTML sends HSTS, CSP with response-header `frame-ancestors 'none'`, `nosniff`, strict referrer policy, and camera/microphone/geolocation restrictions.
- An unlicensed live `POST /api/approval-pack` returns 401 with `no-store, private`. A 25-request burst returned 20 × 401 and 5 × 429; 429 responses supplied `Retry-After: 59` and `no-store, private`.
- The product has no sign-in flow or user tenant, so no identity-provider login check applies. Normal browsing sets no identity requirement; existing Pro licenses use the separately tested Sociobot license-verification boundary.
- The deployment CLI's generated local credential cache was removed and was never staged or committed.

## Performance

Fresh Lighthouse 12.8.2 mobile run against production:

| Measure | Result |
| --- | ---: |
| Performance | 100 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| FCP | 0.774 s |
| LCP | 1.663 s |
| Total blocking time | 9 ms |
| CLS | 0 |
| Transfer bytes | 183,996 |

## Known gaps and next steps

No release-blocking gap remains from Verification 6. New Pro license sales remain intentionally closed in this release; existing-license verification and the server-side paid-content boundary remain in place.
