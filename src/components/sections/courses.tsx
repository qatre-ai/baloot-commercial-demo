"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuthStore } from "@/lib/auth/store";
import { cn } from "@/lib/utils";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { SectionReveal } from "@/components/ui/section-reveal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Clock, Layers, ArrowUpRight, Music, Guitar, Piano, Mic, Drum, Music2,
  CheckCircle2, Loader2, AlertCircle, User, Phone, Calendar,
  MapPin, Users, Star, Tag, X
} from "lucide-react";

// ============================================
// Types
// ============================================
interface CourseData {
  id: string;
  titleFa: string;
  titleEn: string;
  descriptionFa: string | null;
  descriptionEn: string | null;
  category: string | null;
  instrument: string | null;
  level: string;
  sessionsMin: number | null;
  sessionsMax: number | null;
  duration: string | null;
  price: number | null;
  imageUrl: string | null;
  coverUrl: string | null;
  isFeatured: boolean;
  isShowOnHome: boolean;
  isNew: boolean;
  isPublished: boolean;
  registrationOpen: boolean;
  maxCapacity: number | null;
  branch?: { nameFa: string; nameEn: string } | null;
  instructor?: { name: string; specialtyFa: string | null } | null;
  _count?: { enrollments: number };
}

// ============================================
// Fallback Data
// ============================================
const fallbackCourses = [
  {
    id: "piano",
    icon: Piano,
    nameFa: "پیانو",
    nameEn: "Piano",
    level: "beginner" as const,
    sessionsMin: 20,
    sessionsMax: 24,
    duration: "6 ماه",
    color: "from-primary/20 to-primary/5",
    iconBg: "bg-primary/15",
    popular: true,
  },
  {
    id: "guitar",
    icon: Guitar,
    nameFa: "گیتار",
    nameEn: "Guitar",
    level: "intermediate" as const,
    sessionsMin: 16,
    sessionsMax: 20,
    duration: "5 ماه",
    color: "from-gold/20 to-gold/5",
    iconBg: "bg-gold/15",
    popular: true,
  },
  {
    id: "violin",
    icon: Music2,
    nameFa: "ویلن",
    nameEn: "Violin",
    level: "advanced" as const,
    sessionsMin: 20,
    sessionsMax: 24,
    duration: "6 ماه",
    color: "from-primary/20 to-gold/5",
    iconBg: "bg-primary/15",
    popular: false,
  },
  {
    id: "vocals",
    icon: Mic,
    nameFa: "آواز",
    nameEn: "Vocals",
    level: "beginner" as const,
    sessionsMin: 14,
    sessionsMax: 18,
    duration: "4.5 ماه",
    color: "from-gold/20 to-primary/5",
    iconBg: "bg-gold/15",
    popular: true,
  },
  {
    id: "drums",
    icon: Drum,
    nameFa: "درامز",
    nameEn: "Drums",
    level: "intermediate" as const,
    sessionsMin: 16,
    sessionsMax: 20,
    duration: "5 ماه",
    color: "from-primary/20 to-primary/5",
    iconBg: "bg-primary/15",
    popular: false,
  },
  {
    id: "theory",
    icon: Music,
    nameFa: "تئوری موسیقی",
    nameEn: "Music Theory",
    level: "advanced" as const,
    sessionsMin: 12,
    sessionsMax: 16,
    duration: "4 ماه",
    color: "from-gold/20 to-gold/5",
    iconBg: "bg-gold/15",
    popular: false,
  },
];

// ============================================
// Helpers
// ============================================
function toPersianDigits(str: string | number): string {
  return String(str).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
}

function formatSessions(min: number | null, max: number | null, isRTL: boolean): string {
  if (min === null && max === null) return isRTL ? "متغیر" : "Variable";
  if (min !== null && max !== null && min !== max) {
    const formatted = `${min}-${max}`;
    return isRTL ? toPersianDigits(formatted) : formatted;
  }
  const val = min ?? max ?? 0;
  return isRTL ? toPersianDigits(String(val)) : String(val);
}

function formatPriceValue(price: number, isRTL: boolean): string {
  const formatted = price.toLocaleString();
  return isRTL ? toPersianDigits(formatted) : formatted;
}

