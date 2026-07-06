import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";

// PATCH /api/admin/schedule-requests/[id] — Approve or reject a schedule change request
// Body: { status: "approved" | "rejected", adminResponse?: string }
// Backward-compat: also accepts { action: "approve" | "reject" } for older clients.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, "schedules", "approve");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    // Normalize status — accept both new and legacy client payloads
    let status: string | undefined = body.status;
    if (!status && body.action) {
      status = body.action === "approve" ? "approved"
        : body.action === "reject" ? "rejected"
        : undefined;
    }
    const adminResponse: string | undefined = body.adminResponse;

    // Validate status
    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "status must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    // Find the request
    const changeRequest = await db.scheduleChangeRequest.findUnique({
      where: { id },
      include: {
        schedule: true,
        instructor: {
          select: { id: true, name: true },
        },
        course: {
          select: { id: true, titleFa: true, titleEn: true },
        },
      },
    });

    if (!changeRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (changeRequest.status !== "pending") {
      return NextResponse.json(
        { error: `Request has already been ${changeRequest.status}` },
        { status: 400 }
      );
    }

    // Validate proposedChanges is parseable BEFORE we touch anything
    let proposedChanges: any = null;
    if (status === "approved") {
      try {
        proposedChanges = JSON.parse(changeRequest.proposedChanges || "{}");
      } catch (parseError) {
        console.error("[SCHEDULE_REQUEST_PARSE]", parseError);
        return NextResponse.json(
          { error: "Cannot approve: proposed changes are malformed" },
          { status: 500 }
        );
      }

      // Validate dayOfWeek if present
      if (
        proposedChanges.dayOfWeek !== undefined &&
        (typeof proposedChanges.dayOfWeek !== "number" ||
          proposedChanges.dayOfWeek < 0 ||
          proposedChanges.dayOfWeek > 6)
      ) {
        return NextResponse.json(
          { error: "Invalid dayOfWeek in proposed changes" },
          { status: 400 }
        );
      }
    }

    // Wrap status update + schedule mutation + audit log in a transaction
    const updatedRequest = await db.$transaction(async (tx) => {
      // Update the request status
      const updated = await tx.scheduleChangeRequest.update({
        where: { id },
        data: {
          status,
          adminResponse: adminResponse || null,
          reviewedBy: auth.admin.id,
          reviewedAt: new Date(),
        },
        include: {
          instructor: {
            select: {
              id: true,
              name: true,
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
            },
          },
        },
      });

      // If approved, apply the proposed changes to the ClassSchedule record
      if (status === "approved") {
        const scheduleUpdateData: Record<string, unknown> = {};

        if (proposedChanges.dayOfWeek !== undefined) {
          scheduleUpdateData.dayOfWeek = proposedChanges.dayOfWeek;
        }
        if (proposedChanges.startTime !== undefined) {
          scheduleUpdateData.startTime = proposedChanges.startTime;
        }
        if (proposedChanges.endTime !== undefined) {
          scheduleUpdateData.endTime = proposedChanges.endTime;
        }
        if (proposedChanges.room !== undefined) {
          scheduleUpdateData.room = proposedChanges.room;
        }
        if (proposedChanges.specificDate !== undefined) {
          scheduleUpdateData.specificDate = proposedChanges.specificDate
            ? new Date(proposedChanges.specificDate)
            : null;
        }

        // Handle cancellation type: cancel the schedule
        if (changeRequest.requestType === "cancellation") {
          scheduleUpdateData.status = "cancelled";
          scheduleUpdateData.cancelledAt = new Date();
          scheduleUpdateData.cancelledBy = auth.admin.id;
          scheduleUpdateData.cancelReason = changeRequest.reason;
        }

        // Apply changes to the schedule
        if (Object.keys(scheduleUpdateData).length > 0) {
          await tx.classSchedule.update({
            where: { id: changeRequest.scheduleId },
            data: scheduleUpdateData,
          });
        }

        // Mark as applied (inside same transaction)
        await tx.scheduleChangeRequest.update({
          where: { id },
          data: {
            isApplied: true,
            appliedAt: new Date(),
          },
        });
      }

      return updated;
    });

    // Audit log (outside transaction so audit failures don't roll back the actual change)
    await writeAuditLog({
      adminId: auth.admin.id,
      action: status === "approved" ? "approve" : "reject",
      entity: "scheduleChangeRequest",
      entityId: id,
      entityName: `${changeRequest.instructor?.name || "Unknown"} - ${changeRequest.course?.titleFa || "Unknown"} - ${changeRequest.requestType}`,
      details: {
        requestType: changeRequest.requestType,
        reason: changeRequest.reason,
        proposedChanges: changeRequest.proposedChanges,
        adminResponse: adminResponse || null,
        isApplied: status === "approved",
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: status === "approved" ? "info" : "warning",
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("[ADMIN_SCHEDULE_REQUEST_UPDATE]", error);
    return NextResponse.json(
      { error: "Failed to update schedule request" },
      { status: 500 }
    );
  }
}

// GET /api/admin/schedule-requests/[id] — Fetch a single schedule change request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, "schedules", "read");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  try {
    const req = await db.scheduleChangeRequest.findUnique({
      where: { id },
      include: {
        instructor: { select: { id: true, name: true, specialtyFa: true, specialtyEn: true } },
        course: { select: { id: true, titleFa: true, titleEn: true } },
        schedule: true,
      },
    });
    if (!req) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    return NextResponse.json({ request: req });
  } catch (error) {
    console.error("[ADMIN_SCHEDULE_REQUEST_GET]", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
