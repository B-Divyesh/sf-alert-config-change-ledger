# Independent verification 7 — FAIL

- Candidate: `df2182472b9a8b388f80d3af880e0d68faa42ca0`
- Live URL: <https://alert-config-change-ledger.sociobot.in>
- Verified: 29 August 2026
- Decision: **FAIL — the CLI can report no drift for valid changed routes, a registered parity claim is false, and the deployed rate limit is bypassed by concurrent requests.**

## First-read gate

The cold live-page first screen passes.

- What it does: “Trace every alert route change.”
- Who it is for: platform teams comparing live alert routes with a reviewed baseline.
- What to click first: “Try it with sample data,” beside text saying it loads three realistic route changes in an isolated demo.
- The action is visible without scrolling at 1440×900 and 390×844. At 390 px it begins at y=434 and is fully inside the 844 px viewport.

Evidence: [desktop](qa-artifacts/verification-7-live/first-read-desktop-1440.png) and [mobile](qa-artifacts/verification-7-live/first-read-mobile-390.png).

## Release-blocking findings

### P1 — duplicate valid routes collide and changed drift disappears

Route identity is derived only from non-severity matchers in `src/lib.rs:358-377`, then hashed at `src/lib.rs:420-422`. Two valid sibling routes with the same matcher scope therefore receive the same ID. `compare` collects routes into maps keyed by that ID at `src/lib.rs:491-500`, so the later sibling overwrites the earlier one.

Fresh release-binary reproduction:

1. Baseline and live Grafana policies each had a root route plus two `team = payments` siblings, `team-a` with `continue: true` and `team-b`.
2. Only `team-a`'s webhook changed between snapshots.
3. Both snapshots wrote 3 routes, but both siblings had ID `route-261e494562b9`.
4. `alert-ledger diff --format json` returned `changes: []`, `matched_routes: 2`, and exit code **0**.

This is a dangerous false negative for the core job and contradicts the success requirement that every changed route be found.

### P1 — Alertmanager `!~` matchers are discarded and matcher drift disappears

`parse_matchers` recognizes `=~`, `!=`, and `=` at `src/lib.rs:466-477`, but not Alertmanager's valid negative-regex operator `!~`. The whole matcher is omitted, and the raw `matchers` field is also excluded from preserved semantics at `src/lib.rs:389-405`.

Fresh release-binary reproduction used otherwise identical Alertmanager exports with `team!~"dev"` in the baseline and `team!~"test"` live. Both normalized child routes had `matchers: {}`. Diff returned no changes and exit code **0**.

This violates the brief's requirement to preserve provider semantics and makes the broad “normalizes Alertmanager YAML” claim materially incomplete.

### P1 — the published web/CLI parity claim is false

Claim `web-cli-parity` says the web demo reports the same sample comparison as the CLI. A fresh live report download was compared with `target/release/alert-ledger demo --json`:

- Web baseline is the string `a81c7e2`; CLI baseline is a source/revision/timestamp object.
- Web payments fingerprint is `fp:9b3c79c1a632` before and `fp:5d6d0f0b2cb1` after.
- CLI payments fingerprint is `fp:59113a82bd3b` before and `fp:4409ace7075b` after.
- Web before/after values and `fields` use a different schema and omit CLI recipient/matcher details on two routes.

The tagged test at `site/tests/site.spec.ts:225-239` reduces both reports to route names and field labels, so it passes without testing the observable fingerprints, source metadata, or report values promised by the claim. A passing but insufficient claim test does not satisfy the claims contract.

### P1 — live request allowance is not enforced under concurrency

The repository declares 20 requests per 60 seconds, but stores counters in process memory and explicitly scopes them to each serverless instance (`api/approval-pack/rate-limit.js:1-17`).

