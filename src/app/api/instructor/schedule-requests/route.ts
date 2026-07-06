import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";

// GET /api/instructor/schedule-requests — List instructor's own schedule change requests
export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session || session.role !== "instructor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const instructorId = session.userId;

  try {
    const url = request.nextUrl.searchParams;
    const status = url.get("status");
    const requestType = url.get("requestType");
    const limit = Math.min(parseInt(url.get("limit") || "50"), 200);
    const offset = parseInt(url.get("offset") || "0");

    const where: Record<string, unknown> = { instructorId };
    if (status) where.status = status;
    if (requestType) where.requestType = requestType;

    const [requests, total] = await Promise.all([
      db.scheduleChangeRequest.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        include: {
          course: {
            select: {
              id: true,
              titleFa: true,
              titleEn: true,
              instrument: true,
              level: true,
            },
          },
          schedule: {
            select: {
              id: true,
              dayOfWeek: true,
              startTime: true,
              endTime: true,
              room: true,
              status: true,
              isRecurring: true,
              specificDate: true,
            },
          },
        },
      }),
      db.scheduleChangeRequest.count({ where }),
    ]);

    // Summary
    const pendingCount = await db.scheduleChangeRequest.count({
      where: { instructorId, status: "pending" },
    });
    const approvedCount = await db.scheduleChangeRequest.count({
      where: { instructorId, status: "approved" },
    });
    const rejectedCount = await db.scheduleChangeRequest.count({
      where: { instructorId, status: "rejected" },
    });

    return NextResponse.json({
      requests,
      total,
      stats: { pending: pendingCount, approved: approvedCount, rejected: rejectedCount },
    });
  } catch (error) {
    console.error("[INSTRUCTOR_SCHEDULE_REQUESTS_LIST]", error);
    return NextResponse.json(
      { error: "Failed to list schedule requests" },
      { status: 500 }
    );
  }
}

// POST /api/instructor/schedule-requests — Create new schedule change request
export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session || session.role !== "instructor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const instructorId = session.userId;

  try {
    const body = await request.json();
    const { scheduleId, courseId, requestType, reason, proposedChanges } = body;

    // Validate required fields
    if (!scheduleId) {
      return NextResponse.json(
        { error: "scheduleId is required" },
        { status: 400 }
      );
    }
    if (!courseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );
    }
    if (!requestType) {
      return NextResponse.json(
        { error: "requestType is required" },
        { status: 400 }
      );
    }
    if (!reason) {
      return NextResponse.json(
        { error: "reason is required" },
        { status: 400 }
      );
    }

    // Validate requestType
    const validTypes = ["time_change", "cancellation", "room_change", "reschedule"];
    if (!validTypes.includes(requestType)) {
      return NextResponse.json(
        { error: `requestType must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate proposedChanges is valid JSON
    if (!proposedChanges) {
      return NextResponse.json(
        { error: "proposedChanges is required" },
        { status: 400 }
      );
    }

    let parsedChanges: Record<string, unknown>;
    try {
      parsedChanges = typeof proposedChanges === "string"
        ? JSON.parse(proposedChanges)
        : proposedChanges;
    } catch {
      return NextResponse.json(
        { error: "proposedChanges must be valid JSON" },
        { status: 400 }
      );
    }

    // Verify schedule exists and belongs to this instructor
    const schedule = await db.classSchedule.findUnique({
      where: { id: scheduleId },
    });
    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }
    if (schedule.instructorId !== instructorId) {
      return NextResponse.json(
        { error: "This schedule does not belong to you" },
        { status: 403 }
      );
    }

    // Verify course exists
    const course = await db.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
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

    // Validate proposed changes based on request type
    if (requestType === "cancellation") {
      // Cancellation doesn't need proposed changes (just the act of cancelling)
      parsedChanges = { action: "cancel" };
    } else if (requestType === "time_change") {
      if (!parsedChanges.startTime && !parsedChanges.endTime && parsedChanges.dayOfWeek === undefined) {
        return NextResponse.json(
          { error: "Time change requests must include proposed startTime, endTime, or dayOfWeek" },
          { status: 400 }
        );
      }
    } else if (requestType === "room_change") {
      if (!parsedChanges.room) {
        return NextResponse.json(
          { error: "Room change requests must include proposed room" },
          { status: 400 }
        );
      }
    } else if (requestType === "reschedule") {
      if (parsedChanges.dayOfWeek === undefined && !parsedChanges.specificDate) {
        return NextResponse.json(
          { error: "Reschedule requests must include proposed dayOfWeek or specificDate" },
          { status: 400 }
        );
      }
    }

    const changeRequest = await db.scheduleChangeRequest.create({
      data: {
        instructorId,
        scheduleId,
        courseId,
        requestType,
        reason,
        proposedChanges: JSON.stringify(parsedChanges),
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

    return NextResponse.json(changeRequest, { status: 201 });
  } catch (error) {
    console.error("[INSTRUCTOR_SCHEDULE_REQUEST_CREATE]", error);
    return NextResponse.json(
      { error: "Failed to create schedule change request" },
      { status: 500 }
    );
  }
}
