import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";

// GET /api/admin/sessions - List login sessions
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, "sessions", "read");
  if (!auth.ok) return auth.response;

  try {
    const url = request.nextUrl.searchParams;
    const activeOnly = url.get("active") === "true";
    const userType = url.get("userType"); // admin | student
    const limit = Math.min(parseInt(url.get("limit") || "100"), 500);

    const where: Record<string, unknown> = {};
    if (activeOnly) where.isActive = true;
    if (userType) where.userType = userType;

    const sessions = await db.loginSession.findMany({
      where,
      take: limit,
      orderBy: { loginAt: "desc" },
      include: {
        admin: { select: { name: true, email: true, role: true } },
        student: { select: { name: true, email: true } },
      },
    });

    // Unique IPs
    const uniqueIps = await db.loginSession.groupBy({
      by: ["ipAddress"],
      _count: { ipAddress: true },
      orderBy: { _count: { ipAddress: "desc" } },
      take: 20,
    });

    return NextResponse.json({ sessions, uniqueIps });
  } catch (error) {
    console.error("[SESSIONS_LIST]", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}
