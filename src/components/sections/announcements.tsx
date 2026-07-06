"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { SectionReveal } from "@/components/ui/section-reveal";
import {
  Bell, Megaphone, CalendarDays, GraduationCap, AlertTriangle,
  Gift, X, ChevronLeft, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  isPinned: boolean;
  createdAt: string;
}

// ============================================
// Type-based styling config
// ============================================
const typeConfig: Record<string, {
  icon: typeof Bell;
  bgGradient: string;
  borderColor: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  labelFa: string;
  labelEn: string;
}> = {
  info: {
    icon: Bell,
    bgGradient: "from-primary/10 via-primary/5 to-transparent",
    borderColor: "border-primary/30",
    iconColor: "text-primary",
    badgeBg: "bg-primary/15",
    badgeText: "text-primary",
    labelFa: "اطلاعیه",
    labelEn: "Info",
  },
  workshop: {
    icon: GraduationCap,
    bgGradient: "from-gold/10 via-gold/5 to-transparent",
    borderColor: "border-gold/30",
    iconColor: "text-gold",
    badgeBg: "bg-gold/15",
    badgeText: "text-gold",
    labelFa: "کارگاه",
    labelEn: "Workshop",
  },
  event: {
    icon: CalendarDays,
    bgGradient: "from-primary/10 via-gold/5 to-transparent",
    borderColor: "border-primary/20",
    iconColor: "text-primary",
    badgeBg: "bg-primary/10",
    badgeText: "text-primary",
    labelFa: "رویداد",
    labelEn: "Event",
  },
  urgent: {
    icon: AlertTriangle,
    bgGradient: "from-destructive/10 via-destructive/5 to-transparent",
    borderColor: "border-destructive/30",
    iconColor: "text-destructive",
    badgeBg: "bg-destructive/15",
    badgeText: "text-destructive",
    labelFa: "فوری",
    labelEn: "Urgent",
  },
  promo: {
    icon: Gift,
    bgGradient: "from-gold/10 via-primary/5 to-transparent",
    borderColor: "border-gold/30",
    iconColor: "text-gold",
    badgeBg: "bg-gold/15",
    badgeText: "text-gold",
    labelFa: "پیشنهاد ویژه",
    labelEn: "Special Offer",
  },
  course: {
    icon: GraduationCap,
    bgGradient: "from-primary/10 via-primary/5 to-transparent",
    borderColor: "border-primary/20",
    iconColor: "text-primary",
    badgeBg: "bg-primary/10",
    badgeText: "text-primary",
    labelFa: "دوره جدید",
    labelEn: "New Course",
  },
};

const defaultConfig = typeConfig.info;

