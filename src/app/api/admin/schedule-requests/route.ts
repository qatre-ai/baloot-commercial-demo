import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";

// GET /api/admin/schedule-requests — List all schedule change requests
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, "schedules", "read");
  if (!auth.ok) return auth.response;

  try {
    const url = request.nextUrl.searchParams;
    const status = url.get("status"); // pending | approved | rejected
    const instructorId = url.get("instructorId");
    const requestType = url.get("requestType");
    const limit = Math.min(parseInt(url.get("limit") || "50"), 200);
    const offset = parseInt(url.get("offset") || "0");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (instructorId) where.instructorId = instructorId;
    if (requestType) where.requestType = requestType;

    const [requests, total] = await Promise.all([
      db.scheduleChangeRequest.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        include: {
          instructor: {
            select: {
              id: true,
              name: true,
              phone: true,
              specialtyFa: true,
              specialtyEn: true,
            },
          },
          course: {
            select: {
              id: true,
              titleFa: true,
              titleEn: true,
              instrument: true,
              level: true,
              classType: true,
            },
          },
          schedule: {
            select: {
              id: true,
              dayOfWeek: true,
              startTime: true,
              endTime: true,
              room: true,
              status: true,
              isRecurring: true,
              specificDate: true,
            },
          },
        },
      }),
      db.scheduleChangeRequest.count({ where }),
    ]);

    // Summary counts
    const pendingCount = await db.scheduleChangeRequest.count({
      where: { status: "pending" },
    });

    return NextResponse.json({
      requests,
      total,
      pendingCount,
    });
  } catch (error) {
    console.error("[ADMIN_SCHEDULE_REQUESTS_LIST]", error);
    return NextResponse.json(
      { error: "Failed to list schedule requests" },
      { status: 500 }
    );
  }
}
