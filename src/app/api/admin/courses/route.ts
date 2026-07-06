import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";

// GET /api/admin/courses - List all courses for admin
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, "courses", "read");
  if (!auth.ok) return auth.response;

  try {
    const url = request.nextUrl.searchParams;
    const all = url.get("all") === "true";

    const courses = await db.course.findMany({
      where: all ? {} : { isPublished: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        titleFa: true,
        titleEn: true,
        descriptionFa: true,
        descriptionEn: true,
        category: true,
        instrument: true,
        level: true,
        classType: true,
        duration: true,
        sessionsMin: true,
        sessionsMax: true,
        price: true,
        imageUrl: true,
        coverUrl: true,
        isPublished: true,
        isFeatured: true,
        isShowOnHome: true,
        isNew: true,
        branchId: true,
        instructorId: true,
        registrationOpen: true,
        maxCapacity: true,
        createdAt: true,
        branch: {
          select: { id: true, nameFa: true, nameEn: true },
        },
        instructor: {
          select: { id: true, name: true, specialtyFa: true, specialtyEn: true, avatarUrl: true },
        },
        _count: { select: { enrollments: true } },
      },
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("[ADMIN_COURSES]", error);
    return NextResponse.json({ error: "Failed to list courses" }, { status: 500 });
  }
}

// POST /api/admin/courses - Create a new course
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, "courses", "create");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const {
      titleFa, titleEn, descriptionFa, descriptionEn,
      category, instrument, level, classType, duration, sessionsMin, sessionsMax,
      price, imageUrl, coverUrl, isFeatured, isShowOnHome, isPublished,
      branchId, instructorId, registrationOpen, registrationOpenAt, registrationCloseAt, maxCapacity,
    } = body;

    if (!titleFa || !titleEn) {
      return NextResponse.json(
        { error: "عنوان فارسی و انگلیسی الزامی است" },
        { status: 400 }
      );
    }

    // Verify instructor exists if provided
    if (instructorId) {
      const instructor = await db.student.findFirst({
        where: { id: instructorId, role: "instructor" },
      });
      if (!instructor) {
        return NextResponse.json({ error: "مدرس یافت نشد" }, { status: 404 });
      }
    }

    const course = await db.course.create({
      data: {
        titleFa,
        titleEn,
        descriptionFa: descriptionFa ?? null,
        descriptionEn: descriptionEn ?? null,
        category: category ?? null,
        instrument: instrument ?? null,
        level: level ?? "all",
        classType: classType ?? "group",
        duration: duration ?? null,
        sessionsMin: sessionsMin ? parseInt(String(sessionsMin)) : null,
        sessionsMax: sessionsMax ? parseInt(String(sessionsMax)) : null,
        price: price ? parseInt(String(price)) : null,
        imageUrl: imageUrl ?? null,
        coverUrl: coverUrl ?? null,
        isFeatured: isFeatured ?? false,
        isShowOnHome: isShowOnHome ?? false,
        isNew: true,
        isPublished: isPublished ?? false,
        branchId: branchId ?? null,
        instructorId: instructorId ?? null,
        registrationOpen: registrationOpen ?? true,
        registrationOpenAt: registrationOpenAt ? new Date(registrationOpenAt) : null,
        registrationCloseAt: registrationCloseAt ? new Date(registrationCloseAt) : null,
        maxCapacity: maxCapacity ? parseInt(String(maxCapacity)) : null,
      },
      include: {
        instructor: {
          select: { id: true, name: true, specialtyFa: true, specialtyEn: true },
        },
        branch: {
          select: { id: true, nameFa: true, nameEn: true },
        },
      },
    });

    await writeAuditLog({
      adminId: auth.admin.id,
      action: "create",
      entity: "course",
      entityId: course.id,
      entityName: course.titleFa,
      details: { title: course.titleFa },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "info",
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error("[COURSE_CREATE]", error);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}
