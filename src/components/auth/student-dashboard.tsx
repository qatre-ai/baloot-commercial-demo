"use client";

import React, { useState, useEffect, useCallback } from "react";
import { deferEffect } from "@/lib/react/defer-effect";
import { useI18n } from "@/lib/i18n";
import { useAuthStore, authFetch } from "@/lib/auth/store";
import { toPersianDigits } from "@/lib/jalali";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  getRegistrationErrorMessage,
  getWorkshopAvailability,
  validateStudentProfile,
} from "@/lib/student/application-contract";
import {
  X, User, Mail, Phone, Calendar, Music,
  LogOut, BookOpen, Clock, MapPin, CheckCircle2,
  AlertCircle, FileText, Plus,
  GraduationCap, Loader2, Send, CircleDot, Clock4, PenLine,
  Wallet, Bell, Megaphone, Star, Sparkles, Eye,
  Settings, ChevronDown, ChevronUp, Trophy
} from "lucide-react";

// ─── Types ─────────────────────────────────────
interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  status: string;
  progress: number;
  enrolledAt: string;
  paymentStatus: string;
  tuitionAmount: number | null;
  registrationMethod: string;
  course: {
    id: string;
    titleFa: string;
    titleEn: string;
    descriptionFa: string | null;
    descriptionEn: string | null;
    category: string | null;
    instrument: string | null;
    level: string;
    classType: string;
    duration: string | null;
    sessionsMin: number | null;
    sessionsMax: number | null;
    price: number | null;
    imageUrl: string | null;
    coverUrl: string | null;
    isFeatured: boolean;
    registrationOpen: boolean;
    maxCapacity: number | null;
    branch: { id: string; nameFa: string; nameEn: string; addressFa: string | null; addressEn: string | null } | null;
    instructor: { id: string; name: string; specialtyFa: string | null; specialtyEn: string | null; avatarUrl: string | null; bioFa: string | null; bioEn: string | null } | null;
    schedules: { id: string; dayOfWeek: number; startTime: string; endTime: string; room: string | null; isRecurring: boolean; specificDate: string | null; sessionNumber: number | null }[];
  };
  payments: { id: string; amount: number; status: string; paymentType: string; paymentMethod: string | null; paidAt: string | null; paymentRef: string | null }[];
}

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
  status: string;
  notes: string | null;
  sessionNumber: number | null;
  course: { id: string; titleFa: string; titleEn: string; instrument: string | null; level: string; classType: string };
  instructor: { id: string; name: string; specialtyFa: string | null; specialtyEn: string | null };
  branch: { id: string; nameFa: string; nameEn: string } | null;
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
  course: { id: string; titleFa: string; titleEn: string; instrument: string | null; level: string };
  submissionStatus: string;
  submission: { id: string; status: string; grade: number | null; feedback: string | null; submittedAt: string | null; gradedAt: string | null } | null;
}

interface AvailableCourse {
  id: string;
  titleFa: string;
  titleEn: string;
  descriptionFa: string | null;
  descriptionEn: string | null;
  category: string | null;
  instrument: string | null;
  level: string;
  classType: string;
  sessionsMin: number | null;
  sessionsMax: number | null;
  price: number | null;
  imageUrl: string | null;
  instructor: { id: string; name: string; specialtyFa: string | null; specialtyEn: string | null; avatarUrl: string | null } | null;
  branch: { id: string; nameFa: string; nameEn: string } | null;
  _count: { enrollments: number };
  registrationOpen: boolean;
  maxCapacity: number | null;
}

interface AnnouncementItem {
  id: string;
  titleFa: string;
  titleEn: string;
  contentFa: string | null;
  contentEn: string | null;
  type: string;
  priority: number;
  isPinned: boolean;
  imageUrl: string | null;
  createdAt: string;
  startsAt: string | null;
  expiresAt: string | null;
}

interface RecommendationItem {
  type: "course" | "workshop";
  data: Record<string, unknown>;
}

// ─── Helper: Jalali date conversion ────────────
function toJalali(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "—";
  }
}

function toJalaliShort(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit" });
  } catch {
    return "—";
  }
}

// ─── Helper: Format amount in تومان with Persian digits ─────
function formatToman(amount: number | null | undefined, isRTL: boolean): string {
  if (amount == null) return isRTL ? "— تومان" : "— Toman";
  const formatted = toPersianDigits(amount.toLocaleString("en-US"));
  return isRTL ? `${formatted} تومان` : `${formatted} Toman`;
}

