import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";

// GET /api/admin/admin-messages - List messages for current admin
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, "messages", "read");
  if (!auth.ok) return auth.response;
  const session = auth.session;

  try {
    const url = request.nextUrl.searchParams;
    const filter = url.get("filter"); // sent | received | unread | all
    const limit = Math.min(parseInt(url.get("limit") || "50"), 200);
    const offset = parseInt(url.get("offset") || "0");

    const where: Record<string, unknown> = {};
    if (filter === "sent") where.senderId = auth.admin.id;
    else if (filter === "received") where.recipientId = auth.admin.id;
    else if (filter === "unread") {
      where.recipientId = auth.admin.id;
      where.status = { in: ["sent", "delivered"] };
    } else {
      where.OR = [{ senderId: auth.admin.id }, { recipientId: auth.admin.id }];
    }

    const [messages, total, unreadCount] = await Promise.all([
      db.adminMessage.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        include: {
          sender: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
          recipient: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
        },
      }),
      db.adminMessage.count({ where }),
      db.adminMessage.count({
        where: {
          recipientId: auth.admin.id,
          status: { in: ["sent", "delivered"] },
        },
      }),
    ]);

    return NextResponse.json({ messages, total, unreadCount });
  } catch (error) {
    console.error("[ADMIN_MESSAGES_LIST]", error);
    return NextResponse.json({ error: "Failed to list messages" }, { status: 500 });
  }
}

// POST /api/admin/admin-messages - Send a new message
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, "messages", "create");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { recipientId, subject, content, priority, parentMessageId } = body;

    if (!recipientId || !content) {
      return NextResponse.json(
        { error: "Recipient and content are required" },
        { status: 400 }
      );
    }

    // Verify recipient exists and is admin
    const recipient = await db.admin.findUnique({
      where: { id: recipientId },
      select: { id: true, name: true, isActive: true },
    });

    if (!recipient || !recipient.isActive) {
      return NextResponse.json(
        { error: "Recipient not found or inactive" },
        { status: 404 }
      );
    }

    const message = await db.adminMessage.create({
      data: {
        senderId: auth.admin.id,
        recipientId,
        subject: subject || "(بدون عنوان)",
        content,
        priority: priority || "normal",
        parentMessageId: parentMessageId || null,
        status: "sent",
      },
      include: {
        sender: { select: { id: true, name: true, email: true, role: true } },
        recipient: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    // Audit log
    await writeAuditLog({
      adminId: auth.admin.id,
      action: "create",
      entity: "admin_message",
      entityId: message.id,
      entityName: subject || "(بدون عنوان)",
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "info",
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_MESSAGE_CREATE]", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

// PUT /api/admin/admin-messages - Update message status (mark as read, archive, etc.)
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request, "messages", "update");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Message ID and status required" }, { status: 400 });
    }

    // Verify the user is the recipient
    const existing = await db.adminMessage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (existing.recipientId !== auth.admin.id) {
      return NextResponse.json({ error: "Only recipient can update message status" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = { status };
    if (status === "read") updateData.readAt = new Date();
    if (status === "archived") updateData.archivedBy = auth.admin.id;

    const message = await db.adminMessage.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("[ADMIN_MESSAGE_UPDATE]", error);
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
  }
}
