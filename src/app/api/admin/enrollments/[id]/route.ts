import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/admin/enrollments/[id] — Get single enrollment with full details
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const auth = await requireAdmin(request, "enrollments", "read");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await context.params;

    const enrollment = await db.courseEnrollment.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            primaryInstrument: true,
            registrationInstrument: true,
            skillLevel: true,
            dateOfBirth: true,
            parentName: true,
            parentPhone: true,
          },
        },
        course: {
          select: {
            id: true,
            titleFa: true,
            titleEn: true,
            descriptionFa: true,
            descriptionEn: true,
            category: true,
            instrument: true,
            level: true,
            duration: true,
            sessionsMin: true,
            sessionsMax: true,
            price: true,
            maxCapacity: true,
            registrationOpen: true,
            registrationOpenAt: true,
            registrationCloseAt: true,
            isPublished: true,
            branch: {
              select: { id: true, nameFa: true, nameEn: true, addressFa: true, addressEn: true },
            },
            instructor: {
              select: { id: true, name: true, specialtyFa: true },
            },
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
            notes: true,
            installmentNumber: true,
            totalInstallments: true,
            installmentPlanId: true,
            dueDate: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    // If there are installment plan payments, group them
    const installmentPlans: Record<string, unknown> = {};
    for (const payment of enrollment.payments) {
      if (payment.installmentPlanId) {
        if (!installmentPlans[payment.installmentPlanId]) {
          installmentPlans[payment.installmentPlanId] = {
            planId: payment.installmentPlanId,
            totalInstallments: payment.totalInstallments,
            payments: [],
          };
        }
        (installmentPlans[payment.installmentPlanId] as { payments: unknown[] }).payments.push(payment);
      }
    }

    return NextResponse.json({
      enrollment,
      installmentPlans: Object.values(installmentPlans),
    });
  } catch (error) {
    console.error("[ADMIN_ENROLLMENT_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollment" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/enrollments/[id] — Update enrollment
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const auth = await requireAdmin(request, "enrollments", "update");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await context.params;

    const existing = await db.courseEnrollment.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, name: true } },
        course: { select: { id: true, titleFa: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    const body = await request.json();
    const allowedFields = [
      "status",
      "paymentStatus",
      "tuitionAmount",
      "notes",
      "paymentRef",
      "paymentDueDate",
      "progress",
    ];

    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field] === "" ? null : body[field];
      }
    }

    // Handle paymentStatus changes
    if (body.paymentStatus) {
      const validStatuses = ["unpaid", "paid", "partial", "waived"];
      if (!validStatuses.includes(body.paymentStatus)) {
        return NextResponse.json(
          { error: `Invalid paymentStatus. Must be one of: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }

      // If changing to "paid", set paidAt
      if (body.paymentStatus === "paid" && existing.paymentStatus !== "paid") {
        updateData.paidAt = body.paidAt ? new Date(body.paidAt) : new Date();
      }

      // If changing away from "paid", clear paidAt
      if (body.paymentStatus !== "paid" && existing.paymentStatus === "paid") {
        updateData.paidAt = null;
      }
    }

    // Handle status changes — set completedAt when status changes to "completed"
    if (body.status === "completed" && existing.status !== "completed") {
      updateData.completedAt = new Date();
    }
    // Clear completedAt if status changes away from "completed"
    if (body.status && body.status !== "completed" && existing.status === "completed") {
      updateData.completedAt = null;
    }

    // Handle date fields
    if (body.paymentDueDate) {
      updateData.paymentDueDate = new Date(body.paymentDueDate);
    }
    if (body.paidAt) {
      updateData.paidAt = new Date(body.paidAt);
    }

    // Track admin edit
    updateData.lastEditedByAdminId = auth.admin.id;
    updateData.lastEditedAt = new Date();

    const enrollment = await db.courseEnrollment.update({
      where: { id },
      data: updateData,
      include: {
        student: {
          select: { id: true, name: true, email: true, phone: true },
        },
        course: {
          select: { id: true, titleFa: true, titleEn: true, instrument: true, level: true, price: true },
        },
      },
    });

    // Audit log
    await writeAuditLog({
      adminId: auth.admin.id,
      action: "update",
      entity: "enrollment",
      entityId: id,
      entityName: `${existing.student.name} → ${existing.course.titleFa}`,
      details: {
        before: {
          status: existing.status,
          paymentStatus: existing.paymentStatus,
          tuitionAmount: existing.tuitionAmount,
        },
        after: {
          status: enrollment.status,
          paymentStatus: enrollment.paymentStatus,
          tuitionAmount: enrollment.tuitionAmount,
        },
        changes: Object.keys(updateData),
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: existing.paymentStatus !== enrollment.paymentStatus ? "warning" : "info",
    });

    return NextResponse.json({ enrollment });
  } catch (error) {
    console.error("[ADMIN_ENROLLMENT_UPDATE]", error);
    return NextResponse.json(
      { error: "Failed to update enrollment" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/enrollments/[id] — Soft delete (change status to "dropped")
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const auth = await requireAdmin(request, "enrollments", "delete");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await context.params;

    const existing = await db.courseEnrollment.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, name: true } },
        course: { select: { id: true, titleFa: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    if (existing.status === "dropped") {
      return NextResponse.json(
        { error: "Enrollment is already dropped" },
        { status: 400 }
      );
    }

    // Soft delete: change status to "dropped"
    const enrollment = await db.courseEnrollment.update({
      where: { id },
      data: {
        status: "dropped",
        lastEditedByAdminId: auth.admin.id,
        lastEditedAt: new Date(),
      },
    });

    // Audit log
    await writeAuditLog({
      adminId: auth.admin.id,
      action: "drop",
      entity: "enrollment",
      entityId: id,
      entityName: `${existing.student.name} → ${existing.course.titleFa}`,
      details: {
        previousStatus: existing.status,
        paymentStatus: existing.paymentStatus,
        tuitionAmount: existing.tuitionAmount,
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "warning",
    });

    return NextResponse.json({ enrollment, message: "Enrollment dropped successfully" });
  } catch (error) {
    console.error("[ADMIN_ENROLLMENT_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to drop enrollment" },
      { status: 500 }
    );
  }
}
