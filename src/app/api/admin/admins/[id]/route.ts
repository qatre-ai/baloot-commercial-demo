import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  requireSuperAdmin,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";

// GET single admin
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const admin = await db.admin.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, role: true, isActive: true, phone: true,
        twoFactorEnabled: true, lastLoginAt: true, lastLoginIp: true,
        mustChangePassword: true, failedLoginAttempts: true, lockedUntil: true,
        createdAt: true, updatedAt: true,
        permissions: true,
        _count: { select: { auditLogs: true, loginSessions: true } },
      },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json({ admin });
  } catch (error) {
    console.error("[ADMIN_GET]", error);
    return NextResponse.json({ error: "Failed to get admin" }, { status: 500 });
  }
}

// PUT update admin
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const body = await request.json();
    const { name, email, role, phone, isActive, password, resetLock } = body;

    // Prevent self-role-change (super_admin locking themselves out)
    if (id === auth.admin.id && role && role !== auth.admin.role) {
      return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
    }

    // Validate role value if provided
    if (role !== undefined && !["admin", "super_admin", "editor"].includes(role)) {
      return NextResponse.json({ error: "Invalid role. Must be admin, super_admin, or editor" }, { status: 400 });
    }

    // Check if admin exists
    const existing = await db.admin.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Check email uniqueness if email is being changed
    if (email !== undefined && email !== existing.email) {
      const emailDuplicate = await db.admin.findUnique({ where: { email } });
      if (emailDuplicate) {
        return NextResponse.json({ error: "Email already in use by another admin" }, { status: 409 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) updateData.password = await hashPassword(password);
    if (resetLock) {
      updateData.failedLoginAttempts = 0;
      updateData.lockedUntil = null;
    }

    const admin = await db.admin.update({
      where: { id },
      data: updateData,
      select: {
        id: true, name: true, email: true, role: true, isActive: true,
        phone: true, mustChangePassword: true, createdAt: true,
      },
    });

    await writeAuditLog({
      adminId: auth.admin.id,
      action: "update",
      entity: "admin",
      entityId: id,
      entityName: admin.name,
      details: { changes: Object.keys(updateData) },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "warning",
    });

    return NextResponse.json({ admin });
  } catch (error) {
    console.error("[ADMIN_UPDATE]", error);
    return NextResponse.json({ error: "Failed to update admin" }, { status: 500 });
  }
}

// DELETE admin
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  if (id === auth.admin.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  try {
    // Check if admin exists before deleting
    const existing = await db.admin.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    const admin = await db.admin.delete({
      where: { id },
      select: { id: true, name: true, email: true, role: true },
    });

    await writeAuditLog({
      adminId: auth.admin.id,
      action: "delete",
      entity: "admin",
      entityId: id,
      entityName: admin.name,
      details: { email: admin.email, role: admin.role },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "critical",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete admin" }, { status: 500 });
  }
}
