"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { SectionReveal } from "@/components/ui/section-reveal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Star, Quote, ChevronLeft, ChevronRight, CheckCircle2,
  Sparkles, Users, Loader2,
} from "lucide-react";

// ─── Types ─────────────────────────────────────
interface Testimonial {
  id: string;
  name: string;
  googleAvatarUrl: string | null;
  googleEmail: string | null;
  rating: number;
  titleFa: string | null;
  titleEn: string | null;
  contentFa: string;
  contentEn: string | null;
  instrument: string | null;
  source: string;
  isFeatured: boolean;
  displayOrder: number;
  createdAt: string;
}

// ─── Helpers ────────────────────────────────────
function formatTimeAgo(dateStr: string, isRTL: boolean): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const months = Math.floor(days / 30);
  if (mins < 1) return isRTL ? "همین الان" : "Just now";
  if (mins < 60) return isRTL ? `${mins} دقیقه پیش` : `${mins}m ago`;
  if (hours < 24) return isRTL ? `${hours} ساعت پیش` : `${hours}h ago`;
  if (days < 30) return isRTL ? `${days} روز پیش` : `${days}d ago`;
  if (months < 12) return isRTL ? `${months} ماه پیش` : `${months}mo ago`;
  return isRTL ? `${Math.floor(months / 12)} سال پیش` : `${Math.floor(months / 12)}y ago`;
}

// Hook to avoid hydration mismatch with relative dates
function useRelativeTimeAgo(dateStr: string, isRTL: boolean) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return "";
  return formatTimeAgo(dateStr, isRTL);
}

function formatNumber(num: number, isRTL: boolean): string {
  return isRTL ? num.toLocaleString("fa-IR") : num.toString();
}

