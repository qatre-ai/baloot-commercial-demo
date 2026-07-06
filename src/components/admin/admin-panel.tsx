"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuthStore, authFetch } from "@/lib/auth/store";
import { toast } from "sonner";
import { toPersianDigits, formatJalaaliDate, getCurrentJalaali, JALALI_MONTHS_FA, JALALI_MONTHS_EN } from "@/lib/jalali";
import { RegistrationForm } from "@/components/auth/registration-form";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Megaphone, Plus, Trash2, Edit3, Pin, Eye, EyeOff,
  Bell, GraduationCap, CalendarDays, AlertTriangle, Gift,
  Music, RefreshCw, CheckCircle2, XCircle, Users, UserPlus,
  Shield, Mail, Phone, Clock, User, Search,
  Flame, DollarSign, Tag, X,
  BookOpen, ChevronDown, ChevronUp, Star, Palette, FileText,
  Globe, Settings2, PenLine, Image as ImageIcon, MapPin,
  Heart, Share2, Zap, Flag, CreditCard, Wallet, Monitor,
  PhoneCall, UserCheck, Receipt, Check, CircleDot, ArrowRight,
  MessageSquare, Sparkles, Lock, Unlock, BarChart3, Hash,
  CalendarClock, CalendarX, CalendarCheck, Timer, DoorOpen, Repeat,
  Send, ThumbsUp, ThumbsDown, AlertCircle, ClipboardList,
  Loader2, LogOut, LayoutDashboard, Activity,
  HelpCircle,
  FileQuestion
} from "lucide-react";

// ============================================
// Types
// ============================================
interface Announcement {
  id: string;
  titleFa: string;
  titleEn: string;
  contentFa: string | null;
  contentEn: string | null;
  type: string;
  priority: number;
  imageUrl: string | null;
  isPublished: boolean;
  isPinned: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  avatarUrl: string | null;
  lastLogin: string | null;
  createdAt: string;
  _count?: { tickets: number };
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
  startTime: string | null;
  endTime: string | null;
  price: number | null;
  discountPrice: number | null;
  totalSeats: number;
  reservedSeats: number;
  imageUrl: string | null;
  coverUrl: string | null;
  category: string | null;
  locationFa: string | null;
  locationEn: string | null;
  requirementsFa: string | null;
  requirementsEn: string | null;
  highlightsFa: string | null;
  highlightsEn: string | null;
  contactPhone: string | null;
  registrationDeadline: string | null;
  isHot: boolean;
  isPublished: boolean;
  registrationOpen: boolean;
  branchId: string | null;
  createdAt: string;
}

interface BlogCategory {
  id: string;
  nameFa: string;
  nameEn: string;
  slugFa: string;
  slugEn: string;
  descriptionFa: string | null;
  descriptionEn: string | null;
  color: string | null;
  icon: string | null;
  order: number;
  isPublished: boolean;
  createdAt: string;
  _count?: { posts: number };
}

interface BlogPost {
  id: string;
  titleFa: string;
  titleEn: string;
  slugFa: string;
  slugEn: string;
  contentFa: string | null;
  contentEn: string | null;
  excerptFa: string | null;
  excerptEn: string | null;
  coverUrl: string | null;
  coverAltFa: string | null;
  coverAltEn: string | null;
  tags: string | null;
  metaTitleFa: string | null;
  metaTitleEn: string | null;
  metaDescriptionFa: string | null;
  metaDescriptionEn: string | null;
  keywords: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  isShowOnHome: boolean;
  order: number;
  readingTime: number;
  viewCount: number;
  uniqueViewCount: number;
  shareCount: number;
  likeCount: number;
  avgReadTime: number;
  bounceRate: number;
  publishedAt: string | null;
  createdAt: string;
  categories: Array<{ id: string; nameFa: string; nameEn: string; slugFa: string; slugEn: string; color: string | null; icon: string | null }>;
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
  classType: string;
  sessionsMin: number | null;
  sessionsMax: number | null;
  price: number | null;
  imageUrl: string | null;
  coverUrl: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  isShowOnHome: boolean;
  isNew: boolean;
  branchId: string | null;
  instructorId: string | null;
  registrationOpen: boolean;
  registrationOpenAt: string | null;
  registrationCloseAt: string | null;
  maxCapacity: number | null;
  createdAt: string;
  branch?: { id: string; nameFa: string; nameEn: string } | null;
  instructor?: { id: string; name: string; specialtyFa: string | null; specialtyEn: string | null; avatarUrl: string | null } | null;
  _count?: { enrollments: number };
}

interface AdminMessageItem {
  id: string;
  senderId: string;
  recipientId: string;
  subject: string;
  content: string;
  priority: string;
  status: string;
  parentMessageId: string | null;
  isSystemMessage: boolean;
  readAt: string | null;
  archivedBy: string | null;
  createdAt: string;
  updatedAt: string;
  sender: { id: string; name: string; email: string; role: string; avatarUrl: string | null };
  recipient: { id: string; name: string; email: string; role: string; avatarUrl: string | null };
}

interface ClassScheduleItem {
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
  course: {
    id: string;
    titleFa: string;
    titleEn: string;
    instrument: string | null;
    level: string;
    classType: string;
  };
  instructor: {
    id: string;
    name: string;
    specialtyFa: string | null;
    specialtyEn: string | null;
  };
  branch?: {
    id: string;
    nameFa: string;
    nameEn: string;
  } | null;
  _count?: { changeRequests: number };
}

interface ScheduleChangeRequestItem {
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
  instructor: {
    id: string;
    name: string;
    phone: string | null;
    specialtyFa: string | null;
    specialtyEn: string | null;
  };
  course: {
    id: string;
    titleFa: string;
    titleEn: string;
    instrument: string | null;
    level: string;
    classType: string;
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

interface Enrollment {
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
    id: string;
    name: string;
    email: string;
    phone: string | null;
    primaryInstrument: string | null;
    registrationInstrument: string | null;
  };
  course: {
    id: string;
    titleFa: string;
    titleEn: string;
    instrument: string | null;
    level: string | null;
    price: number | null;
    sessionsMin: number | null;
    sessionsMax: number | null;
    branch: { id: string; nameFa: string; nameEn: string } | null;
  };
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    paymentType: string | null;
    paymentMethod: string | null;
    paidAt: string | null;
    paymentRef: string | null;
    installmentNumber: number | null;
    totalInstallments: number | null;
    dueDate: string | null;
  }>;
}

// ============================================
// Dashboard Data Types
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
  unreadContactMessages: number;
  unreadAdminMessages: number;
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
  recentEnrollmentsList: Array<{
    id: string; status: string; enrolledAt: string; registrationMethod: string; paymentStatus: string;
    tuitionAmount: number | null;
    student: { id: string; name: string; phone: string | null; email: string };
    course: { id: string; titleFa: string; titleEn: string; instrument: string | null };
  }>;
  upcomingWorkshops: Array<{
    id: string; titleFa: string; titleEn: string; date: string;
    totalSeats: number; reservedSeats: number; category: string | null; isHot: boolean;
  }>;
  recentRegistrations: Array<{
    id: string; name: string; email: string; phone: string | null;
    role: string; createdAt: string; primaryInstrument: string | null;
  }>;
}

// ============================================
// Registration & Payment Constants
// ============================================
const PAYMENT_STATUS_CONFIG: Record<string, { labelFa: string; labelEn: string; color: string; bgColor: string }> = {
  paid: { labelFa: "پرداخت شده", labelEn: "Paid", color: "text-green-600", bgColor: "bg-green-500/10" },
  unpaid: { labelFa: "پرداخت نشده", labelEn: "Unpaid", color: "text-red-600", bgColor: "bg-red-500/10" },
  partial: { labelFa: "پرداخت جزئی", labelEn: "Partial", color: "text-amber-600", bgColor: "bg-amber-500/10" },
  waived: { labelFa: "معاف", labelEn: "Waived", color: "text-gray-500", bgColor: "bg-gray-500/10" },
};

const REGISTRATION_METHOD_CONFIG: Record<string, { labelFa: string; labelEn: string; icon: typeof Monitor; color: string }> = {
  online: { labelFa: "آنلاین", labelEn: "Online", icon: Monitor, color: "text-blue-500" },
  phone: { labelFa: "تلفنی", labelEn: "Phone", icon: PhoneCall, color: "text-amber-500" },
  in_person: { labelFa: "حضوری", labelEn: "In Person", icon: UserCheck, color: "text-green-500" },
};

const ENROLLMENT_STATUS_CONFIG: Record<string, { labelFa: string; labelEn: string; color: string; bgColor: string }> = {
  active: { labelFa: "فعال", labelEn: "Active", color: "text-green-600", bgColor: "bg-green-500/10" },
  completed: { labelFa: "تکمیل شده", labelEn: "Completed", color: "text-blue-600", bgColor: "bg-blue-500/10" },
  paused: { labelFa: "متوقف", labelEn: "Paused", color: "text-amber-600", bgColor: "bg-amber-500/10" },
  dropped: { labelFa: "ترک کرده", labelEn: "Dropped", color: "text-red-600", bgColor: "bg-red-500/10" },
};

// ============================================
// Type options for announcements
// ============================================
const typeOptions = [
  { value: "info", labelFa: "اطلاعیه", labelEn: "Info", icon: Bell, color: "text-primary" },
  { value: "workshop", labelFa: "کارگاه", labelEn: "Workshop", icon: GraduationCap, color: "text-gold" },
  { value: "event", labelFa: "رویداد", labelEn: "Event", icon: CalendarDays, color: "text-primary" },
  { value: "urgent", labelFa: "فوری", labelEn: "Urgent", icon: AlertTriangle, color: "text-destructive" },
  { value: "promo", labelFa: "پیشنهاد ویژه", labelEn: "Promo", icon: Gift, color: "text-gold" },
  { value: "course", labelFa: "دوره جدید", labelEn: "Course", icon: Music, color: "text-primary" },
];

const workshopCategories = [
  { value: "improvisation", labelFa: "بداهه‌نوازی", labelEn: "Improvisation" },
  { value: "vocal", labelFa: "آواز", labelEn: "Vocal" },
  { value: "composition", labelFa: "آهنگسازی", labelEn: "Composition" },
  { value: "production", labelFa: "تولید موسیقی", labelEn: "Music Production" },
  { value: "technique", labelFa: "تکنیک نوازندگی", labelEn: "Performance Technique" },
  { value: "theory", labelFa: "تئوری موسیقی", labelEn: "Music Theory" },
  { value: "masterclass", labelFa: "مستربلاس", labelEn: "Masterclass" },
];

const predefinedColors = [
  "#8B2252", "#D4A843", "#2D5F3F", "#6B4C8A", "#C4784A",
  "#3D7A8A", "#B83232", "#4A7C3F", "#8B6914", "#5B6ABF",
  "#9B4DCA", "#2B8A94", "#C25450", "#6B8E23", "#D2691E",
];

const courseCategories = [
  { value: "instrument", labelFa: "ساز", labelEn: "Instrument" },
  { value: "vocal", labelFa: "آواز", labelEn: "Vocal" },
  { value: "theory", labelFa: "تئوری", labelEn: "Theory" },
  { value: "production", labelFa: "تولید موسیقی", labelEn: "Production" },
  { value: "composition", labelFa: "آهنگسازی", labelEn: "Composition" },
];

const courseLevels = [
  { value: "all", labelFa: "همه سطوح", labelEn: "All Levels" },
  { value: "beginner", labelFa: "مبتدی", labelEn: "Beginner" },
  { value: "intermediate", labelFa: "متوسط", labelEn: "Intermediate" },
  { value: "advanced", labelFa: "پیشرفته", labelEn: "Advanced" },
];

const instrumentOptions = [
  { value: "piano", labelFa: "پیانو", labelEn: "Piano" },
  { value: "guitar", labelFa: "گیتار", labelEn: "Guitar" },
  { value: "violin", labelFa: "ویولن", labelEn: "Violin" },
  { value: "setar", labelFa: "سه‌تار", labelEn: "Setar" },
  { value: "tar", labelFa: "تار", labelEn: "Tar" },
  { value: "kamancheh", labelFa: "کمانچه", labelEn: "Kamancheh" },
  { value: "drums", labelFa: "درامز", labelEn: "Drums" },
  { value: "vocals", labelFa: "آواز", labelEn: "Vocals" },
  { value: "santur", labelFa: "سنتور", labelEn: "Santur" },
  { value: "oud", labelFa: "عود", labelEn: "Oud" },
  { value: "flute", labelFa: "فلوت", labelEn: "Flute" },
  { value: "daf", labelFa: "دف", labelEn: "Daf" },
  { value: "tonbak", labelFa: "تنبک", labelEn: "Tonbak" },
  { value: "clarinet", labelFa: "کلارینت", labelEn: "Clarinet" },
  { value: "cello", labelFa: "ویولنسل", labelEn: "Cello" },
  { value: "other", labelFa: "سایر", labelEn: "Other" },
];

const messagePriorityConfig: Record<string, { labelFa: string; labelEn: string; color: string; bgColor: string }> = {
  urgent: { labelFa: "فوری", labelEn: "Urgent", color: "text-red-600", bgColor: "bg-red-500/10" },
  high: { labelFa: "مهم", labelEn: "High", color: "text-amber-600", bgColor: "bg-amber-500/10" },
  normal: { labelFa: "عادی", labelEn: "Normal", color: "text-muted-foreground", bgColor: "bg-muted" },
  low: { labelFa: "کم", labelEn: "Low", color: "text-gray-400", bgColor: "bg-gray-500/10" },
};

// ============================================
// Schedule & Request Constants
// ============================================
const persianDays = [
  { value: 0, labelFa: "شنبه", labelEn: "Saturday" },
  { value: 1, labelFa: "یکشنبه", labelEn: "Sunday" },
  { value: 2, labelFa: "دوشنبه", labelEn: "Monday" },
  { value: 3, labelFa: "سه‌شنبه", labelEn: "Tuesday" },
  { value: 4, labelFa: "چهارشنبه", labelEn: "Wednesday" },
  { value: 5, labelFa: "پنجشنبه", labelEn: "Thursday" },
  { value: 6, labelFa: "جمعه", labelEn: "Friday" },
];

const scheduleStatusConfig: Record<string, { labelFa: string; labelEn: string; color: string; bgColor: string }> = {
  active: { labelFa: "فعال", labelEn: "Active", color: "text-green-600", bgColor: "bg-green-500/10" },
  cancelled: { labelFa: "لغو شده", labelEn: "Cancelled", color: "text-red-600", bgColor: "bg-red-500/10" },
  completed: { labelFa: "تکمیل شده", labelEn: "Completed", color: "text-blue-600", bgColor: "bg-blue-500/10" },
};

const requestTypeConfig: Record<string, { labelFa: string; labelEn: string; color: string; bgColor: string }> = {
  time_change: { labelFa: "تغییر زمان", labelEn: "Time Change", color: "text-amber-600", bgColor: "bg-amber-500/10" },
  cancellation: { labelFa: "لغو کلاس", labelEn: "Cancellation", color: "text-red-600", bgColor: "bg-red-500/10" },
  room_change: { labelFa: "تغییر اتاق", labelEn: "Room Change", color: "text-blue-600", bgColor: "bg-blue-500/10" },
  reschedule: { labelFa: "جابجایی", labelEn: "Reschedule", color: "text-purple-600", bgColor: "bg-purple-500/10" },
};

const requestStatusConfig: Record<string, { labelFa: string; labelEn: string; color: string; bgColor: string }> = {
  pending: { labelFa: "در انتظار", labelEn: "Pending", color: "text-amber-600", bgColor: "bg-amber-500/10" },
  approved: { labelFa: "تأیید شده", labelEn: "Approved", color: "text-green-600", bgColor: "bg-green-500/10" },
  rejected: { labelFa: "رد شده", labelEn: "Rejected", color: "text-red-600", bgColor: "bg-red-500/10" },
};

const classTypeOptions = [
  { value: "group", labelFa: "گروهی", labelEn: "Group" },
  { value: "private", labelFa: "خصوصی", labelEn: "Private" },
];

// ============================================
// Helper: generate slug from title
// ============================================
function generateSlugEn(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function generateSlugFa(title: string): string {
  return title
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// ============================================
// Announcement Form
// ============================================
function AnnouncementForm({
  initialData,
  onSave,
  isRTL,
}: {
  initialData: Partial<Announcement> | null;
  onSave: (data: Record<string, unknown>) => void;
  isRTL: boolean;
}) {
  const [form, setForm] = useState({
    titleFa: initialData?.titleFa || "",
    titleEn: initialData?.titleEn || "",
    contentFa: initialData?.contentFa || "",
    contentEn: initialData?.contentEn || "",
    type: initialData?.type || "info",
    priority: initialData?.priority || 0,
    imageUrl: initialData?.imageUrl || "",
    isPublished: initialData?.isPublished ?? false,
    isPinned: initialData?.isPinned ?? false,
    expiresAt: initialData?.expiresAt?.split("T")[0] || "",
  });

  const updateField = (field: string, value: string | number | boolean | string[]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{isRTL ? "نوع اعلان" : "Type"}</Label>
          <Select value={form.type} onValueChange={(v) => updateField("type", v)}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {typeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="flex items-center gap-2">
                    <opt.icon className={cn("w-4 h-4", opt.color)} />
                    {isRTL ? opt.labelFa : opt.labelEn}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">{isRTL ? "اولویت" : "Priority"}</Label>
          <Input type="number" min={0} max={100} value={form.priority}
            onChange={(e) => updateField("priority", parseInt(e.target.value) || 0)} className="rounded-xl" />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">{isRTL ? "عنوان (فارسی)" : "Title (Farsi)"} *</Label>
        <Input value={form.titleFa} onChange={(e) => updateField("titleFa", e.target.value)}
          className="rounded-xl" placeholder={isRTL ? "عنوان فارسی..." : "Farsi title..."} dir="rtl" />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">{isRTL ? "عنوان (انگلیسی)" : "Title (English)"} *</Label>
        <Input value={form.titleEn} onChange={(e) => updateField("titleEn", e.target.value)}
          className="rounded-xl" placeholder="English title..." dir="ltr" />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">{isRTL ? "محتوا (فارسی)" : "Content (Farsi)"}</Label>
        <Textarea value={form.contentFa} onChange={(e) => updateField("contentFa", e.target.value)}
          className="rounded-xl resize-none" rows={2} dir="rtl" />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">{isRTL ? "محتوا (انگلیسی)" : "Content (English)"}</Label>
        <Textarea value={form.contentEn} onChange={(e) => updateField("contentEn", e.target.value)}
          className="rounded-xl resize-none" rows={2} dir="ltr" />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">{isRTL ? "آدرس تصویر" : "Image URL"}</Label>
        <Input value={form.imageUrl} onChange={(e) => updateField("imageUrl", e.target.value)}
          className="rounded-xl" placeholder="https://..." dir="ltr" />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">{isRTL ? "تاریخ انقضا" : "Expires At"}</Label>
        <Input type="date" value={form.expiresAt} onChange={(e) => updateField("expiresAt", e.target.value)}
          className="rounded-xl" dir="ltr" />
      </div>
      <div className={cn("flex items-center gap-6", isRTL && "flex-row-reverse")}>
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <Switch checked={form.isPublished} onCheckedChange={(v) => updateField("isPublished", v)} />
          <Label className="text-sm">{isRTL ? "انتشار" : "Published"}</Label>
        </div>
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <Switch checked={form.isPinned} onCheckedChange={(v) => updateField("isPinned", v)} />
          <Label className="text-sm">{isRTL ? "سنجاق‌شده" : "Pinned"}</Label>
        </div>
      </div>
      <Button onClick={() => onSave(form)}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
        {initialData?.id ? (isRTL ? "بروزرسانی" : "Update") : (isRTL ? "ایجاد اعلان" : "Create Announcement")}
      </Button>
    </div>
  );
}

// ============================================
// Workshop Form
// ============================================
function WorkshopForm({
  initialData,
  onSave,
  isRTL,
}: {
  initialData: Partial<Workshop> | null;
  onSave: (data: Record<string, unknown>) => void;
  isRTL: boolean;
}) {
  const [formTab, setFormTab] = useState("basic");
  const [form, setForm] = useState({
    titleFa: initialData?.titleFa || "",
    titleEn: initialData?.titleEn || "",
    descriptionFa: initialData?.descriptionFa || "",
    descriptionEn: initialData?.descriptionEn || "",
    instructorFa: initialData?.instructorFa || "",
    instructorEn: initialData?.instructorEn || "",
    date: initialData?.date ? new Date(initialData.date).toISOString().split("T")[0] : "",
    startTime: initialData?.startTime || "",
    endTime: initialData?.endTime || "",
    price: initialData?.price ?? "",
    discountPrice: initialData?.discountPrice ?? "",
    totalSeats: initialData?.totalSeats ?? 30,
    imageUrl: initialData?.imageUrl || "",
    coverUrl: initialData?.coverUrl || "",
    category: initialData?.category || "",
    locationFa: initialData?.locationFa || "",
    locationEn: initialData?.locationEn || "",
    requirementsFa: initialData?.requirementsFa || "",
    requirementsEn: initialData?.requirementsEn || "",
    highlightsFa: initialData?.highlightsFa || "",
    highlightsEn: initialData?.highlightsEn || "",
    contactPhone: initialData?.contactPhone || "",
    registrationDeadline: initialData?.registrationDeadline
      ? new Date(initialData.registrationDeadline).toISOString().split("T")[0]
      : "",
    isHot: initialData?.isHot ?? false,
    isPublished: initialData?.isPublished ?? false,
    registrationOpen: (initialData as Record<string, unknown>)?.registrationOpen ?? true,
    registrationOpenAt: (initialData as Record<string, unknown>)?.registrationOpenAt
      ? new Date((initialData as Record<string, unknown>).registrationOpenAt as string).toISOString().split("T")[0]
      : "",
    registrationCloseAt: (initialData as Record<string, unknown>)?.registrationCloseAt
      ? new Date((initialData as Record<string, unknown>).registrationCloseAt as string).toISOString().split("T")[0]
      : "",
  });

  const updateField = (field: string, value: string | number | boolean | string[]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
      <Tabs value={formTab} onValueChange={setFormTab}>
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="basic" className="text-[10px] sm:text-xs gap-1">
            <PenLine className="w-3 h-3 hidden sm:block" />
            {isRTL ? "پایه" : "Basic"}
          </TabsTrigger>
          <TabsTrigger value="details" className="text-[10px] sm:text-xs gap-1">
            <FileText className="w-3 h-3 hidden sm:block" />
            {isRTL ? "جزئیات" : "Details"}
          </TabsTrigger>
          <TabsTrigger value="media" className="text-[10px] sm:text-xs gap-1">
            <ImageIcon className="w-3 h-3 hidden sm:block" />
            {isRTL ? "رسانه" : "Media"}
          </TabsTrigger>
          <TabsTrigger value="pricing" className="text-[10px] sm:text-xs gap-1">
            <DollarSign className="w-3 h-3 hidden sm:block" />
            {isRTL ? "قیمت" : "Pricing"}
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-[10px] sm:text-xs gap-1">
            <Settings2 className="w-3 h-3 hidden sm:block" />
            {isRTL ? "تنظیمات" : "Settings"}
          </TabsTrigger>
        </TabsList>

        {/* Basic Tab */}
        <TabsContent value="basic" className="space-y-4 mt-3">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {isRTL ? "ساعت شروع" : "Start Time"}
              </Label>
              <Input type="time" value={form.startTime} onChange={(e) => updateField("startTime", e.target.value)}
                className="rounded-xl" dir="ltr" placeholder="14:00" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {isRTL ? "ساعت پایان" : "End Time"}
              </Label>
              <Input type="time" value={form.endTime} onChange={(e) => updateField("endTime", e.target.value)}
                className="rounded-xl" dir="ltr" placeholder="17:00" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4 mt-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">{isRTL ? "توضیحات (فارسی)" : "Description (Farsi)"}</Label>
            <Textarea value={form.descriptionFa} onChange={(e) => updateField("descriptionFa", e.target.value)}
              className="rounded-xl resize-none" rows={3} dir="rtl"
              placeholder={isRTL ? "توضیحات کارگاه به فارسی..." : "Workshop description in Farsi..."} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">{isRTL ? "توضیحات (انگلیسی)" : "Description (English)"}</Label>
            <Textarea value={form.descriptionEn} onChange={(e) => updateField("descriptionEn", e.target.value)}
              className="rounded-xl resize-none" rows={3} dir="ltr"
              placeholder="Workshop description in English..." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {isRTL ? "محل برگزاری (فارسی)" : "Location (Farsi)"}
              </Label>
              <Input value={form.locationFa} onChange={(e) => updateField("locationFa", e.target.value)}
                className="rounded-xl" dir="rtl"
                placeholder={isRTL ? "آدرس محل برگزاری..." : "Venue address in Farsi..."} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {isRTL ? "محل برگزاری (انگلیسی)" : "Location (English)"}
              </Label>
              <Input value={form.locationEn} onChange={(e) => updateField("locationEn", e.target.value)}
                className="rounded-xl" dir="ltr"
                placeholder="Venue address in English..." />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">{isRTL ? "پیش‌نیازها (فارسی)" : "Requirements (Farsi)"}</Label>
            <Textarea value={form.requirementsFa} onChange={(e) => updateField("requirementsFa", e.target.value)}
              className="rounded-xl resize-none" rows={2} dir="rtl"
              placeholder={isRTL ? "پیش‌نیازها و وسایل مورد نیاز..." : "Prerequisites & what to bring..."} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">{isRTL ? "پیش‌نیازها (انگلیسی)" : "Requirements (English)"}</Label>
            <Textarea value={form.requirementsEn} onChange={(e) => updateField("requirementsEn", e.target.value)}
              className="rounded-xl resize-none" rows={2} dir="ltr"
              placeholder="Prerequisites & what to bring..." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5" />
                {isRTL ? "نکات برجسته (فارسی)" : "Highlights (Farsi)"}
              </Label>
              <Input value={form.highlightsFa} onChange={(e) => updateField("highlightsFa", e.target.value)}
                className="rounded-xl" dir="rtl"
                placeholder={isRTL ? "نکته۱، نکته۲، نکته۳" : "Highlight 1, Highlight 2, Highlight 3"} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5" />
                {isRTL ? "نکات برجسته (انگلیسی)" : "Highlights (English)"}
              </Label>
              <Input value={form.highlightsEn} onChange={(e) => updateField("highlightsEn", e.target.value)}
                className="rounded-xl" dir="ltr"
                placeholder="Highlight 1, Highlight 2, Highlight 3" />
            </div>
          </div>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-4 mt-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">{isRTL ? "آدرس تصویر کاور" : "Cover Image URL"}</Label>
            <Input value={form.coverUrl} onChange={(e) => updateField("coverUrl", e.target.value)}
              className="rounded-xl" placeholder="https://example.com/cover.jpg" dir="ltr" />
          </div>
          {form.coverUrl && (
            <div className="relative w-full h-40 rounded-xl overflow-hidden border border-border/50">
              <img
                src={form.coverUrl}
                alt="Cover preview"
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{isRTL ? "آدرس تصویر" : "Image URL"}</Label>
            <Input value={form.imageUrl} onChange={(e) => updateField("imageUrl", e.target.value)}
              className="rounded-xl" placeholder="https://example.com/image.jpg" dir="ltr" />
          </div>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-4 mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                {isRTL ? "هزینه (تومان)" : "Price (Toman)"}
              </Label>
              <Input type="number" value={form.price} onChange={(e) => updateField("price", e.target.value)}
                className="rounded-xl" dir="ltr" placeholder="500000" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                {isRTL ? "قیمت تخفیف‌دار (تومان)" : "Discount Price (Toman)"}
              </Label>
              <Input type="number" value={form.discountPrice} onChange={(e) => updateField("discountPrice", e.target.value)}
                className="rounded-xl" dir="ltr" placeholder="350000" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">{isRTL ? "تعداد صندلی‌ها" : "Total Seats"}</Label>
            <Input type="number" min={1} max={500} value={form.totalSeats}
              onChange={(e) => updateField("totalSeats", parseInt(e.target.value) || 30)} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              {isRTL ? "شماره تماس" : "Contact Phone"}
            </Label>
            <Input value={form.contactPhone} onChange={(e) => updateField("contactPhone", e.target.value)}
              className="rounded-xl" dir="ltr" placeholder="09121234567" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              {isRTL ? "مهلت ثبت‌نام" : "Registration Deadline"}
            </Label>
            <Input type="date" value={form.registrationDeadline} onChange={(e) => updateField("registrationDeadline", e.target.value)}
              className="rounded-xl" dir="ltr" />
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4 mt-3">
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

          {/* Registration Controls */}
          <div className="border border-border/30 rounded-xl p-3 space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-primary" />
              {isRTL ? "تنظیمات ثبت‌نام" : "Registration Settings"}
            </h4>
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Switch checked={form.registrationOpen as boolean} onCheckedChange={(v) => updateField("registrationOpen", v)} />
              <Label className="text-sm">{isRTL ? "باز بودن ثبت‌نام" : "Registration Open"}</Label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  {isRTL ? "شروع ثبت‌نام" : "Registration Starts"}
                </Label>
                <Input type="date" value={form.registrationOpenAt as string} onChange={(e) => updateField("registrationOpenAt", e.target.value)}
                  className="rounded-xl h-9 text-xs" dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  {isRTL ? "پایان ثبت‌نام" : "Registration Ends"}
                </Label>
                <Input type="date" value={form.registrationCloseAt as string} onChange={(e) => updateField("registrationCloseAt", e.target.value)}
                  className="rounded-xl h-9 text-xs" dir="ltr" />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Button onClick={() => onSave(form)}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
        {initialData?.id ? (isRTL ? "بروزرسانی کارگاه" : "Update Workshop") : (isRTL ? "ایجاد کارگاه" : "Create Workshop")}
      </Button>
    </div>
  );
}

// ============================================
// Create Student Form
// ============================================
function CreateStudentForm({
  onSave,
  isRTL,
}: {
  onSave: (data: Record<string, unknown>) => void;
  isRTL: boolean;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "student",
  });

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4 p-1">
      <div className="space-y-2">
        <Label className="text-sm font-medium">{isRTL ? "نام و نام خانوادگی" : "Full Name"} *</Label>
        <div className="relative">
          <User className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
          <Input value={form.name} onChange={(e) => updateField("name", e.target.value)}
            className={cn("rounded-xl h-11", isRTL ? "pr-10" : "pl-10")} dir={isRTL ? "rtl" : "ltr"} />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">{isRTL ? "ایمیل" : "Email"} *</Label>
        <div className="relative">
          <Mail className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
          <Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)}
            className={cn("rounded-xl h-11", isRTL ? "pr-10" : "pl-10")} dir="ltr" />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">{isRTL ? "شماره تماس" : "Phone"}</Label>
        <div className="relative">
          <Phone className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
          <Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)}
            className={cn("rounded-xl h-11", isRTL ? "pr-10" : "pl-10")} dir="ltr" />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">{isRTL ? "رمز عبور" : "Password"} *</Label>
        <Input type="password" value={form.password} onChange={(e) => updateField("password", e.target.value)}
          className="rounded-xl h-11" dir="ltr" />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">{isRTL ? "نقش" : "Role"}</Label>
        <Select value={form.role} onValueChange={(v) => updateField("role", v)}>
          <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="student">{isRTL ? "هنرجو" : "Student"}</SelectItem>
            <SelectItem value="admin">{isRTL ? "مدیر" : "Admin"}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button onClick={() => onSave(form)}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
        {isRTL ? "ایجاد کاربر" : "Create User"}
      </Button>
    </div>
  );
}

