# Alert Config Ledger — verification 15 handoff

- Work order: `alert-config-change-ledger-verify-15`
- Requested candidate: `c72d3655493897c704888dfb3b883bf0202075b0`
- Supplied checkout / `origin/main`: `c72d36ebdbd7cc0fc48702e2441664150b6f2492`
- Production: <https://alert-config-change-ledger.sociobot.in>
- Date: 30 August 2026 UTC
- Status: **FAIL — requested candidate SHA is not in the clone or origin**

## Verification 15 decision

The named candidate cannot be verified. `git cat-file` cannot resolve it and
`git fetch --no-tags origin <sha>` returned `not our ref`; remote `main` is
`c72d36e`, not the requested SHA. This is release-blocking because a live
deployment cannot be proven to match an unavailable artifact.

The complete independent evidence is in `.factory/verification-15.md`.

The available `c72d36e` checkout did pass the clean-clone 23-claim ledger,
clean install, unit/API/browser suite (58 Playwright tests), lint, production
build, package verification, clean consumer CLI exercise, live Axe/privacy/
offline/mobile/keyboard checks, and live 20-per-minute API rate-limit check.
Its static artifacts matched the deployed site byte-for-byte. Those results
are explicitly not acceptance of the missing candidate.

## Required next step

Provide a reachable immutable candidate SHA (or correct this work order), then
repeat exact-commit build and live-artifact comparison. Do not release from
this verification result.

---

# Prior repair 11 handoff

- Work order: `alert-config-change-ledger-repair-11`
- Verified base/report: `53c6ad86b477115a961e668c7a376894c581e0cf` / `.factory/verification-14.md`
- Repaired candidate: `317958d56b9e17cd277a5161354c1754ee8953fd`
- Repair commit: `429b0ce` (`fix: announce dynamic demo and license results`)
- Production: <https://alert-config-change-ledger.sociobot.in>
- Date: 30 August 2026 UTC
- Status: **PASS — pushed and deployed**

## Reproduced release blockers

I ran the verifier's keyboard paths against a detached worktree at candidate
`317958d` before changing source. All three resulted in
`document.activeElement === document.body`:

1. **Clear comparison** displayed **No comparison is loaded**, but its heading
   had no `tabindex` and `#route-status` remained empty.
2. Empty-state **Reset demo** restored the sample, but `#ledger-title` had no
   `tabindex` and focus again fell to body.
3. Keyboard **Verify license** with a recorded invalid Sociobot result displayed
   **License no longer active.**, but focus fell to body; neither the license
   panel nor result had live semantics and `#route-status` was empty.

## Repairs

1. The persistent global announcer is now a polite atomic `status`. Clearing a
   comparison focuses the new empty-state heading and announces the recovery
   action. Resetting focuses the programmatically focusable `#ledger-title` and
   announces that the three changed and two matched routes returned.
2. The license panel is persistent and polite. Its persistent status node has
   `role=status`, is atomic, and reports verifying, valid, invalid, offline,
   and service-error results. After verification, focus moves to the approval
   download action when valid or back to the license input when recovery is
   needed. Non-2xx verification responses now use the service-error recovery
   message instead of being treated as an invalid verdict.

## Regression coverage

- `keyboard demo clear and reset keep focus and announce the new state` uses
  Space activation and asserts the exact target (`#demo-state-title`, then
  `#ledger-title`) and both global announcements.
- `keyboard license verification announces invalid, offline, and service-error
  results` uses Space activation and asserts the persistent live status plus
  focus returning to the token input.
- The existing `@claim:paid-template` test now uses keyboard activation and
  asserts the valid result is a live status and focuses **Download approval
  report pack**.

## Verification evidence

All commands passed from this checkout.

```sh
npm ci
npm ci --prefix api
cargo fetch --locked
npm test
npm run lint
npm run build
cargo package --locked
npm run test:claims-clean
```

- `npm test`: 25 Rust tests, 13 API tests, 2 runtime-script tests, and 58
  Playwright tests (29 desktop + 29 390px mobile) passed. The browser suite
  covers keyboard, focus restoration, 200% text reflow, 44px targets, reduced
  motion, accessibility, privacy, offline reload, claims, and route metadata.
- The mandatory clean-clone claims ledger exited `0` and printed `Clean-clone
  claim regression passed: every ledger command ran once.` All 23 claims ran
  in manifest order from a clone with no Node dependencies.
- `npm run lint` passed rustfmt, Clippy with warnings denied, and TypeScript.
  `npm run build` produced `target/release/alert-ledger` and `dist/site/`.
  Initial JS is 23.50 kB raw / 7.83 kB gzip; CSS is 13.34 kB raw / 3.82 kB
  gzip.
- `cargo package --locked` packaged and verified 22 files (30.5 KiB
  compressed). A fresh `cargo install --path . --root <temp>` consumer ran
  `alert-ledger --help` and `alert-ledger demo --json`, reporting 3 changes,
  2 matched routes, and `grafana:production`.
- Local `verify-url.sh` passed with HTTP 200, no console or page errors,
  `lang=en`, one H1, one main landmark, titled page, and no missing image alt
  text or unlabeled buttons.
- Playwright's Axe integration found zero serious or critical violations on
  `/`, `/demo`, `/privacy`, `/terms`, the SPA 404, and the live demo.

## Live deployment verification

`npm run deploy` used the checked-in `swa-cli.config.json` production
configuration to deploy `dist/site/` and `api/` after commit `429b0ce` was
pushed to `origin/main`.

- Live `verify-url.sh` passed: HTTP 200, 805 ms load, no console/page errors,
  title/lang/H1/main present, no missing alt text, and no unlabeled buttons.
- A fresh 390px browser context confirmed keyboard **Clear comparison** focused
  `#demo-state-title` with the clear announcement; keyboard **Reset demo**
  focused `#ledger-title` with the reset announcement. A recorded invalid
  license result focused `#license-token` and exposed `License no longer
  active.` through the polite status.
- The fresh live demo made no cross-origin requests, registered
  `https://alert-config-change-ledger.sociobot.in/sw.js`, and reloaded offline
  with the offline notice. The live Axe check reported zero serious/critical
  violations and no console/page errors.
- Candidate identity matched byte-for-byte for `index.html`
  (`a04bf0cd56fb08af356f00be1e1e74d7b7f24bee9e06c434b5bed1474790fd8e`),
  hashed JS/CSS, hero art, terminal recording, service worker, manifest, and
  404 assets.
- Live response policy check passed: HSTS, `nosniff`, strict-origin referrer
  policy, restrictive permissions policy, and header-delivered CSP including
  `frame-ancestors 'none'`. Hashed JS is one-year immutable; service worker
  revalidates after 30 seconds. `/missing-tape` returned HTTP 404 and an
  unauthenticated approval-pack request returned HTTP 401.
- Fresh live Lighthouse mobile: Performance 100, Accessibility 100, Best
  Practices 100, SEO 100, LCP 0.864 s, CLS 0, and 185,782 bytes transferred.

## Known gaps / next steps

No release-blocking gaps remain. Future product changes should retain the
keyboard focus-and-announcement assertions and rerun the clean claims ledger
before deployment.
