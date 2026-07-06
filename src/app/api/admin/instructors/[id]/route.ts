import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin,
  requireSuperAdmin,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/admin/instructors/[id] - Get single instructor with full details
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const auth = await requireAdmin(request, "instructors", "read");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const instructor = await db.student.findFirst({
      where: { id, role: "instructor" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        lastLogin: true,
        specialtyFa: true,
        specialtyEn: true,
        bioFa: true,
        bioEn: true,
        experience: true,
        socialLinks: true,
        isPublishedInstructor: true,
        instructorOrder: true,
        primaryInstrument: true,
        createdAt: true,
        updatedAt: true,
        taughtCourses: {
          select: {
            id: true,
            titleFa: true,
            titleEn: true,
            instrument: true,
            level: true,
            isPublished: true,
            _count: { select: { enrollments: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { taughtCourses: true },
        },
      },
    });

    if (!instructor) {
      return NextResponse.json({ error: "مدرس یافت نشد" }, { status: 404 });
    }

    return NextResponse.json({ instructor });
  } catch (error) {
    console.error("[INSTRUCTOR_GET]", error);
    return NextResponse.json({ error: "Failed to get instructor" }, { status: 500 });
  }
}

// PUT /api/admin/instructors/[id] - Update instructor
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  const auth = await requireAdmin(request, "instructors", "update");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const existing = await db.student.findFirst({
      where: { id, role: "instructor" },
    });
    if (!existing) {
      return NextResponse.json({ error: "مدرس یافت نشد" }, { status: 404 });
    }

    const body = await request.json();

    const allowedFields = [
      "name", "email", "phone", "avatarUrl",
      "specialtyFa", "specialtyEn",
      "bioFa", "bioEn", "experience",
      "primaryInstrument", "socialLinks",
      "isPublishedInstructor", "instructorOrder",
      "isActive",
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field] === "" ? null : body[field];
      }
    }

    // Reset password if provided
    if (body.newPassword) {
      updateData.password = await hashPassword(body.newPassword);
    }

    const instructor = await db.student.update({
      where: { id },
      data: updateData,
      select: {
        id: true, name: true, email: true, phone: true,
        specialtyFa: true, specialtyEn: true,
        isActive: true, isPublishedInstructor: true,
        instructorOrder: true, createdAt: true,
      },
    });

    // Audit log
    await writeAuditLog({
      adminId: auth.admin.id,
      action: "update",
      entity: "instructor",
      entityId: id,
      entityName: existing.name,
      details: {
        changes: Object.keys(updateData),
        passwordReset: !!body.newPassword,
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "info",
    });

    return NextResponse.json({ instructor });
  } catch (error) {
    console.error("[INSTRUCTOR_UPDATE]", error);
    return NextResponse.json({ error: "Failed to update instructor" }, { status: 500 });
  }
}

// DELETE /api/admin/instructors/[id] - Delete instructor (super admin only)
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const existing = await db.student.findFirst({
      where: { id, role: "instructor" },
      include: { _count: { select: { taughtCourses: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "مدرس یافت نشد" }, { status: 404 });
    }

    // Check for active courses
    if (existing._count.taughtCourses > 0) {
      return NextResponse.json(
        { error: "Cannot delete instructor with assigned courses. Reassign them first.", activeCourses: existing._count.taughtCourses },
        { status: 409 }
      );
    }

    // Change role to student instead of deleting, preserving data integrity
    await db.student.update({
      where: { id },
      data: { role: "student", isPublishedInstructor: false },
    });

    // Audit log
    await writeAuditLog({
      adminId: auth.admin.id,
      action: "delete",
      entity: "instructor",
      entityId: id,
      entityName: existing.name,
      details: { email: existing.email, revertedToStudent: true },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "critical",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[INSTRUCTOR_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete instructor" }, { status: 500 });
  }
}
