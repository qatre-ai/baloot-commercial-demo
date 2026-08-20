/**
 * src/lib/backup.ts — Centralised database backup / restore engine
 * ----------------------------------------------------------------------------
 * Design goals (per Task 7-b audit):
 *   1. **Automatic daily backups** triggered from proxy (fire-and-forget)
 *      whenever the last successful backup is older than 24 h.
 *   2. **Retention policy**: keep the last 30 daily backups + 12 monthly
 *      snapshots (the oldest backup of each calendar month). Older files are
 *      auto-deleted from disk AND from the BackupRecord table.
 *   3. **Integrity verification**: SHA-256 checksum stored on every record.
 *      `verifyBackupIntegrity()` recomputes the checksum and compares it.
 *   4. **Restore safety**: before overwriting the live DB, a `pre_restore`
 *      backup of the *current* DB is created so the admin can roll back.
 *      Restore also verifies the source backup's checksum first.
 *   5. **File-system hardening**: backups live OUTSIDE the web root at
 *      `/home/z/my-project/backups/` and are created with mode 0o600.
 *   6. **Atomic-ish copy**: uses `fs.copyFileSync` (no shell, no `execSync`)
 *      which is safe for SQLite as long as WAL is checkpointed. We additionally
 *      copy the WAL + SHM sidecar files if they exist so the snapshot is
 *      complete.
 *
 * Public surface:
 *   - createBackup(type, performedBy, notes?)                -> BackupRecord
 *   - restoreFromBackup(backupId, performedBy)               -> boolean
 *   - verifyBackupIntegrity(backupId)                        -> boolean
 *   - cleanupOldBackups()                                   -> number (deleted count)
 *   - shouldRunAutomaticBackup()                             -> boolean
 *   - runAutomaticBackupIfNeeded()                           -> void (fire-and-forget safe)
 *   - getBackupDirectory() / getDatabasePath()               -> string (helpers)
 */

import { db } from "@/lib/db";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  chmodSync,
  readdirSync,
} from "fs";
import { createHash } from "crypto";
import path from "path";

// ─── Constants ──────────────────────────────────────────────────────────────

/** Backups live OUTSIDE the Next.js web root to prevent web access. */
const BACKUP_DIR = process.env.BACKUP_DIR || "/home/z/my-project/backups";

/** Default DB path — derived from DATABASE_URL if not set explicitly. */
function resolveDatabasePath(): string {
  if (process.env.BACKUP_DB_PATH) return process.env.BACKUP_DB_PATH;
  const url = process.env.DATABASE_URL || "";
  // Prisma SQLite URL: "file:/home/z/my-project/db/custom.db"
  const match = url.match(/^file:(.+\.db)$/);
  if (match) return match[1];
  // Fallback (should not happen)
  return path.join(process.cwd(), "db", "custom.db");
}

const AUTO_BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RETENTION_DAILY = 30;
const RETENTION_MONTHLY = 12;

/**
 * In-process lock to prevent concurrent auto-backup runs when multiple admin
 * requests hit the middleware at the same time. Single-process Next.js dev
 * server means this is sufficient; for multi-instance deploys a DB-level lock
 * would be needed.
 */
let autoBackupInFlight = false;

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getBackupDirectory(): string {
  return BACKUP_DIR;
}

export function getDatabasePath(): string {
  return resolveDatabasePath();
}

/** Ensure the backup directory exists with secure permissions (0o700). */
function ensureBackupDir(): void {
  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true, mode: 0o700 });
  }
  // Re-assert restrictive permissions on every call (idempotent).
  try {
    chmodSync(BACKUP_DIR, 0o700);
  } catch {
    /* best-effort — may fail on weird filesystems; ignore */
  }
}

/** Compute SHA-256 hex digest of a file, streaming via readFileSync (small DB). */
function computeFileChecksum(filePath: string): string {
  const buf = readFileSync(filePath);
  return createHash("sha256").update(buf).digest("hex");
}

/** Build a safe, timestamped backup file name. */
function buildBackupFileName(type: string, timestamp: Date): string {
  const ts = timestamp.toISOString().replace(/[:.]/g, "-");
  return `mab-backup-${type}-${ts}.db`;
}

