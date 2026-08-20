# Local QA Accounts

These accounts exist only in the isolated `db/qa.db` database. They are not production credentials and must never be copied to a deployed environment.

| Account | Email | Password | Role | Permissions | Purpose |
|---|---|---|---|---|---|
| TEST_STUDENT | `qa.student@mab.local` | `QA_Baloot_2026!` | Student | Own profile, classes, workshops, schedule, exercises, payments, announcements | Student self-service and enrollment certification |
| TEST_INSTRUCTOR | `qa.instructor@mab.local` | `QA_Baloot_2026!` | Instructor | Own teaching dashboard, classes, schedules, exercises, submissions, requests, announcement drafts | Instructor workspace and student-management certification |
| TEST_SECRETARY | `qa.secretary@mab.local` | `QA_Baloot_2026!` | Admin | Standard admin role permissions defined by `permissionsForRole("admin")` | Daily secretary workflows with a deliberately non-super-admin account |
| TEST_ADMIN | `qa.admin@mab.local` | `QA_Baloot_2026!` | Admin | Standard admin role permissions defined by `permissionsForRole("admin")` | General administration and cross-checking secretary behavior |
| TEST_SUPER_ADMIN | `qa.superadmin@mab.local` | `QA_Baloot_2026!` | Super Admin | Every resource/action pair returned by `allPermissionPairs()` | Full monitoring, security, audit, backup, and system certification |

Run `npm run qa:seed` before using these accounts. The command refuses to run unless `DATABASE_URL` points to `qa.db`.

The additional `qa.capacity@mab.local` record is a relational capacity fixture, not an acceptance-test login account. Do not delete any `@mab.local` fixture from the QA database.