// ─── Helper: Day names ─────────────────────────
const DAY_NAMES_FA = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
const DAY_NAMES_EN = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// ─── Helper: Payment status ────────────────────
function paymentStatusConfig(status: string, isRTL: boolean) {
  switch (status) {
    case "paid":
      return { label: isRTL ? "پرداخت شده" : "Paid", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" };
    case "unpaid":
      return { label: isRTL ? "پرداخت نشده" : "Unpaid", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
    case "partial":
      return { label: isRTL ? "پرداخت جزئی" : "Partial", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" };
    case "waived":
      return { label: isRTL ? "معاف" : "Waived", color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400" };
    case "pending":
      return { label: isRTL ? "در انتظار" : "Pending", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" };
    case "failed":
      return { label: isRTL ? "ناموفق" : "Failed", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
    case "refunded":
      return { label: isRTL ? "بازگشت داده شده" : "Refunded", color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400" };
    case "overdue":
      return { label: isRTL ? "سررسید گذشته" : "Overdue", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
    default:
      return { label: status, color: "bg-muted text-muted-foreground" };
  }
}

// ─── Helper: Payment method label (for student display) ─────────
function paymentMethodLabel(method: string | null, isRTL: boolean): string {
  if (!method) return isRTL ? "—" : "—";
  const m: Record<string, { fa: string; en: string }> = {
    cash: { fa: "نقدی", en: "Cash" },
    card: { fa: "کارت", en: "Card" },
    transfer: { fa: "انتقال بانکی", en: "Bank Transfer" },
    pos: { fa: "POS", en: "POS" },
    online: { fa: "آنلاین", en: "Online" },
    cheque: { fa: "چک", en: "Cheque" },
    other: { fa: "سایر", en: "Other" },
  };
  return isRTL ? m[method]?.fa || method : m[method]?.en || method;
}

// ─── Helper: Exercise status ───────────────────
function exerciseStatusConfig(status: string, isRTL: boolean) {
  switch (status) {
    case "assigned":
      return { label: isRTL ? "زمان‌بندی شده" : "Assigned", icon: Clock4, color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400" };
    case "submitted":
      return { label: isRTL ? "ارسال شده" : "Submitted", icon: Send, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" };
    case "graded":
      return { label: isRTL ? "تصحیح شده" : "Graded", icon: CheckCircle2, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" };
    case "late":
      return { label: isRTL ? "دیرتر" : "Late", icon: AlertCircle, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
    case "not_submitted":
      return { label: isRTL ? "ارسال نشده" : "Not Submitted", icon: CircleDot, color: "bg-muted text-muted-foreground" };
    default:
      return { label: status, icon: CircleDot, color: "bg-muted text-muted-foreground" };
  }
}

// ─── Helper: Class type ────────────────────────
function classTypeConfig(type: string, isRTL: boolean) {
  switch (type) {
    case "private":
      return { label: isRTL ? "خصوصی" : "Private", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" };
    case "group":
      return { label: isRTL ? "گروهی" : "Group", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" };
    default:
      return { label: type, color: "bg-muted text-muted-foreground" };
  }
}

// ─── Helper: Level label ───────────────────────
function levelLabel(level: string, isRTL: boolean) {
  switch (level) {
    case "beginner": return isRTL ? "مبتدی" : "Beginner";
    case "intermediate": return isRTL ? "متوسط" : "Intermediate";
    case "advanced": return isRTL ? "پیشرفته" : "Advanced";
    case "all": return isRTL ? "همه سطوح" : "All Levels";
    default: return level;
  }
}

// ─── Helper: Announcement type ──────────────────
function announcementTypeConfig(type: string, isRTL: boolean) {
  switch (type) {
    case "urgent":
      return { label: isRTL ? "فوری" : "Urgent", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
    case "important":
      return { label: isRTL ? "مهم" : "Important", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" };
    case "info":
      return { label: isRTL ? "اطلاعیه" : "Info", color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400" };
    case "event":
      return { label: isRTL ? "رویداد" : "Event", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" };
    default:
      return { label: type, color: "bg-muted text-muted-foreground" };
  }
}

// ─── Main Component ────────────────────────────
export function StudentDashboard({ routeOwned = false }: { routeOwned?: boolean }) {
  const { isRTL } = useI18n();
  const { user, showDashboard, setShowDashboard, logout } = useAuthStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("classes");
  const [mounted, setMounted] = useState(false);
  const panelVisible = routeOwned || showDashboard;

  // Data states
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [scheduleGrouped, setScheduleGrouped] = useState<Record<string, ScheduleItem[]>>({});
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [availableCourses, setAvailableCourses] = useState<AvailableCourse[]>([]);
  const [studentProfile, setStudentProfile] = useState<Record<string, unknown> | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);

  // Loading states
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [exercisesLoading, setExercisesLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [workshopReservingId, setWorkshopReservingId] = useState<string | null>(null);

  // Registration dialog
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  // Financial tab states
  const [financialData, setFinancialData] = useState<{
    enrollments: Array<{
      id: string;
      courseNameFa: string;
      courseNameEn: string;
      classType: string;
      tuitionAmount: number;
      paymentStatus: string;
      paidAt: string | null;
      paymentRef: string | null;
      paymentDueDate: string | null;
      enrolledAt: string;
      payments: Array<{
        id: string;
        amount: number;
        status: string;
        paymentType: string;
        paymentMethod: string | null;
        paidAt: string | null;
        paymentRef: string | null;
        installmentNumber: number | null;
        totalInstallments: number | null;
        dueDate: string | null;
        notes: string | null;
        createdAt: string;
      }>;
    }>;
    enrollmentSummary: {
      totalTuition: number;
      paidTuition: number;
      unpaidTuition: number;
      partialTuition: number;
      paidCount: number;
      unpaidCount: number;
      partialCount: number;
      waivedCount: number;
    };
    // Comprehensive summary computed from individual Payment records
    summary?: {
      totalAmount: number;
      totalPaid: number;
      totalOwed: number;
      paymentProgress: number;
      nextInstallment: {
        id: string;
        amount: number;
        dueDate: string | null;
        installmentNumber: number | null;
        totalInstallments: number | null;
      } | null;
      overdueCount: number;
      overdueAmount: number;
      pendingCount: number;
    };
  } | null>(null);
  const [financialLoading, setFinancialLoading] = useState(true);

  // Class detail dialog
  const [classDetailId, setClassDetailId] = useState<string | null>(null);

  // Exercise submit dialog
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [submitExerciseId, setSubmitExerciseId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitNotes, setSubmitNotes] = useState("");

  // Announcement detail dialog
  const [announcementDetailId, setAnnouncementDetailId] = useState<string | null>(null);

  // Expanded course in exercises tab
  const [expandedExerciseCourse, setExpandedExerciseCourse] = useState<string | null>(null);

  useEffect(() => { deferEffect(() => setMounted(true)); }, []);

  // Fetch enrollments
  const fetchEnrollments = useCallback(async () => {
    setEnrollmentsLoading(true);
    try {
      const res = await authFetch("/api/student/enrollments");
      if (res.ok) {
        const data = await res.json();
        setEnrollments(data.enrollments || []);
        setStudentProfile(data.profile || null);
      }
    } catch (err) {
      console.error("[ENROLLMENTS_FETCH]", err);
      toast({ title: isRTL ? "خطا" : "Error", description: isRTL ? "خطا در دریافت اطلاعات کلاس‌ها" : "Failed to load classes", variant: "destructive" });
    } finally {
      setEnrollmentsLoading(false);
    }
  }, [isRTL, toast]);

  // Fetch schedule
  const fetchSchedule = useCallback(async () => {
    setScheduleLoading(true);
    try {
      const res = await authFetch("/api/student/schedule");
      if (res.ok) {
        const data = await res.json();
        setSchedules(data.schedules || []);
        setScheduleGrouped(data.groupedByDay || {});
      }
    } catch (err) {
      console.error("[SCHEDULE_FETCH]", err);
      toast({ title: isRTL ? "خطا" : "Error", description: isRTL ? "خطا در دریافت برنامه هفتگی" : "Failed to load schedule", variant: "destructive" });
    } finally {
      setScheduleLoading(false);
    }
  }, [isRTL, toast]);

  // Fetch exercises
  const fetchExercises = useCallback(async () => {
    setExercisesLoading(true);
    try {
      const res = await authFetch("/api/student/exercises");
      if (res.ok) {
        const data = await res.json();
        setExercises(data.exercises || []);
      }
    } catch (err) {
      console.error("[EXERCISES_FETCH]", err);
      toast({ title: isRTL ? "خطا" : "Error", description: isRTL ? "خطا در دریافت تمرین‌ها" : "Failed to load exercises", variant: "destructive" });
    } finally {
      setExercisesLoading(false);
    }
  }, [isRTL, toast]);

  // Fetch financial data
  const fetchFinancialData = useCallback(async () => {
    setFinancialLoading(true);
    try {
      const res = await authFetch("/api/student/payments");
      if (res.ok) {
        const data = await res.json();
        setFinancialData({
          enrollments: data.enrollments || [],
          enrollmentSummary: data.enrollmentSummary || {
            totalTuition: 0, paidTuition: 0, unpaidTuition: 0, partialTuition: 0,
            paidCount: 0, unpaidCount: 0, partialCount: 0, waivedCount: 0,
          },
          summary: data.summary || undefined,
        });
      }
    } catch (err) {
      console.error("[FINANCIAL_FETCH]", err);
      toast({ title: isRTL ? "خطا" : "Error", description: isRTL ? "خطا در دریافت اطلاعات مالی" : "Failed to load financial data", variant: "destructive" });
    } finally {
      setFinancialLoading(false);
    }
  }, [isRTL, toast]);

  // Fetch available courses for registration
  const fetchAvailableCourses = useCallback(async () => {
    setCoursesLoading(true);
    try {
      const res = await fetch("/api/courses");
      if (res.ok) {
        const data = await res.json();
        const enrolledIds = new Set(enrollments.map(e => e.courseId));
        const available = (data || []).filter(
          (c: AvailableCourse) =>
            c.registrationOpen &&
            !enrolledIds.has(c.id) &&
            (c.maxCapacity == null || c._count.enrollments < c.maxCapacity)
        );
        setAvailableCourses(available);
      }
    } catch (err) {
      console.error("[COURSES_FETCH]", err);
    } finally {
      setCoursesLoading(false);
    }
  }, [enrollments]);

  // Fetch announcements
  const fetchAnnouncements = useCallback(async () => {
    setAnnouncementsLoading(true);
    try {
      const res = await fetch("/api/announcements");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("[ANNOUNCEMENTS_FETCH]", err);
    } finally {
      setAnnouncementsLoading(false);
    }
  }, []);

  // Fetch recommendations
  const fetchRecommendations = useCallback(async () => {
    setRecommendationsLoading(true);
    try {
      const res = await authFetch("/api/student/recommendations");
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (err) {
      console.error("[RECOMMENDATIONS_FETCH]", err);
    } finally {
      setRecommendationsLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (panelVisible && user) {
      deferEffect(() => {
        fetchEnrollments();
        fetchSchedule();
        fetchExercises();
        fetchFinancialData();
        fetchAnnouncements();
        fetchRecommendations();
      });
    }
  }, [panelVisible, user, fetchEnrollments, fetchSchedule, fetchExercises, fetchFinancialData, fetchAnnouncements, fetchRecommendations]);

  // When opening registration dialog, fetch available courses
  useEffect(() => {
    if (registerDialogOpen) {
      deferEffect(() => {
        fetchAvailableCourses();
        setRegisterError(null);
        setRegisterSuccess(false);
        setSelectedCourseId(null);
      });
    }
  }, [registerDialogOpen, fetchAvailableCourses]);

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    setShowDashboard(false);
  };

  const handleRegister = async () => {
    if (!selectedCourseId) return;
    setRegistering(true);
    setRegisterError(null);
    try {
      const res = await authFetch("/api/student/class-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: selectedCourseId }),
      });
      if (res.ok) {
        setRegisterSuccess(true);
        toast({ title: isRTL ? "موفق" : "Success", description: isRTL ? "ثبت‌نام شما با موفقیت انجام شد" : "Registration successful" });
        fetchEnrollments();
        fetchSchedule();
      } else {
        const data = await res.json();
        setRegisterError(getRegistrationErrorMessage(data.error));
      }
    } catch {
      setRegisterError(isRTL ? "خطا در ارتباط با سرور" : "Connection error");
    } finally {
      setRegistering(false);
    }
  };

  const handleProfileSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!studentProfile) return;
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") || ""),
      phone: String(formData.get("phone") || ""),
      email: String(studentProfile.email || ""),
      primaryInstrument: String(formData.get("primaryInstrument") || ""),
      skillLevel: String(formData.get("skillLevel") || ""),
      musicExperienceYears: formData.get("musicExperienceYears")
        ? Number(formData.get("musicExperienceYears"))
        : null,
      city: String(formData.get("city") || ""),
      address: String(formData.get("address") || ""),
    };
    const errors = validateStudentProfile(payload);
    if (Object.keys(errors).length > 0) {
      setProfileError(errors.name || errors.phone || errors.email || (isRTL ? "اطلاعات پروفایل معتبر نیست" : "Profile data is invalid"));
      setProfileSaved(false);
      return;
    }

    setProfileSaving(true);
    setProfileError(null);
    setProfileSaved(false);
    try {
      const res = await authFetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Profile update failed");
      setStudentProfile(data.profile);
      setProfileSaved(true);
      toast({ title: isRTL ? "پروفایل ذخیره شد" : "Profile saved" });
    } catch (error) {
      console.error("[STUDENT_PROFILE_SAVE]", error);
      setProfileError(isRTL ? "ذخیره پروفایل انجام نشد. دوباره تلاش کنید." : "Profile could not be saved. Try again.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleWorkshopReserve = async (workshopId: string) => {
    setWorkshopReservingId(workshopId);
    try {
      const res = await authFetch(`/api/workshops/${workshopId}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: isRTL ? "رزرو انجام نشد" : "Reservation failed",
          description: getRegistrationErrorMessage(data.error),
          variant: "destructive",
        });
        return;
      }
      toast({ title: isRTL ? "کارگاه رزرو شد" : "Workshop reserved" });
      fetchRecommendations();
      fetchEnrollments();
    } catch (error) {
      console.error("[STUDENT_WORKSHOP_RESERVE]", error);
      toast({
        title: isRTL ? "خطا" : "Error",
        description: isRTL ? "ارتباط با سرور برقرار نشد" : "Could not connect to the server",
        variant: "destructive",
      });
    } finally {
      setWorkshopReservingId(null);
    }
  };

  const handleSubmitExercise = async () => {
    if (!submitExerciseId) return;
    setSubmitting(true);
    try {
      const res = await authFetch(`/api/student/exercises/${submitExerciseId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: submitNotes }),
      });
      if (res.ok) {
        toast({ title: isRTL ? "موفق" : "Success", description: isRTL ? "تمرین شما با موفقیت ارسال شد" : "Exercise submitted successfully" });
        fetchExercises();
        setSubmitDialogOpen(false);
        setSubmitExerciseId(null);
        setSubmitNotes("");
      } else {
        const data = await res.json();
        toast({ title: isRTL ? "خطا" : "Error", description: data.error || (isRTL ? "خطا در ارسال تمرین" : "Failed to submit exercise"), variant: "destructive" });
      }
    } catch {
      toast({ title: isRTL ? "خطا" : "Error", description: isRTL ? "خطا در ارتباط با سرور" : "Connection error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // Get the selected class detail
  const classDetail = classDetailId ? enrollments.find(e => e.id === classDetailId) : null;

  // Get the selected announcement detail
  const announcementDetail = announcementDetailId ? announcements.find(a => a.id === announcementDetailId) : null;

  // Count pending exercises
  const pendingExercisesCount = exercises.filter(e => e.submissionStatus === "not_submitted" || e.submissionStatus === "assigned").length;

  // Count unread announcements (pinned ones)
  const unreadAnnouncementsCount = announcements.filter(a => a.isPinned).length;

  // Group exercises by course
  const exercisesByCourse = exercises.reduce<Record<string, ExerciseItem[]>>((acc, ex) => {
    const key = ex.courseId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(ex);
    return acc;
  }, {});

  // Tab definitions with icons and notification badges
  const TABS = [
    { value: "profile", label: isRTL ? "پروفایل" : "Profile", icon: User, badge: null },
    { value: "classes", label: isRTL ? "کلاس‌ها" : "Classes", icon: BookOpen, badge: null },
    { value: "schedule", label: isRTL ? "برنامه" : "Schedule", icon: Calendar, badge: null },
    { value: "financial", label: isRTL ? "مالی" : "Financial", icon: Wallet, badge: null },
    { value: "exercises", label: isRTL ? "تمرین‌ها" : "Exercises", icon: FileText, badge: pendingExercisesCount > 0 ? pendingExercisesCount : null },
    { value: "recommendations", label: isRTL ? "پیشنهادها" : "Recommended", icon: Sparkles, badge: null },
    { value: "announcements", label: isRTL ? "اطلاعیه‌ها" : "Announcements", icon: Megaphone, badge: unreadAnnouncementsCount > 0 ? unreadAnnouncementsCount : null },
  ];

  return (
    <AnimatePresence>
      {panelVisible && (
        <>
          {/* Backdrop */}
          {!routeOwned && <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDashboard(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />}

          {/* Dashboard Panel */}
          <motion.div
            initial={{ opacity: 0, x: isRTL ? -100 : 100, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: isRTL ? -100 : 100, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              routeOwned
                ? "h-full min-h-0 w-full bg-background flex flex-col"
                : "fixed inset-y-0 z-50 bg-background/98 backdrop-blur-2xl shadow-2xl flex flex-col",
              isRTL ? "left-0 border-r border-border/50" : "right-0 border-l border-border/50",
              !routeOwned && "w-full sm:w-[480px]"
            )}
          >
            {/* ─── Header with Profile ──────────── */}
            <div className="flex-shrink-0 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent border-b border-border/50">
              <div className="p-4 sm:p-5">
                {/* Close button + Title */}
                <div className={cn("flex items-center justify-between mb-3", isRTL && "flex-row-reverse")}>
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    {isRTL ? "پنل هنرجو" : "Student Panel"}
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDashboard(false)}
                    className="w-8 h-8"
                    aria-label={isRTL ? "بستن پنل" : "Close panel"}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Profile Card */}
                <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <User className="w-5 h-5 text-primary-foreground" />
                    )}
                  </div>
                  <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                    <h3 className="text-sm font-bold text-foreground truncate">{user.name}</h3>
                    <div className={cn("flex items-center gap-2 mt-0.5 flex-wrap", isRTL && "justify-end")}>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                        <Music className="w-3 h-3" />
                        {isRTL ? "هنرجو" : "Student"}
                      </span>
                      {user.phone && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {toPersianDigits(user.phone)}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{user.email}</p>
                  </div>
                </div>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-4 gap-2 mt-3">
                  <div className="rounded-xl bg-background/80 border border-border/30 p-2 text-center">
                    <p className="text-base font-bold text-primary">{toPersianDigits(enrollments.filter(e => e.status === "active").length)}</p>
                    <p className="text-[9px] text-muted-foreground">{isRTL ? "دوره فعال" : "Active"}</p>
                  </div>
                  <div className="rounded-xl bg-background/80 border border-border/30 p-2 text-center">
                    <p className="text-base font-bold text-primary">{toPersianDigits(schedules.length)}</p>
                    <p className="text-[9px] text-muted-foreground">{isRTL ? "جلسه" : "Sessions"}</p>
                  </div>
                  <div className="rounded-xl bg-background/80 border border-border/30 p-2 text-center">
                    <p className="text-base font-bold text-amber-600 dark:text-amber-400">{toPersianDigits(pendingExercisesCount)}</p>
                    <p className="text-[9px] text-muted-foreground">{isRTL ? "تمرین" : "Pending"}</p>
                  </div>
                  <div className="rounded-xl bg-background/80 border border-border/30 p-2 text-center">
                    <p className="text-base font-bold text-sky-600 dark:text-sky-400">{toPersianDigits(unreadAnnouncementsCount)}</p>
                    <p className="text-[9px] text-muted-foreground">{isRTL ? "اطلاعیه" : "Alerts"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Tabbed Content ───────────────── */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-shrink-0 px-3 pt-2">
                  <ScrollArea className="w-full">
                    <TabsList className={cn("h-9 w-max min-w-full", isRTL && "flex-row-reverse")}>
                      {TABS.map(tab => {
                        const TabIcon = tab.icon;
                        return (
                          <TabsTrigger key={tab.value} value={tab.value} className="text-xs gap-1 px-2.5 relative">
                            <TabIcon className="w-3 h-3" />
                            <span className="hidden sm:inline">{tab.label}</span>
                            <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
                            {tab.badge && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[8px] flex items-center justify-center font-bold">
                                {toPersianDigits(Number(tab.badge) > 9 ? "۹+" : tab.badge)}
                              </span>
                            )}
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>
                  </ScrollArea>
                </div>

                {/* ─── Classes Tab ────────────── */}
                <TabsContent value="profile" className="flex-1 overflow-hidden mt-0">
                  <ScrollArea className="h-full">
                    <form onSubmit={handleProfileSave} className="p-4 space-y-4">
                      <div className={cn("rounded-xl border border-border/40 bg-card/60 p-3", isRTL && "text-right")}>
                        <p className="text-sm font-semibold">{isRTL ? "اطلاعات حساب" : "Account information"}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {isRTL ? "اطلاعات ثبت‌نام و ارتباط با موسسه را به‌روز نگه دارید." : "Keep your registration and contact information up to date."}
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="student-profile-name">{isRTL ? "نام و نام خانوادگی" : "Full name"}</Label>
                          <Input id="student-profile-name" name="name" defaultValue={String(studentProfile?.name || user.name || "")} required />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="student-profile-phone">{isRTL ? "شماره تماس" : "Phone"}</Label>
                          <Input id="student-profile-phone" name="phone" defaultValue={String(studentProfile?.phone || user.phone || "")} dir="ltr" required />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="student-profile-instrument">{isRTL ? "ساز اصلی" : "Primary instrument"}</Label>
                          <Input id="student-profile-instrument" name="primaryInstrument" defaultValue={String(studentProfile?.primaryInstrument || "")} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="student-profile-level">{isRTL ? "سطح مهارت" : "Skill level"}</Label>
                          <Input id="student-profile-level" name="skillLevel" defaultValue={String(studentProfile?.skillLevel || "")} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="student-profile-experience">{isRTL ? "سابقه موسیقی (سال)" : "Music experience (years)"}</Label>
                          <Input id="student-profile-experience" name="musicExperienceYears" type="number" min="0" defaultValue={studentProfile?.musicExperienceYears == null ? "" : String(studentProfile.musicExperienceYears)} dir="ltr" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="student-profile-city">{isRTL ? "شهر" : "City"}</Label>
                          <Input id="student-profile-city" name="city" defaultValue={String(studentProfile?.city || "")} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="student-profile-address">{isRTL ? "نشانی" : "Address"}</Label>
                        <Textarea id="student-profile-address" name="address" defaultValue={String(studentProfile?.address || "")} className="min-h-20" />
                      </div>
                      {profileError && (
                        <div role="alert" className={cn("rounded-xl bg-destructive/10 p-3 text-xs text-destructive", isRTL && "text-right")}>{profileError}</div>
                      )}
                      {profileSaved && (
                        <div role="status" className={cn("rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-400", isRTL && "text-right")}>
                          {isRTL ? "تغییرات با موفقیت ذخیره شد." : "Changes saved successfully."}
                        </div>
                      )}
                      <Button type="submit" disabled={profileSaving} className="w-full rounded-xl gap-2">
                        {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        {profileSaving ? (isRTL ? "در حال ذخیره..." : "Saving...") : (isRTL ? "ذخیره تغییرات" : "Save changes")}
                      </Button>
                    </form>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="classes" className="flex-1 overflow-hidden mt-0">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-3">
                      {/* Quick Registration Button */}
                      <Button
                        onClick={() => setRegisterDialogOpen(true)}
                        className="w-full rounded-xl gap-2 h-10"
                        variant="outline"
                      >
                        <Plus className="w-4 h-4" />
                        {isRTL ? "ثبت‌نام در کلاس جدید" : "Register for New Class"}
                      </Button>

                      {enrollmentsLoading ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map(i => (
                            <Card key={i} className="border-border/30">
                              <CardContent className="p-4">
                                <Skeleton className="h-4 w-3/4 mb-3" />
                                <Skeleton className="h-3 w-1/2 mb-2" />
                                <Skeleton className="h-3 w-2/3 mb-3" />
                                <Skeleton className="h-2 w-full" />
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : enrollments.length === 0 ? (
                        <div className="text-center py-10">
                          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
                            <BookOpen className="w-7 h-7 text-muted-foreground/40" />
                          </div>
                          <p className="text-sm text-muted-foreground font-medium">
                            {isRTL ? "هنوز در کلاسی ثبت‌نام نکرده‌اید" : "No classes yet"}
                          </p>
                          <p className="text-xs text-muted-foreground/60 mt-1">
                            {isRTL ? "از دکمه بالا برای ثبت‌نام استفاده کنید" : "Use the button above to register"}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {enrollments.map((enrollment, i) => {
                            const ctConfig = classTypeConfig(enrollment.course.classType, isRTL);
                            const psConfig = paymentStatusConfig(enrollment.paymentStatus, isRTL);
                            const courseTitle = isRTL ? enrollment.course.titleFa : enrollment.course.titleEn;
                            const instructorName = enrollment.course.instructor?.name || (isRTL ? "نامشخص" : "Unknown");
                            const scheduleStr = enrollment.course.schedules.length > 0
                              ? enrollment.course.schedules.map(s =>
                                  `${isRTL ? DAY_NAMES_FA[s.dayOfWeek] : DAY_NAMES_EN[s.dayOfWeek]} ${s.startTime}-${s.endTime}`
                                ).join(" | ")
                              : (isRTL ? "زمان‌بندی نشده" : "Not scheduled");

                            return (
                              <motion.div
                                key={enrollment.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                              >
                                <Card
                                  className="border-border/30 hover:border-primary/20 transition-all cursor-pointer group"
                                  onClick={() => setClassDetailId(enrollment.id)}
                                >
                                  <CardContent className="p-4">
                                    {/* Course title + badges */}
                                    <div className={cn("flex items-start gap-2 mb-2", isRTL && "flex-row-reverse")}>
                                      <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                                        <h4 className="text-sm font-semibold text-foreground truncate">{courseTitle}</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                          {isRTL ? "استاد" : "Instructor"}: {instructorName}
                                        </p>
                                      </div>
                                      <div className={cn("flex items-center gap-1.5 flex-shrink-0", isRTL && "flex-row-reverse")}>
                                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold", ctConfig.color)}>
                                          {ctConfig.label}
                                        </span>
                                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold", psConfig.color)}>
                                          {psConfig.label}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Schedule info */}
                                    <div className={cn("flex items-center gap-1.5 mb-2 text-xs text-muted-foreground", isRTL && "flex-row-reverse justify-end")}>
                                      <Clock className="w-3 h-3 flex-shrink-0" />
                                      <span className="truncate">{scheduleStr}</span>
                                    </div>

                                    {/* Level */}
                                    <div className={cn("flex items-center gap-1.5 mb-2 text-xs text-muted-foreground", isRTL && "flex-row-reverse justify-end")}>
                                      <GraduationCap className="w-3 h-3 flex-shrink-0" />
                                      <span>{levelLabel(enrollment.course.level, isRTL)}</span>
                                      {enrollment.course.branch && (
                                        <>
                                          <span className="text-muted-foreground/40">•</span>
                                          <MapPin className="w-3 h-3 flex-shrink-0" />
                                          <span>{isRTL ? enrollment.course.branch.nameFa : enrollment.course.branch.nameEn}</span>
                                        </>
                                      )}
                                    </div>

                                    {/* Progress */}
                                    <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                                      <div className="flex-1 min-w-0">
                                        <div className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse")}>
                                          <Progress value={enrollment.progress} className="h-1.5 flex-1" />
                                          <span className="text-[10px] text-muted-foreground flex-shrink-0">{toPersianDigits(enrollment.progress)}٪</span>
                                        </div>
                                      </div>
                                      <Eye className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}

                      {/* Logout button */}
                      <div className="pt-3 pb-4">
                        <Button
                          variant="outline"
                          onClick={handleLogout}
                          className="w-full rounded-xl border-destructive/30 hover:border-destructive/60 hover:bg-destructive/5 text-destructive hover:text-destructive transition-all gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          {isRTL ? "خروج از حساب" : "Sign Out"}
                        </Button>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* ─── Schedule Tab ────────────── */}
                <TabsContent value="schedule" className="flex-1 overflow-hidden mt-0">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-3">
                      {scheduleLoading ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map(i => (
                            <Card key={i} className="border-border/30">
                              <CardContent className="p-4">
                                <Skeleton className="h-4 w-1/3 mb-3" />
                                <Skeleton className="h-3 w-2/3 mb-2" />
                                <Skeleton className="h-3 w-1/2" />
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : schedules.length === 0 ? (
                        <div className="text-center py-10">
                          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
                            <Calendar className="w-7 h-7 text-muted-foreground/40" />
                          </div>
                          <p className="text-sm text-muted-foreground font-medium">
                            {isRTL ? "برنامه هفتگی خالی است" : "No weekly schedule"}
                          </p>
                          <p className="text-xs text-muted-foreground/60 mt-1">
                            {isRTL ? "با ثبت‌نام در کلاس‌ها، برنامه شما نمایش داده می‌شود" : "Register for classes to see your schedule"}
                          </p>
                        </div>
                      ) : (
                        DAY_NAMES_FA.map((dayFa, dayIndex) => {
                          const daySchedules = scheduleGrouped[String(dayIndex)];
                          if (!daySchedules || daySchedules.length === 0) return null;

                          return (
                            <motion.div
                              key={dayIndex}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: dayIndex * 0.04 }}
                            >
                              <div className="mb-1">
                                <h4 className={cn("text-xs font-semibold text-muted-foreground uppercase tracking-wider", isRTL && "text-right")}>
                                  {isRTL ? dayFa : DAY_NAMES_EN[dayIndex]}
                                </h4>
                              </div>
                              <div className="space-y-2">
                                {daySchedules.map((schedule) => {
                                  const ctConfig = classTypeConfig(schedule.course.classType, isRTL);
                                  const courseTitle = isRTL ? schedule.course.titleFa : schedule.course.titleEn;
                                  const instructorName = schedule.instructor?.name || (isRTL ? "نامشخص" : "Unknown");

                                  return (
                                    <Card key={schedule.id} className={cn(
                                      "border-r-2",
                                      schedule.course.classType === "private" ? "border-r-purple-400" : "border-r-rose-400",
                                      isRTL && "border-r-0 border-l-2",
                                      isRTL && schedule.course.classType === "private" ? "border-l-purple-400" : "border-l-rose-400"
                                    )}>
                                      <CardContent className="p-3">
                                        <div className={cn("flex items-start gap-3", isRTL && "flex-row-reverse")}>
                                          {/* Time column */}
                                          <div className={cn("text-center flex-shrink-0 min-w-[48px]", isRTL && "text-right")}>
                                            <p className="text-xs font-bold text-foreground" dir="ltr">{schedule.startTime}</p>
                                            <p className="text-[10px] text-muted-foreground" dir="ltr">{schedule.endTime}</p>
                                          </div>

                                          {/* Info column */}
                                          <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                                            <h5 className="text-sm font-semibold text-foreground truncate">{courseTitle}</h5>
                                            <div className={cn("flex items-center gap-2 mt-1 flex-wrap", isRTL && "flex-row-reverse justify-end")}>
                                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {instructorName}
                                              </span>
                                              {schedule.room && (
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                  <MapPin className="w-3 h-3" />
                                                  {schedule.room}
                                                </span>
                                              )}
                                              {schedule.branch && (
                                                <span className="text-[10px] text-muted-foreground">
                                                  {isRTL ? schedule.branch.nameFa : schedule.branch.nameEn}
                                                </span>
                                              )}
                                              <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold", ctConfig.color)}>
                                                {ctConfig.label}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                              </div>
                            </motion.div>
                          );
                        })
                      )}

                      {/* Legend */}
                      {schedules.length > 0 && (
                        <div className={cn("flex items-center gap-4 pt-2 pb-4 justify-center", isRTL && "flex-row-reverse")}>
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-purple-400" />
                            <span className="text-[10px] text-muted-foreground">{isRTL ? "خصوصی" : "Private"}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-rose-400" />
                            <span className="text-[10px] text-muted-foreground">{isRTL ? "گروهی" : "Group"}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* ─── Financial Tab ───────────── */}
                <TabsContent value="financial" className="flex-1 overflow-hidden mt-0">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-4">
                      {financialLoading ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            {[1, 2, 3, 4].map(i => (
                              <Card key={i} className="border-border/30">
                                <CardContent className="p-3">
                                  <Skeleton className="h-3 w-1/2 mb-2" />
                                  <Skeleton className="h-6 w-3/4" />
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                          {[1, 2, 3].map(i => (
                            <Card key={i} className="border-border/30">
                              <CardContent className="p-4">
                                <Skeleton className="h-4 w-3/4 mb-3" />
                                <Skeleton className="h-3 w-1/2 mb-2" />
                                <Skeleton className="h-3 w-2/3" />
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : !financialData || financialData.enrollments.length === 0 ? (
                        <div className="text-center py-10">
                          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
                            <Wallet className="w-7 h-7 text-muted-foreground/40" />
                          </div>
                          <p className="text-sm text-muted-foreground font-medium">
                            {isRTL ? "اطلاعات مالی موجود نیست" : "No financial data"}
                          </p>
                          <p className="text-xs text-muted-foreground/60 mt-1">
                            {isRTL ? "با ثبت‌نام در کلاس‌ها، اطلاعات مالی نمایش داده می‌شود" : "Financial info will appear after enrollment"}
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Summary Cards — using comprehensive Payment-record-derived data when available */}
                          {(() => {
                            // Compute total paid from individual Payment records across all enrollments
                            // (more accurate than enrollment-level paidTuition which only counts fully-paid enrollments)
                            const totalPaidFromPayments = financialData.enrollments.reduce(
                              (sum, e) => sum + (e.payments?.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0) || 0),
                              0
                            );
                            const totalTuition = financialData.enrollmentSummary.totalTuition;
                            const remainingBalance = Math.max(0, totalTuition - totalPaidFromPayments);
                            const overdueAmount = financialData.summary?.overdueAmount || 0;
                            const overdueCount = financialData.summary?.overdueCount || 0;

                            return (
                              <div className="grid grid-cols-2 gap-2">
                                <Card className="border-border/30 bg-gradient-to-br from-primary/5 to-transparent">
                                  <CardContent className="p-3">
                                    <p className="text-[10px] text-muted-foreground mb-1">{isRTL ? "کل شهریه" : "Total Tuition"}</p>
                                    <p className="text-sm font-bold text-foreground">{formatToman(totalTuition, isRTL)}</p>
                                  </CardContent>
                                </Card>
                                <Card className="border-border/30 bg-gradient-to-br from-emerald-500/5 to-transparent">
                                  <CardContent className="p-3">
                                    <p className="text-[10px] text-muted-foreground mb-1">{isRTL ? "پرداخت‌شده تا کنون" : "Paid So Far"}</p>
                                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatToman(totalPaidFromPayments, isRTL)}</p>
                                  </CardContent>
                                </Card>
                                <Card className="border-border/30 bg-gradient-to-br from-amber-500/5 to-transparent">
                                  <CardContent className="p-3">
                                    <p className="text-[10px] text-muted-foreground mb-1">{isRTL ? "باقی‌مانده" : "Remaining Balance"}</p>
                                    <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{formatToman(remainingBalance, isRTL)}</p>
                                  </CardContent>
                                </Card>
                                <Card className={cn("border-border/30 bg-gradient-to-br to-transparent", overdueAmount > 0 ? "from-red-500/10" : "from-muted/10")}>
                                  <CardContent className="p-3">
                                    <p className="text-[10px] text-muted-foreground mb-1">{isRTL ? "سررسید گذشته" : "Overdue"}</p>
                                    <p className={cn("text-sm font-bold", overdueAmount > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground")}>
                                      {formatToman(overdueAmount, isRTL)}
                                    </p>
                                    {overdueCount > 0 && (
                                      <p className="text-[9px] text-red-600/70 dark:text-red-400/70 mt-0.5">
                                        {isRTL ? `${toPersianDigits(overdueCount)} قسط معوق` : `${overdueCount} overdue`}
                                      </p>
                                    )}
                                  </CardContent>
                                </Card>
                              </div>
                            );
                          })()}

                          {/* Overdue warning banner */}
                          {(financialData.summary?.overdueCount || 0) > 0 && (
                            <div className={cn("flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20", isRTL && "flex-row-reverse")}>
                              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                              <div className={cn("flex-1", isRTL && "text-right")}>
                                <p className="text-[11px] font-semibold text-red-700 dark:text-red-300">
                                  {isRTL
                                    ? `${toPersianDigits(financialData.summary!.overdueCount)} قسط سررسید گذشته دارید`
                                    : `You have ${financialData.summary!.overdueCount} overdue installment(s)`}
                                </p>
                                <p className="text-[10px] text-red-600/80 dark:text-red-400/80">
                                  {isRTL
                                    ? `مجموع: ${formatToman(financialData.summary!.overdueAmount, isRTL)} — لطفاً جهت تسویه با مدیریت تماس بگیرید`
                                    : `Total: ${formatToman(financialData.summary!.overdueAmount, isRTL)} — please contact admin to settle`}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Next installment due date */}
                          {financialData.summary?.nextInstallment && (
                            <Card className="border-border/30 bg-gradient-to-br from-sky-500/5 to-transparent">
                              <CardContent className="p-3">
                                <div className={cn("flex items-center gap-2 mb-1", isRTL && "flex-row-reverse")}>
                                  <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                                  <span className="text-[10px] font-semibold text-muted-foreground">{isRTL ? "نزدیک‌ترین سررسید" : "Next Due Date"}</span>
                                </div>
                                <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                                  <span className="text-xs font-bold text-foreground">
                                    {formatToman(financialData.summary.nextInstallment.amount, isRTL)}
                                  </span>
                                  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">
                                    {financialData.summary.nextInstallment.dueDate ? toJalaliShort(financialData.summary.nextInstallment.dueDate) : "—"}
                                  </span>
                                </div>
                                {financialData.summary.nextInstallment.installmentNumber != null && financialData.summary.nextInstallment.totalInstallments != null && (
                                  <p className="text-[9px] text-muted-foreground mt-1">
                                    {isRTL
                                      ? `قسط ${toPersianDigits(financialData.summary.nextInstallment.installmentNumber)} از ${toPersianDigits(financialData.summary.nextInstallment.totalInstallments)}`
                                      : `Installment ${financialData.summary.nextInstallment.installmentNumber} of ${financialData.summary.nextInstallment.totalInstallments}`}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          )}

                          {/* Payment progress bar — based on actual paid amount vs total tuition */}
                          {financialData.enrollmentSummary.totalTuition > 0 && (
                            <Card className="border-border/30">
                              <CardContent className="p-3">
                                {(() => {
                                  const totalPaidFromPayments = financialData.enrollments.reduce(
                                    (sum, e) => sum + (e.payments?.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0) || 0),
                                    0
                                  );
                                  const pct = Math.min(100, Math.round((totalPaidFromPayments / financialData.enrollmentSummary.totalTuition) * 100));
                                  return (
                                    <>
                                      <div className={cn("flex items-center justify-between mb-1.5", isRTL && "flex-row-reverse")}>
                                        <span className="text-[10px] text-muted-foreground">{isRTL ? "پیشرفت پرداخت" : "Payment Progress"}</span>
                                        <span className="text-[10px] font-semibold text-foreground">{toPersianDigits(pct)}٪</span>
                                      </div>
                                      <Progress value={pct} className="h-2" />
                                      <div className={cn("flex items-center gap-3 mt-2 justify-center flex-wrap", isRTL && "flex-row-reverse")}>
                                        <div className="flex items-center gap-1">
                                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                          <span className="text-[9px] text-muted-foreground">{isRTL ? "تسویه‌شده" : "Paid"} ({toPersianDigits(financialData.enrollmentSummary.paidCount)})</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <div className="w-2 h-2 rounded-full bg-red-500" />
                                          <span className="text-[9px] text-muted-foreground">{isRTL ? "شروع‌نشده" : "Unpaid"} ({toPersianDigits(financialData.enrollmentSummary.unpaidCount)})</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                                          <span className="text-[9px] text-muted-foreground">{isRTL ? "جزئی" : "Partial"} ({toPersianDigits(financialData.enrollmentSummary.partialCount)})</span>
                                        </div>
                                      </div>
                                    </>
                                  );
                                })()}
                              </CardContent>
                            </Card>
                          )}

                          {/* Enrollment financial details — per enrollment with computed paid/remaining + full payment history */}
                          <div>
                            <h4 className={cn("text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2", isRTL && "text-right")}>
                              {isRTL ? "جزئیات شهریه دوره‌ها" : "Course Tuition Details"}
                            </h4>
                            <div className="space-y-2">
                              {financialData.enrollments.map((enrollment, i) => {
                                const psConfig = paymentStatusConfig(enrollment.paymentStatus, isRTL);
                                const ctConfig = classTypeConfig(enrollment.classType, isRTL);
                                const courseName = isRTL ? enrollment.courseNameFa : enrollment.courseNameEn;
                                const tuition = enrollment.tuitionAmount || 0;
                                const paidSoFar = enrollment.payments?.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0) || 0;
                                const remaining = Math.max(0, tuition - paidSoFar);
                                const hasPayments = enrollment.payments && enrollment.payments.length > 0;
                                const hasOverdueInstallment = enrollment.payments?.some(p =>
                                  p.status === "overdue" || (p.status === "pending" && p.dueDate && new Date(p.dueDate) < new Date())
                                );

                                return (
                                  <motion.div
                                    key={enrollment.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                  >
                                    <Card className={cn("border-border/30", hasOverdueInstallment && "border-red-500/30")}>
                                      <CardContent className="p-3">
                                        {/* Course name + badges */}
                                        <div className={cn("flex items-start gap-2 mb-2", isRTL && "flex-row-reverse")}>
                                          <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                                            <h5 className="text-sm font-semibold text-foreground truncate">{courseName}</h5>
                                          </div>
                                          <div className={cn("flex items-center gap-1.5 flex-shrink-0", isRTL && "flex-row-reverse")}>
                                            <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold", ctConfig.color)}>
                                              {ctConfig.label}
                                            </span>
                                            <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold", psConfig.color)}>
                                              {psConfig.label}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Tuition / Paid / Remaining grid */}
                                        <div className="grid grid-cols-3 gap-2 mb-2">
                                          <div className={cn("rounded-md bg-muted/30 p-2", isRTL && "text-right")}>
                                            <p className="text-[9px] text-muted-foreground">{isRTL ? "شهریه" : "Tuition"}</p>
                                            <p className="text-[11px] font-bold text-foreground tabular-nums">{formatToman(tuition, isRTL)}</p>
                                          </div>
                                          <div className={cn("rounded-md bg-emerald-500/5 p-2", isRTL && "text-right")}>
                                            <p className="text-[9px] text-muted-foreground">{isRTL ? "پرداخت‌شده" : "Paid"}</p>
                                            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatToman(paidSoFar, isRTL)}</p>
                                          </div>
                                          <div className={cn("rounded-md bg-amber-500/5 p-2", isRTL && "text-right")}>
                                            <p className="text-[9px] text-muted-foreground">{isRTL ? "باقی‌مانده" : "Remaining"}</p>
                                            <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 tabular-nums">{formatToman(remaining, isRTL)}</p>
                                          </div>
                                        </div>

                                        {/* Enrollment-level paid date / reference (legacy, when paidAt set directly on enrollment) */}
                                        {enrollment.paidAt && !hasPayments && (
                                          <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                                            <span className="text-[10px] text-muted-foreground">{isRTL ? "تاریخ پرداخت" : "Paid Date"}</span>
                                            <span className="text-[10px] text-muted-foreground">{toJalaliShort(enrollment.paidAt)}</span>
                                          </div>
                                        )}
                                        {enrollment.paymentRef && !hasPayments && (
                                          <div className={cn("flex items-center justify-between mt-1", isRTL && "flex-row-reverse")}>
                                            <span className="text-[10px] text-muted-foreground">{isRTL ? "شماره پیگیری" : "Payment Ref"}</span>
                                            <span className="text-[10px] text-muted-foreground font-mono" dir="ltr">{enrollment.paymentRef}</span>
                                          </div>
                                        )}

                                        {/* Due date (only show if not fully paid) */}
                                        {enrollment.paymentDueDate && enrollment.paymentStatus !== "paid" && enrollment.paymentStatus !== "waived" && (
                                          <div className={cn("flex items-center justify-between mt-1", isRTL && "flex-row-reverse")}>
                                            <span className="text-[10px] text-muted-foreground">{isRTL ? "مهلت پرداخت" : "Due Date"}</span>
                                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">{toJalaliShort(enrollment.paymentDueDate)}</span>
                                          </div>
                                        )}

                                        {/* Full payment history */}
                                        {hasPayments && (
                                          <div className="mt-2 pt-2 border-t border-border/30">
                                            <p className="text-[9px] text-muted-foreground mb-1.5 font-semibold uppercase tracking-wide">
                                              {isRTL ? "تاریخچه پرداخت‌ها" : "Payment History"}
                                            </p>
                                            <div className="space-y-1.5">
                                              {enrollment.payments!.map((payment) => {
                                                const payConfig = paymentStatusConfig(payment.status, isRTL);
                                                const isOverdue = payment.status === "overdue" || (payment.status === "pending" && payment.dueDate && new Date(payment.dueDate) < new Date());
                                                return (
                                                  <div
                                                    key={payment.id}
                                                    className={cn(
                                                      "rounded-md p-1.5 border",
                                                      isOverdue
                                                        ? "bg-red-500/5 border-red-500/20"
                                                        : payment.status === "paid"
                                                        ? "bg-emerald-500/5 border-emerald-500/15"
                                                        : "bg-muted/20 border-border/40"
                                                    )}
                                                  >
                                                    {/* Row 1: amount + status badge + installment # */}
                                                    <div className={cn("flex items-center justify-between gap-1.5", isRTL && "flex-row-reverse")}>
                                                      <div className={cn("flex items-center gap-1.5 min-w-0", isRTL && "flex-row-reverse")}>
                                                        <span className={cn("inline-flex items-center px-1 py-0 rounded text-[8px] font-semibold", payConfig.color)}>
                                                          {payConfig.label}
                                                        </span>
                                                        {payment.installmentNumber != null && payment.totalInstallments != null && (
                                                          <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                                                            {isRTL
                                                              ? `قسط ${toPersianDigits(payment.installmentNumber)}/${toPersianDigits(payment.totalInstallments)}`
                                                              : `Inst. ${payment.installmentNumber}/${payment.totalInstallments}`}
                                                          </span>
                                                        )}
                                                      </div>
                                                      <span className={cn("text-[11px] font-bold tabular-nums", payment.status === "paid" ? "text-emerald-700 dark:text-emerald-400" : "text-foreground")}>
                                                        {formatToman(payment.amount, isRTL)}
                                                      </span>
                                                    </div>
                                                    {/* Row 2: dates + method + ref */}
                                                    <div className={cn("flex items-center gap-2 mt-1 text-[9px] text-muted-foreground flex-wrap", isRTL && "flex-row-reverse")}>
                                                      {payment.paidAt && (
                                                        <span className="inline-flex items-center gap-0.5">
                                                          <CheckCircle2 className="w-2.5 h-2.5" />
                                                          {toJalaliShort(payment.paidAt)}
                                                        </span>
                                                      )}
                                                      {!payment.paidAt && payment.dueDate && (
                                                        <span className={cn("inline-flex items-center gap-0.5", isOverdue ? "text-red-600 dark:text-red-400 font-medium" : "")}>
                                                          <Calendar className="w-2.5 h-2.5" />
                                                          {toJalaliShort(payment.dueDate)}
                                                        </span>
                                                      )}
                                                      {payment.paymentMethod && (
                                                        <span>{paymentMethodLabel(payment.paymentMethod, isRTL)}</span>
                                                      )}
                                                      {payment.paymentRef && (
                                                        <span className="font-mono" dir="ltr">#{payment.paymentRef}</span>
                                                      )}
                                                    </div>
                                                    {/* Row 3: notes (optional) */}
                                                    {payment.notes && (
                                                      <p className="text-[9px] text-muted-foreground mt-1 italic">{payment.notes}</p>
                                                    )}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Footer note: transparency / no-abuse guarantee */}
                          <p className="text-[9px] text-muted-foreground/70 text-center pt-1">
                            {isRTL
                              ? "تمامی پرداخت‌ها توسط مدیریت ثبت و قابل پیگیری است. در صورت اختلاف، با مدیریت تماس بگیرید."
                              : "All payments are recorded by admin and traceable. Contact admin if there is a discrepancy."}
                          </p>
                        </>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* ─── Exercises Tab ───────────── */}
                <TabsContent value="exercises" className="flex-1 overflow-hidden mt-0">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-3">
                      {exercisesLoading ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map(i => (
                            <Card key={i} className="border-border/30">
                              <CardContent className="p-4">
                                <Skeleton className="h-4 w-3/4 mb-2" />
                                <Skeleton className="h-3 w-1/2 mb-2" />
                                <Skeleton className="h-3 w-1/3" />
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : exercises.length === 0 ? (
                        <div className="text-center py-10">
                          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
                            <FileText className="w-7 h-7 text-muted-foreground/40" />
                          </div>
                          <p className="text-sm text-muted-foreground font-medium">
                            {isRTL ? "تمرینی وجود ندارد" : "No exercises"}
                          </p>
                          <p className="text-xs text-muted-foreground/60 mt-1">
                            {isRTL ? "تمرین‌های کلاس‌های شما اینجا نمایش داده می‌شود" : "Exercises from your courses will appear here"}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Filter by course sections */}
                          {Object.entries(exercisesByCourse).map(([courseId, courseExercises]) => {
                            const firstExercise = courseExercises[0];
                            const courseTitle = isRTL ? firstExercise.course.titleFa : firstExercise.course.titleEn;
                            const isExpanded = expandedExerciseCourse === courseId || Object.keys(exercisesByCourse).length === 1;

                            return (
                              <div key={courseId}>
                                <button
                                  onClick={() => setExpandedExerciseCourse(isExpanded && Object.keys(exercisesByCourse).length > 1 ? null : courseId)}
                                  className={cn("w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors", isRTL && "flex-row-reverse")}
                                >
                                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                    <BookOpen className="w-3 h-3" />
                                    {courseTitle}
                                    <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                                      {toPersianDigits(courseExercises.length)}
                                    </Badge>
                                  </span>
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                                </button>

                                {isExpanded && (
                                  <div className="space-y-2 mt-1">
                                    {courseExercises.map((exercise, i) => {
                                      const statusConfig = exerciseStatusConfig(exercise.submissionStatus, isRTL);
                                      const StatusIcon = statusConfig.icon;
                                      const exerciseTitle = isRTL ? exercise.titleFa : exercise.titleEn;
                                      const canSubmit = exercise.submissionStatus === "not_submitted" || exercise.submissionStatus === "assigned" || exercise.submissionStatus === "late" || exercise.submissionStatus === "submitted" || exercise.submissionStatus === "graded";
                                      const isPastDue = exercise.dueDate && new Date(exercise.dueDate) < new Date();

                                      return (
                                        <motion.div
                                          key={exercise.id}
                                          initial={{ opacity: 0, y: 8 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ delay: i * 0.04 }}
                                        >
                                          <Card className="border-border/30">
                                            <CardContent className="p-3">
                                              <div className={cn("flex items-start gap-3", isRTL && "flex-row-reverse")}>
                                                <div className={cn(
                                                  "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                                                  exercise.submissionStatus === "graded" ? "bg-emerald-100 dark:bg-emerald-900/30" :
                                                  exercise.submissionStatus === "submitted" ? "bg-amber-100 dark:bg-amber-900/30" :
                                                  exercise.submissionStatus === "late" ? "bg-red-100 dark:bg-red-900/30" :
                                                  "bg-sky-100 dark:bg-sky-900/30"
                                                )}>
                                                  <StatusIcon className="w-4 h-4" />
                                                </div>
                                                <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                                                  <h5 className="text-sm font-semibold text-foreground truncate">{exerciseTitle}</h5>
                                                  <div className={cn("flex items-center gap-2 mt-1.5 flex-wrap", isRTL && "flex-row-reverse justify-end")}>
                                                    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold", statusConfig.color)}>
                                                      {statusConfig.label}
                                                    </span>
                                                    {exercise.dueDate && (
                                                      <span className={cn(
                                                        "text-[10px] flex items-center gap-1",
                                                        isPastDue && exercise.submissionStatus === "not_submitted" ? "text-red-500 font-semibold" : "text-muted-foreground"
                                                      )}>
                                                        <Clock4 className="w-3 h-3" />
                                                        {toJalaliShort(exercise.dueDate)}
                                                      </span>
                                                    )}
                                                    {exercise.submission?.grade != null && (
                                                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                                                        <Trophy className="w-3 h-3" />
                                                        {isRTL ? "نمره" : "Grade"}: {toPersianDigits(exercise.submission.grade)}
                                                      </span>
                                                    )}
                                                  </div>
                                                  {/* Feedback from instructor */}
                                                  {exercise.submission?.feedback && (
                                                    <div className={cn("mt-2 p-2 rounded-lg bg-muted/50 border border-border/20", isRTL && "text-right")}>
                                                      <p className="text-[9px] text-muted-foreground font-semibold mb-0.5">{isRTL ? "بازخورد استاد" : "Instructor Feedback"}</p>
                                                      <p className="text-[10px] text-foreground leading-relaxed">{exercise.submission.feedback}</p>
                                                    </div>
                                                  )}
                                                  {/* Submit button */}
                                                  {canSubmit && (
                                                    <Button
                                                      size="sm"
                                                      className="mt-2 h-7 text-[10px] rounded-lg gap-1"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSubmitExerciseId(exercise.id);
                                                        setSubmitNotes("");
                                                        setSubmitDialogOpen(true);
                                                      }}
                                                    >
                                                      <Send className="w-3 h-3" />
                                                      {isRTL ? "ارسال تمرین" : "Submit"}
                                                    </Button>
                                                  )}
                                                </div>
                                              </div>
                                            </CardContent>
                                          </Card>
                                        </motion.div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* ─── Recommendations Tab ───────────── */}
                <TabsContent value="recommendations" className="flex-1 overflow-hidden mt-0">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-3">
                      {recommendationsLoading ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map(i => (
                            <Card key={i} className="border-border/30">
                              <CardContent className="p-4">
                                <Skeleton className="h-4 w-3/4 mb-2" />
                                <Skeleton className="h-3 w-1/2 mb-2" />
                                <Skeleton className="h-3 w-1/3" />
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : recommendations.length === 0 ? (
                        <div className="text-center py-10">
                          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
                            <Sparkles className="w-7 h-7 text-muted-foreground/40" />
                          </div>
                          <p className="text-sm text-muted-foreground font-medium">
                            {isRTL ? "هنوز پیشنهادی وجود ندارد" : "No recommendations yet"}
                          </p>
                          <p className="text-xs text-muted-foreground/60 mt-1">
                            {isRTL ? "با ثبت‌نام در دوره‌ها، پیشنهادهای شخصی‌سازی شده نمایش داده می‌شود" : "Personalized recommendations will appear as you enroll in courses"}
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className={cn("flex items-center gap-2 mb-2", isRTL && "flex-row-reverse")}>
                            <Sparkles className="w-4 h-4 text-primary" />
                            <p className="text-xs text-muted-foreground">
                              {isRTL ? "بر اساس علاقه‌مندی‌های شما" : "Based on your interests"}
                            </p>
                          </div>
                          <div className="space-y-2">
                            {recommendations.map((rec, i) => {
                              const data = rec.data as Record<string, unknown>;
                              const title = isRTL ? (data.titleFa as string || "—") : (data.titleEn as string || "—");
                              const instrument = data.instrument as string | null;
                              const level = data.level as string | null;
                              const price = data.price as number | null;
                              const isFeatured = data.isFeatured as boolean | false;
                              const category = data.category as string | null;
                              const branch = data.branch as { nameFa: string; nameEn: string } | null;
                              const workshopId = rec.type === "workshop" ? String(data.id || "") : "";
                              const workshopAvailability = rec.type === "workshop"
                                ? getWorkshopAvailability({
                                    registrationOpen: Boolean(data.registrationOpen),
                                    reservedSeats: Number(data.reservedSeats || 0),
                                    totalSeats: Number(data.totalSeats || 0),
                                  })
                                : null;

                              return (
                                <motion.div
                                  key={`${rec.type}-${i}`}
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.05 }}
                                >
                                  <Card className="border-border/30 hover:border-primary/20 transition-all">
                                    <CardContent className="p-3">
                                      <div className={cn("flex items-start gap-3", isRTL && "flex-row-reverse")}>
                                        <div className={cn(
                                          "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                                          rec.type === "course" ? "bg-primary/10" : "bg-purple-100 dark:bg-purple-900/30"
                                        )}>
                                          {rec.type === "course" ? (
                                            <BookOpen className="w-4 h-4 text-primary" />
                                          ) : (
                                            <Star className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                          )}
                                        </div>
                                        <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                                          <h5 className="text-sm font-semibold text-foreground truncate">{title}</h5>
                                          <div className={cn("flex items-center gap-2 mt-1 flex-wrap", isRTL && "flex-row-reverse justify-end")}>
                                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
                                              {rec.type === "course" ? (isRTL ? "دوره" : "Course") : (isRTL ? "ورکشاپ" : "Workshop")}
                                            </span>
                                            {instrument && (
                                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                                <Music className="w-3 h-3" />
                                                {instrument}
                                              </span>
                                            )}
                                            {level && (
                                              <span className="text-[10px] text-muted-foreground">{levelLabel(level, isRTL)}</span>
                                            )}
                                            {isFeatured && (
                                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-semibold flex items-center gap-0.5">
                                                <Star className="w-2.5 h-2.5" />
                                                {isRTL ? "ویژه" : "Featured"}
                                              </span>
                                            )}
                                          </div>
                                          <div className={cn("flex items-center gap-2 mt-1 flex-wrap", isRTL && "flex-row-reverse justify-end")}>
                                            {price != null && (
                                              <span className="text-[10px] text-muted-foreground">
                                                {formatToman(price, isRTL)}
                                              </span>
                                            )}
                                            {branch && (
                                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                                <MapPin className="w-3 h-3" />
                                                {isRTL ? branch.nameFa : branch.nameEn}
                                              </span>
                                            )}
                                            {category && (
                                              <span className="text-[10px] text-muted-foreground">{category}</span>
                                            )}
                                          </div>
                                          {rec.type === "workshop" && workshopAvailability && (
                                            <div className={cn("mt-2 flex items-center justify-between gap-2", isRTL && "flex-row-reverse")}>
                                              <span className={cn(
                                                "text-[10px] font-medium",
                                                workshopAvailability.state === "available" ? "text-emerald-600 dark:text-emerald-400" :
                                                workshopAvailability.state === "full" ? "text-red-600 dark:text-red-400" :
                                                "text-muted-foreground"
                                              )}>
                                                {workshopAvailability.state === "available"
                                                  ? (isRTL ? `${toPersianDigits(workshopAvailability.remainingSeats)} ظرفیت باقی‌مانده` : `${workshopAvailability.remainingSeats} seats left`)
                                                  : workshopAvailability.state === "full"
                                                  ? (isRTL ? "ظرفیت تکمیل است" : "Fully booked")
                                                  : (isRTL ? "ثبت‌نام بسته است" : "Registration closed")}
                                              </span>
                                              <Button
                                                type="button"
                                                size="sm"
                                                className="h-7 rounded-lg px-2 text-[10px]"
                                                disabled={workshopAvailability.state !== "available" || workshopReservingId === workshopId}
                                                onClick={() => handleWorkshopReserve(workshopId)}
                                              >
                                                {workshopReservingId === workshopId && <Loader2 className="me-1 h-3 w-3 animate-spin" />}
                                                {isRTL ? "رزرو کارگاه" : "Reserve"}
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              );
                            })}
                          </div>
                          {/* Register CTA */}
                          <Button
                            onClick={() => setRegisterDialogOpen(true)}
                            className="w-full rounded-xl gap-2 h-10 mt-2"
                            variant="outline"
                          >
                            <Plus className="w-4 h-4" />
                            {isRTL ? "ثبت‌نام در کلاس جدید" : "Register for New Class"}
                          </Button>
                        </>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* ─── Announcements Tab ───────────── */}
                <TabsContent value="announcements" className="flex-1 overflow-hidden mt-0">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-3">
                      {announcementsLoading ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map(i => (
                            <Card key={i} className="border-border/30">
                              <CardContent className="p-4">
                                <Skeleton className="h-4 w-3/4 mb-2" />
                                <Skeleton className="h-3 w-full mb-2" />
                                <Skeleton className="h-3 w-1/3" />
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : announcements.length === 0 ? (
                        <div className="text-center py-10">
                          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
                            <Megaphone className="w-7 h-7 text-muted-foreground/40" />
                          </div>
                          <p className="text-sm text-muted-foreground font-medium">
                            {isRTL ? "اطلاعیه‌ای موجود نیست" : "No announcements"}
                          </p>
                          <p className="text-xs text-muted-foreground/60 mt-1">
                            {isRTL ? "اطلاعیه‌های جدید اینجا نمایش داده می‌شود" : "New announcements will appear here"}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {announcements.map((announcement, i) => {
                            const typeConfig = announcementTypeConfig(announcement.type, isRTL);
                            const title = isRTL ? announcement.titleFa : announcement.titleEn;
                            const content = isRTL ? announcement.contentFa : announcement.contentEn;

                            return (
                              <motion.div
                                key={announcement.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                              >
                                <Card
                                  className={cn(
                                    "border-border/30 hover:border-primary/20 transition-all cursor-pointer",
                                    announcement.isPinned && "border-primary/30 bg-primary/[0.02]"
                                  )}
                                  onClick={() => setAnnouncementDetailId(announcement.id)}
                                >
                                  <CardContent className="p-3">
                                    <div className={cn("flex items-start gap-3", isRTL && "flex-row-reverse")}>
                                      <div className={cn(
                                        "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                                        announcement.isPinned ? "bg-primary/10" : "bg-muted/50"
                                      )}>
                                        {announcement.isPinned ? (
                                          <Bell className="w-4 h-4 text-primary" />
                                        ) : (
                                          <Megaphone className="w-4 h-4 text-muted-foreground" />
                                        )}
                                      </div>
                                      <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                                        <h5 className="text-sm font-semibold text-foreground truncate">{title}</h5>
                                        {content && (
                                          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{content}</p>
                                        )}
                                        <div className={cn("flex items-center gap-2 mt-1.5 flex-wrap", isRTL && "flex-row-reverse justify-end")}>
                                          <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold", typeConfig.color)}>
                                            {typeConfig.label}
                                          </span>
                                          <span className="text-[10px] text-muted-foreground">
                                            {toJalaliShort(announcement.createdAt)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>

            {/* ─── Class Detail Dialog ────────── */}
            <Dialog open={!!classDetailId} onOpenChange={(open) => { if (!open) setClassDetailId(null); }}>
              <DialogContent className={cn("max-w-md", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                <DialogHeader>
                  <DialogTitle className="sr-only">
                    {classDetail ? (isRTL ? classDetail.course.titleFa : classDetail.course.titleEn) : ""}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    {isRTL ? "جزئیات کلاس و وضعیت شما" : "Class details and your status"}
                  </DialogDescription>
                </DialogHeader>
                {classDetail && (
                  <>
                    {/* Visible title */}
                    <h3 className="text-lg font-bold text-foreground">
                      {isRTL ? classDetail.course.titleFa : classDetail.course.titleEn}
                    </h3>
                    <p className="text-xs text-muted-foreground">{isRTL ? "جزئیات کلاس و وضعیت شما" : "Class details and your status"}</p>

                    <div className="space-y-4 mt-4">
                      {/* Instructor */}
                      {classDetail.course.instructor && (
                        <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {classDetail.course.instructor.avatarUrl ? (
                              <img src={classDetail.course.instructor.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <User className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <div className={cn(isRTL && "text-right")}>
                            <p className="text-sm font-semibold">{classDetail.course.instructor.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {isRTL ? (classDetail.course.instructor.specialtyFa || "استاد") : (classDetail.course.instructor.specialtyEn || "Instructor")}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Info grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-muted/50 p-2.5">
                          <p className="text-[10px] text-muted-foreground mb-0.5">{isRTL ? "نوع کلاس" : "Class Type"}</p>
                          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold", classTypeConfig(classDetail.course.classType, isRTL).color)}>
                            {classTypeConfig(classDetail.course.classType, isRTL).label}
                          </span>
                        </div>
                        <div className="rounded-xl bg-muted/50 p-2.5">
                          <p className="text-[10px] text-muted-foreground mb-0.5">{isRTL ? "سطح" : "Level"}</p>
                          <p className="text-xs font-medium">{levelLabel(classDetail.course.level, isRTL)}</p>
                        </div>
                        <div className="rounded-xl bg-muted/50 p-2.5">
                          <p className="text-[10px] text-muted-foreground mb-0.5">{isRTL ? "وضعیت پرداخت" : "Payment"}</p>
                          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold", paymentStatusConfig(classDetail.paymentStatus, isRTL).color)}>
                            {paymentStatusConfig(classDetail.paymentStatus, isRTL).label}
                          </span>
                        </div>
                        <div className="rounded-xl bg-muted/50 p-2.5">
                          <p className="text-[10px] text-muted-foreground mb-0.5">{isRTL ? "تاریخ ثبت‌نام" : "Enrolled"}</p>
                          <p className="text-xs font-medium">{toJalali(classDetail.enrolledAt)}</p>
                        </div>
                      </div>

                      {/* Tuition */}
                      {classDetail.tuitionAmount != null && (
                        <div className="rounded-xl bg-muted/50 p-2.5">
                          <p className="text-[10px] text-muted-foreground mb-0.5">{isRTL ? "شهریه" : "Tuition"}</p>
                          <p className="text-xs font-bold">{formatToman(classDetail.tuitionAmount, isRTL)}</p>
                        </div>
                      )}

                      {/* Sessions info */}
                      {(classDetail.course.sessionsMin || classDetail.course.sessionsMax) && (
                        <div className="rounded-xl bg-muted/50 p-2.5">
                          <p className="text-[10px] text-muted-foreground mb-0.5">{isRTL ? "تعداد جلسات" : "Sessions"}</p>
                          <p className="text-xs font-medium">
                            {classDetail.course.sessionsMin === classDetail.course.sessionsMax
                              ? toPersianDigits(classDetail.course.sessionsMin || 0)
                              : `${toPersianDigits(classDetail.course.sessionsMin || 0)} - ${toPersianDigits(classDetail.course.sessionsMax || 0)}`
                            }
                          </p>
                        </div>
                      )}

                      {/* Schedules */}
                      {classDetail.course.schedules.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">{isRTL ? "برنامه کلاس" : "Class Schedule"}</p>
                          <div className="space-y-1.5">
                            {classDetail.course.schedules.map(s => (
                              <div key={s.id} className={cn("flex items-center gap-2 text-xs", isRTL && "flex-row-reverse")}>
                                <Badge variant="outline" className="text-[10px] h-5">
                                  {isRTL ? DAY_NAMES_FA[s.dayOfWeek] : DAY_NAMES_EN[s.dayOfWeek]}
                                </Badge>
                                <span className="text-muted-foreground" dir="ltr">{s.startTime} - {s.endTime}</span>
                                {s.room && <span className="text-muted-foreground">({s.room})</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Progress */}
                      <div>
                        <div className={cn("flex items-center justify-between mb-1", isRTL && "flex-row-reverse")}>
                          <span className="text-xs text-muted-foreground">{isRTL ? "پیشرفت" : "Progress"}</span>
                          <span className="text-xs font-semibold">{toPersianDigits(classDetail.progress)}٪</span>
                        </div>
                        <Progress value={classDetail.progress} className="h-2" />
                      </div>

                      {/* Branch */}
                      {classDetail.course.branch && (
                        <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", isRTL && "flex-row-reverse")}>
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span>{isRTL ? classDetail.course.branch.nameFa : classDetail.course.branch.nameEn}</span>
                          {classDetail.course.branch.addressFa && (
                            <span className="text-muted-foreground/60">• {isRTL ? classDetail.course.branch.addressFa : classDetail.course.branch.addressEn}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>

            {/* ─── Exercise Submit Dialog ────────── */}
            <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
              <DialogContent className={cn("max-w-md", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                <DialogHeader>
                  <DialogTitle className="sr-only">
                    {isRTL ? "ارسال تمرین" : "Submit Exercise"}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    {isRTL ? "توضیحات تمرین خود را وارد کنید" : "Enter your exercise notes"}
                  </DialogDescription>
                </DialogHeader>
                <h3 className="text-lg font-bold text-foreground">
                  {isRTL ? "ارسال تمرین" : "Submit Exercise"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isRTL ? "توضیحات تمرین خود را وارد کنید" : "Enter your exercise notes"}
                </p>

                <div className="space-y-3 mt-4">
                  <Textarea
                    placeholder={isRTL ? "یادداشت یا توضیحات تمرین خود را بنویسید..." : "Write your exercise notes or description..."}
                    value={submitNotes}
                    onChange={(e) => setSubmitNotes(e.target.value)}
                    className="min-h-[100px] resize-none"
                    dir={isRTL ? "rtl" : "ltr"}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    {isRTL ? "با ارسال تمرین، استاد شما از ثبت آن مطلع می‌شود" : "By submitting, your instructor will be notified"}
                  </p>
                </div>

                <DialogFooter className={cn(isRTL && "flex-row-reverse")}>
                  <Button
                    variant="outline"
                    onClick={() => { setSubmitDialogOpen(false); setSubmitExerciseId(null); setSubmitNotes(""); }}
                    className="rounded-xl"
                  >
                    {isRTL ? "انصراف" : "Cancel"}
                  </Button>
                  <Button
                    onClick={handleSubmitExercise}
                    disabled={submitting}
                    className="rounded-xl gap-2"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {submitting
                      ? (isRTL ? "در حال ارسال..." : "Submitting...")
                      : (isRTL ? "ارسال تمرین" : "Submit Exercise")
                    }
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* ─── Announcement Detail Dialog ────────── */}
            <Dialog open={!!announcementDetailId} onOpenChange={(open) => { if (!open) setAnnouncementDetailId(null); }}>
              <DialogContent className={cn("max-w-md", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                <DialogHeader>
                  <DialogTitle className="sr-only">
                    {announcementDetail ? (isRTL ? announcementDetail.titleFa : announcementDetail.titleEn) : ""}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    {isRTL ? "جزئیات اطلاعیه" : "Announcement details"}
                  </DialogDescription>
                </DialogHeader>
                {announcementDetail && (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold",
                        announcementTypeConfig(announcementDetail.type, isRTL).color
                      )}>
                        {announcementTypeConfig(announcementDetail.type, isRTL).label}
                      </span>
                      {announcementDetail.isPinned && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-primary font-semibold">
                          <Bell className="w-3 h-3" />
                          {isRTL ? "سنجاق شده" : "Pinned"}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-foreground">
                      {isRTL ? announcementDetail.titleFa : announcementDetail.titleEn}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {toJalali(announcementDetail.createdAt)}
                    </p>
                    {announcementDetail.imageUrl && (
                      <img
                        src={announcementDetail.imageUrl}
                        alt={isRTL ? announcementDetail.titleFa : announcementDetail.titleEn}
                        className="w-full rounded-xl mt-2 object-cover max-h-[200px]"
                      />
                    )}
                    {(announcementDetail.contentFa || announcementDetail.contentEn) && (
                      <div className={cn("mt-3 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap", isRTL && "text-right")}>
                        {isRTL ? announcementDetail.contentFa : announcementDetail.contentEn}
                      </div>
                    )}
                  </>
                )}
              </DialogContent>
            </Dialog>

            {/* ─── Registration Dialog ────────── */}
            <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
              <DialogContent className={cn("max-w-md max-h-[85vh]", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                <DialogHeader>
                  <DialogTitle className="sr-only">
                    {isRTL ? "ثبت‌نام در کلاس جدید" : "Register for New Class"}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    {registerSuccess
                      ? (isRTL ? "ثبت‌نام شما با موفقیت انجام شد" : "Registration successful")
                      : (isRTL ? "کلاس مورد نظر خود را انتخاب کنید" : "Choose a class to register")
                    }
                  </DialogDescription>
                </DialogHeader>

                {registerSuccess ? (
                  <div className="text-center py-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 15 }}
                    >
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                      </div>
                    </motion.div>
                    <h3 className="text-lg font-bold text-foreground mb-1">
                      {isRTL ? "ثبت نام شما با موفقیت انجام شد" : "Registration Successful"}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {isRTL
                        ? "و به زودی همکاران ما با شما تماس خواهند گرفت"
                        : "Our team will contact you shortly"
                      }
                    </p>
                    <Button
                      className="mt-4 rounded-xl"
                      onClick={() => {
                        setRegisterDialogOpen(false);
                        setRegisterSuccess(false);
                      }}
                    >
                      {isRTL ? "بستن" : "Close"}
                    </Button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-foreground">
                      {isRTL ? "ثبت‌نام در کلاس جدید" : "Register for New Class"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {isRTL ? "کلاس مورد نظر خود را انتخاب کنید" : "Choose a class to register"}
                    </p>

                    {coursesLoading ? (
                      <div className="space-y-3 py-2">
                        {[1, 2, 3].map(i => (
                          <Skeleton key={i} className="h-16 w-full rounded-xl" />
                        ))}
                      </div>
                    ) : availableCourses.length === 0 ? (
                      <div className="text-center py-6">
                        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-muted-foreground/40" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {isRTL ? "در حال حاضر کلاسی برای ثبت‌نام موجود نیست" : "No classes available for registration"}
                        </p>
                      </div>
                    ) : (
                      <ScrollArea className="max-h-[45vh]">
                        <div className="space-y-2 pr-1">
                          {availableCourses.map(course => {
                            const courseTitle = isRTL ? course.titleFa : course.titleEn;
                            const ctConfig = classTypeConfig(course.classType, isRTL);
                            const isSelected = selectedCourseId === course.id;
                            const instructorName = course.instructor?.name || (isRTL ? "نامشخص" : "Unknown");

                            return (
                              <Card
                                key={course.id}
                                className={cn(
                                  "border-border/30 cursor-pointer transition-all",
                                  isSelected ? "border-primary ring-1 ring-primary/30 bg-primary/5" : "hover:border-primary/20"
                                )}
                                onClick={() => setSelectedCourseId(course.id)}
                              >
                                <CardContent className="p-3">
                                  <div className={cn("flex items-start gap-3", isRTL && "flex-row-reverse")}>
                                    <div className={cn(
                                      "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                                      isSelected ? "bg-primary text-primary-foreground" : "bg-primary/10"
                                    )}>
                                      {isSelected ? (
                                        <CheckCircle2 className="w-4 h-4" />
                                      ) : (
                                        <Music className="w-4 h-4 text-primary" />
                                      )}
                                    </div>
                                    <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                                      <h5 className="text-sm font-semibold text-foreground truncate">{courseTitle}</h5>
                                      <div className={cn("flex items-center gap-2 mt-1 flex-wrap", isRTL && "flex-row-reverse justify-end")}>
                                        <span className="text-[10px] text-muted-foreground">
                                          {instructorName}
                                        </span>
                                        <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold", ctConfig.color)}>
                                          {ctConfig.label}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                          {levelLabel(course.level, isRTL)}
                                        </span>
                                      </div>
                                      {course.price != null && (
                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                          {formatToman(course.price, isRTL)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    )}

                    {/* Error message */}
                    {registerError && (
                      <div className={cn("flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-xs", isRTL && "flex-row-reverse")}>
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{registerError}</span>
                      </div>
                    )}

                    {/* Auto-fill notice */}
                    {selectedCourseId && (
                      <div className={cn("flex items-center gap-2 p-2.5 rounded-xl bg-primary/5 text-xs text-muted-foreground", isRTL && "flex-row-reverse")}>
                        <PenLine className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span>{isRTL ? "اطلاعات شما از پروفایل تکمیل می‌شود" : "Your info will be auto-filled from profile"}</span>
                      </div>
                    )}

                    <DialogFooter className={cn(isRTL && "flex-row-reverse")}>
                      <Button
                        variant="outline"
                        onClick={() => setRegisterDialogOpen(false)}
                        className="rounded-xl"
                      >
                        {isRTL ? "انصراف" : "Cancel"}
                      </Button>
                      <Button
                        onClick={handleRegister}
                        disabled={!selectedCourseId || registering}
                        className="rounded-xl gap-2"
                      >
                        {registering ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        {registering
                          ? (isRTL ? "در حال ثبت‌نام..." : "Registering...")
                          : (isRTL ? "تأیید و ثبت‌نام" : "Confirm & Register")
                        }
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