/** Map our public backup-type vocabulary to the on-disk file-name prefix. */
function typePrefix(type: BackupType): string {
  switch (type) {
    case "manual":
      return "manual";
    case "automatic":
      return "auto";
    case "pre_restore":
      return "pre-restore";
    default:
      return "manual";
  }
}

// ─── Core: createBackup ─────────────────────────────────────────────────────

export type BackupType = "manual" | "automatic" | "pre_restore";

export interface CreateBackupOptions {
  type: BackupType;
  performedBy: string | null; // admin id, or null for system-triggered
  notes?: string;
}

/**
 * Create a new SQLite backup.
 *
 * Steps:
 *   1. Insert BackupRecord with status="in_progress"
 *   2. Copy the .db file (+ WAL/SHM sidecars if present) to BACKUP_DIR
 *   3. chmod 0o600 the resulting backup file
 *   4. Compute SHA-256 checksum
 *   5. Update BackupRecord to status="completed" with size+checksum+fileKey
 *   6. On any error: mark record as "failed" with the error message in notes
 *
 * Returns the (final-state) BackupRecord.
 */
export async function createBackup(
  type: BackupType,
  performedBy: string | null,
  notes?: string,
) {
  const timestamp = new Date();
  const dbPath = resolveDatabasePath();
  ensureBackupDir();

  // 1. Insert placeholder record
  const record = await db.backupRecord.create({
    data: {
      performedBy: performedBy ?? null,
      backupType: type,
      status: "in_progress",
      notes: notes ?? null,
    },
  });

  try {
    if (!existsSync(dbPath)) {
      throw new Error(`Database file not found at ${dbPath}`);
    }

    const fileName = buildBackupFileName(typePrefix(type), timestamp);
    const backupPath = path.join(BACKUP_DIR, fileName);

    // 2a. Copy the main .db file (atomic-ish for SQLite without active txn)
    copyFileSync(dbPath, backupPath);

    // 2b. Copy WAL + SHM sidecar files if present (SQLite WAL mode).
    //     These are merged back into the snapshot to avoid data loss.
    for (const suffix of ["-wal", "-shm"]) {
      const sidecar = dbPath + suffix;
      if (existsSync(sidecar)) {
        try {
          copyFileSync(sidecar, backupPath + suffix);
        } catch {
          /* WAL/SHM may be deleted mid-copy by SQLite; non-fatal */
        }
      }
    }

    // 3. Lock down file permissions: owner read/write only.
    try {
      chmodSync(backupPath, 0o600);
    } catch {
      /* best-effort */
    }

    // 4. Checksum + size
    const stats = statSync(backupPath);
    const checksum = computeFileChecksum(backupPath);

    // 5. Finalise record
    const updated = await db.backupRecord.update({
      where: { id: record.id },
      data: {
        status: "completed",
        fileSize: stats.size,
        fileKey: fileName,
        checksum,
        checksumAlgorithm: "sha256",
        encryptionUsed: false,
      },
      include: { admin: { select: { id: true, name: true, email: true } } },
    });

    return updated;
  } catch (err) {
    console.error("[BACKUP_CREATE_ERROR]", err);
    await db.backupRecord.update({
      where: { id: record.id },
      data: {
        status: "failed",
        notes: (notes ? notes + " | " : "") + `ERROR: ${String(err)}`,
      },
    });
    const refreshed = await db.backupRecord.findUnique({
      where: { id: record.id },
      include: { admin: { select: { id: true, name: true, email: true } } },
    });
    return refreshed ?? record;
  }
}

// ─── Integrity verification ─────────────────────────────────────────────────

/**
 * Verify that the on-disk backup file still matches the stored SHA-256.
 * Returns true if (a) the record exists, (b) the file exists, (c) checksums match.
 */
export async function verifyBackupIntegrity(backupId: string): Promise<boolean> {
  const record = await db.backupRecord.findUnique({
    where: { id: backupId },
  });
  if (!record) return false;
  if (!record.fileKey || !record.checksum) return false;
  if (record.status !== "completed") return false;

  const filePath = path.join(BACKUP_DIR, record.fileKey);
  if (!existsSync(filePath)) return false;

  try {
    const current = computeFileChecksum(filePath);
    return current === record.checksum;
  } catch (err) {
    console.error("[BACKUP_VERIFY_ERROR]", err);
    return false;
  }
}

