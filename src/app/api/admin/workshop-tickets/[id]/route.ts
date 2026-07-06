import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/admin/workshop-tickets/[id] - Get single ticket details
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const auth = await requireAdmin(request, "workshops", "read");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await context.params;

    const ticket = await db.workshopTicket.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true, name: true, email: true, phone: true,
            primaryInstrument: true, registrationInstrument: true,
          },
        },
        workshop: {
          select: {
            id: true, titleFa: true, titleEn: true,
            date: true, startTime: true, endTime: true,
            price: true, discountPrice: true,
            totalSeats: true, reservedSeats: true,
            locationFa: true, locationEn: true,
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("[ADMIN_WORKSHOP_TICKET_GET]", error);
    return NextResponse.json({ error: "Failed to get ticket" }, { status: 500 });
  }
}

// PUT /api/admin/workshop-tickets/[id] - Update ticket status
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  const auth = await requireAdmin(request, "workshops", "update");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await context.params;

    const existing = await db.workshopTicket.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, name: true } },
        workshop: { select: { id: true, titleFa: true, reservedSeats: true, totalSeats: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const body = await request.json();
    const allowedFields = ["status", "paymentRef", "amount", "seatNumber"];
    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field] === "" ? null : body[field];
      }
    }

    // Validate status
    if (body.status) {
      const validStatuses = ["reserved", "paid", "cancelled", "attended"];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }

      // If changing to paid, set paidAt
      if (body.status === "paid" && existing.status !== "paid") {
        updateData.paidAt = new Date();
      }
      // If changing away from paid, clear paidAt
      if (body.status !== "paid" && existing.status === "paid") {
        updateData.paidAt = null;
      }

      // Handle reservedSeats: increment/decrement on workshop
      const oldStatus = existing.status;
      const newStatus = body.status;
      const wasActive = oldStatus === "reserved" || oldStatus === "paid";
      const isActive = newStatus === "reserved" || newStatus === "paid";

      if (wasActive && !isActive) {
        // Decrease reserved seats
        await db.workshop.update({
          where: { id: existing.workshopId },
          data: { reservedSeats: { decrement: 1 } },
        });
      } else if (!wasActive && isActive) {
        // Increase reserved seats
        await db.workshop.update({
          where: { id: existing.workshopId },
          data: { reservedSeats: { increment: 1 } },
        });
      }
    }

    const ticket = await db.workshopTicket.update({
      where: { id },
      data: updateData,
      include: {
        student: { select: { id: true, name: true, email: true, phone: true } },
        workshop: { select: { id: true, titleFa: true, titleEn: true, date: true } },
      },
    });

    // Audit log
    await writeAuditLog({
      adminId: auth.admin.id,
      action: "update",
      entity: "workshop_ticket",
      entityId: id,
      entityName: `${existing.student.name} → ${existing.workshop.titleFa}`,
      details: {
        before: { status: existing.status },
        after: { status: ticket.status },
        changes: Object.keys(updateData),
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "info",
    });

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("[ADMIN_WORKSHOP_TICKET_UPDATE]", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}