- A fresh 25-request **concurrent** single-client burst to live `POST /api/approval-pack` returned **25 × 401, 0 × 429**.
- A later sequential burst returned 20 × 401 followed by 5 × 429; each 429 had `Retry-After: 59` and `Cache-Control: no-store, private`.
- Thus the observed nominal allowance is 20/60 seconds only when requests remain on one warm instance; there is no deployment-wide allowance under concurrency.
- The integrated Sociobot verification URL also returned 25 × 200 invalid verdicts for a 25-request burst, with no 429 or `Retry-After`.

The work order expressly requires the allowance to hold once one client goes past it and asks for concurrency verification. The deployed behavior does not meet that requirement.

## Other findings

### P2 — public install instruction has no acquisition step

The live page tells a new visitor to run `cargo install --path .` but does not link the repository, a release archive, or crates.io. Running the displayed command from a clean consumer directory exits 101 because the directory has no `Cargo.toml`. The README works once somebody already has the source, but the public landing page does not get them there.

### P2 — mobile wordmark fails label-in-name

At widths under 780 px, CSS hides “Alert Config Ledger” and leaves the visible label `ACL`, while the link keeps `aria-label="Alert Config Ledger home"`. Lighthouse flags `label-content-name-mismatch` because the visible `ACL` text is absent from the accessible name. Axe reports no serious/critical issue, but speech-input users cannot address the control by its visible label.

### P2 — the static 404 route lacks required route metadata

Live `/404.html` has a title, favicon, viewport, robots, and theme color, but no meta description, canonical, Open Graph, Twitter card, or apple-touch icon. This misses the attached site-structure contract for route metadata. A direct unknown-route navigation correctly returns 404 and consequently emits the browser's expected failed-resource diagnostic for that document.

### P3 — the publishable crate contains unrelated Node package files

`cargo package --list` includes README/LICENSE files from `node_modules` (Playwright, Vite, TypeScript, Rollup, and others). The crate still verifies and is only 84.1 KiB compressed, but the 57-file archive is not a clean CLI source package.

## Claims gate

`.factory/claims.json` exists with 16 unique IDs, each appearing in exactly one `@claim:<id>` test.

At the literal pre-install state, the 9 Cargo commands built and passed; the 7 npm commands exited 1 because `@playwright/test` was not installed. After the required clean install (`npm ci`, 24 packages, zero audit findings), every exact registered command passed:

| Claims | Result after clean install |
| --- | --- |
| CLI/Rust: core workflow, provider inputs, contact points, GET-only input, redaction, token exclusion, exit codes, free core, no telemetry | 9/9 passed |
| Browser/API: demo privacy, demo cleanup, offline reload, report download, web/CLI parity, paid template, sales closed | 7/7 passed |

The candidate still fails the claims contract because the parity test does not prove its claim and the Alertmanager provider test does not cover a supported matcher operator.

## Local gates and packaged CLI

- `npm ci`: passed; 24 packages installed, zero audit vulnerabilities.
- `npm test`: passed; 17 Rust tests, 7 API tests, and 42 Playwright tests across desktop Chromium and 390×844 mobile.
- `npm run lint`: passed; rustfmt, strict Clippy, and TypeScript checks passed.
- `npm run build`: passed; produced `target/release/alert-ledger` and `dist/site/`.
- `cargo package --allow-dirty`: passed; 57 files, 306.2 KiB unpacked / 84.1 KiB compressed.
- Clean packaged consumer install passed. `alert-ledger --version` returned `0.1.0`; help exposed only snapshot, diff, timeline, and demo.
- Packaged demo returned 3 changes and 2 matches with no raw endpoint. Manual Grafana snapshots produced 4 reviewed and 5 live routes; diff returned 3 changes and exit 2. Self-diff returned 0. Alertmanager input produced 2 routes. Stdin worked. Invalid provider, invalid timestamp, and insecure non-local HTTP URL each exited 1 with a recovery message.

## Live deployment, privacy, and security

