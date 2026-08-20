# Phase 2 Student Application QA Report

Project: Mehr Avaye Baloot  
QA URL: `http://localhost:3010`  
Database: isolated `db/qa.db`  
QA marker: `QA_PERSISTENT_2026`

## Delivered

- Added authenticated student profile read/update flow without a schema migration.
- Added profile navigation and a responsive profile form with validation, save state,
  failure state, and persistence through `PUT /api/student/profile`.
- Added real workshop reservation actions to student recommendations using the
  existing `/api/workshops/[id]/purchase` business flow.
- Added workshop capacity/closed-state presentation and loading guards.
- Hardened course registration duplicate handling and capacity filtering.
- Hardened workshop seat reservation with an atomic capacity update.
- Excluded failed/refunded payment records from the payment-progress denominator.
- Added explicit failed/refunded payment labels.
- Added the Phase 2 backlog and implementation design specification.

## Automated validation

| Gate | Result | Command |
| --- | --- | --- |
| Student behavior contract | PASS | `npx tsx scripts/test-student-application-contract.ts` |
| TypeScript | PASS | `npm run typecheck` |
| RBAC regression | PASS | `npm run test:rbac` |
| Registration wizard regression | PASS | `npm run test:wizard` |
| Application shell contract | PASS | `npx tsx scripts/test-application-shell-contract.ts` |
| Production build | PASS | `npm run build` |

The production build generated 68 static pages and the standalone bundle. It
continues to emit the existing filesystem-tracing warnings from backup code.

## QA API checks

Using `qa.student@mab.local` with `QA_Baloot_2026!`:

- `GET /api/student/profile`: `200`
- `GET /api/student/enrollments`: `200`
- `GET /api/student/schedule`: `200`
- `GET /api/student/exercises`: `200`
- `GET /api/student/payments`: `200`
- `GET /api/student/recommendations`: `200`
- Duplicate class registration: `409`
- Full/closed class registration: `400`
- Closed/full workshop reservation: `400`
- Payment summary correctly reports paid, pending, and total active amount.

## Instructor audit

The instructor application has protected, separate API flows for dashboard,
schedule, exercises, submissions, requests, makeup classes, and announcements.
It was not redesigned in this pass; the next controlled slice is visual and
browser validation of those existing workflows.

## Browser and responsive caveat

The QA server was reachable and served the public application. The available
Chrome session was occupied by an extension settings tab during this pass, so a
fresh Student authenticated screenshot matrix at 375/768/1024/1440 was not
captured. The API and production gates pass; release remains conditional until
that visual matrix and DevTools console/network review are completed.

## Backups

Pre-refinement:

`D:\work\project\_Baloot_Backups\Baloot_PRE_STUDENT_REFINEMENT_2026-08-19_2026-08-18_17-23-16.zip`

The post-refinement archive and SHA-256 are recorded in the final handoff.

Post-refinement:

`D:\work\project\_Baloot_Backups\Baloot_FINAL_PHASE_2_STUDENT_2026-08-19_18-03-00.zip`

SHA-256:

`D5D6575A37FBC5A2444C669F7B5B289753057F7056B6B770E1843A15F474B277`
