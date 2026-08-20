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
  Music, Plus, Trash2, Edit3, Search, RefreshCw,
  Eye, EyeOff, Loader2, CalendarDays, Users, Clock,
  Star, BookOpen, Image as ImageIcon, ChevronDown, ChevronUp,
  GraduationCap, User, Tag,
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

interface Course {
  id: string;
  titleFa: string;
  titleEn: string;
  descriptionFa: string | null;
  descriptionEn: string | null;
  category: string | null;
  instrument: string | null;
  level: string;
  duration: string | null;
  sessionsMin: number | null;
  sessionsMax: number | null;
  price: number | null;
  imageUrl: string | null;
  coverUrl: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  branchId: string | null;
  registrationStart: string | null;
  registrationEnd: string | null;
  startDate: string | null;
  endDate: string | null;
  classType: string;
  maxStudents: number | null;
  instructorId: string | null;
  schedulePattern: string | null;
  sessionDays: string | null;
  createdAt: string;
  instructor: InstructorOption | null;
  branch: { id: string; nameFa: string; nameEn: string } | null;
  _count?: { enrollments: number };
}

// ============================================
// Constants
// ============================================
const categoryOptions = [
  { value: "instrument", labelFa: "ساز", labelEn: "Instrument" },
  { value: "vocal", labelFa: "آواز", labelEn: "Vocal" },
  { value: "theory", labelFa: "تئوری", labelEn: "Theory" },
  { value: "production", labelFa: "تولید موسیقی", labelEn: "Production" },
];

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
];

const levelOptions = [
  { value: "beginner", labelFa: "مبتدی", labelEn: "Beginner" },
  { value: "intermediate", labelFa: "متوسط", labelEn: "Intermediate" },
  { value: "advanced", labelFa: "پیشرفته", labelEn: "Advanced" },
  { value: "all", labelFa: "همه سطوح", labelEn: "All Levels" },
];

const classTypeOptions = [
  { value: "private", labelFa: "خصوصی", labelEn: "Private" },
  { value: "group", labelFa: "گروهی", labelEn: "Group" },
  { value: "semi_private", labelFa: "نیمه خصوصی", labelEn: "Semi-Private" },
];

const persianDays = [
  "شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه",
];

const englishDays = [
  "Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
];

// ============================================
// Helpers
// ============================================
function getClassTypeBadge(classType: string, isRTL: boolean) {
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
}

function getLevelBadge(level: string, isRTL: boolean) {
  const opt = levelOptions.find(o => o.value === level);
  const colors: Record<string, string> = {
    beginner: "bg-green-500/10 text-green-600",
    intermediate: "bg-blue-500/10 text-blue-600",
    advanced: "bg-red-500/10 text-red-600",
    all: "bg-muted text-muted-foreground",
  };
  return (
    <Badge className={cn("text-[10px] border-0", colors[level] || colors.all)}>
      {opt ? (isRTL ? opt.labelFa : opt.labelEn) : level}
    </Badge>
  );
}

function parseSchedulePattern(raw: string | null): { days: string[]; time: string; duration: number } | null {
  if (!raw) return null;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (parsed && (parsed.days || parsed.time)) return parsed;
    return null;
  } catch {
    return null;
  }
}

function formatDateShort(dateStr: string | null, isRTL: boolean): string {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString(isRTL ? "fa-IR" : "en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch {
    return "-";
  }
}

