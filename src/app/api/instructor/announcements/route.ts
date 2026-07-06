import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, writeAuditLog, getClientIp, getUserAgent } from "@/lib/auth/session";

const VALID_TYPES = ["info", "workshop", "course", "event", "urgent", "promo"];

// GET /api/instructor/announcements - Get published announcements visible to instructor
export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session || session.role !== "instructor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const url = request.nextUrl.searchParams;
    const type = url.get("type");
    const limit = Math.min(parseInt(url.get("limit") || "20"), 100);

    // Get courses taught by this instructor
    const courses = await db.course.findMany({
      where: { instructorId: session.userId },
      select: { id: true, titleFa: true, titleEn: true },
    });

    // Get published announcements (global announcements visible to all)
    const where: any = { isPublished: true };
    if (type) where.type = type;

    const announcements = await db.announcement.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { priority: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    return NextResponse.json({
      announcements,
      courses,
    });
  } catch (error) {
    console.error("[INSTRUCTOR_ANNOUNCEMENTS]", error);
    return NextResponse.json(
      { error: "Failed to load announcements" },
      { status: 500 }
    );
  }
}

// POST /api/instructor/announcements - Create a class announcement (DRAFT, requires admin approval)
// Instructors can submit announcement drafts for their classes; admins must publish them
// via /api/admin/announcements. This prevents instructors from spamming the entire student body.
export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session || session.role !== "instructor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // Verify caller is actually an instructor (defense-in-depth)
    const instructor = await db.student.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, role: true, isActive: true, instructorStatus: true },
    });
    if (!instructor || instructor.role !== "instructor" || !instructor.isActive) {
      return NextResponse.json({ error: "Instructor account not active" }, { status: 403 });
    }
    if (instructor.instructorStatus && instructor.instructorStatus !== "active") {
      return NextResponse.json(
        { error: `Instructor status is ${instructor.instructorStatus}; cannot post announcements` },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, type, scheduleDate } = body;

    if (!title || typeof title !== "string" || title.trim().length < 3) {
      return NextResponse.json(
        { error: "Title is required (min 3 chars)" },
        { status: 400 }
      );
    }
    if (!content || typeof content !== "string" || content.trim().length < 5) {
      return NextResponse.json(
        { error: "Content is required (min 5 chars)" },
        { status: 400 }
      );
    }

    const finalType = type && VALID_TYPES.includes(type) ? type : "info";

    // Create announcement as DRAFT — admin must publish via /api/admin/announcements/[id]
    // Title is prefixed with instructor name so admin can identify the source during review.
    const safeTitle = title.trim().slice(0, 200);
    const announcement = await db.announcement.create({
      data: {
        titleFa: `[درخواست استاد ${instructor.name}] ${safeTitle}`,
        titleEn: `[Instructor ${instructor.name}] ${safeTitle}`,
        contentFa: content.trim(),
        contentEn: content.trim(),
        type: finalType,
        // SECURITY: forced draft — admin must approve & publish
        isPublished: false,
        isFeatured: false,
        isShowOnHome: false,
        isPinned: false,
        priority: 0,
        startsAt: scheduleDate ? new Date(scheduleDate) : null,
        expiresAt: scheduleDate
          ? new Date(new Date(scheduleDate).getTime() + 7 * 24 * 60 * 60 * 1000)
          : null,
      },
    });

    // Notify all active admins that a draft announcement is awaiting review
    const admins = await db.admin.findMany({
      where: { isActive: true },
      select: { id: true },
    });
    if (admins.length > 0) {
      await db.adminMessage.createMany({
        data: admins.map((admin) => ({
          senderId: admin.id,
          recipientId: admin.id,
          subject: `درخواست اعلان جدید از استاد ${instructor.name}`,
          content: `استاد ${instructor.name} یک اعلان جدید با عنوان «${safeTitle}» ثبت کرده است که نیاز به تأیید و انتشار توسط مدیریت دارد.\n\nمحتوا:\n${content.trim().slice(0, 500)}`,
          priority: "normal",
          isSystemMessage: true,
        })),
      });
    }

    await writeAuditLog({
      adminId: null,
      action: "instructor_announcement_draft",
      entity: "announcement",
      entityId: announcement.id,
      entityName: safeTitle,
      details: { instructorId: instructor.id, instructorName: instructor.name, type: finalType },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "info",
    });

    return NextResponse.json(
      {
        announcement,
        message: "اعلان شما به‌عنوان پیش‌نویس ثبت شد و پس از تأیید مدیریت منتشر خواهد شد.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[INSTRUCTOR_ANNOUNCEMENT_CREATE]", error);
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 }
    );
  }
}
