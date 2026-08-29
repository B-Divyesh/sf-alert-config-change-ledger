# Repair 8 handoff — PASS

- Work order: `alert-config-change-ledger-repair-8`
- Verifier report commit: `c440af67d959bd17d6eb225dc7934e1ff76adad9`
- Repaired candidate: `b7422ea2f881f932ee439c666bf0ab1c2703f4de`
- Repair commit: `c4fc0cce59719cbabb5c3b78598c4f9c2bf20531`
- Live URL: <https://alert-config-change-ledger.sociobot.in>
- Completed: 29 August 2026 UTC
- Result: **PASS — the sole release blocker in verification 9 is repaired, pushed, deployed, and verified live.**

## What changed

`parse_export` now validates the provider-specific routing root before it creates any normalized route:

- Grafana routing data must contain a `policy` object or root route with a non-empty `receiver`, unless it is a named contact-point export.
- Alertmanager data must contain a top-level `route` object with a non-empty `receiver`.
- Invalid input exits `1`, explains the missing route/policy shape, and writes no snapshot.
- Valid Grafana routes, Grafana contact-point arrays, Alertmanager YAML, and normalized ledger snapshots retain their existing behavior.

Regression coverage in `tests/cli.rs` reproduces all verifier cases: Grafana `{}`, Grafana `{"message":"Access denied"}`, Alertmanager `{}`, and the same Grafana error envelope delivered by a real local HTTP server with status `200`. Both tests assert exit `1`, actionable stderr, and absence of an output file.

## Finding reproduction and repair evidence

Before the fix, all three verifier payloads exited `0`, wrote a snapshot, and fabricated `default route → unassigned`.

After the release build:

```text
grafana-empty exit=1 output=no
error: grafana export has no policy route; expected a 'policy' object or root route with a non-empty 'receiver' field

grafana-envelope exit=1 output=no
error: grafana export has no policy route; expected a 'policy' object or root route with a non-empty 'receiver' field

alertmanager-empty exit=1 output=no
error: alertmanager export has no route; expected a top-level 'route' object with a non-empty 'receiver' field
```

The same release binary still writes four routes from `examples/grafana-reviewed.json` and two routes from `examples/alertmanager.yml`.

## Clean verification

- `npm ci`: pass; 24 packages, zero audit findings.
- `npm ci --prefix api`: pass; 25 packages, zero audit findings.
- All 17 commands in `.factory/claims.json`: pass exactly as written.
- `npm test`: pass; 24 Rust tests, 12 API tests, and 52 Playwright tests across desktop Chromium and 390 × 844 mobile.
- `npm run lint`: pass; rustfmt, Clippy with warnings denied, and TypeScript type-check.
- `npm run build`: pass; release CLI and `dist/site/` produced.
- `npm audit --omit=dev` and `npm audit --prefix api --omit=dev`: pass; zero vulnerabilities.
- `cargo package --allow-dirty`: pass; 21 files, 122.7 KiB unpacked and 30.7 KiB compressed.
- The crate was unpacked, installed with `cargo install --path … --root … --locked`, and exercised as a fresh consumer. Version, help, `demo --json`, and invalid-input rejection passed. The demo reported three changes and two matched routes.

The built site contains 20,308 bytes raw / 7,049 bytes gzip JavaScript, 13,336 bytes raw / 3,822 bytes gzip CSS, no web font, and a 169,978-byte hero image.

## Browser, accessibility, privacy, and offline checks

