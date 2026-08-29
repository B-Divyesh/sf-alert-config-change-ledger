# Verification 13 — FAIL

- Work order: `alert-config-change-ledger-verify-13`
- Candidate: `6996431117e8e613eabd3b58f2258e2e3b9ffdf6`
- Live URL: <https://alert-config-change-ledger.sociobot.in>
- Verified: 29 August 2026 UTC
- Result: **FAIL**

This is an independent verification. No product source was changed.

## Release-blocking findings

### High — the required demo exit is missing

The `/demo` banner says `Demo — sample data, nothing is saved` and offers
`Reset demo` plus **`Install the CLI`**. It does not offer the required
one-action **`Start for real`** exit. The demo-sandbox contract explicitly
requires a persistent banner with `Reset demo` and `Start for real`; the
second action must discard demo state before entering the non-demo workflow.

Evidence: cold mobile Playwright capture of `/demo` showed the first banner
text as `Reset demo` / `Install the CLI`. The existing `Install the CLI`
action does clear `demo:alert-config-ledger:` keys and navigates to `/#install`,
but its label and destination do not satisfy the required real-mode action.

### High — `npm test` is not reliable: Back/Forward leaves keyboard focus off-screen

The final clean-run `npm test` failed with 53/54 Playwright tests passing.
The failing mobile test was:

```
site/tests/site.spec.ts:57
browser Back and Forward restore focused controls and scroll position
Expected footer bottom <= 844; received 1115.5
```

After browser Back from Privacy to the landing page, the footer Privacy link
is the focused element but is below the 390×844 viewport. That makes the
restored keyboard focus non-visible and fails the product's own history/accessibility
test. The same failure occurred in the earlier suite attempt; an isolated
retry happened to pass, so this is a reproducible intermittent race rather
than a passing quality gate.

Evidence: `/tmp/alert-ledger-npm-test-final.log` and the generated Playwright
trace/screenshot under `test-results/site-browser-Back-and-Forw-1ad85-ontrols-and-scroll-position-mobile/`.

### Medium — minimum-runtime claim is not self-bootstrapping

On the initial ordered claims run, exact command
`npm run test:claim:minimum-runtimes` failed because the clean verifier did
not have `rustup` toolchain `1.85.0` installed:

```
error: toolchain '1.85.0-x86_64-unknown-linux-gnu' is not installed
```

After independently installing the declared Rust toolchain, the exact command
passed and the complete clean-clone claim ledger passed. The compatibility
claim is true, but its documented test cannot run from a clean clone without
an undocumented global toolchain prerequisite. Either provision it explicitly
in the documented bootstrap/CI command or make the checker install it.

## Claims ledger

`.factory/claims.json` exists and lists 23 entries. I ran every listed command
in ledger order against bundled demo data.

- Initial run: the first 21 CLI/browser/build/deployment claims passed; the
  `clean-claim-bootstrap` entry failed at its `minimum-runtimes` step solely
  because Rust 1.85.0 was absent from this clean verifier.
- After installing Rust 1.85.0, `npm run test:claim:minimum-runtimes` passed
  (Rust 1.85.0 and Node 22.12.0 Vite build).
- Fresh clean-clone rerun: `node site/scripts/test-clean-claims.mjs` exited 0
  with `Clean-clone claim regression passed: every ledger command ran once.`

Individual observable claim checks included: CLI demo finds three changes;
contact data is fingerprinted; JSON report has three changes; web and CLI
reports agree; demo traffic remains same-origin; demo exit clears its namespace;
offline reload works; approval content remains license-gated; and deployment
shape is checked.

## Local build and package verification

- `cargo test`: passed (5 unit, 13 claim, 7 CLI integration tests).
- `npm test`: **failed**, 53 passed / 1 failed as described above. API tests
  (13) passed.
- `npm run lint`: passed (`cargo fmt --check`, clippy with warnings denied,
  TypeScript check).
- `npm run build`: passed. Produced `target/release/alert-ledger` and
  `dist/site/`; initial JS gzip is 7.43 kB and CSS gzip is 3.82 kB.
- `cargo package --allow-dirty --no-verify`: passed (30.4 kB crate).
- Clean consumer install: extracted that crate, `cargo install --path` into a
  new temporary root, then ran `alert-ledger --help` and
  `alert-ledger demo --json`. It exited 0 and returned 3 changes, 2 matched
  routes, source `grafana:production`, with no raw URL/email endpoint values.

## Live product checks

### First-read test — PASS

Cold landing text plainly says it compares reviewed and live alert routes for
platform teams who need to prove whether the live route matches the reviewed
baseline. The first action is `Try it with sample data`, immediately explained
as loading three isolated sample changes. It is one click and clearly answers
what it does, who it is for, and what to click first.

### Workflow, privacy, and accessibility

- At `/demo`, selected the checkout route with the keyboard/click workflow;
  the detail changed to Severity changed. Downloaded
  `alert-ledger-sample-report.json`, which has exactly 3 changes and only
  recipient fingerprints.
- The demo request log contained only the live origin (HTML, JS, CSS, cassette
  WebP, and terminal SVG); there were no cross-origin requests. Leaving via
  the existing Install-the-CLI action removed all `demo:` localStorage keys.
- A fresh context had active and controlling `/sw.js`; after one online load,
  `/demo` reloaded offline and displayed the offline notice.
- Playwright Axe found no serious or critical violations on `/`, `/demo`,
  `/privacy`, `/terms`, or the 404 page. No application/page errors occurred
  on normal routes. Chromium emits the expected failed-resource console entry
  when requesting the deliberate HTTP 404 route.
- 390 px mobile has no horizontal overflow (`scrollWidth = clientWidth = 390`)
  and was visually reviewed. The Back/Forward defect above remains.

### Deployment identity, headers, limits, and performance

- Candidate build and live deployment match byte-for-byte for `index.html`,
  the hashed JS/CSS assets, cassette image, terminal SVG, and `sw.js`. Live
  route footer shows build `004`; live approval handler returns
  `X-Alert-Ledger-Build: repair-7`, matching the candidate API source.
- Live headers include HSTS, `X-Content-Type-Options: nosniff`, strict-origin
  referrer policy, a self-restricted CSP with `frame-ancestors 'none'`, and
  restrictive permissions policy. Hashed JS/CSS are cached immutable for one
  year; HTML and service worker revalidate after 30 seconds.
- The approval-pack endpoint uses the Azure Table shared limiter. A single
  client received 20 allowed invalid-license responses (403); request 21 and
  later received `429` with `Retry-After` (37 seconds observed). Allowance:
  **20 requests/minute**.
- Lighthouse mobile: Performance 93, Accessibility 100, LCP 1.66 s, CLS 0,
  total transfer 181 KiB.

## Required remediation

1. Replace/add the demo-banner real-mode action with a plainly labelled
   `Start for real`, which clears demo keys and enters the actual start flow;
   retain Install the CLI as a separate secondary action if wanted.
2. Fix the history restoration race so restored focused elements are scrolled
   into view before the assertion/user can interact; make the full `npm test`
   suite deterministic.
3. Make the minimum-runtime claim bootstrap its declared Rust toolchain or
   document/provision that prerequisite in the clean-clone command.
