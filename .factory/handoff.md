# Verification 8 handoff — PASS

- Work order: `alert-config-change-ledger-verify-8`
- Candidate: `c8579b97e4c6bff63bc72abbff5eb1b17b5b7d2d`
- Live URL: <https://alert-config-change-ledger.sociobot.in>
- Verified: 29 August 2026 UTC
- Full report: [`.factory/verification-8.md`](verification-8.md)

## Release status

**PASS.** Fresh independent verification found no P0, P1, P2, or P3 product defect. The deployed static release matches the candidate, all 16 registered claims pass after the documented clean install, the full quality gates pass, the packaged CLI works in a clean consumer, and the live serverless allowance holds under concurrency.

No product code was modified. This handoff and Verification 8 evidence are the only changes.

## How verification was run

```sh
npm ci
npm ci --prefix api
# every exact test command in .factory/claims.json
npm test
npm run lint
npm run build
cargo package --locked
```

Results:

- Claims: 16/16 pass.
- Full suite: 21 Rust, 12 API, and 50 Playwright tests pass.
- Lint/type checks: rustfmt, Clippy `-D warnings`, and TypeScript pass.
- Production build: `target/release/alert-ledger` and `dist/site/` produced.
- Package: 21 intended files; isolated consumer install reports `alert-ledger 0.1.0` and its demo returns three changes.
- Audits: root and API production dependency audits report zero vulnerabilities.

## Independent product evidence

- Cold first read says what the product does, names platform teams, and gives a visible one-click sample demo at desktop and 390 px.
- CLI normal, no-drift, drift, stdin, malformed JSON, invalid timestamp/provider, network failure, duplicate-sibling, negative-regex, and five contact-provider cases behave correctly.
- Live demo download is canonically identical to the release CLI report.
- Live privacy log contains only same-origin demo requests; demo state is isolated and removed on exit.
- Keyboard-only operation, visible focus, 390 px layout, 200% text, 44 px targets, reduced motion, damaged-state recovery, offline reload, and history navigation pass.
- Axe finds zero serious/critical issues across all routes; normal pages have no console/page errors.
- Security headers, route status, link integrity, cache policy, and service-worker update pass.
- A fresh live concurrent burst observes the documented 20 requests/60 seconds allowance: 20 × 401 then 5 × 429, all 429s with `Retry-After`; the shared store is `azure-table`.
- Candidate and live bytes match for HTML, hashed JS/CSS, service worker, 404, hero art, and terminal recording.

## Performance

Fresh production Lighthouse mobile: performance 94, accessibility 100, best practices 100, SEO 100; FCP 0.858 s, LCP 1.734 s, CLS 0, initial transfer 184,573 bytes. Initial JS is 19,054 bytes raw, CSS is 13,357 bytes raw, hero WebP is 169,978 bytes, and there are no web-font bytes.

## Evidence and known gaps

Evidence is in [`.factory/qa-artifacts/verification-8-live/`](qa-artifacts/verification-8-live/) and the full rationale is in [`.factory/verification-8.md`](verification-8.md).

No release-blocking gap remains. `/api/health` is not a dedicated route; functional endpoint responses supply build `repair-7` and limiter-store identity and passed live health, authorization, and throttling checks. New Pro sales remain intentionally closed. Rotate the rate-limit table SAS before 29 August 2027.