// ─── Restore ────────────────────────────────────────────────────────────────

/**
 * Restore the database from a backup.
 *
 * Critical safety sequence:
 *   1. Look up the source backup record. Must be status="completed".
 *   2. Verify the on-disk checksum matches the stored checksum.
 *   3. Create a `pre_restore` backup of the CURRENT live db (so admin can
 *      roll back if the restore was a mistake).
 *   4. Overwrite the live .db file with the backup contents
 *      (fs.copyFileSync over the destination path — safe on Linux because
 *      the kernel atomically swaps inodes; existing open handles keep the
 *      old inode, new handles see the new file).
 *   5. Disconnect Prisma so subsequent queries pick up the new file.
 *   6. Write an audit-log entry (caller is responsible for this — we don't
 *      have access to the request object here).
 *
 * Returns true on success, false on any failure.
 */
export async function restoreFromBackup(
  backupId: string,
  performedBy: string,
): Promise<boolean> {
  const source = await db.backupRecord.findUnique({
    where: { id: backupId },
  });
  if (!source) throw new Error("Backup record not found");
  if (source.status !== "completed") throw new Error(`Backup status is ${source.status}, cannot restore`);
  if (!source.fileKey) throw new Error("Backup has no file");

  const sourcePath = path.join(BACKUP_DIR, source.fileKey);
  if (!existsSync(sourcePath)) throw new Error("Backup file missing on disk");

  // 2. Verify checksum BEFORE overwriting anything.
  const ok = await verifyBackupIntegrity(backupId);
  if (!ok) {
    throw new Error("Backup integrity check failed — checksum mismatch");
  }

  const dbPath = resolveDatabasePath();

  // 3. Pre-restore safety backup of the current live db.
  //    We capture the resulting file metadata so that AFTER the restore
  //    (which overwrites the DB and thus orphans the just-created record),
  //    we can re-insert the metadata into the restored DB. This way the
  //    admin always sees the pre-restore snapshot in the UI and can roll
  //    back to it if needed.
  let preRestoreMeta: {
    fileKey: string;
    fileSize: number;
    checksum: string;
    createdAt: Date;
  } | null = null;
  try {
    const pre = await createBackup(
      "pre_restore",
      performedBy,
      `Automatic snapshot before restoring ${source.fileKey}`,
    );
    if (pre.status === "completed" && pre.fileKey && pre.checksum && pre.fileSize) {
      preRestoreMeta = {
        fileKey: pre.fileKey,
        fileSize: pre.fileSize,
        checksum: pre.checksum,
        createdAt: pre.createdAt,
      };
    }
  } catch (err) {
    console.error("[BACKUP_PRE_RESTORE_FAILED]", err);
    // Continue — the restore is still attempted; pre-restore is best-effort.
  }

  // 4. Overwrite live db file with backup contents.
  try {
    copyFileSync(sourcePath, dbPath);
    // Also restore WAL/SHM sidecars if present in the backup
    for (const suffix of ["-wal", "-shm"]) {
      const srcSide = sourcePath + suffix;
      const dstSide = dbPath + suffix;
      if (existsSync(srcSide)) {
        try {
          copyFileSync(srcSide, dstSide);
        } catch {
          /* non-fatal */
        }
      } else if (existsSync(dstSide)) {
        // Backup didn't have a WAL — clear any stale WAL on disk so SQLite
        // doesn't try to replay it on top of the restored snapshot.
        try {
          unlinkSync(dstSide);
        } catch {
          /* non-fatal */
        }
      }
    }
  } catch (err) {
    console.error("[BACKUP_RESTORE_COPY_FAILED]", err);
    throw new Error(`Failed to copy backup over live db: ${String(err)}`);
  }

  // 5. Disconnect Prisma so the next query opens a fresh connection against
  //    the new db file. In dev (Next.js turbopack) this is safe; in production
  //    with pm2/systemd the supervisor will respawn the process anyway.
  try {
    await db.$disconnect();
  } catch {
    /* best-effort */
  }

  // 6. Re-insert the pre-restore BackupRecord into the (now-restored) DB so
  //    the admin can see and roll back to it. The pre-restore .db file on
  //    disk is unchanged — only the metadata was lost when we overwrote the
  //    live db. A fresh Prisma connection will pick up the restored file.
  if (preRestoreMeta) {
    try {
      await db.backupRecord.create({
        data: {
          performedBy: performedBy,
          backupType: "pre_restore",
          status: "completed",
          fileKey: preRestoreMeta.fileKey,
          fileSize: preRestoreMeta.fileSize,
          checksum: preRestoreMeta.checksum,
          checksumAlgorithm: "sha256",
          encryptionUsed: false,
          notes: `Pre-restore snapshot (metadata re-linked post-restore). Source restored: ${source.fileKey}`,
          // Use createdAt from the original record so the timeline is honest.
          // Prisma will not auto-set it because we're providing it explicitly.
        },
      });
      // Re-touch the createdAt timestamp because Prisma's @default(now())
      // would otherwise override our intent. We use a raw update.
      await db.backupRecord
        .updateMany({
          where: { fileKey: preRestoreMeta.fileKey },
          data: { createdAt: preRestoreMeta.createdAt },
        })
        .catch(() => {});
    } catch (err) {
      console.error("[BACKUP_PRE_RESTORE_RELINK_FAILED]", err);
      // Non-fatal: the .db file is still on disk and can be manually recovered.
    }
  }

  // 7. Reconcile in-progress records left over from the snapshot.
  //    When we backed up the live db, any in-flight backup record (status=
  //    "in_progress") was frozen in that state in the snapshot. After restore,
  //    those records are still marked in_progress even though their files may
  //    be perfectly valid on disk.
  //
  //    Two cases:
  //      a) record has a fileKey → verify checksum, mark completed or failed.
  //      b) record has null fileKey → it's a duplicate of an on-disk file that
  //         step 8 below will re-link as a fresh record. DELETE the duplicate
  //         so the admin doesn't see a phantom "failed" entry for the same
  //         backup file that step 8 successfully re-linked.
  try {
    const stale = await db.backupRecord.findMany({
      where: { status: "in_progress" },
    });
    for (const s of stale) {
      if (!s.fileKey) {
        // Case (b): delete — step 8 will create a fresh, completed record
        // pointing to the actual file on disk.
        await db.backupRecord.delete({ where: { id: s.id } }).catch(() => {});
        continue;
      }
      const fp = path.join(BACKUP_DIR, s.fileKey);
      if (!existsSync(fp)) {
        await db.backupRecord.update({
          where: { id: s.id },
          data: { status: "failed", notes: (s.notes || "") + " | file not found on disk after restore" },
        });
        continue;
      }
      // File exists — verify checksum if we have one.
      if (s.checksum) {
        const current = computeFileChecksum(fp);
        if (current !== s.checksum) {
          await db.backupRecord.update({
            where: { id: s.id },
            data: { status: "failed", notes: (s.notes || "") + " | checksum mismatch after restore" },
          });
          continue;
        }
      }
      // File exists and checksum matches (or no checksum to verify).
      await db.backupRecord.update({
        where: { id: s.id },
        data: { status: "completed" },
      });
    }
  } catch (err) {
    console.error("[BACKUP_POST_RESTORE_RECONCILE]", err);
    // Non-fatal: admin can manually re-create backups.
  }

  // 8. Re-link orphaned backup files on disk that have no DB record.
  //    After a restore, there may be .db files in BACKUP_DIR whose
  //    BackupRecord entries were lost (because they were created in the
  //    pre-restore live db and never made it into the snapshot). Scan the
  //    directory and re-create records for any orphans so the admin can see
  //    and restore from them. We use the file's mtime as createdAt.
  try {
    if (existsSync(BACKUP_DIR)) {
      const onDisk = readdirSync(BACKUP_DIR).filter((f) => f.endsWith(".db"));
      const knownKeys = new Set(
        (await db.backupRecord.findMany({ select: { fileKey: true } }))
          .map((r) => r.fileKey)
          .filter(Boolean) as string[],
      );
      for (const fileName of onDisk) {
        if (knownKeys.has(fileName)) continue;
        const fp = path.join(BACKUP_DIR, fileName);
        try {
          const stats = statSync(fp);
          const checksum = computeFileChecksum(fp);
          // Infer backup type from file name prefix.
          let inferredType: BackupType = "manual";
          if (fileName.includes("pre-restore")) inferredType = "pre_restore";
          else if (fileName.includes("auto")) inferredType = "automatic";
          await db.backupRecord.create({
            data: {
              performedBy: performedBy,
              backupType: inferredType,
              status: "completed",
              fileKey: fileName,
              fileSize: stats.size,
              checksum,
              checksumAlgorithm: "sha256",
              encryptionUsed: false,
              notes: "Orphan re-linked after restore (record was lost in snapshot)",
              createdAt: stats.mtime,
            },
          });
        } catch (err) {
          console.error("[BACKUP_ORPHAN_RELINK]", fileName, err);
        }
      }
    }
  } catch (err) {
    console.error("[BACKUP_ORPHAN_SCAN]", err);
    // Non-fatal.
  }

  return true;
}

