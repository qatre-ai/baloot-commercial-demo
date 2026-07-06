import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";

// Day names in Persian and English (0=Saturday per schema)
const DAY_NAMES_FA = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
const DAY_NAMES_EN = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// GET /api/student/dashboard — Comprehensive student dashboard data
export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // SECURITY: Only students can access their own student dashboard.
    // Instructors have their own /api/instructor/dashboard.
    if (session.role === "instructor") {
      return NextResponse.json(
        { error: "Instructors must use /api/instructor/dashboard" },
        { status: 403 }
      );
    }

    const studentId = session.userId;

    // Get student profile
    const student = await db.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get enrolled courses with progress, instructor, and class details
    const enrollments = await db.courseEnrollment.findMany({
      where: { studentId },
      include: {
        course: {
          select: {
            id: true,
            titleFa: true,
            titleEn: true,
            category: true,
            instrument: true,
            level: true,
            imageUrl: true,
            coverUrl: true,
            duration: true,
            sessionsMin: true,
            sessionsMax: true,
            classType: true,
            instructorId: true,
            instructor: {
              select: {
                id: true,
                name: true,
                specialtyFa: true,
                specialtyEn: true,
                avatarUrl: true,
                bioFa: true,
                bioEn: true,
                phone: true,
                socialLinks: true,
                isPublishedInstructor: true,
              },
            },
            branch: {
              select: { id: true, nameFa: true, nameEn: true, addressFa: true, addressEn: true },
            },
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            paymentType: true,
            paymentMethod: true,
            paidAt: true,
            paymentRef: true,
            installmentNumber: true,
            totalInstallments: true,
            dueDate: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });

    // Get workshop tickets
    const tickets = await db.workshopTicket.findMany({
      where: { studentId },
      include: {
        workshop: {
          select: {
            id: true,
            titleFa: true,
            titleEn: true,
            date: true,
            imageUrl: true,
            coverUrl: true,
            category: true,
            isHot: true,
            branch: { select: { nameFa: true, nameEn: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get enrolled course IDs for schedule & exercise queries
    const enrolledCourseIds = enrollments.map((e) => e.courseId);

    // Get class schedules for enrolled courses (using correct schema fields)
    const allSchedules = enrolledCourseIds.length > 0
      ? await db.classSchedule.findMany({
          where: {
            courseId: { in: enrolledCourseIds },
            status: "active",
          },
          include: {
            course: { select: { id: true, titleFa: true, titleEn: true, classType: true } },
            instructor: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
            branch: {
              select: { id: true, nameFa: true, nameEn: true },
            },
          },
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        })
      : [];

    // Format schedules with day names
    const formattedSchedules = allSchedules.map((s) => ({
      id: s.id,
      courseId: s.courseId,
      dayOfWeek: s.dayOfWeek,
      dayNameFa: DAY_NAMES_FA[s.dayOfWeek] || "نامشخص",
      dayNameEn: DAY_NAMES_EN[s.dayOfWeek] || "Unknown",
      startTime: s.startTime,
      endTime: s.endTime,
      isRecurring: s.isRecurring,
      specificDate: s.specificDate,
      room: s.room,
      status: s.status,
      notes: s.notes,
      sessionNumber: s.sessionNumber,
      course: s.course,
      instructor: s.instructor,
      branch: s.branch,
    }));

    // Get upcoming schedules (one-time sessions in the future)
    const now = new Date();
    const upcomingSchedules = formattedSchedules.filter((s) => {
      if (s.isRecurring) return true; // Recurring schedules are always "upcoming"
      // One-time: check if specificDate is in the future
      if (s.specificDate && new Date(s.specificDate) >= now) return true;
      return false;
    }).slice(0, 10);

    // Get today's day of week (Persian week: 0=Saturday)
    const today = new Date();
    const jsDay = today.getDay(); // 0=Sunday in JS
    // Convert JS day to Persian day: Sat=0, Sun=1, ..., Fri=6
    const persianToday = jsDay === 6 ? 0 : jsDay + 1;
    const todaySchedules = formattedSchedules.filter(
      (s) => s.dayOfWeek === persianToday && s.isRecurring
    );

    // Get recent exercises for enrolled courses with instructor info
    const recentExercises = enrolledCourseIds.length > 0
      ? await db.exercise.findMany({
          where: {
            courseId: { in: enrolledCourseIds },
            isPublished: true,
          },
          include: {
            course: { select: { id: true, titleFa: true, titleEn: true } },
            submissions: {
              where: { studentId },
              select: {
                id: true,
                status: true,
                grade: true,
                feedback: true,
                submittedAt: true,
                gradedAt: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        })
      : [];

    // Get recommendations
    const enrolledInstruments = enrollments
      .map((e) => e.course.instrument)
      .filter(Boolean) as string[];
    const enrolledCategories = enrollments
      .map((e) => e.course.category)
      .filter(Boolean) as string[];

    const enrolledCourseIdsSet = new Set(enrolledCourseIds);
    const registeredWorkshopIds = new Set(tickets.map((t) => t.workshopId));

    // Find recommended courses
    const courseOrConditions: Record<string, unknown>[] = [];
    if (enrolledInstruments.length > 0) {
      courseOrConditions.push({ instrument: { in: enrolledInstruments } });
    }
    if (enrolledCategories.length > 0) {
      courseOrConditions.push({ category: { in: enrolledCategories } });
    }
    if (courseOrConditions.length === 0) {
      courseOrConditions.push({ isFeatured: true });
    }

    const recommendedCourses = await db.course.findMany({
      where: {
        isPublished: true,
        id: { notIn: [...enrolledCourseIdsSet] },
        OR: courseOrConditions,
      },
      include: {
        branch: { select: { nameFa: true, nameEn: true } },
        instructor: { select: { id: true, name: true, specialtyFa: true, specialtyEn: true, avatarUrl: true } },
      },
      take: 3,
    });

    // Find recommended workshops (upcoming, not registered)
    const workshopOrConditions: Record<string, unknown>[] = [];
    if (enrolledCategories.length > 0) {
      workshopOrConditions.push({ category: { in: enrolledCategories } });
    }
    workshopOrConditions.push({ isHot: true });

    const recommendedWorkshops = await db.workshop.findMany({
      where: {
        isPublished: true,
        id: { notIn: [...registeredWorkshopIds] },
        date: { gte: now },
        OR: workshopOrConditions,
      },
      include: {
        branch: { select: { nameFa: true, nameEn: true } },
      },
      orderBy: { date: "asc" },
      take: 3,
    });

    const recommendations = [
      ...recommendedCourses.map((c) => ({ type: "course" as const, data: c })),
      ...recommendedWorkshops.map((w) => ({ type: "workshop" as const, data: w })),
    ].slice(0, 6);

    // Summary stats
    const activeEnrollments = enrollments.filter((e) => e.status === "active").length;
    const completedEnrollments = enrollments.filter((e) => e.status === "completed").length;
    const upcomingWorkshops = tickets.filter(
      (t) => t.status !== "cancelled" && new Date(t.workshop.date) >= now
    ).length;
    const pendingExercises = recentExercises.filter(
      (e) => e.submissions.length === 0
    ).length;

    // Payment summary for the student
    const studentPayments = await db.payment.findMany({
      where: { studentId },
      select: {
        id: true,
        amount: true,
        status: true,
        paymentType: true,
        dueDate: true,
        installmentNumber: true,
        totalInstallments: true,
        installmentPlanId: true,
        enrollment: {
          select: {
            id: true,
            course: { select: { id: true, titleFa: true, titleEn: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalPaid = studentPayments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0);
    const totalOwed = studentPayments
      .filter((p) => p.status === "pending" || p.status === "overdue")
      .reduce((sum, p) => sum + p.amount, 0);
    const totalAmount = studentPayments.reduce((sum, p) => sum + p.amount, 0);

    const pendingWithDueDate = studentPayments
      .filter((p) => p.status === "pending" && p.dueDate)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    const nextInstallment = pendingWithDueDate[0] || null;

    const overdueCount = studentPayments.filter(
      (p) => p.status === "overdue" || (p.status === "pending" && p.dueDate && new Date(p.dueDate) < new Date())
    ).length;

    // Group schedules by day of week
    const groupedByDay: Record<string, typeof formattedSchedules> = {};
    for (const schedule of formattedSchedules) {
      const dayKey = String(schedule.dayOfWeek);
      if (!groupedByDay[dayKey]) {
        groupedByDay[dayKey] = [];
      }
      groupedByDay[dayKey].push(schedule);
    }

    return NextResponse.json({
      student,
      stats: {
        activeCourses: activeEnrollments,
        completedCourses: completedEnrollments,
        upcomingWorkshops,
        pendingExercises,
        todayClassesCount: todaySchedules.length,
      },
      paymentSummary: {
        totalAmount,
        totalPaid,
        totalOwed,
        paymentProgress: totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 100,
        nextInstallment: nextInstallment ? {
          id: nextInstallment.id,
          amount: nextInstallment.amount,
          dueDate: nextInstallment.dueDate,
          installmentNumber: nextInstallment.installmentNumber,
          totalInstallments: nextInstallment.totalInstallments,
          course: nextInstallment.enrollment?.course || null,
        } : null,
        overdueCount,
      },
      enrollments,
      tickets,
      upcomingSchedules,
      schedules: formattedSchedules,
      scheduleGroupedByDay: groupedByDay,
      recentExercises,
      recommendations,
    });
  } catch (error) {
    console.error("[STUDENT_DASHBOARD]", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
