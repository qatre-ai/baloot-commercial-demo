# Reality Audit Snapshot

Date: 2026-08-17

## Confirmed before fixes

- `admin@mab.ir` had 0 database permissions.
- Secretary registration list returned HTTP 403.
- Secretary registration approval returned HTTP 403.
- Course cards posted to the admin-only enrollment route and returned HTTP 401 for a student.
- Workshop cards used bare `fetch()` and returned HTTP 401 because the session header was absent.
- The public registration form exposed an instructor card and the public pending-registration API accepted `role: "instructor"`.
- The registration dialog stacked a fixed-height content region with a fixed footer; at short viewports the mobile field required an unreliable scroll path.
- Login rate limiting used a shared IP bucket across student and admin login endpoints, producing `429` for unrelated accounts after repeated attempts.
- TypeScript had 423 errors while Next build ignored them.

## Verified after fixes

- Canonical RBAC catalog covers all 50 permission pairs enforced by API routes.
- Active super-admin has 111 permissions; active secretary has 85 permissions.
- TypeScript passes with `npm run typecheck`.
- Production build passes with `npm run build`.
- Local production server starts on Windows.
- `npm run test:platform` passes 19/19 checks, including public instructor denial, invalid phone/national-ID validation, duplicate submission, Persian-digit login, logout, and role boundaries.
- `npm run test:flows` passes 14/14 checks with isolated test data, including approval, course enrollment, workshop reservation, and negative authorization.
- The public registration screen was verified manually at the local 1280×720 desktop viewport: the public role card is absent, the form has an internal scrollbar, and the mobile field is reachable after scrolling while the footer remains visible.
- Login rate limiting is now layered: a higher shared-IP flood guard in middleware plus per-account route limits, so one account cannot block unrelated accounts on the same network.
- Test probes use reserved test IPs and exact IDs, and final database checks report zero `QA_2026`/`QA_FLOW_2026` students, pending registrations, enrollments, or workshop tickets.
- Registration wizard hardening adds a shared instrument resolver and canonical step transition module. Development and standalone production probes verify the fallback and database persistence.

## Remaining non-release blockers

- `npm run lint` completes but fails with 64 existing product-code React hook/static-component errors; bundled `.agents`, probe, and skill scripts are excluded from the lint scope.
- Legacy password hashing needs a controlled migration to a memory-hard algorithm.
- Backup subsystem tracing warnings should be evaluated in the target deployment environment.
- Full browser E2E, responsive viewport automation, payment-state fixtures, and complete panel-by-panel operational coverage remain release follow-ups.
