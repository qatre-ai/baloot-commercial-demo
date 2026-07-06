import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin,
  requireSuperAdmin,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";

// GET /api/admin/intrusion-alerts - List intrusion alerts
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, "security", "read");
  if (!auth.ok) return auth.response;

  try {
    const url = request.nextUrl.searchParams;
    const resolved = url.get("resolved"); // true | false | all
    const limit = Math.min(parseInt(url.get("limit") || "50"), 200);
    const offset = parseInt(url.get("offset") || "0");

    const where: Record<string, unknown> = {};
    if (resolved === "false") where.isResolved = false;
    else if (resolved === "true") where.isResolved = true;

    const [alerts, total, unresolvedCount] = await Promise.all([
      db.intrusionAlert.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        include: {
          targetAdmin: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
      db.intrusionAlert.count({ where }),
      db.intrusionAlert.count({ where: { isResolved: false } }),
    ]);

    return NextResponse.json({ alerts, total, unresolvedCount });
  } catch (error) {
    console.error("[INTRUSION_ALERTS_LIST]", error);
    return NextResponse.json({ error: "Failed to list intrusion alerts" }, { status: 500 });
  }
}

// PUT /api/admin/intrusion-alerts - Resolve an alert
export async function PUT(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { id, isResolved } = body;

    if (!id) {
      return NextResponse.json({ error: "Alert ID required" }, { status: 400 });
    }

    const alert = await db.intrusionAlert.update({
      where: { id },
      data: {
        isResolved: isResolved ?? true,
        resolvedBy: auth.admin.id,
        resolvedAt: new Date(),
      },
    });

    // Audit log
    await writeAuditLog({
      adminId: auth.admin.id,
      action: isResolved ? "resolve_alert" : "reopen_alert",
      entity: "intrusion_alert",
      entityId: id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "warning",
    });

    return NextResponse.json({ alert });
  } catch (error) {
    console.error("[INTRUSION_ALERT_UPDATE]", error);
    return NextResponse.json({ error: "Failed to update alert" }, { status: 500 });
  }
}
