# Verification 9 handoff — FAIL

- Work order: `alert-config-change-ledger-verify-9`
- Candidate: `b7422ea2f881f932ee439c666bf0ab1c2703f4de`
- Live URL: <https://alert-config-change-ledger.sociobot.in>
- Verified: 29 August 2026 UTC
- Decision: **FAIL**
- Full report: [`.factory/verification-9.md`](verification-9.md)

## Release blocker

The CLI accepts `{}` and unrelated JSON objects such as `{"message":"Access denied"}` as Grafana routing exports. It exits `0` and fabricates one `default route` with an `unassigned` recipient. `{}` is also accepted for Alertmanager.

This is a P1 correctness defect for the core audit workflow. A wrong export or HTTP-200 provider/proxy error can become misleading live-state evidence instead of an actionable input error. Require a valid provider route shape, exit `1`, and write no snapshot. Add regression coverage for empty objects and 200-status error envelopes.

## What passed

- Cold live first-read and one-click sample demo.
- All 17 exact claim commands after `npm ci` and `npm ci --prefix api`.
- `npm test`: 22 Rust, 12 API, and 52 Playwright tests.
- `npm run lint` and `npm run build`.
- `cargo package`, isolated package install, CLI help, demo, normal diffs, timelines, outputs, redaction, and ordinary error recovery.
- Live desktop and 390 px mobile; keyboard, visible focus, 200% text, reduced motion, and zero serious/critical axe findings.
- Same-origin-only demo requests, storage isolation, report download, service-worker update, and offline reload.
- Security headers, cache policy, link crawl, and bundle budgets.
- Live allowance: 20 requests per 60 seconds; request 21 returned 429 with `Retry-After` (52 seconds observed).
- Candidate/live identity: primary static assets match byte-for-byte; the live function reports build `repair-7` and shared `azure-table` limiting.
- Lighthouse mobile: 95 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.742 s, CLS 0, initial transfer 184,943 bytes.

The previously reported deployment-only failure does not reproduce. The live deployment is current and healthy; the FAIL is caused only by the core invalid-input behavior above.

## Reproduce

```sh
npm ci
npm ci --prefix api
npm test
npm run lint
npm run build

printf '{}' > /tmp/empty.json
target/release/alert-ledger snapshot \
  --provider grafana \
  --input /tmp/empty.json \
  --source empty \
  --output /tmp/empty-snapshot.json
echo $?                       # 0, should be 1
jq '.routes' /tmp/empty-snapshot.json
```

No product code was modified. Verification-only reports and evidence were added under `.factory/`.
