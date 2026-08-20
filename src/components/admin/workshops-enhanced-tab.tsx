"use client";
import { authFetch } from "@/lib/auth/store";

import React, { useState, useEffect, useCallback } from "react";
import { deferEffect } from "@/lib/react/defer-effect";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  Eye, EyeOff, Loader2, CalendarDays, Users, Flame,
  DollarSign, Clock, User, Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

// ============================================
// Types
// ============================================
interface InstructorOption {
  id: string;
  nameFa: string;
  nameEn: string;
  specialtyFa: string;
  specialtyEn: string;
  imageUrl: string | null;
}

interface Workshop {
  id: string;
  titleFa: string;
  titleEn: string;
  descriptionFa: string | null;
  descriptionEn: string | null;
  instructorFa: string;
  instructorEn: string;
  date: string;
  endDate?: string | null;
  price: number | null;
  totalSeats: number;
  reservedSeats: number;
  imageUrl: string | null;
  coverUrl: string | null;
  category: string | null;
  isHot: boolean;
  isPublished: boolean;
  branchId: string | null;
  registrationStart?: string | null;
  registrationEnd?: string | null;
  instructorId?: string | null;
  createdAt: string;
}

// ============================================
// Constants
// ============================================
const workshopCategories = [
  { value: "improvisation", labelFa: "بداهه‌نوازی", labelEn: "Improvisation" },
  { value: "vocal", labelFa: "آواز", labelEn: "Vocal" },
  { value: "composition", labelFa: "آهنگسازی", labelEn: "Composition" },
  { value: "production", labelFa: "تولید موسیقی", labelEn: "Music Production" },
  { value: "technique", labelFa: "تکنیک نوازندگی", labelEn: "Performance Technique" },
  { value: "theory", labelFa: "تئوری موسیقی", labelEn: "Music Theory" },
  { value: "masterclass", labelFa: "مستربلاس", labelEn: "Masterclass" },
];

