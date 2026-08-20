# Security Model

- Password verification is server-side.
- Sessions are checked server-side on every protected API request.
- Admin authorization is independent of frontend button visibility.
- Registration and enrollment duplicate constraints are enforced at database level.
- Audit logs record sensitive admin mutations.
- Internal backup triggers require a dedicated token.
- `.env` is ignored; `.env.example` documents required variables without production secrets.

Known hardening item: password hashing currently uses the legacy project-compatible SHA-256 scheme with a static salt. Migrating existing accounts to a memory-hard password hash requires a deliberate compatibility/migration plan.

