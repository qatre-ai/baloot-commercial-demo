import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";

// POST /api/admin/students/[id]/reset-password - Reset a student's password
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, "students", "update");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const user = await db.student.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const hashedPassword = await hashPassword(password);

    await db.student.update({
      where: { id },
      data: { password: hashedPassword },
    });

    await writeAuditLog({
      adminId: auth.admin.id,
      action: "reset_password",
      entity: "user",
      entityId: id,
      entityName: user.name,
      details: { action: "password_reset" },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "warning",
    });

    return NextResponse.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("[USER_RESET_PASSWORD]", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
