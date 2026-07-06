import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  requireSuperAdmin,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";
import {
  restoreFromBackup,
  verifyBackupIntegrity,
  getBackupFilePath,
  getBackupDirectory,
} from "@/lib/backup";
import { createReadStream, statSync } from "fs";
import path from "path";

// ─── GET /api/admin/backups/[id] ────────────────────────────────────────────
// Returns the backup record metadata. If `?download=true` is supplied, streams
// the .db file as an attachment (super_admin only).

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const backup = await db.backupRecord.findUnique({
    where: { id },
    include: { admin: { select: { id: true, name: true, email: true } } },
  });

  if (!backup) {
    return NextResponse.json({ error: "Backup not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const wantDownload = url.searchParams.get("download") === "true";

  if (!wantDownload) {
    return NextResponse.json({ backup });
  }

  // ── Download mode ──────────────────────────────────────────────────────
  if (!backup.fileKey) {
    return NextResponse.json({ error: "Backup has no file" }, { status: 400 });
  }
  if (backup.status !== "completed") {
    return NextResponse.json(
      { error: "Backup not in completed state" },
      { status: 400 },
    );
  }

  const filePath = getBackupFilePath(backup.fileKey);
  if (!filePath) {
    return NextResponse.json({ error: "Backup file missing on disk" }, { status: 404 });
  }

  // Verify checksum before allowing download (defence in depth — we don't
  // want to ship a tampered-with backup file).
  const ok = await verifyBackupIntegrity(id);
  if (!ok) {
    await writeAuditLog({
      adminId: auth.admin.id,
      action: "backup_download_failed",
      entity: "system",
      entityId: id,
      entityName: backup.fileKey,
      details: { reason: "checksum_mismatch" },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "critical",
    });
    return NextResponse.json(
      { error: "Backup integrity check failed — file may have been tampered with" },
      { status: 422 },
    );
  }

  // Audit log: downloads are sensitive (full DB dump).
  await writeAuditLog({
    adminId: auth.admin.id,
    action: "backup_download",
    entity: "system",
    entityId: id,
    entityName: backup.fileKey,
    details: { fileSize: backup.fileSize },
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
    severity: "critical",
  });

  const stats = statSync(filePath);
  const stream = createReadStream(filePath);

  // Use a Response with a ReadableStream so Next.js streams the file.
  const webStream = new ReadableStream<Uint8Array>({
    start(controller) {
      stream.on("data", (chunk: Buffer | string) => {
        const bytes = typeof chunk === "string"
          ? new TextEncoder().encode(chunk)
          : new Uint8Array(chunk);
        controller.enqueue(bytes);
      });
      stream.on("end", () => controller.close());
      stream.on("error", (err) => controller.error(err));
    },
  });

  const safeName = backup.fileKey.replace(/[^\w.-]/g, "_");

  return new Response(webStream, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(stats.size),
      "Content-Disposition": `attachment; filename="${safeName}"`,
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

// ─── POST /api/admin/backups/[id]/restore ─────────────────────────────────
// Restore the database from a backup. Super_admin only.
// Body: { confirm: true } required to prevent accidental restores.

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  // Require explicit confirmation token from the client.
  if (body?.confirm !== true) {
    return NextResponse.json(
      {
        error: "Restore requires confirm:true in the request body",
        hint: "This is a safety guard against accidental restores.",
      },
      { status: 400 },
    );
  }

  // Refuse to restore from anything other than a completed backup.
  const source = await db.backupRecord.findUnique({ where: { id } });
  if (!source) {
    return NextResponse.json({ error: "Backup not found" }, { status: 404 });
  }
  if (source.status !== "completed") {
    return NextResponse.json(
      { error: `Backup status is ${source.status}, cannot restore` },
      { status: 400 },
    );
  }

  try {
    // Audit log BEFORE the restore (in case restore crashes the process).
    await writeAuditLog({
      adminId: auth.admin.id,
      action: "backup_restore_start",
      entity: "system",
      entityId: id,
      entityName: source.fileKey || id,
      details: { sourceBackupId: id },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "critical",
    });

    const success = await restoreFromBackup(id, auth.admin.id);

    await writeAuditLog({
      adminId: auth.admin.id,
      action: "backup_restore_complete",
      entity: "system",
      entityId: id,
      entityName: source.fileKey || id,
      details: { success, sourceBackupId: id },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "critical",
    });

    if (!success) {
      return NextResponse.json(
        { error: "Restore failed — see server logs" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message:
        "Restore complete. A pre-restore snapshot was created. The application may need a moment to reconnect to the database.",
    });
  } catch (err: any) {
    console.error("[BACKUP_RESTORE_ERROR]", err);
    await writeAuditLog({
      adminId: auth.admin.id,
      action: "backup_restore_failed",
      entity: "system",
      entityId: id,
      entityName: source.fileKey || id,
      details: { error: String(err?.message || err) },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: "critical",
    });
    return NextResponse.json(
      { error: `Restore failed: ${String(err?.message || err)}` },
      { status: 500 },
    );
  }
}

// ─── DELETE /api/admin/backups/[id] ───────────────────────────────────────
// Delete a single backup (file + record). Super_admin only.
// Refuses to delete the ONLY completed backup (must always have ≥ 1).

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const backup = await db.backupRecord.findUnique({ where: { id } });
  if (!backup) {
    return NextResponse.json({ error: "Backup not found" }, { status: 404 });
  }

  // Count completed backups — refuse to delete the last one.
  const completedCount = await db.backupRecord.count({
    where: { status: "completed" },
  });
  if (backup.status === "completed" && completedCount <= 1) {
    return NextResponse.json(
      { error: "Cannot delete the only completed backup — system must always have at least one" },
      { status: 400 },
    );
  }

  // Delete the file from disk.
  if (backup.fileKey) {
    const fp = path.join(getBackupDirectory(), backup.fileKey);
    try {
      const { unlinkSync, existsSync } = await import("fs");
      if (existsSync(fp)) unlinkSync(fp);
      // Also delete sidecars.
      for (const suffix of ["-wal", "-shm"]) {
        const side = fp + suffix;
        if (existsSync(side)) {
          try {
            unlinkSync(side);
          } catch {
            /* non-fatal */
          }
        }
      }
    } catch (err) {
      console.error("[BACKUP_DELETE_FILE]", err);
    }
  }

  await db.backupRecord.delete({ where: { id } });

  await writeAuditLog({
    adminId: auth.admin.id,
    action: "backup_delete",
    entity: "system",
    entityId: id,
    entityName: backup.fileKey || id,
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
    severity: "critical",
  });

  return NextResponse.json({ ok: true });
}