// ============================================
// Course Form Component
// ============================================
function CourseForm({
  initialData,
  onSave,
  isRTL,
  isSaving,
  instructors,
}: {
  initialData: Partial<Course> | null;
  onSave: (data: Record<string, unknown>) => void;
  isRTL: boolean;
  isSaving?: boolean;
  instructors: InstructorOption[];
}) {
  const existingSchedule = parseSchedulePattern(initialData?.schedulePattern || null);
  const existingSessionDays: string[] = (() => {
    if (!initialData?.sessionDays) return [];
    try {
      const parsed = typeof initialData.sessionDays === "string"
        ? JSON.parse(initialData.sessionDays)
        : initialData.sessionDays;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const [form, setForm] = useState({
    titleFa: initialData?.titleFa || "",
    titleEn: initialData?.titleEn || "",
    descriptionFa: initialData?.descriptionFa || "",
    descriptionEn: initialData?.descriptionEn || "",
    category: initialData?.category || "",
    instrument: initialData?.instrument || "",
    level: initialData?.level || "all",
    duration: initialData?.duration || "",
    sessionsMin: initialData?.sessionsMin || "",
    sessionsMax: initialData?.sessionsMax || "",
    price: initialData?.price || "",
    coverUrl: initialData?.coverUrl || "",
    imageUrl: initialData?.imageUrl || "",
    registrationStart: initialData?.registrationStart
      ? new Date(initialData.registrationStart).toISOString().split("T")[0] : "",
    registrationEnd: initialData?.registrationEnd
      ? new Date(initialData.registrationEnd).toISOString().split("T")[0] : "",
    startDate: initialData?.startDate
      ? new Date(initialData.startDate).toISOString().split("T")[0] : "",
    endDate: initialData?.endDate
      ? new Date(initialData.endDate).toISOString().split("T")[0] : "",
    classType: initialData?.classType || "group",
    maxStudents: initialData?.maxStudents || "",
    instructorId: initialData?.instructorId || "",
    scheduleTime: existingSchedule?.time || "16:00",
    scheduleDuration: existingSchedule?.duration || 60,
    isPublished: initialData?.isPublished ?? false,
    isFeatured: initialData?.isFeatured ?? false,
    branchId: initialData?.branchId || "",
  });

  const [selectedDays, setSelectedDays] = useState<string[]>(existingSessionDays.length > 0 ? existingSessionDays : (existingSchedule?.days || []));

  const updateField = (field: string, value: string | number | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = () => {
    const schedulePattern = selectedDays.length > 0
      ? { days: selectedDays, time: form.scheduleTime, duration: form.scheduleDuration }
      : null;

    onSave({
      titleFa: form.titleFa,
      titleEn: form.titleEn,
      descriptionFa: form.descriptionFa || null,
      descriptionEn: form.descriptionEn || null,
      category: form.category || null,
      instrument: form.instrument || null,
      level: form.level,
      duration: form.duration || null,
      sessionsMin: form.sessionsMin ? Number(form.sessionsMin) : null,
      sessionsMax: form.sessionsMax ? Number(form.sessionsMax) : null,
      price: form.price ? Number(form.price) : null,
      coverUrl: form.coverUrl || null,
      imageUrl: form.imageUrl || null,
      registrationStart: form.registrationStart || null,
      registrationEnd: form.registrationEnd || null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      classType: form.classType,
      maxStudents: form.maxStudents ? Number(form.maxStudents) : null,
      instructorId: form.instructorId || null,
      schedulePattern,
      sessionDays: selectedDays.length > 0 ? selectedDays : null,
      isPublished: form.isPublished,
      isFeatured: form.isFeatured,
      branchId: form.branchId || null,
    });
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
      {/* Title fields */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{isRTL ? "عنوان (فارسی)" : "Title (Farsi)"} *</Label>
        <Input value={form.titleFa} onChange={(e) => updateField("titleFa", e.target.value)}
          className="rounded-xl" dir="rtl" placeholder={isRTL ? "عنوان فارسی..." : "Farsi title..."} />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">{isRTL ? "عنوان (انگلیسی)" : "Title (English)"} *</Label>
        <Input value={form.titleEn} onChange={(e) => updateField("titleEn", e.target.value)}
          className="rounded-xl" dir="ltr" placeholder={isRTL ? "عنوان انگلیسی..." : "English title..."} />
      </div>

      {/* Descriptions */}
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

      {/* Category + Instrument + Level */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{isRTL ? "دسته‌بندی" : "Category"}</Label>
          <Select value={form.category} onValueChange={(v) => updateField("category", v)}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder={isRTL ? "انتخاب..." : "Select..."} /></SelectTrigger>
            <SelectContent>
              {categoryOptions.map((c) => (
                <SelectItem key={c.value} value={c.value}>{isRTL ? c.labelFa : c.labelEn}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">{isRTL ? "ساز" : "Instrument"}</Label>
          <Select value={form.instrument} onValueChange={(v) => updateField("instrument", v)}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder={isRTL ? "انتخاب..." : "Select..."} /></SelectTrigger>
            <SelectContent>
              {instrumentOptions.map((i) => (
                <SelectItem key={i.value} value={i.value}>{isRTL ? i.labelFa : i.labelEn}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">{isRTL ? "سطح" : "Level"}</Label>
          <Select value={form.level} onValueChange={(v) => updateField("level", v)}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder={isRTL ? "انتخاب..." : "Select..."} /></SelectTrigger>
            <SelectContent>
              {levelOptions.map((l) => (
                <SelectItem key={l.value} value={l.value}>{isRTL ? l.labelFa : l.labelEn}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Duration + Sessions + Price */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{isRTL ? "مدت دوره" : "Duration"}</Label>
          <Input value={form.duration} onChange={(e) => updateField("duration", e.target.value)}
            className="rounded-xl" placeholder={isRTL ? "مثلا: ۳ ماه" : "e.g. 3 months"} />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">{isRTL ? "حداقل جلسات" : "Min Sessions"}</Label>
          <Input type="number" value={form.sessionsMin} onChange={(e) => updateField("sessionsMin", e.target.value)}
            className="rounded-xl" dir="ltr" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">{isRTL ? "حداکثر جلسات" : "Max Sessions"}</Label>
          <Input type="number" value={form.sessionsMax} onChange={(e) => updateField("sessionsMax", e.target.value)}
            className="rounded-xl" dir="ltr" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">{isRTL ? "هزینه (تومان)" : "Price (Toman)"}</Label>
          <Input type="number" value={form.price} onChange={(e) => updateField("price", e.target.value)}
            className="rounded-xl" dir="ltr" />
        </div>
      </div>

      {/* Class Type + Max Students */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{isRTL ? "نوع کلاس" : "Class Type"}</Label>
          <Select value={form.classType} onValueChange={(v) => updateField("classType", v)}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {classTypeOptions.map((ct) => (
                <SelectItem key={ct.value} value={ct.value}>{isRTL ? ct.labelFa : ct.labelEn}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(form.classType === "group" || form.classType === "semi_private") && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{isRTL ? "حداکثر هنرجو" : "Max Students"}</Label>
            <Input type="number" min={1} value={form.maxStudents}
              onChange={(e) => updateField("maxStudents", e.target.value)} className="rounded-xl" dir="ltr" />
          </div>
        )}
      </div>

      {/* Instructor */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{isRTL ? "مدرس" : "Instructor"}</Label>
        <Select value={form.instructorId} onValueChange={(v) => updateField("instructorId", v)}>
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

      <Separator />

      {/* Registration Dates */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          {isRTL ? "دوره ثبت‌نام" : "Registration Period"}
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">{isRTL ? "شروع ثبت‌نام" : "Reg. Start"}</Label>
            <Input type="date" value={form.registrationStart} onChange={(e) => updateField("registrationStart", e.target.value)}
              className="rounded-xl" dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{isRTL ? "پایان ثبت‌نام" : "Reg. End"}</Label>
            <Input type="date" value={form.registrationEnd} onChange={(e) => updateField("registrationEnd", e.target.value)}
              className="rounded-xl" dir="ltr" />
          </div>
        </div>
      </div>

      {/* Course Dates */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-muted-foreground" />
          {isRTL ? "تاریخ دوره" : "Course Dates"}
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">{isRTL ? "شروع دوره" : "Start Date"}</Label>
            <Input type="date" value={form.startDate} onChange={(e) => updateField("startDate", e.target.value)}
              className="rounded-xl" dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{isRTL ? "پایان دوره" : "End Date"}</Label>
            <Input type="date" value={form.endDate} onChange={(e) => updateField("endDate", e.target.value)}
              className="rounded-xl" dir="ltr" />
          </div>
        </div>
      </div>

      <Separator />

      {/* Schedule Pattern */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          {isRTL ? "برنامه هفتگی" : "Weekly Schedule"}
        </h4>
        {/* Day selector */}
        <div className="flex flex-wrap gap-2 mb-3">
          {persianDays.map((day, i) => {
            const isSelected = selectedDays.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 text-muted-foreground border-border/50 hover:border-primary/30"
                )}
              >
                {isRTL ? day : englishDays[i]}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">{isRTL ? "ساعت شروع" : "Start Time"}</Label>
            <Input type="time" value={form.scheduleTime}
              onChange={(e) => updateField("scheduleTime", e.target.value)} className="rounded-xl" dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{isRTL ? "مدت (دقیقه)" : "Duration (min)"}</Label>
            <Input type="number" min={15} step={15} value={form.scheduleDuration}
              onChange={(e) => updateField("scheduleDuration", parseInt(e.target.value) || 60)} className="rounded-xl" dir="ltr" />
          </div>
        </div>
      </div>

      <Separator />

      {/* Image URLs */}
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

      {/* Switches */}
      <div className={cn("flex items-center gap-6", isRTL && "flex-row-reverse")}>
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <Switch checked={form.isPublished} onCheckedChange={(v) => updateField("isPublished", v)} />
          <Label className="text-sm">{isRTL ? "انتشار" : "Published"}</Label>
        </div>
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <Switch checked={form.isFeatured} onCheckedChange={(v) => updateField("isFeatured", v)} />
          <Label className="text-sm">{isRTL ? "ویژه" : "Featured"}</Label>
        </div>
      </div>

      {/* Submit */}
      <Button onClick={handleSubmit} disabled={isSaving}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2">
        {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
        {initialData?.id
          ? (isRTL ? "بروزرسانی دوره" : "Update Course")
          : (isRTL ? "ایجاد دوره" : "Create Course")}
      </Button>
    </div>
  );
}

// ============================================
// Main Courses Tab
// ============================================
export function CoursesTab({ isRTL }: { isRTL: boolean }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Partial<Course> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch courses
  const fetchCourses = useCallback(async () => {
    try {
      const res = await authFetch("/api/admin/courses?all=true");
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch {
      toast.error(isRTL ? "خطا در بارگذاری دوره‌ها" : "Failed to load courses");
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
      // silently fail - instructors dropdown is optional
    }
  }, []);

  useEffect(() => {
    deferEffect(() => {
      fetchCourses();
      fetchInstructors();
    });
  }, [fetchCourses, fetchInstructors]);

  // Create or update course
  const handleSave = async (data: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      if (editingCourse?.id) {
        // Update — PUT (route exports GET/PUT/DELETE, not PATCH)
        const res = await authFetch(`/api/admin/courses/${editingCourse.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to update");
        }
        toast.success(isRTL ? "دوره بروزرسانی شد" : "Course updated");
      } else {
        // Create
        const res = await authFetch("/api/admin/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to create");
        }
        toast.success(isRTL ? "دوره ایجاد شد" : "Course created");
      }
      setIsDialogOpen(false);
      setEditingCourse(null);
      fetchCourses();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (isRTL ? "خطا" : "Error"));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete course
  const handleDelete = async (id: string) => {
    if (!confirm(isRTL ? "آیا مطمئن هستید؟" : "Are you sure?")) return;
    try {
      const res = await authFetch(`/api/admin/courses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete");
      }
      toast.success(isRTL ? "دوره حذف شد" : "Course deleted");
      fetchCourses();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (isRTL ? "خطا در حذف" : "Failed to delete"));
    }
  };

  // Filter courses
  const filteredCourses = courses.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.titleFa.toLowerCase().includes(q) ||
      c.titleEn.toLowerCase().includes(q) ||
      (c.category || "").toLowerCase().includes(q) ||
      (c.instrument || "").toLowerCase().includes(q)
    );
  });

  // Get instructor name
  const getInstructorName = (course: Course) => {
    if (course.instructor) {
      return isRTL ? course.instructor.nameFa : course.instructor.nameEn;
    }
    return null;
  };

  // Get schedule display
  const getScheduleDisplay = (course: Course) => {
    const schedule = parseSchedulePattern(course.schedulePattern);
    if (!schedule || !schedule.days || schedule.days.length === 0) return null;
    return (
      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Clock className="w-3 h-3" />
        {schedule.days.join("، ")} • {schedule.time} • {schedule.duration}{isRTL ? " دقیقه" : " min"}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRTL ? "جستجوی دوره..." : "Search courses..."}
            className="rounded-xl ps-9"
          />
        </div>
        <Button
          onClick={() => { setEditingCourse(null); setIsDialogOpen(true); }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{isRTL ? "دوره جدید" : "New Course"}</span>
        </Button>
        <Button variant="outline" size="icon" onClick={fetchCourses} className="shrink-0 rounded-xl">
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* Course List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Music className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">{searchQuery ? (isRTL ? "نتیجه‌ای یافت نشد" : "No results found") : (isRTL ? "هنوز دوره‌ای ایجاد نشده" : "No courses yet")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCourses.map((course, index) => (
            <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
              <Card className={cn("border-border/30 hover:border-primary/20 transition-all", !course.isPublished && "opacity-60")}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Cover thumbnail */}
                    <div className="w-12 h-12 rounded-lg shrink-0 overflow-hidden bg-muted flex items-center justify-center">
                      {course.coverUrl ? (
                        <img src={course.coverUrl} alt="" className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : course.imageUrl ? (
                        <img src={course.imageUrl} alt="" className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <Music className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="text-sm font-semibold truncate">
                          {isRTL ? course.titleFa : course.titleEn}
                        </h4>
                        {course.isFeatured && <Star className="w-3 h-3 text-gold shrink-0 fill-gold" />}
                      </div>

                      {/* Badges row */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                        {course.category && (
                          <Badge variant="secondary" className="text-[10px]">
                            <Tag className="w-2.5 h-2.5 mr-0.5" />
                            {isRTL ? categoryOptions.find(c => c.value === course.category)?.labelFa : categoryOptions.find(c => c.value === course.category)?.labelEn || course.category}
                          </Badge>
                        )}
                        {course.instrument && (
                          <Badge variant="secondary" className="text-[10px]">
                            {isRTL ? instrumentOptions.find(i => i.value === course.instrument)?.labelFa : instrumentOptions.find(i => i.value === course.instrument)?.labelEn || course.instrument}
                          </Badge>
                        )}
                        {getLevelBadge(course.level, isRTL)}
                        {getClassTypeBadge(course.classType, isRTL)}
                      </div>

                      {/* Instructor */}
                      {getInstructorName(course) && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
                          <User className="w-3 h-3" />
                          <span>{isRTL ? "مدرس: " : "Instructor: "}{getInstructorName(course)}</span>
                        </div>
                      )}

                      {/* Dates & Schedule row */}
                      <div className="flex flex-col gap-0.5">
                        {/* Registration period */}
                        {(course.registrationStart || course.registrationEnd) && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {isRTL ? "ثبت‌نام: " : "Reg: "}
                            {formatDateShort(course.registrationStart, isRTL)} → {formatDateShort(course.registrationEnd, isRTL)}
                          </span>
                        )}
                        {/* Course dates */}
                        {(course.startDate || course.endDate) && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <GraduationCap className="w-3 h-3" />
                            {isRTL ? "دوره: " : "Course: "}
                            {formatDateShort(course.startDate, isRTL)} → {formatDateShort(course.endDate, isRTL)}
                          </span>
                        )}
                        {/* Schedule pattern */}
                        {getScheduleDisplay(course)}
                      </div>

                      {/* Stats row */}
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        {course._count && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Users className="w-3 h-3" />
                            {course._count.enrollments} {isRTL ? "هنرجو" : "enrolled"}
                          </span>
                        )}
                        {course.price != null && (
                          <span className="text-[10px] text-muted-foreground">
                            {course.price.toLocaleString()} {isRTL ? "تومان" : "Toman"}
                          </span>
                        )}
                        {course.isPublished ? (
                          <Badge className="text-[10px] bg-green-500/10 text-green-600 border-0">
                            <Eye className="w-2.5 h-2.5 mr-0.5" />{isRTL ? "منتشر" : "Live"}
                          </Badge>
                        ) : (
                          <Badge className="text-[10px] bg-muted text-muted-foreground border-0">
                            <EyeOff className="w-2.5 h-2.5 mr-0.5" />{isRTL ? "پیش‌نویس" : "Draft"}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="w-7 h-7"
                        onClick={() => { setEditingCourse(course); setIsDialogOpen(true); }}>
                        <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7 hover:text-destructive"
                        onClick={() => handleDelete(course.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) setEditingCourse(null);
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCourse
                ? (isRTL ? "ویرایش دوره" : "Edit Course")
                : (isRTL ? "دوره جدید" : "New Course")}
            </DialogTitle>
          </DialogHeader>
          <CourseForm
            initialData={editingCourse}
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
