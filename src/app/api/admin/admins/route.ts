import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  requireSuperAdmin,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";

// GET /api/admin/admins - List all admins
export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const admins = await db.admin.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        phone: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        lastLoginIp: true,
        mustChangePassword: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        createdAt: true,
        _count: {
          select: { permissions: true, auditLogs: true },
        },
        permissions: {
          select: {
            id: true,
            resource: true,
            action: true,
            granted: true,
          },
        },
      },
    });

    return NextResponse.json({ admins });
  } catch (error) {
    console.error("[ADMIN_LIST]", error);
    return NextResponse.json({ error: "Failed to list admins" }, { status: 500 });
  }
}

// POST /api/admin/admins - Create a new admin
export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { name, email, password, role, phone, permissions } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Name, email, password, and role are required" },
        { status: 400 }
      );
    }

    if (!["admin", "super_admin", "editor"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be admin, super_admin, or editor" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingAdmin = await db.admin.findUnique({ where: { email } });
    if (existingAdmin) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    // Filter out any malformed permission entries
    const validPermissions = Array.isArray(permissions)
      ? permissions.filter((p: { resource?: string; action?: string }) => p.resource && p.action)
      : [];

    const admin = await db.admin.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        phone: phone || null,
        mustChangePassword: true, // Force password change on first login
        permissions: validPermissions.length > 0 ? {
          create: validPermissions.map((p: { resource: string; action: string }) => ({
            resource: p.resource,
            action: p.action,
            grantedBy: auth.admin.id,
          })),
        } : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    // Audit log
    await writeAuditLog({
      adminId: auth.admin.id,
      action: "create",
      entity: "admin",
      entityId: admin.id,
      entityName: admin.name,
      details: { role: admin.role, email: admin.email },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "warning",
    });

    return NextResponse.json({ admin }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_CREATE]", error);
    return NextResponse.json({ error: "Failed to create admin" }, { status: 500 });
  }
}
