import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";

// Day names in Persian and English (0=Saturday per schema)
const DAY_NAMES_FA = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
const DAY_NAMES_EN = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// GET /api/student/schedule — Get student's class schedule based on enrollments
export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Allow both students and instructors (instructors can also view their class schedules)

  const studentId = session.userId;

  try {
    const url = request.nextUrl.searchParams;
    const dayOfWeek = url.get("dayOfWeek");

    // Get student's enrolled course IDs (active enrollments only)
    const enrollments = await db.courseEnrollment.findMany({
      where: {
        studentId,
        status: { in: ["active", "paused"] },
      },
      select: { courseId: true },
    });

    const enrolledCourseIds = enrollments.map((e) => e.courseId);

    if (enrolledCourseIds.length === 0) {
      return NextResponse.json({
        schedules: [],
        groupedByDay: {},
        stats: { totalClasses: 0, activeDays: 0, totalCourses: 0 },
      });
    }

    // Get class schedules for enrolled courses
    const where: Record<string, unknown> = {
      courseId: { in: enrolledCourseIds },
      status: "active",
    };
    if (dayOfWeek !== null && dayOfWeek !== undefined && dayOfWeek !== "") {
      where.dayOfWeek = parseInt(dayOfWeek);
    }

    const schedules = await db.classSchedule.findMany({
      where,
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
      },
    });

    // Get approved schedule change requests that affect these schedules
    const approvedChanges = await db.scheduleChangeRequest.findMany({
      where: {
        courseId: { in: enrolledCourseIds },
        status: "approved",
        isApplied: true,
      },
      select: {
        id: true,
        scheduleId: true,
        requestType: true,
        proposedChanges: true,
        appliedAt: true,
      },
    });

    // Build a map of schedule changes by scheduleId
    const changesMap = new Map<string, typeof approvedChanges>();
    for (const change of approvedChanges) {
      const existing = changesMap.get(change.scheduleId) || [];
      existing.push(change);
      changesMap.set(change.scheduleId, existing);
    }

    // Format schedules with day names and change info
    const formattedSchedules = schedules.map((schedule) => ({
      id: schedule.id,
      courseId: schedule.courseId,
      dayOfWeek: schedule.dayOfWeek,
      dayNameFa: DAY_NAMES_FA[schedule.dayOfWeek] || "نامشخص",
      dayNameEn: DAY_NAMES_EN[schedule.dayOfWeek] || "Unknown",
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      isRecurring: schedule.isRecurring,
      specificDate: schedule.specificDate,
      room: schedule.room,
      status: schedule.status,
      notes: schedule.notes,
      sessionNumber: schedule.sessionNumber,
      course: schedule.course,
      instructor: schedule.instructor,
      branch: schedule.branch,
      scheduleChanges: (changesMap.get(schedule.id) || []).map((c) => ({
        id: c.id,
        requestType: c.requestType,
        proposedChanges: c.proposedChanges,
        appliedAt: c.appliedAt,
      })),
    }));

    // Group by day of week
    const groupedByDay: Record<string, typeof formattedSchedules> = {};
    for (const schedule of formattedSchedules) {
      const dayKey = String(schedule.dayOfWeek);
      if (!groupedByDay[dayKey]) {
        groupedByDay[dayKey] = [];
      }
      groupedByDay[dayKey].push(schedule);
    }

    return NextResponse.json({
      schedules: formattedSchedules,
      groupedByDay,
      stats: {
        totalClasses: formattedSchedules.length,
        activeDays: Object.keys(groupedByDay).length,
        totalCourses: enrolledCourseIds.length,
      },
      dayNames: {
        fa: DAY_NAMES_FA,
        en: DAY_NAMES_EN,
      },
    });
  } catch (error) {
    console.error("[STUDENT_SCHEDULE_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 }
    );
  }
}
