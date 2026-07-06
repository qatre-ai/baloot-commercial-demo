import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookieOnResponse } from "@/lib/auth/session";
import { Prisma } from "@prisma/client";

// Email format validation
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, password, ...extraFields } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "نام معتبر وارد کنید (حداقل ۲ کاراکتر)" },
        { status: 400 }
      );
    }
    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim().toLowerCase())) {
      return NextResponse.json(
        { error: "ایمیل معتبر وارد کنید" },
        { status: 400 }
      );
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "رمز عبور باید حداقل ۶ کاراکتر باشد" },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.trim().toLowerCase();

    const existing = await db.student.findUnique({ where: { email: sanitizedEmail } });
    if (existing) {
      return NextResponse.json(
        { error: "این ایمیل قبلاً ثبت شده است" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    // SECURITY: Self-registration is STUDENT-ONLY.
    // Instructor accounts must be created by an admin via /api/admin/students or /api/admin/instructors.
    // Any "role" field in the request body is silently ignored.
    const role = "student";

    // Build user data with all structured registration fields
    const userData: Record<string, unknown> = {
      name: name.trim(),
      email: sanitizedEmail,
      phone: phone || "",
      password: hashedPassword,
      role,
      registrationStatus: "approved", // self-registered users are active immediately (schema: pending | approved | rejected)
    };

    // Add optional structured fields if provided
    const optionalFields = [
      'dateOfBirth', 'gender', 'nationalId', 'educationLevel', 'fieldOfStudy',
      'registrationInstrument', 'primaryInstrument', 'secondaryInstruments', 'musicExperienceYears',
      'previousTraining', 'musicGenres', 'learningGoals', 'practiceHoursPerWeek',
      'skillLevel', 'instructorName', 'instructorNameKnown',
      'address', 'city', 'province', 'preferredBranch',
      'parentName', 'parentPhone', 'parentRelation',
      'referralSource', 'referralDetail',
      'notes', 'emergencyContact',
      // NOTE: specialtyFa/En, bioFa/En, experience are INSTRUCTOR fields — blocked from self-registration
    ];

    for (const field of optionalFields) {
      if (extraFields[field] !== undefined && extraFields[field] !== null && extraFields[field] !== '') {
        userData[field] = extraFields[field];
      }
    }

    // Create student and notify admins in a transaction
    const student = await db.$transaction(async (tx) => {
      const newStudent = await tx.student.create({
        data: userData as Prisma.StudentUncheckedCreateInput,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          avatarUrl: true,
          createdAt: true,
        },
      });

      // Notify all active admins about the new registration
      const admins = await tx.admin.findMany({
        where: { isActive: true },
        select: { id: true },
      });

      if (admins.length > 0) {
        const studentPhone = newStudent.phone || 'بدون شماره';
        const instrument = extraFields.registrationInstrument || extraFields.primaryInstrument || 'نامشخص';

        await tx.adminMessage.createMany({
          data: admins.map(admin => ({
            senderId: admin.id, // System message - sender is same as recipient
            recipientId: admin.id,
            subject: `ثبت‌نام جدید هنرجو: ${newStudent.name}`,
            content: `هنرجو جدیدی به نام ${newStudent.name} در سیستم ثبت‌نام کرد.\n\nشماره تماس: ${studentPhone}\nایمیل: ${newStudent.email}\nساز: ${instrument}\n\nلطفاً برای پیگیری و تکمیل فرآیند ثبت‌نام اقدام کنید.`,
            priority: "high",
            isSystemMessage: true,
          })),
        });
      }

      return newStudent;
    });

    // Self-registered users are ALWAYS students; token must reflect that
    const token = createSessionToken(student.id, "student", "student");
    const response = NextResponse.json({
      user: { ...student, userType: "student" },
      sessionToken: token,
      message: "ثبت نام شما با موفقیت انجام شد و به زودی همکاران ما با شما تماس خواهند گرفت"
    }, { status: 201 });
    return setSessionCookieOnResponse(response, token);
  } catch (error) {
    console.error("[AUTH_REGISTER]", error);
    return NextResponse.json(
      { error: "خطا در ثبت‌نام" },
      { status: 500 }
    );
  }
}