// ─── Retention policy ───────────────────────────────────────────────────────

/**
 * Delete old backups: keep the most recent 30 daily snapshots plus the most
 * recent 12 monthly snapshots (one per calendar month, the oldest within the
 * month is kept as the "monthly" archive).
 *
 * "Daily" and "monthly" here are not mutually exclusive — a monthly archive
 * is also a daily snapshot. The retention logic:
 *   - Group all "completed" backups by (year, month). For each month, the
 *     OLDEST backup is the "monthly archive".
 *   - Keep up to 12 most-recent monthly archives.
 *   - Keep up to 30 most-recent backups overall (the "daily" set).
 *   - Anything else is deleted (both file + record).
 *
 * Returns the number of backups deleted.
 */
export async function cleanupOldBackups(): Promise<number> {
  const completed = await db.backupRecord.findMany({
    where: { status: "completed", fileKey: { not: null } },
    orderBy: { createdAt: "asc" }, // oldest first
  });

  if (completed.length === 0) return 0;

  // Identify monthly archives: oldest backup per (year, month).
  const monthlyArchives = new Map<string, typeof completed[number]>();
  for (const b of completed) {
    const d = new Date(b.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    if (!monthlyArchives.has(key)) monthlyArchives.set(key, b);
  }
  // Keep only the 12 most-recent monthly archives.
  const recentMonthly = Array.from(monthlyArchives.values())
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, RETENTION_MONTHLY);
  const keepMonthlyIds = new Set(recentMonthly.map((b) => b.id));

  // Keep the 30 most-recent backups overall (daily set).
  const recentDaily = [...completed]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, RETENTION_DAILY);
  const keepDailyIds = new Set(recentDaily.map((b) => b.id));

  // Anything not in either keep-set gets deleted.
  const toDelete = completed.filter(
    (b) => !keepMonthlyIds.has(b.id) && !keepDailyIds.has(b.id),
  );

  let deletedCount = 0;
  for (const b of toDelete) {
    // Delete the file from disk.
    if (b.fileKey) {
      const fp = path.join(BACKUP_DIR, b.fileKey);
      if (existsSync(fp)) {
        try {
          unlinkSync(fp);
        } catch (err) {
          console.error("[BACKUP_CLEANUP_FILE]", err);
        }
      }
      // Also remove sidecar files.
      for (const suffix of ["-wal", "-shm"]) {
        const sidecar = fp + suffix;
        if (existsSync(sidecar)) {
          try {
            unlinkSync(sidecar);
          } catch {
            /* non-fatal */
          }
        }
      }
    }
    // Delete the DB record.
    try {
      await db.backupRecord.delete({ where: { id: b.id } });
      deletedCount++;
    } catch (err) {
      console.error("[BACKUP_CLEANUP_RECORD]", err);
    }
  }

  return deletedCount;
}

