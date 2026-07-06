"use client";
import { authFetch } from "@/lib/auth/store";

import React, { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import {
  GraduationCap, Plus, Trash2, Edit3, Search, RefreshCw,
  User, Mail, Phone, Lock, Image as ImageIcon, CheckCircle2,
  XCircle, Loader2, Music, Eye, EyeOff, Key, Shield,
} from "lucide-react";
import { toast } from "sonner";

// ============================================
// Types
// ============================================
interface Instructor {
  id: string;
  nameFa: string;
  nameEn: string;
  specialtyFa: string;
  specialtyEn: string;
  bioFa: string | null;
  bioEn: string | null;
  experience: string | null;
  imageUrl: string | null;
  socialLinks: string | null;
  isPublished: boolean;
  order: number;
  phone: string | null;
  isActive: boolean;
  defaultSchedule: string | null;
  userId: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; role: string; isActive: boolean } | null;
  _count?: { courses: number; workshops: number; schedules: number };
}

const instrumentOptions = [
  { value: "piano", labelFa: "پیانو", labelEn: "Piano" },
  { value: "guitar", labelFa: "گیتار", labelEn: "Guitar" },
  { value: "violin", labelFa: "ویولن", labelEn: "Violin" },
  { value: "setar", labelFa: "سه‌تار", labelEn: "Setar" },
  { value: "tar", labelFa: "تار", labelEn: "Tar" },
  { value: "santur", labelFa: "سنتور", labelEn: "Santur" },
  { value: "drums", labelFa: "درامز", labelEn: "Drums" },
  { value: "vocals", labelFa: "آواز", labelEn: "Vocals" },
  { value: "oud", labelFa: "عود", labelEn: "Oud" },
  { value: "kamancheh", labelFa: "کمانچه", labelEn: "Kamancheh" },
  { value: "ney", labelFa: "نی", labelEn: "Ney" },
  { value: "daf", labelFa: "دف", labelEn: "Daf" },
  { value: "tonbak", labelFa: "تنبک", labelEn: "Tonbak" },
  { value: "flute", labelFa: "فلوت", labelEn: "Flute" },
  { value: "cello", labelFa: "ویولنسل", labelEn: "Cello" },
  { value: "composition", labelFa: "آهنگسازی", labelEn: "Composition" },
  { value: "theory", labelFa: "تئوری", labelEn: "Music Theory" },
  { value: "production", labelFa: "تولید موسیقی", labelEn: "Music Production" },
];

