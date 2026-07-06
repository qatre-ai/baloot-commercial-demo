import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

// GET /api/workshops — fetch published workshops
export async function GET() {
  try {
    const workshops = await db.workshop.findMany({
      where: { isPublished: true },
      orderBy: [{ isHot: "desc" }, { date: "asc" }],
      include: {
        branch: {
          select: { nameFa: true, nameEn: true, addressFa: true, addressEn: true },
        },
      },
    });

    return NextResponse.json(workshops);
  } catch (error) {
    console.error("[WORKSHOPS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch workshops" },
      { status: 500 }
    );
  }
}

// POST /api/workshops — create a new workshop (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.userType !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const {
      titleFa, titleEn, descriptionFa, descriptionEn,
      instructorFa, instructorEn, date, startTime, endTime,
      price, discountPrice, totalSeats, imageUrl, coverUrl,
      category, locationFa, locationEn, requirementsFa,
      requirementsEn, highlightsFa, highlightsEn, contactPhone,
      registrationDeadline, isHot, isPublished, branchId,
    } = body;

    if (!titleFa || !titleEn || !instructorFa || !instructorEn || !date) {
      return NextResponse.json(
        { error: "Required fields missing" },
        { status: 400 }
      );
    }

    const workshop = await db.workshop.create({
      data: {
        titleFa,
        titleEn,
        descriptionFa: descriptionFa ?? null,
        descriptionEn: descriptionEn ?? null,
        instructorFa,
        instructorEn,
        date: new Date(date),
        startTime: startTime ?? null,
        endTime: endTime ?? null,
        price: price ?? null,
        discountPrice: discountPrice ?? null,
        totalSeats: totalSeats ?? 30,
        imageUrl: imageUrl ?? null,
        coverUrl: coverUrl ?? null,
        category: category ?? null,
        locationFa: locationFa ?? null,
        locationEn: locationEn ?? null,
        requirementsFa: requirementsFa ?? null,
        requirementsEn: requirementsEn ?? null,
        highlightsFa: highlightsFa ?? null,
        highlightsEn: highlightsEn ?? null,
        contactPhone: contactPhone ?? null,
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
        isHot: isHot ?? false,
        isPublished: isPublished ?? false,
        branchId: branchId ?? null,
      },
    });

    return NextResponse.json(workshop, { status: 201 });
  } catch (error) {
    console.error("[WORKSHOPS_POST]", error);
    return NextResponse.json(
      { error: "Failed to create workshop" },
      { status: 500 }
    );
  }
}
