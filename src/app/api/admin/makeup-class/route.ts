import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";

// Convert JS getDay() (0=Sun..6=Sat) to Persian-week dayOfWeek
// (0=Sat, 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri).
function jsDayToPersianDay(jsDay: number): number {
  return (jsDay + 1) % 7;
}

// Validate HH:mm time format
function isValidTime(t: unknown): boolean {
  if (typeof t !== "string") return false;
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(t);
}

// GET /api/admin/makeup-class - List all makeup/one-time class schedules
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, "makeup_class", "read");
  if (!auth.ok) return auth.response;

  try {
    // One-time (non-recurring) sessions represent makeup classes
    const makeupClasses = await db.classSchedule.findMany({
      where: { isRecurring: false },
      orderBy: { specificDate: "asc" },
      include: {
        course: {
          select: {
            id: true,
            titleFa: true,
            titleEn: true,
            classType: true,
            instructor: { select: { id: true, name: true, specialtyFa: true, specialtyEn: true } },
          },
        },
        instructor: {
          select: { id: true, name: true, specialtyFa: true, specialtyEn: true, avatarUrl: true },
        },
        branch: {
          select: { id: true, nameFa: true, nameEn: true },
        },
      },
    });

    return NextResponse.json({ makeupClasses });
  } catch (error) {
    console.error("[MAKEUP_CLASS_LIST]", error);
    return NextResponse.json({ error: "Failed to fetch makeup classes" }, { status: 500 });
  }
}

// POST /api/admin/makeup-class - Create a one-time (makeup) class schedule
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, "makeup_class", "create");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const {
      courseId,
      instructorId,
      specificDate,
      startTime,
      endTime,
      branchId,
      room,
      capacity,
      notes,
      sessionNumber,
    } = body;

    if (!specificDate) {
      return NextResponse.json({ error: "specificDate is required" }, { status: 400 });
    }
    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }
    if (!instructorId) {
      return NextResponse.json({ error: "instructorId is required" }, { status: 400 });
    }

    // Validate date
    const dateObj = new Date(specificDate);
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json({ error: "Invalid specificDate" }, { status: 400 });
    }

    // Validate time formats
    const finalStartTime = startTime || "00:00";
    const finalEndTime = endTime || "01:00";
    if (!isValidTime(finalStartTime) || !isValidTime(finalEndTime)) {
      return NextResponse.json(
        { error: "Invalid startTime/endTime format, expected HH:mm" },
        { status: 400 }
      );
    }
    if (finalStartTime >= finalEndTime) {
      return NextResponse.json(
        { error: "startTime must be before endTime" },
        { status: 400 }
      );
    }

    // Validate capacity
    let finalCapacity: number | null = null;
    if (capacity !== undefined && capacity !== null && capacity !== "") {
      const c = Number(capacity);
      if (!Number.isInteger(c) || c <= 0) {
        return NextResponse.json(
          { error: "capacity must be a positive integer" },
          { status: 400 }
        );
      }
      finalCapacity = c;
    }

    // Verify course exists
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { id: true, instructorId: true, titleFa: true, titleEn: true },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Verify instructor
    const instructor = await db.student.findUnique({ where: { id: instructorId } });
    if (!instructor || instructor.role !== "instructor") {
      return NextResponse.json(
        { error: "Instructor not found or not an instructor" },
        { status: 404 }
      );
    }

    // Verify branch if provided
    if (branchId) {
      const branch = await db.branch.findUnique({ where: { id: branchId } });
      if (!branch) {
        return NextResponse.json({ error: "Branch not found" }, { status: 404 });
      }
    }

    const schedule = await db.classSchedule.create({
      data: {
        courseId,
        instructorId,
        dayOfWeek: jsDayToPersianDay(dateObj.getDay()),
        startTime: finalStartTime,
        endTime: finalEndTime,
        branchId: branchId || null,
        isRecurring: false,
        specificDate: dateObj,
        room: room || null,
        capacity: finalCapacity,
        notes: notes || null,
        sessionNumber: sessionNumber || null,
        status: "active",
      },
      include: {
        course: {
          select: {
            id: true,
            titleFa: true,
            titleEn: true,
            classType: true,
            instructor: { select: { id: true, name: true, specialtyFa: true, specialtyEn: true } },
          },
        },
        instructor: {
          select: { id: true, name: true, specialtyFa: true, specialtyEn: true, avatarUrl: true },
        },
        branch: {
          select: { id: true, nameFa: true, nameEn: true },
        },
      },
    });

    await writeAuditLog({
      adminId: auth.admin.id,
      action: "create",
      entity: "classSchedule",
      entityId: schedule.id,
      entityName: `Makeup Class - ${schedule.course?.titleFa || ""}`,
      details: { type: "makeup", courseId, specificDate, startTime: finalStartTime, endTime: finalEndTime },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "info",
    });

    return NextResponse.json({ schedule }, { status: 201 });
  } catch (error) {
    console.error("[MAKEUP_CLASS_CREATE]", error);
    return NextResponse.json({ error: "Failed to create makeup class" }, { status: 500 });
  }
}

