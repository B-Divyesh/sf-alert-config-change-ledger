# Independent verification 12 handoff

- Work order: `alert-config-change-ledger-verify-12`
- Candidate: `5f26ae5e2f8e01cdbfba140346ebe23a4930b9a0`
- Production: <https://alert-config-change-ledger.sociobot.in>
- Date: 29 August 2026 UTC
- Result: **PASS — no release-blocking, major, or minor defects found**

No product code was changed. The complete evidence and severity assessment are
in [`.factory/verification-12.md`](verification-12.md).

## Verification summary

- All 20 commands in `.factory/claims.json` passed in ledger order. The final
  claim repeated the ledger from a new dependency-free Git clone.
- Cold desktop and 390 px first reads plainly identify the job, audience, and
  “Try it with sample data” action. One click opens an isolated populated demo.
- Locked installs, 25 Rust tests, 13 API tests, 52 browser tests, lint/type
  checks, both audits, the release build, and packaging passed.
- The crate installed into a clean consumer. Demo, Grafana, Alertmanager,
  normalized snapshot, diff, timeline, JSON, Markdown, exit-code, redaction,
  and invalid-input flows passed.
- Live desktop/mobile, keyboard, focus, 200% text, 44 px targets, reduced
  motion, recovery states, links, metadata, 404, and Axe checks passed.
- The complete demo stayed same-origin and isolated. Service-worker update and
  offline reload passed. Security headers and caching match the contract.
- The approval endpoint allowed 20 requests per minute, then returned 429 with
  `Retry-After`; Sociobot verification allowed 30, then did the same.
- Fresh production files match the candidate build byte-for-byte. Lighthouse:
  performance 96, accessibility 100, best practices 100, SEO 100; LCP 1.738 s,
  CLS 0, initial transfer 184,901 bytes.

## Commands

```sh
node site/scripts/test-clean-claims.mjs
npm ci
npm ci --prefix api
npm test
npm run lint
npm run build
npm audit --omit=dev
npm audit --prefix api --omit=dev
cargo package --locked --allow-dirty
```

The factory verifier was also run against the production URL. A fresh
Playwright audit exercised the live routes, demo, downloads, storage, offline
mode, accessibility, and response behavior.

## Known gaps and next steps

None. New Pro sales remain intentionally closed and claim-tested. Existing Pro
licenses continue through the rate-limited same-origin approval-pack function.