// ============================================
// Enhanced Workshop Form
// ============================================
function EnhancedWorkshopForm({
  initialData,
  onSave,
  isRTL,
  isSaving,
  instructors,
}: {
  initialData: Partial<Workshop> | null;
  onSave: (data: Record<string, unknown>) => void;
  isRTL: boolean;
  isSaving?: boolean;
  instructors: InstructorOption[];
}) {
  const [form, setForm] = useState({
    titleFa: initialData?.titleFa || "",
    titleEn: initialData?.titleEn || "",
    descriptionFa: initialData?.descriptionFa || "",
    descriptionEn: initialData?.descriptionEn || "",
    instructorFa: initialData?.instructorFa || "",
    instructorEn: initialData?.instructorEn || "",
    date: initialData?.date ? new Date(initialData.date).toISOString().split("T")[0] : "",
    price: initialData?.price || "",
    totalSeats: initialData?.totalSeats || 30,
    imageUrl: initialData?.imageUrl || "",
    coverUrl: initialData?.coverUrl || "",
    category: initialData?.category || "",
    isHot: initialData?.isHot ?? false,
    isPublished: initialData?.isPublished ?? false,
    registrationStart: initialData?.registrationStart
      ? new Date(initialData.registrationStart).toISOString().split("T")[0] : "",
    registrationEnd: initialData?.registrationEnd
      ? new Date(initialData.registrationEnd).toISOString().split("T")[0] : "",
    instructorId: initialData?.instructorId || "",
  });

  const updateField = (field: string, value: string | number | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Auto-fill instructor names when selecting instructor
  const handleInstructorSelect = (instructorId: string) => {
    updateField("instructorId", instructorId);
    const instructor = instructors.find(i => i.id === instructorId);
    if (instructor) {
      updateField("instructorFa", instructor.nameFa);
      updateField("instructorEn", instructor.nameEn);
    }
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{isRTL ? "دسته‌بندی" : "Category"}</Label>
          <Select value={form.category} onValueChange={(v) => updateField("category", v)}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder={isRTL ? "انتخاب کنید..." : "Select..."} /></SelectTrigger>
            <SelectContent>
              {workshopCategories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {isRTL ? cat.labelFa : cat.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">{isRTL ? "تاریخ برگزاری" : "Date"} *</Label>
          <Input type="date" value={form.date} onChange={(e) => updateField("date", e.target.value)}
            className="rounded-xl" dir="ltr" />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">{isRTL ? "عنوان (فارسی)" : "Title (Farsi)"} *</Label>
        <Input value={form.titleFa} onChange={(e) => updateField("titleFa", e.target.value)}
          className="rounded-xl" dir="rtl" />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">{isRTL ? "عنوان (انگلیسی)" : "Title (English)"} *</Label>
        <Input value={form.titleEn} onChange={(e) => updateField("titleEn", e.target.value)}
          className="rounded-xl" dir="ltr" />
      </div>

      {/* Instructor select from instructors list */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{isRTL ? "انتخاب مدرس از لیست" : "Select Instructor from List"}</Label>
        <Select value={form.instructorId} onValueChange={handleInstructorSelect}>
          <SelectTrigger className="rounded-xl"><SelectValue placeholder={isRTL ? "انتخاب مدرس..." : "Select instructor..."} /></SelectTrigger>
          <SelectContent>
            {instructors.map((inst) => (
              <SelectItem key={inst.id} value={inst.id}>
                {isRTL ? inst.nameFa : inst.nameEn} — {isRTL ? inst.specialtyFa : inst.specialtyEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{isRTL ? "مدرس (فارسی)" : "Instructor (Farsi)"} *</Label>
          <Input value={form.instructorFa} onChange={(e) => updateField("instructorFa", e.target.value)}
            className="rounded-xl" dir="rtl" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">{isRTL ? "مدرس (انگلیسی)" : "Instructor (English)"} *</Label>
          <Input value={form.instructorEn} onChange={(e) => updateField("instructorEn", e.target.value)}
            className="rounded-xl" dir="ltr" />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">{isRTL ? "توضیحات (فارسی)" : "Description (Farsi)"}</Label>
        <Textarea value={form.descriptionFa} onChange={(e) => updateField("descriptionFa", e.target.value)}
          className="rounded-xl resize-none" rows={2} dir="rtl" />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">{isRTL ? "توضیحات (انگلیسی)" : "Description (English)"}</Label>
        <Textarea value={form.descriptionEn} onChange={(e) => updateField("descriptionEn", e.target.value)}
          className="rounded-xl resize-none" rows={2} dir="ltr" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{isRTL ? "هزینه (تومان)" : "Price (Toman)"}</Label>
          <Input type="number" value={form.price} onChange={(e) => updateField("price", e.target.value)}
            className="rounded-xl" dir="ltr" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">{isRTL ? "تعداد صندلی‌ها" : "Total Seats"}</Label>
          <Input type="number" min={1} max={500} value={form.totalSeats}
            onChange={(e) => updateField("totalSeats", parseInt(e.target.value) || 30)} className="rounded-xl" />
        </div>
      </div>

      <Separator />

      {/* Registration Period - NEW */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          {isRTL ? "دوره ثبت‌نام" : "Registration Period"}
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">{isRTL ? "شروع ثبت‌نام" : "Reg. Start"}</Label>
            <Input type="date" value={form.registrationStart}
              onChange={(e) => updateField("registrationStart", e.target.value)}
              className="rounded-xl" dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{isRTL ? "پایان ثبت‌نام" : "Reg. End"}</Label>
            <Input type="date" value={form.registrationEnd}
              onChange={(e) => updateField("registrationEnd", e.target.value)}
              className="rounded-xl" dir="ltr" />
          </div>
        </div>
      </div>

      <Separator />

      {/* Cover URL - enhanced */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{isRTL ? "آدرس کاور" : "Cover Image URL"}</Label>
        <Input value={form.coverUrl} onChange={(e) => updateField("coverUrl", e.target.value)}
          className="rounded-xl" placeholder="https://..." dir="ltr" />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">{isRTL ? "آدرس تصویر" : "Image URL"}</Label>
        <Input value={form.imageUrl} onChange={(e) => updateField("imageUrl", e.target.value)}
          className="rounded-xl" placeholder="https://..." dir="ltr" />
      </div>

      <div className={cn("flex items-center gap-6", isRTL && "flex-row-reverse")}>
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <Switch checked={form.isPublished} onCheckedChange={(v) => updateField("isPublished", v)} />
          <Label className="text-sm">{isRTL ? "انتشار" : "Published"}</Label>
        </div>
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <Switch checked={form.isHot} onCheckedChange={(v) => updateField("isHot", v)} />
          <Label className="text-sm">{isRTL ? "پرطرفدار" : "Hot"}</Label>
        </div>
      </div>

      <Button onClick={() => onSave(form)} disabled={isSaving}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2">
        {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
        {initialData?.id ? (isRTL ? "بروزرسانی کارگاه" : "Update Workshop") : (isRTL ? "ایجاد کارگاه" : "Create Workshop")}
      </Button>
    </div>
  );
}

// ============================================
// Main Workshops Enhanced Tab
// ============================================
export function WorkshopsEnhancedTab({ isRTL }: { isRTL: boolean }) {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<Partial<Workshop> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch workshops — use authFetch so X-Session-Token header is sent (sandbox/iframe compatible)
  const fetchWorkshops = useCallback(async () => {
    try {
      const res = await authFetch("/api/admin/workshops-data?all=true");
      if (res.ok) {
        const data = await res.json();
        setWorkshops(Array.isArray(data) ? data : (data.workshops || []));
      }
    } catch {
      toast.error(isRTL ? "خطا در بارگذاری کارگاه‌ها" : "Failed to load workshops");
    } finally {
      setIsLoading(false);
    }
  }, [isRTL]);

  // Fetch instructors
  const fetchInstructors = useCallback(async () => {
    try {
      const res = await authFetch("/api/admin/instructors");
      if (res.ok) {
        const data = await res.json();
        setInstructors(data.instructors || data || []);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    deferEffect(() => {
      fetchWorkshops();
      fetchInstructors();
    });
  }, [fetchWorkshops, fetchInstructors]);

  // Save workshop
  const handleSave = async (data: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      // Build payload matching the existing API
      const payload = {
        titleFa: data.titleFa,
        titleEn: data.titleEn,
        descriptionFa: data.descriptionFa || null,
        descriptionEn: data.descriptionEn || null,
        instructorFa: data.instructorFa,
        instructorEn: data.instructorEn,
        date: data.date,
        price: data.price ? Number(data.price) : null,
        totalSeats: data.totalSeats ? Number(data.totalSeats) : 30,
        imageUrl: data.imageUrl || null,
        coverUrl: data.coverUrl || null,
        category: data.category || null,
        isHot: data.isHot ?? false,
        isPublished: data.isPublished ?? false,
        registrationStart: data.registrationStart || null,
        registrationEnd: data.registrationEnd || null,
        instructorId: data.instructorId || null,
      };

      if (editingWorkshop?.id) {
        // Update — use admin endpoint (not public /api/workshops) so RBAC applies
        const res = await authFetch(`/api/admin/workshops-data/${editingWorkshop.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to update");
        }
        toast.success(isRTL ? "کارگاه بروزرسانی شد" : "Workshop updated");
      } else {
        // Create
        const res = await authFetch(`/api/admin/workshops-data`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to create");
        }
        toast.success(isRTL ? "کارگاه ایجاد شد" : "Workshop created");
      }
      setIsDialogOpen(false);
      setEditingWorkshop(null);
      fetchWorkshops();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (isRTL ? "خطا" : "Error"));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete workshop
  const handleDelete = async (id: string) => {
    if (!confirm(isRTL ? "آیا مطمئن هستید؟" : "Are you sure?")) return;
    try {
      const res = await authFetch(`/api/admin/workshops-data/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete");
      }
      toast.success(isRTL ? "کارگاه حذف شد" : "Workshop deleted");
      fetchWorkshops();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (isRTL ? "خطا در حذف" : "Failed to delete"));
    }
  };

  // Filter
  const filteredWorkshops = workshops.filter((ws) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      ws.titleFa.toLowerCase().includes(q) ||
      ws.titleEn.toLowerCase().includes(q) ||
      (ws.category || "").toLowerCase().includes(q)
    );
  });

  function formatDateShort(dateStr: string | null | undefined, isRTL: boolean): string {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString(isRTL ? "fa-IR" : "en-US", {
        year: "numeric", month: "short", day: "numeric",
      });
    } catch {
      return "-";
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRTL ? "جستجوی کارگاه..." : "Search workshops..."}
            className="rounded-xl ps-9"
          />
        </div>
        <Button
          onClick={() => { setEditingWorkshop(null); setIsDialogOpen(true); }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{isRTL ? "کارگاه جدید" : "New Workshop"}</span>
        </Button>
        <Button variant="outline" size="icon" onClick={fetchWorkshops} className="shrink-0 rounded-xl">
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* Workshop List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filteredWorkshops.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">{searchQuery ? (isRTL ? "نتیجه‌ای یافت نشد" : "No results found") : (isRTL ? "هنوز کارگاهی ایجاد نشده" : "No workshops yet")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredWorkshops.map((ws, index) => {
            const seatPercentage = ws.totalSeats > 0 ? Math.round((ws.reservedSeats / ws.totalSeats) * 100) : 0;
            const isLowSeats = (ws.totalSeats - ws.reservedSeats) <= 10;
            return (
              <motion.div key={ws.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                <Card className={cn("border-border/30 hover:border-primary/20 transition-all", !ws.isPublished && "opacity-60")}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Cover thumbnail */}
                      <div className="w-12 h-12 rounded-lg shrink-0 overflow-hidden bg-muted flex items-center justify-center">
                        {ws.coverUrl ? (
                          <img src={ws.coverUrl} alt="" className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : ws.imageUrl ? (
                          <img src={ws.imageUrl} alt="" className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : ws.isHot ? (
                          <Flame className="w-5 h-5 text-destructive" />
                        ) : (
                          <GraduationCap className="w-5 h-5 text-gold" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="text-sm font-semibold truncate">{isRTL ? ws.titleFa : ws.titleEn}</h4>
                          {ws.isHot && <Badge className="text-[10px] bg-destructive/10 text-destructive border-0"><Flame className="w-2.5 h-2.5 mr-0.5" />Hot</Badge>}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{new Date(ws.date).toLocaleDateString(isRTL ? "fa-IR" : "en-US")}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{ws.reservedSeats}/{ws.totalSeats}</span>
                          {ws.price != null && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{ws.price.toLocaleString()}</span>}
                        </div>

                        {/* Registration period - NEW */}
                        {(ws.registrationStart || ws.registrationEnd) && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                            <CalendarDays className="w-3 h-3" />
                            {isRTL ? "ثبت‌نام: " : "Reg: "}
                            {formatDateShort(ws.registrationStart, isRTL)} → {formatDateShort(ws.registrationEnd, isRTL)}
                          </div>
                        )}

                        {/* Seat bar */}
                        <div className="mt-2 w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", isLowSeats ? "bg-destructive" : "bg-gradient-to-l from-primary to-gold")}
                            style={{ width: `${seatPercentage}%` }} />
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {ws.isPublished ? (
                            <Badge className="text-[10px] bg-green-500/10 text-green-600 border-0">{isRTL ? "منتشر" : "Live"}</Badge>
                          ) : (
                            <Badge className="text-[10px] bg-muted text-muted-foreground border-0">{isRTL ? "پیش‌نویس" : "Draft"}</Badge>
                          )}
                          {ws.category && (
                            <Badge variant="secondary" className="text-[10px]">
                              {isRTL ? workshopCategories.find(c => c.value === ws.category)?.labelFa : workshopCategories.find(c => c.value === ws.category)?.labelEn}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="w-7 h-7"
                          onClick={() => { setEditingWorkshop(ws); setIsDialogOpen(true); }}>
                          <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7 hover:text-destructive"
                          onClick={() => handleDelete(ws.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) setEditingWorkshop(null);
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWorkshop
                ? (isRTL ? "ویرایش کارگاه" : "Edit Workshop")
                : (isRTL ? "کارگاه جدید" : "New Workshop")}
            </DialogTitle>
          </DialogHeader>
          <EnhancedWorkshopForm
            initialData={editingWorkshop}
            onSave={handleSave}
            isRTL={isRTL}
            isSaving={isSaving}
            instructors={instructors}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
