"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useAuthStore, authFetch } from "@/lib/auth/store";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  Loader2,
  GraduationCap,
  Music,
  MapPin,
  Users,
  Heart,
  ChevronLeft,
  ChevronRight,
  Check,
  Guitar,
  Piano,
  Drum,
  Mic,
  Music2,
  BookOpen,
  Clock,
  Target,
  Sparkles,
  Instagram,
  Send,
  Youtube,
  FileText,
  Shield,
  Baby,
  Link2,
  HelpCircle,
  X,
  ChevronsUpDown,
  Ban,
  Briefcase,
  GraduationCap as TeachIcon,
  Radio,
  PenTool,
  ClipboardCheck,
  TrendingUp,
  Building2,
  CreditCard,
  DollarSign,
  Calendar,
  Receipt,
  Monitor,
  PhoneCall,
  UserCheck,
  AlertCircle,
  Wallet,
  Tags,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────

interface RegistrationFormProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: "student" | "instructor";
  isAdminMode?: boolean;
}

type UserRole = "student" | "instructor";

interface FormData {
  // Step 1
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  // Step 1 - Admin mode
  registrationMethod: "online" | "phone" | "in_person";
  // Step 2
  dateOfBirth: string;
  gender: string;
  nationalId: string;
  educationLevel: string;
  fieldOfStudy: string;
  // Step 3
  registrationInstrument: string;
  primaryInstrument: string;
  secondaryInstruments: string[];
  musicExperienceYears: string;
  previousTraining: string;
  musicGenres: string[];
  learningGoals: string[];
  practiceHoursPerWeek: string;
  skillLevel: string;
  instructorName: string;
  instructorNameKnown: boolean;
  // Step 3/4 - Admin: Tuition & Payment
  courseId: string;
  tuitionAmount: string;
  paymentStatus: string;
  paymentDueDate: string;
  paymentRef: string;
  // Admin: Tags for categorization
  tags: string;
  // Step 4
  address: string;
  city: string;
  province: string;
  emergencyContact: string;
  preferredBranch: string;
  // Step 5 - Conditional
  parentName: string;
  parentPhone: string;
  parentRelation: string;
  // Step 5 - Instructor
  specialtyFa: string;
  specialtyEn: string;
  bioFa: string;
  bioEn: string;
  experience: string;
  instagramLink: string;
  telegramLink: string;
  youtubeLink: string;
  soundcloudLink: string;
  isPublishedInstructor: boolean;
  instructorOrder: string;
  // Step 5 - Instructor Extended Profile
  teachingInstruments: string[];
  certifications: string;
  hourlyRate: string;
  availableDays: string[];
  hireDate: string;
  contractType: string;
  // Step 6
  referralSource: string;
  referralDetail: string;
}

type StepId = 1 | 2 | 3 | 4 | 5 | 6;

interface StepInfo {
  id: StepId;
  titleFa: string;
  titleEn: string;
  descFa: string;
  descEn: string;
  icon: React.ElementType;
}

// ─── Constants ─────────────────────────────────────────

const STEPS: StepInfo[] = [
  {
    id: 1,
    titleFa: "اطلاعات حساب",
    titleEn: "Account Basics",
    descFa: "نوع کاربری و اطلاعات ورود",
    descEn: "User type and login credentials",
    icon: User,
  },
  {
    id: 2,
    titleFa: "اطلاعات شخصی",
    titleEn: "Personal Information",
    descFa: "تاریخ تولد شمسی، جنسیت و پایه تحصیلی",
    descEn: "Jalali birth date, gender and education level",
    icon: GraduationCap,
  },
  {
    id: 3,
    titleFa: "پروفایل موسیقی",
    titleEn: "Music Profile",
    descFa: "ساز، سبک و سطح مهارت",
    descEn: "Instrument, genres and skill level",
    icon: Music,
  },
  {
    id: 4,
    titleFa: "موقعیت و تماس",
    titleEn: "Location & Contact",
    descFa: "آدرس و شعبه ترجیحی",
    descEn: "Address and preferred branch",
    icon: MapPin,
  },
  {
    id: 5,
    titleFa: "اطلاعات تکمیلی",
    titleEn: "Additional Info",
    descFa: "اطلاعات ولی یا تخصص تدریس",
    descEn: "Guardian info or teaching specialty",
    icon: Users,
  },
  {
    id: 6,
    titleFa: "معرف و منبع",
    titleEn: "Referral Source",
    descFa: "چگونه با ما آشنا شدید؟",
    descEn: "How did you find us?",
    icon: Heart,
  },
];

const INSTRUMENTS = [
  { value: "piano", fa: "پیانو", en: "Piano", icon: Piano },
  { value: "guitar", fa: "گیتار", en: "Guitar", icon: Guitar },
  { value: "violin", fa: "ویولن", en: "Violin", icon: Music2 },
  { value: "setar", fa: "سه‌تار", en: "Setar", icon: Music2 },
  { value: "tar", fa: "تار", en: "Tar", icon: Music2 },
  { value: "kamancheh", fa: "کمانچه", en: "Kamancheh", icon: Music2 },
  { value: "drums", fa: "درامز", en: "Drums", icon: Drum },
  { value: "vocals", fa: "آواز", en: "Vocals", icon: Mic },
  { value: "santur", fa: "سنتور", en: "Santur", icon: Music2 },
  { value: "oud", fa: "عود", en: "Oud", icon: Music2 },
  { value: "flute", fa: "فلوت", en: "Flute", icon: Music2 },
  { value: "daf", fa: "دف", en: "Daf", icon: Music2 },
  { value: "tonbak", fa: "تنبک", en: "Tonbak", icon: Drum },
  { value: "other", fa: "سایر", en: "Other", icon: Music2 },
];

const GENDERS = [
  { value: "male", fa: "مرد", en: "Male" },
  { value: "female", fa: "زن", en: "Female" },
  { value: "other", fa: "سایر", en: "Other" },
  { value: "prefer_not_to_say", fa: "ترجیح می‌دهم نگویم", en: "Prefer not to say" },
];

const EDUCATION_LEVELS = [
  // ─── پایه‌های تحصیلی (برای دانش‌آموزان بدون مدرک) ───
  { value: "preschool", fa: "پیش‌دبستان", en: "Preschool", category: "school" },
  { value: "primary", fa: "دبستان", en: "Primary School", category: "school" },
  { value: "middle_school", fa: "متوسطه اول", en: "Middle School", category: "school" },
  { value: "high_school", fa: "متوسطه دوم", en: "High School", category: "school" },
  // ─── مدارک تحصیلی (برای فارغ‌التحصیلان) ───
  { value: "diploma", fa: "دیپلم", en: "Diploma", category: "degree" },
  { value: "associate", fa: "کاردانی", en: "Associate", category: "degree" },
  { value: "bachelor", fa: "کارشناسی", en: "Bachelor", category: "degree" },
  { value: "master", fa: "کارشناسی ارشد", en: "Master", category: "degree" },
  { value: "phd", fa: "دکتری", en: "PhD", category: "degree" },
  { value: "other", fa: "سایر", en: "Other", category: "other" },
];

const PREVIOUS_TRAINING = [
  { value: "none", fa: "بدون سابقه", en: "None" },
  { value: "self_taught", fa: "خودآموز", en: "Self-taught" },
  { value: "private_tutor", fa: "معلم خصوصی", en: "Private Tutor" },
  { value: "music_school", fa: "مدرسه موسیقی", en: "Music School" },
  { value: "university", fa: "دانشگاه", en: "University" },
  { value: "online_courses", fa: "دوره آنلاین", en: "Online Courses" },
];

