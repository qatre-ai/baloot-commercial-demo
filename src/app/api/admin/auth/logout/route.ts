import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  getSessionFromRequest,
  clearSessionCookieOnResponse,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);

  if (session) {
    try {
      if (session.userType === "admin") {
        await db.loginSession.updateMany({
          where: { adminId: session.userId, isActive: true },
          data: { isActive: false, logoutAt: new Date() },
        });
      } else {
        await db.loginSession.updateMany({
          where: { studentId: session.userId, isActive: true },
          data: { isActive: false, logoutAt: new Date() },
        });
      }

      await writeAuditLog({
        adminId: session.userType === "admin" ? session.userId : null,
        action: "logout",
        entity: session.userType || "unknown",
        entityId: session.userId,
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
        severity: "info",
      });
    } catch (error) {
      console.error("[LOGOUT_AUDIT]", error);
    }
  }

  const response = NextResponse.json({ success: true });
  return clearSessionCookieOnResponse(response);
}
