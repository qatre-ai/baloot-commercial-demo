# System Architecture

## Runtime

The platform is a Next.js App Router application with React client components, Next.js API route handlers, Prisma ORM, and SQLite for local development.

```text
Browser
  -> Next.js pages/components
  -> authFetch / session cookie
  -> API route handler
  -> requireAdmin / role checks
  -> Prisma transaction/query
  -> SQLite
```

`output: "standalone"` is used for production packaging. `scripts/postbuild-standalone.mjs` copies `.next/static` and `public` into the standalone bundle on Windows and Unix.

## Boundaries

- UI owns presentation and request state.
- API handlers own authentication, validation, authorization, transaction boundaries, and response shaping.
- Prisma owns database access and relational integrity.
- `src/lib/auth/permissions.ts` is the canonical RBAC vocabulary.

