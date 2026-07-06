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

// GET /api/admin/courses/[id] - Get single course with details
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const auth = await requireAdmin(request, "courses", "read");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const course = await db.course.findUnique({
      where: { id },
      include: {
        branch: {
          select: { id: true, nameFa: true, nameEn: true, addressFa: true, addressEn: true },
        },
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            specialtyFa: true,
            specialtyEn: true,
            avatarUrl: true,
          },
        },
        enrollments: {
          select: {
            id: true,
            status: true,
            progress: true,
            enrolledAt: true,
            student: {
              select: { id: true, name: true, email: true, phone: true, avatarUrl: true, primaryInstrument: true },
            },
          },
          orderBy: { enrolledAt: "desc" },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Compute enrollment stats
    const activeEnrollments = course.enrollments.filter((e) => e.status === "active").length;
    const completedEnrollments = course.enrollments.filter((e) => e.status === "completed").length;
    const droppedEnrollments = course.enrollments.filter((e) => e.status === "dropped").length;

    return NextResponse.json({
      course,
      enrollmentStats: {
        active: activeEnrollments,
        completed: completedEnrollments,
        dropped: droppedEnrollments,
        total: course.enrollments.length,
      },
    });
  } catch (error) {
    console.error("[COURSE_GET]", error);
    return NextResponse.json({ error: "Failed to get course" }, { status: 500 });
  }
}

// PUT /api/admin/courses/[id] - Update course
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  const auth = await requireAdmin(request, "courses", "update");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const existing = await db.course.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const body = await request.json();
    const allowedFields = [
      "titleFa", "titleEn", "descriptionFa", "descriptionEn",
      "category", "instrument", "level", "classType", "duration", "sessionsMin", "sessionsMax",
      "price", "imageUrl", "coverUrl", "isFeatured", "isShowOnHome", "isNew",
      "isPublished", "branchId", "instructorId",
      "registrationOpen", "registrationOpenAt", "registrationCloseAt", "maxCapacity",
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field] === "" ? null : body[field];
      }
    }

    // Handle numeric fields
    for (const numField of ["sessionsMin", "sessionsMax", "price", "maxCapacity"]) {
      if (updateData[numField] !== undefined && updateData[numField] !== null) {
        const parsed = parseInt(String(updateData[numField]));
        updateData[numField] = isNaN(parsed) ? null : parsed;
      }
    }

    // Handle date fields
    if (updateData.registrationOpenAt) updateData.registrationOpenAt = new Date(updateData.registrationOpenAt as string);
    if (updateData.registrationCloseAt) updateData.registrationCloseAt = new Date(updateData.registrationCloseAt as string);

    // Verify instructor exists if changing
    if (body.instructorId) {
      const instructor = await db.student.findFirst({
        where: { id: body.instructorId, role: "instructor" },
      });
      if (!instructor) {
        return NextResponse.json({ error: "مدرس یافت نشد" }, { status: 404 });
      }
    }

    const course = await db.course.update({
      where: { id },
      data: updateData,
      include: {
        instructor: {
          select: { id: true, name: true, specialtyFa: true, specialtyEn: true },
        },
        branch: {
          select: { id: true, nameFa: true, nameEn: true },
        },
      },
    });

    // Audit log
    await writeAuditLog({
      adminId: auth.admin.id,
      action: "update",
      entity: "course",
      entityId: id,
      entityName: existing.titleFa,
      details: { changes: Object.keys(updateData) },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "info",
    });

    return NextResponse.json({ course });
  } catch (error) {
    console.error("[COURSE_UPDATE]", error);
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}

// DELETE /api/admin/courses/[id] - Delete course
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const existing = await db.course.findUnique({
      where: { id },
      include: { _count: { select: { enrollments: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check for active enrollments
    const activeEnrollments = await db.courseEnrollment.count({
      where: { courseId: id, status: "active" },
    });

    if (activeEnrollments > 0) {
      return NextResponse.json(
        { error: "Cannot delete course with active enrollments. Drop or complete students first.", activeEnrollments },
        { status: 409 }
      );
    }

    await db.course.delete({ where: { id } });

    // Audit log
    await writeAuditLog({
      adminId: auth.admin.id,
      action: "delete",
      entity: "course",
      entityId: id,
      entityName: existing.titleFa,
      details: { titleEn: existing.titleEn, totalEnrollments: existing._count.enrollments },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "critical",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[COURSE_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}
