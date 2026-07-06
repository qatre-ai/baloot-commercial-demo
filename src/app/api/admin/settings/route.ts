import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";

// GET /api/admin/settings - List all settings
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, "settings", "read");
  if (!auth.ok) return auth.response;

  try {
    const settings = await db.siteSetting.findMany({
      orderBy: { key: "asc" },
    });
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("[SETTINGS_LIST]", error);
    return NextResponse.json({ error: "Failed to list settings" }, { status: 500 });
  }
}

// POST /api/admin/settings - Create a new setting
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, "settings", "create");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Key and value are required" }, { status: 400 });
    }

    const setting = await db.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    // Audit log
    await writeAuditLog({
      adminId: auth.admin.id,
      action: "settings_change",
      entity: "setting",
      entityId: setting.id,
      entityName: key,
      details: { key, value },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "warning",
    });

    return NextResponse.json({ setting }, { status: 201 });
  } catch (error) {
    console.error("[SETTINGS_CREATE]", error);
    return NextResponse.json({ error: "Failed to create setting" }, { status: 500 });
  }
}
