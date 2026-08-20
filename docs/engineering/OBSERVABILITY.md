# Observability

Current signals:

- Structured route error prefixes such as `[AUTH_LOGIN]`, `[WORKSHOP_PURCHASE]`, and `[REGISTRATION_PENDING_PATCH]`.
- Admin audit records for registration review and other privileged mutations.
- Dashboard metrics for registrations, enrollments, payments, sessions, failed logins, and backups.
- Backup records include checksum and status metadata.

Operational follow-up: centralize request IDs and latency measurements for production deployment, and export logs to the hosting provider's durable logging system.

