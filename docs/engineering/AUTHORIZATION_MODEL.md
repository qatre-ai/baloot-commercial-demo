# Authorization Model

Authentication uses a short-lived parsed session token transported by an HTTP-only cookie and, where browser embedding prevents cookie persistence, the `X-Session-Token` header.

Authorization is enforced server-side:

- `requireAdmin(request, resource, action)` authenticates an active admin and checks RBAC.
- `requireSuperAdmin(request)` restricts sensitive operations.
- `super_admin` has full access.
- `admin` receives the secretary matrix from `permissionsForRole("admin")`.

The canonical catalog is `src/lib/auth/permissions.ts`. Seeds and the permissions API derive their allowed values from this catalog.

