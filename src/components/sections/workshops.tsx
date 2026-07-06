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
  Calendar, Users, ArrowUpLeft, Flame, Clock, MapPin,
  GraduationCap, DollarSign, Ticket, Sparkles, CheckCircle2,
  Loader2, AlertCircle, ChevronLeft, ChevronRight, X, Music,
  Mic, Pen, Settings, Headphones, Bell, Crown, Phone, Info,
  Tag, Timer, MapPinned, CircleCheck, ListChecks, User
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

// ============================================
// Types
// ============================================
interface WorkshopData {
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
  branch?: { nameFa: string; nameEn: string; addressFa?: string; addressEn?: string } | null;
  branchId?: string | null;
}

// ============================================
// Category config
// ============================================
const categoryConfig: Record<string, { gradient: string; iconColor: string; bgAccent: string }> = {
  improvisation: { gradient: "from-primary/25 via-primary/10 to-gold/5", iconColor: "text-primary", bgAccent: "bg-primary/10" },
  vocal: { gradient: "from-gold/20 via-gold/10 to-primary/5", iconColor: "text-gold", bgAccent: "bg-gold/10" },
  composition: { gradient: "from-primary/20 via-gold/10 to-primary/5", iconColor: "text-primary", bgAccent: "bg-primary/10" },
  production: { gradient: "from-gold/20 via-primary/10 to-gold/5", iconColor: "text-gold", bgAccent: "bg-gold/10" },
  technique: { gradient: "from-primary/20 via-primary/10 to-gold/5", iconColor: "text-primary", bgAccent: "bg-primary/10" },
  theory: { gradient: "from-gold/20 via-gold/5 to-primary/5", iconColor: "text-gold", bgAccent: "bg-gold/10" },
  masterclass: { gradient: "from-primary/25 via-gold/10 to-primary/5", iconColor: "text-primary", bgAccent: "bg-primary/15" },
};

const defaultCategory = categoryConfig.composition;

// ============================================
// Coming Soon Category Teasers
// ============================================
const comingSoonCategories = [
  { key: "improvisation", icon: Music, labelFa: "بداهه‌نوازی", labelEn: "Improvisation", gradient: "from-primary/20 via-primary/5 to-gold/10", iconColor: "text-primary" },
  { key: "vocal", icon: Mic, labelFa: "آواز", labelEn: "Vocal", gradient: "from-gold/20 via-gold/5 to-primary/10", iconColor: "text-gold" },
  { key: "composition", icon: Sparkles, labelFa: "آهنگسازی", labelEn: "Composition", gradient: "from-oak-green/20 via-oak-green/5 to-gold/10", iconColor: "text-oak-green" },
  { key: "masterclass", icon: Crown, labelFa: "مسترکلاس", labelEn: "Masterclass", gradient: "from-primary/25 via-gold/10 to-primary/5", iconColor: "text-primary" },
  { key: "technique", icon: Settings, labelFa: "تکنیک", labelEn: "Technique", gradient: "from-gold/15 via-primary/10 to-gold/5", iconColor: "text-gold" },
  { key: "production", icon: Headphones, labelFa: "تولید موسیقی", labelEn: "Production", gradient: "from-primary/15 via-gold/10 to-primary/10", iconColor: "text-primary" },
];

// ============================================
// Helper: Format time to Persian or English display
// ============================================
function formatTimeRange(startTime: string | null, endTime: string | null, isRTL: boolean): string | null {
  if (!startTime && !endTime) return null;
  if (startTime && endTime) {
    return isRTL
      ? `${toPersianDigits(startTime)} - ${toPersianDigits(endTime)}`
      : `${startTime} - ${endTime}`;
  }
  const t = startTime || endTime;
  return isRTL ? toPersianDigits(t!) : t!;
}

function toPersianDigits(str: string): string {
  return str.replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
}

function formatPriceValue(price: number, isRTL: boolean): string {
  const formatted = price.toLocaleString();
  return isRTL ? toPersianDigits(formatted) : formatted;
}

function getDeadlineUrgency(deadline: string): "urgent" | "warning" | "normal" {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffMs = deadlineDate.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays <= 2) return "urgent";
  if (diffDays <= 7) return "warning";
  return "normal";
}

