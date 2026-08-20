"use client";
import { authFetch } from "@/lib/auth/store";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { deferEffect } from "@/lib/react/defer-effect";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Database, Download, Loader2, CheckCircle2, XCircle, Clock,
  HardDrive, Plus, RotateCcw, Trash2, ShieldCheck, RefreshCw,
} from "lucide-react";

interface BackupEntry {
  id: string;
  performedBy: string | null;
  backupType: string;
  fileSize: number | null;
  fileKey: string | null;
  checksum: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  admin: { id: string; name: string; email: string } | null;
}

export function BackupsTab() {
  const { isRTL } = useI18n();
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSweeping, setIsSweeping] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [backupNotes, setBackupNotes] = useState("");
  const [restoreTarget, setRestoreTarget] = useState<BackupEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BackupEntry | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const refreshingRef = useRef(false);

  const fetchBackups = useCallback(async (silent = false) => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    if (!silent) setIsLoading(true);
    try {
      const res = await authFetch("/api/admin/backups");
      if (res.ok) {
        const data = await res.json();
        setBackups(data.backups || []);
        setLastRefresh(new Date());
      }
    } catch {
      if (!silent) toast.error(isRTL ? "خطا در بارگذاری" : "Failed to load");
    } finally {
      if (!silent) setIsLoading(false);
      refreshingRef.current = false;
    }
  }, [isRTL]);

  useEffect(() => { deferEffect(fetchBackups); }, [fetchBackups]);

  // Auto-refresh every 60 seconds (silent — no loading spinner).
  useEffect(() => {
    const id = setInterval(() => fetchBackups(true), 60_000);
    return () => clearInterval(id);
  }, [fetchBackups]);

  const handleCreateBackup = async () => {
    setIsCreating(true);
    try {
      const res = await authFetch("/api/admin/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: backupNotes || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.backup?.status === "completed") {
          toast.success(isRTL ? "بکاپ با موفقیت ایجاد شد" : "Backup created successfully");
        } else {
          toast.warning(isRTL ? "بکاپ با خطا مواجه شد" : "Backup encountered an error");
        }
        setShowBackupDialog(false);
        setBackupNotes("");
        fetchBackups(true);
      } else {
        toast.error(isRTL ? "خطا در ایجاد بکاپ" : "Failed to create backup");
      }
    } catch {
      toast.error(isRTL ? "خطا در ارتباط" : "Connection error");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSweep = async () => {
    setIsSweeping(true);
    try {
      const res = await authFetch("/api/admin/backups?cleanup=true", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        const n = data.deletedCount ?? 0;
        toast.success(
          isRTL
            ? `پاکسازی انجام شد (${n} بکاپ قدیمی حذف شد)`
            : `Retention sweep complete (${n} old backup(s) deleted)`,
        );
        fetchBackups(true);
      } else {
        toast.error(isRTL ? "خطا در پاکسازی" : "Sweep failed");
      }
    } catch {
      toast.error(isRTL ? "خطا در ارتباط" : "Connection error");
    } finally {
      setIsSweeping(false);
    }
  };

  const handleDownload = async (backup: BackupEntry) => {
    try {
      // Use a direct fetch with session header — authFetch doesn't expose blob()
      const res = await authFetch(`/api/admin/backups/${backup.id}?download=true`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || (isRTL ? "خطا در دانلود" : "Download failed"));
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = backup.fileKey || `backup-${backup.id}.db`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(isRTL ? "دانلود شروع شد" : "Download started");
    } catch {
      toast.error(isRTL ? "خطا در ارتباط" : "Connection error");
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setIsRestoring(true);
    try {
      const res = await authFetch(`/api/admin/backups/${restoreTarget.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(
          isRTL
            ? "بازیابی انجام شد. یک بکاپ pre-restore از دیتابیس قبلی ایجاد شد."
            : "Restore complete. A pre-restore snapshot was created.",
        );
        setRestoreTarget(null);
        // Wait briefly then refresh — the db may have been swapped.
        setTimeout(() => fetchBackups(true), 1500);
      } else {
        toast.error(data.error || (isRTL ? "خطا در بازیابی" : "Restore failed"));
      }
    } catch {
      toast.error(isRTL ? "خطا در ارتباط" : "Connection error");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await authFetch(`/api/admin/backups/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(isRTL ? "بکاپ حذف شد" : "Backup deleted");
        setDeleteTarget(null);
        fetchBackups(true);
      } else {
        toast.error(data.error || (isRTL ? "خطا در حذف" : "Delete failed"));
      }
    } catch {
      toast.error(isRTL ? "خطا در ارتباط" : "Connection error");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string; icon: React.ElementType }> = {
      completed: { label: isRTL ? "تکمیل شده" : "Completed", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle2 },
      in_progress: { label: isRTL ? "در حال انجام" : "In Progress", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Loader2 },
      failed: { label: isRTL ? "ناموفق" : "Failed", color: "bg-red-500/10 text-red-600 border-red-500/20", icon: XCircle },
      restoring: { label: isRTL ? "در حال بازیابی" : "Restoring", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Clock },
    };
    const c = config[status] || config.failed;
    return <Badge variant="outline" className={cn("text-[10px] border gap-1", c.color)}><c.icon className={cn("w-3 h-3", status === "in_progress" && "animate-spin")} />{c.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const config: Record<string, { label: string; color: string }> = {
      manual: { label: isRTL ? "دستی" : "Manual", color: "bg-primary/10 text-primary border-primary/20" },
      automatic: { label: isRTL ? "خودکار" : "Automatic", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
      pre_restore: { label: isRTL ? "قبل از بازیابی" : "Pre-Restore", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
      // Backward compat with old type names
      auto_daily: { label: isRTL ? "خودکار روزانه" : "Auto Daily", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
      auto_weekly: { label: isRTL ? "خودکار هفتگی" : "Auto Weekly", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
      before_update: { label: isRTL ? "قبل از آپدیت" : "Before Update", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    };
    const c = config[type] || { label: type, color: "bg-slate-500/10 text-slate-600 border-slate-500/20" };
    return <Badge variant="outline" className={cn("text-[10px] border", c.color)}>{c.label}</Badge>;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className={cn("flex items-center justify-between gap-3 flex-wrap", isRTL && "flex-row-reverse")}>
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <Database className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">{isRTL ? "مدیریت بکاپ‌ها" : "Backup Management"}</h3>
          <Badge variant="outline" className="text-[10px]">{backups.length} {isRTL ? "بکاپ" : "backups"}</Badge>
          <span className="text-[10px] text-muted-foreground">
            {isRTL ? "بروزرسانی خودکار هر ۶۰ ثانیه" : "Auto-refresh 60s"} ·{" "}
            {lastRefresh.toLocaleTimeString(isRTL ? "fa-IR" : "en-US")}
          </span>
        </div>
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <Button size="sm" variant="outline" onClick={() => fetchBackups()} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            {isRTL ? "بروزرسانی" : "Refresh"}
          </Button>
          <Button size="sm" variant="outline" onClick={handleSweep} disabled={isSweeping} className="gap-1.5">
            {isSweeping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            {isRTL ? "پاکسازی قدیمی‌ها" : "Sweep Old"}
          </Button>
          <Button size="sm" onClick={() => setShowBackupDialog(true)} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            {isRTL ? "بکاپ دستی" : "Manual Backup"}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/30 border border-border/30 rounded-md px-3 py-2">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>
          {isRTL
            ? "بکاپ‌های خودکار هر ۲۴ ساعت در درخواست‌های مدیر اجرا می‌شوند. بکاپ‌ها خارج از ریشه وب ذخیره می‌شوند (مجوز ۶۰۰)."
            : "Automatic backups run every 24 h on admin traffic. Files are stored outside web root with mode 0600. Retention: last 30 daily + 12 monthly."}
        </span>
      </div>

      <Card className="border-border/30">
        <CardContent className="p-0">
          <ScrollArea className="max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{isRTL ? "نوع" : "Type"}</TableHead>
                  <TableHead className="text-xs">{isRTL ? "وضعیت" : "Status"}</TableHead>
                  <TableHead className="text-xs">{isRTL ? "اندازه" : "Size"}</TableHead>
                  <TableHead className="text-xs">{isRTL ? "فایل" : "File"}</TableHead>
                  <TableHead className="text-xs">{isRTL ? "توسط" : "By"}</TableHead>
                  <TableHead className="text-xs">{isRTL ? "تاریخ" : "Date"}</TableHead>
                  <TableHead className="text-xs text-right">{isRTL ? "عملیات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">
                      {isRTL ? "بکاپی وجود ندارد" : "No backups found"}
                    </TableCell>
                  </TableRow>
                ) : backups.map((backup) => (
                  <TableRow key={backup.id}>
                    <TableCell className="text-xs">{getTypeBadge(backup.backupType)}</TableCell>
                    <TableCell className="text-xs">{getStatusBadge(backup.status)}</TableCell>
                    <TableCell className="text-xs">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3 text-muted-foreground" />
                        {formatFileSize(backup.fileSize)}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-mono truncate max-w-32" title={backup.fileKey || ""}>
                      {backup.fileKey || "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {backup.admin?.name || (isRTL ? "سیستم" : "System")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(backup.createdAt).toLocaleString(isRTL ? "fa-IR" : "en-US")}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 gap-1"
                          onClick={() => handleDownload(backup)}
                          disabled={backup.status !== "completed" || !backup.fileKey}
                          title={isRTL ? "دانلود" : "Download"}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                          onClick={() => setRestoreTarget(backup)}
                          disabled={backup.status !== "completed"}
                          title={isRTL ? "بازیابی" : "Restore"}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 gap-1 text-red-600 hover:text-red-700 hover:bg-red-500/10"
                          onClick={() => setDeleteTarget(backup)}
                          title={isRTL ? "حذف" : "Delete"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Create Backup Dialog */}
      <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Database className="w-4 h-4" />
              {isRTL ? "ایجاد بکاپ دستی" : "Create Manual Backup"}
            </DialogTitle>
            <DialogDescription className="sr-only">فرم ایجاد بکاپ دستی از دیتابیس</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                {isRTL
                  ? "یک کپی کامل از دیتابیس فعلی ایجاد می‌شود. این عملیات ممکن است چند ثانیه طول بکشد."
                  : "A full copy of the current database will be created. This may take a few seconds."}
              </p>
              <Textarea
                value={backupNotes}
                onChange={(e) => setBackupNotes(e.target.value)}
                placeholder={isRTL ? "یادداشت (اختیاری)..." : "Notes (optional)..."}
                rows={3}
              />
            </div>
            <div className={cn("flex justify-end gap-2", isRTL && "flex-row-reverse")}>
              <Button variant="outline" onClick={() => setShowBackupDialog(false)}>
                {isRTL ? "انصراف" : "Cancel"}
              </Button>
              <Button onClick={handleCreateBackup} disabled={isCreating} className="gap-1.5">
                {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                {isRTL ? "ایجاد بکاپ" : "Create Backup"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation */}
      <AlertDialog open={!!restoreTarget} onOpenChange={(o) => !o && setRestoreTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <RotateCcw className="w-5 h-5 text-amber-500" />
              {isRTL ? "بازیابی دیتابیس از بکاپ" : "Restore Database from Backup"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL ? (
                <>
                  هشدار: این عملیات دیتابیس فعلی را با محتوای این بکاپ جایگزین می‌کند.
                  قبل از بازیابی، یک بکاپ Pre-Restore از وضعیت فعلی ایجاد می‌شود تا در صورت نیاز بتوانید برگردانید.
                  <br /><br />
                  فایل: <code className="text-[11px]">{restoreTarget?.fileKey}</code>
                  <br />
                  تاریخ بکاپ: {restoreTarget ? new Date(restoreTarget.createdAt).toLocaleString("fa-IR") : ""}
                </>
              ) : (
                <>
                  Warning: this will overwrite the live database with the contents of this backup.
                  A pre-restore snapshot of the current state will be created first so you can roll back.
                  <br /><br />
                  File: <code className="text-[11px]">{restoreTarget?.fileKey}</code>
                  <br />
                  Backup date: {restoreTarget ? new Date(restoreTarget.createdAt).toLocaleString("en-US") : ""}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>
              {isRTL ? "انصراف" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              disabled={isRestoring}
              className="bg-amber-600 hover:bg-amber-700 gap-1.5"
            >
              {isRestoring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              {isRTL ? "تایید و بازیابی" : "Confirm Restore"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Trash2 className="w-5 h-5 text-red-500" />
              {isRTL ? "حذف بکاپ" : "Delete Backup"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL ? (
                <>
                  این عملیات فایل بکاپ و رکورد آن را به صورت دائمی حذف می‌کند.
                  این عمل قابل بازگشت نیست.
                  <br /><br />
                  فایل: <code className="text-[11px]">{deleteTarget?.fileKey}</code>
                </>
              ) : (
                <>
                  This will permanently delete the backup file and its record. This cannot be undone.
                  <br /><br />
                  File: <code className="text-[11px]">{deleteTarget?.fileKey}</code>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {isRTL ? "انصراف" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 gap-1.5"
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              {isRTL ? "حذف کن" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