const MUSIC_GENRES = [
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

const LEARNING_GOALS = [
  { value: "hobby", fa: "سرگرمی", en: "Hobby", descFa: "برای لذت و تفریح", descEn: "For enjoyment and fun", icon: Sparkles },
  { value: "professional_career", fa: "حرفه‌ای", en: "Professional Career", descFa: "قصد فعالیت حرفه‌ای دارم", descEn: "I plan to work professionally", icon: Briefcase },
  { value: "teaching", fa: "تدریس", en: "Teaching", descFa: "می‌خواهم تدریس کنم", descEn: "I want to teach music", icon: TeachIcon },
  { value: "performance", fa: "اجرای زنده", en: "Performance", descFa: "هدفم اجرای زنده است", descEn: "My goal is live performance", icon: Radio },
  { value: "composition", fa: "آهنگسازی", en: "Composition", descFa: "می‌خواهم آهنگسازی کنم", descEn: "I want to compose music", icon: PenTool },
  { value: "exam_prep", fa: "آمادگی آزمون", en: "Exam Prep", descFa: "آمادگی برای آزمون ورودی", descEn: "Preparing for entrance exam", icon: ClipboardCheck },
  { value: "self_improvement", fa: "توسعه شخصی", en: "Self Improvement", descFa: "برای رشد شخصی", descEn: "For personal growth", icon: TrendingUp },
];

const SKILL_LEVELS = [
  { value: "beginner", fa: "مبتدی", en: "Beginner" },
  { value: "intermediate", fa: "متوسط", en: "Intermediate" },
  { value: "advanced", fa: "پیشرفته", en: "Advanced" },
  { value: "professional", fa: "حرفه‌ای", en: "Professional" },
];

const PARENT_RELATIONS = [
  { value: "father", fa: "پدر", en: "Father" },
  { value: "mother", fa: "مادر", en: "Mother" },
  { value: "guardian", fa: "سرپرست", en: "Guardian" },
  { value: "other", fa: "سایر", en: "Other" },
];

const REFERRAL_SOURCES = [
  { value: "instagram", fa: "اینستاگرام", en: "Instagram" },
  { value: "telegram", fa: "تلگرام", en: "Telegram" },
  { value: "google", fa: "گوگل", en: "Google" },
  { value: "friend", fa: "دوستان", en: "Friend" },
  { value: "billboard", fa: "بیلبورد", en: "Billboard" },
  { value: "website", fa: "وبسایت", en: "Website" },
  { value: "event", fa: "رویداد", en: "Event" },
  { value: "other", fa: "سایر", en: "Other" },
];

const IRANIAN_PROVINCES = [
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

const BRANCHES = [
  { value: "main", fa: "شعبه اصلی (بلوار معلم)", en: "Main Branch (Moallem Blvd)" },
  { value: "west", fa: "شعبه غرب (آریاشهر)", en: "West Branch (Ariashahr)" },
  { value: "north", fa: "شعبه شمال (تجریش)", en: "North Branch (Tajrish)" },
  { value: "other", fa: "سایر", en: "Other" },
];

const REGISTRATION_METHODS = [
  { value: "online", fa: "آنلاین", en: "Online", descFa: "خود هنرجو فرم را پر می‌کند", descEn: "Student fills the form themselves", icon: Monitor },
  { value: "phone", fa: "تلفنی", en: "Phone", descFa: "ادمین از طریق تماس تلفنی ثبت‌نام می‌کند", descEn: "Admin registers via phone call", icon: PhoneCall },
  { value: "in_person", fa: "حضوری", en: "In-Person", descFa: "هنرجو حضوری مراجعه کرده و ادمین ثبت‌نام می‌کند", descEn: "Student visits in person, admin registers", icon: UserCheck },
];

const PAYMENT_STATUSES = [
  { value: "paid", fa: "پرداخت شده", en: "Paid", color: "text-emerald-600" },
  { value: "unpaid", fa: "پرداخت نشده", en: "Unpaid", color: "text-red-500" },
  { value: "partial", fa: "پرداخت جزئی", en: "Partial", color: "text-amber-600" },
  { value: "waived", fa: "معاف", en: "Waived", color: "text-blue-500" },
];

// ─── Admin Guide Descriptions ──────────────────────────

const ADMIN_GUIDE: Record<string, { fa: string; en: string }> = {
  registrationInstrument: {
    fa: "سازی که کاربر برای یادگیری آن ثبت‌نام کرده است. این با ساز اصلی تفاوت دارد - ساز اصلی سازی است که قبلاً می‌نوازد.",
    en: "The instrument the user is registering to learn. This differs from primary instrument - which is what they already play.",
  },
  primaryInstrument: {
    fa: "سازی که کاربر قبلاً می‌نوازد یا بیشترین تجربه را با آن دارد. ممکن است با ساز ثبت‌نام متفاوت باشد.",
    en: "The instrument the user already plays or has the most experience with. May differ from registration instrument.",
  },
  secondaryInstruments: {
    fa: "سازهای دیگری که کاربر تجربه نواختن دارد. اگر ندارد، گزینه «ندارد» را انتخاب کنید.",
    en: "Other instruments the user has experience playing. Select 'None' if they don't have any.",
  },
  learningGoals: {
    fa: "این فیلد مشخص می‌کند کاربر با چه انگیزه‌ای موسیقی یاد می‌گیرد. این اطلاعات برای تحلیل هوش مصنوعی و پیشنهاد دوره‌های مناسب استفاده می‌شود.",
    en: "This field identifies the user's motivation for learning music. Used by AI analysis to recommend suitable courses.",
  },
  instructorName: {
    fa: "نام استاد قبلی یا فعلی کاربر. اگر کاربر نام استاد را نمی‌داند، گزینه «نامشخص» را فعال کنید تا ادمین بعداً تکمیل کند.",
    en: "Name of the user's current or previous instructor. If unknown, toggle 'Unknown' so admin can fill in later.",
  },
  skillLevel: {
    fa: "سطح مهارت فعلی کاربر. این فیلد برای تطبیق سطح کلاس‌ها و تمرین‌ها استفاده می‌شود.",
    en: "The user's current skill level. Used to match appropriate class levels and exercises.",
  },
  leadScore: {
    fa: "امتیازی که سیستم هوش مصنوعی بر اساس احتمال تبدیل شدن به مشتری وفادار محاسبه می‌کند (۰ تا ۱۰۰)",
    en: "Score calculated by AI based on the probability of becoming a loyal customer (0 to 100)",
  },
  phone: {
    fa: "شماره موبایل خود هنرجو - فرمت ۰۹xxxxxxxx. این شماره اصلی تماس در ایران است.",
    en: "Student's own mobile number - format 09xxxxxxxx. This is the primary contact in Iran.",
  },
  preferredBranch: {
    fa: "شعبه‌ای که کاربر ترجیح می‌دهد در آن کلاس شرکت کند. برای زمان‌بندی هوشمند و تحلیل جغرافیایی استفاده می‌شود.",
    en: "Branch the user prefers to attend classes at. Used for smart scheduling and geographic analysis.",
  },
  registrationMethod: {
    fa: "روش ثبت‌نام - آنلاین: خود هنرجو فرم را پر می‌کند. تلفنی: ادمین از طریق تماس تلفنی ثبت‌نام می‌کند. حضوری: هنرجو حضوری مراجعه کرده و ادمین ثبت‌نام را انجام می‌دهد.",
    en: "Registration method - Online: student fills the form. Phone: admin registers via phone call. In-Person: student visits and admin registers.",
  },
  tuitionAmount: {
    fa: "مبلغ شهریه دوره به تومان. این مبلغ توسط ادمین تعیین و پیگیری می‌شود. تا زمان تغییر توسط ادمین، وضعیت پرداخت «پرداخت‌نشده» باقی می‌ماند.",
    en: "Tuition amount in Toman. This amount is set and tracked by admin. Until admin changes it, payment status remains 'unpaid'.",
  },
  paymentStatus: {
    fa: "وضعیت پرداخت شهریه. در ثبت‌نام آنلاین، وضعیت پیش‌فرض «پرداخت‌نشده» است و ادمین پس از تماس و هماهنگی با هنرجو، آن را به «پرداخت‌شده» تغییر می‌دهد.",
    en: "Tuition payment status. For online registrations, default is 'unpaid'. Admin will change it to 'paid' after contacting the student.",
  },
  paymentDueDate: {
    fa: "مهلت پرداخت شهریه. اگر هنرجو نقدی پرداخت نکرده، این فیلد برای پیگیری استفاده می‌شود.",
    en: "Payment due date. If the student hasn't paid in full, this field is used for follow-up.",
  },
  paymentRef: {
    fa: "شماره رسید یا مرجع پرداخت. در صورت پرداخت نقدی یا کارت‌به‌کارت، شماره رسید را وارد کنید.",
    en: "Payment receipt or reference number. For cash or card transfers, enter the receipt number.",
  },
  courseId: {
    fa: "دوره‌ای که هنرجو در آن ثبت‌نام می‌شود. اگر همزمان با ثبت‌نام، enrolment ایجاد شود، این فیلد را انتخاب کنید.",
    en: "The course the student is enrolling in. Select this to create an enrollment simultaneously with registration.",
  },
  educationLevel: {
    fa: "پایه تحصیلی کنونی هنرجو. اگر هنرجو دانش‌آموز است (پیش‌دبستان تا متوسطه)، پایه تحصیلی فعلی را ثبت کنید. اگر فارغ‌التحصیل است، آخرین مدرک تحصیلی را انتخاب کنید. این فیلد برای تحلیل هوش مصنوعی و تطبیق سطح کلاس‌ها حیاتی است و باید دقیق ثبت شود تا نویز در داده‌ها ایجاد نشود.",
    en: "Student's current educational level. If the student is currently studying (preschool to high school), select their current grade. If graduated, select their highest degree. This field is critical for AI analysis and class level matching, and must be accurately recorded to avoid data noise.",
  },
  tags: {
    fa: "تگ‌های دسته‌بندی برای تحلیل هوش مصنوعی. با کاما جدا کنید. مثال: VIP, فعال, اولویت‌بالا",
    en: "Categorization tags for AI analysis. Comma-separated. Example: VIP, active, high-priority",
  },
};

// ─── Helpers ───────────────────────────────────────────

function isMinor(dateOfBirth: string): boolean {
  if (!dateOfBirth) return false;
  try {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age < 18;
  } catch {
    return false;
  }
}

/** Fuzzy match: checks if search string is contained in either Farsi or English label */
function fuzzyMatchInstrument(search: string, item: { fa: string; en: string; value: string }): boolean {
  const s = search.toLowerCase().trim();
  if (!s) return true;
  return (
    item.fa.includes(s) ||
    item.en.toLowerCase().includes(s) ||
    item.value.toLowerCase().includes(s)
  );
}

// ═══════════════════════════════════════════════════════
// SmartCombobox - Reusable autocomplete with suggestions
// ═══════════════════════════════════════════════════════

interface SmartComboboxProps {
  options: { value: string; fa: string; en: string; icon?: React.ElementType }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isRTL: boolean;
  allowFreeText?: boolean;
  noneOption?: boolean;
  noneLabelFa?: string;
  noneLabelEn?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

function SmartCombobox({
  options,
  value,
  onChange,
  placeholder,
  isRTL,
  allowFreeText = true,
  noneOption = false,
  noneLabelFa = "ندارد",
  noneLabelEn = "None",
  required = false,
  error,
  disabled = false,
}: SmartComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Find the display label for current value
  const selectedOption = options.find((o) => o.value === value);
  const isNoneValue = value === "none";
  const displayLabel = isNoneValue
    ? (isRTL ? noneLabelFa : noneLabelEn)
    : selectedOption
      ? (isRTL ? selectedOption.fa : selectedOption.en)
      : value; // free text value

  const filteredOptions = useMemo(() => {
    const filtered = options.filter((o) => fuzzyMatchInstrument(search, o));
    return filtered;
  }, [options, search]);

  const handleSelect = useCallback(
    (selectedValue: string) => {
      onChange(selectedValue === value ? "" : selectedValue);
      setOpen(false);
      setSearch("");
    },
    [value, onChange]
  );

  const handleFreeTextSubmit = useCallback(() => {
    if (search.trim() && allowFreeText && !options.find((o) => o.value === search.trim())) {
      onChange(search.trim());
      setOpen(false);
      setSearch("");
    }
  }, [search, allowFreeText, options, onChange]);

  return (
    <div className="space-y-1.5">
      <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between rounded-xl h-11 font-normal",
              isRTL ? "pr-3 pl-3" : "pl-3 pr-3",
              error && "border-destructive",
              !value && "text-muted-foreground"
            )}
          >
            <span className={cn("truncate", value ? "text-foreground" : "text-muted-foreground")}>
              {value ? displayLabel : (placeholder || (isRTL ? "انتخاب کنید..." : "Select..."))}
            </span>
            <ChevronsUpDown className={cn("w-4 h-4 shrink-0 opacity-50", isRTL ? "ml-1" : "mr-1")} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" sideOffset={4}>
          <Command shouldFilter={false}>
            <CommandInput
              value={search}
              onValueChange={setSearch}
              placeholder={isRTL ? "جستجو یا تایپ کنید..." : "Search or type..."}
              dir={isRTL ? "rtl" : "ltr"}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleFreeTextSubmit();
                }
              }}
            />
            <CommandList>
              <CommandEmpty>
                {allowFreeText && search.trim() ? (
                  <button
                    type="button"
                    onClick={handleFreeTextSubmit}
                    className="w-full px-2 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-sm flex items-center gap-2"
                  >
                    <Plus className="w-3 h-3" />
                    {isRTL ? `افزودن «${search.trim()}»` : `Add "${search.trim()}"`}
                  </button>
                ) : (
                  <span className="py-4 block text-center text-sm text-muted-foreground">
                    {isRTL ? "نتیجه‌ای یافت نشد" : "No results found"}
                  </span>
                )}
              </CommandEmpty>
              <CommandGroup>
                {noneOption && (
                  <CommandItem
                    value="none"
                    onSelect={() => handleSelect("none")}
                    className={cn("gap-2", isNoneValue && "bg-primary/10")}
                  >
                    <Ban className="w-4 h-4 text-muted-foreground" />
                    <span>{isRTL ? noneLabelFa : noneLabelEn}</span>
                    {isNoneValue && <Check className={cn("w-4 h-4 text-primary", isRTL ? "mr-auto" : "ml-auto")} />}
                  </CommandItem>
                )}
                {filteredOptions.map((option) => {
                  const Icon = option.icon || Music2;
                  const isSelected = value === option.value;
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => handleSelect(option.value)}
                      className={cn("gap-2", isSelected && "bg-primary/10")}
                    >
                      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="flex-1 truncate">
                        {isRTL ? option.fa : option.en}
                      </span>
                      <span className="text-xs text-muted-foreground">{option.en}</span>
                      {isSelected && <Check className={cn("w-4 h-4 text-primary shrink-0", isRTL ? "mr-auto" : "ml-auto")} />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
          {error}
        </p>
      )}
    </div>
  );
}

// Small plus icon for free-text
function Plus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════
// CourseSelect - Fetch and select a course for enrollment
// ═══════════════════════════════════════════════════════

interface CourseOption {
  id: string;
  titleFa: string;
  titleEn: string;
}

