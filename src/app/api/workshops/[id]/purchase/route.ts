import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/workshops/[id]/purchase — Reserve a workshop ticket (online registration)
// No payment required - just reserves a seat. Admin will be notified.
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }

    const { id } = await context.params;
    
    // Parse optional body for additional notes
    let body: { notes?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional
    }

    const workshop = await db.workshop.findUnique({
      where: { id },
      include: {
        tickets: {
          where: { status: { in: ["reserved", "paid"] } },
        },
      },
    });

    if (!workshop) {
      return NextResponse.json({ error: "Workshop not found" }, { status: 404 });
    }

    if (!workshop.isPublished) {
      return NextResponse.json({ error: "Workshop not available" }, { status: 400 });
    }

    // Check if registration is open
    if (!workshop.registrationOpen) {
      return NextResponse.json(
        { error: "Registration for this workshop is currently closed" },
        { status: 400 }
      );
    }

    // Check registration timeframe
    const now = new Date();
    if (workshop.registrationOpenAt && now < workshop.registrationOpenAt) {
      return NextResponse.json(
        { error: "Registration has not opened yet" },
        { status: 400 }
      );
    }
    if (workshop.registrationCloseAt && now > workshop.registrationCloseAt) {
      return NextResponse.json(
        { error: "Registration period has ended" },
        { status: 400 }
      );
    }

    if (workshop.reservedSeats >= workshop.totalSeats) {
      return NextResponse.json({ error: "No seats available" }, { status: 400 });
    }

    // Check if already purchased
    const existingTicket = await db.workshopTicket.findUnique({
      where: {
        studentId_workshopId: {
          studentId: session.userId,
          workshopId: id,
        },
      },
    });

    if (existingTicket) {
      return NextResponse.json({ error: "Already registered" }, { status: 409 });
    }

    // Get student info for admin notification
    const student = await db.student.findUnique({
      where: { id: session.userId },
      select: { name: true, phone: true, email: true },
    });

    // Determine ticket amount (discount price if available)
    const ticketAmount = workshop.discountPrice || workshop.price;

    // Create ticket and increment reserved seats, then notify admins
    const ticket = await db.$transaction(async (tx) => {
      const newTicket = await tx.workshopTicket.create({
        data: {
          studentId: session.userId,
          workshopId: id,
          status: "reserved",
          amount: ticketAmount,
          seatNumber: workshop.reservedSeats + 1,
          registrationMethod: "online",
        },
      });

      await tx.workshop.update({
        where: { id },
        data: { reservedSeats: { increment: 1 } },
      });

      // Notify all admins about the new reservation
      const admins = await tx.admin.findMany({
        where: { isActive: true },
        select: { id: true },
      });

      if (admins.length > 0 && student) {
        const workshopTitle = workshop.titleFa;
        const studentName = student.name;
        const studentPhone = student.phone || "بدون شماره";
        
        await tx.adminMessage.createMany({
          data: admins.map(admin => ({
            senderId: admin.id, // System message - sender is same as recipient
            recipientId: admin.id,
            subject: `رزرو کارگاه جدید: ${workshopTitle}`,
            content: `هنرجوی ${studentName} (شماره: ${studentPhone}) در کارگاه "${workshopTitle}" ثبت‌نام کرد.${body.notes ? ` یادداشت: ${body.notes}` : ""} لطفاً برای پیگیری و تایید نهایی اقدام کنید.`,
            priority: "high",
            isSystemMessage: true,
          })),
        });
      }

      return newTicket;
    });

    return NextResponse.json({ 
      ticket,
      message: "ثبت‌نام شما با موفقیت انجام شد و به زودی همکاران ما با شما تماس خواهند گرفت"
    }, { status: 201 });
  } catch (error) {
    console.error("[WORKSHOP_PURCHASE]", error);
    return NextResponse.json({ error: "Failed to reserve ticket" }, { status: 500 });
  }
}
