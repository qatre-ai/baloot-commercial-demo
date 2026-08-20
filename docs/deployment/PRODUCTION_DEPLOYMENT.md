# Production Deployment Guide

## Local Windows QA

```powershell
cd D:\work\project\Baloot
npm ci
$env:DATABASE_URL = "file:./db/qa.db"
npm run qa:verify
npm run qa:dev
```

Open `http://localhost:3010`. The QA database and persistent QA accounts are documented in `docs/testing/TEST_ACCOUNTS.md`.

## Production prerequisites

- Use a separate production database; never point production at `db/qa.db`.
- Set a strong production session secret and gateway credentials in the deployment environment.
- Configure `DATABASE_URL`, `BACKUP_DB_PATH`, and `BACKUP_DIR` for writable, protected locations.
- Do not ship QA credentials or QA fixture data to production.

## Build and start

```powershell
npm ci
npm run db:generate
npm run db:migrate:deploy
npm run build
$env:PORT = "3000"
npm run start
```

The standalone server is generated under `.next/standalone`. Keep `.next/standalone/public` and `.next/standalone/.next/static` alongside the server bundle.

## Migration safety procedure

1. Create and verify a database backup before migration:

```powershell
npm run backup:db
Get-FileHash .\backups\production\*.db -Algorithm SHA256
```

2. Apply only committed migrations:

```powershell
npm run db:migrate:deploy
```

3. Verify the migration table and application health:

```powershell
npm exec prisma migrate status
Invoke-WebRequest http://localhost:3000/api/health
```

Never use `prisma db push` against production. It is reserved for isolated development or disposable QA databases.

If a migration fails, stop the application, preserve the migration error and database backup, and do not mark the release successful. Restore the verified pre-migration database backup in an isolated location first; after verification, restore production through the database operator's approved procedure. Prisma migrations are forward-only and must not be edited after they have been applied.

## Release checklist

- Run `npm run typecheck` and the focused contract/RBAC tests.
- Run browser smoke tests for public, student, instructor, secretary, and super-admin roles.
- Verify registration approval/rejection and course/workshop capacity behavior.
- Verify backup creation, checksum, and restore in an isolated copy.
- Configure HTTPS, secure cookies, log retention, database backups, and monitoring before production traffic.