function CourseSelect({ value, onChange, isRTL }: { value: string; onChange: (val: string) => void; isRTL: boolean }) {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = useCallback(() => {
    fetch("/api/courses?published=true&limit=100")
      .then((res) => res.ok ? res.json() : { courses: [] })
      .then((data) => {
        const list = data.courses || data || [];
        setCourses(Array.isArray(list) ? list.map((c: Record<string, unknown>) => ({
          id: c.id as string,
          titleFa: (c.titleFa as string) || "",
          titleEn: (c.titleEn as string) || "",
        })) : []);
      })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="rounded-xl h-11">
        <SelectValue placeholder={loading ? (isRTL ? "در حال بارگذاری..." : "Loading...") : (isRTL ? "انتخاب دوره..." : "Select course...")} />
      </SelectTrigger>
      <SelectContent>
        {courses.length > 0 && (
          <SelectItem value="none">{isRTL ? "بدون دوره" : "No course"}</SelectItem>
        )}
        {courses.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {isRTL ? c.titleFa : c.titleEn}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ═══════════════════════════════════════════════════════
// AdminGuideTooltip - Help icon for admin mode
// ═══════════════════════════════════════════════════════

interface AdminGuideTooltipProps {
  fieldKey: string;
  isRTL: boolean;
}

function AdminGuideTooltip({ fieldKey, isRTL }: AdminGuideTooltipProps) {
  const guide = ADMIN_GUIDE[fieldKey];
  if (!guide) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-4 h-4 inline-flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align={isRTL ? "end" : "start"}
        className="w-72 text-xs leading-relaxed"
      >
        <div className="flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p>{isRTL ? guide.fa : guide.en}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ═══════════════════════════════════════════════════════
// LabelWithGuide - Label component with optional admin guide
// ═══════════════════════════════════════════════════════

interface LabelWithGuideProps {
  isRTL: boolean;
  isAdminMode?: boolean;
  fieldKey?: string;
  required?: boolean;
  children: React.ReactNode;
}

function LabelWithGuide({ isRTL, isAdminMode, fieldKey, required, children }: LabelWithGuideProps) {
  return (
    <div className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse")}>
      <Label className="text-sm font-medium">
        {children}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {isAdminMode && fieldKey && <AdminGuideTooltip fieldKey={fieldKey} isRTL={isRTL} />}
    </div>
  );
}

// ─── Component ─────────────────────────────────────────

export function RegistrationForm({
  isOpen,
  onClose,
  defaultRole = "student",
  isAdminMode = false,
}: RegistrationFormProps) {
  const { isRTL } = useI18n();
  const { setUser } = useAuthStore();

  const [currentStep, setCurrentStep] = useState<StepId>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<FormData>({
    role: defaultRole,
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    registrationMethod: isAdminMode ? "in_person" : "online",
    dateOfBirth: "",
    gender: "",
    nationalId: "",
    educationLevel: "",
    fieldOfStudy: "",
    registrationInstrument: "",
    primaryInstrument: "",
    secondaryInstruments: [],
    musicExperienceYears: "",
    previousTraining: "",
    musicGenres: [],
    learningGoals: [],
    practiceHoursPerWeek: "",
    skillLevel: "",
    instructorName: "",
    instructorNameKnown: true,
    courseId: "",
    tuitionAmount: "",
    paymentStatus: "unpaid",
    paymentDueDate: "",
    paymentRef: "",
    tags: "",
    address: "",
    city: "",
    province: "",
    emergencyContact: "",
    preferredBranch: "",
    parentName: "",
    parentPhone: "",
    parentRelation: "",
    specialtyFa: "",
    specialtyEn: "",
    bioFa: "",
    bioEn: "",
    experience: "",
    instagramLink: "",
    telegramLink: "",
    youtubeLink: "",
    soundcloudLink: "",
    isPublishedInstructor: false,
    instructorOrder: "0",
    teachingInstruments: [],
    certifications: "",
    hourlyRate: "",
    availableDays: [],
    hireDate: "",
    contractType: "",
    referralSource: "",
    referralDetail: "",
  });

  const showMinorFields = useMemo(() => isMinor(form.dateOfBirth), [form.dateOfBirth]);

  const updateField = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  }, []);

  const toggleArrayItem = useCallback((field: "secondaryInstruments" | "musicGenres" | "learningGoals" | "teachingInstruments" | "availableDays", value: string) => {
    setForm((prev) => {
      const arr = prev[field] as string[];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...prev, [field]: next };
    });
  }, []);

  // ─── Validation ──────────────────────────────────────

  const validateStep = useCallback(
    (step: StepId): boolean => {
      const newErrors: Record<string, string> = {};

      if (step === 1) {
        // Admin mode: registrationMethod is required — only for students
        if (isAdminMode && form.role === "student" && !form.registrationMethod) {
          newErrors.registrationMethod = isRTL ? "روش ثبت‌نام الزامی است" : "Registration method is required";
        }
        if (!form.name.trim()) newErrors.name = isRTL ? "نام الزامی است" : "Name is required";
        if (!form.phone.trim()) newErrors.phone = isRTL ? "شماره موبایل الزامی است" : "Phone is required";
        else if (!/^09\d{9}$/.test(form.phone.trim()))
          newErrors.phone = isRTL ? "شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود" : "Phone must be 11 digits starting with 09";

        // National ID is required in both modes
        if (!form.nationalId.trim()) newErrors.nationalId = isRTL ? "کد ملی الزامی است" : "National ID is required";
        else if (!/^\d{10}$/.test(form.nationalId.trim()))
          newErrors.nationalId = isRTL ? "کد ملی باید ۱۰ رقم باشد" : "National ID must be 10 digits";

        // Email is optional in both modes, validate format if provided
        if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
          newErrors.email = isRTL ? "ایمیل نامعتبر است" : "Invalid email";

        if (isAdminMode) {
          // Password is optional in admin mode (default = nationalId)
          // Only validate if the admin provides a custom password
          if (form.password) {
            if (form.password.length < 6)
              newErrors.password = isRTL ? "رمز عبور باید حداقل ۶ کاراکتر باشد" : "Password must be at least 6 characters";
            if (form.password !== form.confirmPassword)
              newErrors.confirmPassword = isRTL ? "رمز عبور و تکرار آن مطابقت ندارند" : "Passwords do not match";
          }
        }
      }

      if (step === 3) {
        if (!form.registrationInstrument && form.role === "student") {
          newErrors.registrationInstrument = isRTL ? "ساز ثبت‌نام الزامی است" : "Registration instrument is required";
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [form, isRTL, isAdminMode]
  );

  // ─── Navigation ──────────────────────────────────────

  const canGoNext = useMemo(() => {
    return validateStep(currentStep);
  }, [currentStep, validateStep]);

  const getNextStep = useCallback((): StepId | null => {
    if (currentStep === 4 && form.role === "instructor") {
      return 5; // Always go to instructor step 5
    }
    if (currentStep === 4 && form.role === "student" && !showMinorFields) {
      return 6;
    }
    if (currentStep === 5) return 6;
    if (currentStep === 6) return null;
    return (currentStep + 1) as StepId;
  }, [currentStep, form.role, showMinorFields]);

  const getPrevStep = useCallback((): StepId | null => {
    if (currentStep === 6 && form.role === "instructor") {
      return 5; // Always go back to instructor step 5
    }
    if (currentStep === 6 && form.role === "student" && !showMinorFields) {
      return 4;
    }
    if (currentStep === 1) return null;
    return (currentStep - 1) as StepId;
  }, [currentStep, form.role, showMinorFields]);

  // ─── Submit ──────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!validateStep(currentStep)) return;
    setIsSubmitting(true);

    try {
      // ─── Shared payload builder ───────────────────────
      const buildCommonPayload = (): Record<string, unknown> => {
        const payload: Record<string, unknown> = {
          name: form.name,
          phone: form.phone.trim(),
          role: form.role,
        };

        // Email - optional in online mode, required in admin mode
        if (form.email.trim()) payload.email = form.email.trim().toLowerCase();

        // Step 2
        if (form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth;
        if (form.gender) payload.gender = form.gender;
        if (form.nationalId) payload.nationalId = form.nationalId;
        if (form.educationLevel) payload.educationLevel = form.educationLevel;
        if (form.fieldOfStudy) payload.fieldOfStudy = form.fieldOfStudy;

        // Step 3
        if (form.registrationInstrument) payload.registrationInstrument = form.registrationInstrument;
        if (form.primaryInstrument) payload.primaryInstrument = form.primaryInstrument;
        if (form.secondaryInstruments.length > 0) payload.secondaryInstruments = JSON.stringify(form.secondaryInstruments);
        if (form.musicExperienceYears) payload.musicExperienceYears = parseInt(form.musicExperienceYears, 10);
        if (form.previousTraining) payload.previousTraining = form.previousTraining;
        if (form.musicGenres.length > 0) payload.musicGenres = JSON.stringify(form.musicGenres);
        if (form.learningGoals.length > 0) payload.learningGoals = JSON.stringify(form.learningGoals);
        if (form.practiceHoursPerWeek) payload.practiceHoursPerWeek = parseInt(form.practiceHoursPerWeek, 10);
        if (form.skillLevel) payload.skillLevel = form.skillLevel;
        payload.instructorName = form.instructorNameKnown ? (form.instructorName || null) : null;
        payload.instructorNameKnown = form.instructorNameKnown;

        // Step 4
        if (form.address) payload.address = form.address;
        if (form.city) payload.city = form.city;
        if (form.province) payload.province = form.province;
        if (form.emergencyContact) payload.emergencyContact = form.emergencyContact;
        if (form.preferredBranch) payload.preferredBranch = form.preferredBranch;

        // Step 5 - Minor
        if (showMinorFields) {
          if (form.parentName) payload.parentName = form.parentName;
          if (form.parentPhone) payload.parentPhone = form.parentPhone;
          if (form.parentRelation) payload.parentRelation = form.parentRelation;
        }

        // Step 5 - Instructor
        if (form.role === "instructor") {
          if (form.specialtyFa) payload.specialtyFa = form.specialtyFa;
          if (form.specialtyEn) payload.specialtyEn = form.specialtyEn;
          if (form.bioFa) payload.bioFa = form.bioFa;
          if (form.bioEn) payload.bioEn = form.bioEn;
          if (form.experience) payload.experience = form.experience;
          payload.isPublishedInstructor = form.isPublishedInstructor;
          if (form.instructorOrder) payload.instructorOrder = parseInt(form.instructorOrder, 10) || 0;

          const socialLinks: Record<string, string> = {};
          if (form.instagramLink) socialLinks.instagram = form.instagramLink;
          if (form.telegramLink) socialLinks.telegram = form.telegramLink;
          if (form.youtubeLink) socialLinks.youtube = form.youtubeLink;
          if (form.soundcloudLink) socialLinks.soundcloud = form.soundcloudLink;
          if (Object.keys(socialLinks).length > 0) payload.socialLinks = JSON.stringify(socialLinks);

          // Instructor Extended Profile fields
          if (form.teachingInstruments.length > 0) payload.teachingInstruments = JSON.stringify(form.teachingInstruments);
          if (form.certifications) payload.certifications = JSON.stringify(form.certifications.split('\n').filter(Boolean));
          if (form.hourlyRate) payload.hourlyRate = parseInt(form.hourlyRate, 10);
          if (form.availableDays.length > 0) payload.availableDays = JSON.stringify(form.availableDays);
          if (form.hireDate) payload.hireDate = form.hireDate;
          if (form.contractType) payload.contractType = form.contractType;
        }

        // Step 6
        if (form.referralSource) payload.referralSource = form.referralSource;
        if (form.referralDetail) payload.referralDetail = form.referralDetail;

        return payload;
      };

      if (isAdminMode) {
        // ─── Admin mode: submit to /api/admin/students (admin-only with audit logging) ──
        const payload = buildCommonPayload();
        // Auto-generate email if not provided
        payload.email = form.email.trim() ? form.email.trim().toLowerCase() : `${form.phone.trim()}@mab.local`;
        // Default password = nationalId if not provided
        const password = form.password || form.nationalId;
        payload.password = password;
        payload.registrationMethod = form.registrationMethod;

        // Course enrollment (admin mode)
        if (form.courseId && form.courseId !== "none") payload.courseId = form.courseId;

        // Tuition & Payment (admin mode)
        if (form.tuitionAmount) payload.tuitionAmount = parseInt(form.tuitionAmount, 10);
        if (form.paymentStatus) payload.paymentStatus = form.paymentStatus;
        if (form.paymentDueDate) payload.paymentDueDate = form.paymentDueDate;
        if (form.paymentRef) payload.paymentRef = form.paymentRef;
        if (form.paymentStatus === "paid") {
          payload.paidAt = new Date().toISOString();
        }

        // Admin tags for categorization
        if (form.tags) {
          const tagList = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
          if (tagList.length > 0) payload.tags = JSON.stringify(tagList);
        }

        const res = await authFetch("/api/admin/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || (isRTL ? "خطا در ثبت‌نام" : "Registration failed"));
        }

        // Admin stays logged in as admin - do NOT call setUser
        setIsSuccess(true);
        toast.success(isRTL ? "ثبت‌نام با موفقیت انجام شد!" : "Registration successful!");
      } else {
        // ─── Online mode: submit to /api/registration/pending ──
        const payload = buildCommonPayload();
        // nationalId is required for online registration
        payload.nationalId = form.nationalId.trim();
        payload.registrationMethod = "online";
        payload.paymentStatus = "unpaid";
        // No password - user doesn't choose their own; it will be their nationalId
        // Email is optional - will be auto-generated if not provided

        const res = await fetch("/api/registration/pending", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || (isRTL ? "خطا در ثبت‌نام" : "Registration failed"));
        }

        // Don't auto-login for online mode - just show success
        setIsSuccess(true);
        toast.success(isRTL ? "ثبت‌نام شما دریافت شد!" : "Your registration has been received!");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : isRTL ? "خطا در ثبت‌نام" : "Registration failed";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [currentStep, form, isRTL, validateStep, showMinorFields, isAdminMode]);

  const handleClose = useCallback(() => {
    if (isSuccess) {
      setIsSuccess(false);
      setCurrentStep(1);
      setErrors({});
      onClose();
      return;
    }
    onClose();
  }, [isSuccess, onClose]);

  // ─── Progress ────────────────────────────────────────

  const totalSteps = useMemo(() => {
    if (form.role === "student" && !showMinorFields) return 5;
    return 6;
  }, [form.role, showMinorFields]);

  const progressPercent = useMemo(() => {
    const actual = STEPS.findIndex((s) => s.id === currentStep) + 1;
    return Math.round((actual / totalSteps) * 100);
  }, [currentStep, totalSteps]);

  // ─── Slide direction for animation ───────────────────

  const [slideDir, setSlideDir] = useState<"left" | "right">("left");

  const goToStep = useCallback(
    (step: StepId) => {
      setSlideDir(step > currentStep ? "left" : "right");
      setCurrentStep(step);
    },
    [currentStep]
  );

  const handleNextAnim = useCallback(() => {
    if (!validateStep(currentStep)) return;
    const next = getNextStep();
    if (next) {
      setSlideDir("left");
      setCurrentStep(next);
    }
  }, [currentStep, getNextStep, validateStep]);

  const handlePrevAnim = useCallback(() => {
    const prev = getPrevStep();
    if (prev) {
      setSlideDir("right");
      setCurrentStep(prev);
    }
  }, [getPrevStep]);

  // ─── Render helpers ──────────────────────────────────

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1Account
            form={form}
            updateField={updateField}
            errors={errors}
            isRTL={isRTL}
            isAdminMode={isAdminMode}
            showPassword={showPassword}
            showConfirmPassword={showConfirmPassword}
            setShowPassword={setShowPassword}
            setShowConfirmPassword={setShowConfirmPassword}
          />
        );
      case 2:
        return <Step2Personal form={form} updateField={updateField} errors={errors} isRTL={isRTL} isAdminMode={isAdminMode} />;
      case 3:
        return (
          <Step3Music
            form={form}
            updateField={updateField}
            toggleArrayItem={toggleArrayItem}
            errors={errors}
            isRTL={isRTL}
            isAdminMode={isAdminMode}
          />
        );
      case 4:
        return <Step4Location form={form} updateField={updateField} errors={errors} isRTL={isRTL} isAdminMode={isAdminMode} />;
      case 5:
        return <Step5Additional form={form} updateField={updateField} errors={errors} isRTL={isRTL} showMinorFields={showMinorFields} />;
      case 6:
        return <Step6Referral form={form} updateField={updateField} isRTL={isRTL} isAdminMode={isAdminMode} />;
      default:
        return null;
    }
  };

  // ─── Success screen ──────────────────────────────────

  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="sr-only">
              {isAdminMode
                ? (isRTL ? "ثبت‌نام موفق!" : "Registration Successful!")
                : (isRTL ? "ثبت‌نام شما دریافت شد!" : "Your registration has been received!")}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6"
            >
              <Check className="w-10 h-10 text-emerald-600" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {isAdminMode ? (
                <>
                  <h2 className="text-2xl font-bold mb-2">
                    {isRTL ? "ثبت‌نام موفق!" : "Registration Successful!"}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {isRTL
                      ? `${form.name} با موفقیت در سیستم ثبت شد.`
                      : `${form.name} has been successfully registered in the system.`}
                  </p>
                  <div className="space-y-2 mb-4 max-w-sm">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <Phone className="w-5 h-5 text-blue-600 shrink-0" />
                      <div className="text-right flex-1">
                        <span className="text-xs text-blue-700 dark:text-blue-400 block">
                          {isRTL ? "نام کاربری:" : "Username:"}
                        </span>
                        <span className="text-sm font-bold text-blue-800 dark:text-blue-300" dir="ltr">
                          {form.phone}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <Lock className="w-5 h-5 text-amber-600 shrink-0" />
                      <div className="text-right flex-1">
                        <span className="text-xs text-amber-700 dark:text-amber-400 block">
                          {isRTL ? "رمز عبور:" : "Password:"}
                        </span>
                        <span className="text-sm font-bold text-amber-800 dark:text-amber-300" dir="ltr">
                          {form.password ? "••••••" : (isRTL ? "کد ملی هنرجو" : "Student's National ID")}
                        </span>
                      </div>
                    </div>
                    {form.registrationMethod && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                        {form.registrationMethod === "in_person" ? <UserCheck className="w-5 h-5 text-emerald-600 shrink-0" /> : form.registrationMethod === "phone" ? <PhoneCall className="w-5 h-5 text-emerald-600 shrink-0" /> : <Monitor className="w-5 h-5 text-emerald-600 shrink-0" />}
                        <span className="text-xs text-emerald-700 dark:text-emerald-400">
                          {isRTL
                            ? `روش ثبت‌نام: ${form.registrationMethod === "in_person" ? "حضوری" : form.registrationMethod === "phone" ? "تلفنی" : "آنلاین"}`
                            : `Method: ${form.registrationMethod === "in_person" ? "In-Person" : form.registrationMethod === "phone" ? "Phone" : "Online"}`}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-2">
                    {isRTL ? "ثبت‌نام شما دریافت شد!" : "Your registration has been received!"}
                  </h2>
                  <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                    {isRTL
                      ? "اطلاعات شما با موفقیت ثبت شد. پس از بررسی توسط مدیران موسسه، حساب کاربری شما فعال خواهد شد."
                      : "Your information has been successfully submitted. After review by our administrators, your account will be activated."}
                  </p>
                  <div className="space-y-2 mb-4 max-w-sm">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <Phone className="w-5 h-5 text-blue-600 shrink-0" />
                      <div className="text-right flex-1">
                        <span className="text-xs text-blue-700 dark:text-blue-400 block">
                          {isRTL ? "نام کاربری:" : "Username:"}
                        </span>
                        <span className="text-sm font-bold text-blue-800 dark:text-blue-300" dir="ltr">
                          {form.phone}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <Shield className="w-5 h-5 text-amber-600 shrink-0" />
                      <div className="text-right flex-1">
                        <span className="text-xs text-amber-700 dark:text-amber-400 block">
                          {isRTL ? "رمز عبور پیش‌فرض:" : "Default password:"}
                        </span>
                        <span className="text-sm font-bold text-amber-800 dark:text-amber-300" dir="ltr">
                          {isRTL ? "کد ملی شما" : "Your National ID"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                      <Phone className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span className="text-xs text-emerald-700 dark:text-emerald-400">
                        {isRTL
                          ? "از طریق پیامک یا تماس تلفنی از وضعیت ثبت‌نام مطلع خواهید شد."
                          : "You will be notified about your registration status via SMS or phone call."}
                      </span>
                    </div>
                  </div>
                </>
              )}
              <Button
                onClick={handleClose}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-11 px-8 shadow-lg shadow-primary/25"
              >
                {isAdminMode
                  ? (isRTL ? "شروع کنید" : "Get Started")
                  : (isRTL ? "بستن" : "Close")}
                {isAdminMode && <Sparkles className={cn("w-4 h-4", isRTL ? "mr-2" : "ml-2")} />}
              </Button>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-4xl w-[95vw] max-h-[92vh] p-0 overflow-hidden bg-background/98 backdrop-blur-2xl border-border/50"
      >
        {/* ─── Header ────────────────────────────── */}
        <div className="relative px-6 pt-5 pb-4 bg-gradient-to-br from-primary/8 via-amber-500/5 to-primary/5 border-b border-border/40">
          {/* Decorative notes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            <div className="absolute top-3 right-10 text-primary/8 text-3xl">♪</div>
            <div className="absolute bottom-1 left-16 text-amber-500/8 text-2xl">♫</div>
            <div className="absolute top-1 left-6 text-primary/5 text-4xl">𝄞</div>
          </div>

          <div className="relative flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold leading-tight">
                  {isRTL ? "ثبت‌نام در مهر آوای بلوط" : "Register at Mehr Avaye Balout"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {isAdminMode
                    ? (isRTL ? "فرم ثبت‌نام ادمین" : "Admin Registration Form")
                    : (isRTL ? "فرم ثبت‌نام جامع" : "Comprehensive Registration Form")}
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-lg hover:bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {isRTL ? `مرحله ${currentStep} از ${totalSteps}` : `Step ${currentStep} of ${totalSteps}`}
              </span>
              <span>{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-1.5 bg-primary/10" />
          </div>
        </div>

        {/* ─── Step Indicators ───────────────────── */}
        <div className="px-6 py-3 border-b border-border/30">
          <div className={cn("flex items-center gap-1 overflow-x-auto pb-1", isRTL && "flex-row-reverse")}>
            {STEPS.map((step) => {
              if (step.id === 5 && form.role === "student" && !showMinorFields) return null;
              // Always show step 5 for instructors (instructor professional profile)
              const isActive = step.id === currentStep;
              const isPast = step.id < currentStep;

              return (
                <button
                  key={step.id}
                  onClick={() => isPast && goToStep(step.id)}
                  disabled={!isPast}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                    isActive && "bg-primary/10 text-primary",
                    isPast && "bg-primary/5 text-primary/70 hover:bg-primary/10 cursor-pointer",
                    !isActive && !isPast && "text-muted-foreground/60"
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                      isActive && "bg-primary text-primary-foreground",
                      isPast && "bg-primary/20 text-primary",
                      !isActive && !isPast && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isPast ? <Check className="w-3 h-3" /> : step.id}
                  </div>
                  <span className="hidden sm:inline">{isRTL ? step.titleFa : step.titleEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Step Title ────────────────────────── */}
        <div className="px-6 pt-4 pb-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-2">
                {React.createElement(STEPS[currentStep - 1].icon, {
                  className: "w-5 h-5 text-primary",
                })}
                <h3 className="text-base font-semibold">
                  {currentStep === 5 && form.role === "instructor"
                    ? (isRTL ? "پروفایل حرفه‌ای استاد" : "Instructor Professional Profile")
                    : (isRTL ? STEPS[currentStep - 1].titleFa : STEPS[currentStep - 1].titleEn)}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 ml-7">
                {currentStep === 5 && form.role === "instructor"
                  ? (isRTL ? "تخصص، بیوگرافی، سوابق و شبکه‌های اجتماعی" : "Specialty, bio, experience and social links")
                  : (isRTL ? STEPS[currentStep - 1].descFa : STEPS[currentStep - 1].descEn)}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ─── Step Content ──────────────────────── */}
        <ScrollArea className="max-h-[min(70vh,700px)] px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: slideDir === "left" ? (isRTL ? -30 : 30) : isRTL ? 30 : -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: slideDir === "left" ? (isRTL ? 30 : -30) : isRTL ? -30 : 30 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="pb-4"
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </ScrollArea>

        {/* ─── Footer ────────────────────────────── */}
        <div className="px-6 py-4 border-t border-border/40 bg-muted/20">
          <div className={cn("flex items-center justify-between gap-3", isRTL && "flex-row-reverse")}>
            <Button
              variant="ghost"
              onClick={handlePrevAnim}
              disabled={currentStep === 1}
              className={cn("gap-1", isRTL && "flex-row-reverse")}
            >
              {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {isRTL ? "قبلی" : "Previous"}
            </Button>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    i + 1 === currentStep
                      ? "w-4 bg-primary"
                      : i + 1 < currentStep
                        ? "bg-primary/40"
                        : "bg-muted"
                  )}
                />
              ))}
            </div>

            {currentStep === totalSteps ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !canGoNext}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-lg shadow-primary/20 min-w-[100px]"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isRTL ? "ثبت‌نام" : "Register"}
              </Button>
            ) : (
              <Button
                onClick={handleNextAnim}
                disabled={!canGoNext}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-lg shadow-primary/20 min-w-[100px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRTL ? "بعدی" : "Next"}
                {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════
// STEP 1 – Account Basics
// ═══════════════════════════════════════════════════════

interface StepProps {
  form: FormData;
  updateField: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
  errors: Record<string, string>;
  isRTL: boolean;
  isAdminMode?: boolean;
}

interface Step1Props extends StepProps {
  showPassword: boolean;
  showConfirmPassword: boolean;
  setShowPassword: (v: boolean) => void;
  setShowConfirmPassword: (v: boolean) => void;
}

function Step1Account({
  form,
  updateField,
  errors,
  isRTL,
  isAdminMode,
  showPassword,
  showConfirmPassword,
  setShowPassword,
  setShowConfirmPassword,
}: Step1Props) {
  return (
    <div className="space-y-5">
      {/* Admin Mode Banner & Registration Method — only for students */}
      {isAdminMode && form.role === "student" && (
        <div className="space-y-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-300 dark:border-amber-700">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
              {isRTL ? "حالت ادمین - ثبت‌نام از طرف هنرجو" : "Admin Mode - Registering on behalf of student"}
            </span>
          </div>
          <div className="space-y-1.5">
            <LabelWithGuide isRTL={isRTL} isAdminMode={isAdminMode} fieldKey="registrationMethod" required>
              {isRTL ? "روش ثبت‌نام" : "Registration Method"}
            </LabelWithGuide>
            <div className="grid grid-cols-3 gap-2">
              {REGISTRATION_METHODS.map((method) => {
                const isSelected = form.registrationMethod === method.value;
                const MethodIcon = method.icon;
                return (
                  <Card
                    key={method.value}
                    className={cn(
                      "cursor-pointer transition-all duration-200 p-3 border-2 text-center",
                      isSelected
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-sm"
                        : "border-border/60 hover:border-amber-300"
                    )}
                    onClick={() => updateField("registrationMethod", method.value as "online" | "phone" | "in_person")}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1.5",
                      isSelected ? "bg-amber-500/15 text-amber-600" : "bg-muted text-muted-foreground"
                    )}>
                      <MethodIcon className="w-4 h-4" />
                    </div>
                    <span className={cn("text-xs font-semibold block", isSelected ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground")}>
                      {isRTL ? method.fa : method.en}
                    </span>
                  </Card>
                );
              })}
            </div>
            {form.registrationMethod && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                {(() => {
                  const m = REGISTRATION_METHODS.find((rm) => rm.value === form.registrationMethod);
                  return m ? (isRTL ? m.descFa : m.descEn) : "";
                })()}
              </p>
            )}
            {errors.registrationMethod && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                {errors.registrationMethod}
              </p>
            )}
          </div>
        </div>
      )}
      {/* Admin Mode Banner for Instructor */}
      {isAdminMode && form.role === "instructor" && (
        <div className="space-y-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-300 dark:border-emerald-700">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
              {isRTL ? "ثبت‌نام استاد جدید" : "New Instructor Registration"}
            </span>
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            {isRTL ? "اطلاعات تخصصی و حرفه‌ای استاد در مراحل بعدی ثبت می‌شود" : "Instructor-specific professional info will be collected in later steps"}
          </p>
        </div>
      )}

      {/* Role Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">{isRTL ? "نوع کاربری" : "User Type"} *</Label>
        <div className="grid grid-cols-2 gap-3">
          <Card
            className={cn(
              "cursor-pointer transition-all duration-200 p-4 border-2",
              form.role === "student"
                ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                : "border-border hover:border-primary/30 hover:bg-muted/30"
            )}
            onClick={() => updateField("role", "student")}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", form.role === "student" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className={cn("font-semibold text-sm", form.role === "student" ? "text-primary" : "text-foreground")}>
                {isRTL ? "دانشجو" : "Student"}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {isRTL ? "یادگیری موسیقی" : "Learn music"}
              </span>
            </div>
          </Card>
          <Card
            className={cn(
              "cursor-pointer transition-all duration-200 p-4 border-2",
              form.role === "instructor"
                ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                : "border-border hover:border-primary/30 hover:bg-muted/30"
            )}
            onClick={() => updateField("role", "instructor")}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", form.role === "instructor" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
                <BookOpen className="w-5 h-5" />
              </div>
              <span className={cn("font-semibold text-sm", form.role === "instructor" ? "text-primary" : "text-foreground")}>
                {isRTL ? "استاد" : "Instructor"}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {isRTL ? "تدریس موسیقی" : "Teach music"}
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <LabelWithGuide isRTL={isRTL} isAdminMode={isAdminMode} fieldKey="phone" required>
          {isRTL ? "نام و نام خانوادگی" : "Full Name"}
        </LabelWithGuide>
        <div className="relative">
          <User className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
          <Input
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            className={cn("rounded-xl h-11", isRTL ? "pr-10" : "pl-10")}
            placeholder={isRTL ? "نام کامل خود را وارد کنید" : "Enter your full name"}
            dir={isRTL ? "rtl" : "ltr"}
          />
        </div>
        {errors.name && <p className="text-xs text-destructive flex items-center gap-1"><span className="inline-block w-1 h-1 rounded-full bg-destructive" />{errors.name}</p>}
      </div>

      {/* National ID - In admin mode, shown in Step 1; in online mode also in Step 1 */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">
          {isRTL ? "کد ملی" : "National ID"} <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Shield className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
          <Input
            value={form.nationalId}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              updateField("nationalId", val.slice(0, 10));
            }}
            className={cn("rounded-xl h-11", isRTL ? "pr-10" : "pl-10")}
            placeholder={isRTL ? "کد ملی ۱۰ رقمی" : "10-digit National ID"}
            dir="ltr"
            maxLength={10}
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          {isAdminMode
            ? (isRTL ? "رمز عبور پیش‌فرض: کد ملی" : "Default password: national ID")
            : (isRTL ? "کد ملی ۱۰ رقمی خود را وارد کنید" : "Enter your 10-digit national ID")}
        </p>
        {errors.nationalId && <p className="text-xs text-destructive flex items-center gap-1"><span className="inline-block w-1 h-1 rounded-full bg-destructive" />{errors.nationalId}</p>}
      </div>

      {/* Email - Optional in both modes, auto-generated if empty */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">
          {isRTL ? "ایمیل" : "Email"} <span className="text-muted-foreground text-xs font-normal">({isRTL ? "اختیاری" : "Optional"})</span>
        </Label>
        <div className="relative">
          <Mail className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
          <Input
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            className={cn("rounded-xl h-11", isRTL ? "pr-10" : "pl-10")}
            placeholder={isRTL ? "email@example.com (خالی = خودکار از شماره موبایل)" : "email@example.com (empty = auto from phone)"}
            dir="ltr"
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          {isRTL ? "خالی باشد → {شماره موبایل}@mab.local" : "Empty → {phone}@mab.local"}
        </p>
        {errors.email && <p className="text-xs text-destructive flex items-center gap-1"><span className="inline-block w-1 h-1 rounded-full bg-destructive" />{errors.email}</p>}
      </div>



      {/* Credential note */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/15">
        <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <span className="text-xs text-primary/80 leading-relaxed">
          {isAdminMode
            ? (isRTL
              ? "نام کاربری: شماره موبایل | رمز عبور پیش‌فرض: کد ملی (اگر رمز دیگری وارد نکنید)"
              : "Username: phone number | Default password: national ID (if no custom password entered)")
            : (isRTL
              ? "نام کاربری شما شماره موبایل و رمز عبور پیش‌فرض کد ملی شما خواهد بود. پس از تأیید توسط مدیران موسسه، می‌توانید وارد حساب خود شوید."
              : "Your username will be your phone number and default password will be your national ID. After admin approval, you will be able to log in.")}
        </span>
      </div>

      {/* Phone - Prominent with Iranian format validation */}
      <div className="space-y-1.5">
        <LabelWithGuide isRTL={isRTL} isAdminMode={isAdminMode} fieldKey="phone" required>
          {isRTL ? "شماره موبایل" : "Mobile Number"}
        </LabelWithGuide>
        <div className="relative">
          <Phone className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
          <Input
            value={form.phone}
            onChange={(e) => {
              // Only allow digits
              const val = e.target.value.replace(/\D/g, "");
              updateField("phone", val.slice(0, 11));
            }}
            className={cn("rounded-xl h-11", isRTL ? "pr-10" : "pl-10")}
            placeholder="09121234567"
            dir="ltr"
            maxLength={11}
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          {isRTL ? "فرمت: ۰۹XXXXXXXXX (۱۱ رقم)" : "Format: 09XXXXXXXXX (11 digits)"}
        </p>
        {errors.phone && <p className="text-xs text-destructive flex items-center gap-1"><span className="inline-block w-1 h-1 rounded-full bg-destructive" />{errors.phone}</p>}
      </div>

      {/* Password + Confirm - Admin mode only, optional (default = national ID) */}
      {isAdminMode && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                {isRTL ? "رمز عبور" : "Password"} <span className="text-muted-foreground text-xs font-normal">({isRTL ? "اختیاری" : "Optional"})</span>
              </Label>
              <div className="relative">
                <Lock className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  className={cn("rounded-xl h-11", isRTL ? "pr-10 pl-10" : "pl-10 pr-10")}
                  placeholder={isRTL ? "خالی = کد ملی" : "Empty = national ID"}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors", isRTL ? "left-3" : "right-3")}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground">{isRTL ? "خالی باشد → کد ملی" : "Empty → uses national ID"}</p>
              {errors.password && <p className="text-xs text-destructive flex items-center gap-1"><span className="inline-block w-1 h-1 rounded-full bg-destructive" />{errors.password}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                {isRTL ? "تکرار رمز" : "Confirm"} {form.password && <span className="text-destructive">*</span>}
              </Label>
              <div className="relative">
                <Lock className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  className={cn("rounded-xl h-11", isRTL ? "pr-10 pl-10" : "pl-10 pr-10")}
                  placeholder={form.password ? "••••••••" : (isRTL ? "اختیاری" : "Optional")}
                  dir="ltr"
                  disabled={!form.password}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors", isRTL ? "left-3" : "right-3")}
                  disabled={!form.password}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive flex items-center gap-1"><span className="inline-block w-1 h-1 rounded-full bg-destructive" />{errors.confirmPassword}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// STEP 2 – Personal Information
// ═══════════════════════════════════════════════════════

function Step2Personal({ form, updateField, errors, isRTL, isAdminMode }: StepProps) {
  // Separate education levels by category
  const schoolLevels = EDUCATION_LEVELS.filter(e => e.category === "school");
  const degreeLevels = EDUCATION_LEVELS.filter(e => e.category === "degree");
  const otherLevel = EDUCATION_LEVELS.find(e => e.category === "other");

  return (
    <div className="space-y-5">
      {/* Date of Birth - Persian/Shamsi Calendar */}
      <PersianDatePicker
        value={form.dateOfBirth}
        onChange={(isoDate) => updateField("dateOfBirth", isoDate)}
        isRTL={isRTL}
        label={isRTL ? "تاریخ تولد (شمسی)" : "Date of Birth (Jalali)"}
        placeholder={isRTL ? "انتخاب تاریخ تولد شمسی" : "Select Jalali birth date"}
        error={errors.dateOfBirth}
        showAge={true}
      />
      {form.dateOfBirth && isMinor(form.dateOfBirth) && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <Baby className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-xs text-amber-700 dark:text-amber-400">
            {isRTL ? "زیر ۱۸ سال - اطلاعات ولی الزامی است" : "Under 18 - guardian info required"}
          </span>
        </div>
      )}

      {/* Gender */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{isRTL ? "جنسیت" : "Gender"}</Label>
        <Select value={form.gender} onValueChange={(v) => updateField("gender", v)}>
          <SelectTrigger className="rounded-xl h-11">
            <SelectValue placeholder={isRTL ? "انتخاب کنید" : "Select"} />
          </SelectTrigger>
          <SelectContent>
            {GENDERS.map((g) => (
              <SelectItem key={g.value} value={g.value}>
                {isRTL ? g.fa : g.en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Current Educational Level / Grade */}
      <div className="space-y-1.5">
        <LabelWithGuide isRTL={isRTL} isAdminMode={isAdminMode} fieldKey="educationLevel">
          {isRTL ? "پایه تحصیلی کنونی" : "Current Educational Level"}
        </LabelWithGuide>
        <p className="text-[11px] text-muted-foreground -mt-1">
          {isRTL
            ? "اگر هنرجو دانش‌آموز است، پایه تحصیلی فعلی را انتخاب کنید. اگر فارغ‌التحصیل است، آخرین مدرک تحصیلی را انتخاب کنید."
            : "If the student is currently studying, select their current grade. If graduated, select their highest degree."}
        </p>
        <Select value={form.educationLevel} onValueChange={(v) => updateField("educationLevel", v)}>
          <SelectTrigger className="rounded-xl h-11">
            <SelectValue placeholder={isRTL ? "انتخاب کنید" : "Select"} />
          </SelectTrigger>
          <SelectContent>
            {/* School levels section */}
            <SelectItem value="none_school" disabled className="text-[10px] text-muted-foreground font-semibold">
              ── {isRTL ? "پایه تحصیلی (دانش‌آموز)" : "Grade Level (Student)"} ──
            </SelectItem>
            {schoolLevels.map((e) => (
              <SelectItem key={e.value} value={e.value}>
                {isRTL ? e.fa : e.en}
              </SelectItem>
            ))}
            {/* Degree levels section */}
            <SelectItem value="none_degree" disabled className="text-[10px] text-muted-foreground font-semibold mt-1">
              ── {isRTL ? "مدرک تحصیلی (فارغ‌التحصیل)" : "Degree (Graduated)"} ──
            </SelectItem>
            {degreeLevels.map((e) => (
              <SelectItem key={e.value} value={e.value}>
                {isRTL ? e.fa : e.en}
              </SelectItem>
            ))}
            {/* Other */}
            {otherLevel && (
              <SelectItem key={otherLevel.value} value={otherLevel.value}>
                {isRTL ? otherLevel.fa : otherLevel.en}
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Field of Study */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">
          {isRTL ? "رشته تحصیلی" : "Field of Study"}
        </Label>
        <Input
          value={form.fieldOfStudy}
          onChange={(e) => updateField("fieldOfStudy", e.target.value)}
          className="rounded-xl h-11"
          placeholder={isRTL ? "مثلاً: مهندسی کامپیوتر" : "e.g., Computer Engineering"}
          dir={isRTL ? "rtl" : "ltr"}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// STEP 3 – Music Profile (with Smart Comboboxes)
// ═══════════════════════════════════════════════════════

interface Step3Props extends StepProps {
  toggleArrayItem: (field: "secondaryInstruments" | "musicGenres" | "learningGoals", value: string) => void;
}

function Step3Music({ form, updateField, toggleArrayItem, errors, isRTL, isAdminMode }: Step3Props) {
  const isInstructor = form.role === "instructor";
  
  return (
    <div className="space-y-5">
      {/* Instructor Banner */}
      {isInstructor && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-200 dark:border-emerald-800">
          <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs text-emerald-700 dark:text-emerald-400">
            {isRTL ? "اطلاعات موسیقی و تخصص تدریس استاد" : "Instructor's music and teaching specialization"}
          </span>
        </div>
      )}

      {/* Registration Instrument — only for students */}
      {!isInstructor && (
        <div className="space-y-1.5">
          <LabelWithGuide isRTL={isRTL} isAdminMode={isAdminMode} fieldKey="registrationInstrument" required>
            {isRTL ? "ساز ثبت‌نام" : "Registration Instrument"}
          </LabelWithGuide>
          <p className="text-[11px] text-muted-foreground -mt-1">
            {isRTL ? "سازی که می‌خواهید یاد بگیرید" : "The instrument you want to learn"}
          </p>
          <SmartCombobox
            options={INSTRUMENTS}
            value={form.registrationInstrument}
            onChange={(v) => updateField("registrationInstrument", v)}
            placeholder={isRTL ? "سازی که می‌خواهید یاد بگیرید..." : "Instrument you want to learn..."}
            isRTL={isRTL}
            allowFreeText
            required
            error={errors.registrationInstrument}
          />
        </div>
      )}

      {/* Primary Instrument - Smart Combobox */}
      <div className="space-y-1.5">
        <LabelWithGuide isRTL={isRTL} isAdminMode={isAdminMode} fieldKey="primaryInstrument">
          {isInstructor
            ? (isRTL ? "ساز اصلی تدریس" : "Primary Teaching Instrument")
            : (isRTL ? "ساز اصلی" : "Primary Instrument")}
        </LabelWithGuide>
        <p className="text-[11px] text-muted-foreground -mt-1">
          {isInstructor
            ? (isRTL ? "سازی که استاد در آن تخصص و تدریس دارد" : "The instrument the instructor specializes in and teaches")
            : (isRTL ? "سازی که قبلاً می‌نوازید (در صورت وجود)" : "Instrument you already play (if any)")}
        </p>
        <SmartCombobox
          options={INSTRUMENTS}
          value={form.primaryInstrument}
          onChange={(v) => updateField("primaryInstrument", v)}
          placeholder={isRTL ? "ساز اصلی خود را انتخاب یا تایپ کنید..." : "Select or type your primary instrument..."}
          isRTL={isRTL}
          allowFreeText
        />
      </div>

      {/* Secondary Instruments - Multi-select — not for instructors */}
      {!isInstructor && (
      <div className="space-y-2">
        <LabelWithGuide isRTL={isRTL} isAdminMode={isAdminMode} fieldKey="secondaryInstruments">
          {isRTL ? "سازهای دیگر" : "Secondary Instruments"}
        </LabelWithGuide>
        <div className="flex flex-wrap gap-2">
          {/* ندارد option */}
          <Badge
            className={cn(
              "cursor-pointer transition-all py-1.5 px-3 text-xs",
              form.secondaryInstruments.includes("none")
                ? "bg-primary text-primary-foreground"
                : "bg-muted/60 text-muted-foreground hover:bg-muted"
            )}
            onClick={() => {
              if (form.secondaryInstruments.includes("none")) {
                toggleArrayItem("secondaryInstruments", "none");
              } else {
                updateField("secondaryInstruments", ["none"]);
              }
            }}
          >
            <Ban className="w-3 h-3 inline-block ml-1 mr-1" />
            {isRTL ? "ندارد" : "None"}
          </Badge>
          {INSTRUMENTS.filter((i) => i.value !== "other").map((inst) => {
            const isSelected = form.secondaryInstruments.includes(inst.value);
            const Icon = inst.icon;
            return (
              <Badge
                key={inst.value}
                className={cn(
                  "cursor-pointer transition-all py-1.5 px-3 text-xs",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                )}
                onClick={() => {
                  if (form.secondaryInstruments.includes("none")) return; // Can't add if "none" selected
                  toggleArrayItem("secondaryInstruments", inst.value);
                }}
              >
                <Icon className="w-3 h-3 inline-block ml-1 mr-1" />
                {isRTL ? inst.fa : inst.en}
                {isSelected && <X className="w-3 h-3 inline-block ml-1 mr-1 opacity-60" />}
              </Badge>
            );
          })}
        </div>
      </div>
      )}

      {/* Instructor Name with Known/Unknown Toggle — only for students */}
      {!isInstructor && (
      <div className="space-y-2">
        <LabelWithGuide isRTL={isRTL} isAdminMode={isAdminMode} fieldKey="instructorName">
          {isRTL ? "نام استاد" : "Instructor Name"}
        </LabelWithGuide>
        <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
          <div className="flex items-center gap-2">
            <Switch
              checked={form.instructorNameKnown}
              onCheckedChange={(checked) => {
                updateField("instructorNameKnown", checked);
                if (!checked) updateField("instructorName", "");
              }}
            />
            <span className="text-xs text-muted-foreground">
              {form.instructorNameKnown
                ? (isRTL ? "مشخص" : "Known")
                : (isRTL ? "نامشخص" : "Unknown")}
            </span>
          </div>
        </div>
        {form.instructorNameKnown ? (
          <div className="relative">
            <BookOpen className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
            <Input
              value={form.instructorName}
              onChange={(e) => updateField("instructorName", e.target.value)}
              className={cn("rounded-xl h-11", isRTL ? "pr-10" : "pl-10")}
              placeholder={isRTL ? "نام استاد خود را وارد کنید" : "Enter your instructor's name"}
              dir={isRTL ? "rtl" : "ltr"}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/40 border border-border/50">
            <Ban className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {isRTL ? "نام استاد نامشخص - ادمین بعداً تکمیل می‌کند" : "Instructor unknown - admin will fill in later"}
            </span>
          </div>
        )}
      </div>
      )}

      {/* Learning Goals — only for students */}
      {!isInstructor && (
      <div className="space-y-2">
        <LabelWithGuide isRTL={isRTL} isAdminMode={isAdminMode} fieldKey="learningGoals">
          {isRTL ? "هدف از یادگیری موسیقی" : "Purpose of Learning Music"}
        </LabelWithGuide>
        <div className="grid grid-cols-1 gap-2">
          {LEARNING_GOALS.map((goal) => {
            const isSelected = form.learningGoals.includes(goal.value);
            const GoalIcon = goal.icon;
            return (
              <Card
                key={goal.value}
                className={cn(
                  "cursor-pointer transition-all duration-200 p-3 border",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/60 hover:border-primary/30 hover:bg-muted/30"
                )}
                onClick={() => toggleArrayItem("learningGoals", goal.value)}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                    isSelected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <GoalIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("font-medium text-sm", isSelected && "text-primary")}>
                        {isRTL ? goal.fa : goal.en}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {isRTL ? goal.descFa : goal.descEn}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
      )}

      {/* Skill Level */}
      <div className="space-y-2">
        <LabelWithGuide isRTL={isRTL} isAdminMode={isAdminMode} fieldKey="skillLevel">
          {isInstructor
            ? (isRTL ? "سطح مهارت تدریس" : "Teaching Skill Level")
            : (isRTL ? "سطح مهارت" : "Skill Level")}
        </LabelWithGuide>
        <div className="grid grid-cols-4 gap-2">
          {SKILL_LEVELS.map((level) => {
            const isSelected = form.skillLevel === level.value;
            return (
              <Card
                key={level.value}
                className={cn(
                  "cursor-pointer transition-all duration-200 p-2.5 border text-center",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/60 hover:border-primary/30"
                )}
                onClick={() => updateField("skillLevel", isSelected ? "" : level.value)}
              >
                <span className={cn("text-xs font-semibold", isSelected ? "text-primary" : "text-muted-foreground")}>
                  {isRTL ? level.fa : level.en}
                </span>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Previous Training */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">
          {isRTL ? "سابقه آموزش" : "Previous Training"}
        </Label>
        <Select value={form.previousTraining} onValueChange={(v) => updateField("previousTraining", v)}>
          <SelectTrigger className="rounded-xl h-11">
            <SelectValue placeholder={isRTL ? "انتخاب کنید" : "Select"} />
          </SelectTrigger>
          <SelectContent>
            {PREVIOUS_TRAINING.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {isRTL ? t.fa : t.en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Music Genres */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {isRTL ? "سبک‌های مورد علاقه" : "Favorite Genres"}
        </Label>
        <div className="flex flex-wrap gap-2">
          {MUSIC_GENRES.map((genre) => {
            const isSelected = form.musicGenres.includes(genre.value);
            return (
              <Badge
                key={genre.value}
                className={cn(
                  "cursor-pointer transition-all py-1.5 px-3 text-xs",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                )}
                onClick={() => toggleArrayItem("musicGenres", genre.value)}
              >
                {isRTL ? genre.fa : genre.en}
                {isSelected && <X className="w-3 h-3 inline-block ml-1 mr-1 opacity-60" />}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Experience Years + Practice Hours */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">
            {isInstructor
              ? (isRTL ? "سال‌های تدریس" : "Teaching Years")
              : (isRTL ? "سال‌های تجربه" : "Experience (years)")}
          </Label>
          <div className="relative">
            <Clock className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
            <Input
              type="number"
              min="0"
              max="50"
              value={form.musicExperienceYears}
              onChange={(e) => updateField("musicExperienceYears", e.target.value)}
              className={cn("rounded-xl h-11", isRTL ? "pr-10" : "pl-10")}
              placeholder="0"
              dir="ltr"
            />
          </div>
        </div>
        {!isInstructor && (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">
            {isRTL ? "ساعت تمرین/هفته" : "Practice hrs/week"}
          </Label>
          <div className="relative">
            <Target className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
            <Input
              type="number"
              min="0"
              max="40"
              value={form.practiceHoursPerWeek}
              onChange={(e) => updateField("practiceHoursPerWeek", e.target.value)}
              className={cn("rounded-xl h-11", isRTL ? "pr-10" : "pl-10")}
              placeholder="0"
              dir="ltr"
            />
          </div>
        </div>
        )}
      </div>

      {/* ─── Tuition & Payment Section (Admin Mode — students only) ─── */}
      {isAdminMode && !isInstructor ? (
        <div className="space-y-4 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200/60 dark:border-emerald-800/30">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              {isRTL ? "شهریه و پرداخت" : "Tuition & Payment"}
            </span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-300 text-emerald-600">
              {isRTL ? "ادمین" : "Admin"}
            </Badge>
          </div>

          {/* Course Selection */}
          <div className="space-y-1.5">
            <LabelWithGuide isRTL={isRTL} isAdminMode={isAdminMode} fieldKey="courseId">
              {isRTL ? "دوره (اختیاری)" : "Course (Optional)"}
            </LabelWithGuide>
            <CourseSelect
              value={form.courseId}
              onChange={(val) => updateField("courseId", val)}
              isRTL={isRTL}
            />
            {form.courseId && form.courseId !== "none" && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800">
                <GraduationCap className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span className="text-[11px] text-sky-700 dark:text-sky-400">
                  {isRTL ? "هنرجو همزمان در این دوره ثبت‌نام می‌شود" : "Student will be enrolled in this course simultaneously"}
                </span>
              </div>
            )}
          </div>

          {/* Tuition Amount */}
          <div className="space-y-1.5">
            <LabelWithGuide isRTL={isRTL} isAdminMode={isAdminMode} fieldKey="tuitionAmount">
              {isRTL ? "شهریه (تومان)" : "Tuition (Toman)"}
            </LabelWithGuide>
            <div className="relative">
              <DollarSign className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
              <Input
                type="number"
                min="0"
                value={form.tuitionAmount}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  updateField("tuitionAmount", val);
                }}
                className={cn("rounded-xl h-11", isRTL ? "pr-10" : "pl-10")}
                placeholder={isRTL ? "مثلاً: ۵۰۰۰۰۰۰" : "e.g., 5000000"}
                dir="ltr"
              />
            </div>
            {form.tuitionAmount && (
              <p className="text-[11px] text-muted-foreground">
                {isRTL
                  ? `${Number(form.tuitionAmount).toLocaleString("fa-IR")} تومان`
                  : `${Number(form.tuitionAmount).toLocaleString()} Toman`}
              </p>
            )}
          </div>

          {/* Payment Status */}
          <div className="space-y-1.5">
            <LabelWithGuide isRTL={isRTL} isAdminMode={isAdminMode} fieldKey="paymentStatus">
              {isRTL ? "وضعیت پرداخت" : "Payment Status"}
            </LabelWithGuide>
            <div className="grid grid-cols-4 gap-2">
              {PAYMENT_STATUSES.map((status) => {
                const isSelected = form.paymentStatus === status.value;
                return (
                  <Card
                    key={status.value}
                    className={cn(
                      "cursor-pointer transition-all duration-200 p-2.5 border text-center",
                      isSelected
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-sm"
                        : "border-border/60 hover:border-emerald-300"
                    )}
                    onClick={() => updateField("paymentStatus", isSelected ? "" : status.value)}
                  >
                    <span className={cn("text-xs font-semibold", isSelected ? status.color : "text-muted-foreground")}>
                      {isRTL ? status.fa : status.en}
                    </span>
                  </Card>
                );
              })}
            </div>
            {form.paymentStatus === "paid" && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  {isRTL ? "تاریخ پرداخت به‌صورت خودکار ثبت می‌شود" : "Payment date will be recorded automatically"}
                </span>
              </div>
            )}
          </div>

          {/* Payment Due Date */}
          <div className="space-y-1.5">
            <LabelWithGuide isRTL={isRTL} isAdminMode={isAdminMode} fieldKey="paymentDueDate">
              {isRTL ? "مهلت پرداخت" : "Payment Due Date"}
            </LabelWithGuide>
            <div className="relative">
              <Calendar className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
              <Input
                type="date"
                value={form.paymentDueDate}
                onChange={(e) => updateField("paymentDueDate", e.target.value)}
                className={cn("rounded-xl h-11", isRTL ? "pr-10" : "pl-10")}
                dir="ltr"
              />
            </div>
          </div>

          {/* Payment Reference */}
          <div className="space-y-1.5">
            <LabelWithGuide isRTL={isRTL} isAdminMode={isAdminMode} fieldKey="paymentRef">
              {isRTL ? "شماره رسید" : "Payment Reference"}
            </LabelWithGuide>
            <div className="relative">
              <Receipt className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
              <Input
                value={form.paymentRef}
                onChange={(e) => updateField("paymentRef", e.target.value)}
                className={cn("rounded-xl h-11", isRTL ? "pr-10" : "pl-10")}
                placeholder={isRTL ? "شماره تراکنش یا رسید" : "Transaction or receipt number"}
                dir="ltr"
              />
            </div>
          </div>

          {/* Admin Tags */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Tags className="w-3.5 h-3.5" />
              {isRTL ? "تگ‌ها" : "Tags"}
            </Label>
            <Input
              value={form.tags}
              onChange={(e) => updateField("tags", e.target.value)}
              className="rounded-xl h-11"
              placeholder={isRTL ? "با کاما جدا کنید: VIP, فعال" : "Comma-separated: VIP, active"}
              dir="ltr"
            />
            <p className="text-[11px] text-muted-foreground">
              {isRTL ? "تگ‌ها برای دسته‌بندی و تحلیل هوش مصنوعی استفاده می‌شوند" : "Tags used for categorization and AI analysis"}
            </p>
          </div>
        </div>
      ) : (
        /* Non-admin (online) registration notice */
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200/60 dark:border-emerald-800/30">
          <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {isRTL ? "ثبت‌نام آنلاین" : "Online Registration"}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-500">
              {isRTL
                ? "پس از ثبت‌نام، همکاران ما در اسرع وقت با شما تماس خواهند گرفت"
                : "After registration, our colleagues will contact you as soon as possible"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// STEP 4 – Location & Contact
// ═══════════════════════════════════════════════════════

function Step4Location({ form, updateField, errors, isRTL, isAdminMode }: StepProps) {
  return (
    <div className="space-y-5">
      {/* Province */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">
          {isRTL ? "استان" : "Province"}
        </Label>
        <Select value={form.province} onValueChange={(v) => updateField("province", v)}>
          <SelectTrigger className="rounded-xl h-11">
            <SelectValue placeholder={isRTL ? "انتخاب استان" : "Select province"} />
          </SelectTrigger>
          <SelectContent>
            {IRANIAN_PROVINCES.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {isRTL ? p.fa : p.en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">
          {isRTL ? "شهر" : "City"}
        </Label>
        <Input
          value={form.city}
          onChange={(e) => updateField("city", e.target.value)}
          className="rounded-xl h-11"
          placeholder={isRTL ? "نام شهر" : "City name"}
          dir={isRTL ? "rtl" : "ltr"}
        />
      </div>

      {/* Address */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">
          {isRTL ? "آدرس" : "Address"}
        </Label>
        <div className="relative">
          <MapPin className={cn("absolute top-3 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
          <Textarea
            value={form.address}
            onChange={(e) => updateField("address", e.target.value)}
            className={cn("rounded-xl resize-none min-h-[80px]", isRTL ? "pr-10" : "pl-10")}
            placeholder={isRTL ? "آدرس کامل" : "Full address"}
            dir={isRTL ? "rtl" : "ltr"}
          />
        </div>
      </div>

      {/* Preferred Branch (NEW) */}
      <div className="space-y-1.5">
        <LabelWithGuide isRTL={isRTL} isAdminMode={isAdminMode} fieldKey="preferredBranch">
          {isRTL ? "شعبه ترجیحی" : "Preferred Branch"}
        </LabelWithGuide>
        <Select value={form.preferredBranch} onValueChange={(v) => updateField("preferredBranch", v)}>
          <SelectTrigger className="rounded-xl h-11">
            <SelectValue placeholder={isRTL ? "انتخاب شعبه" : "Select branch"} />
          </SelectTrigger>
          <SelectContent>
            {BRANCHES.map((b) => (
              <SelectItem key={b.value} value={b.value}>
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5" />
                  {isRTL ? b.fa : b.en}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Emergency Contact */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">
          {isRTL ? "شماره تماس اضطراری" : "Emergency Contact"}
        </Label>
        <div className="relative">
          <Phone className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
          <Input
            value={form.emergencyContact}
            onChange={(e) => updateField("emergencyContact", e.target.value)}
            className={cn("rounded-xl h-11", isRTL ? "pr-10" : "pl-10")}
            placeholder={isRTL ? "شماره تماس در مواقع اضطراری" : "Emergency contact number"}
            dir="ltr"
          />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// STEP 5 – Additional Info (Conditional)
// ═══════════════════════════════════════════════════════

interface Step5Props extends StepProps {
  showMinorFields: boolean;
}

function Step5Additional({ form, updateField, errors, isRTL, showMinorFields }: Step5Props) {
  return (
    <div className="space-y-5">
      {/* Minor Guardian Info */}
      {showMinorFields && (
        <div className="space-y-4 p-4 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30">
          <div className="flex items-center gap-2 mb-1">
            <Baby className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              {isRTL ? "اطلاعات ولی‌تر" : "Guardian Information"}
            </span>
          </div>

          {/* Parent Name */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              {isRTL ? "نام ولی" : "Guardian Name"} <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.parentName}
              onChange={(e) => updateField("parentName", e.target.value)}
              className="rounded-xl h-11"
              placeholder={isRTL ? "نام پدر/مادر/سرپرست" : "Father/Mother/Guardian name"}
              dir={isRTL ? "rtl" : "ltr"}
            />
          </div>

          {/* Parent Phone (replaced parentEmail) */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              {isRTL ? "شماره تماس ولی" : "Guardian Phone"} <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Phone className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
              <Input
                value={form.parentPhone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  updateField("parentPhone", val.slice(0, 11));
                }}
                className={cn("rounded-xl h-11", isRTL ? "pr-10" : "pl-10")}
                placeholder="09121234567"
                dir="ltr"
                maxLength={11}
              />
            </div>
          </div>

          {/* Parent Relation */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              {isRTL ? "نسبت" : "Relationship"}
            </Label>
            <Select value={form.parentRelation} onValueChange={(v) => updateField("parentRelation", v)}>
              <SelectTrigger className="rounded-xl h-11">
                <SelectValue placeholder={isRTL ? "انتخاب کنید" : "Select"} />
              </SelectTrigger>
              <SelectContent>
                {PARENT_RELATIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {isRTL ? r.fa : r.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Instructor Fields */}
      {form.role === "instructor" && (
        <div className="space-y-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-primary">
              {isRTL ? "اطلاعات تخصصی و حرفه‌ای استاد" : "Instructor Professional Profile"}
            </span>
          </div>

          {/* Specialty - grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                {isRTL ? "تخصص (فارسی)" : "Specialty (Farsi)"} <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.specialtyFa}
                onChange={(e) => updateField("specialtyFa", e.target.value)}
                className="rounded-xl h-11"
                placeholder={isRTL ? "مثلاً: پیانو کلاسیک" : "e.g., Classical Piano"}
                dir="rtl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                {isRTL ? "تخصص (انگلیسی)" : "Specialty (English)"} <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.specialtyEn}
                onChange={(e) => updateField("specialtyEn", e.target.value)}
                className="rounded-xl h-11"
                placeholder="e.g., Classical Piano"
                dir="ltr"
              />
            </div>
          </div>

          {/* Bio - grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                {isRTL ? "بیوگرافی (فارسی)" : "Bio (Farsi)"}
              </Label>
              <Textarea
                value={form.bioFa}
                onChange={(e) => updateField("bioFa", e.target.value)}
                className="rounded-xl resize-none"
                rows={3}
                placeholder={isRTL ? "شرح کوتاهی از سوابق و تخصص شما" : "Brief description of your background and expertise"}
                dir="rtl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                {isRTL ? "بیوگرافی (انگلیسی)" : "Bio (English)"}
              </Label>
              <Textarea
                value={form.bioEn}
                onChange={(e) => updateField("bioEn", e.target.value)}
                className="rounded-xl resize-none"
                rows={3}
                placeholder="Brief description of your background and expertise"
                dir="ltr"
              />
            </div>
          </div>

          {/* Teaching Experience */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              {isRTL ? "سابقه تدریس" : "Teaching Experience"}
            </Label>
            <Input
              value={form.experience}
              onChange={(e) => updateField("experience", e.target.value)}
              className="rounded-xl h-11"
              placeholder={isRTL ? "مثلاً: ۵ سال تدریس پیانو در موسسه ..." : "e.g., 5 years teaching piano at ..."}
              dir={isRTL ? "rtl" : "ltr"}
            />
          </div>

          {/* Social Links */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {isRTL ? "شبکه‌های اجتماعی" : "Social Links"}
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <Instagram className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
                <Input
                  value={form.instagramLink}
                  onChange={(e) => updateField("instagramLink", e.target.value)}
                  className={cn("rounded-xl h-11", isRTL ? "pr-10" : "pl-10")}
                  placeholder="instagram.com/username"
                  dir="ltr"
                />
              </div>
              <div className="relative">
                <Send className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
                <Input
                  value={form.telegramLink}
                  onChange={(e) => updateField("telegramLink", e.target.value)}
                  className={cn("rounded-xl h-11", isRTL ? "pr-10" : "pl-10")}
                  placeholder="t.me/username"
                  dir="ltr"
                />
              </div>
              <div className="relative">
                <Youtube className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
                <Input
                  value={form.youtubeLink}
                  onChange={(e) => updateField("youtubeLink", e.target.value)}
                  className={cn("rounded-xl h-11", isRTL ? "pr-10" : "pl-10")}
                  placeholder="youtube.com/@channel"
                  dir="ltr"
                />
              </div>
              <div className="relative">
                <Music2 className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
                <Input
                  value={form.soundcloudLink}
                  onChange={(e) => updateField("soundcloudLink", e.target.value)}
                  className={cn("rounded-xl h-11", isRTL ? "pr-10" : "pl-10")}
                  placeholder="soundcloud.com/username"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Publish & Order - Admin controls */}
          <div className="flex items-center gap-6 p-3 rounded-xl bg-muted/30 border border-border/40">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isPublishedInstructor}
                onCheckedChange={(checked) => updateField("isPublishedInstructor", checked)}
              />
              <Label className="text-sm font-medium">
                {isRTL ? "نمایش در صفحه مدرسین" : "Show on Instructors Page"}
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">
                {isRTL ? "ترتیب نمایش:" : "Display Order:"}
              </Label>
              <Input
                type="number"
                min="0"
                value={form.instructorOrder}
                onChange={(e) => updateField("instructorOrder", e.target.value)}
                className="rounded-lg h-9 w-20 text-sm text-center"
                dir="ltr"
              />
            </div>
          </div>

          {/* ─── Instructor Extended Profile ─── */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                {isRTL ? "اطلاعات حرفه‌ای و قرارداد" : "Professional & Contract Info"}
              </span>
            </div>

            {/* Teaching Instruments - Multi-select */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {isRTL ? "سازهای تدریسی" : "Teaching Instruments"}
              </Label>
              <p className="text-[11px] text-muted-foreground">
                {isRTL ? "سازهایی که استاد تدریس می‌کند" : "Instruments the instructor teaches"}
              </p>
              <div className="flex flex-wrap gap-2">
                {INSTRUMENTS.filter((i) => i.value !== "other").map((inst) => {
                  const isSelected = form.teachingInstruments.includes(inst.value);
                  const Icon = inst.icon;
                  return (
                    <Badge
                      key={inst.value}
                      className={cn(
                        "cursor-pointer transition-all py-1.5 px-3 text-xs",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted"
                      )}
                      onClick={() => toggleArrayItem("teachingInstruments", inst.value)}
                    >
                      <Icon className="w-3 h-3 inline-block ml-1 mr-1" />
                      {isRTL ? inst.fa : inst.en}
                      {isSelected && <X className="w-3 h-3 inline-block ml-1 mr-1 opacity-60" />}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Certifications - Textarea */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                {isRTL ? "مدارک و گواهینامه‌ها" : "Certifications"}
              </Label>
              <Textarea
                value={form.certifications}
                onChange={(e) => updateField("certifications", e.target.value)}
                className="rounded-xl resize-none"
                rows={3}
                placeholder={isRTL ? "هر خط یک مدرک" : "One certification per line"}
                dir={isRTL ? "rtl" : "ltr"}
              />
              <p className="text-[11px] text-muted-foreground">
                {isRTL ? "هر مدرک را در یک خط جداگانه وارد کنید" : "Enter one certification per line"}
              </p>
            </div>

            {/* Hourly Rate + Contract Type */}
            <div className="grid grid-cols-2 gap-3">
              {/* Hourly Rate */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  {isRTL ? "حق‌الساعع (تومان)" : "Hourly Rate (Toman)"}
                </Label>
                <div className="relative">
                  <DollarSign className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
                  <Input
                    type="number"
                    min="0"
                    value={form.hourlyRate}
                    onChange={(e) => updateField("hourlyRate", e.target.value)}
                    className={cn("rounded-xl h-11", isRTL ? "pr-10" : "pl-10")}
                    placeholder={isRTL ? "مثلاً: ۵۰۰۰۰۰" : "e.g., 500000"}
                    dir="ltr"
                  />
                </div>
              </div>
              {/* Contract Type */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  {isRTL ? "نوع قرارداد" : "Contract Type"}
                </Label>
                <Select value={form.contractType} onValueChange={(v) => updateField("contractType", v)}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder={isRTL ? "انتخاب کنید" : "Select"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">{isRTL ? "تمام‌وقت" : "Full-time"}</SelectItem>
                    <SelectItem value="part_time">{isRTL ? "پاره‌وقت" : "Part-time"}</SelectItem>
                    <SelectItem value="hourly">{isRTL ? "ساعتی" : "Hourly"}</SelectItem>
                    <SelectItem value="contract">{isRTL ? "قراردادی" : "Contract"}</SelectItem>
                    <SelectItem value="freelance">{isRTL ? "آزاد" : "Freelance"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Available Days - Multi-select checkboxes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {isRTL ? "روزهای حضور" : "Available Days"}
              </Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "saturday", fa: "شنبه", en: "Saturday" },
                  { value: "sunday", fa: "یکشنبه", en: "Sunday" },
                  { value: "monday", fa: "دوشنبه", en: "Monday" },
                  { value: "tuesday", fa: "سه‌شنبه", en: "Tuesday" },
                  { value: "wednesday", fa: "چهارشنبه", en: "Wednesday" },
                  { value: "thursday", fa: "پنجشنبه", en: "Thursday" },
                  { value: "friday", fa: "جمعه", en: "Friday" },
                ].map((day) => {
                  const isSelected = form.availableDays.includes(day.value);
                  return (
                    <Badge
                      key={day.value}
                      className={cn(
                        "cursor-pointer transition-all py-1.5 px-3 text-xs",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted"
                      )}
                      onClick={() => toggleArrayItem("availableDays", day.value)}
                    >
                      {isRTL ? day.fa : day.en}
                      {isSelected && <X className="w-3 h-3 inline-block ml-1 mr-1 opacity-60" />}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Hire Date */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                {isRTL ? "تاریخ استخدام" : "Hire Date"}
              </Label>
              <PersianDatePicker
                value={form.hireDate}
                onChange={(v) => updateField("hireDate", v)}
                placeholder={isRTL ? "انتخاب تاریخ استخدام" : "Select hire date"}
                isRTL={isRTL}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// STEP 6 – Referral Source + Summary
// ═══════════════════════════════════════════════════════

interface Step6Props {
  form: FormData;
  updateField: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
  isRTL: boolean;
  isAdminMode?: boolean;
}

function Step6Referral({ form, updateField, isRTL, isAdminMode }: Step6Props) {
  return (
    <div className="space-y-5">
      {/* Referral Source */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">
          {isRTL ? "چگونه با ما آشنا شدید؟" : "How did you find us?"}
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {REFERRAL_SOURCES.map((source) => {
            const isSelected = form.referralSource === source.value;
            return (
              <Card
                key={source.value}
                className={cn(
                  "cursor-pointer transition-all duration-200 p-3 border text-center",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/60 hover:border-primary/30"
                )}
                onClick={() => updateField("referralSource", isSelected ? "" : source.value)}
              >
                <span className={cn("text-xs font-medium", isSelected ? "text-primary" : "text-muted-foreground")}>
                  {isRTL ? source.fa : source.en}
                </span>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Referral Detail */}
      {form.referralSource && (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">
            {isRTL ? "جزئیات بیشتر" : "More Details"}
          </Label>
          <Textarea
            value={form.referralDetail}
            onChange={(e) => updateField("referralDetail", e.target.value)}
            className="rounded-xl resize-none min-h-[60px]"
            placeholder={
              form.referralSource === "friend"
                ? (isRTL ? "نام دوست شما؟" : "Name of your friend?")
                : form.referralSource === "event"
                  ? (isRTL ? "کدام رویداد؟" : "Which event?")
                  : (isRTL ? "جزئیات بیشتر..." : "More details...")
            }
            dir={isRTL ? "rtl" : "ltr"}
          />
        </div>
      )}

      {/* Summary Preview */}
      <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border/40">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">
            {isRTL ? "خلاصه ثبت‌نام" : "Registration Summary"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <SummaryItem label={isRTL ? "نام" : "Name"} value={form.name} />
          <SummaryItem label={isRTL ? "ایمیل" : "Email"} value={form.email} />
          <SummaryItem label={isRTL ? "موبایل" : "Phone"} value={form.phone} />
          <SummaryItem label={isRTL ? "نوع" : "Type"} value={isRTL ? (form.role === "student" ? "دانشجو" : "استاد") : (form.role === "student" ? "Student" : "Instructor")} />
          {isAdminMode && form.registrationMethod && (
            <SummaryItem
              label={isRTL ? "روش ثبت‌نام" : "Reg. Method"}
              value={(() => {
                const m = REGISTRATION_METHODS.find((rm) => rm.value === form.registrationMethod);
                return m ? (isRTL ? m.fa : m.en) : form.registrationMethod;
              })()}
            />
          )}
          {form.registrationInstrument && (
            <SummaryItem
              label={isRTL ? "ساز ثبت‌نام" : "Reg. Instrument"}
              value={INSTRUMENTS.find((i) => i.value === form.registrationInstrument)
                ? (isRTL ? INSTRUMENTS.find((i) => i.value === form.registrationInstrument)!.fa : INSTRUMENTS.find((i) => i.value === form.registrationInstrument)!.en)
                : form.registrationInstrument}
            />
          )}
          {form.primaryInstrument && (
            <SummaryItem
              label={isRTL ? "ساز اصلی" : "Primary"}
              value={INSTRUMENTS.find((i) => i.value === form.primaryInstrument)
                ? (isRTL ? INSTRUMENTS.find((i) => i.value === form.primaryInstrument)!.fa : INSTRUMENTS.find((i) => i.value === form.primaryInstrument)!.en)
                : form.primaryInstrument}
            />
          )}
          {form.skillLevel && (
            <SummaryItem
              label={isRTL ? "سطح" : "Level"}
              value={SKILL_LEVELS.find((l) => l.value === form.skillLevel)
                ? (isRTL ? SKILL_LEVELS.find((l) => l.value === form.skillLevel)!.fa : SKILL_LEVELS.find((l) => l.value === form.skillLevel)!.en)
                : form.skillLevel}
            />
          )}
          {form.learningGoals.length > 0 && (
            <div className="col-span-2">
              <SummaryItem
                label={isRTL ? "اهداف" : "Goals"}
                value={form.learningGoals
                  .map((g) => {
                    const goal = LEARNING_GOALS.find((lg) => lg.value === g);
                    return goal ? (isRTL ? goal.fa : goal.en) : g;
                  })
                  .join("، ")}
              />
            </div>
          )}
        </div>

        {/* Admin: Payment Summary */}
        {isAdminMode && (form.tuitionAmount || form.paymentStatus !== "unpaid") && (
          <div className="mt-3 pt-3 border-t border-border/40">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {isRTL ? "خلاصه پرداخت" : "Payment Summary"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {form.tuitionAmount && (
                <SummaryItem
                  label={isRTL ? "شهریه" : "Tuition"}
                  value={isRTL
                    ? `${Number(form.tuitionAmount).toLocaleString("fa-IR")} تومان`
                    : `${Number(form.tuitionAmount).toLocaleString()} Toman`}
                />
              )}
              {form.paymentStatus && (
                <SummaryItem
                  label={isRTL ? "وضعیت" : "Status"}
                  value={(() => {
                    const ps = PAYMENT_STATUSES.find((s) => s.value === form.paymentStatus);
                    return ps ? (isRTL ? ps.fa : ps.en) : form.paymentStatus;
                  })()}
                />
              )}
              {form.paymentDueDate && (
                <SummaryItem
                  label={isRTL ? "مهلت" : "Due"}
                  value={form.paymentDueDate}
                />
              )}
              {form.paymentRef && (
                <SummaryItem
                  label={isRTL ? "رسید" : "Ref"}
                  value={form.paymentRef}
                />
              )}
              {form.tags && (
                <SummaryItem
                  label={isRTL ? "تگ‌ها" : "Tags"}
                  value={form.tags}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Online registration notice for non-admin */}
      {!isAdminMode && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200/60 dark:border-emerald-800/30">
          <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {isRTL ? "ثبت‌نام آنلاین" : "Online Registration"}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-500">
              {isRTL
                ? "پس از ثبت‌نام، همکاران ما در اسرع وقت با شما تماس خواهند گرفت"
                : "After registration, our colleagues will contact you as soon as possible"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="space-y-0.5">
      <span className="text-muted-foreground">{label}</span>
      <p className="font-medium truncate">{value}</p>
    </div>
  );
}