- Candidate and live bytes match exactly for `index.html`, hashed JS/CSS, `sw.js`, hero art, terminal SVG, favicon, and `404.html`. This is not a deployment-only failure.
- Key SHA-256 values: HTML `e1393a5315e464d249bd3f3c02d34d8bd14985358b47b5e6c7e6b652d2901060`; JS `78fe1f6284f6f571fc48175f209df0b912f9b8fbff77f696527448c0beedfa81`; CSS `f406ea9d0844c45d782121fcfd10936968ee82dbe798a061b1ad739e6b22b985`; service worker `afbad2be2362ab340387a33b39c8ee45cca6786379ee8bb8382a41fe33418f15`.
- `/`, `/demo`, `/privacy`, `/terms`, `/404.html`, robots, sitemap, and all crawlable links returned 200. `/missing-tape` returned the designed 404. HTTP redirects to HTTPS; the TLS certificate matches the host and is valid through 28 February 2027.
- Normal demo flow made only same-origin requests. Initial storage used only `demo:alert-config-ledger:*`; **Start for real** removed the full demo namespace while preserving a non-demo key.
- The downloaded report had 3 entries and no raw endpoints. Clear/reset and corrupted-state recovery worked. Invalid license verification used only `api.sociobot.in`, stored the token/verdict as documented, and showed “License no longer active.”
- HTML sends CSP (including response-header `frame-ancestors 'none'`), HSTS, `nosniff`, strict referrer policy, and camera/microphone/geolocation restrictions. The API's 401 and 429 responses are `no-store, private`.
- HTML/service worker revalidate after 30 seconds. Hashed JS is one-year immutable. The hero is 169,978 bytes. Initial JS is 17,088 bytes (6,193 transferred compressed); CSS is 13,291 bytes (3,885 transferred compressed). No third-party font or script request was observed.
- The product has no sign-in flow, so the Entra tenant requirement does not apply.
- The static release has exact byte identity. The function exposes neither `/api/health` nor `/api/version`, so its deployed build identity cannot be queried directly.

## Accessibility, mobile, and PWA

- Factory `verify-url.sh` passed live `/demo` in 775 ms with title, `lang=en`, one H1, one main landmark, image alternatives, labelled buttons, and no console errors.
- Live axe checks on `/`, `/demo`, `/privacy`, `/terms`, `/missing-tape`, and `/404.html` found zero serious/critical issues.
- At 390 px, document width equalled viewport width at normal and 200% root text size. The smallest visible interactive target was 44×44 px.
- Keyboard-only smoke test: first Tab focused the skip link with a 3 px outline; Enter focused `main`; the next Tab reached “Try it with sample data”; Enter opened `/demo` and focused its H1; Space selected a changed route.
- Reduced-motion CSS replaces motion with 0.01 ms, one-iteration transitions/animations.
- Service-worker `update()` completed; it controlled the page after reload. Offline `/demo` reload returned 200 and showed the offline notice and 3-change comparison.
- Fresh Lighthouse 12.8.2 mobile: performance 99, accessibility 100, best practices 100, SEO 100; FCP 0.765 s, LCP 1.653 s, TBT 135 ms, CLS 0, transfer 184,101 bytes. Lighthouse's separate label-in-name diagnostic is recorded above.

Evidence is under [.factory/qa-artifacts/verification-7-live](qa-artifacts/verification-7-live/).

## Required repair and retest

1. Give every route a stable unique identity that disambiguates valid same-scope siblings without turning recipient edits into invisible collisions; add regression fixtures.
2. Parse and preserve all Alertmanager matcher operators, including `!~`; add a drift regression.
3. Generate the web sample from the same canonical fixture/report or compare every material field in the parity claim test.
4. Enforce rate limits in shared state or at ingress so concurrency and scale-out cannot bypass 20/60; ensure every 429 has `Retry-After`.
5. Add a usable public source/install path, repair the mobile accessible name and 404 metadata, and exclude Node files from the crate.
6. Rerun all 16 claim commands, full gates, packaged-consumer tests, the two false-negative cases, and live concurrent rate limits.

No product code was modified during verification.
