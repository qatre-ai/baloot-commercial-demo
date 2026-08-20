# Application Shell Migration QA Report

Project: Mehr Avaye Baloot
Date: 2026-08-18
QA URL: http://localhost:3010
Database: isolated SQLite database at `db/qa.db`

## Scope

- Separate public marketing experience from authenticated applications.
- Add canonical role routes: `/student`, `/instructor`, `/admin`, `/super-admin`.
- Add shared `ApplicationShell` and `AuthenticatedRoute`.
- Preserve existing registration, payment, enrollment, Prisma, and API business logic.
- Route login and logout through the canonical role home.
- Keep existing role panels as route-owned content without public-page overlay leakage.

## Browser Results

| Scenario | Result | Evidence |
| --- | --- | --- |
| Anonymous direct visit to `/student` | PASS | Redirected to `/` |
| Student login and role route | PASS | `qa.student@mab.local` reached `/student` |
| Student panel data | PASS | Classes, schedule, exercises, payments, announcements rendered |
| Student logout | PASS | Returned to `/`, session was cleared |
| Instructor login and role route | PASS | `qa.instructor@mab.local` reached `/instructor` |
| Instructor panel data | PASS | Dashboard, classes, grading, requests and announcements rendered |
| Secretary login and role route | PASS | `qa.secretary@mab.local` reached `/admin` |
| Secretary registration management | PASS | Online registration requests and pending counters rendered |
| Super-admin login and role route | PASS | `qa.superadmin@mab.local` reached `/super-admin` |
| Super-admin monitoring | PASS | KPI cards, registration/revenue trends, security and audit navigation rendered |
| Public leakage into private routes | PASS | Private routes displayed no public Header/Hero/Footer content |

The browser checks were performed in a real Chrome session against the QA server. The browser password-save prompt was dismissed and was not part of the application UI.

## Automated Validation

| Gate | Result | Command |
| --- | --- | --- |
| Application role contract | PASS | `npm exec tsx scripts/test-application-shell-contract.ts` |
| Registration wizard regression | PASS | `npm run test:wizard` |
| RBAC catalog regression | PASS | `npm run test:rbac` |
| TypeScript | PASS | `npm run typecheck` |
| Production build | PASS | `npm run build` |
| Scoped lint for migration files | PASS | `npx eslint src/components/application-shell src/app/student src/app/instructor src/app/admin src/app/super-admin src/lib/application-shell/contract.ts src/app/page.tsx src/components/layout/header.tsx` |
| Full-project lint | NOT PASS | Existing React hooks/static component findings remain across legacy panels and public sections |

The production build completed and generated the standalone bundle. Build emitted existing filesystem tracing warnings from backup code; these did not prevent compilation or standalone output.

## Architecture Delivered

- `src/lib/application-shell/contract.ts`
  - canonical role resolution
  - role home paths
  - permission-aware navigation contract
- `src/components/application-shell/application-shell.tsx`
  - shared authenticated header
  - responsive mobile menu infrastructure
  - desktop collapse model
  - logout action
- `src/components/application-shell/authenticated-route.tsx`
  - session hydration
  - role mismatch redirect
  - anonymous direct-route protection
- `src/app/student/page.tsx`
- `src/app/instructor/page.tsx`
- `src/app/admin/page.tsx`
- `src/app/super-admin/page.tsx`
- Existing role panels now support `routeOwned` mode, preserving business logic while removing fixed overlay behavior in canonical routes.
- Public `src/app/page.tsx` no longer mounts private dashboards or admin panels.
- Public Header actions navigate to the canonical role route.
- Login, registration, and logout update navigation through the resolved role.

## Known Limitations

- Full-project lint is not clean because legacy files contain pre-existing `react-hooks/set-state-in-effect` and `react-hooks/static-components` findings. The changed migration files pass scoped lint, except the auth store retains two Next navigation warnings for legacy `window.location.assign` routing.
- Playwright/Cypress was not installed or used.
- A formal DevTools console/network export was not captured; server logs and real browser navigation were observed.
- A complete 375/768/1024/1440 responsive matrix was not run.
- Admin and super-admin panels retain their internal role-specific navigation in route-owned mode to avoid duplicating existing business workflows during this migration. The shared shell infrastructure remains the common viewport/header boundary.

## Release Decision

`CONDITIONAL`

The authenticated application-shell migration and role-route browser smoke are working. Do not label the project fully Production Ready until the remaining responsive matrix, DevTools console/network audit, and legacy full-lint backlog are completed.

## Local Windows Runbook

```powershell
npm install
npm run qa:seed
npm run qa:inspect
npm run qa:dev
```

Open `http://localhost:3010`.

QA account password: `QA_Baloot_2026!`

## Backups

Pre-change backup:

`D:\work\project\_Baloot_Backups\Baloot_PRE_UI_UX_HARDENING_2026-08-18_15-42-49.zip`

The post-change backup is recorded in the final handoff after validation completes.

Post-change backup:

`D:\work\project\_Baloot_Backups\Baloot_FINAL_APPLICATION_SHELL_2026-08-18_2026-08-18_16-54-08.zip`

SHA-256:

`93EC878EB4BB92A4677F2E48EC93627143DE80CABECA11D195E05FDD161419FB`