// ─── Google Colors SVG ─────────────────────────
function GoogleBadge({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

// ─── Star Rating Display ───────────────────────
function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "w-5 h-5" : size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClass,
            star <= rating
              ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_3px_rgba(251,191,36,0.4)]"
              : "text-gray-200 dark:text-gray-700"
          )}
        />
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────
export function TestimonialsSection() {
  const { isRTL } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);

  // Fetch testimonials
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await fetch("/api/testimonials?limit=12");
        if (res.ok) {
          const data = await res.json();
          setTestimonials(data.testimonials || []);
        }
      } catch {
        // Silently handle fetch errors — testimonials are non-critical
      } finally {
        setLoading(false);
      }
    };
    fetchTestimonials();
  }, []);

  // Auto-scroll for mobile carousel
  useEffect(() => {
    if (isPaused || testimonials.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, testimonials.length]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setCurrentIndex((prev) => Math.min(prev + 1, testimonials.length - 1));
      } else {
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
      }
    }
  };

  // Average rating
  const avgRating = testimonials.length > 0
    ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)
    : "0";

  // Show empty state if no testimonials
  const isEmpty = !loading && testimonials.length === 0;

  return (
    <section
      id="testimonials"
      ref={ref}
      className="py-20 sm:py-28 relative overflow-hidden"
    >
      {/* ─── Background ──────────────────────── */}
      <div className="absolute inset-0 -z-10">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/[0.02] to-background" />
        {/* Decorative floating elements */}
        <div className="absolute top-20 right-[10%] w-72 h-72 bg-amber-200/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-[15%] w-96 h-96 bg-rose-200/10 rounded-full blur-3xl" />
        {/* Top divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        {/* Bottom divider */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* ─── Section Header ─────────────────── */}
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-18">
          <SectionReveal animation="fade-scale" delay={0}>
            {/* Tag */}
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-semibold tracking-wide mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              {isRTL ? "نظرات هنرجویان" : "Student Reviews"}
            </span>
          </SectionReveal>

          <SectionReveal animation="fade-up" delay={0.1}>
            {/* Title */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-5 leading-tight">
              {isRTL ? "صدای هنرجویان ما" : "Voices of Our Students"}
            </h2>
          </SectionReveal>

          <SectionReveal animation="fade-up" delay={0.2}>
            {/* Subtitle */}
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6">
              {isRTL
                ? "نظرات واقعی هنرجویان ما که با عشق موسیقی را تجربه کرده‌اند"
                : "Real reviews from our students who have experienced music with passion"
              }
            </p>
          </SectionReveal>

          {/* Rating Summary + Google Badge */}
          <div className={cn("flex items-center justify-center gap-4 flex-wrap", isRTL && "flex-row-reverse")}>
            {testimonials.length > 0 && (
              <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <span className="text-2xl font-bold text-amber-500">{formatNumber(parseFloat(avgRating), isRTL)}</span>
                <StarRating rating={Math.round(parseFloat(avgRating))} size="md" />
                <span className="text-sm text-muted-foreground">
                  ({formatNumber(testimonials.length, isRTL)} {isRTL ? "نظر" : "reviews"})
                </span>
              </div>
            )}
            <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-gray-700 shadow-sm", isRTL && "flex-row-reverse")}>
              <GoogleBadge className="w-4 h-4" />
              <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
                {isRTL ? "تأیید شده توسط گوگل" : "Verified by Google"}
              </span>
            </div>
          </div>
        </div>

        {/* ─── Testimonials Grid (Desktop/Tablet) ─ */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-border/30 bg-card/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1">
                      <div className="h-4 w-24 bg-muted rounded animate-pulse mb-2" />
                      <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="h-3 w-full bg-muted rounded animate-pulse mb-2" />
                  <div className="h-3 w-3/4 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-center py-12"
          >
            <Card className="max-w-md mx-auto border-border/30 bg-card/60 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {isRTL ? "هنوز نظری ثبت نشده" : "No reviews yet"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {isRTL
                    ? "شما اولین نفری باشید که تجربه خود را با ما به اشتراک می‌گذارید!"
                    : "Be the first to share your experience with us!"
                  }
                </p>
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  {isRTL ? "ارسال نظر" : "Leave a Review"}
                </a>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Desktop: Grid layout */}
            <div className="hidden lg:grid grid-cols-3 gap-6">
              {testimonials.slice(0, 6).map((testimonial, i) => (
                <TestimonialCard
                  key={testimonial.id}
                  testimonial={testimonial}
                  isRTL={isRTL}
                  index={i}
                  isInView={isInView}
                />
              ))}
            </div>

            {/* Tablet: 2 columns */}
            <div className="hidden md:grid lg:hidden grid-cols-2 gap-5">
              {testimonials.slice(0, 4).map((testimonial, i) => (
                <TestimonialCard
                  key={testimonial.id}
                  testimonial={testimonial}
                  isRTL={isRTL}
                  index={i}
                  isInView={isInView}
                />
              ))}
            </div>

            {/* Mobile: Carousel */}
            <div
              className="md:hidden"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: isRTL ? -40 : 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isRTL ? 40 : -40 }}
                  transition={{ duration: 0.3 }}
                >
                  <TestimonialCard
                    testimonial={testimonials[currentIndex]}
                    isRTL={isRTL}
                    index={0}
                    isInView={true}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Navigation arrows */}
              {testimonials.length > 1 && (
                <div className={cn("flex items-center justify-center gap-4 mt-4", isRTL && "flex-row-reverse")}>
                  <button
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="w-9 h-9 rounded-full bg-background border border-border/50 flex items-center justify-center disabled:opacity-30 hover:bg-muted transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Dots — limited to max 7 with range indicator */}
                  <div className="flex items-center gap-1.5">
                    {(() => {
                      const MAX_DOTS = 7;
                      const total = testimonials.length;
                      if (total <= MAX_DOTS) {
                        return testimonials.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentIndex(i)}
                            className={cn(
                              "w-2 h-2 rounded-full transition-all duration-300",
                              i === currentIndex
                                ? "bg-primary w-5"
                                : "bg-muted-foreground/20 hover:bg-muted-foreground/40"
                            )}
                          />
                        ));
                      }
                      // Calculate visible range around current index
                      const halfVisible = Math.floor((MAX_DOTS - 2) / 2); // -2 for first and last always visible
                      let start = Math.max(1, currentIndex - halfVisible);
                      const end = Math.min(total - 2, start + (MAX_DOTS - 3)); // -3 for first, last, and ellipsis
                      start = Math.max(1, end - (MAX_DOTS - 3));

                      const dots: React.ReactNode[] = [];
                      // First dot
                      dots.push(
                        <button
                          key={0}
                          onClick={() => setCurrentIndex(0)}
                          className={cn(
                            "w-2 h-2 rounded-full transition-all duration-300",
                            currentIndex === 0
                              ? "bg-primary w-5"
                              : "bg-muted-foreground/20 hover:bg-muted-foreground/40"
                          )}
                        />
                      );
                      // Leading ellipsis
                      if (start > 1) {
                        dots.push(
                          <span key="leading-ellipsis" className="w-2 h-2 flex items-center justify-center text-muted-foreground/40 text-[8px]">
                            •••
                          </span>
                        );
                      }
                      // Middle dots
                      for (let i = start; i <= end; i++) {
                        dots.push(
                          <button
                            key={i}
                            onClick={() => setCurrentIndex(i)}
                            className={cn(
                              "w-2 h-2 rounded-full transition-all duration-300",
                              i === currentIndex
                                ? "bg-primary w-5"
                                : "bg-muted-foreground/20 hover:bg-muted-foreground/40"
                            )}
                          />
                        );
                      }
                      // Trailing ellipsis
                      if (end < total - 2) {
                        dots.push(
                          <span key="trailing-ellipsis" className="w-2 h-2 flex items-center justify-center text-muted-foreground/40 text-[8px]">
                            •••
                          </span>
                        );
                      }
                      // Last dot
                      dots.push(
                        <button
                          key={total - 1}
                          onClick={() => setCurrentIndex(total - 1)}
                          className={cn(
                            "w-2 h-2 rounded-full transition-all duration-300",
                            currentIndex === total - 1
                              ? "bg-primary w-5"
                              : "bg-muted-foreground/20 hover:bg-muted-foreground/40"
                          )}
                        />
                      );
                      return dots;
                    })()}
                  </div>

                  <button
                    onClick={() => setCurrentIndex((prev) => Math.min(testimonials.length - 1, prev + 1))}
                    disabled={currentIndex === testimonials.length - 1}
                    className="w-9 h-9 rounded-full bg-background border border-border/50 flex items-center justify-center disabled:opacity-30 hover:bg-muted transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// ─── Testimonial Card Component ────────────────
