# Independent product verification — FAIL

Verified on 28 August 2026 against candidate commit
`d015939b94892a760ec1ada067d20fc14d541746` and
`https://alert-config-change-ledger.sociobot.in`.

## Verdict

**FAIL. Do not release this candidate.** The deployed bytes match the candidate,
so the findings below are product defects rather than deployment skew.

## Release-blocking findings

### High — the required desktop first screen has no visible first action

The cold page says what the product does and who it serves: “Trace every alert
route change” and “For platform teams who need to prove whether live alert
routes match the reviewed baseline.” However, at a common 1366×768 desktop
viewport, the `Try it with sample data` link begins at y=826.75 and is entirely
below the 768 px viewport. At 1440×900 it begins at y=853.08 and is only
partially visible. A visitor cannot see what to click first without scrolling.
This directly fails the first-read acceptance gate. The action is fully visible
at 390×844 and works in one click.

Evidence: [desktop cold open](verification-artifacts/live-first-read-desktop-1366x768.png)
and [mobile cold open](verification-artifacts/live-first-read-mobile-390x844.png).

### High — common Grafana recipient changes are silently missed

The documented Grafana contact-point export shape is not accepted. Passing a
JSON array containing a Grafana email contact point exits `1` with
`error: grafana export has no route object`, despite README support for
“contact point exports.”

More seriously, two otherwise identical Grafana snapshots with the same
PagerDuty contact name and different `settings.integrationKey` values both
produce empty recipient fingerprints. `diff` reports zero changes, one matched
route, and exits `0`. This is a silent false negative for the brief's central
recipient-drift job. The bundled fixtures only cover `addresses` and `url`, so
the provider claim does not catch this case.

### High — the paid product cannot be bought and its paid file is public

- The live `Buy Pro for $49` target returns HTTP `404` with
  `{"error":"enabled factory product","status":404}`. There is no working
  purchase path.
- The supposedly licensed approval pack is directly available without a
  license at `/approval-report-template.md` (HTTP `200`, 378 bytes).

The valid-license browser test only checks that a mocked valid verdict reveals
the button. It does not test checkout availability or deny unlicensed access.

### High — claims coverage is incomplete

`.factory/claims.json` exists and its registered tests pass after dependency
installation, but several statements a visitor can rely on have no matching
claim entry and observable claim test. Examples include:

- “Core CLI costs $0” and all snapshot/diff/timeline formats stay free.
- Grafana “contact point exports” are supported and provider timestamps/fields
  are preserved.
- API tokens are not written to snapshots.
- The documented `0`/`1`/`2` exit-code contract.
- The $49 one-time purchase, checkout, refund handling, and unlicensed access
  boundary.
- The web demo runs the same comparison as the CLI.

This fails the required cross-check that every claim on the landing page and in
README has one sandbox test.

## Other findings

### Medium — text resizing and touch targets miss the accessibility baseline

- At 390 px with text enlarged to 200%, the landing page becomes 448 px wide;
  the headline and hero content run past the viewport. Evidence:
  [200% text screenshot](verification-artifacts/live-mobile-text-200.png).
- On the normal 390 px layout, the home wordmark target measures 44×32 px and
  the `Demo` navigation target measures 38.4×44 px. Both are below 44×44 px.
- The mobile not-found view is 411 px wide in a 390 px viewport because the
  decorative cassette extends outside the page.

### Medium — unknown routes return success status

`/missing-tape` renders the designed not-found UI but returns HTTP `200`, not
`404`. The static web app config has no `responseOverrides.404` entry or
`404.html`, so crawlers and clients cannot distinguish missing pages.

### Medium — mutable image URLs are cached as immutable for one year

`cassette-ledger.webp` and `og.webp` are unhashed URLs but return
`Cache-Control: public, max-age=31536000, immutable`. Replacing either at the
same URL can leave existing clients on stale art for a year.

## Claims gate

The commands were invoked exactly as listed before other QA. The five Rust
commands passed. The four browser commands initially exited `1` because the
clean clone had not yet installed `@playwright/test`. After the documented
`npm ci` prerequisite, all nine exact commands passed:

| Claim | Result after install | Evidence |
| --- | --- | --- |
| `core-workflow` | Pass | 3 changed routes and live source asserted |
| `provider-inputs` | Pass | Bundled Grafana and Alertmanager fixtures parsed |
| `read-only-import` | Pass | Local listener saw GET; help has no write command |
| `recipient-redaction` | Pass | Bundled report omitted fixture endpoints |
| `no-telemetry` | Pass | CLI demo passed with closed HTTP(S) proxies |
| `demo-privacy` | Pass | 2 browser projects; same-origin and demo prefix |
| `offline-reload` | Pass | 2 browser projects reloaded the demo offline |
| `report-download` | Pass | 2 browser projects downloaded three changes |
| `paid-template` | Pass | 2 browser projects with mocked valid verdict |

