import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";

// GET /api/admin/instructors - List all instructors (Students with role=instructor)
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, "instructors", "read");
  if (!auth.ok) return auth.response;

  try {
    const url = request.nextUrl.searchParams;
    const search = url.get("search");
    const limit = Math.min(parseInt(url.get("limit") || "50"), 200);
    const offset = parseInt(url.get("offset") || "0");

    const where: Record<string, unknown> = { role: "instructor" };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { specialtyFa: { contains: search } },
        { specialtyEn: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [instructors, total] = await Promise.all([
      db.student.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { instructorOrder: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarUrl: true,
          specialtyFa: true,
          specialtyEn: true,
          bioFa: true,
          bioEn: true,
          experience: true,
          socialLinks: true,
          isPublishedInstructor: true,
          instructorOrder: true,
          isActive: true,
          primaryInstrument: true,
          createdAt: true,
          _count: {
            select: {
              taughtCourses: true,
            },
          },
        },
      }),
      db.student.count({ where }),
    ]);

    return NextResponse.json({ instructors, total });
  } catch (error) {
    console.error("[INSTRUCTORS_LIST]", error);
    return NextResponse.json({ error: "Failed to list instructors" }, { status: 500 });
  }
}

// POST /api/admin/instructors - Create a new instructor (Student with role=instructor)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, "instructors", "create");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const {
      name, email, phone, password,
      specialtyFa, specialtyEn,
      bioFa, bioEn, experience,
      primaryInstrument, socialLinks,
      isPublishedInstructor, instructorOrder,
    } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "نام، ایمیل و رمز عبور الزامی است" },
        { status: 400 }
      );
    }

    if (!specialtyFa) {
      return NextResponse.json(
        { error: "تخصص فارسی الزامی است" },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existingUser = await db.student.findUnique({ where: { email: sanitizedEmail } });
    if (existingUser) {
      return NextResponse.json(
        { error: "این ایمیل قبلاً ثبت شده است" },
        { status: 409 }
      );
    }

    // Create Student entry with role="instructor"
    const hashedPassword = await hashPassword(password);
    const instructor = await db.student.create({
      data: {
        name,
        email: sanitizedEmail,
        phone: phone || "",
        password: hashedPassword,
        role: "instructor",
        specialtyFa: specialtyFa || null,
        specialtyEn: specialtyEn || null,
        bioFa: bioFa || null,
        bioEn: bioEn || null,
        experience: experience || null,
        primaryInstrument: primaryInstrument || null,
        socialLinks: socialLinks || null,
        isPublishedInstructor: isPublishedInstructor ?? false,
        instructorOrder: instructorOrder ?? 0,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        specialtyFa: true,
        specialtyEn: true,
        isActive: true,
        isPublishedInstructor: true,
        createdAt: true,
      },
    });

    // Audit log
    await writeAuditLog({
      adminId: auth.admin.id,
      action: "create",
      entity: "instructor",
      entityId: instructor.id,
      entityName: name,
      details: {
        email: sanitizedEmail,
        specialty: specialtyFa,
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "info",
    });

    return NextResponse.json({ instructor }, { status: 201 });
  } catch (error) {
    console.error("[INSTRUCTOR_CREATE]", error);
    return NextResponse.json({ error: "Failed to create instructor" }, { status: 500 });
  }
}
