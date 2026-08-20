# Known Issues

- `npm run lint` completes but currently fails with 64 product-code React hook/static-component errors. Bundled `.agents`, probe, and skill scripts are excluded from the lint scope; typecheck and production build are separate gates and pass.
- Next.js reports a deprecation warning for the `middleware` filename convention; migration to `proxy` should be scheduled.
- Next build reports dynamic filesystem tracing warnings for the backup subsystem. Backup paths are intentionally runtime-configurable, but the deployment bundle impact should be measured.
- The legacy `prisma/seed-student-learning.ts` script targets an older exercise-submission model and is excluded from the application typecheck until it is migrated fully.
- Password hashing remains legacy SHA-256/static-salt compatible and should be migrated with a controlled account upgrade flow before production.
- Full automated browser viewport coverage is not yet committed; the registration modal has manual local evidence at 1280×720 and responsive CSS now uses dynamic viewport-safe sizing.
- The wizard has deterministic unit/API coverage for the instrument invariant, Step 5 transition, and progress clamp, but a committed browser E2E suite for every visible wizard step is still a release follow-up.