// PUT /api/admin/makeup-class - Update a makeup class schedule
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request, "makeup_class", "update");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { id, startTime, endTime, specificDate, room, capacity, notes, status, cancelReason } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const existing = await db.classSchedule.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }
    // Safety: ensure we only modify makeup (non-recurring) classes via this route
    if (existing.isRecurring) {
      return NextResponse.json(
        { error: "This route only manages makeup (non-recurring) classes" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (startTime !== undefined) {
      if (!isValidTime(startTime)) {
        return NextResponse.json(
          { error: "Invalid startTime format, expected HH:mm" },
          { status: 400 }
        );
      }
      updateData.startTime = startTime;
    }
    if (endTime !== undefined) {
      if (!isValidTime(endTime)) {
        return NextResponse.json(
          { error: "Invalid endTime format, expected HH:mm" },
          { status: 400 }
        );
      }
      updateData.endTime = endTime;
    }
    if ((updateData.startTime || existing.startTime) >= (updateData.endTime || existing.endTime)) {
      return NextResponse.json(
        { error: "startTime must be before endTime" },
        { status: 400 }
      );
    }
    if (room !== undefined) updateData.room = room;
    if (capacity !== undefined) {
      if (capacity === null || capacity === "") {
        updateData.capacity = null;
      } else {
        const c = Number(capacity);
        if (!Number.isInteger(c) || c <= 0) {
          return NextResponse.json(
            { error: "capacity must be a positive integer" },
            { status: 400 }
          );
        }
        updateData.capacity = c;
      }
    }
    if (notes !== undefined) updateData.notes = notes;
    if (specificDate !== undefined) {
      const dateObj = new Date(specificDate);
      if (isNaN(dateObj.getTime())) {
        return NextResponse.json({ error: "Invalid specificDate" }, { status: 400 });
      }
      updateData.specificDate = dateObj;
      updateData.dayOfWeek = jsDayToPersianDay(dateObj.getDay());
    }

    // Handle status changes
    if (status !== undefined) {
      const validStatuses = ["active", "cancelled", "completed"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updateData.status = status;
      if (status === "cancelled") {
        updateData.cancelReason = cancelReason || "Cancelled by admin";
        updateData.cancelledAt = new Date();
        updateData.cancelledBy = auth.admin.id;
      }
    }

    const schedule = await db.classSchedule.update({
      where: { id },
      data: updateData,
      include: {
        course: {
          select: {
            id: true,
            titleFa: true,
            titleEn: true,
            classType: true,
            instructor: { select: { id: true, name: true, specialtyFa: true, specialtyEn: true } },
          },
        },
        instructor: {
          select: { id: true, name: true, specialtyFa: true, specialtyEn: true, avatarUrl: true },
        },
        branch: {
          select: { id: true, nameFa: true, nameEn: true },
        },
      },
    });

    await writeAuditLog({
      adminId: auth.admin.id,
      action: "update",
      entity: "classSchedule",
      entityId: id,
      entityName: `Makeup Class - ${schedule.course?.titleFa || ""}`,
      details: { changes: Object.keys(updateData) },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "info",
    });

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error("[MAKEUP_CLASS_UPDATE]", error);
    return NextResponse.json({ error: "Failed to update makeup class" }, { status: 500 });
  }
}

// DELETE /api/admin/makeup-class - Delete a makeup class schedule
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request, "makeup_class", "delete");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const existing = await db.classSchedule.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }
    if (existing.isRecurring) {
      return NextResponse.json(
        { error: "This route only manages makeup (non-recurring) classes" },
        { status: 400 }
      );
    }

    await db.classSchedule.delete({ where: { id } });

    await writeAuditLog({
      adminId: auth.admin.id,
      action: "delete",
      entity: "classSchedule",
      entityId: id,
      entityName: "Makeup Class",
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "warning",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MAKEUP_CLASS_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete makeup class" }, { status: 500 });
  }
}
