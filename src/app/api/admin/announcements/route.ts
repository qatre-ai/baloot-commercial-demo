import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";

// GET /api/admin/announcements - List all announcements for admin (including unpublished)
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, "announcements", "read");
  if (!auth.ok) return auth.response;

  try {
    const url = request.nextUrl.searchParams;
    const all = url.get("all") === "true";

    const announcements = await db.announcement.findMany({
      where: all ? {} : { isPublished: true },
      orderBy: [{ isPinned: "desc" }, { priority: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("[ADMIN_ANNOUNCEMENTS]", error);
    return NextResponse.json({ error: "Failed to list announcements" }, { status: 500 });
  }
}

// POST /api/admin/announcements - Create a new announcement
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, "announcements", "create");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const {
      titleFa, titleEn, contentFa, contentEn,
      type, priority, imageUrl, coverUrl,
      isPublished, isFeatured, isShowOnHome, isPinned,
      startsAt, expiresAt,
    } = body;

    if (!titleFa || !titleEn) {
      return NextResponse.json(
        { error: "titleFa and titleEn are required" },
        { status: 400 }
      );
    }

    const announcement = await db.announcement.create({
      data: {
        titleFa,
        titleEn,
        contentFa: contentFa ?? null,
        contentEn: contentEn ?? null,
        type: type ?? "info",
        priority: priority ?? 0,
        imageUrl: imageUrl ?? null,
        coverUrl: coverUrl ?? null,
        isPublished: isPublished ?? false,
        isFeatured: isFeatured ?? false,
        isShowOnHome: isShowOnHome ?? false,
        isNew: true,
        isPinned: isPinned ?? false,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    await writeAuditLog({
      adminId: auth.admin.id,
      action: "create",
      entity: "announcement",
      entityId: announcement.id,
      entityName: announcement.titleFa,
      details: { title: announcement.titleFa },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "info",
    });

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error("[ANNOUNCEMENT_CREATE]", error);
    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
  }
}
