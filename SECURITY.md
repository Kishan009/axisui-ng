# Security Policy

## Supported versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

The library is pre-1.0. Security patches land on the latest minor version.

## Reporting a vulnerability

**Please do not file a public GitHub issue for security vulnerabilities.**

Email security@yourlib.dev (TBD — replace with actual address before public launch). You should receive a response within 48 hours. If you don't, follow up with a maintainer directly.

For non-critical issues (XSS in a non-default configuration, etc.), please still use the private email — the line between "issue" and "vulnerability" can be fuzzy.

## What to expect

1. **Acknowledgment** within 48 hours
2. **Triage** within 1 week — we'll assess severity and assign a CVE if needed
3. **Patch** within 30 days for critical issues, 90 days for non-critical
4. **Coordinated disclosure** — we'll work with you on the disclosure timeline

## Security model

The library runs in the consumer's browser. Our security model:

- **No telemetry in the library code.** Consumers can opt into telemetry via a separate package (Pro feature, default off).
- **No network calls** from component code without explicit user action (e.g., the Combobox's async loading is consumer-driven).
- **CSP-friendly.** Components don't use inline scripts or `eval`. They use only declarative templates and signal APIs.
- **No third-party trackers.** Analytics on the docs site use Plausible (self-hostable, GDPR-friendly, no cookies).
- **License key validation** is local (LemonSqueezy keys) — no phone-home required.

## Scope

In scope:

- XSS in component templates
- Prototype pollution via component inputs
- License key bypass
- Dependency vulnerabilities (transitive deps)

Out of scope:

- Issues in consumer applications
- Issues in upstream Angular / Tailwind / cva
- Denial of service via consumer-supplied data
