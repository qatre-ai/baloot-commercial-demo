"use client";

import React, { useRef, useSyncExternalStore, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { Music, Instagram, Send, Youtube, MapPin, Phone, Mail, Heart, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, useInView } from "framer-motion";

const quickLinks = ["about", "courses", "workshops", "blog", "branches", "contact"] as const;

// ============================================
// Vinyl Record with Gramophone — Refined Edition
// ============================================
function VinylGramophone({ isInView }: { isInView: boolean }) {
  // Groove rings — subtle vinyl micro-grooves (reduced count for lightness)
  const grooveRings = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      radius: 32 + i * 4.2,
      opacity: 0.01 + (i % 3 === 0 ? 0.006 : 0),
    })),
  []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
      transition={{ duration: 1, type: "spring", stiffness: 70, damping: 18 }}
      className="relative flex items-center justify-center"
    >
      <div
        className="relative w-[200px] h-[200px] sm:w-[260px] sm:h-[260px] lg:w-[320px] lg:h-[320px]"
        style={{ contain: "layout style" }}
      >
        {/* Warm gold ambient glow */}
        <div
          className="absolute inset-[-14%] rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, oklch(0.78 0.16 75 / 0.08) 0%, oklch(0.70 0.14 65 / 0.04) 25%, oklch(0.38 0.16 348 / 0.02) 45%, transparent 65%)`,
          }}
        />

        {/* === The Vinyl Record (Spinning) === */}
        <div
          className="absolute inset-[4%] rounded-full animate-vinyl-spin"
          style={{
            background: `
              radial-gradient(circle at center,
                oklch(0.20 0.025 30) 0%,
                oklch(0.15 0.015 30) 28%,
                oklch(0.12 0.010 30) 29%,
                oklch(0.09 0.007 30) 60%,
                oklch(0.06 0.004 30) 100%
              ),
              repeating-radial-gradient(circle at center,
                oklch(0.12 0.010 30 / 0.85) 0px,
                oklch(0.08 0.005 30 / 0.92) 1px,
                oklch(0.10 0.008 30 / 0.88) 2px,
                oklch(0.07 0.004 30 / 0.95) 3px
              )
            `,
            boxShadow: `
              0 0 0 2.5px oklch(0.30 0.035 30 / 0.55),
              0 0 0 4.5px oklch(0.20 0.015 30 / 0.20),
              0 0 0 6px oklch(0.12 0.008 30 / 0.08),
              0 8px 32px -8px oklch(0 0 0 / 0.50),
              0 2px 8px -2px oklch(0 0 0 / 0.30),
              inset 0 0 80px -30px oklch(0.75 0.16 80 / 0.04)
            `,
          }}
        >
          {/* Groove ring micro-details */}
          {grooveRings.map((ring) => (
            <div
              key={ring.id}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: `${ring.radius * 2}%`,
                height: `${ring.radius * 2}%`,
                left: `${50 - ring.radius}%`,
                top: `${50 - ring.radius}%`,
                border: `1px solid oklch(1 0 0 / ${ring.opacity})`,
              }}
            />
          ))}

          {/* Primary light reflection arc */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: `conic-gradient(from 195deg, transparent 0deg, oklch(1 0 0 / 0.025) 20deg, oklch(1 0 0 / 0.05) 35deg, oklch(1 0 0 / 0.07) 45deg, oklch(1 0 0 / 0.05) 55deg, oklch(1 0 0 / 0.025) 70deg, transparent 90deg, transparent 360deg)`,
            }}
          />

          {/* === Center Label (Stationary — counter-rotates) === */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              animation: "vinyl-spin 4s linear infinite reverse",
              willChange: "transform",
            }}
          >
            {/* Center label — warm gold vinyl label */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: "44%",
                height: "44%",
                background: `
                  radial-gradient(circle at 38% 32%,
                    oklch(0.98 0.015 80) 0%,
                    oklch(0.93 0.05 70) 10%,
                    oklch(0.87 0.09 62) 22%,
                    oklch(0.80 0.13 55) 35%,
                    oklch(0.73 0.15 50) 48%,
                    oklch(0.66 0.14 48) 62%,
                    oklch(0.59 0.12 45) 78%,
                    oklch(0.52 0.10 42) 90%,
                    oklch(0.46 0.08 40) 100%
                  )
                `,
                boxShadow: `
                  0 0 0 1.5px oklch(0.82 0.18 80 / 0.45),
                  0 0 0 3px oklch(0.10 0.008 30 / 0.55),
                  0 0 0 4.5px oklch(0.82 0.18 80 / 0.06),
                  0 0 24px -4px oklch(0.78 0.16 80 / 0.25),
                  inset 0 0 18px -8px oklch(0.85 0.16 80 / 0.15)
                `,
              }}
            >
              {/* Decorative rings — refined */}
              <div className="absolute rounded-full pointer-events-none" style={{ inset: "4%", border: "1.5px solid oklch(0.82 0.18 80 / 0.35)" }} />
              <div className="absolute rounded-full pointer-events-none" style={{ inset: "9%", border: "1px solid oklch(0.82 0.18 80 / 0.18)" }} />
              <div className="absolute rounded-full pointer-events-none" style={{ inset: "14%", border: "0.5px solid oklch(0.82 0.18 80 / 0.08)" }} />
              {/* Center spindle hole */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  width: "10%",
                  height: "10%",
                  background: "oklch(0.06 0.004 30)",
                  boxShadow: "inset 0 1px 2px oklch(0 0 0 / 0.5), 0 0 0 0.5px oklch(0.18 0.008 30 / 0.35)",
                }}
              />
            </div>

            {/* === Logo — 9:16 portrait, elegantly centered on the label === */}
            <img
              src="/logo-footer-portrait.png"
              alt="Mehr Avaye Balout"
              className="absolute z-10 object-contain"
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                height: "34%",
                width: "auto",
                filter: "brightness(1.08) contrast(1.03) drop-shadow(0 1px 8px oklch(0 0 0 / 0.30)) drop-shadow(0 0 14px oklch(0.78 0.16 80 / 0.10))",
              }}
              draggable={false}
            />

            {/* Subtle warm glow behind logo */}
            <div
              className="absolute z-[5] rounded-full pointer-events-none"
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "30%",
                height: "30%",
                background: "radial-gradient(circle, oklch(0.85 0.16 80 / 0.12) 0%, oklch(0.78 0.14 75 / 0.04) 45%, transparent 70%)",
                filter: "blur(6px)",
              }}
            />

            {/* Label shimmer — gentle sweeping light */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: "44%",
                height: "44%",
                background: "linear-gradient(105deg, transparent 20%, oklch(0.82 0.18 80 / 0.04) 38%, oklch(1 0 0 / 0.08) 48%, oklch(0.82 0.18 80 / 0.04) 58%, transparent 80%)",
                backgroundSize: "250% 100%",
                animation: "label-shimmer 6s ease-in-out infinite",
              }}
            />
          </div>
        </div>

        {/* === Tonearm — clean metallic detail === */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-3%",
            right: "6%",
            width: "52%",
            height: "60%",
            transformOrigin: "84% 5%",
            animation: "tonearm-bounce 5s ease-in-out infinite",
          }}
        >
          <svg
            viewBox="0 0 200 160"
            fill="none"
            className="w-full h-full"
            style={{ filter: "drop-shadow(0 2px 6px oklch(0 0 0 / 0.25))" }}
          >
            {/* Tonearm base/pivot */}
            <circle cx="168" cy="10" r="9" fill="oklch(0.50 0.03 30)" />
            <circle cx="168" cy="10" r="6" fill="oklch(0.40 0.025 30)" />
            <circle cx="168" cy="10" r="3.5" fill="oklch(0.32 0.018 30)" />
            <circle cx="168" cy="10" r="1.5" fill="oklch(0.22 0.012 30)" />
            <circle cx="166" cy="8" r="1.2" fill="oklch(0.65 0.025 55 / 0.25)" />

            {/* Tonearm shaft */}
            <line x1="168" y1="10" x2="72" y2="90" stroke="oklch(0.55 0.035 30)" strokeWidth="3" strokeLinecap="round" />
            <line x1="167" y1="9" x2="71" y2="89" stroke="oklch(0.72 0.03 55 / 0.18)" strokeWidth="1" strokeLinecap="round" />

            {/* Counter-weight */}
            <ellipse cx="178" cy="7" rx="6" ry="3.5" fill="oklch(0.42 0.028 30)" transform="rotate(-12 178 7)" />
            <ellipse cx="178" cy="6" rx="4" ry="2" fill="oklch(0.52 0.03 32 / 0.4)" transform="rotate(-12 178 6)" />

            {/* Headshell */}
            <rect x="60" y="84" width="20" height="11" rx="2" fill="oklch(0.46 0.03 30)" transform="rotate(-42 71 90)" />
            <rect x="62" y="85" width="16" height="3.5" rx="1" fill="oklch(0.60 0.025 38 / 0.18)" transform="rotate(-42 71 87)" />

            {/* Cartridge */}
            <rect x="56" y="88" width="11" height="7" rx="1.5" fill="oklch(0.38 0.022 30)" transform="rotate(-42 62 92)" />

            {/* Stylus needle — gold tip */}
            <line x1="58" y1="94" x2="54" y2="101" stroke="oklch(0.78 0.18 80)" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="54" cy="101" r="1.5" fill="oklch(0.82 0.18 80 / 0.15)" />
          </svg>
        </div>

        {/* Turntable shadow */}
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "-5%",
            left: "12%",
            right: "12%",
            height: "10%",
            background: "radial-gradient(ellipse at center, oklch(0 0 0 / 0.06) 0%, transparent 70%)",
            filter: "blur(3px)",
          }}
        />
      </div>
    </motion.div>
  );
}

