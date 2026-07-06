import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/courses — public: fetch published courses for landing page
export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams;
    const all = url.get("all") === "true";

    const courses = await db.course.findMany({
      where: all ? {} : { isPublished: true },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        titleFa: true,
        titleEn: true,
        descriptionFa: true,
        descriptionEn: true,
        category: true,
        instrument: true,
        level: true,
        duration: true,
        sessionsMin: true,
        sessionsMax: true,
        price: true,
        imageUrl: true,
        coverUrl: true,
        isPublished: true,
        isFeatured: true,
        isShowOnHome: true,
        isNew: true,
        branchId: true,
        instructorId: true,
        createdAt: true,
        updatedAt: true,
        instructor: {
          select: { id: true, name: true, specialtyFa: true, specialtyEn: true, avatarUrl: true },
        },
        branch: {
          select: { id: true, nameFa: true, nameEn: true },
        },
        _count: { select: { enrollments: true } },
      },
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error("[COURSES_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
