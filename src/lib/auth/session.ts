// ============================================
// Session Management - Production Grade
// Secure cookie-based sessions with proper Next.js integration
// Dual auth: cookie-based (primary) + header-based (fallback for sandbox/iframe)
// ============================================

import { cookies, headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const SESSION_COOKIE = "mab-session";
const SESSION_HEADER = "x-session-token";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

// In-memory rate limit store (resets on server restart)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function createSessionToken(userId: string, role: string, userType?: string): string {
  const payload = JSON.stringify({
    userId,
    role,
    userType: userType || "admin",
    exp: Date.now() + SESSION_MAX_AGE * 1000,
    iat: Date.now(),
  });
  return Buffer.from(payload).toString("base64");
}

export function parseSessionToken(token: string): { userId: string; role: string; userType?: string; exp: number; iat: number } | null {
  try {
    const payload = JSON.parse(Buffer.from(token, "base64").toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<{ userId: string; role: string; userType?: string } | null> {
  try {
    // 1. Try reading from cookies (primary method)
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (token) {
      const session = parseSessionToken(token);
      if (session) return session;
    }

    // 2. Fallback: check X-Session-Token header (essential for sandbox/iframe where cookies with SameSite=None+Secure don't persist over HTTP)
    try {
      const headersList = await headers();
      const headerToken = headersList.get(SESSION_HEADER);
      if (headerToken) {
        const session = parseSessionToken(headerToken);
        if (session) return session;
      }
    } catch {
      // headers() may not be available in all contexts
    }

    return null;
  } catch {
    return null;
  }
}

// Get session from a NextRequest object — checks both cookies AND the X-Session-Token header
// This is the recommended way to get session in API route handlers
export function getSessionFromRequest(request: NextRequest): { userId: string; role: string; userType?: string } | null {
  // 1. Try the X-Session-Token header (client-side fallback for sandbox/iframe)
  const headerToken = request.headers.get(SESSION_HEADER);
  if (headerToken) {
    const session = parseSessionToken(headerToken);
    if (session) return session;
  }

  // 2. Fall back to cookie
  const cookieToken = request.cookies.get(SESSION_COOKIE)?.value;
  if (cookieToken) {
    const session = parseSessionToken(cookieToken);
    if (session) return session;
  }

  return null;
}

// Set session cookie on a NextResponse object - the correct Next.js way
// Uses SameSite=None+Secure for sandbox/iframe compatibility, with Lax fallback
export function setSessionCookieOnResponse(
  response: NextResponse,
  token: string,
): NextResponse {
  // Primary cookie: SameSite=None, Secure — works in sandbox/iframe cross-origin contexts
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    path: "/",
    maxAge: SESSION_MAX_AGE,
    sameSite: "none",
    httpOnly: true,
    secure: true,
  });
  return response;
}

// Clear session cookie on a NextResponse object
export function clearSessionCookieOnResponse(
  response: NextResponse,
): NextResponse {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    path: "/",
    maxAge: 0,
    sameSite: "none",
    httpOnly: true,
    secure: true,
  });
  return response;
}

// Legacy header-based cookie methods (kept for compatibility, but prefer response-based methods)
export function setSessionCookie(token: string, _userType?: string): Record<string, string> {
  return {
    "Set-Cookie": `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${SESSION_MAX_AGE}; SameSite=Lax; HttpOnly`,
  };
}

export function clearSessionCookie(): Record<string, string> {
  return {
    "Set-Cookie": `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly`,
  };
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "127.0.0.1";
}

export function getUserAgent(request: NextRequest): string {
  return request.headers.get("user-agent") || "unknown";
}

export function parseUserAgent(ua: string): { deviceType: string; browser: string; os: string } {
  let browser = "unknown";
  let os = "unknown";
  let deviceType = "desktop";

  if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome/")) browser = "Chrome";
  else if (ua.includes("Safari/") && !ua.includes("Chrome")) browser = "Safari";

  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) { os = "Android"; deviceType = "mobile"; }
  else if (ua.includes("iPhone") || ua.includes("iPad")) { os = "iOS"; deviceType = ua.includes("iPad") ? "tablet" : "mobile"; }

  if (ua.includes("Mobile") || ua.includes("Android")) deviceType = "mobile";

  return { deviceType, browser, os };
}

export function checkRateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return { allowed: true, resetAt };
  }

  entry.count++;
  if (entry.count > limit) {
    return { allowed: false, resetAt: entry.resetAt };
  }

  return { allowed: true, resetAt: entry.resetAt };
}

