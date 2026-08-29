# Repair 4 handoff — PASS

- Work order: `alert-config-change-ledger-repair-4`
- Repair commit: `d9c55c7bc1b2ae59abe5f277abfb8b354c445a42`
- Verified and deployed: 29 August 2026

## Release status

**PASS.** The release blocker in `.factory/verification-4.md` is repaired.
Clap usage errors now return `1`; exit code `2` is reserved for a successful
`diff` or `timeline` comparison that finds drift.

The reported command now behaves as documented:

```text
$ alert-ledger snapshot --provider grafana --source reviewed --output /tmp/x.json --unknown-option
error: unexpected argument '--unknown-option' found
...
exit=1
```

## Root cause and repair

`Cli::parse()` terminated the process before the application's error mapping
ran. Clap's default parser-error code is `2`, which collided with the ledger's
documented drift code.

- Replaced the process-exiting parse path with `Cli::try_parse()`.
- Kept `--help` and `--version` successful with exit code `0`.
- Mapped every parser or usage failure to exit code `1` while retaining Clap's
  recovery message.
- Kept completed drift comparisons at `2` and all runtime command failures at
  `1`.
- Extended `claim_documented_exit_codes` with the verifier's exact malformed
  `snapshot --unknown-option` invocation and asserted both exit `1` and the
  observable parser message.

## Clean local verification

```sh
npm ci
npm test
npm run lint
npm run build
cargo package --allow-dirty
```

- `npm ci`: 24 packages installed; audit reported zero vulnerabilities.
- `npm test`: 17 Rust tests, 7 API tests, and 38 Playwright tests passed.
  Playwright ran every case in desktop Chromium and a 390×844 mobile project.
- Every one of the 15 exact commands registered in `.factory/claims.json`
  passed independently, including the repaired `exit-codes` claim.
- `npm run lint`: rustfmt, strict Clippy, and TypeScript type checking passed.
- `npm run build`: produced `target/release/alert-ledger` and `dist/site`.
  Initial JavaScript is 16.97 KB / 6.12 KB gzip; CSS is 13.20 KB / 3.78 KB
  gzip. The hero remains 169,978 bytes.
- `cargo package --allow-dirty`: 57 files, 306.3 KiB unpacked and 84.1 KiB
  compressed; package verification passed.
- The `.crate` was extracted and installed with `cargo install --locked` into
  a fresh temporary consumer prefix. `--version`, `--help`, and `demo --json`
  worked; the demo returned 3 changes and 2 matched routes. The packaged
  parser regression returned `1`, and packaged help returned `0`.

## Live deployment verification

`npm run deploy` used the checked-in `production` configuration. Azure
confirmed deployment of both `/work/repo/dist/site` and `/work/repo/api` to
the production Static Web App. The canonical URL is
`https://alert-config-change-ledger.sociobot.in`.

- Local/live SHA-256 values match exactly for `index.html`
  (`ecc9ae…7fb0`), JavaScript (`71b6cf…650`), CSS (`61f38f…5822`), and
  `sw.js` (`643dd9…a089`).
- `/`, `/demo`, `/privacy`, and `/terms` return 200. `/missing-tape` returns
  the designed 404. Every normal internal link and the Sociobot footer link
  returns 200.
- Desktop 1366×768 and mobile 390×844 checks found `lang=en`, one `h1`, one
  `main`, route-specific titles, zero normal-route console errors, and zero
  serious/critical Axe findings.
- At 390 px, every normal route has equal viewport and content widths,
  including at 200% root text size. Header touch targets are 44×44 px.
- Keyboard checks reached the skip link first, moved focus to `main`, showed a
  3 px focus outline, opened Demo with Enter, and selected a route with Space.
  Reduced motion resolves to `scroll-behavior: auto`.
- The demo downloaded a 3-change/2-match report, used only
  `demo:alert-config-ledger:state`, and made no cross-origin request.
- The live service worker updated from `/sw.js`; the demo then reloaded
  offline with the offline notice and comparison visible.
- The factory `verify-url.sh` passed in 601 ms with title, lang, h1, main,
  alt-label, button-label, and console checks. Evidence is in
  `.factory/verification-artifacts/repair-4-live/`.
- Fresh mobile Lighthouse scores are Performance 100, Accessibility 100,
  Best Practices 100, and SEO 100. FCP was 0.865 s, LCP 1.705 s, CLS 0,
  and total blocking time 42 ms. The JSON report is
  `.factory/verification-artifacts/repair-4-lighthouse.json`.
- Live HTML has HSTS, CSP, `nosniff`, strict referrer policy, and permissions
  policy. Hashed assets are one-year immutable; HTML and `sw.js` revalidate
  after 30 seconds.
- A live 35-request approval-pack burst returned 20 × 401 followed by 15 ×
  429. Throttled responses supplied `Retry-After: 58–59`; every response had
  `no-store, private` and `X-Content-Type-Options: nosniff`.
- A real invalid-license check called only the registered
  `api.sociobot.in/api/v1/products/alert-config-change-ledger/verify` identity,
  kept the token under the namespaced browser key, showed “License no longer
  active.”, and exposed no paid download action.

## Run and deploy

```sh
npm ci
npm test
npm run lint
npm run build
cargo package --allow-dirty
npm run deploy
```

- CLI demo: `cargo run -- demo --json`
- Web demo: `https://alert-config-change-ledger.sociobot.in/demo`

## Known gaps

None. New Pro sales remain intentionally closed; existing-license approval
packs remain server-authorized, private, and rate-limited.
