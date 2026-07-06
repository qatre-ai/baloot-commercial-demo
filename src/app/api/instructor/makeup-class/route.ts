import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, writeAuditLog, getClientIp, getUserAgent } from "@/lib/auth/session";

// POST /api/instructor/makeup-class - Instructor requests a makeup class
// IMPORTANT: Instructors cannot directly create class schedules.
// This creates a ScheduleChangeRequest of type "reschedule" for admin approval.
// The makeup class will only be added to the schedule after admin approval.
export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session || session.role !== "instructor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const instructorId = session.userId;

  try {
    const body = await request.json();
    const {
      courseId,
      scheduleId,
      proposedDayOfWeek,
      proposedStartTime,
      proposedEndTime,
      proposedDate,
      proposedRoom,
      reason,
    } = body;

    // Validate required fields
    if (!courseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );
    }
    if (!scheduleId) {
      return NextResponse.json(
        { error: "scheduleId is required - specify which class session to make up" },
        { status: 400 }
      );
    }
    if (!reason) {
      return NextResponse.json(
        { error: "reason is required" },
        { status: 400 }
      );
    }

    // Must provide at least a proposed date or day + time
    if (!proposedDate && !proposedDayOfWeek && !proposedStartTime) {
      return NextResponse.json(
        { error: "Please provide proposed date/time for the makeup class" },
        { status: 400 }
      );
    }

    // Verify the schedule exists and belongs to this instructor
    const schedule = await db.classSchedule.findUnique({
      where: { id: scheduleId },
    });
    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }
    if (schedule.instructorId !== instructorId) {
      return NextResponse.json(
        { error: "This schedule does not belong to you" },
        { status: 403 }
      );
    }

    // Verify the course belongs to this instructor
    const course = await db.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }
    if (course.instructorId !== instructorId) {
      return NextResponse.json(
        { error: "You are not assigned to this course" },
        { status: 403 }
      );
    }

    // Check if there's already a pending request for this schedule
    const existingPending = await db.scheduleChangeRequest.findFirst({
      where: {
        scheduleId,
        status: "pending",
      },
    });
    if (existingPending) {
      return NextResponse.json(
        { error: "There is already a pending request for this schedule" },
        { status: 409 }
      );
    }

    // Build proposed changes
    const proposedChanges: any = { action: "makeup_class" };
    if (proposedDayOfWeek !== undefined)
      proposedChanges.dayOfWeek = proposedDayOfWeek;
    if (proposedStartTime) proposedChanges.startTime = proposedStartTime;
    if (proposedEndTime) proposedChanges.endTime = proposedEndTime;
    if (proposedDate) proposedChanges.specificDate = proposedDate;
    if (proposedRoom) proposedChanges.room = proposedRoom;

    // Create a schedule change request for the makeup class
    const changeRequest = await db.scheduleChangeRequest.create({
      data: {
        instructorId,
        scheduleId,
        courseId,
        requestType: "reschedule",
        reason: `جلسه جبرانی: ${reason}`,
        proposedChanges: JSON.stringify(proposedChanges),
        status: "pending",
      },
      include: {
        course: {
          select: {
            id: true,
            titleFa: true,
            titleEn: true,
            instrument: true,
          },
        },
        schedule: {
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            room: true,
          },
        },
      },
    });

    // Audit log (system-generated since instructor is not an admin)
    await writeAuditLog({
      adminId: null,
      action: "instructor_makeup_request",
      entity: "scheduleChangeRequest",
      entityId: changeRequest.id,
      entityName: `Makeup request by ${instructorId}`,
      details: {
        instructorId,
        scheduleId,
        courseId,
        requestType: "reschedule",
        reason,
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "info",
    }).catch(() => {});

    return NextResponse.json(
      {
        request: changeRequest,
        message:
          "درخواست جلسه جبرانی ثبت شد و پس از تأیید مدیر به برنامه اضافه خواهد شد",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[INSTRUCTOR_MAKEUP_CREATE]", error);
    return NextResponse.json(
      { error: "Failed to create makeup class request" },
      { status: 500 }
    );
  }
}
