// ============================================
// Canonical RBAC permission catalog
// ============================================
// SINGLE SOURCE OF TRUTH for authorization.
//
// Previously the permission vocabulary was duplicated in three places that had
// drifted apart (API routes, prisma/seed.ts, prisma/seed-admin.ts), which left
// the `admin` (secretary) role with ZERO granted permissions and produced
// "Forbidden: insufficient permission" on every RBAC-guarded endpoint.
//
// Rules:
//  - Every requireAdmin(resource, action) pair MUST exist in PERMISSION_MATRIX.
//  - Seeds MUST derive grants from ROLE_PERMISSIONS below, never hardcode lists.
//  - super_admin bypasses RBAC in requireAdmin(), but is still granted the full
//    matrix in the database so the permission UI renders a truthful state.

export const RESOURCES = [
  "users",
  "students",
  "instructors",
  "admins",
  "courses",
  "enrollments",
  "workshops",
  "payments",
  "schedules",
  "makeup_class",
  "blog",
  "announcements",
  "testimonials",
  "messages",
  "contact_messages",
  "newsletter",
  "media",
  "branches",
  "analytics",
  "settings",
  "backups",
  "security",
  "audit_logs",
  "sessions",
  "exercises",
] as const;

export const ACTIONS = [
  "create",
  "read",
  "update",
  "delete",
  "approve",
  "publish",
  "manage",
  "feature",
  "export",
  "assign",
] as const;

export type Resource = (typeof RESOURCES)[number];
export type Action = (typeof ACTIONS)[number];

/**
 * The set of actions that are meaningful for each resource.
 * Generating grants from this avoids seeding nonsensical pairs
 * (e.g. "newsletter:feature") while guaranteeing full coverage of the
 * pairs that API routes actually enforce.
 */
export const PERMISSION_MATRIX: Record<Resource, readonly Action[]> = {
  users: ["create", "read", "update", "delete", "approve", "export"],
  students: ["create", "read", "update", "delete", "export"],
  instructors: ["create", "read", "update", "delete", "assign"],
  admins: ["create", "read", "update", "delete", "manage"],
  courses: ["create", "read", "update", "delete", "publish"],
  enrollments: ["create", "read", "update", "delete", "approve", "export"],
  workshops: ["create", "read", "update", "delete", "publish", "feature"],
  payments: ["create", "read", "update", "delete", "approve", "export"],
  schedules: ["create", "read", "update", "delete", "approve"],
  makeup_class: ["create", "read", "update", "delete", "approve"],
  blog: ["create", "read", "update", "delete", "publish", "feature"],
  announcements: ["create", "read", "update", "delete", "publish"],
  testimonials: ["create", "read", "update", "delete", "approve", "feature"],
  messages: ["create", "read", "update", "delete"],
  contact_messages: ["create", "read", "update", "delete"],
  newsletter: ["read", "export", "delete"],
  media: ["create", "read", "update", "delete"],
  branches: ["create", "read", "update", "delete"],
  analytics: ["read", "export"],
  settings: ["create", "read", "update", "delete"],
  backups: ["create", "read", "update", "delete", "manage"],
  security: ["read", "manage"],
  audit_logs: ["read", "export"],
  sessions: ["read", "manage"],
  exercises: ["create", "read", "update", "delete"],
};

export type PermissionPair = { resource: Resource; action: Action };

/** Flatten the matrix into every valid resource:action pair. */
export function allPermissionPairs(): PermissionPair[] {
  const out: PermissionPair[] = [];
  for (const resource of RESOURCES) {
    for (const action of PERMISSION_MATRIX[resource]) {
      out.push({ resource, action });
    }
  }
  return out;
}

/**
 * Resources a secretary-level `admin` must operate day to day.
 * Deliberately EXCLUDES: admins, backups, security, audit_logs, sessions,
 * settings — those remain super_admin-only territory.
 */
const SECRETARY_RESOURCES: readonly Resource[] = [
  "users",
  "students",
  "instructors",
  "courses",
  "enrollments",
  "workshops",
  "payments",
  "schedules",
  "makeup_class",
  "blog",
  "announcements",
  "testimonials",
  "messages",
  "contact_messages",
  "newsletter",
  "media",
  "branches",
  "analytics",
  "exercises",
];

/** Actions a secretary may never perform, even on allowed resources. */
const SECRETARY_DENIED_ACTIONS: readonly Action[] = ["manage"];

/** Resources where a secretary may read/update but never destroy records. */
const SECRETARY_NO_DELETE: readonly Resource[] = [
  "users",
  "students",
  "instructors",
  "payments",
  "enrollments",
  "branches",
];

export function permissionsForRole(role: string): PermissionPair[] {
  if (role === "super_admin") return allPermissionPairs();

  if (role === "admin") {
    return allPermissionPairs().filter(({ resource, action }) => {
      if (!SECRETARY_RESOURCES.includes(resource)) return false;
      if (SECRETARY_DENIED_ACTIONS.includes(action)) return false;
      if (action === "delete" && SECRETARY_NO_DELETE.includes(resource)) return false;
      return true;
    });
  }

  return [];
}

export function isValidResource(value: string): value is Resource {
  return (RESOURCES as readonly string[]).includes(value);
}

export function isValidAction(value: string): value is Action {
  return (ACTIONS as readonly string[]).includes(value);
}
