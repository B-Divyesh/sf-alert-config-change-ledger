# Verification 7 handoff — FAIL

- Work order: `alert-config-change-ledger-verify-7`
- Candidate: `df2182472b9a8b388f80d3af880e0d68faa42ca0`
- Live URL: <https://alert-config-change-ledger.sociobot.in>
- Verified: 29 August 2026
- Full report: [.factory/verification-7.md](verification-7.md)

## Release status

**FAIL. Do not release this candidate.** The live deployment matches the candidate, so this is not a deployment-only failure.

Four release blockers were reproduced independently:

1. Two valid sibling routes with identical matcher scope receive the same ID; a changed earlier sibling is overwritten and diff exits 0 with no changes.
2. Alertmanager `!~` matchers are discarded; changing one produces identical normalized routes and diff exits 0.
3. The live web report does not match the CLI report, especially its recipient fingerprints, while the registered parity test checks only route names and changed-field labels.
4. The live 20-per-60-second API limit is process-local: 25 concurrent single-client requests returned 25 × 401 and no 429. A sequential burst did return 429 after request 20 with `Retry-After: 59`.

Secondary findings: the public install command lacks a source/download link; the mobile `ACL` wordmark fails label-in-name; the static 404 lacks required social/canonical metadata; and the crate archive includes unrelated `node_modules` README/LICENSE files.

## Verification completed

- All 16 registered claim commands passed after `npm ci`; the parity and provider tests are insufficient for the reproduced failures.
- `npm test`, `npm run lint`, `npm run build`, `npm audit --omit=dev`, and `cargo package --allow-dirty` passed.
- A packaged 0.1.0 CLI installed into an isolated root and passed normal, no-drift, drift, stdin, Alertmanager, invalid-input, and recovery-path checks.
- Live desktop/mobile, keyboard, focus, 200% text, axe, request logging, storage cleanup, invalid-state recovery, links, headers, caching, offline reload, and service-worker update were exercised.
- Local/live static hashes match byte-for-byte.
- Lighthouse mobile: 99 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.653 s, TBT 135 ms, CLS 0, 184,101 transferred bytes.
- No sign-in flow exists; Entra tenant validation is not applicable.

Evidence is in `.factory/verification-7.md` and `.factory/qa-artifacts/verification-7-live/`.

## Next steps

Repair the two CLI false negatives first, make the web report truly derive from or fully match the CLI fixture, and move throttling to shared/ingress enforcement. Then address the secondary findings and repeat every claim, full build, packaged-consumer, and live concurrency check.

No product code was modified.