// ============================================
// Create Instructor Dialog
// ============================================
function CreateInstructorDialog({
  open, onOpenChange, isRTL, onSave, isSaving,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  isRTL: boolean; onSave: (data: Record<string, unknown>) => void; isSaving?: boolean;
}) {
  const [form, setForm] = useState({
    nameFa: "", nameEn: "", specialtyFa: "", specialtyEn: "",
    bioFa: "", bioEn: "", experience: "", imageUrl: "",
    phone: "", email: "", password: "",
    isPublished: false, isActive: true,
  });
  const [showPassword, setShowPassword] = useState(false);

  const updateField = (field: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isRTL ? "ایجاد حساب استاد" : "Create Instructor Account"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Account credentials */}
          <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
            <p className="text-xs text-muted-foreground mb-3">
              {isRTL ? "🔐 اطلاعات ورود استاد به پنل" : "🔐 Instructor panel login credentials"}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">{isRTL ? "ایمیل (نام کاربری)" : "Email (Username)"} *</Label>
                <Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)}
                  className="rounded-xl" placeholder="instructor@example.com" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{isRTL ? "رمز عبور اولیه" : "Initial Password"} *</Label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    className="rounded-xl" placeholder="••••••••" dir="ltr" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground", isRTL ? "left-2.5" : "right-2.5")}>
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Profile info */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{isRTL ? "نام فارسی" : "Name (Farsi)"} *</Label>
            <Input value={form.nameFa} onChange={(e) => updateField("nameFa", e.target.value)}
              className="rounded-xl" dir="rtl" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">{isRTL ? "نام انگلیسی" : "Name (English)"} *</Label>
            <Input value={form.nameEn} onChange={(e) => updateField("nameEn", e.target.value)}
              className="rounded-xl" dir="ltr" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? "تخصص (فارسی)" : "Specialty (Farsi)"} *</Label>
              <Input value={form.specialtyFa} onChange={(e) => updateField("specialtyFa", e.target.value)}
                className="rounded-xl" dir="rtl" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? "تخصص (انگلیسی)" : "Specialty (English)"} *</Label>
              <Input value={form.specialtyEn} onChange={(e) => updateField("specialtyEn", e.target.value)}
                className="rounded-xl" dir="ltr" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">{isRTL ? "شماره تماس" : "Phone"}</Label>
            <Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)}
              className="rounded-xl" placeholder="09121234567" dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">{isRTL ? "بیوگرافی (فارسی)" : "Bio (Farsi)"}</Label>
            <Textarea value={form.bioFa} onChange={(e) => updateField("bioFa", e.target.value)}
              className="rounded-xl resize-none" rows={2} dir="rtl" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">{isRTL ? "بیوگرافی (انگلیسی)" : "Bio (English)"}</Label>
            <Textarea value={form.bioEn} onChange={(e) => updateField("bioEn", e.target.value)}
              className="rounded-xl resize-none" rows={2} dir="ltr" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm">{isRTL ? "سابقه کار" : "Experience"}</Label>
              <Input value={form.experience} onChange={(e) => updateField("experience", e.target.value)}
                className="rounded-xl" dir={isRTL ? "rtl" : "ltr"} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">{isRTL ? "آدرس تصویر" : "Image URL"}</Label>
              <Input value={form.imageUrl} onChange={(e) => updateField("imageUrl", e.target.value)}
                className="rounded-xl" placeholder="https://..." dir="ltr" />
            </div>
          </div>
          <div className={cn("flex items-center gap-6", isRTL && "flex-row-reverse")}>
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Switch checked={form.isPublished} onCheckedChange={(v) => updateField("isPublished", v)} />
              <Label className="text-sm">{isRTL ? "انتشار" : "Published"}</Label>
            </div>
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Switch checked={form.isActive} onCheckedChange={(v) => updateField("isActive", v)} />
              <Label className="text-sm">{isRTL ? "فعال" : "Active"}</Label>
            </div>
          </div>
          <Button onClick={() => onSave(form)} disabled={isSaving || !form.email || !form.password || !form.nameFa || !form.nameEn}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
            <span className="ml-2">{isRTL ? "ایجاد حساب استاد" : "Create Instructor Account"}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Main Instructors Tab Component
