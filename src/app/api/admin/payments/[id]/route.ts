import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin,
  requireSuperAdmin,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";
import { syncPaymentSideEffects } from "../route";

const VALID_STATUSES = ["pending", "paid", "overdue", "cancelled", "failed", "refunded"];
const VALID_PAYMENT_METHODS = ["cash", "card", "transfer", "pos", "online", "cheque", "other"];
const VALID_PAYMENT_TYPES = ["full", "installment", "partial", "refund"];

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/admin/payments/[id] - Get single payment details
export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(_request, "payments", "read");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const payment = await db.payment.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true, name: true, email: true, phone: true,
            primaryInstrument: true,
          },
        },
        enrollment: {
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            tuitionAmount: true,
            registrationMethod: true,
            course: { select: { id: true, titleFa: true, titleEn: true, instrument: true, level: true } },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // If ticketId is set, fetch related ticket + workshop info
    let ticketInfo: any = null;
    if (payment.ticketId) {
      ticketInfo = await db.workshopTicket.findUnique({
        where: { id: payment.ticketId },
        select: {
          id: true,
          status: true,
          amount: true,
          registrationMethod: true,
          workshop: { select: { id: true, titleFa: true, titleEn: true, date: true } },
        },
      });
    }

    // If this is part of an installment plan, get all plan payments
    let installmentPlan: any = null;
    if (payment.installmentPlanId) {
      const planPayments = await db.payment.findMany({
        where: { installmentPlanId: payment.installmentPlanId },
        orderBy: { installmentNumber: "asc" },
        select: {
          id: true,
          amount: true,
          status: true,
          installmentNumber: true,
          dueDate: true,
          paidAt: true,
          paymentMethod: true,
          paymentRef: true,
        },
      });
      installmentPlan = {
        planId: payment.installmentPlanId,
        totalInstallments: payment.totalInstallments,
        payments: planPayments,
        paidCount: planPayments.filter((p) => p.status === "paid").length,
        totalPaid: planPayments
          .filter((p) => p.status === "paid")
          .reduce((sum, p) => sum + p.amount, 0),
        totalAmount: planPayments.reduce((sum, p) => sum + p.amount, 0),
      };
    }

    return NextResponse.json({ payment, ticketInfo, installmentPlan });
  } catch (error) {
    console.error("[PAYMENT_GET]", error);
    return NextResponse.json({ error: "Failed to get payment" }, { status: 500 });
  }
}

