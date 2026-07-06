import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin,
  requireSuperAdmin,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/admin/workshops-data/[id] - Get single workshop with details
export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(_request, "workshops", "read");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const workshop = await db.workshop.findUnique({
      where: { id },
      include: {
        branch: {
          select: { id: true, nameFa: true, nameEn: true, addressFa: true, addressEn: true },
        },
        tickets: {
          select: {
            id: true,
            status: true,
            seatNumber: true,
            amount: true,
            createdAt: true,
            student: {
              select: { id: true, name: true, email: true, phone: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { tickets: true },
        },
      },
    });

    if (!workshop) {
      return NextResponse.json({ error: "Workshop not found" }, { status: 404 });
    }

    // Compute ticket stats
    const reservedTickets = workshop.tickets.filter((t) => t.status === "reserved").length;
    const paidTickets = workshop.tickets.filter((t) => t.status === "paid").length;
    const cancelledTickets = workshop.tickets.filter((t) => t.status === "cancelled").length;
    const attendedTickets = workshop.tickets.filter((t) => t.status === "attended").length;

    return NextResponse.json({
      workshop,
      ticketStats: {
        reserved: reservedTickets,
        paid: paidTickets,
        cancelled: cancelledTickets,
        attended: attendedTickets,
        total: workshop.tickets.length,
      },
    });
  } catch (error) {
    console.error("[WORKSHOP_GET]", error);
    return NextResponse.json({ error: "Failed to get workshop" }, { status: 500 });
  }
}

// PUT /api/admin/workshops-data/[id] - Update a workshop
export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request, "workshops", "update");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const body = await request.json();
    const existing = await db.workshop.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Workshop not found" }, { status: 404 });
    }

    // reservedSeats is intentionally NOT in this list — it must only be
    // mutated by the ticket purchase/cancel flow to avoid data corruption.
    const allowedFields = [
      "titleFa", "titleEn", "descriptionFa", "descriptionEn",
      "instructorFa", "instructorEn", "date", "startTime", "endTime",
      "price", "discountPrice", "totalSeats",
      "imageUrl", "coverUrl", "category", "locationFa", "locationEn",
      "requirementsFa", "requirementsEn", "highlightsFa", "highlightsEn",
      "contactPhone", "registrationDeadline",
      "isHot", "isFeatured", "isShowOnHome", "isNew", "isPublished",
      "branchId", "registrationOpen", "registrationOpenAt", "registrationCloseAt",
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field] === "" ? null : body[field];
      }
    }

    // If client tried to send reservedSeats, ignore it (don't error — be lenient on input)
    if (body.reservedSeats !== undefined) {
      delete body.reservedSeats;
    }

    // Handle numeric fields — use NaN check instead of || fallback
    for (const numField of ["price", "discountPrice", "totalSeats"]) {
      if (updateData[numField] !== undefined && updateData[numField] !== null) {
        const parsed = parseInt(String(updateData[numField]));
        if (isNaN(parsed) || parsed < 0) {
          return NextResponse.json(
            { error: `${numField} must be a non-negative integer` },
            { status: 400 }
          );
        }
        updateData[numField] = parsed;
      }
    }

    // Validate totalSeats >= reservedSeats (cannot shrink below what's sold)
    if (updateData.totalSeats !== undefined && updateData.totalSeats !== null) {
      const newTotal = Number(updateData.totalSeats);
      if (newTotal < existing.reservedSeats) {
        return NextResponse.json(
          {
            error: `totalSeats (${newTotal}) cannot be less than already reserved seats (${existing.reservedSeats})`,
          },
          { status: 400 }
        );
      }
    }

    // Validate price/discountPrice relationship
    if (
      updateData.price !== undefined &&
      updateData.discountPrice !== undefined &&
      updateData.price !== null &&
      updateData.discountPrice !== null &&
      Number(updateData.discountPrice) >= Number(updateData.price)
    ) {
      return NextResponse.json(
        { error: "discountPrice must be less than price" },
        { status: 400 }
      );
    }

    // Handle date fields with validation
    for (const dateField of ["date", "registrationDeadline", "registrationOpenAt", "registrationCloseAt"]) {
      if (updateData[dateField]) {
        const d = new Date(updateData[dateField] as string);
        if (isNaN(d.getTime())) {
          return NextResponse.json(
            { error: `Invalid ${dateField} format` },
            { status: 400 }
          );
        }
        updateData[dateField] = d;
      }
    }

    // Validate registrationDeadline < date
    const finalDate = updateData.date ? (updateData.date as Date) : existing.date;
    const finalDeadline = updateData.registrationDeadline
      ? (updateData.registrationDeadline as Date)
      : existing.registrationDeadline;
    if (finalDate && finalDeadline && finalDeadline >= finalDate) {
      return NextResponse.json(
        { error: "registrationDeadline must be before the workshop date" },
        { status: 400 }
      );
    }

    const workshop = await db.workshop.update({
      where: { id },
      data: updateData,
    });

    await writeAuditLog({
      adminId: auth.admin.id,
      action: "update",
      entity: "workshop",
      entityId: id,
      entityName: workshop.titleFa,
      details: { changes: Object.keys(updateData) },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "info",
    });

    return NextResponse.json({ workshop });
  } catch (error) {
    console.error("[WORKSHOP_UPDATE]", error);
    return NextResponse.json({ error: "Failed to update workshop" }, { status: 500 });
  }
}

// DELETE /api/admin/workshops-data/[id] - Delete a workshop (super_admin only)
export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    // Check if workshop exists first
    const existing = await db.workshop.findUnique({
      where: { id },
      include: { _count: { select: { tickets: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Workshop not found" }, { status: 404 });
    }

    // Check for active tickets (reserved or paid)
    const activeTickets = await db.workshopTicket.count({
      where: {
        workshopId: id,
        status: { in: ["reserved", "paid"] },
      },
    });

    if (activeTickets > 0) {
      return NextResponse.json(
        { error: "Cannot delete workshop with active tickets. Cancel tickets first.", activeTickets },
        { status: 409 }
      );
    }

    // Cascade: also cancel any pending payments associated with this workshop's tickets
    await db.$transaction(async (tx) => {
      // Cancel any pending payments linked to tickets of this workshop
      const ticketIds = await tx.workshopTicket.findMany({
        where: { workshopId: id },
        select: { id: true },
      });
      if (ticketIds.length > 0) {
        await tx.payment.updateMany({
          where: { ticketId: { in: ticketIds.map((t) => t.id) }, status: "pending" },
          data: { status: "cancelled" },
        });
      }

      await tx.workshop.delete({ where: { id } });
    });

    await writeAuditLog({
      adminId: auth.admin.id,
      action: "delete",
      entity: "workshop",
      entityId: id,
      entityName: existing.titleFa,
      details: { titleEn: existing.titleEn, totalTickets: existing._count.tickets },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "critical",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[WORKSHOP_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete workshop" }, { status: 500 });
  }
}
