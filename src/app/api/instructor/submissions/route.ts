import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";

// GET /api/instructor/submissions - List submissions for instructor's exercises
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
    const url = request.nextUrl.searchParams;
    const status = url.get("status"); // assigned | submitted | graded | late
    const exerciseId = url.get("exerciseId");
    const courseId = url.get("courseId");
    const limit = Math.min(parseInt(url.get("limit") || "50"), 200);
    const offset = parseInt(url.get("offset") || "0");

    // Build where clause
    const where: any = {
      exercise: { instructorId },
    };

    if (status) {
      const validStatuses = ["assigned", "submitted", "graded", "late"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }
      where.status = status;
    }
    if (exerciseId) where.exerciseId = exerciseId;
    if (courseId) {
      where.exercise = { instructorId, courseId };
    }

    const [submissions, total] = await Promise.all([
      db.studentExercise.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { submittedAt: { sort: "desc", nulls: "last" } },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatarUrl: true,
              primaryInstrument: true,
            },
          },
          exercise: {
            select: {
              id: true,
              titleFa: true,
              titleEn: true,
              type: true,
              difficulty: true,
              dueDate: true,
              courseId: true,
              course: {
                select: {
                  id: true,
                  titleFa: true,
                  titleEn: true,
                  instrument: true,
                },
              },
            },
          },
        },
      }),
      db.studentExercise.count({ where }),
    ]);

    // Stats
    const [pendingCount, gradedCount] = await Promise.all([
      db.studentExercise.count({
        where: {
          exercise: { instructorId },
          status: "submitted",
        },
      }),
      db.studentExercise.count({
        where: {
          exercise: { instructorId },
          status: "graded",
        },
      }),
    ]);

    return NextResponse.json({
      submissions,
      total,
      stats: {
        pending: pendingCount,
        graded: gradedCount,
      },
    });
  } catch (error) {
    console.error("[INSTRUCTOR_SUBMISSIONS_LIST]", error);
    return NextResponse.json(
      { error: "Failed to list submissions" },
      { status: 500 }
    );
  }
}

// PATCH /api/instructor/submissions - Grade/review submission
export async function PATCH(request: NextRequest) {
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
    const body = await request.json();
    const { submissionId, grade, feedback, status } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: "Submission ID is required" },
        { status: 400 }
      );
    }

    const existing = await db.studentExercise.findUnique({
      where: { id: submissionId },
      include: {
        exercise: {
          select: { instructorId: true, titleFa: true, titleEn: true },
        },
        student: {
          select: { name: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Verify this instructor owns the exercise
    if (existing.exercise.instructorId !== instructorId) {
      return NextResponse.json(
        { error: "You can only review submissions for your own exercises" },
        { status: 403 }
      );
    }

    // Build update data - using StudentExercise fields
    const updateData: Record<string, unknown> = {};

    if (grade !== undefined) {
      // Use parseFloat to preserve decimal grades; clamp to [0, 100]
      const parsedGrade = parseFloat(String(grade));
      if (isNaN(parsedGrade)) {
        return NextResponse.json(
          { error: "grade must be a number" },
          { status: 400 }
        );
      }
      updateData.grade = Math.max(0, Math.min(100, parsedGrade));
      updateData.gradedAt = new Date();
    }
    if (feedback !== undefined) {
      updateData.feedback = typeof feedback === "string" ? feedback : String(feedback || "");
    }
    if (status) {
      // Allow instructors to: grade a submission, or revert to "submitted" (re-grade later)
      // "late" is auto-set by due-date logic, not by instructors manually
      const validStatuses = ["graded", "submitted"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }
      updateData.status = status;
      if (status === "graded") {
        updateData.gradedAt = new Date();
      }
    } else if (grade !== undefined) {
      // If grade is provided without status, auto-set to "graded"
      updateData.status = "graded";
      updateData.gradedAt = new Date();
    }

    const submission = await db.studentExercise.update({
      where: { id: submissionId },
      data: updateData,
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
        exercise: {
          select: { id: true, titleFa: true, titleEn: true },
        },
      },
    });

    return NextResponse.json({ submission });
  } catch (error) {
    console.error("[INSTRUCTOR_SUBMISSION_UPDATE]", error);
    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 }
    );
  }
}
