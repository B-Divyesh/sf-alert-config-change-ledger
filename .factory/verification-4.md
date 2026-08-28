# Independent product verification 4 — FAIL

Verified 28 August 2026 against candidate commit
`d862d110eaa08c19a46bac4d640bc63888c6bb40` and live deployment
`https://alert-config-change-ledger.sociobot.in`.

## Verdict

**FAIL — do not release.** The live static deployment exactly matches the
candidate, and the product is otherwise in strong shape. However, the
documented and claimed CLI exit-code contract is false for malformed command
invocations. A command-line parser error returns exit code `2`, the same code
the product documents as “drift found.” This is a release blocker for the
scriptable CLI: CI/on-call automation can report drift when the command was
actually malformed.

## Release-blocking finding

### High — parser errors impersonate configuration drift

The README and `.factory/claims.json` say the CLI returns `0` without drift,
`2` with drift, and `1` for command errors. A clean consumer installation of
the packaged candidate demonstrates otherwise:

```text
$ alert-ledger snapshot --provider grafana --source reviewed --output /tmp/x.json --unknown-option
error: unexpected argument '--unknown-option' found
...
parser_error_exit=2
```

The claim test `claim_documented_exit_codes` only covers a well-formed `diff`
with malformed file content, which correctly returns `1`; it does not cover
Clap/parser errors. The result conflicts with the public scripting contract
and makes code `2` ambiguous. Map parser failures to `1`, or explicitly change
the documented/claimed contract and its tests so `2` is reserved only for
actual drift.

## Required claims gate

`.factory/claims.json` exists. From the clean candidate checkout, every test
command listed in it passed after the required clean dependency installation
(`npm ci`, 24 packages, zero audit vulnerabilities):

| Claim IDs | Exact registered command | Result |
| --- | --- | --- |
| core-workflow, provider-inputs, grafana-contact-points, read-only-import, recipient-redaction, token-exclusion, exit-codes, free-core-cli, no-telemetry | `cargo test --test claims <registered test name>` | Pass (9/9) |
| demo-privacy | `npm test -- --grep @claim:demo-privacy` | Pass |
| offline-reload | `npm test -- --grep @claim:offline-reload` | Pass |
| report-download | `npm test -- --grep @claim:report-download` | Pass |
| web-cli-parity | `npm test -- --grep @claim:web-cli-parity` | Pass |
| paid-template | `npm test -- --grep @claim:paid-template` | Pass |
| sales-closed | `npm test -- --grep @claim:sales-closed` | Pass |

The registered `exit-codes` test passing does not clear the finding above: its
coverage is too narrow for the claim it makes.

## First-read result

**Pass.** On a cold, uncached live visit the first screen says:

- What it does: “Trace every alert route change.”
- For whom: platform teams proving live routes match a reviewed baseline.
- What to do first: the visible one-click **Try it with sample data** action,
  labelled “Loads three realistic route changes in an isolated demo.”

The action was fully in the initial viewport at 1366×768 (`y=694.44`,
`height=48.80`) and 1440×900 (`y=715.77`, `height=48.80`).

## Local build, tests, and consumer test

- `npm ci`: pass; 24 packages installed; audit reported zero vulnerabilities.
- `npm test`: pass; 17 Rust tests, 7 API tests, and 38 Playwright tests.
- `npm run lint`: pass (`cargo fmt --check`, strict Clippy, TypeScript).
- `npm run build`: pass; generated `target/release/alert-ledger` and
  `dist/site`.
- `cargo package --allow-dirty`: pass; 57 files, 305.5 KiB unpacked,
  83.9 KiB compressed.
- The packaged crate was extracted and installed with `cargo install` into a
  new temporary consumer prefix. `--version`, `--help`, and `demo --json`
  worked. The demo reported 3 attributed changes and 2 matched routes, with
  recipient fingerprints rather than endpoint values.
- In that clean consumer, normal Grafana snapshot + diff output worked;
  actual drift returned `2`. Unsupported provider input returned `1` with a
  recovery message. The malformed-option case above returned the incorrect
  `2`.

## Live product and privacy checks

- Candidate/deployment identity: local and live SHA-256 hashes matched for
  `index.html` (`ecc9ae…7fb0`), JS (`71b6cf…650`), CSS
  (`61f38f…5822`), and `sw.js` (`643dd9…a089`).
- Desktop and 390×844 mobile checks found one `h1`, one `main`, `lang=en`,
  route-specific titles, no horizontal overflow (including 200% text), and
  no serious/critical Axe findings on `/`, `/demo`, `/privacy`, `/terms`, and
  the designed 404 page. `/missing-tape` returned HTTP 404.
- Keyboard smoke test: Skip link was first, had a 3px visible focus outline,
  moved focus to `main`, and keyboard Space selected a demo route. Reduced
  motion used `scroll-behavior: auto`.
- The live demo selected a route, downloaded
  `alert-ledger-sample-report.json` (3 changes, 2 matched), used only
  `demo:alert-config-ledger:state`, cleared it with Start for real, registered
  one service worker, and reloaded offline after its first visit.
- Playwright request logging found no cross-origin request during the whole
  demo flow. No console/page errors occurred on normal landing/demo/legal
  routes.
- The only server endpoint was exercised from one client. In 35 rapid POSTs
  to `/api/approval-pack`, the first 20 returned 401 and the next 15 returned
  429 with `Retry-After` 58–59 seconds: observed allowance **20 requests per
  60-second window per function instance**. Rejections used
  `Cache-Control: no-store, private` and `X-Content-Type-Options: nosniff`.
- Live response headers include HSTS, CSP, `nosniff`, strict referrer policy,
  and permissions policy. Hashed JS/CSS are one-year immutable; HTML and
  service worker revalidate at 30 seconds; mutable WebP art revalidates after
  one hour.

## Performance and links

- Built JS: 16.97 KB / 6,178 bytes gzip; CSS: 13.20 KB / 3,778 bytes gzip;
  no downloaded fonts. Both are well inside the static initial-JS/CSS budgets.
- Hero is 169,978 bytes and OG art is 147,442 bytes; the hero is below the
  300 KB mobile-image budget.
- Live internal routes `/`, `/demo`, `/privacy`, and `/terms`, plus the
  external factory link, each returned 200. The real missing route returned
  404.

## Notes

`verify-url.sh` is not present in this repository. Its required title, lang,
main, alt/semantic, and console checks were performed directly with
Playwright instead.

## Required repair

Ensure parser/usage failures return `1` (with `2` reserved for a completed
comparison that found drift), add an observable regression case to
`claim_documented_exit_codes`, then rerun the complete claim suite and this
verification.
