"use client";

import React, { useRef, useState, useEffect, useCallback, useSyncExternalStore, useMemo } from "react";
import Image from "next/image";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  motion,
  useInView,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
} from "framer-motion";
import { useTheme } from "next-themes";
import {
  Music,
  BookOpen,
  Award,
  GraduationCap,
  Users,
  Briefcase,
  PenTool,
  Wrench,
  Shield,
  ChevronDown,
  Sparkles,
  Factory,
  Heart,
  Lightbulb,
  MonitorPlay,
  Star,
  Clock,
  Phone,
  MapPin,
  Play,
  ArrowUp,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Portrait image paths
const PORTRAIT_LIGHT = "/images/founder/mostafa-mogouei-founder-mehr-avaye-balout-light.jpg";
const PORTRAIT_DARK = "/images/founder/mostafa-mogouei-founder-mehr-avaye-balout-dark.jpg";

// ─── Musical Note Particles ──────────────────────────────────────────────────
const MUSICAL_NOTES = ["♪", "♫", "♬", "♩", "𝄞", "𝄢"];

function MusicalParticle({ delay, x, duration }: { delay: number; x: number; duration: number }) {
  return (
    <motion.div
      className="absolute text-primary/[0.06] pointer-events-none select-none"
      style={{ left: `${x}%`, bottom: "-5%" }}
      initial={{ y: 0, opacity: 0, rotate: 0 }}
      animate={{
        y: [0, -800, -1200],
        opacity: [0, 0.5, 0],
        rotate: [0, 180, 360],
        x: [0, Math.sin(delay) * 50, Math.cos(delay) * 80],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeOut",
      }}
    >
      <span className="text-lg sm:text-2xl">{MUSICAL_NOTES[Math.floor(Math.abs(delay * 3)) % MUSICAL_NOTES.length]}</span>
    </motion.div>
  );
}

// ─── Waveform Visualizer ─────────────────────────────────────────────────────
function WaveformVisualizer({ isInView }: { isInView: boolean }) {
  // Pre-compute random values to avoid hydration mismatch (Math.random() differs between server/client)
  const barConfigs = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      peakHeight: 8 + (i * 7 + 13) % 28,  // deterministic pseudo-random based on index
      duration: 1.2 + ((i * 3 + 5) % 8) / 10,  // deterministic pseudo-random duration
      delay: i * 0.06,
    })),
    []
  );

  return (
    <div className="flex items-center gap-[3px] h-8">
      {barConfigs.map((config, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-gradient-to-t from-primary/40 to-amber-500/40"
          initial={{ height: 4 }}
          animate={
            isInView
              ? {
                  height: [4, config.peakHeight, 4],
                }
              : { height: 4 }
          }
          transition={{
            duration: config.duration,
            repeat: Infinity,
            delay: config.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ─── Persian digit helper ──────────────────────────────────────────────────
const toPersianDigits = (num: number): string => {
  return num.toString().replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
};

const toPersianFormatted = (num: number): string => {
  if (num > 999) {
    // Add thousand separators and convert to Persian
    const formatted = num.toLocaleString("en-US");
    return formatted.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
  }
  return toPersianDigits(num);
};

// ─── Animated Counter Component ──────────────────────────────────────────────
function AnimatedCounter({
  target,
  suffix = "",
  isInView,
}: {
  target: string;
  suffix?: string;
  isInView: boolean;
}) {
  const [display, setDisplay] = useState(() => target);
  const numericTarget = parseInt(target.replace(/[,+]/g, ""), 10);

  useEffect(() => {
    if (!isInView || isNaN(numericTarget)) {
      return;
    }

    const duration = 2000;
    const startTime = Date.now();
    let rafId: number;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * numericTarget);

      setDisplay(toPersianFormatted(current));

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setDisplay(target);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isInView, target, numericTarget]);

  return (
    <span>
      {display}
      {suffix}
    </span>
  );
}

// ─── Glowing Orb ─────────────────────────────────────────────────────────────
function GlowingOrb({ color, size, x, y, delay }: { color: string; size: number; x: string; y: string; delay: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        left: x,
        top: y,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      }}
      animate={{
        scale: [1, 1.3, 1],
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{
        duration: 4 + delay,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  );
}

// ─── Timeline Item Component ────────────────────────────────────────────────
function TimelineItem({
  year,
  title,
  description,
  index,
  isInView,
  isRTL,
}: {
  year: string;
  title: string;
  description: string;
  index: number;
  isInView: boolean;
  isRTL: boolean;
}) {
  const isLeft = index % 2 === 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? (isRTL ? 60 : -60) : (isRTL ? -60 : 60), y: 30 }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative flex items-start gap-4 sm:gap-6 mb-10 sm:mb-14",
        isLeft ? "sm:flex-row" : "sm:flex-row-reverse",
        isRTL && isLeft && "sm:flex-row-reverse",
        isRTL && !isLeft && "sm:flex-row"
      )}
    >
      {/* Connector line dot */}
      <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 top-2 z-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : {}}
          transition={{ duration: 0.5, delay: index * 0.12 + 0.2, type: "spring", stiffness: 200 }}
          className="relative"
        >
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-amber-600 border-4 border-background shadow-lg shadow-primary/30" />
          <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
        </motion.div>
      </div>

      {/* Content Card */}
      <div
        className={cn(
          "w-full sm:w-[calc(50%-2.5rem)] ml-0",
          isLeft ? "sm:ml-0 sm:mr-auto" : "sm:mr-0 sm:ml-auto"
        )}
      >
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="group relative"
        >
          {/* Animated border gradient */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/0 via-amber-500/0 to-primary/0 group-hover:from-primary/40 group-hover:via-amber-500/40 group-hover:to-primary/40 rounded-2xl transition-all duration-700 blur-[1px]" />
          <div className="relative bg-card/90 backdrop-blur-xl border border-border/40 rounded-2xl p-5 sm:p-6 transition-all duration-500 group-hover:border-primary/20 group-hover:shadow-xl group-hover:shadow-primary/5">
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center justify-center px-3.5 py-1 rounded-full bg-gradient-to-r from-primary/15 to-amber-500/15 text-primary text-xs sm:text-sm font-bold border border-primary/10">
                {year}
              </span>
              <div className="sm:hidden w-2.5 h-2.5 rounded-full bg-gradient-to-br from-primary to-amber-600" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-foreground mb-2">{title}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Detail Section Card Component ──────────────────────────────────────────
function DetailSection({
  title,
  subtitle,
  items,
  icon: Icon,
  accentColor,
  accentBg,
  index,
  isInView,
  isRTL,
  defaultExpanded = false,
}: {
  title: string;
  subtitle: string;
  items: string[];
  icon: React.ElementType;
  accentColor: string;
  accentBg: string;
  index: number;
  isInView: boolean;
  isRTL: boolean;
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [4, -4]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-4, 4]), { stiffness: 200, damping: 20 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: -5 }}
      animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 1200 }}
    >
      <div className="group relative">
        {/* Animated gradient border on hover */}
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-primary/0 via-amber-500/0 to-primary/0 group-hover:from-primary/30 group-hover:via-amber-500/30 group-hover:to-primary/30 transition-all duration-700 blur-[1px]" />
        <div className="relative bg-card/85 backdrop-blur-xl border border-border/30 rounded-2xl overflow-hidden transition-all duration-500 group-hover:border-primary/15 group-hover:shadow-lg">
          {/* Header */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "flex w-full items-center justify-between gap-3 p-5 sm:p-6 text-left transition-colors hover:bg-muted/20",
              isRTL && "text-right flex-row-reverse"
            )}
          >
            <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:shadow-md",
                  accentBg
                )}
              >
                <Icon className="w-5.5 h-5.5" />
              </motion.div>
              <div>
                <h3 className="font-bold text-foreground text-sm sm:text-base">{title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-md">{subtitle}</p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </motion.div>
          </button>

          {/* Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-3">
                  <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent mb-4" />
                  {items.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: isRTL ? 15 : -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35, delay: i * 0.06, ease: "easeOut" }}
                      className={cn(
                        "flex items-start gap-3 text-sm text-muted-foreground leading-relaxed",
                        isRTL && "flex-row-reverse"
                      )}
                    >
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full mt-1.5 shrink-0",
                          accentColor
                        )}
                      />
                      <span>{item}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Stats Card Component ────────────────────────────────────────────────────
function StatCard({
  value,
  label,
  icon: Icon,
  gradient,
  accentColor,
  isInView,
  index,
}: {
  value: string;
  label: string;
  icon: React.ElementType;
  gradient: string;
  accentColor: string;
  isInView: boolean;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1, type: "spring", stiffness: 120 }}
      whileHover={{ y: -6, scale: 1.03 }}
      className="group"
    >
      <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-card/70 backdrop-blur-xl p-5 sm:p-6 text-center transition-all duration-500 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5">
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
            gradient
          )}
        />
        {/* Animated corner accent */}
        <div className="absolute top-0 right-0 w-16 h-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className={cn("absolute top-2 right-2 w-8 h-8 rounded-full blur-lg", accentColor)} />
        </div>
        <div className="relative">
          <motion.div whileHover={{ rotate: 10, scale: 1.1 }} transition={{ duration: 0.3 }}>
            <Icon className="w-6 h-6 mx-auto mb-3 text-primary/70" />
          </motion.div>
          <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1.5">
            <AnimatedCounter target={value} isInView={isInView} />
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-tight">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Scroll Progress Bar ─────────────────────────────────────────────────────
function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      className="fixed top-16 sm:top-20 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-amber-500 to-primary origin-left z-40"
      style={{ scaleX }}
    />
  );
}

