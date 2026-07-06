import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin,
  requireSuperAdmin,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/admin/announcements/[id] - Get a single announcement with full detail
export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request, "announcements", "read");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const announcement = await db.announcement.findUnique({ where: { id } });

    if (!announcement) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    return NextResponse.json({ announcement });
  } catch (error) {
    console.error("[ANNOUNCEMENT_GET]", error);
    return NextResponse.json({ error: "Failed to fetch announcement" }, { status: 500 });
  }
}

// PUT /api/admin/announcements/[id] - Update an announcement
export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request, "announcements", "update");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const body = await request.json();
    const existing = await db.announcement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    const allowedFields = [
      "titleFa", "titleEn", "contentFa", "contentEn",
      "type", "priority", "imageUrl", "coverUrl",
      "isPublished", "isFeatured", "isShowOnHome", "isNew", "isPinned",
      "startsAt", "expiresAt",
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field] === "" ? null : body[field];
      }
    }

    if (updateData.startsAt) updateData.startsAt = new Date(updateData.startsAt as string);
    if (updateData.expiresAt) updateData.expiresAt = new Date(updateData.expiresAt as string);
    if (updateData.priority !== undefined && updateData.priority !== null) {
      updateData.priority = parseInt(String(updateData.priority)) || 0;
    }

    const announcement = await db.announcement.update({
      where: { id },
      data: updateData,
    });

    await writeAuditLog({
      adminId: auth.admin.id,
      action: "update",
      entity: "announcement",
      entityId: id,
      entityName: announcement.titleFa,
      details: { changes: Object.keys(updateData) },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "info",
    });

    return NextResponse.json({ announcement });
  } catch (error) {
    console.error("[ANNOUNCEMENT_UPDATE]", error);
    return NextResponse.json({ error: "Failed to update announcement" }, { status: 500 });
  }
}

// DELETE /api/admin/announcements/[id] - Delete an announcement
export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const announcement = await db.announcement.delete({
      where: { id },
      select: { id: true, titleFa: true },
    });

    await writeAuditLog({
      adminId: auth.admin.id,
      action: "delete",
      entity: "announcement",
      entityId: id,
      entityName: announcement.titleFa,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "warning",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ANNOUNCEMENT_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete announcement" }, { status: 500 });
  }
}
