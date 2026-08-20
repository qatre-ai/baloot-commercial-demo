# Persistent QA Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with verification checkpoints.

**Goal:** Provide a persistent, isolated QA database and validate the complete public registration, admin approval/rejection, student, instructor, admin, and super-admin workflows in a real browser.

**Architecture:** Keep the existing production/demo database at `db/custom.db`. Create `db/qa.db` as a separate SQLite database selected only through an explicit `DATABASE_URL` override. Seed QA records idempotently with stable `QA_PERSISTENT_2026` markers and never delete them during validation. Use the existing application routes and browser UI for workflow verification, then query the QA database for persistence and audit evidence.

**Tech Stack:** Next.js 16, Prisma 6, SQLite, TypeScript/tsx, PowerShell, Chrome.

## Global Constraints

- Do not reset, delete, or seed `db/custom.db`.
- QA credentials are local-only and must not be exposed in production documentation or builds.
- QA data remains in `db/qa.db` after testing.
- All file edits use `apply_patch`.
- Every claimed pass is backed by a command result, browser observation, or database query.
- Preserve existing UI styling; only fix workflow defects discovered by evidence.

---

### Task 1: Create isolated QA database tooling

**Files:**
- Create: `scripts/seed-qa-environment.ts`
- Create: `scripts/inspect-qa-environment.ts`
- Modify: `package.json`
- Create: `docs/testing/TEST_ACCOUNTS.md`
- Create: `docs/testing/QA_ENVIRONMENT.md`

**Interfaces:**
- `seed-qa-environment.ts` reads `DATABASE_URL` from the process environment, creates/upserts QA users and fixtures, and prints stable IDs/counts.
- `inspect-qa-environment.ts` reads the same environment and prints counts, status distributions, and marker checks.

- [ ] Add a separate Prisma client in each script and require `DATABASE_URL` to contain `qa.db`; refuse to run against `custom.db`.
- [ ] Upsert the five QA accounts with stable emails and a documented local-only password.
- [ ] Grant secretary permissions via `permissionsForRole("admin")` and super-admin permissions via `allPermissionPairs()`.
- [ ] Upsert QA branches, instructor/student users, five QA courses, three QA workshops, schedules, registrations, enrollments, workshop tickets, and all requested payment statuses.
- [ ] Use stable `classCode` values and marker fields so repeated seeding updates records instead of duplicating them.
- [ ] Add `qa:seed`, `qa:inspect`, and `qa:dev` scripts without changing the production `dev` command.
- [ ] Run the seed twice and verify the second run does not increase QA record counts.

### Task 2: Validate registration browser failure with evidence

**Files:**
- Create: `docs/evidence/README.md`
- Create: `scripts/_probe/browser-e2e-notes.md`

**Interfaces:**
- Browser evidence uses `http://localhost:3010` against `db/qa.db`.
- Screenshots are stored under `docs/evidence/`.

- [ ] Start the QA server and open the public registration flow in Chrome.
- [ ] Capture Step 1, Step 5, and final Step 6 states.
- [ ] Inspect button enabled state, validation messages, network response, browser console, server log, and database row.
- [ ] If the browser reproduces a defect, write one minimal regression test before changing production code.
- [ ] Retest the same browser path after the smallest root-cause fix.

### Task 3: Verify downstream admin workflows

**Files:**
- Create: `scripts/_probe/qa-browser-evidence.json`
- Modify: `docs/engineering/TEST_STRATEGY.md`

- [ ] Submit one unique public registration and record its request ID.
- [ ] Verify the pending record in the Admin UI and database.
- [ ] Approve it through the Admin UI and verify the created Student, status, and audit record.
- [ ] Reject a different pending record through the Admin UI with a reason and verify status, reason, audit record, and student-facing state.
- [ ] Log in as QA super-admin and verify pending registration visibility, monitoring, audit, permissions, and privileged data.

### Task 4: Inspect all role panels and responsive states

**Files:**
- Modify: `docs/evidence/README.md`
- Modify: `docs/engineering/KNOWN_ISSUES.md`
- Modify: `docs/engineering/AUDIT_COMPLETE.md`

- [ ] Inspect QA student dashboard, profile, courses, workshops, schedule, payments, registration, and logout.
- [ ] Inspect QA instructor dashboard, assigned courses/students/schedules, and available actions.
- [ ] Inspect QA secretary/admin dashboard, registrations, students, payments, schedules, and simple navigation.
- [ ] Inspect QA admin and super-admin dashboards, users/RBAC, monitoring, audit, backups, and settings.
- [ ] Check desktop sizes 1366×768, 1440×900, 1536×864, 1920×1080 plus mobile portrait/landscape and tablet.
- [ ] Save the required evidence screenshots and record console/network exceptions.

### Task 5: Run release validation and final backup

**Files:**
- Create: `docs/testing/QA_RELEASE_REPORT.md`

- [ ] Run wizard tests, RBAC tests, typecheck, targeted lint, build, and dev/production API flow tests.
- [ ] Run the QA inspection after browser workflows and confirm persistent counts remain.
- [ ] Do not claim full lint or production readiness while known product lint errors remain.
- [ ] Create a named post-change ZIP backup and verify it independently by extraction and SHA-256.
- [ ] Report every release gate as pass, fail, or not evidenced with exact commands and file paths.
