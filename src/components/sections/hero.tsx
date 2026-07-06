"use client";

import React, { useRef, useMemo, useCallback, useSyncExternalStore } from "react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { ChevronDown, Play, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";

// ============================================
// Seeded PRNG for deterministic random values
// ============================================
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ============================================
// World-Class Particle System
// ============================================
function ParticleField({ particleCount, prefersReducedMotion }: { particleCount: number; prefersReducedMotion: boolean }) {
  const particles = useMemo(() => {
    const rng = seededRandom(42);
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: rng() * 100,
      y: rng() * 100,
      size: rng() * 3 + 1,
      duration: rng() * 20 + 15,
      delay: rng() * 10,
      opacity: rng() * 0.3 + 0.05,
      xDrift: (rng() - 0.5) * 100,
    }));
  }, [particleCount]);

  // Static display for reduced motion preference
  if (prefersReducedMotion) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-primary/30 dark:bg-gold/20"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
              opacity: p.opacity,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/30 dark:bg-gold/20"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -200, 0],
            x: [0, p.xDrift, 0],
            opacity: [p.opacity, p.opacity * 2, p.opacity],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "linear",
            delay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// Morphing Sound Wave - Organic & Fluid
// ============================================
function MorphingSoundWave({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  const barCount = prefersReducedMotion ? 30 : 60;
  const bars = useMemo(() => {
    const rng = seededRandom(123);
    return Array.from({ length: barCount }, (_, i) => ({
      id: i,
      baseHeight: Math.sin(i * 0.3) * 10 + 8,
      peakHeight: Math.sin(i * 0.15 + 1) * 35 + 20 + rng() * 15,
    }));
  }, [barCount]);

  // Static display for reduced motion preference
  if (prefersReducedMotion) {
    return (
      <div className="flex items-center justify-center gap-[2px] h-20 sm:h-24">
        {bars.map((bar) => (
          <div
            key={bar.id}
            className="w-[2px] sm:w-[3px] rounded-full origin-bottom"
            style={{
              height: bar.peakHeight,
              background: `linear-gradient(to top, oklch(0.38 0.16 348 / 0.4), oklch(0.75 0.16 80 / 0.6))`,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-[2px] h-20 sm:h-24">
      {bars.map((bar) => (
        <motion.div
          key={bar.id}
          className="w-[2px] sm:w-[3px] rounded-full origin-bottom"
          style={{
            background: `linear-gradient(to top, oklch(0.38 0.16 348 / 0.4), oklch(0.75 0.16 80 / 0.6))`,
          }}
          animate={{
            height: [bar.baseHeight, bar.peakHeight, bar.baseHeight],
            scaleY: [1, 1.2, 1],
          }}
          transition={{
            duration: 2 + Math.sin(bar.id * 0.2) * 0.8,
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1],
            delay: bar.id * 0.03,
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// Orbiting Musical Symbols
// ============================================
function OrbitingNotes() {
  const notes = useMemo(() => [
    { symbol: "♪", orbitRadius: 180, speed: 25, size: 28, startAngle: 0 },
    { symbol: "♫", orbitRadius: 220, speed: 30, size: 32, startAngle: 72 },
    { symbol: "𝄞", orbitRadius: 160, speed: 22, size: 36, startAngle: 144 },
    { symbol: "♬", orbitRadius: 250, speed: 35, size: 24, startAngle: 216 },
    { symbol: "♩", orbitRadius: 200, speed: 28, size: 30, startAngle: 288 },
  ], []);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {notes.map((note, i) => (
        <motion.div
          key={i}
          className="absolute text-primary/[0.07] dark:text-gold/[0.05] select-none"
          style={{ fontSize: note.size }}
          animate={{
            rotate: [note.startAngle, note.startAngle + 360],
          }}
          transition={{
            duration: note.speed,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <motion.div
            style={{
              transform: `translateX(${note.orbitRadius}px)`,
            }}
            animate={{
              opacity: [0.06, 0.12, 0.06],
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.8,
            }}
          >
            {note.symbol}
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

// ============================================
// Glowing Orbs - Ambient Light
// ============================================
function GlowingOrbs() {
  const orbs = useMemo(() => [
    { x: "15%", y: "30%", size: 300, color: "oklch(0.38 0.16 348 / 0.06)", duration: 15 },
    { x: "75%", y: "60%", size: 350, color: "oklch(0.75 0.16 80 / 0.05)", duration: 18 },
    { x: "50%", y: "20%", size: 250, color: "oklch(0.55 0.10 155 / 0.04)", duration: 20 },
    { x: "80%", y: "80%", size: 200, color: "oklch(0.38 0.16 348 / 0.03)", duration: 22 },
  ], []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            filter: "blur(40px)",
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -40, 20, 0],
            scale: [1, 1.15, 0.9, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// Animated Counter for Stats
// ============================================
function AnimatedCounter({ value, label, delay, isRTL }: {
  value: string;
  label: string;
  delay: number;
  isRTL: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay, type: "spring", stiffness: 100 }}
      className={cn("flex flex-col items-center text-center px-4 sm:px-6 py-4 sm:py-5 group/stat relative")}
    >
      {/* Subtle radial glow on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/[0.04] to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <motion.span
        className="relative text-2xl sm:text-3xl lg:text-4xl font-extrabold tabular-nums text-primary"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: delay + 0.2, type: "spring", stiffness: 200 }}
      >
        {value}
      </motion.span>
      <motion.span
        className="relative text-xs sm:text-sm text-muted-foreground mt-1.5 font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: delay + 0.5 }}
      >
        {label}
      </motion.span>
      {/* Decorative line with gold accent */}
      <motion.div
        className="relative w-0 h-[2px] bg-gradient-to-r from-primary/60 via-gold/80 to-primary/60 mt-2.5 group-hover/stat:w-3/4 transition-all duration-700"
        initial={{ width: 0 }}
        animate={{ width: "30%" }}
        transition={{ duration: 0.6, delay: delay + 0.6 }}
      />
    </motion.div>
  );
}

// ============================================
// Word-by-Word Animated Title
// Note: bg-clip-text breaks Persian/Arabic ligatures
// (renders "م ه ر" instead of "مهر"), so we use
// solid primary color to preserve proper script rendering
// ============================================
function AnimatedTitle({ text, isRTL }: { text: string; isRTL: boolean }) {
  const words = useMemo(() => text.split(" "), [text]);

  return (
    <span className="inline-flex" dir={isRTL ? "rtl" : "ltr"}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block whitespace-nowrap text-primary"
          initial={{ opacity: 0, y: 40, rotateX: -90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            duration: 0.6,
            delay: 0.4 + i * 0.12,
            type: "spring",
            stiffness: 150,
            damping: 12,
          }}
        >
          {word}
          {i < words.length - 1 && "\u00A0"}
        </motion.span>
      ))}
    </span>
  );
}

// ============================================
// Main Hero Section
// ============================================
export function HeroSection() {
  const { t, isRTL } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const isHeroVisible = useInView(ref, { once: false, margin: "-100px" });
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Respect prefers-reduced-motion for accessibility & performance
  const prefersReducedMotion = useSyncExternalStore(
    () => () => {},
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false
  );

  // Reduce particle count on mobile for performance
  const particleCount = useMemo(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return 20;
    return 35;
  }, []);

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const textScale = useTransform(scrollYProgress, [0, 0.4], [1, 0.95]);
  const textY = useTransform(scrollYProgress, [0, 0.4], [0, -50]);

  const scrollToSection = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <section
      id="hero"
      ref={ref}
      className="relative min-h-screen flex flex-col justify-center overflow-hidden"
    >
      {/* ===== BACKGROUND LAYERS ===== */}
      <motion.div
        style={{ y: backgroundY }}
        className="absolute inset-0 -z-10"
      >
        {/* AI-generated image layer */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.15] dark:opacity-[0.08]"
          style={{ backgroundImage: "url('/hero-bg.png')" }}
        />
        {/* Multi-stop gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-background to-gold/[0.04]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.03] via-transparent to-gold/[0.03]" />
      </motion.div>

      {/* Glowing Orbs - only render when visible and not reduced motion */}
      {isHeroVisible && !prefersReducedMotion && <GlowingOrbs />}

      {/* Particle Field - reduced on mobile, static for reduced motion */}
      {isHeroVisible && <ParticleField particleCount={particleCount} prefersReducedMotion={prefersReducedMotion} />}

      {/* Orbiting Notes - only render when visible and not reduced motion */}
      {isHeroVisible && !prefersReducedMotion && <OrbitingNotes />}

      {/* Decorative grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, oklch(0.38 0.16 348 / 0.3) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Logo watermark - subtle brand presence */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div
          className="opacity-[0.03] dark:opacity-[0.04] max-w-[400px] sm:max-w-[500px] w-full"
        >
          <img
            src="/logo-mab.png"
            alt=""
            className="w-full h-auto object-contain"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <motion.div
        style={{ opacity: textOpacity, scale: textScale, y: textY }}
        className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 relative z-10"
      >
        <div className="max-w-4xl mx-auto text-center">
          {/* Tag Badge with shimmer */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.1, type: "spring" }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/[0.08] border border-primary/20 backdrop-blur-sm mb-6 sm:mb-8 relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            <Sparkles className="w-3.5 h-3.5 text-gold relative" />
            <span className="text-xs sm:text-sm font-semibold text-primary relative">
              {isRTL ? "مؤسسه موسیقی تهران" : "Tehran Music Institute"}
            </span>
          </motion.div>

          {/* Animated Title */}
          <h1 className={cn(
            "text-4xl sm:text-5xl md:text-6xl lg:text-[5rem] font-extrabold mb-4 sm:mb-6 leading-[1.1]",
            isRTL ? "tracking-normal" : "tracking-tight"
          )}>
            <AnimatedTitle text={t.hero.title} isRTL={isRTL} />
          </h1>

          {/* Subtitle with typewriter-like reveal */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground/80 mb-4 sm:mb-6"
          >
            {t.hero.subtitle}
          </motion.p>

          {/* Morphing Sound Wave */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 1, delay: 1.4 }}
            className="mb-6 sm:mb-8"
          >
            <MorphingSoundWave prefersReducedMotion={prefersReducedMotion} />
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 1.6 }}
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed"
          >
            {t.hero.description}
          </motion.p>

          {/* CTA Buttons with magnetic effect */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 1.8 }}
            className={cn(
              "flex flex-col sm:flex-row items-center justify-center gap-4",
              isRTL && "sm:flex-row-reverse"
            )}
          >
            <Button
              onClick={() => scrollToSection("courses")}
              size="lg"
              className="group relative bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-500 hover:scale-105 overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary via-primary-foreground/20 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              />
              <Play className={cn("w-4 h-4 transition-all duration-300 group-hover:scale-125 group-hover:rotate-12 relative me-2")} />
              <span className="relative font-semibold">{t.hero.cta_courses}</span>
            </Button>
            <Button
              onClick={() => scrollToSection("workshops")}
              size="lg"
              variant="outline"
              className="group rounded-full px-8 border-2 border-primary/30 hover:border-gold/60 hover:bg-gold/5 transition-all duration-500 hover:scale-105 backdrop-blur-sm"
            >
              <Sparkles className={cn("w-4 h-4 text-gold transition-all duration-300 group-hover:scale-125 group-hover:rotate-12 me-2")} />
              <span className="font-semibold">{t.hero.cta_workshops}</span>
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* ===== STATS BAR ===== */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.9, delay: 2.2 }}
        className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8 relative z-10"
      >
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Ambient glow behind the stats card */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-gold/10 to-primary/20 rounded-3xl blur-sm opacity-60" />

            {/* Main card */}
            <div className="relative bg-card/70 backdrop-blur-2xl rounded-3xl border border-border/40 shadow-2xl p-1">
              {/* Elegant shimmer line at top */}
              <div className="absolute top-0 left-0 right-0 h-[1px] overflow-hidden rounded-t-3xl">
                <motion.div
                  className="h-full w-1/3 bg-gradient-to-r from-transparent via-gold/60 to-transparent"
                  animate={{ x: ["-100%", "300%"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>

              <div className="relative bg-card/80 backdrop-blur-xl rounded-[1.35rem]">
                {/* Subtle inner glow */}
                <div className="absolute inset-0 rounded-[1.35rem] bg-gradient-to-b from-primary/[0.03] to-transparent pointer-events-none" />

                <div className={cn(
                  "relative grid grid-cols-2 sm:grid-cols-4 divide-x divide-border/30",
                  isRTL && "divide-x-reverse"
                )}>
                  <AnimatedCounter
                    value={t.hero.stat_students}
                    label={t.hero.stat_students_label}
                    delay={2.4}
                    isRTL={isRTL}
                  />
                  <AnimatedCounter
                    value={t.hero.stat_instructors}
                    label={t.hero.stat_instructors_label}
                    delay={2.6}
                    isRTL={isRTL}
                  />
                  <AnimatedCounter
                    value={t.hero.stat_workshops}
                    label={t.hero.stat_workshops_label}
                    delay={2.8}
                    isRTL={isRTL}
                  />
                  <AnimatedCounter
                    value={t.hero.stat_years}
                    label={t.hero.stat_years_label}
                    delay={3.0}
                    isRTL={isRTL}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ===== SCROLL INDICATOR ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.5, duration: 1 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
      >
        <span className={cn("text-[10px] text-muted-foreground", !isRTL && "uppercase tracking-[0.3em]")}>
          {isRTL ? "اسکرول کنید" : "Scroll"}
        </span>
        <motion.div
          className="w-6 h-10 rounded-full border-2 border-primary/30 flex items-start justify-center pt-2"
        >
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-primary"
            animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
