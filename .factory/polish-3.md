# Polish 3 acceptance map

Candidate `5f26ae5e2f8e01cdbfba140346ebe23a4930b9a0` was repaired through
`2a19cc3`; the release evidence and final documentation commit are recorded in
the handoff. This map covers every finding in all three adversarial reviews.
`npm test` passed 54 browser checks plus the Rust/API suites, and the clean
claim runner passed all 23 ledger entries. Live evidence is added after the
production deployment at the end of this document.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Rewrote the H1 as “Compare reviewed and live alert routes.” | `site/tests/site.spec.ts` first-screen checks; `copy-audit.md` |
| F-1-2 | Added `normalized-snapshot-input` and its snapshot comparison test. | `cargo test --test claims claim_normalized_snapshot_input_can_be_compared` |
| F-1-3 | Replaced subjective “realistic” copy with bounded “sample” copy. | `copy-audit.md`; live first-screen check |
| F-1-4 | Tightened hero layout so all three facts appear before the fold. | Playwright desktop/mobile first-screen checks |
| F-1-5 | Replaced the lore eyebrow with “Read-only alert route comparison.” | `copy-audit.md` |
| F-1-6 | Replaced “Baseline on reel A” with the reviewed-baseline caption. | `copy-audit.md` |
| F-1-7 | Replaced “Live state on reel B” with the live-configuration caption. | `copy-audit.md` |
| F-1-8 | Renamed the preview label “CLI demo / actual command.” | `copy-audit.md` |
| F-1-9 | Renamed the preview heading “Sample CLI comparison.” | `copy-audit.md` |
| F-1-10 | Renamed the workflow label “Three steps.” | `copy-audit.md` |
| F-1-11 | Renamed the install label “Install the CLI.” | `copy-audit.md` |
| F-1-12 | Renamed the limits label “Read-only limits.” | `copy-audit.md` |
| F-1-13 | Renamed the Pro label “Optional Pro feature.” | `copy-audit.md` |
| F-1-14 | Renamed demo exit to “Install the CLI” and retained its explicit cleanup/destination behavior. | `@claim:demo-exit-clears-state` |
| F-1-15 | Renamed the first workflow step “Import provider exports.” | `copy-audit.md`; `@claim:provider-inputs` |
| F-1-16 | Renamed the second workflow step “Put routes in one format.” | `copy-audit.md`; normalization claim test |
| F-1-17 | Renamed the third workflow step “Show route changes.” | `copy-audit.md`; `@claim:change-timestamps` |
| F-1-18 | Replaced unexplained “fingerprints” prose with SHA-256 identifiers. | README copy audit in `review-3.md`; recipient-redaction test |
| F-1-19 | Uses “change” consistently in public prose; literal CLI output remains literal. | `copy-audit.md`; `@claim:change-timestamps` |
| F-1-20 | Uses “recipient endpoints” consistently in privacy copy. | `copy-audit.md`; `@claim:recipient-redaction` |
| F-1-21 | Explains the demo key prefix in plain words. | `README.md`; `@claim:demo-privacy` |
| F-1-22 | Added route-specific title, description, canonical, Open Graph, and Twitter metadata. | Playwright route metadata tests; live route audit |
| F-2-1 | Added `change-timestamps` and assertions for every JSON/Markdown change record. | `cargo test --test claims claim_change_timestamps_appear_on_every_report_change` |
| F-2-2 | Added `pro-pack-contents` and checks for Route changes, Evidence, and Sign-off. | `npm run test:claim:pro-pack-contents` |
| F-3-1 | History entries now preserve scroll and focused control; Back/Forward restores them without disrupting native hash focus. | `browser Back and Forward restore focused controls and scroll position` (desktop + mobile) |
| F-3-2 | Added bundled `examples/alertmanager.json`; `provider-inputs` now proves JSON nested routes and receiver configuration normalize. | `cargo test --test claims claim_provider_inputs` |
| F-3-3 | Set `rust-version = "1.85"`, pinned `.nvmrc` to 22.12.0, and added the minimum-runtime claim. | `npm run test:claim:minimum-runtimes` (Rust 1.85.0; Node 22.12.0) |
| F-3-4 | Added `build-artifacts`; it builds, executes the release binary help, and asserts built site assets. | `npm run test:claim:build-artifacts` |
| F-3-5 | Registered and tagged `deployment-shape`, covering production target, static site, API, and approval-pack route. | `npm test -- --grep @claim:deployment-shape` |
| F-3-6 | Rewrote the README statement as the required deployer instruction, not an assertion about external state. | `README.md` Deploy section; copy audit |

## Release evidence

- Clean claim ledger: [clean-claims.txt](qa-artifacts/polish-3/clean-claims.txt)
- Full test output: [full-suite.txt](qa-artifacts/polish-3/full-suite.txt)
- Local verifier and screenshots: [verify.json](qa-artifacts/polish-3/local/verify.json), [desktop](qa-artifacts/polish-3/local/screenshot-desktop.png), [mobile](qa-artifacts/polish-3/local/screenshot-mobile.png)
- Local Lighthouse: [lighthouse.json](qa-artifacts/polish-3/local/lighthouse.json) — Performance 99, Accessibility 100, Best Practices 100, SEO 100; LCP 2.12 s and CLS 0.
- Production cold-check: recorded after deployment in `qa-artifacts/polish-3/live/`.