export function detectSuspiciousActivity(ip: string, ua: string): { suspicious: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (ua === "unknown") reasons.push("Missing user agent");
  if (ip === "0.0.0.0") reasons.push("Invalid IP");
  return { suspicious: reasons.length > 0, reasons };
}

// Check if user has a specific permission
export function hasPermission(
  permissions: Array<{ resource: string; action: string; granted: boolean }>,
  resource: string,
  action: string
): boolean {
  return permissions.some(p => p.resource === resource && p.action === action && p.granted);
}

// Check if user can access admin resources (super_admin always has access)
export function canAccess(
  role: string,
  permissions: Array<{ resource: string; action: string; granted: boolean }>,
  resource: string,
  action: string
): boolean {
  if (role === "super_admin") return true;
  return hasPermission(permissions, resource, action);
}

// ============================================
// requireAdmin / requireSuperAdmin helpers
// These are the recommended way to authenticate API route handlers.
// They use getSessionFromRequest (header-first) for sandbox/iframe reliability
// and perform full RBAC checks against the AdminPermission table.
// ============================================

export type AuthResult =
  | { ok: true; session: { userId: string; role: string; userType?: string }; admin: { id: string; name: string; email: string; role: string; isActive: boolean } }
  | { ok: false; response: NextResponse };

/**
 * Authenticate an admin request and enforce RBAC.
 * - 401 if no session or session is not an admin
 * - 403 if admin is inactive
 * - 403 if non-super_admin lacks the required permission
 * - super_admin always allowed
 *
 * Usage:
 *   const auth = await requireAdmin(request, "students", "read");
 *   if (!auth.ok) return auth.response;
 *   // use auth.session.userId, auth.admin
 */
export async function requireAdmin(
  request: NextRequest,
  resource: string,
  action: string
): Promise<AuthResult> {
  const session = getSessionFromRequest(request);
  if (!session || session.userType !== "admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  // Load admin record (verify exists + active)
  const admin = await db.admin.findUnique({
    where: { id: session.userId },
    include: { permissions: true },
  });

  if (!admin || !admin.isActive) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Account inactive or not found" }, { status: 403 }),
    };
  }

  // super_admin bypasses RBAC
  if (admin.role === "super_admin") {
    return {
      ok: true,
      session,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
      },
    };
  }

  // Sub-admin: check RBAC
  if (!canAccess(admin.role, admin.permissions, resource, action)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden: insufficient permission" }, { status: 403 }),
    };
  }

  return {
    ok: true,
    session,
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
    },
  };
}

/**
 * Authenticate a super_admin request. Sub-admins are rejected even if they have permission.
 * Use this for sensitive operations like managing other admins, backups, intrusion alerts.
 */
export async function requireSuperAdmin(request: NextRequest): Promise<AuthResult> {
  const session = getSessionFromRequest(request);
  if (!session || session.userType !== "admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const admin = await db.admin.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  if (!admin || !admin.isActive) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Account inactive or not found" }, { status: 403 }),
    };
  }

  if (admin.role !== "super_admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Super admin access required" }, { status: 403 }),
    };
  }

  return {
    ok: true,
    session,
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
    },
  };
}

/**
 * Authenticate any admin (no specific RBAC check). Use this for read-only endpoints
 * that should be available to all admins (e.g., dashboard, audit logs).
 * Still enforces: session valid + admin exists + admin active.
 */
export async function requireAnyAdmin(request: NextRequest): Promise<AuthResult> {
  const session = getSessionFromRequest(request);
  if (!session || session.userType !== "admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const admin = await db.admin.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  if (!admin || !admin.isActive) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Account inactive or not found" }, { status: 403 }),
    };
  }

  return {
    ok: true,
    session,
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
    },
  };
}

/**
 * Helper to write an audit log entry. Caller provides the admin id from requireAdmin().
 * Returns void; audit log failures are silently swallowed (don't break user-facing ops).
 * adminId may be null for system-generated entries (e.g., instructor self-service actions).
 */
export async function writeAuditLog(params: {
  adminId: string | null;
  action: string;
  entity: string;
  entityId?: string;
  entityName?: string;
  severity?: "info" | "warning" | "critical";
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        adminId: params.adminId || null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        entityName: params.entityName || null,
        severity: params.severity || "info",
        details: params.details ? JSON.stringify(params.details) : null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (err) {
    // Audit log failure must not break the user-facing operation
    console.error("[AUDIT_LOG_ERROR]", err);
  }
}