// ============================================
// Course Form
// ============================================
function CourseForm({
  initialData,
  onSave,
  isRTL,
  instructors,
  branches,
}: {
  initialData: Partial<Course> | null;
  onSave: (data: Record<string, unknown>) => void;
  isRTL: boolean;
  instructors: Array<{ id: string; name: string; specialtyFa: string | null; specialtyEn: string | null }>;
  branches: Array<{ id: string; nameFa: string; nameEn: string }>;
}) {
  const [formTab, setFormTab] = useState("basic");
  const [form, setForm] = useState({
    titleFa: initialData?.titleFa || "",
    titleEn: initialData?.titleEn || "",
    descriptionFa: initialData?.descriptionFa || "",
    descriptionEn: initialData?.descriptionEn || "",
    category: initialData?.category || "",
    instrument: initialData?.instrument || "",
    level: initialData?.level || "all",
    sessionsMin: initialData?.sessionsMin ?? "",
    sessionsMax: initialData?.sessionsMax ?? "",
    price: initialData?.price ?? "",
    imageUrl: initialData?.imageUrl || "",
    coverUrl: initialData?.coverUrl || "",
    branchId: initialData?.branchId || "",
    instructorId: initialData?.instructorId || "",
    registrationOpen: initialData?.registrationOpen ?? true,
    registrationOpenAt: initialData?.registrationOpenAt
      ? new Date(initialData.registrationOpenAt).toISOString().split("T")[0]
      : "",
    registrationCloseAt: initialData?.registrationCloseAt
      ? new Date(initialData.registrationCloseAt).toISOString().split("T")[0]
      : "",
    maxCapacity: initialData?.maxCapacity ?? "",
    classType: initialData?.classType || "group",
    isPublished: initialData?.isPublished ?? false,
    isFeatured: initialData?.isFeatured ?? false,
    isShowOnHome: initialData?.isShowOnHome ?? false,
    isNew: initialData?.isNew ?? false,
  });

  const updateField = (field: string, value: string | number | boolean | string[]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
      <Tabs value={formTab} onValueChange={setFormTab}>
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="basic" className="text-[10px] sm:text-xs gap-1">
            <PenLine className="w-3 h-3 hidden sm:block" />
            {isRTL ? "پایه" : "Basic"}
          </TabsTrigger>
          <TabsTrigger value="details" className="text-[10px] sm:text-xs gap-1">
            <FileText className="w-3 h-3 hidden sm:block" />
            {isRTL ? "جزئیات" : "Details"}
          </TabsTrigger>
          <TabsTrigger value="media" className="text-[10px] sm:text-xs gap-1">
            <ImageIcon className="w-3 h-3 hidden sm:block" />
            {isRTL ? "رسانه" : "Media"}
          </TabsTrigger>
          <TabsTrigger value="registration" className="text-[10px] sm:text-xs gap-1">
            <UserPlus className="w-3 h-3 hidden sm:block" />
            {isRTL ? "ثبت‌نام" : "Reg."}
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-[10px] sm:text-xs gap-1">
            <Settings2 className="w-3 h-3 hidden sm:block" />
            {isRTL ? "تنظیمات" : "Flags"}
          </TabsTrigger>
        </TabsList>

        {/* Basic Tab */}
        <TabsContent value="basic" className="space-y-4 mt-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">{isRTL ? "عنوان (فارسی)" : "Title (Farsi)"} *</Label>
            <Input value={form.titleFa} onChange={(e) => updateField("titleFa", e.target.value)}
              className="rounded-xl" placeholder={isRTL ? "عنوان فارسی..." : "Farsi title..."} dir="rtl" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">{isRTL ? "عنوان (انگلیسی)" : "Title (English)"} *</Label>
            <Input value={form.titleEn} onChange={(e) => updateField("titleEn", e.target.value)}
              className="rounded-xl" placeholder="English title..." dir="ltr" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? "دسته‌بندی" : "Category"}</Label>
              <Select value={form.category} onValueChange={(v) => updateField("category", v)}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder={isRTL ? "انتخاب کنید..." : "Select..."} /></SelectTrigger>
                <SelectContent>
                  {courseCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {isRTL ? cat.labelFa : cat.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? "ساز" : "Instrument"}</Label>
              <Select value={form.instrument} onValueChange={(v) => updateField("instrument", v)}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder={isRTL ? "انتخاب کنید..." : "Select..."} /></SelectTrigger>
                <SelectContent>
                  {instrumentOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {isRTL ? opt.labelFa : opt.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? "سطح" : "Level"}</Label>
              <Select value={form.level} onValueChange={(v) => updateField("level", v)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {courseLevels.map((lvl) => (
                    <SelectItem key={lvl.value} value={lvl.value}>
                      {isRTL ? lvl.labelFa : lvl.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {isRTL ? "نوع کلاس" : "Class Type"}
              </Label>
              <Select value={form.classType as string} onValueChange={(v) => updateField("classType", v)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {classTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {isRTL ? opt.labelFa : opt.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" />
                {isRTL ? "حداقل جلسات" : "Sessions Min"}
              </Label>
              <Input type="number" min={1} max={100} value={form.sessionsMin} onChange={(e) => updateField("sessionsMin", e.target.value)}
                className="rounded-xl" dir="ltr" placeholder="3" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" />
                {isRTL ? "حداکثر جلسات" : "Sessions Max"}
              </Label>
              <Input type="number" min={1} max={100} value={form.sessionsMax} onChange={(e) => updateField("sessionsMax", e.target.value)}
                className="rounded-xl" dir="ltr" placeholder="5" />
            </div>
          </div>
          {form.sessionsMin && form.sessionsMax && Number(form.sessionsMin) === Number(form.sessionsMax) && Number(form.sessionsMin) > 0 && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Check className="w-3 h-3 text-green-500" />
              {isRTL ? "تعداد جلسات دقیق" : "Exact session count"}
            </div>
          )}
          {form.sessionsMin && form.sessionsMax && Number(form.sessionsMin) > 0 && Number(form.sessionsMax) > Number(form.sessionsMin) && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <BarChart3 className="w-3 h-3 text-primary" />
              {isRTL ? `محدوده جلسات: ${form.sessionsMin} تا ${form.sessionsMax}` : `Session range: ${form.sessionsMin} to ${form.sessionsMax}`}
            </div>
          )}
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4 mt-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">{isRTL ? "توضیحات (فارسی)" : "Description (Farsi)"}</Label>
            <Textarea value={form.descriptionFa} onChange={(e) => updateField("descriptionFa", e.target.value)}
              className="rounded-xl resize-none" rows={3} dir="rtl"
              placeholder={isRTL ? "توضیحات دوره به فارسی..." : "Course description in Farsi..."} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">{isRTL ? "توضیحات (انگلیسی)" : "Description (English)"}</Label>
            <Textarea value={form.descriptionEn} onChange={(e) => updateField("descriptionEn", e.target.value)}
              className="rounded-xl resize-none" rows={3} dir="ltr"
              placeholder="Course description in English..." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? "شعبه" : "Branch"}</Label>
              <Select value={form.branchId} onValueChange={(v) => updateField("branchId", v)}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder={isRTL ? "انتخاب شعبه..." : "Select branch..."} /></SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {isRTL ? b.nameFa : b.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? "مدرس" : "Instructor"}</Label>
              <Select value={form.instructorId} onValueChange={(v) => updateField("instructorId", v)}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder={isRTL ? "انتخاب مدرس..." : "Select instructor..."} /></SelectTrigger>
                <SelectContent>
                  {instructors.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name} {inst.specialtyFa ? `(${inst.specialtyFa})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-4 mt-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">{isRTL ? "آدرس تصویر کاور" : "Cover Image URL"}</Label>
            <Input value={form.coverUrl} onChange={(e) => updateField("coverUrl", e.target.value)}
              className="rounded-xl" placeholder="https://example.com/cover.jpg" dir="ltr" />
          </div>
          {form.coverUrl && (
            <div className="relative w-full h-40 rounded-xl overflow-hidden border border-border/50">
              <img src={form.coverUrl} alt="Cover preview" className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{isRTL ? "آدرس تصویر" : "Image URL"}</Label>
            <Input value={form.imageUrl} onChange={(e) => updateField("imageUrl", e.target.value)}
              className="rounded-xl" placeholder="https://example.com/image.jpg" dir="ltr" />
          </div>
        </TabsContent>

        {/* Registration Tab */}
        <TabsContent value="registration" className="space-y-4 mt-3">
          <div className="border border-border/30 rounded-xl p-3 space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-primary" />
              {isRTL ? "تنظیمات ثبت‌نام" : "Registration Control"}
            </h4>
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Switch checked={form.registrationOpen as boolean} onCheckedChange={(v) => updateField("registrationOpen", v)} />
              <Label className="text-sm flex items-center gap-1.5">
                {form.registrationOpen ? <Unlock className="w-3.5 h-3.5 text-green-500" /> : <Lock className="w-3.5 h-3.5 text-red-500" />}
                {form.registrationOpen ? (isRTL ? "ثبت‌نام باز" : "Open") : (isRTL ? "ثبت‌نام بسته" : "Closed")}
              </Label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  {isRTL ? "شروع ثبت‌نام" : "Registration Starts"}
                </Label>
                <Input type="date" value={form.registrationOpenAt as string} onChange={(e) => updateField("registrationOpenAt", e.target.value)}
                  className="rounded-xl h-9 text-xs" dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  {isRTL ? "پایان ثبت‌نام" : "Registration Ends"}
                </Label>
                <Input type="date" value={form.registrationCloseAt as string} onChange={(e) => updateField("registrationCloseAt", e.target.value)}
                  className="rounded-xl h-9 text-xs" dir="ltr" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" />
                {isRTL ? "حداکثر ظرفیت" : "Max Capacity"}
              </Label>
              <Input type="number" min={1} max={500} value={form.maxCapacity} onChange={(e) => updateField("maxCapacity", e.target.value)}
                className="rounded-xl h-9 text-xs" dir="ltr" placeholder={isRTL ? "مثلا ۲۰" : "e.g. 20"} />
            </div>
          </div>
        </TabsContent>

        {/* Settings Tab (Content Flags) */}
        <TabsContent value="settings" className="space-y-4 mt-3">
          <div className={cn("flex flex-col gap-3", isRTL && "items-end")}>
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Switch checked={form.isPublished as boolean} onCheckedChange={(v) => updateField("isPublished", v)} />
              <Label className="text-sm">{isRTL ? "انتشار" : "Published"}</Label>
            </div>
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Switch checked={form.isFeatured as boolean} onCheckedChange={(v) => updateField("isFeatured", v)} />
              <Label className="text-sm">{isRTL ? "ویژه" : "Featured"}</Label>
            </div>
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Switch checked={form.isShowOnHome as boolean} onCheckedChange={(v) => updateField("isShowOnHome", v)} />
              <Label className="text-sm">{isRTL ? "نمایش در صفحه اصلی" : "Show on Home"}</Label>
            </div>
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Switch checked={form.isNew as boolean} onCheckedChange={(v) => updateField("isNew", v)} />
              <Label className="text-sm">{isRTL ? "جدید" : "New"}</Label>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Button onClick={() => onSave(form)}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
        {initialData?.id ? (isRTL ? "بروزرسانی دوره" : "Update Course") : (isRTL ? "ایجاد دوره" : "Create Course")}
      </Button>
    </div>
  );
}

// ============================================
// Blog Category Form
// ============================================
function BlogCategoryForm({
  initialData,
  onSave,
  isRTL,
}: {
  initialData: Partial<BlogCategory> | null;
  onSave: (data: Record<string, unknown>) => void;
  isRTL: boolean;
}) {
  const [form, setForm] = useState({
    nameFa: initialData?.nameFa || "",
    nameEn: initialData?.nameEn || "",
    slugFa: initialData?.slugFa || "",
    slugEn: initialData?.slugEn || "",
    descriptionFa: initialData?.descriptionFa || "",
    descriptionEn: initialData?.descriptionEn || "",
    color: initialData?.color || "#8B2252",
    icon: initialData?.icon || "",
    isPublished: initialData?.isPublished ?? true,
  });

  const [slugManuallyEditedFa, setSlugManuallyEditedFa] = useState(!!initialData?.slugFa);
  const [slugManuallyEditedEn, setSlugManuallyEditedEn] = useState(!!initialData?.slugEn);

  const updateField = (field: string, value: string | number | boolean | string[]) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      // Auto-generate slug when title changes (only if slug hasn't been manually edited)
      if (field === "nameFa" && !slugManuallyEditedFa) {
        next.slugFa = generateSlugFa(value as string);
      }
      if (field === "nameEn" && !slugManuallyEditedEn) {
        next.slugEn = generateSlugEn(value as string);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{isRTL ? "نام (فارسی)" : "Name (Farsi)"} *</Label>
          <Input value={form.nameFa} onChange={(e) => updateField("nameFa", e.target.value)}
            className="rounded-xl" placeholder={isRTL ? "نام فارسی..." : "Farsi name..."} dir="rtl" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">{isRTL ? "نام (انگلیسی)" : "Name (English)"} *</Label>
          <Input value={form.nameEn} onChange={(e) => updateField("nameEn", e.target.value)}
            className="rounded-xl" placeholder="English name..." dir="ltr" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{isRTL ? "اسلاگ (فارسی)" : "Slug (Farsi)"} *</Label>
          <Input value={form.slugFa} onChange={(e) => { setSlugManuallyEditedFa(true); updateField("slugFa", e.target.value); }}
            className="rounded-xl" placeholder="اسلاگ-فارسی" dir="rtl" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">{isRTL ? "اسلاگ (انگلیسی)" : "Slug (English)"} *</Label>
          <Input value={form.slugEn} onChange={(e) => { setSlugManuallyEditedEn(true); updateField("slugEn", e.target.value); }}
            className="rounded-xl" placeholder="english-slug" dir="ltr" />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">{isRTL ? "رنگ" : "Color"}</Label>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="color"
            value={form.color || "#8B2252"}
            onChange={(e) => updateField("color", e.target.value)}
            className="w-10 h-10 rounded-lg cursor-pointer border border-border"
          />
          <div className="flex gap-1.5 flex-wrap">
            {predefinedColors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => updateField("color", c)}
                className={cn(
                  "w-7 h-7 rounded-lg border-2 transition-all hover:scale-110",
                  form.color === c ? "border-foreground scale-110" : "border-transparent"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">{isRTL ? "آیکون" : "Icon"}</Label>
        <Input value={form.icon} onChange={(e) => updateField("icon", e.target.value)}
          className="rounded-xl" placeholder="music, piano, guitar..." dir="ltr" />
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
      <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
        <Switch checked={form.isPublished} onCheckedChange={(v) => updateField("isPublished", v)} />
        <Label className="text-sm">{isRTL ? "انتشار" : "Published"}</Label>
      </div>
      <Button onClick={() => onSave(form)}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
        {initialData?.id ? (isRTL ? "بروزرسانی دسته" : "Update Category") : (isRTL ? "ایجاد دسته" : "Create Category")}
      </Button>
    </div>
  );
}

// ============================================
// Blog Post Form
// ============================================
function BlogPostForm({
  initialData,
  onSave,
  isRTL,
  categories,
}: {
  initialData: Partial<BlogPost> | null;
  onSave: (data: Record<string, unknown>) => void;
  isRTL: boolean;
  categories: BlogCategory[];
}) {
  const [formTab, setFormTab] = useState("basic");
  const [slugManuallyEditedFa, setSlugManuallyEditedFa] = useState(!!initialData?.slugFa);
  const [slugManuallyEditedEn, setSlugManuallyEditedEn] = useState(!!initialData?.slugEn);
  const [form, setForm] = useState({
    titleFa: initialData?.titleFa || "",
    titleEn: initialData?.titleEn || "",
    slugFa: initialData?.slugFa || "",
    slugEn: initialData?.slugEn || "",
    contentFa: initialData?.contentFa || "",
    contentEn: initialData?.contentEn || "",
    excerptFa: initialData?.excerptFa || "",
    excerptEn: initialData?.excerptEn || "",
    coverUrl: initialData?.coverUrl || "",
    coverAltFa: initialData?.coverAltFa || "",
    coverAltEn: initialData?.coverAltEn || "",
    categoryIds: initialData?.categories?.map((c: { id: string }) => c.id) || [] as string[],
    tags: initialData?.tags || "",
    metaTitleFa: initialData?.metaTitleFa || "",
    metaTitleEn: initialData?.metaTitleEn || "",
    metaDescriptionFa: initialData?.metaDescriptionFa || "",
    metaDescriptionEn: initialData?.metaDescriptionEn || "",
    keywords: initialData?.keywords || "",
    isPublished: initialData?.isPublished ?? false,
    isFeatured: initialData?.isFeatured ?? false,
    isShowOnHome: initialData?.isShowOnHome ?? false,
    isPinned: (initialData as Record<string, unknown>)?.isPinned as boolean ?? false,
    order: initialData?.order ?? 0,
  });

  // Re-initialize form when initialData changes (e.g., editing a different post)
  // React-recommended pattern: adjust state during render when prop changes
  // See: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevDataId, setPrevDataId] = useState<string | null>(initialData?.id ?? null);
  const currentDataId = initialData?.id ?? null;
  if (currentDataId !== prevDataId) {
    setPrevDataId(currentDataId);
    setForm({
      titleFa: initialData?.titleFa || "",
      titleEn: initialData?.titleEn || "",
      slugFa: initialData?.slugFa || "",
      slugEn: initialData?.slugEn || "",
      contentFa: initialData?.contentFa || "",
      contentEn: initialData?.contentEn || "",
      excerptFa: initialData?.excerptFa || "",
      excerptEn: initialData?.excerptEn || "",
      coverUrl: initialData?.coverUrl || "",
      coverAltFa: initialData?.coverAltFa || "",
      coverAltEn: initialData?.coverAltEn || "",
      categoryIds: initialData?.categories?.map((c: { id: string }) => c.id) || [] as string[],
      tags: initialData?.tags || "",
      metaTitleFa: initialData?.metaTitleFa || "",
      metaTitleEn: initialData?.metaTitleEn || "",
      metaDescriptionFa: initialData?.metaDescriptionFa || "",
      metaDescriptionEn: initialData?.metaDescriptionEn || "",
      keywords: initialData?.keywords || "",
      isPublished: initialData?.isPublished ?? false,
      isFeatured: initialData?.isFeatured ?? false,
      isShowOnHome: initialData?.isShowOnHome ?? false,
      isPinned: (initialData as Record<string, unknown>)?.isPinned as boolean ?? false,
      order: initialData?.order ?? 0,
    });
    setSlugManuallyEditedFa(!!initialData?.slugFa);
    setSlugManuallyEditedEn(!!initialData?.slugEn);
    setFormTab("basic");
  }

  const updateField = (field: string, value: string | number | boolean | string[]) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === "titleFa" && !slugManuallyEditedFa) {
        next.slugFa = generateSlugFa(value as string);
      }
      if (field === "titleEn" && !slugManuallyEditedEn) {
        next.slugEn = generateSlugEn(value as string);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
      <Tabs value={formTab} onValueChange={setFormTab}>
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="basic" className="text-[10px] sm:text-xs gap-1">
            <PenLine className="w-3 h-3 hidden sm:block" />
            {isRTL ? "پایه" : "Basic"}
          </TabsTrigger>
          <TabsTrigger value="content" className="text-[10px] sm:text-xs gap-1">
            <FileText className="w-3 h-3 hidden sm:block" />
            {isRTL ? "محتوا" : "Content"}
          </TabsTrigger>
          <TabsTrigger value="cover" className="text-[10px] sm:text-xs gap-1">
            <ImageIcon className="w-3 h-3 hidden sm:block" />
            {isRTL ? "کاور" : "Cover"}
          </TabsTrigger>
          <TabsTrigger value="seo" className="text-[10px] sm:text-xs gap-1">
            <Globe className="w-3 h-3 hidden sm:block" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-[10px] sm:text-xs gap-1">
            <Settings2 className="w-3 h-3 hidden sm:block" />
            {isRTL ? "تنظیمات" : "Settings"}
          </TabsTrigger>
        </TabsList>

        {/* Basic Tab */}
        <TabsContent value="basic" className="space-y-4 mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? "عنوان (فارسی)" : "Title (Farsi)"} *</Label>
              <Input value={form.titleFa} onChange={(e) => updateField("titleFa", e.target.value)}
                className="rounded-xl" placeholder={isRTL ? "عنوان فارسی..." : "Farsi title..."} dir="rtl" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? "عنوان (انگلیسی)" : "Title (English)"} *</Label>
              <Input value={form.titleEn} onChange={(e) => updateField("titleEn", e.target.value)}
                className="rounded-xl" placeholder="English title..." dir="ltr" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? "اسلاگ (فارسی)" : "Slug (Farsi)"} *</Label>
              <Input value={form.slugFa} onChange={(e) => { setSlugManuallyEditedFa(true); updateField("slugFa", e.target.value); }}
                className="rounded-xl" placeholder="اسلاگ-فارسی" dir="rtl" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? "اسلاگ (انگلیسی)" : "Slug (English)"} *</Label>
              <Input value={form.slugEn} onChange={(e) => { setSlugManuallyEditedEn(true); updateField("slugEn", e.target.value); }}
                className="rounded-xl" placeholder="english-slug" dir="ltr" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{isRTL ? "دسته‌بندی‌ها" : "Categories"}</Label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateField("categoryIds", categories.map(c => c.id))}
                  className="text-[10px] text-primary hover:underline"
                >
                  {isRTL ? "انتخاب همه" : "Select All"}
                </button>
                <span className="text-[10px] text-muted-foreground">|</span>
                <button
                  type="button"
                  onClick={() => updateField("categoryIds", [])}
                  className="text-[10px] text-muted-foreground hover:underline"
                >
                  {isRTL ? "پاک کردن" : "Clear All"}
                </button>
              </div>
            </div>
            {categories.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center">
                {isRTL ? "ابتدا دسته‌بندی ایجاد کنید" : "Create categories first"}
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-border/30 rounded-xl p-2 space-y-1">
                {categories.map((cat) => {
                  const isSelected = (form.categoryIds as string[]).includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        const current = form.categoryIds as string[];
                        const next = isSelected
                          ? current.filter(id => id !== cat.id)
                          : [...current, cat.id];
                        updateField("categoryIds", next);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-left",
                        isSelected
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-muted/50 border border-transparent"
                      )}
                    >
                      <span
                        className={cn(
                          "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                          isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"
                        )}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color || "#8B2252" }}
                      />
                      <span className="text-xs font-medium flex-1">{isRTL ? cat.nameFa : cat.nameEn}</span>
                      {!cat.isPublished && (
                        <Badge className="text-[8px] bg-muted text-muted-foreground border-0 px-1 py-0">
                          {isRTL ? "پیش‌نویس" : "Draft"}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {(form.categoryIds as string[]).length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(form.categoryIds as string[]).map(catId => {
                  const cat = categories.find(c => c.id === catId);
                  if (!cat) return null;
                  return (
                    <Badge
                      key={cat.id}
                      className="text-[10px] border-0 gap-1 pr-1"
                      style={{
                        backgroundColor: `${cat.color || "#8B2252"}20`,
                        color: cat.color || "#8B2252",
                      }}
                    >
                      {isRTL ? cat.nameFa : cat.nameEn}
                      <button
                        type="button"
                        onClick={() => {
                          const current = form.categoryIds as string[];
                          updateField("categoryIds", current.filter(id => id !== catId));
                        }}
                        className="ml-0.5 hover:opacity-70"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4 mt-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">{isRTL ? "خلاصه (فارسی)" : "Excerpt (Farsi)"}</Label>
            <Textarea value={form.excerptFa} onChange={(e) => updateField("excerptFa", e.target.value)}
              className="rounded-xl resize-none" rows={3} dir="rtl"
              placeholder={isRTL ? "خلاصه کوتاه مقاله..." : "Short excerpt..."} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">{isRTL ? "خلاصه (انگلیسی)" : "Excerpt (English)"}</Label>
            <Textarea value={form.excerptEn} onChange={(e) => updateField("excerptEn", e.target.value)}
              className="rounded-xl resize-none" rows={3} dir="ltr"
              placeholder="Short excerpt..." />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">{isRTL ? "محتوا (فارسی) - HTML" : "Content (Farsi) - HTML"} *</Label>
            <Textarea value={form.contentFa} onChange={(e) => updateField("contentFa", e.target.value)}
              className="rounded-xl resize-none font-mono text-xs" rows={8} dir="rtl"
              placeholder="<p>محتوای مقاله...</p>" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">{isRTL ? "محتوا (انگلیسی) - HTML" : "Content (English) - HTML"} *</Label>
            <Textarea value={form.contentEn} onChange={(e) => updateField("contentEn", e.target.value)}
              className="rounded-xl resize-none font-mono text-xs" rows={8} dir="ltr"
              placeholder="<p>Article content...</p>" />
          </div>
        </TabsContent>

        {/* Cover Tab */}
        <TabsContent value="cover" className="space-y-4 mt-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">{isRTL ? "آدرس تصویر کاور" : "Cover Image URL"}</Label>
            <Input value={form.coverUrl} onChange={(e) => updateField("coverUrl", e.target.value)}
              className="rounded-xl" placeholder="https://example.com/image.jpg" dir="ltr" />
          </div>
          {form.coverUrl && (
            <div className="relative w-full h-40 rounded-xl overflow-hidden border border-border/50">
              <img
                src={form.coverUrl}
                alt={form.coverAltEn || "Cover preview"}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? "متن جایگزین (فارسی)" : "Alt Text (Farsi)"}</Label>
              <Input value={form.coverAltFa} onChange={(e) => updateField("coverAltFa", e.target.value)}
                className="rounded-xl" placeholder={isRTL ? "توضیح تصویر فارسی" : "Farsi alt text"} dir="rtl" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? "متن جایگزین (انگلیسی)" : "Alt Text (English)"}</Label>
              <Input value={form.coverAltEn} onChange={(e) => updateField("coverAltEn", e.target.value)}
                className="rounded-xl" placeholder="English alt text" dir="ltr" />
            </div>
          </div>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-4 mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? "عنوان متا (فارسی)" : "Meta Title (Farsi)"}</Label>
              <Input value={form.metaTitleFa} onChange={(e) => updateField("metaTitleFa", e.target.value)}
                className="rounded-xl" dir="rtl" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? "عنوان متا (انگلیسی)" : "Meta Title (English)"}</Label>
              <Input value={form.metaTitleEn} onChange={(e) => updateField("metaTitleEn", e.target.value)}
                className="rounded-xl" dir="ltr" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? "توضیحات متا (فارسی)" : "Meta Description (Farsi)"}</Label>
              <Textarea value={form.metaDescriptionFa} onChange={(e) => updateField("metaDescriptionFa", e.target.value)}
                className="rounded-xl resize-none" rows={3} dir="rtl" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? "توضیحات متا (انگلیسی)" : "Meta Description (English)"}</Label>
              <Textarea value={form.metaDescriptionEn} onChange={(e) => updateField("metaDescriptionEn", e.target.value)}
                className="rounded-xl resize-none" rows={3} dir="ltr" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">{isRTL ? "کلمات کلیدی" : "Keywords"}</Label>
            <Input value={form.keywords} onChange={(e) => updateField("keywords", e.target.value)}
              className="rounded-xl" placeholder={isRTL ? "موسیقی، پیانو، آموزش" : "music, piano, education"} dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">{isRTL ? "تگ‌ها" : "Tags"}</Label>
            <Input value={form.tags} onChange={(e) => updateField("tags", e.target.value)}
              className="rounded-xl" placeholder={isRTL ? "تگ۱، تگ۲، تگ۳" : "tag1, tag2, tag3"} dir="ltr" />
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4 mt-3">
          <div className={cn("flex flex-wrap items-center gap-x-6 gap-y-3", isRTL && "flex-row-reverse")}>
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Switch checked={form.isPublished} onCheckedChange={(v) => updateField("isPublished", v)} />
              <Label className="text-sm">{isRTL ? "انتشار" : "Published"}</Label>
            </div>
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Switch checked={form.isFeatured} onCheckedChange={(v) => updateField("isFeatured", v)} />
              <Label className="text-sm">{isRTL ? "ویژه" : "Featured"}</Label>
            </div>
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Switch checked={form.isShowOnHome} onCheckedChange={(v) => updateField("isShowOnHome", v)} />
              <Label className="text-sm">{isRTL ? "نمایش در صفحه اصلی" : "Show on Home"}</Label>
            </div>
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Switch checked={form.isPinned} onCheckedChange={(v) => updateField("isPinned", v)} />
              <Label className="text-sm flex items-center gap-1"><Pin className="w-3 h-3" />{isRTL ? "پین‌شده" : "Pinned"}</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">{isRTL ? "ترتیب" : "Order"}</Label>
            <Input type="number" min={0} value={form.order}
              onChange={(e) => updateField("order", parseInt(e.target.value) || 0)}
              className="rounded-xl w-24" />
          </div>
          {initialData && (
            <div className="text-xs text-muted-foreground space-y-2 p-3 bg-muted/30 rounded-xl">
              <div className="flex items-center gap-1.5"><Eye className="w-3 h-3" />{initialData.viewCount ?? 0} {isRTL ? "بازدید" : "views"}</div>
              <div className="flex items-center gap-1.5"><User className="w-3 h-3" />{initialData.uniqueViewCount ?? 0} {isRTL ? "بازدید یکتا" : "unique views"}</div>
              <div className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{initialData.readingTime ?? 0} {isRTL ? "دقیقه مطالعه" : "min read"}</div>
              <div className="flex items-center gap-1.5"><Share2 className="w-3 h-3" />{initialData.shareCount ?? 0} {isRTL ? "اشتراک" : "shares"}</div>
              <div className="flex items-center gap-1.5"><Heart className="w-3 h-3" />{initialData.likeCount ?? 0} {isRTL ? "پسند" : "likes"}</div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Button onClick={() => {
        const data = { ...form };
        onSave(data);
      }}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
        {initialData?.id ? (isRTL ? "بروزرسانی مقاله" : "Update Post") : (isRTL ? "ایجاد مقاله" : "Create Post")}
      </Button>
    </div>
  );
}

// ============================================
// Schedule Form (Create/Edit)
// ============================================
function ScheduleForm({
  initialData,
  onSave,
  isRTL,
  courses,
  instructors,
  branches,
}: {
  initialData: ClassScheduleItem | null;
  onSave: (data: Record<string, unknown>) => void;
  isRTL: boolean;
  courses: Course[];
  instructors: Array<{ id: string; name: string; specialtyFa: string | null; specialtyEn: string | null }>;
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
  });

  const updateField = (field: string, value: string | number | boolean | string[]) => {
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
              <SelectItem key={inst.id} value={inst.id}>
                {inst.name} {inst.specialtyFa ? `(${inst.specialtyFa})` : ""}
              </SelectItem>
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
              {persianDays.map((d) => (
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
// Main Admin Panel
// ============================================
// ============================================
// Enrollment Edit Dialog
// ============================================
function EnrollmentEditDialog({
  enrollment,
  isOpen,
  onClose,
  onSave,
  isRTL,
}: {
  enrollment: Enrollment | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: Record<string, unknown>) => void;
  isRTL: boolean;
}) {
  const [form, setForm] = useState({
    paymentStatus: enrollment?.paymentStatus || "unpaid",
    tuitionAmount: enrollment?.tuitionAmount ?? "",
    paymentDueDate: enrollment?.paymentDueDate ? new Date(enrollment.paymentDueDate).toISOString().split("T")[0] : "",
    paymentRef: enrollment?.paymentRef || "",
    notes: enrollment?.notes || "",
    status: enrollment?.status || "active",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [prevEnrollmentId, setPrevEnrollmentId] = useState<string | null>(null);

  // Sync form when enrollment changes (using comparison instead of effect)
  if (enrollment && enrollment.id !== prevEnrollmentId) {
    setPrevEnrollmentId(enrollment.id);
    const newForm = {
      paymentStatus: enrollment.paymentStatus || "unpaid",
      tuitionAmount: enrollment.tuitionAmount ?? "",
      paymentDueDate: enrollment.paymentDueDate ? new Date(enrollment.paymentDueDate).toISOString().split("T")[0] : "",
      paymentRef: enrollment.paymentRef || "",
      notes: enrollment.notes || "",
      status: enrollment.status || "active",
    };
    // Use setTimeout to avoid setState during render
    setTimeout(() => setForm(newForm), 0);
  }

  const updateField = (field: string, value: string | number | boolean | string[]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!enrollment) return;
    setIsSaving(true);
    await onSave(enrollment.id, form);
    setIsSaving(false);
  };

  const handleMarkAsPaid = async () => {
    if (!enrollment) return;
    setIsSaving(true);
    await onSave(enrollment.id, { ...form, paymentStatus: "paid" });
    setIsSaving(false);
  };

  if (!enrollment) return null;

  const methodConf = REGISTRATION_METHOD_CONFIG[enrollment.registrationMethod] || REGISTRATION_METHOD_CONFIG.online;
  const MethodIcon = methodConf.icon;
  const payConf = PAYMENT_STATUS_CONFIG[form.paymentStatus] || PAYMENT_STATUS_CONFIG.unpaid;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            {isRTL ? "ویرایش ثبت‌نام" : "Edit Enrollment"}
          </DialogTitle>
          <DialogDescription className="sr-only">فرم ویرایش ثبت‌نام</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Student & Course Info (read-only) */}
          <div className="border border-border/30 rounded-xl p-3 space-y-2 bg-muted/20">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold">{enrollment.student.name}</span>
              <span className="text-xs text-muted-foreground">{enrollment.student.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{isRTL ? enrollment.course.titleFa : enrollment.course.titleEn}</span>
              {enrollment.course.level && (
                <Badge variant="secondary" className="text-[10px]">{enrollment.course.level}</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <MethodIcon className={cn("w-4 h-4", methodConf.color)} />
              <span className="text-xs text-muted-foreground">{isRTL ? "روش ثبت‌نام:" : "Method:"}</span>
              <Badge className={cn("text-[10px] border-0", methodConf.color === "text-blue-500" ? "bg-blue-500/10" : methodConf.color === "text-amber-500" ? "bg-amber-500/10" : "bg-green-500/10", methodConf.color)}>
                {isRTL ? methodConf.labelFa : methodConf.labelEn}
              </Badge>
              <span className="text-[10px] text-muted-foreground">({isRTL ? "غیرقابل تغییر" : "Read-only"})</span>
            </div>
          </div>

          {/* Payment Status */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" />
              {isRTL ? "وضعیت پرداخت" : "Payment Status"}
            </Label>
            <Select value={form.paymentStatus} onValueChange={(v) => updateField("paymentStatus", v)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_STATUS_CONFIG).map(([key, conf]) => (
                  <SelectItem key={key} value={key}>
                    <span className={cn("flex items-center gap-2", conf.color)}>
                      {isRTL ? conf.labelFa : conf.labelEn}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tuition Amount */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              {isRTL ? "مبلغ شهریه (تومان)" : "Tuition Amount (Toman)"}
            </Label>
            <Input type="number" value={form.tuitionAmount} onChange={(e) => updateField("tuitionAmount", e.target.value)}
              className="rounded-xl" dir="ltr" placeholder="500000" />
          </div>

          {/* Payment Due Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              {isRTL ? "مهلت پرداخت" : "Payment Due Date"}
            </Label>
            <Input type="date" value={form.paymentDueDate} onChange={(e) => updateField("paymentDueDate", e.target.value)}
              className="rounded-xl" dir="ltr" />
          </div>

          {/* Payment Reference */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5" />
              {isRTL ? "شماره تراکنش / رسید" : "Payment Reference"}
            </Label>
            <Input value={form.paymentRef} onChange={(e) => updateField("paymentRef", e.target.value)}
              className="rounded-xl" dir="ltr" placeholder={isRTL ? "شماره تراکنش..." : "Transaction ref..."} />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{isRTL ? "یادداشت" : "Notes"}</Label>
            <Textarea value={form.notes} onChange={(e) => updateField("notes", e.target.value)}
              className="rounded-xl resize-none" rows={2} dir={isRTL ? "rtl" : "ltr"}
              placeholder={isRTL ? "یادداشت ادمین..." : "Admin notes..."} />
          </div>

          {/* Enrollment Status */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <CircleDot className="w-3.5 h-3.5" />
              {isRTL ? "وضعیت ثبت‌نام" : "Enrollment Status"}
            </Label>
            <Select value={form.status} onValueChange={(v) => updateField("status", v)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ENROLLMENT_STATUS_CONFIG).map(([key, conf]) => (
                  <SelectItem key={key} value={key}>
                    <span className={cn("flex items-center gap-2", conf.color)}>
                      {isRTL ? conf.labelFa : conf.labelEn}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Actions */}
          {form.paymentStatus !== "paid" && (
            <div className="border border-green-500/30 rounded-xl p-3 bg-green-500/5">
              <Button
                onClick={handleMarkAsPaid}
                disabled={isSaving}
                className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl gap-2"
              >
                <Check className="w-4 h-4" />
                {isRTL ? "علامت‌گذاری به عنوان پرداخت شده" : "Mark as Paid"}
              </Button>
            </div>
          )}

          {/* Current payment info display */}
          {enrollment.paidAt && (
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              {isRTL ? `پرداخت در: ${new Date(enrollment.paidAt).toLocaleDateString("fa-IR")}` : `Paid at: ${new Date(enrollment.paidAt).toLocaleDateString("en-US")}`}
            </div>
          )}

          {/* Save Button */}
          <Button onClick={handleSave} disabled={isSaving}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2">
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Edit3 className="w-4 h-4" />}
            {isRTL ? "ذخیره تغییرات" : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// PENDING REGISTRATIONS TAB (online submissions awaiting approval)
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

interface PendingRegistrationDetail extends PendingRegistrationEntry {
  dateOfBirth: string | null;
  gender: string | null;
  educationLevel: string | null;
  fieldOfStudy: string | null;
  secondaryInstruments: string | null;
  musicExperienceYears: number | null;
  previousTraining: string | null;
  musicGenres: string | null;
  learningGoals: string | null;
  practiceHoursPerWeek: number | null;
  instructorName: string | null;
  instructorNameKnown: boolean;
  address: string | null;
  emergencyContact: string | null;
  parentName: string | null;
  parentPhone: string | null;
  parentRelation: string | null;
  referralDetail: string | null;
  specialtyFa: string | null;
  specialtyEn: string | null;
  bioFa: string | null;
  bioEn: string | null;
  experience: string | null;
  socialLinks: string | null;
  adminNotes: string | null;
  userAgent: string | null;
}

const PENDING_STATUS_CONFIG: Record<string, { labelFa: string; labelEn: string; color: string; bgColor: string; icon: typeof Clock }> = {
  pending: { labelFa: "در انتظار بررسی", labelEn: "Pending", color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-500/10 border-amber-500/30", icon: Clock },
  approved: { labelFa: "تأیید شده", labelEn: "Approved", color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-500/10 border-emerald-500/30", icon: CheckCircle2 },
  rejected: { labelFa: "رد شده", labelEn: "Rejected", color: "text-red-600 dark:text-red-400", bgColor: "bg-red-500/10 border-red-500/30", icon: XCircle },
};

const REG_INSTRUMENTS_LOCAL = [
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

const REG_SKILL_LEVELS_LOCAL = [
  { value: "beginner", fa: "مبتدی", en: "Beginner" },
  { value: "intermediate", fa: "متوسط", en: "Intermediate" },
  { value: "advanced", fa: "پیشرفته", en: "Advanced" },
  { value: "professional", fa: "حرفه‌ای", en: "Professional" },
];

const REG_REFERRAL_SOURCES_LOCAL = [
  { value: "instagram", fa: "اینستاگرام", en: "Instagram" },
  { value: "telegram", fa: "تلگرام", en: "Telegram" },
  { value: "google", fa: "گوگل", en: "Google" },
  { value: "friend", fa: "دوستان", en: "Friend" },
  { value: "billboard", fa: "بیلبورد", en: "Billboard" },
  { value: "website", fa: "وبسایت", en: "Website" },
  { value: "event", fa: "رویداد", en: "Event" },
  { value: "other", fa: "سایر", en: "Other" },
];

const REG_BRANCHES_LOCAL = [
  { value: "main", fa: "شعبه اصلی (بلوار معلم)", en: "Main Branch (Moallem Blvd)" },
  { value: "west", fa: "شعبه غرب (آریاشهر)", en: "West Branch (Ariashahr)" },
  { value: "north", fa: "شعبه شمال (تجریش)", en: "North Branch (Tajrish)" },
  { value: "other", fa: "سایر", en: "Other" },
];

function getRegOptionLabel(options: Array<{ value: string; fa: string; en: string }>, value: string | null, isRTL: boolean): string {
  if (!value) return "—";
  const found = options.find((o) => o.value === value);
  return found ? (isRTL ? found.fa : found.en) : value;
}

function formatRegDate(dateStr: string, isRTL: boolean): string {
  try {
    if (isRTL) {
      const jalaliFormatted = formatJalaaliDate(dateStr, isRTL, "long");
      if (jalaliFormatted && jalaliFormatted !== dateStr) return jalaliFormatted;
    }
    return new Date(dateStr).toLocaleDateString(isRTL ? "fa-IR" : "en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatRegDateTime(dateStr: string, isRTL: boolean): string {
  try {
    const base = formatRegDate(dateStr, isRTL);
    const time = new Date(dateStr).toLocaleTimeString(isRTL ? "fa-IR" : "en-US", { hour: "2-digit", minute: "2-digit" });
    return `${base} ${isRTL ? toPersianDigits(time) : time}`;
  } catch {
    return dateStr;
  }
}

function PendingRegistrationsTab({ isRTL }: { isRTL: boolean }) {
  const [registrations, setRegistrations] = useState<PendingRegistrationEntry[]>([]);
  const [summary, setSummary] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [viewItem, setViewItem] = useState<PendingRegistrationDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: "", name: "" });
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; id: string; name: string; nationalId: string }>({ open: false, id: "", name: "", nationalId: "" });
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await authFetch(`/api/registration/pending?${params.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setRegistrations(d.registrations || []);
        setTotal(d.total || 0);
        setSummary(d.summary || { pending: 0, approved: 0, rejected: 0 });
      } else {
        toast.error(isRTL ? "خطا در بارگذاری درخواست‌های ثبت‌نام" : "Failed to load pending registrations");
      }
    } catch {
      toast.error(isRTL ? "خطا در ارتباط با سرور" : "Connection error");
    } finally {
      setLoading(false);
    }
  }, [isRTL, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  // Auto-refresh every 60 seconds (silent)
  useEffect(() => {
    const interval = setInterval(() => {
      authFetch("/api/registration/pending?limit=200")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d) {
            setRegistrations(d.registrations || []);
            setTotal(d.total || 0);
            setSummary(d.summary || { pending: 0, approved: 0, rejected: 0 });
          }
        })
        .catch(() => { /* silent */ });
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

  const handleApprove = async () => {
    if (!approveDialog.id) return;
    setActionLoading(approveDialog.id);
    try {
      const res = await authFetch(`/api/registration/pending/${approveDialog.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (res.ok) {
        toast.success(isRTL ? "درخواست ثبت‌نام تأیید شد و حساب کاربری ایجاد شد" : "Registration approved and student account created");
        setApproveDialog({ open: false, id: "", name: "", nationalId: "" });
        setViewItem(null);
        fetchRegistrations();
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || (isRTL ? "خطا در تأیید درخواست" : "Failed to approve"));
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
        setRejectDialog({ open: false, id: "", name: "" });
        setRejectionReason("");
        setViewItem(null);
        fetchRegistrations();
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || (isRTL ? "خطا در رد درخواست" : "Failed to reject"));
      }
    } catch {
      toast.error(isRTL ? "خطا در ارتباط" : "Connection error");
    } finally {
      setActionLoading(null);
    }
  };

  const summaryCards = useMemo(() => [
    { icon: Clock, labelFa: "در انتظار بررسی", labelEn: "Pending", value: summary.pending, color: "from-amber-500/15 to-amber-500/5", iconBg: "bg-amber-500/15", iconColor: "text-amber-600 dark:text-amber-400", highlight: summary.pending > 0 },
    { icon: CheckCircle2, labelFa: "تأیید شده", labelEn: "Approved", value: summary.approved, color: "from-emerald-500/15 to-emerald-500/5", iconBg: "bg-emerald-500/15", iconColor: "text-emerald-600 dark:text-emerald-400", highlight: false },
    { icon: XCircle, labelFa: "رد شده", labelEn: "Rejected", value: summary.rejected, color: "from-red-500/15 to-red-500/5", iconBg: "bg-red-500/15", iconColor: "text-red-600 dark:text-red-400", highlight: false },
    { icon: UserPlus, labelFa: "کل درخواست‌ها", labelEn: "Total", value: total, color: "from-primary/15 to-primary/5", iconBg: "bg-primary/15", iconColor: "text-primary", highlight: false },
  ], [summary, total]);

  return (
    <div className="space-y-4">
      {/* Header / Info Banner */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
        <CardContent className="p-4">
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <div className={cn("flex-1", isRTL && "text-right")}>
              <h3 className="text-sm font-bold">
                {isRTL ? "درخواست‌های ثبت‌نام آنلاین" : "Online Registration Requests"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isRTL
                  ? "هنرجویان/مدرسان جدیدی که از طریق فرم عمومی ثبت‌نام کرده‌اند و در انتظار تأیید هستند. با تأیید، حساب کاربری با کد ملی به عنوان رمز پیش‌فرض ایجاد می‌شود."
                  : "New students/instructors who submitted the public registration form and are awaiting review. Approving creates a Student account with national ID as the default password."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {summaryCards.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className={cn("border-border/30 overflow-hidden relative", s.highlight && "ring-1 ring-amber-500/30")}>
              <div className={cn("h-1 bg-gradient-to-r", s.color)} />
              <CardContent className="p-2.5">
                <div className={cn("w-6 h-6 rounded flex items-center justify-center mb-1", s.iconBg)}>
                  <s.icon className={cn("w-3.5 h-3.5", s.iconColor, s.highlight && "animate-pulse")} />
                </div>
                <p className="text-lg font-bold">{isRTL ? toPersianDigits(s.value) : s.value}</p>
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
          <Input
            placeholder={isRTL ? "جستجو نام، تلفن، کد ملی، ایمیل..." : "Search name, phone, national ID, email..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9 h-9 text-sm rounded-xl"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9 text-xs rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRTL ? "همه وضعیت‌ها" : "All Status"}</SelectItem>
            {Object.entries(PENDING_STATUS_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{isRTL ? cfg.labelFa : cfg.labelEn}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={fetchRegistrations} className="h-9 rounded-xl" disabled={loading}>
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
        </Button>
      </div>

      <div className="text-xs text-muted-foreground">
        {isRTL
          ? `${toPersianDigits(total)} درخواست ثبت‌نام آنلاین`
          : `${total} online registration request(s)`}
      </div>

      {/* Cards List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border/30">
              <CardContent className="p-4 space-y-2">
                <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-muted/70 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-muted/70 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : registrations.length === 0 ? (
        <Card className="border-border/30 border-dashed">
          <CardContent className="py-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <ClipboardList className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {isRTL ? "درخواست ثبت‌نامی یافت نشد" : "No registration requests found"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isRTL ? "درخواست‌های جدید از طریق فرم عمومی ثبت‌نام در اینجا نمایش داده می‌شوند" : "New submissions from the public registration form will appear here"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {registrations.map((r) => {
            const statusCfg = PENDING_STATUS_CONFIG[r.status];
            const isRecent = Date.now() - new Date(r.createdAt).getTime() < 86400000;
            const isPending = r.status === "pending";
            const StatusIcon = statusCfg?.icon || Clock;
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={cn(
                  "border-border/30 transition-all duration-200 hover:border-border/60 hover:shadow-sm",
                  isPending && isRecent && "ring-1 ring-amber-500/30",
                  r.status === "approved" && "border-emerald-500/20",
                  r.status === "rejected" && "border-red-500/20 opacity-90"
                )}>
                  <CardContent className="p-4">
                    {/* Top row: name + status + actions */}
                    <div className={cn("flex items-start gap-3 mb-3", isRTL && "flex-row-reverse")}>
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        r.role === "instructor" ? "bg-purple-500/10" : "bg-primary/10"
                      )}>
                        {r.role === "instructor"
                          ? <GraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          : <User className="w-5 h-5 text-primary" />}
                      </div>
                      <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold truncate">{r.name}</h4>
                          {r.role === "instructor" && (
                            <Badge variant="outline" className="text-[9px] text-purple-600 border-purple-500/30">
                              {isRTL ? "مدرس" : "Instructor"}
                            </Badge>
                          )}
                          {isPending && isRecent && (
                            <Badge className="bg-amber-500/10 text-amber-600 text-[9px] px-1.5 animate-pulse">
                              {isRTL ? "جدید" : "NEW"}
                            </Badge>
                          )}
                          {statusCfg && (
                            <Badge className={cn("text-[9px] px-1.5", statusCfg.bgColor, statusCfg.color, "border")}>
                              <StatusIcon className="w-2.5 h-2.5 me-0.5" />
                              {isRTL ? statusCfg.labelFa : statusCfg.labelEn}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 font-mono" dir="ltr">
                          {r.phone}
                          {r.nationalId && ` · ${r.nationalId}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => handleViewDetail(r.id)}
                          disabled={viewLoading && viewItem?.id === r.id}
                          title={isRTL ? "مشاهده جزئیات" : "View details"}
                        >
                          {viewLoading && viewItem?.id === r.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Eye className="w-3.5 h-3.5" />}
                        </Button>
                        {isPending && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                              onClick={() => setApproveDialog({ open: true, id: r.id, name: r.name, nationalId: r.nationalId })}
                              disabled={actionLoading === r.id}
                              title={isRTL ? "تأیید" : "Approve"}
                            >
                              {actionLoading === r.id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <CheckCircle2 className="w-3.5 h-3.5" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                              onClick={() => setRejectDialog({ open: true, id: r.id, name: r.name })}
                              disabled={actionLoading === r.id}
                              title={isRTL ? "رد" : "Reject"}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Music className="w-3 h-3" />
                          {isRTL ? "ساز" : "Instrument"}
                        </span>
                        <p className="font-medium truncate">
                          {getRegOptionLabel(REG_INSTRUMENTS_LOCAL, r.registrationInstrument || r.primaryInstrument, isRTL)}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" />
                          {isRTL ? "سطح" : "Level"}
                        </span>
                        <p className="font-medium truncate">
                          {getRegOptionLabel(REG_SKILL_LEVELS_LOCAL, r.skillLevel, isRTL)}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {isRTL ? "شهر" : "City"}
                        </span>
                        <p className="font-medium truncate">{r.city || "—"}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <DoorOpen className="w-3 h-3" />
                          {isRTL ? "شعبه" : "Branch"}
                        </span>
                        <p className="font-medium truncate">
                          {getRegOptionLabel(REG_BRANCHES_LOCAL, r.preferredBranch, isRTL)}
                        </p>
                      </div>
                    </div>

                    {/* Extra info: email + referral + date */}
                    <div className="mt-2 pt-2 border-t border-border/30 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                      {r.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-[180px]" dir="ltr">{r.email}</span>
                        </span>
                      )}
                      {r.referralSource && (
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {isRTL ? "منبع:" : "Source:"} {getRegOptionLabel(REG_REFERRAL_SOURCES_LOCAL, r.referralSource, isRTL)}
                        </span>
                      )}
                      <span className="flex items-center gap-1 ms-auto">
                        <CalendarDays className="w-3 h-3" />
                        {formatRegDate(r.createdAt, isRTL)}
                      </span>
                    </div>

                    {/* Rejection reason (if rejected) */}
                    {r.status === "rejected" && r.rejectionReason && (
                      <div className="mt-2 p-2 rounded-lg bg-red-500/5 border border-red-500/20 text-[11px] text-red-600 dark:text-red-400">
                        <span className="font-medium">{isRTL ? "دلیل رد: " : "Rejection reason: "}</span>
                        {r.rejectionReason}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!viewItem} onOpenChange={(open) => { if (!open) setViewItem(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              {isRTL ? "جزئیات درخواست ثبت‌نام آنلاین" : "Online Registration Details"}
            </DialogTitle>
            <DialogDescription className="sr-only">{isRTL ? "مشاهده جزئیات درخواست ثبت‌نام آنلاین" : "View online registration details"}</DialogDescription>
          </DialogHeader>
          {viewLoading && !viewItem ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : viewItem && (
            <div className="space-y-4 text-xs">
              {/* Status + date */}
              <div className={cn("flex items-center gap-2 flex-wrap", isRTL && "flex-row-reverse")}>
                {(() => {
                  const cfg = PENDING_STATUS_CONFIG[viewItem.status];
                  return cfg && (
                    <Badge className={cn("text-xs px-2 py-0.5 border", cfg.bgColor, cfg.color)}>
                      <cfg.icon className="w-3 h-3 me-1" />
                      {isRTL ? cfg.labelFa : cfg.labelEn}
                    </Badge>
                  );
                })()}
                <span className="text-muted-foreground">{formatRegDateTime(viewItem.createdAt, isRTL)}</span>
              </div>

              {/* Core info */}
              <div>
                <p className="font-semibold text-sm mb-2 flex items-center gap-1">
                  <UserPlus className="w-3.5 h-3.5 text-primary" />
                  {isRTL ? "اطلاعات اصلی" : "Core Info"}
                </p>
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
                    <p className="font-medium truncate" dir="ltr">{viewItem.email || "—"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "نقش" : "Role"}</span>
                    <p className="font-medium">
                      {viewItem.role === "instructor" ? (isRTL ? "مدرس" : "Instructor") : (isRTL ? "هنرجو" : "Student")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Music profile */}
              <div>
                <p className="font-semibold text-sm mb-2 flex items-center gap-1">
                  <Music className="w-3.5 h-3.5 text-primary" />
                  {isRTL ? "پروفایل موسیقی" : "Music Profile"}
                </p>
                <div className="grid grid-cols-2 gap-3 bg-muted/30 rounded-md p-3">
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "ساز ثبت‌نام" : "Registration Instrument"}</span>
                    <p className="font-medium">{getRegOptionLabel(REG_INSTRUMENTS_LOCAL, viewItem.registrationInstrument, isRTL)}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "ساز اصلی" : "Primary Instrument"}</span>
                    <p className="font-medium">{getRegOptionLabel(REG_INSTRUMENTS_LOCAL, viewItem.primaryInstrument, isRTL)}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "سطح مهارت" : "Skill Level"}</span>
                    <p className="font-medium">{getRegOptionLabel(REG_SKILL_LEVELS_LOCAL, viewItem.skillLevel, isRTL)}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "سابقه (سال)" : "Experience (Years)"}</span>
                    <p className="font-medium">{viewItem.musicExperienceYears ?? "—"}</p>
                  </div>
                  {viewItem.secondaryInstruments && (
                    <div className="space-y-0.5 col-span-2">
                      <span className="text-muted-foreground">{isRTL ? "سازهای فرعی" : "Secondary Instruments"}</span>
                      <p className="font-medium">{viewItem.secondaryInstruments}</p>
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

              {/* Contact & location */}
              <div>
                <p className="font-semibold text-sm mb-2 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  {isRTL ? "اطلاعات تماس و محل" : "Contact & Location"}
                </p>
                <div className="grid grid-cols-2 gap-3 bg-muted/30 rounded-md p-3">
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "شهر" : "City"}</span>
                    <p className="font-medium">{viewItem.city || "—"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">{isRTL ? "شعبه ترجیحی" : "Preferred Branch"}</span>
                    <p className="font-medium">{getRegOptionLabel(REG_BRANCHES_LOCAL, viewItem.preferredBranch, isRTL)}</p>
                  </div>
                  {viewItem.emergencyContact && (
                    <div className="space-y-0.5">
                      <span className="text-muted-foreground">{isRTL ? "تماس اضطراری" : "Emergency Contact"}</span>
                      <p className="font-medium font-mono" dir="ltr">{viewItem.emergencyContact}</p>
                    </div>
                  )}
                  {viewItem.address && (
                    <div className="space-y-0.5 col-span-2">
                      <span className="text-muted-foreground">{isRTL ? "آدرس" : "Address"}</span>
                      <p className="font-medium">{viewItem.address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Parent/guardian (if any) */}
              {(viewItem.parentName || viewItem.parentPhone) && (
                <div>
                  <p className="font-semibold text-sm mb-2 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    {isRTL ? "اطلاعات ولی" : "Parent/Guardian"}
                  </p>
                  <div className="grid grid-cols-2 gap-3 bg-muted/30 rounded-md p-3">
                    <div className="space-y-0.5">
                      <span className="text-muted-foreground">{isRTL ? "نام ولی" : "Parent Name"}</span>
                      <p className="font-medium">{viewItem.parentName || "—"}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-muted-foreground">{isRTL ? "تلفن ولی" : "Parent Phone"}</span>
                      <p className="font-medium font-mono" dir="ltr">{viewItem.parentPhone || "—"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Referral */}
              {viewItem.referralSource && (
                <div>
                  <p className="font-semibold text-sm mb-2 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-primary" />
                    {isRTL ? "منبع آشنایی" : "Referral Source"}
                  </p>
                  <div className="grid grid-cols-2 gap-3 bg-muted/30 rounded-md p-3">
                    <div className="space-y-0.5">
                      <span className="text-muted-foreground">{isRTL ? "منبع" : "Source"}</span>
                      <p className="font-medium">{getRegOptionLabel(REG_REFERRAL_SOURCES_LOCAL, viewItem.referralSource, isRTL)}</p>
                    </div>
                    {viewItem.referralDetail && (
                      <div className="space-y-0.5">
                        <span className="text-muted-foreground">{isRTL ? "جزئیات" : "Detail"}</span>
                        <p className="font-medium">{viewItem.referralDetail}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Instructor-specific fields */}
              {(viewItem.specialtyFa || viewItem.specialtyEn || viewItem.bioFa || viewItem.bioEn || viewItem.experience) && (
                <div>
                  <p className="font-semibold text-sm mb-2 flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-primary" />
                    {isRTL ? "اطلاعات مدرسی" : "Instructor Info"}
                  </p>
                  <div className="grid grid-cols-2 gap-3 bg-muted/30 rounded-md p-3">
                    {viewItem.specialtyFa && <div className="space-y-0.5"><span className="text-muted-foreground">{isRTL ? "تخصص (فارسی)" : "Specialty (FA)"}</span><p className="font-medium">{viewItem.specialtyFa}</p></div>}
                    {viewItem.specialtyEn && <div className="space-y-0.5"><span className="text-muted-foreground">{isRTL ? "تخصص (انگلیسی)" : "Specialty (EN)"}</span><p className="font-medium">{viewItem.specialtyEn}</p></div>}
                    {viewItem.experience && <div className="space-y-0.5"><span className="text-muted-foreground">{isRTL ? "سابقه تدریس" : "Experience"}</span><p className="font-medium">{viewItem.experience}</p></div>}
                    {viewItem.bioFa && <div className="space-y-0.5 col-span-2"><span className="text-muted-foreground">{isRTL ? "بیوگرافی (فارسی)" : "Bio (FA)"}</span><p className="font-medium whitespace-pre-wrap">{viewItem.bioFa}</p></div>}
                    {viewItem.bioEn && <div className="space-y-0.5 col-span-2"><span className="text-muted-foreground">{isRTL ? "بیوگرافی (انگلیسی)" : "Bio (EN)"}</span><p className="font-medium whitespace-pre-wrap">{viewItem.bioEn}</p></div>}
                  </div>
                </div>
              )}

              {/* Review info (if reviewed) */}
              {viewItem.status !== "pending" && (
                <div>
                  <p className="font-semibold text-sm mb-2 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-primary" />
                    {isRTL ? "اطلاعات بررسی" : "Review Info"}
                  </p>
                  <div className="grid grid-cols-2 gap-3 bg-muted/30 rounded-md p-3">
                    <div className="space-y-0.5">
                      <span className="text-muted-foreground">{isRTL ? "تاریخ بررسی" : "Reviewed At"}</span>
                      <p className="font-medium">{viewItem.reviewedAt ? formatRegDateTime(viewItem.reviewedAt, isRTL) : "—"}</p>
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
              )}

              {/* Submission metadata */}
              <div className="grid grid-cols-2 gap-3 text-muted-foreground text-[10px] pt-2 border-t border-border/30">
                {viewItem.ipAddress && (
                  <div>
                    <span>{isRTL ? "آدرس IP:" : "IP:"} </span>
                    <span className="font-mono" dir="ltr">{viewItem.ipAddress}</span>
                  </div>
                )}
                <div>
                  <span>{isRTL ? "تاریخ ارسال:" : "Submitted:"} </span>
                  <span>{formatRegDateTime(viewItem.createdAt, isRTL)}</span>
                </div>
              </div>

              {/* Action buttons for pending items */}
              {viewItem.status === "pending" && (
                <div className={cn("flex gap-2 pt-2 border-t border-border/30", isRTL && "flex-row-reverse")}>
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2"
                    onClick={() => {
                      setApproveDialog({ open: true, id: viewItem.id, name: viewItem.name, nationalId: viewItem.nationalId });
                    }}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === viewItem.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {isRTL ? "تأیید و ایجاد حساب کاربری" : "Approve & Create Account"}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 rounded-xl gap-2"
                    onClick={() => {
                      setViewItem(null);
                      setRejectDialog({ open: true, id: viewItem.id, name: viewItem.name });
                    }}
                    disabled={!!actionLoading}
                  >
                    <XCircle className="w-4 h-4" />
                    {isRTL ? "رد درخواست" : "Reject"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <Dialog
        open={approveDialog.open}
        onOpenChange={(open) => { if (!open && !actionLoading) setApproveDialog({ open: false, id: "", name: "", nationalId: "" }); }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {isRTL ? `تأیید درخواست ${approveDialog.name}` : `Approve ${approveDialog.name}`}
            </DialogTitle>
            <DialogDescription className="sr-only">{isRTL ? "تأیید ایجاد حساب کاربری" : "Confirm account creation"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-emerald-700 dark:text-emerald-300">
                  {isRTL
                    ? "با تأیید این درخواست، یک حساب کاربری جدید برای هنرجو/مدرس ایجاد می‌شود."
                    : "Approving this request will create a new user account for this student/instructor."}
                </p>
              </div>
              <div className="space-y-1 ps-6">
                <p>
                  <span className="text-muted-foreground">{isRTL ? "نام کاربری (شماره تماس):" : "Username (phone):"}</span>{" "}
                  <span className="font-mono font-semibold" dir="ltr">{approveDialog.nationalId ? approveDialog.name : ""}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">{isRTL ? "رمز عبور پیش‌فرض:" : "Default password:"}</span>{" "}
                  <span className="font-mono font-semibold text-amber-600 dark:text-amber-400" dir="ltr">
                    {approveDialog.nationalId || "—"}
                  </span>
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {isRTL
                    ? "(کد ملی به عنوان رمز پیش‌فرض استفاده می‌شود — هنرجو باید پس از ورود آن را تغییر دهد)"
                    : "(National ID is used as the default password — user should change it after first login)"}
                </p>
              </div>
            </div>
            <div className={cn("flex gap-2", isRTL && "flex-row-reverse")}>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2"
                onClick={handleApprove}
                disabled={!!actionLoading}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {isRTL ? "تأیید نهایی" : "Confirm Approve"}
              </Button>
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setApproveDialog({ open: false, id: "", name: "", nationalId: "" })}
                disabled={!!actionLoading}
              >
                {isRTL ? "انصراف" : "Cancel"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) => {
          if (!open && !actionLoading) {
            setRejectDialog({ open: false, id: "", name: "" });
            setRejectionReason("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              {isRTL ? `رد درخواست ${rejectDialog.name}` : `Reject ${rejectDialog.name}`}
            </DialogTitle>
            <DialogDescription className="sr-only">{isRTL ? "فرم رد درخواست با ذکر دلیل" : "Rejection form with reason"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">{isRTL ? "دلیل رد درخواست (اختیاری)" : "Rejection reason (optional)"}</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={isRTL ? "دلیل رد درخواست را وارد کنید..." : "Enter rejection reason..."}
                className="mt-1 text-sm rounded-xl"
                rows={3}
                dir={isRTL ? "rtl" : "ltr"}
              />
            </div>
            <div className={cn("flex gap-2", isRTL && "flex-row-reverse")}>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl gap-2"
                onClick={handleReject}
                disabled={!!actionLoading}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                {isRTL ? "رد درخواست" : "Reject"}
              </Button>
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => { setRejectDialog({ open: false, id: "", name: "" }); setRejectionReason(""); }}
                disabled={!!actionLoading}
              >
                {isRTL ? "انصراف" : "Cancel"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function AdminPanel() {
  const { isRTL } = useI18n();
  const { user, isAuthenticated, logout } = useAuthStore();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [blogCategories, setBlogCategories] = useState<BlogCategory[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [enrollmentStats, setEnrollmentStats] = useState<Record<string, number>>({});
  const [courses, setCourses] = useState<Course[]>([]);
  // Dashboard data
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isAdminVisible, setIsAdminVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Course filters
  const [courseSearch, setCourseSearch] = useState("");
  const [courseFilterPublished, setCourseFilterPublished] = useState("all");
  const [courseFilterCategory, setCourseFilterCategory] = useState("all");
  const [courseFilterLevel, setCourseFilterLevel] = useState("all");

  // Instructors & branches for course form
  const [instructors, setInstructors] = useState<Array<{ id: string; name: string; specialtyFa: string | null; specialtyEn: string | null }>>([]);
  const [branches, setBranches] = useState<Array<{ id: string; nameFa: string; nameEn: string }>>([]);

  // Course dialog
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Admin messages
  const [adminMessages, setAdminMessages] = useState<AdminMessageItem[]>([]);
  const [adminMessagesUnread, setAdminMessagesUnread] = useState(0);

  // Class schedules
  const [classSchedules, setClassSchedules] = useState<ClassScheduleItem[]>([]);
  const [scheduleFilterCourse, setScheduleFilterCourse] = useState("all");
  const [scheduleFilterInstructor, setScheduleFilterInstructor] = useState("all");
  const [scheduleFilterDay, setScheduleFilterDay] = useState("all");
  const [scheduleFilterStatus, setScheduleFilterStatus] = useState("all");
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ClassScheduleItem | null>(null);
  const [isCancelScheduleDialogOpen, setIsCancelScheduleDialogOpen] = useState(false);
  const [cancellingSchedule, setCancellingSchedule] = useState<ClassScheduleItem | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // Schedule requests
  const [scheduleRequests, setScheduleRequests] = useState<ScheduleChangeRequestItem[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [requestFilterStatus, setRequestFilterStatus] = useState("all");
  const [requestFilterInstructor, setRequestFilterInstructor] = useState("all");
  const [requestFilterType, setRequestFilterType] = useState("all");
  const [isRequestReviewDialogOpen, setIsRequestReviewDialogOpen] = useState(false);
  const [reviewingRequest, setReviewingRequest] = useState<ScheduleChangeRequestItem | null>(null);
  const [adminResponseText, setAdminResponseText] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  // Registration notifications
  const [recentRegCount, setRecentRegCount] = useState(0);
  const [prevRecentRegCount, setPrevRecentRegCount] = useState(0);
  const [newRegNotification, setNewRegNotification] = useState<string | null>(null);

  // Pending online registration requests count (badge in sidebar)
  const [pendingRegCount, setPendingRegCount] = useState(0);
  const fetchPendingRegCount = useCallback(async () => {
    try {
      const res = await authFetch("/api/registration/pending?status=pending&limit=1");
      if (res.ok) {
        const d = await res.json();
        setPendingRegCount(d.summary?.pending || d.total || 0);
      }
    } catch { /* silent */ }
  }, []);

  // Enrollment filters
  const [enrollmentSearch, setEnrollmentSearch] = useState("");
  const [enrollmentPayFilter, setEnrollmentPayFilter] = useState("all");
  const [enrollmentMethodFilter, setEnrollmentMethodFilter] = useState("all");
  const [enrollmentCourseFilter, setEnrollmentCourseFilter] = useState("all");

  // Financial tab filters
  const [financialPayFilter, setFinancialPayFilter] = useState("all");
  const [financialSearch, setFinancialSearch] = useState("");

  // Testimonials
  const [testimonials, setTestimonials] = useState<Array<{
    id: string; name: string; email: string; googleAvatarUrl: string | null; googleEmail: string | null;
    rating: number; titleFa: string | null; titleEn: string | null; contentFa: string; contentEn: string | null;
    instrument: string | null; source: string; isPublished: boolean; isApproved: boolean; isFeatured: boolean;
    status: string; rejectionReason: string | null; adminNotes: string | null; createdAt: string;
  }>>([]);
  const [testimonialFilter, setTestimonialFilter] = useState("all");
  const [testimonialPendingCount, setTestimonialPendingCount] = useState(0);
  const [isTestimonialAddDialogOpen, setIsTestimonialAddDialogOpen] = useState(false);
  const [isTestimonialEditDialogOpen, setIsTestimonialEditDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<typeof testimonials[0] | null>(null);
  const [testimonialSaving, setTestimonialSaving] = useState(false);
  const [testimonialAddForm, setTestimonialAddForm] = useState({ name: "", email: "", googleAvatarUrl: "", googleEmail: "", rating: 5, titleFa: "", titleEn: "", contentFa: "", contentEn: "", instrument: "" });
  const [testimonialEditForm, setTestimonialEditForm] = useState({ name: "", email: "", googleAvatarUrl: "", googleEmail: "", rating: 5, titleFa: "", titleEn: "", contentFa: "", contentEn: "", instrument: "", isFeatured: false, adminNotes: "" });

  // Contact messages
  const [contactMessages, setContactMessages] = useState<Array<{
    id: string; name: string; email: string; phone: string | null;
    subject: string; message: string; isRead: boolean; priority: string; createdAt: string;
  }>>([]);
  const [contactMsgFilter, setContactMsgFilter] = useState("all");
  const [contactMsgUnread, setContactMsgUnread] = useState(0);
  const [contactMsgSubTab, setContactMsgSubTab] = useState<"contact" | "internal">("contact");

  // Admin Guide data
  const adminGuideSections = [
    {
      id: "user-management",
      titleFa: "مدیریت کاربران",
      titleEn: "User Management",
      icon: Users,
      fields: [
        { nameFa: "نام و نام خانوادگی", nameEn: "name", descFa: "نام کامل کاربر. این فیلد در تمام بخش‌های سیستم نمایش داده می‌شود و برای احراز هویت ضروری است.", example: "علی محمدی", tipFa: "حتماً نام و نام خانوادگی واقعی وارد شود." },
        { nameFa: "ایمیل", nameEn: "email", descFa: "آدرس ایمیل کاربر. برای ورود به سیستم و ارسال اعلانات استفاده می‌شود. باید یکتا باشد.", example: "ali@example.com", tipFa: "ایمیل قابل تغییر نیست. برای تغییر باید مدیر سیستم را مطلب کرد." },
        { nameFa: "شماره تماس", nameEn: "phone", descFa: "شماره موبایل کاربر به فرمت ایرانی. برای اطلاع‌رسانی پیامکی و تماس اضطراری استفاده می‌شود.", example: "09121234567", tipFa: "شماره باید ۱۱ رقمی و با ۰۹ شروع شود." },
        { nameFa: "نقش کاربر", nameEn: "role", descFa: "سطح دسترسی کاربر در سیستم. هنرجو = دسترسی محدود، مدرس = مدیریت دوره‌ها، مدیر = دسترسی کامل.", example: "student / instructor / admin", tipFa: "تغییر نقش تأثیر مستقیم بر دسترسی‌ها دارد. با احتیاط تغییر دهید." },
        { nameFa: "وضعیت فعالیت", nameEn: "isActive", descFa: "تعیین می‌کند آیا کاربر می‌تواند وارد سیستم شود یا خیر. غیرفعال کردن = مسدودسازی موقت.", example: "فعال / غیرفعال", tipFa: "به جای حذف کاربر، ابتدا آن را غیرفعال کنید." },
      ]
    },
    {
      id: "music-profile",
      titleFa: "پروفایل موسیقی",
      titleEn: "Music Profile",
      icon: Music,
      fields: [
        { nameFa: "ساز اصلی", nameEn: "primaryInstrument", descFa: "سازی که کاربر در حال یادگیری یا ثبت‌نام آن است. این فیلد برای فیلتر و آمارگیری استفاده می‌شود.", example: "پیانو، گیتار، ویولن، سه‌تار، تار، کمانچه، سنتور، دف، تنبک، عود، فلوت، کلارینت، ویولنسل، آواز", tipFa: "ساز اصلی با ساز ثبت‌نام ممکن است متفاوت باشد." },
        { nameFa: "ساز ثبت‌نام", nameEn: "registrationInstrument", descFa: "سازی که کاربر برای یادگیری آن ثبت‌نام کرده است. این با ساز اصلی تفاوت دارد - ساز اصلی سازی است که قبلاً می‌نوازد.", example: "پیانو", tipFa: "اگر کاربر قبلاً ساز دیگری می‌نواخته، ساز اصلی متفاوت خواهد بود." },
        { nameFa: "ساز دوم", nameEn: "secondaryInstruments", descFa: "سازهای دیگری که هنرجو می‌نوازد. اگر ساز دیگری ندارد، 'ندارد' انتخاب می‌شود.", example: "گیتار، دف", tipFa: "این فیلد چند مقداری است و می‌تواند خالی باشد." },
        { nameFa: "هدف از یادگیری", nameEn: "learningGoals", descFa: "این فیلد مشخص می‌کند کاربر با چه انگیزه‌ای موسیقی یاد می‌گیرد. این اطلاعات برای تحلیل هوش مصنوعی و پیشنهاد دوره‌های مناسب استفاده می‌شود.", example: "سرگرمی، حرفه‌ای، تدریس، اجرای زنده، آهنگسازی، آمادگی آزمون، توسعه شخصی", tipFa: "می‌تواند چند هدف همزمان انتخاب شود." },
        { nameFa: "سطح مهارت", nameEn: "skillLevel", descFa: "سطح فعلی هنرجو در ساز اصلی. برای گروه‌بندی کلاس‌ها و پیشنهاد دوره مناسب استفاده می‌شود.", example: "مبتدی، متوسط، پیشرفته، حرفه‌ای", tipFa: "این سطح توسط مدرس و بر اساس ارزیابی تعیین می‌شود." },
        { nameFa: "سابقه موسیقی (سال)", nameEn: "musicExperienceYears", descFa: "تعداد سال‌های تجربه نوازندگی کاربر. صفر به معنای بدون سابقه است.", example: "0 تا 20", tipFa: "این عدد برای تحلیل هوش مصنوعی و رتبه‌بندی هنرجویان مهم است." },
        { nameFa: "ساعات تمرین هفتگی", nameEn: "practiceHoursPerWeek", descFa: "میانگین ساعتی که هنرجو در هفته تمرین می‌کند. برای ارزیابی پیشرفت استفاده می‌شود.", example: "1 تا 20 ساعت", tipFa: "هنرجویان با ساعات تمرین بالا معمولاً پیشرفت بهتری دارند." },
        { nameFa: "ژانرهای مورد علاقه", nameEn: "musicGenres", descFa: "سبک‌های موسیقی که هنرجو علاقه‌مند است. برای پیشنهاد محتوا و دوره‌ها استفاده می‌شود.", example: "کلاسیک، سنتی ایرانی، پاپ، جاز، بلوز", tipFa: "می‌تواند چند ژانر انتخاب شود." },
      ]
    },
    {
      id: "instructor-fields",
      titleFa: "فیلدهای مدرسین",
      titleEn: "Instructor Fields",
      icon: GraduationCap,
      fields: [
        { nameFa: "نام استاد", nameEn: "instructorName", descFa: "نام استاد فعلی یا قبلی هنرجو. اگر نامشخص باشد، گزینه 'نامشخص' فعال می‌شود.", example: "استاد احمدی، نامشخص", tipFa: "اگر هنرجو استاد خاصی ندارد، 'نامشخص' را انتخاب کنید." },
        { nameFa: "تخصص (فارسی/انگلیسی)", nameEn: "specialtyFa / specialtyEn", descFa: "حوزه تخصصی مدرس به دو زبان. در صفحه مدرسین نمایش داده می‌شود.", example: "پیانو کلاسیک / Classical Piano", tipFa: "حتماً هر دو زبان پر شود." },
        { nameFa: "بیوگرافی (فارسی/انگلیسی)", nameEn: "bioFa / bioEn", descFa: "معرفی کوتاه مدرس. در صفحه پروفایل مدرس نمایش داده می‌شود.", example: "بیش از ۱۵ سال سابقه تدریس پیانو...", tipFa: "حداکثر ۵۰۰ کاراکتر توصیه می‌شود." },
        { nameFa: "سابقه تدریس", nameEn: "experience", descFa: "مدت زمان سابقه تدریس مدرس. در پروفایل عمومی نمایش داده می‌شود.", example: "۱۵ سال", tipFa: "فقط عدد و کلمه 'سال' وارد شود." },
        { nameFa: "لینک‌های اجتماعی", nameEn: "socialLinks", descFa: "لینک شبکه‌های اجتماعی مدرس (اینستاگرام، تلگرام، یوتیوب).", example: "instagram: @teacher, telegram: @teacher", tipFa: "فقط لینک‌های معتبر وارد شوند." },
      ]
    },
    {
      id: "ai-section",
      titleFa: "بخش هوش مصنوعی",
      titleEn: "AI Section",
      icon: Zap,
      fields: [
        { nameFa: "امتیاز لید", nameEn: "leadScore", descFa: "امتیازی که سیستم هوش مصنوعی بر اساس احتمال تبدیل شدن به مشتری وفادار محاسبه می‌کند (۰ تا ۱۰۰). بالای ۷۰ = مشتری بالقوه طلایی", example: "0 تا 100", tipFa: "این فیلد توسط هوش مصنوعی پر می‌شود. ادمین نیازی به پر کردن دستی ندارد." },
        { nameFa: "ارزش طول عمر مشتری", nameEn: "customerLifetimeValue", descFa: "مجموع درآمد پیش‌بینی‌شده از یک مشتری در طول دوره فعالیت. به تومان محاسبه می‌شود.", example: "5000000", tipFa: "بر اساس تاریخچه پرداخت‌ها و الگوی مصرف محاسبه می‌شود." },
        { nameFa: "ریسک ریزش", nameEn: "churnRisk", descFa: "احتمال ترک موسسه توسط کاربر. محاسبه شده توسط هوش مصنوعی. پایین/متوسط/بالا", example: "low / medium / high", tipFa: "ریسک بالا = نیاز به تماس فوری و ارائه تخفیف ویژه." },
        { nameFa: "سطح مشارکت", nameEn: "engagementScore", descFa: "امتیاز مشارکت کاربر با موسسه (۰ تا ۱۰۰). شامل لاگین‌ها، تمرین‌ها، حضور در کلاس.", example: "0 تا 100", tipFa: "مشارکت بالا معمولاً با ریزش پایین همراه است." },
        { nameFa: "برچسب بخش‌بندی هوش مصنوعی", nameEn: "aiSegmentTag", descFa: "دسته‌بندی خودکار کاربر توسط هوش مصنوعی. برای بازاریابی هدفمند استفاده می‌شود.", example: "هنرجوی فعال، مشتری بالقوه، ریزش خطر", tipFa: "فیلدهای هوش مصنوعی به صورت خودکار تحلیل و بروزرسانی می‌شوند. ادمین نیازی به پر کردن دستی ندارد." },
      ]
    },
    {
      id: "content-flags",
      titleFa: "پرچم‌های محتوا",
      titleEn: "Content Flags",
      icon: Flag,
      fields: [
        { nameFa: "منتشر / پیش‌نویس", nameEn: "isPublished", descFa: "تعیین می‌کند آیا آیتم (مقاله، کارگاه، اعلان) برای عموم قابل مشاهده است یا خیر. پیش‌نویس فقط در پنل مدیریت دیده می‌شود.", example: "true / false", tipFa: "قبل از انتشار، مطمئن شوید عنوان و محتوا تکمیل شده است." },
        { nameFa: "ویژه (ستاره)", nameEn: "isFeatured", descFa: "آیتم‌های ویژه با ستاره طلایی نمایش داده می‌شوند و در بخش‌های برجسته سایت قرار می‌گیرند.", example: "true / false", tipFa: "حداکثر ۳ آیتم را ویژه کنید تا اثرگذاری حفظ شود." },
        { nameFa: "نمایش در صفحه اصلی", nameEn: "isShowOnHome", descFa: "تعیین می‌کند آیا آیتم در صفحه اصلی سایت نمایش داده شود یا فقط در صفحه لیست.", example: "true / false", tipFa: "آیتم‌های مهم و جذاب را برای صفحه اصلی انتخاب کنید." },
        { nameFa: "جدید (خودکار)", nameEn: "isNew", descFa: "آیتم‌هایی که در ۳۰ روز اخیر ایجاد شده‌اند به صورت خودکار با بج 'جدید' نمایش داده می‌شوند. این فیلد خودکار محاسبه می‌شود.", example: "خودکار بر اساس تاریخ ایجاد", tipFa: "نیازی به تنظیم دستی ندارد. بعد از ۳۰ روز خودکار حذف می‌شود." },
        { nameFa: "تصویر کاور", nameEn: "coverUrl", descFa: "آدرس تصویر جلد آیتم. برای مقالات بلاگ الزامی است. تصاویر باید با ابعاد مناسب آپلود شوند.", example: "/blog/covers/piano-guide.png", tipFa: "ابعاد پیشنهادی: ۱۲۰۰×۶۳۰ پیکسل. فرمت WebP ترجیح داده می‌شود." },
        { nameFa: "پرطرفدار (داغ)", nameEn: "isHot", descFa: "مخصوص کارگاه‌ها. کارگاه‌های داغ با نشان آتش نمایش داده می‌شوند.", example: "true / false", tipFa: "برای کارگاه‌های با تقاضای بالا فعال کنید." },
      ]
    },
    {
      id: "registration-referral",
      titleFa: "ثبت‌نام و ارجاع",
      titleEn: "Registration & Referral",
      icon: UserPlus,
      fields: [
        { nameFa: "منبع ارجاع", nameEn: "referralSource", descFa: "طریقه آشنایی کاربر با موسسه. برای تحلیل بازاریابی و بودجه‌بندی تبلیغات استفاده می‌شود.", example: "اینستاگرام، گوگل، معرفی دوست، بنر، تلگرام، یوتیوب، سایت", tipFa: "این فیلد در زمان ثبت‌نام پر می‌شود اما قابل ویرایش است." },
        { nameFa: "جزئیات ارجاع", nameEn: "referralDetail", descFa: "توضیحات بیشتر درباره منبع ارجاع. مثلاً نام آگهی یا لینک خاص.", example: "پست اینستاگرام ۱۴۰۳/۰۶", tipFa: "اختیاری اما برای تحلیل دقیق مفید است." },
        { nameFa: "اطلاعات ولی‌", nameEn: "parentName / parentPhone / parentRelation", descFa: "اطلاعات ولی یا سرپرست هنرجویان زیر ۱۸ سال. شامل نام، تلفن و نسبت.", example: "محمد محمدی / 09121234567 / پدر", tipFa: "برای هنرجویان بزرگسال این بخش خالی می‌ماند." },
      ]
    },
    {
      id: "registration-payment",
      titleFa: "ثبت‌نام و پرداخت",
      titleEn: "Registration & Payment",
      icon: CreditCard,
      fields: [
        { nameFa: "روش ثبت‌نام", nameEn: "registrationMethod", descFa: "روش ثبت‌نام - آنلاین: خود هنرجو فرم را پر می‌کند. تلفنی: ادمین از طریق تماس ثبت‌نام می‌کند. حضوری: هنرجو حضوری مراجعه کرده.", example: "online / phone / in_person", tipFa: "روش ثبت‌نام پس از ایجاد قابل تغییر نیست." },
        { nameFa: "مبلغ شهریه", nameEn: "tuitionAmount", descFa: "مبلغ شهریه دوره به تومان. این مبلغ توسط ادمین تعیین و پیگیری می‌شود. تا زمان تغییر توسط ادمین، وضعیت پرداخت «پرداخت‌نشده» باقی می‌ماند.", example: "500000", tipFa: "برای تمام ثبت‌نام‌ها، ادمین مبلغ را تعیین و پیگیری می‌کند." },
        { nameFa: "وضعیت پرداخت", nameEn: "paymentStatus", descFa: "وضعیت پرداخت شهریه. در ثبت‌نام آنلاین، وضعیت پیش‌فرض «پرداخت‌نشده» است و ادمین پس از تماس و هماهنگی با هنرجو، آن را به «پرداخت‌شده» تغییر می‌دهد.", example: "paid / unpaid / partial / waived", tipFa: "تا زمان تغییر توسط ادمین، وضعیت پرداخت «پرداخت‌نشده» باقی می‌ماند." },
        { nameFa: "باز بودن ثبت‌نام", nameEn: "registrationOpen", descFa: "کنترل باز/بسته بودن ثبت‌نام. اگر خاموش باشد، هیچ هنرجویی نمی‌تواند ثبت‌نام کند.", example: "true / false", tipFa: "می‌توانید زمان شروع و پایان ثبت‌نام را هم تعیین کنید." },
        { nameFa: "مهلت پرداخت", nameEn: "paymentDueDate", descFa: "تاریخ مهلت پرداخت شهریه. بعد از این تاریخ، ثبت‌نام ممکن است لغو شود.", example: "1403/06/31", tipFa: "برای ثبت‌نام‌های قسطی، این تاریخ مهم است." },
        { nameFa: "شماره تراکنش", nameEn: "paymentRef", descFa: "شماره تراکنش یا رسید پرداخت. برای پیگیری و تطبیق پرداخت‌ها استفاده می‌شود.", example: "TXN-123456", tipFa: "برای پرداخت‌های حضوری یا انتقال بانکی، حتماً شماره رسید را ثبت کنید." },
      ]
    },
  ];

  // Blog section state
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

  // Dialog states
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [isWorkshopDialogOpen, setIsWorkshopDialogOpen] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [isBlogPostDialogOpen, setIsBlogPostDialogOpen] = useState(false);
  const [editingBlogPost, setEditingBlogPost] = useState<BlogPost | null>(null);
  const [isBlogCategoryDialogOpen, setIsBlogCategoryDialogOpen] = useState(false);
  const [editingBlogCategory, setEditingBlogCategory] = useState<BlogCategory | null>(null);

  const [isEnrollmentEditDialogOpen, setIsEnrollmentEditDialogOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<Enrollment | null>(null);
  const [isEnrollmentViewDialogOpen, setIsEnrollmentViewDialogOpen] = useState(false);
  const [viewingEnrollment, setViewingEnrollment] = useState<Enrollment | null>(null);
  const [isNewRegistrationOpen, setIsNewRegistrationOpen] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Check if user is admin (userType "admin" covers both super_admin and admin roles)
  const isAdmin = isAuthenticated && user?.userType === "admin";

  // Filtered blog categories based on search
  const filteredBlogCategories = categorySearch.trim()
    ? blogCategories.filter(cat =>
        cat.nameFa.includes(categorySearch) ||
        cat.nameEn.toLowerCase().includes(categorySearch.toLowerCase()) ||
        cat.slugFa.includes(categorySearch) ||
        cat.slugEn.toLowerCase().includes(categorySearch.toLowerCase())
      )
    : blogCategories;

  // Fetch data
  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await authFetch("/api/announcements");
      if (res.ok) setAnnouncements(await res.json());
    } catch {
      showToast(isRTL ? "خطا در بارگذاری" : "Failed to load", "error");
    }
  }, [isRTL, showToast]);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await authFetch("/api/students");
      if (res.ok) setStudents(await res.json());
    } catch {
      showToast(isRTL ? "خطا در بارگذاری" : "Failed to load", "error");
    }
  }, [isRTL, showToast]);

  const fetchWorkshops = useCallback(async () => {
    try {
      const res = await authFetch("/api/workshops");
      if (res.ok) setWorkshops(await res.json());
    } catch {
      showToast(isRTL ? "خطا در بارگذاری" : "Failed to load", "error");
    }
  }, [isRTL, showToast]);

  const fetchBlogPosts = useCallback(async () => {
    try {
      const res = await authFetch("/api/blog?all=true&pageSize=100");
      if (res.ok) {
        const data = await res.json();
        setBlogPosts(data.posts || (Array.isArray(data) ? data : []));
      }
    } catch {
      showToast(isRTL ? "خطا در بارگذاری مقالات" : "Failed to load posts", "error");
    }
  }, [isRTL, showToast]);

  const fetchBlogCategories = useCallback(async () => {
    try {
      const res = await authFetch("/api/blog-categories?all=true");
      if (res.ok) setBlogCategories(await res.json());
    } catch {
      showToast(isRTL ? "خطا در بارگذاری دسته‌ها" : "Failed to load categories", "error");
    }
  }, [isRTL, showToast]);

  const fetchEnrollments = useCallback(async () => {
    try {
      const res = await authFetch("/api/admin/enrollments?limit=100");
      if (res.ok) {
        const data = await res.json();
        setEnrollments(data.enrollments || []);
        setEnrollmentStats(data.stats || {});
      }
    } catch {
      showToast(isRTL ? "خطا در بارگذاری ثبت‌نام‌ها" : "Failed to load enrollments", "error");
    }
  }, [isRTL, showToast]);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await authFetch("/api/admin/courses?all=true");
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
        // Extract branches from courses
        const branchMap = new Map<string, { id: string; nameFa: string; nameEn: string }>();
        (data.courses || []).forEach((c: Course) => {
          if (c.branch && c.branch.id) branchMap.set(c.branch.id, c.branch);
        });
        setBranches(Array.from(branchMap.values()));
      }
    } catch {
      // silently fail
    }
  }, []);

  const fetchInstructors = useCallback(async () => {
    try {
      const res = await authFetch("/api/admin/instructors?limit=100");
      if (res.ok) {
        const data = await res.json();
        setInstructors((data.instructors || []).map((i: { id: string; name: string; specialtyFa: string | null; specialtyEn: string | null }) => ({
          id: i.id, name: i.name, specialtyFa: i.specialtyFa, specialtyEn: i.specialtyEn,
        })));
      }
    } catch {
      // silently fail
    }
  }, []);

  const fetchAdminMessages = useCallback(async () => {
    try {
      const res = await authFetch("/api/admin/admin-messages?filter=all&limit=50");
      if (res.ok) {
        const data = await res.json();
        setAdminMessages(data.messages || []);
        setAdminMessagesUnread(data.unreadCount || 0);
      }
    } catch {
      // silently fail
    }
  }, []);

  const fetchClassSchedules = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (scheduleFilterCourse !== "all") params.set("courseId", scheduleFilterCourse);
      if (scheduleFilterInstructor !== "all") params.set("instructorId", scheduleFilterInstructor);
      if (scheduleFilterDay !== "all") params.set("dayOfWeek", scheduleFilterDay);
      if (scheduleFilterStatus !== "all") params.set("status", scheduleFilterStatus);
      params.set("limit", "100");
      const res = await authFetch(`/api/admin/class-schedules?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setClassSchedules(data.schedules || []);
      }
    } catch {
      // silently fail
    }
  }, [scheduleFilterCourse, scheduleFilterInstructor, scheduleFilterDay, scheduleFilterStatus]);

  const fetchScheduleRequests = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (requestFilterStatus !== "all") params.set("status", requestFilterStatus);
      if (requestFilterInstructor !== "all") params.set("instructorId", requestFilterInstructor);
      if (requestFilterType !== "all") params.set("requestType", requestFilterType);
      params.set("limit", "50");
      const res = await authFetch(`/api/admin/schedule-requests?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setScheduleRequests(data.requests || []);
        setPendingRequestsCount(data.pendingCount || 0);
      }
    } catch {
      // silently fail
    }
  }, [requestFilterStatus, requestFilterInstructor, requestFilterType]);

  const fetchRecentRegistrations = useCallback(async () => {
    try {
      const res = await authFetch("/api/admin/dashboard");
      if (res.ok) {
        const data = await res.json();
        const reg24 = data.metrics?.recentRegistrations24h || 0;
        const enr24 = data.metrics?.recentEnrollments24h || 0;
        const total = reg24 + enr24;
        // Check if new registrations appeared
        if (prevRecentRegCount > 0 && total > prevRecentRegCount) {
          const diff = total - prevRecentRegCount;
          setNewRegNotification(isRTL
            ? `${diff} \u062b\u0628\u062a\u200c\u0646\u0627\u0645 \u062c\u062f\u06cc\u062f \u062f\u0631 \u06f2\u06f4 \u0633\u0627\u0639\u062a \u06af\u0630\u0634\u062a\u0647`
            : `${diff} new registration(s) in last 24h`
          );
          setTimeout(() => setNewRegNotification(null), 5000);
        }
        setPrevRecentRegCount(total);
        setRecentRegCount(total);
        // Also update contact messages unread count from dashboard
        if (data.metrics?.unreadContactMessages !== undefined) {
          setContactMsgUnread(data.metrics.unreadContactMessages);
        }
      }
    } catch {
      // silently fail
    }
  }, [prevRecentRegCount, isRTL]);

  // Update category order
  const handleUpdateCategoryOrder = useCallback(async (id: string, newOrder: number) => {
    try {
      const res = await authFetch(`/api/blog-categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: newOrder }),
      });
      if (!res.ok) throw new Error();
      fetchBlogCategories();
    } catch {
      showToast(isRTL ? "خطا در بروزرسانی ترتیب" : "Failed to update order", "error");
    }
  }, [isRTL, showToast, fetchBlogCategories]);

  const fetchTestimonials = useCallback(async () => {
    try {
      const res = await authFetch(`/api/admin/testimonials?filter=${testimonialFilter}&limit=200`);
      if (res.ok) {
        const d = await res.json();
        setTestimonials(d.testimonials || []);
        setTestimonialPendingCount(d.pendingCount || 0);
      }
    } catch { /* ignore */ }
  }, [testimonialFilter]);

  const fetchContactMessages = useCallback(async () => {
    try {
      const res = await authFetch(`/api/admin/messages?filter=${contactMsgFilter}&limit=200`);
      if (res.ok) {
        const d = await res.json();
        setContactMessages(d.messages || []);
        setContactMsgUnread(d.unreadCount || 0);
      }
    } catch { /* ignore */ }
  }, [contactMsgFilter]);

  const fetchDashboard = useCallback(async () => {
    setIsDashboardLoading(true);
    try {
      const res = await authFetch("/api/admin/dashboard");
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch { /* ignore */ }
    finally { setIsDashboardLoading(false); }
  }, []);

  useEffect(() => { if (isAdminVisible) fetchTestimonials(); }, [isAdminVisible, fetchTestimonials]);
  useEffect(() => { if (isAdminVisible) fetchContactMessages(); }, [isAdminVisible, fetchContactMessages]);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchAnnouncements(), fetchStudents(), fetchWorkshops(), fetchBlogPosts(), fetchBlogCategories(), fetchEnrollments(), fetchCourses(), fetchInstructors(), fetchAdminMessages(), fetchRecentRegistrations(), fetchClassSchedules(), fetchScheduleRequests(), fetchTestimonials(), fetchContactMessages(), fetchDashboard(), fetchPendingRegCount()]);
    setIsLoading(false);
  }, [fetchAnnouncements, fetchStudents, fetchWorkshops, fetchBlogPosts, fetchBlogCategories, fetchEnrollments, fetchCourses, fetchInstructors, fetchAdminMessages, fetchRecentRegistrations, fetchClassSchedules, fetchScheduleRequests, fetchTestimonials, fetchContactMessages, fetchDashboard, fetchPendingRegCount]);

  useEffect(() => {
    if (isAdminVisible) fetchAll();
  }, [isAdminVisible, fetchAll]);

  // Polling for new registrations every 30 seconds
  useEffect(() => {
    if (!isAdminVisible) return;
    const interval = setInterval(() => {
      fetchRecentRegistrations();
      fetchPendingRegCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [isAdminVisible, fetchRecentRegistrations, fetchPendingRegCount]);

  // Auto-refresh dashboard every 60 seconds
  useEffect(() => {
    if (!isAdminVisible) return;
    const interval = setInterval(() => {
      fetchDashboard();
    }, 60000);
    return () => clearInterval(interval);
  }, [isAdminVisible, fetchDashboard]);

  // Announcement handlers
  const handleSaveAnnouncement = useCallback(async (data: Record<string, unknown>) => {
    try {
      if (editingAnnouncement) {
        const res = await authFetch(`/api/announcements/${editingAnnouncement.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        showToast(isRTL ? "اعلان بروزرسانی شد" : "Announcement updated");
      } else {
        const res = await authFetch("/api/announcements", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        showToast(isRTL ? "اعلان جدید ایجاد شد" : "Announcement created");
      }
      setIsAnnouncementDialogOpen(false);
      setEditingAnnouncement(null);
      fetchAnnouncements();
    } catch {
      showToast(isRTL ? "خطا در ذخیره" : "Failed to save", "error");
    }
  }, [editingAnnouncement, isRTL, showToast, fetchAnnouncements]);

  const handleDeleteAnnouncement = useCallback(async (id: string) => {
    try {
      const res = await authFetch(`/api/announcements/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast(isRTL ? "اعلان حذف شد" : "Announcement deleted");
      fetchAnnouncements();
    } catch {
      showToast(isRTL ? "خطا در حذف" : "Failed to delete", "error");
    }
  }, [isRTL, showToast, fetchAnnouncements]);

  // Workshop handlers
  const handleSaveWorkshop = useCallback(async (data: Record<string, unknown>) => {
    try {
      if (editingWorkshop) {
        const res = await authFetch(`/api/workshops/${editingWorkshop.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        showToast(isRTL ? "کارگاه بروزرسانی شد" : "Workshop updated");
      } else {
        const res = await authFetch("/api/workshops", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        showToast(isRTL ? "کارگاه جدید ایجاد شد" : "Workshop created");
      }
      setIsWorkshopDialogOpen(false);
      setEditingWorkshop(null);
      fetchWorkshops();
    } catch {
      showToast(isRTL ? "خطا در ذخیره" : "Failed to save", "error");
    }
  }, [editingWorkshop, isRTL, showToast, fetchWorkshops]);

  const handleDeleteWorkshop = useCallback(async (id: string) => {
    try {
      const res = await authFetch(`/api/workshops/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast(isRTL ? "کارگاه حذف شد" : "Workshop deleted");
      fetchWorkshops();
    } catch {
      showToast(isRTL ? "خطا در حذف" : "Failed to delete", "error");
    }
  }, [isRTL, showToast, fetchWorkshops]);

  // Student handlers
  const handleCreateStudent = useCallback(async (data: Record<string, unknown>) => {
    try {
      const res = await authFetch("/api/students", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error);
      }
      showToast(isRTL ? "کاربر جدید ایجاد شد" : "User created");
      setIsStudentDialogOpen(false);
      fetchStudents();
    } catch (err) {
      showToast((err as Error).message || (isRTL ? "خطا در ایجاد" : "Failed to create"), "error");
    }
  }, [isRTL, showToast, fetchStudents]);

  // Blog category handlers
  const handleSaveBlogCategory = useCallback(async (data: Record<string, unknown>) => {
    try {
      if (editingBlogCategory) {
        const res = await authFetch(`/api/blog-categories/${editingBlogCategory.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        showToast(isRTL ? "دسته بروزرسانی شد" : "Category updated");
      } else {
        const res = await authFetch("/api/blog-categories", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        showToast(isRTL ? "دسته جدید ایجاد شد" : "Category created");
      }
      setIsBlogCategoryDialogOpen(false);
      setEditingBlogCategory(null);
      fetchBlogCategories();
    } catch {
      showToast(isRTL ? "خطا در ذخیره دسته" : "Failed to save category", "error");
    }
  }, [editingBlogCategory, isRTL, showToast, fetchBlogCategories]);

  const handleDeleteBlogCategory = useCallback(async (id: string) => {
    try {
      const res = await authFetch(`/api/blog-categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast(isRTL ? "دسته حذف شد" : "Category deleted");
      fetchBlogCategories();
    } catch {
      showToast(isRTL ? "خطا در حذف دسته" : "Failed to delete category", "error");
    }
  }, [isRTL, showToast, fetchBlogCategories]);

  // Blog post handlers
  const handleSaveBlogPost = useCallback(async (data: Record<string, unknown>) => {
    try {
      if (editingBlogPost) {
        const res = await authFetch(`/api/blog/${editingBlogPost.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        showToast(isRTL ? "مقاله بروزرسانی شد" : "Post updated");
      } else {
        const res = await authFetch("/api/blog", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        showToast(isRTL ? "مقاله جدید ایجاد شد" : "Post created");
      }
      setIsBlogPostDialogOpen(false);
      setEditingBlogPost(null);
      fetchBlogPosts();
    } catch {
      showToast(isRTL ? "خطا در ذخیره مقاله" : "Failed to save post", "error");
    }
  }, [editingBlogPost, isRTL, showToast, fetchBlogPosts]);

  const handleDeleteBlogPost = useCallback(async (id: string) => {
    try {
      const res = await authFetch(`/api/blog/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast(isRTL ? "مقاله حذف شد" : "Post deleted");
      fetchBlogPosts();
    } catch {
      showToast(isRTL ? "خطا در حذف مقاله" : "Failed to delete post", "error");
    }
  }, [isRTL, showToast, fetchBlogPosts]);

  // Course handlers
  const handleSaveCourse = useCallback(async (data: Record<string, unknown>) => {
    try {
      if (editingCourse) {
        const res = await authFetch(`/api/admin/courses/${editingCourse.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        showToast(isRTL ? "دوره بروزرسانی شد" : "Course updated");
      } else {
        const res = await authFetch("/api/admin/courses", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        showToast(isRTL ? "دوره جدید ایجاد شد" : "Course created");
      }
      setIsCourseDialogOpen(false);
      setEditingCourse(null);
      fetchCourses();
    } catch {
      showToast(isRTL ? "خطا در ذخیره دوره" : "Failed to save course", "error");
    }
  }, [editingCourse, isRTL, showToast, fetchCourses]);

  const handleDeleteCourse = useCallback(async (id: string) => {
    try {
      const res = await authFetch(`/api/admin/courses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "");
      }
      showToast(isRTL ? "دوره حذف شد" : "Course deleted");
      fetchCourses();
    } catch (err) {
      showToast((err as Error).message || (isRTL ? "خطا در حذف" : "Failed to delete"), "error");
    }
  }, [isRTL, showToast, fetchCourses]);

  const handleMarkMessageRead = useCallback(async (id: string) => {
    try {
      const res = await authFetch("/api/admin/admin-messages", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "read" }),
      });
      if (!res.ok) throw new Error();
      fetchAdminMessages();
    } catch {
      // silently fail
    }
  }, [fetchAdminMessages]);

  // Enrollment handlers
  const handleSaveEnrollment = useCallback(async (id: string, data: Record<string, unknown>) => {
    try {
      const res = await authFetch(`/api/admin/enrollments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      showToast(isRTL ? "ثبت‌نام بروزرسانی شد" : "Enrollment updated");
      setIsEnrollmentEditDialogOpen(false);
      setEditingEnrollment(null);
      fetchEnrollments();
    } catch {
      showToast(isRTL ? "خطا در ذخیره ثبت‌نام" : "Failed to save enrollment", "error");
    }
  }, [isRTL, showToast, fetchEnrollments]);

  const handleDropEnrollment = useCallback(async (id: string) => {
    try {
      const res = await authFetch(`/api/admin/enrollments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast(isRTL ? "ثبت‌نام لغو شد" : "Enrollment dropped");
      fetchEnrollments();
    } catch {
      showToast(isRTL ? "خطا در لغو ثبت‌نام" : "Failed to drop enrollment", "error");
    }
  }, [isRTL, showToast, fetchEnrollments]);

  // Schedule handlers
  const handleSaveSchedule = useCallback(async (data: Record<string, unknown>) => {
    try {
      if (editingSchedule) {
        const res = await authFetch(`/api/admin/class-schedules/${editingSchedule.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        showToast(isRTL ? "برنامه کلاس بروزرسانی شد" : "Schedule updated");
      } else {
        const res = await authFetch("/api/admin/class-schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "");
        }
        showToast(isRTL ? "برنامه کلاس جدید ایجاد شد" : "Schedule created");
      }
      setIsScheduleDialogOpen(false);
      setEditingSchedule(null);
      fetchClassSchedules();
    } catch (err) {
      showToast((err as Error).message || (isRTL ? "خطا در ذخیره برنامه" : "Failed to save schedule"), "error");
    }
  }, [editingSchedule, isRTL, showToast, fetchClassSchedules]);

  const handleCancelSchedule = useCallback(async () => {
    if (!cancellingSchedule || !cancelReason.trim()) return;
    try {
      const res = await authFetch(`/api/admin/class-schedules/${cancellingSchedule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled", cancelReason: cancelReason.trim() }),
      });
      if (!res.ok) throw new Error();
      showToast(isRTL ? "برنامه کلاس لغو شد" : "Schedule cancelled");
      setIsCancelScheduleDialogOpen(false);
      setCancellingSchedule(null);
      setCancelReason("");
      fetchClassSchedules();
    } catch {
      showToast(isRTL ? "خطا در لغو برنامه" : "Failed to cancel schedule", "error");
    }
  }, [cancellingSchedule, cancelReason, isRTL, showToast, fetchClassSchedules]);

  const handleDeleteSchedule = useCallback(async (id: string) => {
    try {
      const res = await authFetch(`/api/admin/class-schedules/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast(isRTL ? "برنامه حذف شد" : "Schedule deleted");
      fetchClassSchedules();
    } catch {
      showToast(isRTL ? "خطا در حذف برنامه" : "Failed to delete schedule", "error");
    }
  }, [isRTL, showToast, fetchClassSchedules]);

  // Schedule request handlers
  const handleApproveRequest = useCallback(async () => {
    if (!reviewingRequest) return;
    try {
      const res = await authFetch(`/api/admin/schedule-requests/${reviewingRequest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", adminResponse: adminResponseText.trim() || null }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "");
      }
      showToast(isRTL ? "درخواست تأیید شد و تغییرات اعمال گردید" : "Request approved & changes applied");
      setIsRequestReviewDialogOpen(false);
      setReviewingRequest(null);
      setAdminResponseText("");
      setRejectReason("");
      fetchScheduleRequests();
      fetchClassSchedules();
    } catch (err) {
      showToast((err as Error).message || (isRTL ? "خطا در تأیید درخواست" : "Failed to approve request"), "error");
    }
  }, [reviewingRequest, adminResponseText, isRTL, showToast, fetchScheduleRequests, fetchClassSchedules]);

  const handleRejectRequest = useCallback(async () => {
    if (!reviewingRequest || !rejectReason.trim()) return;
    try {
      const res = await authFetch(`/api/admin/schedule-requests/${reviewingRequest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", adminResponse: rejectReason.trim() }),
      });
      if (!res.ok) throw new Error();
      showToast(isRTL ? "درخواست رد شد" : "Request rejected");
      setIsRequestReviewDialogOpen(false);
      setReviewingRequest(null);
      setAdminResponseText("");
      setRejectReason("");
      fetchScheduleRequests();
    } catch {
      showToast(isRTL ? "خطا در رد درخواست" : "Failed to reject request", "error");
    }
  }, [reviewingRequest, rejectReason, isRTL, showToast, fetchScheduleRequests]);

  const getTypeConfig = (type: string) => typeOptions.find(t => t.value === type) || typeOptions[0];

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setIsAdminVisible(false);
    } catch {
      showToast(isRTL ? "خطا در خروج" : "Failed to logout", "error");
    }
  }, [logout, isRTL, showToast]);

  const getTabLabel = useCallback((tab: string) => {
    const labels: Record<string, { fa: string; en: string }> = {
      dashboard: { fa: "داشبورد", en: "Dashboard" },
      announcements: { fa: "اعلانات", en: "Announcements" },
      workshops: { fa: "کارگاه‌ها", en: "Workshops" },
      courses: { fa: "دوره‌ها", en: "Courses" },
      schedules: { fa: "برنامه کلاس", en: "Schedules" },
      "schedule-requests": { fa: "درخواست‌ها", en: "Requests" },
      registrations: { fa: "ثبت‌نام‌ها", en: "Registrations" },
      "pending-registrations": { fa: "درخواست‌های ثبت‌نام", en: "Pending Registrations" },
      financial: { fa: "مالی", en: "Financial" },
      users: { fa: "کاربران", en: "Users" },
      messages: { fa: "پیام‌ها", en: "Messages" },
      blog: { fa: "بلاگ", en: "Blog" },
      testimonials: { fa: "بازخوردها", en: "Reviews" },
      guide: { fa: "راهنما", en: "Guide" },
    };
    const label = labels[tab];
    return label ? (isRTL ? label.fa : label.en) : tab;
  }, [isRTL]);

  return (
    <>
      {/* Admin Toggle Button — only visible for admin/super_admin users */}
      {isAdmin && (
        <motion.button
          onClick={() => setIsAdminVisible(!isAdminVisible)}
          className="fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/40 flex items-center justify-center hover:bg-primary/90 transition-all duration-300 hover:scale-110"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Toggle Admin Panel"
        >
          <Shield className="w-5 h-5" />
        </motion.button>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-1/2 z-[60] flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl backdrop-blur-xl"
            style={{
              background: toast.type === "success"
                ? "oklch(0.95 0.05 155 / 0.95)"
                : "oklch(0.95 0.05 25 / 0.95)",
            }}
          >
            {toast.type === "success"
              ? <CheckCircle2 className="w-4 h-4 text-green-600" />
              : <XCircle className="w-4 h-4 text-red-600" />
            }
            <span className="text-sm font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Registration Notification Banner */}
      <AnimatePresence>
        {newRegNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 z-[70] flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-xl backdrop-blur-xl bg-primary text-primary-foreground"
          >
            <Bell className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-medium">{newRegNotification}</span>
            <Button variant="ghost" size="icon" className="w-6 h-6 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setNewRegNotification(null)}>
              <X className="w-3 h-3" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Panel — Full Screen */}
      <AnimatePresence>
        {isAdminVisible && isAdmin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-background flex"
            dir={isRTL ? "rtl" : "ltr"}
          >
            {/* Sidebar */}
            <aside className="h-full bg-muted/30 border-e border-border flex flex-col shrink-0 w-52">
              {/* Sidebar Header */}
              <div className="p-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-bold truncate">{isRTL ? "پنل مدیریت" : "Admin Panel"}</h2>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {user?.name || (isRTL ? "مدیر" : "Admin")}
                      <Badge variant="outline" className="text-[8px] px-1 py-0 ms-1 border-primary/30 text-primary">
                        {user?.role === "super_admin" ? (isRTL ? "مدیرکل" : "Super Admin") : (isRTL ? "مدیر" : "Admin")}
                      </Badge>
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsAdminVisible(false)} className="w-7 h-7 shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Sidebar Navigation */}
              <ScrollArea className="flex-1">
                <div className="p-2">
                  {/* Group: Overview */}
                  <div className="px-2 pt-2 pb-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {isRTL ? "نمای کلی" : "Overview"}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors",
                      activeTab === "dashboard"
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <LayoutDashboard className="w-4 h-4 shrink-0" />
                    <span>{isRTL ? "داشبورد" : "Dashboard"}</span>
                  </button>

                  {/* Group: Content */}
                  <div className="px-2 pt-3 pb-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {isRTL ? "محتوا" : "Content"}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab("announcements")}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors",
                      activeTab === "announcements"
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Megaphone className="w-4 h-4 shrink-0" />
                    <span>{isRTL ? "اعلانات" : "News"}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("workshops")}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors",
                      activeTab === "workshops"
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <GraduationCap className="w-4 h-4 shrink-0" />
                    <span>{isRTL ? "کارگاه‌ها" : "Workshops"}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("courses")}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors",
                      activeTab === "courses"
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Music className="w-4 h-4 shrink-0" />
                    <span>{isRTL ? "دوره‌ها" : "Courses"}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("blog")}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors",
                      activeTab === "blog"
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <BookOpen className="w-4 h-4 shrink-0" />
                    <span>{isRTL ? "بلاگ" : "Blog"}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("testimonials")}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors",
                      activeTab === "testimonials"
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Star className="w-4 h-4 shrink-0" />
                    <span>{isRTL ? "بازخوردها" : "Reviews"}</span>
                  </button>

                  {/* Group: Schedule */}
                  <div className="px-2 pt-3 pb-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {isRTL ? "برنامه‌ریزی" : "Schedule"}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab("schedules")}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors",
                      activeTab === "schedules"
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <CalendarClock className="w-4 h-4 shrink-0" />
                    <span>{isRTL ? "برنامه کلاس" : "Schedules"}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("schedule-requests")}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors",
                      activeTab === "schedule-requests"
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <ClipboardList className="w-4 h-4 shrink-0" />
                    <span>{isRTL ? "درخواست‌ها" : "Requests"}</span>
                    {pendingRequestsCount > 0 && (
                      <span className="ms-auto w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center">{pendingRequestsCount > 9 ? "9+" : pendingRequestsCount}</span>
                    )}
                  </button>

                  {/* Group: Registration */}
                  <div className="px-2 pt-3 pb-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {isRTL ? "ثبت‌نام و مالی" : "Registration"}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab("registrations")}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors",
                      activeTab === "registrations"
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <CreditCard className="w-4 h-4 shrink-0" />
                    <span>{isRTL ? "ثبت‌نام‌ها" : "Registration"}</span>
                    {recentRegCount > 0 && (
                      <span className="ms-auto w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">{recentRegCount > 9 ? "9+" : recentRegCount}</span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("pending-registrations")}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors",
                      activeTab === "pending-registrations"
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <ClipboardList className="w-4 h-4 shrink-0" />
                    <span>{isRTL ? "درخواست‌های ثبت‌نام" : "Pending Registrations"}</span>
                    {pendingRegCount > 0 && (
                      <span className="ms-auto w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center">{pendingRegCount > 9 ? "9+" : pendingRegCount}</span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("financial")}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors",
                      activeTab === "financial"
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Wallet className="w-4 h-4 shrink-0" />
                    <span>{isRTL ? "مالی" : "Financial"}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("users")}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors",
                      activeTab === "users"
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Users className="w-4 h-4 shrink-0" />
                    <span>{isRTL ? "کاربران" : "Users"}</span>
                  </button>

                  {/* Group: Communication */}
                  <div className="px-2 pt-3 pb-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {isRTL ? "ارتباطات" : "Communication"}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab("messages")}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors",
                      activeTab === "messages"
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    <span>{isRTL ? "پیام‌ها" : "Messages"}</span>
                    {adminMessagesUnread > 0 && (
                      <span className="ms-auto w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">{adminMessagesUnread > 9 ? "9+" : adminMessagesUnread}</span>
                    )}
                  </button>

                  {/* Group: Help */}
                  <div className="px-2 pt-3 pb-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {isRTL ? "راهنما" : "Help"}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab("guide")}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors",
                      activeTab === "guide"
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <BookOpen className="w-4 h-4 shrink-0" />
                    <span>{isRTL ? "راهنما" : "Guide"}</span>
                  </button>
                </div>
              </ScrollArea>

              {/* Sidebar Footer */}
              <div className="p-2 border-t border-border space-y-1">
                <Button variant="ghost" size="sm" onClick={fetchAll} className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
                  <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
                  <span className="text-xs">{isRTL ? "بروزرسانی" : "Refresh"}</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive">
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="text-xs">{isRTL ? "خروج" : "Logout"}</span>
                </Button>
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto">
              <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border/50 px-6 py-3">
                <h2 className="text-lg font-semibold">{getTabLabel(activeTab)}</h2>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                {/* Dashboard Tab */}
                {activeTab === "dashboard" && (<>
                  {isDashboardLoading && !dashboardData ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : dashboardData ? (() => {
                    const m = dashboardData.metrics;
                    const jalaliNow = getCurrentJalaali();
                    const todayStr = isRTL
                      ? `${toPersianDigits(jalaliNow.jd)} ${JALALI_MONTHS_FA[jalaliNow.jm - 1]} ${toPersianDigits(jalaliNow.jy)}`
                      : `${jalaliNow.jd} ${JALALI_MONTHS_EN[jalaliNow.jm - 1]} ${jalaliNow.jy}`;

                    // Stat cards
                    const statCards = [
                      {
                        icon: UserPlus,
                        labelFa: "ثبت‌نام‌های امروز",
                        labelEn: "Today's Registrations",
                        value: m.recentRegistrations24h + m.recentEnrollments24h,
                        color: "from-amber-500/15 to-amber-500/5",
                        iconBg: "bg-amber-500/15",
                        iconColor: "text-amber-600 dark:text-amber-400",
                      },
                      {
                        icon: GraduationCap,
                        labelFa: "کارگاه‌های آینده",
                        labelEn: "Upcoming Workshops",
                        value: (dashboardData.upcomingWorkshops || []).length,
                        color: "from-teal-500/15 to-teal-500/5",
                        iconBg: "bg-teal-500/15",
                        iconColor: "text-teal-600 dark:text-teal-400",
                      },
                      {
                        icon: Mail,
                        labelFa: "پیام‌های خوانده‌نشده",
                        labelEn: "Unread Messages",
                        value: m.unreadContactMessages + m.unreadAdminMessages,
                        color: "from-rose-500/15 to-rose-500/5",
                        iconBg: "bg-rose-500/15",
                        iconColor: "text-rose-600 dark:text-rose-400",
                      },
                      {
                        icon: Bell,
                        labelFa: "اطلاعیه‌های فعال",
                        labelEn: "Active Announcements",
                        value: m.totalAnnouncements,
                        color: "from-primary/15 to-primary/5",
                        iconBg: "bg-primary/15",
                        iconColor: "text-primary",
                      },
                    ];

                    // Quick actions
                    const quickActions = [
                      { icon: Megaphone, label: isRTL ? "اعلان جدید" : "New Announcement", tab: "announcements" as const, color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20" },
                      { icon: GraduationCap, label: isRTL ? "کارگاه جدید" : "New Workshop", tab: "workshops" as const, color: "bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20" },
                      { icon: Music, label: isRTL ? "دوره جدید" : "New Course", tab: "courses" as const, color: "bg-primary/10 text-primary hover:bg-primary/20" },
                      { icon: CreditCard, label: isRTL ? "ثبت‌نام‌ها" : "Registrations", tab: "registrations" as const, color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20" },
                      { icon: MessageSquare, label: isRTL ? "پیام‌ها" : "Messages", tab: "messages" as const, color: "bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20" },
                      { icon: Wallet, label: isRTL ? "مالی" : "Financial", tab: "financial" as const, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20" },
                    ];

                    // Recent activity items
                    const activityItems: Array<{
                      id: string; type: "registration" | "enrollment" | "workshop";
                      name: string; detail: string; time: string; isNew: boolean;
                    }> = [];
                    for (const r of dashboardData.recentRegistrations?.slice(0, 5) || []) {
                      activityItems.push({
                        id: r.id, type: "registration", name: r.name,
                        detail: r.primaryInstrument || r.role, time: r.createdAt,
                        isNew: Date.now() - new Date(r.createdAt).getTime() < 86400000,
                      });
                    }
                    for (const e of dashboardData.recentEnrollmentsList?.slice(0, 5) || []) {
                      activityItems.push({
                        id: e.id, type: "enrollment",
                        name: e.student.name,
                        detail: isRTL ? e.course.titleFa : e.course.titleEn,
                        time: e.enrolledAt,
                        isNew: Date.now() - new Date(e.enrolledAt).getTime() < 86400000,
                      });
                    }
                    for (const w of dashboardData.upcomingWorkshops?.slice(0, 3) || []) {
                      activityItems.push({
                        id: w.id, type: "workshop",
                        name: isRTL ? w.titleFa : w.titleEn,
                        detail: isRTL ? `${toPersianDigits(w.reservedSeats)}/${toPersianDigits(w.totalSeats)} صندلی` : `${w.reservedSeats}/${w.totalSeats} seats`,
                        time: w.date,
                        isNew: false,
                      });
                    }
                    activityItems.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

                    // Priority alerts
                    const priorityAlerts: Array<{
                      id: string; type: "urgent" | "warning" | "info"; icon: typeof Bell;
                      label: string; detail: string; tab?: string;
                    }> = [];
                    if ((m.unpaidEnrollments || 0) > 0) priorityAlerts.push({
                      id: "unpaid", type: "urgent", icon: CreditCard,
                      label: isRTL ? "ثبت‌نام تسویه‌نشده" : "Unpaid Enrollments",
                      detail: isRTL ? `${toPersianDigits(m.unpaidEnrollments)} ثبت‌نام نیازمند پیگیری مالی` : `${m.unpaidEnrollments} enrollments need payment follow-up`,
                      tab: "financial",
                    });
                    if ((m.unreadContactMessages + m.unreadAdminMessages) > 0) priorityAlerts.push({
                      id: "messages", type: "warning", icon: Mail,
                      label: isRTL ? "پیام‌های خوانده‌نشده" : "Unread Messages",
                      detail: isRTL ? `${toPersianDigits(m.unreadContactMessages + m.unreadAdminMessages)} پیام خوانده‌نشده` : `${m.unreadContactMessages + m.unreadAdminMessages} unread messages`,
                      tab: "messages",
                    });
                    if ((m.pendingTestimonials || 0) > 0) priorityAlerts.push({
                      id: "testimonials", type: "warning", icon: Star,
                      label: isRTL ? "بازخوردهای در انتظار" : "Pending Testimonials",
                      detail: isRTL ? `${toPersianDigits(m.pendingTestimonials)} بازخورد نیازمند بررسی` : `${m.pendingTestimonials} testimonials need review`,
                      tab: "testimonials",
                    });

                    return (
                      <div className="space-y-5">
                        {/* Welcome Banner */}
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 overflow-hidden relative">
                            <CardContent className="p-4 sm:p-6">
                              <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                                <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                                  <LayoutDashboard className="w-6 h-6 text-primary" />
                                </div>
                                <div className={cn("flex-1", isRTL && "text-right")}>
                                  <h3 className="text-lg font-bold">
                                    {isRTL ? `سلام، ${user?.name || "مدیر"}!` : `Hello, ${user?.name || "Admin"}!`}
                                  </h3>
                                  <p className="text-sm text-muted-foreground mt-0.5">
                                    {isRTL ? `امروز ${todayStr}` : `Today: ${todayStr}`}
                                  </p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={fetchDashboard}
                                  className="shrink-0 gap-1.5"
                                >
                                  <RefreshCw className={cn("w-3.5 h-3.5", isDashboardLoading && "animate-spin")} />
                                  {isRTL ? "بروزرسانی" : "Refresh"}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>

                        {/* Priority Alerts */}
                        {priorityAlerts.length > 0 && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                            <div className={cn("flex items-center gap-2 mb-1", isRTL && "flex-row-reverse")}>
                              <Bell className="w-4 h-4 text-amber-500" />
                              <span className="text-xs font-semibold">{isRTL ? "هشدارها" : "Alerts"}</span>
                              <Badge className="bg-amber-500/10 text-amber-600 text-[9px] px-1.5">{priorityAlerts.length}</Badge>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {priorityAlerts.map((alert) => (
                                <motion.div key={alert.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={cn(
                                  "flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer",
                                  alert.type === "urgent" ? "bg-red-500/5 border-red-500/20 hover:border-red-500/40" :
                                  alert.type === "warning" ? "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40" :
                                  "bg-primary/5 border-primary/20 hover:border-primary/40"
                                )} onClick={() => alert.tab && setActiveTab(alert.tab)}>
                                  <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                    alert.type === "urgent" ? "bg-red-500/10" : alert.type === "warning" ? "bg-amber-500/10" : "bg-primary/10"
                                  )}>
                                    <alert.icon className={cn(
                                      "w-4 h-4",
                                      alert.type === "urgent" ? "text-red-500" : alert.type === "warning" ? "text-amber-500" : "text-primary"
                                    )} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={cn(
                                      "text-xs font-semibold truncate",
                                      alert.type === "urgent" ? "text-red-600 dark:text-red-400" : alert.type === "warning" ? "text-amber-600 dark:text-amber-400" : "text-foreground"
                                    )}>{alert.label}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">{alert.detail}</p>
                                  </div>
                                  {alert.type === "urgent" && <Badge className="bg-red-500/10 text-red-600 text-[8px] px-1.5 animate-pulse">{isRTL ? "فوری" : "URGENT"}</Badge>}
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}

                        {/* Quick Stats Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          {statCards.map((card, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                              <Card className="border-border/30 overflow-hidden relative">
                                <div className={cn("h-1.5 bg-gradient-to-r", card.color)} />
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", card.iconBg)}>
                                      <card.icon className={cn("w-5 h-5", card.iconColor)} />
                                    </div>
                                  </div>
                                  <p className="text-2xl font-bold tabular-nums mb-0.5">{isRTL ? toPersianDigits(card.value) : card.value}</p>
                                  <p className="text-[11px] text-muted-foreground">{isRTL ? card.labelFa : card.labelEn}</p>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>

                        {/* Two-column: Recent Activity + Quick Actions */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                          {/* Recent Activity */}
                          <Card className="border-border/30">
                            <CardHeader className="pb-2 px-4 pt-4">
                              <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-primary" />
                                <h4 className="text-sm font-semibold">{isRTL ? "فعالیت اخیر" : "Recent Activity"}</h4>
                              </div>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                              {activityItems.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-4">{isRTL ? "فعالیتی ثبت نشده" : "No recent activity"}</p>
                              ) : (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                  {activityItems.slice(0, 5).map((item) => {
                                    const iconMap = { registration: UserPlus, enrollment: Music, workshop: GraduationCap };
                                    const colorMap = { registration: "text-amber-500", enrollment: "text-teal-500", workshop: "text-primary" };
                                    const labelMap = {
                                      registration: isRTL ? "ثبت‌نام" : "Registration",
                                      enrollment: isRTL ? "نام‌نویسی" : "Enrollment",
                                      workshop: isRTL ? "کارگاه" : "Workshop",
                                    };
                                    const Icon = iconMap[item.type];
                                    return (
                                      <div key={item.id} className={cn("flex items-center gap-2.5 p-2 rounded-lg border border-border/20", isRTL && "flex-row-reverse")}>
                                        <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                                          <Icon className={cn("w-4 h-4", colorMap[item.type])} />
                                        </div>
                                        <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                                          <p className="text-xs font-medium truncate">{item.name}</p>
                                          <p className="text-[10px] text-muted-foreground truncate">{item.detail}</p>
                                        </div>
                                        <div className={cn("shrink-0 text-[10px] text-muted-foreground", isRTL && "text-left")}>
                                          <Badge variant="outline" className="text-[9px] px-1.5">{labelMap[item.type]}</Badge>
                                          {item.isNew && <span className="ms-1 text-amber-500">●</span>}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </CardContent>
                          </Card>

                          {/* Quick Actions */}
                          <Card className="border-border/30">
                            <CardHeader className="pb-2 px-4 pt-4">
                              <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-500" />
                                <h4 className="text-sm font-semibold">{isRTL ? "دسترسی سریع" : "Quick Actions"}</h4>
                              </div>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                              <div className="grid grid-cols-2 gap-2">
                                {quickActions.map((action, i) => (
                                  <motion.button
                                    key={i}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setActiveTab(action.tab)}
                                    className={cn(
                                      "flex items-center gap-2 p-3 rounded-xl border border-border/20 transition-all duration-200",
                                      action.color
                                    )}
                                  >
                                    <action.icon className="w-4 h-4 shrink-0" />
                                    <span className="text-xs font-medium">{action.label}</span>
                                  </motion.button>
                                ))}
                              </div>

                              {/* Summary stats */}
                              <div className="mt-4 pt-3 border-t border-border/20 space-y-2">
                                <div className={cn("flex items-center justify-between text-xs", isRTL && "flex-row-reverse")}>
                                  <span className="text-muted-foreground">{isRTL ? "کل هنرجویان" : "Total Students"}</span>
                                  <span className="font-bold">{isRTL ? toPersianDigits(m.totalStudents) : m.totalStudents}</span>
                                </div>
                                <div className={cn("flex items-center justify-between text-xs", isRTL && "flex-row-reverse")}>
                                  <span className="text-muted-foreground">{isRTL ? "دوره‌های فعال" : "Active Courses"}</span>
                                  <span className="font-bold">{isRTL ? toPersianDigits(m.totalCourses) : m.totalCourses}</span>
                                </div>
                                <div className={cn("flex items-center justify-between text-xs", isRTL && "flex-row-reverse")}>
                                  <span className="text-muted-foreground">{isRTL ? "ثبت‌نام‌های فعال" : "Active Enrollments"}</span>
                                  <span className="font-bold">{isRTL ? toPersianDigits(m.activeEnrollments) : m.activeEnrollments}</span>
                                </div>
                                <div className={cn("flex items-center justify-between text-xs", isRTL && "flex-row-reverse")}>
                                  <span className="text-muted-foreground">{isRTL ? "درآمد کل (تومان)" : "Total Revenue (Toman)"}</span>
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{isRTL ? toPersianDigits((m.totalRevenue || 0).toLocaleString("fa-IR")) : (m.totalRevenue || 0).toLocaleString("en-US")}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="text-center py-12 text-muted-foreground">
                      <LayoutDashboard className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">{isRTL ? "داشبورد در حال بارگذاری..." : "Loading dashboard..."}</p>
                    </div>
                  )}
                </>)}

                {/* Announcements Tab */}
                {activeTab === "announcements" && (<>
                  <Dialog open={isAnnouncementDialogOpen} onOpenChange={(open) => {
                    setIsAnnouncementDialogOpen(open);
                    if (!open) setEditingAnnouncement(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2">
                        <Plus className="w-4 h-4" />
                        {isRTL ? "اعلان جدید" : "New Announcement"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingAnnouncement
                            ? (isRTL ? "ویرایش اعلان" : "Edit Announcement")
                            : (isRTL ? "اعلان جدید" : "New Announcement")}
                        </DialogTitle>
                        <DialogDescription className="sr-only">فرم ایجاد/ویرایش اعلان</DialogDescription>
                      </DialogHeader>
                      <AnnouncementForm
                        initialData={editingAnnouncement}
                        onSave={handleSaveAnnouncement}
                        isRTL={isRTL}
                      />
                    </DialogContent>
                  </Dialog>

                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : announcements.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">{isRTL ? "هنوز اعلانی ایجاد نشده" : "No announcements yet"}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {announcements.map((item, index) => {
                        const typeConf = getTypeConfig(item.type);
                        const Icon = typeConf.icon;
                        return (
                          <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                            <Card className={cn("border-border/30 hover:border-primary/20 transition-all", !item.isPublished && "opacity-60")}>
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", typeConf.color === "text-primary" ? "bg-primary/10" : "bg-gold/10")}>
                                    <Icon className={cn("w-4 h-4", typeConf.color)} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <h4 className="text-sm font-semibold truncate">{isRTL ? item.titleFa : item.titleEn}</h4>
                                      {item.isPinned && <Pin className="w-3 h-3 text-gold shrink-0" />}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge variant="secondary" className="text-[10px]">{isRTL ? typeConf.labelFa : typeConf.labelEn}</Badge>
                                      <Badge variant="secondary" className="text-[10px]">P{item.priority}</Badge>
                                      {item.isPublished ? (
                                        <Badge className="text-[10px] bg-green-500/10 text-green-600 border-0"><Eye className="w-2.5 h-2.5 mr-0.5" />{isRTL ? "منتشر" : "Live"}</Badge>
                                      ) : (
                                        <Badge className="text-[10px] bg-muted text-muted-foreground border-0"><EyeOff className="w-2.5 h-2.5 mr-0.5" />{isRTL ? "پیش‌نویس" : "Draft"}</Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <Button variant="ghost" size="icon" className="w-7 h-7"
                                      onClick={() => { setEditingAnnouncement(item); setIsAnnouncementDialogOpen(true); }}>
                                      <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="w-7 h-7 hover:text-destructive"
                                      onClick={() => handleDeleteAnnouncement(item.id)}>
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
                </>)}

                {/* Workshops Tab */}
                {activeTab === "workshops" && (<>
                  <Dialog open={isWorkshopDialogOpen} onOpenChange={(open) => {
                    setIsWorkshopDialogOpen(open);
                    if (!open) setEditingWorkshop(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2">
                        <Plus className="w-4 h-4" />
                        {isRTL ? "کارگاه جدید" : "New Workshop"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingWorkshop
                            ? (isRTL ? "ویرایش کارگاه" : "Edit Workshop")
                            : (isRTL ? "کارگاه جدید" : "New Workshop")}
                        </DialogTitle>
                        <DialogDescription className="sr-only">فرم ایجاد/ویرایش کارگاه</DialogDescription>
                      </DialogHeader>
                      <WorkshopForm
                        initialData={editingWorkshop}
                        onSave={handleSaveWorkshop}
                        isRTL={isRTL}
                      />
                    </DialogContent>
                  </Dialog>

                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : workshops.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">{isRTL ? "هنوز کارگاهی ایجاد نشده" : "No workshops yet"}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {workshops.map((ws, index) => {
                        const seatPercentage = Math.round((ws.reservedSeats / ws.totalSeats) * 100);
                        const isLowSeats = (ws.totalSeats - ws.reservedSeats) <= 10;
                        return (
                          <motion.div key={ws.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                            <Card className={cn("border-border/30 hover:border-primary/20 transition-all", !ws.isPublished && "opacity-60")}>
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-gold/10">
                                    {ws.isHot ? <Flame className="w-4 h-4 text-destructive" /> : <GraduationCap className="w-4 h-4 text-gold" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <h4 className="text-sm font-semibold truncate">{isRTL ? ws.titleFa : ws.titleEn}</h4>
                                      {ws.isHot && <Badge className="text-[10px] bg-destructive/10 text-destructive border-0"><Flame className="w-2.5 h-2.5 mr-0.5" />Hot</Badge>}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground">
                                      <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{new Date(ws.date).toLocaleDateString(isRTL ? "fa-IR" : "en-US")}</span>
                                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{ws.reservedSeats}/{ws.totalSeats}</span>
                                      {ws.price && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{ws.price.toLocaleString()}</span>}
                                    </div>
                                    {/* Seat bar */}
                                    <div className="mt-2 w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                      <div className={cn("h-full rounded-full", isLowSeats ? "bg-destructive" : "bg-gradient-to-l from-primary to-gold")}
                                        style={{ width: `${seatPercentage}%` }} />
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                      {ws.isPublished ? (
                                        <Badge className="text-[10px] bg-green-500/10 text-green-600 border-0">{isRTL ? "منتشر" : "Live"}</Badge>
                                      ) : (
                                        <Badge className="text-[10px] bg-muted text-muted-foreground border-0">{isRTL ? "پیش‌نویس" : "Draft"}</Badge>
                                      )}
                                      {ws.registrationOpen !== false ? (
                                        <Badge className="text-[10px] bg-blue-500/10 text-blue-600 border-0"><Unlock className="w-2.5 h-2.5 mr-0.5" />{isRTL ? "ثبت‌نام باز" : "Open"}</Badge>
                                      ) : (
                                        <Badge className="text-[10px] bg-red-500/10 text-red-600 border-0"><Lock className="w-2.5 h-2.5 mr-0.5" />{isRTL ? "بسته" : "Closed"}</Badge>
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
                                      onClick={() => { setEditingWorkshop(ws); setIsWorkshopDialogOpen(true); }}>
                                      <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="w-7 h-7 hover:text-destructive"
                                      onClick={() => handleDeleteWorkshop(ws.id)}>
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
                </>)}

                {/* Courses Tab */}
                {activeTab === "courses" && (<>
                  <Dialog open={isCourseDialogOpen} onOpenChange={(open) => {
                    setIsCourseDialogOpen(open);
                    if (!open) setEditingCourse(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2">
                        <Plus className="w-4 h-4" />
                        {isRTL ? "دوره جدید" : "New Course"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingCourse
                            ? (isRTL ? "ویرایش دوره" : "Edit Course")
                            : (isRTL ? "دوره جدید" : "New Course")}
                        </DialogTitle>
                        <DialogDescription className="sr-only">فرم ایجاد/ویرایش دوره</DialogDescription>
                      </DialogHeader>
                      <CourseForm
                        initialData={editingCourse}
                        onSave={handleSaveCourse}
                        isRTL={isRTL}
                        instructors={instructors}
                        branches={branches}
                      />
                    </DialogContent>
                  </Dialog>

                  {/* Course Filters */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className={cn("absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
                      <Input
                        placeholder={isRTL ? "جستجوی دوره..." : "Search courses..."}
                        className={cn("rounded-xl h-9 text-xs", isRTL ? "pr-9" : "pl-9")}
                        dir={isRTL ? "rtl" : "ltr"}
                        value={courseSearch}
                        onChange={(e) => setCourseSearch(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Select value={courseFilterPublished} onValueChange={setCourseFilterPublished}>
                        <SelectTrigger className="rounded-xl h-8 text-xs">
                          <SelectValue placeholder={isRTL ? "وضعیت" : "Status"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{isRTL ? "همه" : "All"}</SelectItem>
                          <SelectItem value="published">{isRTL ? "منتشر" : "Published"}</SelectItem>
                          <SelectItem value="draft">{isRTL ? "پیش‌نویس" : "Draft"}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={courseFilterCategory} onValueChange={setCourseFilterCategory}>
                        <SelectTrigger className="rounded-xl h-8 text-xs">
                          <SelectValue placeholder={isRTL ? "دسته" : "Category"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{isRTL ? "همه" : "All"}</SelectItem>
                          {courseCategories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>{isRTL ? cat.labelFa : cat.labelEn}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={courseFilterLevel} onValueChange={setCourseFilterLevel}>
                        <SelectTrigger className="rounded-xl h-8 text-xs">
                          <SelectValue placeholder={isRTL ? "سطح" : "Level"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{isRTL ? "همه" : "All"}</SelectItem>
                          {courseLevels.map((lvl) => (
                            <SelectItem key={lvl.value} value={lvl.value}>{isRTL ? lvl.labelFa : lvl.labelEn}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : courses.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Music className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">{isRTL ? "هنوز دوره‌ای ایجاد نشده" : "No courses yet"}</p>
                    </div>
                  ) : (() => {
                    const filteredCourses = courses.filter((c) => {
                      if (courseFilterPublished === "published" && !c.isPublished) return false;
                      if (courseFilterPublished === "draft" && c.isPublished) return false;
                      if (courseFilterCategory !== "all" && c.category !== courseFilterCategory) return false;
                      if (courseFilterLevel !== "all" && c.level !== courseFilterLevel) return false;
                      if (courseSearch.trim()) {
                        const s = courseSearch.toLowerCase();
                        return c.titleFa.includes(s) || c.titleEn.toLowerCase().includes(s);
                      }
                      return true;
                    });
                    return filteredCourses.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Search className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">{isRTL ? "دوره‌ای یافت نشد" : "No matching courses"}</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[calc(100vh-420px)] overflow-y-auto">
                        {filteredCourses.map((course, index) => {
                          const sessionInfo = course.sessionsMin && course.sessionsMax
                            ? (course.sessionsMin === course.sessionsMax
                              ? `${course.sessionsMin} ${isRTL ? "جلسه" : "sessions"}`
                              : `${course.sessionsMin}-${course.sessionsMax} ${isRTL ? "جلسه" : "sessions"}`)
                            : null;
                          return (
                            <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                              <Card className={cn("border-border/30 hover:border-primary/20 transition-all", !course.isPublished && "opacity-60")}>
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
                                      <Music className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h4 className="text-sm font-semibold truncate">{isRTL ? course.titleFa : course.titleEn}</h4>
                                        {course.isNew && <Badge className="text-[10px] bg-green-500/10 text-green-600 border-0"><Sparkles className="w-2.5 h-2.5 mr-0.5" />{isRTL ? "جدید" : "New"}</Badge>}
                                        {course.isFeatured && <Star className="w-3 h-3 text-gold shrink-0 fill-gold" />}
                                      </div>
                                      <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground">
                                        {course.instrument && <span className="flex items-center gap-1"><Music className="w-3 h-3" />{isRTL ? instrumentOptions.find(i => i.value === course.instrument)?.labelFa : course.instrument}</span>}
                                        {course.level && <Badge variant="secondary" className="text-[8px] px-1 py-0">{isRTL ? courseLevels.find(l => l.value === course.level)?.labelFa : course.level}</Badge>}
                                        {course.classType && <Badge className={cn("text-[8px] px-1 py-0 border-0", course.classType === "private" ? "bg-purple-500/10 text-purple-600" : "bg-green-500/10 text-green-600")}>{isRTL ? classTypeOptions.find(ct => ct.value === course.classType)?.labelFa : course.classType}</Badge>}
                                        {sessionInfo && <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{sessionInfo}</span>}
                                        {course.price != null && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{Number(course.price).toLocaleString()}</span>}
                                        {course._count && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course._count.enrollments}</span>}
                                      </div>
                                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                        {course.isPublished ? (
                                          <Badge className="text-[10px] bg-green-500/10 text-green-600 border-0">{isRTL ? "منتشر" : "Live"}</Badge>
                                        ) : (
                                          <Badge className="text-[10px] bg-muted text-muted-foreground border-0">{isRTL ? "پیش‌نویس" : "Draft"}</Badge>
                                        )}
                                        {course.registrationOpen ? (
                                          <Badge className="text-[10px] bg-blue-500/10 text-blue-600 border-0"><Unlock className="w-2.5 h-2.5 mr-0.5" />{isRTL ? "ثبت‌نام باز" : "Open"}</Badge>
                                        ) : (
                                          <Badge className="text-[10px] bg-red-500/10 text-red-600 border-0"><Lock className="w-2.5 h-2.5 mr-0.5" />{isRTL ? "بسته" : "Closed"}</Badge>
                                        )}
                                        {course.isShowOnHome && <Badge className="text-[10px] bg-primary/10 text-primary border-0">{isRTL ? "صفحه اصلی" : "Home"}</Badge>}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Button variant="ghost" size="icon" className="w-7 h-7"
                                        onClick={() => { setActiveTab("schedules"); }}
                                        title={isRTL ? "مدیریت برنامه" : "Manage Schedule"}>
                                        <CalendarClock className="w-3.5 h-3.5 text-muted-foreground" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="w-7 h-7"
                                        onClick={() => { setEditingCourse(course); setIsCourseDialogOpen(true); }}>
                                        <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="w-7 h-7 hover:text-destructive"
                                        onClick={() => handleDeleteCourse(course.id)}>
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
                    );
                  })()}
                </>)}

                {/* Class Schedules Tab */}
                {activeTab === "schedules" && (<>
                  <Dialog open={isScheduleDialogOpen} onOpenChange={(open) => {
                    setIsScheduleDialogOpen(open);
                    if (!open) setEditingSchedule(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2">
                        <Plus className="w-4 h-4" />
                        {isRTL ? "برنامه کلاس جدید" : "New Schedule"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          <span className="flex items-center gap-2">
                            <CalendarClock className="w-5 h-5 text-primary" />
                            {editingSchedule
                              ? (isRTL ? "ویرایش برنامه کلاس" : "Edit Schedule")
                              : (isRTL ? "برنامه کلاس جدید" : "New Schedule")}
                          </span>
                          <span className="sr-only">{editingSchedule ? "Edit Class Schedule" : "Create Class Schedule"}</span>
                        </DialogTitle>
                        <DialogDescription className="sr-only">فرم ایجاد/ویرایش برنامه کلاس</DialogDescription>
                      </DialogHeader>
                      <ScheduleForm
                        initialData={editingSchedule}
                        onSave={handleSaveSchedule}
                        isRTL={isRTL}
                        courses={courses}
                        instructors={instructors}
                        branches={branches}
                      />
                    </DialogContent>
                  </Dialog>

                  {/* Schedule Filters */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Select value={scheduleFilterCourse} onValueChange={setScheduleFilterCourse}>
                      <SelectTrigger className="rounded-xl h-8 text-xs">
                        <SelectValue placeholder={isRTL ? "دوره" : "Course"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{isRTL ? "همه دوره‌ها" : "All Courses"}</SelectItem>
                        {courses.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{isRTL ? c.titleFa : c.titleEn}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={scheduleFilterInstructor} onValueChange={setScheduleFilterInstructor}>
                      <SelectTrigger className="rounded-xl h-8 text-xs">
                        <SelectValue placeholder={isRTL ? "مدرس" : "Instructor"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{isRTL ? "همه مدرسین" : "All Instructors"}</SelectItem>
                        {instructors.map((inst) => (
                          <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={scheduleFilterDay} onValueChange={setScheduleFilterDay}>
                      <SelectTrigger className="rounded-xl h-8 text-xs">
                        <SelectValue placeholder={isRTL ? "روز" : "Day"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{isRTL ? "همه روزها" : "All Days"}</SelectItem>
                        {persianDays.map((d) => (
                          <SelectItem key={d.value} value={String(d.value)}>{isRTL ? d.labelFa : d.labelEn}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={scheduleFilterStatus} onValueChange={setScheduleFilterStatus}>
                      <SelectTrigger className="rounded-xl h-8 text-xs">
                        <SelectValue placeholder={isRTL ? "وضعیت" : "Status"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{isRTL ? "همه" : "All"}</SelectItem>
                        {Object.entries(scheduleStatusConfig).map(([key, conf]) => (
                          <SelectItem key={key} value={key}>{isRTL ? conf.labelFa : conf.labelEn}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Schedule summary */}
                  {!isLoading && classSchedules.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="border border-green-500/30 rounded-xl p-2.5 text-center bg-green-500/5">
                        <div className="text-lg font-bold text-green-600">{classSchedules.filter(s => s.status === "active").length}</div>
                        <div className="text-[10px] text-green-600">{isRTL ? "فعال" : "Active"}</div>
                      </div>
                      <div className="border border-red-500/30 rounded-xl p-2.5 text-center bg-red-500/5">
                        <div className="text-lg font-bold text-red-600">{classSchedules.filter(s => s.status === "cancelled").length}</div>
                        <div className="text-[10px] text-red-600">{isRTL ? "لغو شده" : "Cancelled"}</div>
                      </div>
                      <div className="border border-blue-500/30 rounded-xl p-2.5 text-center bg-blue-500/5">
                        <div className="text-lg font-bold text-blue-600">{classSchedules.filter(s => s.status === "completed").length}</div>
                        <div className="text-[10px] text-blue-600">{isRTL ? "تکمیل" : "Done"}</div>
                      </div>
                    </div>
                  )}

                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : classSchedules.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <CalendarClock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">{isRTL ? "هنوز برنامه‌ای ایجاد نشده" : "No schedules yet"}</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[calc(100vh-420px)] overflow-y-auto">
                      {classSchedules.map((sched, index) => {
                        const dayInfo = persianDays.find(d => d.value === sched.dayOfWeek);
                        const statusConf = scheduleStatusConfig[sched.status] || scheduleStatusConfig.active;
                        const ctConf = classTypeOptions.find(ct => ct.value === sched.course.classType);
                        return (
                          <motion.div key={sched.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
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
                                      {ctConf && <Badge className={cn("text-[8px] px-1 py-0 border-0", sched.course.classType === "private" ? "bg-purple-500/10 text-purple-600" : "bg-green-500/10 text-green-600")}>{isRTL ? ctConf.labelFa : ctConf.labelEn}</Badge>}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground mb-1">
                                      <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" />{sched.instructor.name}</span>
                                      <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{isRTL ? dayInfo?.labelFa : dayInfo?.labelEn}</span>
                                      <span className="flex items-center gap-1"><Timer className="w-3 h-3" />{sched.startTime} - {sched.endTime}</span>
                                      {sched.room && <span className="flex items-center gap-1"><DoorOpen className="w-3 h-3" />{sched.room}</span>}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge className={cn("text-[10px] border-0", statusConf.bgColor, statusConf.color)}>
                                        {isRTL ? statusConf.labelFa : statusConf.labelEn}
                                      </Badge>
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
                                    {sched.status === "active" && (
                                      <Button variant="ghost" size="icon" className="w-7 h-7 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                        onClick={() => { setCancellingSchedule(sched); setIsCancelScheduleDialogOpen(true); }}
                                        title={isRTL ? "لغو برنامه" : "Cancel Schedule"}>
                                        <CalendarX className="w-3.5 h-3.5" />
                                      </Button>
                                    )}
                                    <Button variant="ghost" size="icon" className="w-7 h-7"
                                      onClick={() => { setEditingSchedule(sched); setIsScheduleDialogOpen(true); }}>
                                      <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="w-7 h-7 hover:text-destructive"
                                      onClick={() => handleDeleteSchedule(sched.id)}>
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

                  {/* Cancel Schedule Dialog */}
                  <Dialog open={isCancelScheduleDialogOpen} onOpenChange={(open) => { if (!open) { setIsCancelScheduleDialogOpen(false); setCancellingSchedule(null); setCancelReason(""); } }}>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <CalendarX className="w-5 h-5 text-red-500" />
                          {isRTL ? "لغو برنامه کلاس" : "Cancel Schedule"}
                          <span className="sr-only">Cancel Class Schedule</span>
                        </DialogTitle>
                        <DialogDescription className="sr-only">لغو برنامه کلاس</DialogDescription>
                      </DialogHeader>
                      {cancellingSchedule && (
                        <div className="space-y-4">
                          <div className="border border-border/30 rounded-xl p-3 space-y-1 bg-muted/20">
                            <p className="text-sm font-medium">{isRTL ? cancellingSchedule.course.titleFa : cancellingSchedule.course.titleEn}</p>
                            <p className="text-xs text-muted-foreground">
                              {persianDays.find(d => d.value === cancellingSchedule.dayOfWeek)?.labelFa} | {cancellingSchedule.startTime} - {cancellingSchedule.endTime}
                              {cancellingSchedule.room && ` | ${cancellingSchedule.room}`}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">{isRTL ? "دلیل لغو" : "Cancel Reason"} *</Label>
                            <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                              className="rounded-xl resize-none" rows={3} dir={isRTL ? "rtl" : "ltr"}
                              placeholder={isRTL ? "دلیل لغو کلاس را وارد کنید..." : "Enter reason for cancellation..."} />
                          </div>
                          <Button onClick={handleCancelSchedule} disabled={!cancelReason.trim()}
                            className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl gap-2">
                            <CalendarX className="w-4 h-4" />
                            {isRTL ? "لغو برنامه" : "Cancel Schedule"}
                          </Button>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </>)}

                {/* Schedule Requests Tab */}
                {activeTab === "schedule-requests" && (<>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-semibold">{isRTL ? "درخواست‌های تغییر برنامه" : "Schedule Change Requests"}</h3>
                    </div>
                    {pendingRequestsCount > 0 && (
                      <Badge className="text-[10px] bg-amber-500/10 text-amber-600 border-0">
                        {pendingRequestsCount} {isRTL ? "در انتظار بررسی" : "pending"}
                      </Badge>
                    )}
                  </div>

                  {/* Request Filters */}
                  <div className="grid grid-cols-3 gap-2">
                    <Select value={requestFilterStatus} onValueChange={setRequestFilterStatus}>
                      <SelectTrigger className="rounded-xl h-8 text-xs">
                        <SelectValue placeholder={isRTL ? "وضعیت" : "Status"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{isRTL ? "همه" : "All"}</SelectItem>
                        {Object.entries(requestStatusConfig).map(([key, conf]) => (
                          <SelectItem key={key} value={key}>{isRTL ? conf.labelFa : conf.labelEn}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={requestFilterInstructor} onValueChange={setRequestFilterInstructor}>
                      <SelectTrigger className="rounded-xl h-8 text-xs">
                        <SelectValue placeholder={isRTL ? "مدرس" : "Instructor"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{isRTL ? "همه" : "All"}</SelectItem>
                        {instructors.map((inst) => (
                          <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={requestFilterType} onValueChange={setRequestFilterType}>
                      <SelectTrigger className="rounded-xl h-8 text-xs">
                        <SelectValue placeholder={isRTL ? "نوع درخواست" : "Type"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{isRTL ? "همه" : "All"}</SelectItem>
                        {Object.entries(requestTypeConfig).map(([key, conf]) => (
                          <SelectItem key={key} value={key}>{isRTL ? conf.labelFa : conf.labelEn}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : scheduleRequests.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">{isRTL ? "درخواستی وجود ندارد" : "No requests"}</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[calc(100vh-380px)] overflow-y-auto">
                      {scheduleRequests.map((req, index) => {
                        const statusConf = requestStatusConfig[req.status] || requestStatusConfig.pending;
                        const typeConf = requestTypeConfig[req.requestType] || requestTypeConfig.time_change;
                        let proposedChangesParsed: Record<string, unknown> = {};
                        try { proposedChangesParsed = JSON.parse(req.proposedChanges); } catch { /* ignore */ }
                        const schedDayInfo = persianDays.find(d => d.value === req.schedule.dayOfWeek);
                        return (
                          <motion.div key={req.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
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
                                      <Badge className={cn("text-[10px] border-0", typeConf.bgColor, typeConf.color)}>
                                        {isRTL ? typeConf.labelFa : typeConf.labelEn}
                                      </Badge>
                                      <Badge className={cn("text-[10px] border-0", statusConf.bgColor, statusConf.color)}>
                                        {isRTL ? statusConf.labelFa : statusConf.labelEn}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground mb-1">
                                      <span className="flex items-center gap-1"><Music className="w-3 h-3" />{isRTL ? req.course.titleFa : req.course.titleEn}</span>
                                      <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{isRTL ? schedDayInfo?.labelFa : schedDayInfo?.labelEn}</span>
                                      <span className="flex items-center gap-1"><Timer className="w-3 h-3" />{req.schedule.startTime}-{req.schedule.endTime}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground mb-1.5" dir="rtl">
                                      <span className="font-medium">{isRTL ? "دلیل: " : "Reason: "}</span>{req.reason}
                                    </div>
                                    {/* Proposed changes preview */}
                                    {Object.keys(proposedChangesParsed).length > 0 && (
                                      <div className="border border-border/30 rounded-lg p-2 bg-muted/20 space-y-0.5">
                                        <span className="text-[10px] font-semibold text-muted-foreground">{isRTL ? "تغییرات پیشنهادی:" : "Proposed Changes:"}</span>
                                        {"dayOfWeek" in proposedChangesParsed && (
                                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <ArrowRight className="w-2.5 h-2.5" />
                                            {isRTL ? "روز: " : "Day: "}{persianDays.find(d => d.value === Number(proposedChangesParsed.dayOfWeek))?.labelFa || String(proposedChangesParsed.dayOfWeek)}
                                          </div>
                                        )}
                                        {"startTime" in proposedChangesParsed && (
                                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <ArrowRight className="w-2.5 h-2.5" />
                                            {isRTL ? "شروع: " : "Start: "}{String(proposedChangesParsed.startTime)}
                                          </div>
                                        )}
                                        {"endTime" in proposedChangesParsed && (
                                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <ArrowRight className="w-2.5 h-2.5" />
                                            {isRTL ? "پایان: " : "End: "}{String(proposedChangesParsed.endTime)}
                                          </div>
                                        )}
                                        {"room" in proposedChangesParsed && (
                                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <ArrowRight className="w-2.5 h-2.5" />
                                            {isRTL ? "اتاق: " : "Room: "}{String(proposedChangesParsed.room)}
                                          </div>
                                        )}
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
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Button variant="ghost" size="icon" className="w-7 h-7 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                        onClick={() => { setReviewingRequest(req); setAdminResponseText(""); setRejectReason(""); setIsRequestReviewDialogOpen(true); }}
                                        title={isRTL ? "بررسی درخواست" : "Review Request"}>
                                        <Eye className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {/* Request Review Dialog */}
                  <Dialog open={isRequestReviewDialogOpen} onOpenChange={(open) => { if (!open) { setIsRequestReviewDialogOpen(false); setReviewingRequest(null); setAdminResponseText(""); setRejectReason(""); } }}>
                    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <ClipboardList className="w-5 h-5 text-primary" />
                          {isRTL ? "بررسی درخواست تغییر برنامه" : "Review Schedule Change Request"}
                          <span className="sr-only">Review Schedule Change Request</span>
                        </DialogTitle>
                        <DialogDescription className="sr-only">بررسی درخواست تغییر برنامه</DialogDescription>
                      </DialogHeader>
                      {reviewingRequest && (() => {
                        const rTypeConf = requestTypeConfig[reviewingRequest.requestType] || requestTypeConfig.time_change;
                        let proposedParsed: Record<string, unknown> = {};
                        try { proposedParsed = JSON.parse(reviewingRequest.proposedChanges); } catch { /* ignore */ }
                        const rDayInfo = persianDays.find(d => d.value === reviewingRequest.schedule.dayOfWeek);
                        return (
                          <div className="space-y-4">
                            {/* Request Info */}
                            <div className="border border-border/30 rounded-xl p-3 space-y-2 bg-muted/20">
                              <div className="flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-semibold">{reviewingRequest.instructor.name}</span>
                                <Badge className={cn("text-[10px] border-0", rTypeConf.bgColor, rTypeConf.color)}>{isRTL ? rTypeConf.labelFa : rTypeConf.labelEn}</Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {isRTL ? reviewingRequest.course.titleFa : reviewingRequest.course.titleEn} | {isRTL ? rDayInfo?.labelFa : rDayInfo?.labelEn} | {reviewingRequest.schedule.startTime}-{reviewingRequest.schedule.endTime}
                              </div>
                              <div className="text-xs" dir="rtl">
                                <span className="font-medium">{isRTL ? "دلیل: " : "Reason: "}</span>{reviewingRequest.reason}
                              </div>
                            </div>

                            {/* Current vs Proposed */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="border border-red-500/20 rounded-xl p-3 space-y-1.5 bg-red-500/5">
                                <h5 className="text-[10px] font-semibold text-red-600">{isRTL ? "برنامه فعلی" : "Current Schedule"}</h5>
                                <div className="text-xs text-muted-foreground flex items-center gap-1"><CalendarDays className="w-3 h-3" />{isRTL ? rDayInfo?.labelFa : rDayInfo?.labelEn}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1"><Timer className="w-3 h-3" />{reviewingRequest.schedule.startTime} - {reviewingRequest.schedule.endTime}</div>
                                {reviewingRequest.schedule.room && <div className="text-xs text-muted-foreground flex items-center gap-1"><DoorOpen className="w-3 h-3" />{reviewingRequest.schedule.room}</div>}
                              </div>
                              <div className="border border-green-500/20 rounded-xl p-3 space-y-1.5 bg-green-500/5">
                                <h5 className="text-[10px] font-semibold text-green-600">{isRTL ? "برنامه پیشنهادی" : "Proposed Schedule"}</h5>
                                {"dayOfWeek" in proposedParsed ? (
                                  <div className="text-xs text-muted-foreground flex items-center gap-1"><CalendarDays className="w-3 h-3" />{persianDays.find(d => d.value === Number(proposedParsed.dayOfWeek))?.labelFa || String(proposedParsed.dayOfWeek)}</div>
                                ) : (
                                  <div className="text-xs text-muted-foreground flex items-center gap-1"><CalendarDays className="w-3 h-3" />{isRTL ? "بدون تغییر" : "No change"}</div>
                                )}
                                {"startTime" in proposedParsed || "endTime" in proposedParsed ? (
                                  <div className="text-xs text-muted-foreground flex items-center gap-1"><Timer className="w-3 h-3" />{String(proposedParsed.startTime || reviewingRequest.schedule.startTime)} - {String(proposedParsed.endTime || reviewingRequest.schedule.endTime)}</div>
                                ) : (
                                  <div className="text-xs text-muted-foreground flex items-center gap-1"><Timer className="w-3 h-3" />{isRTL ? "بدون تغییر" : "No change"}</div>
                                )}
                                {"room" in proposedParsed ? (
                                  <div className="text-xs text-muted-foreground flex items-center gap-1"><DoorOpen className="w-3 h-3" />{String(proposedParsed.room)}</div>
                                ) : (
                                  reviewingRequest.schedule.room ? <div className="text-xs text-muted-foreground flex items-center gap-1"><DoorOpen className="w-3 h-3" />{reviewingRequest.schedule.room}</div> : null
                                )}
                              </div>
                            </div>

                            {/* Admin Response */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">{isRTL ? "پاسخ ادمین (اختیاری)" : "Admin Response (optional)"}</Label>
                              <Textarea value={adminResponseText} onChange={(e) => setAdminResponseText(e.target.value)}
                                className="rounded-xl resize-none" rows={2} dir={isRTL ? "rtl" : "ltr"}
                                placeholder={isRTL ? "یادداشت برای مدرس..." : "Note for instructor..."} />
                            </div>

                            {/* Reject reason */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">{isRTL ? "دلیل رد (در صورت رد)" : "Rejection Reason (if rejecting)"}</Label>
                              <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                                className="rounded-xl resize-none" rows={2} dir={isRTL ? "rtl" : "ltr"}
                                placeholder={isRTL ? "دلیل رد درخواست را وارد کنید..." : "Enter rejection reason..."} />
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-3">
                              <Button onClick={handleApproveRequest}
                                className="bg-green-600 hover:bg-green-700 text-white rounded-xl gap-2">
                                <ThumbsUp className="w-4 h-4" />
                                {isRTL ? "تأیید و اعمال تغییرات" : "Approve & Apply"}
                              </Button>
                              <Button onClick={handleRejectRequest} disabled={!rejectReason.trim()}
                                className="bg-red-600 hover:bg-red-700 text-white rounded-xl gap-2">
                                <ThumbsDown className="w-4 h-4" />
                                {isRTL ? "رد درخواست" : "Reject"}
                              </Button>
                            </div>
                          </div>
                        );
                      })()}
                    </DialogContent>
                  </Dialog>
                </>)}

                {/* Registrations Tab */}
                {activeTab === "registrations" && (<>
                  {/* New Registration Button */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setIsNewRegistrationOpen(true)}
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      {isRTL ? "ثبت‌نام جدید" : "New Registration"}
                    </Button>
                  </div>

                  {/* Summary Stats Bar */}
                  {!isLoading && enrollments.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      <div className="border border-border/30 rounded-xl p-2.5 text-center">
                        <div className="text-lg font-bold text-primary">{enrollments.length}</div>
                        <div className="text-[10px] text-muted-foreground">{isRTL ? "کل" : "Total"}</div>
                      </div>
                      <div className="border border-green-500/30 rounded-xl p-2.5 text-center bg-green-500/5">
                        <div className="text-lg font-bold text-green-600">{enrollments.filter(e => e.paymentStatus === "paid").length}</div>
                        <div className="text-[10px] text-green-600">{isRTL ? "پرداخت" : "Paid"}</div>
                      </div>
                      <div className="border border-red-500/30 rounded-xl p-2.5 text-center bg-red-500/5">
                        <div className="text-lg font-bold text-red-600">{enrollments.filter(e => e.paymentStatus === "unpaid").length}</div>
                        <div className="text-[10px] text-red-600">{isRTL ? "پرداخت نشده" : "Unpaid"}</div>
                      </div>
                      <div className="border border-amber-500/30 rounded-xl p-2.5 text-center bg-amber-500/5">
                        <div className="text-lg font-bold text-amber-600">{enrollments.filter(e => e.paymentStatus === "partial").length}</div>
                        <div className="text-[10px] text-amber-600">{isRTL ? "جزئی" : "Partial"}</div>
                      </div>
                      <div className="border border-gray-500/30 rounded-xl p-2.5 text-center bg-gray-500/5">
                        <div className="text-lg font-bold text-gray-500">{enrollments.filter(e => e.paymentStatus === "waived").length}</div>
                        <div className="text-[10px] text-gray-500">{isRTL ? "معاف" : "Waived"}</div>
                      </div>
                      <div className="border border-amber-500/30 rounded-xl p-2.5 text-center bg-amber-500/5">
                        <div className="text-lg font-bold text-amber-600">{enrollments.filter(e => e.paymentStatus === "partial").length}</div>
                        <div className="text-[10px] text-amber-600">{isRTL ? "جزئی" : "Partial"}</div>
                      </div>
                    </div>
                  )}

                  {/* Filters */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className={cn("absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
                      <Input
                        placeholder={isRTL ? "جستجوی نام، ایمیل..." : "Search name, email..."}
                        className={cn("rounded-xl h-9 text-xs", isRTL ? "pr-9" : "pl-9")}
                        dir={isRTL ? "rtl" : "ltr"}
                        value={enrollmentSearch}
                        onChange={(e) => setEnrollmentSearch(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Select value={enrollmentPayFilter} onValueChange={setEnrollmentPayFilter}>
                        <SelectTrigger className="rounded-xl h-8 text-xs">
                          <SelectValue placeholder={isRTL ? "وضعیت پرداخت" : "Payment"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{isRTL ? "همه" : "All"}</SelectItem>
                          {Object.entries(PAYMENT_STATUS_CONFIG).map(([key, conf]) => (
                            <SelectItem key={key} value={key}>{isRTL ? conf.labelFa : conf.labelEn}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={enrollmentMethodFilter} onValueChange={setEnrollmentMethodFilter}>
                        <SelectTrigger className="rounded-xl h-8 text-xs">
                          <SelectValue placeholder={isRTL ? "روش ثبت‌نام" : "Method"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{isRTL ? "همه" : "All"}</SelectItem>
                          {Object.entries(REGISTRATION_METHOD_CONFIG).map(([key, conf]) => (
                            <SelectItem key={key} value={key}>{isRTL ? conf.labelFa : conf.labelEn}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={enrollmentCourseFilter} onValueChange={setEnrollmentCourseFilter}>
                        <SelectTrigger className="rounded-xl h-8 text-xs">
                          <SelectValue placeholder={isRTL ? "دوره" : "Course"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{isRTL ? "همه" : "All"}</SelectItem>
                          {courses.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{isRTL ? c.titleFa : c.titleEn}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Enrollment Cards */}
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : enrollments.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">{isRTL ? "هنوز ثبت‌نامی وجود ندارد" : "No enrollments yet"}</p>
                    </div>
                  ) : (() => {
                    const filtered = enrollments.filter((e) => {
                      if (enrollmentPayFilter !== "all" && e.paymentStatus !== enrollmentPayFilter) return false;
                      if (enrollmentMethodFilter !== "all" && e.registrationMethod !== enrollmentMethodFilter) return false;
                      if (enrollmentCourseFilter !== "all" && e.courseId !== enrollmentCourseFilter) return false;
                      if (enrollmentSearch.trim()) {
                        const s = enrollmentSearch.toLowerCase();
                        return (
                          e.student.name.toLowerCase().includes(s) ||
                          e.student.email.toLowerCase().includes(s) ||
                          (e.student.phone && e.student.phone.includes(s)) ||
                          e.course.titleFa.includes(s) ||
                          e.course.titleEn.toLowerCase().includes(s)
                        );
                      }
                      return true;
                    });
                    return filtered.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Search className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">{isRTL ? "نتیجه‌ای یافت نشد" : "No matching enrollments"}</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[calc(100vh-420px)] overflow-y-auto">
                        {filtered.map((enr, index) => {
                          const payConf = PAYMENT_STATUS_CONFIG[enr.paymentStatus] || PAYMENT_STATUS_CONFIG.unpaid;
                          const methConf = REGISTRATION_METHOD_CONFIG[enr.registrationMethod] || REGISTRATION_METHOD_CONFIG.online;
                          const MethIcon = methConf.icon;
                          const statusConf = ENROLLMENT_STATUS_CONFIG[enr.status] || ENROLLMENT_STATUS_CONFIG.active;
                          const isNewEnrollment = (Date.now() - new Date(enr.enrolledAt).getTime()) < 24 * 60 * 60 * 1000;
                          const sessionInfo = enr.course.sessionsMin && enr.course.sessionsMax
                            ? (enr.course.sessionsMin === enr.course.sessionsMax
                              ? `${enr.course.sessionsMin} ${isRTL ? "جلسه" : "sess."}`
                              : `${enr.course.sessionsMin}-${enr.course.sessionsMax} ${isRTL ? "جلسه" : "sess."}`)
                            : null;
                          return (
                            <motion.div key={enr.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                              <Card className={cn("border-border/30 hover:border-primary/20 transition-all", enr.status === "dropped" && "opacity-50", isNewEnrollment && "border-green-500/30 bg-green-500/5")}>
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-3">
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", isNewEnrollment ? "bg-green-500/10" : payConf.bgColor)}>
                                      {isNewEnrollment ? <Sparkles className="w-5 h-5 text-green-500" /> : <CreditCard className={cn("w-5 h-5", payConf.color)} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h4 className="text-sm font-semibold truncate">{enr.student.name}</h4>
                                        {isNewEnrollment && (
                                          <Badge className="text-[10px] bg-green-500/10 text-green-600 border-0 animate-pulse">
                                            <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                                            {isRTL ? "جدید" : "NEW"}
                                          </Badge>
                                        )}
                                        <Badge className={cn("text-[10px] border-0", payConf.bgColor, payConf.color)}>
                                          {isRTL ? payConf.labelFa : payConf.labelEn}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground mb-1">
                                        <span className="truncate">{isRTL ? enr.course.titleFa : enr.course.titleEn}</span>
                                        {enr.course.level && <Badge variant="secondary" className="text-[8px] px-1 py-0">{enr.course.level}</Badge>}
                                        {sessionInfo && <span className="flex items-center gap-0.5"><Hash className="w-2.5 h-2.5" />{sessionInfo}</span>}
                                      </div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Badge className={cn("text-[10px] border-0", methConf.color === "text-blue-500" ? "bg-blue-500/10 text-blue-600" : methConf.color === "text-amber-500" ? "bg-amber-500/10 text-amber-600" : "bg-green-500/10 text-green-600")}>
                                          <MethIcon className="w-2.5 h-2.5 mr-0.5" />
                                          {isRTL ? methConf.labelFa : methConf.labelEn}
                                        </Badge>
                                        <Badge className={cn("text-[10px] border-0", statusConf.bgColor, statusConf.color)}>
                                          {isRTL ? statusConf.labelFa : statusConf.labelEn}
                                        </Badge>
                                        {enr.tuitionAmount != null && (
                                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                            <DollarSign className="w-2.5 h-2.5" />
                                            {Number(enr.tuitionAmount).toLocaleString()} {isRTL ? "تومان" : "Toman"}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-muted-foreground mt-1">
                                        {new Date(enr.enrolledAt).toLocaleDateString(isRTL ? "fa-IR" : "en-US")}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      {enr.paymentStatus === "unpaid" && (
                                        <Button variant="ghost" size="icon" className="w-7 h-7 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                          onClick={() => handleSaveEnrollment(enr.id, { paymentStatus: "paid" })}
                                          title={isRTL ? "پرداخت شده" : "Mark Paid"}>
                                          <Check className="w-3.5 h-3.5" />
                                        </Button>
                                      )}
                                      <Button variant="ghost" size="icon" className="w-7 h-7"
                                        onClick={() => { setViewingEnrollment(enr); setIsEnrollmentViewDialogOpen(true); }}>
                                        <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="w-7 h-7"
                                        onClick={() => { setEditingEnrollment(enr); setIsEnrollmentEditDialogOpen(true); }}>
                                        <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="w-7 h-7 hover:text-destructive"
                                        onClick={() => handleDropEnrollment(enr.id)}>
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
                    );
                  })()}

                  {/* Enrollment Edit Dialog */}
                  <EnrollmentEditDialog
                    enrollment={editingEnrollment}
                    isOpen={isEnrollmentEditDialogOpen}
                    onClose={() => { setIsEnrollmentEditDialogOpen(false); setEditingEnrollment(null); }}
                    onSave={handleSaveEnrollment}
                    isRTL={isRTL}
                  />

                  {/* Enrollment View Dialog */}
                  <Dialog open={isEnrollmentViewDialogOpen} onOpenChange={(open) => { if (!open) { setIsEnrollmentViewDialogOpen(false); setViewingEnrollment(null); } }}>
                    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Eye className="w-5 h-5 text-primary" />
                          {isRTL ? "جزئیات ثبت‌نام" : "Enrollment Details"}
                        </DialogTitle>
                        <DialogDescription className="sr-only">مشاهده جزئیات ثبت‌نام</DialogDescription>
                      </DialogHeader>
                      {viewingEnrollment && (() => {
                        const ve = viewingEnrollment;
                        const vPayConf = PAYMENT_STATUS_CONFIG[ve.paymentStatus] || PAYMENT_STATUS_CONFIG.unpaid;
                        const vMethConf = REGISTRATION_METHOD_CONFIG[ve.registrationMethod] || REGISTRATION_METHOD_CONFIG.online;
                        const VMethIcon = vMethConf.icon;
                        const vStatusConf = ENROLLMENT_STATUS_CONFIG[ve.status] || ENROLLMENT_STATUS_CONFIG.active;
                        return (
                          <div className="space-y-4">
                            <div className="border border-border/30 rounded-xl p-4 space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                  <User className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                  <h3 className="font-semibold">{ve.student.name}</h3>
                                  <p className="text-xs text-muted-foreground">{ve.student.email}</p>
                                  {ve.student.phone && <p className="text-xs text-muted-foreground">{ve.student.phone}</p>}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <span className="text-[10px] text-muted-foreground">{isRTL ? "دوره" : "Course"}</span>
                                  <p className="text-sm font-medium">{isRTL ? ve.course.titleFa : ve.course.titleEn}</p>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[10px] text-muted-foreground">{isRTL ? "ساز" : "Instrument"}</span>
                                  <p className="text-sm">{ve.course.instrument || "-"}</p>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[10px] text-muted-foreground">{isRTL ? "روش ثبت‌نام" : "Method"}</span>
                                  <div className="flex items-center gap-1">
                                    <VMethIcon className={cn("w-3.5 h-3.5", vMethConf.color)} />
                                    <span className="text-sm">{isRTL ? vMethConf.labelFa : vMethConf.labelEn}</span>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[10px] text-muted-foreground">{isRTL ? "وضعیت" : "Status"}</span>
                                  <Badge className={cn("text-[10px] border-0", vStatusConf.bgColor, vStatusConf.color)}>
                                    {isRTL ? vStatusConf.labelFa : vStatusConf.labelEn}
                                  </Badge>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[10px] text-muted-foreground">{isRTL ? "وضعیت پرداخت" : "Payment"}</span>
                                  <Badge className={cn("text-[10px] border-0", vPayConf.bgColor, vPayConf.color)}>
                                    {isRTL ? vPayConf.labelFa : vPayConf.labelEn}
                                  </Badge>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[10px] text-muted-foreground">{isRTL ? "شهریه" : "Tuition"}</span>
                                  <p className="text-sm font-medium">{ve.tuitionAmount ? `${Number(ve.tuitionAmount).toLocaleString()} ${isRTL ? "تومان" : "Toman"}` : "-"}</p>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[10px] text-muted-foreground">{isRTL ? "تاریخ ثبت‌نام" : "Enrolled"}</span>
                                  <p className="text-sm">{new Date(ve.enrolledAt).toLocaleDateString(isRTL ? "fa-IR" : "en-US")}</p>
                                </div>
                                {ve.paidAt && (
                                  <div className="space-y-1">
                                    <span className="text-[10px] text-muted-foreground">{isRTL ? "تاریخ پرداخت" : "Paid At"}</span>
                                    <p className="text-sm">{new Date(ve.paidAt).toLocaleDateString(isRTL ? "fa-IR" : "en-US")}</p>
                                  </div>
                                )}
                                {ve.paymentDueDate && (
                                  <div className="space-y-1">
                                    <span className="text-[10px] text-muted-foreground">{isRTL ? "مهلت پرداخت" : "Due Date"}</span>
                                    <p className="text-sm">{new Date(ve.paymentDueDate).toLocaleDateString(isRTL ? "fa-IR" : "en-US")}</p>
                                  </div>
                                )}
                                {ve.paymentRef && (
                                  <div className="space-y-1">
                                    <span className="text-[10px] text-muted-foreground">{isRTL ? "شماره تراکنش" : "Ref"}</span>
                                    <p className="text-sm font-mono" dir="ltr">{ve.paymentRef}</p>
                                  </div>
                                )}
                              </div>
                              {ve.notes && (
                                <div className="space-y-1 border-t border-border/30 pt-2">
                                  <span className="text-[10px] text-muted-foreground">{isRTL ? "یادداشت" : "Notes"}</span>
                                  <p className="text-xs" dir={isRTL ? "rtl" : "ltr"}>{ve.notes}</p>
                                </div>
                              )}
                              {ve.payments && ve.payments.length > 0 && (
                                <div className="space-y-2 border-t border-border/30 pt-2">
                                  <span className="text-[10px] text-muted-foreground">{isRTL ? "پرداخت‌ها" : "Payments"} ({ve.payments.length})</span>
                                  {ve.payments.map((p) => (
                                    <div key={p.id} className="border border-border/20 rounded-lg p-2 text-xs space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium">{Number(p.amount).toLocaleString()} {isRTL ? "تومان" : "Toman"}</span>
                                        <Badge className={cn("text-[8px] border-0", p.status === "paid" ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground")}>
                                          {p.status === "paid" ? (isRTL ? "پرداخت" : "Paid") : p.status}
                                        </Badge>
                                      </div>
                                      {p.paymentMethod && <span className="text-muted-foreground">{p.paymentMethod}</span>}
                                      {p.installmentNumber && <span className="text-muted-foreground">{isRTL ? `قسط ${p.installmentNumber}/${p.totalInstallments || "?"}` : `Inst. ${p.installmentNumber}/${p.totalInstallments || "?"}`}</span>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </DialogContent>
                  </Dialog>

                  {/* New Registration Form */}
                  <RegistrationForm
                    isOpen={isNewRegistrationOpen}
                    onClose={() => { setIsNewRegistrationOpen(false); fetchEnrollments(); }}
                    isAdminMode={true}
                  />
                </>)}

                {/* Financial Tab */}
                {activeTab === "financial" && (<>
                  {/* Payment Summary Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      {
                        icon: CheckCircle2,
                        labelFa: "پرداخت شده",
                        labelEn: "Paid",
                        value: enrollments.filter(e => e.paymentStatus === "paid").length,
                        amount: enrollments.filter(e => e.paymentStatus === "paid").reduce((s, e) => s + (e.tuitionAmount || 0), 0),
                        color: "from-emerald-500/15 to-emerald-500/5",
                        iconBg: "bg-emerald-500/15",
                        iconColor: "text-emerald-600 dark:text-emerald-400",
                      },
                      {
                        icon: XCircle,
                        labelFa: "پرداخت نشده",
                        labelEn: "Unpaid",
                        value: enrollments.filter(e => e.paymentStatus === "unpaid").length,
                        amount: enrollments.filter(e => e.paymentStatus === "unpaid").reduce((s, e) => s + (e.tuitionAmount || 0), 0),
                        color: "from-red-500/15 to-red-500/5",
                        iconBg: "bg-red-500/15",
                        iconColor: "text-red-600 dark:text-red-400",
                      },
                      {
                        icon: AlertCircle,
                        labelFa: "پرداخت جزئی",
                        labelEn: "Partial",
                        value: enrollments.filter(e => e.paymentStatus === "partial").length,
                        amount: enrollments.filter(e => e.paymentStatus === "partial").reduce((s, e) => s + (e.tuitionAmount || 0), 0),
                        color: "from-amber-500/15 to-amber-500/5",
                        iconBg: "bg-amber-500/15",
                        iconColor: "text-amber-600 dark:text-amber-400",
                      },
                      {
                        icon: Wallet,
                        labelFa: "درآمد کل (تومان)",
                        labelEn: "Total Revenue (Toman)",
                        value: enrollments.filter(e => e.paymentStatus === "paid").reduce((s, e) => s + (e.tuitionAmount || 0), 0),
                        color: "from-primary/15 to-primary/5",
                        iconBg: "bg-primary/15",
                        iconColor: "text-primary",
                      },
                    ].map((card, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                        <Card className="border-border/30 overflow-hidden">
                          <div className={cn("h-1.5 bg-gradient-to-r", card.color)} />
                          <CardContent className="p-4">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", card.iconBg)}>
                              <card.icon className={cn("w-5 h-5", card.iconColor)} />
                            </div>
                            {i < 3 ? (
                              <>
                                <p className="text-2xl font-bold tabular-nums">{isRTL ? toPersianDigits(card.value) : card.value}</p>
                                <p className="text-[11px] text-muted-foreground">{isRTL ? card.labelFa : card.labelEn}</p>
                                {card.amount > 0 && (
                                  <p className="text-[10px] text-muted-foreground mt-1">{isRTL ? toPersianDigits(card.amount.toLocaleString("fa-IR")) : card.amount.toLocaleString("en-US")} {isRTL ? "تومان" : "Toman"}</p>
                                )}
                              </>
                            ) : (
                              <>
                                <p className="text-xl font-bold tabular-nums">{isRTL ? toPersianDigits((card.value as number).toLocaleString("fa-IR")) : (card.value as number).toLocaleString("en-US")}</p>
                                <p className="text-[11px] text-muted-foreground">{isRTL ? card.labelFa : card.labelEn}</p>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  {/* Financial Filters */}
                  <Card className="border-border/30">
                    <CardContent className="p-4">
                      <div className={cn("flex flex-wrap items-center gap-3", isRTL && "flex-row-reverse")}>
                        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                          <Search className="w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder={isRTL ? "جستجوی نام، ایمیل، دوره..." : "Search name, email, course..."}
                            value={financialSearch}
                            onChange={(e) => setFinancialSearch(e.target.value)}
                            className="h-8 w-48 text-xs"
                          />
                        </div>
                        <Select value={financialPayFilter} onValueChange={setFinancialPayFilter}>
                          <SelectTrigger className="h-8 w-32 text-xs">
                            <SelectValue placeholder={isRTL ? "وضعیت پرداخت" : "Payment Status"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{isRTL ? "همه" : "All"}</SelectItem>
                            <SelectItem value="paid">{isRTL ? "پرداخت شده" : "Paid"}</SelectItem>
                            <SelectItem value="unpaid">{isRTL ? "پرداخت نشده" : "Unpaid"}</SelectItem>
                            <SelectItem value="partial">{isRTL ? "پرداخت جزئی" : "Partial"}</SelectItem>
                            <SelectItem value="waived">{isRTL ? "معاف" : "Waived"}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Badge variant="outline" className="text-xs">
                          {isRTL
                            ? toPersianDigits(enrollments.filter(e => {
                                const search = financialSearch.toLowerCase();
                                const payMatch = financialPayFilter === "all" || e.paymentStatus === financialPayFilter;
                                const searchMatch = !search || e.student.name.toLowerCase().includes(search) || e.student.email.toLowerCase().includes(search) || (isRTL ? e.course.titleFa : e.course.titleEn).toLowerCase().includes(search);
                                return payMatch && searchMatch;
                              }).length)
                            : enrollments.filter(e => {
                                const search = financialSearch.toLowerCase();
                                const payMatch = financialPayFilter === "all" || e.paymentStatus === financialPayFilter;
                                const searchMatch = !search || e.student.name.toLowerCase().includes(search) || e.student.email.toLowerCase().includes(search) || (isRTL ? e.course.titleFa : e.course.titleEn).toLowerCase().includes(search);
                                return payMatch && searchMatch;
                              }).length
                          } {isRTL ? "نتیجه" : "results"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Enrollment List with Payment Status */}
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {enrollments
                      .filter(e => {
                        const search = financialSearch.toLowerCase();
                        const payMatch = financialPayFilter === "all" || e.paymentStatus === financialPayFilter;
                        const searchMatch = !search || e.student.name.toLowerCase().includes(search) || e.student.email.toLowerCase().includes(search) || (isRTL ? e.course.titleFa : e.course.titleEn).toLowerCase().includes(search);
                        return payMatch && searchMatch;
                      })
                      .map((enrollment) => {
                      const payConfig = PAYMENT_STATUS_CONFIG[enrollment.paymentStatus] || PAYMENT_STATUS_CONFIG.unpaid;
                      const statusConfig = ENROLLMENT_STATUS_CONFIG[enrollment.status] || ENROLLMENT_STATUS_CONFIG.active;
                      const methodConfig = REGISTRATION_METHOD_CONFIG[enrollment.registrationMethod] || REGISTRATION_METHOD_CONFIG.online;
                      return (
                        <Card key={enrollment.id} className="border-border/30 hover:border-border/60 transition-colors">
                          <CardContent className="p-3 sm:p-4">
                            <div className={cn("flex items-start gap-3", isRTL && "flex-row-reverse")}>
                              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", payConfig.bgColor)}>
                                <methodConfig.icon className={cn("w-5 h-5", methodConfig.color)} />
                              </div>
                              <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                                <div className={cn("flex items-center gap-2 flex-wrap", isRTL && "flex-row-reverse")}>
                                  <span className="text-sm font-semibold">{enrollment.student.name}</span>
                                  <Badge variant="outline" className={cn("text-[9px] px-1.5", payConfig.color)}>{isRTL ? payConfig.labelFa : payConfig.labelEn}</Badge>
                                  <Badge variant="outline" className={cn("text-[9px] px-1.5", statusConfig.color)}>{isRTL ? statusConfig.labelFa : statusConfig.labelEn}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {isRTL ? enrollment.course.titleFa : enrollment.course.titleEn}
                                  {enrollment.course.level && ` • ${enrollment.course.level}`}
                                </p>
                                <div className={cn("flex items-center gap-3 mt-1.5 flex-wrap", isRTL && "flex-row-reverse")}>
                                  {enrollment.tuitionAmount != null && (
                                    <span className="text-xs font-bold">
                                      {isRTL ? toPersianDigits(enrollment.tuitionAmount.toLocaleString("fa-IR")) : enrollment.tuitionAmount.toLocaleString("en-US")} {isRTL ? "تومان" : "Toman"}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-muted-foreground">
                                    <Clock className="w-3 h-3 inline me-1" />
                                    {formatJalaaliDate(enrollment.enrolledAt.split("T")[0], isRTL, "short")}
                                  </span>
                                  {enrollment.paidAt && (
                                    <span className="text-[10px] text-emerald-600">
                                      <CheckCircle2 className="w-3 h-3 inline me-1" />
                                      {formatJalaaliDate(enrollment.paidAt.split("T")[0], isRTL, "short")}
                                    </span>
                                  )}
                                  <Badge variant="outline" className="text-[9px] px-1.5">{isRTL ? methodConfig.labelFa : methodConfig.labelEn}</Badge>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="shrink-0 text-xs"
                                onClick={() => { setEditingEnrollment(enrollment); setIsEnrollmentEditDialogOpen(true); }}
                              >
                                <Edit3 className="w-3.5 h-3.5 me-1" />
                                {isRTL ? "ویرایش" : "Edit"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    {enrollments.filter(e => {
                      const search = financialSearch.toLowerCase();
                      const payMatch = financialPayFilter === "all" || e.paymentStatus === financialPayFilter;
                      const searchMatch = !search || e.student.name.toLowerCase().includes(search) || e.student.email.toLowerCase().includes(search) || (isRTL ? e.course.titleFa : e.course.titleEn).toLowerCase().includes(search);
                      return payMatch && searchMatch;
                    }).length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Wallet className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">{isRTL ? "ثبت‌نامی یافت نشد" : "No enrollments found"}</p>
                      </div>
                    )}
                  </div>

                  {/* Enrollment Edit Dialog for Financial Tab */}
                  <EnrollmentEditDialog
                    enrollment={editingEnrollment}
                    isOpen={isEnrollmentEditDialogOpen}
                    onClose={() => { setIsEnrollmentEditDialogOpen(false); setEditingEnrollment(null); }}
                    onSave={handleSaveEnrollment}
                    isRTL={isRTL}
                  />
                </>)}

                {/* Users Tab */}
                {activeTab === "users" && (<>
                  <Dialog open={isStudentDialogOpen} onOpenChange={setIsStudentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2">
                        <UserPlus className="w-4 h-4" />
                        {isRTL ? "کاربر جدید" : "New User"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>{isRTL ? "ایجاد کاربر جدید" : "Create New User"}</DialogTitle>
                        <DialogDescription className="sr-only">فرم ایجاد کاربر جدید</DialogDescription>
                      </DialogHeader>
                      <CreateStudentForm onSave={handleCreateStudent} isRTL={isRTL} />
                    </DialogContent>
                  </Dialog>

                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : students.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">{isRTL ? "هنوز کاربری ثبت نشده" : "No users yet"}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {students.map((student, index) => (
                        <motion.div key={student.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                          <Card className={cn("border-border/30 hover:border-primary/20 transition-all", !student.isActive && "opacity-60")}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                  student.role === "admin" ? "bg-primary/15" : "bg-gold/10"
                                )}>
                                  {student.role === "admin" ? (
                                    <Shield className="w-5 h-5 text-primary" />
                                  ) : (
                                    <User className="w-5 h-5 text-gold" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <h4 className="text-sm font-semibold truncate">{student.name}</h4>
                                    <Badge className={cn(
                                      "text-[10px] border-0",
                                      student.role === "admin" ? "bg-primary/15 text-primary" : "bg-gold/15 text-gold"
                                    )}>
                                      {student.role === "admin" ? (isRTL ? "مدیر" : "Admin") : (isRTL ? "هنرجو" : "Student")}
                                    </Badge>
                                    {!student.isActive && (
                                      <Badge className="text-[10px] bg-muted text-muted-foreground border-0">{isRTL ? "غیرفعال" : "Inactive"}</Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{student.email}</span>
                                    {student.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{student.phone}</span>}
                                  </div>
                                  {student._count && (
                                    <span className="text-[10px] text-muted-foreground mt-1 inline-block">
                                      {student._count.tickets} {isRTL ? "بلیط" : "tickets"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>)}

                {/* Messages Tab */}
                {activeTab === "messages" && (<>
                  {/* Sub-tab selector */}
                  <div className={cn("flex gap-1", isRTL && "flex-row-reverse")}>
                    <Button size="sm" variant={contactMsgSubTab === "contact" ? "default" : "outline"} onClick={() => setContactMsgSubTab("contact")}>
                      <Mail className="w-3.5 h-3.5 me-1" />
                      {isRTL ? "پیام‌های تماس" : "Contact Messages"}
                      {contactMsgUnread > 0 && <Badge className="ms-1 text-[8px] bg-primary/20 text-primary border-0 px-1">{contactMsgUnread}</Badge>}
                    </Button>
                    <Button size="sm" variant={contactMsgSubTab === "internal" ? "default" : "outline"} onClick={() => setContactMsgSubTab("internal")}>
                      <MessageSquare className="w-3.5 h-3.5 me-1" />
                      {isRTL ? "پیام‌های داخلی" : "Internal Messages"}
                      {adminMessagesUnread > 0 && <Badge className="ms-1 text-[8px] bg-primary/20 text-primary border-0 px-1">{adminMessagesUnread}</Badge>}
                    </Button>
                  </div>

                  {contactMsgSubTab === "contact" ? (
                    <div className="space-y-3">
                      <div className={cn("flex flex-wrap items-center gap-2", isRTL && "flex-row-reverse")}>
                        {(["all", "unread", "read"] as const).map((f) => (
                          <Button key={f} size="sm" variant={contactMsgFilter === f ? "default" : "outline"} onClick={() => setContactMsgFilter(f)}>
                            {f === "all" ? (isRTL ? "همه" : "All") : f === "unread" ? (isRTL ? "خوانده‌نشده" : "Unread") : (isRTL ? "خوانده شده" : "Read")}
                          </Button>
                        ))}
                        {contactMsgUnread > 0 && (
                          <Badge className="text-[10px] bg-primary/10 text-primary border-0">
                            {contactMsgUnread} {isRTL ? "خوانده‌نشده" : "unread"}
                          </Badge>
                        )}
                      </div>

                      {contactMessages.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <Mail className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p className="text-sm">{isRTL ? "پیامی یافت نشد" : "No messages found"}</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[calc(100vh-350px)] overflow-y-auto">
                          {contactMessages.map((msg, index) => (
                            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                              <Card className={cn("border-border/30 hover:border-primary/20 transition-all", !msg.isRead && "border-primary/20 bg-primary/5")}>
                                <CardContent className="p-3">
                                  <div className="flex items-start gap-3">
                                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", !msg.isRead ? "bg-primary/10" : "bg-muted")}>
                                      {!msg.isRead ? <Mail className="w-4 h-4 text-primary" /> : <MessageSquare className="w-4 h-4 text-muted-foreground" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                        <span className={cn("text-sm truncate", !msg.isRead && "font-bold")}>{msg.subject}</span>
                                        {!msg.isRead && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                                      </div>
                                      <p className="text-xs text-muted-foreground line-clamp-2">{msg.message}</p>
                                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground flex-wrap">
                                        <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" />{msg.name}</span>
                                        <span>{msg.email}</span>
                                        {msg.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /><a href={`tel:${msg.phone}`} className="text-primary hover:underline">{msg.phone}</a></span>}
                                        <span>{new Date(msg.createdAt).toLocaleDateString(isRTL ? "fa-IR" : "en-US")}</span>
                                      </div>
                                    </div>
                                    <Button size="sm" variant="ghost" className="h-7 text-[10px] shrink-0" onClick={async () => {
                                      try {
                                        const res = await authFetch("/api/admin/messages", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: msg.id, isRead: !msg.isRead }) });
                                        if (res.ok) { showToast(!msg.isRead ? (isRTL ? "خوانده شد" : "Marked as read") : (isRTL ? "خوانده‌نشده شد" : "Marked as unread")); fetchContactMessages(); }
                                      } catch { /* ignore */ }
                                    }}>
                                      {msg.isRead ? <><Mail className="w-3 h-3" /></> : <><CheckCircle2 className="w-3 h-3" /></>}
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-primary" />
                          <h3 className="text-sm font-semibold">{isRTL ? "پیام‌های سیستم" : "System Messages"}</h3>
                        </div>
                        {adminMessagesUnread > 0 && (
                          <Badge className="text-[10px] bg-primary/10 text-primary border-0">
                            {adminMessagesUnread} {isRTL ? "خوانده نشده" : "unread"}
                          </Badge>
                        )}
                      </div>

                      {adminMessages.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p className="text-sm">{isRTL ? "پیامی وجود ندارد" : "No messages"}</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                          {adminMessages.map((msg, index) => {
                            const isUnread = msg.status === "sent" || msg.status === "delivered";
                            const prioConf = messagePriorityConfig[msg.priority] || messagePriorityConfig.normal;
                            const isSystemMsg = msg.isSystemMessage;
                            return (
                              <motion.div key={msg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                                <Card className={cn(
                                  "border-border/30 hover:border-primary/20 transition-all cursor-pointer",
                                  isUnread && "border-primary/20 bg-primary/5",
                                  isSystemMsg && "border-amber-500/20 bg-amber-500/5"
                                )}
                                  onClick={() => isUnread && handleMarkMessageRead(msg.id)}
                                  >
                                  <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                      <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                        isSystemMsg ? "bg-amber-500/10" : isUnread ? "bg-primary/10" : "bg-muted"
                                      )}>
                                        {isSystemMsg ? (
                                          <Zap className="w-4 h-4 text-amber-500" />
                                        ) : isUnread ? (
                                          <Bell className="w-4 h-4 text-primary" />
                                        ) : (
                                          <MessageSquare className="w-4 h-4 text-muted-foreground" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                          <h4 className={cn("text-sm truncate", isUnread && "font-bold")}>{msg.subject}</h4>
                                          {isUnread && (
                                            <Badge className="text-[10px] bg-primary/10 text-primary border-0">{isRTL ? "خوانده نشده" : "Unread"}</Badge>
                                          )}
                                          <Badge className={cn("text-[10px] border-0", prioConf.bgColor, prioConf.color)}>
                                            {isRTL ? prioConf.labelFa : prioConf.labelEn}
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2">{msg.content}</p>
                                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                                          <span className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            {msg.sender.name}
                                          </span>
                                          <span>{new Date(msg.createdAt).toLocaleDateString(isRTL ? "fa-IR" : "en-US")}</span>
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
                  )}
                </>)}

                {/* Blog Tab */}
                {activeTab === "blog" && (<>

                  {/* Categories Section (Collapsible) */}
                  <div className="border border-border/30 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
                      className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{isRTL ? "دسته‌بندی‌ها" : "Categories"}</span>
                        <Badge variant="secondary" className="text-[10px]">{blogCategories.length}</Badge>
                      </div>
                      {isCategoriesExpanded
                        ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      }
                    </button>

                    <AnimatePresence>
                      {isCategoriesExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 space-y-3">
                            <Dialog open={isBlogCategoryDialogOpen} onOpenChange={(open) => {
                              setIsBlogCategoryDialogOpen(open);
                              if (!open) setEditingBlogCategory(null);
                            }}>
                              <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                  <Search className={cn("absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground", isRTL ? "right-2.5" : "left-2.5")} />
                                  <Input
                                    placeholder={isRTL ? "جستجوی دسته..." : "Search categories..."}
                                    className={cn("rounded-xl h-8 text-xs", isRTL ? "pr-8" : "pl-8")}
                                    dir={isRTL ? "rtl" : "ltr"}
                                    value={categorySearch}
                                    onChange={(e) => setCategorySearch(e.target.value)}
                                  />
                                </div>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs h-8 shrink-0">
                                    <Plus className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">{isRTL ? "دسته جدید" : "New"}</span>
                                  </Button>
                                </DialogTrigger>
                              </div>
                              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>
                                    {editingBlogCategory
                                      ? (isRTL ? "ویرایش دسته" : "Edit Category")
                                      : (isRTL ? "دسته جدید" : "New Category")}
                                  </DialogTitle>
                                  <DialogDescription className="sr-only">فرم ایجاد/ویرایش دسته‌بندی</DialogDescription>
                                </DialogHeader>
                                <BlogCategoryForm
                                  initialData={editingBlogCategory}
                                  onSave={handleSaveBlogCategory}
                                  isRTL={isRTL}
                                />
                              </DialogContent>
                            </Dialog>

                            {blogCategories.length === 0 ? (
                              <div className="text-center py-8">
                                <Palette className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" />
                                <p className="text-sm text-muted-foreground">{isRTL ? "هنوز دسته‌ای ایجاد نشده" : "No categories yet"}</p>
                                <p className="text-xs text-muted-foreground mt-1">{isRTL ? "برای شروع یک دسته‌بندی جدید ایجاد کنید" : "Create a new category to get started"}</p>
                              </div>
                            ) : filteredBlogCategories.length === 0 ? (
                              <p className="text-xs text-muted-foreground text-center py-4">
                                {isRTL ? "نتیجه‌ای یافت نشد" : "No matching categories"}
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                                {filteredBlogCategories.map((cat) => (
                                  <Card key={cat.id} className="border-border/30 hover:border-primary/20 transition-all group">
                                    <CardContent className="p-3">
                                      <div className="flex items-start gap-2.5">
                                        <span
                                          className="w-5 h-5 rounded-md shrink-0 mt-0.5"
                                          style={{ backgroundColor: cat.color || "#8B2252" }}
                                        />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-1.5 mb-0.5">
                                            <span className="text-xs font-semibold truncate">{isRTL ? cat.nameFa : cat.nameEn}</span>
                                            {!cat.isPublished ? (
                                              <Badge className="text-[8px] bg-muted text-muted-foreground border-0 px-1 py-0">
                                                {isRTL ? "پیش‌نویس" : "Draft"}
                                              </Badge>
                                            ) : (
                                              <Badge className="text-[8px] bg-green-500/10 text-green-600 border-0 px-1 py-0">
                                                {isRTL ? "منتشر" : "Live"}
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="text-[10px] text-muted-foreground space-y-0.5">
                                            <div className="flex items-center gap-1">
                                              <Globe className="w-2.5 h-2.5" />
                                              <span className="truncate" dir="ltr">{cat.slugEn}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <BookOpen className="w-2.5 h-2.5" />
                                              <span>{cat._count?.posts ?? 0} {isRTL ? "مقاله" : "posts"}</span>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                          <Button variant="ghost" size="icon" className="w-6 h-6"
                                            onClick={() => { setEditingBlogCategory(cat); setIsBlogCategoryDialogOpen(true); }}>
                                            <Edit3 className="w-3 h-3 text-muted-foreground" />
                                          </Button>
                                          <Button variant="ghost" size="icon" className="w-6 h-6 hover:text-destructive"
                                            onClick={() => handleDeleteBlogCategory(cat.id)}>
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="mt-2 flex items-center gap-1.5">
                                        <Input
                                          type="number"
                                          min={0}
                                          value={cat.order}
                                          onChange={(e) => {
                                            const newOrder = parseInt(e.target.value) || 0;
                                            handleUpdateCategoryOrder(cat.id, newOrder);
                                          }}
                                          className="rounded-lg h-6 w-14 text-[10px] text-center px-1"
                                          title={isRTL ? "ترتیب نمایش" : "Display order"}
                                        />
                                        <span className="text-[9px] text-muted-foreground">{isRTL ? "ترتیب" : "order"}</span>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Posts Section */}
                  <Dialog open={isBlogPostDialogOpen} onOpenChange={(open) => {
                    setIsBlogPostDialogOpen(open);
                    if (!open) setEditingBlogPost(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2">
                        <Plus className="w-4 h-4" />
                        {isRTL ? "مقاله جدید" : "New Post"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingBlogPost
                            ? (isRTL ? "ویرایش مقاله" : "Edit Post")
                            : (isRTL ? "مقاله جدید" : "New Post")}
                        </DialogTitle>
                        <DialogDescription className="sr-only">فرم ایجاد/ویرایش مقاله</DialogDescription>
                      </DialogHeader>
                      <BlogPostForm
                        initialData={editingBlogPost}
                        onSave={handleSaveBlogPost}
                        isRTL={isRTL}
                        categories={blogCategories}
                      />
                    </DialogContent>
                  </Dialog>

                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : blogPosts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">{isRTL ? "هنوز مقاله‌ای ایجاد نشده" : "No posts yet"}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {blogPosts.map((post, index) => (
                        <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                          <Card className={cn("border-border/30 hover:border-primary/20 transition-all", !post.isPublished && "opacity-60")}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                {/* Cover thumbnail or icon */}
                                <div className="w-12 h-12 rounded-lg shrink-0 overflow-hidden bg-muted flex items-center justify-center">
                                  {post.coverUrl ? (
                                    <img
                                      src={post.coverUrl}
                                      alt={post.coverAltEn || ""}
                                      className="w-full h-full object-cover"
                                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                    />
                                  ) : (
                                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h4 className="text-sm font-semibold truncate">{isRTL ? post.titleFa : post.titleEn}</h4>
                                    {post.isFeatured && <Star className="w-3 h-3 text-gold shrink-0 fill-gold" />}
                                  </div>

                                  <div className="flex items-center gap-2 flex-wrap">
                                    {/* Category badges */}
                                    {post.categories && post.categories.length > 0 && post.categories.map((cat) => (
                                      <Badge
                                        key={cat.id}
                                        className="text-[10px] border-0"
                                        style={{
                                          backgroundColor: `${cat.color || "#8B2252"}20`,
                                          color: cat.color || "#8B2252",
                                        }}
                                      >
                                        {isRTL ? cat.nameFa : cat.nameEn}
                                      </Badge>
                                    ))}

                                    {/* Published/Draft badge */}
                                    {post.isPublished ? (
                                      <Badge className="text-[10px] bg-green-500/10 text-green-600 border-0">
                                        <Eye className="w-2.5 h-2.5 mr-0.5" />
                                        {isRTL ? "منتشر" : "Live"}
                                      </Badge>
                                    ) : (
                                      <Badge className="text-[10px] bg-muted text-muted-foreground border-0">
                                        <EyeOff className="w-2.5 h-2.5 mr-0.5" />
                                        {isRTL ? "پیش‌نویس" : "Draft"}
                                      </Badge>
                                    )}

                                    {/* Featured badge */}
                                    {post.isFeatured && (
                                      <Badge className="text-[10px] bg-gold/10 text-gold border-0">
                                        <Star className="w-2.5 h-2.5 mr-0.5" />
                                        {isRTL ? "ویژه" : "Featured"}
                                      </Badge>
                                    )}

                                    {/* Show on Home badge */}
                                    {post.isShowOnHome && (
                                      <Badge className="text-[10px] bg-primary/10 text-primary border-0">
                                        {isRTL ? "صفحه اصلی" : "Home"}
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Stats row */}
                                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.viewCount ?? 0}</span>
                                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{post.uniqueViewCount ?? 0}</span>
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readingTime} {isRTL ? "دقیقه" : "min"}</span>
                                    <span className="flex items-center gap-1"><Share2 className="w-3 h-3" />{post.shareCount ?? 0}</span>
                                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.likeCount ?? 0}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <Button variant="ghost" size="icon" className="w-7 h-7"
                                    onClick={() => { setEditingBlogPost(post); setIsBlogPostDialogOpen(true); }}>
                                    <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="w-7 h-7 hover:text-destructive"
                                    onClick={() => handleDeleteBlogPost(post.id)}>
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
                </>)}

                {/* Testimonials Tab */}
                {activeTab === "testimonials" && (<>
                  <div className={cn("flex flex-wrap items-center gap-3", isRTL && "flex-row-reverse")}>
                    <div className={cn("flex flex-wrap gap-1", isRTL && "flex-row-reverse")}>
                      {(["all", "pending", "approved", "published", "rejected"] as const).map((f) => (
                        <Button key={f} size="sm" variant={testimonialFilter === f ? "default" : "outline"} onClick={() => setTestimonialFilter(f)}>
                          {f === "all" ? (isRTL ? "همه" : "All") : f === "pending" ? (isRTL ? "در انتظار" : "Pending") : f === "approved" ? (isRTL ? "تأیید شده" : "Approved") : f === "published" ? (isRTL ? "منتشر شده" : "Published") : (isRTL ? "رد شده" : "Rejected")}
                        </Button>
                      ))}
                    </div>
                    <div className="ms-auto flex items-center gap-2">
                      {testimonialPendingCount > 0 && (
                        <Badge className="bg-amber-500/10 text-amber-600 text-[10px] border-0">
                          {testimonialPendingCount} {isRTL ? "در انتظار بررسی" : "pending review"}
                        </Badge>
                      )}
                      <Button size="sm" onClick={() => setIsTestimonialAddDialogOpen(true)}><Plus className="w-3.5 h-3.5 me-1" />{isRTL ? "بازخورد جدید" : "Add Testimonial"}</Button>
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : testimonials.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">{isRTL ? "بازخوردی یافت نشد" : "No testimonials found"}</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto">
                      {testimonials.map((t, idx) => (
                        <motion.div key={t.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                          <Card className={cn("border-border/30 hover:border-primary/20 transition-all", t.status === "pending" && "border-amber-500/30", t.status === "published" && "border-emerald-500/20", t.isFeatured && "ring-1 ring-amber-400/30")}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-muted shrink-0">
                                  {t.googleAvatarUrl ? (
                                    <img src={t.googleAvatarUrl} alt={t.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-primary font-bold text-sm">{t.name.charAt(0)}</div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className={cn("flex items-center gap-2 mb-1 flex-wrap", isRTL && "flex-row-reverse")}>
                                    <span className="text-sm font-semibold truncate">{t.name}</span>
                                    <div className="flex items-center gap-0.5">
                                      {[1, 2, 3, 4, 5].map((s) => (
                                        <Star key={s} className={cn("w-3.5 h-3.5", s <= t.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                                      ))}
                                    </div>
                                    <Badge className={cn("text-[9px] px-1.5", t.status === "pending" ? "bg-amber-500/10 text-amber-600" : t.status === "approved" ? "bg-sky-500/10 text-sky-600" : t.status === "published" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600")}>
                                      {t.status === "pending" ? (isRTL ? "در انتظار" : "Pending") : t.status === "approved" ? (isRTL ? "تأیید شده" : "Approved") : t.status === "published" ? (isRTL ? "منتشر شده" : "Published") : (isRTL ? "رد شده" : "Rejected")}
                                    </Badge>
                                    {t.isFeatured && <Badge className="text-[9px] px-1.5 bg-amber-500/10 text-amber-600"><Star className="w-3 h-3 me-0.5 fill-amber-400" />{isRTL ? "برجسته" : "Featured"}</Badge>}
                                    {t.instrument && <Badge variant="outline" className="text-[9px] px-1.5">{t.instrument}</Badge>}
                                  </div>
                                  {t.titleFa && <p className="text-xs font-medium mb-1">{isRTL ? t.titleFa : (t.titleEn || t.titleFa)}</p>}
                                  <p className="text-xs text-muted-foreground line-clamp-3">{isRTL ? t.contentFa : (t.contentEn || t.contentFa)}</p>
                                  <div className={cn("flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground", isRTL && "flex-row-reverse")}>
                                    <span>{t.email}</span>
                                    <span>•</span>
                                    <span>{new Date(t.createdAt).toLocaleDateString(isRTL ? "fa-IR" : "en-US")}</span>
                                  </div>
                                </div>
                                <div className={cn("flex flex-col gap-1 shrink-0", isRTL && "items-end")}>
                                  {t.status === "pending" && (
                                    <>
                                      <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10" onClick={async () => {
                                        try { const res = await authFetch(`/api/admin/testimonials/${t.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "approve" }) }); if (res.ok) { showToast(isRTL ? "بازخورد تأیید شد" : "Testimonial approved"); fetchTestimonials(); } } catch { showToast(isRTL ? "خطا" : "Error", "error"); }
                                      }}><CheckCircle2 className="w-3 h-3" />{isRTL ? "تأیید" : "Approve"}</Button>
                                      <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 text-red-600 hover:text-red-700 hover:bg-red-500/10" onClick={async () => {
                                        try { const res = await authFetch(`/api/admin/testimonials/${t.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reject" }) }); if (res.ok) { showToast(isRTL ? "بازخورد رد شد" : "Testimonial rejected"); fetchTestimonials(); } } catch { showToast(isRTL ? "خطا" : "Error", "error"); }
                                      }}><XCircle className="w-3 h-3" />{isRTL ? "رد" : "Reject"}</Button>
                                    </>
                                  )}
                                  {t.status === "approved" && (
                                    <>
                                      <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 text-primary hover:bg-primary/10" onClick={async () => {
                                        try { const res = await authFetch(`/api/admin/testimonials/${t.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "publish" }) }); if (res.ok) { showToast(isRTL ? "بازخورد منتشر شد" : "Testimonial published"); fetchTestimonials(); } } catch { showToast(isRTL ? "خطا" : "Error", "error"); }
                                      }}><Globe className="w-3 h-3" />{isRTL ? "انتشار" : "Publish"}</Button>
                                      <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 text-red-600 hover:text-red-700 hover:bg-red-500/10" onClick={async () => {
                                        try { const res = await authFetch(`/api/admin/testimonials/${t.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reject" }) }); if (res.ok) { showToast(isRTL ? "بازخورد رد شد" : "Testimonial rejected"); fetchTestimonials(); } } catch { showToast(isRTL ? "خطا" : "Error", "error"); }
                                      }}><XCircle className="w-3 h-3" />{isRTL ? "رد" : "Reject"}</Button>
                                    </>
                                  )}
                                  {t.status === "published" && (
                                    <>
                                      <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={async () => {
                                        try { const res = await authFetch(`/api/admin/testimonials/${t.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "unpublish" }) }); if (res.ok) { showToast(isRTL ? "بازخورد از انتشار خارج شد" : "Testimonial unpublished"); fetchTestimonials(); } } catch { showToast(isRTL ? "خطا" : "Error", "error"); }
                                      }}><EyeOff className="w-3 h-3" />{isRTL ? "لغو انتشار" : "Unpublish"}</Button>
                                      <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 text-amber-600 hover:bg-amber-500/10" onClick={async () => {
                                        try { const res = await authFetch(`/api/admin/testimonials/${t.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isFeatured: !t.isFeatured }) }); if (res.ok) { showToast(!t.isFeatured ? (isRTL ? "برجسته شد" : "Featured") : (isRTL ? "از برجستگی خارج شد" : "Unfeatured")); fetchTestimonials(); } } catch { showToast(isRTL ? "خطا" : "Error", "error"); }
                                      }}>
                                        {t.isFeatured ? <><Star className="w-3 h-3" />{isRTL ? "لغو برجستگی" : "Unfeature"}</> : <><Star className="w-3 h-3" />{isRTL ? "برجسته" : "Feature"}</>}
                                      </Button>
                                    </>
                                  )}
                                  {t.status === "rejected" && (
                                    <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10" onClick={async () => {
                                      try { const res = await authFetch(`/api/admin/testimonials/${t.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "approve" }) }); if (res.ok) { showToast(isRTL ? "تأیید مجدد" : "Re-approved"); fetchTestimonials(); } } catch { showToast(isRTL ? "خطا" : "Error", "error"); }
                                    }}><CheckCircle2 className="w-3 h-3" />{isRTL ? "تأیید مجدد" : "Re-approve"}</Button>
                                  )}
                                  <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1" onClick={() => {
                                    setEditingTestimonial(t);
                                    setTestimonialEditForm({ name: t.name, email: t.email, googleAvatarUrl: t.googleAvatarUrl || "", googleEmail: t.googleEmail || "", rating: t.rating, titleFa: t.titleFa || "", titleEn: t.titleEn || "", contentFa: t.contentFa, contentEn: t.contentEn || "", instrument: t.instrument || "", isFeatured: t.isFeatured, adminNotes: t.adminNotes || "" });
                                    setIsTestimonialEditDialogOpen(true);
                                  }}><Edit3 className="w-3 h-3" />{isRTL ? "ویرایش" : "Edit"}</Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Add Testimonial Dialog */}
                  <Dialog open={isTestimonialAddDialogOpen} onOpenChange={setIsTestimonialAddDialogOpen}>
                    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader><DialogTitle>{isRTL ? "افزودن بازخورد جدید" : "Add New Testimonial"}</DialogTitle><DialogDescription className="sr-only">فرم افزودن بازخورد</DialogDescription></DialogHeader>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div><Label className="text-xs">{isRTL ? "نام *" : "Name *"}</Label><Input className="h-8 text-sm" value={testimonialAddForm.name} onChange={(e) => setTestimonialAddForm({ ...testimonialAddForm, name: e.target.value })} dir="rtl" /></div>
                          <div><Label className="text-xs">{isRTL ? "ایمیل" : "Email"}</Label><Input className="h-8 text-sm" value={testimonialAddForm.email} onChange={(e) => setTestimonialAddForm({ ...testimonialAddForm, email: e.target.value })} dir="ltr" /></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div><Label className="text-xs">{isRTL ? "آواتار گوگل (URL)" : "Google Avatar URL"}</Label><Input className="h-8 text-sm" value={testimonialAddForm.googleAvatarUrl} onChange={(e) => setTestimonialAddForm({ ...testimonialAddForm, googleAvatarUrl: e.target.value })} dir="ltr" /></div>
                          <div><Label className="text-xs">{isRTL ? "امتیاز (1-5)" : "Rating (1-5)"}</Label>
                            <Select value={String(testimonialAddForm.rating)} onValueChange={(v) => setTestimonialAddForm({ ...testimonialAddForm, rating: parseInt(v) })}>
                              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>{[1,2,3,4,5].map((n) => <SelectItem key={n} value={String(n)}>{n} ★</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div><Label className="text-xs">{isRTL ? "عنوان (فارسی)" : "Title (Farsi)"}</Label><Input className="h-8 text-sm" value={testimonialAddForm.titleFa} onChange={(e) => setTestimonialAddForm({ ...testimonialAddForm, titleFa: e.target.value })} dir="rtl" /></div>
                        <div><Label className="text-xs">{isRTL ? "متن (فارسی) *" : "Content (Farsi) *"}</Label><Textarea className="text-sm" rows={3} value={testimonialAddForm.contentFa} onChange={(e) => setTestimonialAddForm({ ...testimonialAddForm, contentFa: e.target.value })} dir="rtl" /></div>
                        <div><Label className="text-xs">{isRTL ? "متن (انگلیسی)" : "Content (English)"}</Label><Textarea className="text-sm" rows={3} value={testimonialAddForm.contentEn} onChange={(e) => setTestimonialAddForm({ ...testimonialAddForm, contentEn: e.target.value })} dir="ltr" /></div>
                        <div><Label className="text-xs">{isRTL ? "ساز" : "Instrument"}</Label><Input className="h-8 text-sm" value={testimonialAddForm.instrument} onChange={(e) => setTestimonialAddForm({ ...testimonialAddForm, instrument: e.target.value })} dir="rtl" /></div>
                        <div className={cn("flex gap-2 justify-end", isRTL && "flex-row-reverse")}>
                          <Button variant="outline" size="sm" onClick={() => setIsTestimonialAddDialogOpen(false)}>{isRTL ? "انصراف" : "Cancel"}</Button>
                          <Button size="sm" disabled={testimonialSaving} onClick={async () => {
                            if (!testimonialAddForm.name || !testimonialAddForm.contentFa) { showToast(isRTL ? "نام و متن فارسی الزامی است" : "Name and Farsi content are required", "error"); return; }
                            setTestimonialSaving(true);
                            try {
                              const res = await authFetch("/api/admin/testimonials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(testimonialAddForm) });
                              if (res.ok) { showToast(isRTL ? "بازخورد اضافه شد" : "Testimonial added"); setIsTestimonialAddDialogOpen(false); setTestimonialAddForm({ name: "", email: "", googleAvatarUrl: "", googleEmail: "", rating: 5, titleFa: "", titleEn: "", contentFa: "", contentEn: "", instrument: "" }); fetchTestimonials(); }
                              else { showToast(isRTL ? "خطا" : "Error", "error"); }
                            } catch { showToast(isRTL ? "خطا" : "Error", "error"); }
                            finally { setTestimonialSaving(false); }
                          }}>{testimonialSaving && <Loader2 className="w-3.5 h-3.5 me-1 animate-spin" />}{isRTL ? "افزودن" : "Add"}</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Edit Testimonial Dialog */}
                  <Dialog open={isTestimonialEditDialogOpen} onOpenChange={setIsTestimonialEditDialogOpen}>
                    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader><DialogTitle>{isRTL ? "ویرایش بازخورد" : "Edit Testimonial"}</DialogTitle><DialogDescription className="sr-only">فرم ویرایش بازخورد</DialogDescription></DialogHeader>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div><Label className="text-xs">{isRTL ? "نام" : "Name"}</Label><Input className="h-8 text-sm" value={testimonialEditForm.name} onChange={(e) => setTestimonialEditForm({ ...testimonialEditForm, name: e.target.value })} dir="rtl" /></div>
                          <div><Label className="text-xs">{isRTL ? "ایمیل" : "Email"}</Label><Input className="h-8 text-sm" value={testimonialEditForm.email} onChange={(e) => setTestimonialEditForm({ ...testimonialEditForm, email: e.target.value })} dir="ltr" /></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div><Label className="text-xs">{isRTL ? "آواتار گوگل (URL)" : "Google Avatar URL"}</Label><Input className="h-8 text-sm" value={testimonialEditForm.googleAvatarUrl} onChange={(e) => setTestimonialEditForm({ ...testimonialEditForm, googleAvatarUrl: e.target.value })} dir="ltr" /></div>
                          <div><Label className="text-xs">{isRTL ? "امتیاز (1-5)" : "Rating (1-5)"}</Label>
                            <Select value={String(testimonialEditForm.rating)} onValueChange={(v) => setTestimonialEditForm({ ...testimonialEditForm, rating: parseInt(v) })}>
                              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>{[1,2,3,4,5].map((n) => <SelectItem key={n} value={String(n)}>{n} ★</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div><Label className="text-xs">{isRTL ? "عنوان (فارسی)" : "Title (Farsi)"}</Label><Input className="h-8 text-sm" value={testimonialEditForm.titleFa} onChange={(e) => setTestimonialEditForm({ ...testimonialEditForm, titleFa: e.target.value })} dir="rtl" /></div>
                        <div><Label className="text-xs">{isRTL ? "متن (فارسی)" : "Content (Farsi)"}</Label><Textarea className="text-sm" rows={3} value={testimonialEditForm.contentFa} onChange={(e) => setTestimonialEditForm({ ...testimonialEditForm, contentFa: e.target.value })} dir="rtl" /></div>
                        <div><Label className="text-xs">{isRTL ? "متن (انگلیسی)" : "Content (English)"}</Label><Textarea className="text-sm" rows={3} value={testimonialEditForm.contentEn} onChange={(e) => setTestimonialEditForm({ ...testimonialEditForm, contentEn: e.target.value })} dir="ltr" /></div>
                        <div><Label className="text-xs">{isRTL ? "ساز" : "Instrument"}</Label><Input className="h-8 text-sm" value={testimonialEditForm.instrument} onChange={(e) => setTestimonialEditForm({ ...testimonialEditForm, instrument: e.target.value })} dir="rtl" /></div>
                        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                          <Switch checked={testimonialEditForm.isFeatured} onCheckedChange={(v) => setTestimonialEditForm({ ...testimonialEditForm, isFeatured: v })} />
                          <Label className="text-xs">{isRTL ? "برجسته" : "Featured"}</Label>
                        </div>
                        <div><Label className="text-xs">{isRTL ? "یادداشت مدیر" : "Admin Notes"}</Label><Textarea className="text-sm" rows={2} value={testimonialEditForm.adminNotes} onChange={(e) => setTestimonialEditForm({ ...testimonialEditForm, adminNotes: e.target.value })} dir="rtl" /></div>
                        <div className={cn("flex gap-2 justify-end", isRTL && "flex-row-reverse")}>
                          <Button variant="outline" size="sm" onClick={() => setIsTestimonialEditDialogOpen(false)}>{isRTL ? "انصراف" : "Cancel"}</Button>
                          <Button size="sm" disabled={testimonialSaving} onClick={async () => {
                            if (!editingTestimonial) return;
                            setTestimonialSaving(true);
                            try {
                              const res = await authFetch(`/api/admin/testimonials/${editingTestimonial.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(testimonialEditForm) });
                              if (res.ok) { showToast(isRTL ? "بازخورد بروزرسانی شد" : "Testimonial updated"); setIsTestimonialEditDialogOpen(false); setEditingTestimonial(null); fetchTestimonials(); }
                              else { showToast(isRTL ? "خطا" : "Error", "error"); }
                            } catch { showToast(isRTL ? "خطا" : "Error", "error"); }
                            finally { setTestimonialSaving(false); }
                          }}>{testimonialSaving && <Loader2 className="w-3.5 h-3.5 me-1 animate-spin" />}{isRTL ? "بروزرسانی" : "Update"}</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>)}

                {/* Admin Guide Tab */}
                {activeTab === "guide" && (<>
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold">{isRTL ? "راهنمای ادمین" : "Admin Guide"}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isRTL ? "راهنمای عملیات، دستورالعمل‌ها و سوالات متداول" : "Operations guide, instructions & FAQ"}
                    </p>
                  </div>

                  {/* Quick Reference */}
                  <Card className="border-border/30 mb-4">
                    <CardHeader className="pb-2 px-4 pt-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                          <Zap className="w-4 h-4 text-amber-500" />
                        </div>
                        <h4 className="text-sm font-semibold">{isRTL ? "دسترسی سریع" : "Quick Reference"}</h4>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-2">
                      {[
                        { icon: Megaphone, labelFa: "اعلان جدید", labelEn: "New Announcement", tab: "announcements" },
                        { icon: GraduationCap, labelFa: "کارگاه جدید", labelEn: "New Workshop", tab: "workshops" },
                        { icon: Music, labelFa: "دوره جدید", labelEn: "New Course", tab: "courses" },
                        { icon: CreditCard, labelFa: "مدیریت ثبت‌نام", labelEn: "Manage Registration", tab: "registrations" },
                        { icon: Wallet, labelFa: "گزارش مالی", labelEn: "Financial Report", tab: "financial" },
                        { icon: CalendarClock, labelFa: "برنامه کلاس", labelEn: "Class Schedule", tab: "schedules" },
                      ].map((item, i) => (
                        <button key={i} onClick={() => setActiveTab(item.tab)} className={cn(
                          "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg border border-border/20 text-sm transition-colors hover:bg-muted",
                          isRTL && "flex-row-reverse"
                        )}>
                          <item.icon className="w-4 h-4 text-primary shrink-0" />
                          <span className="flex-1 text-start">{isRTL ? item.labelFa : item.labelEn}</span>
                          <ArrowRight className={cn("w-3 h-3 text-muted-foreground", isRTL && "rotate-180")} />
                        </button>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Step-by-step Instructions */}
                  <Card className="border-border/30 mb-4">
                    <CardHeader className="pb-2 px-4 pt-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                          <ClipboardList className="w-4 h-4 text-teal-500" />
                        </div>
                        <h4 className="text-sm font-semibold">{isRTL ? "دستورالعمل‌های گام‌به‌گام" : "Step-by-Step Instructions"}</h4>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-4">
                      {[
                        {
                          titleFa: "ایجاد کارگاه جدید",
                          titleEn: "Create a New Workshop",
                          stepsFa: ["به تب کارگاه‌ها بروید", "دکمه «کارگاه جدید» را بزنید", "عنوان فارسی و انگلیسی را وارد کنید", "تاریخ، ساعت و ظرفیت را تعیین کنید", "تصویر کاور آپلود کنید", "دکمه انتشار را فعال کنید و ذخیره کنید"],
                          stepsEn: ["Go to Workshops tab", "Click 'New Workshop' button", "Enter Fa/En titles", "Set date, time & capacity", "Upload cover image", "Enable publish toggle and save"],
                        },
                        {
                          titleFa: "مدیریت دوره آموزشی",
                          titleEn: "Manage a Course",
                          stepsFa: ["به تب دوره‌ها بروید", "دکمه «دوره جدید» را بزنید", "ساز، سطح و نوع کلاس را انتخاب کنید", "مدرس و شعبه را تعیین کنید", "قیمت دوره را وارد کنید", "ذخیره و منتشر کنید"],
                          stepsEn: ["Go to Courses tab", "Click 'New Course' button", "Select instrument, level & class type", "Assign instructor & branch", "Enter course price", "Save and publish"],
                        },
                        {
                          titleFa: "پیگیری مالی ثبت‌نام",
                          titleEn: "Payment Follow-up",
                          stepsFa: ["به تب مالی بروید", "فیلتر «پرداخت نشده» را فعال کنید", "ثبت‌نام مورد نظر را پیدا کنید", "دکمه ویرایش را بزنید", "وضعیت پرداخت و مبلغ را بروزرسانی کنید", "تاریخ پرداخت و شماره تراکنش را ثبت کنید"],
                          stepsEn: ["Go to Financial tab", "Filter by 'Unpaid'", "Find the target enrollment", "Click Edit button", "Update payment status & amount", "Record payment date & reference"],
                        },
                        {
                          titleFa: "برنامه‌ریزی کلاس",
                          titleEn: "Schedule a Class",
                          stepsFa: ["به تب برنامه کلاس بروید", "دکمه «برنامه جدید» را بزنید", "دوره و مدرس را انتخاب کنید", "روز، ساعت شروع و پایان را تعیین کنید", "اتاق و ظرفیت را وارد کنید", "ذخیره کنید"],
                          stepsEn: ["Go to Schedules tab", "Click 'New Schedule' button", "Select course & instructor", "Set day, start & end time", "Enter room & capacity", "Save"],
                        },
                      ].map((instruction, i) => (
                        <div key={i} className="border border-border/30 rounded-xl p-3 space-y-2">
                          <h5 className="text-sm font-semibold">{isRTL ? instruction.titleFa : instruction.titleEn}</h5>
                          <ol className="space-y-1">
                            {(isRTL ? instruction.stepsFa : instruction.stepsEn).map((step, j) => (
                              <li key={j} className={cn("flex items-start gap-2 text-xs text-muted-foreground", isRTL && "flex-row-reverse")}>
                                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-[10px] font-bold">{isRTL ? toPersianDigits(j + 1) : j + 1}</span>
                                <span className="leading-relaxed">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* FAQ Section */}
                  <Card className="border-border/30 mb-4">
                    <CardHeader className="pb-2 px-4 pt-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                          <HelpCircle className="w-4 h-4 text-rose-500" />
                        </div>
                        <h4 className="text-sm font-semibold">{isRTL ? "سوالات متداول" : "FAQ"}</h4>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-3">
                      {[
                        {
                          qFa: "چگونه وضعیت پرداخت یک ثبت‌نام را تغییر دهم؟",
                          qEn: "How to change payment status of an enrollment?",
                          aFa: "از تب مالی یا ثبت‌نام‌ها، روی دکمه ویرایش کنار هر ثبت‌نام کلیک کنید. وضعیت پرداخت (پرداخت شده/نشده/جزئی/معاف) و مبلغ شهریه را می‌توانید بروزرسانی کنید.",
                          aEn: "From Financial or Registrations tab, click Edit button next to any enrollment. You can update payment status (paid/unpaid/partial/waived) and tuition amount.",
                        },
                        {
                          qFa: "تفاوت ساز اصلی و ساز ثبت‌نام چیست؟",
                          qEn: "What is the difference between primary instrument and registration instrument?",
                          aFa: "ساز اصلی سازی است که هنرجو قبلاً می‌نوازد. ساز ثبت‌نام سازی است که برای یادگیری آن ثبت‌نام کرده. ممکن است یک نفر پیانو بلد باشد ولی گیتار ثبت‌نام کند.",
                          aEn: "Primary instrument is what the student already plays. Registration instrument is what they are enrolling to learn. Someone may know piano but enroll for guitar.",
                        },
                        {
                          qFa: "چگونه یک کارگاه را «داغ» کنم؟",
                          qEn: "How to mark a workshop as 'Hot'?",
                          aFa: "هنگام ایجاد یا ویرایش کارگاه، کلید «پرطرفدار (داغ)» را فعال کنید. کارگاه‌های داغ با نشان آتش نمایش داده می‌شوند.",
                          aEn: "When creating or editing a workshop, toggle the 'Hot' switch. Hot workshops are displayed with a fire icon.",
                        },
                        {
                          qFa: "اگر هنرجو نتواند پرداخت کند چه کنم؟",
                          qEn: "What if a student cannot pay?",
                          aFa: "می‌توانید وضعیت پرداخت را به «معاف» تغییر دهید. این حالت برای هنرجویان بورسیه‌ای یا موارد خاص مناسب است.",
                          aEn: "You can change payment status to 'Waived'. This is suitable for scholarship students or special cases.",
                        },
                        {
                          qFa: "چگونه درخواست تغییر برنامه کلاس را تأیید کنم؟",
                          qEn: "How to approve a schedule change request?",
                          aFa: "از تب درخواست‌ها، درخواست مورد نظر را انتخاب کنید. پس از بررسی، دکمه تأیید یا رد را بزنید و در صورت تأیید، تغییرات خودکار اعمال می‌شود.",
                          aEn: "From Requests tab, select the target request. After review, click Approve or Reject. If approved, changes are applied automatically.",
                        },
                      ].map((faq, i) => (
                        <div key={i} className="border border-border/30 rounded-xl p-3 space-y-1.5">
                          <div className={cn("flex items-start gap-2", isRTL && "flex-row-reverse")}>
                            <FileQuestion className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            <p className="text-sm font-semibold">{isRTL ? faq.qFa : faq.qEn}</p>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed" dir={isRTL ? "rtl" : "ltr"}>{isRTL ? faq.aFa : faq.aEn}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Field Reference */}
                  <Card className="border-border/30">
                    <CardHeader className="pb-2 px-4 pt-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <h4 className="text-sm font-semibold">{isRTL ? "مرجع فیلدها" : "Field Reference"}</h4>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-3">
                      {adminGuideSections.map((section) => {
                        const SectionIcon = section.icon;
                        return (
                          <div key={section.id} className="border border-border/30 rounded-xl p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <SectionIcon className="w-4 h-4 text-primary shrink-0" />
                              <span className="text-sm font-semibold">{isRTL ? section.titleFa : section.titleEn}</span>
                              <Badge variant="outline" className="text-[9px]">{section.fields.length} {isRTL ? "فیلد" : "fields"}</Badge>
                            </div>
                            <div className="space-y-1.5">
                              {section.fields.map((field, idx) => (
                                <div key={idx} className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-medium text-primary">{field.nameFa}</span>
                                  <Badge variant="outline" className="text-[9px] font-mono">{field.nameEn}</Badge>
                                  {field.tipFa && (
                                    <span className="text-[10px] text-amber-600 dark:text-amber-400">💡 {field.tipFa}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </>)}

                {/* Pending Registrations Tab (online submissions awaiting approval) */}
                {activeTab === "pending-registrations" && (
                  <PendingRegistrationsTab isRTL={isRTL} />
                )}
              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
