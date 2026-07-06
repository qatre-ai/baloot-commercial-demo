import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  requireSuperAdmin,
  requireAnyAdmin,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";

// GET /api/admin/audit-logs - List audit logs with filters (super_admin only)
export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const url = request.nextUrl.searchParams;
    const action = url.get("action");
    const entity = url.get("entity");
    const entityId = url.get("entityId");
    const severity = url.get("severity");
    const adminId = url.get("adminId");
    const dateFrom = url.get("dateFrom");
    const dateTo = url.get("dateTo");
    const search = url.get("search");
    const limit = Math.min(parseInt(url.get("limit") || "100"), 500);
    const offset = parseInt(url.get("offset") || "0");

    const where: Record<string, unknown> = {};
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (entityId) where.entityId = entityId;
    if (severity) where.severity = severity;
    if (adminId) where.adminId = adminId;

    if (dateFrom || dateTo) {
      where.createdAt = {} as any;
      if (dateFrom) (where.createdAt as any).gte = new Date(dateFrom);
      if (dateTo) (where.createdAt as any).lte = new Date(dateTo);
    }

    if (search) {
      where.OR = [
        { action: { contains: search } },
        { entity: { contains: search } },
        { entityName: { contains: search } },
        { details: { contains: search } },
      ];
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        include: {
          admin: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
      db.auditLog.count({ where }),
    ]);

    return NextResponse.json({ logs, total, limit, offset });
  } catch (error) {
    console.error("[AUDIT_LOGS]", error);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}

// POST /api/admin/audit-logs - Write a new audit log entry (any authenticated admin)
// Used by client-side panels for user-action audit trails (e.g., PERMISSION_CHANGE, RESET_PASSWORD).
export async function POST(request: NextRequest) {
  const auth = await requireAnyAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const { action, entity, entityId, entityName, severity, details } = body;

    if (!action || !entity) {
      return NextResponse.json(
        { error: "action and entity are required" },
        { status: 400 }
      );
    }

    await writeAuditLog({
      adminId: auth.admin.id,
      action: String(action),
      entity: String(entity),
      entityId: entityId ? String(entityId) : undefined,
      entityName: entityName ? String(entityName) : undefined,
      severity: ["info", "warning", "critical"].includes(severity)
        ? severity
        : "info",
      details,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("[AUDIT_LOGS_POST]", error);
    return NextResponse.json({ error: "Failed to write audit log" }, { status: 500 });
  }
}
