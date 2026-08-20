# Persistent QA Environment

The QA environment is isolated from the local demo/production-like database:

- Production/demo local database: `db/custom.db`
- Persistent QA database: `db/qa.db`
- QA server: `npm run qa:dev`
- QA URL: `http://localhost:3010`
- Seed fixtures: `npm run qa:seed`
- Inspect fixtures: `npm run qa:inspect`

The seed is idempotent and uses the marker `QA_PERSISTENT_2026`. It creates:

- Five local QA accounts documented in `docs/testing/TEST_ACCOUNTS.md`
- Four courses, including a full-capacity course
- Three workshops, including a full and a closed workshop
- Pending, approved, and rejected registration records
- Active, completed, and paused course enrollments
- Pending, paid, failed, refunded, and partial-payment fixtures
- Recurring class schedules tied to the QA instructor
- Paid and cancelled workshop tickets
- Audit evidence for the seed operation

QA data is intentionally persistent. Do not run a reset or cleanup command against `db/qa.db`; rerunning the seed updates the fixed fixtures without deleting them.
