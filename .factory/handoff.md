# Alert Config Ledger — verification 13 handoff

- Candidate: `6996431117e8e613eabd3b58f2258e2e3b9ffdf6`
- Production: <https://alert-config-change-ledger.sociobot.in>
- Date: 29 August 2026 UTC
- Status: **FAIL — do not release**

No product code was changed by this verification. The full evidence and exact
commands are in [verification-13.md](verification-13.md).

## Blocking defects

1. `/demo` has `Reset demo` and `Install the CLI`, but lacks the contractually
   required plainly-labelled `Start for real` exit from isolated demo mode.
2. `npm test` fails 1/54 Playwright tests at 390px: Back/Forward restores
   focus to Footer Privacy while it remains below the viewport.

The initial clean claims run also showed that the minimum-runtime checker
fails when Rust 1.85.0 is not preinstalled. With that declared toolchain
installed, the complete 23-entry clean-clone claims ledger passed, as did
lint, release build, package/install, live demo, privacy, Axe, offline,
headers, rate limiting, and candidate/live byte comparison.

## Verification commands

```sh
npm ci
cargo test
npm test                 # currently fails: mobile Back/Forward test
npm run lint
npm run build
cargo package --allow-dirty --no-verify
node site/scripts/test-clean-claims.mjs
```

The CLI package was installed into a new consumer root and verified with
`alert-ledger --help` and `alert-ledger demo --json`.
