import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";

// PATCH /api/admin/class-schedules/[id] — Update a class schedule
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, "schedules", "update");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    // Verify schedule exists
    const existing = await db.classSchedule.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, titleFa: true, titleEn: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (body.dayOfWeek !== undefined) {
      if (body.dayOfWeek < 0 || body.dayOfWeek > 6) {
        return NextResponse.json(
          { error: "dayOfWeek must be between 0 and 6" },
          { status: 400 }
        );
      }
      updateData.dayOfWeek = body.dayOfWeek;
    }
    if (body.startTime !== undefined) updateData.startTime = body.startTime;
    if (body.endTime !== undefined) updateData.endTime = body.endTime;
    if (body.room !== undefined) updateData.room = body.room;
    if (body.capacity !== undefined) updateData.capacity = body.capacity;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.sessionNumber !== undefined) updateData.sessionNumber = body.sessionNumber;
    if (body.isRecurring !== undefined) updateData.isRecurring = body.isRecurring;
    if (body.specificDate !== undefined) {
      updateData.specificDate = body.specificDate ? new Date(body.specificDate) : null;
    }
    if (body.branchId !== undefined) updateData.branchId = body.branchId || null;
    if (body.instructorId !== undefined) updateData.instructorId = body.instructorId;

    // Handle status changes (cancel, reactivate, complete)
    if (body.status !== undefined) {
      const validStatuses = ["active", "cancelled", "completed"];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: "status must be 'active', 'cancelled', or 'completed'" },
          { status: 400 }
        );
      }
      updateData.status = body.status;

      // If cancelling, record details
      if (body.status === "cancelled") {
        updateData.cancelReason = body.cancelReason || "Cancelled by admin";
        updateData.cancelledAt = new Date();
        updateData.cancelledBy = auth.admin.id;
      }
    }

    const updated = await db.classSchedule.update({
      where: { id },
      data: updateData,
      include: {
        course: {
          select: {
            id: true,
            titleFa: true,
            titleEn: true,
            instrument: true,
            level: true,
            classType: true,
          },
        },
        instructor: {
          select: {
            id: true,
            name: true,
            specialtyFa: true,
            specialtyEn: true,
          },
        },
        branch: {
          select: {
            id: true,
            nameFa: true,
            nameEn: true,
          },
        },
      },
    });

    // Audit log
    await writeAuditLog({
      adminId: auth.admin.id,
      action: "update",
      entity: "classSchedule",
      entityId: id,
      entityName: `${existing.course.titleFa} - Day ${existing.dayOfWeek} ${existing.startTime}-${existing.endTime}`,
      details: {
        before: {
          dayOfWeek: existing.dayOfWeek,
          startTime: existing.startTime,
          endTime: existing.endTime,
          status: existing.status,
          room: existing.room,
        },
        changes: updateData,
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "info",
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[ADMIN_CLASS_SCHEDULE_UPDATE]", error);
    return NextResponse.json(
      { error: "Failed to update class schedule" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/class-schedules/[id] — Delete a class schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, "schedules", "delete");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;

    // Verify schedule exists
    const existing = await db.classSchedule.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, titleFa: true, titleEn: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    // Delete the schedule (cascade will handle changeRequests)
    await db.classSchedule.delete({ where: { id } });

    // Audit log
    await writeAuditLog({
      adminId: auth.admin.id,
      action: "delete",
      entity: "classSchedule",
      entityId: id,
      entityName: `${existing.course.titleFa} - Day ${existing.dayOfWeek} ${existing.startTime}-${existing.endTime}`,
      details: {
        dayOfWeek: existing.dayOfWeek,
        startTime: existing.startTime,
        endTime: existing.endTime,
        status: existing.status,
        room: existing.room,
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "warning",
    });

    return NextResponse.json({ success: true, message: "Schedule deleted" });
  } catch (error) {
    console.error("[ADMIN_CLASS_SCHEDULE_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete class schedule" },
      { status: 500 }
    );
  }
}