// PATCH /api/admin/payments/[id] - Update payment (mark as paid, change status, etc.)
// When a payment transitions to "paid", related enrollment.paymentStatus and workshopTicket.status
// are also updated so the UI shows consistent state.
export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request, "payments", "update");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const existing = await db.payment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const body = await request.json();
    const allowedFields = [
      "amount",
      "paymentType",
      "paymentMethod",
      "paymentRef",
      "notes",
      "dueDate",
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field] === "" ? null : body[field];
      }
    }

    // Validate enum fields if present
    if (updateData.paymentType && !VALID_PAYMENT_TYPES.includes(updateData.paymentType as string)) {
      return NextResponse.json(
        { error: `Invalid paymentType. Allowed: ${VALID_PAYMENT_TYPES.join(", ")}` },
        { status: 400 }
      );
    }
    if (updateData.paymentMethod && !VALID_PAYMENT_METHODS.includes(updateData.paymentMethod as string)) {
      return NextResponse.json(
        { error: `Invalid paymentMethod. Allowed: ${VALID_PAYMENT_METHODS.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate amount
    if (updateData.amount !== undefined && updateData.amount !== null) {
      const a = Number(updateData.amount);
      if (!Number.isFinite(a) || a <= 0) {
        return NextResponse.json(
          { error: "amount must be a positive number" },
          { status: 400 }
        );
      }
      updateData.amount = a;
    }

    // Determine new status (markAsPaid is shorthand for status=paid)
    let newStatus: string | undefined;
    if (body.markAsPaid) {
      newStatus = "paid";
    } else if (body.status) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}` },
          { status: 400 }
        );
      }
      newStatus = body.status;
    }

    if (newStatus) {
      updateData.status = newStatus;
      if (newStatus === "paid") {
        updateData.paidAt = body.paidAt ? new Date(body.paidAt) : new Date();
        if (body.paymentMethod) updateData.paymentMethod = body.paymentMethod;
        if (body.paymentRef) updateData.paymentRef = body.paymentRef;
      } else if (newStatus === "refunded" || newStatus === "failed" || newStatus === "cancelled") {
        // Keep paidAt as-is for historical record; don't auto-clear
      }
    }

    // Handle date fields with validation
    if (body.dueDate !== undefined) {
      if (body.dueDate === null || body.dueDate === "") {
        updateData.dueDate = null;
      } else {
        const d = new Date(body.dueDate);
        if (isNaN(d.getTime())) {
          return NextResponse.json({ error: "Invalid dueDate" }, { status: 400 });
        }
        updateData.dueDate = d;
      }
    }
    if (body.paidAt !== undefined) {
      if (body.paidAt === null || body.paidAt === "") {
        updateData.paidAt = null;
      } else {
        const d = new Date(body.paidAt);
        if (isNaN(d.getTime())) {
          return NextResponse.json({ error: "Invalid paidAt" }, { status: 400 });
        }
        updateData.paidAt = d;
      }
    }

    const payment = await db.payment.update({
      where: { id },
      data: updateData,
      include: {
        student: { select: { id: true, name: true, email: true } },
      },
    });

    // Sync side effects: if status transitioned to "paid", update enrollment/ticket/CLV
    // If status transitioned FROM "paid" to something else, reverse the CLV increment
    if (newStatus === "paid" && existing.status !== "paid") {
      await syncPaymentSideEffects({
        id: payment.id,
        studentId: payment.studentId,
        amount: payment.amount,
        status: "paid",
        enrollmentId: payment.enrollmentId,
        ticketId: payment.ticketId,
      });
    } else if (existing.status === "paid" && newStatus && newStatus !== "paid") {
      // Reverse CLV
      await db.student.update({
        where: { id: payment.studentId },
        data: { customerLifetimeValue: { decrement: existing.amount } },
      }).catch(() => {});
      // Re-evaluate enrollment status
      if (payment.enrollmentId) {
        const allPayments = await db.payment.aggregate({
          where: { enrollmentId: payment.enrollmentId, status: "paid" },
          _sum: { amount: true },
        });
        const totalPaid = allPayments._sum.amount || 0;
        const enrollment = await db.courseEnrollment.findUnique({
          where: { id: payment.enrollmentId },
          select: { tuitionAmount: true },
        });
        const tuition = enrollment?.tuitionAmount || 0;
        let newPayStatus: string;
        if (totalPaid >= tuition && tuition > 0) newPayStatus = "paid";
        else if (totalPaid > 0) newPayStatus = "partial";
        else newPayStatus = "unpaid";
        await db.courseEnrollment.update({
          where: { id: payment.enrollmentId },
          data: {
            paymentStatus: newPayStatus,
            paidAt: newPayStatus === "paid" ? new Date() : null,
          },
        }).catch(() => {});
      }
    }

    await writeAuditLog({
      adminId: auth.admin.id,
      action: "update",
      entity: "payment",
      entityId: id,
      entityName: `Payment - ${payment.student.name}`,
      details: {
        before: { status: existing.status, amount: existing.amount },
        after: { status: payment.status, amount: payment.amount },
        changes: Object.keys(updateData),
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: existing.status !== payment.status ? "warning" : "info",
    });

    return NextResponse.json({ payment });
  } catch (error) {
    console.error("[PAYMENT_UPDATE]", error);
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
  }
}

// DELETE /api/admin/payments/[id] - Delete a payment record (super_admin only)
// Blocked if payment is part of an installment plan (must cancel plan instead).
export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const existing = await db.payment.findUnique({
      where: { id },
      include: { student: { select: { name: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Block deletion if part of installment plan
    if (existing.installmentPlanId) {
      const planCount = await db.payment.count({
        where: { installmentPlanId: existing.installmentPlanId },
      });
      if (planCount > 1) {
        return NextResponse.json(
          {
            error: "Cannot delete a single installment of a plan. Cancel the entire plan or delete all installments.",
            planId: existing.installmentPlanId,
            installmentsInPlan: planCount,
          },
          { status: 409 }
        );
      }
    }

    // If payment was paid, reverse CLV before deleting
    if (existing.status === "paid") {
      await db.student.update({
        where: { id: existing.studentId },
        data: { customerLifetimeValue: { decrement: existing.amount } },
      }).catch(() => {});
    }

    await db.payment.delete({ where: { id } });

    await writeAuditLog({
      adminId: auth.admin.id,
      action: "delete",
      entity: "payment",
      entityId: id,
      entityName: `Payment - ${existing.student.name}`,
      details: {
        amount: existing.amount,
        status: existing.status,
        paymentType: existing.paymentType,
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "critical",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PAYMENT_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete payment" }, { status: 500 });
  }
}
