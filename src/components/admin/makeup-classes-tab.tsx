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
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import {
  RefreshCw, Plus, Trash2, Edit3, Search, Loader2,
  CalendarDays, Clock, MapPin, Users, GraduationCap,
  CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

// ============================================
// Types
// ============================================
interface CourseOption {
  id: string;
  titleFa: string;
  titleEn: string;
  instructorId: string | null;
  instructor: { id: string; nameFa: string; nameEn: string } | null;
}

interface MakeupClass {
  id: string;
  courseId: string;
  titleFa: string;
  titleEn: string;
  date: string;
  duration: number;
  location: string | null;
  classType: string;
  notes: string | null;
  isCompleted: boolean;
  type: string;
  course: { id: string; titleFa: string; titleEn: string; instructor: { nameFa: string; nameEn: string } | null } | null;
  createdAt: string;
}

// ============================================
// Makeup Class Form
// ============================================
function MakeupClassForm({
  initialData,
  onSave,
  isRTL,
  isSaving,
  courses,
}: {
  initialData: Partial<MakeupClass> | null;
  onSave: (data: Record<string, unknown>) => void;
  isRTL: boolean;
  isSaving?: boolean;
  courses: CourseOption[];
}) {
  const [form, setForm] = useState({
    courseId: initialData?.courseId || "",
    titleFa: initialData?.titleFa || "",
    titleEn: initialData?.titleEn || "",
    date: initialData?.date ? new Date(initialData.date).toISOString().split("T")[0] : "",
    time: initialData?.date ? new Date(initialData.date).toTimeString().slice(0, 5) : "16:00",
    duration: initialData?.duration || 60,
    location: initialData?.location || "",
    classType: initialData?.classType || "group",
    notes: initialData?.notes || "",
  });

  const updateField = (field: string, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Auto-fill title when course is selected
  const handleCourseSelect = (courseId: string) => {
    updateField("courseId", courseId);
    const course = courses.find(c => c.id === courseId);
    if (course && !form.titleFa) {
      updateField("titleFa", `جبرانی ${course.titleFa}`);
      updateField("titleEn", `Makeup ${course.titleEn}`);
    }
  };

  const handleSubmit = () => {
    const dateTime = form.date && form.time
      ? new Date(`${form.date}T${form.time}:00`).toISOString()
      : null;
    onSave({
      courseId: form.courseId || null,
      titleFa: form.titleFa,
      titleEn: form.titleEn,
      date: dateTime,
      duration: form.duration,
      location: form.location || null,
      classType: form.classType,
      notes: form.notes || null,
      type: "makeup",
    });
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
      <div className="p-3 bg-teal-500/5 rounded-xl border border-teal-500/10">
        <p className="text-xs text-muted-foreground">
          {isRTL
            ? "🔄 کلاس جبرانی توسط ادمین ایجاد می‌شود و برای استاد و هنرجو قابل مشاهده است."
            : "🔄 Makeup classes are created by admin and visible to both instructor and student."}
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">{isRTL ? "دوره مرتبط" : "Related Course"}</Label>
        <Select value={form.courseId} onValueChange={handleCourseSelect}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder={isRTL ? "انتخاب دوره..." : "Select course..."} />
          </SelectTrigger>
          <SelectContent>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {isRTL ? c.titleFa : c.titleEn}
                {c.instructor && ` — ${isRTL ? c.instructor.nameFa : c.instructor.nameEn}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">{isRTL ? "عنوان (فارسی)" : "Title (Farsi)"} *</Label>
        <Input value={form.titleFa} onChange={(e) => updateField("titleFa", e.target.value)}
          className="rounded-xl" dir="rtl" placeholder={isRTL ? "کلاس جبرانی..." : "Makeup class..."} />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">{isRTL ? "عنوان (انگلیسی)" : "Title (English)"} *</Label>
        <Input value={form.titleEn} onChange={(e) => updateField("titleEn", e.target.value)}
          className="rounded-xl" dir="ltr" placeholder="Makeup class..." />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{isRTL ? "تاریخ" : "Date"} *</Label>
          <Input type="date" value={form.date} onChange={(e) => updateField("date", e.target.value)}
            className="rounded-xl" dir="ltr" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">{isRTL ? "ساعت" : "Time"} *</Label>
          <Input type="time" value={form.time} onChange={(e) => updateField("time", e.target.value)}
            className="rounded-xl" dir="ltr" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{isRTL ? "مدت (دقیقه)" : "Duration (min)"}</Label>
          <Input type="number" min={15} step={15} value={form.duration}
            onChange={(e) => updateField("duration", parseInt(e.target.value) || 60)}
            className="rounded-xl" dir="ltr" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">{isRTL ? "نوع کلاس" : "Class Type"}</Label>
          <Select value={form.classType} onValueChange={(v) => updateField("classType", v)}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="private">{isRTL ? "خصوصی" : "Private"}</SelectItem>
              <SelectItem value="group">{isRTL ? "گروهی" : "Group"}</SelectItem>
              <SelectItem value="semi_private">{isRTL ? "نیمه خصوصی" : "Semi-Private"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">{isRTL ? "مکان" : "Location"}</Label>
        <Input value={form.location} onChange={(e) => updateField("location", e.target.value)}
          className="rounded-xl" placeholder={isRTL ? "مثلاً اتاق ۱" : "e.g. Room 1"} dir={isRTL ? "rtl" : "ltr"} />
      </div>

      <div className="space-y-2">
        <Label className="text-sm">{isRTL ? "یادداشت" : "Notes"}</Label>
        <Textarea value={form.notes} onChange={(e) => updateField("notes", e.target.value)}
          className="rounded-xl resize-none" rows={2} dir={isRTL ? "rtl" : "ltr"} />
      </div>

      <Button onClick={handleSubmit} disabled={isSaving || !form.titleFa || !form.titleEn || !form.date}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2">
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        {initialData?.id ? (isRTL ? "بروزرسانی" : "Update") : (isRTL ? "ایجاد کلاس جبرانی" : "Create Makeup Class")}
      </Button>
    </div>
  );
}

// ============================================
// Main Makeup Classes Tab
// ============================================
export function MakeupClassesTab({ isRTL }: { isRTL: boolean }) {
  const [makeupClasses, setMakeupClasses] = useState<MakeupClass[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Partial<MakeupClass> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "upcoming" | "completed">("all");

  // Fetch makeup classes
  const fetchMakeupClasses = useCallback(async () => {
    try {
      const res = await authFetch("/api/admin/makeup-class");
      if (res.ok) {
        const data = await res.json();
        setMakeupClasses(data.makeupClasses || data || []);
      }
    } catch {
      toast.error(isRTL ? "خطا در بارگذاری" : "Failed to load");
    } finally {
      setIsLoading(false);
    }
  }, [isRTL]);

  // Fetch courses for dropdown
  const fetchCourses = useCallback(async () => {
    try {
      const res = await authFetch("/api/admin/courses?all=true");
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    deferEffect(() => {
      fetchMakeupClasses();
      fetchCourses();
    });
  }, [fetchMakeupClasses, fetchCourses]);

  // Create/Update makeup class
  const handleSave = async (data: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      if (editingClass?.id) {
        const res = await authFetch(`/api/admin/makeup-class`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingClass.id, ...data }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to update");
        }
        toast.success(isRTL ? "بروزرسانی شد" : "Updated");
      } else {
        const res = await authFetch("/api/admin/makeup-class", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to create");
        }
        toast.success(isRTL ? "کلاس جبرانی ایجاد شد" : "Makeup class created");
      }
      setIsDialogOpen(false);
      setEditingClass(null);
      fetchMakeupClasses();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (isRTL ? "خطا" : "Error"));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete makeup class
  const handleDelete = async (id: string) => {
    if (!confirm(isRTL ? "آیا مطمئن هستید؟" : "Are you sure?")) return;
    try {
      const res = await authFetch(`/api/admin/makeup-class`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast.success(isRTL ? "حذف شد" : "Deleted");
        fetchMakeupClasses();
      }
    } catch {
      toast.error(isRTL ? "خطا در حذف" : "Failed to delete");
    }
  };

  // Mark as completed
  const handleToggleComplete = async (id: string, isCompleted: boolean) => {
    try {
      const res = await authFetch(`/api/admin/makeup-class`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isCompleted: !isCompleted }),
      });
      if (res.ok) {
        toast.success(isRTL ? "وضعیت بروزرسانی شد" : "Status updated");
        fetchMakeupClasses();
      }
    } catch {
      toast.error(isRTL ? "خطا" : "Error");
    }
  };

  // Filter
  const filtered = makeupClasses.filter((mc) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!mc.titleFa.includes(q) && !mc.titleEn.toLowerCase().includes(q)) return false;
    }
    if (filterStatus === "upcoming") return !mc.isCompleted && new Date(mc.date) >= new Date();
    if (filterStatus === "completed") return mc.isCompleted;
    return true;
  });

  // Stats
  const upcomingCount = makeupClasses.filter(mc => !mc.isCompleted && new Date(mc.date) >= new Date()).length;
  const completedCount = makeupClasses.filter(mc => mc.isCompleted).length;
  const pastDueCount = makeupClasses.filter(mc => !mc.isCompleted && new Date(mc.date) < new Date()).length;

  const classTypeBadge = (classType: string) => {
    switch (classType) {
      case "private":
        return <Badge className="text-[10px] bg-purple-500/10 text-purple-600 border-0">{isRTL ? "خصوصی" : "Private"}</Badge>;
      case "group":
        return <Badge className="text-[10px] bg-rose-500/10 text-rose-600 border-0">{isRTL ? "گروهی" : "Group"}</Badge>;
      case "semi_private":
        return <Badge className="text-[10px] bg-amber-500/10 text-amber-600 border-0">{isRTL ? "نیمه خصوصی" : "Semi-Private"}</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">{classType}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: isRTL ? "آینده" : "Upcoming", value: upcomingCount, icon: CalendarDays, color: "text-teal-600", bg: "bg-teal-500/10" },
          { label: isRTL ? "انجام شده" : "Completed", value: completedCount, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10" },
          { label: isRTL ? "سررسید گذشته" : "Past Due", value: pastDueCount, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-500/10" },
        ].map((stat, i) => (
          <Card key={i} className="border-border/30">
            <CardContent className="p-3">
              <div className={cn("flex items-center gap-2 mb-1", isRTL && "flex-row-reverse")}>
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", stat.bg)}>
                  <stat.icon className={cn("w-3.5 h-3.5", stat.color)} />
                </div>
              </div>
              <p className={cn("text-sm font-bold", stat.color)}>{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
        <Button onClick={() => { setEditingClass(null); setIsDialogOpen(true); }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2">
          <Plus className="w-4 h-4" />
          {isRTL ? "جبرانی جدید" : "New Makeup"}
        </Button>
        <div className="flex-1" />
        <div className="relative flex-1 max-w-[200px]">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground", isRTL ? "right-2.5" : "left-2.5")} />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className={cn("rounded-xl h-9 text-xs", isRTL ? "pr-8" : "pl-8")}
            placeholder={isRTL ? "جستجو..." : "Search..."} />
        </div>
        <Select value={filterStatus} onValueChange={(v: string) => setFilterStatus(v as "all" | "upcoming" | "completed")}>
          <SelectTrigger className="rounded-xl h-9 w-[120px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRTL ? "همه" : "All"}</SelectItem>
            <SelectItem value="upcoming">{isRTL ? "آینده" : "Upcoming"}</SelectItem>
            <SelectItem value="completed">{isRTL ? "انجام شده" : "Completed"}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" className="w-9 h-9" onClick={fetchMakeupClasses}>
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <RefreshCw className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">{searchQuery ? (isRTL ? "نتیجه‌ای یافت نشد" : "No results") : (isRTL ? "کلاس جبرانی ثبت نشده" : "No makeup classes yet")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((mc, index) => {
            const dateObj = new Date(mc.date);
            const isPast = dateObj < new Date();
            return (
              <motion.div key={mc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                <Card className={cn(
                  "border-border/30 hover:border-primary/20 transition-all",
                  mc.isCompleted && "opacity-60"
                )}>
                  <CardContent className="p-3">
                    <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                        mc.isCompleted ? "bg-emerald-500/10" : isPast ? "bg-amber-500/10" : "bg-teal-500/10"
                      )}>
                        {mc.isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> :
                         isPast ? <AlertCircle className="w-4 h-4 text-amber-600" /> :
                         <RefreshCw className="w-4 h-4 text-teal-600" />}
                      </div>
                      <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                          <span className="text-sm font-semibold truncate">{isRTL ? mc.titleFa : mc.titleEn}</span>
                          {classTypeBadge(mc.classType)}
                          {mc.isCompleted ? (
                            <Badge className="text-[9px] bg-emerald-500/10 text-emerald-600 border-0">
                              <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />{isRTL ? "انجام شده" : "Done"}
                            </Badge>
                          ) : isPast ? (
                            <Badge className="text-[9px] bg-amber-500/10 text-amber-600 border-0">
                              <AlertCircle className="w-2.5 h-2.5 mr-0.5" />{isRTL ? "سررسید" : "Due"}
                            </Badge>
                          ) : null}
                        </div>
                        <div className={cn("flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5", isRTL && "flex-row-reverse")}>
                          <span className="flex items-center gap-0.5"><CalendarDays className="w-2.5 h-2.5" />{dateObj.toLocaleDateString(isRTL ? "fa-IR" : "en-US")}</span>
                          <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{dateObj.toLocaleTimeString(isRTL ? "fa-IR" : "en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                          <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{mc.duration}{isRTL ? " دقیقه" : " min"}</span>
                          {mc.location && <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{mc.location}</span>}
                        </div>
                        {mc.course && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {isRTL ? mc.course.titleFa : mc.course.titleEn}
                            {mc.course.instructor && ` — ${isRTL ? mc.course.instructor.nameFa : mc.course.instructor.nameEn}`}
                          </div>
                        )}
                      </div>
                      <div className={cn("flex items-center gap-1 shrink-0", isRTL && "flex-row-reverse")}>
                        <Button variant="ghost" size="icon" className="w-7 h-7"
                          onClick={() => handleToggleComplete(mc.id, mc.isCompleted)}
                          title={mc.isCompleted ? (isRTL ? "بازگردانی" : "Undo") : (isRTL ? "تکمیل" : "Complete")}>
                          {mc.isCompleted
                            ? <XCircle className="w-3.5 h-3.5 text-amber-600" />
                            : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7"
                          onClick={() => { setEditingClass(mc); setIsDialogOpen(true); }}>
                          <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7 hover:text-destructive"
                          onClick={() => handleDelete(mc.id)}>
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
        if (!open) setEditingClass(null);
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingClass
                ? (isRTL ? "ویرایش کلاس جبرانی" : "Edit Makeup Class")
                : (isRTL ? "کلاس جبرانی جدید" : "New Makeup Class")}
            </DialogTitle>
          </DialogHeader>
          <MakeupClassForm
            initialData={editingClass}
            onSave={handleSave}
            isRTL={isRTL}
            isSaving={isSaving}
            courses={courses}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
