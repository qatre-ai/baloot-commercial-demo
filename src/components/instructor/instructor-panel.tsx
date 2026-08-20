"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { deferEffect } from "@/lib/react/defer-effect";
import { useI18n } from "@/lib/i18n";
import { useAuthStore, authFetch } from "@/lib/auth/store";
import { cn } from "@/lib/utils";
import { toPersianDigits, formatJalaaliDate } from "@/lib/jalali";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { uniqueById } from "@/lib/instructor/collection-contract";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  Music,
  LogOut,
  CalendarDays,
  Users,
  BookOpen,
  User,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  GraduationCap,
  MessageSquare,
  Edit3,
  Send,
  Megaphone,
  CalendarPlus,
  Zap,
  Timer,
  LayoutDashboard,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Music2,
  XCircle,
  ArrowRightLeft,
  Bell,
  Star,
  Eye,
} from "lucide-react";

// ============================================
// Jalali Date Conversion (local, self-contained)
// ============================================
function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    g_d_m[gm - 1];
  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return [jy, jm, jd];
}

function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
  const jy2 = jy > 0 ? jy - 1 : jy;
  let days =
    1461 * Math.floor(jy2 / 33) +
    365 * (jy2 % 33) +
    Math.floor(((jy2 % 33) + 3) / 4) +
    287 +
    jd;
  if (jm <= 7) {
    days += 31 * (jm - 1);
  } else {
    days += 186 + 30 * (jm - 8);
  }
  let gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let gm: number;
  let gd: number;
  const g_d_m = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  for (let i = 0; i < 13; i++) {
    if (days < g_d_m[i]) {
      gm = i;
      gd = days + 1;
      break;
    }
    days -= g_d_m[i];
  }
  return [gy, gm!, gd!];
}

function isJalaliLeap(jy: number): boolean {
  const breaks = [1, 5, 9, 13, 17, 22, 26, 30];
  const cycle = jy > 0 ? ((jy - 1) % 33) + 1 : ((jy % 33) + 33) % 33 + 1;
  return breaks.includes(cycle);
}

function jalaliMonthDays(jm: number, jy: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaliLeap(jy) ? 30 : 29;
}

function jalaliFirstDayOfMonth(jy: number, jm: number): number {
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, 1);
  const date = new Date(gy, gm - 1, gd);
  const day = date.getDay();
  return (day + 1) % 7;
}

// ============================================
// Constants
// ============================================
const PERSIAN_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

const PERSIAN_DAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
const PERSIAN_DAYS_SHORT = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const DAY_NAMES_FA = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

