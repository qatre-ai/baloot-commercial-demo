import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";

// GET /api/student/payments — Student's payment & installment status
// Includes both Payment records AND enrollment-level payment status
export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentId = session.userId;

    // Verify student exists
    const student = await db.student.findUnique({
      where: { id: studentId },
      select: { id: true, role: true, name: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get enrollment-level payment status (primary view for students)
    const enrollments = await db.courseEnrollment.findMany({
      where: { studentId },
      select: {
        id: true,
        status: true,
        registrationMethod: true,
        tuitionAmount: true,
        paymentStatus: true,
        paidAt: true,
        paymentRef: true,
        paymentDueDate: true,
        enrolledAt: true,
        course: {
          select: {
            id: true,
            titleFa: true,
            titleEn: true,
            classType: true,
            price: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            paymentType: true,
            paymentMethod: true,
            paidAt: true,
            paymentRef: true,
            installmentNumber: true,
            totalInstallments: true,
            dueDate: true,
            notes: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });

    // Get all standalone Payment records (may include workshop payments)
    const payments = await db.payment.findMany({
      where: { studentId },
      include: {
        enrollment: {
          select: {
            id: true,
            course: { select: { id: true, titleFa: true, titleEn: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Enrich payments with workshop ticket info where ticketId is set
    const enrichedPayments = await Promise.all(
      payments.map(async (payment) => {
        if (payment.ticketId) {
          const ticket = await db.workshopTicket.findUnique({
            where: { id: payment.ticketId },
            select: {
              id: true,
              workshop: { select: { id: true, titleFa: true, titleEn: true } },
            },
          });
          return { ...payment, ticketInfo: ticket };
        }
        return { ...payment, ticketInfo: null };
      })
    );

    // Calculate summary from enrollment-level data
    const totalTuition = enrollments.reduce((sum, e) => sum + (e.tuitionAmount || 0), 0);
    const paidTuition = enrollments
      .filter((e) => e.paymentStatus === "paid")
      .reduce((sum, e) => sum + (e.tuitionAmount || 0), 0);
    const unpaidTuition = enrollments
      .filter((e) => e.paymentStatus === "unpaid")
      .reduce((sum, e) => sum + (e.tuitionAmount || 0), 0);
    const partialTuition = enrollments
      .filter((e) => e.paymentStatus === "partial")
      .reduce((sum, e) => sum + (e.tuitionAmount || 0), 0);

    // Also calculate from Payment records
    const totalPaid = payments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0);
    const totalOwed = payments
      .filter((p) => p.status === "pending" || p.status === "overdue")
      .reduce((sum, p) => sum + p.amount, 0);
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

    // Find next upcoming installment
    const pendingPayments = payments
      .filter((p) => p.status === "pending" && p.dueDate)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

    const nextInstallment = pendingPayments[0] || null;

    // Overdue payments
    const overduePayments = payments.filter(
      (p) => p.status === "overdue" || (p.status === "pending" && p.dueDate && new Date(p.dueDate) < new Date())
    );

    // Group by installment plan
    const installmentPlans: Record<string, {
      planId: string;
      totalAmount: number;
      paidAmount: number;
      pendingAmount: number;
      totalInstallments: number;
      paidInstallments: number;
      nextDue: string | null;
      course: { id: string; titleFa: string; titleEn: string } | null;
    }> = {};

    payments.forEach((p) => {
      if (p.installmentPlanId) {
        if (!installmentPlans[p.installmentPlanId]) {
          installmentPlans[p.installmentPlanId] = {
            planId: p.installmentPlanId,
            totalAmount: 0,
            paidAmount: 0,
            pendingAmount: 0,
            totalInstallments: p.totalInstallments || 0,
            paidInstallments: 0,
            nextDue: null,
            course: p.enrollment?.course || null,
          };
        }
        const plan = installmentPlans[p.installmentPlanId];
        plan.totalAmount += p.amount;
        if (p.status === "paid") {
          plan.paidAmount += p.amount;
          plan.paidInstallments++;
        } else {
          plan.pendingAmount += p.amount;
          if (p.dueDate && (!plan.nextDue || new Date(p.dueDate) < new Date(plan.nextDue))) {
            plan.nextDue = p.dueDate.toISOString();
          }
        }
      }
    });

    return NextResponse.json({
      // Enrollment-level payment status (primary view)
      enrollments: enrollments.map((e) => ({
        id: e.id,
        courseId: e.course.id,
        courseNameFa: e.course.titleFa,
        courseNameEn: e.course.titleEn,
        classType: e.course.classType,
        tuitionAmount: e.tuitionAmount || e.course.price || 0,
        paymentStatus: e.paymentStatus,
        paidAt: e.paidAt,
        paymentRef: e.paymentRef,
        paymentDueDate: e.paymentDueDate,
        registrationMethod: e.registrationMethod,
        enrolledAt: e.enrolledAt,
        payments: e.payments,
      })),
      enrollmentSummary: {
        totalTuition,
        paidTuition,
        unpaidTuition,
        partialTuition,
        paidCount: enrollments.filter((e) => e.paymentStatus === "paid").length,
        unpaidCount: enrollments.filter((e) => e.paymentStatus === "unpaid").length,
        partialCount: enrollments.filter((e) => e.paymentStatus === "partial").length,
        waivedCount: enrollments.filter((e) => e.paymentStatus === "waived").length,
      },
      // Detailed payment records
      payments: enrichedPayments,
      summary: {
        totalAmount,
        totalPaid,
        totalOwed,
        paymentProgress: totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0,
        nextInstallment: nextInstallment ? {
          id: nextInstallment.id,
          amount: nextInstallment.amount,
          dueDate: nextInstallment.dueDate,
          installmentNumber: nextInstallment.installmentNumber,
          totalInstallments: nextInstallment.totalInstallments,
          course: nextInstallment.enrollment?.course || null,
        } : null,
        overdueCount: overduePayments.length,
        overdueAmount: overduePayments.reduce((sum, p) => sum + p.amount, 0),
        pendingCount: pendingPayments.length,
      },
      installmentPlans: Object.values(installmentPlans),
    });
  } catch (error) {
    console.error("[STUDENT_PAYMENTS]", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
