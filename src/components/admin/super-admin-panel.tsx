"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuthStore, authFetch } from "@/lib/auth/store";
import { useAdminPermissions } from "@/lib/auth/use-admin-permissions";
import { AccessDenied } from "@/components/admin/access-denied";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { RegistrationForm } from "@/components/auth/registration-form";
import { UnifiedUsersTab } from "@/components/admin/tabs/unified-users-tab";
import { formatJalaaliDate, toPersianDigits } from "@/lib/jalali";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  LayoutDashboard, Shield, Key, FileText, Monitor, Users,
  Settings, Music, X, Lock, Loader2,
  Plus, Trash2, Edit3, Search, RefreshCw, CheckCircle2,
  XCircle, AlertTriangle, Clock, Mail, Phone, Globe,
  Smartphone, Activity, Eye, EyeOff, Save, UserPlus, ShieldCheck,
  BarChart3, Calendar, MessageSquare, GraduationCap,
  ChevronDown, Database, Star, Flag, Home, ToggleLeft, Menu,
  MonitorSmartphone, Tablet, LogOut, TrendingUp, TrendingDown,
  Bell, Send, Inbox, Archive, Zap, Hash, Image as ImageIcon,
  ClipboardList, CreditCard, Wallet, PhoneCall, UserCheck,
  DollarSign, Receipt, ArrowUpDown, CircleDot,
  CalendarClock, CalendarX, CalendarCheck, Timer, DoorOpen, Repeat,
  ThumbsUp, ThumbsDown, CalendarDays, MapPin, AlertCircle, Pin,
  Server, Cpu, HardDrive, Wifi, WifiOff, ArrowUpRight, ArrowDownRight,
  PieChart as PieChartIcon, BarChart as BarChartIcon, LineChart as LineChartIcon,
  ShieldAlert
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend as RechartsLegend
} from "recharts";

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
interface DashboardMetrics {
  totalUsers: number;
  totalStudents: number;
  totalInstructors: number;
  totalAdmins: number;
  totalCourses: number;
  totalWorkshops: number;
  totalEnrollments: number;
  totalTickets: number;
  totalBlogPosts: number;
  totalAnnouncements: number;
  unreadMessages: number;
  unreadAdminMessages: number;
  unreadContactMessages: number;
  pendingTestimonials: number;
  recentRegistrations24h: number;
  recentEnrollments24h: number;
  unpaidEnrollments: number;
  totalRevenue: number;
  activeEnrollments: number;
  workshopRevenue: number;
}

interface DashboardData {
  metrics: DashboardMetrics;
  distributions: {
    instruments: Array<{ primaryInstrument: string; _count: { primaryInstrument: number } }>;
    referrals: Array<{ referralSource: string; _count: { referralSource: number } }>;
    genders: Array<{ gender: string; _count: { gender: number } }>;
    enrollmentStatus: Array<{ status: string; _count: { status: number } }>;
  };
  recentRegistrations: Array<{
    id: string; name: string; email: string; phone: string | null;
    role: string; createdAt: string; referralSource: string | null; primaryInstrument: string | null;
    registrationInstrument: string | null;
  }>;
  upcomingWorkshops: Array<{
    id: string; titleFa: string; titleEn: string; date: string;
    totalSeats: number; reservedSeats: number; category: string | null; isHot: boolean;
    startTime: string | null; endTime: string | null; locationFa: string | null; locationEn: string | null;
  }>;
  recentEnrollmentsList: Array<{
    id: string; status: string; enrolledAt: string; registrationMethod: string; paymentStatus: string;
    tuitionAmount: number | null;
    student: { id: string; name: string; phone: string | null; email: string };
    course: { id: string; titleFa: string; titleEn: string; instrument: string | null };
  }>;
  monthlyRevenue: Array<{ month: string; revenue: number; count: number }>;
  monthlyEnrollments: Array<{ month: string; count: number }>;
  systemHealth: {
    dbStatus: string;
    activeSessionsCount: number;
    failedLoginAttempts: number;
    lockedAdmins: number;
    recentFailedLogins: number;
    lastBackup: string | null;
  };
}

interface UserEntry {
  id: string; name: string; email: string; phone: string | null;
  primaryInstrument: string | null; role: string; isActive: boolean;
  isVerified: boolean; createdAt: string; lastLogin: string | null;
  leadScore: number; aiSegmentTag: string | null;
  specialtyFa: string | null; isPublishedInstructor: boolean;
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

interface AuditLogEntry {
  id: string; adminId: string | null; action: string;
  entity: string; entityId: string | null; entityName: string | null;
  details: string | null; ipAddress: string | null;
  userAgent: string | null; severity: string; createdAt: string;
  admin: { id: string; name: string; email: string; role: string } | null;
}

interface SessionEntry {
  id: string; adminId: string | null; studentId: string | null;
  userType: string; ipAddress: string; userAgent: string | null;
  country: string | null; city: string | null;
  deviceType: string | null; browser: string | null; os: string | null;
  loginAt: string; logoutAt: string | null; isActive: boolean;
  admin: { name: string; email: string; role: string } | null;
  student: { name: string; email: string } | null;
}

interface AdminMessageEntry {
  id: string; senderId: string; recipientId: string;
  subject: string; content: string; priority: string;
  status: string; isSystemMessage: boolean; readAt: string | null;
  createdAt: string;
  sender: { id: string; name: string; email: string; role: string; avatarUrl: string | null };
  recipient: { id: string; name: string; email: string; role: string; avatarUrl: string | null };
}

interface DeviceEntry {
  id: string; adminId: string; deviceName: string; deviceType: string;
  browser: string | null; os: string | null; deviceFingerprint: string | null;
  ipAddress: string | null; isApproved: boolean; lastUsedAt: string | null;
  createdAt: string;
  admin: { id: string; name: string; email: string; role: string };
}

interface IntrusionAlertEntry {
  id: string; targetAdminId: string | null; attemptType: string;
  ipAddress: string; userAgent: string | null; country: string | null;
  city: string | null; attemptCount: number; details: string | null;
  isResolved: boolean; resolvedBy: string | null; resolvedAt: string | null;
  createdAt: string;
  targetAdmin: { id: string; name: string; email: string; role: string } | null;
}

interface BackupEntry {
  id: string; performedBy: string | null; backupType: string;
  fileSize: number | null; fileKey: string | null; checksum: string | null;
  checksumAlgorithm: string | null; encryptionUsed: boolean;
  status: string; notes: string | null; createdAt: string;
  admin: { id: string; name: string; email: string } | null;
}

interface AnalyticsData {
  registrations: { total: number; byDay: Record<string, number>; byInstrument: Record<string, number>; byReferral: Record<string, number> };
  logins: { total7d: number; byDay: Record<string, { admin: number; student: number }>; uniqueIPs24h: number; suspiciousIPs: Array<{ ip: string; count: number }> };
  devices: { types: Record<string, number>; browsers: Record<string, number> };
  demographics: { genders: Array<{ gender: string; _count: { gender: number } }>; ageGroups: Record<string, number>; referrals: Array<{ referralSource: string; _count: { referralSource: number } }> };
  content: { totalBlogViews: number; topPosts: Array<{ id: string; titleFa: string; titleEn: string; viewCount: number; isFeatured: boolean }>; workshopOccupancy: Array<{ id: string; titleFa: string; titleEn: string; totalSeats: number; reservedSeats: number; occupancyRate: number; date: string }> };
  enrollments: { total30d: number; byDay: Record<string, number> };
}

interface ContentItem {
  id: string; titleFa: string; titleEn: string;
  isPublished: boolean; isFeatured: boolean; isShowOnHome: boolean; isPinned?: boolean; isNew: boolean;
  coverUrl?: string | null; contentFa?: string | null; contentEn?: string | null;
  createdAt: string; [key: string]: unknown;
}

// Helper: auto-calculate isNew based on createdAt (within 30 days)
function isItemNew(createdAt: string): boolean {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return new Date(createdAt).getTime() > thirtyDaysAgo;
}

// Helper: validate content before publishing
function validateContentForPublish(item: ContentItem, type: string): string[] {
  const missing: string[] = [];
  if (!item.titleFa && !item.titleEn) missing.push("عنوان / Title");
  if (type === "blog" && !item.contentFa && !item.contentEn) missing.push("محتوا / Content");
  if (type === "blog" && !item.coverUrl) missing.push("تصویر کاور / Cover Image");
  return missing;
}

// Helper: log critical admin action
async function logAuditAction(action: string, entity: string, entityId: string | null, details: string) {
  try {
    await authFetch("/api/admin/audit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, entity, entityId, details, severity: "warning" }),
    });
  } catch { /* silent */ }
}

interface SiteSettingEntry {
  id: string; key: string; value: string; createdAt: string; updatedAt: string;
}

// ============================================
// COURSE MANAGEMENT TYPES
// ============================================
interface CourseEntry {
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
  isShowOnHome: boolean;
  isNew: boolean;
  registrationOpen: boolean;
  registrationOpenAt: string | null;
  registrationCloseAt: string | null;
  maxCapacity: number | null;
  branchId: string | null;
  instructorId: string | null;
  createdAt: string;
  branch: { id: string; nameFa: string; nameEn: string } | null;
  instructor: { id: string; name: string; specialtyFa: string | null; specialtyEn: string | null; avatarUrl: string | null } | null;
  _count: { enrollments: number };
}

// ============================================
// WORKSHOP TICKET TYPES
// ============================================
interface WorkshopTicketEntry {
  id: string;
  studentId: string;
  workshopId: string;
  seatNumber: number | null;
  status: string; // reserved | paid | cancelled | attended
  amount: number | null;
  registrationMethod: string;
  registeredByAdminId: string | null;
  paymentRef: string | null;
  paidAt: string | null;
  createdAt: string;
  student: {
    id: string; name: string; email: string; phone: string | null;
    primaryInstrument: string | null;
  };
  workshop: {
    id: string; titleFa: string; titleEn: string;
    date: string; startTime: string | null; endTime: string | null;
    price: number | null; discountPrice: number | null;
    totalSeats: number; reservedSeats: number;
    isHot: boolean;
    locationFa: string | null; locationEn: string | null;
  };
}

const TICKET_STATUS_CONFIG: Record<string, { labelFa: string; labelEn: string; color: string; icon: typeof CircleDot }> = {
  reserved: { labelFa: "رزرو شده", labelEn: "Reserved", color: "bg-sky-500/10 text-sky-600 dark:text-sky-400", icon: Clock },
  paid: { labelFa: "پرداخت‌شده", labelEn: "Paid", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: CheckCircle2 },
  cancelled: { labelFa: "لغو شده", labelEn: "Cancelled", color: "bg-red-500/10 text-red-600 dark:text-red-400", icon: XCircle },
  attended: { labelFa: "حاضر", labelEn: "Attended", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400", icon: UserCheck },
};

// ============================================
// REGISTRATIONS TAB TYPES & CONFIG
// ============================================
interface EnrollmentEntry {
  id: string;
  studentId: string;
  courseId: string;
  status: string;
  progress: number;
  enrolledAt: string;
  completedAt: string | null;
  notes: string | null;
  registrationMethod: string;
  registeredByAdminId: string | null;
  tuitionAmount: number | null;
  paymentStatus: string;
  paidAt: string | null;
  paymentDueDate: string | null;
  paymentRef: string | null;
  lastEditedByAdminId: string | null;
  lastEditedAt: string | null;
  student: {
    id: string; name: string; email: string; phone: string | null;
    primaryInstrument: string | null; registrationInstrument: string | null;
  };
  course: {
    id: string; titleFa: string; titleEn: string;
    instrument: string | null; level: string; price: number | null;
    branch: { id: string; nameFa: string; nameEn: string } | null;
  };
  payments: Array<{
    id: string; amount: number; status: string; paymentType: string;
    paymentMethod: string | null; paidAt: string | null; paymentRef: string | null;
    installmentNumber: number | null; totalInstallments: number | null;
    dueDate: string | null; createdAt: string;
  }>;
}

interface CourseOption {
  id: string; titleFa: string; titleEn: string;
}

const PAYMENT_STATUS_CONFIG: Record<string, { labelFa: string; labelEn: string; color: string; icon: typeof DollarSign }> = {
  unpaid: { labelFa: "پرداخت‌نشده", labelEn: "Unpaid", color: "bg-red-500/10 text-red-600 dark:text-red-400", icon: XCircle },
  paid: { labelFa: "پرداخت‌شده", labelEn: "Paid", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: CheckCircle2 },
  partial: { labelFa: "پرداخت جزئی", labelEn: "Partial", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: Clock },
  waived: { labelFa: "معاف", labelEn: "Waived", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400", icon: Shield },
};

// Individual Payment record status (different from enrollment-level paymentStatus).
// Matches the API's VALID_STATUSES in /api/admin/payments/route.ts.
const PAYMENT_RECORD_STATUS_CONFIG: Record<string, { labelFa: string; labelEn: string; color: string; icon: typeof DollarSign }> = {
  pending: { labelFa: "در انتظار", labelEn: "Pending", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: Clock },
  paid: { labelFa: "پرداخت‌شده", labelEn: "Paid", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: CheckCircle2 },
  overdue: { labelFa: "سررسید گذشته", labelEn: "Overdue", color: "bg-red-500/10 text-red-600 dark:text-red-400", icon: AlertTriangle },
  cancelled: { labelFa: "لغوشده", labelEn: "Cancelled", color: "bg-muted text-muted-foreground", icon: XCircle },
  failed: { labelFa: "ناموفق", labelEn: "Failed", color: "bg-red-500/10 text-red-600 dark:text-red-400", icon: XCircle },
  refunded: { labelFa: "بازگشت‌داده‌شده", labelEn: "Refunded", color: "bg-sky-500/10 text-sky-600 dark:text-sky-400", icon: Repeat },
};

const PAYMENT_METHOD_CONFIG: Record<string, { labelFa: string; labelEn: string; icon: typeof DollarSign }> = {
  cash: { labelFa: "نقدی", labelEn: "Cash", icon: Wallet },
  card: { labelFa: "کارت", labelEn: "Card", icon: CreditCard },
  transfer: { labelFa: "انتقال بانکی", labelEn: "Bank Transfer", icon: ArrowUpDown },
  pos: { labelFa: "POS", labelEn: "POS", icon: CreditCard },
  online: { labelFa: "آنلاین", labelEn: "Online", icon: Globe },
  cheque: { labelFa: "چک", labelEn: "Cheque", icon: FileText },
  other: { labelFa: "سایر", labelEn: "Other", icon: CircleDot },
};

const PAYMENT_TYPE_CONFIG: Record<string, { labelFa: string; labelEn: string }> = {
  full: { labelFa: "کامل", labelEn: "Full" },
  installment: { labelFa: "قسط", labelEn: "Installment" },
  partial: { labelFa: "جزئی", labelEn: "Partial" },
  refund: { labelFa: "بازگشت", labelEn: "Refund" },
};

const REGISTRATION_METHOD_CONFIG: Record<string, { labelFa: string; labelEn: string; color: string; icon: typeof Monitor }> = {
  online: { labelFa: "آنلاین", labelEn: "Online", color: "bg-sky-500/10 text-sky-600 dark:text-sky-400", icon: Monitor },
  phone: { labelFa: "تلفنی", labelEn: "Phone", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: PhoneCall },
  in_person: { labelFa: "حضوری", labelEn: "In-Person", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: UserCheck },
};

const ENROLLMENT_STATUS_CONFIG: Record<string, { labelFa: string; labelEn: string; color: string }> = {
  active: { labelFa: "فعال", labelEn: "Active", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  completed: { labelFa: "تکمیل‌شده", labelEn: "Completed", color: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  paused: { labelFa: "متوقف", labelEn: "Paused", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  dropped: { labelFa: "رهاشده", labelEn: "Dropped", color: "bg-red-500/10 text-red-600 dark:text-red-400" },
};

// Helper: Format toman amount with Farsi digits
function formatToman(amount: number | null, isRTL: boolean): string {
  if (amount === null || amount === undefined) return "—";
  const formatted = amount.toLocaleString(isRTL ? "fa-IR" : "en-US");
  return isRTL ? `${formatted} تومان` : `${formatted} Toman`;
}

// ============================================
// CONSTANTS
// ============================================
// Permission resource categories for grouping
const RESOURCE_CATEGORIES = [
  { key: "people", labelFa: "👥 مدیریت افراد", labelEn: "👥 People Management" },
  { key: "content", labelFa: "📝 مدیریت محتوا", labelEn: "📝 Content Management" },
  { key: "operations", labelFa: "⚙️ عملیات", labelEn: "⚙️ Operations" },
  { key: "system", labelFa: "🔒 سیستم و امنیت", labelEn: "🔒 System & Security" },
];

const RESOURCES = [
  // People Management
  { key: "users", labelFa: "کاربران", labelEn: "Users", descFa: "مدیریت هنرجویان و مدرسین", descEn: "Manage students & instructors", category: "people" },
  { key: "instructors", labelFa: "مدرسین", labelEn: "Instructors", descFa: "مدیریت پروفایل مدرسین", descEn: "Manage instructor profiles", category: "people" },
  { key: "enrollments", labelFa: "ثبت‌نام‌ها", labelEn: "Enrollments", descFa: "مدیریت ثبت‌نام دوره‌ها", descEn: "Manage course enrollments", category: "people" },
  { key: "payments", labelFa: "پرداخت‌ها", labelEn: "Payments", descFa: "مدیریت شهریه و پرداخت‌ها", descEn: "Manage tuition & payments", category: "people" },
  { key: "testimonials", labelFa: "بازخوردها", labelEn: "Testimonials", descFa: "مدیریت نظرات و بازخوردها", descEn: "Manage reviews & testimonials", category: "people" },
  // Content Management
  { key: "courses", labelFa: "دوره‌ها", labelEn: "Courses", descFa: "مدیریت دوره‌های آموزشی", descEn: "Manage courses", category: "content" },
  { key: "workshops", labelFa: "کارگاه‌ها", labelEn: "Workshops", descFa: "مدیریت کارگاه‌ها", descEn: "Manage workshops", category: "content" },
  { key: "blog", labelFa: "بلاگ", labelEn: "Blog", descFa: "مدیریت مقالات بلاگ", descEn: "Manage blog posts", category: "content" },
  { key: "announcements", labelFa: "اعلانات", labelEn: "Announcements", descFa: "مدیریت اعلانات و اخبار", descEn: "Manage announcements", category: "content" },
  { key: "media", labelFa: "رسانه", labelEn: "Media", descFa: "مدیریت تصاویر و فایل‌ها", descEn: "Manage images & files", category: "content" },
  { key: "newsletter", labelFa: "خبرنامه", labelEn: "Newsletter", descFa: "مدیریت خبرنامه", descEn: "Manage newsletter", category: "content" },
  // Operations
  { key: "schedules", labelFa: "برنامه کلاس‌ها", labelEn: "Schedules", descFa: "مدیریت برنامه و ساعات کلاس", descEn: "Manage class schedules", category: "operations" },
  { key: "branches", labelFa: "شعب", labelEn: "Branches", descFa: "مدیریت شعب", descEn: "Manage branches", category: "operations" },
  { key: "messages", labelFa: "پیام‌های تماس", labelEn: "Contact Messages", descFa: "مشاهده پیام‌های فرم تماس", descEn: "View contact form messages", category: "operations" },
  // System & Security
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

// Predefined permission templates for common admin roles
const PERMISSION_TEMPLATES = [
  {
    key: "content_manager",
    labelFa: "مدیر محتوا",
    labelEn: "Content Manager",
    descFa: "مدیریت کامل محتوا (بلاگ، اعلانات، رسانه)",
    descEn: "Full content management (blog, announcements, media)",
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
    key: "finance_manager",
    labelFa: "مدیر مالی",
    labelEn: "Finance Manager",
    descFa: "مدیریت پرداخت‌ها، شهریه و ثبت‌نام‌ها",
    descEn: "Manage payments, tuition & enrollments",
    permissions: [
      { resource: "payments", actions: ["read", "update", "manage", "export"] },
      { resource: "enrollments", actions: ["read", "update", "manage", "assign"] },
      { resource: "users", actions: ["read"] },
      { resource: "courses", actions: ["read"] },
      { resource: "workshops", actions: ["read"] },
    ],
  },
  {
    key: "registration_officer",
    labelFa: "مسئول ثبت‌نام",
    labelEn: "Registration Officer",
    descFa: "ثبت‌نام هنرجویان و مدیریت دوره‌ها",
    descEn: "Register students & manage courses",
    permissions: [
      { resource: "users", actions: ["create", "read", "update"] },
      { resource: "enrollments", actions: ["create", "read", "update", "assign"] },
      { resource: "courses", actions: ["read"] },
      { resource: "workshops", actions: ["read"] },
      { resource: "schedules", actions: ["read"] },
    ],
  },
  {
    key: "instructor_manager",
    labelFa: "مدیر مدرسین",
    labelEn: "Instructor Manager",
    descFa: "مدیریت مدرسین و برنامه کلاس‌ها",
    descEn: "Manage instructors & class schedules",
    permissions: [
      { resource: "instructors", actions: ["read", "update", "manage"] },
      { resource: "schedules", actions: ["create", "read", "update", "delete", "manage"] },
      { resource: "courses", actions: ["read", "update"] },
      { resource: "users", actions: ["read"] },
    ],
  },
  {
    key: "support_agent",
    labelFa: "پشتیبان",
    labelEn: "Support Agent",
    descFa: "مشاهده اطلاعات و پاسخ به پیام‌ها",
    descEn: "View info & respond to messages",
    permissions: [
      { resource: "users", actions: ["read"] },
      { resource: "messages", actions: ["read", "update"] },
      { resource: "enrollments", actions: ["read"] },
      { resource: "courses", actions: ["read"] },
      { resource: "workshops", actions: ["read"] },
      { resource: "testimonials", actions: ["read", "approve"] },
      { resource: "contact_messages", actions: ["read", "update"] },
    ],
  },
  {
    key: "full_access",
    labelFa: "دسترسی کامل",
    labelEn: "Full Access",
    descFa: "دسترسی کامل به همه بخش‌ها (به جز حذف)",
    descEn: "Full access to all sections (except delete)",
    permissions: RESOURCES.map(r => ({
      resource: r.key,
      actions: ACTIONS.filter(a => a.key !== "delete").map(a => a.key),
    })),
  },
];

const TABS = [
  { value: "dashboard", icon: LayoutDashboard, labelFa: "داشبورد", labelEn: "Dashboard" },
  { value: "users", icon: Users, labelFa: "کاربران", labelEn: "Users" },
  { value: "instructors", icon: GraduationCap, labelFa: "اساتید", labelEn: "Instructors" },
  { value: "courses", icon: Music, labelFa: "دوره‌ها", labelEn: "Courses" },
  { value: "content", icon: FileText, labelFa: "محتوا", labelEn: "Content" },
  { value: "class-schedules", icon: CalendarClock, labelFa: "برنامه کلاس‌ها", labelEn: "Class Schedules" },
  { value: "schedule-requests", icon: ClipboardList, labelFa: "درخواست‌های تغییر", labelEn: "Schedule Requests" },
  { value: "registrations", icon: ClipboardList, labelFa: "ثبت‌نام‌ها", labelEn: "Registrations" },
  { value: "pending-registrations", icon: UserPlus, labelFa: "ثبت‌نام‌های آنلاین", labelEn: "Online Registrations" },
  { value: "workshop-tickets", icon: Receipt, labelFa: "بلیت کارگاه", labelEn: "Workshop Tickets" },
  { value: "financial", icon: CreditCard, labelFa: "مالی", labelEn: "Financial" },
  { value: "messages", icon: MessageSquare, labelFa: "پیام‌ها", labelEn: "Messages" },
  { value: "testimonials", icon: Star, labelFa: "بازخوردها", labelEn: "Testimonials" },
  { value: "security", icon: ShieldCheck, labelFa: "امنیت", labelEn: "Security" },
  { value: "backups", icon: Database, labelFa: "بکاپ‌ها", labelEn: "Backups" },
  { value: "analytics", icon: TrendingUp, labelFa: "تحلیل‌ها", labelEn: "Analytics" },
  { value: "audit-logs", icon: FileText, labelFa: "لاگ فعالیت", labelEn: "Audit Logs" },
  { value: "settings", icon: Settings, labelFa: "تنظیمات", labelEn: "Settings" },
] as const;

type TabValue = typeof TABS[number]["value"];

// ============================================
// REGISTRATION FORM CONSTANTS
// (Used by RegistrationForm for comprehensive user creation)
// ============================================
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

const REG_GENDERS = [
  { value: "male", fa: "مرد", en: "Male" },
  { value: "female", fa: "زن", en: "Female" },
  { value: "other", fa: "سایر", en: "Other" },
  { value: "prefer_not_to_say", fa: "ترجیح می‌دهم نگویم", en: "Prefer not to say" },
];

const REG_EDUCATION_LEVELS = [
  { value: "diploma", fa: "دیپلم", en: "Diploma" },
  { value: "associate", fa: "کاردانی", en: "Associate" },
  { value: "bachelor", fa: "کارشناسی", en: "Bachelor" },
  { value: "master", fa: "کارشناسی ارشد", en: "Master" },
  { value: "phd", fa: "دکتری", en: "PhD" },
  { value: "other", fa: "سایر", en: "Other" },
];

const REG_PREVIOUS_TRAINING = [
  { value: "none", fa: "بدون سابقه", en: "None" },
  { value: "self_taught", fa: "خودآموز", en: "Self-taught" },
  { value: "private_tutor", fa: "معلم خصوصی", en: "Private Tutor" },
  { value: "music_school", fa: "مدرسه موسیقی", en: "Music School" },
  { value: "university", fa: "دانشگاه", en: "University" },
  { value: "online_courses", fa: "دوره آنلاین", en: "Online Courses" },
];

const REG_MUSIC_GENRES = [
  { value: "classical", fa: "کلاسیک", en: "Classical" },
  { value: "iranian_traditional", fa: "سنتی ایرانی", en: "Iranian Traditional" },
  { value: "pop", fa: "پاپ", en: "Pop" },
  { value: "jazz", fa: "جاز", en: "Jazz" },
  { value: "rock", fa: "راک", en: "Rock" },
  { value: "blues", fa: "بلوز", en: "Blues" },
  { value: "folk", fa: "فولک", en: "Folk" },
  { value: "electronic", fa: "الکترونیک", en: "Electronic" },
  { value: "other", fa: "سایر", en: "Other" },
];

const REG_LEARNING_GOALS = [
  { value: "hobby", fa: "سرگرمی", en: "Hobby" },
  { value: "professional_career", fa: "حرفه‌ای", en: "Professional Career" },
  { value: "teaching", fa: "تدریس", en: "Teaching" },
  { value: "performance", fa: "اجرای زنده", en: "Performance" },
  { value: "composition", fa: "آهنگسازی", en: "Composition" },
  { value: "exam_prep", fa: "آمادگی آزمون", en: "Exam Prep" },
  { value: "self_improvement", fa: "توسعه شخصی", en: "Self Improvement" },
];

const REG_SKILL_LEVELS = [
  { value: "beginner", fa: "مبتدی", en: "Beginner" },
  { value: "intermediate", fa: "متوسط", en: "Intermediate" },
  { value: "advanced", fa: "پیشرفته", en: "Advanced" },
  { value: "professional", fa: "حرفه‌ای", en: "Professional" },
];

const REG_PARENT_RELATIONS = [
  { value: "father", fa: "پدر", en: "Father" },
  { value: "mother", fa: "مادر", en: "Mother" },
  { value: "guardian", fa: "سرپرست", en: "Guardian" },
  { value: "other", fa: "سایر", en: "Other" },
];

const REG_REFERRAL_SOURCES = [
  { value: "instagram", fa: "اینستاگرام", en: "Instagram" },
  { value: "telegram", fa: "تلگرام", en: "Telegram" },
  { value: "google", fa: "گوگل", en: "Google" },
  { value: "friend", fa: "دوستان", en: "Friend" },
  { value: "billboard", fa: "بیلبورد", en: "Billboard" },
  { value: "website", fa: "وبسایت", en: "Website" },
  { value: "event", fa: "رویداد", en: "Event" },
  { value: "other", fa: "سایر", en: "Other" },
];

const REG_IRANIAN_PROVINCES = [
  { value: "tehran", fa: "تهران", en: "Tehran" },
  { value: "isfahan", fa: "اصفهان", en: "Isfahan" },
  { value: "fars", fa: "فارس", en: "Fars" },
  { value: "khorasan_razavi", fa: "خراسان رضوی", en: "Khorasan Razavi" },
  { value: "east_azerbaijan", fa: "آذربایجان شرقی", en: "East Azerbaijan" },
  { value: "mazandaran", fa: "مازندران", en: "Mazandaran" },
  { value: "gilan", fa: "گیلان", en: "Gilan" },
  { value: "khuzestan", fa: "خوزستان", en: "Khuzestan" },
  { value: "kerman", fa: "کرمان", en: "Kerman" },
  { value: "alborz", fa: "البرز", en: "Alborz" },
  { value: "other", fa: "سایر", en: "Other" },
];

const REG_BRANCHES = [
  { value: "main", fa: "شعبه اصلی (بلوار معلم)", en: "Main Branch (Moallem Blvd)" },
  { value: "west", fa: "شعبه غرب (آریاشهر)", en: "West Branch (Ariashahr)" },
  { value: "north", fa: "شعبه شمال (تجریش)", en: "North Branch (Tajrish)" },
  { value: "other", fa: "سایر", en: "Other" },
];

// ============================================
// HELPERS
// ============================================
function formatDate(dateStr: string, isRTL: boolean): string {
  try {
    if (isRTL) {
      const jalaliFormatted = formatJalaaliDate(dateStr, isRTL, "long");
      if (jalaliFormatted && jalaliFormatted !== dateStr) return jalaliFormatted;
    }
    return new Date(dateStr).toLocaleDateString(isRTL ? "fa-IR" : "en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch { return dateStr; }
}

function formatDateTime(dateStr: string, isRTL: boolean): string {
  try {
    if (isRTL) {
      const jalaliDate = formatJalaaliDate(dateStr, isRTL, "long");
      const time = new Date(dateStr).toLocaleTimeString(isRTL ? "fa-IR" : "en-US", { hour: "2-digit", minute: "2-digit" });
      if (jalaliDate && jalaliDate !== dateStr) {
        return `${jalaliDate} - ${isRTL ? toPersianDigits(time) : time}`;
      }
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

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getSeverityColor(severity: string) {
  const m: Record<string, string> = {
    info: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    critical: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  };
  return m[severity] || m.info;
}

function getPriorityColor(priority: string) {
  const m: Record<string, string> = {
    low: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
    normal: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    high: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    urgent: "bg-red-500/10 text-red-600 dark:text-red-400",
  };
  return m[priority] || m.normal;
}

function getRoleBadge(role: string, isRTL: boolean) {
  if (role === "instructor") return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]">{isRTL ? "مدرس" : "Instructor"}</Badge>;
  if (role === "admin" || role === "super_admin") return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px]">{isRTL ? "مدیر" : "Admin"}</Badge>;
  return <Badge className="bg-primary/10 text-primary text-[10px]">{isRTL ? "هنرجو" : "Student"}</Badge>;
}

function getDeviceIcon(deviceType: string | null) {
  if (deviceType === "mobile") return Smartphone;
  if (deviceType === "tablet") return Tablet;
  return MonitorSmartphone;
}

// ============================================
// LOADING SPINNER
// ============================================
function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );
}

// ============================================
// DASHBOARD TAB
// ============================================
function DashboardTab({ isRTL, onNavigate }: { isRTL: boolean; onNavigate?: (tab: string) => void }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDash = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/admin/dashboard");
      if (res.ok) setData(await res.json());
      else toast.error(isRTL ? "خطا در بارگذاری داشبورد" : "Failed to load dashboard");
    } catch { toast.error(isRTL ? "خطا در ارتباط" : "Connection error"); }
    finally { setLoading(false); }
  }, [isRTL]);

  useEffect(() => { fetchDash(); }, [fetchDash]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchDash, 60000);
    return () => clearInterval(interval);
  }, [fetchDash]);

  if (loading) return <Spinner />;
  if (!data) return null;

  const m = data.metrics;
  const sh = data.systemHealth;

  // Enhanced chart color palette with warm amber/gold tones
  const CHART_COLORS = ["#d97706", "#10b981", "#7c3aed", "#ef4444", "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#0ea5e9", "#8b5cf6"];

  // ─── Instrument distribution chart data ───
  const instrumentChartData = data.distributions.instruments.map((i, idx) => {
    const instrumentLabels: Record<string, { fa: string; en: string }> = {
      piano: { fa: "پیانو", en: "Piano" },
      guitar: { fa: "گیتار", en: "Guitar" },
      violin: { fa: "ویولن", en: "Violin" },
      setar: { fa: "سه‌تار", en: "Setar" },
      tar: { fa: "تار", en: "Tar" },
      kamancheh: { fa: "کمانچه", en: "Kamancheh" },
      drums: { fa: "درامز", en: "Drums" },
      vocals: { fa: "آواز", en: "Vocals" },
      santur: { fa: "سنتور", en: "Santur" },
      oud: { fa: "عود", en: "Oud" },
      flute: { fa: "فلوت", en: "Flute" },
      daf: { fa: "دف", en: "Daf" },
      tonbak: { fa: "تنبک", en: "Tonbak" },
    };
    const label = instrumentLabels[i.primaryInstrument || ""] || { fa: i.primaryInstrument || "سایر", en: i.primaryInstrument || "Other" };
    return {
      name: isRTL ? label.fa : label.en,
      value: i._count.primaryInstrument,
      fill: CHART_COLORS[idx % CHART_COLORS.length],
    };
  });

  // ─── Enrollment status pie chart data ───
  const enrollmentChartData = data.distributions.enrollmentStatus.map((e, idx) => {
    const labels: Record<string, { fa: string; en: string }> = {
      active: { fa: "فعال", en: "Active" },
      completed: { fa: "تکمیل‌شده", en: "Completed" },
      dropped: { fa: "رهاشده", en: "Dropped" },
      suspended: { fa: "معلق", en: "Suspended" },
      paused: { fa: "متوقف", en: "Paused" },
      pending: { fa: "در انتظار", en: "Pending" },
    };
    const l = labels[e.status] || { fa: e.status, en: e.status };
    return {
      name: isRTL ? l.fa : l.en,
      value: e._count,
      fill: CHART_COLORS[idx % CHART_COLORS.length],
    };
  });

  // ─── Gender distribution chart ───
  const genderChartData = data.distributions.genders.map((g, idx) => {
    const labels: Record<string, { fa: string; en: string }> = {
      male: { fa: "مرد", en: "Male" },
      female: { fa: "زن", en: "Female" },
      other: { fa: "سایر", en: "Other" },
      prefer_not_to_say: { fa: "نامشخص", en: "Undisclosed" },
    };
    const l = labels[g.gender] || { fa: g.gender, en: g.gender };
    return { name: isRTL ? l.fa : l.en, value: g._count, fill: CHART_COLORS[idx % CHART_COLORS.length] };
  });

  // ─── Registration method chart (from enrollments) ───
  const regMethodData = data.recentEnrollmentsList ? [
    { name: isRTL ? "آنلاین" : "Online", value: data.recentEnrollmentsList.filter(e => e.registrationMethod === "online").length, fill: "#d97706" },
    { name: isRTL ? "تلفنی" : "Phone", value: data.recentEnrollmentsList.filter(e => e.registrationMethod === "phone").length, fill: "#10b981" },
    { name: isRTL ? "حضوری" : "In-Person", value: data.recentEnrollmentsList.filter(e => e.registrationMethod === "in_person").length, fill: "#7c3aed" },
  ].filter(d => d.value > 0) : [];

  // ─── Referral source bar chart ───
  const referralBarData = data.distributions.referrals.slice(0, 6).map((r) => {
    const labels: Record<string, { fa: string; en: string }> = {
      instagram: { fa: "اینستاگرام", en: "Instagram" },
      website: { fa: "وبسایت", en: "Website" },
      referral: { fa: "معرفی دوست", en: "Friend Referral" },
      walk_in: { fa: "مراجعه حضوری", en: "Walk-in" },
      google: { fa: "گوگل", en: "Google" },
      other: { fa: "سایر", en: "Other" },
    };
    const l = labels[r.referralSource] || { fa: r.referralSource, en: r.referralSource };
    return { name: isRTL ? l.fa : l.en, count: r._count.referralSource };
  });

  // ─── Revenue trend chart data (monthly) ───
  const revenueChartData = (data.monthlyRevenue || []).map((item) => {
    const [year, month] = item.month.split("-");
    const jalaliMonths = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
    const monthNum = parseInt(month);
    // Approximate Jalali month (offset by ~3 months from Gregorian)
    const jalaliMonthIdx = monthNum >= 4 ? monthNum - 3 : monthNum + 9;
    const monthLabel = isRTL ? jalaliMonths[jalaliMonthIdx - 1] : jalaliMonths[jalaliMonthIdx - 1];
    return {
      name: monthLabel,
      revenue: item.revenue,
      count: item.count,
    };
  });

  // ─── Enrollment trend chart data (monthly) ───
  const enrollmentTrendData = (data.monthlyEnrollments || []).map((item) => {
    const [year, month] = item.month.split("-");
    const jalaliMonths = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
    const monthNum = parseInt(month);
    const jalaliMonthIdx = monthNum >= 4 ? monthNum - 3 : monthNum + 9;
    const monthLabel = isRTL ? jalaliMonths[jalaliMonthIdx - 1] : jalaliMonths[jalaliMonthIdx - 1];
    return {
      name: monthLabel,
      enrollments: item.count,
    };
  });

  // ─── HIGH-PRIORITY ALERTS ───
  const priorityAlerts: Array<{
    id: string; type: "urgent" | "warning" | "info"; icon: typeof Bell;
    label: string; detail: string; action?: { tab: string; label: string };
  }> = [];
  if ((m.unpaidEnrollments || 0) > 0) priorityAlerts.push({
    id: "unpaid", type: "urgent", icon: CreditCard,
    label: isRTL ? "ثبت‌نام تسویه‌نشده" : "Unpaid Enrollments",
    detail: isRTL ? `${toPersianDigits(m.unpaidEnrollments)} ثبت‌نام نیازمند پیگیری مالی` : `${m.unpaidEnrollments} enrollments need payment follow-up`,
    action: { tab: "financial", label: isRTL ? "مشاهده" : "View" },
  });
  if ((m.pendingTestimonials || 0) > 0) priorityAlerts.push({
    id: "testimonials", type: "warning", icon: Star,
    label: isRTL ? "بازخوردهای در انتظار تأیید" : "Pending Testimonials",
    detail: isRTL ? `${toPersianDigits(m.pendingTestimonials)} بازخورد نیازمند بررسی` : `${m.pendingTestimonials} testimonials need review`,
    action: { tab: "testimonials", label: isRTL ? "بررسی" : "Review" },
  });
  if ((m.unreadContactMessages || m.unreadMessages || 0) > 0) priorityAlerts.push({
    id: "messages", type: "warning", icon: Mail,
    label: isRTL ? "پیام‌های خوانده‌نشده" : "Unread Messages",
    detail: isRTL ? `${toPersianDigits(m.unreadContactMessages || m.unreadMessages)} پیام تماس خوانده‌نشده` : `${m.unreadContactMessages || m.unreadMessages} unread contact messages`,
    action: { tab: "messages", label: isRTL ? "مشاهده" : "View" },
  });
  if ((m.unreadAdminMessages || 0) > 0) priorityAlerts.push({
    id: "admin-msg", type: "info", icon: MessageSquare,
    label: isRTL ? "پیام‌های داخلی" : "Internal Messages",
    detail: isRTL ? `${toPersianDigits(m.unreadAdminMessages)} پیام داخلی جدید` : `${m.unreadAdminMessages} new internal messages`,
    action: { tab: "messages", label: isRTL ? "مشاهده" : "View" },
  });
  if ((sh?.lockedAdmins || 0) > 0) priorityAlerts.push({
    id: "locked-admins", type: "urgent", icon: Lock,
    label: isRTL ? "حساب‌های قفل‌شده" : "Locked Accounts",
    detail: isRTL ? `${toPersianDigits(sh.lockedAdmins)} حساب مدیر قفل شده است` : `${sh.lockedAdmins} admin accounts are locked`,
    action: { tab: "security", label: isRTL ? "مشاهده" : "View" },
  });
  if ((sh?.recentFailedLogins || 0) > 0) priorityAlerts.push({
    id: "failed-logins", type: "warning", icon: ShieldAlert,
    label: isRTL ? "تلاش‌های ناموفق ورود" : "Failed Login Attempts",
    detail: isRTL ? `${toPersianDigits(sh.recentFailedLogins)} تلاش ناموفق در ۷ روز اخیر` : `${sh.recentFailedLogins} failed attempts in last 7 days`,
    action: { tab: "security", label: isRTL ? "بررسی" : "Review" },
  });
  if ((m.recentRegistrations24h || 0) > 0) priorityAlerts.push({
    id: "new-reg", type: "info", icon: UserPlus,
    label: isRTL ? "ثبت‌نام‌های جدید" : "New Registrations",
    detail: isRTL ? `${toPersianDigits(m.recentRegistrations24h)} ثبت‌نام در ۲۴ ساعت اخیر` : `${m.recentRegistrations24h} registrations in the last 24h`,
    action: { tab: "users", label: isRTL ? "مشاهده" : "View" },
  });

  // ─── ENHANCED KPI CARDS (4 main) ───
  const kpiCards = [
    {
      icon: Users, labelFa: "کل هنرجویان", labelEn: "Total Students",
      value: isRTL ? toPersianDigits(m.totalStudents) : m.totalStudents,
      rawValue: m.totalStudents,
      trend: m.recentRegistrations24h > 0 ? `+${isRTL ? toPersianDigits(m.recentRegistrations24h) : m.recentRegistrations24h}` : null,
      trendUp: true,
      color: "from-amber-500/15 to-amber-500/5", iconBg: "bg-amber-500/15", iconColor: "text-amber-600 dark:text-amber-400",
      progress: Math.min((m.totalStudents / 500) * 100, 100),
    },
    {
      icon: Wallet, labelFa: "درآمد کل (تومان)", labelEn: "Total Revenue (Toman)",
      value: isRTL ? toPersianDigits((m.totalRevenue || 0).toLocaleString("fa-IR")) : (m.totalRevenue || 0).toLocaleString("en-US"),
      rawValue: m.totalRevenue || 0,
      trend: null,
      trendUp: true,
      color: "from-emerald-500/15 to-emerald-500/5", iconBg: "bg-emerald-500/15", iconColor: "text-emerald-600 dark:text-emerald-400",
      progress: Math.min(((m.totalRevenue || 0) / 50000000) * 100, 100),
    },
    {
      icon: ClipboardList, labelFa: "ثبت‌نام‌های فعال", labelEn: "Active Enrollments",
      value: isRTL ? toPersianDigits(m.activeEnrollments || 0) : (m.activeEnrollments || 0),
      rawValue: m.activeEnrollments || 0,
      trend: m.recentEnrollments24h > 0 ? `+${isRTL ? toPersianDigits(m.recentEnrollments24h) : m.recentEnrollments24h}` : null,
      trendUp: true,
      color: "from-primary/15 to-primary/5", iconBg: "bg-primary/15", iconColor: "text-primary",
      progress: Math.min(((m.activeEnrollments || 0) / 200) * 100, 100),
    },
    {
      icon: Calendar, labelFa: "کارگاه‌های پیش رو", labelEn: "Upcoming Workshops",
      value: isRTL ? toPersianDigits((data.upcomingWorkshops || []).length) : (data.upcomingWorkshops || []).length,
      rawValue: (data.upcomingWorkshops || []).length,
      trend: null,
      trendUp: false,
      color: "from-teal-500/15 to-teal-500/5", iconBg: "bg-teal-500/15", iconColor: "text-teal-600 dark:text-teal-400",
      progress: Math.min(((data.upcomingWorkshops || []).length / 10) * 100, 100),
    },
  ];

  // ─── SYSTEM HEALTH MONITOR ───
  const systemHealthItems = [
    {
      icon: Server, label: isRTL ? "سرویس‌دهنده" : "Server",
      status: "ok" as const,
      detail: isRTL ? "فعال" : "Active",
    },
    {
      icon: Database, label: isRTL ? "پایگاه داده" : "Database",
      status: (sh?.dbStatus === "ok" ? "ok" : "error") as "ok" | "error",
      detail: sh?.dbStatus === "ok" ? (isRTL ? `${toPersianDigits(m.totalUsers)} رکورد` : `${m.totalUsers} records`) : (isRTL ? "خطا" : "Error"),
    },
    {
      icon: Users, label: isRTL ? "نشست‌های فعال" : "Active Sessions",
      status: (sh?.activeSessionsCount || 0) > 20 ? "warning" as const : "ok" as const,
      detail: toPersianDigits(String(sh?.activeSessionsCount || 0)),
    },
    {
      icon: ShieldAlert, label: isRTL ? "ورود ناموفق" : "Failed Logins",
      status: (sh?.recentFailedLogins || 0) > 5 ? "error" as const : (sh?.recentFailedLogins || 0) > 0 ? "warning" as const : "ok" as const,
      detail: toPersianDigits(String(sh?.recentFailedLogins || 0)),
    },
    {
      icon: Cpu, label: isRTL ? "حافظه سرور" : "Memory",
      status: "ok" as const,
      detail: isRTL ? "۷۲٪" : "72%",
    },
    {
      icon: HardDrive, label: isRTL ? "پردازنده" : "CPU",
      status: "ok" as const,
      detail: isRTL ? "۳۵٪" : "35%",
    },
    {
      icon: Wifi, label: isRTL ? "اتصال API" : "API Status",
      status: "ok" as const,
      detail: isRTL ? "آنلاین" : "Online",
    },
    {
      icon: Clock, label: isRTL ? "آخرین بکاپ" : "Last Backup",
      status: sh?.lastBackup ? "ok" as const : "warning" as const,
      detail: sh?.lastBackup ? formatTimeAgo(sh.lastBackup, isRTL) : (isRTL ? "ندارد" : "None"),
    },
  ];

  // ─── QUICK ACTIONS with tab navigation ───
  const quickActions = [
    { icon: UserPlus, label: isRTL ? "ثبت‌نام جدید" : "New Registration", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20", tab: "pending-registrations" },
    { icon: Music, label: isRTL ? "ایجاد دوره" : "Create Course", color: "bg-primary/10 text-primary hover:bg-primary/20", tab: "courses" },
    { icon: Calendar, label: isRTL ? "ایجاد کارگاه" : "Create Workshop", color: "bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20", tab: "content" },
    { icon: Send, label: isRTL ? "ارسال اطلاعیه" : "Send Announcement", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20", tab: "content" },
    { icon: Inbox, label: isRTL ? "مشاهده پیام‌ها" : "View Messages", color: "bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20", tab: "messages" },
    { icon: Settings, label: isRTL ? "تنظیمات" : "Settings", color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 hover:bg-slate-500/20", tab: "settings" },
  ];

  // ─── Activity timeline (enhanced) ───
  const activityItems: Array<{
    id: string; type: "registration" | "enrollment" | "payment" | "workshop";
    name: string; detail: string; time: string; isNew: boolean; amount?: number | null;
  }> = [];
  for (const r of data.recentRegistrations) {
    activityItems.push({
      id: r.id, type: "registration", name: r.name,
      detail: r.primaryInstrument || r.role, time: r.createdAt,
      isNew: Date.now() - new Date(r.createdAt).getTime() < 86400000,
    });
  }
  for (const e of data.recentEnrollmentsList || []) {
    activityItems.push({
      id: e.id,
      type: e.paymentStatus === "paid" ? "payment" : "enrollment",
      name: e.student.name,
      detail: isRTL ? e.course.titleFa : e.course.titleEn,
      time: e.enrolledAt,
      isNew: Date.now() - new Date(e.enrolledAt).getTime() < 86400000,
      amount: e.tuitionAmount,
    });
  }
  for (const w of data.upcomingWorkshops || []) {
    activityItems.push({
      id: w.id, type: "workshop",
      name: isRTL ? w.titleFa : w.titleEn,
      detail: isRTL ? `${w.reservedSeats}/${w.totalSeats} صندلی` : `${w.reservedSeats}/${w.totalSeats} seats`,
      time: w.date,
      isNew: false,
    });
  }
  activityItems.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  // Custom chart tooltip
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-medium">
              {p.name.includes(isRTL ? "درآمد" : "Revenue") || p.name.includes("تومان") || p.name.includes("Toman")
                ? formatToman(p.value, isRTL)
                : isRTL ? toPersianDigits(p.value) : p.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* ═══════════════════════════════════════════
          SECTION 1: HIGH-PRIORITY ALERTS BANNER
          ═══════════════════════════════════════════ */}
      {priorityAlerts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <div className={cn("flex items-center gap-2 mb-1", isRTL && "flex-row-reverse")}>
            <Bell className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold">{isRTL ? "هشدارها و اعلان‌ها" : "Alerts & Notifications"}</span>
            <Badge className="bg-amber-500/10 text-amber-600 text-[9px] px-1.5">{priorityAlerts.length}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {priorityAlerts.map((alert) => (
              <motion.div key={alert.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200",
                alert.type === "urgent" ? "bg-red-500/5 border-red-500/20 hover:border-red-500/40" :
                alert.type === "warning" ? "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40" :
                "bg-primary/5 border-primary/20 hover:border-primary/40"
              )}>
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  alert.type === "urgent" ? "bg-red-500/10" :
                  alert.type === "warning" ? "bg-amber-500/10" : "bg-primary/10"
                )}>
                  <alert.icon className={cn(
                    "w-4 h-4",
                    alert.type === "urgent" ? "text-red-500" :
                    alert.type === "warning" ? "text-amber-500" : "text-primary"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-xs font-semibold truncate",
                    alert.type === "urgent" ? "text-red-600 dark:text-red-400" :
                    alert.type === "warning" ? "text-amber-600 dark:text-amber-400" : "text-foreground"
                  )}>{alert.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{alert.detail}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {alert.type === "urgent" && <Badge className="bg-red-500/10 text-red-600 text-[8px] px-1.5 animate-pulse">{isRTL ? "فوری" : "URGENT"}</Badge>}
                  {alert.action && onNavigate && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px] px-2 text-primary hover:text-primary"
                      onClick={() => onNavigate(alert.action!.tab)}
                    >
                      {alert.action.label} →
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════
          SECTION 2: ENHANCED KPI METRICS CARDS
          ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="border-border/30 overflow-hidden relative">
              <div className={cn("h-1.5 bg-gradient-to-r", kpi.color)} />
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", kpi.iconBg)}>
                    <kpi.icon className={cn("w-5 h-5", kpi.iconColor)} />
                  </div>
                  {kpi.trend && (
                    <div className={cn(
                      "flex items-center gap-0.5 text-[11px] font-medium px-2 py-0.5 rounded-full",
                      kpi.trendUp ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"
                    )}>
                      {kpi.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {kpi.trend}
                    </div>
                  )}
                </div>
                <p className="text-2xl font-bold tabular-nums mb-0.5">{kpi.value}</p>
                <p className="text-[11px] text-muted-foreground">{isRTL ? kpi.labelFa : kpi.labelEn}</p>
                {/* Mini progress bar */}
                <div className="mt-2.5 h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", i === 0 ? "bg-amber-500" : i === 1 ? "bg-emerald-500" : i === 2 ? "bg-primary" : "bg-teal-500")}
                    initial={{ width: 0 }}
                    animate={{ width: `${kpi.progress}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                  />
                </div>
                {i === 0 && <p className="text-[9px] text-muted-foreground mt-1">{isRTL ? "هدف: ۵۰۰ هنرجو" : "Target: 500 students"}</p>}
                {i === 1 && <p className="text-[9px] text-muted-foreground mt-1">{isRTL ? `شامل ${toPersianDigits(m.workshopRevenue || 0).replace(/\B(?=(\d{3})+(?!\d))/g, "،")} تومان کارگاه` : `Includes ${(m.workshopRevenue || 0).toLocaleString()} Toman workshops`}</p>}
                {i === 2 && <p className="text-[9px] text-muted-foreground mt-1">{isRTL ? `از ${toPersianDigits(m.totalEnrollments)} کل ثبت‌نام` : `of ${m.totalEnrollments} total`}</p>}
                {i === 3 && <p className="text-[9px] text-muted-foreground mt-1">{isRTL ? `ظرفیت متوسط ${toPersianDigits(Math.round((data.upcomingWorkshops || []).reduce((s, w) => s + (w.totalSeats > 0 ? (w.reservedSeats / w.totalSeats) * 100 : 0), 0) / Math.max((data.upcomingWorkshops || []).length, 1)))}٪` : `Avg ${Math.round((data.upcomingWorkshops || []).reduce((s, w) => s + (w.totalSeats > 0 ? (w.reservedSeats / w.totalSeats) * 100 : 0), 0) / Math.max((data.upcomingWorkshops || []).length, 1))}% capacity`}</p>}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════
          SECTION 3: PROFESSIONAL CHARTS - Revenue & Enrollment Trends
          ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Revenue Trend - Area Chart */}
        <Card className="border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className={cn("text-sm font-semibold flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              {isRTL ? "روند درآمد ماهانه" : "Monthly Revenue Trend"}
              <Badge variant="outline" className="text-[9px] px-1.5">{isRTL ? "۱۲ ماه اخیر" : "Last 12 months"}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.7 0 0 / 0.1)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="oklch(0.5 0 0 / 0.3)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="oklch(0.5 0 0 / 0.3)" tickFormatter={(v: number) => isRTL ? toPersianDigits(v >= 1000000 ? `${(v / 1000000).toFixed(0)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v) : (v >= 1000000 ? `${(v / 1000000).toFixed(0)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" name={isRTL ? "درآمد (تومان)" : "Revenue (Toman)"} stroke="#d97706" fill="url(#revenueGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between mt-2 px-1">
              <span className="text-[10px] text-muted-foreground">{isRTL ? "مجموع درآمد تسویه‌شده" : "Total Paid Revenue"}</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatToman(m.totalRevenue || 0, isRTL)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Enrollment Trend - Line Chart */}
        <Card className="border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className={cn("text-sm font-semibold flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <LineChartIcon className="w-4 h-4 text-primary" />
              {isRTL ? "روند ثبت‌نام ماهانه" : "Monthly Enrollment Trend"}
              <Badge variant="outline" className="text-[9px] px-1.5">{isRTL ? "۱۲ ماه اخیر" : "Last 12 months"}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={enrollmentTrendData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.7 0 0 / 0.1)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="oklch(0.5 0 0 / 0.3)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="oklch(0.5 0 0 / 0.3)" tickFormatter={(v: number) => isRTL ? toPersianDigits(v) : v} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="enrollments" name={isRTL ? "ثبت‌نام‌ها" : "Enrollments"} stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 3, fill: "#7c3aed" }} activeDot={{ r: 5, fill: "#7c3aed" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between mt-2 px-1">
              <span className="text-[10px] text-muted-foreground">{isRTL ? "کل ثبت‌نام‌ها" : "Total Enrollments"}</span>
              <span className="text-xs font-bold text-primary">{isRTL ? toPersianDigits(m.totalEnrollments) : m.totalEnrollments}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════
          SECTION 3 continued: Existing Charts - Instrument + Enrollment + Demographics
          ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Instrument Distribution Pie */}
        {instrumentChartData.length > 0 && (
          <Card className="border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className={cn("text-sm font-semibold flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <Music className="w-4 h-4 text-amber-500" />
                {isRTL ? "توزیع سازها" : "Instrument Distribution"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <div className="w-full h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={instrumentChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none">
                      {instrumentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className={cn("flex flex-col gap-1.5 ms-2", isRTL && "ms-0 me-2")}>
                {instrumentChartData.slice(0, 6).map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[11px]">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                    <span className="text-muted-foreground truncate">{d.name}</span>
                    <span className="font-medium tabular-nums">{isRTL ? toPersianDigits(d.value) : d.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enrollment Status Pie */}
        {enrollmentChartData.length > 0 && (
          <Card className="border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className={cn("text-sm font-semibold flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <ClipboardList className="w-4 h-4 text-primary" />
                {isRTL ? "وضعیت ثبت‌نام‌ها" : "Enrollment Status"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <div className="w-full h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={enrollmentChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none">
                      {enrollmentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className={cn("flex flex-col gap-1.5 ms-2", isRTL && "ms-0 me-2")}>
                {enrollmentChartData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[11px]">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                    <span className="text-muted-foreground truncate">{d.name}</span>
                    <span className="font-medium tabular-nums">{isRTL ? toPersianDigits(d.value) : d.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Demographics + Registration Method */}
        <Card className="border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className={cn("text-sm font-semibold flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Users className="w-4 h-4 text-primary" />
              {isRTL ? "ترکیب کاربران" : "User Demographics"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Gender */}
            {genderChartData.length > 0 && (
              <div>
                <p className="text-[11px] text-muted-foreground mb-2 font-medium">{isRTL ? "جنسیت" : "Gender"}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden flex">
                    {genderChartData.map((g, i) => (
                      <div key={i} className="h-full transition-all relative group" style={{ width: `${(g.value / genderChartData.reduce((s, x) => s + x.value, 0)) * 100}%`, backgroundColor: g.fill }}>
                        {(g.value / genderChartData.reduce((s, x) => s + x.value, 0)) > 0.15 && (
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-medium text-white">{isRTL ? toPersianDigits(Math.round((g.value / genderChartData.reduce((s, x) => s + x.value, 0)) * 100)) : Math.round((g.value / genderChartData.reduce((s, x) => s + x.value, 0)) * 100)}%</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {genderChartData.map((g, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[10px]">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.fill }} />
                      <span className="text-muted-foreground">{g.name}</span>
                      <span className="font-medium">{isRTL ? toPersianDigits(g.value) : g.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Registration Method */}
            {regMethodData.length > 0 && (
              <div>
                <p className="text-[11px] text-muted-foreground mb-2 font-medium">{isRTL ? "روش ثبت‌نام" : "Registration Method"}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden flex">
                    {regMethodData.map((d, i) => (
                      <div key={i} className="h-full transition-all relative" style={{ width: `${(d.value / regMethodData.reduce((s, x) => s + x.value, 0)) * 100}%`, backgroundColor: d.fill }}>
                        {(d.value / regMethodData.reduce((s, x) => s + x.value, 0)) > 0.15 && (
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-medium text-white">{isRTL ? toPersianDigits(Math.round((d.value / regMethodData.reduce((s, x) => s + x.value, 0)) * 100)) : Math.round((d.value / regMethodData.reduce((s, x) => s + x.value, 0)) * 100)}%</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {regMethodData.map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[10px]">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
                      <span className="text-muted-foreground">{d.name}</span>
                      <span className="font-medium">{isRTL ? toPersianDigits(d.value) : d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Referral Sources Bar Chart (full width) */}
      {referralBarData.length > 0 && (
        <Card className="border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className={cn("text-sm font-semibold flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Globe className="w-4 h-4 text-primary" />
              {isRTL ? "منابع آشنایی و ارجاع" : "Registration Sources"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={referralBarData} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: isRTL ? 0 : 80 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="oklch(0.7 0 0 / 0.1)" />
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="oklch(0.5 0 0 / 0.3)" tickFormatter={(v: number) => isRTL ? toPersianDigits(v) : v} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} stroke="oklch(0.5 0 0 / 0.3)" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name={isRTL ? "تعداد" : "Count"} fill="#d97706" radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════
          SECTION 4: SYSTEM HEALTH MONITOR
          ═══════════════════════════════════════════ */}
      <Card className="border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-sm font-semibold flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <Activity className="w-4 h-4 text-emerald-500" />
            {isRTL ? "وضعیت سلامت سیستم" : "System Health Monitor"}
            <div className="flex items-center gap-1 ms-auto">
              <span className={cn("w-2 h-2 rounded-full animate-pulse", sh?.dbStatus === "ok" ? "bg-emerald-500" : "bg-red-500")} />
              <span className="text-[10px] text-muted-foreground">{sh?.dbStatus === "ok" ? (isRTL ? "سیستم سالم" : "All Systems Go") : (isRTL ? "مشکل" : "Issues")}</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {systemHealthItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-3 rounded-xl bg-muted/30 border border-border/20 hover:border-border/40 transition-colors">
                <item.icon className={cn("w-4 h-4 shrink-0", item.status === "ok" ? "text-muted-foreground" : item.status === "warning" ? "text-amber-500" : "text-red-500")} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-medium">{item.detail}</p>
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      item.status === "ok" ? "bg-emerald-500" :
                      item.status === "warning" ? "bg-amber-500" : "bg-red-500"
                    )} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════
          SECTION 5: QUICK ACTIONS PANEL
          ═══════════════════════════════════════════ */}
      <Card className="border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-sm font-semibold flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <Zap className="w-4 h-4 text-amber-500" />
            {isRTL ? "دسترسی سریع" : "Quick Actions"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => onNavigate?.(action.tab)}
                className={cn(
                  "flex flex-col items-center gap-2 px-4 py-4 rounded-xl text-xs font-medium transition-all duration-200 border border-transparent hover:border-border/40 hover:scale-[1.02]",
                  action.color
                )}
              >
                <action.icon className="w-5 h-5 shrink-0" />
                {action.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════
          SECTION 6: RECENT ACTIVITY TIMELINE (enhanced)
          ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="border-border/30">
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-sm font-semibold flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Activity className="w-4 h-4 text-primary" />
              {isRTL ? "خط زمانی فعالیت" : "Activity Timeline"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-72">
              {activityItems.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-8">{isRTL ? "فعالیتی یافت نشد" : "No activity"}</div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className={cn("absolute top-0 bottom-0 w-px bg-border/50", isRTL ? "right-[15px]" : "left-[15px]")} />
                  <div className="space-y-1">
                    {activityItems.slice(0, 10).map((item, idx) => {
                      const typeConfig: Record<string, { icon: typeof UserPlus; bg: string; iconColor: string; labelFa: string; labelEn: string }> = {
                        registration: { icon: UserPlus, bg: "bg-rose-500/10", iconColor: "text-rose-500", labelFa: "ثبت‌نام جدید", labelEn: "New Registration" },
                        enrollment: { icon: ClipboardList, bg: "bg-amber-500/10", iconColor: "text-amber-500", labelFa: "ثبت‌نام در کلاس", labelEn: "Class Enrollment" },
                        payment: { icon: CheckCircle2, bg: "bg-emerald-500/10", iconColor: "text-emerald-500", labelFa: "پرداخت تأییدشده", labelEn: "Payment Confirmed" },
                        workshop: { icon: Calendar, bg: "bg-teal-500/10", iconColor: "text-teal-500", labelFa: "کارگاه", labelEn: "Workshop" },
                      };
                      const cfg = typeConfig[item.type] || typeConfig.enrollment;
                      return (
                        <div key={item.id + item.type + idx} className={cn(
                          "flex items-start gap-3 text-xs p-2 rounded-lg relative",
                          item.isNew && "bg-primary/5",
                          isRTL && "flex-row-reverse"
                        )}>
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10", cfg.bg)}>
                            <cfg.icon className={cn("w-3.5 h-3.5", cfg.iconColor)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium truncate">{item.name}</span>
                              {item.isNew && <Badge className="bg-rose-500/10 text-rose-600 text-[8px] px-1 animate-pulse">{isRTL ? "جدید" : "NEW"}</Badge>}
                              <Badge variant="outline" className="text-[8px] px-1">{isRTL ? cfg.labelFa : cfg.labelEn}</Badge>
                            </div>
                            <p className="text-muted-foreground text-[10px] truncate">{item.detail}</p>
                            {item.amount && (
                              <p className="text-emerald-600 dark:text-emerald-400 text-[10px] font-medium">{formatToman(item.amount, isRTL)}</p>
                            )}
                            <p className="text-muted-foreground text-[9px] mt-0.5">{formatDateTime(item.time, isRTL)}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0">{formatTimeAgo(item.time, isRTL)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </ScrollArea>
            {activityItems.length > 10 && onNavigate && (
              <div className="mt-2 pt-2 border-t border-border/20">
                <Button size="sm" variant="ghost" className="w-full text-[11px] text-primary" onClick={() => onNavigate("audit-logs")}>
                  {isRTL ? "مشاهده همه فعالیت‌ها" : "View All Activity"} →
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════
            SECTION 7: UPCOMING SCHEDULE
            ═══════════════════════════════════════════ */}
        <Card className="border-border/30">
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-sm font-semibold flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <CalendarClock className="w-4 h-4 text-teal-500" />
              {isRTL ? "برنامه پیش رو" : "Upcoming Schedule"}
              <Badge variant="outline" className="text-[9px] px-1.5">{isRTL ? toPersianDigits((data.upcomingWorkshops || []).length) : (data.upcomingWorkshops || []).length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(data.upcomingWorkshops || []).length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-8">{isRTL ? "کارگاهی یافت نشد" : "No upcoming workshops"}</div>
            ) : (
              <ScrollArea className="max-h-72">
                <div className="space-y-2.5">
                  {data.upcomingWorkshops.map((w) => {
                    const occupancy = w.totalSeats > 0 ? Math.round((w.reservedSeats / w.totalSeats) * 100) : 0;
                    const remainingSeats = w.totalSeats - w.reservedSeats;
                    return (
                      <div key={w.id} className="flex gap-3 p-3 rounded-xl bg-muted/30 border border-border/20 hover:border-border/40 transition-colors">
                        {/* Date badge */}
                        <div className="shrink-0 w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
                          <span className="text-lg font-bold text-primary leading-none">{isRTL ? toPersianDigits(new Date(w.date).getDate()) : new Date(w.date).getDate()}</span>
                          <span className="text-[9px] text-primary/70">{formatDate(w.date, isRTL).split(" ")[0] || formatDate(w.date, isRTL).split("/")[1]}</span>
                        </div>
                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-xs font-semibold truncate">{isRTL ? w.titleFa : w.titleEn}</span>
                            {w.isHot && <Badge className="bg-orange-500/10 text-orange-600 text-[8px] px-1 shrink-0">{isRTL ? "داغ" : "HOT"}</Badge>}
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                            {w.startTime && (
                              <span className="flex items-center gap-0.5">
                                <Timer className="w-3 h-3" />
                                {isRTL ? toPersianDigits(w.startTime) : w.startTime}
                                {w.endTime && ` - ${isRTL ? toPersianDigits(w.endTime) : w.endTime}`}
                              </span>
                            )}
                            {(w.locationFa || w.locationEn) && (
                              <span className="flex items-center gap-0.5">
                                <MapPin className="w-3 h-3" />
                                {isRTL ? (w.locationFa || w.locationEn) : (w.locationEn || w.locationFa)}
                              </span>
                            )}
                          </div>
                          {/* Seats indicator */}
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[120px]">
                              <div className={cn(
                                "h-full rounded-full transition-all",
                                occupancy >= 90 ? "bg-red-500" : occupancy >= 70 ? "bg-amber-500" : "bg-emerald-500"
                              )} style={{ width: `${Math.min(occupancy, 100)}%` }} />
                            </div>
                            <span className={cn(
                              "text-[10px] font-medium",
                              remainingSeats <= 3 ? "text-red-500" : remainingSeats <= 10 ? "text-amber-500" : "text-emerald-500"
                            )}>
                              {isRTL
                                ? `${toPersianDigits(remainingSeats)} صندلی باقیمانده`
                                : `${remainingSeats} seats left`}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════
          BONUS: Recent Registrations + Recent Enrollments Tables
          ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Registrations */}
        <Card className={cn("border-border/30", (m.recentRegistrations24h || 0) > 0 && "ring-2 ring-amber-500/20")}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-sm font-semibold flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <UserPlus className="w-4 h-4 text-amber-500" />
              {isRTL ? "ثبت‌نام‌های اخیر" : "Recent Registrations"}
              {(m.recentRegistrations24h || 0) > 0 && (
                <Badge className="bg-amber-500/10 text-amber-600 text-[9px] px-1.5 animate-pulse">
                  +{isRTL ? toPersianDigits(m.recentRegistrations24h) : m.recentRegistrations24h} {isRTL ? "نفر ۲۴ ساعت اخیر" : "in 24h"}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-64">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-xs">{isRTL ? "نام" : "Name"}</TableHead>
                  <TableHead className="text-xs">{isRTL ? "تلفن" : "Phone"}</TableHead>
                  <TableHead className="text-xs">{isRTL ? "ساز" : "Instrument"}</TableHead>
                  <TableHead className="text-xs">{isRTL ? "تاریخ" : "Date"}</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {data.recentRegistrations.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-6">{isRTL ? "ثبت‌نامی یافت نشد" : "No registrations"}</TableCell></TableRow>
                  ) : data.recentRegistrations.map((r) => (
                    <TableRow key={r.id} className={cn((Date.now() - new Date(r.createdAt).getTime() < 86400000) && "bg-amber-500/5")}>
                      <TableCell className="text-xs">
                        <div className="font-medium flex items-center gap-1">
                          {r.name}
                          {Date.now() - new Date(r.createdAt).getTime() < 86400000 && <Badge className="bg-amber-500/10 text-amber-600 text-[8px] px-1 animate-pulse">{isRTL ? "جدید" : "NEW"}</Badge>}
                        </div>
                        <div className="text-muted-foreground text-[10px]">{r.email}</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {r.phone ? (
                          <a href={`tel:${r.phone}`} className="text-primary hover:underline">{r.phone}</a>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {getRoleBadge(r.role, isRTL)}
                        {(r.registrationInstrument || r.primaryInstrument) && <Badge variant="outline" className="text-[10px] ml-1">{isRTL ? (r.registrationInstrument || r.primaryInstrument) : (r.registrationInstrument || r.primaryInstrument)}</Badge>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatTimeAgo(r.createdAt, isRTL)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Enrollments with Payment Status */}
        <Card className={cn("border-border/30", (m.unpaidEnrollments || 0) > 0 && "ring-2 ring-red-500/20")}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-sm font-semibold flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <ClipboardList className="w-4 h-4 text-primary" />
              {isRTL ? "ثبت‌نام‌های اخیر کلاس‌ها" : "Recent Class Enrollments"}
              {(m.unpaidEnrollments || 0) > 0 && (
                <Badge className="bg-red-500/10 text-red-600 text-[9px] px-1.5">
                  {isRTL ? toPersianDigits(m.unpaidEnrollments) : m.unpaidEnrollments} {isRTL ? "تسویه‌نشده" : "unpaid"}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-64">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-xs">{isRTL ? "نام" : "Name"}</TableHead>
                  <TableHead className="text-xs">{isRTL ? "دوره" : "Course"}</TableHead>
                  <TableHead className="text-xs">{isRTL ? "روش" : "Method"}</TableHead>
                  <TableHead className="text-xs">{isRTL ? "پرداخت" : "Payment"}</TableHead>
                  <TableHead className="text-xs">{isRTL ? "مبلغ" : "Amount"}</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(data.recentEnrollmentsList || []).length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-6">{isRTL ? "ثبت‌نامی یافت نشد" : "No enrollments"}</TableCell></TableRow>
                  ) : (data.recentEnrollmentsList || []).map((e) => {
                    const psConfig = PAYMENT_STATUS_CONFIG[e.paymentStatus] || PAYMENT_STATUS_CONFIG.unpaid;
                    const rmConfig = REGISTRATION_METHOD_CONFIG[e.registrationMethod] || REGISTRATION_METHOD_CONFIG.online;
                    return (
                      <TableRow key={e.id} className={cn(e.paymentStatus === "unpaid" && "bg-red-500/5")}>
                        <TableCell className="text-xs">
                          <div className="font-medium">{e.student.name}</div>
                          {e.student.phone && <div className="text-muted-foreground text-[10px]"><a href={`tel:${e.student.phone}`} className="text-primary hover:underline">{e.student.phone}</a></div>}
                        </TableCell>
                        <TableCell className="text-xs">{isRTL ? e.course.titleFa : e.course.titleEn}</TableCell>
                        <TableCell className="text-xs">
                          <Badge className={cn("text-[9px] px-1.5", rmConfig.color)}><rmConfig.icon className="w-3 h-3 me-1" />{isRTL ? rmConfig.labelFa : rmConfig.labelEn}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge className={cn("text-[9px] px-1.5", psConfig.color)}>{isRTL ? psConfig.labelFa : psConfig.labelEn}</Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium">{formatToman(e.tuitionAmount, isRTL)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================
// USERS TAB
// ============================================
function UsersTab({ isRTL }: { isRTL: boolean }) {
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [detailUser, setDetailUser] = useState<UserDetail | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<UserDetail | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserEntry | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);

  const debouncedSearch = useDebouncedValue(search);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100", role: roleFilter });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await authFetch(`/api/admin/students?${params}`);
      if (res.ok) { const d = await res.json(); setUsers(d.students); setTotal(d.total); }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
    finally { setLoading(false); }
  }, [isRTL, roleFilter, debouncedSearch]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const fetchDetail = async (id: string) => {
    try {
      const res = await authFetch(`/api/admin/students/${id}?detailed=true`);
      if (res.ok) { const d = await res.json(); setDetailUser(d.student); }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await authFetch(`/api/admin/students/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !isActive }) });
      if (res.ok) { toast.success(isRTL ? "وضعیت تغییر کرد" : "Status updated"); fetchUsers(); }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
  };

  const toggleVerified = async (id: string, isVerified: boolean) => {
    try {
      const res = await authFetch(`/api/admin/students/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isVerified: !isVerified }) });
      if (res.ok) { toast.success(isRTL ? "وضعیت تأیید تغییر کرد" : "Verification status updated"); fetchUsers(); }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
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

  return (
    <div className="space-y-4">
      <div className={cn("flex flex-wrap items-center gap-3", isRTL && "flex-row-reverse")}>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute top-2.5 start-3 w-4 h-4 text-muted-foreground" />
          <Input placeholder={isRTL ? "جستجو نام، ایمیل، تلفن..." : "Search name, email, phone..."} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9 h-9 text-sm" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-36 h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRTL ? "همه نقش‌ها" : "All Roles"}</SelectItem>
            <SelectItem value="student">{isRTL ? "هنرجو" : "Student"}</SelectItem>
            <SelectItem value="instructor">{isRTL ? "مدرس" : "Instructor"}</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => setShowCreate(true)} className="h-9"><Plus className="w-4 h-4 me-1" />{isRTL ? "کاربر جدید" : "New User"}</Button>
        <Button size="sm" variant="outline" onClick={fetchUsers} className="h-9"><RefreshCw className="w-3.5 h-3.5" /></Button>
      </div>

      <div className="text-xs text-muted-foreground">{isRTL ? `${total} کاربر` : `${total} users`}</div>

      {loading ? <Spinner /> : (
        <ScrollArea className="max-h-[calc(100vh-320px)]">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">{isRTL ? "نام" : "Name"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "نقش" : "Role"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "ساز/تخصص" : "Instrument/Specialty"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "روش ثبت‌نام" : "Reg. Method"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "وضعیت" : "Status"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "تاریخ" : "Date"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "عملیات" : "Actions"}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {users.map((u) => {
                const latestEnrollment = u.enrollments?.[0];
                const regMethodCfg = latestEnrollment ? REGISTRATION_METHOD_CONFIG[latestEnrollment.registrationMethod] : null;
                return (
                <TableRow key={u.id}>
                  <TableCell className="text-xs"><div className="font-medium">{u.name}</div><div className="text-muted-foreground text-[10px]">{u.email}</div></TableCell>
                  <TableCell className="text-xs">{getRoleBadge(u.role, isRTL)}</TableCell>
                  <TableCell className="text-xs">{u.role === "instructor" ? (u.specialtyFa || "—") : (u.primaryInstrument || "—")}</TableCell>
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
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => toggleActive(u.id, u.isActive)} title={isRTL ? (u.isActive ? "غیرفعال کردن" : "فعال کردن") : (u.isActive ? "Deactivate" : "Activate")}>
                        {u.isActive ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => toggleVerified(u.id, u.isVerified)} title={isRTL ? (u.isVerified ? "لغو تأیید" : "تأیید") : (u.isVerified ? "Unverify" : "Verify")}>
                        {u.isVerified ? <ShieldCheck className="w-3.5 h-3.5 text-sky-500" /> : <Shield className="w-3.5 h-3.5 text-muted-foreground" />}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(u.createdAt, isRTL)}</TableCell>
                  <TableCell className="text-xs">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => fetchDetail(u.id)} title={isRTL ? "مشاهده جزئیات" : "View details"}><Eye className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={async () => { const res = await authFetch(`/api/admin/students/${u.id}?detailed=true`); if (res.ok) { const d = await res.json(); setEditUser(d.student); } }} title={isRTL ? "ویرایش" : "Edit"}><Edit3 className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => { setResetPasswordUser(u); setNewPassword(""); }} title={isRTL ? "بازنشانی رمز عبور" : "Reset password"}><Key className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      )}

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
              {/* ─── Personal Info ─── */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  [isRTL ? "ایمیل" : "Email", detailUser.email],
                  [isRTL ? "تلفن" : "Phone", detailUser.phone],
                  [isRTL ? "جنسیت" : "Gender", detailUser.gender],
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

              {/* ─── AI & Analytics Section ─── */}
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
                    <span className="text-muted-foreground">{isRTL ? "بخش AI" : "AI Segment"}</span>
                    <Badge className="bg-violet-500/10 text-violet-600 text-[10px]">{detailUser.aiSegmentTag || "—"}</Badge>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "ارزش طول عمر" : "CLV"}</span>
                    <p className="font-medium">{formatToman(detailUser.customerLifetimeValue, isRTL)}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "تگ‌ها" : "Tags"}</span>
                    <div className="flex flex-wrap gap-0.5">{detailUser.tags ? JSON.parse(detailUser.tags).map((t: string) => <Badge key={t} variant="outline" className="text-[9px] px-1">{t}</Badge>) : "—"}</div>
                  </div>
                </div>
              </div>

              {detailUser.role === "instructor" && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-0.5"><span className="text-muted-foreground">{isRTL ? "تخصص" : "Specialty"}</span><p className="font-medium">{detailUser.specialtyFa || detailUser.specialtyEn || "—"}</p></div>
                    <div className="space-y-0.5"><span className="text-muted-foreground">{isRTL ? "سابقه" : "Experience"}</span><p className="font-medium">{detailUser.experience || "—"}</p></div>
                  </div>
                </>
              )}

              {/* ─── Enrollments ─── */}
              {detailUser.enrollments.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="font-semibold mb-2 flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-primary" />{isRTL ? `دوره‌ها (${detailUser.enrollments.length})` : `Enrollments (${detailUser.enrollments.length})`}</p>
                    <ScrollArea className="max-h-40">
                      <Table>
                        <TableHeader><TableRow>
                          <TableHead className="text-[10px]">{isRTL ? "دوره" : "Course"}</TableHead>
                          <TableHead className="text-[10px]">{isRTL ? "سطح" : "Level"}</TableHead>
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
                                <TableCell className="text-[10px]">{e.course.level}</TableCell>
                                <TableCell className="text-[10px]">{stCfg && <Badge className={cn("text-[8px] px-1", stCfg.color)}>{isRTL ? stCfg.labelFa : stCfg.labelEn}</Badge>}</TableCell>
                                <TableCell className="text-[10px]">
                                  <div className="flex items-center gap-1">
                                    <div className="w-10 h-1 bg-muted rounded-full overflow-hidden">
                                      <div className="h-full bg-primary rounded-full" style={{ width: `${e.progress}%` }} />
                                    </div>
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

              {/* ─── Workshop Tickets ─── */}
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
                          <TableHead className="text-[10px]">{isRTL ? "صندلی" : "Seat"}</TableHead>
                          <TableHead className="text-[10px]">{isRTL ? "تاریخ" : "Date"}</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                          {detailUser.tickets.map((t) => {
                            const tCfg = TICKET_STATUS_CONFIG[t.status];
                            return (
                              <TableRow key={t.id}>
                                <TableCell className="text-[10px] font-medium">{isRTL ? t.workshop.titleFa : t.workshop.titleEn}</TableCell>
                                <TableCell className="text-[10px]">{tCfg && <Badge className={cn("text-[8px] px-1", tCfg.color)}>{isRTL ? tCfg.labelFa : tCfg.labelEn}</Badge>}</TableCell>
                                <TableCell className="text-[10px]">{t.seatNumber ?? "—"}</TableCell>
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

              {/* ─── Session & Stats Summary ─── */}
              <Separator />
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-0.5">
                  <span className="text-muted-foreground">{isRTL ? "ورودها" : "Logins"}</span>
                  <p className="font-medium">{detailUser._count.loginSessions}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-muted-foreground">{isRTL ? "ثبت‌نام‌ها" : "Enrollments"}</span>
                  <p className="font-medium">{detailUser._count.enrollments}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-muted-foreground">{isRTL ? "بلیت‌ها" : "Tickets"}</span>
                  <p className="font-medium">{detailUser._count.tickets}</p>
                </div>
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
      <RegistrationForm isOpen={showCreate} onClose={() => { setShowCreate(false); fetchUsers(); }} isAdminMode={true} />

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
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
              <Input
                type="password"
                className="h-9 text-sm mt-1"
                placeholder={isRTL ? "حداقل ۶ کاراکتر" : "At least 6 characters"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                dir="ltr"
              />
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
    </div>
  );
}

function EditUserForm({ user, isRTL, onClose }: { user: UserDetail; isRTL: boolean; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [roleChangeWarning, setRoleChangeWarning] = useState(false);
  const [form, setForm] = useState({
    name: user.name, email: user.email, phone: user.phone || "",
    primaryInstrument: user.primaryInstrument || "", city: user.city || "",
    province: user.province || "", notes: user.notes || "",
    isActive: user.isActive, isVerified: user.isVerified, role: user.role,
    skillLevel: user.skillLevel || "", gender: user.gender || "",
    nationalId: user.nationalId || "",
    // Instructor-specific
    specialtyFa: user.specialtyFa || "", specialtyEn: user.specialtyEn || "",
    bioFa: user.bioFa || "", bioEn: user.bioEn || "",
    isPublishedInstructor: user.isPublishedInstructor,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Warn on role change
    if (form.role !== user.role && !roleChangeWarning) {
      setRoleChangeWarning(true);
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch(`/api/admin/students/${user.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) {
        toast.success(isRTL ? "بروزرسانی شد" : "Updated");
        logAuditAction("UPDATE", "user", user.id, `User ${user.name} updated. Fields: ${Object.keys(form).filter(k => form[k as keyof typeof form] !== user[k as keyof typeof user]).join(", ")}`);
        onClose();
      }
      else toast.error(isRTL ? "خطا" : "Error");
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
    finally { setSaving(false); }
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
      {/* ─── Basic Info ─── */}
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
          <div><Label className="text-xs">{isRTL ? "شهر" : "City"}</Label><Input className="h-8 text-sm" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div><Label className="text-xs">{isRTL ? "استان" : "Province"}</Label><Input className="h-8 text-sm" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} /></div>
        </div>
      </div>

      {/* ─── Password Reset ─── */}
      <div>
        <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase">{isRTL ? "امنیت حساب" : "Account Security"}</p>
          <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" onClick={() => setShowPasswordReset(!showPasswordReset)}>
            <Key className="w-3 h-3 me-1" />
            {isRTL ? "بازنشانی رمز عبور" : "Reset Password"}
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

      {/* ─── Instructor-specific fields ─── */}
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

      {/* ─── Notes ─── */}
      <div><Label className="text-xs">{isRTL ? "یادداشت مدیر" : "Admin Notes"}</Label><Textarea className="text-sm" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>

      {/* ─── Role & Status ─── */}
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
// CONTENT MANAGEMENT TAB
// ============================================
function ContentTab({ isRTL }: { isRTL: boolean }) {
  const [subTab, setSubTab] = useState<"blog" | "workshops" | "announcements">("blog");
  return (
    <div className="space-y-4">
      <div className={cn("flex gap-2", isRTL && "flex-row-reverse")}>
        {(["blog", "workshops", "announcements"] as const).map((t) => (
          <Button key={t} size="sm" variant={subTab === t ? "default" : "outline"} onClick={() => setSubTab(t)}>
            {t === "blog" && <FileText className="w-3.5 h-3.5 me-1" />}
            {t === "workshops" && <GraduationCap className="w-3.5 h-3.5 me-1" />}
            {t === "announcements" && <Bell className="w-3.5 h-3.5 me-1" />}
            {t === "blog" ? (isRTL ? "مقالات بلاگ" : "Blog Posts") : t === "workshops" ? (isRTL ? "کارگاه‌ها" : "Workshops") : (isRTL ? "اعلانات" : "Announcements")}
          </Button>
        ))}
      </div>
      {subTab === "blog" && <BlogSection isRTL={isRTL} />}
      {subTab === "workshops" && <WorkshopSection isRTL={isRTL} />}
      {subTab === "announcements" && <AnnouncementSection isRTL={isRTL} />}
    </div>
  );
}

function ContentFlags({ item, type, isRTL, onRefresh }: { item: ContentItem; type: string; isRTL: boolean; onRefresh: () => void }) {
  const [publishWarning, setPublishWarning] = useState<string[] | null>(null);
  const [pendingField, setPendingField] = useState<{ field: string; value: boolean } | null>(null);

  const toggle = async (field: string, value: boolean) => {
    // Validate before publishing
    if (field === "isPublished" && value === true) {
      const missing = validateContentForPublish(item, type);
      if (missing.length > 0) {
        setPublishWarning(missing);
        setPendingField({ field, value });
        return;
      }
    }
    try {
      const baseUrl = type === "blog" ? "/api/blog" : type === "workshops" ? "/api/admin/workshops-data" : "/api/admin/announcements";
      const res = await authFetch(`${baseUrl}/${item.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: value }) });
      if (res.ok) {
        toast.success(isRTL ? "بروزرسانی شد" : "Updated");
        onRefresh();
        logAuditAction("TOGGLE_FLAG", type, item.id, `${field} changed to ${value} for "${item.titleFa}"`);
      } else toast.error(isRTL ? "خطا" : "Error");
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
  };

  const autoNew = isItemNew(item.createdAt);

  return (
    <>
      <div className={cn("flex items-center gap-2 flex-wrap", isRTL && "flex-row-reverse")}>
        <div className="flex items-center gap-1">
          <Switch checked={item.isPublished} onCheckedChange={(v) => toggle("isPublished", v)} className="scale-75" />
          <span className="text-[10px]">{item.isPublished ? (isRTL ? "منتشر" : "Pub") : (isRTL ? "پیش‌نویس" : "Draft")}</span>
        </div>
        <div className="flex items-center gap-1">
          <Switch checked={item.isFeatured} onCheckedChange={(v) => toggle("isFeatured", v)} className="scale-75" />
          <Badge className={cn("text-[9px] px-1", item.isFeatured ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-muted text-muted-foreground")}><Star className="w-2.5 h-2.5" /></Badge>
        </div>
        <div className="flex items-center gap-1">
          <Switch checked={item.isShowOnHome} onCheckedChange={(v) => toggle("isShowOnHome", v)} className="scale-75" />
          <Badge className={cn("text-[9px] px-1", item.isShowOnHome ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}><Home className="w-2.5 h-2.5" /></Badge>
        </div>
        <div className="flex items-center gap-1">
          <Switch checked={item.isPinned || false} onCheckedChange={(v) => toggle("isPinned", v)} className="scale-75" />
          <Badge className={cn("text-[9px] px-1", item.isPinned ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" : "bg-muted text-muted-foreground")}><Pin className="w-2.5 h-2.5" /></Badge>
        </div>
        {autoNew && <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] px-1.5 gap-0.5"><Zap className="w-2.5 h-2.5" />{isRTL ? "جدید" : "New"}</Badge>}
      </div>

      {/* Publish Warning Dialog */}
      <AlertDialog open={!!publishWarning} onOpenChange={(open) => { if (!open) { setPublishWarning(null); setPendingField(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              {isRTL ? "فیلدهای الزامی ناقص است" : "Required Fields Missing"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL
                ? `برای انتشار این آیتم، فیلدهای زیر باید تکمیل شوند:`
                : `To publish this item, the following fields must be filled:`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5 my-2">
            {publishWarning?.map((f, i) => (
              <div key={i} className={cn("flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-destructive/5 text-destructive", isRTL && "flex-row-reverse")}>
                <XCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRTL ? "انصراف" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setPublishWarning(null); setPendingField(null); }}>
              {isRTL ? "متوجه شدم" : "Understood"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CoverThumbnail({ url, isRTL }: { url: string | null | undefined; isRTL: boolean }) {
  const [error, setError] = useState(false);
  if (!url || error) return (
    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
      <ImageIcon className="w-4 h-4 text-muted-foreground" />
    </div>
  );
  return (
    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
      <img src={url} alt={isRTL ? "تصویر" : "Cover"} className="w-full h-full object-cover" onError={() => setError(true)} />
    </div>
  );
}

function DeleteConfirmDialog({ open, onOpenChange, onConfirm, isRTL, itemName }: {
  open: boolean; onOpenChange: (open: boolean) => void;
  onConfirm: () => void; isRTL: boolean; itemName: string;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <AlertTriangle className="w-5 h-5 text-destructive" />
            {isRTL ? "تأیید حذف" : "Confirm Deletion"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isRTL
              ? `آیا مطمئن هستید؟ این عمل قابل بازگشت نیست. آیتم "${itemName}" حذف خواهد شد.`
              : `Are you sure? This action cannot be undone. "${itemName}" will be permanently deleted.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{isRTL ? "انصراف" : "Cancel"}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isRTL ? "حذف شود" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function BlogSection({ isRTL }: { isRTL: boolean }) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ContentItem | null>(null);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/blog?all=true&pageSize=100");
      if (res.ok) { const d = await res.json(); setItems(d.posts || []); }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
    finally { setLoading(false); }
  }, [isRTL]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const deleteItem = async (id: string) => {
    try {
      const res = await authFetch(`/api/blog/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(isRTL ? "حذف شد" : "Deleted");
        logAuditAction("DELETE", "blog", id, `Blog post deleted: ${deleteTarget?.titleFa || id}`);
        fetchData();
      }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
    finally { setDeleteTarget(null); }
  };

  const handleEdit = (item: ContentItem) => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
  };

  if (loading) return <Spinner />;

  return (
    <>
      <div className={cn("flex justify-end", isRTL && "flex-row-reverse")}>
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="w-3.5 h-3.5 me-1" />{isRTL ? "مقاله جدید" : "New Post"}</Button>
      </div>
      <ScrollArea className="max-h-[calc(100vh-400px)]">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="text-xs">{isRTL ? "کاور" : "Cover"}</TableHead>
            <TableHead className="text-xs">{isRTL ? "عنوان" : "Title"}</TableHead>
            <TableHead className="text-xs">{isRTL ? "وضعیت/پرچم" : "Status/Flags"}</TableHead>
            <TableHead className="text-xs">{isRTL ? "بازدید" : "Views"}</TableHead>
            <TableHead className="text-xs">{isRTL ? "تاریخ" : "Date"}</TableHead>
            <TableHead className="text-xs">{isRTL ? "عملیات" : "Actions"}</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {items.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="text-xs"><CoverThumbnail url={p.coverUrl} isRTL={isRTL} /></TableCell>
                <TableCell className="text-xs max-w-[200px] truncate">
                  <div className="flex items-center gap-1">
                    {p.isPinned && <Pin className="w-3 h-3 text-rose-500 shrink-0" />}
                    <span className="truncate">{isRTL ? p.titleFa : p.titleEn}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs"><ContentFlags item={p} type="blog" isRTL={isRTL} onRefresh={fetchData} /></TableCell>
                <TableCell className="text-xs">{(p as Record<string, unknown>).viewCount as number || 0}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(p.createdAt, isRTL)}</TableCell>
                <TableCell className="text-xs">
                  <div className="flex items-center gap-0.5">
                    <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => handleEdit(p)} title={isRTL ? "ویرایش" : "Edit"}>
                      <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 px-1.5 text-red-500" onClick={() => setDeleteTarget(p)} title={isRTL ? "حذف" : "Delete"}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={() => deleteTarget && deleteItem(deleteTarget.id)}
        isRTL={isRTL}
        itemName={deleteTarget ? (isRTL ? deleteTarget.titleFa : deleteTarget.titleEn) : ""}
      />
      <BlogEditDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) setEditingItem(null); }}
        item={editingItem}
        isRTL={isRTL}
        onSaved={fetchData}
        mode="edit"
      />
      <BlogEditDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        item={null}
        isRTL={isRTL}
        onSaved={fetchData}
        mode="create"
      />
    </>
  );
}

// Blog Edit Dialog — comprehensive editor for all blog post fields
interface BlogCategoryOption {
  id: string;
  nameFa: string;
  nameEn: string;
  slugFa: string;
  slugEn: string;
  color?: string;
  icon?: string | null;
}

// Helper: generate URL-safe slug from text
function generateSlug(text: string, isPersian: boolean): string {
  if (!text) return "";
  let slug = text.trim();
  if (isPersian) {
    // Persian: replace spaces with hyphens, remove special chars (keep Persian letters, digits, hyphens)
    slug = slug.replace(/\s+/g, "-");
    slug = slug.replace(/[^\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF0-9a-zA-Z\-]/g, "");
  } else {
    // English: lowercase, replace spaces with hyphens, remove non-alphanumeric
    slug = slug.toLowerCase();
    slug = slug.replace(/\s+/g, "-");
    slug = slug.replace(/[^a-z0-9\-]/g, "");
  }
  slug = slug.replace(/-+/g, "-"); // collapse multiple hyphens
  slug = slug.replace(/^-|-$/g, ""); // trim leading/trailing hyphens
  return slug;
}

function BlogEditDialog({ open, onOpenChange, item, isRTL, onSaved, mode = "edit" }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ContentItem | null;
  isRTL: boolean;
  onSaved: () => void;
  mode?: "edit" | "create";
}) {
  const isCreate = mode === "create";
  const [form, setForm] = useState({
    titleFa: "", titleEn: "", slugFa: "", slugEn: "",
    excerptFa: "", excerptEn: "", contentFa: "", contentEn: "",
    coverUrl: "", tags: "",
    metaTitleFa: "", metaTitleEn: "", metaDescriptionFa: "", metaDescriptionEn: "", keywords: "",
    isPublished: false, isFeatured: false, isShowOnHome: false, isPinned: false,
  });
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<BlogCategoryOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // Track whether the user has manually edited the slug (to avoid overwriting)
  const [slugFaManuallyEdited, setSlugFaManuallyEdited] = useState(false);
  const [slugEnManuallyEdited, setSlugEnManuallyEdited] = useState(false);

  // Fetch categories on dialog open
  useEffect(() => {
    if (open) {
      setCategoriesLoading(true);
      authFetch("/api/blog-categories?all=true")
        .then((res) => res.ok ? res.json() : [])
        .then((data) => setAllCategories(Array.isArray(data) ? data : []))
        .catch(() => setAllCategories([]))
        .finally(() => setCategoriesLoading(false));
    }
  }, [open]);

  // Reset form for create mode or populate for edit mode
  useEffect(() => {
    if (!open) return;
    // Reset slug manual-edit tracking
    setSlugFaManuallyEdited(false);
    setSlugEnManuallyEdited(false);
    if (isCreate) {
      setForm({
        titleFa: "", titleEn: "", slugFa: "", slugEn: "",
        excerptFa: "", excerptEn: "", contentFa: "", contentEn: "",
        coverUrl: "", tags: "",
        metaTitleFa: "", metaTitleEn: "", metaDescriptionFa: "", metaDescriptionEn: "", keywords: "",
        isPublished: false, isFeatured: false, isShowOnHome: false, isPinned: false,
      });
      setCategoryIds([]);
    } else if (item) {
      const getStr = (key: string) => (item as Record<string, unknown>)[key] as string || "";
      setForm({
        titleFa: item.titleFa || "", titleEn: item.titleEn || "",
        slugFa: getStr("slugFa"), slugEn: getStr("slugEn"),
        excerptFa: getStr("excerptFa"), excerptEn: getStr("excerptEn"),
        contentFa: item.contentFa || "", contentEn: item.contentEn || "",
        coverUrl: item.coverUrl || "", tags: getStr("tags"),
        metaTitleFa: getStr("metaTitleFa"), metaTitleEn: getStr("metaTitleEn"),
        metaDescriptionFa: getStr("metaDescriptionFa"), metaDescriptionEn: getStr("metaDescriptionEn"),
        keywords: getStr("keywords"),
        isPublished: item.isPublished, isFeatured: item.isFeatured, isShowOnHome: item.isShowOnHome,
        isPinned: item.isPinned || false,
      });
      // Pre-populate categoryIds from the item's existing categories
      const cats = (item as Record<string, unknown>).categories;
      if (Array.isArray(cats)) {
        setCategoryIds(cats.map((c: Record<string, unknown>) => c.id as string));
      } else {
        setCategoryIds([]);
      }
    }
  }, [item, open, isCreate]);

  const updateField = (field: string, value: string | boolean) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-slug generation when title changes
      if (field === "titleFa" && typeof value === "string" && !slugFaManuallyEdited) {
        updated.slugFa = generateSlug(value, true);
      }
      if (field === "titleEn" && typeof value === "string" && !slugEnManuallyEdited) {
        updated.slugEn = generateSlug(value, false);
      }
      return updated;
    });
  };

  // Mark slug as manually edited when user types in it
  const handleSlugFaChange = (value: string) => {
    setSlugFaManuallyEdited(true);
    updateField("slugFa", value);
  };
  const handleSlugEnChange = (value: string) => {
    setSlugEnManuallyEdited(true);
    updateField("slugEn", value);
  };

  const toggleCategory = (catId: string) => {
    setCategoryIds(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const handleSave = async () => {
    if (!isCreate && !item) return;
    // Validate required fields for create mode
    if (isCreate) {
      if (!form.titleFa || !form.titleEn) {
        toast.error(isRTL ? "عنوان فارسی و انگلیسی الزامی است" : "Farsi and English titles are required");
        return;
      }
      if (!form.slugFa || !form.slugEn) {
        toast.error(isRTL ? "اسلاگ فارسی و انگلیسی الزامی است" : "Farsi and English slugs are required");
        return;
      }
      if (!form.contentFa || !form.contentEn) {
        toast.error(isRTL ? "محتوای فارسی و انگلیسی الزامی است" : "Farsi and English content are required");
        return;
      }
    }
    setSaving(true);
    try {
      const url = isCreate ? "/api/blog" : `/api/blog/${item!.id}`;
      const method = isCreate ? "POST" : "PUT";
      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, categoryIds }),
      });
      if (res.ok) {
        if (isCreate) {
          toast.success(isRTL ? "مقاله ایجاد شد" : "Post created");
          logAuditAction("CREATE", "blog", null, `Blog post created: ${form.titleFa}`);
        } else {
          toast.success(isRTL ? "مقاله بروزرسانی شد" : "Post updated");
          logAuditAction("UPDATE", "blog", item!.id, `Blog post edited: ${form.titleFa || item!.id}`);
        }
        onOpenChange(false);
        onSaved();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error((err as Record<string, string>).error || (isRTL ? "خطا" : "Error"));
      }
    } catch {
      toast.error(isRTL ? "خطا در ذخیره" : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            {isCreate ? <Plus className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            {isCreate ? (isRTL ? "مقاله جدید" : "New Post") : (isRTL ? "ویرایش مقاله" : "Edit Post")}
          </DialogTitle>
          <DialogDescription className="sr-only">{isCreate ? (isRTL ? "فرم ایجاد مقاله جدید" : "Create a new post") : (isRTL ? "فرم ویرایش مقاله" : "Edit an existing post")}</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="content" className="w-full">
          <TabsList className={cn("w-full", isRTL && "flex-row-reverse")}>
            <TabsTrigger value="content" className="flex-1 text-xs">
              {isRTL ? "محتوا" : "Content"}
            </TabsTrigger>
            <TabsTrigger value="details" className="flex-1 text-xs">
              {isRTL ? "جزئیات" : "Details"}
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex-1 text-xs">
              SEO
            </TabsTrigger>
          </TabsList>

          {/* ─── Content Tab ─── */}
          <TabsContent value="content" className="space-y-4 mt-4">
            {/* Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{isRTL ? "عنوان (فارسی)" : "Title (Farsi)"}</Label>
                <Input value={form.titleFa} onChange={(e) => updateField("titleFa", e.target.value)} className="rounded-xl h-9 text-sm" dir="rtl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{isRTL ? "عنوان (انگلیسی)" : "Title (English)"}</Label>
                <Input value={form.titleEn} onChange={(e) => updateField("titleEn", e.target.value)} className="rounded-xl h-9 text-sm" dir="ltr" />
              </div>
            </div>

            {/* Slug */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{isRTL ? "اسلاگ (فارسی)" : "Slug (Farsi)"}</Label>
                <Input value={form.slugFa} onChange={(e) => handleSlugFaChange(e.target.value)} className="rounded-xl h-9 text-sm" dir="rtl" placeholder="my-post-fa" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{isRTL ? "اسلاگ (انگلیسی)" : "Slug (English)"}</Label>
                <Input value={form.slugEn} onChange={(e) => handleSlugEnChange(e.target.value)} className="rounded-xl h-9 text-sm" dir="ltr" placeholder="my-post-en" />
              </div>
            </div>

            {/* Excerpt */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{isRTL ? "خلاصه (فارسی)" : "Excerpt (Farsi)"}</Label>
                <Textarea value={form.excerptFa} onChange={(e) => updateField("excerptFa", e.target.value)} className="rounded-xl resize-none" rows={3} dir="rtl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{isRTL ? "خلاصه (انگلیسی)" : "Excerpt (English)"}</Label>
                <Textarea value={form.excerptEn} onChange={(e) => updateField("excerptEn", e.target.value)} className="rounded-xl resize-none" rows={3} dir="ltr" />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{isRTL ? "محتوا (فارسی)" : "Content (Farsi)"}</Label>
              <Textarea value={form.contentFa} onChange={(e) => updateField("contentFa", e.target.value)} className="rounded-xl resize-y font-mono text-xs" rows={8} dir="rtl" placeholder={isRTL ? "محتوای فارسی مقاله..." : "Farsi content..."} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{isRTL ? "محتوا (انگلیسی)" : "Content (English)"}</Label>
              <Textarea value={form.contentEn} onChange={(e) => updateField("contentEn", e.target.value)} className="rounded-xl resize-y font-mono text-xs" rows={8} dir="ltr" placeholder="English content..." />
            </div>
          </TabsContent>

          {/* ─── Details Tab ─── */}
          <TabsContent value="details" className="space-y-4 mt-4">
            {/* Cover & Tags */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{isRTL ? "آدرس تصویر کاور" : "Cover Image URL"}</Label>
              <Input value={form.coverUrl} onChange={(e) => updateField("coverUrl", e.target.value)} className="rounded-xl h-9 text-sm" placeholder="https://..." dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{isRTL ? "برچسب‌ها" : "Tags"}</Label>
              <Input value={form.tags} onChange={(e) => updateField("tags", e.target.value)} className="rounded-xl h-9 text-sm" placeholder={isRTL ? "برچسب۱، برچسب۲" : "tag1, tag2"} dir="ltr" />
            </div>

            <Separator />

            {/* Categories */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" />
                {isRTL ? "دسته‌بندی‌ها" : "Categories"}
              </h4>
              {categoriesLoading ? (
                <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {isRTL ? "در حال بارگذاری..." : "Loading..."}
                </div>
              ) : allCategories.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">{isRTL ? "دسته‌بندی یافت نشد" : "No categories found"}</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {allCategories.map((cat) => (
                    <label
                      key={cat.id}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors text-xs",
                        categoryIds.includes(cat.id)
                          ? "border-primary/50 bg-primary/5"
                          : "border-border/50 hover:border-border"
                      )}
                    >
                      <Checkbox
                        checked={categoryIds.includes(cat.id)}
                        onCheckedChange={() => toggleCategory(cat.id)}
                        className="scale-75"
                      />
                      {cat.color && (
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      )}
                      <span className="truncate">{isRTL ? cat.nameFa : cat.nameEn}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Flags */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5" />
                {isRTL ? "پرچم‌ها" : "Flags"}
              </h4>
              <div className={cn("flex items-center gap-4 flex-wrap", isRTL && "flex-row-reverse")}>
                <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                  <Switch checked={form.isPublished} onCheckedChange={(v) => updateField("isPublished", v)} />
                  <Label className="text-xs">{isRTL ? "انتشار" : "Published"}</Label>
                </div>
                <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                  <Switch checked={form.isFeatured} onCheckedChange={(v) => updateField("isFeatured", v)} />
                  <Label className="text-xs flex items-center gap-1"><Star className="w-3 h-3" />{isRTL ? "ویژه" : "Featured"}</Label>
                </div>
                <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                  <Switch checked={form.isShowOnHome} onCheckedChange={(v) => updateField("isShowOnHome", v)} />
                  <Label className="text-xs flex items-center gap-1"><Home className="w-3 h-3" />{isRTL ? "صفحه اصلی" : "Home"}</Label>
                </div>
                <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                  <Switch checked={form.isPinned} onCheckedChange={(v) => updateField("isPinned", v)} />
                  <Label className="text-xs flex items-center gap-1"><Pin className="w-3 h-3" />{isRTL ? "پین‌شده" : "Pinned"}</Label>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ─── SEO Tab ─── */}
          <TabsContent value="seo" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground">{isRTL ? "عنوان متا (فارسی)" : "Meta Title (Farsi)"}</Label>
                <Input value={form.metaTitleFa} onChange={(e) => updateField("metaTitleFa", e.target.value)} className="rounded-xl h-8 text-xs" dir="rtl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground">{isRTL ? "عنوان متا (انگلیسی)" : "Meta Title (English)"}</Label>
                <Input value={form.metaTitleEn} onChange={(e) => updateField("metaTitleEn", e.target.value)} className="rounded-xl h-8 text-xs" dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground">{isRTL ? "توضیحات متا (فارسی)" : "Meta Description (Farsi)"}</Label>
                <Textarea value={form.metaDescriptionFa} onChange={(e) => updateField("metaDescriptionFa", e.target.value)} className="rounded-xl resize-none" rows={3} dir="rtl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground">{isRTL ? "توضیحات متا (انگلیسی)" : "Meta Description (English)"}</Label>
                <Textarea value={form.metaDescriptionEn} onChange={(e) => updateField("metaDescriptionEn", e.target.value)} className="rounded-xl resize-none" rows={3} dir="ltr" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground">{isRTL ? "کلمات کلیدی" : "Keywords"}</Label>
              <Input value={form.keywords} onChange={(e) => updateField("keywords", e.target.value)} className="rounded-xl h-8 text-xs" placeholder={isRTL ? "کلمه۱، کلمه۲" : "keyword1, keyword2"} dir="ltr" />
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className={cn("flex gap-2 pt-2", isRTL && "flex-row-reverse")}>
          <Button onClick={handleSave} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
            {saving && <Loader2 className="w-3.5 h-3.5 me-1.5 animate-spin" />}
            {isCreate ? (isRTL ? "ایجاد" : "Create") : (isRTL ? "ذخیره تغییرات" : "Save Changes")}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            {isRTL ? "انصراف" : "Cancel"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WorkshopSection({ isRTL }: { isRTL: boolean }) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ContentItem | null>(null);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/admin/workshops-data?all=true");
      if (res.ok) { const d = await res.json(); setItems(d.workshops || []); }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
    finally { setLoading(false); }
  }, [isRTL]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const deleteItem = async (id: string) => {
    try {
      const res = await authFetch(`/api/admin/workshops-data/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(isRTL ? "حذف شد" : "Deleted");
        logAuditAction("DELETE", "workshop", id, `Workshop deleted: ${deleteTarget?.titleFa || id}`);
        fetchData();
      }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
    finally { setDeleteTarget(null); }
  };

  if (loading) return <Spinner />;

  return (
    <>
      <div className="space-y-3">
        <div className={cn("flex justify-end", isRTL && "flex-row-reverse")}>
          <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="w-3.5 h-3.5 me-1" />{isRTL ? "کارگاه جدید" : "New Workshop"}</Button>
        </div>
        <ScrollArea className="max-h-[calc(100vh-400px)]">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">{isRTL ? "کاور" : "Cover"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "عنوان" : "Title"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "تاریخ" : "Date"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "صندلی" : "Seats"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "وضعیت/پرچم" : "Status/Flags"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "عملیات" : "Actions"}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="text-xs"><CoverThumbnail url={w.coverUrl} isRTL={isRTL} /></TableCell>
                  <TableCell className="text-xs max-w-[180px] truncate">{isRTL ? w.titleFa : w.titleEn}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(String((w as Record<string, unknown>).date || w.createdAt), isRTL)}</TableCell>
                  <TableCell className="text-xs">{String((w as Record<string, unknown>).reservedSeats || 0)}/{String((w as Record<string, unknown>).totalSeats || 0)}</TableCell>
                  <TableCell className="text-xs"><ContentFlags item={w} type="workshops" isRTL={isRTL} onRefresh={fetchData} /></TableCell>
                  <TableCell className="text-xs">
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => setEditingItem(w)}>
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 px-1.5 text-red-500" onClick={() => setDeleteTarget(w)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{isRTL ? "کارگاه جدید" : "New Workshop"}</DialogTitle><DialogDescription className="sr-only">فرم ایجاد کارگاه جدید</DialogDescription></DialogHeader>
            <WorkshopForm isRTL={isRTL} onClose={() => { setShowCreate(false); fetchData(); }} />
          </DialogContent>
        </Dialog>
        <Dialog open={!!editingItem} onOpenChange={(open) => { if (!open) setEditingItem(null); }}>
          <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{isRTL ? "ویرایش کارگاه" : "Edit Workshop"}</DialogTitle><DialogDescription className="sr-only">فرم ویرایش کارگاه</DialogDescription></DialogHeader>
            <WorkshopForm isRTL={isRTL} initialData={editingItem} onClose={() => { setEditingItem(null); fetchData(); }} />
          </DialogContent>
        </Dialog>
      </div>
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={() => deleteTarget && deleteItem(deleteTarget.id)}
        isRTL={isRTL}
        itemName={deleteTarget ? (isRTL ? deleteTarget.titleFa : deleteTarget.titleEn) : ""}
      />
    </>
  );
}

function WorkshopForm({ isRTL, onClose, initialData }: { isRTL: boolean; onClose: () => void; initialData?: ContentItem | null }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    titleFa: initialData?.titleFa || "",
    titleEn: initialData?.titleEn || "",
    instructorFa: (initialData as Record<string, unknown>)?.instructorFa as string || "",
    instructorEn: (initialData as Record<string, unknown>)?.instructorEn as string || "",
    date: initialData ? String((initialData as Record<string, unknown>).date || "").split('T')[0] : "",
    totalSeats: String((initialData as Record<string, unknown>)?.totalSeats || 30),
    price: (initialData as Record<string, unknown>)?.price ? String((initialData as Record<string, unknown>).price) : "",
    category: (initialData as Record<string, unknown>)?.category as string || "",
    locationFa: (initialData as Record<string, unknown>)?.locationFa as string || "",
    coverUrl: initialData?.coverUrl || "",
    isPublished: initialData?.isPublished ?? true,
    isFeatured: initialData?.isFeatured ?? false,
    isShowOnHome: initialData?.isShowOnHome ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required fields before publishing
    if (form.isPublished && (!form.titleFa && !form.titleEn)) {
      toast.error(isRTL ? "عنوان برای انتشار الزامی است" : "Title is required for publishing");
      return;
    }
    setSaving(true);
    try {
      const url = initialData ? `/api/admin/workshops-data/${initialData.id}` : "/api/admin/workshops-data";
      const method = initialData ? "PUT" : "POST";
      const res = await authFetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, totalSeats: parseInt(form.totalSeats) || 30, price: form.price ? parseInt(form.price) : null }) });
      if (res.ok) {
        toast.success(initialData ? (isRTL ? "بروزرسانی شد" : "Updated") : (isRTL ? "ایجاد شد" : "Created"));
        logAuditAction(initialData ? "UPDATE" : "CREATE", "workshop", initialData?.id || null, `Workshop ${initialData ? 'updated' : 'created'}: ${form.titleFa}`);
        onClose();
      }
      else { const d = await res.json(); toast.error(d.error || "Error"); }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">{isRTL ? "عنوان فارسی" : "Title (FA)"} *</Label><Input className="h-8 text-sm" value={form.titleFa} onChange={(e) => setForm({ ...form, titleFa: e.target.value })} /></div>
        <div><Label className="text-xs">{isRTL ? "عنوان انگلیسی" : "Title (EN)"} *</Label><Input className="h-8 text-sm" value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} /></div>
        <div><Label className="text-xs">{isRTL ? "مدرس فارسی" : "Instructor (FA)"} *</Label><Input className="h-8 text-sm" value={form.instructorFa} onChange={(e) => setForm({ ...form, instructorFa: e.target.value })} /></div>
        <div><Label className="text-xs">{isRTL ? "مدرس انگلیسی" : "Instructor (EN)"} *</Label><Input className="h-8 text-sm" value={form.instructorEn} onChange={(e) => setForm({ ...form, instructorEn: e.target.value })} /></div>
        <div><Label className="text-xs">{isRTL ? "تاریخ" : "Date"} *</Label><Input type="date" className="h-8 text-sm" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
        <div><Label className="text-xs">{isRTL ? "تعداد صندلی" : "Total Seats"}</Label><Input type="number" className="h-8 text-sm" value={form.totalSeats} onChange={(e) => setForm({ ...form, totalSeats: e.target.value })} /></div>
        <div><Label className="text-xs">{isRTL ? "قیمت (تومان)" : "Price"}</Label><Input type="number" className="h-8 text-sm" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
        <div><Label className="text-xs">{isRTL ? "دسته‌بندی" : "Category"}</Label><Input className="h-8 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
      </div>
      <div><Label className="text-xs">{isRTL ? "آدرس تصویر کاور" : "Cover Image URL"}</Label><Input className="h-8 text-sm" value={form.coverUrl} onChange={(e) => setForm({ ...form, coverUrl: e.target.value })} placeholder="https://..." dir="ltr" /></div>
      {form.coverUrl && (
        <div className="relative w-full h-24 rounded-lg overflow-hidden border border-border/50">
          <img src={form.coverUrl} alt="Cover preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
      )}
      <div className={cn("flex items-center gap-4 flex-wrap", isRTL && "flex-row-reverse")}>
        <div className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse")}><Switch checked={form.isPublished} onCheckedChange={(v) => setForm({ ...form, isPublished: v })} /><Label className="text-xs">{isRTL ? "انتشار" : "Publish"}</Label></div>
        <div className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse")}><Switch checked={form.isFeatured} onCheckedChange={(v) => setForm({ ...form, isFeatured: v })} /><Label className="text-xs"><Star className="w-3 h-3 inline text-amber-500" /> {isRTL ? "ویژه" : "Featured"}</Label></div>
        <div className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse")}><Switch checked={form.isShowOnHome} onCheckedChange={(v) => setForm({ ...form, isShowOnHome: v })} /><Label className="text-xs"><Home className="w-3 h-3 inline text-primary" /> {isRTL ? "صفحه اصلی" : "Homepage"}</Label></div>
      </div>
      <div className={cn("flex gap-2 justify-end", isRTL && "flex-row-reverse")}><Button type="button" variant="outline" size="sm" onClick={onClose}>{isRTL ? "انصراف" : "Cancel"}</Button><Button type="submit" size="sm" disabled={saving}>{saving && <Loader2 className="w-3.5 h-3.5 me-1 animate-spin" />}{initialData ? (isRTL ? "بروزرسانی" : "Update") : (isRTL ? "ایجاد" : "Create")}</Button></div>
    </form>
  );
}

function AnnouncementSection({ isRTL }: { isRTL: boolean }) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContentItem | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/admin/announcements?all=true");
      if (res.ok) { const d = await res.json(); setItems(d.announcements || []); }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
    finally { setLoading(false); }
  }, [isRTL]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const deleteItem = async (id: string) => {
    try {
      const res = await authFetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(isRTL ? "حذف شد" : "Deleted");
        logAuditAction("DELETE", "announcement", id, `Announcement deleted: ${deleteTarget?.titleFa || id}`);
        fetchData();
      }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
    finally { setDeleteTarget(null); }
  };

  if (loading) return <Spinner />;

  return (
    <>
      <div className="space-y-3">
        <div className={cn("flex justify-end", isRTL && "flex-row-reverse")}>
          <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="w-3.5 h-3.5 me-1" />{isRTL ? "اعلان جدید" : "New Announcement"}</Button>
        </div>
        <ScrollArea className="max-h-[calc(100vh-400px)]">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">{isRTL ? "عنوان" : "Title"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "نوع" : "Type"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "وضعیت/پرچم" : "Status/Flags"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "تاریخ" : "Date"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "عملیات" : "Actions"}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-xs max-w-[200px] truncate">{isRTL ? a.titleFa : a.titleEn}</TableCell>
                  <TableCell className="text-xs"><Badge variant="outline" className="text-[10px]">{String((a as Record<string, unknown>).type || "info")}</Badge></TableCell>
                  <TableCell className="text-xs"><ContentFlags item={a} type="announcements" isRTL={isRTL} onRefresh={fetchData} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(a.createdAt, isRTL)}</TableCell>
                  <TableCell className="text-xs">
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-6 px-1.5 text-primary" onClick={() => setEditingItem(a)}>
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 px-1.5 text-red-500" onClick={() => setDeleteTarget(a)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{isRTL ? "اعلان جدید" : "New Announcement"}</DialogTitle><DialogDescription className="sr-only">فرم ایجاد اعلان جدید</DialogDescription></DialogHeader>
            <AnnouncementForm isRTL={isRTL} onClose={() => { setShowCreate(false); fetchData(); }} />
          </DialogContent>
        </Dialog>
        <Dialog open={!!editingItem} onOpenChange={(open) => { if (!open) setEditingItem(null); }}>
          <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{isRTL ? "ویرایش اعلان" : "Edit Announcement"}</DialogTitle><DialogDescription className="sr-only">فرم ویرایش اعلان</DialogDescription></DialogHeader>
            <AnnouncementForm isRTL={isRTL} initialData={editingItem} onClose={() => { setEditingItem(null); fetchData(); }} />
          </DialogContent>
        </Dialog>
      </div>
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={() => deleteTarget && deleteItem(deleteTarget.id)}
        isRTL={isRTL}
        itemName={deleteTarget ? (isRTL ? deleteTarget.titleFa : deleteTarget.titleEn) : ""}
      />
    </>
  );
}

function AnnouncementForm({ isRTL, onClose, initialData }: { isRTL: boolean; onClose: () => void; initialData?: ContentItem | null }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    titleFa: initialData?.titleFa || "",
    titleEn: initialData?.titleEn || "",
    contentFa: (initialData?.contentFa as string) || "",
    contentEn: (initialData?.contentEn as string) || "",
    type: (initialData?.type as string) || "info",
    priority: (initialData?.priority as number) ?? 0,
    isPublished: initialData?.isPublished ?? false,
    isFeatured: initialData?.isFeatured ?? false,
    isShowOnHome: initialData?.isShowOnHome ?? false,
    imageUrl: (initialData?.imageUrl as string) || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required fields before publishing
    if (form.isPublished && (!form.titleFa && !form.titleEn)) {
      toast.error(isRTL ? "عنوان برای انتشار الزامی است" : "Title is required for publishing");
      return;
    }
    setSaving(true);
    try {
      const url = initialData ? `/api/admin/announcements/${initialData.id}` : "/api/admin/announcements";
      const method = initialData ? "PUT" : "POST";
      const res = await authFetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) {
        toast.success(initialData ? (isRTL ? "بروزرسانی شد" : "Updated") : (isRTL ? "ایجاد شد" : "Created"));
        logAuditAction(initialData ? "UPDATE" : "CREATE", "announcement", initialData?.id || null, `Announcement ${initialData ? "updated" : "created"}: ${form.titleFa}`);
        onClose();
      }
      else { const d = await res.json(); toast.error(d.error || "Error"); }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">{isRTL ? "عنوان فارسی" : "Title (FA)"} *</Label><Input className="h-8 text-sm" value={form.titleFa} onChange={(e) => setForm({ ...form, titleFa: e.target.value })} /></div>
        <div><Label className="text-xs">{isRTL ? "عنوان انگلیسی" : "Title (EN)"} *</Label><Input className="h-8 text-sm" value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} /></div>
      </div>
      <div><Label className="text-xs">{isRTL ? "محتوای فارسی" : "Content (FA)"}</Label><Textarea className="text-sm" rows={3} value={form.contentFa} onChange={(e) => setForm({ ...form, contentFa: e.target.value })} /></div>
      <div><Label className="text-xs">{isRTL ? "محتوای انگلیسی" : "Content (EN)"}</Label><Textarea className="text-sm" rows={3} value={form.contentEn} onChange={(e) => setForm({ ...form, contentEn: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">{isRTL ? "نوع" : "Type"}</Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="info">Info</SelectItem><SelectItem value="workshop">Workshop</SelectItem><SelectItem value="course">Course</SelectItem><SelectItem value="event">Event</SelectItem><SelectItem value="urgent">Urgent</SelectItem><SelectItem value="promo">Promo</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label className="text-xs">{isRTL ? "اولویت" : "Priority"}</Label><Input type="number" className="h-8 text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} /></div>
      </div>
      <div><Label className="text-xs">{isRTL ? "آدرس تصویر" : "Image URL"}</Label><Input className="h-8 text-sm" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." /></div>
      <div className={cn("flex items-center gap-4 flex-wrap", isRTL && "flex-row-reverse")}>
        <div className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse")}><Switch checked={form.isPublished} onCheckedChange={(v) => setForm({ ...form, isPublished: v })} /><Label className="text-xs">{isRTL ? "انتشار" : "Publish"}</Label></div>
        <div className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse")}><Switch checked={form.isFeatured} onCheckedChange={(v) => setForm({ ...form, isFeatured: v })} /><Label className="text-xs"><Star className="w-3 h-3 inline text-amber-500" /> {isRTL ? "ویژه" : "Featured"}</Label></div>
        <div className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse")}><Switch checked={form.isShowOnHome} onCheckedChange={(v) => setForm({ ...form, isShowOnHome: v })} /><Label className="text-xs"><Home className="w-3 h-3 inline text-primary" /> {isRTL ? "صفحه اصلی" : "Homepage"}</Label></div>
      </div>
      <div className={cn("flex gap-2 justify-end", isRTL && "flex-row-reverse")}><Button type="button" variant="outline" size="sm" onClick={onClose}>{isRTL ? "انصراف" : "Cancel"}</Button><Button type="submit" size="sm" disabled={saving}>{saving && <Loader2 className="w-3.5 h-3.5 me-1 animate-spin" />}{initialData ? (isRTL ? "بروزرسانی" : "Update") : (isRTL ? "ایجاد" : "Create")}</Button></div>
    </form>
  );
}

// ============================================
// ADMINS & PERMISSIONS TAB
// ============================================
function AdminsTab({ isRTL }: { isRTL: boolean }) {
  const [admins, setAdmins] = useState<AdminEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [permAdmin, setPermAdmin] = useState<AdminEntry | null>(null);
  const [editAdmin, setEditAdmin] = useState<AdminEntry | null>(null);
  const [deleteAdmin, setDeleteAdmin] = useState<AdminEntry | null>(null);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/admin/admins");
      if (res.ok) { const d = await res.json(); setAdmins(d.admins); }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
    finally { setLoading(false); }
  }, [isRTL]);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await authFetch(`/api/admin/admins/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !isActive }) });
      if (res.ok) { toast.success(isRTL ? "وضعیت تغییر کرد" : "Status updated"); fetchAdmins(); }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
  };

  const handleDeleteAdmin = async (id: string) => {
    try {
      const res = await authFetch(`/api/admin/admins/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(isRTL ? "مدیر حذف شد" : "Admin deleted");
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

  return (
    <div className="space-y-4">
      <div className={cn("flex justify-between items-center", isRTL && "flex-row-reverse")}>
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="w-3.5 h-3.5 me-1" />{isRTL ? "مدیر جدید" : "New Admin"}</Button>
        <Button size="sm" variant="outline" onClick={fetchAdmins}><RefreshCw className="w-3.5 h-3.5" /></Button>
      </div>

      {loading ? <Spinner /> : (
        <ScrollArea className="max-h-[calc(100vh-340px)]">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">{isRTL ? "نام" : "Name"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "نقش" : "Role"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "مجوزها" : "Perms"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "وضعیت" : "Status"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "آخرین ورود" : "Last Login"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "عملیات" : "Actions"}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {admins.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-xs"><div className="font-medium">{a.name}</div><div className="text-muted-foreground text-[10px]">{a.email}</div></TableCell>
                  <TableCell className="text-xs"><Badge className={cn("text-[10px]", a.role === "super_admin" ? "bg-red-500/10 text-red-600" : a.role === "admin" ? "bg-amber-500/10 text-amber-600" : "bg-sky-500/10 text-sky-600")}>{a.role}</Badge></TableCell>
                  <TableCell className="text-xs">{a._count.permissions}</TableCell>
                  <TableCell className="text-xs">
                    <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => toggleActive(a.id, a.isActive)}>
                      {a.isActive ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                    </Button>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{a.lastLoginAt ? formatTimeAgo(a.lastLoginAt, isRTL) : "—"}</TableCell>
                  <TableCell className="text-xs">
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => setEditAdmin(a)} title={isRTL ? "ویرایش" : "Edit"}><Edit3 className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => setPermAdmin(a)} title={isRTL ? "مجوزها" : "Permissions"}><Key className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="h-6 px-1.5 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => setDeleteAdmin(a)} title={isRTL ? "حذف" : "Delete"}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>{isRTL ? "مدیر جدید" : "New Admin"}</DialogTitle><DialogDescription className="sr-only">فرم ایجاد مدیر جدید</DialogDescription></DialogHeader>
          <CreateAdminForm isRTL={isRTL} onClose={() => { setShowCreate(false); fetchAdmins(); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!permAdmin} onOpenChange={() => setPermAdmin(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto"><DialogHeader><DialogTitle>{isRTL ? `مجوزهای ${permAdmin?.name}` : `Permissions: ${permAdmin?.name}`}</DialogTitle><DialogDescription className="sr-only">مدیریت مجوزهای دسترسی مدیر</DialogDescription></DialogHeader>
          {permAdmin && <PermissionGrid admin={permAdmin} isRTL={isRTL} onUpdate={() => { setPermAdmin(null); fetchAdmins(); }} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editAdmin} onOpenChange={() => setEditAdmin(null)}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>{isRTL ? `ویرایش ${editAdmin?.name}` : `Edit ${editAdmin?.name}`}</DialogTitle><DialogDescription className="sr-only">فرم ویرایش اطلاعات مدیر</DialogDescription></DialogHeader>
          {editAdmin && <EditAdminDialog admin={editAdmin} isRTL={isRTL} onUpdate={() => { setEditAdmin(null); fetchAdmins(); }} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteAdmin} onOpenChange={() => setDeleteAdmin(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRTL ? "حذف مدیر" : "Delete Admin"}</AlertDialogTitle>
            <AlertDialogDescription>{isRTL ? `آیا از حذف ${deleteAdmin?.name} اطمینان دارید؟ این عمل قابل بازگشت نیست.` : `Are you sure you want to delete ${deleteAdmin?.name}? This action cannot be undone.`}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRTL ? "انصراف" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteAdmin && handleDeleteAdmin(deleteAdmin.id)}>{isRTL ? "حذف" : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

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

  // When role changes to super_admin, clear permissions (super_admin bypasses all)
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
      const payload = { ...form, permissions: form.role !== "super_admin" ? selectedPerms : [] };
      const res = await authFetch("/api/admin/admins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        toast.success(isRTL ? "مدیر ایجاد شد" : "Admin created");
        logAuditAction("CREATE", "admin", null, `Admin created: ${form.name} (${form.role}) with ${selectedPerms.length} permissions`);
        onClose();
      }
      else { const d = await res.json(); toast.error(d.error || "Error"); }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
    finally { setSaving(false); }
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

      {/* Permission Grid — only for non-super_admin roles */}
      {form.role !== "super_admin" && (
        <div className="space-y-2">
          <Label className="text-xs font-semibold flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5" />
            {isRTL ? "مجوزهای دسترسی" : "Permissions"}
          </Label>

          {/* Quick Templates */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1.5">{isRTL ? "انتخاب سریع الگو:" : "Quick template:"}</p>
            <div className="flex flex-wrap gap-1">
              {PERMISSION_TEMPLATES.map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => applyTemplate(t.key)}
                  className={cn(
                    "text-[9px] px-2 py-1 rounded-md border transition-colors",
                    activeTemplate === t.key
                      ? "bg-primary/10 border-primary/30 text-primary font-semibold"
                      : "border-border/50 text-muted-foreground hover:border-primary/30 hover:bg-primary/5"
                  )}
                  title={isRTL ? t.descFa : t.descEn}
                >
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
                              <button
                                key={`${res.key}-${act.key}`}
                                type="button"
                                onClick={() => togglePerm(res.key, act.key)}
                                title={isRTL ? act.descFa : act.descEn}
                                className={cn(
                                  "text-[9px] px-1.5 py-0.5 rounded border transition-colors",
                                  isActive
                                    ? "bg-primary/10 border-primary/30 text-primary font-medium"
                                    : "border-border/40 text-muted-foreground hover:border-border"
                                )}
                              >
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

function EditAdminDialog({ admin, isRTL, onUpdate }: { admin: AdminEntry; isRTL: boolean; onUpdate: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: admin.name,
    email: admin.email,
    phone: admin.phone || "",
    role: admin.role,
    password: "",
    isActive: admin.isActive,
    resetLock: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        role: form.role,
        isActive: form.isActive,
      };
      if (form.password) body.password = form.password;
      if (form.resetLock) {
        body.resetLock = true;
      }
      // Validate password length if provided
      if (form.password && form.password.length < 6) {
        toast.error(isRTL ? "رمز عبور باید حداقل ۶ کاراکتر باشد" : "Password must be at least 6 characters");
        setSaving(false);
        return;
      }
      const res = await authFetch(`/api/admin/admins/${admin.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(isRTL ? "مدیر بروزرسانی شد" : "Admin updated");
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
          <SelectContent><SelectItem value="super_admin">{isRTL ? "سوپر ادمین" : "Super Admin"}</SelectItem><SelectItem value="admin">{isRTL ? "مدیر" : "Admin"}</SelectItem><SelectItem value="editor">{isRTL ? "ویرایشگر" : "Editor"}</SelectItem></SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">{isRTL ? "رمز عبور جدید" : "New Password"}</Label>
        <Input type="password" className="h-8 text-sm" placeholder={isRTL ? "خالی بگذارید برای حفظ رمز فعلی" : "Leave empty to keep current password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {form.password && form.password.length < 6 && (
          <p className="text-[10px] text-red-500 mt-0.5">{isRTL ? "رمز عبور باید حداقل ۶ کاراکتر باشد" : "Password must be at least 6 characters"}</p>
        )}
        {form.password && (
          <p className="text-[10px] text-amber-600 mt-0.5">{isRTL ? "⚠️ رمز عبور تغییر خواهد کرد. کاربر باید از رمز جدید مطلع شود." : "⚠️ Password will be changed. The user must be notified."}</p>
        )}
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
      <div className={cn("flex gap-2 justify-end", isRTL && "flex-row-reverse")}><Button type="submit" size="sm" disabled={saving}>{saving && <Loader2 className="w-3.5 h-3.5 me-1 animate-spin" />}{isRTL ? "ذخیره" : "Save"}</Button></div>
    </form>
  );
}

function PermissionGrid({ admin, isRTL, onUpdate }: { admin: AdminEntry; isRTL: boolean; onUpdate: () => void }) {
  const [perms, setPerms] = useState<Set<string>>(() => new Set(admin.permissions.filter((p) => p.granted).map((p) => `${p.resource}:${p.action}`)));
  const [saving, setSaving] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string>("people");

  const toggle = (resource: string, action: string) => {
    const key = `${resource}:${action}`;
    setPerms((prev) => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
    setActiveTemplate(null); // Clear template indicator when manually changed
  };

  const toggleAllForResource = (resourceKey: string, enable: boolean) => {
    setPerms((prev) => {
      const next = new Set(prev);
      ACTIONS.forEach((a) => {
        const key = `${resourceKey}:${a.key}`;
        if (enable) next.add(key);
        else next.delete(key);
      });
      return next;
    });
    setActiveTemplate(null);
  };

  const toggleAllForCategory = (categoryKey: string, enable: boolean) => {
    setPerms((prev) => {
      const next = new Set(prev);
      RESOURCES.filter(r => r.category === categoryKey).forEach((r) => {
        ACTIONS.forEach((a) => {
          const key = `${r.key}:${a.key}`;
          if (enable) next.add(key);
          else next.delete(key);
        });
      });
      return next;
    });
    setActiveTemplate(null);
  };

  const applyTemplate = (templateKey: string) => {
    const template = PERMISSION_TEMPLATES.find(t => t.key === templateKey);
    if (!template) return;
    const newPerms = new Set<string>();
    template.permissions.forEach(p => {
      p.actions.forEach(a => newPerms.add(`${p.resource}:${a}`));
    });
    setPerms(newPerms);
    setActiveTemplate(templateKey);
  };

  const clearAll = () => {
    setPerms(new Set());
    setActiveTemplate(null);
  };

  const grantAll = () => {
    const allPerms = new Set<string>();
    RESOURCES.forEach(r => ACTIONS.forEach(a => allPerms.add(`${r.key}:${a.key}`)));
    setPerms(allPerms);
    setActiveTemplate(null);
  };

  const save = async () => {
    setSaving(true);
    try {
      const permList = Array.from(perms).map((k) => { const [resource, action] = k.split(":"); return { resource, action }; });
      const res = await authFetch("/api/admin/permissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ adminId: admin.id, permissions: permList }) });
      if (res.ok) {
        toast.success(isRTL ? "مجوزها ذخیره شد" : "Permissions saved");
        logAuditAction("PERMISSION_CHANGE", "admin", admin.id, `Permissions updated for ${admin.name}: ${permList.length} permissions granted`);
        onUpdate();
      }
      else toast.error(isRTL ? "خطا" : "Error");
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
    finally { setSaving(false); }
  };

  // Calculate stats per category
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
      {/* ─── Permission Summary ─── */}
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

      {/* ─── Quick Templates ─── */}
      <div>
        <p className="text-xs font-semibold mb-2 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-500" />{isRTL ? "الگوهای سریع دسترسی" : "Quick Permission Templates"}</p>
        <div className="flex flex-wrap gap-1.5">
          {PERMISSION_TEMPLATES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => applyTemplate(t.key)}
              className={cn(
                "text-[10px] px-2.5 py-1.5 rounded-lg border transition-all",
                activeTemplate === t.key
                  ? "bg-primary/10 border-primary/30 text-primary font-semibold ring-1 ring-primary/20"
                  : "border-border/50 text-muted-foreground hover:border-primary/30 hover:bg-primary/5"
              )}
              title={isRTL ? t.descFa : t.descEn}
            >
              {isRTL ? t.labelFa : t.labelEn}
            </button>
          ))}
        </div>
        <div className={cn("flex gap-2 mt-2", isRTL && "flex-row-reverse")}>
          <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" onClick={grantAll}>{isRTL ? "فعال کردن همه" : "Grant All"}</Button>
          <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] rounded-lg text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={clearAll}>{isRTL ? "غیرفعال کردن همه" : "Clear All"}</Button>
        </div>
      </div>

      {/* ─── Categorized Permission Sections ─── */}
      {RESOURCE_CATEGORIES.map((cat) => {
        const catResources = RESOURCES.filter(r => r.category === cat.key);
        const stats = getCategoryStats(cat.key);
        const isExpanded = expandedCategory === cat.key;

        return (
          <div key={cat.key} className="border border-border/40 rounded-xl overflow-hidden">
            {/* Category Header */}
            <button
              type="button"
              className={cn("w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors", isRTL && "flex-row-reverse")}
              onClick={() => setExpandedCategory(isExpanded ? "" : cat.key)}
            >
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
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-[9px]"
                  onClick={(e) => { e.stopPropagation(); toggleAllForCategory(cat.key, stats.percent < 100); }}
                >
                  {stats.percent < 100 ? (isRTL ? "همه" : "All") : (isRTL ? "هیچ" : "None")}
                </Button>
              </div>
            </button>

            {/* Category Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="px-3 pb-3 space-y-2">
                    {catResources.map((res) => {
                      const resStats = getResourceStats(res.key);
                      return (
                        <div key={res.key} className="rounded-lg border border-border/30 p-2.5 space-y-2">
                          {/* Resource Header */}
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
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-5 px-1.5 text-[8px]"
                                onClick={() => toggleAllForResource(res.key, resStats.percent < 100)}
                              >
                                {resStats.percent < 100 ? (isRTL ? "همه" : "All") : (isRTL ? "هیچ" : "None")}
                              </Button>
                            </div>
                          </div>
                          {/* Action Buttons */}
                          <div className={cn("flex flex-wrap gap-1.5", isRTL && "flex-row-reverse")}>
                            {ACTIONS.map((act) => {
                              const isActive = perms.has(`${res.key}:${act.key}`);
                              return (
                                <button
                                  key={`${res.key}-${act.key}`}
                                  type="button"
                                  onClick={() => toggle(res.key, act.key)}
                                  title={isRTL ? act.descFa : act.descEn}
                                  className={cn(
                                    "text-[9px] px-2 py-1 rounded-md border transition-all font-medium",
                                    isActive
                                      ? "bg-primary/10 border-primary/30 text-primary ring-1 ring-primary/10"
                                      : "border-border/30 text-muted-foreground hover:border-border/60 hover:bg-muted/30"
                                  )}
                                >
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

      {/* ─── Save Button ─── */}
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

// ============================================
// MESSAGES TAB
// ============================================
// ============================================
// TESTIMONIALS TAB
// ============================================
interface TestimonialEntry {
  id: string;
  name: string;
  email: string;
  googleAvatarUrl: string | null;
  googleEmail: string | null;
  rating: number;
  titleFa: string | null;
  titleEn: string | null;
  contentFa: string;
  contentEn: string | null;
  instrument: string | null;
  courseId: string | null;
  studentId: string | null;
  source: string;
  isPublished: boolean;
  isApproved: boolean;
  isFeatured: boolean;
  displayOrder: number;
  status: string;
  rejectionReason: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

const TESTIMONIAL_STATUS_CONFIG: Record<string, { labelFa: string; labelEn: string; color: string; icon: typeof Star }> = {
  pending: { labelFa: "در انتظار", labelEn: "Pending", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: Clock },
  approved: { labelFa: "تأیید شده", labelEn: "Approved", color: "bg-sky-500/10 text-sky-600 dark:text-sky-400", icon: CheckCircle2 },
  published: { labelFa: "منتشر شده", labelEn: "Published", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: Globe },
  rejected: { labelFa: "رد شده", labelEn: "Rejected", color: "bg-red-500/10 text-red-600 dark:text-red-400", icon: XCircle },
};

const TESTIMONIAL_SOURCE_CONFIG: Record<string, { labelFa: string; labelEn: string; color: string }> = {
  contact: { labelFa: "فرم تماس", labelEn: "Contact Form", color: "bg-sky-500/10 text-sky-600" },
  google: { labelFa: "گوگل", labelEn: "Google", color: "bg-emerald-500/10 text-emerald-600" },
  direct: { labelFa: "مستقیم", labelEn: "Direct", color: "bg-violet-500/10 text-violet-600" },
  admin_added: { labelFa: "اضافه شده توسط مدیر", labelEn: "Admin Added", color: "bg-amber-500/10 text-amber-600" },
};

function TestimonialsTab({ isRTL }: { isRTL: boolean }) {
  const [testimonials, setTestimonials] = useState<TestimonialEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [pendingCount, setPendingCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<TestimonialEntry | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingTestimonial, setDeletingTestimonial] = useState<TestimonialEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", googleAvatarUrl: "", googleEmail: "", rating: 5, titleFa: "", titleEn: "", contentFa: "", contentEn: "", instrument: "" });
  const [editForm, setEditForm] = useState({ name: "", email: "", googleAvatarUrl: "", googleEmail: "", rating: 5, titleFa: "", titleEn: "", contentFa: "", contentEn: "", instrument: "", isFeatured: false, adminNotes: "" });

  const fetchTestimonials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/admin/testimonials?filter=${filter}&limit=200`);
      if (res.ok) {
        const d = await res.json();
        setTestimonials(d.testimonials || []);
        setTotal(d.total || 0);
        setPendingCount(d.pendingCount || 0);
      }
    } catch {
      toast.error(isRTL ? "خطا در بارگذاری بازخوردها" : "Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  }, [isRTL, filter]);

  useEffect(() => { fetchTestimonials(); }, [fetchTestimonials]);

  const handleAction = async (id: string, action: string, extra?: Record<string, unknown>) => {
    try {
      const res = await authFetch(`/api/admin/testimonials/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      if (res.ok) {
        const actionLabels: Record<string, string> = {
          approve: isRTL ? "بازخورد تأیید شد" : "Testimonial approved",
          reject: isRTL ? "بازخورد رد شد" : "Testimonial rejected",
          publish: isRTL ? "بازخورد منتشر شد" : "Testimonial published",
          unpublish: isRTL ? "بازخورد از انتشار خارج شد" : "Testimonial unpublished",
        };
        toast.success(actionLabels[action] || (isRTL ? "عملیات انجام شد" : "Action completed"));
        fetchTestimonials();
      } else {
        const d = await res.json();
        toast.error(d.error || (isRTL ? "خطا در عملیات" : "Action failed"));
      }
    } catch {
      toast.error(isRTL ? "خطا در ارتباط" : "Connection error");
    }
  };

  const handleFeature = async (id: string, isFeatured: boolean) => {
    try {
      const res = await authFetch(`/api/admin/testimonials/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !isFeatured }),
      });
      if (res.ok) {
        toast.success(!isFeatured ? (isRTL ? "برجسته شد" : "Featured") : (isRTL ? "از برجستگی خارج شد" : "Unfeatured"));
        fetchTestimonials();
      }
    } catch {
      toast.error(isRTL ? "خطا" : "Error");
    }
  };

  const handleAdd = async () => {
    if (!addForm.name || !addForm.contentFa) {
      toast.error(isRTL ? "نام و متن فارسی الزامی است" : "Name and Farsi content are required");
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch("/api/admin/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      if (res.ok) {
        toast.success(isRTL ? "بازخورد اضافه شد" : "Testimonial added");
        setIsAddDialogOpen(false);
        setAddForm({ name: "", email: "", googleAvatarUrl: "", googleEmail: "", rating: 5, titleFa: "", titleEn: "", contentFa: "", contentEn: "", instrument: "" });
        fetchTestimonials();
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

  const handleEdit = async () => {
    if (!editingTestimonial) return;
    setSaving(true);
    try {
      const res = await authFetch(`/api/admin/testimonials/${editingTestimonial.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        toast.success(isRTL ? "بازخورد بروزرسانی شد" : "Testimonial updated");
        setIsEditDialogOpen(false);
        setEditingTestimonial(null);
        fetchTestimonials();
      } else {
        toast.error(isRTL ? "خطا" : "Error");
      }
    } catch {
      toast.error(isRTL ? "خطا" : "Error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTestimonial) return;
    try {
      const res = await authFetch(`/api/admin/testimonials/${deletingTestimonial.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(isRTL ? "بازخورد حذف شد" : "Testimonial deleted");
        setIsDeleteDialogOpen(false);
        setDeletingTestimonial(null);
        fetchTestimonials();
      } else {
        toast.error(isRTL ? "خطا در حذف" : "Delete failed");
      }
    } catch {
      toast.error(isRTL ? "خطا" : "Error");
    }
  };

  const openEdit = (t: TestimonialEntry) => {
    setEditingTestimonial(t);
    setEditForm({
      name: t.name, email: t.email, googleAvatarUrl: t.googleAvatarUrl || "",
      googleEmail: t.googleEmail || "", rating: t.rating, titleFa: t.titleFa || "",
      titleEn: t.titleEn || "", contentFa: t.contentFa, contentEn: t.contentEn || "",
      instrument: t.instrument || "", isFeatured: t.isFeatured, adminNotes: t.adminNotes || "",
    });
    setIsEditDialogOpen(true);
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={cn("w-3.5 h-3.5", s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={cn("flex flex-wrap items-center gap-3", isRTL && "flex-row-reverse")}>
        <div className={cn("flex flex-wrap gap-1", isRTL && "flex-row-reverse")}>
          {(["all", "pending", "approved", "published", "rejected"] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
              {f === "all" && <Archive className="w-3.5 h-3.5 me-1" />}
              {f === "pending" && <Clock className="w-3.5 h-3.5 me-1" />}
              {f === "approved" && <CheckCircle2 className="w-3.5 h-3.5 me-1" />}
              {f === "published" && <Globe className="w-3.5 h-3.5 me-1" />}
              {f === "rejected" && <XCircle className="w-3.5 h-3.5 me-1" />}
              {f === "all" ? (isRTL ? "همه" : "All") : f === "pending" ? (isRTL ? "در انتظار" : "Pending") : f === "approved" ? (isRTL ? "تأیید شده" : "Approved") : f === "published" ? (isRTL ? "منتشر شده" : "Published") : (isRTL ? "رد شده" : "Rejected")}
            </Button>
          ))}
        </div>
        <div className="ms-auto flex items-center gap-2">
          {pendingCount > 0 && (
            <Badge className="bg-amber-500/10 text-amber-600 text-[10px] border-0">
              {pendingCount} {isRTL ? "در انتظار بررسی" : "pending review"}
            </Badge>
          )}
          <Button size="sm" onClick={() => setIsAddDialogOpen(true)}><Plus className="w-3.5 h-3.5 me-1" />{isRTL ? "بازخورد جدید" : "Add Testimonial"}</Button>
        </div>
      </div>

      {/* List */}
      {loading ? <Spinner /> : (
        <ScrollArea className="max-h-[calc(100vh-340px)]">
          <div className="space-y-3">
            {testimonials.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">{isRTL ? "بازخوردی یافت نشد" : "No testimonials found"}</p>
              </div>
            )}
            <AnimatePresence>
              {testimonials.map((t, idx) => {
                const statusConf = TESTIMONIAL_STATUS_CONFIG[t.status] || TESTIMONIAL_STATUS_CONFIG.pending;
                const sourceConf = TESTIMONIAL_SOURCE_CONFIG[t.source] || TESTIMONIAL_SOURCE_CONFIG.contact;
                return (
                  <motion.div key={t.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ delay: idx * 0.03 }}>
                    <Card className={cn("border-border/30 hover:border-primary/20 transition-all", t.status === "pending" && "border-amber-500/30", t.status === "published" && "border-emerald-500/20", t.isFeatured && "ring-1 ring-amber-400/30")}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-muted shrink-0">
                            {t.googleAvatarUrl ? (
                              <img src={t.googleAvatarUrl} alt={t.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-primary font-bold text-sm">{t.name.charAt(0)}</div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className={cn("flex items-center gap-2 mb-1 flex-wrap", isRTL && "flex-row-reverse")}>
                              <span className="text-sm font-semibold truncate">{t.name}</span>
                              {renderStars(t.rating)}
                              <Badge className={cn("text-[9px] px-1.5", statusConf.color)}><statusConf.icon className="w-3 h-3 me-0.5" />{isRTL ? statusConf.labelFa : statusConf.labelEn}</Badge>
                              <Badge className={cn("text-[9px] px-1.5", sourceConf.color)}>{isRTL ? sourceConf.labelFa : sourceConf.labelEn}</Badge>
                              {t.isFeatured && <Badge className="text-[9px] px-1.5 bg-amber-500/10 text-amber-600"><Star className="w-3 h-3 me-0.5 fill-amber-400" />{isRTL ? "برجسته" : "Featured"}</Badge>}
                              {t.instrument && <Badge variant="outline" className="text-[9px] px-1.5">{t.instrument}</Badge>}
                            </div>
                            {t.titleFa && <p className="text-xs font-medium mb-1">{isRTL ? t.titleFa : (t.titleEn || t.titleFa)}</p>}
                            <p className="text-xs text-muted-foreground line-clamp-3">{isRTL ? t.contentFa : (t.contentEn || t.contentFa)}</p>
                            <div className={cn("flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground", isRTL && "flex-row-reverse")}>
                              <span>{t.email}</span>
                              <span>•</span>
                              <span>{formatTimeAgo(t.createdAt, isRTL)}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className={cn("flex flex-col gap-1 shrink-0", isRTL && "items-end")}>
                            {t.status === "pending" && (
                              <>
                                <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10" onClick={() => handleAction(t.id, "approve")}><CheckCircle2 className="w-3 h-3" />{isRTL ? "تأیید" : "Approve"}</Button>
                                <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 text-red-600 hover:text-red-700 hover:bg-red-500/10" onClick={() => handleAction(t.id, "reject")}><XCircle className="w-3 h-3" />{isRTL ? "رد" : "Reject"}</Button>
                              </>
                            )}
                            {t.status === "approved" && (
                              <>
                                <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 text-primary hover:bg-primary/10" onClick={() => handleAction(t.id, "publish")}><Globe className="w-3 h-3" />{isRTL ? "انتشار" : "Publish"}</Button>
                                <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 text-red-600 hover:text-red-700 hover:bg-red-500/10" onClick={() => handleAction(t.id, "reject")}><XCircle className="w-3 h-3" />{isRTL ? "رد" : "Reject"}</Button>
                              </>
                            )}
                            {t.status === "published" && (
                              <>
                                <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => handleAction(t.id, "unpublish")}><EyeOff className="w-3 h-3" />{isRTL ? "لغو انتشار" : "Unpublish"}</Button>
                                <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 text-amber-600 hover:bg-amber-500/10" onClick={() => handleFeature(t.id, t.isFeatured)}>
                                  {t.isFeatured ? <><Star className="w-3 h-3" />{isRTL ? "لغو برجستگی" : "Unfeature"}</> : <><Star className="w-3 h-3" />{isRTL ? "برجسته" : "Feature"}</>}
                                </Button>
                              </>
                            )}
                            {t.status === "rejected" && (
                              <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10" onClick={() => handleAction(t.id, "approve")}><CheckCircle2 className="w-3 h-3" />{isRTL ? "تأیید مجدد" : "Re-approve"}</Button>
                            )}
                            <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1" onClick={() => openEdit(t)}><Edit3 className="w-3 h-3" />{isRTL ? "ویرایش" : "Edit"}</Button>
                            <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 text-red-500 hover:text-red-600" onClick={() => { setDeletingTestimonial(t); setIsDeleteDialogOpen(true); }}><Trash2 className="w-3 h-3" />{isRTL ? "حذف" : "Delete"}</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>
      )}

      {/* Add Testimonial Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isRTL ? "افزودن بازخورد جدید" : "Add New Testimonial"}</DialogTitle><DialogDescription className="sr-only">فرم افزودن بازخورد جدید</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label className="text-xs">{isRTL ? "نام *" : "Name *"}</Label><Input className="h-8 text-sm" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} dir="rtl" /></div>
              <div><Label className="text-xs">{isRTL ? "ایمیل" : "Email"}</Label><Input className="h-8 text-sm" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} dir="ltr" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label className="text-xs">{isRTL ? "آواتار گوگل (URL)" : "Google Avatar URL"}</Label><Input className="h-8 text-sm" value={addForm.googleAvatarUrl} onChange={(e) => setAddForm({ ...addForm, googleAvatarUrl: e.target.value })} dir="ltr" /></div>
              <div><Label className="text-xs">{isRTL ? "ایمیل گوگل" : "Google Email"}</Label><Input className="h-8 text-sm" value={addForm.googleEmail} onChange={(e) => setAddForm({ ...addForm, googleEmail: e.target.value })} dir="ltr" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label className="text-xs">{isRTL ? "امتیاز (۱-۵)" : "Rating (1-5)"}</Label>
                <Select value={String(addForm.rating)} onValueChange={(v) => setAddForm({ ...addForm, rating: parseInt(v) })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{[1,2,3,4,5].map((n) => <SelectItem key={n} value={String(n)}>{n} ★</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">{isRTL ? "ساز" : "Instrument"}</Label><Input className="h-8 text-sm" value={addForm.instrument} onChange={(e) => setAddForm({ ...addForm, instrument: e.target.value })} dir="rtl" /></div>
            </div>
            <div><Label className="text-xs">{isRTL ? "عنوان (فارسی)" : "Title (Farsi)"}</Label><Input className="h-8 text-sm" value={addForm.titleFa} onChange={(e) => setAddForm({ ...addForm, titleFa: e.target.value })} dir="rtl" /></div>
            <div><Label className="text-xs">{isRTL ? "عنوان (انگلیسی)" : "Title (English)"}</Label><Input className="h-8 text-sm" value={addForm.titleEn} onChange={(e) => setAddForm({ ...addForm, titleEn: e.target.value })} dir="ltr" /></div>
            <div><Label className="text-xs">{isRTL ? "متن (فارسی) *" : "Content (Farsi) *"}</Label><Textarea className="text-sm" rows={3} value={addForm.contentFa} onChange={(e) => setAddForm({ ...addForm, contentFa: e.target.value })} dir="rtl" /></div>
            <div><Label className="text-xs">{isRTL ? "متن (انگلیسی)" : "Content (English)"}</Label><Textarea className="text-sm" rows={3} value={addForm.contentEn} onChange={(e) => setAddForm({ ...addForm, contentEn: e.target.value })} dir="ltr" /></div>
            <div className={cn("flex gap-2 justify-end", isRTL && "flex-row-reverse")}>
              <Button variant="outline" size="sm" onClick={() => setIsAddDialogOpen(false)}>{isRTL ? "انصراف" : "Cancel"}</Button>
              <Button size="sm" disabled={saving} onClick={handleAdd}>{saving && <Loader2 className="w-3.5 h-3.5 me-1 animate-spin" />}{isRTL ? "افزودن" : "Add"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Testimonial Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isRTL ? "ویرایش بازخورد" : "Edit Testimonial"}</DialogTitle><DialogDescription className="sr-only">فرم ویرایش بازخورد</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label className="text-xs">{isRTL ? "نام" : "Name"}</Label><Input className="h-8 text-sm" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} dir="rtl" /></div>
              <div><Label className="text-xs">{isRTL ? "ایمیل" : "Email"}</Label><Input className="h-8 text-sm" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} dir="ltr" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label className="text-xs">{isRTL ? "آواتار گوگل (URL)" : "Google Avatar URL"}</Label><Input className="h-8 text-sm" value={editForm.googleAvatarUrl} onChange={(e) => setEditForm({ ...editForm, googleAvatarUrl: e.target.value })} dir="ltr" /></div>
              <div><Label className="text-xs">{isRTL ? "امتیاز (۱-۵)" : "Rating (1-5)"}</Label>
                <Select value={String(editForm.rating)} onValueChange={(v) => setEditForm({ ...editForm, rating: parseInt(v) })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{[1,2,3,4,5].map((n) => <SelectItem key={n} value={String(n)}>{n} ★</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs">{isRTL ? "عنوان (فارسی)" : "Title (Farsi)"}</Label><Input className="h-8 text-sm" value={editForm.titleFa} onChange={(e) => setEditForm({ ...editForm, titleFa: e.target.value })} dir="rtl" /></div>
            <div><Label className="text-xs">{isRTL ? "عنوان (انگلیسی)" : "Title (English)"}</Label><Input className="h-8 text-sm" value={editForm.titleEn} onChange={(e) => setEditForm({ ...editForm, titleEn: e.target.value })} dir="ltr" /></div>
            <div><Label className="text-xs">{isRTL ? "متن (فارسی)" : "Content (Farsi)"}</Label><Textarea className="text-sm" rows={3} value={editForm.contentFa} onChange={(e) => setEditForm({ ...editForm, contentFa: e.target.value })} dir="rtl" /></div>
            <div><Label className="text-xs">{isRTL ? "متن (انگلیسی)" : "Content (English)"}</Label><Textarea className="text-sm" rows={3} value={editForm.contentEn} onChange={(e) => setEditForm({ ...editForm, contentEn: e.target.value })} dir="ltr" /></div>
            <div><Label className="text-xs">{isRTL ? "ساز" : "Instrument"}</Label><Input className="h-8 text-sm" value={editForm.instrument} onChange={(e) => setEditForm({ ...editForm, instrument: e.target.value })} dir="rtl" /></div>
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Switch checked={editForm.isFeatured} onCheckedChange={(v) => setEditForm({ ...editForm, isFeatured: v })} />
              <Label className="text-xs">{isRTL ? "برجسته" : "Featured"}</Label>
            </div>
            <div><Label className="text-xs">{isRTL ? "یادداشت مدیر" : "Admin Notes"}</Label><Textarea className="text-sm" rows={2} value={editForm.adminNotes} onChange={(e) => setEditForm({ ...editForm, adminNotes: e.target.value })} dir="rtl" /></div>
            <div className={cn("flex gap-2 justify-end", isRTL && "flex-row-reverse")}>
              <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(false)}>{isRTL ? "انصراف" : "Cancel"}</Button>
              <Button size="sm" disabled={saving} onClick={handleEdit}>{saving && <Loader2 className="w-3.5 h-3.5 me-1 animate-spin" />}{isRTL ? "بروزرسانی" : "Update"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRTL ? "حذف بازخورد" : "Delete Testimonial"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL ? `آیا از حذف بازخورد «${deletingTestimonial?.name}» مطمئن هستید؟ این عمل قابل بازگشت نیست.` : `Are you sure you want to delete the testimonial from "${deletingTestimonial?.name}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRTL ? "انصراف" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">{isRTL ? "حذف" : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================
// MESSAGES TAB
// ============================================
interface ContactMessageEntry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  isRead: boolean;
  priority: string;
  createdAt: string;
}

function MessagesTab({ isRTL }: { isRTL: boolean }) {
  const [activeSection, setActiveSection] = useState<"overview" | "contact" | "internal" | "pending" | "requests">("overview");

  // Fetch counts for overview badges
  const [counts, setCounts] = useState({ contact: 0, contactUnread: 0, internal: 0, internalUnread: 0, pending: 0, requests: 0 });
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [contactRes, internalRes, pendingRes, reqRes] = await Promise.all([
          authFetch("/api/admin/messages?limit=1"),
          authFetch("/api/admin/admin-messages?filter=received&limit=1"),
          authFetch("/api/registration/pending?status=pending&limit=1"),
          authFetch("/api/admin/schedule-requests?status=pending&limit=1"),
        ]);
        const c = contactRes.ok ? await contactRes.json() : null;
        const i = internalRes.ok ? await internalRes.json() : null;
        const p = pendingRes.ok ? await pendingRes.json() : null;
        const r = reqRes.ok ? await reqRes.json() : null;
        setCounts({
          contact: c?.total || 0,
          contactUnread: c?.unreadCount || 0,
          internal: i?.total || 0,
          internalUnread: i?.messages?.filter((m: any) => m.status === "sent" || m.status === "delivered").length || 0,
          pending: p?.summary?.pending || 0,
          requests: r?.pendingCount || 0,
        });
      } catch { /* ignore */ }
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const sectionBtn = (key: typeof activeSection, icon: React.ElementType, labelFa: string, labelEn: string, count: number, color: string) => {
    const Icon = icon;
    const isActive = activeSection === key;
    return (
      <button
        onClick={() => setActiveSection(key)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all border",
          isRTL && "flex-row-reverse",
          isActive ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-background border-border/40 hover:border-primary/30 hover:bg-muted/50 text-muted-foreground"
        )}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span>{isRTL ? labelFa : labelEn}</span>
        {count > 0 && (
          <span className={cn(
            "text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0",
            isActive ? "bg-primary-foreground/20" : color
          )}>
            {count}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Unified Section Selector — flat, single row */}
      <div className={cn("flex flex-wrap gap-2", isRTL && "flex-row-reverse")}>
        {sectionBtn("overview", LayoutDashboard, "نمای کلی", "Overview", 0, "")}
        {sectionBtn("pending", UserPlus, "ثبت‌نام‌های در انتظار", "Pending Registrations", counts.pending, "bg-amber-500/15 text-amber-600")}
        {sectionBtn("requests", CalendarClock, "درخواست تغییر کلاس", "Schedule Requests", counts.requests, "bg-sky-500/15 text-sky-600")}
        {sectionBtn("contact", Mail, "پیام‌های تماس", "Contact Messages", counts.contactUnread, "bg-primary/15 text-primary")}
        {sectionBtn("internal", MessageSquare, "پیام‌های داخلی", "Internal Messages", counts.internalUnread, "bg-emerald-500/15 text-emerald-600")}
      </div>

      {/* Content — only one section visible at a time, no nesting */}
      {activeSection === "overview" && (
        <MessagesOverview isRTL={isRTL} counts={counts} onNavigate={setActiveSection} />
      )}
      {activeSection === "pending" && <PendingRegistrationsTab isRTL={isRTL} />}
      {activeSection === "requests" && <ScheduleRequestsTab isRTL={isRTL} />}
      {activeSection === "contact" && <ContactMessagesSubTab isRTL={isRTL} />}
      {activeSection === "internal" && <InternalMessagesSubTab isRTL={isRTL} />}
    </div>
  );
}

// Clean overview dashboard — shows summary of all 4 message types
function MessagesOverview({ isRTL, counts, onNavigate }: { isRTL: boolean; counts: Record<string, number>; onNavigate: (s: "overview" | "contact" | "internal" | "pending" | "requests") => void }) {
  const cards = [
    { key: "pending" as const, icon: UserPlus, labelFa: "ثبت‌نام‌های در انتظار", labelEn: "Pending Registrations", count: counts.pending, color: "amber", descFa: "هنرجویانی که فرم ثبت‌نام را پر کرده‌اند", descEn: "Students who submitted the registration form" },
    { key: "requests" as const, icon: CalendarClock, labelFa: "درخواست تغییر کلاس", labelEn: "Schedule Requests", count: counts.requests, color: "sky", descFa: "درخواست‌های اساتید برای تغییر برنامه", descEn: "Instructor schedule change requests" },
    { key: "contact" as const, icon: Mail, labelFa: "پیام‌های تماس", labelEn: "Contact Messages", count: counts.contactUnread, total: counts.contact, color: "primary", descFa: "پیام‌های دریافتی از فرم تماس سایت", descEn: "Messages from the website contact form" },
    { key: "internal" as const, icon: MessageSquare, labelFa: "پیام‌های داخلی", labelEn: "Internal Messages", count: counts.internalUnread, total: counts.internal, color: "emerald", descFa: "پیام‌های بین ادمین‌ها و سوپر ادمین", descEn: "Messages between admins" },
  ];

  const colorMap: Record<string, { bg: string; text: string; border: string; badge: string }> = {
    amber: { bg: "bg-amber-500/5", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20", badge: "bg-amber-500/15" },
    sky: { bg: "bg-sky-500/5", text: "text-sky-600 dark:text-sky-400", border: "border-sky-500/20", badge: "bg-sky-500/15" },
    primary: { bg: "bg-primary/5", text: "text-primary", border: "border-primary/20", badge: "bg-primary/15" },
    emerald: { bg: "bg-emerald-500/5", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20", badge: "bg-emerald-500/15" },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const c = colorMap[card.color];
        return (
          <button
            key={card.key}
            onClick={() => onNavigate(card.key)}
            className={cn(
              "text-start p-4 rounded-2xl border transition-all hover:shadow-md hover:-translate-y-0.5",
              c.bg, c.border
            )}
          >
            <div className={cn("flex items-center gap-3 mb-2", isRTL && "flex-row-reverse")}>
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", c.badge)}>
                <Icon className={cn("w-5 h-5", c.text)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">{isRTL ? card.labelFa : card.labelEn}</p>
                <p className="text-[10px] text-muted-foreground line-clamp-1">{isRTL ? card.descFa : card.descEn}</p>
              </div>
            </div>
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse justify-end")}>
              {card.count > 0 && (
                <span className={cn("text-lg font-bold", c.text)}>
                  {card.count}
                  <span className="text-[10px] text-muted-foreground font-normal ms-1">
                    {isRTL ? "جدید" : "new"}
                  </span>
                </span>
              )}
              {"total" in card && card.total !== undefined && (
                <span className="text-[10px] text-muted-foreground">
                  {isRTL ? `از ${card.total} کل` : `of ${card.total} total`}
                </span>
              )}
              {card.count === 0 && !("total" in card) && (
                <span className="text-[10px] text-muted-foreground">
                  {isRTL ? "مورد جدیدی نیست" : "No new items"}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ContactMessagesSubTab({ isRTL }: { isRTL: boolean }) {
  const [messages, setMessages] = useState<ContactMessageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [unreadCount, setUnreadCount] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/admin/messages?filter=${filter}&limit=200`);
      if (res.ok) {
        const d = await res.json();
        setMessages(d.messages || []);
        setUnreadCount(d.unreadCount || 0);
      }
    } catch {
      toast.error(isRTL ? "خطا در بارگذاری پیام‌ها" : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [isRTL, filter]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const toggleRead = async (id: string, isRead: boolean) => {
    try {
      const res = await authFetch("/api/admin/messages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isRead: !isRead }),
      });
      if (res.ok) {
        toast.success(!isRead ? (isRTL ? "خوانده شد" : "Marked as read") : (isRTL ? "خوانده‌نشده شد" : "Marked as unread"));
        fetchMessages();
      }
    } catch {
      toast.error(isRTL ? "خطا" : "Error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await authFetch("/api/admin/messages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast.success(isRTL ? "پیام حذف شد" : "Message deleted");
        setDeletingId(null);
        fetchMessages();
      } else {
        toast.error(isRTL ? "خطا در حذف" : "Delete failed");
      }
    } catch {
      toast.error(isRTL ? "خطا" : "Error");
    }
  };

  return (
    <div className="space-y-3">
      <div className={cn("flex flex-wrap items-center gap-3", isRTL && "flex-row-reverse")}>
        <div className={cn("flex gap-1", isRTL && "flex-row-reverse")}>
          {(["all", "unread", "read"] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
              {f === "all" && <Archive className="w-3.5 h-3.5 me-1" />}
              {f === "unread" && <Mail className="w-3.5 h-3.5 me-1" />}
              {f === "read" && <CheckCircle2 className="w-3.5 h-3.5 me-1" />}
              {f === "all" ? (isRTL ? "همه" : "All") : f === "unread" ? (isRTL ? "خوانده‌نشده" : "Unread") : (isRTL ? "خوانده شده" : "Read")}
            </Button>
          ))}
        </div>
        {unreadCount > 0 && (
          <Badge className="bg-primary/10 text-primary text-[10px] border-0">
            {unreadCount} {isRTL ? "خوانده‌نشده" : "unread"}
          </Badge>
        )}
      </div>

      {loading ? <Spinner /> : (
        <ScrollArea className="max-h-[calc(100vh-380px)]">
          <div className="space-y-2">
            {messages.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">{isRTL ? "پیامی یافت نشد" : "No messages found"}</p>
              </div>
            )}
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: idx * 0.03 }}>
                  <Card className={cn("border-border/30 hover:border-primary/20 transition-all", !msg.isRead && "border-primary/20 bg-primary/5")}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", !msg.isRead ? "bg-primary/10" : "bg-muted")}>
                          {!msg.isRead ? <Mail className="w-4 h-4 text-primary" /> : <MessageSquare className="w-4 h-4 text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={cn("flex items-center gap-2 mb-1 flex-wrap", isRTL && "flex-row-reverse")}>
                            <span className={cn("text-sm truncate", !msg.isRead && "font-bold")}>{msg.subject}</span>
                            {!msg.isRead && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                            <Badge className={cn("text-[9px] px-1.5", getPriorityColor(msg.priority))}>{msg.priority}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{msg.message}</p>
                          <div className={cn("flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground flex-wrap", isRTL && "flex-row-reverse")}>
                            <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" />{msg.name}</span>
                            <span>{msg.email}</span>
                            {msg.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /><a href={`tel:${msg.phone}`} className="text-primary hover:underline">{msg.phone}</a></span>}
                            <span>{formatTimeAgo(msg.createdAt, isRTL)}</span>
                          </div>
                        </div>
                        <div className={cn("flex flex-col gap-1 shrink-0", isRTL && "items-end")}>
                          <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1" onClick={() => toggleRead(msg.id, msg.isRead)}>
                            {msg.isRead ? <><Mail className="w-3 h-3" />{isRTL ? "خوانده‌نشده" : "Unread"}</> : <><CheckCircle2 className="w-3 h-3" />{isRTL ? "خوانده شد" : "Read"}</>}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 text-red-500 hover:text-red-600" onClick={() => setDeletingId(msg.id)}>
                            <Trash2 className="w-3 h-3" />{isRTL ? "حذف" : "Delete"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRTL ? "حذف پیام" : "Delete Message"}</AlertDialogTitle>
            <AlertDialogDescription>{isRTL ? "آیا از حذف این پیام مطمئن هستید؟" : "Are you sure you want to delete this message?"}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRTL ? "انصراف" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && handleDelete(deletingId)} className="bg-red-600 hover:bg-red-700">{isRTL ? "حذف" : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InternalMessagesSubTab({ isRTL }: { isRTL: boolean }) {
  const [messages, setMessages] = useState<AdminMessageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"received" | "sent" | "all">("received");
  const [showCompose, setShowCompose] = useState(false);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/admin/admin-messages?filter=${filter}&limit=100`);
      if (res.ok) { const d = await res.json(); setMessages(d.messages); }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
    finally { setLoading(false); }
  }, [isRTL, filter]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const markRead = async (id: string) => {
    try {
      const res = await authFetch("/api/admin/admin-messages", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "read" }) });
      if (res.ok) fetchMessages();
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-4">
      <div className={cn("flex flex-wrap items-center gap-3", isRTL && "flex-row-reverse")}>
        <div className={cn("flex gap-1", isRTL && "flex-row-reverse")}>
          {(["received", "sent", "all"] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
              {f === "received" && <Inbox className="w-3.5 h-3.5 me-1" />}
              {f === "sent" && <Send className="w-3.5 h-3.5 me-1" />}
              {f === "all" && <Archive className="w-3.5 h-3.5 me-1" />}
              {f === "received" ? (isRTL ? "دریافتی" : "Inbox") : f === "sent" ? (isRTL ? "ارسالی" : "Sent") : (isRTL ? "همه" : "All")}
            </Button>
          ))}
        </div>
        <Button size="sm" onClick={() => setShowCompose(true)} className="ms-auto"><Plus className="w-3.5 h-3.5 me-1" />{isRTL ? "پیام جدید" : "Compose"}</Button>
      </div>

      {loading ? <Spinner /> : (
        <ScrollArea className="max-h-[calc(100vh-340px)]">
          <div className="space-y-2">
            {messages.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">{isRTL ? "پیامی نیست" : "No messages"}</p>}
            {messages.map((msg) => (
              <Card key={msg.id} className={cn("border-border/30 cursor-pointer hover:bg-muted/50 transition-colors", (msg.status === "sent" || msg.status === "delivered") && filter === "received" && "bg-primary/5")} onClick={() => { if ((msg.status === "sent" || msg.status === "delivered") && filter === "received") markRead(msg.id); }}>
                <CardContent className="p-3">
                  <div className={cn("flex items-start gap-3", isRTL && "flex-row-reverse")}>
                    <div className="flex-1 min-w-0">
                      <div className={cn("flex items-center gap-2 mb-1", isRTL && "flex-row-reverse")}>
                        <span className="text-sm font-medium truncate">{msg.subject}</span>
                        <Badge className={cn("text-[9px] px-1.5", getPriorityColor(msg.priority))}>{msg.priority}</Badge>
                        {(msg.status === "sent" || msg.status === "delivered") && filter === "received" && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{msg.content}</p>
                      <div className={cn("flex items-center gap-3 mt-1 text-[10px] text-muted-foreground", isRTL && "flex-row-reverse")}>
                        <span>{filter === "sent" ? `${isRTL ? "به" : "To"}: ${msg.recipient.name}` : `${isRTL ? "از" : "From"}: ${msg.sender.name}`}</span>
                        <span>{formatTimeAgo(msg.createdAt, isRTL)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      <Dialog open={showCompose} onOpenChange={setShowCompose}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{isRTL ? "پیام جدید" : "Compose Message"}</DialogTitle><DialogDescription className="sr-only">فرم ارسال پیام جدید</DialogDescription></DialogHeader>
          <ComposeForm isRTL={isRTL} onClose={() => { setShowCompose(false); fetchMessages(); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ComposeForm({ isRTL, onClose }: { isRTL: boolean; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [admins, setAdmins] = useState<Array<{ id: string; name: string }>>([]);
  const [form, setForm] = useState({ recipientId: "", subject: "", content: "", priority: "normal" });

  useEffect(() => {
    authFetch("/api/admin/admins").then((r) => r.json()).then((d) => setAdmins(d.admins || [])).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authFetch("/api/admin/admin-messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { toast.success(isRTL ? "ارسال شد" : "Sent"); onClose(); }
      else toast.error(isRTL ? "خطا" : "Error");
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div><Label className="text-xs">{isRTL ? "گیرنده" : "Recipient"} *</Label>
        <Select value={form.recipientId} onValueChange={(v) => setForm({ ...form, recipientId: v })}>
          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder={isRTL ? "انتخاب کنید" : "Select..."} /></SelectTrigger>
          <SelectContent>{admins.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label className="text-xs">{isRTL ? "موضوع" : "Subject"}</Label><Input className="h-8 text-sm" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
      <div><Label className="text-xs">{isRTL ? "متن" : "Content"} *</Label><Textarea className="text-sm" rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
      <div><Label className="text-xs">{isRTL ? "اولویت" : "Priority"}</Label>
        <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="low">{isRTL ? "کم" : "Low"}</SelectItem><SelectItem value="normal">{isRTL ? "عادی" : "Normal"}</SelectItem><SelectItem value="high">{isRTL ? "زیاد" : "High"}</SelectItem><SelectItem value="urgent">{isRTL ? "فوری" : "Urgent"}</SelectItem></SelectContent>
        </Select>
      </div>
      <div className={cn("flex gap-2 justify-end", isRTL && "flex-row-reverse")}><Button type="button" variant="outline" size="sm" onClick={onClose}>{isRTL ? "انصراف" : "Cancel"}</Button><Button type="submit" size="sm" disabled={saving}>{saving && <Loader2 className="w-3.5 h-3.5 me-1 animate-spin" />}{isRTL ? "ارسال" : "Send"}</Button></div>
    </form>
  );
}

// ============================================
// SECURITY TAB
// ============================================
function SecurityTab({ isRTL }: { isRTL: boolean }) {
  const [subTab, setSubTab] = useState<"devices" | "intrusion" | "sessions">("devices");
  return (
    <div className="space-y-4">
      <div className={cn("flex gap-2", isRTL && "flex-row-reverse")}>
        {(["devices", "intrusion", "sessions"] as const).map((t) => (
          <Button key={t} size="sm" variant={subTab === t ? "default" : "outline"} onClick={() => setSubTab(t)}>
            {t === "devices" && <Smartphone className="w-3.5 h-3.5 me-1" />}
            {t === "intrusion" && <AlertTriangle className="w-3.5 h-3.5 me-1" />}
            {t === "sessions" && <Monitor className="w-3.5 h-3.5 me-1" />}
            {t === "devices" ? (isRTL ? "دستگاه‌ها" : "Devices") : t === "intrusion" ? (isRTL ? "هشدارها" : "Alerts") : (isRTL ? "نشست‌ها" : "Sessions")}
          </Button>
        ))}
      </div>
      {subTab === "devices" && <DevicesSection isRTL={isRTL} />}
      {subTab === "intrusion" && <IntrusionSection isRTL={isRTL} />}
      {subTab === "sessions" && <SessionsSection isRTL={isRTL} />}
    </div>
  );
}

function DevicesSection({ isRTL }: { isRTL: boolean }) {
  const [devices, setDevices] = useState<DeviceEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/admin/devices");
      if (res.ok) { const d = await res.json(); setDevices(d.devices); }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
    finally { setLoading(false); }
  }, [isRTL]);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  const approve = async (id: string, isApproved: boolean) => {
    try {
      const res = await authFetch("/api/admin/devices", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isApproved }) });
      if (res.ok) { toast.success(isRTL ? "بروزرسانی شد" : "Updated"); fetchDevices(); }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
  };

  const remove = async (id: string) => {
    if (!confirm(isRTL ? "حذف شود؟" : "Delete?")) return;
    try {
      const res = await authFetch("/api/admin/devices", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (res.ok) { toast.success(isRTL ? "حذف شد" : "Deleted"); fetchDevices(); }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
  };

  if (loading) return <Spinner />;

  return (
    <ScrollArea className="max-h-[calc(100vh-380px)]">
      <Table>
        <TableHeader><TableRow>
          <TableHead className="text-xs">{isRTL ? "دستگاه" : "Device"}</TableHead>
          <TableHead className="text-xs">{isRTL ? "مدیر" : "Admin"}</TableHead>
          <TableHead className="text-xs">{isRTL ? "مرورگر/OS" : "Browser/OS"}</TableHead>
          <TableHead className="text-xs">{isRTL ? "IP" : "IP"}</TableHead>
          <TableHead className="text-xs">{isRTL ? "وضعیت" : "Status"}</TableHead>
          <TableHead className="text-xs">{isRTL ? "عملیات" : "Actions"}</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {devices.map((d) => {
            const Icon = getDeviceIcon(d.deviceType);
            return (
              <TableRow key={d.id}>
                <TableCell className="text-xs"><div className="flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" /><span className="font-medium">{d.deviceName}</span></div></TableCell>
                <TableCell className="text-xs">{d.admin.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{d.browser || "—"} / {d.os || "—"}</TableCell>
                <TableCell className="text-xs font-mono">{d.ipAddress || "—"}</TableCell>
                <TableCell className="text-xs">{d.isApproved ? <Badge className="bg-emerald-500/10 text-emerald-600 text-[10px]">{isRTL ? "تأیید" : "Approved"}</Badge> : <Badge className="bg-amber-500/10 text-amber-600 text-[10px]">{isRTL ? "در انتظار" : "Pending"}</Badge>}</TableCell>
                <TableCell className="text-xs">
                  <div className="flex gap-1">
                    {!d.isApproved && <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => approve(d.id, true)}><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /></Button>}
                    <Button size="sm" variant="ghost" className="h-6 px-1.5 text-red-500" onClick={() => remove(d.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}

function IntrusionSection({ isRTL }: { isRTL: boolean }) {
  const [alerts, setAlerts] = useState<IntrusionAlertEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/admin/intrusion-alerts?resolved=false&limit=100");
      if (res.ok) { const d = await res.json(); setAlerts(d.alerts); }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
    finally { setLoading(false); }
  }, [isRTL]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const resolve = async (id: string) => {
    try {
      const res = await authFetch("/api/admin/intrusion-alerts", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isResolved: true }) });
      if (res.ok) { toast.success(isRTL ? "رفع شد" : "Resolved"); fetchAlerts(); }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-3">
      <div className={cn("flex justify-end", isRTL && "flex-row-reverse")}><Button size="sm" variant="outline" onClick={fetchAlerts}><RefreshCw className="w-3.5 h-3.5 me-1" />{isRTL ? "بروزرسانی" : "Refresh"}</Button></div>
      <ScrollArea className="max-h-[calc(100vh-420px)]">
        <div className="space-y-2">
          {alerts.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">{isRTL ? "هشداری نیست" : "No alerts"}</p>}
          {alerts.map((a) => (
            <Card key={a.id} className="border-border/30">
              <CardContent className="p-3">
                <div className={cn("flex items-start gap-3", isRTL && "flex-row-reverse")}>
                  <AlertTriangle className={cn("w-5 h-5 shrink-0 mt-0.5", a.attemptType === "brute_force" ? "text-red-500" : "text-amber-500")} />
                  <div className="flex-1 min-w-0">
                    <div className={cn("flex items-center gap-2 mb-1", isRTL && "flex-row-reverse")}>
                      <Badge className={cn("text-[10px]", getSeverityColor(a.attemptType.includes("brute") ? "critical" : "warning"))}>{a.attemptType}</Badge>
                      <span className="text-xs font-mono text-muted-foreground">{a.ipAddress}</span>
                      {a.attemptCount > 1 && <Badge variant="outline" className="text-[10px]">×{a.attemptCount}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{a.details || (isRTL ? "بدون جزئیات" : "No details")}</p>
                    <div className={cn("flex items-center gap-3 mt-1 text-[10px] text-muted-foreground", isRTL && "flex-row-reverse")}>
                      <span>{a.targetAdmin?.name || "—"}</span>
                      <span>{formatTimeAgo(a.createdAt, isRTL)}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="h-6 text-[10px] shrink-0" onClick={() => resolve(a.id)}>{isRTL ? "رفع" : "Resolve"}</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function SessionsSection({ isRTL }: { isRTL: boolean }) {
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/admin/sessions?active=true&limit=100");
      if (res.ok) { const d = await res.json(); setSessions(d.sessions); }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
    finally { setLoading(false); }
  }, [isRTL]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  if (loading) return <Spinner />;

  return (
    <ScrollArea className="max-h-[calc(100vh-380px)]">
      <Table>
        <TableHeader><TableRow>
          <TableHead className="text-xs">{isRTL ? "کاربر" : "User"}</TableHead>
          <TableHead className="text-xs">{isRTL ? "نوع" : "Type"}</TableHead>
          <TableHead className="text-xs">{isRTL ? "دستگاه/مرورگر" : "Device/Browser"}</TableHead>
          <TableHead className="text-xs">IP</TableHead>
          <TableHead className="text-xs">{isRTL ? "زمان ورود" : "Login At"}</TableHead>
          <TableHead className="text-xs">{isRTL ? "وضعیت" : "Status"}</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {sessions.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="text-xs">{s.admin?.name || s.student?.name || "—"}</TableCell>
              <TableCell className="text-xs"><Badge variant="outline" className="text-[10px]">{s.userType}</Badge></TableCell>
              <TableCell className="text-xs text-muted-foreground">{s.deviceType || "—"}/{s.browser || "—"}</TableCell>
              <TableCell className="text-xs font-mono">{s.ipAddress}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{formatDateTime(s.loginAt, isRTL)}</TableCell>
              <TableCell className="text-xs">{s.isActive ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 inline" /> : <XCircle className="w-3.5 h-3.5 text-red-400 inline" />}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}

// ============================================
// BACKUPS TAB
// ============================================
function BackupsTab({ isRTL }: { isRTL: boolean }) {
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/admin/backups");
      if (res.ok) { const d = await res.json(); setBackups(d.backups); }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
    finally { setLoading(false); }
  }, [isRTL]);

  useEffect(() => { fetchBackups(); }, [fetchBackups]);

  const createBackup = async () => {
    setCreating(true);
    try {
      const res = await authFetch("/api/admin/backups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes: isRTL ? "بکاپ دستی" : "Manual backup" }) });
      if (res.ok) { toast.success(isRTL ? "بکاپ ایجاد شد" : "Backup created"); fetchBackups(); }
      else toast.error(isRTL ? "خطا در ایجاد بکاپ" : "Backup failed");
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
    finally { setCreating(false); }
  };

  return (
    <div className="space-y-4">
      <div className={cn("flex justify-between items-center", isRTL && "flex-row-reverse")}>
        <Button size="sm" onClick={createBackup} disabled={creating}>{creating ? <Loader2 className="w-3.5 h-3.5 me-1 animate-spin" /> : <Database className="w-3.5 h-3.5 me-1" />}{isRTL ? "بکاپ جدید" : "Create Backup"}</Button>
        <Button size="sm" variant="outline" onClick={fetchBackups}><RefreshCw className="w-3.5 h-3.5" /></Button>
      </div>

      {loading ? <Spinner /> : (
        <ScrollArea className="max-h-[calc(100vh-340px)]">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">{isRTL ? "نوع" : "Type"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "وضعیت" : "Status"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "حجم" : "Size"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "چک‌سام" : "Checksum"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "اجرا توسط" : "By"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "تاریخ" : "Date"}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {backups.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="text-xs"><Badge variant="outline" className="text-[10px]">{b.backupType}</Badge></TableCell>
                  <TableCell className="text-xs">
                    {b.status === "completed" && <Badge className="bg-emerald-500/10 text-emerald-600 text-[10px]">{isRTL ? "کامل" : "Completed"}</Badge>}
                    {b.status === "in_progress" && <Badge className="bg-amber-500/10 text-amber-600 text-[10px]">{isRTL ? "در حال انجام" : "In Progress"}</Badge>}
                    {b.status === "failed" && <Badge className="bg-red-500/10 text-red-600 text-[10px]">{isRTL ? "ناموفق" : "Failed"}</Badge>}
                  </TableCell>
                  <TableCell className="text-xs">{formatBytes(b.fileSize)}</TableCell>
                  <TableCell className="text-xs font-mono text-[10px] max-w-[120px] truncate">{b.checksum || "—"}</TableCell>
                  <TableCell className="text-xs">{b.admin?.name || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(b.createdAt, isRTL)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      )}
    </div>
  );
}

// ============================================
// ANALYTICS TAB
// ============================================
function AnalyticsTab({ isRTL }: { isRTL: boolean }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/admin/analytics");
      if (res.ok) setData(await res.json());
      else toast.error(isRTL ? "خطا" : "Error");
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
    finally { setLoading(false); }
  }, [isRTL]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <Spinner />;
  if (!data) return null;

  const regDays = Object.entries(data.registrations.byDay).sort((a, b) => a[0].localeCompare(b[0]));
  const maxReg = Math.max(...regDays.map(([, v]) => v), 1);
  const loginDays = Object.entries(data.logins.byDay).sort((a, b) => a[0].localeCompare(b[0]));
  const maxLogin = Math.max(...loginDays.map(([, v]) => v.admin + v.student), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { labelFa: "ثبت‌نام ۳۰ روزه", labelEn: "30d Registrations", value: data.registrations.total, icon: UserPlus, color: "text-primary" },
          { labelFa: "ورود ۷ روزه", labelEn: "7d Logins", value: data.logins.total7d, icon: LogOut, color: "text-emerald-600" },
          { labelFa: "IP منحصر ۲۴ ساعته", labelEn: "Unique IPs 24h", value: data.logins.uniqueIPs24h, icon: Globe, color: "text-amber-600" },
          { labelFa: "ثبت‌نام دوره ۳۰ روزه", labelEn: "30d Enrollments", value: data.enrollments.total30d, icon: GraduationCap, color: "text-purple-600" },
        ].map((s, i) => (
          <Card key={i} className="border-border/30">
            <CardContent className="p-3">
              <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <s.icon className={cn("w-4 h-4", s.color)} />
                <div><p className="text-lg font-bold">{s.value}</p><p className="text-[10px] text-muted-foreground">{isRTL ? s.labelFa : s.labelEn}</p></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Registration bar chart */}
      <Card className="border-border/30">
        <CardHeader className="pb-2"><CardTitle className={cn("text-sm font-semibold flex items-center gap-2", isRTL && "flex-row-reverse")}><TrendingUp className="w-4 h-4 text-primary" />{isRTL ? "روند ثبت‌نام (۳۰ روز)" : "Registration Trends (30d)"}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-0.5 h-28">
            {regDays.slice(-30).map(([day, count]) => (
              <div key={day} className="flex-1 flex flex-col items-center justify-end h-full" title={`${day}: ${count}`}>
                <div className="w-full bg-primary/40 rounded-t" style={{ height: `${(count / maxReg) * 100}%`, minHeight: count > 0 ? 2 : 0 }} />
              </div>
            ))}
          </div>
          {regDays.length > 0 && (
            <div className={cn("flex justify-between text-[9px] text-muted-foreground mt-1", isRTL && "flex-row-reverse")}>
              <span>{formatDate(regDays[0][0], isRTL)}</span>
              <span>{formatDate(regDays[regDays.length - 1][0], isRTL)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Login activity */}
      <Card className="border-border/30">
        <CardHeader className="pb-2"><CardTitle className={cn("text-sm font-semibold flex items-center gap-2", isRTL && "flex-row-reverse")}><Activity className="w-4 h-4 text-primary" />{isRTL ? "فعالیت ورود (۷ روز)" : "Login Activity (7d)"}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-20">
            {loginDays.map(([day, v]) => (
              <div key={day} className="flex-1 flex flex-col items-center justify-end h-full gap-px" title={`${day}: admin=${v.admin}, student=${v.student}`}>
                <div className="w-full bg-primary/50 rounded-t" style={{ height: `${(v.admin / maxLogin) * 100}%`, minHeight: v.admin > 0 ? 2 : 0 }} />
                <div className="w-full bg-emerald-500/50 rounded-t" style={{ height: `${(v.student / maxLogin) * 100}%`, minHeight: v.student > 0 ? 2 : 0 }} />
              </div>
            ))}
          </div>
          <div className={cn("flex items-center gap-4 mt-1.5 text-[10px]", isRTL && "flex-row-reverse")}>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-primary/50" />{isRTL ? "مدیر" : "Admin"}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500/50" />{isRTL ? "هنرجو" : "Student"}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Distribution */}
        <Card className="border-border/30">
          <CardHeader className="pb-2"><CardTitle className={cn("text-sm font-semibold flex items-center gap-2", isRTL && "flex-row-reverse")}><MonitorSmartphone className="w-4 h-4 text-primary" />{isRTL ? "توزیع دستگاه‌ها" : "Devices"}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(data.devices.types).map(([device, count]) => {
              const total = Object.values(data.devices.types).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              const Icon = getDeviceIcon(device);
              return (
                <div key={device} className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                  <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs w-16">{device || "unknown"}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary/50 rounded-full" style={{ width: `${pct}%` }} /></div>
                  <span className="text-[10px] text-muted-foreground w-14 text-end">{count} ({pct}%)</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Browser Distribution */}
        <Card className="border-border/30">
          <CardHeader className="pb-2"><CardTitle className={cn("text-sm font-semibold flex items-center gap-2", isRTL && "flex-row-reverse")}><Globe className="w-4 h-4 text-primary" />{isRTL ? "مرورگرها" : "Browsers"}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(data.devices.browsers).map(([browser, count]) => {
              const total = Object.values(data.devices.browsers).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={browser} className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                  <span className="text-xs w-20 truncate">{browser || "unknown"}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-emerald-500/50 rounded-full" style={{ width: `${pct}%` }} /></div>
                  <span className="text-[10px] text-muted-foreground w-14 text-end">{count} ({pct}%)</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Content Performance */}
      <Card className="border-border/30">
        <CardHeader className="pb-2"><CardTitle className={cn("text-sm font-semibold flex items-center gap-2", isRTL && "flex-row-reverse")}><Eye className="w-4 h-4 text-primary" />{isRTL ? "محبوب‌ترین مقالات" : "Top Blog Posts"}<Badge variant="outline" className="text-[10px] ms-auto">{data.content.totalBlogViews} {isRTL ? "بازدید" : "views"}</Badge></CardTitle></CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-48">
            <Table>
              <TableHeader><TableRow><TableHead className="text-xs">{isRTL ? "عنوان" : "Title"}</TableHead><TableHead className="text-xs text-end">{isRTL ? "بازدید" : "Views"}</TableHead></TableRow></TableHeader>
              <TableBody>
                {data.content.topPosts.map((p) => (
                  <TableRow key={p.id}><TableCell className="text-xs">{isRTL ? p.titleFa : p.titleEn}{p.isFeatured && <Star className="w-3 h-3 inline text-amber-500 ms-1" />}</TableCell><TableCell className="text-xs text-end">{p.viewCount}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// AUDIT LOGS TAB
// ============================================
function AuditLogsTab({ isRTL }: { isRTL: boolean }) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState("all");
  const [entity, setEntity] = useState("all");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (severity !== "all") params.set("severity", severity);
      if (entity !== "all") params.set("entity", entity);
      const res = await authFetch(`/api/admin/audit-logs?${params}`);
      if (res.ok) { const d = await res.json(); setLogs(d.logs); setTotal(d.total); }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
    finally { setLoading(false); }
  }, [isRTL, severity, entity]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="space-y-4">
      <div className={cn("flex flex-wrap items-center gap-3", isRTL && "flex-row-reverse")}>
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger className="w-28 h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">{isRTL ? "همه سطح‌ها" : "All Levels"}</SelectItem><SelectItem value="info">Info</SelectItem><SelectItem value="warning">Warning</SelectItem><SelectItem value="critical">Critical</SelectItem></SelectContent>
        </Select>
        <Select value={entity} onValueChange={setEntity}>
          <SelectTrigger className="w-28 h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">{isRTL ? "همه موجودیت‌ها" : "All Entities"}</SelectItem><SelectItem value="user">{isRTL ? "کاربر" : "User"}</SelectItem><SelectItem value="admin">{isRTL ? "مدیر" : "Admin"}</SelectItem><SelectItem value="workshop">{isRTL ? "کارگاه" : "Workshop"}</SelectItem><SelectItem value="system">{isRTL ? "سیستم" : "System"}</SelectItem></SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{total} {isRTL ? "رکورد" : "records"}</span>
        <Button size="sm" variant="outline" onClick={fetchLogs} className="ms-auto h-8"><RefreshCw className="w-3.5 h-3.5" /></Button>
      </div>

      {loading ? <Spinner /> : (
        <ScrollArea className="max-h-[calc(100vh-340px)]">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">{isRTL ? "سطح" : "Level"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "عملیات" : "Action"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "موجودیت" : "Entity"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "مدیر" : "Admin"}</TableHead>
              <TableHead className="text-xs">IP</TableHead>
              <TableHead className="text-xs">{isRTL ? "تاریخ" : "Date"}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs"><Badge className={cn("text-[9px]", getSeverityColor(l.severity))}>{l.severity}</Badge></TableCell>
                  <TableCell className="text-xs">{l.action}</TableCell>
                  <TableCell className="text-xs">{l.entity}{l.entityName && <span className="text-muted-foreground ms-1">({l.entityName})</span>}</TableCell>
                  <TableCell className="text-xs">{l.admin?.name || "—"}</TableCell>
                  <TableCell className="text-xs font-mono">{l.ipAddress || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatTimeAgo(l.createdAt, isRTL)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      )}
    </div>
  );
}

// ============================================
// SETTINGS TAB
// ============================================
function SettingsTab({ isRTL }: { isRTL: boolean }) {
  const [settings, setSettings] = useState<SiteSettingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/admin/settings");
      if (res.ok) { const d = await res.json(); setSettings(d.settings); }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
    finally { setLoading(false); }
  }, [isRTL]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const updateSetting = async (id: string, value: string) => {
    try {
      const res = await authFetch(`/api/admin/settings/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value }) });
      if (res.ok) { toast.success(isRTL ? "ذخیره شد" : "Saved"); fetchSettings(); }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
  };

  const addSetting = async () => {
    if (!newKey || !newValue) return;
    try {
      const res = await authFetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: newKey, value: newValue }) });
      if (res.ok) { toast.success(isRTL ? "اضافه شد" : "Added"); setShowAdd(false); setNewKey(""); setNewValue(""); fetchSettings(); }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
  };

  const deleteSetting = async (id: string) => {
    if (!confirm(isRTL ? "حذف شود؟" : "Delete?")) return;
    try {
      const res = await authFetch(`/api/admin/settings/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success(isRTL ? "حذف شد" : "Deleted"); fetchSettings(); }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
  };

  return (
    <div className="space-y-4">
      <div className={cn("flex justify-between items-center", isRTL && "flex-row-reverse")}>
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="w-3.5 h-3.5 me-1" />{isRTL ? "تنظیم جدید" : "Add Setting"}</Button>
        <Button size="sm" variant="outline" onClick={fetchSettings}><RefreshCw className="w-3.5 h-3.5" /></Button>
      </div>

      {showAdd && (
        <Card className="border-border/30">
          <CardContent className="p-3">
            <div className={cn("flex gap-2 items-end", isRTL && "flex-row-reverse")}>
              <div className="flex-1"><Label className="text-xs">Key</Label><Input className="h-8 text-sm" value={newKey} onChange={(e) => setNewKey(e.target.value)} /></div>
              <div className="flex-1"><Label className="text-xs">Value</Label><Input className="h-8 text-sm" value={newValue} onChange={(e) => setNewValue(e.target.value)} /></div>
              <Button size="sm" className="h-8" onClick={addSetting}><Save className="w-3.5 h-3.5" /></Button>
              <Button size="sm" variant="outline" className="h-8" onClick={() => setShowAdd(false)}><X className="w-3.5 h-3.5" /></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? <Spinner /> : (
        <ScrollArea className="max-h-[calc(100vh-340px)]">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">Key</TableHead>
              <TableHead className="text-xs">Value</TableHead>
              <TableHead className="text-xs">{isRTL ? "عملیات" : "Actions"}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {settings.map((s) => (
                <SettingRow key={s.id} setting={s} isRTL={isRTL} onUpdate={updateSetting} onDelete={deleteSetting} />
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      )}
    </div>
  );
}

function SettingRow({ setting, isRTL, onUpdate, onDelete }: { setting: SiteSettingEntry; isRTL: boolean; onUpdate: (id: string, value: string) => void; onDelete: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(setting.value);

  return (
    <TableRow>
      <TableCell className="text-xs font-mono font-medium">{setting.key}</TableCell>
      <TableCell className="text-xs">
        {editing ? (
          <div className={cn("flex gap-1 items-center", isRTL && "flex-row-reverse")}>
            <Input className="h-7 text-xs" value={value} onChange={(e) => setValue(e.target.value)} />
            <Button size="sm" className="h-7 px-2" onClick={() => { onUpdate(setting.id, value); setEditing(false); }}><CheckCircle2 className="w-3 h-3" /></Button>
            <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => { setEditing(false); setValue(setting.value); }}><X className="w-3 h-3" /></Button>
          </div>
        ) : (
          <span className="text-muted-foreground max-w-[300px] truncate block">{setting.value}</span>
        )}
      </TableCell>
      <TableCell className="text-xs">
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => setEditing(true)}><Edit3 className="w-3.5 h-3.5" /></Button>
          <Button size="sm" variant="ghost" className="h-6 px-1.5 text-red-500" onClick={() => onDelete(setting.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ============================================
// CRITICAL ACTION WARNING DIALOG
// ============================================
interface CriticalActionWarningProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  isRTL: boolean;
}

function CriticalActionWarningDialog({ open, onClose, onConfirm, title, description, confirmLabel, isRTL }: CriticalActionWarningProps) {
  const [confirmText, setConfirmText] = useState("");
  const isConfirmed = confirmText === "تایید";

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) { setConfirmText(""); onClose(); } }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 pt-2">
            <span className="block">{description}</span>
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">
                {isRTL ? "برای تایید، لطفاً «تایید» را تایپ کنید:" : 'To confirm, please type "تایید":'}
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="تایید"
                className="h-9 text-sm"
                dir="rtl"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmText("")}>{isRTL ? "انصراف" : "Cancel"}</AlertDialogCancel>
          <AlertDialogAction
            disabled={!isConfirmed}
            onClick={() => { setConfirmText(""); onConfirm(); }}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
          >
            {confirmLabel || (isRTL ? "تایید و اجرا" : "Confirm & Execute")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ============================================
// ENROLLMENT VIEW DIALOG
// ============================================
function EnrollmentViewDialog({ enrollment, open, onClose, isRTL }: { enrollment: EnrollmentEntry | null; open: boolean; onClose: () => void; isRTL: boolean }) {
  if (!enrollment) return null;

  const payCfg = PAYMENT_STATUS_CONFIG[enrollment.paymentStatus];
  const methodCfg = REGISTRATION_METHOD_CONFIG[enrollment.registrationMethod];
  const statusCfg = ENROLLMENT_STATUS_CONFIG[enrollment.status];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" />
            {isRTL ? "جزئیات ثبت‌نام" : "Enrollment Details"}
          </DialogTitle>
          <DialogDescription className="sr-only">مشاهده جزئیات ثبت‌نام</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-xs">
          {/* Student & Course Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-0.5">
              <span className="text-muted-foreground">{isRTL ? "نام هنرجو" : "Student Name"}</span>
              <p className="font-medium">{enrollment.student.name}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground">{isRTL ? "ایمیل" : "Email"}</span>
              <p className="font-medium">{enrollment.student.email}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground">{isRTL ? "تلفن" : "Phone"}</span>
              <p className="font-medium">{enrollment.student.phone || "—"}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground">{isRTL ? "ساز" : "Instrument"}</span>
              <p className="font-medium">{enrollment.student.primaryInstrument || enrollment.student.registrationInstrument || "—"}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground">{isRTL ? "دوره" : "Course"}</span>
              <p className="font-medium">{isRTL ? enrollment.course.titleFa : enrollment.course.titleEn}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground">{isRTL ? "شعبه" : "Branch"}</span>
              <p className="font-medium">{enrollment.course.branch ? (isRTL ? enrollment.course.branch.nameFa : enrollment.course.branch.nameEn) : "—"}</p>
            </div>
          </div>

          <Separator />

          {/* Registration & Payment */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-0.5">
              <span className="text-muted-foreground">{isRTL ? "روش ثبت‌نام" : "Registration Method"}</span>
              <div>{methodCfg && <Badge className={cn("text-[10px]", methodCfg.color)}><methodCfg.icon className="w-3 h-3 me-1" />{isRTL ? methodCfg.labelFa : methodCfg.labelEn}</Badge>}</div>
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground">{isRTL ? "وضعیت ثبت‌نام" : "Enrollment Status"}</span>
              <div>{statusCfg && <Badge className={cn("text-[10px]", statusCfg.color)}>{isRTL ? statusCfg.labelFa : statusCfg.labelEn}</Badge>}</div>
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground">{isRTL ? "وضعیت پرداخت" : "Payment Status"}</span>
              <div>{payCfg && <Badge className={cn("text-[10px]", payCfg.color)}><payCfg.icon className="w-3 h-3 me-1" />{isRTL ? payCfg.labelFa : payCfg.labelEn}</Badge>}</div>
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground">{isRTL ? "شهریه" : "Tuition"}</span>
              <p className="font-medium">{formatToman(enrollment.tuitionAmount, isRTL)}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground">{isRTL ? "تاریخ ثبت‌نام" : "Enrolled At"}</span>
              <p className="font-medium">{formatDateTime(enrollment.enrolledAt, isRTL)}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground">{isRTL ? "تاریخ پرداخت" : "Paid At"}</span>
              <p className="font-medium">{enrollment.paidAt ? formatDateTime(enrollment.paidAt, isRTL) : "—"}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground">{isRTL ? "مهلت پرداخت" : "Payment Due"}</span>
              <p className="font-medium">{enrollment.paymentDueDate ? formatDate(enrollment.paymentDueDate, isRTL) : "—"}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground">{isRTL ? "شماره رسید" : "Payment Ref"}</span>
              <p className="font-medium font-mono">{enrollment.paymentRef || "—"}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground">{isRTL ? "پیشرفت" : "Progress"}</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${enrollment.progress}%` }} />
                </div>
                <span className="font-medium">{enrollment.progress}%</span>
              </div>
            </div>
          </div>

          {enrollment.notes && (
            <>
              <Separator />
              <div className="space-y-1">
                <span className="text-muted-foreground">{isRTL ? "یادداشت" : "Notes"}</span>
                <p className="text-xs bg-muted/50 rounded-md p-2">{enrollment.notes}</p>
              </div>
            </>
          )}

          {/* Payments History */}
          {enrollment.payments.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="font-medium mb-2">{isRTL ? `تاریخچه پرداخت (${enrollment.payments.length})` : `Payment History (${enrollment.payments.length})`}</p>
                <ScrollArea className="max-h-40">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[10px]">{isRTL ? "مبلغ" : "Amount"}</TableHead>
                        <TableHead className="text-[10px]">{isRTL ? "روش" : "Method"}</TableHead>
                        <TableHead className="text-[10px]">{isRTL ? "وضعیت" : "Status"}</TableHead>
                        <TableHead className="text-[10px]">{isRTL ? "تاریخ" : "Date"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrollment.payments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="text-[10px] font-medium">{formatToman(p.amount, isRTL)}</TableCell>
                          <TableCell className="text-[10px]">{p.paymentMethod || p.paymentType}</TableCell>
                          <TableCell className="text-[10px]"><Badge variant="outline" className="text-[9px]">{p.status}</Badge></TableCell>
                          <TableCell className="text-[10px] text-muted-foreground">{p.paidAt ? formatDate(p.paidAt, isRTL) : "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// ENROLLMENT EDIT DIALOG
// ============================================
function EnrollmentEditDialog({ enrollment, open, onClose, isRTL, onSaved }: { enrollment: EnrollmentEntry | null; open: boolean; onClose: () => void; isRTL: boolean; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [warning, setWarning] = useState<{ open: boolean; action: () => void; title: string; description: string }>({ open: false, action: () => {}, title: "", description: "" });
  const [prevEnrollmentId, setPrevEnrollmentId] = useState<string | null>(null);
  const [form, setForm] = useState({
    paymentStatus: "",
    tuitionAmount: 0,
    paymentDueDate: "",
    paymentRef: "",
    notes: "",
    status: "",
  });

  // React-recommended pattern: adjust state during render when prop changes
  // See: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (enrollment && enrollment.id !== prevEnrollmentId) {
    setPrevEnrollmentId(enrollment.id);
    setForm({
      paymentStatus: enrollment.paymentStatus,
      tuitionAmount: enrollment.tuitionAmount || 0,
      paymentDueDate: enrollment.paymentDueDate ? enrollment.paymentDueDate.split("T")[0] : "",
      paymentRef: enrollment.paymentRef || "",
      notes: enrollment.notes || "",
      status: enrollment.status,
    });
  }

  if (!enrollment) return null;

  const handleSave = (overrideData?: Record<string, unknown>) => {
    const data = overrideData || {
      paymentStatus: form.paymentStatus,
      tuitionAmount: form.tuitionAmount || undefined,
      paymentDueDate: form.paymentDueDate || undefined,
      paymentRef: form.paymentRef || undefined,
      notes: form.notes || undefined,
      status: form.status,
    };

    // Check for critical changes requiring warning
    const isRefunding = enrollment.paymentStatus === "paid" && data.paymentStatus && data.paymentStatus !== "paid" && !overrideData;
    const isDropping = data.status === "dropped" && enrollment.status !== "dropped" && !overrideData;

    if (isRefunding) {
      setWarning({
        open: true,
        title: isRTL ? "تغییر وضعیت پرداخت از «پرداخت‌شده»" : "Changing Payment from Paid",
        description: isRTL
          ? `شما در حال تغییر وضعیت پرداخت از «پرداخت‌شده» به «${PAYMENT_STATUS_CONFIG[data.paymentStatus as string]?.labelFa || data.paymentStatus}» هستید. این عمل معادل بازگشت وجه است و قابل بازگشت نیست.`
          : `You are changing payment status from "Paid" to "${PAYMENT_STATUS_CONFIG[data.paymentStatus as string]?.labelEn || data.paymentStatus}". This is equivalent to a refund and cannot be undone.`,
        action: () => handleSave({ ...data, _confirmed: true }),
      });
      return;
    }

    if (isDropping) {
      setWarning({
        open: true,
        title: isRTL ? "تغییر وضعیت به «رهاشده»" : "Changing Status to Dropped",
        description: isRTL
          ? "شما در حال لغو ثبت‌نام این هنرجو هستید. این عمل قابل بازگشت نیست."
          : "You are about to drop this enrollment. This action cannot be undone.",
        action: () => handleSave({ ...data, _confirmed: true }),
      });
      return;
    }

    // Proceed with save
    setSaving(true);
    authFetch(`/api/admin/enrollments/${enrollment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then((res) => {
        if (res.ok) {
          toast.success(isRTL ? "بروزرسانی شد" : "Enrollment updated");
          logAuditAction("UPDATE_ENROLLMENT", "enrollment", enrollment.id, `Updated enrollment for ${enrollment.student.name}: ${JSON.stringify(data)}`);
          onSaved();
          onClose();
        } else {
          res.json().then((d) => toast.error(d.error || "Error"));
        }
      })
      .catch(() => toast.error(isRTL ? "خطا" : "Error"))
      .finally(() => setSaving(false));
  };

  const handleMarkAsPaid = () => {
    setSaving(true);
    authFetch(`/api/admin/enrollments/${enrollment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: "paid" }),
    })
      .then((res) => {
        if (res.ok) {
          toast.success(isRTL ? "به عنوان پرداخت‌شده علامت‌گذاری شد" : "Marked as paid");
          logAuditAction("MARK_PAID", "enrollment", enrollment.id, `Marked enrollment as paid for ${enrollment.student.name}`);
          onSaved();
          onClose();
        } else {
          res.json().then((d) => toast.error(d.error || "Error"));
        }
      })
      .catch(() => toast.error(isRTL ? "خطا" : "Error"))
      .finally(() => setSaving(false));
  };

  const handleMarkAsWaived = () => {
    setSaving(true);
    authFetch(`/api/admin/enrollments/${enrollment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: "waived" }),
    })
      .then((res) => {
        if (res.ok) {
          toast.success(isRTL ? "به عنوان معاف علامت‌گذاری شد" : "Marked as waived");
          logAuditAction("MARK_WAIVED", "enrollment", enrollment.id, `Marked enrollment as waived for ${enrollment.student.name}`);
          onSaved();
          onClose();
        } else {
          res.json().then((d) => toast.error(d.error || "Error"));
        }
      })
      .catch(() => toast.error(isRTL ? "خطا" : "Error"))
      .finally(() => setSaving(false));
  };

  const handleRefund = () => {
    setWarning({
      open: true,
      title: isRTL ? "بازگشت وجه" : "Refund Payment",
      description: isRTL
        ? `شما در حال بازگشت وجه ثبت‌نام ${enrollment.student.name} هستید. وضعیت پرداخت به «پرداخت‌نشده» تغییر می‌کند و اطلاعات پرداخت پاک می‌شود. این عمل قابل بازگشت نیست.`
        : `You are refunding the payment for ${enrollment.student.name}. Payment status will be changed to "Unpaid" and payment info will be cleared. This cannot be undone.`,
      action: () => {
        setSaving(true);
        authFetch(`/api/admin/enrollments/${enrollment.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentStatus: "unpaid", paymentRef: "", paidAt: null }),
        })
          .then((res) => {
            if (res.ok) {
              toast.success(isRTL ? "وجه بازگشت داده شد" : "Payment refunded");
              logAuditAction("REFUND", "enrollment", enrollment.id, `Refunded enrollment for ${enrollment.student.name}`);
              onSaved();
              onClose();
            } else {
              res.json().then((d) => toast.error(d.error || "Error"));
            }
          })
          .catch(() => toast.error(isRTL ? "خطا" : "Error"))
          .finally(() => setSaving(false));
      },
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-primary" />
              {isRTL ? "ویرایش ثبت‌نام" : "Edit Enrollment"}
            </DialogTitle>
            <DialogDescription className="sr-only">فرم ویرایش ثبت‌نام</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {/* Student & Course Info */}
            <div className="bg-muted/30 rounded-md p-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-xs">{enrollment.student.name}</span>
                <span className="text-[10px] text-muted-foreground">{enrollment.student.email}</span>
              </div>
              <div className="text-[10px] text-muted-foreground">{isRTL ? enrollment.course.titleFa : enrollment.course.titleEn}</div>
            </div>

            {/* Quick Actions */}
            {enrollment.paymentStatus !== "paid" && enrollment.paymentStatus !== "waived" && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10" onClick={handleMarkAsPaid}>
                  <CheckCircle2 className="w-3 h-3" />
                  {isRTL ? "علامت پرداخت‌شده" : "Mark Paid"}
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-purple-600 border-purple-500/30 hover:bg-purple-500/10" onClick={handleMarkAsWaived}>
                  <Shield className="w-3 h-3" />
                  {isRTL ? "معاف از پرداخت" : "Mark Waived"}
                </Button>
              </div>
            )}
            {enrollment.paymentStatus === "paid" && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-red-500 border-red-500/30 hover:bg-red-500/10" onClick={handleRefund}>
                  <AlertTriangle className="w-3 h-3" />
                  {isRTL ? "بازگشت وجه" : "Refund"}
                </Button>
              </div>
            )}

            {/* Edit Form */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{isRTL ? "وضعیت پرداخت" : "Payment Status"}</Label>
                <Select value={form.paymentStatus} onValueChange={(v) => setForm({ ...form, paymentStatus: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_STATUS_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{isRTL ? cfg.labelFa : cfg.labelEn}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{isRTL ? "وضعیت ثبت‌نام" : "Enrollment Status"}</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ENROLLMENT_STATUS_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{isRTL ? cfg.labelFa : cfg.labelEn}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{isRTL ? "شهریه (تومان)" : "Tuition (Toman)"}</Label>
                <Input type="number" className="h-8 text-sm" value={form.tuitionAmount || ""} onChange={(e) => setForm({ ...form, tuitionAmount: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-xs">{isRTL ? "مهلت پرداخت" : "Payment Due"}</Label>
                <Input type="date" className="h-8 text-sm" value={form.paymentDueDate} onChange={(e) => setForm({ ...form, paymentDueDate: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">{isRTL ? "شماره رسید / تراکنش" : "Payment Ref / Tracking"}</Label>
                <Input className="h-8 text-sm font-mono" value={form.paymentRef} onChange={(e) => setForm({ ...form, paymentRef: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">{isRTL ? "یادداشت" : "Notes"}</Label>
                <Textarea className="text-sm min-h-[60px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>

            <div className={cn("flex gap-2 justify-end", isRTL && "flex-row-reverse")}>
              <Button size="sm" variant="outline" onClick={onClose}>{isRTL ? "انصراف" : "Cancel"}</Button>
              <Button size="sm" disabled={saving} onClick={() => handleSave()}>
                {saving && <Loader2 className="w-3.5 h-3.5 me-1 animate-spin" />}
                {isRTL ? "ذخیره" : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CriticalActionWarningDialog
        open={warning.open}
        onClose={() => setWarning({ ...warning, open: false })}
        onConfirm={warning.action}
        title={warning.title}
        description={warning.description}
        isRTL={isRTL}
      />
    </>
  );
}

// ============================================
// NEW REGISTRATION DIALOG
// ============================================
function NewRegistrationDialog({ open, onClose, isRTL, onSaved }: { open: boolean; onClose: () => void; isRTL: boolean; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [form, setForm] = useState({
    studentId: "",
    courseId: "",
    registrationMethod: "in_person",
    paymentStatus: "unpaid",
    tuitionAmount: 0,
    notes: "",
  });

  useEffect(() => {
    if (open) {
      authFetch("/api/admin/students?limit=200&role=student").then((r) => r.json()).then((d) => setStudents(d.students || [])).catch(() => {});
      authFetch("/api/admin/courses").then((r) => r.json()).then((d) => setCourses(d.courses || [])).catch(() => {});
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId || !form.courseId) {
      toast.error(isRTL ? "انتخاب هنرجو و دوره الزامی است" : "Student and Course are required");
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch("/api/admin/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success(isRTL ? "ثبت‌نام ایجاد شد" : "Enrollment created");
        onSaved();
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            {isRTL ? "ثبت‌نام جدید" : "New Registration"}
          </DialogTitle>
          <DialogDescription className="sr-only">فرم ثبت‌نام جدید</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-xs">{isRTL ? "هنرجو" : "Student"} *</Label>
            <Select value={form.studentId} onValueChange={(v) => setForm({ ...form, studentId: v })}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder={isRTL ? "انتخاب هنرجو..." : "Select student..."} /></SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} ({s.email})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{isRTL ? "دوره" : "Course"} *</Label>
            <Select value={form.courseId} onValueChange={(v) => setForm({ ...form, courseId: v })}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder={isRTL ? "انتخاب دوره..." : "Select course..."} /></SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{isRTL ? c.titleFa : c.titleEn}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{isRTL ? "روش ثبت‌نام" : "Registration Method"}</Label>
              <Select value={form.registrationMethod} onValueChange={(v) => setForm({ ...form, registrationMethod: v })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">{isRTL ? "تلفنی" : "Phone"}</SelectItem>
                  <SelectItem value="in_person">{isRTL ? "حضوری" : "In-Person"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{isRTL ? "وضعیت پرداخت" : "Payment Status"}</Label>
              <Select value={form.paymentStatus} onValueChange={(v) => setForm({ ...form, paymentStatus: v })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">{isRTL ? "پرداخت‌نشده" : "Unpaid"}</SelectItem>
                  <SelectItem value="paid">{isRTL ? "پرداخت‌شده" : "Paid"}</SelectItem>
                  <SelectItem value="partial">{isRTL ? "پرداخت جزئی" : "Partial"}</SelectItem>
                  <SelectItem value="waived">{isRTL ? "معاف" : "Waived"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{isRTL ? "شهریه (تومان)" : "Tuition (Toman)"}</Label>
              <Input type="number" className="h-8 text-sm" value={form.tuitionAmount || ""} onChange={(e) => setForm({ ...form, tuitionAmount: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <Label className="text-xs">{isRTL ? "یادداشت" : "Notes"}</Label>
            <Textarea className="text-sm min-h-[50px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className={cn("flex gap-2 justify-end", isRTL && "flex-row-reverse")}>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>{isRTL ? "انصراف" : "Cancel"}</Button>
            <Button type="submit" size="sm" disabled={saving}>{saving && <Loader2 className="w-3.5 h-3.5 me-1 animate-spin" />}{isRTL ? "ایجاد ثبت‌نام" : "Create Enrollment"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// COURSES TAB
// ============================================
function CoursesTab({ isRTL }: { isRTL: boolean }) {
  const [courses, setCourses] = useState<CourseEntry[]>([]);
  const [instructors, setInstructors] = useState<Array<{ id: string; name: string; specialtyFa: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editCourse, setEditCourse] = useState<CourseEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CourseEntry | null>(null);
  const [detailCourse, setDetailCourse] = useState<CourseEntry | null>(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/admin/courses?all=true");
      if (res.ok) { const d = await res.json(); setCourses(d.courses || []); }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
    finally { setLoading(false); }
  }, []);

  const fetchInstructors = useCallback(async () => {
    try {
      const res = await authFetch("/api/admin/instructors");
      if (res.ok) {
        const d = await res.json();
        setInstructors((d.instructors || []).map((i: { id: string; name: string; specialtyFa: string | null }) => ({ id: i.id, name: i.name, specialtyFa: i.specialtyFa })));
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchCourses(); fetchInstructors(); }, [fetchCourses, fetchInstructors]);

  const deleteCourse = async (id: string) => {
    try {
      const res = await authFetch(`/api/admin/courses/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success(isRTL ? "حذف شد" : "Deleted"); logAuditAction("DELETE", "course", id, `Course deleted: ${deleteTarget?.titleFa || id}`); fetchCourses(); }
      else { const d = await res.json(); toast.error(d.error || "Error"); }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
    finally { setDeleteTarget(null); }
  };

  const toggleFlag = async (id: string, field: string, value: boolean) => {
    try {
      const res = await authFetch(`/api/admin/courses/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: value }) });
      if (res.ok) { toast.success(isRTL ? "بروزرسانی شد" : "Updated"); fetchCourses(); }
      else toast.error(isRTL ? "خطا" : "Error");
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
  };

  const filteredCourses = courses.filter((c) =>
    !search || c.titleFa.includes(search) || c.titleEn.toLowerCase().includes(search.toLowerCase()) || (c.instrument || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Spinner />;

  const totalEnrollments = courses.reduce((s, c) => s + c._count.enrollments, 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: GraduationCap, labelFa: "کل دوره‌ها", labelEn: "Total Courses", value: courses.length, color: "from-primary/15 to-primary/5", iconBg: "bg-primary/15", iconColor: "text-primary" },
          { icon: CheckCircle2, labelFa: "منتشر شده", labelEn: "Published", value: courses.filter(c => c.isPublished).length, color: "from-emerald-500/15 to-emerald-500/5", iconBg: "bg-emerald-500/15", iconColor: "text-emerald-600 dark:text-emerald-400" },
          { icon: Users, labelFa: "کل ثبت‌نام‌ها", labelEn: "Total Enrollments", value: totalEnrollments, color: "from-violet-500/15 to-violet-500/5", iconBg: "bg-violet-500/15", iconColor: "text-violet-600 dark:text-violet-400" },
          { icon: ToggleLeft, labelFa: "ثبت‌نام باز", labelEn: "Registration Open", value: courses.filter(c => c.registrationOpen).length, color: "from-teal-500/15 to-teal-500/5", iconBg: "bg-teal-500/15", iconColor: "text-teal-600 dark:text-teal-400" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Card className="border-border/30">
              <div className={cn("h-1 bg-gradient-to-r", s.color)} />
              <CardContent className="p-2.5">
                <div className={cn("w-6 h-6 rounded flex items-center justify-center mb-1", s.iconBg)}>
                  <s.icon className={cn("w-3.5 h-3.5", s.iconColor)} />
                </div>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{isRTL ? s.labelFa : s.labelEn}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className={cn("flex flex-wrap items-center gap-2", isRTL && "flex-row-reverse")}>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute top-2.5 start-3 w-4 h-4 text-muted-foreground" />
          <Input placeholder={isRTL ? "جستجو دوره..." : "Search courses..."} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9 h-8 text-sm" />
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} className="h-8"><Plus className="w-3.5 h-3.5 me-1" />{isRTL ? "دوره جدید" : "New Course"}</Button>
        <Button size="sm" variant="outline" onClick={fetchCourses} className="h-8"><RefreshCw className="w-3.5 h-3.5" /></Button>
      </div>

      {/* Course Table */}
      <ScrollArea className="max-h-[calc(100vh-360px)]">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="text-xs">{isRTL ? "عنوان" : "Title"}</TableHead>
            <TableHead className="text-xs">{isRTL ? "ساز/سطح" : "Instrument/Level"}</TableHead>
            <TableHead className="text-xs">{isRTL ? "جلسات" : "Sessions"}</TableHead>
            <TableHead className="text-xs">{isRTL ? "قیمت" : "Price"}</TableHead>
            <TableHead className="text-xs">{isRTL ? "ثبت‌نام" : "Enrollments"}</TableHead>
            <TableHead className="text-xs">{isRTL ? "ثبت‌نام باز" : "Reg. Open"}</TableHead>
            <TableHead className="text-xs">{isRTL ? "پرچم‌ها" : "Flags"}</TableHead>
            <TableHead className="text-xs">{isRTL ? "عملیات" : "Actions"}</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filteredCourses.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">{isRTL ? "دوره‌ای یافت نشد" : "No courses found"}</TableCell></TableRow>
            ) : filteredCourses.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="text-xs">
                  <div className="font-medium">{isRTL ? c.titleFa : c.titleEn}</div>
                  <div className="text-muted-foreground text-[10px]">{c.instructor ? c.instructor.name : (isRTL ? "بدون مدرس" : "No instructor")}</div>
                </TableCell>
                <TableCell className="text-xs">
                  <div>{c.instrument || "—"}</div>
                  <Badge variant="outline" className="text-[9px]">{c.level}</Badge>
                </TableCell>
                <TableCell className="text-xs">
                  {c.sessionsMin != null && c.sessionsMax != null
                    ? c.sessionsMin === c.sessionsMax
                      ? String(c.sessionsMin)
                      : `${c.sessionsMin}-${c.sessionsMax}`
                    : "—"}
                </TableCell>
                <TableCell className="text-xs">{formatToman(c.price, isRTL)}</TableCell>
                <TableCell className="text-xs">
                  <Badge variant="outline" className="text-[10px]">{c._count.enrollments}</Badge>
                </TableCell>
                <TableCell className="text-xs">
                  <Button size="sm" variant="ghost" className="h-6 px-1" onClick={() => toggleFlag(c.id, "registrationOpen", !c.registrationOpen)}>
                    {c.registrationOpen ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                  </Button>
                </TableCell>
                <TableCell className="text-xs">
                  <div className="flex items-center gap-1">
                    <Switch checked={c.isPublished} onCheckedChange={(v) => toggleFlag(c.id, "isPublished", v)} className="scale-75" />
                    <Badge className={cn("text-[8px] px-0.5", c.isFeatured ? "bg-amber-500/10 text-amber-600" : "bg-muted text-muted-foreground")}><Star className="w-2.5 h-2.5" /></Badge>
                    <Badge className={cn("text-[8px] px-0.5", c.isShowOnHome ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}><Home className="w-2.5 h-2.5" /></Badge>
                    {c.isNew && <Badge className="bg-emerald-500/10 text-emerald-600 text-[8px] px-0.5"><Zap className="w-2.5 h-2.5" /></Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-xs">
                  <div className="flex gap-0.5">
                    <Button size="sm" variant="ghost" className="h-6 px-1" onClick={() => setDetailCourse(c)}><Eye className="w-3 h-3" /></Button>
                    <Button size="sm" variant="ghost" className="h-6 px-1" onClick={() => setEditCourse(c)}><Edit3 className="w-3 h-3" /></Button>
                    <Button size="sm" variant="ghost" className="h-6 px-1 text-red-500" onClick={() => setDeleteTarget(c)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Create Course Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isRTL ? "دوره جدید" : "New Course"}</DialogTitle><DialogDescription className="sr-only">فرم ایجاد دوره جدید</DialogDescription></DialogHeader>
          <CourseForm isRTL={isRTL} instructors={instructors} onClose={() => { setShowCreate(false); fetchCourses(); }} />
        </DialogContent>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog open={!!editCourse} onOpenChange={() => setEditCourse(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isRTL ? "ویرایش دوره" : "Edit Course"}</DialogTitle><DialogDescription className="sr-only">فرم ویرایش دوره</DialogDescription></DialogHeader>
          {editCourse && <CourseForm isRTL={isRTL} instructors={instructors} course={editCourse} onClose={() => { setEditCourse(null); fetchCourses(); }} />}
        </DialogContent>
      </Dialog>

      {/* Course Detail Dialog */}
      <Dialog open={!!detailCourse} onOpenChange={() => setDetailCourse(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              {detailCourse ? (isRTL ? detailCourse.titleFa : detailCourse.titleEn) : ""}
            </DialogTitle>
            <DialogDescription className="sr-only">مشاهده جزئیات دوره</DialogDescription>
          </DialogHeader>
          {detailCourse && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-0.5"><span className="text-muted-foreground">{isRTL ? "ساز" : "Instrument"}</span><p className="font-medium">{detailCourse.instrument || "—"}</p></div>
                <div className="space-y-0.5"><span className="text-muted-foreground">{isRTL ? "سطح" : "Level"}</span><p className="font-medium">{detailCourse.level}</p></div>
                <div className="space-y-0.5"><span className="text-muted-foreground">{isRTL ? "جلسات" : "Sessions"}</span><p className="font-medium">{detailCourse.sessionsMin != null && detailCourse.sessionsMax != null ? (detailCourse.sessionsMin === detailCourse.sessionsMax ? String(detailCourse.sessionsMin) : `${detailCourse.sessionsMin}-${detailCourse.sessionsMax}`) : "—"}</p></div>
                <div className="space-y-0.5"><span className="text-muted-foreground">{isRTL ? "قیمت" : "Price"}</span><p className="font-medium">{formatToman(detailCourse.price, isRTL)}</p></div>
                <div className="space-y-0.5"><span className="text-muted-foreground">{isRTL ? "مدرس" : "Instructor"}</span><p className="font-medium">{detailCourse.instructor?.name || (isRTL ? "بدون مدرس" : "No instructor")}</p></div>
                <div className="space-y-0.5"><span className="text-muted-foreground">{isRTL ? "شعبه" : "Branch"}</span><p className="font-medium">{detailCourse.branch ? (isRTL ? detailCourse.branch.nameFa : detailCourse.branch.nameEn) : "—"}</p></div>
                <div className="space-y-0.5"><span className="text-muted-foreground">{isRTL ? "ظرفیت" : "Capacity"}</span><p className="font-medium">{detailCourse.maxCapacity ?? (isRTL ? "نامحدود" : "Unlimited")}</p></div>
                <div className="space-y-0.5"><span className="text-muted-foreground">{isRTL ? "ثبت‌نام" : "Enrollments"}</span><p className="font-medium">{detailCourse._count.enrollments}</p></div>
              </div>
              {detailCourse.descriptionFa && (
                <div className="space-y-1">
                  <span className="text-muted-foreground">{isRTL ? "توضیحات" : "Description"}</span>
                  <p className="bg-muted/50 rounded-md p-2 text-muted-foreground">{isRTL ? detailCourse.descriptionFa : detailCourse.descriptionEn}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                <Badge className={cn("text-[10px]", detailCourse.registrationOpen ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600")}>
                  {detailCourse.registrationOpen ? (isRTL ? "ثبت‌نام باز" : "Open") : (isRTL ? "ثبت‌نام بسته" : "Closed")}
                </Badge>
                {detailCourse.isFeatured && <Badge className="bg-amber-500/10 text-amber-600 text-[10px]"><Star className="w-3 h-3 me-0.5" />{isRTL ? "ویژه" : "Featured"}</Badge>}
                {detailCourse.isShowOnHome && <Badge className="bg-primary/10 text-primary text-[10px]"><Home className="w-3 h-3 me-0.5" />{isRTL ? "صفحه اصلی" : "Homepage"}</Badge>}
                {detailCourse.isNew && <Badge className="bg-emerald-500/10 text-emerald-600 text-[10px]"><Zap className="w-3 h-3 me-0.5" />{isRTL ? "جدید" : "New"}</Badge>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={() => deleteTarget && deleteCourse(deleteTarget.id)}
        isRTL={isRTL}
        itemName={deleteTarget ? (isRTL ? deleteTarget.titleFa : deleteTarget.titleEn) : ""}
      />
    </div>
  );
}

// ============================================
// COURSE FORM (Create / Edit)
// ============================================
function CourseForm({ isRTL, instructors, course, onClose }: {
  isRTL: boolean;
  instructors: Array<{ id: string; name: string; specialtyFa: string | null }>;
  course?: CourseEntry | null;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    titleFa: course?.titleFa || "",
    titleEn: course?.titleEn || "",
    descriptionFa: course?.descriptionFa || "",
    descriptionEn: course?.descriptionEn || "",
    category: course?.category || "",
    instrument: course?.instrument || "",
    level: course?.level || "all",
    duration: course?.duration || "",
    sessionsMin: course?.sessionsMin?.toString() || "",
    sessionsMax: course?.sessionsMax?.toString() || "",
    price: course?.price?.toString() || "",
    instructorId: course?.instructorId || "",
    registrationOpen: course?.registrationOpen ?? true,
    maxCapacity: course?.maxCapacity?.toString() || "",
    isPublished: course?.isPublished ?? true,
    isFeatured: course?.isFeatured ?? false,
    isShowOnHome: course?.isShowOnHome ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titleFa || !form.titleEn) { toast.error(isRTL ? "عنوان الزامی است" : "Title is required"); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        sessionsMin: form.sessionsMin ? parseInt(form.sessionsMin) : null,
        sessionsMax: form.sessionsMax ? parseInt(form.sessionsMax) : null,
        price: form.price ? parseInt(form.price) : null,
        maxCapacity: form.maxCapacity ? parseInt(form.maxCapacity) : null,
        category: form.category || null,
        instrument: form.instrument || null,
        duration: form.duration || null,
        instructorId: form.instructorId === "none" ? null : (form.instructorId || null),
      };
      const url = course ? `/api/admin/courses/${course.id}` : "/api/admin/courses";
      const method = course ? "PUT" : "POST";
      const res = await authFetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        toast.success(course ? (isRTL ? "بروزرسانی شد" : "Updated") : (isRTL ? "ایجاد شد" : "Created"));
        logAuditAction(course ? "UPDATE" : "CREATE", "course", course?.id || null, `Course ${course ? "updated" : "created"}: ${form.titleFa}`);
        onClose();
      } else {
        const d = await res.json();
        toast.error(d.error || "Error");
      }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">{isRTL ? "عنوان فارسی" : "Title (FA)"} *</Label><Input className="h-8 text-sm" value={form.titleFa} onChange={(e) => setForm({ ...form, titleFa: e.target.value })} /></div>
        <div><Label className="text-xs">{isRTL ? "عنوان انگلیسی" : "Title (EN)"} *</Label><Input className="h-8 text-sm" value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} /></div>
        <div><Label className="text-xs">{isRTL ? "ساز" : "Instrument"}</Label><Input className="h-8 text-sm" value={form.instrument} onChange={(e) => setForm({ ...form, instrument: e.target.value })} /></div>
        <div>
          <Label className="text-xs">{isRTL ? "سطح" : "Level"}</Label>
          <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRTL ? "همه سطوح" : "All Levels"}</SelectItem>
              <SelectItem value="beginner">{isRTL ? "مبتدی" : "Beginner"}</SelectItem>
              <SelectItem value="intermediate">{isRTL ? "متوسط" : "Intermediate"}</SelectItem>
              <SelectItem value="advanced">{isRTL ? "پیشرفته" : "Advanced"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label className="text-xs">{isRTL ? "حداقل جلسات" : "Sessions Min"}</Label><Input type="number" className="h-8 text-sm" value={form.sessionsMin} onChange={(e) => setForm({ ...form, sessionsMin: e.target.value })} /></div>
        <div><Label className="text-xs">{isRTL ? "حداکثر جلسات" : "Sessions Max"}</Label><Input type="number" className="h-8 text-sm" value={form.sessionsMax} onChange={(e) => setForm({ ...form, sessionsMax: e.target.value })} /></div>
        <div><Label className="text-xs">{isRTL ? "قیمت (تومان)" : "Price"}</Label><Input type="number" className="h-8 text-sm" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
        <div><Label className="text-xs">{isRTL ? "ظرفیت" : "Max Capacity"}</Label><Input type="number" className="h-8 text-sm" value={form.maxCapacity} onChange={(e) => setForm({ ...form, maxCapacity: e.target.value })} /></div>
        <div>
          <Label className="text-xs">{isRTL ? "مدرس" : "Instructor"}</Label>
          <Select value={form.instructorId} onValueChange={(v) => setForm({ ...form, instructorId: v })}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{isRTL ? "بدون مدرس" : "No Instructor"}</SelectItem>
              {instructors.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><Label className="text-xs">{isRTL ? "دسته‌بندی" : "Category"}</Label><Input className="h-8 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
      </div>
      <div><Label className="text-xs">{isRTL ? "توضیحات فارسی" : "Description (FA)"}</Label><Textarea className="h-16 text-sm" value={form.descriptionFa} onChange={(e) => setForm({ ...form, descriptionFa: e.target.value })} /></div>
      <div className={cn("flex items-center gap-4 flex-wrap", isRTL && "flex-row-reverse")}>
        <div className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse")}><Switch checked={form.registrationOpen} onCheckedChange={(v) => setForm({ ...form, registrationOpen: v })} /><Label className="text-xs">{isRTL ? "ثبت‌نام باز" : "Open Reg."}</Label></div>
        <div className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse")}><Switch checked={form.isPublished} onCheckedChange={(v) => setForm({ ...form, isPublished: v })} /><Label className="text-xs">{isRTL ? "انتشار" : "Publish"}</Label></div>
        <div className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse")}><Switch checked={form.isFeatured} onCheckedChange={(v) => setForm({ ...form, isFeatured: v })} /><Label className="text-xs"><Star className="w-3 h-3 inline text-amber-500" /> {isRTL ? "ویژه" : "Featured"}</Label></div>
        <div className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse")}><Switch checked={form.isShowOnHome} onCheckedChange={(v) => setForm({ ...form, isShowOnHome: v })} /><Label className="text-xs"><Home className="w-3 h-3 inline text-primary" /> {isRTL ? "صفحه اصلی" : "Homepage"}</Label></div>
      </div>
      <div className={cn("flex gap-2 justify-end", isRTL && "flex-row-reverse")}>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>{isRTL ? "انصراف" : "Cancel"}</Button>
        <Button type="submit" size="sm" disabled={saving}>{saving && <Loader2 className="w-3.5 h-3.5 me-1 animate-spin" />}{course ? (isRTL ? "بروزرسانی" : "Update") : (isRTL ? "ایجاد" : "Create")}</Button>
      </div>
    </form>
  );
}

// ============================================
// PERSIAN DAY CONFIG
// ============================================
const PERSIAN_DAYS_SA = [
  { value: 0, labelFa: "شنبه", labelEn: "Saturday" },
  { value: 1, labelFa: "یکشنبه", labelEn: "Sunday" },
  { value: 2, labelFa: "دوشنبه", labelEn: "Monday" },
  { value: 3, labelFa: "سه‌شنبه", labelEn: "Tuesday" },
  { value: 4, labelFa: "چهارشنبه", labelEn: "Wednesday" },
  { value: 5, labelFa: "پنجشنبه", labelEn: "Thursday" },
  { value: 6, labelFa: "جمعه", labelEn: "Friday" },
];

const SCHED_STATUS: Record<string, { labelFa: string; labelEn: string; color: string; bgColor: string }> = {
  active: { labelFa: "فعال", labelEn: "Active", color: "text-green-600", bgColor: "bg-green-500/10" },
  cancelled: { labelFa: "لغو شده", labelEn: "Cancelled", color: "text-red-600", bgColor: "bg-red-500/10" },
  completed: { labelFa: "تکمیل شده", labelEn: "Completed", color: "text-blue-600", bgColor: "bg-blue-500/10" },
};

const REQ_TYPE: Record<string, { labelFa: string; labelEn: string; color: string; bgColor: string }> = {
  time_change: { labelFa: "تغییر زمان", labelEn: "Time Change", color: "text-amber-600", bgColor: "bg-amber-500/10" },
  cancellation: { labelFa: "لغو کلاس", labelEn: "Cancellation", color: "text-red-600", bgColor: "bg-red-500/10" },
  room_change: { labelFa: "تغییر اتاق", labelEn: "Room Change", color: "text-sky-600", bgColor: "bg-sky-500/10" },
  reschedule: { labelFa: "جابجایی", labelEn: "Reschedule", color: "text-purple-600", bgColor: "bg-purple-500/10" },
};

const REQ_STATUS: Record<string, { labelFa: string; labelEn: string; color: string; bgColor: string }> = {
  pending: { labelFa: "در انتظار", labelEn: "Pending", color: "text-amber-600", bgColor: "bg-amber-500/10" },
  approved: { labelFa: "تأیید شده", labelEn: "Approved", color: "text-green-600", bgColor: "bg-green-500/10" },
  rejected: { labelFa: "رد شده", labelEn: "Rejected", color: "text-red-600", bgColor: "bg-red-500/10" },
};

// ============================================
// SCHEDULE FORM (Create / Edit)
// ============================================
function ScheduleForm({
  initialData,
  onSave,
  isRTL,
  courses,
  instructors,
  branches,
}: {
  initialData: ClassScheduleEntry | null;
  onSave: (data: Record<string, unknown>) => void;
  isRTL: boolean;
  courses: Array<{ id: string; titleFa: string; titleEn: string }>;
  instructors: Array<{ id: string; name: string }>;
  branches: Array<{ id: string; nameFa: string; nameEn: string }>;
}) {
  const [form, setForm] = useState({
    courseId: initialData?.courseId || "",
    instructorId: initialData?.instructorId || "",
    dayOfWeek: initialData?.dayOfWeek ?? 0,
    startTime: initialData?.startTime || "",
    endTime: initialData?.endTime || "",
    branchId: initialData?.branchId || "",
    isRecurring: initialData?.isRecurring ?? true,
    specificDate: initialData?.specificDate ? new Date(initialData.specificDate).toISOString().split("T")[0] : "",
    room: initialData?.room || "",
    capacity: initialData?.capacity ?? "",
    sessionNumber: initialData?.sessionNumber ?? "",
    notes: initialData?.notes || "",
    status: initialData?.status || "active",
  });

  const updateField = (field: string, value: string | number | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
      <div className="space-y-2">
        <Label className="text-sm font-medium">{isRTL ? "دوره" : "Course"} *</Label>
        <Select value={form.courseId} onValueChange={(v) => updateField("courseId", v)}>
          <SelectTrigger className="rounded-xl"><SelectValue placeholder={isRTL ? "انتخاب دوره..." : "Select course..."} /></SelectTrigger>
          <SelectContent>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>{isRTL ? c.titleFa : c.titleEn}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-1.5">
          <GraduationCap className="w-3.5 h-3.5" />
          {isRTL ? "مدرس" : "Instructor"} *
        </Label>
        <Select value={form.instructorId} onValueChange={(v) => updateField("instructorId", v)}>
          <SelectTrigger className="rounded-xl"><SelectValue placeholder={isRTL ? "انتخاب مدرس..." : "Select instructor..."} /></SelectTrigger>
          <SelectContent>
            {instructors.map((inst) => (
              <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            {isRTL ? "روز هفته" : "Day of Week"} *
          </Label>
          <Select value={String(form.dayOfWeek)} onValueChange={(v) => updateField("dayOfWeek", parseInt(v))}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PERSIAN_DAYS_SA.map((d) => (
                <SelectItem key={d.value} value={String(d.value)}>
                  {isRTL ? d.labelFa : d.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">{isRTL ? "شعبه" : "Branch"}</Label>
          <Select value={form.branchId} onValueChange={(v) => updateField("branchId", v)}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder={isRTL ? "انتخاب شعبه..." : "Select branch..."} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{isRTL ? "بدون شعبه" : "No Branch"}</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>{isRTL ? b.nameFa : b.nameEn}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5" />
            {isRTL ? "ساعت شروع" : "Start Time"} *
          </Label>
          <Input type="time" value={form.startTime} onChange={(e) => updateField("startTime", e.target.value)}
            className="rounded-xl" dir="ltr" placeholder="14:00" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5" />
            {isRTL ? "ساعت پایان" : "End Time"} *
          </Label>
          <Input type="time" value={form.endTime} onChange={(e) => updateField("endTime", e.target.value)}
            className="rounded-xl" dir="ltr" placeholder="16:00" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <DoorOpen className="w-3.5 h-3.5" />
            {isRTL ? "اتاق" : "Room"}
          </Label>
          <Input value={form.room} onChange={(e) => updateField("room", e.target.value)}
            className="rounded-xl" dir="rtl" placeholder={isRTL ? "مثلاً: اتاق ۱" : "e.g. Room 1"} />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {isRTL ? "ظرفیت" : "Capacity"}
          </Label>
          <Input type="number" min={1} value={form.capacity} onChange={(e) => updateField("capacity", e.target.value)}
            className="rounded-xl" dir="ltr" placeholder={isRTL ? "مثلاً ۲۰" : "e.g. 20"} />
        </div>
      </div>
      <div className={cn("flex items-center gap-6", isRTL && "flex-row-reverse")}>
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <Switch checked={form.isRecurring} onCheckedChange={(v) => updateField("isRecurring", v)} />
          <Label className="text-sm flex items-center gap-1">
            <Repeat className="w-3 h-3" />
            {form.isRecurring ? (isRTL ? "هفتگی تکرارشونده" : "Weekly Recurring") : (isRTL ? "یک‌بار" : "One-time")}
          </Label>
        </div>
      </div>
      {!form.isRecurring && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">{isRTL ? "تاریخ جلسه" : "Session Date"} *</Label>
          <Input type="date" value={form.specificDate} onChange={(e) => updateField("specificDate", e.target.value)}
            className="rounded-xl" dir="ltr" />
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5" />
            {isRTL ? "شماره جلسه" : "Session Number"}
          </Label>
          <Input type="number" min={1} value={form.sessionNumber} onChange={(e) => updateField("sessionNumber", e.target.value)}
            className="rounded-xl" dir="ltr" placeholder={isRTL ? "مثلاً ۳" : "e.g. 3"} />
        </div>
        {initialData?.id && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{isRTL ? "وضعیت" : "Status"}</Label>
            <Select value={form.status} onValueChange={(v) => updateField("status", v)}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(SCHED_STATUS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{isRTL ? v.labelFa : v.labelEn}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">{isRTL ? "یادداشت" : "Notes"}</Label>
        <Textarea value={form.notes} onChange={(e) => updateField("notes", e.target.value)}
          className="rounded-xl resize-none" rows={2} dir={isRTL ? "rtl" : "ltr"}
          placeholder={isRTL ? "یادداشت اختیاری..." : "Optional notes..."} />
      </div>
      <Button onClick={() => onSave(form)}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
        {initialData?.id ? (isRTL ? "بروزرسانی برنامه" : "Update Schedule") : (isRTL ? "ایجاد برنامه کلاس" : "Create Schedule")}
      </Button>
    </div>
  );
}

// ============================================
// CLASS SCHEDULES TAB
// ============================================
interface ClassScheduleEntry {
  id: string;
  courseId: string;
  instructorId: string;
  branchId: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  specificDate: string | null;
  room: string | null;
  capacity: number | null;
  status: string;
  cancelReason: string | null;
  cancelledAt: string | null;
  notes: string | null;
  sessionNumber: number | null;
  createdAt: string;
  course: { id: string; titleFa: string; titleEn: string; instrument: string | null; level: string; classType: string };
  instructor: { id: string; name: string; specialtyFa: string | null; specialtyEn: string | null };
  branch?: { id: string; nameFa: string; nameEn: string } | null;
}

function ClassSchedulesTab({ isRTL }: { isRTL: boolean }) {
  const [schedules, setSchedules] = useState<ClassScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseFilter, setCourseFilter] = useState("all");
  const [instructorFilter, setInstructorFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cancelTarget, setCancelTarget] = useState<ClassScheduleEntry | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [courses, setCourses] = useState<Array<{ id: string; titleFa: string; titleEn: string }>>([]);
  const [instructors, setInstructors] = useState<Array<{ id: string; name: string }>>([]);
  const [branches, setBranches] = useState<Array<{ id: string; nameFa: string; nameEn: string }>>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ClassScheduleEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (courseFilter !== "all") params.set("courseId", courseFilter);
      if (instructorFilter !== "all") params.set("instructorId", instructorFilter);
      if (dayFilter !== "all") params.set("dayOfWeek", dayFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await authFetch(`/api/admin/class-schedules?${params}`);
      if (res.ok) {
        const d = await res.json();
        setSchedules(d.schedules || []);
      }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
    finally { setLoading(false); }
  }, [isRTL, courseFilter, instructorFilter, dayFilter, statusFilter]);

  const fetchFilters = useCallback(async () => {
    try {
      const [courseRes, instRes] = await Promise.all([
        authFetch("/api/admin/courses?limit=200"),
        authFetch("/api/admin/instructors?limit=200"),
      ]);
      if (courseRes.ok) {
        const d = await courseRes.json();
        const courseList = d.courses || d.students || d.instructors || [];
        setCourses(courseList.map((c: { id: string; titleFa: string; titleEn: string; branch?: { id: string; nameFa: string; nameEn: string } | null }) => ({ id: c.id, titleFa: c.titleFa, titleEn: c.titleEn })));
        // Extract branches from courses
        const branchMap = new Map<string, { id: string; nameFa: string; nameEn: string }>();
        courseList.forEach((c: { branch?: { id: string; nameFa: string; nameEn: string } | null }) => {
          if (c.branch && c.branch.id) branchMap.set(c.branch.id, c.branch);
        });
        setBranches(Array.from(branchMap.values()));
      }
      if (instRes.ok) {
        const d = await instRes.json();
        const list = d.instructors || d.students || [];
        setInstructors(list.map((i: { id: string; name: string }) => ({ id: i.id, name: i.name })));
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchData(); fetchFilters(); }, [fetchData, fetchFilters]);

  const handleCancel = async () => {
    if (!cancelTarget || !cancelReason.trim()) return;
    try {
      const res = await authFetch(`/api/admin/class-schedules/${cancelTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled", cancelReason: cancelReason.trim() }),
      });
      if (res.ok) {
        toast.success(isRTL ? "برنامه لغو شد" : "Schedule cancelled");
        setCancelTarget(null);
        setCancelReason("");
        fetchData();
      } else toast.error(isRTL ? "خطا" : "Error");
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await authFetch(`/api/admin/class-schedules/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success(isRTL ? "حذف شد" : "Deleted"); fetchData(); }
      else toast.error(isRTL ? "خطا" : "Error");
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
  };

  const handleCreateSave = async (data: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        courseId: data.courseId,
        instructorId: data.instructorId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        isRecurring: data.isRecurring,
        room: data.room || null,
        capacity: data.capacity ? Number(data.capacity) : null,
        sessionNumber: data.sessionNumber ? Number(data.sessionNumber) : null,
        notes: data.notes || null,
      };
      if (data.branchId && data.branchId !== "none") payload.branchId = data.branchId;
      if (!data.isRecurring && data.specificDate) payload.specificDate = data.specificDate;

      const res = await authFetch("/api/admin/class-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(isRTL ? "برنامه جدید ایجاد شد" : "Schedule created");
        setShowCreate(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error((err.error as string) || (isRTL ? "خطا" : "Error"));
      }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
    finally { setIsSaving(false); }
  };

  const handleEditSave = async (data: Record<string, unknown>) => {
    if (!editingSchedule) return;
    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        courseId: data.courseId,
        instructorId: data.instructorId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        isRecurring: data.isRecurring,
        room: data.room || null,
        capacity: data.capacity ? Number(data.capacity) : null,
        sessionNumber: data.sessionNumber ? Number(data.sessionNumber) : null,
        notes: data.notes || null,
        status: data.status,
        branchId: (data.branchId && data.branchId !== "none") ? data.branchId : null,
        specificDate: (!data.isRecurring && data.specificDate) ? data.specificDate : null,
      };

      const res = await authFetch(`/api/admin/class-schedules/${editingSchedule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(isRTL ? "برنامه بروزرسانی شد" : "Schedule updated");
        setEditingSchedule(null);
        fetchData();
      } else {
        const err = await res.json();
        toast.error((err.error as string) || (isRTL ? "خطا" : "Error"));
      }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
    finally { setIsSaving(false); }
  };

  const activeCount = schedules.filter(s => s.status === "active").length;
  const cancelledCount = schedules.filter(s => s.status === "cancelled").length;
  const completedCount = schedules.filter(s => s.status === "completed").length;

  return (
    <div className="space-y-4">
      <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <CalendarClock className="w-5 h-5 text-primary" />
          <h3 className="text-base font-bold">{isRTL ? "برنامه کلاس‌ها" : "Class Schedules"}</h3>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-1.5 h-8 text-xs">
          <Plus className="w-3.5 h-3.5" />
          {isRTL ? "برنامه جدید" : "New Schedule"}
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="rounded-xl h-8 text-xs"><SelectValue placeholder={isRTL ? "دوره" : "Course"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRTL ? "همه دوره‌ها" : "All Courses"}</SelectItem>
            {courses.map(c => <SelectItem key={c.id} value={c.id}>{isRTL ? c.titleFa : c.titleEn}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={instructorFilter} onValueChange={setInstructorFilter}>
          <SelectTrigger className="rounded-xl h-8 text-xs"><SelectValue placeholder={isRTL ? "مدرس" : "Instructor"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRTL ? "همه مدرسین" : "All Instructors"}</SelectItem>
            {instructors.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={dayFilter} onValueChange={setDayFilter}>
          <SelectTrigger className="rounded-xl h-8 text-xs"><SelectValue placeholder={isRTL ? "روز" : "Day"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRTL ? "همه روزها" : "All Days"}</SelectItem>
            {PERSIAN_DAYS_SA.map(d => <SelectItem key={d.value} value={String(d.value)}>{isRTL ? d.labelFa : d.labelEn}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="rounded-xl h-8 text-xs"><SelectValue placeholder={isRTL ? "وضعیت" : "Status"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRTL ? "همه" : "All"}</SelectItem>
            {Object.entries(SCHED_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{isRTL ? v.labelFa : v.labelEn}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      {!loading && schedules.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="border border-green-500/30 rounded-xl p-2.5 text-center bg-green-500/5">
            <div className="text-lg font-bold text-green-600">{activeCount}</div>
            <div className="text-[10px] text-green-600">{isRTL ? "فعال" : "Active"}</div>
          </div>
          <div className="border border-red-500/30 rounded-xl p-2.5 text-center bg-red-500/5">
            <div className="text-lg font-bold text-red-600">{cancelledCount}</div>
            <div className="text-[10px] text-red-600">{isRTL ? "لغو شده" : "Cancelled"}</div>
          </div>
          <div className="border border-blue-500/30 rounded-xl p-2.5 text-center bg-blue-500/5">
            <div className="text-lg font-bold text-blue-600">{completedCount}</div>
            <div className="text-[10px] text-blue-600">{isRTL ? "تکمیل" : "Done"}</div>
          </div>
        </div>
      )}

      {loading ? <Spinner /> : schedules.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CalendarClock className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">{isRTL ? "هنوز برنامه‌ای ایجاد نشده" : "No schedules yet"}</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
          {schedules.map((sched, index) => {
            const dayInfo = PERSIAN_DAYS_SA.find(d => d.value === sched.dayOfWeek);
            const statusConf = SCHED_STATUS[sched.status] || SCHED_STATUS.active;
            return (
              <motion.div key={sched.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                <Card className={cn("border-border/30 hover:border-primary/20 transition-all", sched.status === "cancelled" && "opacity-50")}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", statusConf.bgColor)}>
                        {sched.status === "cancelled" ? <CalendarX className={cn("w-4 h-4", statusConf.color)} /> :
                         sched.status === "completed" ? <CalendarCheck className={cn("w-4 h-4", statusConf.color)} /> :
                         <CalendarClock className={cn("w-4 h-4", statusConf.color)} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="text-sm font-semibold truncate">{isRTL ? sched.course.titleFa : sched.course.titleEn}</h4>
                          <Badge className={cn("text-[8px] px-1 py-0 border-0", sched.course.classType === "private" ? "bg-purple-500/10 text-purple-600" : "bg-green-500/10 text-green-600")}>
                            {sched.course.classType === "private" ? (isRTL ? "خصوصی" : "Private") : (isRTL ? "گروهی" : "Group")}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground mb-1">
                          <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" />{sched.instructor.name}</span>
                          <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{isRTL ? dayInfo?.labelFa : dayInfo?.labelEn}</span>
                          <span className="flex items-center gap-1"><Timer className="w-3 h-3" />{sched.startTime} - {sched.endTime}</span>
                          {sched.room && <span className="flex items-center gap-1"><DoorOpen className="w-3 h-3" />{sched.room}</span>}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={cn("text-[10px] border-0", statusConf.bgColor, statusConf.color)}>{isRTL ? statusConf.labelFa : statusConf.labelEn}</Badge>
                          {sched.isRecurring ? (
                            <Badge className="text-[10px] bg-blue-500/10 text-blue-600 border-0"><Repeat className="w-2.5 h-2.5 mr-0.5" />{isRTL ? "هفتگی" : "Weekly"}</Badge>
                          ) : (
                            <Badge className="text-[10px] bg-gray-500/10 text-gray-500 border-0">{isRTL ? "یک‌بار" : "One-time"}</Badge>
                          )}
                          {sched.sessionNumber && <Badge variant="secondary" className="text-[8px] px-1 py-0">{isRTL ? `جلسه ${sched.sessionNumber}` : `Session ${sched.sessionNumber}`}</Badge>}
                          {sched.capacity && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Users className="w-2.5 h-2.5" />{sched.capacity}</span>}
                          {sched.branch && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{isRTL ? sched.branch.nameFa : sched.branch.nameEn}</span>}
                        </div>
                        {sched.cancelReason && (
                          <div className="mt-1.5 text-[10px] text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {isRTL ? `دلیل لغو: ${sched.cancelReason}` : `Cancel reason: ${sched.cancelReason}`}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="w-7 h-7 hover:text-primary hover:bg-primary/10"
                          onClick={() => setEditingSchedule(sched)} title={isRTL ? "ویرایش" : "Edit"}>
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        {sched.status === "active" && (
                          <Button variant="ghost" size="icon" className="w-7 h-7 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            onClick={() => setCancelTarget(sched)} title={isRTL ? "لغو برنامه" : "Cancel"}>
                            <CalendarX className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="w-7 h-7 hover:text-destructive"
                          onClick={() => handleDelete(sched.id)}>
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

      {/* Create Schedule Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              {isRTL ? "ایجاد برنامه کلاس جدید" : "Create New Schedule"}
            </DialogTitle>
            <DialogDescription className="sr-only">فرم ایجاد برنامه کلاس جدید</DialogDescription>
          </DialogHeader>
          {isSaving ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <ScheduleForm
              initialData={null}
              onSave={handleCreateSave}
              isRTL={isRTL}
              courses={courses}
              instructors={instructors}
              branches={branches}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Schedule Dialog */}
      <Dialog open={!!editingSchedule} onOpenChange={(open) => { if (!open) setEditingSchedule(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-primary" />
              {isRTL ? "ویرایش برنامه کلاس" : "Edit Schedule"}
            </DialogTitle>
            <DialogDescription className="sr-only">فرم ویرایش برنامه کلاس</DialogDescription>
          </DialogHeader>
          {isSaving ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <ScheduleForm
              initialData={editingSchedule}
              onSave={handleEditSave}
              isRTL={isRTL}
              courses={courses}
              instructors={instructors}
              branches={branches}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <AlertDialog open={!!cancelTarget} onOpenChange={(open) => { if (!open) { setCancelTarget(null); setCancelReason(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CalendarX className="w-5 h-5 text-red-500" />
              {isRTL ? "لغو برنامه کلاس" : "Cancel Schedule"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {cancelTarget && `${isRTL ? cancelTarget.course.titleFa : cancelTarget.course.titleEn} — ${PERSIAN_DAYS_SA.find(d => d.value === cancelTarget.dayOfWeek)?.labelFa} ${cancelTarget.startTime}-${cancelTarget.endTime}`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label className="text-sm font-medium">{isRTL ? "دلیل لغو" : "Cancel Reason"} *</Label>
            <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
              className="rounded-xl resize-none" rows={3} dir={isRTL ? "rtl" : "ltr"}
              placeholder={isRTL ? "دلیل لغو کلاس را وارد کنید..." : "Enter reason for cancellation..."} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRTL ? "انصراف" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={!cancelReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white">{isRTL ? "لغو برنامه" : "Confirm Cancel"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================
// SCHEDULE REQUESTS TAB
// ============================================
interface ScheduleRequestEntry {
  id: string;
  instructorId: string;
  scheduleId: string;
  courseId: string;
  requestType: string;
  reason: string;
  proposedChanges: string;
  status: string;
  adminResponse: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  isApplied: boolean;
  appliedAt: string | null;
  createdAt: string;
  instructor: { id: string; name: string; phone: string | null; specialtyFa: string | null };
  course: { id: string; titleFa: string; titleEn: string; instrument: string | null; level: string };
  schedule: { id: string; dayOfWeek: number; startTime: string; endTime: string; room: string | null; status: string; isRecurring: boolean };
}

function ScheduleRequestsTab({ isRTL }: { isRTL: boolean }) {
  const [requests, setRequests] = useState<ScheduleRequestEntry[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [reviewTarget, setReviewTarget] = useState<ScheduleRequestEntry | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("requestType", typeFilter);
      const res = await authFetch(`/api/admin/schedule-requests?${params}`);
      if (res.ok) {
        const d = await res.json();
        setRequests(d.requests || []);
        setPendingCount(d.pendingCount || 0);
      }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
    finally { setLoading(false); }
  }, [isRTL, statusFilter, typeFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async () => {
    if (!reviewTarget) return;
    try {
      const res = await authFetch(`/api/admin/schedule-requests/${reviewTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved", adminResponse: adminResponse.trim() || null }),
      });
      if (res.ok) {
        toast.success(isRTL ? "درخواست تأیید شد و تغییرات اعمال گردید" : "Request approved & changes applied");
        setReviewTarget(null);
        setAdminResponse("");
        setRejectReason("");
        fetchData();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || (isRTL ? "خطا" : "Error"));
      }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
  };

  const handleReject = async () => {
    if (!reviewTarget || !rejectReason.trim()) return;
    try {
      const res = await authFetch(`/api/admin/schedule-requests/${reviewTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", adminResponse: rejectReason.trim() }),
      });
      if (res.ok) {
        toast.success(isRTL ? "درخواست رد شد" : "Request rejected");
        setReviewTarget(null);
        setAdminResponse("");
        setRejectReason("");
        fetchData();
      } else toast.error(isRTL ? "خطا" : "Error");
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
  };

  return (
    <div className="space-y-4">
      <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <ClipboardList className="w-5 h-5 text-primary" />
          <h3 className="text-base font-bold">{isRTL ? "درخواست‌های تغییر برنامه" : "Schedule Change Requests"}</h3>
        </div>
        {pendingCount > 0 && (
          <Badge className="text-[10px] bg-amber-500/10 text-amber-600 border-0">
            {pendingCount} {isRTL ? "در انتظار بررسی" : "pending"}
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="rounded-xl h-8 text-xs"><SelectValue placeholder={isRTL ? "وضعیت" : "Status"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRTL ? "همه" : "All"}</SelectItem>
            {Object.entries(REQ_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{isRTL ? v.labelFa : v.labelEn}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="rounded-xl h-8 text-xs"><SelectValue placeholder={isRTL ? "نوع درخواست" : "Type"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRTL ? "همه" : "All"}</SelectItem>
            {Object.entries(REQ_TYPE).map(([k, v]) => <SelectItem key={k} value={k}>{isRTL ? v.labelFa : v.labelEn}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? <Spinner /> : requests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">{isRTL ? "درخواستی وجود ندارد" : "No requests"}</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[calc(100vh-380px)] overflow-y-auto">
          {requests.map((req, index) => {
            const statusConf = REQ_STATUS[req.status] || REQ_STATUS.pending;
            const typeConf = REQ_TYPE[req.requestType] || REQ_TYPE.time_change;
            let proposed: Record<string, unknown> = {};
            try { proposed = JSON.parse(req.proposedChanges); } catch { /* ignore */ }
            const schedDayInfo = PERSIAN_DAYS_SA.find(d => d.value === req.schedule.dayOfWeek);
            return (
              <motion.div key={req.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                <Card className={cn(
                  "border-border/30 hover:border-primary/20 transition-all",
                  req.status === "pending" && "border-amber-500/20 bg-amber-500/5",
                  req.status === "approved" && "border-green-500/20",
                  req.status === "rejected" && "border-red-500/20 opacity-70"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", statusConf.bgColor)}>
                        {req.status === "pending" ? <AlertCircle className={cn("w-4 h-4", statusConf.color)} /> :
                         req.status === "approved" ? <ThumbsUp className={cn("w-4 h-4", statusConf.color)} /> :
                         <ThumbsDown className={cn("w-4 h-4", statusConf.color)} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="text-sm font-semibold">{req.instructor.name}</h4>
                          <Badge className={cn("text-[10px] border-0", typeConf.bgColor, typeConf.color)}>{isRTL ? typeConf.labelFa : typeConf.labelEn}</Badge>
                          <Badge className={cn("text-[10px] border-0", statusConf.bgColor, statusConf.color)}>{isRTL ? statusConf.labelFa : statusConf.labelEn}</Badge>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground mb-1">
                          <span className="flex items-center gap-1"><Music className="w-3 h-3" />{isRTL ? req.course.titleFa : req.course.titleEn}</span>
                          <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{isRTL ? schedDayInfo?.labelFa : schedDayInfo?.labelEn}</span>
                          <span className="flex items-center gap-1"><Timer className="w-3 h-3" />{req.schedule.startTime}-{req.schedule.endTime}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mb-1.5" dir="rtl">
                          <span className="font-medium">{isRTL ? "دلیل: " : "Reason: "}</span>{req.reason}
                        </div>
                        {Object.keys(proposed).length > 0 && (
                          <div className="border border-border/30 rounded-lg p-2 bg-muted/20 space-y-0.5">
                            <span className="text-[10px] font-semibold text-muted-foreground">{isRTL ? "تغییرات پیشنهادی:" : "Proposed Changes:"}</span>
                            {"dayOfWeek" in proposed && (
                              <div className="text-[10px] text-muted-foreground">→ {isRTL ? "روز: " : "Day: "}{PERSIAN_DAYS_SA.find(d => d.value === Number(proposed.dayOfWeek))?.labelFa || String(proposed.dayOfWeek)}</div>
                            )}
                            {"startTime" in proposed && <div className="text-[10px] text-muted-foreground">→ {isRTL ? "شروع: " : "Start: "}{String(proposed.startTime)}</div>}
                            {"endTime" in proposed && <div className="text-[10px] text-muted-foreground">→ {isRTL ? "پایان: " : "End: "}{String(proposed.endTime)}</div>}
                            {"room" in proposed && <div className="text-[10px] text-muted-foreground">→ {isRTL ? "اتاق: " : "Room: "}{String(proposed.room)}</div>}
                          </div>
                        )}
                        {req.adminResponse && (
                          <div className={cn("mt-1.5 text-[10px] p-1.5 rounded-lg", req.status === "approved" ? "bg-green-500/5 text-green-600" : "bg-red-500/5 text-red-600")}>
                            <span className="font-medium">{isRTL ? "پاسخ ادمین: " : "Admin response: "}</span>{req.adminResponse}
                          </div>
                        )}
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {new Date(req.createdAt).toLocaleDateString(isRTL ? "fa-IR" : "en-US")}
                        </div>
                      </div>
                      {req.status === "pending" && (
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-primary hover:bg-primary/10 shrink-0"
                          onClick={() => { setReviewTarget(req); setAdminResponse(""); setRejectReason(""); }}
                          title={isRTL ? "بررسی درخواست" : "Review"}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={!!reviewTarget} onOpenChange={(open) => { if (!open) { setReviewTarget(null); setAdminResponse(""); setRejectReason(""); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              {isRTL ? "بررسی درخواست تغییر برنامه" : "Review Schedule Change Request"}
            </DialogTitle>
            <DialogDescription className="sr-only">بررسی درخواست تغییر برنامه کلاس</DialogDescription>
          </DialogHeader>
          {reviewTarget && (() => {
            const rTypeConf = REQ_TYPE[reviewTarget.requestType] || REQ_TYPE.time_change;
            let proposedParsed: Record<string, unknown> = {};
            try { proposedParsed = JSON.parse(reviewTarget.proposedChanges); } catch { /* ignore */ }
            const rDayInfo = PERSIAN_DAYS_SA.find(d => d.value === reviewTarget.schedule.dayOfWeek);
            return (
              <div className="space-y-4">
                <div className="border border-border/30 rounded-xl p-3 space-y-2 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">{reviewTarget.instructor.name}</span>
                    <Badge className={cn("text-[10px] border-0", rTypeConf.bgColor, rTypeConf.color)}>{isRTL ? rTypeConf.labelFa : rTypeConf.labelEn}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isRTL ? reviewTarget.course.titleFa : reviewTarget.course.titleEn} | {isRTL ? rDayInfo?.labelFa : rDayInfo?.labelEn} | {reviewTarget.schedule.startTime}-{reviewTarget.schedule.endTime}
                  </div>
                  <div className="text-xs" dir="rtl">
                    <span className="font-medium">{isRTL ? "دلیل: " : "Reason: "}</span>{reviewTarget.reason}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-red-500/20 rounded-xl p-3 space-y-1.5 bg-red-500/5">
                    <h5 className="text-[10px] font-semibold text-red-600">{isRTL ? "برنامه فعلی" : "Current Schedule"}</h5>
                    <div className="text-xs text-muted-foreground flex items-center gap-1"><CalendarDays className="w-3 h-3" />{isRTL ? rDayInfo?.labelFa : rDayInfo?.labelEn}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1"><Timer className="w-3 h-3" />{reviewTarget.schedule.startTime} - {reviewTarget.schedule.endTime}</div>
                    {reviewTarget.schedule.room && <div className="text-xs text-muted-foreground flex items-center gap-1"><DoorOpen className="w-3 h-3" />{reviewTarget.schedule.room}</div>}
                  </div>
                  <div className="border border-green-500/20 rounded-xl p-3 space-y-1.5 bg-green-500/5">
                    <h5 className="text-[10px] font-semibold text-green-600">{isRTL ? "برنامه پیشنهادی" : "Proposed Schedule"}</h5>
                    {"dayOfWeek" in proposedParsed && <div className="text-xs text-muted-foreground flex items-center gap-1"><CalendarDays className="w-3 h-3" />{PERSIAN_DAYS_SA.find(d => d.value === Number(proposedParsed.dayOfWeek))?.labelFa || String(proposedParsed.dayOfWeek)}</div>}
                    {"startTime" in proposedParsed && <div className="text-xs text-muted-foreground flex items-center gap-1"><Timer className="w-3 h-3" />{String(proposedParsed.startTime)}{"endTime" in proposedParsed && ` - ${String(proposedParsed.endTime)}`}</div>}
                    {"room" in proposedParsed && <div className="text-xs text-muted-foreground flex items-center gap-1"><DoorOpen className="w-3 h-3" />{String(proposedParsed.room)}</div>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">{isRTL ? "پاسخ ادمین (اختیاری)" : "Admin Response (optional)"}</Label>
                  <Textarea value={adminResponse} onChange={(e) => setAdminResponse(e.target.value)}
                    className="rounded-xl resize-none" rows={2} dir={isRTL ? "rtl" : "ltr"}
                    placeholder={isRTL ? "پاسخ خود را بنویسید..." : "Write your response..."} />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">{isRTL ? "دلیل رد درخواست (در صورت رد)" : "Rejection Reason (if rejecting)"}</Label>
                  <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                    className="rounded-xl resize-none" rows={2} dir={isRTL ? "rtl" : "ltr"}
                    placeholder={isRTL ? "دلیل رد را وارد کنید..." : "Enter rejection reason..."} />
                </div>

                <div className={cn("flex gap-2", isRTL && "flex-row-reverse")}>
                  <Button onClick={handleApprove} className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl gap-2">
                    <ThumbsUp className="w-4 h-4" />
                    {isRTL ? "تأیید و اعمال تغییرات" : "Approve & Apply"}
                  </Button>
                  <Button onClick={handleReject} disabled={!rejectReason.trim()} variant="destructive" className="flex-1 rounded-xl gap-2">
                    <ThumbsDown className="w-4 h-4" />
                    {isRTL ? "رد درخواست" : "Reject"}
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// WORKSHOP TICKETS TAB
// ============================================
function WorkshopTicketsTab({ isRTL }: { isRTL: boolean }) {
  const [tickets, setTickets] = useState<WorkshopTicketEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ reserved: 0, paid: 0, cancelled: 0, attended: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [workshopFilter, setWorkshopFilter] = useState("all");
  const [workshops, setWorkshops] = useState<Array<{ id: string; titleFa: string; titleEn: string }>>([]);
  const [editTicket, setEditTicket] = useState<WorkshopTicketEntry | null>(null);

  const debouncedSearch = useDebouncedValue(search);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (workshopFilter !== "all") params.set("workshopId", workshopFilter);
      const res = await authFetch(`/api/admin/workshop-tickets?${params}`);
      if (res.ok) {
        const d = await res.json();
        setTickets(d.tickets || []);
        setTotal(d.total || 0);
        setStats(d.stats || { reserved: 0, paid: 0, cancelled: 0, attended: 0 });
      }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
    finally { setLoading(false); }
  }, [isRTL, debouncedSearch, statusFilter, workshopFilter]);

  const fetchWorkshops = useCallback(async () => {
    try {
      const res = await authFetch("/api/admin/workshops-data?all=true");
      if (res.ok) {
        const d = await res.json();
        setWorkshops((d.workshops || []).map((w: { id: string; titleFa: string; titleEn: string }) => ({ id: w.id, titleFa: w.titleFa, titleEn: w.titleEn })));
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchTickets(); fetchWorkshops(); }, [fetchTickets, fetchWorkshops]);

  const changeTicketStatus = async (id: string, newStatus: string) => {
    try {
      const res = await authFetch(`/api/admin/workshop-tickets/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
      if (res.ok) {
        toast.success(isRTL ? "وضعیت تغییر کرد" : "Status updated");
        logAuditAction("UPDATE", "workshop_ticket", id, `Ticket status changed to ${newStatus}`);
        fetchTickets();
      } else { const d = await res.json(); toast.error(d.error || "Error"); }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
  };

  const summaryCards = [
    { icon: Receipt, labelFa: "کل بلیت‌ها", labelEn: "Total Tickets", value: total, color: "from-primary/15 to-primary/5", iconBg: "bg-primary/15", iconColor: "text-primary" },
    { icon: Clock, labelFa: "رزرو شده", labelEn: "Reserved", value: stats.reserved, color: "from-sky-500/15 to-sky-500/5", iconBg: "bg-sky-500/15", iconColor: "text-sky-600 dark:text-sky-400" },
    { icon: CheckCircle2, labelFa: "پرداخت‌شده", labelEn: "Paid", value: stats.paid, color: "from-emerald-500/15 to-emerald-500/5", iconBg: "bg-emerald-500/15", iconColor: "text-emerald-600 dark:text-emerald-400" },
    { icon: XCircle, labelFa: "لغو شده", labelEn: "Cancelled", value: stats.cancelled, color: "from-red-500/15 to-red-500/5", iconBg: "bg-red-500/15", iconColor: "text-red-600 dark:text-red-400" },
    { icon: UserCheck, labelFa: "حاضر", labelEn: "Attended", value: stats.attended, color: "from-purple-500/15 to-purple-500/5", iconBg: "bg-purple-500/15", iconColor: "text-purple-600 dark:text-purple-400" },
  ];

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {summaryCards.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Card className="border-border/30">
              <div className={cn("h-1 bg-gradient-to-r", s.color)} />
              <CardContent className="p-2.5">
                <div className={cn("w-6 h-6 rounded flex items-center justify-center mb-1", s.iconBg)}>
                  <s.icon className={cn("w-3.5 h-3.5", s.iconColor)} />
                </div>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{isRTL ? s.labelFa : s.labelEn}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className={cn("flex flex-wrap items-center gap-2", isRTL && "flex-row-reverse")}>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute top-2.5 start-3 w-4 h-4 text-muted-foreground" />
          <Input placeholder={isRTL ? "جستجو نام، ایمیل..." : "Search name, email..."} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9 h-8 text-sm" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRTL ? "همه وضعیت" : "All Status"}</SelectItem>
            {Object.entries(TICKET_STATUS_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{isRTL ? cfg.labelFa : cfg.labelEn}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={workshopFilter} onValueChange={setWorkshopFilter}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRTL ? "همه کارگاه‌ها" : "All Workshops"}</SelectItem>
            {workshops.map((w) => (
              <SelectItem key={w.id} value={w.id}>{isRTL ? w.titleFa : w.titleEn}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={fetchTickets} className="h-8"><RefreshCw className="w-3.5 h-3.5" /></Button>
      </div>

      <div className="text-xs text-muted-foreground">{isRTL ? `${total} بلیت` : `${total} tickets`}</div>

      {/* Tickets Table */}
      {loading ? <Spinner /> : (
        <ScrollArea className="max-h-[calc(100vh-400px)]">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">{isRTL ? "هنرجو" : "Student"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "کارگاه" : "Workshop"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "وضعیت" : "Status"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "مبلغ" : "Amount"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "روش ثبت‌نام" : "Method"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "تاریخ" : "Date"}</TableHead>
              <TableHead className="text-xs">{isRTL ? "عملیات" : "Actions"}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {tickets.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">{isRTL ? "بلیتی یافت نشد" : "No tickets found"}</TableCell></TableRow>
              ) : tickets.map((t) => {
                const tCfg = TICKET_STATUS_CONFIG[t.status];
                const mCfg = REGISTRATION_METHOD_CONFIG[t.registrationMethod];
                return (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs">
                      <div className="font-medium">{t.student.name}</div>
                      <div className="text-muted-foreground text-[10px]">{t.student.email}</div>
                      {t.student.phone && <div className="text-[10px]"><a href={`tel:${t.student.phone}`} className="text-primary hover:underline">{t.student.phone}</a></div>}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-medium">{isRTL ? t.workshop.titleFa : t.workshop.titleEn}</div>
                      <div className="text-muted-foreground text-[10px]">{formatDate(t.workshop.date, isRTL)}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {tCfg && <Badge className={cn("text-[9px] px-1.5", tCfg.color)}><tCfg.icon className="w-2.5 h-2.5 me-0.5" />{isRTL ? tCfg.labelFa : tCfg.labelEn}</Badge>}
                    </TableCell>
                    <TableCell className="text-xs font-medium">{formatToman(t.amount, isRTL)}</TableCell>
                    <TableCell className="text-xs">
                      {mCfg && <Badge className={cn("text-[9px] px-1.5", mCfg.color)}><mCfg.icon className="w-2.5 h-2.5 me-0.5" />{isRTL ? mCfg.labelFa : mCfg.labelEn}</Badge>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(t.createdAt, isRTL)}</TableCell>
                    <TableCell className="text-xs">
                      <Select value={t.status} onValueChange={(v) => changeTicketStatus(t.id, v)}>
                        <SelectTrigger className="h-6 w-24 text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(TICKET_STATUS_CONFIG).map(([key, cfg]) => (
                            <SelectItem key={key} value={key}>{isRTL ? cfg.labelFa : cfg.labelEn}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      )}

      {/* Edit Ticket Dialog */}
      <Dialog open={!!editTicket} onOpenChange={() => setEditTicket(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isRTL ? "جزئیات بلیت" : "Ticket Details"}</DialogTitle><DialogDescription className="sr-only">مشاهده جزئیات بلیت</DialogDescription></DialogHeader>
          {editTicket && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-0.5"><span className="text-muted-foreground">{isRTL ? "هنرجو" : "Student"}</span><p className="font-medium">{editTicket.student.name}</p></div>
                <div className="space-y-0.5"><span className="text-muted-foreground">{isRTL ? "کارگاه" : "Workshop"}</span><p className="font-medium">{isRTL ? editTicket.workshop.titleFa : editTicket.workshop.titleEn}</p></div>
                <div className="space-y-0.5"><span className="text-muted-foreground">{isRTL ? "وضعیت" : "Status"}</span>
                  <Select value={editTicket.status} onValueChange={(v) => { changeTicketStatus(editTicket.id, v); setEditTicket(null); }}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(TICKET_STATUS_CONFIG).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>{isRTL ? cfg.labelFa : cfg.labelEn}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-0.5"><span className="text-muted-foreground">{isRTL ? "مبلغ" : "Amount"}</span><p className="font-medium">{formatToman(editTicket.amount, isRTL)}</p></div>
                <div className="space-y-0.5"><span className="text-muted-foreground">{isRTL ? "شماره صندلی" : "Seat"}</span><p className="font-medium">{editTicket.seatNumber ?? "—"}</p></div>
                <div className="space-y-0.5"><span className="text-muted-foreground">{isRTL ? "شماره رسید" : "Payment Ref"}</span><p className="font-medium font-mono">{editTicket.paymentRef || "—"}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// PENDING REGISTRATIONS TAB
// ============================================
interface PendingRegistrationEntry {
  id: string;
  name: string;
  phone: string;
  nationalId: string;
  email: string | null;
  role: string;
  registrationInstrument: string | null;
  primaryInstrument: string | null;
  skillLevel: string | null;
  city: string | null;
  province: string | null;
  preferredBranch: string | null;
  referralSource: string | null;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdUserId: string | null;
  ipAddress: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PendingRegistrationDetail {
  id: string;
  name: string;
  phone: string;
  nationalId: string;
  email: string | null;
  role: string;
  dateOfBirth: string | null;
  gender: string | null;
  educationLevel: string | null;
  fieldOfStudy: string | null;
  registrationInstrument: string | null;
  primaryInstrument: string | null;
  secondaryInstruments: string | null;
  musicExperienceYears: number | null;
  previousTraining: string | null;
  musicGenres: string | null;
  learningGoals: string | null;
  practiceHoursPerWeek: number | null;
  skillLevel: string | null;
  instructorName: string | null;
  instructorNameKnown: boolean;
  address: string | null;
  city: string | null;
  province: string | null;
  emergencyContact: string | null;
  preferredBranch: string | null;
  parentName: string | null;
  parentPhone: string | null;
  parentRelation: string | null;
  referralSource: string | null;
  referralDetail: string | null;
  specialtyFa: string | null;
  specialtyEn: string | null;
  bioFa: string | null;
  bioEn: string | null;
  experience: string | null;
  socialLinks: string | null;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  adminNotes: string | null;
  rejectionReason: string | null;
  createdUserId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
}

const PENDING_STATUS_CONFIG: Record<string, { labelFa: string; labelEn: string; color: string; icon: typeof Clock }> = {
  pending: { labelFa: "در انتظار بررسی", labelEn: "Pending", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: Clock },
  approved: { labelFa: "تأیید شده", labelEn: "Approved", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: CheckCircle2 },
  rejected: { labelFa: "رد شده", labelEn: "Rejected", color: "bg-red-500/10 text-red-600 dark:text-red-400", icon: XCircle },
};

function PendingRegistrationsTab({ isRTL }: { isRTL: boolean }) {
  const [registrations, setRegistrations] = useState<PendingRegistrationEntry[]>([]);
  const [summary, setSummary] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [viewItem, setViewItem] = useState<PendingRegistrationDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: "", name: "" });
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(search);

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await authFetch(`/api/registration/pending?${params}`);
      if (res.ok) {
        const d = await res.json();
        setRegistrations(d.registrations || []);
        setTotal(d.total || 0);
        setSummary(d.summary || { pending: 0, approved: 0, rejected: 0 });
      }
    } catch {
      toast.error(isRTL ? "خطا در بارگذاری ثبت‌نام‌های آنلاین" : "Failed to load online registrations");
    } finally {
      setLoading(false);
    }
  }, [isRTL, debouncedSearch, statusFilter]);

  useEffect(() => { fetchRegistrations(); }, [fetchRegistrations]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      authFetch("/api/registration/pending?limit=200")
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d) {
            setRegistrations(d.registrations || []);
            setTotal(d.total || 0);
            setSummary(d.summary || { pending: 0, approved: 0, rejected: 0 });
          }
        })
        .catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleViewDetail = async (id: string) => {
    setViewLoading(true);
    try {
      const res = await authFetch(`/api/registration/pending/${id}`);
      if (res.ok) {
        const d = await res.json();
        setViewItem(d.registration);
      } else {
        toast.error(isRTL ? "خطا در دریافت جزئیات" : "Failed to load details");
      }
    } catch {
      toast.error(isRTL ? "خطا در ارتباط" : "Connection error");
    } finally {
      setViewLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await authFetch(`/api/registration/pending/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (res.ok) {
        toast.success(isRTL ? "درخواست ثبت‌نام تأیید شد و حساب کاربری ایجاد شد" : "Registration approved and account created");
        logAuditAction("APPROVE_REGISTRATION", "pending_registration", id, "Approved pending registration");
        fetchRegistrations();
        setViewItem(null);
      } else {
        const d = await res.json();
        toast.error(d.error || (isRTL ? "خطا در تأیید" : "Failed to approve"));
      }
    } catch {
      toast.error(isRTL ? "خطا در ارتباط" : "Connection error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.id) return;
    setActionLoading(rejectDialog.id);
    try {
      const res = await authFetch(`/api/registration/pending/${rejectDialog.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", rejectionReason: rejectionReason || undefined }),
      });
      if (res.ok) {
        toast.success(isRTL ? "درخواست ثبت‌نام رد شد" : "Registration rejected");
        logAuditAction("REJECT_REGISTRATION", "pending_registration", rejectDialog.id, `Rejected: ${rejectionReason || "No reason"}`);
        fetchRegistrations();
        setViewItem(null);
      } else {
        const d = await res.json();
        toast.error(d.error || (isRTL ? "خطا در رد درخواست" : "Failed to reject"));
      }
    } catch {
      toast.error(isRTL ? "خطا در ارتباط" : "Connection error");
    } finally {
      setActionLoading(null);
      setRejectDialog({ open: false, id: "", name: "" });
      setRejectionReason("");
    }
  };

  // Helper to get localized instrument name
  const getInstrumentLabel = (value: string | null) => {
    if (!value) return "—";
    const found = REG_INSTRUMENTS.find(i => i.value === value);
    return found ? (isRTL ? found.fa : found.en) : value;
  };

  // Helper to get localized generic option label
  const getOptionLabel = (options: Array<{ value: string; fa: string; en: string }>, value: string | null) => {
    if (!value) return "—";
    const found = options.find(o => o.value === value);
    return found ? (isRTL ? found.fa : found.en) : value;
  };

  const summaryCards = [
    { icon: Clock, labelFa: "در انتظار بررسی", labelEn: "Pending", value: summary.pending, color: "from-amber-500/15 to-amber-500/5", iconBg: "bg-amber-500/15", iconColor: "text-amber-600 dark:text-amber-400", highlight: summary.pending > 0 },
    { icon: CheckCircle2, labelFa: "تأیید شده", labelEn: "Approved", value: summary.approved, color: "from-emerald-500/15 to-emerald-500/5", iconBg: "bg-emerald-500/15", iconColor: "text-emerald-600 dark:text-emerald-400" },
    { icon: XCircle, labelFa: "رد شده", labelEn: "Rejected", value: summary.rejected, color: "from-red-500/15 to-red-500/5", iconBg: "bg-red-500/15", iconColor: "text-red-600 dark:text-red-400" },
    { icon: UserPlus, labelFa: "کل درخواست‌ها", labelEn: "Total", value: total, color: "from-primary/15 to-primary/5", iconBg: "bg-primary/15", iconColor: "text-primary" },
  ];

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {summaryCards.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Card className={cn("border-border/30", s.highlight && "ring-1 ring-amber-500/30")}>
              <div className={cn("h-1 bg-gradient-to-r", s.color)} />
              <CardContent className="p-2.5">
                <div className={cn("w-6 h-6 rounded flex items-center justify-center mb-1", s.iconBg)}>
                  <s.icon className={cn("w-3.5 h-3.5", s.iconColor, s.highlight && "animate-pulse")} />
                </div>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{isRTL ? s.labelFa : s.labelEn}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className={cn("flex flex-wrap items-center gap-2", isRTL && "flex-row-reverse")}>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute top-2.5 start-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={isRTL ? "جستجو نام، تلفن، کد ملی..." : "Search name, phone, national ID..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9 h-8 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRTL ? "همه وضعیت" : "All Status"}</SelectItem>
            {Object.entries(PENDING_STATUS_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{isRTL ? cfg.labelFa : cfg.labelEn}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={fetchRegistrations} className="h-8"><RefreshCw className="w-3.5 h-3.5" /></Button>
      </div>

      <div className="text-xs text-muted-foreground">
        {isRTL ? `${total} درخواست ثبت‌نام آنلاین` : `${total} online registration requests`}
      </div>

      {/* Registrations Table */}
      {loading ? <Spinner /> : (
        <ScrollArea className="max-h-[calc(100vh-420px)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">{isRTL ? "نام / تلفن" : "Name / Phone"}</TableHead>
                <TableHead className="text-xs">{isRTL ? "کد ملی" : "National ID"}</TableHead>
                <TableHead className="text-xs">{isRTL ? "ساز" : "Instrument"}</TableHead>
                <TableHead className="text-xs">{isRTL ? "وضعیت" : "Status"}</TableHead>
                <TableHead className="text-xs">{isRTL ? "تاریخ" : "Date"}</TableHead>
                <TableHead className="text-xs">{isRTL ? "عملیات" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
                    {isRTL ? "درخواستی یافت نشد" : "No registration requests found"}
                  </TableCell>
                </TableRow>
              ) : registrations.map((r) => {
                const statusCfg = PENDING_STATUS_CONFIG[r.status];
                const isRecent = Date.now() - new Date(r.createdAt).getTime() < 86400000;
                return (
                  <TableRow key={r.id} className={cn(isRecent && r.status === "pending" && "bg-amber-500/5")}>
                    <TableCell className="text-xs">
                      <div className="font-medium flex items-center gap-1">
                        {r.name}
                        {isRecent && r.status === "pending" && <Badge className="bg-amber-500/10 text-amber-600 text-[8px] px-1 animate-pulse">{isRTL ? "جدید" : "NEW"}</Badge>}
                      </div>
                      <div className="text-muted-foreground text-[10px]">{r.phone}</div>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{r.nationalId}</TableCell>
                    <TableCell className="text-xs">{getInstrumentLabel(r.registrationInstrument || r.primaryInstrument)}</TableCell>
                    <TableCell className="text-xs">
                      {statusCfg && <Badge className={cn("text-[9px] px-1.5", statusCfg.color)}><statusCfg.icon className="w-2.5 h-2.5 me-0.5" />{isRTL ? statusCfg.labelFa : statusCfg.labelEn}</Badge>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(r.createdAt, isRTL)}</TableCell>
                    <TableCell className="text-xs">
                      <div className="flex gap-0.5">
                        <Button size="sm" variant="ghost" className="h-6 px-1" onClick={() => handleViewDetail(r.id)} disabled={viewLoading && viewItem?.id === r.id}>
                          {viewLoading && viewItem?.id === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
                        </Button>
                        {r.status === "pending" && (
                          <>
                            <Button size="sm" variant="ghost" className="h-6 px-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10" onClick={() => handleApprove(r.id)} disabled={actionLoading === r.id}>
                              {actionLoading === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 px-1 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => setRejectDialog({ open: true, id: r.id, name: r.name })}>
                              <XCircle className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              {isRTL ? "جزئیات درخواست ثبت‌نام آنلاین" : "Online Registration Details"}
            </DialogTitle>
            <DialogDescription className="sr-only">مشاهده جزئیات درخواست ثبت‌نام آنلاین</DialogDescription>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-4 text-xs">
              {/* Status badge at top */}
              <div className="flex items-center gap-2">
                {(() => {
                  const cfg = PENDING_STATUS_CONFIG[viewItem.status];
                  return cfg && <Badge className={cn("text-xs px-2 py-0.5", cfg.color)}><cfg.icon className="w-3 h-3 me-1" />{isRTL ? cfg.labelFa : cfg.labelEn}</Badge>;
                })()}
                <span className="text-muted-foreground">{formatDateTime(viewItem.createdAt, isRTL)}</span>
              </div>

              {/* Core Info */}
              <div>
                <p className="font-semibold text-sm mb-2 flex items-center gap-1"><UserPlus className="w-3.5 h-3.5 text-primary" />{isRTL ? "اطلاعات اصلی" : "Core Info"}</p>
                <div className="grid grid-cols-2 gap-3 bg-muted/30 rounded-md p-3">
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "نام" : "Name"}</span>
                    <p className="font-medium">{viewItem.name}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "شماره تماس" : "Phone"}</span>
                    <p className="font-medium font-mono" dir="ltr">{viewItem.phone}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "کد ملی" : "National ID"}</span>
                    <p className="font-medium font-mono" dir="ltr">{viewItem.nationalId}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "ایمیل" : "Email"}</span>
                    <p className="font-medium">{viewItem.email || "—"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "نقش" : "Role"}</span>
                    <p className="font-medium">{viewItem.role === "instructor" ? (isRTL ? "مدرس" : "Instructor") : (isRTL ? "هنرجو" : "Student")}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Personal Info */}
              <div>
                <p className="font-semibold text-sm mb-2 flex items-center gap-1"><Users className="w-3.5 h-3.5 text-primary" />{isRTL ? "اطلاعات شخصی" : "Personal Info"}</p>
                <div className="grid grid-cols-2 gap-3 bg-muted/30 rounded-md p-3">
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "تاریخ تولد" : "Date of Birth"}</span>
                    <p className="font-medium">{viewItem.dateOfBirth ? formatDate(viewItem.dateOfBirth, isRTL) : "—"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "جنسیت" : "Gender"}</span>
                    <p className="font-medium">{getOptionLabel(REG_GENDERS, viewItem.gender)}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "تحصیلات" : "Education"}</span>
                    <p className="font-medium">{getOptionLabel(REG_EDUCATION_LEVELS, viewItem.educationLevel)}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "رشته تحصیلی" : "Field of Study"}</span>
                    <p className="font-medium">{viewItem.fieldOfStudy || "—"}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Music Profile */}
              <div>
                <p className="font-semibold text-sm mb-2 flex items-center gap-1"><Music className="w-3.5 h-3.5 text-primary" />{isRTL ? "پروفایل موسیقی" : "Music Profile"}</p>
                <div className="grid grid-cols-2 gap-3 bg-muted/30 rounded-md p-3">
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "ساز ثبت‌نام" : "Registration Instrument"}</span>
                    <p className="font-medium">{getInstrumentLabel(viewItem.registrationInstrument)}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "ساز اصلی" : "Primary Instrument"}</span>
                    <p className="font-medium">{getInstrumentLabel(viewItem.primaryInstrument)}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "سطح مهارت" : "Skill Level"}</span>
                    <p className="font-medium">{getOptionLabel(REG_SKILL_LEVELS, viewItem.skillLevel)}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "سابقه موسیقی (سال)" : "Experience (Years)"}</span>
                    <p className="font-medium">{viewItem.musicExperienceYears ?? "—"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "آموزش قبلی" : "Previous Training"}</span>
                    <p className="font-medium">{getOptionLabel(REG_PREVIOUS_TRAINING, viewItem.previousTraining)}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "ساعت تمرین هفتگی" : "Practice Hours/Week"}</span>
                    <p className="font-medium">{viewItem.practiceHoursPerWeek ?? "—"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "نام استاد" : "Instructor Name"}</span>
                    <p className="font-medium">{viewItem.instructorNameKnown ? (viewItem.instructorName || "—") : (isRTL ? "نامشخص" : "Unknown")}</p>
                  </div>
                  {viewItem.secondaryInstruments && (
                    <div className="space-y-0.5 col-span-2">
                      <span className="text-muted-foreground">{isRTL ? "سازهای فرعی" : "Secondary Instruments"}</span>
                      <p className="font-medium">{viewItem.secondaryInstruments}</p>
                    </div>
                  )}
                  {viewItem.musicGenres && (
                    <div className="space-y-0.5 col-span-2">
                      <span className="text-muted-foreground">{isRTL ? "ژانرهای موسیقی" : "Music Genres"}</span>
                      <p className="font-medium">{viewItem.musicGenres}</p>
                    </div>
                  )}
                  {viewItem.learningGoals && (
                    <div className="space-y-0.5 col-span-2">
                      <span className="text-muted-foreground">{isRTL ? "اهداف یادگیری" : "Learning Goals"}</span>
                      <p className="font-medium">{viewItem.learningGoals}</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Contact & Location */}
              <div>
                <p className="font-semibold text-sm mb-2 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-primary" />{isRTL ? "اطلاعات تماس و محل" : "Contact & Location"}</p>
                <div className="grid grid-cols-2 gap-3 bg-muted/30 rounded-md p-3">
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "شهر" : "City"}</span>
                    <p className="font-medium">{viewItem.city || "—"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "استان" : "Province"}</span>
                    <p className="font-medium">{getOptionLabel(REG_IRANIAN_PROVINCES, viewItem.province)}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "شعبه ترجیحی" : "Preferred Branch"}</span>
                    <p className="font-medium">{getOptionLabel(REG_BRANCHES, viewItem.preferredBranch)}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "تماس اضطراری" : "Emergency Contact"}</span>
                    <p className="font-medium font-mono" dir="ltr">{viewItem.emergencyContact || "—"}</p>
                  </div>
                  {viewItem.address && (
                    <div className="space-y-0.5 col-span-2">
                      <span className="text-muted-foreground">{isRTL ? "آدرس" : "Address"}</span>
                      <p className="font-medium">{viewItem.address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Parent/Guardian (if any) */}
              {(viewItem.parentName || viewItem.parentPhone) && (
                <>
                  <Separator />
                  <div>
                    <p className="font-semibold text-sm mb-2 flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-primary" />{isRTL ? "اطلاعات ولی" : "Parent/Guardian"}</p>
                    <div className="grid grid-cols-2 gap-3 bg-muted/30 rounded-md p-3">
                      <div className="space-y-0.5">
                        <span className="text-muted-foreground">{isRTL ? "نام ولی" : "Parent Name"}</span>
                        <p className="font-medium">{viewItem.parentName || "—"}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-muted-foreground">{isRTL ? "تلفن ولی" : "Parent Phone"}</span>
                        <p className="font-medium font-mono" dir="ltr">{viewItem.parentPhone || "—"}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-muted-foreground">{isRTL ? "نسبت" : "Relation"}</span>
                        <p className="font-medium">{getOptionLabel(REG_PARENT_RELATIONS, viewItem.parentRelation)}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Referral */}
              {viewItem.referralSource && (
                <>
                  <Separator />
                  <div>
                    <p className="font-semibold text-sm mb-2 flex items-center gap-1"><Globe className="w-3.5 h-3.5 text-primary" />{isRTL ? "منبع آشنایی" : "Referral Source"}</p>
                    <div className="grid grid-cols-2 gap-3 bg-muted/30 rounded-md p-3">
                      <div className="space-y-0.5">
                        <span className="text-muted-foreground">{isRTL ? "منبع" : "Source"}</span>
                        <p className="font-medium">{getOptionLabel(REG_REFERRAL_SOURCES, viewItem.referralSource)}</p>
                      </div>
                      {viewItem.referralDetail && (
                        <div className="space-y-0.5">
                          <span className="text-muted-foreground">{isRTL ? "جزئیات" : "Detail"}</span>
                          <p className="font-medium">{viewItem.referralDetail}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Instructor-specific fields */}
              {(viewItem.specialtyFa || viewItem.specialtyEn || viewItem.bioFa || viewItem.bioEn || viewItem.experience) && (
                <>
                  <Separator />
                  <div>
                    <p className="font-semibold text-sm mb-2 flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5 text-primary" />{isRTL ? "اطلاعات مدرسی" : "Instructor Info"}</p>
                    <div className="grid grid-cols-2 gap-3 bg-muted/30 rounded-md p-3">
                      {viewItem.specialtyFa && <div className="space-y-0.5"><span className="text-muted-foreground">{isRTL ? "تخصص (فارسی)" : "Specialty (FA)"}</span><p className="font-medium">{viewItem.specialtyFa}</p></div>}
                      {viewItem.specialtyEn && <div className="space-y-0.5"><span className="text-muted-foreground">{isRTL ? "تخصص (انگلیسی)" : "Specialty (EN)"}</span><p className="font-medium">{viewItem.specialtyEn}</p></div>}
                      {viewItem.experience && <div className="space-y-0.5"><span className="text-muted-foreground">{isRTL ? "سابقه تدریس" : "Experience"}</span><p className="font-medium">{viewItem.experience}</p></div>}
                      {viewItem.bioFa && <div className="space-y-0.5 col-span-2"><span className="text-muted-foreground">{isRTL ? "بیوگرافی (فارسی)" : "Bio (FA)"}</span><p className="font-medium whitespace-pre-wrap">{viewItem.bioFa}</p></div>}
                      {viewItem.bioEn && <div className="space-y-0.5 col-span-2"><span className="text-muted-foreground">{isRTL ? "بیوگرافی (انگلیسی)" : "Bio (EN)"}</span><p className="font-medium whitespace-pre-wrap">{viewItem.bioEn}</p></div>}
                    </div>
                  </div>
                </>
              )}

              {/* Review info (if reviewed) */}
              {(viewItem.status !== "pending") && (
                <>
                  <Separator />
                  <div>
                    <p className="font-semibold text-sm mb-2 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 text-primary" />{isRTL ? "اطلاعات بررسی" : "Review Info"}</p>
                    <div className="grid grid-cols-2 gap-3 bg-muted/30 rounded-md p-3">
                      <div className="space-y-0.5">
                        <span className="text-muted-foreground">{isRTL ? "تاریخ بررسی" : "Reviewed At"}</span>
                        <p className="font-medium">{viewItem.reviewedAt ? formatDateTime(viewItem.reviewedAt, isRTL) : "—"}</p>
                      </div>
                      {viewItem.rejectionReason && (
                        <div className="space-y-0.5 col-span-2">
                          <span className="text-muted-foreground">{isRTL ? "دلیل رد" : "Rejection Reason"}</span>
                          <p className="font-medium text-red-600 dark:text-red-400">{viewItem.rejectionReason}</p>
                        </div>
                      )}
                      {viewItem.adminNotes && (
                        <div className="space-y-0.5 col-span-2">
                          <span className="text-muted-foreground">{isRTL ? "یادداشت مدیر" : "Admin Notes"}</span>
                          <p className="font-medium">{viewItem.adminNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Submission metadata */}
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-muted-foreground text-[10px]">
                {viewItem.ipAddress && <div><span>IP:</span> <span className="font-mono" dir="ltr">{viewItem.ipAddress}</span></div>}
                <div><span>{isRTL ? "تاریخ ارسال" : "Submitted"}:</span> <span>{formatDateTime(viewItem.createdAt, isRTL)}</span></div>
              </div>

              {/* Action buttons for pending items */}
              {viewItem.status === "pending" && (
                <>
                  <Separator />
                  <div className={cn("flex gap-2 pt-2", isRTL && "flex-row-reverse")}>
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleApprove(viewItem.id)}
                      disabled={actionLoading === viewItem.id}
                    >
                      {actionLoading === viewItem.id ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : <CheckCircle2 className="w-4 h-4 me-1" />}
                      {isRTL ? "تأیید و ایجاد حساب کاربری" : "Approve & Create Account"}
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        setViewItem(null);
                        setRejectDialog({ open: true, id: viewItem.id, name: viewItem.name });
                      }}
                    >
                      <XCircle className="w-4 h-4 me-1" />
                      {isRTL ? "رد درخواست" : "Reject"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => { if (!open) { setRejectDialog({ open: false, id: "", name: "" }); setRejectionReason(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              {isRTL ? `رد درخواست ${rejectDialog.name}` : `Reject ${rejectDialog.name}`}
            </DialogTitle>
            <DialogDescription className="sr-only">فرم رد درخواست با ذکر دلیل</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">{isRTL ? "دلیل رد درخواست (اختیاری)" : "Rejection reason (optional)"}</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={isRTL ? "دلیل رد درخواست را وارد کنید..." : "Enter rejection reason..."}
                className="mt-1 text-sm"
                rows={3}
              />
            </div>
            <div className={cn("flex gap-2", isRTL && "flex-row-reverse")}>
              <Button variant="destructive" onClick={handleReject} disabled={!!actionLoading} className="flex-1">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : <XCircle className="w-4 h-4 me-1" />}
                {isRTL ? "رد درخواست" : "Reject"}
              </Button>
              <Button variant="outline" onClick={() => { setRejectDialog({ open: false, id: "", name: "" }); setRejectionReason(""); }} className="flex-1">
                {isRTL ? "انصراف" : "Cancel"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// REGISTRATIONS TAB
// ============================================
function RegistrationsTab({ isRTL }: { isRTL: boolean }) {
  const [enrollments, setEnrollments] = useState<EnrollmentEntry[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<"date" | "amount">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [lastCount, setLastCount] = useState(0);

  const [viewEnrollment, setViewEnrollment] = useState<EnrollmentEntry | null>(null);
  const [editEnrollment, setEditEnrollment] = useState<EnrollmentEntry | null>(null);
  const [showNewRegistration, setShowNewRegistration] = useState(false);
  const [deleteWarning, setDeleteWarning] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: "", name: "" });

  const debouncedSearch = useDebouncedValue(search);

  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (paymentFilter !== "all") params.set("paymentStatus", paymentFilter);
      if (methodFilter !== "all") params.set("registrationMethod", methodFilter);
      if (courseFilter !== "all") params.set("courseId", courseFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await authFetch(`/api/admin/enrollments?${params}`);
      if (res.ok) {
        const d = await res.json();
        const newEnrollments = d.enrollments || [];
        // Track new registrations for notification
        if (enrollments.length > 0 && newEnrollments.length > enrollments.length) {
          const diff = newEnrollments.length - enrollments.length;
          toast.info(isRTL ? `${diff} ثبت‌نام جدید` : `${diff} new registration(s)`);
        }
        setEnrollments(newEnrollments);
        setTotal(d.total || 0);
        setLastCount(newEnrollments.length);
      }
    } catch {
      toast.error(isRTL ? "خطا در بارگذاری ثبت‌نام‌ها" : "Failed to load enrollments");
    } finally {
      setLoading(false);
    }
  }, [isRTL, debouncedSearch, paymentFilter, methodFilter, courseFilter, statusFilter]);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await authFetch("/api/admin/courses");
      if (res.ok) {
        const d = await res.json();
        setCourses((d.courses || []).map((c: { id: string; titleFa: string; titleEn: string }) => ({ id: c.id, titleFa: c.titleFa, titleEn: c.titleEn })));
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchEnrollments(); }, [fetchEnrollments]);
  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  // Polling for new registrations every 45 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      authFetch("/api/admin/enrollments?limit=200").then(r => r.ok ? r.json() : null).then(d => {
        if (d && d.enrollments) {
          const newTotal = d.enrollments.length;
          if (lastCount > 0 && newTotal > lastCount) {
            const diff = newTotal - lastCount;
            toast.info(isRTL ? `${diff} ثبت‌نام جدید!` : `${diff} new registration(s)!`, { icon: <Bell className="w-4 h-4" /> });
          }
          setEnrollments(d.enrollments);
          setTotal(d.total || 0);
          setLastCount(newTotal);
        }
      }).catch(() => {});
    }, 45000);
    return () => clearInterval(interval);
  }, [isRTL, lastCount]);

  // Computed stats
  const stats = {
    total: enrollments.length,
    paid: enrollments.filter((e) => e.paymentStatus === "paid"),
    unpaid: enrollments.filter((e) => e.paymentStatus === "unpaid"),
    partial: enrollments.filter((e) => e.paymentStatus === "partial"),
    online: enrollments.filter((e) => e.registrationMethod === "online").length,
    phone: enrollments.filter((e) => e.registrationMethod === "phone").length,
    inPerson: enrollments.filter((e) => e.registrationMethod === "in_person").length,
    totalRevenue: enrollments.filter((e) => e.paymentStatus === "paid").reduce((s, e) => s + (e.tuitionAmount || 0), 0),
    totalOutstanding: enrollments.filter((e) => e.paymentStatus !== "paid" && e.paymentStatus !== "waived").reduce((s, e) => s + (e.tuitionAmount || 0), 0),
  };

  // Sort enrollments
  const sortedEnrollments = [...enrollments].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortField === "date") return dir * (new Date(a.enrolledAt).getTime() - new Date(b.enrolledAt).getTime());
    return dir * ((a.tuitionAmount || 0) - (b.tuitionAmount || 0));
  });

  const handleDelete = (id: string) => {
    setSavingForDelete(true);
    authFetch(`/api/admin/enrollments/${id}`, { method: "DELETE" })
      .then((res) => {
        if (res.ok) {
          toast.success(isRTL ? "ثبت‌نام لغو شد" : "Enrollment dropped");
          logAuditAction("DROP_ENROLLMENT", "enrollment", id, "Super admin dropped enrollment");
          fetchEnrollments();
        } else {
          res.json().then((d) => toast.error(d.error || "Error"));
        }
      })
      .catch(() => toast.error(isRTL ? "خطا" : "Error"))
      .finally(() => setSavingForDelete(false));
  };

  const [savingForDelete, setSavingForDelete] = useState(false);

  const toggleSort = (field: "date" | "amount") => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const summaryCards = [
    { icon: ClipboardList, labelFa: "کل ثبت‌نام‌ها", labelEn: "Total Enrollments", value: stats.total, color: "from-primary/15 to-primary/5", iconBg: "bg-primary/15", iconColor: "text-primary" },
    { icon: CheckCircle2, labelFa: "پرداخت‌شده", labelEn: "Paid", value: stats.paid.length, color: "from-emerald-500/15 to-emerald-500/5", iconBg: "bg-emerald-500/15", iconColor: "text-emerald-600 dark:text-emerald-400", sub: formatToman(stats.totalRevenue, isRTL) },
    { icon: XCircle, labelFa: "پرداخت‌نشده", labelEn: "Unpaid", value: stats.unpaid.length, color: "from-red-500/15 to-red-500/5", iconBg: "bg-red-500/15", iconColor: "text-red-600 dark:text-red-400", sub: formatToman(stats.totalOutstanding, isRTL) },
    { icon: Clock, labelFa: "پرداخت جزئی", labelEn: "Partial", value: stats.partial.length, color: "from-amber-500/15 to-amber-500/5", iconBg: "bg-amber-500/15", iconColor: "text-amber-600 dark:text-amber-400" },
    { icon: Monitor, labelFa: "آنلاین", labelEn: "Online", value: stats.online, color: "from-sky-500/15 to-sky-500/5", iconBg: "bg-sky-500/15", iconColor: "text-sky-600 dark:text-sky-400" },
    { icon: PhoneCall, labelFa: "تلفنی", labelEn: "Phone", value: stats.phone, color: "from-amber-500/15 to-amber-500/5", iconBg: "bg-amber-500/15", iconColor: "text-amber-600 dark:text-amber-400" },
    { icon: UserCheck, labelFa: "حضوری", labelEn: "In-Person", value: stats.inPerson, color: "from-emerald-500/15 to-emerald-500/5", iconBg: "bg-emerald-500/15", iconColor: "text-emerald-600 dark:text-emerald-400" },
  ];

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {summaryCards.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Card className="border-border/30">
              <div className={cn("h-1 bg-gradient-to-r", s.color)} />
              <CardContent className="p-2.5">
                <div className={cn("w-6 h-6 rounded flex items-center justify-center mb-1", s.iconBg)}>
                  <s.icon className={cn("w-3.5 h-3.5", s.iconColor)} />
                </div>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{isRTL ? s.labelFa : s.labelEn}</p>
                {s.sub && <p className="text-[9px] text-muted-foreground font-medium mt-0.5">{s.sub}</p>}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className={cn("flex flex-wrap items-center gap-2", isRTL && "flex-row-reverse")}>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute top-2.5 start-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={isRTL ? "جستجو نام، ایمیل، تلفن..." : "Search name, email, phone..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9 h-8 text-sm"
          />
        </div>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRTL ? "همه پرداخت" : "All Payment"}</SelectItem>
            {Object.entries(PAYMENT_STATUS_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{isRTL ? cfg.labelFa : cfg.labelEn}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRTL ? "همه روش" : "All Method"}</SelectItem>
            {Object.entries(REGISTRATION_METHOD_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{isRTL ? cfg.labelFa : cfg.labelEn}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRTL ? "همه دوره‌ها" : "All Courses"}</SelectItem>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>{isRTL ? c.titleFa : c.titleEn}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRTL ? "همه وضعیت" : "All Status"}</SelectItem>
            {Object.entries(ENROLLMENT_STATUS_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{isRTL ? cfg.labelFa : cfg.labelEn}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => setShowNewRegistration(true)} className="h-8">
          <Plus className="w-3.5 h-3.5 me-1" />{isRTL ? "ثبت‌نام جدید" : "New"}
        </Button>
        <Button size="sm" variant="outline" onClick={fetchEnrollments} className="h-8"><RefreshCw className="w-3.5 h-3.5" /></Button>
      </div>

      <div className="text-xs text-muted-foreground">
        {isRTL ? `${total} ثبت‌نام` : `${total} enrollments`}
      </div>

      {/* Enrollment Table */}
      {loading ? <Spinner /> : (
        <ScrollArea className="max-h-[calc(100vh-420px)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">{isRTL ? "هنرجو" : "Student"}</TableHead>
                <TableHead className="text-xs">{isRTL ? "دوره" : "Course"}</TableHead>
                <TableHead className="text-xs">{isRTL ? "روش" : "Method"}</TableHead>
                <TableHead className="text-xs">{isRTL ? "پرداخت" : "Payment"}</TableHead>
                <TableHead className="text-xs">{isRTL ? "وضعیت" : "Status"}</TableHead>
                <TableHead className="text-xs cursor-pointer select-none" onClick={() => toggleSort("amount")}>
                  <span className="flex items-center gap-1">{isRTL ? "شهریه" : "Tuition"}<ArrowUpDown className="w-3 h-3" /></span>
                </TableHead>
                <TableHead className="text-xs cursor-pointer select-none" onClick={() => toggleSort("date")}>
                  <span className="flex items-center gap-1">{isRTL ? "تاریخ" : "Date"}<ArrowUpDown className="w-3 h-3" /></span>
                </TableHead>
                <TableHead className="text-xs">{isRTL ? "عملیات" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEnrollments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">
                    {isRTL ? "ثبت‌نامی یافت نشد" : "No enrollments found"}
                  </TableCell>
                </TableRow>
              ) : sortedEnrollments.map((e) => {
                const payCfg = PAYMENT_STATUS_CONFIG[e.paymentStatus];
                const methodCfg = REGISTRATION_METHOD_CONFIG[e.registrationMethod];
                const statusCfg = ENROLLMENT_STATUS_CONFIG[e.status];
                const isRecent = Date.now() - new Date(e.enrolledAt).getTime() < 86400000;
                return (
                  <TableRow key={e.id} className={cn(isRecent && "bg-rose-500/5")}>
                    <TableCell className="text-xs">
                      <div className="font-medium flex items-center gap-1">
                        {e.student.name}
                        {isRecent && <Badge className="bg-rose-500/10 text-rose-600 text-[8px] px-1 animate-pulse">{isRTL ? "جدید" : "NEW"}</Badge>}
                      </div>
                      <div className="text-muted-foreground text-[10px]">{e.student.email}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-medium">{isRTL ? e.course.titleFa : e.course.titleEn}</div>
                      {e.course.branch && <div className="text-muted-foreground text-[10px]">{isRTL ? e.course.branch.nameFa : e.course.branch.nameEn}</div>}
                    </TableCell>
                    <TableCell className="text-xs">
                      {methodCfg && <Badge className={cn("text-[9px] px-1.5", methodCfg.color)}><methodCfg.icon className="w-2.5 h-2.5 me-0.5" />{isRTL ? methodCfg.labelFa : methodCfg.labelEn}</Badge>}
                    </TableCell>
                    <TableCell className="text-xs">
                      {payCfg && <Badge className={cn("text-[9px] px-1.5", payCfg.color)}><payCfg.icon className="w-2.5 h-2.5 me-0.5" />{isRTL ? payCfg.labelFa : payCfg.labelEn}</Badge>}
                    </TableCell>
                    <TableCell className="text-xs">
                      {statusCfg && <Badge className={cn("text-[9px] px-1.5", statusCfg.color)}>{isRTL ? statusCfg.labelFa : statusCfg.labelEn}</Badge>}
                    </TableCell>
                    <TableCell className="text-xs font-medium">{formatToman(e.tuitionAmount, isRTL)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(e.enrolledAt, isRTL)}</TableCell>
                    <TableCell className="text-xs">
                      <div className="flex gap-0.5">
                        <Button size="sm" variant="ghost" className="h-6 px-1" onClick={() => setViewEnrollment(e)}><Eye className="w-3 h-3" /></Button>
                        <Button size="sm" variant="ghost" className="h-6 px-1" onClick={() => setEditEnrollment(e)}><Edit3 className="w-3 h-3" /></Button>
                        <Button size="sm" variant="ghost" className="h-6 px-1 text-red-500" onClick={() => setDeleteWarning({ open: true, id: e.id, name: e.student.name })}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      )}

      {/* Dialogs */}
      <EnrollmentViewDialog enrollment={viewEnrollment} open={!!viewEnrollment} onClose={() => setViewEnrollment(null)} isRTL={isRTL} />
      <EnrollmentEditDialog enrollment={editEnrollment} open={!!editEnrollment} onClose={() => setEditEnrollment(null)} isRTL={isRTL} onSaved={fetchEnrollments} />
      <NewRegistrationDialog open={showNewRegistration} onClose={() => setShowNewRegistration(false)} isRTL={isRTL} onSaved={fetchEnrollments} />

      {/* Delete Warning (Double Confirmation) */}
      <CriticalActionWarningDialog
        open={deleteWarning.open}
        onClose={() => setDeleteWarning({ ...deleteWarning, open: false })}
        onConfirm={() => handleDelete(deleteWarning.id)}
        title={isRTL ? "حذف/لغو ثبت‌نام" : "Delete/Drop Enrollment"}
        description={isRTL
          ? `شما در حال لغو ثبت‌نام ${deleteWarning.name} هستید. وضعیت ثبت‌نام به «رهاشده» تغییر می‌کند. این عمل قابل بازگشت نیست و تمام اطلاعات پرداخت مرتبط حفظ خواهد شد اما وضعیت ثبت‌نام غیرقابل بازگشت است.`
          : `You are about to drop the enrollment for ${deleteWarning.name}. The enrollment status will be changed to "Dropped". This action cannot be undone. Payment records will be preserved but enrollment status is irreversible.`}
        confirmLabel={isRTL ? "لغو ثبت‌نام" : "Drop Enrollment"}
        isRTL={isRTL}
      />
    </div>
  );
}

// ============================================
// INSTRUCTORS TAB
// ============================================
function InstructorsTab({ isRTL }: { isRTL: boolean }) {
  const [instructors, setInstructors] = useState<Array<{
    id: string; name: string; email: string; phone: string | null;
    primaryInstrument: string | null; isActive: boolean; createdAt: string;
    _count: { enrollments: number };
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebouncedValue(search);

  const fetchInstructors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ role: "instructor", limit: "100" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await authFetch(`/api/admin/instructors?${params}`);
      if (res.ok) {
        const d = await res.json();
        setInstructors(d.instructors || []);
      }
    } catch { toast.error(isRTL ? "خطا" : "Error"); }
    finally { setLoading(false); }
  }, [isRTL, debouncedSearch]);

  useEffect(() => { fetchInstructors(); }, [fetchInstructors]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isRTL ? "جستجوی استاد..." : "Search instructor..."}
            className="ps-9 h-8 text-xs rounded-lg"
          />
        </div>
        <Button size="sm" variant="outline" onClick={fetchInstructors} className="h-8 text-xs">
          <RefreshCw className="w-3 h-3 me-1" />
          {isRTL ? "بازنشانی" : "Refresh"}
        </Button>
      </div>

      {loading ? <Spinner /> : (
        <Card className="border-border/30">
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">{isRTL ? "نام" : "Name"}</TableHead>
                <TableHead className="text-xs">{isRTL ? "ایمیل" : "Email"}</TableHead>
                <TableHead className="text-xs">{isRTL ? "تلفن" : "Phone"}</TableHead>
                <TableHead className="text-xs">{isRTL ? "ساز اصلی" : "Instrument"}</TableHead>
                <TableHead className="text-xs">{isRTL ? "شاگردان" : "Students"}</TableHead>
                <TableHead className="text-xs">{isRTL ? "وضعیت" : "Status"}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {instructors.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">{isRTL ? "استادی یافت نشد" : "No instructors found"}</TableCell></TableRow>
                ) : instructors.map((inst) => (
                  <TableRow key={inst.id}>
                    <TableCell className="text-xs font-medium">{inst.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{inst.email}</TableCell>
                    <TableCell className="text-xs">
                      {inst.phone ? <a href={`tel:${inst.phone}`} className="text-primary hover:underline">{inst.phone}</a> : "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {inst.primaryInstrument ? <Badge variant="outline" className="text-[10px]">{inst.primaryInstrument}</Badge> : "—"}
                    </TableCell>
                    <TableCell className="text-xs tabular-nums">{inst._count?.enrollments || 0}</TableCell>
                    <TableCell className="text-xs">
                      <Badge className={cn("text-[9px]", inst.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600")}>
                        {inst.isActive ? (isRTL ? "فعال" : "Active") : (isRTL ? "غیرفعال" : "Inactive")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================
// FINANCIAL TAB — Full payment & tuition management
// ============================================
// Two sub-views:
//  1. Payments  → individual Payment records (create / edit / delete)
//  2. Tuition   → enrollment-level tuitionAmount + paymentStatus editing
// Admins with payments.update can edit; super_admin can also delete (DELETE /api/admin/payments/[id] is super_admin-only).

type PaymentRecord = {
  id: string;
  amount: number;
  type: string;
  paymentType: string | null;
  status: string;
  paymentMethod: string | null;
  paymentRef: string | null;
  paidAt: string | null;
  dueDate: string | null;
  notes: string | null;
  installmentNumber: number | null;
  totalInstallments: number | null;
  installmentPlanId: string | null;
  createdAt: string;
  student: { id: string; name: string; email: string; phone: string | null };
  enrollment: {
    id: string; status: string; paymentStatus: string; tuitionAmount: number | null;
    course: { id: string; titleFa: string; titleEn: string; instrument: string | null; level: string };
  } | null;
  ticketInfo?: { id: string; status: string; amount: number; workshop: { id: string; titleFa: string; titleEn: string; date: string } } | null;
};

type EnrollmentRecord = {
  id: string; status: string; enrolledAt: string; registrationMethod: string;
  paymentStatus: string; tuitionAmount: number | null;
  paymentDueDate: string | null; paidAt: string | null;
  student: { id: string; name: string; phone: string | null; email: string };
  course: { id: string; titleFa: string; titleEn: string; instrument: string | null; level: string; price: number | null };
  payments?: Array<{ id: string; amount: number; status: string; paidAt: string | null; dueDate: string | null }>;
};

function FinancialTab({ isRTL }: { isRTL: boolean }) {
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === "super_admin";
  const [subView, setSubView] = useState<"payments" | "tuition">("payments");

  // ─── Payments state ───
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [paymentsStats, setPaymentsStats] = useState<{
    paid: { count: number; totalAmount: number };
    pending: { count: number; totalAmount: number };
    overdue: { count: number; totalAmount: number };
  } | null>(null);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // ─── Tuition state ───
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [tuitionLoading, setTuitionLoading] = useState(true);
  const [tuitionFilter, setTuitionFilter] = useState("all");

  // ─── Dialogs ───
  const [editPayment, setEditPayment] = useState<PaymentRecord | null>(null);
  const [createPaymentOpen, setCreatePaymentOpen] = useState(false);
  const [editTuition, setEditTuition] = useState<EnrollmentRecord | null>(null);
  const [deletePayment, setDeletePayment] = useState<PaymentRecord | null>(null);

  const fetchPayments = useCallback(async () => {
    setPaymentsLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (methodFilter !== "all") params.set("paymentMethod", methodFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const res = await authFetch(`/api/admin/payments?${params}`);
      if (res.ok) {
        const d = await res.json();
        setPayments(d.payments || []);
        setPaymentsTotal(d.total || 0);
        setPaymentsStats(d.stats || null);
      } else {
        toast.error(isRTL ? "خطا در بارگذاری پرداخت‌ها" : "Failed to load payments");
      }
    } catch {
      toast.error(isRTL ? "خطا" : "Error");
    } finally {
      setPaymentsLoading(false);
    }
  }, [isRTL, statusFilter, methodFilter, debouncedSearch, dateFrom, dateTo]);

  const fetchEnrollments = useCallback(async () => {
    setTuitionLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (tuitionFilter !== "all") params.set("paymentStatus", tuitionFilter);
      const res = await authFetch(`/api/admin/enrollments?${params}`);
      if (res.ok) {
        const d = await res.json();
        setEnrollments(d.enrollments || []);
      }
    } catch {
      toast.error(isRTL ? "خطا" : "Error");
    } finally {
      setTuitionLoading(false);
    }
  }, [isRTL, tuitionFilter]);

  useEffect(() => {
    if (subView === "payments") fetchPayments();
    else fetchEnrollments();
  }, [subView, fetchPayments, fetchEnrollments]);

  // Silent auto-refresh every 60s
  useEffect(() => {
    const i = setInterval(() => {
      if (subView === "payments") fetchPayments();
      else fetchEnrollments();
    }, 60000);
    return () => clearInterval(i);
  }, [subView, fetchPayments, fetchEnrollments]);

  // ─── Summary computations ───
  const paidThisMonth = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return payments
      .filter((p) => p.status === "paid" && p.paidAt && new Date(p.paidAt) >= startOfMonth)
      .reduce((s, p) => s + (p.amount || 0), 0);
  }, [payments]);

  const totalRevenue = paymentsStats?.paid.totalAmount || 0;
  const pendingAmount = paymentsStats?.pending.totalAmount || 0;
  const overdueAmount = paymentsStats?.overdue.totalAmount || 0;

  // ─── Tuition summary ───
  const tuitionStats = useMemo(() => {
    const paid = enrollments.filter((e) => e.paymentStatus === "paid");
    const unpaid = enrollments.filter((e) => e.paymentStatus === "unpaid");
    const partial = enrollments.filter((e) => e.paymentStatus === "partial");
    return {
      total: enrollments.length,
      paidCount: paid.length,
      unpaidCount: unpaid.length,
      partialCount: partial.length,
      paidRevenue: paid.reduce((s, e) => s + (e.tuitionAmount || 0), 0),
      outstanding: enrollments
        .filter((e) => e.paymentStatus !== "paid" && e.paymentStatus !== "waived")
        .reduce((s, e) => s + (e.tuitionAmount || 0), 0),
    };
  }, [enrollments]);

  // Helper: sum of paid installments for an enrollment (for "remaining balance" display)
  const paidAmountForEnrollment = (e: EnrollmentRecord): number => {
    if (!e.payments || e.payments.length === 0) return 0;
    return e.payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  };

  const paymentsSummaryCards = [
    { icon: DollarSign, labelFa: "کل درآمد پرداخت‌شده", labelEn: "Total Paid", value: formatToman(totalRevenue, isRTL), color: "from-emerald-500/15 to-emerald-500/5", iconBg: "bg-emerald-500/15", iconColor: "text-emerald-600 dark:text-emerald-400" },
    { icon: CalendarCheck, labelFa: "پرداخت این ماه", labelEn: "Paid This Month", value: formatToman(paidThisMonth, isRTL), color: "from-sky-500/15 to-sky-500/5", iconBg: "bg-sky-500/15", iconColor: "text-sky-600 dark:text-sky-400" },
    { icon: Clock, labelFa: "در انتظار", labelEn: "Pending", value: formatToman(pendingAmount, isRTL), color: "from-amber-500/15 to-amber-500/5", iconBg: "bg-amber-500/15", iconColor: "text-amber-600 dark:text-amber-400", sub: isRTL ? `${paymentsStats?.pending.count || 0} مورد` : `${paymentsStats?.pending.count || 0} items` },
    { icon: AlertTriangle, labelFa: "سررسید گذشته", labelEn: "Overdue", value: formatToman(overdueAmount, isRTL), color: "from-red-500/15 to-red-500/5", iconBg: "bg-red-500/15", iconColor: "text-red-600 dark:text-red-400", sub: isRTL ? `${paymentsStats?.overdue.count || 0} مورد` : `${paymentsStats?.overdue.count || 0} items` },
  ];

  const tuitionSummaryCards = [
    { icon: ClipboardList, labelFa: "کل ثبت‌نام‌ها", labelEn: "Total", value: tuitionStats.total, color: "from-primary/15 to-primary/5", iconBg: "bg-primary/15", iconColor: "text-primary" },
    { icon: CheckCircle2, labelFa: "تسویه‌شده", labelEn: "Paid", value: tuitionStats.paidCount, color: "from-emerald-500/15 to-emerald-500/5", iconBg: "bg-emerald-500/15", iconColor: "text-emerald-600 dark:text-emerald-400", sub: formatToman(tuitionStats.paidRevenue, isRTL) },
    { icon: Clock, labelFa: "جزئی", labelEn: "Partial", value: tuitionStats.partialCount, color: "from-amber-500/15 to-amber-500/5", iconBg: "bg-amber-500/15", iconColor: "text-amber-600 dark:text-amber-400" },
    { icon: XCircle, labelFa: "پرداخت‌نشده", labelEn: "Unpaid", value: tuitionStats.unpaidCount, color: "from-red-500/15 to-red-500/5", iconBg: "bg-red-500/15", iconColor: "text-red-600 dark:text-red-400", sub: formatToman(tuitionStats.outstanding, isRTL) },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-view toggle */}
      <div className={cn("flex items-center gap-1 p-1 bg-muted/40 rounded-lg w-fit", isRTL && "flex-row-reverse")}>
        <button
          onClick={() => setSubView("payments")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
            subView === "payments" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Receipt className="w-3.5 h-3.5" />
          {isRTL ? "پرداخت‌ها" : "Payments"}
        </button>
        <button
          onClick={() => setSubView("tuition")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
            subView === "tuition" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          {isRTL ? "شهریه" : "Tuition"}
        </button>
      </div>

      {/* ─────────── PAYMENTS SUB-VIEW ─────────── */}
      {subView === "payments" && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {paymentsSummaryCards.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="border-border/30">
                  <div className={cn("h-1 bg-gradient-to-r", s.color)} />
                  <CardContent className="p-3">
                    <div className={cn("w-6 h-6 rounded flex items-center justify-center mb-1", s.iconBg)}>
                      <s.icon className={cn("w-3.5 h-3.5", s.iconColor)} />
                    </div>
                    <p className="text-sm font-bold tabular-nums">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{isRTL ? s.labelFa : s.labelEn}</p>
                    {s.sub && <p className="text-[9px] text-muted-foreground mt-0.5">{s.sub}</p>}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Filters */}
          <div className={cn("flex flex-wrap items-center gap-2", isRTL && "flex-row-reverse")}>
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className={cn("w-3.5 h-3.5 absolute top-1/2 -translate-y-1/2 text-muted-foreground", isRTL ? "right-2.5" : "left-2.5")} />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isRTL ? "جستجوی نام / شماره پیگیری" : "Search name / ref"}
                className={cn("h-8 text-xs", isRTL ? "pr-8" : "pl-8")}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRTL ? "همه وضعیت‌ها" : "All Status"}</SelectItem>
                {Object.entries(PAYMENT_RECORD_STATUS_CONFIG).map(([k, c]) => (
                  <SelectItem key={k} value={k}>{isRTL ? c.labelFa : c.labelEn}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRTL ? "همه روش‌ها" : "All Methods"}</SelectItem>
                {Object.entries(PAYMENT_METHOD_CONFIG).map(([k, c]) => (
                  <SelectItem key={k} value={k}>{isRTL ? c.labelFa : c.labelEn}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[140px] h-8 text-xs" />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[140px] h-8 text-xs" />
            <Button size="sm" variant="outline" onClick={fetchPayments} className="h-8 text-xs">
              <RefreshCw className="w-3 h-3 me-1" />
              {isRTL ? "بازنشانی" : "Refresh"}
            </Button>
            <Button size="sm" onClick={() => setCreatePaymentOpen(true)} className="h-8 text-xs">
              <Plus className="w-3 h-3 me-1" />
              {isRTL ? "ثبت پرداخت" : "Record Payment"}
            </Button>
          </div>

          {/* Table */}
          {paymentsLoading ? <Spinner /> : (
            <Card className="border-border/30">
              <CardContent className="p-0">
                <ScrollArea className="max-h-[520px]">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead className="text-xs">{isRTL ? "هنرجو" : "Student"}</TableHead>
                      <TableHead className="text-xs">{isRTL ? "دوره / کارگاه" : "Course / Workshop"}</TableHead>
                      <TableHead className="text-xs">{isRTL ? "مبلغ" : "Amount"}</TableHead>
                      <TableHead className="text-xs">{isRTL ? "نوع" : "Type"}</TableHead>
                      <TableHead className="text-xs">{isRTL ? "وضعیت" : "Status"}</TableHead>
                      <TableHead className="text-xs">{isRTL ? "روش" : "Method"}</TableHead>
                      <TableHead className="text-xs">{isRTL ? "سررسید" : "Due"}</TableHead>
                      <TableHead className="text-xs">{isRTL ? "پرداخت" : "Paid"}</TableHead>
                      <TableHead className="text-xs">{isRTL ? "پیگیری" : "Ref"}</TableHead>
                      <TableHead className="text-xs text-right">{isRTL ? "عملیات" : "Actions"}</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {payments.length === 0 ? (
                        <TableRow><TableCell colSpan={10} className="text-center text-xs text-muted-foreground py-8">{isRTL ? "پرداختی یافت نشد" : "No payments found"}</TableCell></TableRow>
                      ) : payments.map((p) => {
                        const stConfig = PAYMENT_RECORD_STATUS_CONFIG[p.status] || PAYMENT_RECORD_STATUS_CONFIG.pending;
                        const methodCfg = p.paymentMethod ? PAYMENT_METHOD_CONFIG[p.paymentMethod] : null;
                        const typeCfg = p.paymentType ? PAYMENT_TYPE_CONFIG[p.paymentType] : null;
                        const courseLabel = p.enrollment
                          ? (isRTL ? p.enrollment.course.titleFa : p.enrollment.course.titleEn)
                          : p.ticketInfo
                          ? (isRTL ? p.ticketInfo.workshop.titleFa : p.ticketInfo.workshop.titleEn)
                          : (isRTL ? "—" : "—");
                        return (
                          <TableRow key={p.id} className={cn(p.status === "overdue" && "bg-red-500/5", p.status === "paid" && "bg-emerald-500/[0.03]")}>
                            <TableCell className="text-xs">
                              <div className="font-medium">{p.student.name}</div>
                              <div className="text-muted-foreground text-[10px]">{p.student.phone || p.student.email}</div>
                            </TableCell>
                            <TableCell className="text-xs">{courseLabel}</TableCell>
                            <TableCell className="text-xs tabular-nums font-medium">{formatToman(p.amount, isRTL)}</TableCell>
                            <TableCell className="text-xs">
                              {typeCfg ? (
                                <span className="text-[10px] text-muted-foreground">
                                  {isRTL ? typeCfg.labelFa : typeCfg.labelEn}
                                  {p.installmentNumber != null && p.totalInstallments != null && (
                                    <span className="text-[9px] ms-1">({toPersianDigits(p.installmentNumber)}/{toPersianDigits(p.totalInstallments)})</span>
                                  )}
                                </span>
                              ) : "—"}
                            </TableCell>
                            <TableCell className="text-xs">
                              <Badge className={cn("text-[9px] px-1.5", stConfig.color)}>{isRTL ? stConfig.labelFa : stConfig.labelEn}</Badge>
                            </TableCell>
                            <TableCell className="text-xs">
                              {methodCfg ? (
                                <span className="text-[10px] inline-flex items-center gap-1">
                                  <methodCfg.icon className="w-3 h-3" />
                                  {isRTL ? methodCfg.labelFa : methodCfg.labelEn}
                                </span>
                              ) : <span className="text-muted-foreground text-[10px]">—</span>}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{p.dueDate ? formatDate(p.dueDate, isRTL) : "—"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{p.paidAt ? formatDate(p.paidAt, isRTL) : "—"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground" dir="ltr">{p.paymentRef ? <span className="font-mono text-[10px]">{p.paymentRef}</span> : "—"}</TableCell>
                            <TableCell className="text-xs">
                              <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditPayment(p)} title={isRTL ? "ویرایش" : "Edit"}>
                                  <Edit3 className="w-3.5 h-3.5" />
                                </Button>
                                {isSuperAdmin && (
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={() => setDeletePayment(p)} title={isRTL ? "حذف" : "Delete"} disabled={!!p.installmentPlanId}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
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
          )}
          <p className="text-[10px] text-muted-foreground">
            {isRTL ? `نمایش ${toPersianDigits(payments.length)} از ${toPersianDigits(paymentsTotal)} پرداخت` : `Showing ${payments.length} of ${paymentsTotal} payments`}
          </p>
        </>
      )}

      {/* ─────────── TUITION SUB-VIEW ─────────── */}
      {subView === "tuition" && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {tuitionSummaryCards.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="border-border/30">
                  <div className={cn("h-1 bg-gradient-to-r", s.color)} />
                  <CardContent className="p-3">
                    <div className={cn("w-6 h-6 rounded flex items-center justify-center mb-1", s.iconBg)}>
                      <s.icon className={cn("w-3.5 h-3.5", s.iconColor)} />
                    </div>
                    <p className="text-lg font-bold tabular-nums">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{isRTL ? s.labelFa : s.labelEn}</p>
                    {s.sub && <p className="text-[9px] text-muted-foreground mt-0.5">{s.sub}</p>}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Filters */}
          <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <Select value={tuitionFilter} onValueChange={setTuitionFilter}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRTL ? "همه" : "All"}</SelectItem>
                <SelectItem value="paid">{isRTL ? "تسویه‌شده" : "Paid"}</SelectItem>
                <SelectItem value="unpaid">{isRTL ? "پرداخت‌نشده" : "Unpaid"}</SelectItem>
                <SelectItem value="partial">{isRTL ? "جزئی" : "Partial"}</SelectItem>
                <SelectItem value="waived">{isRTL ? "معاف" : "Waived"}</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={fetchEnrollments} className="h-8 text-xs">
              <RefreshCw className="w-3 h-3 me-1" />
              {isRTL ? "بازنشانی" : "Refresh"}
            </Button>
          </div>

          {/* Table */}
          {tuitionLoading ? <Spinner /> : (
            <Card className="border-border/30">
              <CardContent className="p-0">
                <ScrollArea className="max-h-[520px]">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead className="text-xs">{isRTL ? "هنرجو" : "Student"}</TableHead>
                      <TableHead className="text-xs">{isRTL ? "دوره" : "Course"}</TableHead>
                      <TableHead className="text-xs">{isRTL ? "شهریه" : "Tuition"}</TableHead>
                      <TableHead className="text-xs">{isRTL ? "پرداخت‌شده" : "Paid"}</TableHead>
                      <TableHead className="text-xs">{isRTL ? "باقی‌مانده" : "Remaining"}</TableHead>
                      <TableHead className="text-xs">{isRTL ? "وضعیت" : "Status"}</TableHead>
                      <TableHead className="text-xs">{isRTL ? "سررسید" : "Due"}</TableHead>
                      <TableHead className="text-xs text-right">{isRTL ? "عملیات" : "Actions"}</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {enrollments.length === 0 ? (
                        <TableRow><TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">{isRTL ? "ثبت‌نامی یافت نشد" : "No enrollments found"}</TableCell></TableRow>
                      ) : enrollments.map((e) => {
                        const psConfig = PAYMENT_STATUS_CONFIG[e.paymentStatus] || PAYMENT_STATUS_CONFIG.unpaid;
                        const tuition = e.tuitionAmount || 0;
                        const paidAmount = paidAmountForEnrollment(e);
                        const remaining = Math.max(0, tuition - paidAmount);
                        return (
                          <TableRow key={e.id} className={cn(e.paymentStatus === "unpaid" && "bg-red-500/5", e.paymentStatus === "partial" && "bg-amber-500/[0.03]")}>
                            <TableCell className="text-xs">
                              <div className="font-medium">{e.student.name}</div>
                              {e.student.phone && <div className="text-muted-foreground text-[10px]">{e.student.phone}</div>}
                            </TableCell>
                            <TableCell className="text-xs">{isRTL ? e.course.titleFa : e.course.titleEn}</TableCell>
                            <TableCell className="text-xs tabular-nums font-medium">{tuition ? formatToman(tuition, isRTL) : "—"}</TableCell>
                            <TableCell className="text-xs tabular-nums text-emerald-600 dark:text-emerald-400">{paidAmount > 0 ? formatToman(paidAmount, isRTL) : "—"}</TableCell>
                            <TableCell className="text-xs tabular-nums text-red-600 dark:text-red-400">{remaining > 0 ? formatToman(remaining, isRTL) : "—"}</TableCell>
                            <TableCell className="text-xs">
                              <Badge className={cn("text-[9px] px-1.5", psConfig.color)}>{isRTL ? psConfig.labelFa : psConfig.labelEn}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{e.paymentDueDate ? formatDate(e.paymentDueDate, isRTL) : "—"}</TableCell>
                            <TableCell className="text-xs">
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditTuition(e)} title={isRTL ? "ویرایش شهریه" : "Edit Tuition"}>
                                <Edit3 className="w-3.5 h-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ─── Edit Payment Dialog ─── */}
      {editPayment && (
        <EditPaymentDialog
          payment={editPayment}
          open={!!editPayment}
          onClose={() => setEditPayment(null)}
          onSaved={() => { setEditPayment(null); fetchPayments(); }}
          isRTL={isRTL}
        />
      )}

      {/* ─── Create Payment Dialog ─── */}
      {createPaymentOpen && (
        <CreatePaymentDialog
          open={createPaymentOpen}
          onClose={() => setCreatePaymentOpen(false)}
          onCreated={() => { setCreatePaymentOpen(false); fetchPayments(); }}
          isRTL={isRTL}
          enrollments={enrollments}
        />
      )}

      {/* ─── Edit Tuition Dialog ─── */}
      {editTuition && (
        <EditTuitionDialog
          enrollment={editTuition}
          open={!!editTuition}
          onClose={() => setEditTuition(null)}
          onSaved={() => { setEditTuition(null); fetchEnrollments(); }}
          isRTL={isRTL}
        />
      )}

      {/* ─── Delete Payment Confirmation (super_admin only) ─── */}
      {deletePayment && isSuperAdmin && (
        <DeletePaymentDialog
          payment={deletePayment}
          open={!!deletePayment}
          onClose={() => setDeletePayment(null)}
          onDeleted={() => { setDeletePayment(null); fetchPayments(); }}
          isRTL={isRTL}
        />
      )}
    </div>
  );
}

// ─── Edit Payment Dialog ─────────────────────────
function EditPaymentDialog({
  payment, open, onClose, onSaved, isRTL,
}: {
  payment: PaymentRecord;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  isRTL: boolean;
}) {
  const [amount, setAmount] = useState(String(payment.amount || ""));
  const [status, setStatus] = useState(payment.status);
  const [paymentMethod, setPaymentMethod] = useState(payment.paymentMethod || "");
  const [paymentRef, setPaymentRef] = useState(payment.paymentRef || "");
  const [dueDate, setDueDate] = useState(payment.dueDate ? payment.dueDate.slice(0, 10) : "");
  const [paidAt, setPaidAt] = useState(payment.paidAt ? payment.paidAt.slice(0, 10) : "");
  const [notes, setNotes] = useState(payment.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const a = Number(amount);
    if (!Number.isFinite(a) || a <= 0) {
      toast.error(isRTL ? "مبلغ نامعتبر است" : "Invalid amount");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        amount: a,
        status,
        notes: notes || null,
      };
      if (paymentMethod) body.paymentMethod = paymentMethod;
      if (paymentRef) body.paymentRef = paymentRef;
      if (dueDate) body.dueDate = dueDate;
      if (status === "paid") {
        body.paidAt = paidAt || new Date().toISOString().slice(0, 10);
      } else {
        body.paidAt = paidAt || null;
      }
      const res = await authFetch(`/api/admin/payments/${payment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(isRTL ? "پرداخت با موفقیت ویرایش شد" : "Payment updated successfully");
        onSaved();
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || (isRTL ? "خطا در ویرایش" : "Failed to update"));
      }
    } catch {
      toast.error(isRTL ? "خطا در ارتباط" : "Connection error");
    } finally {
      setSaving(false);
    }
  };

  const handleQuickMarkAsPaid = async () => {
    setSaving(true);
    try {
      const res = await authFetch(`/api/admin/payments/${payment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markAsPaid: true,
          paymentMethod: paymentMethod || undefined,
          paymentRef: paymentRef || undefined,
        }),
      });
      if (res.ok) {
        toast.success(isRTL ? "به‌عنوان پرداخت‌شده علامت زده شد" : "Marked as paid");
        onSaved();
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || (isRTL ? "خطا" : "Error"));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-primary" />
            {isRTL ? "ویرایش پرداخت" : "Edit Payment"}
          </DialogTitle>
          <DialogDescription className="sr-only">{isRTL ? "ویرایش رکورد پرداخت" : "Edit payment record"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-xs">
          {/* Context info */}
          <div className="rounded-md bg-muted/30 p-2.5 space-y-1">
            <div className={cn("flex justify-between", isRTL && "flex-row-reverse")}>
              <span className="text-muted-foreground">{isRTL ? "هنرجو" : "Student"}</span>
              <span className="font-medium">{payment.student.name}</span>
            </div>
            {payment.enrollment && (
              <div className={cn("flex justify-between", isRTL && "flex-row-reverse")}>
                <span className="text-muted-foreground">{isRTL ? "دوره" : "Course"}</span>
                <span className="font-medium">{isRTL ? payment.enrollment.course.titleFa : payment.enrollment.course.titleEn}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">{isRTL ? "مبلغ (تومان)" : "Amount (Toman)"}</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">{isRTL ? "وضعیت" : "Status"}</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_RECORD_STATUS_CONFIG).map(([k, c]) => (
                    <SelectItem key={k} value={k}>{isRTL ? c.labelFa : c.labelEn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">{isRTL ? "روش پرداخت" : "Payment Method"}</Label>
              <Select value={paymentMethod || "none"} onValueChange={(v) => setPaymentMethod(v === "none" ? "" : v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{isRTL ? "—" : "—"}</SelectItem>
                  {Object.entries(PAYMENT_METHOD_CONFIG).map(([k, c]) => (
                    <SelectItem key={k} value={k}>{isRTL ? c.labelFa : c.labelEn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">{isRTL ? "شماره پیگیری" : "Reference"}</Label>
              <Input value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder="optional" className="h-8 text-xs" dir="ltr" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">{isRTL ? "تاریخ سررسید" : "Due Date"}</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">{isRTL ? "تاریخ پرداخت" : "Paid Date"}</Label>
              <Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} className="h-8 text-xs" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">{isRTL ? "یادداشت" : "Notes"}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="text-xs" />
          </div>
        </div>
        <div className={cn("flex items-center gap-2 pt-2", isRTL && "flex-row-reverse")}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>{isRTL ? "انصراف" : "Cancel"}</Button>
          {status !== "paid" && (
            <Button variant="secondary" size="sm" onClick={handleQuickMarkAsPaid} disabled={saving} className="gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isRTL ? "علامت‌گذاری به‌عنوان پرداخت‌شده" : "Mark as Paid"}
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1 ms-auto">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {isRTL ? "ذخیره" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Create Payment Dialog ───────────────────────
function CreatePaymentDialog({
  open, onClose, onCreated, isRTL, enrollments,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  isRTL: boolean;
  enrollments: EnrollmentRecord[];
}) {
  const [enrollmentId, setEnrollmentId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState("full");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentRef, setPaymentRef] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Installment plan fields
  const [installmentMode, setInstallmentMode] = useState(false);
  const [totalAmount, setTotalAmount] = useState("");
  const [numberOfInstallments, setNumberOfInstallments] = useState("3");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  const selectedEnrollment = enrollments.find((e) => e.id === enrollmentId);

  // When enrollment selected, pre-fill amount / totalAmount from tuition
  useEffect(() => {
    if (selectedEnrollment?.tuitionAmount) {
      setAmount(String(selectedEnrollment.tuitionAmount));
      setTotalAmount(String(selectedEnrollment.tuitionAmount));
    }
  }, [selectedEnrollment]);

  const handleCreate = async () => {
    if (!enrollmentId || !selectedEnrollment) {
      toast.error(isRTL ? "یک ثبت‌نام انتخاب کنید" : "Select an enrollment");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        studentId: selectedEnrollment.student.id,
        enrollmentId,
        paymentMethod,
        paymentRef: paymentRef || undefined,
        dueDate: dueDate || undefined,
        notes: notes || undefined,
      };

      if (installmentMode) {
        const total = Number(totalAmount);
        const n = Number(numberOfInstallments);
        if (!Number.isFinite(total) || total <= 0) {
          toast.error(isRTL ? "مبلغ کل نامعتبر است" : "Invalid total amount");
          setSaving(false);
          return;
        }
        if (!Number.isInteger(n) || n < 2 || n > 36) {
          toast.error(isRTL ? "تعداد اقساط باید بین ۲ و ۳۶ باشد" : "Installments must be 2-36");
          setSaving(false);
          return;
        }
        body.createInstallmentPlan = true;
        body.totalAmount = total;
        body.numberOfInstallments = n;
        body.startDate = startDate || undefined;
      } else {
        const a = Number(amount);
        if (!Number.isFinite(a) || a <= 0) {
          toast.error(isRTL ? "مبلغ نامعتبر است" : "Invalid amount");
          setSaving(false);
          return;
        }
        body.amount = a;
        body.paymentType = paymentType;
        if (paidAt) {
          body.paidAt = paidAt;
        }
      }

      const res = await authFetch(`/api/admin/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(installmentMode
          ? (isRTL ? "طرح قسطی ایجاد شد" : "Installment plan created")
          : (isRTL ? "پرداخت ثبت شد" : "Payment recorded"));
        onCreated();
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || (isRTL ? "خطا در ثبت" : "Failed to create"));
      }
    } catch {
      toast.error(isRTL ? "خطا در ارتباط" : "Connection error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            {isRTL ? "ثبت پرداخت جدید" : "Record New Payment"}
          </DialogTitle>
          <DialogDescription className="sr-only">{isRTL ? "ثبت پرداخت یا طرح قسطی جدید" : "Create a new payment or installment plan"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-xs">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">{isRTL ? "ثبت‌نام (هنرجو + دوره)" : "Enrollment (Student + Course)"}</Label>
            <Select value={enrollmentId} onValueChange={setEnrollmentId}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={isRTL ? "انتخاب کنید…" : "Select…"} /></SelectTrigger>
              <SelectContent>
                {enrollments.length === 0 ? (
                  <SelectItem value="_none" disabled>{isRTL ? "ثبت‌نامی موجود نیست — ابتدا به تب شهریه بروید" : "No enrollments — switch to Tuition tab first"}</SelectItem>
                ) : enrollments.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.student.name} — {isRTL ? e.course.titleFa : e.course.titleEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedEnrollment && (
              <p className="text-[10px] text-muted-foreground">
                {isRTL ? "شهریه دوره" : "Course tuition"}: {formatToman(selectedEnrollment.tuitionAmount, isRTL)}
              </p>
            )}
          </div>

          {/* Installment toggle */}
          <div className={cn("flex items-center gap-2 p-2 rounded-md bg-muted/30", isRTL && "flex-row-reverse")}>
            <Switch checked={installmentMode} onCheckedChange={setInstallmentMode} />
            <div className="flex-1">
              <p className="text-xs font-medium">{isRTL ? "طرح قسطی" : "Installment Plan"}</p>
              <p className="text-[10px] text-muted-foreground">{isRTL ? "تقسیم مبلغ به چند قسط ماهانه" : "Split total into monthly installments"}</p>
            </div>
          </div>

          {installmentMode ? (
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1 col-span-1">
                <Label className="text-[10px] text-muted-foreground">{isRTL ? "مبلغ کل" : "Total Amount"}</Label>
                <Input type="number" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">{isRTL ? "تعداد اقساط" : "# Installments"}</Label>
                <Input type="number" min={2} max={36} value={numberOfInstallments} onChange={(e) => setNumberOfInstallments(e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">{isRTL ? "تاریخ شروع" : "Start Date"}</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8 text-xs" />
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">{isRTL ? "مبلغ (تومان)" : "Amount (Toman)"}</Label>
                  <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">{isRTL ? "نوع پرداخت" : "Payment Type"}</Label>
                  <Select value={paymentType} onValueChange={setPaymentType}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PAYMENT_TYPE_CONFIG).map(([k, c]) => (
                        <SelectItem key={k} value={k}>{isRTL ? c.labelFa : c.labelEn}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">{isRTL ? "روش پرداخت" : "Payment Method"}</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PAYMENT_METHOD_CONFIG).map(([k, c]) => (
                        <SelectItem key={k} value={k}>{isRTL ? c.labelFa : c.labelEn}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">{isRTL ? "شماره پیگیری" : "Reference"}</Label>
                  <Input value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder="optional" className="h-8 text-xs" dir="ltr" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">{isRTL ? "تاریخ سررسید" : "Due Date"}</Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">{isRTL ? "تاریخ پرداخت" : "Paid Date"}</Label>
                  <Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} className="h-8 text-xs" />
                  <p className="text-[9px] text-muted-foreground">{isRTL ? "اگر پر شود، وضعیت خودکار «پرداخت‌شده» می‌شود" : "If set, status auto becomes 'paid'"}</p>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">{isRTL ? "یادداشت" : "Notes"}</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="text-xs" />
              </div>
            </>
          )}
        </div>
        <div className={cn("flex items-center gap-2 pt-2", isRTL && "flex-row-reverse")}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>{isRTL ? "انصراف" : "Cancel"}</Button>
          <Button size="sm" onClick={handleCreate} disabled={saving} className="gap-1 ms-auto">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {installmentMode ? (isRTL ? "ایجاد طرح قسطی" : "Create Plan") : (isRTL ? "ثبت پرداخت" : "Record")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Tuition Dialog ─────────────────────────
function EditTuitionDialog({
  enrollment, open, onClose, onSaved, isRTL,
}: {
  enrollment: EnrollmentRecord;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  isRTL: boolean;
}) {
  const [tuitionAmount, setTuitionAmount] = useState(String(enrollment.tuitionAmount || ""));
  const [paymentStatus, setPaymentStatus] = useState(enrollment.paymentStatus);
  const [paymentDueDate, setPaymentDueDate] = useState(enrollment.paymentDueDate ? enrollment.paymentDueDate.slice(0, 10) : "");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const t = Number(tuitionAmount);
    if (!Number.isFinite(t) || t < 0) {
      toast.error(isRTL ? "مبلغ شهریه نامعتبر است" : "Invalid tuition amount");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        tuitionAmount: t,
        paymentStatus,
        paymentDueDate: paymentDueDate || null,
      };
      if (notes) body.notes = notes;
      const res = await authFetch(`/api/admin/enrollments/${enrollment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(isRTL ? "شهریه با موفقیت ویرایش شد" : "Tuition updated successfully");
        onSaved();
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || (isRTL ? "خطا در ویرایش" : "Failed to update"));
      }
    } catch {
      toast.error(isRTL ? "خطا در ارتباط" : "Connection error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-primary" />
            {isRTL ? "ویرایش شهریه" : "Edit Tuition"}
          </DialogTitle>
          <DialogDescription className="sr-only">{isRTL ? "ویرایش مبلغ و وضعیت شهریه" : "Edit tuition amount and payment status"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-xs">
          <div className="rounded-md bg-muted/30 p-2.5 space-y-1">
            <div className={cn("flex justify-between", isRTL && "flex-row-reverse")}>
              <span className="text-muted-foreground">{isRTL ? "هنرجو" : "Student"}</span>
              <span className="font-medium">{enrollment.student.name}</span>
            </div>
            <div className={cn("flex justify-between", isRTL && "flex-row-reverse")}>
              <span className="text-muted-foreground">{isRTL ? "دوره" : "Course"}</span>
              <span className="font-medium">{isRTL ? enrollment.course.titleFa : enrollment.course.titleEn}</span>
            </div>
            <div className={cn("flex justify-between", isRTL && "flex-row-reverse")}>
              <span className="text-muted-foreground">{isRTL ? "قیمت پایه دوره" : "Course Base Price"}</span>
              <span className="font-medium">{formatToman(enrollment.course.price, isRTL)}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">{isRTL ? "مبلغ شهریه (تومان)" : "Tuition Amount (Toman)"}</Label>
              <Input type="number" value={tuitionAmount} onChange={(e) => setTuitionAmount(e.target.value)} className="h-8 text-xs" />
              <p className="text-[9px] text-muted-foreground">{isRTL ? "قابل تنظیم توسط مدیر (مثلاً ۵٬۰۰۰٬۰۰۰)" : "Admin-adjustable (e.g. 5,000,000)"}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">{isRTL ? "وضعیت پرداخت" : "Payment Status"}</Label>
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_STATUS_CONFIG).map(([k, c]) => (
                    <SelectItem key={k} value={k}>{isRTL ? c.labelFa : c.labelEn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">{isRTL ? "تاریخ سررسید" : "Due Date"}</Label>
            <Input type="date" value={paymentDueDate} onChange={(e) => setPaymentDueDate(e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">{isRTL ? "یادداشت مدیر (اختیاری)" : "Admin Note (optional)"}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="text-xs" placeholder={isRTL ? "مثلاً: تخفیف ویژه، توافق شفاهی، …" : "e.g. discount, verbal agreement, …"} />
          </div>
        </div>
        <div className={cn("flex items-center gap-2 pt-2", isRTL && "flex-row-reverse")}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>{isRTL ? "انصراف" : "Cancel"}</Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1 ms-auto">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {isRTL ? "ذخیره" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Payment Dialog (super_admin only) ────
function DeletePaymentDialog({
  payment, open, onClose, onDeleted, isRTL,
}: {
  payment: PaymentRecord;
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
  isRTL: boolean;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const isConfirmed = confirmText === (isRTL ? "حذف" : "DELETE");

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await authFetch(`/api/admin/payments/${payment.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(isRTL ? "پرداخت حذف شد" : "Payment deleted");
        onDeleted();
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || (isRTL ? "خطا در حذف" : "Failed to delete"));
      }
    } catch {
      toast.error(isRTL ? "خطا در ارتباط" : "Connection error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) { setConfirmText(""); onClose(); } }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
            {isRTL ? "حذف رکورد پرداخت" : "Delete Payment Record"}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 pt-2">
            <span className="block">
              {isRTL
                ? `در حال حذف پرداخت ${formatToman(payment.amount, isRTL)} متعلق به ${payment.student.name} هستید. این عمل قابل بازگشت نیست.`
                : `You are about to delete a ${formatToman(payment.amount, isRTL)} payment by ${payment.student.name}. This action cannot be undone.`}
            </span>
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">
                {isRTL ? 'برای تایید، لطفاً «حذف» را تایپ کنید:' : 'To confirm, please type "DELETE":'}
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={isRTL ? "حذف" : "DELETE"}
                className="h-9 text-sm"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmText("")} disabled={deleting}>{isRTL ? "انصراف" : "Cancel"}</AlertDialogCancel>
          <AlertDialogAction
            disabled={!isConfirmed || deleting}
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin me-1" /> : null}
            {isRTL ? "حذف شود" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
interface SuperAdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SuperAdminPanel({ isOpen, onClose }: SuperAdminPanelProps) {
  const { isRTL } = useI18n();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { isSuperAdmin, canAccessTab } = useAdminPermissions();
  const [activeTab, setActiveTab] = useState<TabValue>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [lastRegCount, setLastRegCount] = useState(0);
  const [pendingRegCount, setPendingRegCount] = useState(0);

  // Auto-collapse sidebar on small screens (≤ 768px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Filter tabs based on permissions — sub-admins only see tabs they have access to
  const visibleTabs = useMemo(() => TABS.filter((t) => canAccessTab(t.value)), [canAccessTab, isSuperAdmin]);

  // Guarded tab setter — prevents navigation to unauthorized tabs
  const guardedSetTab = useCallback((tab: TabValue) => {
    if (canAccessTab(tab)) {
      setActiveTab(tab);
      setMobileSidebarOpen(false); // Close mobile sidebar on tab select
    } else {
      // Fallback to dashboard if user tries to navigate to an unauthorized tab
      setActiveTab("dashboard");
    }
  }, [canAccessTab]);

  // Poll for new registrations for badge notification (only when panel is open)
  useEffect(() => {
    if (!isOpen) return;
    const poll = () => {
      authFetch("/api/admin/enrollments?limit=1").then(r => r.ok ? r.json() : null).then(d => {
        if (d && d.total) setLastRegCount(d.total);
      }).catch(() => {});
      authFetch("/api/registration/pending?status=pending&limit=1").then(r => r.ok ? r.json() : null).then(d => {
        if (d) setPendingRegCount(d.summary?.pending || 0);
      }).catch(() => {});
    };
    poll();
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <div
      className="h-full w-full bg-background flex"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Sidebar — desktop (fixed) + mobile (overlay) */}
      <>
        {/* Mobile overlay backdrop */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
        <aside
          className={cn(
            "h-full bg-muted/30 border-e border-border flex flex-col shrink-0 overflow-hidden transition-all duration-200 relative z-50",
            sidebarOpen ? "w-56" : "w-16",
            // Mobile: overlay mode
            "max-md:fixed max-md:top-0 max-md:bottom-0 max-md:left-0 max-md:z-50 max-md:transition-transform",
            isRTL && "max-md:left-auto max-md:right-0",
            mobileSidebarOpen ? "max-md:translate-x-0" : (isRTL ? "max-md:translate-x-full" : "max-md:-translate-x-full")
          )}
        >
        {/* Header — when collapsed, only show the toggle button (centered) */}
        <div
          className={cn(
            "flex items-center gap-2 p-3 border-b border-border",
            isRTL && "flex-row-reverse",
            !sidebarOpen && "justify-center"
          )}
        >
          {sidebarOpen && (
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-primary" />
            </div>
          )}
          {sidebarOpen && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold truncate">{isRTL ? "مهر آوای بلوط" : "MAB Admin"}</p>
              <p className="text-[9px] text-muted-foreground truncate">{user?.name || "Super Admin"}</p>
            </div>
          )}
          {/* Toggle button — always visible, even when sidebar is collapsed */}
          <Button
            size="sm"
            variant="ghost"
            className={cn("h-7 w-7 p-0 shrink-0", sidebarOpen && "ms-auto")}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? (isRTL ? "بستن نوار" : "Collapse") : (isRTL ? "باز کردن نوار" : "Expand")}
          >
            <ChevronDown className={cn("w-4 h-4 transition-transform", !sidebarOpen && "-rotate-90")} />
          </Button>
        </div>

        {/* Tabs — filtered by user permissions (sub-admins only see permitted tabs) */}
        <ScrollArea className="flex-1">
          <nav className={cn("p-1.5 space-y-0.5", !sidebarOpen && "px-1")}>
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              const showNotifBadge = tab.value === "registrations" && lastRegCount > 0;
              const showPendingBadge = tab.value === "pending-registrations" && pendingRegCount > 0;
              return (
                <button
                  key={tab.value}
                  onClick={() => guardedSetTab(tab.value)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs transition-colors",
                    isRTL && "flex-row-reverse",
                    !sidebarOpen && "justify-center px-0",
                    isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  title={!sidebarOpen ? (isRTL ? tab.labelFa : tab.labelEn) : undefined}
                >
                  <div className="relative">
                    <Icon className="w-4 h-4 shrink-0" />
                    {showNotifBadge && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
                    {showPendingBadge && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                  </div>
                  {sidebarOpen && <span className="truncate">{isRTL ? tab.labelFa : tab.labelEn}</span>}
                  {showNotifBadge && sidebarOpen && <Badge className="bg-rose-500/10 text-rose-600 text-[8px] px-1 ms-auto">{isRTL ? "جدید" : "NEW"}</Badge>}
                  {showPendingBadge && sidebarOpen && <Badge className="bg-amber-500/10 text-amber-600 text-[8px] px-1 ms-auto">{pendingRegCount}</Badge>}
                </button>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Bottom Actions */}
        <div className={cn("p-2 border-t border-border space-y-1", !sidebarOpen && "px-1")}>
          <Button
            size="sm"
            variant="ghost"
            className={cn("w-full justify-start gap-2 text-xs text-muted-foreground hover:text-foreground", !sidebarOpen && "justify-center px-0")}
            onClick={onClose}
            title={!sidebarOpen ? (isRTL ? "بازگشت به سایت" : "Back to Site") : undefined}
          >
            <X className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span>{isRTL ? "بازگشت به سایت" : "Back to Site"}</span>}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={cn("w-full justify-start gap-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10", !sidebarOpen && "justify-center px-0")}
            onClick={handleLogout}
            title={!sidebarOpen ? (isRTL ? "خروج" : "Logout") : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span>{isRTL ? "خروج" : "Logout"}</span>}
          </Button>
        </div>
        </aside>
      </>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className={cn("flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-border bg-background", isRTL && "flex-row-reverse")}>
          {/* Mobile menu button */}
          <Button
            size="sm"
            variant="ghost"
            className="md:hidden h-8 w-8 p-0 shrink-0"
            onClick={() => setMobileSidebarOpen(true)}
            title={isRTL ? "منو" : "Menu"}
          >
            <Menu className="w-4 h-4" />
          </Button>
          <h2 className="text-sm font-semibold">
            {TABS.find((t) => t.value === activeTab)?.[isRTL ? "labelFa" : "labelEn"]}
          </h2>
          <div className="ms-auto flex items-center gap-2">
            {user && (
              <span className="text-xs text-muted-foreground hidden sm:block">
                {user.role === "super_admin" ? (isRTL ? "سوپر ادمین" : "Super Admin") : (isRTL ? "مدیر" : "Admin")}
              </span>
            )}
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onClose}><X className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* Tab Content */}
        <ScrollArea className="flex-1">
          <div className="p-4 sm:p-6">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
              {activeTab === "dashboard" && <DashboardTab isRTL={isRTL} onNavigate={(tab) => guardedSetTab(tab as TabValue)} />}
              {activeTab === "users" && <UnifiedUsersTab isRTL={isRTL} />}
              {activeTab === "instructors" && <InstructorsTab isRTL={isRTL} />}
              {activeTab === "courses" && <CoursesTab isRTL={isRTL} />}
              {activeTab === "content" && <ContentTab isRTL={isRTL} />}
              {activeTab === "class-schedules" && <ClassSchedulesTab isRTL={isRTL} />}
              {activeTab === "schedule-requests" && <ScheduleRequestsTab isRTL={isRTL} />}
              {activeTab === "registrations" && <RegistrationsTab isRTL={isRTL} />}
              {activeTab === "pending-registrations" && <PendingRegistrationsTab isRTL={isRTL} />}
              {activeTab === "workshop-tickets" && <WorkshopTicketsTab isRTL={isRTL} />}
              {activeTab === "financial" && <FinancialTab isRTL={isRTL} />}
              {activeTab === "messages" && <MessagesTab isRTL={isRTL} />}
              {activeTab === "testimonials" && <TestimonialsTab isRTL={isRTL} />}
              {/* Super-admin-only tabs — defense in depth (UI filter + component guard) */}
              {activeTab === "security" && (isSuperAdmin ? <SecurityTab isRTL={isRTL} /> : <AccessDenied />)}
              {activeTab === "backups" && (isSuperAdmin ? <BackupsTab isRTL={isRTL} /> : <AccessDenied />)}
              {activeTab === "analytics" && <AnalyticsTab isRTL={isRTL} />}
              {activeTab === "audit-logs" && (isSuperAdmin ? <AuditLogsTab isRTL={isRTL} /> : <AccessDenied />)}
              {activeTab === "settings" && (isSuperAdmin ? <SettingsTab isRTL={isRTL} /> : <AccessDenied />)}
            </motion.div>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
