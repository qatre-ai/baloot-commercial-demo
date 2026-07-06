import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";

const VALID_PAYMENT_METHODS = ["cash", "card", "transfer", "pos", "online", "cheque", "other"];
const VALID_PAYMENT_TYPES = ["full", "installment", "partial", "refund"];
const VALID_STATUSES = ["pending", "paid", "overdue", "cancelled", "failed", "refunded"];

// GET /api/admin/payments - List all payments with filters
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, "payments", "read");
  if (!auth.ok) return auth.response;

  try {
    const url = request.nextUrl.searchParams;
    const search = url.get("search");
    const status = url.get("status");
    const paymentType = url.get("paymentType");
    const paymentMethod = url.get("paymentMethod");
    const studentId = url.get("studentId");
    const enrollmentId = url.get("enrollmentId");
    const ticketId = url.get("ticketId");
    const installmentPlanId = url.get("installmentPlanId");
    const dateFrom = url.get("dateFrom");
    const dateTo = url.get("dateTo");
    const limit = Math.min(parseInt(url.get("limit") || "50"), 200);
    const offset = parseInt(url.get("offset") || "0");

    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (paymentType) where.paymentType = paymentType;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (studentId) where.studentId = studentId;
    if (enrollmentId) where.enrollmentId = enrollmentId;
    if (ticketId) where.ticketId = ticketId;
    if (installmentPlanId) where.installmentPlanId = installmentPlanId;

    if (dateFrom || dateTo) {
      const createdAt: Record<string, Date> = {};
      if (dateFrom) {
        const d = new Date(dateFrom);
        if (!isNaN(d.getTime())) createdAt.gte = d;
      }
      if (dateTo) {
        const d = new Date(dateTo);
        if (!isNaN(d.getTime())) createdAt.lte = d;
      }
      where.createdAt = createdAt;
    }

    if (search) {
      where.OR = [
        { paymentRef: { contains: search } },
        { notes: { contains: search } },
        { student: { name: { contains: search } } },
        { student: { email: { contains: search } } },
      ];
    }

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        include: {
          student: {
            select: { id: true, name: true, email: true, phone: true },
          },
          enrollment: {
            select: {
              id: true,
              status: true,
              paymentStatus: true,
              tuitionAmount: true,
              course: { select: { id: true, titleFa: true, titleEn: true, instrument: true, level: true } },
            },
          },
        },
      }),
      db.payment.count({ where }),
    ]);

    // Batch fetch ticket info for all payments that have ticketId (avoids N+1)
    const ticketIds = payments
      .map((p) => p.ticketId)
      .filter((t): t is string => !!t);
    const tickets = ticketIds.length > 0
      ? await db.workshopTicket.findMany({
          where: { id: { in: ticketIds } },
          select: {
            id: true,
            status: true,
            amount: true,
            workshop: { select: { id: true, titleFa: true, titleEn: true, date: true } },
          },
        })
      : [];
    const ticketMap = new Map(tickets.map((t) => [t.id, t]));

    const enrichedPayments = payments.map((payment) => ({
      ...payment,
      ticketInfo: payment.ticketId ? ticketMap.get(payment.ticketId) || null : null,
    }));

    // Summary stats — apply same filter (so UI shows consistent numbers with the list)
    const statsWhere = { ...where };
    const [paidAgg, pendingAgg, overdueAgg] = await Promise.all([
      db.payment.aggregate({ where: { ...statsWhere, status: "paid" }, _sum: { amount: true }, _count: true }),
      db.payment.aggregate({ where: { ...statsWhere, status: "pending" }, _sum: { amount: true }, _count: true }),
      db.payment.aggregate({ where: { ...statsWhere, status: "overdue" }, _sum: { amount: true }, _count: true }),
    ]);

    return NextResponse.json({
      payments: enrichedPayments,
      total,
      stats: {
        paid: { count: paidAgg._count, totalAmount: paidAgg._sum.amount || 0 },
        pending: { count: pendingAgg._count, totalAmount: pendingAgg._sum.amount || 0 },
        overdue: { count: overdueAgg._count, totalAmount: overdueAgg._sum.amount || 0 },
      },
    });
  } catch (error) {
    console.error("[PAYMENTS_LIST]", error);
    return NextResponse.json({ error: "Failed to list payments" }, { status: 500 });
  }
}

