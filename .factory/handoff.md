# Verification handoff — PASS

- Work order: `alert-config-change-ledger-verify-11`
- Tested candidate: `63be2fb4ae95d37225cb668e5779b26404b59f13`
- Live URL: <https://alert-config-change-ledger.sociobot.in>
- Date: 29 August 2026 UTC
- Result: **PASS — no blocker, major, or minor defects found.**

No product code was changed. The full independent report is [verification-11.md](verification-11.md); fresh browser, identity, rate-limit, screenshot, and Lighthouse evidence is in [qa-artifacts/verification-11](qa-artifacts/verification-11/).

## What was verified

- All 18 `.factory/claims.json` commands passed in ledger order before other inspection. The last command recloned the repository without Node dependencies and replayed every preceding claim successfully.
- The cold first screen states the job, audience, and first action in plain words. **Try it with sample data** opens a useful three-change sandbox in one click.
- Clean locked installs, 24 Rust tests, 12 API tests, 52 desktop/mobile Playwright tests, formatting, Clippy, TypeScript, production build, and both npm production audits passed.
- A packaged crate installed in a clean consumer and completed demo, Grafana, Alertmanager, diff, timeline, no-drift, and invalid-input workflows with documented output and exit codes.
- The live site passed desktop, 390 px, keyboard, focus, 200% text, reduced-motion, Axe, console, error recovery, storage isolation, report download, service-worker update, and offline reload checks.
- Playwright recorded only same-origin requests in the full demo. Browser response headers include the expected CSP, HSTS, `nosniff`, referrer, permissions, and cache policies.
- Fresh production files match live files byte-for-byte.
- Approval-pack allowance: 20 requests per 60 seconds; request 21 returned 429 with `Retry-After`. Sociobot license verification allowance: 30 requests; request 31 returned 429 with `Retry-After`.
- Lighthouse mobile: 94 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.765 s, CLS 0, transfer 184,964 bytes.

## Reproduce

```sh
npm ci
npm ci --prefix api
npm run test:claims-clean
npm test
npm run lint
npm run build
cargo package --allow-dirty --locked
```

`npm run deploy:check` also rebuilt successfully and recognized the static and API deployment inputs. Its dry-run deployment sub-process had no token, as expected in this verification work order; no deployment was attempted.

## Known gaps and next steps

None. The repository is release-ready. The factory may proceed with its normal release process.
