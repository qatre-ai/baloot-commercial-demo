import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";

// GET /api/admin/class-schedules — List all class schedules with filters
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, "schedules", "read");
  if (!auth.ok) return auth.response;

  try {
    const url = request.nextUrl.searchParams;
    const courseId = url.get("courseId");
    const instructorId = url.get("instructorId");
    const dayOfWeek = url.get("dayOfWeek");
    const status = url.get("status");
    const branchId = url.get("branchId");
    const isRecurring = url.get("isRecurring");
    const limit = Math.min(parseInt(url.get("limit") || "100"), 500);
    const offset = parseInt(url.get("offset") || "0");

    const where: Record<string, unknown> = {};
    if (courseId) where.courseId = courseId;
    if (instructorId) where.instructorId = instructorId;
    if (dayOfWeek !== null && dayOfWeek !== undefined && dayOfWeek !== "") {
      where.dayOfWeek = parseInt(dayOfWeek);
    }
    if (status) where.status = status;
    if (branchId) where.branchId = branchId;
    if (isRecurring !== null && isRecurring !== undefined && isRecurring !== "") {
      where.isRecurring = isRecurring === "true";
    }

    const [schedules, total] = await Promise.all([
      db.classSchedule.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
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
          _count: {
            select: { changeRequests: true },
          },
        },
      }),
      db.classSchedule.count({ where }),
    ]);

    return NextResponse.json({ schedules, total });
  } catch (error) {
    console.error("[ADMIN_CLASS_SCHEDULES_LIST]", error);
    return NextResponse.json(
      { error: "Failed to list class schedules" },
      { status: 500 }
    );
  }
}

// POST /api/admin/class-schedules — Create new class schedule
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, "schedules", "create");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const {
      courseId,
      instructorId,
      dayOfWeek,
      startTime,
      endTime,
      branchId,
      isRecurring,
      specificDate,
      room,
      capacity,
      notes,
      sessionNumber,
    } = body;

    // Validate required fields
    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }
    if (!instructorId) {
      return NextResponse.json({ error: "instructorId is required" }, { status: 400 });
    }
    if (dayOfWeek === undefined || dayOfWeek === null) {
      return NextResponse.json({ error: "dayOfWeek is required" }, { status: 400 });
    }
    if (!startTime) {
      return NextResponse.json({ error: "startTime is required" }, { status: 400 });
    }
    if (!endTime) {
      return NextResponse.json({ error: "endTime is required" }, { status: 400 });
    }

    // Validate dayOfWeek (0-6 for Persian week: Saturday=0 to Friday=6)
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json(
        { error: "dayOfWeek must be between 0 (Saturday) and 6 (Friday)" },
        { status: 400 }
      );
    }

    // Verify course exists
    const course = await db.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Verify instructor exists and has instructor role
    const instructor = await db.student.findUnique({
      where: { id: instructorId },
    });
    if (!instructor || instructor.role !== "instructor") {
      return NextResponse.json(
        { error: "Instructor not found or user is not an instructor" },
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

    // Validate specificDate for one-time sessions
    if (isRecurring === false && !specificDate) {
      return NextResponse.json(
        { error: "specificDate is required for one-time (non-recurring) sessions" },
        { status: 400 }
      );
    }

    const schedule = await db.classSchedule.create({
      data: {
        courseId,
        instructorId,
        dayOfWeek,
        startTime,
        endTime,
        branchId: branchId || null,
        isRecurring: isRecurring !== undefined ? isRecurring : true,
        specificDate: specificDate ? new Date(specificDate) : null,
        room: room || null,
        capacity: capacity || null,
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
      action: "create",
      entity: "classSchedule",
      entityId: schedule.id,
      entityName: `${course.titleFa} - Day ${dayOfWeek} ${startTime}-${endTime}`,
      details: {
        courseId,
        instructorId,
        dayOfWeek,
        startTime,
        endTime,
        branchId,
        isRecurring,
        room,
        capacity,
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "info",
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_CLASS_SCHEDULE_CREATE]", error);
    return NextResponse.json(
      { error: "Failed to create class schedule" },
      { status: 500 }
    );
  }
}
