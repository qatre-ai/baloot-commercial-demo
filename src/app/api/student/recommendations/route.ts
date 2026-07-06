import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";

// GET /api/student/recommendations — Get personalized recommendations
export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Allow both students and instructors

    const now = new Date();

    // Get student's enrolled courses
    const enrollments = await db.courseEnrollment.findMany({
      where: { studentId: session.userId },
      select: {
        courseId: true,
        course: {
          select: { instrument: true, category: true },
        },
      },
    });

    const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));
    const instruments = [
      ...new Set(
        enrollments
          .map((e) => e.course.instrument)
          .filter(Boolean) as string[]
      ),
    ];
    const categories = [
      ...new Set(
        enrollments
          .map((e) => e.course.category)
          .filter(Boolean) as string[]
      ),
    ];

    // Get student's registered workshops
    const tickets = await db.workshopTicket.findMany({
      where: { studentId: session.userId },
      select: { workshopId: true },
    });
    const registeredWorkshopIds = new Set(tickets.map((t) => t.workshopId));

    // Build recommendation criteria
    const courseOrConditions: Record<string, unknown>[] = [];

    if (instruments.length > 0) {
      courseOrConditions.push({ instrument: { in: instruments } });
    }
    if (categories.length > 0) {
      courseOrConditions.push({ category: { in: categories } });
    }

    // If no enrollments, recommend featured courses
    if (courseOrConditions.length === 0) {
      courseOrConditions.push({ isFeatured: true });
    }

    // Find recommended courses
    const recommendedCourses = await db.course.findMany({
      where: {
        isPublished: true,
        id: { notIn: [...enrolledCourseIds] },
        OR: courseOrConditions,
      },
      include: {
        branch: { select: { nameFa: true, nameEn: true } },
      },
      take: 3,
    });

    // Find recommended workshops (upcoming, not registered, similar categories)
    const workshopOrConditions: Record<string, unknown>[] = [];

    if (categories.length > 0) {
      workshopOrConditions.push({ category: { in: categories } });
    }

    // Always include upcoming workshops if few category matches
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
      orderBy: [
        { isHot: "desc" },
        { date: "asc" },
      ],
      take: 3,
    });

    // Combine and limit to 6
    const recommendations = [
      ...recommendedCourses.map((c) => ({
        type: "course" as const,
        data: c,
      })),
      ...recommendedWorkshops.map((w) => ({
        type: "workshop" as const,
        data: w,
      })),
    ].slice(0, 6);

    return NextResponse.json({
      recommendations,
      basedOn: {
        instruments,
        categories,
      },
    });
  } catch (error) {
    console.error("[STUDENT_RECOMMENDATIONS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}