const CLASS_TYPE_COLORS: Record<string, { bg: string; dot: string; text: string; border: string; labelFa: string; labelEn: string }> = {
  private: { bg: "bg-purple-500/15", dot: "bg-purple-500", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500/30", labelFa: "خصوصی", labelEn: "Private" },
  group: { bg: "bg-rose-500/15", dot: "bg-rose-500", text: "text-rose-600 dark:text-rose-400", border: "border-rose-500/30", labelFa: "گروهی", labelEn: "Group" },
  makeup: { bg: "bg-teal-500/15", dot: "bg-teal-500", text: "text-teal-600 dark:text-teal-400", border: "border-teal-500/30", labelFa: "جبرانی", labelEn: "Makeup" },
};

const REQUEST_TYPE_CONFIG: Record<string, { labelFa: string; labelEn: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  time_change: { labelFa: "تغییر زمان", labelEn: "Time Change", icon: Clock, className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  cancellation: { labelFa: "لغو کلاس", labelEn: "Cancellation", icon: XCircle, className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" },
  room_change: { labelFa: "تغییر اتاق", labelEn: "Room Change", icon: ArrowRightLeft, className: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20" },
  reschedule: { labelFa: "جابجایی", labelEn: "Reschedule", icon: CalendarDays, className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
};

const REQUEST_STATUS_CONFIG: Record<string, { labelFa: string; labelEn: string; className: string }> = {
  pending: { labelFa: "در انتظار", labelEn: "Pending", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  approved: { labelFa: "تأیید شده", labelEn: "Approved", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  rejected: { labelFa: "رد شده", labelEn: "Rejected", className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" },
};

const ANNOUNCEMENT_TYPE_CONFIG: Record<string, { labelFa: string; labelEn: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  info: { labelFa: "اطلاعیه", labelEn: "Info", className: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20", icon: Megaphone },
  urgent: { labelFa: "فوری", labelEn: "Urgent", className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20", icon: AlertCircle },
  event: { labelFa: "رویداد", labelEn: "Event", className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20", icon: CalendarDays },
  holiday: { labelFa: "تعطیلی", labelEn: "Holiday", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", icon: Star },
};

const SUBMISSION_STATUS_CONFIG: Record<string, { labelFa: string; labelEn: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  assigned: { labelFa: "اختصاص‌یافته", labelEn: "Assigned", className: "bg-muted text-muted-foreground border-border", icon: BookOpen },
  submitted: { labelFa: "ارسال‌شده", labelEn: "Submitted", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", icon: Send },
  graded: { labelFa: "تصحیح‌شده", labelEn: "Graded", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
  late: { labelFa: "دیرتر از موعد", labelEn: "Late", className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20", icon: AlertCircle },
};

// Use the shared toPersianDigits from jalali lib
const toPersianNum = toPersianDigits;

// ============================================
// Types — matching real API responses
// ============================================
interface ScheduleItem {
  id: string;
  courseId: string;
  dayOfWeek: number;
  dayNameFa: string;
  dayNameEn: string;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  specificDate: string | null;
  room: string | null;
  capacity: number | null;
  status: string;
  notes: string | null;
  studentCount: number;
  course: {
    id: string;
    titleFa: string;
    titleEn: string;
    classType: string;
    level: string | null;
    instrument: string | null;
    studentCount: number;
  };
  branch: {
    id: string;
    nameFa: string;
    nameEn: string;
  } | null;
}

interface ScheduleRequestItem {
  id: string;
  scheduleId: string;
  courseId: string;
  requestType: string;
  reason: string;
  proposedChanges: string;
  status: string;
  isApplied: boolean;
  appliedAt: string | null;
  createdAt: string;
  course: {
    id: string;
    titleFa: string;
    titleEn: string;
    instrument: string | null;
    level: string | null;
  };
  schedule: {
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room: string | null;
    status: string;
    isRecurring: boolean;
    specificDate: string | null;
  };
}

interface ExerciseItem {
  id: string;
  titleFa: string;
  titleEn: string;
  descriptionFa: string | null;
  descriptionEn: string | null;
  type: string;
  difficulty: string;
  courseId: string;
  dueDate: string | null;
  isPublished: boolean;
  createdAt: string;
  course: {
    id: string;
    titleFa: string;
    titleEn: string;
    instrument: string | null;
    level: string | null;
  };
  _count: { submissions: number };
  submissionStats: {
    total: number;
    submitted: number;
    graded: number;
    late: number;
    assigned: number;
  };
}

interface SubmissionItem {
  id: string;
  studentId: string;
  exerciseId: string;
  status: string;
  grade: number | null;
  feedback: string | null;
  submittedAt: string | null;
  gradedAt: string | null;
  student: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    primaryInstrument: string | null;
  };
  exercise: {
    id: string;
    titleFa: string;
    titleEn: string;
    type: string;
    difficulty: string;
    dueDate: string | null;
    courseId: string;
    course: {
      id: string;
      titleFa: string;
      titleEn: string;
      instrument: string | null;
    };
  };
}

interface AnnouncementItem {
  id: string;
  titleFa: string;
  titleEn: string | null;
  contentFa: string;
  contentEn: string | null;
  type: string;
  isPinned: boolean;
  priority: number;
  isPublished: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface DashboardData {
  instructor: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    specialtyFa: string | null;
    specialtyEn: string | null;
    bioFa: string | null;
    bioEn: string | null;
    primaryInstrument: string | null;
    isActive: boolean;
  };
  summary: {
    totalStudents: number;
    activeCourses: number;
    upcomingClasses: number;
    pendingGrading: number;
    recentSubmissionsCount: number;
    totalCourses: number;
    todayClasses: number;
  };
}

// ============================================
// Grade color helper
// ============================================
function gradeColor(grade: number): string {
  if (grade >= 18) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  if (grade >= 14) return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  return "bg-red-500/10 text-red-600 dark:text-red-400";
}

// ============================================
// Empty State Component
// ============================================
function EmptyState({ icon: Icon, title, subtitle, isRTL }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle?: string; isRTL: boolean }) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
      <div className="w-16 h-16 rounded-2xl bg-muted/40 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground/40" />
      </div>
      <p className="text-sm font-semibold text-muted-foreground">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground/60 mt-1">{subtitle}</p>}
    </div>
  );
}

function InstructorProfileTab({ isRTL }: { isRTL: boolean }) {
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await authFetch("/api/student/profile");
      if (!response.ok) throw new Error("Failed to load profile");
      const data = await response.json();
      setProfile(data.profile || null);
    } catch {
      toast.error(isRTL ? "خطا در بارگذاری پروفایل" : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, [isRTL]);

  useEffect(() => {
    deferEffect(loadProfile);
  }, [loadProfile]);

  const updateField = (field: string, value: string) => {
    setProfile((current) => (current ? { ...current, [field]: value } : current));
  };

  const saveProfile = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const response = await authFetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          primaryInstrument: profile.primaryInstrument,
          skillLevel: profile.skillLevel,
          city: profile.city,
          experience: profile.experience,
        }),
      });
      if (!response.ok) throw new Error("Failed to save profile");
      const data = await response.json();
      setProfile(data.profile || profile);
      toast.success(isRTL ? "پروفایل ذخیره شد" : "Profile saved");
    } catch {
      toast.error(isRTL ? "ذخیره پروفایل انجام نشد" : "Could not save profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <PanelSkeleton />;
  if (!profile) return <EmptyState icon={User} title={isRTL ? "پروفایل یافت نشد" : "Profile not found"} isRTL={isRTL} />;

  const fields = [
    { key: "name", labelFa: "نام و نام خانوادگی", labelEn: "Full name" },
    { key: "phone", labelFa: "شماره تماس", labelEn: "Phone" },
    { key: "primaryInstrument", labelFa: "ساز اصلی", labelEn: "Primary instrument" },
    { key: "skillLevel", labelFa: "سطح مهارت", labelEn: "Skill level" },
    { key: "city", labelFa: "شهر", labelEn: "City" },
    { key: "experience", labelFa: "سابقه تدریس", labelEn: "Teaching experience" },
  ];

  return (
    <div className="space-y-4">
      <Card className="border-primary/15 bg-gradient-to-br from-primary/[0.04] to-transparent">
        <CardContent className="p-5">
          <div className={cn("flex items-center gap-3 mb-5", isRTL && "flex-row-reverse")}>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className={cn("min-w-0", isRTL && "text-right")}>
              <h2 className="text-base font-bold">{isRTL ? "پروفایل مدرس" : "Instructor Profile"}</h2>
              <p className="text-xs text-muted-foreground truncate">{String(profile.email || "")}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label>{isRTL ? field.labelFa : field.labelEn}</Label>
                <Input
                  value={String(profile[field.key] ?? "")}
                  onChange={(event) => updateField(field.key, event.target.value)}
                  className="rounded-xl"
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>
            ))}
          </div>
          <Button onClick={saveProfile} disabled={isSaving} className="mt-5 rounded-xl gap-2">
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isRTL ? "ذخیره تغییرات" : "Save changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// Skeleton Loader
// ============================================
function PanelSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="w-14 h-14 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <Skeleton className="h-32 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
      <Skeleton className="h-24 rounded-2xl" />
    </div>
  );
}

// ============================================
// TAB 1: Dashboard
// ============================================
function DashboardTab({
  schedules,
  exercises,
  dashboardData,
  announcements,
  isRTL,
  instructorName,
  onNavigateToTab,
}: {
  schedules: ScheduleItem[];
  exercises: ExerciseItem[];
  dashboardData: DashboardData | null;
  announcements: AnnouncementItem[];
  isRTL: boolean;
  instructorName: string;
  onNavigateToTab: (tab: string) => void;
}) {
  const now = new Date();
  const jsDay = now.getDay();
  const todayPersianDay = jsDay === 6 ? 0 : jsDay + 1;

  const todayClasses = useMemo(() =>
    schedules.filter((s) => s.dayOfWeek === todayPersianDay && s.status === "active"),
    [schedules, todayPersianDay]
  );

  const pendingGrading = useMemo(() => {
    return dashboardData?.summary?.pendingGrading ?? exercises.reduce((sum, ex) => sum + (ex.submissionStats?.submitted || 0), 0);
  }, [exercises, dashboardData]);

  const totalStudents = useMemo(() =>
    dashboardData?.summary?.totalStudents ?? schedules.reduce((sum, s) => sum + s.studentCount, 0),
    [schedules, dashboardData]
  );

  const activeCourses = useMemo(() =>
    dashboardData?.summary?.activeCourses ?? new Set(schedules.map((s) => s.courseId)).size,
    [schedules, dashboardData]
  );

  const nextClassTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  const nextClass = schedules
    .filter((s) => s.dayOfWeek === todayPersianDay && s.status === "active" && s.startTime > nextClassTime)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))[0] || null;

  const recentAnnouncements = announcements.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
          <Music2 className="w-7 h-7 text-primary" />
        </div>
        <div className={cn("flex-1", isRTL && "text-right")}>
          <h2 className="text-xl font-bold text-foreground">
            {isRTL ? `سلام، استاد ${instructorName}!` : `Hello, ${instructorName}!`}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isRTL ? `امروز ${toPersianNum(todayClasses.length)} کلاس دارید` : `You have ${todayClasses.length} classes today`}
          </p>
        </div>
      </div>

      {/* Today's Summary Card */}
      <Card className="border-primary/15 bg-gradient-to-br from-primary/[0.04] via-primary/[0.02] to-transparent overflow-hidden">
        <CardContent className="p-5">
          <div className={cn("flex items-center gap-2 mb-4", isRTL && "flex-row-reverse")}>
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              {isRTL ? "خلاصه امروز" : "Today's Summary"}
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="text-center p-3 rounded-2xl bg-primary/5 border border-primary/10">
              <p className="text-2xl font-bold text-primary">{toPersianNum(todayClasses.length)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{isRTL ? "کلاس امروز" : "Classes"}</p>
            </div>
            <div className="text-center p-3 rounded-2xl bg-amber-500/5 border border-amber-500/10">
              <p className={cn("text-2xl font-bold", pendingGrading > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
                {toPersianNum(pendingGrading)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{isRTL ? "منتظر تصحیح" : "Pending"}</p>
            </div>
            <div className="text-center p-3 rounded-2xl bg-teal-500/5 border border-teal-500/10">
              <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{toPersianNum(totalStudents)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{isRTL ? "هنرجو" : "Students"}</p>
            </div>
            <div className="text-center p-3 rounded-2xl bg-purple-500/5 border border-purple-500/10">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{toPersianNum(activeCourses)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{isRTL ? "دوره فعال" : "Courses"}</p>
            </div>
          </div>

          {/* Next Class */}
          {nextClass && (
            <div className={cn("flex items-center gap-3 p-3.5 rounded-2xl bg-teal-500/5 border border-teal-500/10", isRTL && "flex-row-reverse")}>
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0">
                <Timer className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                <p className="text-[11px] text-muted-foreground">{isRTL ? "کلاس بعدی" : "Next Class"}</p>
                <p className="text-sm font-semibold text-foreground truncate">
                  {isRTL ? nextClass.course.titleFa : nextClass.course.titleEn}
                </p>
                <div className={cn("flex items-center gap-2 mt-0.5", isRTL && "flex-row-reverse justify-end")}>
                  <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 border", CLASS_TYPE_COLORS[nextClass.course.classType]?.bg, CLASS_TYPE_COLORS[nextClass.course.classType]?.text, CLASS_TYPE_COLORS[nextClass.course.classType]?.border)}>
                    {isRTL ? CLASS_TYPE_COLORS[nextClass.course.classType]?.labelFa : CLASS_TYPE_COLORS[nextClass.course.classType]?.labelEn}
                  </Badge>
                  {nextClass.room && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" />{nextClass.room}
                    </span>
                  )}
                </div>
              </div>
              <div className={cn("text-center shrink-0", isRTL && "text-left")}>
                <p className="text-lg font-bold text-teal-600 dark:text-teal-400">
                  {toPersianNum(nextClass.startTime)}
                </p>
              </div>
            </div>
          )}

          {todayClasses.length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">{isRTL ? "امروز کلاسی ندارید" : "No classes today"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h3 className={cn("text-sm font-semibold text-muted-foreground mb-3", isRTL && "text-right")}>
          {isRTL ? "دسترسی سریع" : "Quick Actions"}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { icon: ClipboardList, labelFa: "تصحیح تمرین‌ها", labelEn: "Grade Submissions", tab: "submissions", color: "amber" },
            { icon: CalendarDays, labelFa: "برنامه هفتگی", labelEn: "View Schedule", tab: "schedule", color: "primary" },
            { icon: FileText, labelFa: "درخواست‌ها", labelEn: "Requests", tab: "requests", color: "sky" },
            { icon: BookOpen, labelFa: "کلاس‌های من", labelEn: "My Classes", tab: "classes", color: "purple" },
            { icon: CalendarPlus, labelFa: "جلسه جبرانی", labelEn: "Makeup Class", tab: "makeup", color: "teal" },
            { icon: Megaphone, labelFa: "اطلاعیه‌ها", labelEn: "Announcements", tab: "announcements", color: "rose" },
          ].map((action) => (
            <motion.button
              key={action.tab}
              onClick={() => onNavigateToTab(action.tab)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "flex items-center gap-3 p-4 rounded-2xl border border-border/40 bg-card hover:bg-muted/30 transition-all text-left",
                isRTL && "flex-row-reverse text-right"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                action.color === "amber" ? "bg-amber-500/10" :
                action.color === "sky" ? "bg-sky-500/10" :
                action.color === "purple" ? "bg-purple-500/10" :
                action.color === "teal" ? "bg-teal-500/10" :
                action.color === "rose" ? "bg-rose-500/10" :
                "bg-primary/10"
              )}>
                <action.icon className={cn(
                  "w-5 h-5",
                  action.color === "amber" ? "text-amber-600 dark:text-amber-400" :
                  action.color === "sky" ? "text-sky-600 dark:text-sky-400" :
                  action.color === "purple" ? "text-purple-600 dark:text-purple-400" :
                  action.color === "teal" ? "text-teal-600 dark:text-teal-400" :
                  action.color === "rose" ? "text-rose-600 dark:text-rose-400" :
                  "text-primary"
                )} />
              </div>
              <span className="text-sm font-semibold text-foreground">
                {isRTL ? action.labelFa : action.labelEn}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Recent Announcements */}
      {recentAnnouncements.length > 0 && (
        <div>
          <div className={cn("flex items-center justify-between mb-3", isRTL && "flex-row-reverse")}>
            <h3 className="text-sm font-semibold text-muted-foreground">
              {isRTL ? "اطلاعیه‌های اخیر" : "Recent Announcements"}
            </h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigateToTab("announcements")} className="text-xs text-primary rounded-lg h-7 px-2">
              {isRTL ? "مشاهده همه" : "View all"}
            </Button>
          </div>
          <div className="space-y-2">
            {recentAnnouncements.map((ann) => {
              const typeConfig = ANNOUNCEMENT_TYPE_CONFIG[ann.type] || ANNOUNCEMENT_TYPE_CONFIG.info;
              return (
                <div key={ann.id} className={cn("flex items-start gap-3 p-3 rounded-xl border border-border/30", isRTL && "flex-row-reverse")}>
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", typeConfig.className.split(" ").slice(0, 2).join(" "))}>
                    <typeConfig.icon className="w-4 h-4" />
                  </div>
                  <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {isRTL ? ann.titleFa : (ann.titleEn || ann.titleFa)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {ann.createdAt ? formatJalaaliDate(ann.createdAt.split("T")[0], isRTL, "long") : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Today's Timeline */}
      {todayClasses.length > 0 && (
        <div>
          <h3 className={cn("text-sm font-semibold text-muted-foreground mb-3", isRTL && "text-right")}>
            {isRTL ? "برنامه امروز" : "Today's Timeline"}
          </h3>
          <div className="space-y-2">
            {todayClasses.sort((a, b) => a.startTime.localeCompare(b.startTime)).map((cls, i) => {
              const config = CLASS_TYPE_COLORS[cls.course.classType] || CLASS_TYPE_COLORS.group;
              return (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, x: isRTL ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn("flex items-center gap-3 p-3 rounded-2xl border", config.bg, config.border)}
                >
                  <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", config.bg)}>
                    <BookOpen className={cn("w-5 h-5", config.text)} />
                  </div>
                  <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {isRTL ? cls.course.titleFa : cls.course.titleEn}
                    </p>
                    <div className={cn("flex items-center gap-2 mt-0.5", isRTL && "flex-row-reverse justify-end")}>
                      <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 border", config.bg, config.text, config.border)}>
                        {isRTL ? config.labelFa : config.labelEn}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Users className="w-2.5 h-2.5" />{toPersianNum(cls.studentCount)}
                      </span>
                      {cls.room && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5" />{cls.room}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={cn("shrink-0 text-center", isRTL && "text-left")}>
                    <p className="text-sm font-bold text-foreground">
                      {toPersianNum(cls.startTime)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{toPersianNum(cls.endTime)}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// TAB 2: Schedule (Jalali Calendar)
// ============================================
function ScheduleTab({
  schedules,
  isRTL,
  onCreateRequest,
}: {
  schedules: ScheduleItem[];
  isRTL: boolean;
  onCreateRequest: () => void;
}) {
  const today = new Date();
  const [todayJy, todayJm, todayJd] = gregorianToJalali(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const [viewYear, setViewYear] = useState(todayJy);
  const [viewMonth, setViewMonth] = useState(todayJm);
  const [selectedDay, setSelectedDay] = useState<number | null>(todayJd);
  const [calendarView, setCalendarView] = useState<"month" | "week">("week");
  const [selectedClass, setSelectedClass] = useState<ScheduleItem | null>(null);

  const scheduleByDayOfWeek = useMemo(() => {
    const map: Record<number, ScheduleItem[]> = {};
    schedules.forEach((item) => {
      if (item.isRecurring && item.status === "active") {
        if (!map[item.dayOfWeek]) map[item.dayOfWeek] = [];
        map[item.dayOfWeek].push(item);
      }
    });
    Object.keys(map).forEach((key) => {
      map[Number(key)].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    return map;
  }, [schedules]);

  const oneTimeByDate = useMemo(() => {
    const map: Record<string, ScheduleItem[]> = {};
    schedules.forEach((item) => {
      if (!item.isRecurring && item.specificDate && item.status === "active") {
        const d = new Date(item.specificDate);
        const [jy, jm, jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
        const key = `${jy}-${jm}-${jd}`;
        if (!map[key]) map[key] = [];
        map[key].push(item);
      }
    });
    return map;
  }, [schedules]);

  const getClassesForDay = useCallback((jalaliKey: string, dayOfWeek: number): ScheduleItem[] => {
    const recurring = scheduleByDayOfWeek[dayOfWeek] || [];
    const oneTime = oneTimeByDate[jalaliKey] || [];
    return [...recurring, ...oneTime].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [scheduleByDayOfWeek, oneTimeByDate]);

  const getDayOfWeekForJalali = useCallback((jy: number, jm: number, jd: number): number => {
    const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
    const date = new Date(gy, gm - 1, gd);
    const jsDay = date.getDay();
    return jsDay === 6 ? 0 : jsDay + 1;
  }, []);

  const monthDays = jalaliMonthDays(viewMonth, viewYear);
  const firstDay = jalaliFirstDayOfMonth(viewYear, viewMonth);
  const isCurrentMonth = viewYear === todayJy && viewMonth === todayJm;

  const prevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(viewYear - 1); }
    else { setViewMonth(viewMonth - 1); }
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(viewYear + 1); }
    else { setViewMonth(viewMonth + 1); }
    setSelectedDay(null);
  };

  const goToToday = () => {
    setViewYear(todayJy);
    setViewMonth(todayJm);
    setSelectedDay(todayJd);
  };

  const selectedKey = selectedDay ? `${viewYear}-${viewMonth}-${selectedDay}` : null;
  const selectedDayOfWeek = selectedDay ? getDayOfWeekForJalali(viewYear, viewMonth, selectedDay) : -1;
  const selectedClasses = selectedKey ? getClassesForDay(selectedKey, selectedDayOfWeek) : [];

  const cells: Array<{ day: number | null; key: string }> = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: null, key: `empty-${i}` });
  }
  for (let d = 1; d <= monthDays; d++) {
    cells.push({ day: d, key: `${viewYear}-${viewMonth}-${d}` });
  }

  // Week view data — 7 days (Saturday through Friday)
  const weekData = useMemo(() => {
    if (!selectedDay) return [];
    const [gy, gm, gd] = jalaliToGregorian(viewYear, viewMonth, selectedDay);
    const selectedDate = new Date(gy, gm - 1, gd);
    const dayOfWeek = selectedDate.getDay();
    const saturdayOffset = dayOfWeek === 6 ? 0 : -(dayOfWeek + 1);
    const saturday = new Date(selectedDate);
    saturday.setDate(selectedDate.getDate() + saturdayOffset);

    const days: Array<{ jalaliKey: string; label: string; dayNum: number; isToday: boolean; isSelected: boolean; classes: ScheduleItem[] }> = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(saturday);
      d.setDate(saturday.getDate() + i);
      const [jy, jm, jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
      const key = `${jy}-${jm}-${jd}`;
      const dow = d.getDay() === 6 ? 0 : d.getDay() + 1;
      const isT = jd === todayJd && jm === todayJm && jy === todayJy;
      const isS = jd === selectedDay && jm === viewMonth && jy === viewYear;
      days.push({
        jalaliKey: key,
        label: PERSIAN_DAYS[i],
        dayNum: jd,
        isToday: isT,
        isSelected: isS,
        classes: getClassesForDay(key, dow),
      });
    }
    return days;
  }, [selectedDay, viewYear, viewMonth, getClassesForDay, todayJd, todayJm, todayJy]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={cn("flex items-center justify-between gap-3", isRTL && "flex-row-reverse")}>
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <Button variant="outline" size="icon" onClick={prevMonth} className="h-9 w-9 rounded-xl border-border/50">
            {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth} className="h-9 w-9 rounded-xl border-border/50">
            {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>

        <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
          <h3 className="text-lg font-bold text-foreground">
            {PERSIAN_MONTHS[viewMonth - 1]} {toPersianNum(viewYear)}
          </h3>
          {!isCurrentMonth && (
            <Button variant="ghost" size="sm" onClick={goToToday} className="text-xs text-primary rounded-lg h-7 px-2">
              {isRTL ? "امروز" : "Today"}
            </Button>
          )}
        </div>

        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <div className={cn("flex rounded-xl border border-border/50 overflow-hidden", isRTL && "flex-row-reverse")}>
            <button
              onClick={() => setCalendarView("month")}
              className={cn("px-3 py-1.5 text-xs font-medium transition-colors", calendarView === "month" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {isRTL ? "ماه" : "Month"}
            </button>
            <button
              onClick={() => { setCalendarView("week"); if (!selectedDay) setSelectedDay(todayJd); }}
              className={cn("px-3 py-1.5 text-xs font-medium transition-colors", calendarView === "week" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {isRTL ? "هفته" : "Week"}
            </button>
          </div>
          <Button variant="outline" size="icon" onClick={onCreateRequest} className="h-9 w-9 rounded-xl border-sky-500/30 hover:border-sky-500/60 hover:bg-sky-500/5 text-sky-600 dark:text-sky-400">
            <FileText className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className={cn("flex flex-wrap items-center gap-3 px-1", isRTL && "flex-row-reverse")}>
        {Object.entries(CLASS_TYPE_COLORS).map(([type, config]) => (
          <div key={type} className={cn("flex items-center gap-1.5 text-[11px]", isRTL && "flex-row-reverse")}>
            <div className={cn("w-2.5 h-2.5 rounded-full", config.dot)} />
            <span className="text-muted-foreground">{isRTL ? config.labelFa : config.labelEn}</span>
          </div>
        ))}
      </div>

      {/* Month View */}
      {calendarView === "month" && (
        <Card className="border-border/30 overflow-hidden">
          <CardContent className="p-3 sm:p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {(isRTL ? [...PERSIAN_DAYS_SHORT].reverse() : PERSIAN_DAYS_SHORT).map((dayName, i) => (
                <div key={i} className="text-center">
                  <span className={cn(
                    "text-[11px] font-medium py-1 block",
                    i === 6 || (isRTL && i === 0) ? "text-rose-500" : "text-muted-foreground"
                  )}>
                    {dayName}
                  </span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell) => {
                if (cell.day === null) return <div key={cell.key} className="aspect-square" />;
                const dow = getDayOfWeekForJalali(viewYear, viewMonth, cell.day);
                const dayClasses = getClassesForDay(cell.key, dow);
                const isToday = isCurrentMonth && cell.day === todayJd;
                const isSelected = selectedDay === cell.day;
                const isFriday = dow === 6;
                const typeSet = new Set(dayClasses.map((c) => c.course.classType));

                return (
                  <motion.button
                    key={cell.key}
                    onClick={() => setSelectedDay(cell.day)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all duration-200",
                      "hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/30",
                      isSelected && "bg-primary/10 ring-2 ring-primary/30",
                      isToday && !isSelected && "bg-primary/5",
                      isFriday && !isSelected && "text-rose-500",
                    )}
                  >
                    <span className={cn(
                      "text-sm font-semibold leading-none",
                      isToday ? "text-primary" : isFriday ? "text-rose-500" : "text-foreground",
                      isSelected && "text-primary",
                    )}>
                      {toPersianNum(cell.day)}
                    </span>
                    {isToday && <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />}
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {Array.from(typeSet).slice(0, 3).map((type) => (
                        <div key={type} className={cn("w-1.5 h-1.5 rounded-full", CLASS_TYPE_COLORS[type]?.dot || "bg-gray-400")} />
                      ))}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Week View — 7 days including Friday */}
      {calendarView === "week" && (
        <Card className="border-border/30 overflow-hidden">
          <CardContent className="p-3 sm:p-4">
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {weekData.map((day) => (
                <div key={day.jalaliKey} className={cn(
                  "rounded-2xl border p-1.5 sm:p-2 cursor-pointer transition-all min-h-[100px] sm:min-h-[120px]",
                  day.isSelected ? "border-primary/40 bg-primary/5 ring-2 ring-primary/20" :
                  day.isToday ? "border-primary/20 bg-primary/[0.02]" :
                  "border-border/30 hover:border-border/50"
                )} onClick={() => setSelectedDay(day.dayNum)}>
                  <div className={cn("text-center mb-1.5 sm:mb-2", isRTL && "text-right")}>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground">{day.label}</p>
                    <p className={cn("text-sm sm:text-lg font-bold", day.isToday ? "text-primary" : "text-foreground")}>{toPersianNum(day.dayNum)}</p>
                  </div>
                  <div className="space-y-1">
                    {day.classes.slice(0, 2).map((cls) => {
                      const config = CLASS_TYPE_COLORS[cls.course.classType] || CLASS_TYPE_COLORS.group;
                      return (
                        <div key={cls.id} className={cn("p-1 sm:p-1.5 rounded-lg text-[8px] sm:text-[9px] border", config.bg, config.border)}>
                          <p className="font-medium truncate" dir="rtl">{isRTL ? cls.course.titleFa : cls.course.titleEn}</p>
                          <p className={cn("font-bold", config.text)}>{toPersianNum(cls.startTime)}</p>
                        </div>
                      );
                    })}
                    {day.classes.length > 2 && (
                      <p className="text-[8px] sm:text-[9px] text-muted-foreground text-center">+{toPersianNum(day.classes.length - 2)}</p>
                    )}
                    {day.classes.length === 0 && (
                      <p className="text-[8px] sm:text-[9px] text-muted-foreground/40 text-center py-2">-</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Day Timeline */}
      <AnimatePresence mode="wait">
        {selectedDay && (
          <motion.div
            key={selectedKey}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-primary/15 bg-gradient-to-br from-primary/[0.03] to-transparent overflow-hidden">
              <CardContent className="p-5">
                <div className={cn("flex items-center justify-between mb-4", isRTL && "flex-row-reverse")}>
                  <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                    <CalendarDays className="w-5 h-5 text-primary" />
                    <h4 className="text-base font-bold text-foreground">
                      {toPersianNum(selectedDay)} {PERSIAN_MONTHS[viewMonth - 1]} {toPersianNum(viewYear)}
                    </h4>
                    {isCurrentMonth && selectedDay === todayJd && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                        {isRTL ? "امروز" : "Today"}
                      </Badge>
                    )}
                  </div>
                </div>

                {selectedClasses.length === 0 ? (
                  <EmptyState icon={CalendarDays} title={isRTL ? "کلاسی در این روز نیست" : "No classes on this day"} isRTL={isRTL} />
                ) : (
                  <div className="space-y-3">
                    {selectedClasses.map((cls, i) => {
                      const config = CLASS_TYPE_COLORS[cls.course.classType] || CLASS_TYPE_COLORS.group;
                      return (
                        <motion.div
                          key={cls.id}
                          initial={{ opacity: 0, x: isRTL ? -10 : 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={cn("flex items-stretch gap-3 p-4 rounded-2xl border cursor-pointer", config.bg, config.border)}
                          onClick={() => setSelectedClass(cls)}
                        >
                          <div className={cn("shrink-0 flex flex-col items-center justify-center min-w-[60px]", isRTL && "text-left")}>
                            <p className="text-base font-bold text-foreground">{toPersianNum(cls.startTime)}</p>
                            <div className="w-px h-2 bg-border/50 my-0.5" />
                            <p className="text-xs text-muted-foreground">{toPersianNum(cls.endTime)}</p>
                          </div>

                          <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse justify-end")}>
                              <span className="text-sm font-semibold text-foreground truncate">
                                {isRTL ? cls.course.titleFa : cls.course.titleEn}
                              </span>
                              <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 border shrink-0", config.bg, config.text, config.border)}>
                                {isRTL ? config.labelFa : config.labelEn}
                              </Badge>
                            </div>
                            <div className={cn("flex items-center gap-3 mt-1.5", isRTL && "flex-row-reverse justify-end")}>
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {toPersianNum(cls.studentCount)} {isRTL ? "نفر" : "students"}
                              </span>
                              {cls.room && (
                                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {cls.room}
                                </span>
                              )}
                              {cls.branch && (
                                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {isRTL ? cls.branch.nameFa : cls.branch.nameEn}
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Class Detail Dialog */}
      <Dialog open={!!selectedClass} onOpenChange={() => setSelectedClass(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="sr-only">
              {selectedClass ? (isRTL ? selectedClass.course.titleFa : selectedClass.course.titleEn) : ""}
            </DialogTitle>
            <DialogDescription className="sr-only">مشاهده جزئیات کلاس</DialogDescription>
          </DialogHeader>
          {selectedClass && (
            <div className="space-y-4 pt-2">
              <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", CLASS_TYPE_COLORS[selectedClass.course.classType]?.bg)}>
                  <BookOpen className={cn("w-5 h-5", CLASS_TYPE_COLORS[selectedClass.course.classType]?.text)} />
                </div>
                <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                  <h3 className="text-lg font-bold text-foreground">
                    {isRTL ? selectedClass.course.titleFa : selectedClass.course.titleEn}
                  </h3>
                  <div className={cn("flex items-center gap-2 mt-1", isRTL && "flex-row-reverse justify-end")}>
                    <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5 border", CLASS_TYPE_COLORS[selectedClass.course.classType]?.bg, CLASS_TYPE_COLORS[selectedClass.course.classType]?.text, CLASS_TYPE_COLORS[selectedClass.course.classType]?.border)}>
                      {isRTL ? CLASS_TYPE_COLORS[selectedClass.course.classType]?.labelFa : CLASS_TYPE_COLORS[selectedClass.course.classType]?.labelEn}
                    </Badge>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div className={cn("p-3 rounded-xl bg-muted/30", isRTL && "text-right")}>
                  <p className="text-[10px] text-muted-foreground">{isRTL ? "روز" : "Day"}</p>
                  <p className="text-sm font-semibold text-foreground">{isRTL ? selectedClass.dayNameFa : selectedClass.dayNameEn}</p>
                </div>
                <div className={cn("p-3 rounded-xl bg-muted/30", isRTL && "text-right")}>
                  <p className="text-[10px] text-muted-foreground">{isRTL ? "ساعت" : "Time"}</p>
                  <p className="text-sm font-semibold text-foreground">{toPersianNum(selectedClass.startTime)} - {toPersianNum(selectedClass.endTime)}</p>
                </div>
                <div className={cn("p-3 rounded-xl bg-muted/30", isRTL && "text-right")}>
                  <p className="text-[10px] text-muted-foreground">{isRTL ? "اتاق" : "Room"}</p>
                  <p className="text-sm font-semibold text-foreground">{selectedClass.room || (isRTL ? "نامشخص" : "N/A")}</p>
                </div>
                <div className={cn("p-3 rounded-xl bg-muted/30", isRTL && "text-right")}>
                  <p className="text-[10px] text-muted-foreground">{isRTL ? "تعداد هنرجو" : "Students"}</p>
                  <p className="text-sm font-semibold text-foreground">{toPersianNum(selectedClass.studentCount)} {isRTL ? "نفر" : ""}</p>
                </div>
                {selectedClass.branch && (
                  <div className={cn("p-3 rounded-xl bg-muted/30 col-span-2", isRTL && "text-right")}>
                    <p className="text-[10px] text-muted-foreground">{isRTL ? "شعبه" : "Branch"}</p>
                    <p className="text-sm font-semibold text-foreground">{isRTL ? selectedClass.branch.nameFa : selectedClass.branch.nameEn}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// TAB 3: Classes
// ============================================
function ClassesTab({
  schedules,
  exercises,
  isRTL,
  onCreateExercise,
}: {
  schedules: ScheduleItem[];
  exercises: ExerciseItem[];
  isRTL: boolean;
  onCreateExercise: (courseId: string) => void;
}) {
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  const coursesMap = useMemo(() => {
    const map: Record<string, { course: ScheduleItem["course"]; schedules: ScheduleItem[]; studentCount: number }> = {};
    schedules.forEach((s) => {
      if (!map[s.courseId]) {
        map[s.courseId] = { course: s.course, schedules: [], studentCount: s.studentCount };
      }
      map[s.courseId].schedules.push(s);
    });
    return Object.values(map);
  }, [schedules]);

  return (
    <div className="space-y-3">
      {coursesMap.length === 0 ? (
        <EmptyState icon={BookOpen} title={isRTL ? "کلاسی یافت نشد" : "No classes found"} isRTL={isRTL} />
      ) : (
        coursesMap.map(({ course, schedules: courseSchedules, studentCount }, i) => {
          const config = CLASS_TYPE_COLORS[course.classType] || CLASS_TYPE_COLORS.group;
          const isExpanded = expandedCourse === course.id;
          const courseExercises = exercises.filter((e) => e.courseId === course.id);

          return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card className={cn(
                "border-border/30 hover:border-primary/20 transition-all overflow-hidden",
                isExpanded && "border-primary/30 ring-1 ring-primary/10"
              )}>
                <div className={cn("h-1", course.classType === "private" ? "bg-gradient-to-r from-purple-500 to-purple-400" : "bg-gradient-to-r from-rose-500 to-rose-400")} />
                <CardContent className="p-4">
                  <button
                    onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                    className="w-full text-right"
                    dir={isRTL ? "rtl" : "ltr"}
                  >
                    <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", config.bg)}>
                        {course.classType === "private" ? <User className={cn("w-5 h-5", config.text)} /> : <Users className={cn("w-5 h-5", config.text)} />}
                      </div>
                      <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse justify-end")}>
                          <h4 className="text-sm font-bold text-foreground truncate">
                            {isRTL ? course.titleFa : course.titleEn}
                          </h4>
                          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", config.bg, config.text, config.border)}>
                            {isRTL ? config.labelFa : config.labelEn}
                          </Badge>
                        </div>
                        <div className={cn("flex items-center gap-3 mt-1.5", isRTL && "flex-row-reverse justify-end")}>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {toPersianNum(studentCount)} {isRTL ? "نفر" : "students"}
                          </span>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {courseSchedules.map((s) => `${s.dayNameFa} ${s.startTime}`).join("، ")}
                          </span>
                          {course.instrument && (
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Music className="w-3 h-3" />
                              {course.instrument}
                            </span>
                          )}
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Separator className="my-3" />

                        <div className={cn("flex items-center gap-2 mb-3", isRTL && "flex-row-reverse")}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onCreateExercise(course.id)}
                            className="rounded-xl text-xs gap-1.5 h-9 border-primary/30 hover:border-primary/60 hover:bg-primary/5 text-primary"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            {isRTL ? "تمرین جدید" : "New Exercise"}
                          </Button>
                        </div>

                        {/* Schedule details */}
                        <div className="space-y-2 mb-3">
                          {courseSchedules.map((s) => (
                            <div key={s.id} className={cn("flex items-center gap-3 p-3 rounded-xl bg-muted/30", isRTL && "flex-row-reverse")}>
                              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <CalendarDays className="w-4 h-4 text-primary" />
                              </div>
                              <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                                <span className="text-xs font-semibold text-foreground">{s.dayNameFa}</span>
                                <p className="text-[10px] text-muted-foreground">
                                  {toPersianNum(s.startTime)} - {toPersianNum(s.endTime)}
                                  {s.room && ` • ${s.room}`}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Exercises for this course */}
                        {courseExercises.length > 0 && (
                          <div>
                            <p className={cn("text-xs font-semibold text-muted-foreground mb-2", isRTL && "text-right")}>
                              {isRTL ? "تمرین‌ها" : "Exercises"}
                            </p>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                              {courseExercises.map((ex) => (
                                <div key={ex.id} className={cn("flex items-center gap-2 p-2 rounded-lg bg-muted/20", isRTL && "flex-row-reverse")}>
                                  <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                  <span className="text-xs text-foreground truncate flex-1">{isRTL ? ex.titleFa : ex.titleEn}</span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {toPersianNum(ex.submissionStats?.graded || 0)}/{toPersianNum(ex.submissionStats?.total || 0)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          );
        })
      )}
    </div>
  );
}

// ============================================
// TAB 4: Requests (درخواست‌ها)
// ============================================
function RequestsTab({
  requests,
  schedules,
  requestStats,
  isRTL,
  onCreateRequest,
}: {
  requests: ScheduleRequestItem[];
  schedules: ScheduleItem[];
  requestStats: { pending: number; approved: number; rejected: number };
  isRTL: boolean;
  onCreateRequest: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
        <h3 className="text-base font-bold text-foreground">
          {isRTL ? "درخواست‌ها" : "Requests"}
        </h3>
        <Button
          onClick={onCreateRequest}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2"
        >
          <Plus className="w-4 h-4" />
          {isRTL ? "درخواست جدید" : "New Request"}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-2xl bg-amber-500/5 border border-amber-500/10">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{toPersianNum(requestStats.pending)}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{isRTL ? "در انتظار" : "Pending"}</p>
        </div>
        <div className="text-center p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{toPersianNum(requestStats.approved)}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{isRTL ? "تأیید شده" : "Approved"}</p>
        </div>
        <div className="text-center p-3 rounded-2xl bg-red-500/5 border border-red-500/10">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{toPersianNum(requestStats.rejected)}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{isRTL ? "رد شده" : "Rejected"}</p>
        </div>
      </div>

      <div className="space-y-3">
        {requests.length === 0 ? (
          <EmptyState icon={FileText} title={isRTL ? "درخواستی یافت نشد" : "No requests found"} isRTL={isRTL} />
        ) : (
          requests.map((req, i) => {
            const typeConfig = REQUEST_TYPE_CONFIG[req.requestType] || REQUEST_TYPE_CONFIG.time_change;
            const statusConfig = REQUEST_STATUS_CONFIG[req.status] || REQUEST_STATUS_CONFIG.pending;
            const TypeIcon = typeConfig.icon;

            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className="border-border/30 overflow-hidden">
                  <CardContent className="p-4">
                    <div className={cn("flex items-start gap-3", isRTL && "flex-row-reverse")}>
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", typeConfig.className.split(" ").slice(0, 2).join(" "))}>
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                        <div className={cn("flex items-center gap-2 flex-wrap", isRTL && "flex-row-reverse justify-end")}>
                          <h4 className="text-sm font-bold text-foreground">{isRTL ? req.course.titleFa : req.course.titleEn}</h4>
                          <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 border", typeConfig.className)}>
                            {isRTL ? typeConfig.labelFa : typeConfig.labelEn}
                          </Badge>
                          <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 border", statusConfig.className)}>
                            {isRTL ? statusConfig.labelFa : statusConfig.labelEn}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{req.reason}</p>
                        <div className={cn("flex items-center gap-3 mt-2", isRTL && "flex-row-reverse justify-end")}>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <CalendarDays className="w-2.5 h-2.5" />
                            {DAY_NAMES_FA[req.schedule.dayOfWeek]} {toPersianNum(req.schedule.startTime)}
                          </span>
                          {req.schedule.room && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5" />{req.schedule.room}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {req.createdAt ? formatJalaaliDate(req.createdAt.split("T")[0], isRTL, "long") : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ============================================
// TAB 5: Exercises
// ============================================
function ExercisesTab({
  exercises,
  isRTL,
  onCreateExercise,
  onPublishSuccess,
}: {
  exercises: ExerciseItem[];
  isRTL: boolean;
  onCreateExercise: () => void;
  onPublishSuccess?: () => void;
}) {
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  const difficultyConfig: Record<string, { labelFa: string; labelEn: string; className: string }> = {
    beginner: { labelFa: "مبتدی", labelEn: "Beginner", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    intermediate: { labelFa: "متوسط", labelEn: "Intermediate", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    advanced: { labelFa: "پیشرفته", labelEn: "Advanced", className: "bg-red-500/10 text-red-600 dark:text-red-400" },
    easy: { labelFa: "آسان", labelEn: "Easy", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    medium: { labelFa: "متوسط", labelEn: "Medium", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    hard: { labelFa: "سخت", labelEn: "Hard", className: "bg-red-500/10 text-red-600 dark:text-red-400" },
  };

  const exerciseTypeConfig: Record<string, { labelFa: string; labelEn: string }> = {
    practice: { labelFa: "تمرین", labelEn: "Practice" },
    theory: { labelFa: "تئوری", labelEn: "Theory" },
    performance: { labelFa: "اجرایی", labelEn: "Performance" },
    composition: { labelFa: "آهنگسازی", labelEn: "Composition" },
  };

  return (
    <div className="space-y-4">
      <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
        <h3 className="text-base font-bold text-foreground">
          {isRTL ? "تمرین‌ها" : "Exercises"}
        </h3>
        <Button
          onClick={onCreateExercise}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2"
        >
          <Plus className="w-4 h-4" />
          {isRTL ? "تمرین جدید" : "New Exercise"}
        </Button>
      </div>

      <div className="space-y-3">
        {exercises.length === 0 ? (
          <EmptyState icon={FileText} title={isRTL ? "تمرینی یافت نشد" : "No exercises found"} isRTL={isRTL} />
        ) : (
          exercises.map((ex, i) => {
            const isExpanded = expandedExercise === ex.id;
            const diff = difficultyConfig[ex.difficulty] || difficultyConfig.medium;
            const pendingCount = ex.submissionStats?.submitted || 0;
            const gradedCount = ex.submissionStats?.graded || 0;
            const totalCount = ex.submissionStats?.total || 0;
            const exType = exerciseTypeConfig[ex.type] || { labelFa: ex.type, labelEn: ex.type };

            return (
              <motion.div
                key={ex.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className={cn("border-border/30 hover:border-primary/20 transition-all overflow-hidden", isExpanded && "border-primary/30")}>
                  <CardContent className="p-4">
                    <button
                      onClick={() => setExpandedExercise(isExpanded ? null : ex.id)}
                      className="w-full text-right"
                      dir={isRTL ? "rtl" : "ltr"}
                    >
                      <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-primary/10">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                          <div className={cn("flex items-center gap-2 flex-wrap", isRTL && "flex-row-reverse justify-end")}>
                            <h4 className="text-sm font-bold text-foreground truncate">{isRTL ? ex.titleFa : ex.titleEn}</h4>
                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md font-medium", diff.className)}>{isRTL ? diff.labelFa : diff.labelEn}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium bg-muted text-muted-foreground">{isRTL ? exType.labelFa : exType.labelEn}</span>
                          </div>
                          <div className={cn("flex items-center gap-3 mt-1", isRTL && "flex-row-reverse justify-end")}>
                            <span className="text-[11px] text-muted-foreground">{isRTL ? ex.course.titleFa : ex.course.titleEn}</span>
                            <span className="text-[11px] text-muted-foreground">{toPersianNum(gradedCount)}/{toPersianNum(totalCount)} {isRTL ? "تصحیح‌شده" : "graded"}</span>
                            {pendingCount > 0 && (
                              <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-[10px] px-1.5">
                                {toPersianNum(pendingCount)} {isRTL ? "نیاز به تصحیح" : "pending"}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Separator className="my-3" />
                          {ex.descriptionFa && (
                            <p className={cn("text-xs text-muted-foreground mb-3", isRTL && "text-right")}>{ex.descriptionFa}</p>
                          )}
                          {ex.dueDate && (
                            <p className={cn("text-xs text-muted-foreground mb-3 flex items-center gap-1", isRTL && "flex-row-reverse")}>
                              <Clock className="w-3 h-3" />
                              {isRTL ? "مهلت: " : "Due: "}{formatJalaaliDate(ex.dueDate.split("T")[0], isRTL, "long")}
                            </p>
                          )}
                          {!ex.isPublished && (
                            <div className={cn("flex items-center gap-2 mb-3", isRTL && "flex-row-reverse")}>
                              <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px]">
                                {isRTL ? "پیش‌نویس" : "Draft"}
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const res = await authFetch(`/api/instructor/exercises/${ex.id}`, {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ isPublished: true }),
                                    });
                                    if (res.ok) {
                                      toast.success(isRTL ? "تمرین منتشر شد و برای هنرجویان قابل مشاهده است" : "Exercise published to students");
                                      onPublishSuccess?.();
                                    } else {
                                      const err = await res.json().catch(() => ({}));
                                      toast.error(err.error || (isRTL ? "خطا در انتشار" : "Failed to publish"));
                                    }
                                  } catch {
                                    toast.error(isRTL ? "خطا در انتشار" : "Failed to publish");
                                  }
                                }}
                                className="h-7 text-xs gap-1 border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                              >
                                <Send className="w-3 h-3" />
                                {isRTL ? "انتشار به هنرجویان" : "Publish to students"}
                              </Button>
                            </div>
                          )}
                          {totalCount === 0 ? (
                            <EmptyState icon={FileText} title={isRTL ? "هنوز ارسالی نداشته" : "No submissions yet"} isRTL={isRTL} />
                          ) : (
                            <div className="space-y-2">
                              <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                                <div className="text-center flex-1 p-2 rounded-xl bg-muted/30">
                                  <p className="text-sm font-bold text-foreground">{toPersianNum(totalCount)}</p>
                                  <p className="text-[10px] text-muted-foreground">{isRTL ? "کل" : "Total"}</p>
                                </div>
                                <div className="text-center flex-1 p-2 rounded-xl bg-emerald-500/5">
                                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{toPersianNum(gradedCount)}</p>
                                  <p className="text-[10px] text-muted-foreground">{isRTL ? "تصحیح‌شده" : "Graded"}</p>
                                </div>
                                <div className="text-center flex-1 p-2 rounded-xl bg-amber-500/5">
                                  <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{toPersianNum(pendingCount)}</p>
                                  <p className="text-[10px] text-muted-foreground">{isRTL ? "در انتظار" : "Pending"}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ============================================
// TAB 6: Submissions (تصحیح تمرین‌ها)
// ============================================
function SubmissionsTab({
  submissions,
  submissionStats,
  isRTL,
  onGrade,
}: {
  submissions: SubmissionItem[];
  submissionStats: { pending: number; graded: number };
  isRTL: boolean;
  onGrade: (submission: SubmissionItem) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredSubmissions = useMemo(() => {
    if (statusFilter === "all") return submissions;
    return submissions.filter((s) => s.status === statusFilter);
  }, [submissions, statusFilter]);

  return (
    <div className="space-y-4">
      <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
        <h3 className="text-base font-bold text-foreground">
          {isRTL ? "تصحیح تمرین‌ها" : "Grade Submissions"}
        </h3>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-3 rounded-2xl bg-amber-500/5 border border-amber-500/10">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{toPersianNum(submissionStats.pending)}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{isRTL ? "منتظر تصحیح" : "Pending Review"}</p>
        </div>
        <div className="text-center p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{toPersianNum(submissionStats.graded)}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{isRTL ? "تصحیح‌شده" : "Graded"}</p>
        </div>
      </div>

      {/* Filter */}
      <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
        {[
          { value: "all", labelFa: "همه", labelEn: "All" },
          { value: "assigned", labelFa: "محول‌شده", labelEn: "Assigned" },
          { value: "submitted", labelFa: "ارسال‌شده", labelEn: "Submitted" },
          { value: "graded", labelFa: "تصحیح‌شده", labelEn: "Graded" },
          { value: "late", labelFa: "دیرتر", labelEn: "Late" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              statusFilter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:text-foreground"
            )}
          >
            {isRTL ? f.labelFa : f.labelEn}
          </button>
        ))}
      </div>

      {/* Submissions List */}
      <div className="space-y-3">
        {filteredSubmissions.length === 0 ? (
          <EmptyState icon={ClipboardList} title={isRTL ? "ارسالی یافت نشد" : "No submissions found"} isRTL={isRTL} />
        ) : (
          filteredSubmissions.map((sub, i) => {
            const statusConfig = SUBMISSION_STATUS_CONFIG[sub.status] || SUBMISSION_STATUS_CONFIG.assigned;
            const StatusIcon = statusConfig.icon;

            return (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-border/30 overflow-hidden">
                  <CardContent className="p-4">
                    <div className={cn("flex items-start gap-3", isRTL && "flex-row-reverse")}>
                      <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                        <div className={cn("flex items-center gap-2 flex-wrap", isRTL && "flex-row-reverse justify-end")}>
                          <h4 className="text-sm font-bold text-foreground">{sub.student.name}</h4>
                          <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 border", statusConfig.className)}>
                            <StatusIcon className="w-2.5 h-2.5 ml-0.5" />
                            {isRTL ? statusConfig.labelFa : statusConfig.labelEn}
                          </Badge>
                          {sub.grade !== null && (
                            <Badge className={cn("text-[9px] px-1.5 border", gradeColor(sub.grade / 5))}>
                              {toPersianNum(sub.grade / 5)} / {toPersianNum(20)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {isRTL ? sub.exercise.titleFa : sub.exercise.titleEn}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {isRTL ? sub.exercise.course.titleFa : sub.exercise.course.titleEn}
                        </p>
                        <div className={cn("flex items-center gap-3 mt-1.5", isRTL && "flex-row-reverse justify-end")}>
                          {sub.submittedAt && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {formatJalaaliDate(sub.submittedAt.split("T")[0], isRTL, "long")}
                            </span>
                          )}
                          {sub.feedback && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <MessageSquare className="w-2.5 h-2.5" />
                              {isRTL ? "بازخورد دارد" : "Has feedback"}
                            </span>
                          )}
                        </div>
                      </div>
                      {(sub.status === "submitted" || sub.status === "late" || sub.status === "graded") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onGrade(sub)}
                          className="rounded-xl text-xs gap-1.5 h-8 border-primary/30 hover:border-primary/60 hover:bg-primary/5 text-primary shrink-0"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          {sub.status === "graded"
                            ? (isRTL ? "ویرایش نمره" : "Edit grade")
                            : (isRTL ? "تصحیح" : "Grade")}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ============================================
// TAB 7: Announcements (اطلاعیه‌ها)
// ============================================
function AnnouncementsTab({
  announcements,
  isRTL,
}: {
  announcements: AnnouncementItem[];
  isRTL: boolean;
}) {
  return (
    <div className="space-y-4">
      <h3 className={cn("text-base font-bold text-foreground", isRTL && "text-right")}>
        {isRTL ? "اطلاعیه‌ها" : "Announcements"}
      </h3>

      <div className="space-y-3">
        {announcements.length === 0 ? (
          <EmptyState icon={Megaphone} title={isRTL ? "اطلاعیه‌ای یافت نشد" : "No announcements found"} isRTL={isRTL} />
        ) : (
          announcements.map((ann, i) => {
            const typeConfig = ANNOUNCEMENT_TYPE_CONFIG[ann.type] || ANNOUNCEMENT_TYPE_CONFIG.info;
            const TypeIcon = typeConfig.icon;
            const isExpired = ann.expiresAt && new Date(ann.expiresAt) < new Date();

            return (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className={cn("border-border/30 overflow-hidden", isExpired && "opacity-60")}>
                  <CardContent className="p-4">
                    <div className={cn("flex items-start gap-3", isRTL && "flex-row-reverse")}>
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", typeConfig.className.split(" ").slice(0, 2).join(" "))}>
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                        <div className={cn("flex items-center gap-2 flex-wrap", isRTL && "flex-row-reverse justify-end")}>
                          <h4 className="text-sm font-bold text-foreground">{isRTL ? ann.titleFa : (ann.titleEn || ann.titleFa)}</h4>
                          <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 border", typeConfig.className)}>
                            {isRTL ? typeConfig.labelFa : typeConfig.labelEn}
                          </Badge>
                          {ann.isPinned && (
                            <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] px-1.5">
                              <Star className="w-2.5 h-2.5 ml-0.5" />
                              {isRTL ? "سنجاق‌شده" : "Pinned"}
                            </Badge>
                          )}
                          {isExpired && (
                            <Badge className="bg-muted text-muted-foreground text-[9px] px-1.5">
                              {isRTL ? "منقضی" : "Expired"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-3">
                          {isRTL ? ann.contentFa : (ann.contentEn || ann.contentFa)}
                        </p>
                        <div className={cn("flex items-center gap-3 mt-2", isRTL && "flex-row-reverse justify-end")}>
                          {ann.startsAt && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <CalendarDays className="w-2.5 h-2.5" />
                              {formatJalaaliDate(ann.startsAt.split("T")[0], isRTL, "long")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ============================================
// TAB 8: Makeup Class (جلسه جبرانی)
// ============================================
function MakeupClassTab({
  schedules,
  isRTL,
  onRequestMakeup,
  submitting,
}: {
  schedules: ScheduleItem[];
  isRTL: boolean;
  onRequestMakeup: (data: { courseId: string; scheduleId: string; proposedDayOfWeek: string; proposedStartTime: string; proposedEndTime: string; proposedDate: string; proposedRoom: string; reason: string }) => void;
  submitting: boolean;
}) {
  const [form, setForm] = useState({
    scheduleId: "",
    courseId: "",
    proposedDayOfWeek: "",
    proposedStartTime: "",
    proposedEndTime: "",
    proposedDate: "",
    proposedRoom: "",
    reason: "",
  });

  const selectedSchedule = schedules.find((s) => s.id === form.scheduleId);

  const handleSubmit = () => {
    if (!form.scheduleId || !form.reason) {
      toast.error(isRTL ? "لطفاً فیلدهای الزامی را پر کنید" : "Please fill required fields");
      return;
    }
    if (!form.proposedDate && !form.proposedDayOfWeek && !form.proposedStartTime) {
      toast.error(isRTL ? "لطفاً زمان پیشنهادی را مشخص کنید" : "Please provide proposed date/time");
      return;
    }
    onRequestMakeup(form);
  };

  return (
    <div className="space-y-4">
      <h3 className={cn("text-base font-bold text-foreground", isRTL && "text-right")}>
        {isRTL ? "درخواست جلسه جبرانی" : "Makeup Class Request"}
      </h3>

      <Card className="border-border/30">
        <CardContent className="p-4 space-y-4">
          <p className={cn("text-xs text-muted-foreground", isRTL && "text-right")}>
            {isRTL
              ? "درخواست جلسه جبرانی پس از تأیید مدیر به برنامه اضافه خواهد شد."
              : "Makeup class requests will be added to the schedule after admin approval."}
          </p>

          {/* Select original class */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{isRTL ? "کلاس اصلی" : "Original Class"} *</Label>
            <Select value={form.scheduleId} onValueChange={(v) => {
              const sched = schedules.find((s) => s.id === v);
              setForm((p) => ({ ...p, scheduleId: v, courseId: sched?.courseId || "" }));
            }}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder={isRTL ? "انتخاب برنامه..." : "Select schedule..."} /></SelectTrigger>
              <SelectContent>
                {schedules.filter((s) => s.status === "active").map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {isRTL ? s.course.titleFa : s.course.titleEn} - {s.dayNameFa} {s.startTime}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedSchedule && (
            <div className={cn("p-3 rounded-xl bg-muted/30 text-[11px] text-muted-foreground", isRTL && "text-right")}>
              {isRTL ? "برنامه فعلی: " : "Current: "}{selectedSchedule.dayNameFa}، {toPersianNum(selectedSchedule.startTime)} - {toPersianNum(selectedSchedule.endTime)}
              {selectedSchedule.room && ` • ${selectedSchedule.room}`}
            </div>
          )}

          <Separator />

          {/* Proposed new time */}
          <p className={cn("text-xs font-semibold text-muted-foreground", isRTL && "text-right")}>
            {isRTL ? "زمان پیشنهادی جلسه جبرانی" : "Proposed Makeup Time"}
          </p>

          <div className="space-y-2">
            <Label className="text-sm font-medium">{isRTL ? "تاریخ پیشنهادی" : "Proposed Date"}</Label>
            <Input
              type="date"
              value={form.proposedDate}
              onChange={(e) => setForm((p) => ({ ...p, proposedDate: e.target.value }))}
              className="rounded-xl" dir="ltr"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? "ساعت شروع" : "Start Time"}</Label>
              <Input
                type="time"
                value={form.proposedStartTime}
                onChange={(e) => setForm((p) => ({ ...p, proposedStartTime: e.target.value }))}
                className="rounded-xl" dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? "ساعت پایان" : "End Time"}</Label>
              <Input
                type="time"
                value={form.proposedEndTime}
                onChange={(e) => setForm((p) => ({ ...p, proposedEndTime: e.target.value }))}
                className="rounded-xl" dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">{isRTL ? "اتاق" : "Room"}</Label>
            <Input
              value={form.proposedRoom}
              onChange={(e) => setForm((p) => ({ ...p, proposedRoom: e.target.value }))}
              className="rounded-xl"
              placeholder={isRTL ? "نام اتاق (اختیاری)" : "Room name (optional)"}
              dir={isRTL ? "rtl" : "ltr"}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">{isRTL ? "دلیل لغو/جبرانی" : "Reason"} *</Label>
            <Textarea
              value={form.reason}
              onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
              className="rounded-xl resize-none" rows={3}
              placeholder={isRTL ? "دلیل درخواست جبرانی..." : "Reason for makeup class..."}
              dir={isRTL ? "rtl" : "ltr"}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting || !form.scheduleId || !form.reason}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarPlus className="w-4 h-4" />}
            {isRTL ? "ارسال درخواست جبرانی" : "Submit Makeup Request"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// Main Instructor Panel
// ============================================
export default function InstructorPanel({ routeOwned = false }: { routeOwned?: boolean }) {
  const { isRTL } = useI18n();
  const { user, showInstructorPanel, setShowInstructorPanel, logout } = useAuthStore();
  const panelVisible = routeOwned || showInstructorPanel;
  const [activeTab, setActiveTab] = useState("dashboard");
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [requests, setRequests] = useState<ScheduleRequestItem[]>([]);
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [requestStats, setRequestStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [submissionStats, setSubmissionStats] = useState({ pending: 0, graded: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateRequestDialog, setShowCreateRequestDialog] = useState(false);
  const [showCreateExerciseDialog, setShowCreateExerciseDialog] = useState(false);
  const [showGradingDialog, setShowGradingDialog] = useState(false);
  const [gradingTarget, setGradingTarget] = useState<SubmissionItem | null>(null);
  const [gradeValue, setGradeValue] = useState("");
  const [feedbackValue, setFeedbackValue] = useState("");
  const [newRequest, setNewRequest] = useState({
    scheduleId: "",
    courseId: "",
    requestType: "time_change",
    reason: "",
    proposedStartTime: "",
    proposedEndTime: "",
    proposedRoom: "",
    proposedDayOfWeek: "",
  });
  const [newExercise, setNewExercise] = useState({
    titleFa: "",
    titleEn: "",
    descriptionFa: "",
    type: "practice",
    difficulty: "beginner",
    courseId: "",
    dueDate: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Load data from APIs
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [scheduleRes, requestsRes, exercisesRes, submissionsRes, announcementsRes, dashboardRes] = await Promise.allSettled([
        authFetch("/api/instructor/schedule"),
        authFetch("/api/instructor/schedule-requests"),
        authFetch("/api/instructor/exercises"),
        authFetch("/api/instructor/submissions?status=submitted"),
        authFetch("/api/instructor/announcements"),
        authFetch("/api/instructor/dashboard"),
      ]);

      if (scheduleRes.status === "fulfilled" && scheduleRes.value.ok) {
        const data = await scheduleRes.value.json();
        setSchedules(uniqueById(Array.isArray(data.schedules) ? data.schedules : []));
      }

      if (requestsRes.status === "fulfilled" && requestsRes.value.ok) {
        const data = await requestsRes.value.json();
        setRequests(uniqueById(Array.isArray(data.requests) ? data.requests : []));
        setRequestStats(data.stats || { pending: 0, approved: 0, rejected: 0 });
      }

      if (exercisesRes.status === "fulfilled" && exercisesRes.value.ok) {
        const data = await exercisesRes.value.json();
        setExercises(uniqueById(Array.isArray(data.exercises) ? data.exercises : []));
      }

      if (submissionsRes.status === "fulfilled" && submissionsRes.value.ok) {
        const data = await submissionsRes.value.json();
        setSubmissions(uniqueById(Array.isArray(data.submissions) ? data.submissions : []));
        setSubmissionStats(data.stats || { pending: 0, graded: 0 });
      }

      if (announcementsRes.status === "fulfilled" && announcementsRes.value.ok) {
        const data = await announcementsRes.value.json();
        setAnnouncements(uniqueById(Array.isArray(data.announcements) ? data.announcements : []));
      }

      if (dashboardRes.status === "fulfilled" && dashboardRes.value.ok) {
        const data = await dashboardRes.value.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error("[INSTRUCTOR_LOAD_ERROR]", error);
      toast.error(isRTL ? "خطا در بارگذاری اطلاعات" : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [isRTL]);

  // Also load all submissions (not just submitted ones) for the submissions tab
  const loadAllSubmissions = useCallback(async () => {
    try {
      const res = await authFetch("/api/instructor/submissions");
      if (res.ok) {
        const data = await res.json();
        setSubmissions(uniqueById(Array.isArray(data.submissions) ? data.submissions : []));
        setSubmissionStats(data.stats || { pending: 0, graded: 0 });
      }
    } catch (error) {
      console.error("[INSTRUCTOR_SUBMISSIONS_LOAD]", error);
    }
  }, []);

  useEffect(() => {
    if (!panelVisible) return;
    deferEffect(loadData);
  }, [panelVisible, loadData]);

  // Load all submissions when submissions tab is active
  useEffect(() => {
    if (panelVisible && activeTab === "submissions") {
      deferEffect(loadAllSubmissions);
    }
  }, [panelVisible, activeTab, loadAllSubmissions]);

  // Handlers
  const handleCreateRequest = useCallback(async () => {
    if (!newRequest.scheduleId || !newRequest.courseId || !newRequest.reason) {
      toast.error(isRTL ? "لطفاً فیلدهای الزامی را پر کنید" : "Please fill required fields");
      return;
    }
    setSubmitting(true);
    try {
      const proposedChanges: Record<string, string> = {};
      if (newRequest.requestType === "time_change") {
        if (newRequest.proposedStartTime) proposedChanges.startTime = newRequest.proposedStartTime;
        if (newRequest.proposedEndTime) proposedChanges.endTime = newRequest.proposedEndTime;
        if (newRequest.proposedDayOfWeek) proposedChanges.dayOfWeek = newRequest.proposedDayOfWeek;
      } else if (newRequest.requestType === "room_change") {
        if (newRequest.proposedRoom) proposedChanges.room = newRequest.proposedRoom;
      } else if (newRequest.requestType === "cancellation") {
        proposedChanges.action = "cancel";
      } else if (newRequest.requestType === "reschedule") {
        if (newRequest.proposedDayOfWeek) proposedChanges.dayOfWeek = newRequest.proposedDayOfWeek;
        if (newRequest.proposedStartTime) proposedChanges.startTime = newRequest.proposedStartTime;
      }

      const res = await authFetch("/api/instructor/schedule-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleId: newRequest.scheduleId,
          courseId: newRequest.courseId,
          requestType: newRequest.requestType,
          reason: newRequest.reason,
          proposedChanges,
        }),
      });

      if (res.ok) {
        toast.success(isRTL ? "درخواست با موفقیت ثبت شد" : "Request submitted successfully");
        setShowCreateRequestDialog(false);
        setNewRequest({ scheduleId: "", courseId: "", requestType: "time_change", reason: "", proposedStartTime: "", proposedEndTime: "", proposedRoom: "", proposedDayOfWeek: "" });
        loadData();
      } else {
        const data = await res.json();
        toast.error(data.error || (isRTL ? "خطا در ثبت درخواست" : "Failed to submit request"));
      }
    } catch (error) {
      console.error("[CREATE_REQUEST_ERROR]", error);
      toast.error(isRTL ? "خطا در ثبت درخواست" : "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  }, [newRequest, loadData, isRTL]);

  const handleCreateExercise = useCallback(async () => {
    if (!newExercise.titleFa || !newExercise.titleEn || !newExercise.courseId) {
      toast.error(isRTL ? "لطفاً فیلدهای الزامی را پر کنید" : "Please fill required fields");
      return;
    }
    setSubmitting(true);
    try {
      const res = await authFetch("/api/instructor/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleFa: newExercise.titleFa,
          titleEn: newExercise.titleEn,
          descriptionFa: newExercise.descriptionFa || undefined,
          type: newExercise.type,
          difficulty: newExercise.difficulty,
          courseId: newExercise.courseId,
          dueDate: newExercise.dueDate || undefined,
        }),
      });

      if (res.ok) {
        toast.success(isRTL ? "تمرین با موفقیت ایجاد شد" : "Exercise created successfully");
        setShowCreateExerciseDialog(false);
        setNewExercise({ titleFa: "", titleEn: "", descriptionFa: "", type: "practice", difficulty: "beginner", courseId: "", dueDate: "" });
        loadData();
      } else {
        const data = await res.json();
        toast.error(data.error || (isRTL ? "خطا در ایجاد تمرین" : "Failed to create exercise"));
      }
    } catch (error) {
      console.error("[CREATE_EXERCISE_ERROR]", error);
      toast.error(isRTL ? "خطا در ایجاد تمرین" : "Failed to create exercise");
    } finally {
      setSubmitting(false);
    }
  }, [newExercise, loadData, isRTL]);

  const handleGradeSubmission = useCallback(async () => {
    if (!gradingTarget || !gradeValue) return;
    setSubmitting(true);
    try {
      const res = await authFetch("/api/instructor/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: gradingTarget.id,
          grade: parseFloat(gradeValue) * 5, // Convert 0-20 scale to 0-100
          feedback: feedbackValue || undefined,
        }),
      });

      if (res.ok) {
        toast.success(isRTL ? "نمره با موفقیت ثبت شد" : "Grade submitted successfully");
        setShowGradingDialog(false);
        setGradingTarget(null);
        setGradeValue("");
        setFeedbackValue("");
        // Race-condition fix: previously both loadData() and loadAllSubmissions()
        // were fired without await. If loadData() resolved last, it overwrote
        // submissions with only "submitted" items. Await both sequentially so
        // loadAllSubmissions (which fetches ALL submissions) runs last.
        await loadData();
        await loadAllSubmissions();
      } else {
        const data = await res.json();
        toast.error(data.error || (isRTL ? "خطا در ثبت نمره" : "Failed to submit grade"));
      }
    } catch (error) {
      console.error("[GRADE_SUBMISSION_ERROR]", error);
      toast.error(isRTL ? "خطا در ثبت نمره" : "Failed to submit grade");
    } finally {
      setSubmitting(false);
    }
  }, [gradingTarget, gradeValue, feedbackValue, loadData, loadAllSubmissions, isRTL]);

  const handleMakeupRequest = useCallback(async (data: {
    courseId: string;
    scheduleId: string;
    proposedDayOfWeek: string;
    proposedStartTime: string;
    proposedEndTime: string;
    proposedDate: string;
    proposedRoom: string;
    reason: string;
  }) => {
    setSubmitting(true);
    try {
      const res = await authFetch("/api/instructor/makeup-class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success(isRTL ? "درخواست جلسه جبرانی ثبت شد" : "Makeup class request submitted");
        loadData();
      } else {
        const resp = await res.json();
        toast.error(resp.error || (isRTL ? "خطا در ثبت درخواست" : "Failed to submit request"));
      }
    } catch (error) {
      console.error("[MAKEUP_CLASS_ERROR]", error);
      toast.error(isRTL ? "خطا در ثبت درخواست" : "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  }, [loadData, isRTL]);

  const handleLogout = useCallback(async () => {
    await logout();
    setShowInstructorPanel(false);
  }, [logout, setShowInstructorPanel]);

  const handleNavigateToTab = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  const openCreateRequest = useCallback(() => {
    setNewRequest({ scheduleId: "", courseId: "", requestType: "time_change", reason: "", proposedStartTime: "", proposedEndTime: "", proposedRoom: "", proposedDayOfWeek: "" });
    setShowCreateRequestDialog(true);
  }, []);

  const openCreateExercise = useCallback((courseId?: string) => {
    setNewExercise({ titleFa: "", titleEn: "", descriptionFa: "", type: "practice", difficulty: "beginner", courseId: courseId || "", dueDate: "" });
    setShowCreateExerciseDialog(true);
  }, []);

  const openGradingDialog = useCallback((submission: SubmissionItem) => {
    setGradingTarget(submission);
    setGradeValue(submission.grade !== null ? String(submission.grade / 5) : "");
    setFeedbackValue(submission.feedback || "");
    setShowGradingDialog(true);
  }, []);

  // Tab config
  const tabs = [
    { id: "profile", icon: User, labelFa: "پروفایل", labelEn: "Profile" },
    { id: "dashboard", icon: LayoutDashboard, labelFa: "داشبورد", labelEn: "Dashboard" },
    { id: "schedule", icon: CalendarDays, labelFa: "برنامه هفتگی", labelEn: "Schedule" },
    { id: "classes", icon: BookOpen, labelFa: "کلاس‌ها", labelEn: "Classes" },
    { id: "exercises", icon: ClipboardList, labelFa: "تمرین‌ها", labelEn: "Exercises" },
    { id: "submissions", icon: Edit3, labelFa: "تصحیح", labelEn: "Grading", badge: submissionStats.pending },
    { id: "requests", icon: FileText, labelFa: "درخواست‌ها", labelEn: "Requests", badge: requestStats.pending },
    { id: "makeup", icon: CalendarPlus, labelFa: "جبرانی", labelEn: "Makeup" },
    { id: "announcements", icon: Megaphone, labelFa: "اطلاعیه‌ها", labelEn: "Announcements" },
  ];

  if (!panelVisible || user?.role !== "instructor") return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={routeOwned ? "h-full min-h-0 w-full bg-background" : "fixed inset-0 z-50 bg-background"}
      >
        <div className="h-full flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
          {/* Top Bar */}
          <div className="shrink-0 border-b border-border/40 bg-card/80 backdrop-blur-lg">
            <div className="max-w-4xl mx-auto px-4 py-3">
              <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Music2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className={cn("", isRTL && "text-right")}>
                    <h1 className="text-sm font-bold text-foreground">
                      {isRTL ? "پنل مدرس" : "Instructor Panel"}
                    </h1>
                    <p className="text-[10px] text-muted-foreground">{user?.name || (isRTL ? "مدرس" : "Instructor")}</p>
                  </div>
                </div>
                <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                  <Button
                    variant="ghost" size="sm"
                    onClick={handleLogout}
                    className="text-muted-foreground hover:text-red-500 gap-1.5 rounded-xl text-xs"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isRTL ? "خروج" : "Logout"}</span>
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => setShowInstructorPanel(false)}
                    className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="shrink-0 border-b border-border/30 bg-card/50">
            <div className="max-w-4xl mx-auto px-2">
              <ScrollArea className="w-full">
                <div className={cn("flex items-center gap-1 py-2", isRTL && "flex-row-reverse")} style={{ minWidth: "max-content" }}>
                  {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <motion.button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        <tab.icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{isRTL ? tab.labelFa : tab.labelEn}</span>
                        {tab.badge !== undefined && tab.badge > 0 && (
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                            {toPersianNum(tab.badge)}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 py-6">
              {isLoading ? (
                <PanelSkeleton />
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === "dashboard" && (
                      <DashboardTab
                        schedules={schedules}
                        exercises={exercises}
                        dashboardData={dashboardData}
                        announcements={announcements}
                        isRTL={isRTL}
                        instructorName={user?.name || ""}
                        onNavigateToTab={handleNavigateToTab}
                      />
                    )}
                    {activeTab === "profile" && <InstructorProfileTab isRTL={isRTL} />}
                    {activeTab === "schedule" && (
                      <ScheduleTab
                        schedules={schedules}
                        isRTL={isRTL}
                        onCreateRequest={openCreateRequest}
                      />
                    )}
                    {activeTab === "classes" && (
                      <ClassesTab
                        schedules={schedules}
                        exercises={exercises}
                        isRTL={isRTL}
                        onCreateExercise={(courseId) => openCreateExercise(courseId)}
                      />
                    )}
                    {activeTab === "requests" && (
                      <RequestsTab
                        requests={requests}
                        schedules={schedules}
                        requestStats={requestStats}
                        isRTL={isRTL}
                        onCreateRequest={openCreateRequest}
                      />
                    )}
                    {activeTab === "exercises" && (
                      <ExercisesTab
                        exercises={exercises}
                        isRTL={isRTL}
                        onCreateExercise={() => openCreateExercise()}
                        onPublishSuccess={loadData}
                      />
                    )}
                    {activeTab === "submissions" && (
                      <SubmissionsTab
                        submissions={submissions}
                        submissionStats={submissionStats}
                        isRTL={isRTL}
                        onGrade={openGradingDialog}
                      />
                    )}
                    {activeTab === "makeup" && (
                      <MakeupClassTab
                        schedules={schedules}
                        isRTL={isRTL}
                        onRequestMakeup={handleMakeupRequest}
                        submitting={submitting}
                      />
                    )}
                    {activeTab === "announcements" && (
                      <AnnouncementsTab
                        announcements={announcements}
                        isRTL={isRTL}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Create Request Dialog */}
      <Dialog open={showCreateRequestDialog} onOpenChange={setShowCreateRequestDialog}>
        <DialogContent className="sm:max-w-lg rounded-2xl" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="sr-only">
              {isRTL ? "درخواست جدید" : "New Request"}
            </DialogTitle>
            <DialogDescription className="sr-only">فرم درخواست تغییر برنامه</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <h3 className={cn("text-base font-bold", isRTL && "text-right")}>
              {isRTL ? "درخواست جدید" : "New Request"}
            </h3>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? "کلاس / برنامه" : "Class / Schedule"} *</Label>
              <Select value={newRequest.scheduleId} onValueChange={(v) => {
                const sched = schedules.find((s) => s.id === v);
                setNewRequest((p) => ({ ...p, scheduleId: v, courseId: sched?.courseId || "" }));
              }}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder={isRTL ? "انتخاب برنامه..." : "Select schedule..."} /></SelectTrigger>
                <SelectContent>
                  {schedules.filter((s) => s.status === "active").map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {isRTL ? s.course.titleFa : s.course.titleEn} - {s.dayNameFa} {s.startTime}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? "نوع درخواست" : "Request Type"} *</Label>
              <Select value={newRequest.requestType} onValueChange={(v) => setNewRequest((p) => ({ ...p, requestType: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="time_change">{isRTL ? "تغییر زمان" : "Time Change"}</SelectItem>
                  <SelectItem value="cancellation">{isRTL ? "لغو کلاس" : "Cancellation"}</SelectItem>
                  <SelectItem value="room_change">{isRTL ? "تغییر اتاق" : "Room Change"}</SelectItem>
                  <SelectItem value="reschedule">{isRTL ? "جابجایی" : "Reschedule"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? "دلیل" : "Reason"} *</Label>
              <Textarea
                value={newRequest.reason}
                onChange={(e) => setNewRequest((p) => ({ ...p, reason: e.target.value }))}
                className="rounded-xl resize-none" rows={3}
                placeholder={isRTL ? "دلیل درخواست خود را بنویسید..." : "Write your reason..."} dir={isRTL ? "rtl" : "ltr"}
              />
            </div>

            {newRequest.requestType === "time_change" && (
              <>
                <Separator />
                <p className="text-xs font-medium text-muted-foreground">{isRTL ? "زمان پیشنهادی جدید" : "Proposed New Time"}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{isRTL ? "ساعت شروع" : "Start Time"}</Label>
                    <Input
                      type="time"
                      value={newRequest.proposedStartTime}
                      onChange={(e) => setNewRequest((p) => ({ ...p, proposedStartTime: e.target.value }))}
                      className="rounded-xl" dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{isRTL ? "ساعت پایان" : "End Time"}</Label>
                    <Input
                      type="time"
                      value={newRequest.proposedEndTime}
                      onChange={(e) => setNewRequest((p) => ({ ...p, proposedEndTime: e.target.value }))}
                      className="rounded-xl" dir="ltr"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{isRTL ? "روز جدید" : "New Day"}</Label>
                  <Select value={newRequest.proposedDayOfWeek} onValueChange={(v) => setNewRequest((p) => ({ ...p, proposedDayOfWeek: v }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder={isRTL ? "انتخاب روز..." : "Select day..."} /></SelectTrigger>
                    <SelectContent>
                      {DAY_NAMES_FA.map((name, idx) => (
                        <SelectItem key={idx} value={String(idx)}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {newRequest.requestType === "room_change" && (
              <>
                <Separator />
                <p className="text-xs font-medium text-muted-foreground">{isRTL ? "اتاق پیشنهادی جدید" : "Proposed New Room"}</p>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{isRTL ? "اتاق" : "Room"}</Label>
                  <Input
                    value={newRequest.proposedRoom}
                    onChange={(e) => setNewRequest((p) => ({ ...p, proposedRoom: e.target.value }))}
                    className="rounded-xl"
                    placeholder={isRTL ? "نام اتاق..." : "Room name..."} dir={isRTL ? "rtl" : "ltr"}
                  />
                </div>
              </>
            )}

            {newRequest.requestType === "cancellation" && (
              <>
                <Separator />
                <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                  <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {isRTL ? "درخواست لغو کلاس پس از تأیید مدیر اعمال خواهد شد" : "Cancellation will take effect after admin approval"}
                    </p>
                  </div>
                </div>
              </>
            )}

            <Button
              onClick={handleCreateRequest}
              disabled={submitting || !newRequest.scheduleId || !newRequest.reason}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isRTL ? "ارسال درخواست" : "Submit Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Exercise Dialog */}
      <Dialog open={showCreateExerciseDialog} onOpenChange={setShowCreateExerciseDialog}>
        <DialogContent className="sm:max-w-lg rounded-2xl" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="sr-only">
              {isRTL ? "تمرین جدید" : "New Exercise"}
            </DialogTitle>
            <DialogDescription className="sr-only">فرم ایجاد تمرین جدید</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <h3 className={cn("text-base font-bold", isRTL && "text-right")}>
              {isRTL ? "تمرین جدید" : "New Exercise"}
            </h3>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? "کلاس / دوره" : "Class / Course"} *</Label>
              <Select value={newExercise.courseId} onValueChange={(v) => setNewExercise((p) => ({ ...p, courseId: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder={isRTL ? "انتخاب کلاس..." : "Select class..."} /></SelectTrigger>
                <SelectContent>
                  {[...new Map(schedules.map((s) => [s.courseId, s.course])).values()].map((course) => (
                    <SelectItem key={course.id} value={course.id}>{isRTL ? course.titleFa : course.titleEn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? "عنوان (فارسی)" : "Title (Farsi)"} *</Label>
              <Input value={newExercise.titleFa} onChange={(e) => setNewExercise((p) => ({ ...p, titleFa: e.target.value }))} className="rounded-xl" placeholder={isRTL ? "عنوان تمرین..." : "Exercise title..."} dir="rtl" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? "عنوان (انگلیسی)" : "Title (English)"} *</Label>
              <Input value={newExercise.titleEn} onChange={(e) => setNewExercise((p) => ({ ...p, titleEn: e.target.value }))} className="rounded-xl" placeholder="Exercise title..." dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? "توضیحات" : "Description"}</Label>
              <Textarea value={newExercise.descriptionFa} onChange={(e) => setNewExercise((p) => ({ ...p, descriptionFa: e.target.value }))} className="rounded-xl resize-none" rows={2} placeholder={isRTL ? "توضیحات تمرین..." : "Exercise description..."} dir="rtl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{isRTL ? "نوع" : "Type"}</Label>
                <Select value={newExercise.type} onValueChange={(v) => setNewExercise((p) => ({ ...p, type: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="practice">{isRTL ? "تمرین" : "Practice"}</SelectItem>
                    <SelectItem value="theory">{isRTL ? "تئوری" : "Theory"}</SelectItem>
                    <SelectItem value="performance">{isRTL ? "اجرایی" : "Performance"}</SelectItem>
                    <SelectItem value="composition">{isRTL ? "آهنگسازی" : "Composition"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">{isRTL ? "سطح" : "Difficulty"}</Label>
                <Select value={newExercise.difficulty} onValueChange={(v) => setNewExercise((p) => ({ ...p, difficulty: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">{isRTL ? "مبتدی" : "Beginner"}</SelectItem>
                    <SelectItem value="intermediate">{isRTL ? "متوسط" : "Intermediate"}</SelectItem>
                    <SelectItem value="advanced">{isRTL ? "پیشرفته" : "Advanced"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? "مهلت ارسال" : "Due Date"}</Label>
              <Input type="date" value={newExercise.dueDate} onChange={(e) => setNewExercise((p) => ({ ...p, dueDate: e.target.value }))} className="rounded-xl" dir="ltr" />
            </div>
            <Button
              onClick={handleCreateExercise}
              disabled={submitting || !newExercise.titleFa || !newExercise.titleEn || !newExercise.courseId}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {isRTL ? "ایجاد تمرین" : "Create Exercise"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Grading Dialog */}
      <Dialog open={showGradingDialog} onOpenChange={setShowGradingDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="sr-only">
              {isRTL ? "تصحیح تمرین" : "Grade Submission"}
            </DialogTitle>
            <DialogDescription className="sr-only">فرم نمره‌دهی به تحویل تمرین</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <h3 className={cn("text-base font-bold", isRTL && "text-right")}>
              {isRTL ? "تصحیح تمرین" : "Grade Submission"}
            </h3>
            {gradingTarget && (
              <>
                <div className={cn("p-3 rounded-xl bg-muted/30", isRTL && "text-right")}>
                  <p className="text-sm font-semibold text-foreground">{gradingTarget.student.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? gradingTarget.exercise.titleFa : gradingTarget.exercise.titleEn}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {isRTL ? gradingTarget.exercise.course.titleFa : gradingTarget.exercise.course.titleEn}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{isRTL ? "نمره (از ۲۰)" : "Grade (out of 20)"}</Label>
                  <Input
                    type="number" min="0" max="20" step="0.5"
                    value={gradeValue} onChange={(e) => setGradeValue(e.target.value)}
                    className="rounded-xl" placeholder={isRTL ? "۰ تا ۲۰" : "0 to 20"} dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{isRTL ? "بازخورد" : "Feedback"}</Label>
                  <Textarea
                    value={feedbackValue} onChange={(e) => setFeedbackValue(e.target.value)}
                    className="rounded-xl resize-none" rows={3}
                    placeholder={isRTL ? "نظر خود را بنویسید..." : "Write your feedback..."} dir={isRTL ? "rtl" : "ltr"}
                  />
                </div>
                <Button
                  onClick={handleGradeSubmission}
                  disabled={submitting || !gradeValue}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isRTL ? "ثبت نمره" : "Submit Grade"}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