The initial dependency error is recorded because the work order explicitly
required the exact claim commands before installation. The later passing run
shows no claim-behavior failure in the registered fixtures; it does not resolve
the missing claim coverage above.

## First-read result

- What it does: compares live alert routes with a reviewed baseline and traces
  changes.
- For whom: platform teams that need proof the live and reviewed routes match.
- What to click first: `Try it with sample data`.

The words are plain and the one-click demo works, but the primary action is
outside the initial desktop viewport. Therefore the mandatory first-read gate
fails.

## Local verification

From the clean candidate checkout:

- `npm ci`: pass; 22 packages installed, zero audit findings.
- `npm test`: pass; 11 Rust tests and 20 Playwright tests across desktop and
  390×844 mobile.
- `cargo fmt --all -- --check`: pass.
- `cargo clippy --all-targets --all-features -- -D warnings`: pass.
- `npm run build`: pass; release binary and `dist/site/` produced.
- `npm audit --omit=dev`: pass; zero vulnerabilities.
- `cargo package --allow-dirty --no-verify`: pass; 51 files, 285.9 KiB
  unpacked, 80.1 KiB compressed.
- No separate lint or TypeScript type-check script is available.

The `.crate` archive was unpacked and installed into a fresh temporary prefix.
That consumer binary reported version `0.1.0`; `--help`, `demo --json`, Grafana
and Alertmanager snapshots, stdin input, JSON/Markdown output, and timeline all
worked. No-drift returned `0`; drift and a changed timeline returned `2`.
Unknown providers, empty JSON, malformed timestamps, insecure remote HTTP,
missing token variables, missing input, and missing directories returned `1`
with useful recovery text. The demo contained three changes, two matched
routes, and no sample contact values.

## Live deployment and browser verification

- Deployment identity: live HTML SHA-256
  `bdb9f14ba0fc6d2a1940fb77cc5ef405cf8d0664ced51dcdf42fba72ff15fa40`
  exactly matches `dist/site/index.html`. HTML, hashed JS/CSS, service worker,
  hero, social image, icons, and terminal image all matched byte-for-byte.
- `/`, `/demo`, `/privacy`, `/terms`, manifest, robots, sitemap, and service
  worker returned `200` over HTTPS.
- Desktop and 390 px routes have one H1, one main landmark, `lang=en`, route
  titles, alt text, header, and footer. No console or page errors occurred.
- Axe found zero serious or critical issues on `/`, `/demo`, `/privacy`,
  `/terms`, and the not-found UI at desktop and mobile sizes.
- Keyboard-only navigation starts at the skip link, shows a 3 px teal focus
  outline, enters the demo, and selects a route with Space. No trap was found.
- Reduced-motion mode changes animation duration to 0.01 ms, one iteration,
  and disables smooth scrolling.
- The live demo selected all changes, downloaded a three-change JSON report,
  entered and recovered from its empty state, reset, and removed all `demo:`
  keys on `Start for real`. A deliberately damaged demo state showed an
  announced recovery error and reset successfully.
- Demo browsing and download made only same-origin requests. The cold landing
  page loaded no analytics, third-party script, or font.
- License return capture stored the token under the documented key, stripped it
  from the URL, called only the Sociobot verify endpoint, and showed an invalid
  verdict correctly.
- Service worker registration and `update()` succeeded. Cache
  `alert-ledger-shell-v1` controlled the page; the demo reloaded offline with
  its comparison and offline notice.
- Security response policies include HSTS, CSP, `nosniff`, referrer policy,
  permissions policy, and frame blocking through CSP. Hashed JS/CSS are cached
  immutable for one year; HTML and the service worker revalidate after 30 s.
- Billing verification rate limit: in a rapid sequential burst, the first
  `429` was response 31 and included `Retry-After: 3`.
- Sign-in, backend persistence/concurrency, and server health/build identity
  are not applicable to this static site and local CLI.

## Performance

Fresh Lighthouse 12.8.2 mobile run against the live landing page:

| Measure | Result |
| --- | ---: |
| Performance | 96 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| FCP | 0.94 s |
| LCP | 1.81 s |
| Total blocking time | 213 ms |
| CLS | 0 |
| Transfer bytes | 183,711 |

A lab interaction trace recorded a maximum interaction event duration of 48
ms. Built assets are 16.71 KB JS (6.04 KB gzip), 12.56 KB CSS (3.65 KB gzip),
zero font bytes, and a 169,978-byte hero image. These are within the stated
budgets.

## Required next steps

1. Put the primary demo action fully above the fold on common desktop sizes.
2. Accept real Grafana contact-point exports and fingerprint every supported
   recipient endpoint/credential field; add regression fixtures for
   PagerDuty, Opsgenie, Slack, webhook, and email changes.
3. Register and verify the production billing product, and serve paid content
   only after server-side license authorization.
4. Add claim entries and observable tests for all remaining landing and README
   promises, including negative paid-access tests.
5. Fix 200% text reflow, 44×44 targets, not-found overflow/status, and mutable
   asset caching.
