# Test Strategy

## Automated checks

- TypeScript: `npm run typecheck`
- Production packaging: `npm run build`
- RBAC coverage: `npx tsx scripts/verify-rbac-coverage.mjs`
- Registration wizard rules: `npm run test:wizard`
- Live role/flow probe: `node scripts/_probe/flow-test.mjs`
- Platform regression suite: `node scripts/test-platform-flows.mjs`

## Required negative cases

- Anonymous admin access
- Student access to admin routes
- Secretary access to super-admin backup operations
- Duplicate course enrollment
- Duplicate workshop reservation
- Registration approval without permission

The live flow probe must be run against a local server and its test records removed using exact IDs after the run.

## Current evidence

- `npm run test:wizard`: passed, including Step 5 -> Step 6, progress clamping, instrument fallback, and duplicate removal.
- `npm run test:platform`: 23/23 passed.
- `npm run test:flows`: 15/15 passed.
- Both probes use reserved test IPs to avoid contaminating rate-limit state and clean exact test IDs in `finally`.
- Platform and live flow probes pass against both the development server and the standalone production server.
- The live flow probe verifies the instrument invariant after approval directly in the `Student` database row.
- Browser verification covered the public registration modal at the local desktop viewport; a browser automation dependency is not currently committed, so a full CI viewport matrix remains a follow-up.
