import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import {
  checkRateLimit,
  createSessionToken,
  getClientIp,
  setSessionCookieOnResponse,
} from "@/lib/auth/session";
import type { Student } from "@prisma/client";
import { normalizeDigits, normalizeIranianPhone } from "@/lib/validation/identifiers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email: rawIdentifier, password } = body;

    if (!rawIdentifier || !password) {
      return NextResponse.json(
        { error: "ایمیل یا شماره تلفن و رمز عبور الزامی است" },
        { status: 400 }
      );
    }

    const identifier = normalizeDigits(String(rawIdentifier)).trim();
    const rateLimit = checkRateLimit(
      `student-login:${getClientIp(request)}:${identifier.toLowerCase()}`,
      5,
      15 * 60 * 1000
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "تعداد تلاش‌های ورود بیش از حد مجاز است. لطفاً بعداً تلاش کنید.",
          retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) },
        }
      );
    }

    // Determine lookup strategy based on input format
    const normalizedPhone = normalizeIranianPhone(identifier);
    const isPhoneNumber = /^09\d{9}$/.test(normalizedPhone);
    const isEmail = identifier.includes("@");

    let student: Student | null = null;

    if (isPhoneNumber) {
      // Input looks like a phone number — lookup by phone (findFirst since phone is not @unique)
      student = await db.student.findFirst({ where: { phone: normalizedPhone } });
    } else if (isEmail) {
      // Input contains '@' — lookup by email (email is @unique)
      student = await db.student.findUnique({ where: { email: identifier.toLowerCase() } });
    } else {
      // Ambiguous input — try email first, then phone
      student = await db.student.findUnique({ where: { email: identifier.toLowerCase() } });
      if (!student) {
        student = await db.student.findFirst({ where: { phone: normalizedPhone } });
      }
    }

    if (!student) {
      return NextResponse.json(
        { error: "ایمیل یا رمز عبور اشتباه است" },
        { status: 401 }
      );
    }

    // Check registration status
    if (student.registrationStatus === "pending") {
      return NextResponse.json(
        { error: "حساب کاربری شما هنوز تأیید نشده است. لطفاً تا تأیید توسط مدیران صبر کنید." },
        { status: 403 }
      );
    }

    if (student.registrationStatus === "rejected") {
      return NextResponse.json(
        { error: "ثبت‌نام شما رد شده است. لطفاً با پشتیبانی تماس بگیرید." },
        { status: 403 }
      );
    }

    if (!student.isActive) {
      return NextResponse.json(
        { error: "حساب کاربری شما غیرفعال شده است. لطفاً با پشتیبانی تماس بگیرید." },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(password, student.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "ایمیل یا رمز عبور اشتباه است" },
        { status: 401 }
      );
    }

    await db.student.update({
      where: { id: student.id },
      data: { lastLogin: new Date() },
    });

    // Determine userType based on role for proper route access
    const userType = student.role === "instructor" ? "instructor" : "student";
    const token = createSessionToken(student.id, student.role, userType);

    const user = {
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      role: student.role,
      userType: userType as "student" | "instructor",
      avatarUrl: student.avatarUrl,
    };

    const response = NextResponse.json({ user, sessionToken: token }, { status: 200 });
    return setSessionCookieOnResponse(response, token);
  } catch (error) {
    console.error("[AUTH_LOGIN]", error);
    return NextResponse.json(
      { error: "خطا در ورود به سیستم" },
      { status: 500 }
    );
  }
}
