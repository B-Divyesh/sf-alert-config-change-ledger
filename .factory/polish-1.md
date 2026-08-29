# Polish 1 — review findings closed

- Work order: `alert-config-change-ledger-polish-1`
- Base reviewed: `c1b4d52d66cfdc9a8e8231a5054e47d9c792fc4d`
- Review: [`.factory/review-1.md`](review-1.md)
- Local screenshots: [`qa-artifacts/polish-1-desktop.png`](qa-artifacts/polish-1-desktop.png), [`qa-artifacts/polish-1-demo-mobile.png`](qa-artifacts/polish-1-demo-mobile.png)

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Replaced the absolute hero promise with “Compare reviewed and live alert routes.” | `landing has the required structure`; desktop screenshot |
| F-1-2 | Registered normalized snapshot JSON as a claim and added a clean temporary-directory import-and-compare test. | `cargo test --test claims claim_normalized_snapshot_input_can_be_compared` |
| F-1-3 | Replaced “realistic” with “sample” on the landing page and README. | `.factory/copy-audit.md`; `npm test` |
| F-1-4 | Reduced desktop hero type and spacing and added an assertion that the action and every fact are above common desktop viewports. | `first screen includes the action and all three facts on common desktop viewports`; desktop screenshot |
| F-1-5 | Replaced the hero label with “Read-only alert route comparison.” | `.factory/copy-audit.md` |
| F-1-6 | Replaced the baseline caption with a left-side location. | `.factory/copy-audit.md`; desktop screenshot |
| F-1-7 | Replaced the live caption with a right-side location. | `.factory/copy-audit.md`; desktop screenshot |
| F-1-8 | Renamed the preview label “CLI demo / actual command.” | `.factory/copy-audit.md` |
| F-1-9 | Renamed the preview heading “Sample CLI comparison.” | `.factory/copy-audit.md` |
| F-1-10 | Renamed the method label “Three steps.” | `.factory/copy-audit.md` |
| F-1-11 | Renamed the install label “Install the CLI.” | `.factory/copy-audit.md` |
| F-1-12 | Renamed the limits label “Read-only limits.” | `.factory/copy-audit.md` |
| F-1-13 | Renamed the Pro label “Optional Pro feature.” | `.factory/copy-audit.md` |
| F-1-14 | Replaced “Start for real” with “Install the CLI”; it clears demo keys and goes to installation. | `@claim:demo-exit-clears-state`; mobile demo screenshot |
| F-1-15 | Renamed step one “Import provider exports.” | `.factory/copy-audit.md` |
| F-1-16 | Renamed step two “Put routes in one format” and explains SHA-256 identifiers. | `.factory/copy-audit.md` |
| F-1-17 | Renamed step three “Show route changes.” | `.factory/copy-audit.md` |
| F-1-18 | Rewrote the README to explain SHA-256 identifiers without unexplained jargon. | README review; `npm test` |
| F-1-19 | Used “change” consistently in page copy, README, reports, exit-code guidance, and terminal output. | `cargo test`; `.factory/copy-audit.md` |
| F-1-20 | Used “recipient endpoints” consistently in README privacy guidance. | README review; `npm test` |
| F-1-21 | Rewrote demo storage guidance in plain browser-key language and documented `?demo=1`. | `@claim:demo-exit-clears-state`; `.factory/demo.md` |
| F-1-22 | Added route-specific title, description, canonical, Open Graph, and Twitter metadata updates and coverage. | `each route sets route-specific metadata` |

## Additional acceptance repairs

- `/?demo=1` now enters the same isolated demo as `/demo`, with the persistent banner, reset control, and demo-only localStorage prefix.
- The static 404 page now matches the SPA 404 copy and metadata, so fallback delivery cannot reintroduce old lore.
- `.factory/catalog-description.txt` is now a verb-first, 87-character catalog sentence.

## Verification

Local verification before deployment:

```sh
npm ci
npm ci --prefix api
npm test
npm run build
npm run lint
```

All registered claims, including the new normalized snapshot claim, are rerun from a clean clone before handoff. Live deployment and cold-URL evidence are appended to the handoff after release.
