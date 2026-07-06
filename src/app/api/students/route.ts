import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";

// GET /api/students — list all students (admin only)
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.userType !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const students = await db.student.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        lastLogin: true,
        createdAt: true,
        _count: {
          select: { tickets: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("[STUDENTS_GET]", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}

// POST /api/students — create a student (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.userType !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, phone, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const existing = await db.student.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);

    const student = await db.student.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        role: role || "student",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    console.error("[STUDENTS_POST]", error);
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
  }
}