// ============================================
// Floating Musical Notes — Subtle atmosphere
// ============================================
function FloatingNotes() {
  const notes = useMemo(() => [
    { symbol: "♪", x: "10%", duration: 16, delay: 0, size: 13 },
    { symbol: "♫", x: "85%", duration: 19, delay: 5, size: 15 },
    { symbol: "𝄞", x: "25%", duration: 22, delay: 8, size: 16 },
    { symbol: "♩", x: "70%", duration: 17, delay: 3, size: 11 },
  ], []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {notes.map((note, i) => (
        <motion.span
          key={i}
          className="absolute text-primary/[0.03] dark:text-gold/[0.025] select-none"
          style={{
            left: note.x,
            fontSize: note.size,
            bottom: "-5%",
          }}
          animate={{
            y: [0, -700],
            x: [0, (i % 2 === 0 ? 12 : -12), 0],
            opacity: [0, 0.04, 0.04, 0],
            rotate: [0, 180],
          }}
          transition={{
            duration: note.duration,
            repeat: Infinity,
            ease: "linear",
            delay: note.delay,
          }}
        >
          {note.symbol}
        </motion.span>
      ))}
    </div>
  );
}

// ============================================
// Main Footer Component
// ============================================
export function Footer() {
  const { t, isRTL } = useI18n();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentYear = mounted ? new Date().getFullYear() : 2025;

  return (
    <footer
      ref={ref}
      className="relative mt-auto overflow-hidden"
    >
      {/* ===== Top Decorative Border ===== */}
      <div className="relative h-px w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
        <motion.div
          className="absolute top-0 h-full w-1/4 bg-gradient-to-r from-transparent via-gold/40 to-transparent"
          initial={{ x: "-100%" }}
          animate={isInView ? { x: "400%" } : {}}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        />
      </div>

      {/* ===== Main Footer Background ===== */}
      <div className="relative bg-gradient-to-b from-card/80 via-card/90 to-card">
        {/* Subtle background texture */}
        <div
          className="absolute inset-0 opacity-[0.012] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, oklch(0.38 0.16 348 / 0.25) 1px, transparent 1px)`,
            backgroundSize: "36px 36px",
          }}
        />

        {/* Floating musical notes */}
        <FloatingNotes />

        {/* Ambient glow orbs — refined */}
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-primary/[0.025] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-gold/[0.025] rounded-full blur-[90px] pointer-events-none" />

        {/* ===== Content ===== */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-8 relative">

          {/* ===== Gramophone Centerpiece ===== */}
          <div className="flex justify-center mb-6 sm:mb-8 lg:mb-9">
            <VinylGramophone isInView={isInView} />
          </div>

          {/* ===== Grid Content ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 mb-8">
            {/* Brand & Social */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="sm:col-span-2 lg:col-span-4 text-start"
            >
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto lg:mx-0">
                {t.footer.description}
              </p>

              {/* Social Icons */}
              <div className="flex items-center gap-2.5 mt-4">
                {[
                  { Icon: Instagram, href: "https://instagram.com/mehravaye_baloot", label: "Instagram", color: "hover:bg-pink-500/12 hover:border-pink-500/25 hover:text-pink-500" },
                  { Icon: Send, href: "https://t.me/mehravaye_baloot", label: "Telegram", color: "hover:bg-sky-500/12 hover:border-sky-500/25 hover:text-sky-500" },
                  { Icon: Youtube, href: "https://youtube.com/@mehravaye_baloot", label: "YouTube", color: "hover:bg-red-500/12 hover:border-red-500/25 hover:text-red-500" },
                ].map(({ Icon, href, label, color }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "w-9 h-9 rounded-lg bg-primary/[0.05] border border-border/25 flex items-center justify-center transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                      color
                    )}
                    aria-label={label}
                  >
                    <Icon className="w-4 h-4 text-muted-foreground group-hover:text-current transition-colors" />
                  </a>
                ))}
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="lg:col-span-3 text-start"
            >
              <h4 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">
                {t.footer.quick_links}
              </h4>
              <ul className="space-y-2" role="list">
                {quickLinks.map((key) => (
                  <li key={key}>
                    <button
                      onClick={() => scrollToSection(key)}
                      className="group text-sm text-muted-foreground hover:text-primary transition-all duration-300 relative inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1 focus-visible:ring-offset-card rounded"
                    >
                      <span className="relative">
                        {t.nav[key]}
                        <span className="absolute bottom-0 start-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="lg:col-span-3 text-start"
            >
              <h4 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">
                {t.footer.contact_info}
              </h4>
              <ul className="space-y-2.5" role="list">
                {[
                  { Icon: MapPin, text: isRTL ? "تهران، آیت‌الله سعیدی، بلوار معلم (محله بهداشت)، جنب خیابان سلیمانی، پلاک ۸۸" : "Tehran, Ayatollah Saeedi, Moallem Blvd (Behdasht), Next to Soleymani St., No. 88", dir: undefined },
                  { Icon: Phone, text: "021-66245295", dir: "ltr" as const },
                  { Icon: Phone, text: "0939-3565959", dir: "ltr" as const },
                  { Icon: Mail, text: "info@mehravayebalout.ir", dir: "ltr" as const },
                ].map(({ Icon, text, dir }) => (
                  <li key={text}>
                    <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Icon className="w-4 h-4 text-primary/60 mt-0.5 shrink-0" />
                      <span dir={dir}>{text}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* CTA Column */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="lg:col-span-2 text-start"
            >
              <h4 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">
                {t.workshops.upcoming}
              </h4>
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                {isRTL
                  ? "از آخرین کارگاه‌ها و رویدادهای ویژه مطلع شوید"
                  : "Stay updated with our latest workshops and special events"}
              </p>
              <button
                onClick={() => scrollToSection("workshops")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full text-sm font-medium shadow-[0_2px_10px_-2px_oklch(0.38_0.16_348/0.25)] transition-all duration-300 hover:shadow-[0_4px_14px_-4px_oklch(0.38_0.16_348/0.35)] hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              >
                <Music className="w-4 h-4" />
                {isRTL ? "مشاهده کارگاه‌ها" : "View Workshops"}
              </button>
            </motion.div>
          </div>

          {/* ===== Divider ===== */}
          <div className="relative h-px w-full mb-5">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-border/40 to-transparent" />
            <div className="absolute left-1/2 -translate-x-1/2 -top-1.5 w-3 h-3 rotate-45 bg-card border border-border/40" />
          </div>

          {/* ===== Bottom Bar ===== */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground"
          >
            {/* Copyright */}
            <p className="flex items-center gap-1">
              © {currentYear} {t.hero.title}. {t.footer.rights}.
            </p>

            {/* Back to top */}
            <button
              onClick={scrollToTop}
              className="group flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-sm"
              aria-label={isRTL ? "بازگشت به بالا" : "Back to top"}
            >
              <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
              <span>{isRTL ? "بازگشت به بالا" : "Back to top"}</span>
            </button>

            {/* Made with love */}
            <p className="flex items-center gap-1">
              {isRTL ? "ساخته شده با" : "Made with"}
              <Heart className="w-3 h-3 text-primary fill-primary animate-pulse" />
              {isRTL ? "در تهران" : "in Tehran"}
            </p>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}
