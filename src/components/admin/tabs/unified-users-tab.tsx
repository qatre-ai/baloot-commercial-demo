"use client";
import { authFetch } from "@/lib/auth/store";
import { useAdminPermissions } from "@/lib/auth/use-admin-permissions";
import { AccessDenied } from "@/components/admin/access-denied";

import React, { useState, useEffect, useCallback } from "react";
import { deferEffect } from "@/lib/react/defer-effect";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { RegistrationForm } from "@/components/auth/registration-form";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import { formatJalaaliDate, toPersianDigits } from "@/lib/jalali";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
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
import {
  Users, Shield, Key, Plus, Trash2, Edit3, Search, RefreshCw,
  CheckCircle2, XCircle, AlertTriangle, Clock, Eye, Save, Loader2,
  ShieldCheck, Zap, ChevronDown, GraduationCap, Receipt,
  Lock, UserCheck, PhoneCall, Monitor, DollarSign, Music,
} from "lucide-react";

// Debounce a value — used to throttle search inputs that drive fetches
function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ============================================
// TYPES
// ============================================
interface UserEntry {
  id: string; name: string; email: string; phone: string | null;
  primaryInstrument: string | null; registrationInstrument: string | null;
  role: string; isActive: boolean; isVerified: boolean;
  createdAt: string; lastLogin: string | null;
  leadScore: number; aiSegmentTag: string | null;
  specialtyFa: string | null; isPublishedInstructor: boolean;
  skillLevel: string | null; gender: string | null;
  registrationStatus: string | null;
  _count: { enrollments: number; tickets: number; taughtCourses: number };
  enrollments: Array<{
    id: string; registrationMethod: string; paymentStatus: string;
    course: { id: string; titleFa: string; titleEn: string };
  }>;
}

interface UserDetail {
  id: string; name: string; email: string; phone: string | null;
  avatarUrl: string | null; dateOfBirth: string | null; gender: string | null;
  nationalId: string | null; educationLevel: string | null; fieldOfStudy: string | null;
  primaryInstrument: string | null; secondaryInstruments: string | null;
  musicExperienceYears: number | null; previousTraining: string | null;
  musicGenres: string | null; learningGoals: string | null;
  practiceHoursPerWeek: number | null; skillLevel: string | null;
  address: string | null; city: string | null; province: string | null;
  parentName: string | null; parentPhone: string | null;
  parentRelation: string | null; parentEmail: string | null;
  referralSource: string | null; referralDetail: string | null;
  leadScore: number; customerLifetimeValue: number; churnRisk: string | null;
  engagementScore: number; aiSegmentTag: string | null; tags: string | null;
  specialtyFa: string | null; specialtyEn: string | null;
  bioFa: string | null; bioEn: string | null;
  experience: string | null; isPublishedInstructor: boolean;
  notes: string | null; emergencyContact: string | null;
  role: string; isActive: boolean; isVerified: boolean;
  lastLogin: string | null; lastLoginIp: string | null;
  createdAt: string; updatedAt: string;
  enrollments: Array<{
    id: string; status: string; progress: number; enrolledAt: string;
    course: { id: string; titleFa: string; titleEn: string; instrument: string | null; level: string };
  }>;
  tickets: Array<{
    id: string; status: string; seatNumber: number | null;
    workshop: { id: string; titleFa: string; titleEn: string; date: string };
  }>;
  _count: { loginSessions: number; enrollments: number; tickets: number; taughtCourses: number };
}

interface AdminEntry {
  id: string; name: string; email: string; role: string;
  isActive: boolean; phone: string | null;
  twoFactorEnabled: boolean; lastLoginAt: string | null;
  lastLoginIp: string | null; mustChangePassword: boolean;
  failedLoginAttempts: number; lockedUntil: string | null;
  createdAt: string;
  _count: { permissions: number; auditLogs: number };
  permissions: Array<{ id: string; resource: string; action: string; granted: boolean }>;
}

// ============================================
// CONSTANTS
// ============================================
const RESOURCE_CATEGORIES = [
  { key: "people", labelFa: "👥 مدیریت افراد", labelEn: "👥 People Management" },
  { key: "content", labelFa: "📝 مدیریت محتوا", labelEn: "📝 Content Management" },
  { key: "operations", labelFa: "⚙️ عملیات", labelEn: "⚙️ Operations" },
  { key: "system", labelFa: "🔒 سیستم و امنیت", labelEn: "🔒 System & Security" },
];

const RESOURCES = [
  { key: "users", labelFa: "کاربران", labelEn: "Users", descFa: "مدیریت هنرجویان و مدرسین", descEn: "Manage students & instructors", category: "people" },
  { key: "instructors", labelFa: "مدرسین", labelEn: "Instructors", descFa: "مدیریت پروفایل مدرسین", descEn: "Manage instructor profiles", category: "people" },
  { key: "enrollments", labelFa: "ثبت‌نام‌ها", labelEn: "Enrollments", descFa: "مدیریت ثبت‌نام دوره‌ها", descEn: "Manage course enrollments", category: "people" },
  { key: "payments", labelFa: "پرداخت‌ها", labelEn: "Payments", descFa: "مدیریت شهریه و پرداخت‌ها", descEn: "Manage tuition & payments", category: "people" },
  { key: "testimonials", labelFa: "بازخوردها", labelEn: "Testimonials", descFa: "مدیریت نظرات و بازخوردها", descEn: "Manage reviews & testimonials", category: "people" },
  { key: "courses", labelFa: "دوره‌ها", labelEn: "Courses", descFa: "مدیریت دوره‌های آموزشی", descEn: "Manage courses", category: "content" },
  { key: "workshops", labelFa: "کارگاه‌ها", labelEn: "Workshops", descFa: "مدیریت کارگاه‌ها", descEn: "Manage workshops", category: "content" },
  { key: "blog", labelFa: "بلاگ", labelEn: "Blog", descFa: "مدیریت مقالات بلاگ", descEn: "Manage blog posts", category: "content" },
  { key: "announcements", labelFa: "اعلانات", labelEn: "Announcements", descFa: "مدیریت اعلانات و اخبار", descEn: "Manage announcements", category: "content" },
  { key: "media", labelFa: "رسانه", labelEn: "Media", descFa: "مدیریت تصاویر و فایل‌ها", descEn: "Manage images & files", category: "content" },
  { key: "newsletter", labelFa: "خبرنامه", labelEn: "Newsletter", descFa: "مدیریت خبرنامه", descEn: "Manage newsletter", category: "content" },
  { key: "schedules", labelFa: "برنامه کلاس‌ها", labelEn: "Schedules", descFa: "مدیریت برنامه و ساعات کلاس", descEn: "Manage class schedules", category: "operations" },
  { key: "branches", labelFa: "شعب", labelEn: "Branches", descFa: "مدیریت شعب", descEn: "Manage branches", category: "operations" },
  { key: "messages", labelFa: "پیام‌های تماس", labelEn: "Contact Messages", descFa: "مشاهده پیام‌های فرم تماس", descEn: "View contact form messages", category: "operations" },
  { key: "settings", labelFa: "تنظیمات سایت", labelEn: "Site Settings", descFa: "تنظیمات عمومی وبسایت", descEn: "General site settings", category: "system" },
  { key: "analytics", labelFa: "تحلیل‌ها", labelEn: "Analytics", descFa: "مشاهده آمار و تحلیل‌ها", descEn: "View analytics & stats", category: "system" },
  { key: "backups", labelFa: "بکاپ‌ها", labelEn: "Backups", descFa: "مدیریت پشتیبان‌گیری", descEn: "Manage backups", category: "system" },
  { key: "security", labelFa: "امنیت", labelEn: "Security", descFa: "مدیریت امنیت و دسترسی", descEn: "Manage security & access", category: "system" },
  { key: "audit_logs", labelFa: "لاگ فعالیت", labelEn: "Audit Logs", descFa: "مشاهده لاگ فعالیت‌ها", descEn: "View activity logs", category: "system" },
];

const ACTIONS = [
  { key: "create", labelFa: "ایجاد", labelEn: "Create", descFa: "ساخت مورد جدید", descEn: "Create new items" },
  { key: "read", labelFa: "مشاهده", labelEn: "Read", descFa: "مشاهده اطلاعات", descEn: "View information" },
  { key: "update", labelFa: "ویرایش", labelEn: "Update", descFa: "تغییر اطلاعات", descEn: "Edit information" },
  { key: "delete", labelFa: "حذف", labelEn: "Delete", descFa: "حذف مورد", descEn: "Delete items" },
  { key: "publish", labelFa: "انتشار", labelEn: "Publish", descFa: "انتشار یا عدم انتشار", descEn: "Publish or unpublish" },
  { key: "manage", labelFa: "مدیریت", labelEn: "Manage", descFa: "مدیریت کامل بخش", descEn: "Full section management" },
  { key: "feature", labelFa: "ویژه", labelEn: "Feature", descFa: "برجسته کردن", descEn: "Mark as featured" },
  { key: "approve", labelFa: "تأیید", labelEn: "Approve", descFa: "تأیید یا رد درخواست", descEn: "Approve or reject" },
  { key: "export", labelFa: "خروجی", labelEn: "Export", descFa: "دریافت خروجی اطلاعات", descEn: "Export data" },
  { key: "assign", labelFa: "تخصیص", labelEn: "Assign", descFa: "تخصیص به کاربر یا دوره", descEn: "Assign to user/course" },
];

const PERMISSION_TEMPLATES = [
  {
    key: "content_manager", labelFa: "مدیر محتوا", labelEn: "Content Manager",
    descFa: "مدیریت کامل محتوا (بلاگ، اعلانات، رسانه)", descEn: "Full content management (blog, announcements, media)",
    permissions: [
      { resource: "blog", actions: ["create", "read", "update", "delete", "publish", "feature"] },
      { resource: "announcements", actions: ["create", "read", "update", "delete", "publish", "feature"] },
      { resource: "media", actions: ["create", "read", "update", "delete"] },
      { resource: "newsletter", actions: ["read", "create", "update", "export"] },
      { resource: "courses", actions: ["read"] },
      { resource: "workshops", actions: ["read"] },
    ],
  },
  {
    key: "finance_manager", labelFa: "مدیر مالی", labelEn: "Finance Manager",
    descFa: "مدیریت پرداخت‌ها، شهریه و ثبت‌نام‌ها", descEn: "Manage payments, tuition & enrollments",
    permissions: [
      { resource: "payments", actions: ["read", "update", "manage", "export"] },
      { resource: "enrollments", actions: ["read", "update", "manage", "assign"] },
      { resource: "users", actions: ["read"] },
      { resource: "courses", actions: ["read"] },
      { resource: "workshops", actions: ["read"] },
    ],
  },
  {
    key: "registration_officer", labelFa: "مسئول ثبت‌نام", labelEn: "Registration Officer",
    descFa: "ثبت‌نام هنرجویان و مدیریت دوره‌ها", descEn: "Register students & manage courses",
    permissions: [
      { resource: "users", actions: ["create", "read", "update"] },
      { resource: "enrollments", actions: ["create", "read", "update", "assign"] },
      { resource: "courses", actions: ["read"] },
      { resource: "workshops", actions: ["read"] },
      { resource: "schedules", actions: ["read"] },
    ],
  },
  {
    key: "instructor_manager", labelFa: "مدیر مدرسین", labelEn: "Instructor Manager",
    descFa: "مدیریت مدرسین و برنامه کلاس‌ها", descEn: "Manage instructors & class schedules",
    permissions: [
      { resource: "instructors", actions: ["read", "update", "manage"] },
      { resource: "schedules", actions: ["create", "read", "update", "delete", "manage"] },
      { resource: "courses", actions: ["read", "update"] },
      { resource: "users", actions: ["read"] },
    ],
  },
  {
    key: "support_agent", labelFa: "پشتیبان", labelEn: "Support Agent",
    descFa: "مشاهده اطلاعات و پاسخ به پیام‌ها", descEn: "View info & respond to messages",
    permissions: [
      { resource: "users", actions: ["read"] },
      { resource: "messages", actions: ["read", "update"] },
      { resource: "enrollments", actions: ["read"] },
      { resource: "courses", actions: ["read"] },
      { resource: "workshops", actions: ["read"] },
      { resource: "testimonials", actions: ["read", "approve"] },
    ],
  },
  {
    key: "full_access", labelFa: "دسترسی کامل", labelEn: "Full Access",
    descFa: "دسترسی کامل به همه بخش‌ها (به جز حذف)", descEn: "Full access to all sections (except delete)",
    permissions: RESOURCES.map(r => ({
      resource: r.key,
      actions: ACTIONS.filter(a => a.key !== "delete").map(a => a.key),
    })),
  },
];

