import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";

// Day names in Persian and English (0=Saturday per schema)
const DAY_NAMES_FA = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
const DAY_NAMES_EN = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// GET /api/instructor/schedule — Get instructor's class schedule
export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session || session.role !== "instructor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const instructorId = session.userId;

  try {
    const url = request.nextUrl.searchParams;
    const status = url.get("status");
    const courseId = url.get("courseId");

    const where: Record<string, unknown> = { instructorId };
    if (status) where.status = status;
    else where.status = "active"; // Default to active only
    if (courseId) where.courseId = courseId;

    // Get all schedules for this instructor
    const schedules = await db.classSchedule.findMany({
      where,
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      include: {
        course: {
          select: {
            id: true,
            titleFa: true,
            titleEn: true,
            classType: true,
            level: true,
            instrument: true,
            enrollments: {
              where: { status: "active" },
              select: {
                studentId: true,
              },
            },
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

    // Add student count per class and group by day of week
    const schedulesWithCounts = schedules.map((schedule) => ({
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
      capacity: schedule.capacity,
      status: schedule.status,
      notes: schedule.notes,
      sessionNumber: schedule.sessionNumber,
      course: {
        ...schedule.course,
        studentCount: schedule.course.enrollments.length,
      },
      branch: schedule.branch,
      studentCount: schedule.course.enrollments.length,
    }));

    // Group by day of week
    const groupedByDay: Record<string, typeof schedulesWithCounts> = {};
    for (const schedule of schedulesWithCounts) {
      const dayKey = String(schedule.dayOfWeek);
      if (!groupedByDay[dayKey]) {
        groupedByDay[dayKey] = [];
      }
      groupedByDay[dayKey].push(schedule);
    }

    // Separate recurring vs one-time
    const recurringSchedules = schedulesWithCounts.filter((s) => s.isRecurring);
    const oneTimeSchedules = schedulesWithCounts.filter((s) => !s.isRecurring);

    // Stats
    const totalClasses = schedulesWithCounts.length;
    const totalStudents = schedulesWithCounts.reduce(
      (sum, s) => sum + s.studentCount,
      0
    );

    return NextResponse.json({
      schedules: schedulesWithCounts,
      groupedByDay,
      recurring: recurringSchedules,
      oneTime: oneTimeSchedules,
      stats: {
        totalClasses,
        totalStudents,
        recurringCount: recurringSchedules.length,
        oneTimeCount: oneTimeSchedules.length,
        activeDays: Object.keys(groupedByDay).length,
      },
      dayNames: {
        fa: DAY_NAMES_FA,
        en: DAY_NAMES_EN,
      },
    });
  } catch (error) {
    console.error("[INSTRUCTOR_SCHEDULE_GET]", error);
    return NextResponse.json(
      { error: "Failed to load instructor schedule" },
      { status: 500 }
    );
  }
}
