import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";

// GET /api/admin/messages - List all contact messages
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, "contact_messages", "read");
  if (!auth.ok) return auth.response;

  try {
    const url = request.nextUrl.searchParams;
    const filter = url.get("filter"); // "unread" | "read" | null (all)
    const limit = Math.min(parseInt(url.get("limit") || "50"), 200);
    const offset = parseInt(url.get("offset") || "0");

    const where: Record<string, unknown> = {};
    if (filter === "unread") where.isRead = false;
    if (filter === "read") where.isRead = true;

    const [messages, total, unreadCount] = await Promise.all([
      db.contactMessage.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      }),
      db.contactMessage.count({ where }),
      db.contactMessage.count({ where: { isRead: false } }),
    ]);

    return NextResponse.json({ messages, total, unreadCount });
  } catch (error) {
    console.error("[MESSAGES_LIST]", error);
    return NextResponse.json({ error: "Failed to list messages" }, { status: 500 });
  }
}

// PUT /api/admin/messages - Mark message as read
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request, "contact_messages", "update");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { id, isRead } = body;

    if (!id) {
      return NextResponse.json({ error: "Message ID required" }, { status: 400 });
    }

    const message = await db.contactMessage.update({
      where: { id },
      data: { isRead: isRead ?? true },
    });

    // Audit log
    await writeAuditLog({
      adminId: auth.admin.id,
      action: "update",
      entity: "contact_message",
      entityId: id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "info",
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("[MESSAGE_UPDATE]", error);
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
  }
}

// DELETE /api/admin/messages - Delete a message
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request, "contact_messages", "delete");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Message ID required" }, { status: 400 });
    }

    await db.contactMessage.delete({ where: { id } });

    // Audit log
    await writeAuditLog({
      adminId: auth.admin.id,
      action: "delete",
      entity: "contact_message",
      entityId: id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "warning",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MESSAGE_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