const REGISTRATION_METHOD_CONFIG: Record<string, { labelFa: string; labelEn: string; color: string }> = {
  online: { labelFa: "آنلاین", labelEn: "Online", color: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  phone: { labelFa: "تلفنی", labelEn: "Phone", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  in_person: { labelFa: "حضوری", labelEn: "In-Person", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
};

const ENROLLMENT_STATUS_CONFIG: Record<string, { labelFa: string; labelEn: string; color: string }> = {
  active: { labelFa: "فعال", labelEn: "Active", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  completed: { labelFa: "تکمیل‌شده", labelEn: "Completed", color: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  paused: { labelFa: "متوقف", labelEn: "Paused", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  dropped: { labelFa: "رهاشده", labelEn: "Dropped", color: "bg-red-500/10 text-red-600 dark:text-red-400" },
};

const AI_SEGMENT_CONFIG: Record<string, { labelFa: string; labelEn: string; color: string }> = {
  active: { labelFa: "فعال", labelEn: "Active", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  at_risk: { labelFa: "در معرض خطر", labelEn: "At Risk", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  dormant: { labelFa: "غیرفعال", labelEn: "Dormant", color: "bg-slate-500/10 text-slate-600 dark:text-slate-400" },
  new: { labelFa: "جدید", labelEn: "New", color: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  vip: { labelFa: "VIP", labelEn: "VIP", color: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  champion: { labelFa: "قهرمان", labelEn: "Champion", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
};

const TICKET_STATUS_CONFIG: Record<string, { labelFa: string; labelEn: string; color: string }> = {
  reserved: { labelFa: "رزرو شده", labelEn: "Reserved", color: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  paid: { labelFa: "پرداخت‌شده", labelEn: "Paid", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  cancelled: { labelFa: "لغو شده", labelEn: "Cancelled", color: "bg-red-500/10 text-red-600 dark:text-red-400" },
  attended: { labelFa: "حاضر", labelEn: "Attended", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
};

const REG_INSTRUMENTS = [
  { value: "piano", fa: "پیانو", en: "Piano" },
  { value: "guitar", fa: "گیتار", en: "Guitar" },
  { value: "violin", fa: "ویولن", en: "Violin" },
  { value: "setar", fa: "سه‌تار", en: "Setar" },
  { value: "tar", fa: "تار", en: "Tar" },
  { value: "kamancheh", fa: "کمانچه", en: "Kamancheh" },
  { value: "drums", fa: "درامز", en: "Drums" },
  { value: "vocals", fa: "آواز", en: "Vocals" },
  { value: "santur", fa: "سنتور", en: "Santur" },
  { value: "oud", fa: "عود", en: "Oud" },
  { value: "flute", fa: "فلوت", en: "Flute" },
  { value: "daf", fa: "دف", en: "Daf" },
  { value: "tonbak", fa: "تنبک", en: "Tonbak" },
  { value: "other", fa: "سایر", en: "Other" },
];

const REG_SKILL_LEVELS = [
  { value: "beginner", fa: "مبتدی", en: "Beginner" },
  { value: "intermediate", fa: "متوسط", en: "Intermediate" },
  { value: "advanced", fa: "پیشرفته", en: "Advanced" },
  { value: "professional", fa: "حرفه‌ای", en: "Professional" },
];

const REG_GENDERS = [
  { value: "male", fa: "مرد", en: "Male" },
  { value: "female", fa: "زن", en: "Female" },
  { value: "other", fa: "سایر", en: "Other" },
  { value: "prefer_not_to_say", fa: "ترجیح می‌دهم نگویم", en: "Prefer not to say" },
];

const REG_EDUCATION_LEVELS = [
  // School levels
  { value: "preschool", fa: "پیش‌دبستان", en: "Preschool", category: "school" },
  { value: "primary", fa: "دبستان", en: "Primary School", category: "school" },
  { value: "middle_school", fa: "متوسطه اول", en: "Middle School", category: "school" },
  { value: "high_school", fa: "متوسطه دوم", en: "High School", category: "school" },
  // Degree levels
  { value: "diploma", fa: "دیپلم", en: "Diploma", category: "degree" },
  { value: "associate", fa: "کاردانی", en: "Associate", category: "degree" },
  { value: "bachelor", fa: "کارشناسی", en: "Bachelor", category: "degree" },
  { value: "master", fa: "کارشناسی ارشد", en: "Master", category: "degree" },
  { value: "phd", fa: "دکتری", en: "PhD", category: "degree" },
  { value: "other", fa: "سایر", en: "Other", category: "other" },
];

// ============================================
// HELPERS
// ============================================
function formatDate(dateStr: string, isRTL: boolean): string {
  try {
    // Try Jalali format first for RTL
    if (isRTL) {
      const jalaliFormatted = formatJalaaliDate(dateStr, isRTL, "long");
      if (jalaliFormatted && jalaliFormatted !== dateStr) return jalaliFormatted;
    }
    return new Date(dateStr).toLocaleDateString(isRTL ? "fa-IR" : "en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch { return dateStr; }
}

function formatDateTime(dateStr: string, isRTL: boolean): string {
  try {
    const jalaliDate = isRTL ? formatJalaaliDate(dateStr, isRTL, "long") : null;
    const time = new Date(dateStr).toLocaleTimeString(isRTL ? "fa-IR" : "en-US", { hour: "2-digit", minute: "2-digit" });
    if (jalaliDate && jalaliDate !== dateStr) {
      return `${jalaliDate} - ${isRTL ? toPersianDigits(time) : time}`;
    }
    return new Date(dateStr).toLocaleString(isRTL ? "fa-IR" : "en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return dateStr; }
}

function formatTimeAgo(dateStr: string, isRTL: boolean): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return isRTL ? "همین الان" : "Just now";
  if (mins < 60) return isRTL ? `${mins} دقیقه پیش` : `${mins}m ago`;
  if (hours < 24) return isRTL ? `${hours} ساعت پیش` : `${hours}h ago`;
  return isRTL ? `${days} روز پیش` : `${days}d ago`;
}

function formatToman(amount: number | null, isRTL: boolean): string {
  if (amount === null || amount === undefined) return "—";
  const formatted = amount.toLocaleString(isRTL ? "fa-IR" : "en-US");
  return isRTL ? `${formatted} تومان` : `${formatted} Toman`;
}

function getRoleBadge(role: string, isRTL: boolean) {
  if (role === "instructor") return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]">{isRTL ? "مدرس" : "Instructor"}</Badge>;
  if (role === "admin" || role === "super_admin") return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px]">{isRTL ? "مدیر" : "Admin"}</Badge>;
  return <Badge className="bg-primary/10 text-primary text-[10px]">{isRTL ? "هنرجو" : "Student"}</Badge>;
}

async function logAuditAction(action: string, entity: string, entityId: string | null, details: string) {
  try {
    await authFetch("/api/admin/audit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, entity, entityId, details, severity: "warning" }),
    });
  } catch { /* silent */ }
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export function UnifiedUsersTab({ isRTL }: { isRTL: boolean }) {
  const [subTab, setSubTab] = useState<"students" | "instructors" | "admins">("students");
  const { isSuperAdmin } = useAdminPermissions();

  // Filter sub-tabs: "admins" tab is super_admin-only
  const subTabs = [
    { value: "students" as const, icon: Users, labelFa: "هنرجویان", labelEn: "Students" },
    { value: "instructors" as const, icon: Music, labelFa: "مدرسین", labelEn: "Instructors" },
    ...(isSuperAdmin ? [{ value: "admins" as const, icon: Shield, labelFa: "مدیران", labelEn: "Admins" }] : []),
  ];

  return (
    <div className="space-y-4">
      {/* Sub-tab buttons */}
      <div className={cn("flex gap-2 flex-wrap", isRTL && "flex-row-reverse")}>
        {subTabs.map((t) => {
          const Icon = t.icon;
          return (
            <Button key={t.value} size="sm" variant={subTab === t.value ? "default" : "outline"} onClick={() => setSubTab(t.value)} className="h-8">
              <Icon className="w-3.5 h-3.5 me-1.5" />
              {isRTL ? t.labelFa : t.labelEn}
            </Button>
          );
        })}
      </div>

      {/* Sub-tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={subTab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
          {subTab === "students" && <StudentsSubTab isRTL={isRTL} role="student" />}
          {subTab === "instructors" && <StudentsSubTab isRTL={isRTL} role="instructor" />}
          {subTab === "admins" && (isSuperAdmin ? <AdminsSubTab isRTL={isRTL} /> : <AccessDenied />)}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ============================================
// STUDENTS / INSTRUCTORS SUB-TAB
// ============================================
function StudentsSubTab({ isRTL, role }: { isRTL: boolean; role: "student" | "instructor" }) {
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<string>("all");
  const [filterVerified, setFilterVerified] = useState<string>("all");
  const [filterInstrument, setFilterInstrument] = useState<string>("all");
  const [filterSkillLevel, setFilterSkillLevel] = useState<string>("all");
  const [filterGender, setFilterGender] = useState<string>("all");
  const [filterAiSegment, setFilterAiSegment] = useState<string>("all");
  const [filterRegStatus, setFilterRegStatus] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const [detailUser, setDetailUser] = useState<UserDetail | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<UserDetail | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserEntry | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);
  const [deleteUser, setDeleteUser] = useState<UserEntry | null>(null);

  const debouncedSearch = useDebouncedValue(search);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(pageSize), offset: String(page * pageSize), role });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (filterActive !== "all") params.set("isActive", filterActive);
      if (filterVerified !== "all") params.set("isVerified", filterVerified);
      if (filterInstrument !== "all") params.set("instrument", filterInstrument);
      if (filterSkillLevel !== "all") params.set("skillLevel", filterSkillLevel);
      if (filterGender !== "all") params.set("gender", filterGender);
      if (filterAiSegment !== "all") params.set("aiSegmentTag", filterAiSegment);
      if (filterRegStatus !== "all") params.set("registrationStatus", filterRegStatus);
      const res = await authFetch(`/api/admin/students?${params}`);
      if (res.ok) {
        const d = await res.json();
        setUsers(d.students);
        setTotal(d.total);
      }
    } catch {
      toast.error(isRTL ? "خطا در بارگذاری" : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [isRTL, role, debouncedSearch, filterActive, filterVerified, filterInstrument, filterSkillLevel, filterGender, filterAiSegment, filterRegStatus, page]);

  useEffect(() => { deferEffect(fetchUsers); }, [fetchUsers]);

  // Reset page when filters change
  useEffect(() => {
    deferEffect(() => setPage(0));
  }, [search, filterActive, filterVerified, filterInstrument, filterSkillLevel, filterGender, filterAiSegment, filterRegStatus]);

  const fetchDetail = async (id: string) => {
    try {
      const res = await authFetch(`/api/admin/students/${id}?detailed=true`);
      if (res.ok) {
        const d = await res.json();
        setDetailUser(d.student);
      }
    } catch {
      toast.error(isRTL ? "خطا" : "Error");
    }
  };

  const toggleActive = async (id: string, isActive: boolean, name: string) => {
    try {
      const res = await authFetch(`/api/admin/students/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (res.ok) {
        toast.success(isRTL ? "وضعیت تغییر کرد" : "Status updated");
        logAuditAction("TOGGLE_ACTIVE", "user", id, `User ${name} ${isActive ? "deactivated" : "activated"}`);
        fetchUsers();
      } else {
        const d = await res.json();
        toast.error(d.error || (isRTL ? "خطا" : "Error"));
      }
    } catch {
      toast.error(isRTL ? "خطا" : "Error");
    }
  };

  const toggleVerified = async (id: string, isVerified: boolean, name: string) => {
    try {
      const res = await authFetch(`/api/admin/students/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified: !isVerified }),
      });
      if (res.ok) {
        toast.success(isRTL ? "وضعیت تأیید تغییر کرد" : "Verification status updated");
        logAuditAction("TOGGLE_VERIFIED", "user", id, `User ${name} verification ${isVerified ? "removed" : "granted"}`);
        fetchUsers();
      }
    } catch {
      toast.error(isRTL ? "خطا" : "Error");
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser || !newPassword || newPassword.length < 6) {
      toast.error(isRTL ? "رمز عبور باید حداقل ۶ کاراکتر باشد" : "Password must be at least 6 characters");
      return;
    }
    setResettingPassword(true);
    try {
      const res = await authFetch(`/api/admin/students/${resetPasswordUser.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      if (res.ok) {
        toast.success(isRTL ? `رمز عبور ${resetPasswordUser.name} بازنشانی شد` : `Password for ${resetPasswordUser.name} has been reset`);
        logAuditAction("RESET_PASSWORD", "user", resetPasswordUser.id, `Password reset for user ${resetPasswordUser.name}`);
        setResetPasswordUser(null);
        setNewPassword("");
      } else {
        const d = await res.json();
        toast.error(d.error || (isRTL ? "خطا" : "Error"));
      }
    } catch {
      toast.error(isRTL ? "خطا" : "Error");
    } finally {
      setResettingPassword(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      const res = await authFetch(`/api/admin/students/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(isRTL ? `${name} حذف شد` : `${name} deleted`);
        logAuditAction("DELETE", "user", id, `User ${name} deleted`);
        fetchUsers();
      } else {
        const d = await res.json();
        toast.error(d.error || (isRTL ? "خطا" : "Error"));
      }
    } catch {
      toast.error(isRTL ? "خطا" : "Error");
    } finally {
      setDeleteUser(null);
    }
  };

  const totalPages = Math.ceil(total / pageSize);
  const isStudent = role === "student";

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className={cn("flex flex-wrap items-center gap-2", isRTL && "flex-row-reverse")}>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute top-2.5 start-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={isRTL ? "جستجو نام، ایمیل، تلفن..." : "Search name, email, phone..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9 h-9 text-sm"
          />
        </div>
        <Button size="sm" variant="outline" className="h-9" onClick={() => setShowFilters(!showFilters)}>
          <Zap className="w-3.5 h-3.5 me-1" />
          {isRTL ? "فیلتر" : "Filter"}
        </Button>
        <Button size="sm" onClick={() => setShowCreate(true)} className="h-9">
          <Plus className="w-4 h-4 me-1" />
          {isStudent ? (isRTL ? "هنرجوی جدید" : "New Student") : (isRTL ? "مدرس جدید" : "New Instructor")}
        </Button>
        <Button size="sm" variant="outline" onClick={fetchUsers} className="h-9">
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-3 border border-border/50 rounded-xl bg-muted/20">
              <div>
                <Label className="text-[10px] text-muted-foreground">{isRTL ? "وضعیت فعالیت" : "Active Status"}</Label>
                <Select value={filterActive} onValueChange={setFilterActive}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isRTL ? "همه" : "All"}</SelectItem>
                    <SelectItem value="true">{isRTL ? "فعال" : "Active"}</SelectItem>
                    <SelectItem value="false">{isRTL ? "غیرفعال" : "Inactive"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">{isRTL ? "وضعیت تأیید" : "Verified"}</Label>
                <Select value={filterVerified} onValueChange={setFilterVerified}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isRTL ? "همه" : "All"}</SelectItem>
                    <SelectItem value="true">{isRTL ? "تأیید شده" : "Verified"}</SelectItem>
                    <SelectItem value="false">{isRTL ? "تأیید نشده" : "Unverified"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">{isRTL ? "ساز اصلی" : "Instrument"}</Label>
                <Select value={filterInstrument} onValueChange={setFilterInstrument}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isRTL ? "همه" : "All"}</SelectItem>
                    {REG_INSTRUMENTS.map((i) => (
                      <SelectItem key={i.value} value={i.value}>{isRTL ? i.fa : i.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">{isRTL ? "سطح مهارت" : "Skill Level"}</Label>
                <Select value={filterSkillLevel} onValueChange={setFilterSkillLevel}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isRTL ? "همه" : "All"}</SelectItem>
                    {REG_SKILL_LEVELS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{isRTL ? s.fa : s.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">{isRTL ? "جنسیت" : "Gender"}</Label>
                <Select value={filterGender} onValueChange={setFilterGender}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isRTL ? "همه" : "All"}</SelectItem>
                    {REG_GENDERS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>{isRTL ? g.fa : g.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">{isRTL ? "بخش AI" : "AI Segment"}</Label>
                <Select value={filterAiSegment} onValueChange={setFilterAiSegment}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isRTL ? "همه" : "All"}</SelectItem>
                    {Object.entries(AI_SEGMENT_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{isRTL ? v.labelFa : v.labelEn}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">{isRTL ? "وضعیت ثبت‌نام" : "Reg. Status"}</Label>
                <Select value={filterRegStatus} onValueChange={setFilterRegStatus}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isRTL ? "همه" : "All"}</SelectItem>
                    <SelectItem value="approved">{isRTL ? "تأیید شده" : "Approved"}</SelectItem>
                    <SelectItem value="pending">{isRTL ? "در انتظار" : "Pending"}</SelectItem>
                    <SelectItem value="rejected">{isRTL ? "رد شده" : "Rejected"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => {
                  setFilterActive("all"); setFilterVerified("all"); setFilterInstrument("all");
                  setFilterSkillLevel("all"); setFilterGender("all"); setFilterAiSegment("all");
                  setFilterRegStatus("all"); setSearch("");
                }}>
                  {isRTL ? "پاک کردن فیلترها" : "Clear Filters"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Count & Pagination Info */}
      <div className={cn("flex items-center justify-between text-xs text-muted-foreground", isRTL && "flex-row-reverse")}>
        <span>{isRTL ? `${total} ${isStudent ? "هنرجو" : "مدرس"}` : `${total} ${isStudent ? "students" : "instructors"}`}</span>
        {totalPages > 1 && (
          <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
            <Button size="sm" variant="outline" className="h-7 w-7 p-0" disabled={page === 0} onClick={() => setPage(page - 1)}>‹</Button>
            <span className="px-2">{page + 1} / {totalPages}</span>
            <Button size="sm" variant="outline" className="h-7 w-7 p-0" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>›</Button>
          </div>
        )}
      </div>

      {/* Data Table */}
      {loading ? <Spinner /> : users.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {isRTL ? (isStudent ? "هنرجویی یافت نشد" : "مدرسی یافت نشد") : (isStudent ? "No students found" : "No instructors found")}
        </div>
      ) : (
        <div className="border border-border/40 rounded-xl overflow-hidden">
          <ScrollArea className="max-h-[calc(100vh-400px)]">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{isRTL ? "نام" : "Name"}</TableHead>
                    <TableHead className="text-xs">{isStudent ? (isRTL ? "ساز" : "Instrument") : (isRTL ? "تخصص" : "Specialty")}</TableHead>
                    <TableHead className="text-xs">{isRTL ? "وضعیت" : "Status"}</TableHead>
                    <TableHead className="text-xs">{isRTL ? "روش ثبت‌نام" : "Reg. Method"}</TableHead>
                    <TableHead className="text-xs">{isRTL ? "لید اسکور" : "Lead"}</TableHead>
                    <TableHead className="text-xs">{isRTL ? "بخش AI" : "AI Segment"}</TableHead>
                    <TableHead className="text-xs">{isRTL ? "تاریخ" : "Date"}</TableHead>
                    <TableHead className="text-xs">{isRTL ? "عملیات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => {
                    const latestEnrollment = u.enrollments?.[0];
                    const regMethodCfg = latestEnrollment ? REGISTRATION_METHOD_CONFIG[latestEnrollment.registrationMethod] : null;
                    const aiCfg = u.aiSegmentTag ? AI_SEGMENT_CONFIG[u.aiSegmentTag] : null;
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="text-xs">
                          <div className="font-medium">{u.name}</div>
                          <div className="text-muted-foreground text-[10px]">{u.email}</div>
                          {u.phone && <div className="text-muted-foreground text-[10px]">{u.phone}</div>}
                        </TableCell>
                        <TableCell className="text-xs">
                          {isStudent ? (u.primaryInstrument || "—") : (u.specialtyFa || "—")}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => toggleActive(u.id, u.isActive, u.name)}
                              title={isRTL ? (u.isActive ? "غیرفعال کردن" : "فعال کردن") : (u.isActive ? "Deactivate" : "Activate")}>
                              {u.isActive ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => toggleVerified(u.id, u.isVerified, u.name)}
                              title={isRTL ? (u.isVerified ? "لغو تأیید" : "تأیید") : (u.isVerified ? "Unverify" : "Verify")}>
                              {u.isVerified ? <ShieldCheck className="w-3.5 h-3.5 text-sky-500" /> : <Shield className="w-3.5 h-3.5 text-muted-foreground" />}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {regMethodCfg ? (
                            <Badge className={cn("text-[9px] px-1.5 py-0", regMethodCfg.color)}>
                              {isRTL ? regMethodCfg.labelFa : regMethodCfg.labelEn}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-[10px]">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-1.5">
                            <div className="w-8 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className={cn("h-full rounded-full", u.leadScore >= 70 ? "bg-emerald-500" : u.leadScore >= 40 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${u.leadScore}%` }} />
                            </div>
                            <span className="text-[10px]">{u.leadScore}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {aiCfg ? (
                            <Badge className={cn("text-[9px] px-1.5 py-0", aiCfg.color)}>
                              {isRTL ? aiCfg.labelFa : aiCfg.labelEn}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-[10px]">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(u.createdAt, isRTL)}</TableCell>
                        <TableCell className="text-xs">
                          <div className="flex gap-0.5">
                            <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => fetchDetail(u.id)} title={isRTL ? "مشاهده" : "View"}>
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={async () => {
                              const res = await authFetch(`/api/admin/students/${u.id}?detailed=true`);
                              if (res.ok) { const d = await res.json(); setEditUser(d.student); }
                            }} title={isRTL ? "ویرایش" : "Edit"}>
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => { setResetPasswordUser(u); setNewPassword(""); }} title={isRTL ? "بازنشانی رمز" : "Reset Password"}>
                              <Key className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 px-1.5 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => setDeleteUser(u)} title={isRTL ? "حذف" : "Delete"}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-2 p-2">
              {users.map((u) => {
                const latestEnrollment = u.enrollments?.[0];
                const regMethodCfg = latestEnrollment ? REGISTRATION_METHOD_CONFIG[latestEnrollment.registrationMethod] : null;
                const aiCfg = u.aiSegmentTag ? AI_SEGMENT_CONFIG[u.aiSegmentTag] : null;
                return (
                  <div key={u.id} className="border border-border/40 rounded-lg p-3 space-y-2">
                    <div className={cn("flex items-start justify-between", isRTL && "flex-row-reverse")}>
                      <div>
                        <p className="font-medium text-sm">{u.name}</p>
                        <p className="text-[10px] text-muted-foreground">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="h-6 px-1" onClick={() => toggleActive(u.id, u.isActive, u.name)}>
                          {u.isActive ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 px-1" onClick={() => toggleVerified(u.id, u.isVerified, u.name)}>
                          {u.isVerified ? <ShieldCheck className="w-3.5 h-3.5 text-sky-500" /> : <Shield className="w-3.5 h-3.5 text-muted-foreground" />}
                        </Button>
                      </div>
                    </div>
                    <div className={cn("flex flex-wrap gap-1.5 items-center", isRTL && "flex-row-reverse")}>
                      {isStudent ? (u.primaryInstrument && <Badge variant="outline" className="text-[9px]">{u.primaryInstrument}</Badge>) : (u.specialtyFa && <Badge variant="outline" className="text-[9px]">{u.specialtyFa}</Badge>)}
                      {regMethodCfg && <Badge className={cn("text-[9px] px-1.5 py-0", regMethodCfg.color)}>{isRTL ? regMethodCfg.labelFa : regMethodCfg.labelEn}</Badge>}
                      {aiCfg && <Badge className={cn("text-[9px] px-1.5 py-0", aiCfg.color)}>{isRTL ? aiCfg.labelFa : aiCfg.labelEn}</Badge>}
                    </div>
                    <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                      <span className="text-[10px] text-muted-foreground">{formatDate(u.createdAt, isRTL)}</span>
                      <div className="flex gap-0.5">
                        <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => fetchDetail(u.id)}><Eye className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={async () => {
                          const res = await authFetch(`/api/admin/students/${u.id}?detailed=true`);
                          if (res.ok) { const d = await res.json(); setEditUser(d.student); }
                        }}><Edit3 className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => { setResetPasswordUser(u); setNewPassword(""); }}><Key className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="h-6 px-1.5 text-red-500" onClick={() => setDeleteUser(u)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* ─── Dialogs ─── */}

      {/* User Detail Dialog */}
      <Dialog open={!!detailUser} onOpenChange={() => setDetailUser(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {detailUser?.name}
              {detailUser && getRoleBadge(detailUser.role, isRTL)}
              {detailUser?.aiSegmentTag && <Badge className="bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px]">{detailUser.aiSegmentTag}</Badge>}
            </DialogTitle>
            <DialogDescription className="sr-only">مشاهده جزئیات کاربر</DialogDescription>
          </DialogHeader>
          {detailUser && (
            <div className="space-y-4 text-xs">
              {/* Personal Info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  [isRTL ? "ایمیل" : "Email", detailUser.email],
                  [isRTL ? "تلفن" : "Phone", detailUser.phone],
                  [isRTL ? "تاریخ تولد" : "Date of Birth", detailUser.dateOfBirth ? formatJalaaliDate(detailUser.dateOfBirth, isRTL, "long") : null],
                  [isRTL ? "جنسیت" : "Gender", detailUser.gender],
                  [isRTL ? "پایه تحصیلی" : "Education", detailUser.educationLevel ? (REG_EDUCATION_LEVELS.find(e => e.value === detailUser.educationLevel) ? (isRTL ? REG_EDUCATION_LEVELS.find(e => e.value === detailUser.educationLevel)!.fa : REG_EDUCATION_LEVELS.find(e => e.value === detailUser.educationLevel)!.en) : detailUser.educationLevel) : null],
                  [isRTL ? "ساز اصلی" : "Instrument", detailUser.primaryInstrument],
                  [isRTL ? "سطح مهارت" : "Skill Level", detailUser.skillLevel],
                  [isRTL ? "شهر" : "City", detailUser.city],
                  [isRTL ? "استان" : "Province", detailUser.province],
                  [isRTL ? "منبع ارجاع" : "Referral", detailUser.referralSource],
                  [isRTL ? "آخرین ورود" : "Last Login", detailUser.lastLogin ? formatDateTime(detailUser.lastLogin, isRTL) : "—"],
                  [isRTL ? "تاریخ ثبت" : "Registered", formatDate(detailUser.createdAt, isRTL)],
                ].map(([label, value]) => (
                  <div key={String(label)} className="space-y-0.5">
                    <span className="text-muted-foreground">{label}</span>
                    <p className="font-medium">{value || "—"}</p>
                  </div>
                ))}
              </div>

              {/* AI & Analytics Section */}
              <Separator />
              <div>
                <p className="font-semibold mb-2 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-500" />{isRTL ? "تحلیل هوشمند" : "AI Analytics"}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "امتیاز لید" : "Lead Score"}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[60px]">
                        <div className={cn("h-full rounded-full", detailUser.leadScore >= 70 ? "bg-emerald-500" : detailUser.leadScore >= 40 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${detailUser.leadScore}%` }} />
                      </div>
                      <p className="font-medium">{detailUser.leadScore}</p>
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "سطح مشارکت" : "Engagement"}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[60px]">
                        <div className={cn("h-full rounded-full", detailUser.engagementScore >= 70 ? "bg-emerald-500" : detailUser.engagementScore >= 40 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${detailUser.engagementScore}%` }} />
                      </div>
                      <p className="font-medium">{detailUser.engagementScore}</p>
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "ریسک ریزش" : "Churn Risk"}</span>
                    <Badge className={cn("text-[10px]", detailUser.churnRisk === "high" ? "bg-red-500/10 text-red-600" : detailUser.churnRisk === "medium" ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600")}>{detailUser.churnRisk || "—"}</Badge>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "ارزش طول عمر" : "CLV"}</span>
                    <p className="font-medium">{formatToman(detailUser.customerLifetimeValue, isRTL)}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "بخش AI" : "AI Segment"}</span>
                    <Badge className="bg-violet-500/10 text-violet-600 text-[10px]">{detailUser.aiSegmentTag || "—"}</Badge>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "تگ‌ها" : "Tags"}</span>
                    <div className="flex flex-wrap gap-0.5">{detailUser.tags ? (() => { try { return JSON.parse(detailUser.tags).map((t: string) => <Badge key={t} variant="outline" className="text-[9px] px-1">{t}</Badge>); } catch { return <span>—</span>; } })() : "—"}</div>
                  </div>
                </div>
              </div>

              {/* Instructor-specific */}
              {detailUser.role === "instructor" && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-0.5"><span className="text-muted-foreground">{isRTL ? "تخصص" : "Specialty"}</span><p className="font-medium">{detailUser.specialtyFa || detailUser.specialtyEn || "—"}</p></div>
                    <div className="space-y-0.5"><span className="text-muted-foreground">{isRTL ? "سابقه" : "Experience"}</span><p className="font-medium">{detailUser.experience || "—"}</p></div>
                    <div className="space-y-0.5"><span className="text-muted-foreground">{isRTL ? "منتشر شده" : "Published"}</span><p className="font-medium">{detailUser.isPublishedInstructor ? (isRTL ? "بله" : "Yes") : (isRTL ? "خیر" : "No")}</p></div>
                  </div>
                </>
              )}

              {/* Enrollments */}
              {detailUser.enrollments.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="font-semibold mb-2 flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-primary" />{isRTL ? `دوره‌ها (${detailUser.enrollments.length})` : `Enrollments (${detailUser.enrollments.length})`}</p>
                    <ScrollArea className="max-h-40">
                      <Table>
                        <TableHeader><TableRow>
                          <TableHead className="text-[10px]">{isRTL ? "دوره" : "Course"}</TableHead>
                          <TableHead className="text-[10px]">{isRTL ? "وضعیت" : "Status"}</TableHead>
                          <TableHead className="text-[10px]">{isRTL ? "پیشرفت" : "Progress"}</TableHead>
                          <TableHead className="text-[10px]">{isRTL ? "تاریخ" : "Date"}</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                          {detailUser.enrollments.map((e) => {
                            const stCfg = ENROLLMENT_STATUS_CONFIG[e.status];
                            return (
                              <TableRow key={e.id}>
                                <TableCell className="text-[10px] font-medium">{isRTL ? e.course.titleFa : e.course.titleEn}</TableCell>
                                <TableCell className="text-[10px]">{stCfg && <Badge className={cn("text-[8px] px-1", stCfg.color)}>{isRTL ? stCfg.labelFa : stCfg.labelEn}</Badge>}</TableCell>
                                <TableCell className="text-[10px]">
                                  <div className="flex items-center gap-1">
                                    <div className="w-10 h-1 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${e.progress}%` }} /></div>
                                    <span>{e.progress}%</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-[10px] text-muted-foreground">{formatDate(e.enrolledAt, isRTL)}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                </>
              )}

              {/* Workshop Tickets */}
              {detailUser.tickets.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="font-semibold mb-2 flex items-center gap-1.5"><Receipt className="w-3.5 h-3.5 text-primary" />{isRTL ? `بلیت کارگاه (${detailUser.tickets.length})` : `Workshop Tickets (${detailUser.tickets.length})`}</p>
                    <ScrollArea className="max-h-32">
                      <Table>
                        <TableHeader><TableRow>
                          <TableHead className="text-[10px]">{isRTL ? "کارگاه" : "Workshop"}</TableHead>
                          <TableHead className="text-[10px]">{isRTL ? "وضعیت" : "Status"}</TableHead>
                          <TableHead className="text-[10px]">{isRTL ? "تاریخ" : "Date"}</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                          {detailUser.tickets.map((t) => {
                            const tCfg = TICKET_STATUS_CONFIG[t.status];
                            return (
                              <TableRow key={t.id}>
                                <TableCell className="text-[10px] font-medium">{isRTL ? t.workshop.titleFa : t.workshop.titleEn}</TableCell>
                                <TableCell className="text-[10px]">{tCfg && <Badge className={cn("text-[8px] px-1", tCfg.color)}>{isRTL ? tCfg.labelFa : tCfg.labelEn}</Badge>}</TableCell>
                                <TableCell className="text-[10px] text-muted-foreground">{formatDate(t.workshop.date, isRTL)}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                </>
              )}

              {/* Stats */}
              <Separator />
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-0.5"><span className="text-muted-foreground">{isRTL ? "ورودها" : "Logins"}</span><p className="font-medium">{detailUser._count.loginSessions}</p></div>
                <div className="space-y-0.5"><span className="text-muted-foreground">{isRTL ? "ثبت‌نام‌ها" : "Enrollments"}</span><p className="font-medium">{detailUser._count.enrollments}</p></div>
                <div className="space-y-0.5"><span className="text-muted-foreground">{isRTL ? "بلیت‌ها" : "Tickets"}</span><p className="font-medium">{detailUser._count.tickets}</p></div>
              </div>

              {detailUser.notes && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <span className="text-muted-foreground">{isRTL ? "یادداشت" : "Notes"}</span>
                    <p className="bg-muted/50 rounded-md p-2">{detailUser.notes}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <RegistrationForm isOpen={showCreate} onClose={() => { setShowCreate(false); fetchUsers(); }} isAdminMode={true} defaultRole={role} />

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isRTL ? "ویرایش کاربر" : "Edit User"}</DialogTitle><DialogDescription className="sr-only">فرم ویرایش اطلاعات کاربر</DialogDescription></DialogHeader>
          {editUser && <EditUserForm user={editUser} isRTL={isRTL} onClose={() => { setEditUser(null); fetchUsers(); }} />}
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetPasswordUser} onOpenChange={() => { setResetPasswordUser(null); setNewPassword(""); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-500" />
              {isRTL ? `بازنشانی رمز عبور: ${resetPasswordUser?.name}` : `Reset Password: ${resetPasswordUser?.name}`}
            </DialogTitle>
            <DialogDescription className="sr-only">بازنشانی رمز عبور کاربر</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className={cn("flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20", isRTL && "flex-row-reverse")}>
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-xs text-amber-600 dark:text-amber-400">
                {isRTL ? "رمز عبور جدید برای این کاربر تنظیم خواهد شد. مطمئن شوید که رمز عبور جدید را به کاربر اطلاع دهید." : "A new password will be set for this user. Make sure to communicate the new password to them."}
              </span>
            </div>
            <div>
              <Label className="text-xs font-medium">{isRTL ? "رمز عبور جدید" : "New Password"} *</Label>
              <Input type="password" className="h-9 text-sm mt-1" placeholder={isRTL ? "حداقل ۶ کاراکتر" : "At least 6 characters"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} dir="ltr" />
            </div>
            <div className={cn("flex gap-2 justify-end", isRTL && "flex-row-reverse")}>
              <Button type="button" variant="outline" size="sm" onClick={() => { setResetPasswordUser(null); setNewPassword(""); }}>{isRTL ? "انصراف" : "Cancel"}</Button>
              <Button type="button" size="sm" onClick={handleResetPassword} disabled={resettingPassword || !newPassword || newPassword.length < 6}>
                {resettingPassword && <Loader2 className="w-3.5 h-3.5 me-1 animate-spin" />}
                {isRTL ? "بازنشانی رمز عبور" : "Reset Password"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <AlertTriangle className="w-5 h-5 text-red-500" />
              {isRTL ? "حذف کاربر" : "Delete User"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL
                ? `آیا از حذف ${deleteUser?.name} اطمینان دارید؟ تمام اطلاعات این کاربر شامل ثبت‌نام‌ها و بلیت‌ها حذف خواهد شد. این عمل قابل بازگشت نیست.`
                : `Are you sure you want to delete ${deleteUser?.name}? All user data including enrollments and tickets will be permanently deleted. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRTL ? "انصراف" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteUser && handleDelete(deleteUser.id, deleteUser.name)}>
              {isRTL ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================
// EDIT USER FORM
// ============================================
function EditUserForm({ user, isRTL, onClose }: { user: UserDetail; isRTL: boolean; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [roleChangeWarning, setRoleChangeWarning] = useState(false);
  const [form, setForm] = useState({
    name: user.name, email: user.email, phone: user.phone || "",
    primaryInstrument: user.primaryInstrument || "", city: user.city || "",
    province: user.province || "", notes: user.notes || "",
    isActive: user.isActive, isVerified: user.isVerified, role: user.role,
    skillLevel: user.skillLevel || "", gender: user.gender || "",
    nationalId: user.nationalId || "",
    dateOfBirth: user.dateOfBirth || "",
    educationLevel: user.educationLevel || "",
    specialtyFa: user.specialtyFa || "", specialtyEn: user.specialtyEn || "",
    bioFa: user.bioFa || "", bioEn: user.bioEn || "",
    isPublishedInstructor: user.isPublishedInstructor,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.role !== user.role && !roleChangeWarning) {
      setRoleChangeWarning(true);
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch(`/api/admin/students/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success(isRTL ? "بروزرسانی شد" : "Updated");
        logAuditAction("UPDATE", "user", user.id, `User ${user.name} updated`);
        onClose();
      } else {
        const d = await res.json();
        toast.error(d.error || (isRTL ? "خطا" : "Error"));
      }
    } catch {
      toast.error(isRTL ? "خطا" : "Error");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error(isRTL ? "رمز عبور باید حداقل ۶ کاراکتر باشد" : "Password must be at least 6 characters");
      return;
    }
    setResettingPassword(true);
    try {
      const res = await authFetch(`/api/admin/students/${user.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      if (res.ok) {
        toast.success(isRTL ? "رمز عبور بازنشانی شد" : "Password reset successfully");
        logAuditAction("RESET_PASSWORD", "user", user.id, `Password reset for user ${user.name}`);
        setNewPassword("");
        setShowPasswordReset(false);
      } else {
        const d = await res.json();
        toast.error(d.error || (isRTL ? "خطا" : "Error"));
      }
    } catch {
      toast.error(isRTL ? "خطا" : "Error");
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic Info */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase">{isRTL ? "اطلاعات پایه" : "Basic Info"}</p>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">{isRTL ? "نام" : "Name"}</Label><Input className="h-8 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label className="text-xs">{isRTL ? "ایمیل" : "Email"}</Label><Input className="h-8 text-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} dir="ltr" /></div>
          <div><Label className="text-xs">{isRTL ? "تلفن" : "Phone"}</Label><Input className="h-8 text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" /></div>
          <div><Label className="text-xs">{isRTL ? "کد ملی" : "National ID"}</Label><Input className="h-8 text-sm" value={form.nationalId} onChange={(e) => setForm({ ...form, nationalId: e.target.value })} dir="ltr" /></div>
          <div><Label className="text-xs">{isRTL ? "جنسیت" : "Gender"}</Label>
            <Select value={form.gender || "none"} onValueChange={(v) => setForm({ ...form, gender: v === "none" ? "" : v })}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{isRTL ? "— انتخاب نشده —" : "— Not set —"}</SelectItem>
                <SelectItem value="male">{isRTL ? "مرد" : "Male"}</SelectItem>
                <SelectItem value="female">{isRTL ? "زن" : "Female"}</SelectItem>
                <SelectItem value="other">{isRTL ? "سایر" : "Other"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">{isRTL ? "ساز اصلی" : "Instrument"}</Label><Input className="h-8 text-sm" value={form.primaryInstrument} onChange={(e) => setForm({ ...form, primaryInstrument: e.target.value })} /></div>
          <div><Label className="text-xs">{isRTL ? "سطح مهارت" : "Skill Level"}</Label>
            <Select value={form.skillLevel || "none"} onValueChange={(v) => setForm({ ...form, skillLevel: v === "none" ? "" : v })}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{isRTL ? "— انتخاب نشده —" : "— Not set —"}</SelectItem>
                <SelectItem value="beginner">{isRTL ? "مبتدی" : "Beginner"}</SelectItem>
                <SelectItem value="intermediate">{isRTL ? "متوسط" : "Intermediate"}</SelectItem>
                <SelectItem value="advanced">{isRTL ? "پیشرفته" : "Advanced"}</SelectItem>
                <SelectItem value="professional">{isRTL ? "حرفه‌ای" : "Professional"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">{isRTL ? "پایه تحصیلی کنونی" : "Education Level"}</Label>
            <Select value={form.educationLevel || "none"} onValueChange={(v) => setForm({ ...form, educationLevel: v === "none" ? "" : v })}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{isRTL ? "— انتخاب نشده —" : "— Not set —"}</SelectItem>
                {REG_EDUCATION_LEVELS.map((e) => (
                  <SelectItem key={e.value} value={e.value}>{isRTL ? e.fa : e.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">{isRTL ? "شهر" : "City"}</Label><Input className="h-8 text-sm" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
        </div>
        {/* Date of Birth - Shamsi */}
        <div className="mt-3">
          <PersianDatePicker
            value={form.dateOfBirth}
            onChange={(isoDate) => setForm({ ...form, dateOfBirth: isoDate })}
            isRTL={isRTL}
            label={isRTL ? "تاریخ تولد (شمسی)" : "Date of Birth (Jalali)"}
            placeholder={isRTL ? "انتخاب تاریخ تولد شمسی" : "Select Jalali birth date"}
          />
        </div>
      </div>

      {/* Password Reset */}
      <div>
        <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase">{isRTL ? "امنیت حساب" : "Account Security"}</p>
          <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" onClick={() => setShowPasswordReset(!showPasswordReset)}>
            <Key className="w-3 h-3 me-1" />{isRTL ? "بازنشانی رمز عبور" : "Reset Password"}
          </Button>
        </div>
        {showPasswordReset && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-2 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 space-y-2">
            <div className={cn("flex items-center gap-2 mb-1", isRTL && "flex-row-reverse")}>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[10px] text-amber-600 dark:text-amber-400">{isRTL ? "رمز عبور جدید برای کاربر تنظیم خواهد شد" : "A new password will be set for this user"}</span>
            </div>
            <div className="flex gap-2">
              <Input type="password" className="h-8 text-sm flex-1" placeholder={isRTL ? "رمز عبور جدید (حداقل ۶ کاراکتر)" : "New password (min 6 chars)"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} dir="ltr" />
              <Button type="button" size="sm" className="h-8 rounded-lg" disabled={resettingPassword} onClick={handleResetPassword}>
                {resettingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Instructor-specific fields */}
      {form.role === "instructor" && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase">{isRTL ? "اطلاعات مدرس" : "Instructor Info"}</p>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">{isRTL ? "تخصص (فارسی)" : "Specialty (FA)"}</Label><Input className="h-8 text-sm" value={form.specialtyFa} onChange={(e) => setForm({ ...form, specialtyFa: e.target.value })} /></div>
            <div><Label className="text-xs">{isRTL ? "تخصص (انگلیسی)" : "Specialty (EN)"}</Label><Input className="h-8 text-sm" value={form.specialtyEn} onChange={(e) => setForm({ ...form, specialtyEn: e.target.value })} /></div>
          </div>
          <div className="mt-2"><Label className="text-xs">{isRTL ? "بیوگرافی (فارسی)" : "Bio (FA)"}</Label><Textarea className="text-sm" rows={2} value={form.bioFa} onChange={(e) => setForm({ ...form, bioFa: e.target.value })} /></div>
          <div className="mt-2"><Label className="text-xs">{isRTL ? "بیوگرافی (انگلیسی)" : "Bio (EN)"}</Label><Textarea className="text-sm" rows={2} value={form.bioEn} onChange={(e) => setForm({ ...form, bioEn: e.target.value })} /></div>
          <div className={cn("flex items-center gap-2 mt-2", isRTL && "flex-row-reverse")}>
            <Switch checked={form.isPublishedInstructor} onCheckedChange={(v) => setForm({ ...form, isPublishedInstructor: v })} />
            <Label className="text-xs">{isRTL ? "نمایش در صفحه مدرسین" : "Show on instructors page"}</Label>
          </div>
        </div>
      )}

      {/* Notes */}
      <div><Label className="text-xs">{isRTL ? "یادداشت مدیر" : "Admin Notes"}</Label><Textarea className="text-sm" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>

      {/* Role & Status */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase">{isRTL ? "نقش و وضعیت" : "Role & Status"}</p>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">{isRTL ? "نقش" : "Role"}</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="student">{isRTL ? "هنرجو" : "Student"}</SelectItem><SelectItem value="instructor">{isRTL ? "مدرس" : "Instructor"}</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2 pt-5">
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              <Label className="text-xs">{form.isActive ? (isRTL ? "فعال" : "Active") : (isRTL ? "غیرفعال" : "Inactive")}</Label>
            </div>
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Switch checked={form.isVerified} onCheckedChange={(v) => setForm({ ...form, isVerified: v })} />
              <Label className="text-xs">{form.isVerified ? (isRTL ? "تأیید شده" : "Verified") : (isRTL ? "تأیید نشده" : "Unverified")}</Label>
            </div>
          </div>
        </div>
      </div>

      {/* Role change warning */}
      {form.role !== user.role && (
        <div className={cn("flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20", isRTL && "flex-row-reverse")}>
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-xs text-amber-600 dark:text-amber-400">
            {isRTL
              ? `تغییر نقش کاربر از "${user.role}" به "${form.role}" می‌تواند دسترسی‌ها را تغییر دهد. برای تأیید مجدد ذخیره را بزنید.`
              : `Changing role from "${user.role}" to "${form.role}" may affect permissions. Click save again to confirm.`}
          </span>
        </div>
      )}
      <div className={cn("flex gap-2 justify-end", isRTL && "flex-row-reverse")}>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>{isRTL ? "انصراف" : "Cancel"}</Button>
        <Button type="submit" size="sm" disabled={saving}>{saving && <Loader2 className="w-3.5 h-3.5 me-1 animate-spin" />}{isRTL ? "ذخیره" : "Save"}</Button>
      </div>

      {/* Role Change Confirmation */}
      <AlertDialog open={roleChangeWarning} onOpenChange={setRoleChangeWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              {isRTL ? "تأیید تغییر نقش" : "Confirm Role Change"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL
                ? `تغییر نقش کاربر می‌تواند دسترسی‌ها را تغییر دهد. آیا مطمئن هستید؟ نقش از "${user.role}" به "${form.role}" تغییر خواهد کرد.`
                : `Changing user role may affect their permissions. Are you sure? Role will change from "${user.role}" to "${form.role}".`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setRoleChangeWarning(false); setForm({ ...form, role: user.role }); }}>{isRTL ? "انصراف" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setRoleChangeWarning(false); }}>{isRTL ? "تأیید تغییر نقش" : "Confirm Role Change"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}

// ============================================
// ADMINS SUB-TAB
// ============================================
function AdminsSubTab({ isRTL }: { isRTL: boolean }) {
  const [admins, setAdmins] = useState<AdminEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [permAdmin, setPermAdmin] = useState<AdminEntry | null>(null);
  const [editAdmin, setEditAdmin] = useState<AdminEntry | null>(null);
  const [deleteAdmin, setDeleteAdmin] = useState<AdminEntry | null>(null);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/admin/admins");
      if (res.ok) {
        const d = await res.json();
        setAdmins(d.admins);
      }
    } catch {
      toast.error(isRTL ? "خطا" : "Error");
    } finally {
      setLoading(false);
    }
  }, [isRTL]);

  useEffect(() => { deferEffect(fetchAdmins); }, [fetchAdmins]);

  const filteredAdmins = admins.filter((a) =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase()) || (a.phone && a.phone.includes(search))
  );

  const toggleActive = async (id: string, isActive: boolean, name: string) => {
    try {
      const res = await authFetch(`/api/admin/admins/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (res.ok) {
        toast.success(isRTL ? "وضعیت تغییر کرد" : "Status updated");
        logAuditAction("TOGGLE_ACTIVE", "admin", id, `Admin ${name} ${isActive ? "deactivated" : "activated"}`);
        fetchAdmins();
      }
    } catch {
      toast.error(isRTL ? "خطا" : "Error");
    }
  };

  const handleDeleteAdmin = async (id: string, name: string) => {
    try {
      const res = await authFetch(`/api/admin/admins/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(isRTL ? "مدیر حذف شد" : "Admin deleted");
        logAuditAction("DELETE", "admin", id, `Admin ${name} deleted`);
        fetchAdmins();
      } else {
        const d = await res.json();
        toast.error(d.error || (isRTL ? "خطا" : "Error"));
      }
    } catch {
      toast.error(isRTL ? "خطا" : "Error");
    } finally {
      setDeleteAdmin(null);
    }
  };

  const getAdminRoleBadge = (role: string) => {
    if (role === "super_admin") return <Badge className="bg-red-500/10 text-red-600 text-[10px]">{isRTL ? "سوپر ادمین" : "Super Admin"}</Badge>;
    if (role === "admin") return <Badge className="bg-amber-500/10 text-amber-600 text-[10px]">{isRTL ? "مدیر" : "Admin"}</Badge>;
    return <Badge className="bg-sky-500/10 text-sky-600 text-[10px]">{isRTL ? "ویرایشگر" : "Editor"}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions */}
      <div className={cn("flex flex-wrap items-center gap-2", isRTL && "flex-row-reverse")}>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute top-2.5 start-3 w-4 h-4 text-muted-foreground" />
          <Input placeholder={isRTL ? "جستجو نام، ایمیل..." : "Search name, email..."} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9 h-9 text-sm" />
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} className="h-9"><Plus className="w-3.5 h-3.5 me-1" />{isRTL ? "مدیر جدید" : "New Admin"}</Button>
        <Button size="sm" variant="outline" onClick={fetchAdmins} className="h-9"><RefreshCw className="w-3.5 h-3.5" /></Button>
      </div>

      <div className="text-xs text-muted-foreground">{isRTL ? `${filteredAdmins.length} مدیر` : `${filteredAdmins.length} admins`}</div>

      {loading ? <Spinner /> : filteredAdmins.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">{isRTL ? "مدیری یافت نشد" : "No admins found"}</div>
      ) : (
        <div className="border border-border/40 rounded-xl overflow-hidden">
          <ScrollArea className="max-h-[calc(100vh-380px)]">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{isRTL ? "نام" : "Name"}</TableHead>
                    <TableHead className="text-xs">{isRTL ? "نقش" : "Role"}</TableHead>
                    <TableHead className="text-xs">{isRTL ? "مجوزها" : "Perms"}</TableHead>
                    <TableHead className="text-xs">{isRTL ? "وضعیت" : "Status"}</TableHead>
                    <TableHead className="text-xs">{isRTL ? "آخرین ورود" : "Last Login"}</TableHead>
                    <TableHead className="text-xs">{isRTL ? "قفل" : "Lock"}</TableHead>
                    <TableHead className="text-xs">{isRTL ? "عملیات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdmins.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs">
                        <div className="font-medium">{a.name}</div>
                        <div className="text-muted-foreground text-[10px]">{a.email}</div>
                      </TableCell>
                      <TableCell className="text-xs">{getAdminRoleBadge(a.role)}</TableCell>
                      <TableCell className="text-xs">{a._count.permissions}</TableCell>
                      <TableCell className="text-xs">
                        <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => toggleActive(a.id, a.isActive, a.name)}>
                          {a.isActive ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                        </Button>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{a.lastLoginAt ? formatTimeAgo(a.lastLoginAt, isRTL) : "—"}</TableCell>
                      <TableCell className="text-xs">
                        {a.lockedUntil ? (
                          <Badge className="bg-red-500/10 text-red-600 text-[9px]"><Lock className="w-2.5 h-2.5 me-0.5" />{isRTL ? "قفل" : "Locked"}</Badge>
                        ) : a.failedLoginAttempts > 0 ? (
                          <Badge className="bg-amber-500/10 text-amber-600 text-[9px]">{a.failedLoginAttempts} {isRTL ? "خطا" : "fails"}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-[10px]">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-0.5">
                          <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => setEditAdmin(a)} title={isRTL ? "ویرایش" : "Edit"}><Edit3 className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => setPermAdmin(a)} title={isRTL ? "مجوزها" : "Permissions"}><Key className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-6 px-1.5 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => setDeleteAdmin(a)} title={isRTL ? "حذف" : "Delete"}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-2 p-2">
              {filteredAdmins.map((a) => (
                <div key={a.id} className="border border-border/40 rounded-lg p-3 space-y-2">
                  <div className={cn("flex items-start justify-between", isRTL && "flex-row-reverse")}>
                    <div>
                      <p className="font-medium text-sm">{a.name}</p>
                      <p className="text-[10px] text-muted-foreground">{a.email}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {getAdminRoleBadge(a.role)}
                      <Button size="sm" variant="ghost" className="h-6 px-1" onClick={() => toggleActive(a.id, a.isActive, a.name)}>
                        {a.isActive ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                      </Button>
                    </div>
                  </div>
                  <div className={cn("flex flex-wrap gap-1.5 items-center", isRTL && "flex-row-reverse")}>
                    <Badge variant="outline" className="text-[9px]">{a._count.permissions} {isRTL ? "مجوز" : "perms"}</Badge>
                    {a.lockedUntil && <Badge className="bg-red-500/10 text-red-600 text-[9px]"><Lock className="w-2.5 h-2.5 me-0.5" />{isRTL ? "قفل" : "Locked"}</Badge>}
                    {a.failedLoginAttempts > 0 && !a.lockedUntil && <Badge className="bg-amber-500/10 text-amber-600 text-[9px]">{a.failedLoginAttempts} {isRTL ? "خطا" : "fails"}</Badge>}
                    <span className="text-[10px] text-muted-foreground">{a.lastLoginAt ? formatTimeAgo(a.lastLoginAt, isRTL) : "—"}</span>
                  </div>
                  <div className={cn("flex gap-0.5 justify-end", isRTL && "justify-start")}>
                    <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => setEditAdmin(a)}><Edit3 className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => setPermAdmin(a)}><Key className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-6 px-1.5 text-red-500" onClick={() => setDeleteAdmin(a)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* ─── Admin Dialogs ─── */}

      {/* Create Admin Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>{isRTL ? "مدیر جدید" : "New Admin"}</DialogTitle><DialogDescription className="sr-only">فرم ایجاد مدیر جدید</DialogDescription></DialogHeader>
          <CreateAdminForm isRTL={isRTL} onClose={() => { setShowCreate(false); fetchAdmins(); }} />
        </DialogContent>
      </Dialog>

      {/* Permission Management Dialog */}
      <Dialog open={!!permAdmin} onOpenChange={() => setPermAdmin(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto"><DialogHeader><DialogTitle>{isRTL ? `مجوزهای ${permAdmin?.name}` : `Permissions: ${permAdmin?.name}`}</DialogTitle><DialogDescription className="sr-only">مدیریت مجوزهای دسترسی مدیر</DialogDescription></DialogHeader>
          {permAdmin && <PermissionGrid admin={permAdmin} isRTL={isRTL} onUpdate={fetchAdmins} />}
        </DialogContent>
      </Dialog>

      {/* Edit Admin Dialog */}
      <Dialog open={!!editAdmin} onOpenChange={() => setEditAdmin(null)}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>{isRTL ? `ویرایش ${editAdmin?.name}` : `Edit ${editAdmin?.name}`}</DialogTitle><DialogDescription className="sr-only">فرم ویرایش اطلاعات مدیر</DialogDescription></DialogHeader>
          {editAdmin && <EditAdminDialog admin={editAdmin} isRTL={isRTL} onUpdate={() => { setEditAdmin(null); fetchAdmins(); }} />}
        </DialogContent>
      </Dialog>

      {/* Delete Admin Confirmation */}
      <AlertDialog open={!!deleteAdmin} onOpenChange={() => setDeleteAdmin(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRTL ? "حذف مدیر" : "Delete Admin"}</AlertDialogTitle>
            <AlertDialogDescription>{isRTL ? `آیا از حذف ${deleteAdmin?.name} اطمینان دارید؟ این عمل قابل بازگشت نیست.` : `Are you sure you want to delete ${deleteAdmin?.name}? This action cannot be undone.`}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRTL ? "انصراف" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteAdmin && handleDeleteAdmin(deleteAdmin.id, deleteAdmin.name)}>{isRTL ? "حذف" : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================
// CREATE ADMIN FORM
// ============================================
function CreateAdminForm({ isRTL, onClose }: { isRTL: boolean; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "admin", phone: "" });
  const [selectedPerms, setSelectedPerms] = useState<Array<{ resource: string; action: string }>>([]);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  const togglePerm = (resource: string, action: string) => {
    setSelectedPerms(prev => {
      const exists = prev.some(p => p.resource === resource && p.action === action);
      if (exists) return prev.filter(p => !(p.resource === resource && p.action === action));
      return [...prev, { resource, action }];
    });
    setActiveTemplate(null);
  };

  const toggleAllForResource = (resourceKey: string, enable: boolean) => {
    setSelectedPerms(prev => {
      let next = prev.filter(p => p.resource !== resourceKey);
      if (enable) {
        next = [...next, ...ACTIONS.map(a => ({ resource: resourceKey, action: a.key }))];
      }
      return next;
    });
    setActiveTemplate(null);
  };

  const applyTemplate = (templateKey: string) => {
    const template = PERMISSION_TEMPLATES.find(t => t.key === templateKey);
    if (!template) return;
    const perms: Array<{ resource: string; action: string }> = [];
    template.permissions.forEach(p => {
      p.actions.forEach(a => perms.push({ resource: p.resource, action: a }));
    });
    setSelectedPerms(perms);
    setActiveTemplate(templateKey);
  };

  const handleRoleChange = (role: string) => {
    setForm({ ...form, role });
    if (role === "super_admin") { setSelectedPerms([]); setActiveTemplate(null); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error(isRTL ? "نام، ایمیل و رمز عبور الزامی است" : "Name, email, and password are required");
      return;
    }
    if (form.password.length < 6) {
      toast.error(isRTL ? "رمز عبور باید حداقل ۶ کاراکتر باشد" : "Password must be at least 6 characters");
      return;
    }
    setSaving(true);
    try {
      // Filter out any malformed permission entries
      const validPerms = selectedPerms.filter(p => p.resource && p.action);
      const payload = { ...form, permissions: form.role !== "super_admin" ? validPerms : [] };
      const res = await authFetch("/api/admin/admins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        toast.success(isRTL ? "مدیر ایجاد شد" : "Admin created");
        logAuditAction("CREATE", "admin", null, `Admin created: ${form.name} (${form.role}) with ${selectedPerms.length} permissions`);
        onClose();
      } else {
        const d = await res.json();
        toast.error(d.error || "Error");
      }
    } catch {
      toast.error(isRTL ? "خطا" : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-h-[70vh] overflow-y-auto">
      <div><Label className="text-xs font-medium">{isRTL ? "نام" : "Name"} *</Label><Input className="h-9 text-sm rounded-xl" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={isRTL ? "نام کامل" : "Full name"} /></div>
      <div><Label className="text-xs font-medium">{isRTL ? "ایمیل" : "Email"} *</Label><Input type="email" className="h-9 text-sm rounded-xl" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" dir="ltr" /></div>
      <div><Label className="text-xs font-medium">{isRTL ? "رمز عبور" : "Password"} *</Label><Input type="password" className="h-9 text-sm rounded-xl" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={isRTL ? "حداقل ۶ کاراکتر" : "At least 6 characters"} dir="ltr" /></div>
      <div>
        <Label className="text-xs font-medium">{isRTL ? "نقش" : "Role"}</Label>
        <Select value={form.role} onValueChange={handleRoleChange}>
          <SelectTrigger className="h-9 text-sm rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="super_admin">{isRTL ? "سوپر ادمین (دسترسی کامل)" : "Super Admin (Full Access)"}</SelectItem>
            <SelectItem value="admin">{isRTL ? "مدیر" : "Admin"}</SelectItem>
            <SelectItem value="editor">{isRTL ? "ویرایشگر" : "Editor"}</SelectItem>
          </SelectContent>
        </Select>
        {form.role === "super_admin" && (
          <p className="text-[10px] text-amber-600 mt-1">{isRTL ? "سوپر ادمین دسترسی کامل به همه بخش‌ها دارد" : "Super Admin has full access to all sections"}</p>
        )}
      </div>
      <div><Label className="text-xs font-medium">{isRTL ? "تلفن" : "Phone"}</Label><Input className="h-9 text-sm rounded-xl" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="09121234567" dir="ltr" /></div>

      {/* Permission Grid for non-super_admin */}
      {form.role !== "super_admin" && (
        <div className="space-y-2">
          <Label className="text-xs font-semibold flex items-center gap-1.5"><Key className="w-3.5 h-3.5" />{isRTL ? "مجوزهای دسترسی" : "Permissions"}</Label>

          {/* Quick Templates */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1.5">{isRTL ? "انتخاب سریع الگو:" : "Quick template:"}</p>
            <div className="flex flex-wrap gap-1">
              {PERMISSION_TEMPLATES.map(t => (
                <button key={t.key} type="button" onClick={() => applyTemplate(t.key)}
                  className={cn("text-[9px] px-2 py-1 rounded-md border transition-colors",
                    activeTemplate === t.key ? "bg-primary/10 border-primary/30 text-primary font-semibold" : "border-border/50 text-muted-foreground hover:border-primary/30 hover:bg-primary/5"
                  )}
                  title={isRTL ? t.descFa : t.descEn}>
                  {isRTL ? t.labelFa : t.labelEn}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-border/50 rounded-xl p-3 space-y-2 max-h-52 overflow-y-auto">
            {RESOURCE_CATEGORIES.map(cat => {
              const catResources = RESOURCES.filter(r => r.category === cat.key);
              return (
                <div key={cat.key}>
                  <p className="text-[10px] font-bold text-muted-foreground mb-1">{isRTL ? cat.labelFa : cat.labelEn}</p>
                  {catResources.map((res) => {
                    const resPermCount = ACTIONS.filter(a => selectedPerms.some(p => p.resource === res.key && p.action === a.key)).length;
                    return (
                      <div key={res.key} className="space-y-1 mb-1.5">
                        <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                          <p className="text-[9px] font-medium text-muted-foreground">{isRTL ? res.labelFa : res.labelEn}</p>
                          <Button type="button" variant="ghost" size="sm" className="h-4 px-1 text-[8px]" onClick={() => toggleAllForResource(res.key, resPermCount < ACTIONS.length)}>
                            {resPermCount < ACTIONS.length ? (isRTL ? "همه" : "All") : (isRTL ? "هیچ" : "None")}
                          </Button>
                        </div>
                        <div className={cn("flex gap-1 flex-wrap", isRTL && "flex-row-reverse")}>
                          {ACTIONS.map((act) => {
                            const isActive = selectedPerms.some(p => p.resource === res.key && p.action === act.key);
                            return (
                              <button key={`${res.key}-${act.key}`} type="button" onClick={() => togglePerm(res.key, act.key)}
                                title={isRTL ? act.descFa : act.descEn}
                                className={cn("text-[9px] px-1.5 py-0.5 rounded border transition-colors",
                                  isActive ? "bg-primary/10 border-primary/30 text-primary font-medium" : "border-border/40 text-muted-foreground hover:border-border"
                                )}>
                                {isRTL ? act.labelFa : act.labelEn}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
          {selectedPerms.length > 0 && (
            <p className="text-[10px] text-muted-foreground">{selectedPerms.length} {isRTL ? "مجوز انتخاب شده" : "permissions selected"}</p>
          )}
        </div>
      )}

      <div className={cn("flex gap-2 justify-end pt-2", isRTL && "flex-row-reverse")}>
        <Button type="button" variant="outline" size="sm" onClick={onClose} className="rounded-xl">{isRTL ? "انصراف" : "Cancel"}</Button>
        <Button type="submit" size="sm" disabled={saving} className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground">
          {saving && <Loader2 className="w-3.5 h-3.5 me-1 animate-spin" />}
          {isRTL ? "ایجاد مدیر" : "Create Admin"}
        </Button>
      </div>
    </form>
  );
}

// ============================================
// EDIT ADMIN DIALOG
// ============================================
function EditAdminDialog({ admin, isRTL, onUpdate }: { admin: AdminEntry; isRTL: boolean; onUpdate: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: admin.name, email: admin.email, phone: admin.phone || "",
    role: admin.role, password: "", isActive: admin.isActive, resetLock: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password && form.password.length < 6) {
      toast.error(isRTL ? "رمز عبور باید حداقل ۶ کاراکتر باشد" : "Password must be at least 6 characters");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: form.name, email: form.email, phone: form.phone || null,
        role: form.role, isActive: form.isActive,
      };
      if (form.password) body.password = form.password;
      if (form.resetLock) {
        body.resetLock = true;
      }
      const res = await authFetch(`/api/admin/admins/${admin.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(isRTL ? "مدیر بروزرسانی شد" : "Admin updated");
        logAuditAction("UPDATE", "admin", admin.id, `Admin ${admin.name} updated`);
        onUpdate();
      } else {
        const d = await res.json();
        toast.error(d.error || (isRTL ? "خطا" : "Error"));
      }
    } catch {
      toast.error(isRTL ? "خطا" : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div><Label className="text-xs">{isRTL ? "نام" : "Name"} *</Label><Input className="h-8 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      <div><Label className="text-xs">{isRTL ? "ایمیل" : "Email"} *</Label><Input type="email" className="h-8 text-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
      <div><Label className="text-xs">{isRTL ? "تلفن" : "Phone"}</Label><Input className="h-8 text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      <div><Label className="text-xs">{isRTL ? "نقش" : "Role"}</Label>
        <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="super_admin">{isRTL ? "سوپر ادمین" : "Super Admin"}</SelectItem>
            <SelectItem value="admin">{isRTL ? "مدیر" : "Admin"}</SelectItem>
            <SelectItem value="editor">{isRTL ? "ویرایشگر" : "Editor"}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">{isRTL ? "رمز عبور جدید" : "New Password"}</Label>
        <Input type="password" className="h-8 text-sm" placeholder={isRTL ? "خالی بگذارید برای حفظ رمز فعلی" : "Leave empty to keep current password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {form.password && form.password.length < 6 && <p className="text-[10px] text-red-500 mt-0.5">{isRTL ? "رمز عبور باید حداقل ۶ کاراکتر باشد" : "Password must be at least 6 characters"}</p>}
        {form.password && <p className="text-[10px] text-amber-600 mt-0.5">{isRTL ? "⚠️ رمز عبور تغییر خواهد کرد." : "⚠️ Password will be changed."}</p>}
      </div>
      <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
        <Label className="text-xs">{isRTL ? "فعال" : "Active"}</Label>
        <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
      </div>
      {(admin.failedLoginAttempts > 0 || admin.lockedUntil) && (
        <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
          <Label className="text-xs">{isRTL ? "بازنشانی قفل ورود" : "Reset Login Lock"} {admin.lockedUntil && <Badge className="bg-red-500/10 text-red-600 text-[9px] ms-1">{isRTL ? "قفل شده" : "Locked"}</Badge>}</Label>
          <Switch checked={form.resetLock} onCheckedChange={(v) => setForm({ ...form, resetLock: v })} />
        </div>
      )}
      <div className={cn("flex gap-2 justify-end", isRTL && "flex-row-reverse")}>
        <Button type="submit" size="sm" disabled={saving}>{saving && <Loader2 className="w-3.5 h-3.5 me-1 animate-spin" />}{isRTL ? "ذخیره" : "Save"}</Button>
      </div>
    </form>
  );
}

// ============================================
// PERMISSION GRID
// ============================================
function PermissionGrid({ admin, isRTL, onUpdate }: { admin: AdminEntry; isRTL: boolean; onUpdate: () => void }) {
  const [perms, setPerms] = useState<Set<string>>(() => new Set(admin.permissions.filter((p) => p.granted).map((p) => `${p.resource}:${p.action}`)));
  const [saving, setSaving] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string>("people");

  const toggle = (resource: string, action: string) => {
    const key = `${resource}:${action}`;
    setPerms((prev) => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
    setActiveTemplate(null);
  };

  const toggleAllForResource = (resourceKey: string, enable: boolean) => {
    setPerms((prev) => {
      const next = new Set(prev);
      ACTIONS.forEach((a) => { const key = `${resourceKey}:${a.key}`; if (enable) next.add(key); else next.delete(key); });
      return next;
    });
    setActiveTemplate(null);
  };

  const toggleAllForCategory = (categoryKey: string, enable: boolean) => {
    setPerms((prev) => {
      const next = new Set(prev);
      RESOURCES.filter(r => r.category === categoryKey).forEach((r) => {
        ACTIONS.forEach((a) => { const key = `${r.key}:${a.key}`; if (enable) next.add(key); else next.delete(key); });
      });
      return next;
    });
    setActiveTemplate(null);
  };

  const applyTemplate = (templateKey: string) => {
    const template = PERMISSION_TEMPLATES.find(t => t.key === templateKey);
    if (!template) return;
    const newPerms = new Set<string>();
    template.permissions.forEach(p => { p.actions.forEach(a => newPerms.add(`${p.resource}:${a}`)); });
    setPerms(newPerms);
    setActiveTemplate(templateKey);
  };

  const clearAll = () => { setPerms(new Set()); setActiveTemplate(null); };
  const grantAll = () => { const allPerms = new Set<string>(); RESOURCES.forEach(r => ACTIONS.forEach(a => allPerms.add(`${r.key}:${a.key}`))); setPerms(allPerms); setActiveTemplate(null); };

  const save = async () => {
    setSaving(true);
    try {
      const permList = Array.from(perms).map((k) => { const [resource, action] = k.split(":"); return { resource, action }; }).filter(p => p.resource && p.action);
      const res = await authFetch("/api/admin/permissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ adminId: admin.id, permissions: permList }) });
      if (res.ok) {
        toast.success(isRTL ? "مجوزها ذخیره شد" : "Permissions saved");
        logAuditAction("PERMISSION_CHANGE", "admin", admin.id, `Permissions updated for ${admin.name}: ${permList.length} permissions granted`);
        onUpdate();
      } else {
        toast.error(isRTL ? "خطا" : "Error");
      }
    } catch {
      toast.error(isRTL ? "خطا" : "Error");
    } finally {
      setSaving(false);
    }
  };

  const getCategoryStats = (catKey: string) => {
    const catResources = RESOURCES.filter(r => r.category === catKey);
    const total = catResources.length * ACTIONS.length;
    const granted = catResources.reduce((acc, r) => acc + ACTIONS.filter(a => perms.has(`${r.key}:${a.key}`)).length, 0);
    return { total, granted, percent: total > 0 ? Math.round((granted / total) * 100) : 0 };
  };

  const getResourceStats = (resKey: string) => {
    const total = ACTIONS.length;
    const granted = ACTIONS.filter(a => perms.has(`${resKey}:${a.key}`)).length;
    return { total, granted, percent: total > 0 ? Math.round((granted / total) * 100) : 0 };
  };

  return (
    <div className="space-y-4">
      {/* Permission Summary */}
      <div className={cn("flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/30", isRTL && "flex-row-reverse")}>
        <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
          <ShieldCheck className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-semibold">{admin.name}</p>
            <p className="text-[10px] text-muted-foreground">{admin.email} · <Badge className={cn("text-[9px]", admin.role === "super_admin" ? "bg-red-500/10 text-red-600" : admin.role === "admin" ? "bg-amber-500/10 text-amber-600" : "bg-sky-500/10 text-sky-600")}>{admin.role}</Badge></p>
          </div>
        </div>
        <div className={cn("text-end", isRTL && "text-start")}>
          <p className="text-lg font-bold text-primary">{perms.size}</p>
          <p className="text-[10px] text-muted-foreground">{isRTL ? "مجوز فعال" : "active perms"}</p>
        </div>
      </div>

      {/* Quick Templates */}
      <div>
        <p className="text-xs font-semibold mb-2 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-500" />{isRTL ? "الگوهای سریع دسترسی" : "Quick Permission Templates"}</p>
        <div className="flex flex-wrap gap-1.5">
          {PERMISSION_TEMPLATES.map((t) => (
            <button key={t.key} type="button" onClick={() => applyTemplate(t.key)}
              className={cn("text-[10px] px-2.5 py-1.5 rounded-lg border transition-all",
                activeTemplate === t.key ? "bg-primary/10 border-primary/30 text-primary font-semibold ring-1 ring-primary/20" : "border-border/50 text-muted-foreground hover:border-primary/30 hover:bg-primary/5"
              )}
              title={isRTL ? t.descFa : t.descEn}>
              {isRTL ? t.labelFa : t.labelEn}
            </button>
          ))}
        </div>
        <div className={cn("flex gap-2 mt-2", isRTL && "flex-row-reverse")}>
          <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" onClick={grantAll}>{isRTL ? "فعال کردن همه" : "Grant All"}</Button>
          <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] rounded-lg text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={clearAll}>{isRTL ? "غیرفعال کردن همه" : "Clear All"}</Button>
        </div>
      </div>

      {/* Categorized Permission Sections */}
      {RESOURCE_CATEGORIES.map((cat) => {
        const catResources = RESOURCES.filter(r => r.category === cat.key);
        const stats = getCategoryStats(cat.key);
        const isExpanded = expandedCategory === cat.key;

        return (
          <div key={cat.key} className="border border-border/40 rounded-xl overflow-hidden">
            <button type="button" className={cn("w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors", isRTL && "flex-row-reverse")}
              onClick={() => setExpandedCategory(isExpanded ? "" : cat.key)}>
              <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <ChevronDown className={cn("w-4 h-4 transition-transform", isExpanded ? "rotate-0" : "-rotate-90")} />
                <span className="text-sm font-semibold">{isRTL ? cat.labelFa : cat.labelEn}</span>
                <Badge variant="outline" className={cn("text-[9px] px-1.5", stats.percent === 100 ? "text-emerald-500 border-emerald-500/30" : stats.percent > 0 ? "text-amber-500 border-amber-500/30" : "text-muted-foreground")}>
                  {stats.granted}/{stats.total}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", stats.percent === 100 ? "bg-emerald-500" : stats.percent > 50 ? "bg-amber-500" : stats.percent > 0 ? "bg-primary" : "bg-muted")} style={{ width: `${stats.percent}%` }} />
                </div>
                <span className="text-[10px] text-muted-foreground w-8 text-end">{stats.percent}%</span>
                <Button type="button" variant="ghost" size="sm" className="h-6 px-1.5 text-[9px]" onClick={(e) => { e.stopPropagation(); toggleAllForCategory(cat.key, stats.percent < 100); }}>
                  {stats.percent < 100 ? (isRTL ? "همه" : "All") : (isRTL ? "هیچ" : "None")}
                </Button>
              </div>
            </button>
            <AnimatePresence>
              {isExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="px-3 pb-3 space-y-2">
                    {catResources.map((res) => {
                      const resStats = getResourceStats(res.key);
                      return (
                        <div key={res.key} className="rounded-lg border border-border/30 p-2.5 space-y-2">
                          <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                              <span className="text-xs font-semibold">{isRTL ? res.labelFa : res.labelEn}</span>
                              <span className="text-[9px] text-muted-foreground">— {isRTL ? res.descFa : res.descEn}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                                <div className={cn("h-full rounded-full", resStats.percent === 100 ? "bg-emerald-500" : resStats.percent > 0 ? "bg-primary" : "bg-muted")} style={{ width: `${resStats.percent}%` }} />
                              </div>
                              <span className="text-[9px] text-muted-foreground w-6 text-end">{resStats.granted}/{resStats.total}</span>
                              <Button type="button" variant="ghost" size="sm" className="h-5 px-1.5 text-[8px]" onClick={() => toggleAllForResource(res.key, resStats.percent < 100)}>
                                {resStats.percent < 100 ? (isRTL ? "همه" : "All") : (isRTL ? "هیچ" : "None")}
                              </Button>
                            </div>
                          </div>
                          <div className={cn("flex flex-wrap gap-1.5", isRTL && "flex-row-reverse")}>
                            {ACTIONS.map((act) => {
                              const isActive = perms.has(`${res.key}:${act.key}`);
                              return (
                                <button key={`${res.key}-${act.key}`} type="button" onClick={() => toggle(res.key, act.key)}
                                  title={isRTL ? act.descFa : act.descEn}
                                  className={cn("text-[9px] px-2 py-1 rounded-md border transition-all font-medium",
                                    isActive ? "bg-primary/10 border-primary/30 text-primary ring-1 ring-primary/10" : "border-border/30 text-muted-foreground hover:border-border/60 hover:bg-muted/30"
                                  )}>
                                  {isRTL ? act.labelFa : act.labelEn}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Save Button */}
      <div className={cn("flex items-center justify-between pt-2", isRTL && "flex-row-reverse")}>
        <p className="text-[10px] text-muted-foreground">{perms.size} {isRTL ? "مجوز انتخاب شده" : "permissions selected"}</p>
        <Button size="sm" onClick={save} disabled={saving} className="rounded-xl">
          {saving && <Loader2 className="w-3.5 h-3.5 me-1 animate-spin" />}
          {isRTL ? "ذخیره مجوزها" : "Save Permissions"}
        </Button>
      </div>
    </div>
  );
}
