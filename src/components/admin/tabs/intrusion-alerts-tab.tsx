"use client";
import { authFetch } from "@/lib/auth/store";

import React, { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  ShieldAlert, ShieldCheck, AlertTriangle, Eye, Loader2,
  Lock, Fingerprint, Globe, MonitorSmartphone, CheckCircle2, XCircle
} from "lucide-react";

interface IntrusionAlertEntry {
  id: string;
  targetAdminId: string | null;
  attemptType: string;
  ipAddress: string;
  userAgent: string | null;
  country: string | null;
  city: string | null;
  deviceFingerprint: string | null;
  attemptCount: number;
  details: string | null;
  isResolved: boolean;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  targetAdmin: { id: string; name: string; email: string; role: string } | null;
}

export function IntrusionAlertsTab() {
  const { isRTL } = useI18n();
  const [alerts, setAlerts] = useState<IntrusionAlertEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const [filter, setFilter] = useState<"all" | "unresolved" | "resolved">("unresolved");

  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const resolvedParam = filter === "unresolved" ? "false" : filter === "resolved" ? "true" : "all";
      const res = await authFetch(`/api/admin/intrusion-alerts?resolved=${resolvedParam}`);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
        setUnresolvedCount(data.unresolvedCount || 0);
      }
    } catch { toast.error(isRTL ? "خطا در بارگذاری" : "Failed to load"); }
    finally { setIsLoading(false); }
  }, [filter, isRTL]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleResolve = async (id: string, resolve: boolean) => {
    try {
      const res = await authFetch("/api/admin/intrusion-alerts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isResolved: resolve }),
      });
      if (res.ok) {
        toast.success(resolve
          ? (isRTL ? "هشدار رفع شد" : "Alert resolved")
          : (isRTL ? "هشدار بازگشایی شد" : "Alert reopened"));
        fetchAlerts();
      }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
  };

  const getAlertTypeBadge = (type: string) => {
    const config: Record<string, { label: string; color: string; icon: React.ElementType }> = {
      brute_force: { label: isRTL ? "حمله جبری" : "Brute Force", color: "bg-red-500/10 text-red-600 border-red-500/20", icon: Lock },
      credential_stuffing: { label: isRTL ? "سرقت اعتبار" : "Credential Stuffing", color: "bg-red-500/10 text-red-600 border-red-500/20", icon: AlertTriangle },
      suspicious_device: { label: isRTL ? "دستگاه مشکوک" : "Suspicious Device", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: MonitorSmartphone },
      unknown_device: { label: isRTL ? "دستگاه ناشناس" : "Unknown Device", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Fingerprint },
      suspicious_ip: { label: isRTL ? "IP مشکوک" : "Suspicious IP", color: "bg-orange-500/10 text-orange-600 border-orange-500/20", icon: Globe },
      rate_limit: { label: isRTL ? "محدودیت درخواست" : "Rate Limit", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: AlertTriangle },
    };
    const c = config[type] || { label: type, color: "bg-slate-500/10 text-slate-600 border-slate-500/20", icon: AlertTriangle };
    return <Badge variant="outline" className={cn("text-[10px] border gap-1", c.color)}><c.icon className="w-3 h-3" />{c.label}</Badge>;
  };

  const parseDetails = (details: string | null) => {
    if (!details) return null;
    try { return JSON.parse(details); } catch { return { raw: details }; }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className={cn("flex items-center justify-between gap-3", isRTL && "flex-row-reverse")}>
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <ShieldAlert className="w-5 h-5 text-red-500" />
          <h3 className="font-semibold">{isRTL ? "هشدارهای امنیتی" : "Intrusion Alerts"}</h3>
          {unresolvedCount > 0 && (
            <Badge className="bg-red-500 text-white text-[10px]">{unresolvedCount} {isRTL ? "رفع‌نشده" : "unresolved"}</Badge>
          )}
        </div>
      </div>

      <div className={cn("flex gap-2", isRTL && "flex-row-reverse")}>
        {(["unresolved", "resolved", "all"] as const).map((f) => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)} className="text-xs">
            {f === "unresolved" ? (isRTL ? "رفع‌نشده" : "Unresolved") :
             f === "resolved" ? (isRTL ? "رفع‌شده" : "Resolved") :
             (isRTL ? "همه" : "All")}
          </Button>
        ))}
      </div>

      {alerts.length === 0 ? (
        <Card className="border-border/30">
          <CardContent className="py-12 text-center text-muted-foreground">
            <ShieldCheck className="w-10 h-10 mx-auto mb-3 text-emerald-500 opacity-50" />
            <p className="text-sm">{isRTL ? "هشدار امنیتی وجود ندارد" : "No security alerts"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const details = parseDetails(alert.details);
            return (
              <Card key={alert.id} className={cn(
                "border-border/30 transition-colors",
                !alert.isResolved && "border-red-500/20 bg-red-500/[0.02]"
              )}>
                <CardContent className="p-4">
                  <div className={cn("flex items-start justify-between gap-3", isRTL && "flex-row-reverse")}>
                    <div className="flex-1 space-y-2">
                      <div className={cn("flex items-center gap-2 flex-wrap", isRTL && "flex-row-reverse")}>
                        {getAlertTypeBadge(alert.attemptType)}
                        {alert.isResolved ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px]">
                            <CheckCircle2 className="w-3 h-3 ml-1" />{isRTL ? "رفع شده" : "Resolved"}
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/10 text-red-600 border border-red-500/20 text-[10px]">
                            <XCircle className="w-3 h-3 ml-1" />{isRTL ? "رفع‌نشده" : "Unresolved"}
                          </Badge>
                        )}
                      </div>

                      <div className={cn("flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground", isRTL && "flex-row-reverse")}>
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          IP: <span className="font-mono">{alert.ipAddress}</span>
                        </span>
                        {alert.attemptCount > 1 && (
                          <span>{isRTL ? "تعداد تلاش:" : "Attempts:"} <span className="font-medium text-foreground">{alert.attemptCount}</span></span>
                        )}
                        {alert.targetAdmin && (
                          <span>{isRTL ? "هدف:" : "Target:"} {alert.targetAdmin.name} ({alert.targetAdmin.email})</span>
                        )}
                        <span>{new Date(alert.createdAt).toLocaleString(isRTL ? "fa-IR" : "en-US")}</span>
                      </div>

                      {details && (
                        <div className="text-[11px] text-muted-foreground bg-muted/50 rounded p-2 max-h-24 overflow-auto">
                          <pre className="whitespace-pre-wrap">{JSON.stringify(details, null, 2)}</pre>
                        </div>
                      )}

                      {alert.userAgent && (
                        <p className="text-[10px] text-muted-foreground truncate max-w-lg">
                          UA: {alert.userAgent}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0">
                      {!alert.isResolved ? (
                        <Button size="sm" variant="outline" onClick={() => handleResolve(alert.id, true)} className="gap-1 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isRTL ? "رفع" : "Resolve"}
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => handleResolve(alert.id, false)} className="gap-1 text-xs text-muted-foreground">
                          {isRTL ? "بازگشایی" : "Reopen"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
