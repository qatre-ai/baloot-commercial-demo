import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";

// GET /api/admin/workshop-tickets - List all workshop tickets with filters
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, "workshops", "read");
  if (!auth.ok) return auth.response;

  try {
    const url = request.nextUrl.searchParams;
    const search = url.get("search");
    const status = url.get("status");
    const workshopId = url.get("workshopId");
    const studentId = url.get("studentId");
    const registrationMethod = url.get("registrationMethod");
    const limit = Math.min(parseInt(url.get("limit") || "100"), 200);
    const offset = parseInt(url.get("offset") || "0");

    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (workshopId) where.workshopId = workshopId;
    if (studentId) where.studentId = studentId;
    if (registrationMethod) where.registrationMethod = registrationMethod;

    if (search) {
      where.OR = [
        { student: { name: { contains: search } } },
        { student: { email: { contains: search } } },
        { student: { phone: { contains: search } } },
        { workshop: { titleFa: { contains: search } } },
        { workshop: { titleEn: { contains: search } } },
      ];
    }

    const [tickets, total] = await Promise.all([
      db.workshopTicket.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              primaryInstrument: true,
            },
          },
          workshop: {
            select: {
              id: true,
              titleFa: true,
              titleEn: true,
              date: true,
              startTime: true,
              endTime: true,
              price: true,
              discountPrice: true,
              totalSeats: true,
              reservedSeats: true,
              isHot: true,
              locationFa: true,
              locationEn: true,
            },
          },
        },
      }),
      db.workshopTicket.count({ where }),
    ]);

    // Summary stats
    const totalReserved = await db.workshopTicket.count({ where: { status: "reserved" } });
    const totalPaid = await db.workshopTicket.count({ where: { status: "paid" } });
    const totalCancelled = await db.workshopTicket.count({ where: { status: "cancelled" } });
    const totalAttended = await db.workshopTicket.count({ where: { status: "attended" } });

    return NextResponse.json({
      tickets,
      total,
      stats: { reserved: totalReserved, paid: totalPaid, cancelled: totalCancelled, attended: totalAttended },
    });
  } catch (error) {
    console.error("[ADMIN_WORKSHOP_TICKETS_LIST]", error);
    return NextResponse.json({ error: "Failed to list workshop tickets" }, { status: 500 });
  }
}