// ─── Main Page Component ────────────────────────────────────────────────────
export function AboutMostafaPage({ onBack }: { onBack: () => void }) {
  const { t, isRTL } = useI18n();
  const { resolvedTheme } = useTheme();
  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const isHeroInView = useInView(heroRef, { once: true, margin: "-50px" });
  const isStatsInView = useInView(statsRef, { once: true, margin: "-80px" });
  const isTimelineInView = useInView(timelineRef, { once: true, margin: "-80px" });
  const isDetailsInView = useInView(detailsRef, { once: true, margin: "-80px" });
  const isCtaInView = useInView(ctaRef, { once: true, margin: "-80px" });

  const [imgError, setImgError] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [heroExpanded, setHeroExpanded] = useState(false);

  // Track scroll position for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 600);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Section navigation indicators
  const sectionNavItems = useMemo(() => [
    { id: "about-hero", label: isRTL ? "معرفی" : "Intro", icon: Sparkles },
    { id: "about-stats", label: isRTL ? "آمار" : "Stats", icon: Clock },
    { id: "about-timeline", label: isRTL ? "مسیر" : "Path", icon: Hash },
    { id: "about-details", label: isRTL ? "تخصص" : "Expertise", icon: Award },
    { id: "about-cta", label: isRTL ? "شروع" : "Start", icon: Play },
  ], [isRTL]);

  const scrollToSectionId = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Parallax scroll for hero
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, -120]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.3]);
  const portraitScale = useTransform(scrollY, [0, 500], [1, 0.9]);

  // Safe client detection
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const ap = t.aboutPage as Record<string, string>;
  const aboutT = t.about;

  // Build timeline items
  const timelineItems = useMemo(() =>
    Array.from({ length: 10 }, (_, i) => ({
      year: ap[`timeline_${i + 1}_year`],
      title: ap[`timeline_${i + 1}_title`],
      desc: ap[`timeline_${i + 1}_desc`],
    })),
    [ap]
  );

  // Build detail sections
  const detailSections = useMemo(() => [
    {
      title: ap.education_title,
      subtitle: ap.education_subtitle,
      items: Array.from({ length: 8 }, (_, i) => ap[`education_${i + 1}`]).filter(Boolean),
      icon: GraduationCap,
      accentColor: "bg-primary",
      accentBg: "bg-primary/15 text-primary",
    },
    {
      title: ap.teaching_title,
      subtitle: ap.teaching_subtitle,
      items: Array.from({ length: 8 }, (_, i) => ap[`teaching_${i + 1}`]).filter(Boolean),
      icon: Users,
      accentColor: "bg-amber-500",
      accentBg: "bg-amber-500/15 text-amber-500",
    },
    {
      title: ap.management_title,
      subtitle: ap.management_subtitle,
      items: Array.from({ length: 6 }, (_, i) => ap[`management_${i + 1}`]).filter(Boolean),
      icon: Briefcase,
      accentColor: "bg-emerald-500",
      accentBg: "bg-emerald-500/15 text-emerald-500",
    },
    {
      title: ap.publications_title,
      subtitle: ap.publications_subtitle,
      items: Array.from({ length: 6 }, (_, i) => ap[`publications_${i + 1}`]).filter(Boolean),
      icon: PenTool,
      accentColor: "bg-rose-500",
      accentBg: "bg-rose-500/15 text-rose-500",
    },
    {
      title: ap.industry_title,
      subtitle: ap.industry_subtitle,
      items: Array.from({ length: 5 }, (_, i) => ap[`industry_${i + 1}`]).filter(Boolean),
      icon: Factory,
      accentColor: "bg-violet-500",
      accentBg: "bg-violet-500/15 text-violet-500",
    },
    {
      title: ap.certifications_title,
      subtitle: ap.certifications_subtitle,
      items: Array.from({ length: 8 }, (_, i) => ap[`certifications_${i + 1}`]).filter(Boolean),
      icon: Shield,
      accentColor: "bg-cyan-500",
      accentBg: "bg-cyan-500/15 text-cyan-500",
    },
    {
      title: ap.philosophy_title,
      subtitle: ap.philosophy_subtitle,
      items: Array.from({ length: 6 }, (_, i) => ap[`philosophy_${i + 1}`]).filter(Boolean),
      icon: Lightbulb,
      accentColor: "bg-orange-500",
      accentBg: "bg-orange-500/15 text-orange-500",
    },
    {
      title: ap.methodology_title,
      subtitle: ap.methodology_subtitle,
      items: Array.from({ length: 4 }, (_, i) => ap[`methodology_${i + 1}`]).filter(Boolean),
      icon: MonitorPlay,
      accentColor: "bg-pink-500",
      accentBg: "bg-pink-500/15 text-pink-500",
    },
  ], [ap]);

  // Stats configuration
  const stats = useMemo(() => [
    {
      value: ap.stat_years,
      label: ap.stat_years_label,
      icon: Clock,
      gradient: "from-primary/20 to-primary/5",
      accentColor: "bg-primary/30",
    },
    {
      value: ap.stat_teaching,
      label: ap.stat_teaching_label,
      icon: Users,
      gradient: "from-amber-500/20 to-amber-500/5",
      accentColor: "bg-amber-500/30",
    },
    {
      value: ap.stat_published,
      label: ap.stat_published_label,
      icon: BookOpen,
      gradient: "from-emerald-500/20 to-emerald-500/5",
      accentColor: "bg-emerald-500/30",
    },
    {
      value: ap.stat_instruments,
      label: ap.stat_instruments_label,
      icon: Wrench,
      gradient: "from-violet-500/20 to-violet-500/5",
      accentColor: "bg-violet-500/30",
    },
    {
      value: ap.stat_students,
      label: ap.stat_students_label,
      icon: Heart,
      gradient: "from-rose-500/20 to-rose-500/5",
      accentColor: "bg-rose-500/30",
    },
  ], [ap]);

  const isDark = isClient && resolvedTheme === "dark";
  const portraitSrc = isDark ? PORTRAIT_DARK : PORTRAIT_LIGHT;

  const portraitAlt = isRTL
    ? "مصطفی موگویی - بنیان‌گذار و مدیر مؤسسه موسیقی مهر آوای بلوط - بیش از ۲۰ سال تجربه آموزش موسیقی در تهران"
    : "Mostafa Mogouyi - Founder & Director of Mehr Avaye Balout Music Institute - Over 20 years of music education experience in Tehran";

  // Musical particles configuration
  const particles = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      delay: i * 1.2,
      x: (i * 8.3) % 100,
      duration: 8 + (i % 4) * 2,
    })),
    []
  );

  return (
    <article ref={pageRef} className="relative min-h-screen">
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: "Mostafa Mogouyi",
            alternateName: "مصطفی موگویی",
            jobTitle: isRTL
              ? "بنیان‌گذار و مدیر مؤسسه موسیقی مهر آوای بلوط"
              : "Founder & Director of Mehr Avaye Balout Music Institute",
            description: ap.hero_description,
            url: "https://mehravayebalout.ir",
            image: "https://mehravayebalout.ir/images/founder/mostafa-mogouei-founder-mehr-avaye-balout-light.jpg",
            knowsAbout: [
              "Violin Performance",
              "Music Theory",
              "Solfège",
              "Music Pedagogy",
              "Instrument Manufacturing",
              "Iranian Classical Music",
              "آموزش ویولن",
              "تئوری موسیقی",
              "سلفژ",
              "پداگوژی موسیقی",
              "موسیقی اصیل ایرانی",
            ],
            alumniOf: [
              {
                "@type": "EducationalOrganization",
                name: isRTL ? "کنسرواتوار تهران" : "Tehran Conservatory",
              },
              {
                "@type": "EducationalOrganization",
                name: isRTL
                  ? "دانشگاه علمی کاربردی فرهنگ و هنر واحد ۱۱"
                  : "Applied Science University of Culture & Art, Unit 11",
              },
            ],
            worksFor: {
              "@type": "Organization",
              name: isRTL ? "مؤسسه موسیقی مهر آوای بلوط" : "Mehr Avaye Balout Music Institute",
              alternateName: "Mehr Avaye Balout",
              url: "https://mehravayebalout.ir",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Tehran",
                addressCountry: "IR",
              },
            },
            sameAs: [],
            award: [
              isRTL ? "تأییدیه صلاحیت از اساتید هنرستان موسیقی ایران" : "Certified by Iran Music Conservatory masters",
              isRTL ? "تأییدیه از مراکز علمی کاربردی موسیقی" : "Certified by Applied Science Music Centers",
              isRTL ? "تأییدیه معاونت هنری اداره کل فرهنگ و ارشاد اسلامی" : "Certified by Ministry of Culture and Islamic Guidance",
            ],
          }),
        }}
      />
      {/* Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EducationalOrganization",
            name: isRTL ? "مؤسسه موسیقی مهر آوای بلوط" : "Mehr Avaye Balout Music Institute",
            alternateName: "Mehr Avaye Balout Music Academy",
            description: isRTL
              ? "مرکز تخصصی آموزش موسیقی و برگزاری کارگاه‌های حرفه‌ای در تهران با مجوز رسمی شورای عالی انقلاب فرهنگی"
              : "Specialized center for music education and professional workshops in Tehran, officially licensed by the Supreme Council of Cultural Revolution",
            url: "https://mehravayebalout.ir",
            address: [
              {
                "@type": "PostalAddress",
                streetAddress: isRTL ? "آیت‌الله سعیدی، بلوار معلم، محله بهداشت، جنب خیابان سلیمانی، پلاک ۸۸" : "Ayatollah Saeedi, Moallem Blvd, Behdasht Neighborhood, Next to Soleymani St., No. 88",
                addressLocality: "Tehran",
                addressCountry: "IR",
              },
              {
                "@type": "PostalAddress",
                streetAddress: isRTL ? "محله یافت‌آباد، چهارراه قهوه‌خانه، بلوار الغدیر، خیابان توحید، پلاک ۱" : "Yaftabad, Chaharragh-e Qahvehkhaneh, Alghadir Blvd, Tawhid St., No. 1",
                addressLocality: "Tehran",
                addressCountry: "IR",
              },
            ],
            founder: {
              "@type": "Person",
              name: "Mostafa Mogouyi",
            },
            knowsAbout: [
              "Music Education",
              "Violin",
              "Music Theory",
              "Solfège",
              "Instrument Manufacturing",
              "Iranian Music",
            ],
          }),
        }}
      />

      {/* Scroll Progress Bar */}
      <ScrollProgressBar />

      {/* BreadcrumbList Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": isRTL ? "صفحه اصلی" : "Home",
                "item": "https://mehravayebalout.ir"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": isRTL ? "درباره ما" : "About Us",
                "item": "https://mehravayebalout.ir/#about"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": isRTL ? "مصطفی موگویی" : "Mostafa Mogouyi"
              }
            ]
          }),
        }}
      />

      {/* FAQPage Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: isRTL ? "بنیان‌گذار مؤسسه موسیقی مهر آوای بلوط کیست؟" : "Who is the founder of Mehr Avaye Balout Music Institute?",
                acceptedAnswer: { "@type": "Answer", text: isRTL ? "مصطفی موگویی، نوازنده و مدرس برجسته ویولن، بنیان‌گذار و مدیر مؤسسه موسیقی مهر آوای بلوط است با بیش از ۲۰ سال سابقه آموزش موسیقی." : "Mostafa Mogouyi is the founder and director of Mehr Avaye Balout Music Institute, with over 20 years of music education experience." },
              },
              {
                "@type": "Question",
                name: isRTL ? "چه سازهایی در مهر آوای بلوط تدریس می‌شود؟" : "What instruments are taught at Mehr Avaye Balout?",
                acceptedAnswer: { "@type": "Answer", text: isRTL ? "آموزش ویولن، تئوری موسیقی، سلفژ، هارمونی، آنالیز موسیقی و روش‌های تدریس موسیقی ارائه می‌شود." : "Instruction in violin, music theory, solfège, harmony, musical analysis, and music pedagogy is offered." },
              },
              {
                "@type": "Question",
                name: isRTL ? "آیا این مؤسسه مجوز رسمی دارد؟" : "Does the institute have official licenses?",
                acceptedAnswer: { "@type": "Answer", text: isRTL ? "بله، دارای مجوز رسمی از شورای عالی انقلاب فرهنگی و تأییدیه معاونت هنری اداره کل فرهنگ و ارشاد اسلامی است." : "Yes, it is officially licensed by the Supreme Council of Cultural Revolution and certified by the Ministry of Culture and Islamic Guidance." },
              },
              {
                "@type": "Question",
                name: isRTL ? "بنیان‌گذار چند سال سابقه آموزشی دارد؟" : "How many years of experience does the founder have?",
                acceptedAnswer: { "@type": "Answer", text: isRTL ? "بیش از ۲۰ سال سابقه آموزش موسیقی و بیش از ۱۰ سال سابقه مدیریت مؤسسه موسیقی." : "Over 20 years of music education experience and over 10 years of music institute management." },
              },
              {
                "@type": "Question",
                name: isRTL ? "شعبات مؤسسه در کجا قرار دارند؟" : "Where are the branches located?",
                acceptedAnswer: { "@type": "Answer", text: isRTL ? "شعبه اصلی بلوار معلم و شعبه فرعی بلوار الغدیر، هر دو در محله یافت‌آباد تهران." : "Main branch at Moallem Blvd and secondary branch at Alghadir Blvd, both in Yaftabad, Tehran." },
              },
              {
                "@type": "Question",
                name: isRTL ? "روش تدریس مؤسسه چیست؟" : "What teaching methodology is used?",
                acceptedAnswer: { "@type": "Answer", text: isRTL ? "روش تدریس ترکیبی شامل آموزش حضوری فردی و گروهی و برنامه‌ریزی شخصی‌سازی‌شده." : "Hybrid methodology including individual and group instruction with personalized curriculum planning." },
              },
            ],
          }),
        }}
      />

      {/* LocalBusiness + EducationalOrganization Combined Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": ["LocalBusiness", "EducationalOrganization"],
            name: "Mehr Avaye Balout Music Institute",
            alternateName: ["Mehr Avaye Balout", "مهر آوای بلوط"],
            description: "Specialized center for music education and professional workshops in Tehran, officially licensed by the Supreme Council of Cultural Revolution",
            url: "https://mehravayebalout.ir",
            telephone: "+98-21-66245295",
            priceRange: "$$",
            foundingDate: "2012",
            geo: { "@type": "GeoCoordinates", latitude: 35.6735, longitude: 51.385 },
            address: [
              { "@type": "PostalAddress", streetAddress: "Ayatollah Saeedi, Moallem Blvd, Behdasht Neighborhood, Next to Soleymani St., No. 88", addressLocality: "Tehran", addressCountry: "IR" },
              { "@type": "PostalAddress", streetAddress: "Yaftabad, Alghadir Blvd, Tawhid St., No. 1", addressLocality: "Tehran", addressCountry: "IR" },
            ],
            openingHoursSpecification: [
              { "@type": "OpeningHoursSpecification", dayOfWeek: ["Saturday","Sunday","Monday","Tuesday","Wednesday"], opens: "09:00", closes: "21:00" },
              { "@type": "OpeningHoursSpecification", dayOfWeek: "Thursday", opens: "09:00", closes: "18:00" },
            ],
            founder: { "@type": "Person", name: "Mostafa Mogouyi" },
            aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", bestRating: "5", ratingCount: "127" },
            sameAs: ["https://www.instagram.com/mehravaye_baloot", "https://t.me/mehravaye_baloot"],
          }),
        }}
      />

      {/* ItemList Schema for Services/Courses */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Courses and Services at Mehr Avaye Balout Music Institute",
            numberOfItems: 8,
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Violin Lessons", url: "https://mehravayebalout.ir/#courses" },
              { "@type": "ListItem", position: 2, name: "Music Theory", url: "https://mehravayebalout.ir/#courses" },
              { "@type": "ListItem", position: 3, name: "Solfège", url: "https://mehravayebalout.ir/#courses" },
              { "@type": "ListItem", position: 4, name: "Harmony", url: "https://mehravayebalout.ir/#courses" },
              { "@type": "ListItem", position: 5, name: "Musical Analysis", url: "https://mehravayebalout.ir/#courses" },
              { "@type": "ListItem", position: 6, name: "Music Pedagogy", url: "https://mehravayebalout.ir/#courses" },
              { "@type": "ListItem", position: 7, name: "Instrument Manufacturing", url: "https://mehravayebalout.ir/#courses" },
              { "@type": "ListItem", position: 8, name: "Chamber Music Workshop", url: "https://mehravayebalout.ir/#courses" },
            ],
          }),
        }}
      />

      {/* ─── Floating Section Navigation ────────────────────────────── */}
      <nav
        className={cn(
          "hidden lg:flex fixed top-1/2 -translate-y-1/2 z-30 flex-col gap-2",
          isRTL ? "left-6" : "right-6"
        )}
        aria-label={isRTL ? "ناوبری بخش‌ها" : "Section navigation"}
      >
        {sectionNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              onClick={() => scrollToSectionId(item.id)}
              initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.8 }}
              className="group relative flex items-center justify-center w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm border border-border/40 hover:border-primary/30 hover:bg-primary/10 transition-all duration-300 shadow-sm hover:shadow-md"
              aria-label={item.label}
            >
              <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
              <span className={cn(
                "absolute px-2 py-1 rounded-md bg-foreground/90 text-background text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none",
                isRTL ? "start-full ms-2" : "end-full me-2"
              )}>
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </nav>

      {/* ─── Back to Top Button ──────────────────────────────────────── */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 end-6 z-30 w-11 h-11 rounded-full bg-primary/90 hover:bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 flex items-center justify-center transition-all duration-300"
            aria-label={isRTL ? "بازگشت به بالا" : "Back to top"}
          >
            <ArrowUp className="w-4.5 h-4.5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ─── Hero Section with Parallax ──────────────────────────────── */}
      <section
        id="about-hero"
        ref={heroRef}
        className="relative py-20 sm:py-28 lg:py-36 overflow-hidden"
        aria-labelledby="founder-name"
      >
        {/* Background Decorations with Parallax */}
        <motion.div className="absolute inset-0 -z-10" style={{ y: heroY }}>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          {/* Glowing Orbs */}
          <GlowingOrb color="oklch(0.7 0.15 50 / 0.08)" size={300} x="75%" y="15%" delay={0} />
          <GlowingOrb color="oklch(0.75 0.12 80 / 0.06)" size={400} x="5%" y="60%" delay={1.5} />
          <GlowingOrb color="oklch(0.65 0.18 30 / 0.05)" size={250} x="50%" y="80%" delay={3} />

          {/* Musical note particles */}
          {particles.map((p, i) => (
            <MusicalParticle key={i} {...p} />
          ))}

          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `radial-gradient(circle, oklch(0.5 0.1 50) 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />
        </motion.div>

        <motion.div
          className="container mx-auto px-4 sm:px-6 lg:px-8"
          style={{ opacity: heroOpacity }}
        >
          <div
            className={cn(
              "flex flex-col lg:flex-row items-center gap-10 lg:gap-20",
              isRTL && "lg:flex-row-reverse"
            )}
          >
            {/* Portrait with Parallax */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6, rotateY: -15 }}
              animate={isHeroInView ? { opacity: 1, scale: 1, rotateY: 0 } : {}}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              style={{ scale: portraitScale }}
              className="relative shrink-0"
            >
              <div className="relative w-56 h-56 sm:w-72 sm:h-72 lg:w-80 lg:h-80">
                {/* Animated rotating rings */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-[-8px] rounded-full"
                >
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/15" />
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary/40" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-amber-500/40" />
                </motion.div>
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-[-16px] rounded-full"
                >
                  <div className="absolute inset-0 rounded-full border border-dashed border-amber-500/10" />
                  <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-emerald-500/30" />
                </motion.div>

                {/* Glow */}
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/25 via-amber-500/25 to-primary/25 blur-xl" />

                {/* Main circle with animated gradient border */}
                <motion.div
                  animate={{
                    background: isDark
                      ? [
                          "linear-gradient(135deg, oklch(0.7 0.15 348), oklch(0.65 0.12 60), oklch(0.7 0.15 348))",
                          "linear-gradient(135deg, oklch(0.65 0.12 60), oklch(0.7 0.15 348), oklch(0.65 0.12 60))",
                          "linear-gradient(135deg, oklch(0.7 0.15 348), oklch(0.65 0.12 60), oklch(0.7 0.15 348))",
                        ]
                      : [
                          "linear-gradient(135deg, oklch(0.65 0.18 348), oklch(0.6 0.15 60), oklch(0.65 0.18 348))",
                          "linear-gradient(135deg, oklch(0.6 0.15 60), oklch(0.65 0.18 348), oklch(0.6 0.15 60))",
                          "linear-gradient(135deg, oklch(0.65 0.18 348), oklch(0.6 0.15 60), oklch(0.65 0.18 348))",
                        ],
                  }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="relative w-full h-full rounded-full p-[3px]"
                >
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                    {!imgError && isClient ? (
                      <Image
                        src={portraitSrc}
                        alt={portraitAlt}
                        width={320}
                        height={320}
                        className="w-full h-full object-cover rounded-full"
                        priority
                        quality={90}
                        unoptimized
                        onError={() => setImgError(true)}
                      />
                    ) : imgError ? (
                      <div className="flex flex-col items-center gap-3">
                        <motion.div
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <Music className="w-16 h-16 text-primary/40" />
                        </motion.div>
                        <span className="text-xs text-muted-foreground/60 text-center px-6">
                          {ap.hero_title}
                        </span>
                      </div>
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-primary/10 via-transparent to-amber-500/10" />
                    )}
                  </div>
                </motion.div>

                {/* Floating decorative elements with enhanced animations */}
                <motion.div
                  animate={{ y: [-5, 5, -5], rotate: [0, 12, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-amber-500/15 flex items-center justify-center backdrop-blur-md border border-amber-500/20 shadow-lg shadow-amber-500/10"
                >
                  <Music className="w-5 h-5 text-amber-500" />
                </motion.div>
                <motion.div
                  animate={{ y: [5, -5, 5], rotate: [0, -10, 0], scale: [1, 1.15, 1] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -bottom-3 -left-3 w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center backdrop-blur-md border border-primary/20 shadow-lg shadow-primary/10"
                >
                  <Sparkles className="w-4.5 h-4.5 text-primary" />
                </motion.div>
                <motion.div
                  animate={{ y: [-4, 4, -4], scale: [1, 1.15, 1], rotate: [0, 15, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                  className="absolute top-1/2 -right-8 w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center backdrop-blur-md border border-emerald-500/20 shadow-lg shadow-emerald-500/10"
                >
                  <Star className="w-4 h-4 text-emerald-500" />
                </motion.div>
                <motion.div
                  animate={{ y: [3, -3, 3], rotate: [0, -8, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute top-1/4 -left-6 w-8 h-8 rounded-full bg-rose-500/15 flex items-center justify-center backdrop-blur-md border border-rose-500/20 shadow-lg shadow-rose-500/10"
                >
                  <Award className="w-3.5 h-3.5 text-rose-500" />
                </motion.div>
              </div>
            </motion.div>

            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, x: isRTL ? 50 : -50 }}
              animate={isHeroInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "flex-1 text-center lg:text-left",
                isRTL && "lg:text-right"
              )}
            >
              {/* Tag */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center gap-3 mb-5"
              >
                <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-primary/10 to-amber-500/10 border border-primary/10 text-primary text-xs font-semibold tracking-wide">
                  <Sparkles className="w-3.5 h-3.5" />
                  {aboutT.tag}
                </span>
                <WaveformVisualizer isInView={isHeroInView} />
              </motion.div>

              {/* Name - H1 for SEO */}
              <motion.h1
                id="founder-name"
                initial={{ opacity: 0, y: 20 }}
                animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-4 leading-tight"
              >
                {ap.hero_title}
              </motion.h1>

              {/* Subtitle with gradient */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-base sm:text-lg lg:text-xl font-semibold mb-3 bg-gradient-to-r from-primary to-amber-600 bg-clip-text text-transparent"
              >
                {ap.hero_subtitle}
              </motion.p>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="text-sm sm:text-base text-amber-600 dark:text-amber-400 font-medium mb-6"
              >
                {ap.hero_tagline}
              </motion.p>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.5 }}
                className={cn(
                  "text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl",
                  isRTL ? "lg:ml-0 lg:mr-0 mx-auto lg:mx-0" : "mx-auto lg:mx-0"
                )}
              >
                {(() => {
                  const desc = ap.hero_description || "";
                  // Split at the second period (after first meaningful sentence)
                  const firstPeriodIdx = desc.indexOf("۔");
                  const persianPeriodIdx = desc.indexOf(".");
                  // Use whichever comes first - Persian or English period
                  const splitIdx1 = firstPeriodIdx >= 0 ? firstPeriodIdx : persianPeriodIdx;
                  if (splitIdx1 < 0) {
                    return <p>{desc}</p>;
                  }
                  const leadEnd = splitIdx1 + 1; // include the period
                  const descriptionLead = desc.slice(0, leadEnd);
                  const descriptionRest = desc.slice(leadEnd).trim();
                  return (
                    <>
                      <p>{descriptionLead}</p>
                      <AnimatePresence>
                        {heroExpanded && (
                          <motion.p
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                          >
                            {descriptionRest}
                          </motion.p>
                        )}
                      </AnimatePresence>
                      {descriptionRest && (
                        <button
                          onClick={() => setHeroExpanded(!heroExpanded)}
                          className="text-primary text-sm font-medium hover:underline mt-2 inline-block"
                        >
                          {heroExpanded
                            ? (isRTL ? "بستن" : "Show less")
                            : (isRTL ? "ادامه مطلب ←" : "Read more →")}
                        </button>
                      )}
                    </>
                  );
                })()}
              </motion.div>

              {/* SEO Keywords */}
              <span className="sr-only">
                {isRTL
                  ? "آموزش موسیقی تهران، آموزشگاه ویولن، مدرس موسیقی، مؤسسه موسیقی مهر آوای بلوط، کنسرواتوار تهران، آموزش تئوری موسیقی، سلفژ، تولید ساز، ویولن‌سازی، کلاس ویولن تهران، آموزشگاه موسیقی بلوار معلم، آموزشگاه موسیقی یافت‌آباد، مدرس ویولن تهران، دوره آموزش ویولن مبتدی، آموزش سلفژ و نت‌خوانی، مؤسسه موسیقی مجاز تهران، مجوز رسمی آموزش موسیقی، کارگاه تولید ساز تهران، آموزش هارمونی موسیقی، روش تدریس موسیقی، آنالیز موسیقی، پداگوژی موسیقی ایران، آموزش موسیقی ایرانی، ویولن کلاسیک تهران، مدرس ویولن حرفه‌ای، ثبت‌نام کلاس موسیقی، آموزشگاه موسیقی معتبر تهران، مصطفی موگویی، بنیان‌گذار مهر آوای بلوط"
                  : "music education Tehran, violin teacher, music instructor, Mehr Avaye Balout Music Institute, Tehran Conservatory, music theory education, solfège, instrument manufacturing, violin making, violin classes Tehran, music school Moallem Blvd, music school Yaftabad, violin tutor Tehran, beginner violin course, solfège and notation lessons, licensed music institute Tehran, official music education license, instrument making workshop Tehran, harmony lessons, music pedagogy, musical analysis, music pedagogy Iran, Iranian music education, classical violin Tehran, professional violin instructor, music class enrollment, accredited music school Tehran, Mostafa Mogouyi, founder Mehr Avaye Balout"}
              </span>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ─── Stats Section ────────────────────────────────────────────── */}
      <section id="about-stats" ref={statsRef} className="py-16 sm:py-20 relative" aria-label={isRTL ? "آمار و دستاوردها" : "Statistics & Achievements"}>
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
            {stats.map((stat, i) => (
              <StatCard
                key={i}
                value={stat.value}
                label={stat.label}
                icon={stat.icon}
                gradient={stat.gradient}
                accentColor={stat.accentColor}
                isInView={isStatsInView}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Timeline Section ─────────────────────────────────────────── */}
      <section id="about-timeline" ref={timelineRef} className="py-20 sm:py-28 relative overflow-hidden" aria-labelledby="timeline-heading">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <GlowingOrb color="oklch(0.7 0.12 50 / 0.05)" size={300} x="0%" y="33%" delay={0} />
          <GlowingOrb color="oklch(0.75 0.1 80 / 0.04)" size={350} x="80%" y="66%" delay={2} />
          {/* Musical particles for this section */}
          {Array.from({ length: 6 }).map((_, i) => (
            <MusicalParticle key={i} delay={i * 2} x={20 + i * 12} duration={10 + i} />
          ))}
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isTimelineInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="text-center mb-14 sm:mb-20"
          >
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 border border-primary/10 text-primary text-xs font-semibold tracking-wide mb-5">
              <Clock className="w-3.5 h-3.5" />
              {isRTL ? "مسیر حرفه‌ای" : "Career Path"}
            </span>
            <h2 id="timeline-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
              {ap.timeline_title}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
              {ap.timeline_subtitle}
            </p>
          </motion.div>

          {/* Timeline Line (desktop) */}
          <div className="relative max-w-4xl mx-auto">
            <div className="hidden sm:block absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/20 via-primary/40 to-primary/20" />

            {/* Timeline Items */}
            {timelineItems.map((item, i) => (
              <TimelineItem
                key={i}
                year={item.year}
                title={item.title}
                description={item.desc}
                index={i}
                isInView={isTimelineInView}
                isRTL={isRTL}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Detailed Sections ─────────────────────────────────────────── */}
      <section id="about-details" ref={detailsRef} className="py-20 sm:py-28 relative" aria-label={isRTL ? "جزئیات تخصصی" : "Detailed Expertise"}>
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
          <GlowingOrb color="oklch(0.7 0.1 50 / 0.04)" size={400} x="60%" y="20%" delay={1} />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isDetailsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="text-center mb-14 sm:mb-20"
          >
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-500/10 border border-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold tracking-wide mb-5">
              <Award className="w-3.5 h-3.5" />
              {isRTL ? "تخصص‌ها و دستاوردها" : "Expertise & Achievements"}
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
              {isRTL ? "عمق تخصص، وسعت دستاورد" : "Depth of Expertise, Breadth of Achievement"}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
              {isRTL
                ? "آکادمی مهر آوای بلوط زیر نظر مستقیم مصطفی موگویی، در ۸ محور تخصصی فعالیت می‌کند"
                : "Mehr Avaye Balout Academy, under Mostafa Mogouyi's direct supervision, operates across 8 specialized domains"}
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4 sm:space-y-5">
            {detailSections.map((section, i) => (
              <DetailSection
                key={i}
                title={section.title}
                subtitle={section.subtitle}
                items={section.items}
                icon={section.icon}
                accentColor={section.accentColor}
                accentBg={section.accentBg}
                index={i}
                isInView={isDetailsInView}
                isRTL={isRTL}
                defaultExpanded={i === 0}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Artistic Manifesto ──────────────────────────────────────── */}
      <section
        id="about-manifesto"
        className="py-20 sm:py-28 relative overflow-hidden"
        aria-label={isRTL ? "مانیفست هنری" : "Artistic Manifesto"}
      >
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-amber-500/5" />
          {/* Musical staff lines — five thin horizontal lines */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={`staff-${i}`}
              className="absolute left-0 right-0 border-t border-primary/[0.04]"
              style={{ top: `${22 + i * 14}%` }}
            />
          ))}
          {/* Faint note indicators on the staff */}
          {[
            { left: "12%", top: "24%" },
            { left: "28%", top: "38%" },
            { left: "55%", top: "30%" },
            { left: "75%", top: "44%" },
            { left: "90%", top: "26%" },
          ].map((note, i) => (
            <span
              key={`note-${i}`}
              className="absolute text-primary/[0.06] text-xs select-none pointer-events-none"
              style={{ left: note.left, top: note.top }}
            >
              ♪
            </span>
          ))}
          {Array.from({ length: 4 }).map((_, i) => (
            <MusicalParticle key={i} delay={i * 2.5} x={15 + i * 20} duration={12 + i} />
          ))}
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              {/* Animated glow border */}
              <motion.div
                animate={{
                  background: [
                    "linear-gradient(135deg, oklch(0.7 0.15 348 / 0.15), oklch(0.65 0.12 60 / 0.15), oklch(0.7 0.15 348 / 0.15))",
                    "linear-gradient(135deg, oklch(0.65 0.12 60 / 0.15), oklch(0.7 0.15 348 / 0.15), oklch(0.65 0.12 60 / 0.15))",
                    "linear-gradient(135deg, oklch(0.7 0.15 348 / 0.15), oklch(0.65 0.12 60 / 0.15), oklch(0.7 0.15 348 / 0.15))",
                  ],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -inset-[1px] rounded-3xl blur-[2px]"
              />
              <div className="relative bg-card/95 backdrop-blur-2xl border border-border/40 rounded-3xl p-8 sm:p-12 lg:p-16 overflow-hidden">
                {/* Subtle radial glow behind text */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[600px] h-[300px] rounded-full bg-primary/[0.03] blur-3xl" />
                </div>
                {/* Background pattern */}
                <div
                  className="absolute inset-0 opacity-[0.01]"
                  style={{
                    backgroundImage: `radial-gradient(circle, oklch(0.5 0.1 50) 1px, transparent 1px)`,
                    backgroundSize: "30px 30px",
                  }}
                />
                <div className="relative">
                  {/* Musical clef — subtle, non-animated */}
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className={cn(
                      "block text-4xl sm:text-5xl text-primary/20 mb-6 select-none",
                      isRTL ? "text-right" : "text-left"
                    )}
                    aria-hidden="true"
                  >
                    𝄞
                  </motion.span>

                  {/* Quote line 1 — staggered word reveal */}
                  <blockquote className={cn("relative", isRTL && "text-right")}>
                    <div
                      className={cn(
                        "text-lg sm:text-xl lg:text-2xl font-medium text-foreground leading-relaxed",
                        isRTL ? "font-serif" : "font-serif"
                      )}
                    >
                      {(isRTL
                        ? "«موسیقی، الفبایی است که هر صدای آن، حرفی از حقیقتِ بی‌صدای انسان می‌گوید»"
                        : '"Music is an alphabet whose every sound speaks a word from humanity\'s unsung truth"'
                      ).split(" ").map((word, i) => (
                        <motion.span
                          key={`q1-${i}`}
                          initial={{ opacity: 0, y: 12 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 0.5,
                            delay: 0.15 + i * 0.06,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="inline-block mr-[0.3em]"
                        >
                          {word}
                        </motion.span>
                      ))}
                    </div>
                  </blockquote>

                  {/* Waveform Visualizer — separator between quote lines */}
                  <motion.div
                    initial={{ opacity: 0, scaleX: 0 }}
                    whileInView={{ opacity: 1, scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
                    className={cn(
                      "flex items-center gap-3 my-8 sm:my-10",
                      isRTL ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className={cn("flex-1 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent", isRTL ? "bg-gradient-to-l" : "bg-gradient-to-r")} />
                    <div className="shrink-0">
                      <WaveformVisualizer isInView />
                    </div>
                    <div className={cn("flex-1 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent", isRTL ? "bg-gradient-to-l" : "bg-gradient-to-r")} />
                  </motion.div>

                  {/* Quote line 2 — staggered word reveal */}
                  <blockquote className={cn("relative", isRTL && "text-right")}>
                    <div
                      className={cn(
                        "text-lg sm:text-xl lg:text-2xl font-medium text-foreground leading-relaxed",
                        isRTL ? "font-serif" : "font-serif"
                      )}
                    >
                      {(isRTL
                        ? "«هنرمندِ راستین نه ساز می‌نوازد، که سکوتِ میان نت‌ها را ترجمه می‌کند»"
                        : '"The true artist does not merely play the instrument — they translate the silence between the notes"'
                      ).split(" ").map((word, i) => (
                        <motion.span
                          key={`q2-${i}`}
                          initial={{ opacity: 0, y: 12 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 0.5,
                            delay: 1.1 + i * 0.06,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="inline-block mr-[0.3em]"
                        >
                          {word}
                        </motion.span>
                      ))}
                    </div>
                  </blockquote>

                  {/* Attribution */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 2.2, ease: [0.22, 1, 0.36, 1] }}
                    className={cn(
                      "mt-10 sm:mt-12 pt-6 border-t border-border/20",
                      isRTL ? "text-right" : "text-left"
                    )}
                  >
                    <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse justify-end" : "justify-start")}>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/80 to-amber-600/80 flex items-center justify-center shadow-md shadow-primary/10">
                        <Music className="w-4 h-4 text-white" />
                      </div>
                      <div className={cn(isRTL ? "text-right" : "text-left")}>
                        <p className="font-bold text-foreground text-sm leading-tight">
                          {isRTL ? "مصطفی موگویی" : "Mostafa Mogouyi"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {isRTL ? "بنیان‌گذار مهر آوای بلوط" : "Founder of Mehr Avaye Balout"}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── CTA Section ──────────────────────────────────────────────── */}
      <section id="about-cta" ref={ctaRef} className="py-20 sm:py-28 relative overflow-hidden" aria-label={isRTL ? "شروع آموزش" : "Start Learning"}>
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-amber-500/5" />
          <GlowingOrb color="oklch(0.7 0.15 50 / 0.06)" size={300} x="30%" y="30%" delay={0} />
          <GlowingOrb color="oklch(0.75 0.12 80 / 0.05)" size={250} x="70%" y="60%" delay={2} />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-2xl mx-auto"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="inline-flex mb-6"
            >
              <Sparkles className="w-10 h-10 text-primary" />
            </motion.div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-5">
              {ap.cta_title}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-10 leading-relaxed">
              {ap.cta_description}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  className="rounded-full px-8 bg-gradient-to-r from-primary to-amber-600 hover:from-primary/90 hover:to-amber-600/90 text-white shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300"
                  onClick={() => {
                    onBack();
                    setTimeout(() => {
                      document.getElementById("courses")?.scrollIntoView({ behavior: "smooth" });
                    }, 500);
                  }}
                >
                  <Play className="w-4 h-4 me-2" />
                  {ap.cta_courses}
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8 border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  onClick={() => {
                    onBack();
                    setTimeout(() => {
                      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
                    }, 500);
                  }}
                >
                  <Phone className="w-4 h-4 me-2" />
                  {ap.cta_contact}
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="ghost"
                  size="lg"
                  className="rounded-full px-8 hover:bg-muted"
                  onClick={() => {
                    onBack();
                    setTimeout(() => {
                      document.getElementById("branches")?.scrollIntoView({ behavior: "smooth" });
                    }, 500);
                  }}
                >
                  <MapPin className="w-4 h-4 me-2" />
                  {ap.cta_branches}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </article>
  );
}
