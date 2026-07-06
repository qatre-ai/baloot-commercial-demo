import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  requireSuperAdmin,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";

const ALLOWED_RESOURCES = [
  "users", "courses", "workshops", "blog", "announcements",
  "instructors", "branches", "media", "backups", "settings",
  "messages", "analytics", "enrollments", "payments", "testimonials",
  "schedules", "contact_messages", "newsletter", "security", "audit_logs",
  "makeup_class", "admins",
];

const ALLOWED_ACTIONS = [
  "create", "read", "update", "delete", "publish", "manage", "feature",
  "approve", "export", "assign",
];

// GET /api/admin/permissions?adminId=xxx - Get permissions for an admin
export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const adminId = request.nextUrl.searchParams.get("adminId");
    if (!adminId) {
      return NextResponse.json({ error: "adminId required" }, { status: 400 });
    }

    const permissions = await db.adminPermission.findMany({
      where: { adminId },
      orderBy: [{ resource: "asc" }, { action: "asc" }],
    });

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error("[PERMISSIONS_GET]", error);
    return NextResponse.json({ error: "Failed to get permissions" }, { status: 500 });
  }
}

// POST /api/admin/permissions - Set permissions for an admin
// Body: { adminId, permissions: [{resource, action, granted?}] }
// granted defaults to true. Setting granted:false explicitly revokes a permission
// (record kept so admin can see the rejection in the UI).
export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { adminId, permissions } = body;

    if (!adminId || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: "adminId and permissions array required" },
        { status: 400 }
      );
    }

    // Cannot modify own permissions (prevent self-lockout)
    if (adminId === auth.admin.id) {
      return NextResponse.json(
        { error: "Cannot modify your own permissions" },
        { status: 400 }
      );
    }

    // Validate target admin exists and is not a super_admin (super_admin always has full access)
    const targetAdmin = await db.admin.findUnique({ where: { id: adminId } });
    if (!targetAdmin) {
      return NextResponse.json({ error: "Target admin not found" }, { status: 404 });
    }
    if (targetAdmin.role === "super_admin") {
      return NextResponse.json(
        { error: "Cannot modify super_admin permissions (always full access)" },
        { status: 400 }
      );
    }

    // Validate resource and action values + granted field
    for (const p of permissions) {
      if (!p.resource || !ALLOWED_RESOURCES.includes(p.resource)) {
        return NextResponse.json(
          { error: `Invalid resource: "${p.resource}". Allowed: ${ALLOWED_RESOURCES.join(", ")}` },
          { status: 400 }
        );
      }
      if (!p.action || !ALLOWED_ACTIONS.includes(p.action)) {
        return NextResponse.json(
          { error: `Invalid action: "${p.action}". Allowed: ${ALLOWED_ACTIONS.join(", ")}` },
          { status: 400 }
        );
      }
      if (p.granted !== undefined && typeof p.granted !== "boolean") {
        return NextResponse.json(
          { error: "granted must be a boolean if provided" },
          { status: 400 }
        );
      }
    }

    // Snapshot old permissions for audit diff
    const oldPerms = await db.adminPermission.findMany({
      where: { adminId },
      select: { resource: true, action: true, granted: true },
    });

    // Wrap DELETE + CREATE in a transaction for atomicity
    await db.$transaction(async (tx) => {
      // Delete existing permissions (we re-create the full set)
      await tx.adminPermission.deleteMany({ where: { adminId } });

      // Create new permissions
      if (permissions.length > 0) {
        // SQLite doesn't support skipDuplicates in createMany — use individual creates instead
        for (const p of permissions) {
          await tx.adminPermission.create({
            data: {
              adminId,
              resource: p.resource,
              action: p.action,
              granted: p.granted !== undefined ? p.granted : true,
              grantedBy: auth.admin.id,
            },
          }).catch(() => {}); // ignore duplicates
        }
      }
    });

    await writeAuditLog({
      adminId: auth.admin.id,
      action: "permission_change",
      entity: "admin",
      entityId: adminId,
      entityName: targetAdmin.email,
      details: {
        permissionsCount: permissions.length,
        grantedCount: permissions.filter((p: any) => p.granted !== false).length,
        revokedCount: permissions.filter((p: any) => p.granted === false).length,
        previousCount: oldPerms.length,
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "critical",
    });

    const updated = await db.adminPermission.findMany({
      where: { adminId },
      orderBy: [{ resource: "asc" }, { action: "asc" }],
    });

    return NextResponse.json({ permissions: updated });
  } catch (error) {
    console.error("[PERMISSIONS_UPDATE]", error);
    return NextResponse.json({ error: "Failed to update permissions" }, { status: 500 });
  }
}