function TestimonialCard({
  testimonial,
  isRTL,
  index,
  isInView,
}: {
  testimonial: Testimonial;
  isRTL: boolean;
  index: number;
  isInView: boolean;
}) {
  const isGoogleVerified = !!testimonial.googleEmail || testimonial.source === "google";
  const content = isRTL ? testimonial.contentFa : (testimonial.contentEn || testimonial.contentFa);
  const title = isRTL ? testimonial.titleFa : testimonial.titleEn;
  const timeAgo = useRelativeTimeAgo(testimonial.createdAt, isRTL);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="group relative border-border/30 bg-card/60 backdrop-blur-sm hover:border-amber-200/50 dark:hover:border-amber-800/30 hover:shadow-xl hover:shadow-amber-100/20 dark:hover:shadow-amber-900/10 transition-all duration-500 overflow-hidden">
        {/* Decorative quote mark */}
        <div className={cn(
          "absolute -top-2 text-8xl font-serif text-primary/[0.04] select-none pointer-events-none leading-none",
          isRTL ? "-left-2" : "-right-2"
        )}>
          <Quote className="w-16 h-16" />
        </div>

        <CardContent className="relative p-6">
          {/* Stars */}
          <div className={cn("flex items-center gap-2 mb-3", isRTL && "flex-row-reverse")}>
            <StarRating rating={testimonial.rating} size="sm" />
            {isGoogleVerified && (
              <div className="ms-auto flex items-center gap-1">
                <GoogleBadge className="w-3.5 h-3.5" />
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              </div>
            )}
          </div>

          {/* Title */}
          {title && (
            <h4 className={cn("text-sm font-semibold text-foreground mb-2 line-clamp-1", isRTL && "text-right")}>
              {title}
            </h4>
          )}

          {/* Content */}
          <p className={cn("text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-4", isRTL && "text-right")}>
            &ldquo;{content}&rdquo;
          </p>

          {/* Context badge */}
          {testimonial.instrument && (
            <div className={cn("mb-3", isRTL && "text-right")}>
              <Badge variant="secondary" className="text-[10px] bg-primary/5 text-primary border-primary/10">
                <Sparkles className="w-2.5 h-2.5 me-1" />
                {testimonial.instrument}
              </Badge>
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent mb-3" />

          {/* Author */}
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {testimonial.googleAvatarUrl ? (
                <img
                  src={testimonial.googleAvatarUrl}
                  alt={testimonial.name}
                  className={cn(
                    "w-10 h-10 rounded-full object-cover",
                    isGoogleVerified && "ring-2 ring-blue-400/30 ring-offset-2 ring-offset-background"
                  )}
                />
              ) : (
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5",
                  isGoogleVerified && "ring-2 ring-blue-400/30 ring-offset-2 ring-offset-background"
                )}>
                  <span className="text-sm font-bold text-primary">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
              )}
              {/* Google verified checkmark */}
              {isGoogleVerified && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-700">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                </div>
              )}
            </div>

            {/* Name + Time */}
            <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
              <div className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse justify-end")}>
                <h5 className="text-sm font-semibold text-foreground truncate">{testimonial.name}</h5>
                {testimonial.isFeatured && (
                  <Badge className="bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[9px] px-1.5 py-0">
                    <Star className="w-2.5 h-2.5 fill-current me-0.5" />
                    {isRTL ? "ویژه" : "Featured"}
                  </Badge>
                )}
              </div>
              <div className={cn("flex items-center gap-2 mt-0.5", isRTL && "flex-row-reverse justify-end")}>
                {testimonial.googleEmail && (
                  <span className="text-[11px] text-muted-foreground truncate" dir="ltr">
                    {testimonial.googleEmail.split("@")[0]}
                  </span>
                )}
                <span className="text-[11px] text-muted-foreground/60">
                  {timeAgo}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
