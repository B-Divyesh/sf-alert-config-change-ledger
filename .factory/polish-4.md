# Polish 4 — cumulative acceptance map

- Base under review: `1fa6e8252e05e7a2471205ce631e8611e1fb761c`
- Review head: `63f95626123cdca18229f5decb2864c18a7736d8`
- Repaired and deployed release: `d54f36d51d1b9f6788adfd1c47888211fc801746`
- Live URL: <https://alert-config-change-ledger.sociobot.in>
- Result: **PASS — no blocker, major, or minor finding remains**

All prior repairs were rechecked against the deployment. The live evidence is
[`live-audit.json`](qa-artifacts/polish-4/live-audit.json), with cold first
screens at [`desktop`](qa-artifacts/polish-4/live-first-read-desktop.png) and
[`mobile`](qa-artifacts/polish-4/live-first-read-mobile.png), the demo at
[`mobile`](qa-artifacts/polish-4/live-demo-mobile.png), the factory verifier at
[`verify-url/verify.json`](qa-artifacts/polish-4/verify-url/verify.json), and
Lighthouse at [`lighthouse.json`](qa-artifacts/polish-4/lighthouse.json).

| Finding | Change made or retained | Evidence |
| --- | --- | --- |
| F-1-1 | Retained the bounded H1, “Compare reviewed and live alert routes.” | Live first-screen screenshots; `landing has the required structure and no serious accessibility issues` |
| F-1-2 | Retained normalized snapshot input and its clean comparison claim. | `@claim:normalized-snapshot-input` |
| F-1-3 | Retained “sample” rather than subjective “realistic” copy. | `copy-audit.md`; live audit landing copy |
| F-1-4 | Retained compact hero sizing so the action and three facts fit both viewports. | Live desktop/mobile first-screen screenshots; `live-audit.json` |
| F-1-5 | Retained “Read-only alert route comparison.” | `copy-audit.md`; live first screen |
| F-1-6 | Retained “Reviewed baseline on the left.” | `copy-audit.md`; live desktop screenshot |
| F-1-7 | Retained “Live configuration on the right.” | `copy-audit.md`; live desktop screenshot |
| F-1-8 | Retained “CLI demo / actual command.” | `copy-audit.md`; live audit landing copy |
| F-1-9 | Retained “Sample CLI comparison.” | `copy-audit.md`; live audit landing copy |
| F-1-10 | Retained “Three steps.” | `copy-audit.md`; live audit landing copy |
| F-1-11 | Retained the plain “Install the CLI” label. | Live link crawl in `live-audit.json` |
| F-1-12 | Retained “Read-only limits.” | `copy-audit.md`; live audit landing copy |
| F-1-13 | Retained “Optional Pro feature.” | `copy-audit.md`; live audit landing copy |
| F-1-14 | Kept distinct **Start for real** and **Install the CLI** exits; both delete demo-only keys and reach their named destinations. | `@claim:demo-exit-clears-state`; live audit `demo.afterExit` and `demo.startForReal` |
| F-1-15 | Retained “Import provider exports.” | `@claim:provider-inputs`; `copy-audit.md` |
| F-1-16 | Retained “Put routes in one format” with the SHA-256 explanation. | `@claim:recipient-redaction`; `copy-audit.md` |
| F-1-17 | Retained “Show route changes.” | `@claim:change-timestamps`; `copy-audit.md` |
| F-1-18 | Retained the README explanation of SHA-256 identifiers. | `@claim:recipient-redaction` |
| F-1-19 | Retained “change” as the public term. | `copy-audit.md`; full test suite |
| F-1-20 | Retained “recipient endpoint” as the single privacy term. | `copy-audit.md`; `@claim:recipient-redaction` |
| F-1-21 | Retained the plain demo-key-prefix explanation. | `@claim:demo-privacy`; `.factory/demo.md` |
| F-1-22 | Retained route-specific title, description, canonical, OG, and Twitter metadata. | `each route sets route-specific metadata`; live audit routes |
| F-2-1 | Retained source timestamps on each JSON and Markdown change. | `@claim:change-timestamps` |
| F-2-2 | Retained the real approval-template handler and required Route changes, Evidence, and Sign-off sections. | `npm run test:claim:pro-pack-contents` |
| F-3-1 | Retained saved focus and scroll restoration through Back and Forward. | `browser Back and Forward restore focused controls and scroll position`; live audit history |
| F-3-2 | Retained Alertmanager JSON fixture coverage. | `@claim:provider-inputs` |
| F-3-3 | Retained Rust 1.85.0 and Node 22.12.0 minimum-runtime validation. | `npm run test:claim:minimum-runtimes` |
| F-3-4 | Retained release binary and static-site artifact validation. | `npm run test:claim:build-artifacts` |
| F-3-5 | Retained registered Static Web Apps/API deployment shape. | `@claim:deployment-shape` |
| F-3-6 | Retained the README as a deployer instruction, not an assertion about external secret state. | README deploy review; `@claim:deployment-shape` |
| F-4-1 | Added `license-data-boundary`: fresh storage starts empty; after fixture verification it contains only token/verdict keys, survives reload unchanged, and has exactly one bodyless verification GET with the license as its only query value. | `@claim:license-data-boundary`; clean-clone ledger; live `/privacy` in `live-audit.json` |
| F-4-2 | Standardized all visitor-facing names as **approval report template**: landing, button, terms, README, claims, and terminology table. | `@claim:paid-template`; live landing copy in `live-audit.json`; `copy-audit.md` |

## Final verification

- `node site/scripts/test-clean-claims.mjs` ran every 25 ledger command from a
  dependency-free clone of the deployed commit.
- `npm test`, `npm run lint`, `npm run build`, and
  `cargo package --locked --allow-dirty` passed.
- `npm run verify:release -- d54f36d51d1b9f6788adfd1c47888211fc801746`
  matched the live receipt’s 14 static file digests and API build header.
- `/opt/fleet/lib/verify-url.sh` passed for the live landing page; its output
  confirms 200, title, `lang=en`, one H1/main, image alt text, labeled buttons,
  and no console errors.
- Live Lighthouse scored 99 performance and 100 accessibility, best practices,
  and SEO (LCP 1.8 s, CLS 0, TBT 90 ms).