// POST /api/admin/payments - Create single payment or installment plan
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, "payments", "create");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const {
      studentId,
      amount,
      paymentType,
      paymentMethod,
      paymentRef,
      paidat,
      paidAt: paidAtAlias,
      dueDate,
      notes,
      enrollmentId,
      ticketId,
      // Installment fields (legacy single-installment)
      installmentNumber,
      totalInstallments,
      // For creating full installment plan at once
      createInstallmentPlan,
      totalAmount,
      numberOfInstallments,
      startDate,
    } = body;

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    // Validate paymentMethod enum if provided
    if (paymentMethod && !VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json(
        { error: `Invalid paymentMethod. Allowed: ${VALID_PAYMENT_METHODS.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate paymentType enum if provided
    if (paymentType && !VALID_PAYMENT_TYPES.includes(paymentType)) {
      return NextResponse.json(
        { error: `Invalid paymentType. Allowed: ${VALID_PAYMENT_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Verify student exists
    const student = await db.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // If enrollmentId provided, verify it exists and belongs to student
    if (enrollmentId) {
      const enrollment = await db.courseEnrollment.findUnique({ where: { id: enrollmentId } });
      if (!enrollment) {
        return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
      }
      if (enrollment.studentId !== studentId) {
        return NextResponse.json(
          { error: "Enrollment does not belong to this student" },
          { status: 400 }
        );
      }
    }

    // If ticketId provided, verify it exists and belongs to student
    if (ticketId) {
      const ticket = await db.workshopTicket.findUnique({ where: { id: ticketId } });
      if (!ticket) {
        return NextResponse.json({ error: "Workshop ticket not found" }, { status: 404 });
      }
      if (ticket.studentId && ticket.studentId !== studentId) {
        return NextResponse.json(
          { error: "Ticket does not belong to this student" },
          { status: 400 }
        );
      }
    }

    const paidAtValue = paidAtAlias ?? paidat;

    // Create installment plan: multiple Payment entries
    if (createInstallmentPlan) {
      // Validate numberOfInstallments range
      const installments = Number(numberOfInstallments);
      if (!Number.isInteger(installments) || installments < 2 || installments > 36) {
        return NextResponse.json(
          { error: "numberOfInstallments must be an integer between 2 and 36" },
          { status: 400 }
        );
      }
      const finalTotalAmount = Number(totalAmount);
      if (!totalAmount || !Number.isFinite(finalTotalAmount) || finalTotalAmount <= 0) {
        return NextResponse.json(
          { error: "totalAmount is required for installment plans and must be > 0" },
          { status: 400 }
        );
      }

      // SECURITY: always generate planId server-side, ignore any client-provided installmentPlanId
      const planId = `plan-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const installmentAmount = Math.ceil(finalTotalAmount / installments);

      // Wrap entire plan creation in a transaction so we don't leave orphan payments on partial failure
      const payments = await db.$transaction(async (tx) => {
        const created: any[] = [];
        for (let i = 1; i <= installments; i++) {
          // Last installment gets the remainder to avoid rounding gaps
          const thisAmount = i === installments
            ? finalTotalAmount - installmentAmount * (installments - 1)
            : installmentAmount;

          // Calculate due date for each installment (monthly intervals from startDate)
          let installmentDueDate: Date | null = null;
          if (startDate) {
            const d = new Date(startDate);
            if (!isNaN(d.getTime())) {
              d.setMonth(d.getMonth() + i - 1);
              installmentDueDate = d;
            }
          }

          const payment = await tx.payment.create({
            data: {
              studentId,
              amount: thisAmount,
              type: enrollmentId ? "course" : ticketId ? "workshop" : "other",
              paymentType: "installment",
              status: "pending",
              installmentNumber: i,
              totalInstallments: installments,
              installmentPlanId: planId,
              paymentMethod: paymentMethod || null,
              dueDate: installmentDueDate,
              notes: notes ? `${notes} (قسط ${i} از ${installments})` : `قسط ${i} از ${installments}`,
              enrollmentId: enrollmentId || null,
              ticketId: ticketId || null,
              receivedBy: auth.admin.id,
              createdBy: auth.admin.id,
            },
            include: {
              student: { select: { id: true, name: true, email: true } },
            },
          });
          created.push(payment);
        }
        return created;
      });

      await writeAuditLog({
        adminId: auth.admin.id,
        action: "create",
        entity: "payment",
        entityId: planId,
        entityName: `Installment Plan - ${student.name}`,
        details: {
          type: "installment_plan",
          totalAmount: finalTotalAmount,
          numberOfInstallments: installments,
          planId,
          studentId,
        },
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
        severity: "info",
      });

      return NextResponse.json({ payments, planId }, { status: 201 });
    }

    // Single payment creation — validate amount
    const finalAmount = Number(amount);
    if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
      return NextResponse.json(
        { error: "amount must be a positive number" },
        { status: 400 }
      );
    }

    const payment = await db.payment.create({
      data: {
        studentId,
        amount: finalAmount,
        type: enrollmentId ? "course" : ticketId ? "workshop" : "other",
        paymentType: paymentType || "full",
        status: paidat || paidAtAlias ? "paid" : "pending",
        installmentNumber: installmentNumber || null,
        totalInstallments: totalInstallments || null,
        // SECURITY: ignore client-provided installmentPlanId for single payments too
        installmentPlanId: null,
        paymentMethod: paymentMethod || null,
        paymentRef: paymentRef || null,
        paidAt: paidAtValue ? new Date(paidAtValue) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
        enrollmentId: enrollmentId || null,
        ticketId: ticketId || null,
        receivedBy: auth.admin.id,
        createdBy: auth.admin.id,
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
      },
    });

    // If the new payment is paid, sync related enrollment/ticket/customerLifetimeValue
    if (payment.status === "paid") {
      await syncPaymentSideEffects(payment);
    }

    await writeAuditLog({
      adminId: auth.admin.id,
      action: "create",
      entity: "payment",
      entityId: payment.id,
      entityName: `Payment - ${student.name}`,
      details: {
        amount: finalAmount,
        paymentType: payment.paymentType,
        status: payment.status,
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "info",
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    console.error("[PAYMENT_CREATE]", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}

// Helper: when a payment becomes "paid", sync related records so the UI shows consistent state.
// 1. If payment has enrollmentId: recompute enrollment.paymentStatus based on all paid payments
// 2. If payment has ticketId: mark WorkshopTicket.status="paid" if not already
// 3. Increment student.customerLifetimeValue by payment amount
// Returns void — failures here should not break the user-facing operation.
export async function syncPaymentSideEffects(payment: {
  id: string;
  studentId: string;
  amount: number;
  status: string;
  enrollmentId?: string | null;
  ticketId?: string | null;
}): Promise<void> {
  try {
    if (payment.status !== "paid") return;

    // Update student CLV
    await db.student.update({
      where: { id: payment.studentId },
      data: { customerLifetimeValue: { increment: payment.amount } },
    }).catch(() => {});

    // Sync enrollment payment status
    if (payment.enrollmentId) {
      const enrollment = await db.courseEnrollment.findUnique({
        where: { id: payment.enrollmentId },
        select: { id: true, tuitionAmount: true, paymentStatus: true },
      });
      if (enrollment) {
        const allPayments = await db.payment.aggregate({
          where: { enrollmentId: payment.enrollmentId, status: "paid" },
          _sum: { amount: true },
        });
        const totalPaid = allPayments._sum.amount || 0;
        const tuition = enrollment.tuitionAmount || 0;
        let newStatus: string;
        if (totalPaid >= tuition && tuition > 0) newStatus = "paid";
        else if (totalPaid > 0) newStatus = "partial";
        else newStatus = "unpaid";
        if (newStatus !== enrollment.paymentStatus) {
          await db.courseEnrollment.update({
            where: { id: payment.enrollmentId },
            data: {
              paymentStatus: newStatus,
              paidAt: newStatus === "paid" ? new Date() : null,
            },
          });
        }
      }
    }

    // Sync workshop ticket status
    if (payment.ticketId) {
      const ticket = await db.workshopTicket.findUnique({
        where: { id: payment.ticketId },
        select: { id: true, status: true },
      });
      if (ticket && ticket.status !== "paid" && ticket.status !== "attended") {
        await db.workshopTicket.update({
          where: { id: payment.ticketId },
          data: { status: "paid", paidAt: new Date() },
        });
      }
    }
  } catch (err) {
    console.error("[PAYMENT_SYNC_SIDE_EFFECTS]", err);
  }
}
