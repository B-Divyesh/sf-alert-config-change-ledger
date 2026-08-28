# Visual thesis — cassette-era incident zine

Alert Config Ledger treats configuration history like a hand-labelled mixtape: each snapshot is a side, each change is a track, and the source stamp says who recorded it. The visual system borrows photocopied zines, cassette shells, grease-pencil annotations, registration marks, and punched paper. It avoids nostalgia as decoration: the timeline, A/B comparison, and provenance stamps all reinforce the product's audit job.

## Palette

The site is intentionally single-mode, like black ink and spot colors on warm stock.

| Token | Value | Use |
| --- | --- | --- |
| `--paper` | `#F2E8CE` | main background |
| `--paper-deep` | `#DCCDAA` | secondary surfaces |
| `--ink` | `#191714` | primary text and rules |
| `--ink-soft` | `#544E45` | secondary text |
| `--oxide` | `#A9342A` | primary action and changed state |
| `--oxide-dark` | `#71231D` | hover and readable red text |
| `--signal` | `#0B6762` | matched and safe states |
| `--warning` | `#8A5500` | review-needed state |
| `--white` | `#FFFDF6` | high-contrast inset surfaces |

All body text combinations meet 4.5:1. Status never relies on color: labels and symbols repeat its meaning.

## Type

- Display: `Arial Black`, `Franklin Gothic Heavy`, system sans-serif. Condensed by layout, uppercase only for short labels.
- Body and interface: `Courier New`, ui-monospace, monospace. It connects terminal output, diff marks, and zine captions without downloading a font.
- Numbers use tabular figures. Body copy is 16–18 px with a 1.55 line height and a maximum 68-character measure.

## Spacing and shape

- An 8 px base rhythm: 8, 16, 24, 32, 48, 64, 96.
- Main content reaches 1180 px. Text columns stay under 70 characters.
- Corners are mostly square. Controls use 2 px ink borders and a 4 px offset shadow, like pasted paper.
- Dividers resemble tape leaders: alternating ink and transparent dashes. Small registration crosses mark section edges.
- On phones, the two comparison columns become a stacked A/B tape; optional decoration disappears before task content.

## Interaction grammar

- Primary buttons press down into their offset shadow.
- Focus is a 3 px signal-teal outline with a 3 px offset.
- The demo terminal accepts keyboard shortcuts and has visible labels for all actions.
- Route changes put focus on the page heading and announce it through a polite live region.
- Errors use a plain cause and one recovery action. Empty states explain which file to add.

## Motion policy

The signature motion is a single tape-spool turn when the demo timeline loads. Changes enter in reading order over 240 ms; buttons move 2 px on press. Nothing loops. With `prefers-reduced-motion: reduce`, transforms and stagger delays are removed and state changes are immediate.

## Asset plan and provenance

- `site/public/cassette-ledger.webp`: original generated hero illustration. Prompt: “Editorial cut-paper and ink illustration for a developer tool landing page: an open compact cassette transformed into an alert-routing ledger, two tape reels connected by a branching notification route, tiny punched timestamp marks and red/teal registration ink, warm recycled paper, black photocopy grain, cassette-era punk zine collage, dramatic three-quarter view, no words, no letters, no logos, no interface screenshot, no gradients, wide landscape composition, high contrast, usable negative space.” Generated on 2026-08-28 with `/opt/fleet/lib/gen-image.sh`, deployment `factory-image`; factory-owned generated asset. Converted locally to WebP.
- `site/public/og.webp`: 1200×630 crop composed from the same original art with product-colored framing. No required text is embedded.
- Tape, arrows, stamps, and terminal marks are hand-made in CSS or SVG and contain no third-party assets.

## Why this fits

Alert configuration is both operational and historical. Cassette labels make source, side, time, and sequence tangible. The zine language keeps the product vendor-neutral and investigative, while the dense mono type makes real diffs easy to scan.
