import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";

// POST /api/student/exercises/[id]/submit — Submit (or re-submit) an exercise
// StudentExercise model has: status, grade, feedback, submittedAt, gradedAt
// Re-submission preserves the existing instructor feedback/grade — students cannot wipe it.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "student") {
      return NextResponse.json({ error: "Only students can submit exercises" }, { status: 403 });
    }

    const { id: exerciseId } = await params;

    // Check if exercise exists and is published
    const exercise = await db.exercise.findUnique({
      where: { id: exerciseId },
    });

    if (!exercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }

    if (!exercise.isPublished) {
      return NextResponse.json(
        { error: "Exercise is not available" },
        { status: 400 }
      );
    }

    // Check if student is enrolled in the exercise's course
    if (exercise.courseId) {
      const enrollment = await db.courseEnrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: session.userId,
            courseId: exercise.courseId,
          },
        },
      });

      if (!enrollment || enrollment.status === "dropped") {
        return NextResponse.json(
          { error: "Not enrolled in this course" },
          { status: 403 }
        );
      }
    }

    // Parse optional body for any extra data
    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional for exercise submission
    }

    // Check if already submitted (StudentExercise model, unique on studentId+exerciseId)
    const existingSubmission = await db.studentExercise.findUnique({
      where: {
        studentId_exerciseId: {
          studentId: session.userId,
          exerciseId,
        },
      },
    });

    const isLate = !!(exercise.dueDate && new Date() > exercise.dueDate);

    if (existingSubmission) {
      // Re-submit: preserve instructor feedback/grade.
      // SECURITY: Students are NOT allowed to overwrite `feedback` or `grade` — those are
      // instructor-only fields set via /api/instructor/submissions PATCH.
      const updated = await db.studentExercise.update({
        where: { id: existingSubmission.id },
        data: {
          status: isLate ? "late" : "submitted",
          submittedAt: new Date(),
          // Note: grade and feedback are intentionally NOT touched here
          // Reset gradedAt to null so instructor knows it needs re-grading
          gradedAt: null,
        },
      });

      return NextResponse.json({
        ...updated,
        message: isLate
          ? "تمرین شما با موفقیت ارسال شد (با تأخیر). فیدبک استاد پس از بازبینی مجدد ثبت می‌شود."
          : "تمرین شما با موفقیت ارسال شد. فیدبک استاد پس از بازبینی مجدد ثبت می‌شود.",
      });
    }

    // Create new submission
    const submission = await db.studentExercise.create({
      data: {
        studentId: session.userId,
        exerciseId,
        status: isLate ? "late" : "submitted",
        submittedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        ...submission,
        message: isLate
          ? "تمرین شما با موفقیت ارسال شد (با تأخیر)."
          : "تمرین شما با موفقیت ارسال شد.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[STUDENT_EXERCISE_SUBMIT]", error);
    return NextResponse.json(
      { error: "Failed to submit exercise" },
      { status: 500 }
    );
  }
}
