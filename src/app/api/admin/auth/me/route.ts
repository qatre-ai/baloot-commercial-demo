import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";

// GET /api/admin/auth/me - Get current session info
export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    if (session.userType === "admin") {
      const admin = await db.admin.findUnique({
        where: { id: session.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          isActive: true,
          mustChangePassword: true,
          twoFactorEnabled: true,
          lastLoginAt: true,
          avatarUrl: true,
          createdAt: true,
          permissions: {
            select: { id: true, resource: true, action: true, granted: true },
          },
        },
      });

      if (!admin || !admin.isActive) {
        return NextResponse.json({ user: null }, { status: 401 });
      }

      return NextResponse.json({
        user: { ...admin, userType: "admin" },
      });
    }

    // Student session
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

    return NextResponse.json({
      user: { ...student, userType: "student" },
    });
  } catch (error) {
    console.error("[AUTH_ME]", error);
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 }
    );
  }
}
