import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";

// POST /api/student/class-register — Register for a class (for logged-in students/instructors)
export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Allow both students and instructors (instructors can also take courses)
  const studentId = session.userId;

  try {
    const body = await request.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );
    }

    // Check if course exists and is published
    const course = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (!course.isPublished) {
      return NextResponse.json(
        { error: "Course is not available for enrollment" },
        { status: 400 }
      );
    }

    // Check if registration is open
    if (!course.registrationOpen) {
      return NextResponse.json(
        { error: "Registration for this course is currently closed" },
        { status: 400 }
      );
    }

    // Check registration timeframe
    const now = new Date();
    if (course.registrationOpenAt && now < course.registrationOpenAt) {
      return NextResponse.json(
        { error: "Registration has not opened yet" },
        { status: 400 }
      );
    }
    if (course.registrationCloseAt && now > course.registrationCloseAt) {
      return NextResponse.json(
        { error: "Registration period has ended" },
        { status: 400 }
      );
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
        { error: "Already enrolled in this course", enrollment: existing },
        { status: 409 }
      );
    }

    // Auto-fill student profile data from their account
    const student = await db.student.findUnique({
      where: { id: studentId },
      select: {
        name: true,
        phone: true,
        primaryInstrument: true,
        registrationInstrument: true,
        email: true,
      },
    });

    // Create enrollment with admin notification in a transaction.
    // The capacity check is performed INSIDE the transaction to avoid a race
    // condition where two concurrent requests could both pass the check and
    // exceed maxCapacity.
    let enrollment;
    try {
      enrollment = await db.$transaction(async (tx) => {
        // Re-check capacity inside transaction (with row-level locking via the count)
        if (course.maxCapacity) {
          const activeCount = await tx.courseEnrollment.count({
            where: {
              courseId,
              status: "active",
            },
          });
          if (activeCount >= course.maxCapacity) {
            throw new Error("CAPACITY_REACHED");
          }
        }

        const newEnrollment = await tx.courseEnrollment.create({
          data: {
            studentId,
            courseId,
            status: "active",
            progress: 0,
            registrationMethod: "online",
            tuitionAmount: course.price || 0,
            paymentStatus: "unpaid",
            notes: student
              ? `خودکار از پروفایل: ${student.name} - ${student.phone || "بدون شماره"}`
              : null,
          },
          include: {
            course: {
              select: {
                id: true,
                titleFa: true,
                titleEn: true,
                category: true,
                instrument: true,
                level: true,
                classType: true,
                price: true,
                sessionsMin: true,
                sessionsMax: true,
                imageUrl: true,
                coverUrl: true,
                branch: {
                  select: { id: true, nameFa: true, nameEn: true },
                },
                instructor: {
                  select: {
                    id: true,
                    name: true,
                    specialtyFa: true,
                    specialtyEn: true,
                  },
                },
                schedules: {
                  where: { status: "active" },
                  select: {
                    id: true,
                    dayOfWeek: true,
                    startTime: true,
                    endTime: true,
                    room: true,
                  },
                  orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
                },
              },
            },
          },
        });

        // Notify admins about new online enrollment
        const admins = await tx.admin.findMany({
          where: { isActive: true },
          select: { id: true },
        });

        if (admins.length > 0 && student) {
          await tx.adminMessage.createMany({
            data: admins.map((admin) => ({
              senderId: admin.id,
              recipientId: admin.id,
              subject: `ثبت‌نام آنلاین جدید: ${student.name} در ${newEnrollment.course.titleFa}`,
              content: `هنرجو ${student.name} به صورت آنلاین در دوره «${newEnrollment.course.titleFa}» ثبت‌نام کرد.\n\nشماره تماس: ${student.phone || "بدون شماره"}\nایمیل: ${student.email}\nشهریه: ${course.price ? course.price.toLocaleString("fa-IR") + " تومان" : "نامشخص"}\nوضعیت پرداخت: پرداخت نشده\n\nلطفاً برای پیگیری و تسویه حساب اقدام کنید.`,
              priority: "high",
              isSystemMessage: true,
            })),
          });
        }

        return newEnrollment;
      });
    } catch (err) {
      if (err instanceof Error && err.message === "CAPACITY_REACHED") {
        return NextResponse.json(
          { error: "Course has reached maximum capacity" },
          { status: 400 }
        );
      }
      if (typeof err === "object" && err !== null && "code" in err && err.code === "P2002") {
        return NextResponse.json(
          { error: "Already enrolled in this course" },
          { status: 409 }
        );
      }
      throw err;
    }

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    console.error("[STUDENT_CLASS_REGISTER]", error);
    return NextResponse.json(
      { error: "Failed to register for class" },
      { status: 500 }
    );
  }
}
