import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";

// PUT /api/admin/settings/[id] - Update a setting
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, "settings", "update");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const body = await request.json();
    const { value } = body;

    if (value === undefined) {
      return NextResponse.json({ error: "Value is required" }, { status: 400 });
    }

    const setting = await db.siteSetting.update({
      where: { id },
      data: { value },
    });

    await writeAuditLog({
      adminId: auth.admin.id,
      action: "settings_change",
      entity: "setting",
      entityId: id,
      entityName: setting.key,
      details: { key: setting.key, value },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "warning",
    });

    return NextResponse.json({ setting });
  } catch (error) {
    console.error("[SETTINGS_UPDATE]", error);
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
  }
}

// DELETE /api/admin/settings/[id] - Delete a setting
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, "settings", "delete");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const setting = await db.siteSetting.delete({
      where: { id },
    });

    await writeAuditLog({
      adminId: auth.admin.id,
      action: "delete",
      entity: "setting",
      entityId: id,
      entityName: setting.key,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "warning",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SETTINGS_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete setting" }, { status: 500 });
  }
}
