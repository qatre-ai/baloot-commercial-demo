"use client";
import { authFetch } from "@/lib/auth/store";

import React, { useState, useEffect, useCallback } from "react";
import { deferEffect } from "@/lib/react/defer-effect";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Smartphone, Monitor, Tablet, CheckCircle2, XCircle, Trash2,
  Loader2, ShieldCheck, ShieldAlert, Fingerprint
} from "lucide-react";

interface DeviceEntry {
  id: string;
  adminId: string;
  deviceName: string;
  deviceType: string;
  browser: string | null;
  os: string | null;
  deviceFingerprint: string | null;
  ipAddress: string | null;
  isApproved: boolean;
  lastUsedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  admin: { id: string; name: string; email: string; role: string };
}

export function AdminDevicesTab() {
  const { isRTL } = useI18n();
  const [devices, setDevices] = useState<DeviceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterAdmin, setFilterAdmin] = useState("all");

  const fetchDevices = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = filterAdmin !== "all" ? `?adminId=${filterAdmin}` : "";
      const res = await authFetch(`/api/admin/devices${params}`);
      if (res.ok) {
        const data = await res.json();
        setDevices(data.devices || []);
      }
    } catch { toast.error(isRTL ? "خطا در بارگذاری" : "Failed to load"); }
    finally { setIsLoading(false); }
  }, [filterAdmin, isRTL]);

  useEffect(() => { deferEffect(fetchDevices); }, [fetchDevices]);

  const handleApprove = async (id: string, approve: boolean) => {
    try {
      const res = await authFetch("/api/admin/devices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isApproved: approve }),
      });
      if (res.ok) {
        toast.success(approve
          ? (isRTL ? "دستگاه تایید شد" : "Device approved")
          : (isRTL ? "دستگاه رد شد" : "Device rejected"));
        fetchDevices();
      }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await authFetch("/api/admin/devices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast.success(isRTL ? "دستگاه حذف شد" : "Device removed");
        fetchDevices();
      }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
  };

  const getDeviceIcon = (type: string | null) => {
    if (type === "mobile") return Smartphone;
    if (type === "tablet") return Tablet;
    return Monitor;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className={cn("flex items-center justify-between gap-3", isRTL && "flex-row-reverse")}>
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <Fingerprint className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">{isRTL ? "مدیریت دستگاه‌ها" : "Device Management"}</h3>
          <Badge variant="outline" className="text-[10px]">{devices.length} {isRTL ? "دستگاه" : "devices"}</Badge>
        </div>
      </div>

      <Card className="border-border/30">
        <CardContent className="p-0">
          <ScrollArea className="max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{isRTL ? "دستگاه" : "Device"}</TableHead>
                  <TableHead className="text-xs">{isRTL ? "مدیر" : "Admin"}</TableHead>
                  <TableHead className="text-xs">{isRTL ? "مرورگر/سیستم‌عامل" : "Browser/OS"}</TableHead>
                  <TableHead className="text-xs">{isRTL ? "آخرین IP" : "Last IP"}</TableHead>
                  <TableHead className="text-xs">{isRTL ? "وضعیت" : "Status"}</TableHead>
                  <TableHead className="text-xs">{isRTL ? "عملیات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
                      {isRTL ? "دستگاهی ثبت نشده" : "No devices registered"}
                    </TableCell>
                  </TableRow>
                ) : devices.map((device) => {
                  const DevIcon = getDeviceIcon(device.deviceType);
                  return (
                    <TableRow key={device.id}>
                      <TableCell className="text-xs">
                        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                          <DevIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{device.deviceName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>
                          <span className="font-medium">{device.admin.name}</span>
                          <span className="text-muted-foreground text-[10px] block">{device.admin.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span>{device.browser || "—"} / {device.os || "—"}</span>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {device.ipAddress || "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {device.isApproved ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 border text-[10px]">
                            <CheckCircle2 className="w-3 h-3 ml-1" />
                            {isRTL ? "تایید شده" : "Approved"}
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 border text-[10px]">
                            <ShieldAlert className="w-3 h-3 ml-1" />
                            {isRTL ? "در انتظار تایید" : "Pending"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1">
                          {!device.isApproved && (
                            <Button
                              variant="ghost" size="sm" className="h-7 w-7 p-0"
                              onClick={() => handleApprove(device.id, true)}
                              title={isRTL ? "تایید" : "Approve"}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            </Button>
                          )}
                          {device.isApproved && (
                            <Button
                              variant="ghost" size="sm" className="h-7 w-7 p-0"
                              onClick={() => handleApprove(device.id, false)}
                              title={isRTL ? "رد" : "Reject"}
                            >
                              <XCircle className="w-3.5 h-3.5 text-amber-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost" size="sm" className="h-7 w-7 p-0"
                            onClick={() => handleDelete(device.id)}
                            title={isRTL ? "حذف" : "Delete"}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
