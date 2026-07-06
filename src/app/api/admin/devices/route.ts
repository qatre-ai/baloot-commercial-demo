import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin,
  requireSuperAdmin,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";

// GET /api/admin/devices - List devices for admin(s)
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, "security", "read");
  if (!auth.ok) return auth.response;
  const session = auth.session;

  try {
    const url = request.nextUrl.searchParams;
    const adminId = url.get("adminId"); // Filter by specific admin

    // Only super_admins can see other admins' devices
    const where: Record<string, unknown> = {};
    if (adminId && auth.admin.role === "super_admin") {
      where.adminId = adminId;
    } else {
      where.adminId = auth.admin.id;
    }

    const devices = await db.adminDevice.findMany({
      where,
      orderBy: { lastUsedAt: "desc" },
      include: {
        admin: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return NextResponse.json({ devices });
  } catch (error) {
    console.error("[DEVICES_LIST]", error);
    return NextResponse.json({ error: "Failed to list devices" }, { status: 500 });
  }
}

// PUT /api/admin/devices - Approve/reject device
export async function PUT(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { id, isApproved } = body;

    if (!id) {
      return NextResponse.json({ error: "Device ID required" }, { status: 400 });
    }

    const device = await db.adminDevice.update({
      where: { id },
      data: {
        isApproved: isApproved ?? true,
        approvedBy: auth.admin.id,
        approvedAt: new Date(),
      },
    });

    // Audit log
    await writeAuditLog({
      adminId: auth.admin.id,
      action: isApproved ? "approve_device" : "reject_device",
      entity: "admin_device",
      entityId: id,
      entityName: device.deviceName,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "warning",
    });

    return NextResponse.json({ device });
  } catch (error) {
    console.error("[DEVICE_UPDATE]", error);
    return NextResponse.json({ error: "Failed to update device" }, { status: 500 });
  }
}

// DELETE /api/admin/devices - Remove a device
export async function DELETE(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Device ID required" }, { status: 400 });
    }

    await db.adminDevice.delete({ where: { id } });

    // Audit log
    await writeAuditLog({
      adminId: auth.admin.id,
      action: "delete_device",
      entity: "admin_device",
      entityId: id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "warning",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DEVICE_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete device" }, { status: 500 });
  }
}