// ============================================
// Ticker Bar (scrolling top bar)
// ============================================
function AnnouncementTicker({ announcements, isRTL }: {
  announcements: Announcement[];
  isRTL: boolean;
}) {
  const tickerItems = useMemo(() =>
    announcements.filter(a => a.isPinned || a.type === "urgent"),
    [announcements]
  );

  if (tickerItems.length === 0) return null;

  const content = tickerItems.map((a, i) => {
    const config = typeConfig[a.type] || defaultConfig;
    const Icon = config.icon;
    const title = isRTL ? a.titleFa : a.titleEn;

    return (
      <span key={a.id} className="inline-flex items-center gap-2 whitespace-nowrap px-8">
        <Icon className={cn("w-3.5 h-3.5", config.iconColor)} />
        <span className="text-xs sm:text-sm font-medium">{title}</span>
        {i < tickerItems.length - 1 && (
          <span className="text-primary/30 mx-2">✦</span>
        )}
      </span>
    );
  });

  return (
    <div className="w-full bg-primary/[0.04] dark:bg-primary/[0.06] border-b border-primary/10 overflow-hidden">
      <div className="py-2 relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-primary/[0.04] dark:from-primary/[0.06] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-primary/[0.04] dark:from-primary/[0.06] to-transparent z-10" />

        <motion.div
          className="flex items-center"
          animate={{
            x: isRTL ? ["100%", "-100%"] : ["-100%", "100%"],
          }}
          transition={{
            duration: Math.max(20, tickerItems.length * 8),
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {content}
          {/* Duplicate for seamless loop */}
          {content}
        </motion.div>
      </div>
    </div>
  );
}

// ============================================
// Single Announcement Card
// ============================================
function AnnouncementCard({ announcement, isRTL, index }: {
  announcement: Announcement;
  isRTL: boolean;
  index: number;
}) {
  const [isDismissed, setIsDismissed] = useState(false);
  const config = typeConfig[announcement.type] || defaultConfig;
  const Icon = config.icon;
  const title = isRTL ? announcement.titleFa : announcement.titleEn;
  const content = isRTL ? announcement.contentFa : announcement.contentEn;

  if (isDismissed) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        type: "spring",
        stiffness: 120,
        damping: 15,
      }}
      className={cn(
        "group relative rounded-2xl border backdrop-blur-xl overflow-hidden",
        "hover:shadow-xl hover:-translate-y-1 transition-all duration-500",
        config.borderColor,
        `bg-gradient-to-br ${config.bgGradient}`,
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
      )}
    >
      {/* Shimmer effect on hover */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{
          background: "linear-gradient(105deg, transparent 40%, oklch(1 0 0 / 0.1) 45%, oklch(1 0 0 / 0.1) 55%, transparent 60%)",
          backgroundSize: "200% 100%",
        }}
        animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative p-5 sm:p-6">
        {/* Top row: badge + dismiss */}
        <div className={cn("flex items-center justify-between mb-3", isRTL && "flex-row-reverse")}>
          <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <motion.div
              className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config.badgeBg)}
              whileHover={{ scale: 1.15, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className={cn("w-4 h-4", config.iconColor)} />
            </motion.div>
            <span className={cn("text-[10px] sm:text-xs font-bold uppercase tracking-wider", config.badgeText)}>
              {isRTL ? config.labelFa : config.labelEn}
            </span>

            {/* Pinned indicator */}
            {announcement.isPinned && (
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Megaphone className="w-3 h-3 text-gold" />
              </motion.div>
            )}
          </div>

          <button
            onClick={() => setIsDismissed(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-muted"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Title */}
        <h4 className={cn(
          "text-sm sm:text-base font-bold text-foreground mb-2 leading-snug group-hover:text-primary transition-colors",
          isRTL && "text-right"
        )}>
          {title}
        </h4>

        {/* Content */}
        {content && (
          <p className={cn(
            "text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2",
            isRTL && "text-right"
          )}>
            {content}
          </p>
        )}

        {/* Image */}
        {announcement.imageUrl && (
          <div className="mt-3 rounded-xl overflow-hidden">
            <img
              src={announcement.imageUrl}
              alt={title}
              className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-700"
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// Main Announcements Section
// ============================================
export function AnnouncementsSection() {
  const { isRTL, locale } = useI18n();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(3);

  // Fetch announcements from API
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch("/api/announcements");
        if (res.ok) {
          const data = await res.json();
          setAnnouncements(data);
        }
      } catch {
        // Use fallback data
        setAnnouncements(fallbackAnnouncements);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const showMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + 3, announcements.length));
  }, [announcements.length]);

  const visibleAnnouncements = announcements.slice(0, visibleCount);

  // Fallback announcements when API hasn't been seeded
  const fallbackAnnouncements: Announcement[] = [
    {
      id: "f1",
      titleFa: "🔥 کارگاه بداهه‌نوازی پیانو با استاد همایون شجریان",
      titleEn: "🔥 Piano Improvisation Workshop with Maestro Homayoun Shajarian",
      contentFa: "یک تجربه بی‌نظیر از بداهه‌نوازی حرفه‌ای. ظرفیت محدود - همین الان ثبت‌نام کنید!",
      contentEn: "A unique experience of professional improvisation. Limited seats - register now!",
      type: "workshop",
      priority: 10,
      imageUrl: null,
      isPinned: true,
      createdAt: "2025-03-10T08:00:00.000Z",
    },
    {
      id: "f2",
      titleFa: "📣 ثبت‌نام دوره‌های بهاره آغاز شد!",
      titleEn: "📣 Spring Course Registration Now Open!",
      contentFa: "با تخفیف ویژه ۲۰٪ در تمامی دوره‌ها تا پایان فروردین ثبت‌نام کنید.",
      contentEn: "Register with a special 20% discount on all courses until the end of Farvardin.",
      type: "promo",
      priority: 8,
      imageUrl: null,
      isPinned: false,
      createdAt: "2025-03-08T10:00:00.000Z",
    },
    {
      id: "f3",
      titleFa: "🎵 شب موسیقی ایرانی - اجرای زنده",
      titleEn: "🎵 Iranian Music Night - Live Performance",
      contentFa: "جمعه ۲۵ اسفند، اجرای زنده موسیقی سنتی با حضور اساتید برتر.",
      contentEn: "Friday March 15, live traditional music performance featuring top instructors.",
      type: "event",
      priority: 7,
      imageUrl: null,
      isPinned: false,
      createdAt: "2025-03-05T14:00:00.000Z",
    },
    {
      id: "f4",
      titleFa: "🚨 تغییر ساعات کاری شعبه بلوار معلم",
      titleEn: "🚨 Moallem Blvd Branch Working Hours Change",
      contentFa: "از اول فروردین ساعات کاری شعبه بلوار معلم به ۸ صبح تا ۱۰ شب تغییر می‌یابد.",
      contentEn: "Starting Farvardin 1st, Moallem Blvd branch hours change to 8 AM - 10 PM.",
      type: "urgent",
      priority: 9,
      imageUrl: null,
      isPinned: false,
      createdAt: "2025-03-12T09:00:00.000Z",
    },
    {
      id: "f5",
      titleFa: "🎹 دوره جدید تئوری موسیقی پیشرفته",
      titleEn: "🎹 New Advanced Music Theory Course",
      contentFa: "دوره تئوری موسیقی سطح پیشرفته با محوریت هارمونی و کنترپوان آغاز شد.",
      contentEn: "Advanced music theory course focusing on harmony and counterpoint has started.",
      type: "course",
      priority: 5,
      imageUrl: null,
      isPinned: false,
      createdAt: "2025-03-01T11:00:00.000Z",
    },
  ];

  return (
    <section id="announcements" className="relative">
      {/* Ticker Bar */}
      <AnnouncementTicker
        announcements={announcements.length > 0 ? announcements : fallbackAnnouncements}
        isRTL={isRTL}
      />

      {/* Announcements Grid */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-10">
          <SectionReveal animation="fade-scale" delay={0}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 mb-4">
              <Megaphone className="w-3.5 h-3.5 text-gold" />
              <span className="text-xs sm:text-sm font-semibold text-gold">
                {isRTL ? "اعلانات و اخبار" : "Announcements & News"}
              </span>
            </div>
          </SectionReveal>
          <SectionReveal animation="fade-up" delay={0.1}>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              {isRTL ? "تازه‌ترین اخبار مهر آوای بلوط" : "Latest from Mehr Avaye Balout"}
            </h2>
          </SectionReveal>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto">
          <AnimatePresence mode="popLayout">
            {(announcements.length > 0 ? announcements : fallbackAnnouncements)
              .slice(0, visibleCount)
              .map((announcement, index) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  isRTL={isRTL}
                  index={index}
                />
              ))}
          </AnimatePresence>
        </div>

        {/* Show More Button */}
        {visibleCount < (announcements.length > 0 ? announcements.length : fallbackAnnouncements.length) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-8"
          >
            <Button
              variant="outline"
              onClick={showMore}
              className="rounded-full px-6 border-gold/30 hover:border-gold/60 hover:bg-gold/5 transition-all duration-300"
            >
              {isRTL ? "مشاهده بیشتر" : "Show More"}
              {isRTL ? <ChevronLeft className="w-4 h-4 ms-1" /> : <ChevronRight className="w-4 h-4 ms-1" />}
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