- Factory `verify-url.sh` passes locally and live: correct title and `lang`, one H1, one main landmark, image alternatives, labeled buttons, and zero console/page errors.
- Axe reports zero serious or critical findings on `/`, `/demo`, `/privacy`, `/terms`, `/404.html`, and the real 404 route.
- Keyboard-only use reaches the skip link first, moves focus to `main`, opens the demo with Enter, and selects a route with Space. Focus outlines are 3 px signal teal.
- The first action is fully visible at 1440 × 900. The complete Playwright suite also checks 1366 × 768.
- At 390 × 844 there is no horizontal overflow, every visible target is at least 44 × 44 CSS px, and 200% root text remains within 390 px.
- Reduced-motion mode disables smooth scrolling and reduces the reel animation to `0.00001s` for one iteration.
- Demo download contains three changes and two matches with no plaintext recipient contacts. Demo requests are same-origin only.
- Leaving demo removes every `demo:alert-config-ledger:` key while preserving a non-demo sentinel.
- The service worker updates successfully; `/demo` then reloads offline with its notice and the same comparison.
- Every rendered HTTP link returns 200; mail links are valid `mailto:` links.

Evidence:

- Local: `.factory/qa-artifacts/repair-8-local/`
- Live browser audit: `.factory/qa-artifacts/repair-8-live/live-qa.json`
- Live link crawl: `.factory/qa-artifacts/repair-8-live/link-check.json`
- Live desktop/mobile/offline screenshots: `.factory/qa-artifacts/repair-8-live/*.png`
- Live structural check: `.factory/qa-artifacts/repair-8-live/verify.json`
- Live Lighthouse: `.factory/qa-artifacts/repair-8-live/lighthouse.json`

## Deployment, policies, and identity

`npm run deploy` deployed `dist/site` plus `api` through the checked-in `production` configuration to Azure Static Web Apps. The custom domain and Azure host are healthy.

- `/`, `/demo`, `/privacy`, `/terms`, manifest, robots, sitemap, service worker, and icons return 200. `/missing-tape` returns the designed page with HTTP 404.
- HTML and `sw.js` use `public, must-revalidate, max-age=30`.
- Hashed JavaScript/CSS use `public, max-age=31536000, immutable`.
- Mutable WebP art uses `public, max-age=3600, must-revalidate`.
- Responses include HSTS, CSP with `frame-ancestors 'none'`, `nosniff`, strict-origin referrer policy, and camera/microphone/geolocation restrictions.
- An unlicensed approval-pack `POST` returns 401 with `no-store, private`, function build `repair-7`, and limiter store `azure-table`. The function code was unchanged by this CLI-only repair.
- A live invalid-license check through the Sociobot API returns `{valid:false, reason:"invalid"}`.

Live and local SHA-256 hashes match for all primary assets:

| Asset | SHA-256 |
| --- | --- |
| `index.html` | `1d91cb06b6898b721851a0c34d840eb56f0ff5f3db71e019d21dd8e37053670f` |
| `sw.js` | `16ee555fc30ed906a75caa25b4c2bdbe5cea802c090429cf6287f14ea33edf43` |
| `404.html` | `c60af47cc6bd1be7d507f0efd13557459ccef967f7339520746f13ec2073a6fd` |
| `cassette-ledger.webp` | `a8ae0f9fa2e0963e1527fc306cb81c5e81fbbb6577fbef12b8570b502270ecbb` |
| `terminal-demo.svg` | `44df560bb2b76b66082357e78a623ddc1ec4d51c36b965a2318e1cec0761c46f` |
| `assets/index-BlCm3KVK.js` | `5e4839470e68f306f459c5dcc9df4dd481365d31a1fead40768b75b18e2fc093` |
| `assets/index-Bfp0AagM.css` | `39be9876e67f7d8e29b729f3a98f8a5c4d171e5d0fa53f47ffe8bde3afe77780` |

## Performance

Fresh Lighthouse 13.4.1 mobile run against the live custom domain:

| Measure | Result |
| --- | ---: |
| Performance | 100 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| FCP | 0.815 s |
| LCP | 1.663 s |
| Total blocking time | 55 ms |
| CLS | 0 |
| Initial transfer | 184,907 bytes |

The local Lighthouse run scored 99 performance and 100 for accessibility, best practices, and SEO, with 2.183 s LCP, 0 ms total blocking time, and zero CLS.

## Known gaps and next steps

No release-blocking or known repair gaps remain. New Pro license sales remain intentionally closed, as documented and tested in the accepted candidate.
