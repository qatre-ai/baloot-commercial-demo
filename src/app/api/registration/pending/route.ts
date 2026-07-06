import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";

// POST /api/registration/pending - Submit a new online registration (public endpoint)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name, phone, nationalId, email, role,
      // Personal information
      dateOfBirth, gender, educationLevel, fieldOfStudy,
      // Music profile
      registrationInstrument, primaryInstrument, secondaryInstruments,
      musicExperienceYears, previousTraining, musicGenres, learningGoals,
      practiceHoursPerWeek, skillLevel, instructorName, instructorNameKnown,
      // Contact & location
      address, city, province, emergencyContact, preferredBranch,
      // Parent info
      parentName, parentPhone, parentRelation,
      // Business intelligence
      referralSource, referralDetail,
      // Instructor-specific
      specialtyFa, specialtyEn, bioFa, bioEn, experience, socialLinks,
    } = body;

    // Validate required fields
    if (!name || !phone || !nationalId) {
      return NextResponse.json(
        { error: "نام، شماره تماس و کد ملی الزامی است" },
        { status: 400 }
      );
    }

    // Auto-generate email if not provided
    const finalEmail = email?.trim() || `${phone}@mab.local`;

    // Check if phone already exists in PendingRegistration (any status)
    const existingPendingPhone = await db.pendingRegistration.findFirst({
      where: { phone },
    });
    if (existingPendingPhone) {
      return NextResponse.json(
        { error: "این شماره تماس قبلاً در سیستم ثبت‌نام ثبت شده است. لطفاً با مدیران تماس بگیرید." },
        { status: 409 }
      );
    }

    // Check if phone already exists in Student table
    const existingStudentPhone = await db.student.findFirst({
      where: { phone },
    });
    if (existingStudentPhone) {
      return NextResponse.json(
        { error: "این شماره تماس قبلاً در سیستم ثبت شده است. لطفاً وارد حساب کاربری خود شوید." },
        { status: 409 }
      );
    }

    // Check if nationalId already exists in Student table
    const existingNationalId = await db.student.findFirst({
      where: { nationalId },
    });
    if (existingNationalId) {
      return NextResponse.json(
        { error: "این کد ملی قبلاً در سیستم ثبت شده است." },
        { status: 409 }
      );
    }

    // Create pending registration and notify admins in a transaction
    const pendingRegistration = await db.$transaction(async (tx) => {
      const registration = await tx.pendingRegistration.create({
        data: {
          name,
          phone,
          nationalId,
          email: finalEmail,
          role: role || "student",
          // Personal information
          dateOfBirth: dateOfBirth || null,
          gender: gender || null,
          educationLevel: educationLevel || null,
          fieldOfStudy: fieldOfStudy || null,
          // Music profile
          registrationInstrument: registrationInstrument || null,
          primaryInstrument: primaryInstrument || null,
          secondaryInstruments: secondaryInstruments || null,
          musicExperienceYears: musicExperienceYears ? parseInt(String(musicExperienceYears)) : null,
          previousTraining: previousTraining || null,
          musicGenres: musicGenres || null,
          learningGoals: learningGoals || null,
          practiceHoursPerWeek: practiceHoursPerWeek ? parseInt(String(practiceHoursPerWeek)) : null,
          skillLevel: skillLevel || null,
          instructorName: instructorName || null,
          instructorNameKnown: instructorNameKnown !== undefined ? instructorNameKnown : true,
          // Contact & location
          address: address || null,
          city: city || null,
          province: province || null,
          emergencyContact: emergencyContact || null,
          preferredBranch: preferredBranch || null,
          // Parent info
          parentName: parentName || null,
          parentPhone: parentPhone || null,
          parentRelation: parentRelation || null,
          // Business intelligence
          referralSource: referralSource || null,
          referralDetail: referralDetail || null,
          // Instructor-specific
          specialtyFa: specialtyFa || null,
          specialtyEn: specialtyEn || null,
          bioFa: bioFa || null,
          bioEn: bioEn || null,
          experience: experience || null,
          socialLinks: socialLinks || null,
          // Submission metadata
          status: "pending",
          ipAddress: getClientIp(request),
          userAgent: getUserAgent(request),
        },
      });

      // Notify all active admins about the new pending registration
      const admins = await tx.admin.findMany({
        where: { isActive: true },
        select: { id: true },
      });

      if (admins.length > 0) {
        const roleLabel = (role || "student") === "instructor" ? "مدرس" : "هنرجو";
        const instrument = registrationInstrument || primaryInstrument || "نامشخص";

        await tx.adminMessage.createMany({
          data: admins.map((admin) => ({
            senderId: admin.id, // System message - sender is same as recipient
            recipientId: admin.id,
            subject: `درخواست ثبت‌نام جدید ${roleLabel}: ${name}`,
            content: `${roleLabel} جدیدی به نام ${name} درخواست ثبت‌نام داده است.\n\nشماره تماس: ${phone}\nکد ملی: ${nationalId}\nایمیل: ${finalEmail}\nساز: ${instrument}\n\nاین درخواست در انتظار بررسی و تایید مدیران است.`,
            priority: "high",
            isSystemMessage: true,
          })),
        });
      }

      return registration;
    });

    return NextResponse.json(
      {
        registration: pendingRegistration,
        message:
          "ثبت‌نام شما با موفقیت ثبت شد. پس از بررسی توسط مدیران، حساب کاربری شما فعال خواهد شد و از طریق شماره تماس با شما اطلاع داده می‌شود.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTRATION_PENDING_CREATE]", error);
    return NextResponse.json(
      { error: "خطا در ثبت‌نام. لطفاً دوباره تلاش کنید." },
      { status: 500 }
    );
  }
}

// GET /api/registration/pending - List pending registrations (admin only)
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, "users", "read");
  if (!auth.ok) return auth.response;

  try {
    const url = request.nextUrl.searchParams;
    const status = url.get("status"); // pending | approved | rejected
    const search = url.get("search");
    const limit = Math.min(parseInt(url.get("limit") || "50"), 200);
    const offset = parseInt(url.get("offset") || "0");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { nationalId: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [registrations, total] = await Promise.all([
      db.pendingRegistration.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          phone: true,
          nationalId: true,
          email: true,
          role: true,
          registrationInstrument: true,
          primaryInstrument: true,
          skillLevel: true,
          city: true,
          province: true,
          preferredBranch: true,
          referralSource: true,
          status: true,
          reviewedBy: true,
          reviewedAt: true,
          rejectionReason: true,
          createdUserId: true,
          ipAddress: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.pendingRegistration.count({ where }),
    ]);

    // Count by status for summary
    const statusCounts = await db.pendingRegistration.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    const summary = {
      pending: statusCounts.find((s) => s.status === "pending")?._count.status || 0,
      approved: statusCounts.find((s) => s.status === "approved")?._count.status || 0,
      rejected: statusCounts.find((s) => s.status === "rejected")?._count.status || 0,
    };

    return NextResponse.json({
      registrations,
      total,
      summary,
    });
  } catch (error) {
    console.error("[REGISTRATION_PENDING_LIST]", error);
    return NextResponse.json(
      { error: "Failed to list pending registrations" },
      { status: 500 }
    );
  }
}
