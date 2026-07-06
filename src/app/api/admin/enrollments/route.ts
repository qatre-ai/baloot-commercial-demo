import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";

// GET /api/admin/enrollments — List all enrollments with filters
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, "enrollments", "read");
  if (!auth.ok) return auth.response;

  try {
    const url = request.nextUrl.searchParams;
    const search = url.get("search");
    const status = url.get("status");
    const paymentStatus = url.get("paymentStatus");
    const registrationMethod = url.get("registrationMethod");
    const courseId = url.get("courseId");
    const studentId = url.get("studentId");
    const dateFrom = url.get("dateFrom");
    const dateTo = url.get("dateTo");
    const limit = Math.min(parseInt(url.get("limit") || "50"), 200);
    const offset = parseInt(url.get("offset") || "0");

    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (registrationMethod) where.registrationMethod = registrationMethod;
    if (courseId) where.courseId = courseId;
    if (studentId) where.studentId = studentId;

    if (dateFrom || dateTo) {
      const enrolledAt: Record<string, Date> = {};
      if (dateFrom) enrolledAt.gte = new Date(dateFrom);
      if (dateTo) enrolledAt.lte = new Date(dateTo);
      where.enrolledAt = enrolledAt;
    }

    if (search) {
      where.OR = [
        { student: { name: { contains: search } } },
        { student: { email: { contains: search } } },
        { student: { phone: { contains: search } } },
        { course: { titleFa: { contains: search } } },
        { course: { titleEn: { contains: search } } },
        { notes: { contains: search } },
      ];
    }

    const [enrollments, total] = await Promise.all([
      db.courseEnrollment.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { enrolledAt: "desc" },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              primaryInstrument: true,
              registrationInstrument: true,
            },
          },
          course: {
            select: {
              id: true,
              titleFa: true,
              titleEn: true,
              instrument: true,
              level: true,
              price: true,
              branch: {
                select: { id: true, nameFa: true, nameEn: true },
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
              installmentNumber: true,
              totalInstallments: true,
              dueDate: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
      }),
      db.courseEnrollment.count({ where }),
    ]);

    // Summary stats
    const totalActive = await db.courseEnrollment.count({
      where: { status: "active" },
    });
    const totalPartial = await db.courseEnrollment.count({
      where: { paymentStatus: "partial" },
    });
    const totalUnpaid = await db.courseEnrollment.count({
      where: { paymentStatus: "unpaid" },
    });

    return NextResponse.json({
      enrollments,
      total,
      stats: {
        active: totalActive,
        partial: totalPartial,
        unpaid: totalUnpaid,
      },
    });
  } catch (error) {
    console.error("[ADMIN_ENROLLMENTS_LIST]", error);
    return NextResponse.json(
      { error: "Failed to list enrollments" },
      { status: 500 }
    );
  }
}

// POST /api/admin/enrollments — Create enrollment on behalf of a student
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, "enrollments", "create");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const {
      studentId,
      courseId,
      registrationMethod,
      paymentStatus,
      tuitionAmount,
      notes,
      paymentDueDate,
    } = body;

    // Validate required fields
    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 }
      );
    }
    if (!courseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );
    }
    if (!registrationMethod || !["online", "phone", "in_person"].includes(registrationMethod)) {
      return NextResponse.json(
        { error: "registrationMethod must be 'online', 'phone', or 'in_person'" },
        { status: 400 }
      );
    }

    // Validate paymentStatus if provided
    const validPaymentStatuses = ["unpaid", "paid", "partial", "waived"];
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return NextResponse.json(
        { error: "paymentStatus must be one of: unpaid, paid, partial, waived" },
        { status: 400 }
      );
    }

    // Verify student exists
    const student = await db.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Verify course exists
    const course = await db.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check if already enrolled
    const existing = await db.courseEnrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Student is already enrolled in this course", enrollment: existing },
        { status: 409 }
      );
    }

    // Check max capacity
    if (course.maxCapacity) {
      const activeCount = await db.courseEnrollment.count({
        where: {
          courseId,
          status: "active",
        },
      });
      if (activeCount >= course.maxCapacity) {
        return NextResponse.json(
          { error: "Course has reached maximum capacity" },
          { status: 400 }
        );
      }
    }

    // Determine tuition amount: admin-provided or course price
    const finalTuitionAmount =
      tuitionAmount !== undefined ? tuitionAmount : course.price || 0;

    // Determine payment status
    const finalPaymentStatus = paymentStatus || "unpaid";

    // Create enrollment
    const enrollment = await db.courseEnrollment.create({
      data: {
        studentId,
        courseId,
        status: "active",
        progress: 0,
        registrationMethod,
        registeredByAdminId: auth.admin.id,
        tuitionAmount: finalTuitionAmount,
        paymentStatus: finalPaymentStatus,
        paidAt: finalPaymentStatus === "paid" ? new Date() : null,
        paymentDueDate: paymentDueDate ? new Date(paymentDueDate) : null,
        notes: notes || null,
      },
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
        course: {
          select: {
            id: true,
            titleFa: true,
            titleEn: true,
            instrument: true,
            level: true,
            price: true,
          },
        },
      },
    });

    // Audit log
    await writeAuditLog({
      adminId: auth.admin.id,
      action: "create",
      entity: "enrollment",
      entityId: enrollment.id,
      entityName: `${student.name} → ${course.titleFa}`,
      details: {
        studentId,
        courseId,
        registrationMethod,
        paymentStatus: finalPaymentStatus,
        tuitionAmount: finalTuitionAmount,
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "info",
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_ENROLLMENT_CREATE]", error);
    return NextResponse.json(
      { error: "Failed to create enrollment" },
      { status: 500 }
    );
  }
}
