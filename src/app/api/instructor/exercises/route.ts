import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";

// GET /api/instructor/exercises — List exercises created by this instructor
export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session || session.role !== "instructor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const instructorId = session.userId;

  try {
    const url = request.nextUrl.searchParams;
    const courseId = url.get("courseId");
    const type = url.get("type");
    const isPublished = url.get("isPublished");
    const limit = Math.min(parseInt(url.get("limit") || "50"), 200);
    const offset = parseInt(url.get("offset") || "0");

    const where: Record<string, unknown> = { instructorId };
    if (courseId) where.courseId = courseId;
    if (type) where.type = type;
    if (isPublished !== null && isPublished !== undefined && isPublished !== "") {
      where.isPublished = isPublished === "true";
    }

    const [exercises, total] = await Promise.all([
      db.exercise.findMany({
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
          _count: {
            select: { submissions: true },
          },
          submissions: {
            select: { status: true },
          },
        },
      }),
      db.exercise.count({ where }),
    ]);

    // Add submission stats to each exercise
    const exercisesWithStats = exercises.map((exercise) => {
      const submissions = exercise.submissions;
      const submitted = submissions.filter((s) => s.status === "submitted").length;
      const graded = submissions.filter((s) => s.status === "graded").length;
      const late = submissions.filter((s) => s.status === "late").length;
      const assigned = submissions.filter((s) => s.status === "assigned").length;

      return {
        id: exercise.id,
        titleFa: exercise.titleFa,
        titleEn: exercise.titleEn,
        descriptionFa: exercise.descriptionFa,
        descriptionEn: exercise.descriptionEn,
        type: exercise.type,
        difficulty: exercise.difficulty,
        courseId: exercise.courseId,
        instructorId: exercise.instructorId,
        dueDate: exercise.dueDate,
        isPublished: exercise.isPublished,
        createdAt: exercise.createdAt,
        updatedAt: exercise.updatedAt,
        course: exercise.course,
        _count: exercise._count,
        submissionStats: {
          total: submissions.length,
          submitted,
          graded,
          late,
          assigned,
        },
      };
    });

    return NextResponse.json({ exercises: exercisesWithStats, total });
  } catch (error) {
    console.error("[INSTRUCTOR_EXERCISES_LIST]", error);
    return NextResponse.json(
      { error: "Failed to list exercises" },
      { status: 500 }
    );
  }
}

// POST /api/instructor/exercises — Create new exercise for a course
export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session || session.role !== "instructor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const instructorId = session.userId;

  try {
    const body = await request.json();
    const {
      titleFa,
      titleEn,
      courseId,
      descriptionFa,
      descriptionEn,
      type,
      difficulty,
      dueDate,
    } = body;

    // Validate required fields
    if (!titleFa) {
      return NextResponse.json(
        { error: "titleFa is required" },
        { status: 400 }
      );
    }
    if (!titleEn) {
      return NextResponse.json(
        { error: "titleEn is required" },
        { status: 400 }
      );
    }
    if (!courseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );
    }

    // Validate exercise type
    const validTypes = ["practice", "theory", "performance", "composition"];
    if (type && !validTypes.includes(type)) {
      return NextResponse.json(
        { error: `type must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate difficulty
    const validDifficulties = ["beginner", "intermediate", "advanced"];
    if (difficulty && !validDifficulties.includes(difficulty)) {
      return NextResponse.json(
        { error: `difficulty must be one of: ${validDifficulties.join(", ")}` },
        { status: 400 }
      );
    }

    // Verify course exists and belongs to this instructor
    const course = await db.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    if (course.instructorId !== instructorId) {
      return NextResponse.json(
        { error: "You are not assigned to this course" },
        { status: 403 }
      );
    }

    const exercise = await db.exercise.create({
      data: {
        titleFa,
        titleEn,
        courseId,
        instructorId,
        descriptionFa: descriptionFa || null,
        descriptionEn: descriptionEn || null,
        type: type || "practice",
        difficulty: difficulty || "beginner",
        dueDate: dueDate ? new Date(dueDate) : null,
        isPublished: false, // Default to draft
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
      },
    });

    return NextResponse.json({ exercise }, { status: 201 });
  } catch (error) {
    console.error("[INSTRUCTOR_EXERCISE_CREATE]", error);
    return NextResponse.json(
      { error: "Failed to create exercise" },
      { status: 500 }
    );
  }
}
