import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";

// GET /api/instructor/dashboard - Instructor's dashboard data
// Requires authenticated user with role "instructor"
export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "instructor") {
    return NextResponse.json(
      { error: "Unauthorized - Instructor access required" },
      { status: 403 }
    );
  }

  const instructorId = session.userId;

  try {
    // Get instructor profile (Student record with role=instructor)
    const instructor = await db.student.findUnique({
      where: { id: instructorId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        specialtyFa: true,
        specialtyEn: true,
        bioFa: true,
        bioEn: true,
        primaryInstrument: true,
        isActive: true,
      },
    });

    if (!instructor) {
      return NextResponse.json(
        { error: "Instructor profile not found" },
        { status: 404 }
      );
    }

    // Get instructor's courses with student counts
    const courses = await db.course.findMany({
      where: { instructorId },
      select: {
        id: true,
        titleFa: true,
        titleEn: true,
        instrument: true,
        level: true,
        classType: true,
        maxCapacity: true,
        isPublished: true,
        sessionsMin: true,
        sessionsMax: true,
        _count: { select: { enrollments: true } },
        enrollments: {
          where: { status: "active" },
          select: {
            id: true,
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get upcoming class schedules (active recurring + future one-time)
    const upcomingSchedules = await db.classSchedule.findMany({
      where: {
        instructorId,
        status: "active",
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      take: 20,
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        isRecurring: true,
        specificDate: true,
        room: true,
        capacity: true,
        status: true,
        notes: true,
        sessionNumber: true,
        course: {
          select: {
            id: true,
            titleFa: true,
            titleEn: true,
            instrument: true,
            classType: true,
          },
        },
        branch: {
          select: { id: true, nameFa: true, nameEn: true },
        },
      },
    });

    // Get exercises assigned by this instructor
    const exercises = await db.exercise.findMany({
      where: { instructorId },
      select: {
        id: true,
        titleFa: true,
        titleEn: true,
        type: true,
        difficulty: true,
        dueDate: true,
        isPublished: true,
        createdAt: true,
        _count: { select: { submissions: true } },
        submissions: {
          select: { status: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Get pending submissions (submitted status) for instructor's exercises
    const pendingSubmissions = await db.studentExercise.findMany({
      where: {
        exercise: { instructorId },
        status: "submitted",
      },
      include: {
        student: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        exercise: {
          select: {
            id: true,
            titleFa: true,
            titleEn: true,
            type: true,
            difficulty: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
      take: 20,
    });

    // Count stats
    const totalStudents = courses.reduce(
      (sum, c) => sum + c._count.enrollments,
      0
    );
    const activeCourses = courses.filter((c) => c.isPublished).length;

    // Calculate pending grading count
    const pendingGradingCount = exercises.reduce((sum, ex) => {
      const submitted = ex.submissions.filter(
        (s) => s.status === "submitted"
      ).length;
      return sum + submitted;
    }, 0);

    // Recent submissions count (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSubmissionsCount = await db.studentExercise.count({
      where: {
        exercise: { instructorId },
        submittedAt: { gte: sevenDaysAgo },
      },
    });

    // Calculate today's class count
    // Persian week: 0=Saturday, 1=Sunday, ... 6=Friday
    const jsDay = new Date().getDay(); // 0=Sunday, 1=Monday, ... 6=Saturday
    const persianDay = jsDay === 6 ? 0 : jsDay + 1; // Convert to Persian week
    const todayClasses = upcomingSchedules.filter(
      (s) => s.dayOfWeek === persianDay
    ).length;

    // Next class info
    const currentTime = new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
    const todaySchedules = upcomingSchedules
      .filter((s) => s.dayOfWeek === persianDay && s.startTime >= currentTime)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    const nextClass = todaySchedules[0] || null;

    return NextResponse.json({
      instructor: {
        id: instructor.id,
        name: instructor.name,
        email: instructor.email,
        phone: instructor.phone,
        avatarUrl: instructor.avatarUrl,
        specialtyFa: instructor.specialtyFa,
        specialtyEn: instructor.specialtyEn,
        bioFa: instructor.bioFa,
        bioEn: instructor.bioEn,
        primaryInstrument: instructor.primaryInstrument,
        isActive: instructor.isActive,
      },
      summary: {
        totalStudents,
        activeCourses,
        upcomingClasses: upcomingSchedules.length,
        pendingGrading: pendingGradingCount,
        recentSubmissionsCount,
        totalCourses: courses.length,
        todayClasses,
      },
      courses,
      upcomingSchedules,
      exercises: exercises.map((ex) => {
        const submitted = ex.submissions.filter(
          (s) => s.status === "submitted"
        ).length;
        const graded = ex.submissions.filter(
          (s) => s.status === "graded"
        ).length;
        const late = ex.submissions.filter((s) => s.status === "late").length;
        const assigned = ex.submissions.filter(
          (s) => s.status === "assigned"
        ).length;
        return {
          id: ex.id,
          titleFa: ex.titleFa,
          titleEn: ex.titleEn,
          type: ex.type,
          difficulty: ex.difficulty,
          dueDate: ex.dueDate,
          isPublished: ex.isPublished,
          createdAt: ex.createdAt,
          _count: ex._count,
          submissionStats: {
            total: ex.submissions.length,
            submitted,
            graded,
            late,
            assigned,
          },
        };
      }),
      pendingSubmissions,
      nextClass,
    });
  } catch (error) {
    console.error("[INSTRUCTOR_DASHBOARD]", error);
    return NextResponse.json(
      { error: "Failed to load instructor dashboard" },
      { status: 500 }
    );
  }
}
