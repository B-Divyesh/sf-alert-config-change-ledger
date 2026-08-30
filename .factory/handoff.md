# Alert Config Ledger — verification 14 handoff

- Work order: `alert-config-change-ledger-verify-14`
- Tested candidate: `317958d56b9e17cd277a5161354c1754ee8953fd`
- Tested URL: <https://alert-config-change-ledger.sociobot.in>
- Date: 30 August 2026 UTC
- Status: **FAIL — dynamic demo and license results lose keyboard focus and are not announced to screen readers**

## What was verified

The mandatory 23-command claims ledger ran first from the clean checkout and
passed, including its nested clean-clone bootstrap. The cold first screen also
passed: it plainly states the job, audience, first action, expected sample
result, and three facts at desktop and 390 px.

All standard local gates passed:

```sh
npm ci
npm ci --prefix api
npm test
npm run lint
npm run build
cargo package --locked
```

`npm test` passed 25 Rust, 13 API, 2 script, and 54 Playwright tests. The
release crate installed into a fresh consumer and completed normal drift,
no-drift, timeline, stdin, JSON, and Markdown workflows. Invalid inputs and
unwritable outputs returned documented errors without leaving snapshots.

The live deployment matches the candidate build byte-for-byte across HTML,
hashed JS/CSS, service worker, PWA manifest, 404, and principal art. Privacy,
offline reload, response security headers, cache behavior, demo storage
isolation, endpoint build identity, rendered links, and normal page error logs
passed. Live request ceilings are 20 requests/60 seconds for the approval-pack
endpoint and 30 requests/window for Sociobot product verification; both
returned 429 with `Retry-After` on the next request.

Fresh Lighthouse mobile results were Performance 99, Accessibility 100, Best
Practices 100, SEO 100, LCP 1.81 s, CLS 0, and 185,435 bytes transferred.

## Release blockers

1. **High — core demo focus and announcement:** Keyboard activation of
   **Clear comparison** replaces the focused button, leaves focus on `<body>`,
   and exposes an empty state with no live-region semantics. Activating the
   recovery **Reset demo** also leaves focus on `<body>` because
   `#ledger-title` is an H2 without `tabindex`.
2. **Medium — license result focus and announcement:** After keyboard
   activation of **Verify license**, the real invalid verdict is visible, but
   focus falls to `<body>` and the result has no `aria-live`, status/alert
   role, or populated global live region.

These interaction failures violate the attached non-negotiable keyboard,
forms, and screen-reader baseline even though static Axe reports no
serious/critical violations.

## Handoff

No product code was changed. The complete evidence and remediation details are
in `.factory/verification-14.md`. Fix focus management and live announcements,
add keyboard regressions for clear/reset/license transitions, rerun the full
clean claims ledger, and issue a new independent verification.
