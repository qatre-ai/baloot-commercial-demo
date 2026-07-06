import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";

// GET /api/student/enrollments — Get student's course enrollments with full details
export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Allow both students and instructors (instructors can also be enrolled in courses)

  const studentId = session.userId;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { studentId };
    if (status) {
      where.status = status;
    }

    const enrollments = await db.courseEnrollment.findMany({
      where,
      include: {
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
            classType: true,
            duration: true,
            sessionsMin: true,
            sessionsMax: true,
            price: true,
            imageUrl: true,
            coverUrl: true,
            isFeatured: true,
            registrationOpen: true,
            maxCapacity: true,
            branch: {
              select: { id: true, nameFa: true, nameEn: true, addressFa: true, addressEn: true },
            },
            instructor: {
              select: {
                id: true,
                name: true,
                specialtyFa: true,
                specialtyEn: true,
                avatarUrl: true,
                bioFa: true,
                bioEn: true,
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
                isRecurring: true,
                specificDate: true,
                sessionNumber: true,
              },
              orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
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
      orderBy: { enrolledAt: "desc" },
    });

    // Get student profile data for auto-fill (registration form support)
    const student = await db.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        nationalId: true,
        address: true,
        city: true,
        province: true,
        primaryInstrument: true,
        registrationInstrument: true,
        parentName: true,
        parentPhone: true,
        parentRelation: true,
        emergencyContact: true,
        educationLevel: true,
        fieldOfStudy: true,
        musicExperienceYears: true,
        skillLevel: true,
      },
    });

    return NextResponse.json({
      enrollments,
      total: enrollments.length,
      profile: student, // Auto-fill data for registration forms
    });
  } catch (error) {
    console.error("[STUDENT_ENROLLMENTS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
      { status: 500 }
    );
  }
}
