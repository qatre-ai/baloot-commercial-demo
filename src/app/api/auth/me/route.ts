import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const student = await db.student.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!student || !student.isActive) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Include userType from session so client knows the access level
    const userType = session.userType || (student.role === "instructor" ? "instructor" : "student");

    return NextResponse.json({
      user: {
        ...student,
        userType,
      },
    });
  } catch (error) {
    console.error("[AUTH_ME]", error);
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 }
    );
  }
}