// ============================================
// Workshop Detail / Purchase Modal
// ============================================
function WorkshopDetailModal({ workshop, isOpen, onClose, isRTL }: {
  workshop: WorkshopData | null;
  isOpen: boolean;
  onClose: () => void;
  isRTL: boolean;
}) {
  const { isAuthenticated, user, setShowLoginModal } = useAuthStore();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [reservationNotes, setReservationNotes] = useState("");
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");

  useEffect(() => { setMounted(true); }, []);

  // Auto-fill user info when logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      setUserName(user.name || "");
      setUserPhone(user.phone || "");
    }
  }, [isAuthenticated, user]);

  // Reset state when workshop changes
  useEffect(() => {
    setPurchaseResult("idle");
    setShowReservationForm(false);
    setReservationNotes("");
    setErrorMessage("");
  }, [workshop?.id]);

  if (!workshop) return null;

  const availableSeats = workshop.totalSeats - workshop.reservedSeats;
  const seatPercentage = Math.round((workshop.reservedSeats / workshop.totalSeats) * 100);
  const isLowSeats = availableSeats <= 10;
  const isSoldOut = availableSeats <= 0;
  const catConfig = categoryConfig[workshop.category || ""] || defaultCategory;

  const title = isRTL ? workshop.titleFa : workshop.titleEn;
  const description = isRTL ? workshop.descriptionFa : workshop.descriptionEn;
  const instructor = isRTL ? workshop.instructorFa : workshop.instructorEn;
  const location = workshop.locationFa || workshop.locationEn
    ? (isRTL ? workshop.locationFa : workshop.locationEn)
    : workshop.branch
      ? (isRTL ? workshop.branch.nameFa : workshop.branch.nameEn)
      : null;
  const highlights = isRTL ? workshop.highlightsFa : workshop.highlightsEn;
  const requirements = isRTL ? workshop.requirementsFa : workshop.requirementsEn;
  const contactPhone = workshop.contactPhone;
  const hasDiscount = workshop.discountPrice != null && workshop.price != null && workshop.discountPrice < workshop.price;
  const displayPrice = hasDiscount ? workshop.discountPrice! : workshop.price;
  const savings = hasDiscount ? workshop.price! - workshop.discountPrice! : 0;
  const timeRange = formatTimeRange(workshop.startTime, workshop.endTime, isRTL);
  const highlightsList = highlights ? highlights.split(",").map(h => h.trim()).filter(Boolean) : [];
  const requirementsList = requirements ? requirements.split(",").map(r => r.trim()).filter(Boolean) : [];
  const registrationDeadline = workshop.registrationDeadline;

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      onClose();
      return;
    }

    setIsPurchasing(true);
    setPurchaseResult("idle");
    try {
      const res = await fetch(`/api/workshops/${workshop.id}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: reservationNotes }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Reservation failed");
      }

      setPurchaseResult("success");
    } catch (err) {
      setPurchaseResult("error");
      setErrorMessage((err as Error).message || (isRTL ? "خطا در رزرو" : "Failed to reserve"));
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-background/95 backdrop-blur-2xl border-border/50">
        {/* Accessible title - visually hidden since title is shown in the modal header */}
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[85vh]">
          {/* Cover Image / Gradient Header */}
          <div className={cn("relative h-48 sm:h-56 bg-gradient-to-br", catConfig.gradient)}>
            {workshop.coverUrl ? (
              <img src={workshop.coverUrl} alt={title} className="w-full h-full object-cover opacity-30" />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

            {/* Badges */}
            <div className={cn("absolute top-4 flex items-center gap-2", isRTL ? "right-4" : "left-4")}>
              {workshop.isHot && (
                <Badge className="bg-destructive text-white border-0 text-[10px] font-semibold shadow-md flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  {isRTL ? "پرطرفدار" : "Hot"}
                </Badge>
              )}
              {hasDiscount && (
                <Badge className="bg-emerald-500 text-white border-0 text-[10px] font-semibold shadow-md flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {isRTL ? "تخفیف" : "Discount"}
                </Badge>
              )}
              {workshop.category && (
                <Badge className="bg-primary/20 text-primary border-0 text-[10px] font-semibold backdrop-blur-sm">
                  <GraduationCap className="w-3 h-3 me-1" />
                  {isRTL ? workshop.category : workshop.category}
                </Badge>
              )}
            </div>

            {/* Time badge */}
            {timeRange && (
              <div className={cn("absolute top-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/60 backdrop-blur-md border border-border/30", isRTL ? "left-4" : "right-4")}>
                <Clock className="w-3 h-3 text-gold" />
                <span className="text-[11px] font-semibold text-foreground">{timeRange}</span>
              </div>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className={cn("absolute top-4 w-8 h-8 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center hover:bg-background/80 transition-colors", timeRange ? (isRTL ? "left-16" : "right-16") : (isRTL ? "left-4" : "right-4"))}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Title overlay at bottom */}
            <div className="absolute bottom-4 left-4 right-4">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">{title}</h2>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* Quick Info Grid - 4 items */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Calendar, label: isRTL ? "تاریخ" : "Date", value: mounted ? new Date(workshop.date).toLocaleDateString(isRTL ? "fa-IR" : "en-US", { month: "long", day: "numeric" }) : new Date(workshop.date).toISOString().split('T')[0] },
                { icon: Clock, label: isRTL ? "زمان" : "Time", value: timeRange || (isRTL ? "به زودی" : "TBA") },
                { icon: MapPin, label: isRTL ? "مکان" : "Location", value: location || (isRTL ? "به زودی" : "TBA") },
                { icon: Users, label: isRTL ? "ظرفیت" : "Seats", value: `${isRTL ? toPersianDigits(String(availableSeats)) : availableSeats}/${isRTL ? toPersianDigits(String(workshop.totalSeats)) : workshop.totalSeats}` },
              ].map((item, i) => (
                <div key={i} className="text-center p-3 rounded-xl bg-muted/50">
                  <item.icon className="w-4 h-4 mx-auto text-primary mb-1" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                  <p className="text-xs font-semibold text-foreground mt-0.5 line-clamp-1">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Registration Deadline */}
            {registrationDeadline && mounted && (
              <div className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-xl border",
                getDeadlineUrgency(registrationDeadline) === "urgent"
                  ? "bg-destructive/10 border-destructive/20 text-destructive"
                  : getDeadlineUrgency(registrationDeadline) === "warning"
                    ? "bg-gold/10 border-gold/20 text-gold"
                    : "bg-muted/50 border-border/30 text-muted-foreground"
              )}>
                <Timer className="w-4 h-4 shrink-0" />
                <span className="text-xs font-medium">
                  {isRTL ? "آخرین مهلت ثبت‌نام: " : "Registration Deadline: "}
                  {new Date(registrationDeadline).toLocaleDateString(isRTL ? "fa-IR" : "en-US", { month: "long", day: "numeric", year: "numeric" })}
                </span>
                {getDeadlineUrgency(registrationDeadline) === "urgent" && (
                  <Badge className="bg-destructive/20 text-destructive border-0 text-[10px] ms-auto">
                    {isRTL ? "فوری" : "Urgent"}
                  </Badge>
                )}
              </div>
            )}

            {/* Instructor */}
            <div className={cn("flex items-center gap-3 p-3 rounded-xl bg-muted/30", isRTL && "flex-row-reverse")}>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <div className={cn(isRTL && "text-right")}>
                <p className="text-xs text-muted-foreground">{isRTL ? "مدرس" : "Instructor"}</p>
                <p className="text-sm font-semibold text-foreground">{instructor}</p>
              </div>
            </div>

            {/* Description */}
            {description && (
              <p className={cn("text-sm text-muted-foreground leading-relaxed", isRTL && "text-right")}>
                {description}
              </p>
            )}

            {/* Highlights Section */}
            {highlightsList.length > 0 && (
              <div className="space-y-2.5">
                <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                  <Sparkles className="w-4 h-4 text-gold" />
                  <h4 className="text-sm font-semibold text-foreground">
                    {isRTL ? "نکات کلیدی" : "Key Highlights"}
                  </h4>
                </div>
                <div className="space-y-1.5">
                  {highlightsList.map((highlight, i) => (
                    <div key={i} className={cn("flex items-start gap-2.5", isRTL && "flex-row-reverse")}>
                      <CircleCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className={cn("text-sm text-muted-foreground", isRTL && "text-right")}>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements Section */}
            {requirementsList.length > 0 && (
              <div className="space-y-2.5">
                <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                  <ListChecks className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">
                    {isRTL ? "پیش‌نیازها" : "Prerequisites"}
                  </h4>
                </div>
                <div className="space-y-1.5">
                  {requirementsList.map((req, i) => (
                    <div key={i} className={cn("flex items-start gap-2.5", isRTL && "flex-row-reverse")}>
                      <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <span className={cn("text-sm text-muted-foreground", isRTL && "text-right")}>{req}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location & Contact Section */}
            {(location || contactPhone) && (
              <div className="space-y-2.5">
                <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                  <MapPinned className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">
                    {isRTL ? "مکان و ارتباط" : "Location & Contact"}
                  </h4>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 space-y-2">
                  {location && (
                    <div className={cn("flex items-start gap-2.5", isRTL && "flex-row-reverse")}>
                      <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span className={cn("text-sm text-muted-foreground", isRTL && "text-right")}>{location}</span>
                    </div>
                  )}
                  {contactPhone && (
                    <div className={cn("flex items-center gap-2.5", isRTL && "flex-row-reverse")}>
                      <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground" dir="ltr">{isRTL ? toPersianDigits(contactPhone) : contactPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Seat Availability */}
            <div className="space-y-2">
              <div className={cn("flex items-center justify-between text-xs", isRTL && "flex-row-reverse")}>
                <span className={cn("font-medium flex items-center gap-1", isLowSeats ? "text-destructive" : "text-muted-foreground")}>
                  {isLowSeats && <Flame className="w-3 h-3" />}
                  {isSoldOut
                    ? (isRTL ? "فروخته شده" : "Sold Out")
                    : (isRTL ? `${toPersianDigits(String(availableSeats))} صندلی باقی‌مانده` : `${availableSeats} seats left`)
                  }
                </span>
                <span className="text-muted-foreground">{isRTL ? toPersianDigits(String(seatPercentage)) : seatPercentage}% {isRTL ? "پر" : "filled"}</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${seatPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={cn("h-full rounded-full", isSoldOut ? "bg-destructive" : isLowSeats ? "bg-gradient-to-l from-destructive to-gold" : "bg-gradient-to-l from-primary to-gold")}
                />
              </div>
            </div>

            {/* Price & Reservation */}
            {purchaseResult === "success" ? (
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
                  <p className="mt-2">{isRTL ? "کارگاه: " : "Workshop: "}{title}</p>
                </div>
              </motion.div>
            ) : (
              <>
                {/* Price Display */}
                <div className={cn("flex items-center justify-between pt-2", isRTL && "flex-row-reverse")}>
                  <div>
                    <span className="text-xs text-muted-foreground">{isRTL ? "هزینه شرکت" : "Entry Fee"}</span>
                    <div className="flex items-baseline gap-2">
                      {hasDiscount && workshop.price != null && (
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPriceValue(workshop.price, isRTL)}
                        </span>
                      )}
                      <span className="text-2xl font-bold text-foreground">
                        {displayPrice ? formatPriceValue(displayPrice, isRTL) : (isRTL ? "رایگان" : "Free")}
                        {displayPrice ? <span className="text-sm text-muted-foreground font-normal me-1">{isRTL ? "تومان" : "Toman"}</span> : null}
                      </span>
                    </div>
                    {hasDiscount && savings > 0 && (
                      <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                        <Tag className="w-3 h-3" />
                        {isRTL
                          ? `صرفه‌جویی: ${formatPriceValue(savings, isRTL)} تومان`
                          : `Save: ${savings.toLocaleString()} Toman`
                        }
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={() => {
                      if (!isAuthenticated) {
                        setShowLoginModal(true);
                        onClose();
                        return;
                      }
                      setShowReservationForm(true);
                    }}
                    disabled={isSoldOut}
                    className={cn(
                      "rounded-full px-6 shadow-lg transition-all duration-300",
                      isSoldOut
                        ? "bg-muted text-muted-foreground cursor-not-allowed shadow-none"
                        : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/25 hover:shadow-primary/40"
                    )}
                    size="lg"
                  >
                    {isSoldOut ? (
                      isRTL ? "ظرفیت تکمیل" : "Sold Out"
                    ) : !isAuthenticated ? (
                      <>
                        <LogInIcon className="w-4 h-4 me-2" />
                        {isRTL ? "ورود و رزرو" : "Login & Reserve"}
                      </>
                    ) : (
                      <>
                        <Ticket className="w-4 h-4 me-2" />
                        {isRTL ? "رزرو جایگاه" : "Reserve Seat"}
                      </>
                    )}
                  </Button>
                </div>

                {/* Reservation Form (shown when user clicks Reserve) */}
                <AnimatePresence>
                  {showReservationForm && isAuthenticated && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 rounded-xl bg-muted/30 border border-border/30 space-y-3 mt-3">
                        <h4 className={cn("text-sm font-semibold text-foreground flex items-center gap-2", isRTL && "flex-row-reverse")}>
                          <User className="w-4 h-4 text-primary" />
                          {isRTL ? "اطلاعات رزرو" : "Reservation Info"}
                        </h4>

                        {/* Auto-filled user info */}
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

                        {/* Notes field */}
                        <div className={cn("space-y-1", isRTL && "text-right")}>
                          <label className="text-[11px] text-muted-foreground font-medium">
                            {isRTL ? "یادداشت (اختیاری)" : "Notes (optional)"}
                          </label>
                          <textarea
                            value={reservationNotes}
                            onChange={(e) => setReservationNotes(e.target.value)}
                            placeholder={isRTL ? "اگر سوال یا توضیحی دارید بنویسید..." : "Any questions or notes..."}
                            className="w-full px-3 py-2 rounded-lg bg-background/60 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                            rows={2}
                          />
                        </div>

                        <p className="text-[11px] text-muted-foreground/70">
                          {isRTL
                            ? "با ثبت رزرو، همکاران ما برای هماهنگی نهایی با شما تماس خواهند گرفت"
                            : "After reserving, our team will contact you for final coordination"
                          }
                        </p>

                        {/* Confirm & Cancel buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            onClick={handlePurchase}
                            disabled={isPurchasing}
                            className="rounded-full px-5 bg-primary hover:bg-primary/90 text-primary-foreground flex-1"
                            size="sm"
                          >
                            {isPurchasing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4 me-1.5" />
                                {isRTL ? "تایید رزرو" : "Confirm Reservation"}
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowReservationForm(false)}
                            className="rounded-full px-4"
                            size="sm"
                            disabled={isPurchasing}
                          >
                            {isRTL ? "انصراف" : "Cancel"}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error message */}
                {purchaseResult === "error" && (
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

// Helper component for the button above
function LogInIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
    </svg>
  );
}

// ============================================
// Main Workshops Section
// ============================================
export function WorkshopsSection() {
  const { t, isRTL, locale } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [workshops, setWorkshops] = useState<WorkshopData[]>([]);
  const [selectedWorkshop, setSelectedWorkshop] = useState<WorkshopData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  // Fetch workshops from API
  useEffect(() => {
    const fetchWorkshops = async () => {
      try {
        const res = await fetch("/api/workshops");
        if (res.ok) {
          const data = await res.json();
          setWorkshops(data);
        }
      } catch {
        // Use fallback data
        setWorkshops(fallbackWorkshops);
      }
    };
    fetchWorkshops();
  }, []);

  const openDetail = useCallback((ws: WorkshopData) => {
    setSelectedWorkshop(ws);
    setIsDetailOpen(true);
  }, []);

  const workshopList = workshops.length > 0 ? workshops : fallbackWorkshops;
  // Use a fixed reference date to avoid hydration mismatch between server and client
  // After mount, use real current date for accurate filtering
  const referenceDate = mounted ? new Date() : new Date("2025-03-01");
  const filteredUpcoming = workshopList.filter(w => new Date(w.date) >= referenceDate);
  const filteredPast = workshopList.filter(w => new Date(w.date) < referenceDate);

  return (
    <section id="workshops" ref={ref} className="py-20 sm:py-28 relative">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/3 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <SectionReveal animation="fade-up" delay={0}>
            <span className="inline-block px-3 py-1 rounded-full bg-gold/15 text-gold text-xs font-semibold tracking-wide uppercase mb-4">
              {t.workshops.tag}
            </span>
          </SectionReveal>
          <SectionReveal animation="fade-up" delay={0.1}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
              {t.workshops.title}
            </h2>
          </SectionReveal>
          <SectionReveal animation="fade-up" delay={0.2}>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {t.workshops.description}
            </p>
          </SectionReveal>
        </div>

        {/* Workshop Cards / Empty State */}
        {filteredUpcoming.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredUpcoming.map((workshop, index) => {
            const availableSeats = workshop.totalSeats - workshop.reservedSeats;
            const seatPercentage = Math.round((workshop.reservedSeats / workshop.totalSeats) * 100);
            const isLowSeats = availableSeats <= 10;
            const isSoldOut = availableSeats <= 0;
            const catConfig = categoryConfig[workshop.category || ""] || defaultCategory;
            const title = isRTL ? workshop.titleFa : workshop.titleEn;
            const instructor = isRTL ? workshop.instructorFa : workshop.instructorEn;
            const location = workshop.locationFa || workshop.locationEn
              ? (isRTL ? workshop.locationFa : workshop.locationEn)
              : workshop.branch
                ? (isRTL ? workshop.branch.nameFa : workshop.branch.nameEn)
                : null;
            const timeRange = formatTimeRange(workshop.startTime, workshop.endTime, isRTL);
            const hasDiscount = workshop.discountPrice != null && workshop.price != null && workshop.discountPrice < workshop.price;
            const displayPrice = hasDiscount ? workshop.discountPrice! : workshop.price;
            const highlights = isRTL ? workshop.highlightsFa : workshop.highlightsEn;
            const highlightsList = highlights ? highlights.split(",").map(h => h.trim()).filter(Boolean).slice(0, 3) : [];
            const registrationDeadline = workshop.registrationDeadline;

            return (
              <motion.div
                key={workshop.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.15 }}
              >
                <Card
                  className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:border-gold/40 transition-all duration-500 hover:shadow-2xl hover:shadow-gold/10 hover:-translate-y-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                  onClick={() => openDetail(workshop)}
                >
                  {/* Cover Image / Gradient */}
                  <div className={cn("relative h-48 sm:h-52 bg-gradient-to-br overflow-hidden", catConfig.gradient)}>
                    {workshop.coverUrl && (
                      <img src={workshop.coverUrl} alt={title} className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
                    )}

                    {/* Animated overlay on hover */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500"
                    />

                    {/* Hot Badge */}
                    {workshop.isHot && (
                      <div className="absolute top-4 right-4 z-10">
                        <Badge className="bg-destructive text-white border-0 text-[10px] font-semibold shadow-md flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          {isRTL ? "پرطرفدار" : "Hot"}
                        </Badge>
                      </div>
                    )}

                    {/* Discount Badge */}
                    {hasDiscount && (
                      <div className="absolute top-4 left-4 z-10">
                        <Badge className="bg-emerald-500 text-white border-0 text-[10px] font-semibold shadow-md flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {isRTL ? "تخفیف" : "Discount"}
                        </Badge>
                      </div>
                    )}

                    {/* Category Badge (only if no discount badge is shown in that spot) */}
                    {workshop.category && !hasDiscount && (
                      <div className="absolute top-4 left-4 z-10">
                        <Badge className={cn("border-0 text-[10px] font-semibold backdrop-blur-sm", catConfig.bgAccent, "text-foreground/80")}>
                          <GraduationCap className="w-3 h-3 me-1" />
                          {isRTL ? workshop.category : workshop.category.charAt(0).toUpperCase() + workshop.category.slice(1)}
                        </Badge>
                      </div>
                    )}

                    {/* Time badge overlay */}
                    {timeRange && (
                      <div className={cn(
                        "absolute bottom-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/60 backdrop-blur-md border border-border/30",
                        isRTL ? "left-3" : "right-3"
                      )}>
                        <Clock className="w-3 h-3 text-gold" />
                        <span className="text-[11px] font-semibold text-foreground">{timeRange}</span>
                      </div>
                    )}

                    {/* Instructor overlay at bottom */}
                    <div className={cn("absolute bottom-3 z-10", timeRange ? (isRTL ? "right-3" : "left-3") : "left-3 right-3")}>
                      <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                        <div className="w-8 h-8 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center">
                          <GraduationCap className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-xs font-medium text-foreground/80 backdrop-blur-sm">{instructor}</span>
                      </div>
                    </div>
                  </div>

                  <CardContent className="relative p-5 sm:p-6">
                    {/* Date & Location */}
                    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground mb-3 flex-wrap", isRTL && "flex-row-reverse")}>
                      <Calendar className="w-3.5 h-3.5 text-gold shrink-0" />
                      <span>{mounted ? new Date(workshop.date).toLocaleDateString(isRTL ? "fa-IR" : "en-US", { month: "long", day: "numeric", year: "numeric" }) : new Date(workshop.date).toISOString().split('T')[0]}</span>
                      {location && (
                        <>
                          <span className="text-border">•</span>
                          <MapPin className="w-3 h-3 text-primary shrink-0" />
                          <span className="line-clamp-1">{location}</span>
                        </>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-base sm:text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors leading-snug line-clamp-2">
                      {title}
                    </h3>

                    {/* Highlights Preview */}
                    {highlightsList.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {highlightsList.map((h, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/5 text-[11px] text-primary font-medium">
                            <Sparkles className="w-2.5 h-2.5" />
                            {h}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Registration Deadline */}
                    {registrationDeadline && mounted && (() => {
                      const urgency = getDeadlineUrgency(registrationDeadline);
                      return (
                        <div className={cn(
                          "flex items-center gap-1.5 text-[11px] mb-3 font-medium",
                          urgency === "urgent" ? "text-destructive" : urgency === "warning" ? "text-gold" : "text-muted-foreground"
                        )}>
                          <Timer className="w-3 h-3" />
                          {isRTL ? "آخرین مهلت ثبت‌نام: " : "Deadline: "}
                          {new Date(registrationDeadline).toLocaleDateString(isRTL ? "fa-IR" : "en-US", { month: "short", day: "numeric" })}
                        </div>
                      );
                    })()}

                    {/* Seat availability bar */}
                    <div className="mb-4">
                      <div className={cn("flex items-center justify-between text-xs mb-2", isRTL && "flex-row-reverse")}>
                        <span className={cn("font-medium flex items-center gap-1", isLowSeats ? "text-destructive" : "text-muted-foreground")}>
                          {isLowSeats && <Flame className="w-3 h-3" />}
                          {isSoldOut ? (isRTL ? "فروخته شده" : "Sold Out") : t.workshops.limited_seats}
                        </span>
                        <span className="text-muted-foreground">
                          {isRTL ? toPersianDigits(`${workshop.reservedSeats}/${workshop.totalSeats}`) : `${workshop.reservedSeats}/${workshop.totalSeats}`}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={isInView ? { width: `${seatPercentage}%` } : {}}
                          transition={{ duration: 1, delay: 0.5 + index * 0.2 }}
                          className={cn(
                            "h-full rounded-full",
                            isSoldOut ? "bg-destructive" : isLowSeats ? "bg-gradient-to-l from-destructive to-gold" : "bg-gradient-to-l from-primary to-gold"
                          )}
                        />
                      </div>
                    </div>

                    {/* Price & CTA */}
                    <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                      <div>
                        {hasDiscount && workshop.price != null ? (
                          <div>
                            <span className="text-xs text-muted-foreground line-through">
                              {formatPriceValue(workshop.price, isRTL)} {isRTL ? "تومان" : "Toman"}
                            </span>
                            <div className="text-lg font-bold text-emerald-600">
                              {formatPriceValue(workshop.discountPrice!, isRTL)}
                              <span className="text-xs text-emerald-600/70 font-normal me-1">{isRTL ? "تومان" : "Toman"}</span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="text-xs text-muted-foreground">{t.workshops.price}</span>
                            <div className="text-lg font-bold text-foreground">
                              {displayPrice ? (
                                <>
                                  {formatPriceValue(displayPrice, isRTL)}
                                  <span className="text-xs text-muted-foreground font-normal me-1">{isRTL ? "تومان" : "Toman"}</span>
                                </>
                              ) : (
                                isRTL ? "رایگان" : "Free"
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetail(workshop);
                        }}
                        className={cn(
                          "rounded-full shadow-lg transition-all duration-300",
                          isSoldOut
                            ? "bg-muted text-muted-foreground cursor-not-allowed shadow-none"
                            : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 hover:shadow-primary/30"
                        )}
                        disabled={isSoldOut}
                      >
                        {isSoldOut
                          ? (isRTL ? "ظرفیت تکمیل" : "Sold Out")
                          : (
                            <>
                              <Ticket className="w-3.5 h-3.5 me-1" />
                              {isRTL ? "رزرو جایگاه" : "Reserve"}
                            </>
                          )
                        }
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-12 sm:space-y-16"
          >
            {/* Section A: Hero Illustration */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/10 via-gold/5 to-primary/5 p-8 sm:p-12 lg:p-16">
              {/* Floating decorative elements */}
              <motion.div
                className="absolute top-8 right-8 sm:top-12 sm:right-12 opacity-20"
                animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <Music className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />
              </motion.div>
              <motion.div
                className="absolute bottom-12 left-8 sm:bottom-16 sm:left-12 opacity-15"
                animate={{ y: [0, 12, 0], rotate: [0, -8, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              >
                <GraduationCap className="w-10 h-10 sm:w-14 sm:h-14 text-gold" />
              </motion.div>
              <motion.div
                className="absolute top-1/3 left-1/4 opacity-10"
                animate={{ y: [0, -10, 0], x: [0, 8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-gold" />
              </motion.div>
              <motion.div
                className="absolute top-1/2 right-1/4 opacity-10"
                animate={{ y: [0, 8, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              >
                <Pen className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </motion.div>

              {/* Central glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-[60px]" />

              {/* Content */}
              <div className="relative z-10 text-center max-w-xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 mb-6">
                    <Bell className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                  </div>
                </motion.div>
                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4"
                >
                  {t.workshops.empty_title}
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-base sm:text-lg text-muted-foreground mb-8 leading-relaxed"
                >
                  {t.workshops.empty_description}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <Button
                    size="lg"
                    className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300"
                    onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <Bell className="w-4 h-4 me-2" />
                    {t.workshops.empty_cta}
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Section B: Coming Soon Categories */}
            <div>
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-xl sm:text-2xl font-bold text-foreground mb-6 sm:mb-8 text-center"
              >
                {t.workshops.coming_soon_categories}
              </motion.h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {comingSoonCategories.map((cat, index) => {
                  const IconComponent = cat.icon;
                  return (
                    <motion.div
                      key={cat.key}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                    >
                      <Card className={cn(
                        "group relative overflow-hidden border-border/30 bg-gradient-to-br transition-all duration-300 hover:-translate-y-1 hover:shadow-md",
                        cat.gradient
                      )}>
                        <CardContent className="p-4 sm:p-5 flex flex-col items-center text-center gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-background/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <IconComponent className={cn("w-5 h-5 sm:w-6 sm:h-6", cat.iconColor)} />
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-foreground">
                            {isRTL ? cat.labelFa : cat.labelEn}
                          </span>
                          <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                            {t.workshops.stay_tuned}
                          </Badge>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Section C: Past Workshop Legacy */}
            {filteredPast.length > 0 && (
              <div>
                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="text-xl sm:text-2xl font-bold text-foreground mb-6 sm:mb-8 text-center"
                >
                  {t.workshops.our_legacy}
                </motion.h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
                  {filteredPast.map((workshop, index) => {
                    const pastCatConfig = categoryConfig[workshop.category || ""] || defaultCategory;
                    const pastTitle = isRTL ? workshop.titleFa : workshop.titleEn;
                    const pastInstructor = isRTL ? workshop.instructorFa : workshop.instructorEn;
                    return (
                      <motion.div
                        key={workshop.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                      >
                        <Card
                          className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:border-gold/40 transition-all duration-500 hover:shadow-xl hover:shadow-gold/10 cursor-pointer opacity-90 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                          onClick={() => openDetail(workshop)}
                        >
                          <div className={cn("relative h-32 sm:h-36 bg-gradient-to-br overflow-hidden opacity-75", pastCatConfig.gradient)}>
                            {workshop.coverUrl && (
                              <img src={workshop.coverUrl} alt={pastTitle} className="w-full h-full object-cover opacity-15" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent opacity-80" />
                            <div className="absolute top-3 right-3 z-10">
                              <Badge className="bg-oak-green/80 text-white border-0 text-[10px] font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {isRTL ? "برگزار شده" : "Completed"}
                              </Badge>
                            </div>
                            {workshop.category && (
                              <div className="absolute top-3 left-3 z-10">
                                <Badge className={cn("border-0 text-[10px] font-semibold backdrop-blur-sm", pastCatConfig.bgAccent, "text-foreground/80")}>
                                  <GraduationCap className="w-3 h-3 me-1" />
                                  {isRTL ? workshop.category : workshop.category.charAt(0).toUpperCase() + workshop.category.slice(1)}
                                </Badge>
                              </div>
                            )}
                          </div>
                          <CardContent className="relative p-4 sm:p-5">
                            <div className={cn("flex items-center gap-2 text-xs text-muted-foreground mb-2", isRTL && "flex-row-reverse")}>
                              <Calendar className="w-3.5 h-3.5 text-gold" />
                              <span>{mounted ? new Date(workshop.date).toLocaleDateString(isRTL ? "fa-IR" : "en-US", { month: "long", day: "numeric", year: "numeric" }) : new Date(workshop.date).toISOString().split('T')[0]}</span>
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-foreground mb-2 line-clamp-2">
                              {pastTitle}
                            </h3>
                            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                <GraduationCap className="w-3 h-3 text-primary" />
                              </div>
                              <span className="text-xs text-muted-foreground">{pastInstructor}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Workshop Detail Modal */}
      <WorkshopDetailModal
        workshop={selectedWorkshop}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        isRTL={isRTL}
      />
    </section>
  );
}

// Fallback workshops when API hasn't been seeded
const fallbackWorkshops: WorkshopData[] = [
  {
    id: "w1",
    titleFa: "کارگاه بداهه‌نوازی با استاد همایون شجریان",
    titleEn: "Improvisation Workshop with Maestro Homayoun Shajarian",
    descriptionFa: "یک تجربه بی‌نظیر از بداهه‌نوازی حرفه‌ای. در این کارگاه با تکنیک‌های پیشرفته بداهه‌نوازی آشنا خواهید شد و مهارت‌های خود را به سطح بالاتری ارتقا می‌دهید.",
    descriptionEn: "A unique experience of professional improvisation. You will learn advanced improvisation techniques and elevate your skills to a higher level.",
    instructorFa: "همایون شجریان",
    instructorEn: "Homayoun Shajarian",
    date: new Date("2025-08-15").toISOString(),
    startTime: "14:00",
    endTime: "17:00",
    price: 2500000,
    discountPrice: 1800000,
    totalSeats: 30,
    reservedSeats: 8,
    imageUrl: null,
    coverUrl: null,
    category: "improvisation",
    locationFa: "سالن اصلی مؤسسه مهر آوای بلوط، بلوار معلم، یافت‌آباد، تهران",
    locationEn: "Main Hall, Mehr Avaye Balout Institute, Moallem Blvd, Yaftabad, Tehran",
    requirementsFa: "آشنایی اولیه با ردیف موسیقی ایرانی, داشتن ساز شخصی",
    requirementsEn: "Basic familiarity with Iranian music radif, Personal instrument",
    highlightsFa: "آموزش بداهه‌نوازی حرفه‌ای, ارائه گواهینامه معتبر, مصاحبه انحصاری با استاد",
    highlightsEn: "Professional improvisation training, Certified certificate, Exclusive interview with master",
    contactPhone: "021-66245295",
    registrationDeadline: new Date("2025-08-10").toISOString(),
    isHot: true,
    isPublished: true,
    branchId: null,
  },
  {
    id: "w2",
    titleFa: "کارگاه تکنیک‌های آواز سنتی ایرانی",
    titleEn: "Iranian Traditional Vocal Techniques Workshop",
    descriptionFa: "آموزش تکنیک‌های اصولی آواز سنتی با رویکرد عملی.",
    descriptionEn: "Learn fundamental traditional vocal techniques with a practical approach.",
    instructorFa: "مهدی مقدم",
    instructorEn: "Mehdi Moghaddam",
    date: new Date("2025-09-01").toISOString(),
    startTime: "16:00",
    endTime: "19:00",
    price: 1800000,
    discountPrice: null,
    totalSeats: 25,
    reservedSeats: 15,
    imageUrl: null,
    coverUrl: null,
    category: "vocal",
    locationFa: null,
    locationEn: null,
    requirementsFa: null,
    requirementsEn: null,
    highlightsFa: "تکنیک‌های تنفسی پیشرفته, تمرین عملی گوش",
    highlightsEn: "Advanced breathing techniques, Practical ear training",
    contactPhone: null,
    registrationDeadline: null,
    isHot: false,
    isPublished: true,
    branchId: null,
  },
  {
    id: "w3",
    titleFa: "کارگاه آهنگسازی و تنظیم موسیقی مدرن",
    titleEn: "Modern Music Composition & Arrangement Workshop",
    descriptionFa: "آموزش اصول آهنگسازی و تنظیم با ابزارهای مدرن.",
    descriptionEn: "Learn composition and arrangement principles with modern tools.",
    instructorFa: "بابک جهانبخش",
    instructorEn: "Babak Jahanbakhsh",
    date: new Date("2025-09-20").toISOString(),
    startTime: null,
    endTime: null,
    price: 3200000,
    discountPrice: null,
    totalSeats: 20,
    reservedSeats: 5,
    imageUrl: null,
    coverUrl: null,
    category: "composition",
    locationFa: null,
    locationEn: null,
    requirementsFa: null,
    requirementsEn: null,
    highlightsFa: null,
    highlightsEn: null,
    contactPhone: null,
    registrationDeadline: null,
    isHot: true,
    isPublished: true,
    branchId: null,
  },
];