// ============================================
// Course Detail / Registration Modal
// ============================================
function CourseDetailModal({ course, isOpen, onClose, isRTL }: {
  course: CourseData | null;
  isOpen: boolean;
  onClose: () => void;
  isRTL: boolean;
}) {
  const { isAuthenticated, user, setShowLoginModal } = useAuthStore();
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollResult, setEnrollResult] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");

  // Auto-fill user info when logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      setUserName(user.name || "");
      setUserPhone(user.phone || "");
    }
  }, [isAuthenticated, user]);

  // Reset state when course changes
  useEffect(() => {
    setEnrollResult("idle");
    setShowEnrollForm(false);
    setErrorMessage("");
  }, [course?.id]);

  if (!course) return null;

  const title = isRTL ? course.titleFa : course.titleEn;
  const description = isRTL ? course.descriptionFa : course.descriptionEn;
  const sessionsText = formatSessions(course.sessionsMin, course.sessionsMax, isRTL);
  const instructorName = course.instructor?.name;
  const branchName = course.branch ? (isRTL ? course.branch.nameFa : course.branch.nameEn) : null;

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      onClose();
      return;
    }

    setIsEnrolling(true);
    setEnrollResult("idle");
    try {
      const res = await fetch("/api/admin/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: user?.id,
          courseId: course.id,
          registrationMethod: "online",
          paymentStatus: "unpaid",
          tuitionAmount: course.price,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Enrollment failed");
      }

      setEnrollResult("success");
    } catch (err) {
      setEnrollResult("error");
      setErrorMessage((err as Error).message || (isRTL ? "خطا در ثبت‌نام" : "Failed to enroll"));
    } finally {
      setIsEnrolling(false);
    }
  };

  const levelLabels: Record<string, { fa: string; en: string }> = {
    beginner: { fa: "مبتدی", en: "Beginner" },
    intermediate: { fa: "متوسط", en: "Intermediate" },
    advanced: { fa: "پیشرفته", en: "Advanced" },
    all: { fa: "همه سطوح", en: "All Levels" },
  };
  const levelInfo = levelLabels[course.level] || levelLabels.all;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-background/95 backdrop-blur-2xl border-border/50">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[85vh]">
          {/* Header */}
          <div className="relative h-40 sm:h-48 bg-gradient-to-br from-primary/20 via-primary/10 to-gold/5">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 left-4 w-8 h-8 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center hover:bg-background/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Badges */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {course.isFeatured && (
                <Badge className="bg-gold/20 text-gold border-0 text-[10px] font-semibold">
                  <Star className="w-3 h-3 me-1" />
                  {isRTL ? "ویژه" : "Featured"}
                </Badge>
              )}
              {course.isNew && (
                <Badge className="bg-emerald-500/20 text-emerald-600 border-0 text-[10px] font-semibold">
                  {isRTL ? "جدید" : "New"}
                </Badge>
              )}
            </div>

            {/* Title */}
            <div className="absolute bottom-4 left-4 right-4">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">{title}</h2>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { icon: Layers, label: isRTL ? "جلسات" : "Sessions", value: sessionsText },
                { icon: Clock, label: isRTL ? "سطح" : "Level", value: isRTL ? levelInfo.fa : levelInfo.en },
                { icon: Users, label: isRTL ? "ظرفیت" : "Capacity", value: course.maxCapacity ? String(course.maxCapacity) : (isRTL ? "نامحدود" : "Unlimited") },
              ].map((item, i) => (
                <div key={i} className="text-center p-3 rounded-xl bg-muted/50">
                  <item.icon className="w-4 h-4 mx-auto text-primary mb-1" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                  <p className="text-xs font-semibold text-foreground mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Registration Status */}
            <div className={cn(
              "flex items-center gap-2 px-3 py-2.5 rounded-xl border",
              course.registrationOpen
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                : "bg-destructive/10 border-destructive/20 text-destructive"
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full",
                course.registrationOpen ? "bg-emerald-500 animate-pulse" : "bg-destructive"
              )} />
              <span className="text-xs font-medium">
                {course.registrationOpen
                  ? (isRTL ? "ثبت‌نام باز است" : "Registration Open")
                  : (isRTL ? "ثبت‌نام بسته است" : "Registration Closed")
                }
              </span>
            </div>

            {/* Instructor */}
            {instructorName && (
              <div className={cn("flex items-center gap-3 p-3 rounded-xl bg-muted/30", isRTL && "flex-row-reverse")}>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className={cn(isRTL && "text-right")}>
                  <p className="text-xs text-muted-foreground">{isRTL ? "مدرس" : "Instructor"}</p>
                  <p className="text-sm font-semibold text-foreground">{instructorName}</p>
                </div>
              </div>
            )}

            {/* Description */}
            {description && (
              <p className={cn("text-sm text-muted-foreground leading-relaxed", isRTL && "text-right")}>
                {description}
              </p>
            )}

            {/* Price */}
            {course.price != null && course.price > 0 && (
              <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <Tag className="w-4 h-4 text-gold" />
                <span className="text-sm text-muted-foreground">{isRTL ? "شهریه: " : "Tuition: "}</span>
                <span className="text-lg font-bold text-foreground">
                  {formatPriceValue(course.price, isRTL)}
                  <span className="text-xs text-muted-foreground font-normal me-1">{isRTL ? "تومان" : "Toman"}</span>
                </span>
              </div>
            )}

            {/* Enrollment Section */}
            {enrollResult === "success" ? (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20"
              >
                <div className="flex items-center gap-3 mb-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </motion.div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      {isRTL ? "ثبت‌نام شما با موفقیت انجام شد" : "Registration Successful"}
                    </h4>
                    <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                      {isRTL ? "و به زودی همکاران ما با شما تماس خواهند گرفت" : "Our colleagues will contact you soon"}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70 space-y-1">
                  <p>{isRTL ? "نام: " : "Name: "}{userName}</p>
                  {userPhone && <p>{isRTL ? "شماره تماس: " : "Phone: "}{isRTL ? toPersianDigits(userPhone) : userPhone}</p>}
                  <p className="mt-2">{isRTL ? "دوره: " : "Course: "}{title}</p>
                </div>
              </motion.div>
            ) : (
              <>
                {showEnrollForm && isAuthenticated ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 rounded-xl bg-muted/30 border border-border/30 space-y-3">
                      <h4 className={cn("text-sm font-semibold text-foreground flex items-center gap-2", isRTL && "flex-row-reverse")}>
                        <User className="w-4 h-4 text-primary" />
                        {isRTL ? "اطلاعات ثبت‌نام" : "Enrollment Info"}
                      </h4>

                      <div className="grid grid-cols-2 gap-3">
                        <div className={cn("space-y-1", isRTL && "text-right")}>
                          <label className="text-[11px] text-muted-foreground font-medium">
                            {isRTL ? "نام و نام خانوادگی" : "Full Name"}
                          </label>
                          <div className="px-3 py-2 rounded-lg bg-background/60 border border-border/30 text-sm text-foreground">
                            {userName}
                          </div>
                        </div>
                        <div className={cn("space-y-1", isRTL && "text-right")}>
                          <label className="text-[11px] text-muted-foreground font-medium">
                            {isRTL ? "شماره تماس" : "Phone"}
                          </label>
                          <div className="px-3 py-2 rounded-lg bg-background/60 border border-border/30 text-sm text-foreground" dir="ltr">
                            {userPhone ? (isRTL ? toPersianDigits(userPhone) : userPhone) : (isRTL ? "ثبت نشده" : "Not set")}
                          </div>
                        </div>
                      </div>

                      <p className="text-[11px] text-muted-foreground/70">
                        {isRTL
                          ? "پس از ثبت‌نام، همکاران ما برای هماهنگی و پرداخت شهریه با شما تماس خواهند گرفت"
                          : "After enrollment, our team will contact you for coordination and tuition payment"
                        }
                      </p>

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          onClick={handleEnroll}
                          disabled={isEnrolling || !course.registrationOpen}
                          className="rounded-full px-5 bg-primary hover:bg-primary/90 text-primary-foreground flex-1"
                          size="sm"
                        >
                          {isEnrolling ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 me-1.5" />
                              {isRTL ? "تایید ثبت‌نام" : "Confirm Enrollment"}
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowEnrollForm(false)}
                          className="rounded-full px-4"
                          size="sm"
                          disabled={isEnrolling}
                        >
                          {isRTL ? "انصراف" : "Cancel"}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <Button
                    onClick={() => {
                      if (!isAuthenticated) {
                        setShowLoginModal(true);
                        onClose();
                        return;
                      }
                      setShowEnrollForm(true);
                    }}
                    disabled={!course.registrationOpen}
                    className={cn(
                      "rounded-full px-6 shadow-lg transition-all duration-300 w-full",
                      !course.registrationOpen
                        ? "bg-muted text-muted-foreground cursor-not-allowed shadow-none"
                        : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/25"
                    )}
                    size="lg"
                  >
                    {!course.registrationOpen ? (
                      isRTL ? "ثبت‌نام بسته است" : "Registration Closed"
                    ) : !isAuthenticated ? (
                      <>
                        <ArrowUpRight className={cn("w-4 h-4 me-2", isRTL && "rotate-180")} />
                        {isRTL ? "ورود و ثبت‌نام" : "Login & Enroll"}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 me-2" />
                        {isRTL ? "ثبت‌نام در دوره" : "Enroll Now"}
                      </>
                    )}
                  </Button>
                )}

                {enrollResult === "error" && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Main Courses Section
// ============================================
type LevelFilter = "all" | "beginner" | "intermediate" | "advanced";

export function CoursesSection() {
  const { t, isRTL, locale } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeFilter, setActiveFilter] = useState<LevelFilter>("all");
  const [apiCourses, setApiCourses] = useState<CourseData[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const INITIAL_COURSE_LIMIT = 6;

  // Fetch courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch("/api/courses");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setApiCourses(data);
          }
        }
      } catch {
        // Use fallback data
      }
    };
    fetchCourses();
  }, []);

  const openDetail = useCallback((course: CourseData) => {
    setSelectedCourse(course);
    setIsDetailOpen(true);
  }, []);

  const filters: { key: LevelFilter; label: string }[] = [
    { key: "all", label: isRTL ? "همه" : "All" },
    { key: "beginner", label: t.courses.beginner },
    { key: "intermediate", label: t.courses.intermediate },
    { key: "advanced", label: t.courses.advanced },
  ];

  // Use API courses if available, otherwise fallback
  const isUsingApi = apiCourses.length > 0;

  return (
    <section id="courses" ref={ref} className="py-20 sm:py-28 relative bg-muted/30">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <SectionReveal animation="fade-up" delay={0}>
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase mb-4">
              {t.courses.tag}
            </span>
          </SectionReveal>
          <SectionReveal animation="fade-up" delay={0.1}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
              {t.courses.title}
            </h2>
          </SectionReveal>
          <SectionReveal animation="fade-up" delay={0.2}>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {t.courses.description}
            </p>
          </SectionReveal>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-2 mb-8 sm:mb-12"
        >
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                activeFilter === filter.key
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-card hover:bg-primary/10 text-muted-foreground hover:text-primary border border-border/50"
              )}
            >
              {filter.label}
            </button>
          ))}
        </motion.div>

        {/* Course Cards Grid */}
        {isUsingApi ? (
          // API-fetched courses
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {apiCourses
              .filter(c => activeFilter === "all" || c.level === activeFilter)
              .slice(0, showAll ? undefined : INITIAL_COURSE_LIMIT)
              .map((course, index) => {
                const title = isRTL ? course.titleFa : course.titleEn;
                const sessionsText = formatSessions(course.sessionsMin, course.sessionsMax, isRTL);
                const levelLabels: Record<string, { fa: string; en: string }> = {
                  beginner: { fa: "مبتدی", en: "Beginner" },
                  intermediate: { fa: "متوسط", en: "Intermediate" },
                  advanced: { fa: "پیشرفته", en: "Advanced" },
                  all: { fa: "همه سطوح", en: "All Levels" },
                };
                const levelInfo = levelLabels[course.level] || levelLabels.all;

                return (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  >
                    <Card
                      className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                      onClick={() => openDetail(course)}
                    >
                      <div className={cn(
                        "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                        index % 2 === 0 ? "from-primary/20 to-primary/5" : "from-gold/20 to-gold/5"
                      )} />

                      <CardContent className="relative p-6">
                        {/* Top Row: Icon + Badges */}
                        <div className="flex items-start justify-between mb-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center",
                            index % 2 === 0 ? "bg-primary/15" : "bg-gold/15"
                          )}>
                            <Music className={cn("w-6 h-6", index % 2 === 0 ? "text-primary" : "text-gold")} />
                          </div>
                          <div className="flex items-center gap-1.5">
                            {course.isFeatured && (
                              <Badge className="bg-gold/20 text-gold border-0 text-[10px]">
                                <Star className="w-2.5 h-2.5 me-0.5" />
                                {isRTL ? "ویژه" : "Featured"}
                              </Badge>
                            )}
                            {course.isNew && (
                              <Badge className="bg-emerald-500/20 text-emerald-600 border-0 text-[10px]">
                                {isRTL ? "جدید" : "New"}
                              </Badge>
                            )}
                            {course.registrationOpen && (
                              <Badge className="bg-emerald-500/15 text-emerald-600 border-0 text-[10px]">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 me-1 animate-pulse" />
                                {isRTL ? "ثبت‌نام" : "Open"}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                          {title}
                        </h3>

                        {/* Info Row */}
                        <div className={cn("flex items-center gap-3 text-xs text-muted-foreground mb-4", isRTL && "flex-row-reverse")}>
                          <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5" />
                            {sessionsText} {isRTL ? "جلسه" : "sessions"}
                          </span>
                          {course.price != null && course.price > 0 && (
                            <span className="flex items-center gap-1">
                              <Tag className="w-3.5 h-3.5" />
                              {formatPriceValue(course.price, isRTL)} {isRTL ? "تومان" : "Toman"}
                            </span>
                          )}
                        </div>

                        {/* Bottom Row */}
                        <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                          <Badge variant="secondary" className="text-xs">
                            {isRTL ? levelInfo.fa : levelInfo.en}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="group/btn text-primary hover:text-primary hover:bg-primary/10 rounded-full px-3"
                            disabled={!course.registrationOpen}
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetail(course);
                            }}
                          >
                            {course.registrationOpen ? t.courses.register : (isRTL ? "بسته" : "Closed")}
                            <ArrowUpRight className={cn(
                              "w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5",
                              "ms-1",
                              isRTL && "rotate-180"
                            )} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
          </div>
        ) : (
          // Fallback hardcoded courses
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {fallbackCourses
              .filter(c => activeFilter === "all" || c.level === activeFilter)
              .slice(0, showAll ? undefined : INITIAL_COURSE_LIMIT)
              .map((course, index) => {
              const Icon = course.icon;
              const sessionsText = formatSessions(course.sessionsMin, course.sessionsMax, isRTL);
              const levelLabels: Record<string, { fa: string; en: string }> = {
                beginner: { fa: "مبتدی", en: "Beginner" },
                intermediate: { fa: "متوسط", en: "Intermediate" },
                advanced: { fa: "پیشرفته", en: "Advanced" },
                all: { fa: "همه سطوح", en: "All Levels" },
              };
              const levelInfo = levelLabels[course.level] || levelLabels.all;
              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                >
                  <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none">
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                      course.color
                    )} />

                    <CardContent className="relative p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", course.iconBg)}>
                          <Icon className={cn(
                            "w-6 h-6",
                            course.popular ? "text-primary" : "text-gold"
                          )} />
                        </div>
                        {course.popular && (
                          <Badge className="bg-gold/20 text-gold border-0 text-[10px]">
                            <Star className="w-2.5 h-2.5 me-0.5" />
                            {isRTL ? "محبوب" : "Popular"}
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                        {isRTL ? course.nameFa : course.nameEn}
                      </h3>

                      <div className={cn("flex items-center gap-3 text-xs text-muted-foreground mb-4", isRTL && "flex-row-reverse")}>
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5" />
                          {sessionsText} {isRTL ? "جلسه" : "sessions"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {course.duration}
                        </span>
                      </div>

                      <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                        <Badge variant="secondary" className="text-xs">
                          {isRTL ? levelInfo.fa : levelInfo.en}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="group/btn text-primary hover:text-primary hover:bg-primary/10 rounded-full px-3"
                        >
                          {t.courses.register}
                          <ArrowUpRight className={cn(
                            "w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5",
                            "ms-1",
                            isRTL && "rotate-180"
                          )} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* View All / Show Less Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1 }}
          className="text-center mt-10"
        >
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              setShowAll((prev) => !prev);
              if (showAll) {
                ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
            className="rounded-full px-8 border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all duration-300"
          >
            {showAll
              ? (isRTL ? "نمایش کمتر" : "Show Less")
              : t.courses.view_all
            }
          </Button>
        </motion.div>
      </div>

      {/* Course Detail Modal */}
      <CourseDetailModal
        course={selectedCourse}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        isRTL={isRTL}
      />
    </section>
  );
}