// ============================================
export function InstructorsTab({ isRTL }: { isRTL: boolean }) {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchInstructors = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authFetch("/api/admin/instructors");
      if (res.ok) {
        const data = await res.json();
        setInstructors(data.instructors || data || []);
      }
    } catch { toast.error(isRTL ? "خطا در بارگذاری" : "Failed to load"); }
    finally { setIsLoading(false); }
  }, [isRTL]);

  useEffect(() => { fetchInstructors(); }, [fetchInstructors]);

  const handleCreateInstructor = async (data: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      const res = await authFetch("/api/admin/instructors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success(isRTL ? "حساب استاد ایجاد شد" : "Instructor account created");
        setIsCreateOpen(false);
        fetchInstructors();
      } else {
        const err = await res.json();
        toast.error(err.error || isRTL ? "خطا در ایجاد" : "Failed to create");
      }
    } catch { toast.error(isRTL ? "خطا در ارتباط" : "Connection error"); }
    finally { setIsSaving(false); }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await authFetch(`/api/admin/instructors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (res.ok) {
        toast.success(isRTL ? "وضعیت بروزرسانی شد" : "Status updated");
        fetchInstructors();
      }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isRTL ? "آیا مطمئن هستید؟" : "Are you sure?")) return;
    try {
      const res = await authFetch(`/api/admin/instructors/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(isRTL ? "حذف شد" : "Deleted");
        fetchInstructors();
      } else {
        const err = await res.json();
        toast.error(err.error || isRTL ? "خطا در حذف" : "Failed to delete");
      }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
  };

  const filtered = instructors.filter(i => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return i.nameFa.includes(q) || i.nameEn.toLowerCase().includes(q) ||
           i.specialtyFa.includes(q) || i.specialtyEn.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
        <Button onClick={() => setIsCreateOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2">
          <Plus className="w-4 h-4" />
          {isRTL ? "ایجاد حساب استاد" : "New Instructor"}
        </Button>
        <div className="flex-1" />
        <div className="relative flex-1 max-w-[200px]">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground", isRTL ? "right-2.5" : "left-2.5")} />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className={cn("rounded-xl h-9 text-xs", isRTL ? "pr-8" : "pl-8")}
            placeholder={isRTL ? "جستجو..." : "Search..."} />
        </div>
        <Button variant="ghost" size="icon" className="w-9 h-9" onClick={fetchInstructors}>
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: isRTL ? "کل اساتید" : "Total", value: instructors.length, color: "text-primary", bg: "bg-primary/10" },
          { label: isRTL ? "دارای حساب" : "With Account", value: instructors.filter(i => i.user).length, color: "text-emerald-600", bg: "bg-emerald-500/10" },
          { label: isRTL ? "فعال" : "Active", value: instructors.filter(i => i.isActive).length, color: "text-amber-600", bg: "bg-amber-500/10" },
        ].map((stat, i) => (
          <Card key={i} className="border-border/30">
            <CardContent className="p-3 text-center">
              <p className={cn("text-lg font-bold", stat.color)}>{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Instructors List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">{isRTL ? "استادی ثبت نشده" : "No instructors"}</p>
        </div>
      ) : (
        <ScrollArea className="max-h-[50vh]">
          <div className="space-y-2">
            {filtered.map((inst, index) => (
              <motion.div key={inst.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                <Card className="border-border/30 hover:border-primary/20 transition-all">
                  <CardContent className="p-3">
                    <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shrink-0 overflow-hidden">
                        {inst.imageUrl ? (
                          <img src={inst.imageUrl} alt={inst.nameEn} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <GraduationCap className="w-5 h-5 text-primary" />
                        )}
                      </div>

                      {/* Info */}
                      <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                          <span className="text-sm font-semibold truncate">{isRTL ? inst.nameFa : inst.nameEn}</span>
                          {/* Account status badges */}
                          {inst.user ? (
                            <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                              <Key className="w-2.5 h-2.5 mr-0.5" />
                              {isRTL ? "دارای حساب" : "Has Account"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] bg-muted text-muted-foreground border-border">
                              {isRTL ? "بدون حساب" : "No Account"}
                            </Badge>
                          )}
                          {inst.isActive ? (
                            <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                              <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />{isRTL ? "فعال" : "Active"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] bg-red-500/10 text-red-600 border-red-500/20">
                              <XCircle className="w-2.5 h-2.5 mr-0.5" />{isRTL ? "غیرفعال" : "Inactive"}
                            </Badge>
                          )}
                          {inst.isPublished && (
                            <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20">
                              {isRTL ? "منتشر" : "Published"}
                            </Badge>
                          )}
                        </div>
                        <div className={cn("flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5", isRTL && "flex-row-reverse")}>
                          <span>{isRTL ? inst.specialtyFa : inst.specialtyEn}</span>
                          {inst.phone && <span>· {inst.phone}</span>}
                          {inst.user && <span>· {inst.user.email}</span>}
                          {inst._count && (
                            <span className="flex items-center gap-0.5">
                              · <Music className="w-2.5 h-2.5" />
                              {inst._count.courses || 0} {isRTL ? "دوره" : "courses"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className={cn("flex items-center gap-1 shrink-0", isRTL && "flex-row-reverse")}>
                        <Button variant="ghost" size="icon" className="w-7 h-7"
                          onClick={() => handleToggleActive(inst.id, inst.isActive)}
                          title={inst.isActive ? (isRTL ? "غیرفعال کردن" : "Deactivate") : (isRTL ? "فعال کردن" : "Activate")}>
                          {inst.isActive ? <XCircle className="w-3.5 h-3.5 text-amber-600" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7 hover:text-destructive"
                          onClick={() => handleDelete(inst.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Create Dialog */}
      <CreateInstructorDialog
        open={isCreateOpen} onOpenChange={setIsCreateOpen}
        isRTL={isRTL} onSave={handleCreateInstructor} isSaving={isSaving}
      />
    </div>
  );
}
