import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";

// GET /api/student/exercises — Get exercises for courses the student is enrolled in
export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Allow both students and instructors (instructors can view exercises for their enrolled courses)

  const studentId = session.userId;

  try {
    const url = request.nextUrl.searchParams;
    const courseId = url.get("courseId");

    // Get student's enrolled course IDs
    const enrollments = await db.courseEnrollment.findMany({
      where: {
        studentId,
        status: { in: ["active", "paused"] },
      },
      select: { courseId: true },
    });

    const enrolledCourseIds = enrollments.map((e) => e.courseId);

    if (enrolledCourseIds.length === 0) {
      return NextResponse.json({ exercises: [], total: 0 });
    }

    // Build where clause
    const where: Record<string, unknown> = {
      courseId: { in: enrolledCourseIds },
      isPublished: true,
    };

    // Filter by specific course if provided
    if (courseId) {
      if (!enrolledCourseIds.includes(courseId)) {
        return NextResponse.json(
          { error: "Not enrolled in this course" },
          { status: 403 }
        );
      }
      where.courseId = courseId;
    }

    const exercises = await db.exercise.findMany({
      where,
      orderBy: [
        { courseId: "asc" },
        { createdAt: "desc" },
      ],
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
    });

    // Add submission status to each exercise
    const exercisesWithStatus = exercises.map((exercise) => {
      const submission = exercise.submissions.length > 0
        ? exercise.submissions[0]
        : null;

      return {
        id: exercise.id,
        titleFa: exercise.titleFa,
        titleEn: exercise.titleEn,
        descriptionFa: exercise.descriptionFa,
        descriptionEn: exercise.descriptionEn,
        type: exercise.type,
        difficulty: exercise.difficulty,
        courseId: exercise.courseId,
        dueDate: exercise.dueDate,
        isPublished: exercise.isPublished,
        createdAt: exercise.createdAt,
        updatedAt: exercise.updatedAt,
        course: exercise.course,
        submissionStatus: submission ? submission.status : "not_submitted",
        submission: submission,
      };
    });

    return NextResponse.json({
      exercises: exercisesWithStatus,
      total: exercisesWithStatus.length,
    });
  } catch (error) {
    console.error("[STUDENT_EXERCISES_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch exercises" },
      { status: 500 }
    );
  }
}