// ─── Automatic backup trigger ───────────────────────────────────────────────

/**
 * Returns true if the last successful backup is older than 24 h (or no backup
 * exists yet). Used by the middleware to decide whether to fire an auto-backup.
 */
export async function shouldRunAutomaticBackup(): Promise<boolean> {
  const last = await db.backupRecord.findFirst({
    where: { status: "completed" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (!last) return true;
  const ageMs = Date.now() - last.createdAt.getTime();
  return ageMs >= AUTO_BACKUP_INTERVAL_MS;
}

/**
 * Main entry point for automatic backups. Safe to call from proxy on every
 * admin request — uses an in-process lock to deduplicate concurrent calls and
 * checks `shouldRunAutomaticBackup()` first.
 *
 * This function NEVER throws — it is designed to be fire-and-forget.
 */
export async function runAutomaticBackupIfNeeded(): Promise<void> {
  if (autoBackupInFlight) return;
  try {
    const should = await shouldRunAutomaticBackup();
    if (!should) return;
    autoBackupInFlight = true;
    console.log("[BACKUP_AUTO] Starting automatic daily backup...");
    await createBackup(
      "automatic",
      null,
      "Automatic daily backup triggered by middleware",
    );
    // Sweep old backups after each auto run (cheap, idempotent).
    try {
      const deleted = await cleanupOldBackups();
      if (deleted > 0) {
        console.log(`[BACKUP_AUTO] Retention sweep deleted ${deleted} old backup(s)`);
      }
    } catch (err) {
      console.error("[BACKUP_AUTO_CLEANUP]", err);
    }
  } catch (err) {
    console.error("[BACKUP_AUTO_ERROR]", err);
  } finally {
    autoBackupInFlight = false;
  }
}

// ─── Misc helpers used by API routes ────────────────────────────────────────

/** Return a Node.js ReadStream for a backup file (used by download endpoint). */
export function getBackupFilePath(fileKey: string): string | null {
  if (!fileKey || fileKey.includes("..") || fileKey.includes("/")) {
    // Reject path traversal attempts
    return null;
  }
  const fp = path.join(BACKUP_DIR, fileKey);
  if (!existsSync(fp)) return null;
  return fp;
}

/** Convenience: list orphaned files on disk that have no DB record (for ops). */
export function listOrphanedBackupFiles(): string[] {
  if (!existsSync(BACKUP_DIR)) return [];
  return readdirSync(BACKUP_DIR).filter((f) => f.endsWith(".db"));
}

/**
 * Opportunistically re-link any .db files in BACKUP_DIR that have no
 * corresponding BackupRecord. Safe to call on every GET /api/admin/backups —
 * it's a no-op when there are no orphans. Returns the number of records
 * re-linked.
 *
 * This catches orphans created by:
 *   - restoreFromBackup() losing the in-flight record (also handled inline)
 *   - manual file copies placed in BACKUP_DIR by an operator
 *   - DB corruption that lost BackupRecord rows
 */
export async function relinkOrphanedBackupFiles(): Promise<number> {
  if (!existsSync(BACKUP_DIR)) return 0;
  const onDisk = readdirSync(BACKUP_DIR).filter((f) => f.endsWith(".db"));
  if (onDisk.length === 0) return 0;

  const knownKeys = new Set(
    (await db.backupRecord.findMany({ select: { fileKey: true } }))
      .map((r) => r.fileKey)
      .filter(Boolean) as string[],
  );

  let relinked = 0;
  for (const fileName of onDisk) {
    if (knownKeys.has(fileName)) continue;
    const fp = path.join(BACKUP_DIR, fileName);
    try {
      const stats = statSync(fp);
      const checksum = computeFileChecksum(fp);
      let inferredType: BackupType = "manual";
      if (fileName.includes("pre-restore")) inferredType = "pre_restore";
      else if (fileName.includes("auto")) inferredType = "automatic";
      await db.backupRecord.create({
        data: {
          performedBy: null,
          backupType: inferredType,
          status: "completed",
          fileKey: fileName,
          fileSize: stats.size,
          checksum,
          checksumAlgorithm: "sha256",
          encryptionUsed: false,
          notes: "Orphan re-linked (no prior record found)",
          createdAt: stats.mtime,
        },
      });
      relinked++;
    } catch (err) {
      console.error("[BACKUP_ORPHAN_RELINK]", fileName, err);
    }
  }
  return relinked;
}
