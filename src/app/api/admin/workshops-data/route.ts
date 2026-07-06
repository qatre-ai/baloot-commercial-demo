import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";

// GET /api/admin/workshops-data - List all workshops for admin
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, "workshops", "read");
  if (!auth.ok) return auth.response;

  try {
    const url = request.nextUrl.searchParams;
    const all = url.get("all") === "true";

    const workshops = await db.workshop.findMany({
      where: all ? {} : { isPublished: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        titleFa: true,
        titleEn: true,
        descriptionFa: true,
        descriptionEn: true,
        instructorFa: true,
        instructorEn: true,
        date: true,
        startTime: true,
        endTime: true,
        price: true,
        discountPrice: true,
        totalSeats: true,
        reservedSeats: true,
        imageUrl: true,
        coverUrl: true,
        category: true,
        locationFa: true,
        locationEn: true,
        isHot: true,
        isFeatured: true,
        isShowOnHome: true,
        isNew: true,
        isPublished: true,
        branchId: true,
        registrationOpen: true,
        registrationOpenAt: true,
        registrationCloseAt: true,
        registrationDeadline: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ workshops });
  } catch (error) {
    console.error("[ADMIN_WORKSHOPS]", error);
    return NextResponse.json({ error: "Failed to list workshops" }, { status: 500 });
  }
}

// POST /api/admin/workshops-data - Create a new workshop
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, "workshops", "create");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const {
      titleFa, titleEn, descriptionFa, descriptionEn,
      instructorFa, instructorEn, date, startTime, endTime,
      price, discountPrice, totalSeats, imageUrl, coverUrl,
      category, locationFa, locationEn,
      requirementsFa, requirementsEn, highlightsFa, highlightsEn,
      contactPhone, registrationDeadline,
      isHot, isFeatured, isShowOnHome, isPublished,
      branchId, registrationOpen, registrationOpenAt, registrationCloseAt,
    } = body;

    if (!titleFa || !titleEn || !instructorFa || !instructorEn || !date) {
      return NextResponse.json(
        { error: "titleFa, titleEn, instructorFa, instructorEn, and date are required" },
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
        price: price ? parseInt(String(price)) : null,
        discountPrice: discountPrice ? parseInt(String(discountPrice)) : null,
        totalSeats: totalSeats ? parseInt(String(totalSeats)) : 30,
        imageUrl: imageUrl ?? null,
        coverUrl: coverUrl ?? null,
        category: category ?? null,
        locationFa: locationFa ?? null,
        locationEn: locationEn ?? null,
        isHot: isHot ?? false,
        isFeatured: isFeatured ?? false,
        isShowOnHome: isShowOnHome ?? false,
        isNew: true,
        isPublished: isPublished ?? false,
        branchId: branchId ?? null,
        registrationOpen: registrationOpen ?? true,
        registrationOpenAt: registrationOpenAt ? new Date(registrationOpenAt) : null,
        registrationCloseAt: registrationCloseAt ? new Date(registrationCloseAt) : null,
        requirementsFa: requirementsFa ?? null,
        requirementsEn: requirementsEn ?? null,
        highlightsFa: highlightsFa ?? null,
        highlightsEn: highlightsEn ?? null,
        contactPhone: contactPhone ?? null,
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
      },
    });

    await writeAuditLog({
      adminId: auth.admin.id,
      action: "create",
      entity: "workshop",
      entityId: workshop.id,
      entityName: workshop.titleFa,
      details: { title: workshop.titleFa },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "info",
    });

    return NextResponse.json({ workshop }, { status: 201 });
  } catch (error) {
    console.error("[WORKSHOP_CREATE]", error);
    return NextResponse.json({ error: "Failed to create workshop" }, { status: 500 });
  }
}
