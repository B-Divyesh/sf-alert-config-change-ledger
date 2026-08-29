# Changelog

## Unreleased

- Reject empty provider objects and HTTP error envelopes before writing snapshots.
- Keep duplicate sibling routes distinct so recipient drift cannot be overwritten.
- Preserve Alertmanager negative-regex matchers and report their changes.
- Generate the web demo report from the CLI comparison code.
- Enforce approval-pack request limits through a deployment-provided shared counter with an instance-local fail-safe.
- Add complete install, mobile wordmark, 404 metadata, and crate-package coverage.

## 0.1.0 — 2026-08-28

- Add Grafana and Alertmanager export normalizers.
- Accept Grafana contact-point arrays and fingerprint common recipient credentials.
- Add redacted snapshots, drift reports, and snapshot timelines.
- Add terminal, JSON, and Markdown output.
- Add a no-setup CLI demo with bundled sample exports.
- Add the offline web sandbox and product documentation.
- Gate the Pro approval pack behind server-side license verification.
- Fix desktop first-action visibility, text reflow, touch targets, 404 status, and mutable asset caching.
