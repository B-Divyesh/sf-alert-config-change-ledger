# Repair handoff — verified and deployed

Repair work order `alert-config-change-ledger-repair-1` addresses the independent
FAIL at `ea7ef261ae375b4a7bc63ade212b8d65210d3d80` for candidate
`d015939b94892a760ec1ada067d20fc14d541746`.

## What changed

- The first demo action is fully visible at 1366×768 and 1440×900.
- Grafana contact-point arrays now normalize as recipient inventory snapshots.
  Paired fixtures cover PagerDuty, Opsgenie, Slack, webhook, and email changes.
- Recipient endpoint and credential keys are fingerprinted recursively. Safe
  provider fields and provider timestamps remain in the snapshot.
- The web sample now matches the real CLI report, including matcher drift.
- The Pro Markdown file was removed from the public site. A same-origin managed
  function returns it only after a fresh Sociobot license verdict.
- The broken checkout offer and unprovable price/refund statements were removed.
  Existing licenses still work; new license sales are plainly marked unavailable.
- The claims registry now covers contact exports, provider fields, token
  exclusion, exit codes, free CLI formats, web/CLI parity, paid access, and the
  closed-sales state.
- Mobile text reflows at 200%, header targets meet 44×44 px, the 404 decoration
  stays inside 390 px, missing routes use a real 404 response override, and
  mutable WebP files revalidate instead of using immutable caching.
- Type checking and strict lint scripts are now part of the documented gates.

## Local evidence

- `npm ci`: 25 packages installed; zero audit findings.
- `npm test`: 5 library tests, 9 Rust claim tests, 3 CLI tests, 3 API tests, and
  36 browser tests passed across desktop Chromium and 390×844 mobile.
- Every command in `.factory/claims.json` passed exactly as written. Full output:
  `verification-artifacts/repair-claim-tests.txt`.
- `npm run lint`: Rust formatting, strict Clippy, and TypeScript checks passed.
- `npm run build`: release CLI and `dist/site/` built successfully.
- `cargo package --allow-dirty --no-verify`: 57 files, 305.3 KiB unpacked,
  83.9 KiB compressed. A fresh-prefix consumer install reported version 0.1.0
  and ran help and the three-change JSON demo.
- Built site: 16.97 KB JavaScript (6.12 KB gzip), 13.20 KB CSS (3.78 KB gzip),
  166 KB hero, 408 KB total.
- Local Lighthouse mobile: performance 99, accessibility 100, best practices
  100, SEO 100, FCP 0.9 s, LCP 2.1 s, TBT 20 ms, CLS 0.
- Axe found no serious or critical findings across `/`, `/demo`, `/privacy`,
  `/terms`, SPA not-found, and static 404 in both browser projects.
- Keyboard checks covered the skip link, visible 3 px focus ring, demo
  navigation, and Space activation of a route selector.
- Offline reload, service-worker update path, demo storage isolation,
  same-origin demo traffic, report download, license return capture, and
  server-side paid-content denial all passed.

## Run and verify

```sh
npm ci
npm test
npm run lint
npm run build
cargo package --allow-dirty --no-verify
```

CLI demo: `cargo run -- demo`

Web demo: `/demo`

Demo storage: `demo:alert-config-ledger:*`

## Known gap

The production Sociobot product slug is not registered for new checkout, and
repository rules prohibit direct billing changes. The release therefore makes
no purchase promise or broken checkout link. The factory can restore the buy
link after registering the slug through its billing workflow. Existing-license
verification and protected delivery remain implemented and tested.

## Deployment evidence

Deployed with the work order's static configuration to
`https://alert-config-change-ledger.sociobot.in` on 28 August 2026. The site
and its managed API deployment succeeded in Azure Static Web Apps.

- `/`, `/demo`, `/privacy`, and `/terms` return 200. `/missing-tape` and the
  former `/approval-report-template.md` return the designed page with HTTP 404.
- The no-license approval API returns 401. An invalid license returns 403.
  Neither response contains the paid template. Azure reserves `Authorization`,
  so live verification prompted a follow-up fix to use the product-specific
  `X-Alert-Ledger-License` header between the same-origin page and function.
- Live `index.html`, 404 HTML/CSS, service worker, hashed JavaScript/CSS, hero,
  social image, favicon, and manifest match the built bytes.
- `verify-url.sh`: load 1,088 ms, correct title and language, one H1, one main,
  no missing alt text, no unlabeled buttons, and no console errors.
- Live axe checks found zero serious or critical findings on the five tested
  routes at 1366×768 and 390×844.
- At 1366×768 the primary action spans y=694.44–743.23, fully inside the first
  screen. At 390 px both tested header links are at least 44×44 px. The landing
  page remains exactly 390 px wide with text at 200%.
- Live keyboard verification reached the skip link first, moved focus to main,
  showed a 3 px teal focus ring, entered the demo, and activated a route with
  Space.
- The service worker controls the page, `registration.update()` succeeds, and
  the demo reloads offline with all three changes. Demo traffic remained
  same-origin.
- HTML and the service worker revalidate after 30 seconds. Mutable WebP art
  revalidates after one hour. Hashed JavaScript and CSS remain immutable for one
  year.
- Live response policy includes HSTS, CSP, `nosniff`, strict referrer policy,
  permissions policy, and CSP frame blocking.
- Live Lighthouse mobile: performance 100, accessibility 100, best practices
  100, SEO 100, FCP 0.8 s, LCP 1.7 s, TBT 10 ms, CLS 0, transfer 183,897 bytes.
- Live license-return smoke test stored the token in the namespaced key,
  removed it from the URL, and displayed the invalid-license state.

Live evidence is under `.factory/verification-artifacts/repair-live/`.
