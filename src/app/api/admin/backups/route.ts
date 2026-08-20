import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  requireSuperAdmin,
  writeAuditLog,
  getClientIp,
  getUserAgent,
} from "@/lib/auth/session";
import {
  createBackup,
  cleanupOldBackups,
  runAutomaticBackupIfNeeded,
  relinkOrphanedBackupFiles,
} from "@/lib/backup";

// GET /api/admin/backups - List backup records
export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    // Opportunistically re-link any orphaned .db files on disk that have no
    // BackupRecord. This is a cheap no-op when there are no orphans and
    // ensures the admin always sees every backup file in the UI.
    try {
      await relinkOrphanedBackupFiles();
    } catch (err) {
      console.error("[BACKUPS_ORPHAN_RELINK]", err);
    }

    const backups = await db.backupRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        admin: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ backups });
  } catch (error) {
    console.error("[BACKUPS_LIST]", error);
    return NextResponse.json({ error: "Failed to list backups" }, { status: 500 });
  }
}

// POST /api/admin/backups - Create manual backup
export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const { notes, type } = body || {};

    // Allow super_admin to also trigger retention sweep via ?cleanup=true
    const url = new URL(request.url);
    const wantCleanup = url.searchParams.get("cleanup") === "true";

    if (wantCleanup) {
      const deleted = await cleanupOldBackups();
      await writeAuditLog({
        adminId: auth.admin.id,
        action: "backup_cleanup",
        entity: "system",
        entityName: "Backup retention sweep",
        details: { deletedCount: deleted },
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
        severity: "warning",
      });
      return NextResponse.json({ deletedCount: deleted });
    }

    // Use the supplied type if it's a known value (super_admin only ever
    // hits this endpoint, so trust the input — default to "manual").
    const backupType: "manual" | "automatic" | "pre_restore" =
      type === "automatic" || type === "pre_restore" ? type : "manual";

    const backup = await createBackup(
      backupType,
      auth.admin.id,
      typeof notes === "string" ? notes : undefined,
    );

    // Audit log
    await writeAuditLog({
      adminId: auth.admin.id,
      action: "backup",
      entity: "system",
      entityId: backup.id,
      entityName: `${backupType === "manual" ? "Manual" : backupType} Backup`,
      details: {
        status: backup.status,
        fileSize: backup.fileSize,
        fileKey: backup.fileKey,
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      severity: backup.status === "completed" ? "warning" : "critical",
    });

    return NextResponse.json({ backup }, { status: 201 });
  } catch (error) {
    console.error("[BACKUP_CREATE]", error);
    return NextResponse.json({ error: "Failed to create backup" }, { status: 500 });
  }
}

// ─── Internal auto-backup endpoint ─────────────────────────────────────────
//
// Called fire-and-forget by src/proxy.ts on every admin request when the
// last successful backup is older than 24 h. NOT protected by requireSuperAdmin
// because the middleware cannot attach an admin session — instead we restrict
// to loopback origins and require a shared internal secret header.
//
// The check inside `runAutomaticBackupIfNeeded` is the real gatekeeper: it
// only fires when a backup is actually due, and uses an in-process lock to
// dedupe concurrent calls.

const INTERNAL_AUTO_TOKEN = process.env.BACKUP_AUTO_TOKEN || "mab-internal-auto-backup";

export async function PUT(request: NextRequest) {
  // Only accept calls that carry the internal shared secret. This is defence
  // in depth — even if someone discovers the endpoint, they can't trigger
  // a backup storm without the token.
  const supplied = request.headers.get("x-internal-backup-token");
  if (supplied !== INTERNAL_AUTO_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fire-and-forget: do NOT await in middleware, but here we DO await so the
  // caller (internal fetch) gets a final status. The work itself is bounded:
  // createBackup() for a ~1.2 MB SQLite file is < 100 ms.
  try {
    await runAutomaticBackupIfNeeded();
    return NextResponse.json({ ok: true, message: "Auto-backup check complete" });
  } catch (err) {
    console.error("[BACKUP_AUTO_ENDPOINT_ERROR]", err);
    return NextResponse.json(
      { ok: false, error: "Auto-backup failed" },
      { status: 500 },
    );
  }
}
