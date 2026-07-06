import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/workshops/[id]
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const workshop = await db.workshop.findUnique({
      where: { id },
      include: {
        branch: { select: { nameFa: true, nameEn: true, addressFa: true, addressEn: true } },
        tickets: {
          where: { status: { in: ["reserved", "paid"] } },
          select: { id: true, seatNumber: true, status: true },
        },
      },
    });

    if (!workshop) {
      return NextResponse.json({ error: "Workshop not found" }, { status: 404 });
    }

    return NextResponse.json(workshop);
  } catch (error) {
    console.error("[WORKSHOP_GET]", error);
    return NextResponse.json({ error: "Failed to fetch workshop" }, { status: 500 });
  }
}

// PUT /api/workshops/[id] — update workshop (admin only)
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getSession();
    if (!session || session.userType !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();

    const existing = await db.workshop.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Workshop not found" }, { status: 404 });
    }

    const updated = await db.workshop.update({
      where: { id },
      data: {
        ...(body.titleFa !== undefined && { titleFa: body.titleFa }),
        ...(body.titleEn !== undefined && { titleEn: body.titleEn }),
        ...(body.descriptionFa !== undefined && { descriptionFa: body.descriptionFa || null }),
        ...(body.descriptionEn !== undefined && { descriptionEn: body.descriptionEn || null }),
        ...(body.instructorFa !== undefined && { instructorFa: body.instructorFa }),
        ...(body.instructorEn !== undefined && { instructorEn: body.instructorEn }),
        ...(body.date !== undefined && { date: new Date(body.date) }),
        ...(body.startTime !== undefined && { startTime: body.startTime || null }),
        ...(body.endTime !== undefined && { endTime: body.endTime || null }),
        ...(body.price !== undefined && { price: body.price || null }),
        ...(body.discountPrice !== undefined && { discountPrice: body.discountPrice || null }),
        ...(body.totalSeats !== undefined && { totalSeats: body.totalSeats }),
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl || null }),
        ...(body.coverUrl !== undefined && { coverUrl: body.coverUrl || null }),
        ...(body.category !== undefined && { category: body.category || null }),
        ...(body.locationFa !== undefined && { locationFa: body.locationFa || null }),
        ...(body.locationEn !== undefined && { locationEn: body.locationEn || null }),
        ...(body.requirementsFa !== undefined && { requirementsFa: body.requirementsFa || null }),
        ...(body.requirementsEn !== undefined && { requirementsEn: body.requirementsEn || null }),
        ...(body.highlightsFa !== undefined && { highlightsFa: body.highlightsFa || null }),
        ...(body.highlightsEn !== undefined && { highlightsEn: body.highlightsEn || null }),
        ...(body.contactPhone !== undefined && { contactPhone: body.contactPhone || null }),
        ...(body.registrationDeadline !== undefined && { registrationDeadline: body.registrationDeadline ? new Date(body.registrationDeadline) : null }),
        ...(body.isHot !== undefined && { isHot: body.isHot }),
        ...(body.isPublished !== undefined && { isPublished: body.isPublished }),
        ...(body.branchId !== undefined && { branchId: body.branchId || null }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[WORKSHOP_PUT]", error);
    return NextResponse.json({ error: "Failed to update workshop" }, { status: 500 });
  }
}

// DELETE /api/workshops/[id]
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getSession();
    if (!session || session.userType !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await context.params;
    const existing = await db.workshop.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Workshop not found" }, { status: 404 });
    }

    await db.workshop.delete({ where: { id } });
    return NextResponse.json({ message: "Workshop deleted" });
  } catch (error) {
    console.error("[WORKSHOP_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete workshop" }, { status: 500 });
  }
}
