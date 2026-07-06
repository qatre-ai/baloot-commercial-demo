import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";

// PATCH /api/instructor/exercises/[id] — Update exercise (publish, edit, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(request);
  if (!session || session.role !== "instructor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const instructorId = session.userId;

  try {
    const { id } = await params;
    const body = await request.json();

    // Verify exercise exists and belongs to this instructor
    const existing = await db.exercise.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }
    if (existing.instructorId !== instructorId) {
      return NextResponse.json(
        { error: "You can only edit your own exercises" },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (body.titleFa !== undefined) updateData.titleFa = body.titleFa;
    if (body.titleEn !== undefined) updateData.titleEn = body.titleEn;
    if (body.descriptionFa !== undefined) updateData.descriptionFa = body.descriptionFa;
    if (body.descriptionEn !== undefined) updateData.descriptionEn = body.descriptionEn;
    if (body.type !== undefined) {
      const validTypes = ["practice", "theory", "performance", "composition"];
      if (!validTypes.includes(body.type)) {
        return NextResponse.json(
          { error: `type must be one of: ${validTypes.join(", ")}` },
          { status: 400 }
        );
      }
      updateData.type = body.type;
    }
    if (body.difficulty !== undefined) {
      const validDifficulties = ["beginner", "intermediate", "advanced"];
      if (!validDifficulties.includes(body.difficulty)) {
        return NextResponse.json(
          { error: `difficulty must be one of: ${validDifficulties.join(", ")}` },
          { status: 400 }
        );
      }
      updateData.difficulty = body.difficulty;
    }
    if (body.dueDate !== undefined) {
      updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    }
    if (body.isPublished !== undefined) {
      updateData.isPublished = body.isPublished;
    }
    if (body.courseId !== undefined) {
      // Verify the new course belongs to this instructor
      const course = await db.course.findUnique({ where: { id: body.courseId } });
      if (!course) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
      }
      if (course.instructorId !== instructorId) {
        return NextResponse.json(
          { error: "You are not assigned to this course" },
          { status: 403 }
        );
      }
      updateData.courseId = body.courseId;
    }

    const updated = await db.exercise.update({
      where: { id },
      data: updateData,
      include: {
        course: {
          select: {
            id: true,
            titleFa: true,
            titleEn: true,
            instrument: true,
          },
        },
        _count: {
          select: { submissions: true },
        },
      },
    });

    return NextResponse.json({ exercise: updated });
  } catch (error) {
    console.error("[INSTRUCTOR_EXERCISE_UPDATE]", error);
    return NextResponse.json(
      { error: "Failed to update exercise" },
      { status: 500 }
    );
  }
}
