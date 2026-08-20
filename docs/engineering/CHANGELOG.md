# Changelog

## 2026-08-17 — Registration wizard hardening

- Clarified registration, main, and other-instrument terminology.
- Enforced main-instrument fallback and duplicate exclusion in UI, public registration, admin creation, approval, and legacy self-registration payloads.
- Centralized wizard step transitions and progress calculation to prevent Step 5 dead clicks and progress values above 100%.
- Added `test:wizard`; expanded platform and live-flow probes to verify instrument persistence.

## 2026-08-17

- Added Windows-compatible Node/npm build and start scripts.
- Added `.env.example` and local `.env` setup.
- Removed `ignoreBuildErrors` from Next configuration.
- Added canonical RBAC permission catalog and coverage verification.
- Synced active admin permissions in the local database.
- Fixed course cards calling an admin-only enrollment endpoint.
- Fixed workshop reservation UI not sending the session token.
- Added engineering documentation and live flow probe.
- Verified local production server role-flow probe: 13/13 checks matched.
# 2026-08-17 — Production QA incident hardening

- Restricted public registration to students at both UI and API layers.
- Added Iranian phone/digit normalization and national-ID checksum validation.
- Reworked registration modal layout around dynamic viewport height, flex sizing, internal scrolling, footer visibility, and step focus restoration.
- Isolated admin/student login rate limits and removed the admin-domain fallback request to the student login endpoint.
- Added repeatable `test:platform` coverage and made the live flow probe isolated and exact-cleanup safe.
