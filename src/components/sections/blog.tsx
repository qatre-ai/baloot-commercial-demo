"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { deferEffect } from "@/lib/react/defer-effect";
import Image from "next/image";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { SectionReveal } from "@/components/ui/section-reveal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Clock,
  Star,
  X,
  Share2,
  Link2,
  User,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Eye,
  Heart,
} from "lucide-react";

// ============================================
// Types
// ============================================
interface BlogCategory {
  id: string;
  nameFa: string;
  nameEn: string;
  slugFa: string;
  slugEn: string;
  color: string;
  icon: string | null;
  _count?: { posts: number };
}

interface BlogAuthor {
  id: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
}

interface BlogPost {
  id: string;
  titleFa: string;
  titleEn: string;
  slugFa: string;
  slugEn: string;
  contentFa: string;
  contentEn: string;
  excerptFa: string | null;
  excerptEn: string | null;
  coverUrl: string | null;
  coverAltFa: string | null;
  coverAltEn: string | null;
  categoryId: string | null;
  tags: string | null;
  readingTime: number;
  authorId: string | null;
  isFeatured: boolean;
  isShowOnHome: boolean;
  isPublished: boolean;
  publishedAt: string | null;
  viewCount: number;
  uniqueViewCount: number;
  shareCount: number;
  likeCount: number;
  createdAt: string;
  categories: BlogCategory[];
  author: BlogAuthor | null;
}

// ============================================
// Relative Date Formatter (client-only to avoid hydration)
// ============================================
function computeRelativeDate(dateStr: string, isRTL: boolean): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (isRTL) {
    if (diffMin < 1) return "همین الان";
    if (diffMin < 60) return `${toPersianNum(diffMin)} دقیقه پیش`;
    if (diffHr < 24) return `${toPersianNum(diffHr)} ساعت پیش`;
    if (diffDay < 7) return `${toPersianNum(diffDay)} روز پیش`;
    if (diffWeek < 5) return `${toPersianNum(diffWeek)} هفته پیش`;
    if (diffMonth < 12) return `${toPersianNum(diffMonth)} ماه پیش`;
    return `${toPersianNum(diffYear)} سال پیش`;
  }
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffWeek < 5) return `${diffWeek}w ago`;
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return `${diffYear}y ago`;
}

function useRelativeDate(dateStr: string | null, isRTL: boolean) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const relative = useMemo(() => {
    if (!dateStr || !mounted) return "";
    return computeRelativeDate(dateStr, isRTL);
  }, [dateStr, isRTL, mounted]);

  return relative;
}

function toPersianNum(n: number): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(n).replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}

// ============================================
// Gradient placeholders for posts without cover images
// ============================================
const GRADIENT_PALETTES = [
  "from-primary/40 via-primary/20 to-gold/10",
  "from-gold/30 via-primary/15 to-primary/30",
  "from-primary/30 via-gold/20 to-primary/15",
  "from-gold/25 via-primary/25 to-gold/15",
  "from-primary/35 via-gold/15 to-primary/20",
  "from-gold/20 via-primary/30 to-gold/25",
];

// ============================================
// Blog Card Skeleton
// ============================================
function BlogCardSkeleton({ isLarge }: { isLarge?: boolean }) {
  return (
    <Card className="overflow-hidden border-border/30 bg-card/60 backdrop-blur-sm">
      <div
        className={cn(
          "bg-muted/50 animate-pulse",
          isLarge ? "h-52 sm:h-64" : "h-40 sm:h-48"
        )}
      />
      <CardContent className="p-4 sm:p-5 space-y-3">
        <div className="h-5 w-20 rounded-full bg-muted/50 animate-pulse" />
        <div className="h-5 w-full rounded bg-muted/50 animate-pulse" />
        <div className="h-4 w-3/4 rounded bg-muted/50 animate-pulse" />
        <div className="flex gap-3 pt-3">
          <div className="h-4 w-20 rounded bg-muted/50 animate-pulse" />
          <div className="h-4 w-16 rounded bg-muted/50 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Blog Detail Modal
// ============================================
function BlogDetailModal({
  post,
  onClose,
  relatedPosts,
  onPostClick,
}: {
  post: BlogPost;
  onClose: () => void;
  relatedPosts: BlogPost[];
  onPostClick: (p: BlogPost) => void;
}) {
  const { t, isRTL, locale } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [coverLoaded, setCoverLoaded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const relativeDate = useRelativeDate(post.publishedAt, isRTL);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Track analytics on view
  useEffect(() => {
    const sessionId = sessionStorage.getItem("mab-session") || `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    if (!sessionStorage.getItem("mab-session")) {
      sessionStorage.setItem("mab-session", sessionId);
    }
    fetch("/api/blog/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId: post.id,
        sessionId,
        referrer: document.referrer || undefined,
        deviceType: window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop",
      }),
    }).catch(() => {});
  }, [post.id]);

  // Track read progress periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const el = contentRef.current;
      if (!el) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      const progress = scrollHeight <= clientHeight ? 100 : Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
      if (progress > 0) {
        const sessionId = sessionStorage.getItem("mab-session") || undefined;
        fetch("/api/blog/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postId: post.id,
            readProgress: progress,
            timeOnPage: 30,
            sessionId,
            deviceType: window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop",
          }),
        }).catch(() => {});
      }
    }, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [post.id]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Reading progress
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollHeight <= clientHeight) return;
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setScrollProgress(Math.min(progress, 100));
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  // Copy link
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback - ignore
    }
  }, []);

  // Share handler
  const handleShare = useCallback(async () => {
    const title = locale === "fa" ? post.titleFa : post.titleEn;
    if (navigator.share) {
      try {
        await navigator.share({ title, url: window.location.href });
      } catch {
        // User cancelled
      }
    } else {
      await handleCopyLink();
    }
  }, [post.titleFa, post.titleEn, locale, handleCopyLink]);

  const content = locale === "fa" ? post.contentFa : post.contentEn;
  const title = locale === "fa" ? post.titleFa : post.titleEn;
  const coverAlt =
    locale === "fa" ? post.coverAltFa || post.titleFa : post.coverAltEn || post.titleEn;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 flex items-start justify-center"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Reading progress bar */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          className="absolute top-0 left-0 right-0 h-1 bg-primary/20 z-[60] origin-left"
        >
          <div
            className="h-full bg-primary transition-all duration-150 ease-out"
            style={{ width: `${scrollProgress}%` }}
          />
        </motion.div>

        {/* Modal Content */}
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, y: 60, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.97 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-background rounded-t-2xl sm:rounded-2xl sm:my-8 shadow-2xl border border-border/50"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-muted transition-colors"
            style={isRTL ? { left: "1rem" } : { right: "1rem" }}
            aria-label={t.common.close}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Cover Image */}
          {post.coverUrl ? (
            <div className="relative h-56 sm:h-72 md:h-80 overflow-hidden rounded-t-2xl sm:rounded-t-2xl">
              {/* Shimmer placeholder */}
              {!coverLoaded && (
                <div className="absolute inset-0 bg-muted animate-pulse" />
              )}
              <Image
                src={post.coverUrl}
                alt={coverAlt}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className={cn(
                  "object-cover transition-opacity duration-300",
                  coverLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => setCoverLoaded(true)}
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
              {/* Category badges over cover */}
              {post.categories.length > 0 && (
                <div className="absolute bottom-4 start-4 flex flex-wrap gap-1.5">
                  {post.categories.map((cat) => (
                    <Badge
                      key={cat.id}
                      className="text-white border-0 font-semibold px-3 py-1"
                      style={{ backgroundColor: cat.color }}
                    >
                      {locale === "fa" ? cat.nameFa : cat.nameEn}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="relative h-32 sm:h-40 overflow-hidden rounded-t-2xl sm:rounded-t-2xl bg-gradient-to-br from-primary/30 via-gold/15 to-primary/10">
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-primary/30" />
              </div>
              {post.categories.length > 0 && (
                <div className="absolute bottom-4 start-4 flex flex-wrap gap-1.5">
                  {post.categories.map((cat) => (
                    <Badge
                      key={cat.id}
                      className="text-white border-0 font-semibold px-3 py-1"
                      style={{ backgroundColor: cat.color }}
                    >
                      {locale === "fa" ? cat.nameFa : cat.nameEn}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Structured Data (JSON-LD) for SEO */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                headline: title,
                image: post.coverUrl || undefined,
                datePublished: post.publishedAt || post.createdAt,
                author: post.author
                  ? {
                      "@type": "Person",
                      name: post.author.name,
                    }
                  : undefined,
                description: locale === "fa" ? post.excerptFa : post.excerptEn || undefined,
              }),
            }}
          />

          {/* Content area */}
          <div className="px-5 sm:px-8 md:px-10 pb-8" ref={contentRef}>
            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={cn(
                "text-2xl sm:text-3xl font-bold text-foreground leading-relaxed mt-6 mb-4",
                isRTL && "font-[Vazirmatn]"
              )}
            >
              {title}
            </motion.h1>

            {/* Meta row: author, date, reading time */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b border-border/50",
                isRTL && "flex-row-reverse"
              )}
            >
              {/* Author */}
              {post.author && (
                <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                  {post.author.avatarUrl ? (
                    <Image
                      src={post.author.avatarUrl}
                      alt={post.author.name}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <span className="font-medium text-foreground">{post.author.name}</span>
                </div>
              )}

              {/* Date */}
              <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                <Calendar className="w-4 h-4" />
                <span>{mounted ? relativeDate : ""}</span>
              </div>

              {/* Reading time */}
              <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                <Clock className="w-4 h-4" />
                <span>
                  {isRTL ? toPersianNum(post.readingTime) : post.readingTime} {t.blog.min_read}
                </span>
              </div>

              {/* Views */}
              {post.viewCount > 0 && (
                <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                  <Eye className="w-3.5 h-3.5" />
                  <span className="text-xs">
                    {isRTL ? toPersianNum(post.viewCount) : post.viewCount}
                  </span>
                </div>
              )}

              {/* Likes */}
              {post.likeCount > 0 && (
                <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                  <Heart className="w-3.5 h-3.5" />
                  <span className="text-xs">
                    {isRTL ? toPersianNum(post.likeCount) : post.likeCount}
                  </span>
                </div>
              )}

              {/* Share button */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className={cn(
                    "gap-1.5 text-muted-foreground hover:text-primary",
                    isRTL && "flex-row-reverse"
                  )}
                >
                  {copied ? (
                    <>
                      <Link2 className="w-4 h-4 text-green-500" />
                      <span className="text-green-500 text-xs">{t.blog.link_copied}</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span className="text-xs">{t.blog.share}</span>
                    </>
                  )}
                </Button>
              </div>
            </motion.div>

            {/* Tags */}
            {post.tags && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="flex flex-wrap gap-2 mb-6"
              >
                {post.tags.split(",").map((tag, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="text-xs px-2.5 py-0.5 bg-primary/5 text-primary border-primary/10"
                  >
                    {tag.trim()}
                  </Badge>
                ))}
              </motion.div>
            )}

            {/* Full HTML Content */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: content }}
            />

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-10 pt-8 border-t border-border/50"
              >
                <h3 className="text-lg font-bold text-foreground mb-4">
                  {t.blog.related_posts}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedPosts.slice(0, 2).map((rp) => (
                    <button
                      key={rp.id}
                      onClick={() => onPostClick(rp)}
                      className="text-start group"
                    >
                      <Card className="overflow-hidden border-border/30 bg-card/60 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                        {rp.coverUrl ? (
                          <div className="relative h-28 overflow-hidden">
                            <Image
                              src={rp.coverUrl}
                              alt={locale === "fa" ? rp.titleFa : rp.titleEn}
                              fill
                              sizes="(max-width: 640px) 50vw, 200px"
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div className="h-20 bg-gradient-to-br from-primary/20 to-gold/10" />
                        )}
                        <CardContent className="p-3">
                          <h4 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                            {locale === "fa" ? rp.titleFa : rp.titleEn}
                          </h4>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>
                              {isRTL ? toPersianNum(rp.readingTime) : rp.readingTime}{" "}
                              {t.blog.min_read}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================
// Blog Card Component
// ============================================
function BlogCard({
  post,
  index,
  isLarge,
  onClick,
}: {
  post: BlogPost;
  index: number;
  isLarge: boolean;
  onClick: () => void;
}) {
  const { t, isRTL, locale } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const relativeDate = useRelativeDate(post.publishedAt, isRTL);
  const title = locale === "fa" ? post.titleFa : post.titleEn;
  const excerpt = locale === "fa" ? post.excerptFa : post.excerptEn;
  const coverAlt =
    locale === "fa" ? post.coverAltFa || post.titleFa : post.coverAltEn || post.titleEn;
  const gradientIdx = index % GRADIENT_PALETTES.length;
  const hasCover = post.coverUrl && !imgError;
  const visibleCategories = post.categories.slice(0, 3);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className={cn(isLarge && "sm:col-span-2")}
    >
      <Card
        onClick={onClick}
        className="group relative overflow-hidden border-border/30 bg-card/80 backdrop-blur-sm hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:shadow-primary/8 hover:-translate-y-1 cursor-pointer h-full flex flex-col focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        {/* Cover Image / Gradient */}
        <div
          className={cn(
            "relative overflow-hidden",
            isLarge ? "h-52 sm:h-64" : "h-40 sm:h-48"
          )}
        >
          {hasCover ? (
            <>
              {/* Shimmer placeholder */}
              {!imgLoaded && (
                <div className="absolute inset-0 bg-muted animate-pulse" />
              )}
              <Image
                src={post.coverUrl!}
                alt={coverAlt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className={cn(
                  "object-cover group-hover:scale-105 transition-transform duration-700 ease-out",
                  imgLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
            </>
          ) : (
            <div
              className={cn(
                "w-full h-full bg-gradient-to-br group-hover:scale-105 transition-transform duration-700 ease-out",
                GRADIENT_PALETTES[gradientIdx]
              )}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen className={cn("text-primary/20", isLarge ? "w-16 h-16" : "w-12 h-12")} />
              </div>
            </div>
          )}

          {/* Featured badge */}
          {post.isFeatured && (
            <div className="absolute top-3 start-3">
              <Badge className="bg-gold text-gold-foreground border-0 gap-1 px-2.5 py-1 text-xs font-semibold shadow-lg shadow-gold/20">
                <Star className="w-3 h-3 fill-current" />
                {t.blog.featured}
              </Badge>
            </div>
          )}

          {/* Category badges over cover */}
          {visibleCategories.length > 0 && (
            <div className="absolute bottom-3 start-3 flex flex-wrap gap-1">
              {visibleCategories.map((cat, catIdx) => (
                <Badge
                  key={cat.id}
                  className={cn(
                    "text-white border-0 font-semibold shadow-md",
                    catIdx === 0
                      ? "text-[11px] px-2.5 py-0.5"
                      : "text-[10px] px-2 py-0.5 opacity-90"
                  )}
                  style={{ backgroundColor: cat.color }}
                >
                  {locale === "fa" ? cat.nameFa : cat.nameEn}
                </Badge>
              ))}
            </div>
          )}

          {/* View count badge for popular posts */}
          {post.viewCount > 50 && (
            <div className="absolute top-3 end-3">
              <Badge variant="secondary" className="bg-black/50 text-white border-0 text-[10px] gap-1 px-2 py-0.5">
                <Eye className="w-3 h-3" />
                {isRTL ? toPersianNum(post.viewCount) : post.viewCount}
              </Badge>
            </div>
          )}

          {/* Hover glow effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-t from-primary/5 to-transparent" />
        </div>

        <CardContent className="relative p-4 sm:p-5 flex flex-col flex-1 gap-2">
          {/* Title */}
          <h3
            className={cn(
              "text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2 leading-relaxed",
              isLarge && "sm:text-xl"
            )}
          >
            {title}
          </h3>

          {/* Excerpt */}
          {excerpt && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
              {excerpt}
            </p>
          )}

          {/* Footer: Author + Reading Time + Date */}
          <div className="flex items-center justify-between pt-3 mt-auto border-t border-border/40">
            <div
              className={cn(
                "flex items-center gap-2 text-xs text-muted-foreground",
                isRTL && "flex-row-reverse"
              )}
            >
              {/* Author avatar + name */}
              {post.author && (
                <>
                  {post.author.avatarUrl ? (
                    <Image
                      src={post.author.avatarUrl}
                      alt={post.author.name}
                      width={20}
                      height={20}
                      className="w-5 h-5 rounded-full object-cover ring-1 ring-border"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-3 h-3 text-primary" />
                    </div>
                  )}
                  <span className="truncate max-w-[80px] font-medium">
                    {post.author.name}
                  </span>
                </>
              )}

              <span className="text-border/60">|</span>

              {/* Reading time */}
              <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                <Clock className="w-3 h-3 shrink-0" />
                <span>
                  {isRTL ? toPersianNum(post.readingTime) : post.readingTime}{" "}
                  {t.blog.min_read}
                </span>
              </div>
            </div>

            {/* Date */}
            {mounted && relativeDate && (
              <span className="text-[11px] text-muted-foreground/70 whitespace-nowrap">
                {relativeDate}
              </span>
            )}
          </div>
        </CardContent>

        {/* Border glow on hover */}
        <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ring-1 ring-primary/20" />
      </Card>
    </motion.div>
  );
}

// ============================================
// Main Blog Section (Homepage - Compact)
// ============================================
export function BlogSection({ onViewAll }: { onViewAll?: () => void } = {}) {
  const { t, isRTL, locale } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);

  // Fetch posts marked to show on homepage
  useEffect(() => {
    const fetchHomePosts = async () => {
      setLoading(true);
      try {
        // Try fetching isShowOnHome posts first
        const res = await fetch("/api/blog?isShowOnHome=true&pageSize=4&sort=featured");
        const data = await res.json();
        const homePosts = data.posts || (Array.isArray(data) ? data : []);
        if (homePosts.length > 0) {
          setPosts(homePosts);
        } else {
          // Fallback: fetch latest published posts if no isShowOnHome posts exist
          const fallbackRes = await fetch("/api/blog?pageSize=4&sort=featured");
          const fallbackData = await fallbackRes.json();
          setPosts(fallbackData.posts || (Array.isArray(fallbackData) ? fallbackData : []));
        }
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHomePosts();
  }, []);

  // Fetch related posts when a post is selected
  useEffect(() => {
    if (!selectedPost || !selectedPost.categories?.[0]?.slugFa) {
      deferEffect(() => setRelatedPosts([]));
      return;
    }
    fetch(`/api/blog?category=${selectedPost.categories[0].slugFa}&pageSize=3`)
      .then((r) => r.json())
      .then((data) => {
        const posts = data.posts || (Array.isArray(data) ? data : []);
        setRelatedPosts(posts.filter((p: BlogPost) => p.id !== selectedPost.id));
      })
      .catch(() => setRelatedPosts([]));
  }, [selectedPost]);

  // Handle post click -> open detail
  const handlePostClick = useCallback((post: BlogPost) => {
    setSelectedPost(post);
  }, []);

  // Handle close detail
  const handleCloseDetail = useCallback(() => {
    setSelectedPost(null);
  }, []);

  // Separate featured and regular posts for layout
  const { featuredPosts } = useMemo(() => {
    const featured = posts.filter((p) => p.isFeatured);
    return { featuredPosts: featured };
  }, [posts]);

  return (
    <section id="blog" ref={ref} className="py-20 sm:py-28 relative bg-muted/30" aria-label={t.blog.title}>
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-gold/3 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <SectionReveal animation="fade-left" delay={0}>
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase mb-4">
              {t.blog.tag}
            </span>
          </SectionReveal>
          <SectionReveal animation="fade-left" delay={0.1}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
              {t.blog.title}
            </h2>
          </SectionReveal>
          <SectionReveal animation="fade-up" delay={0.2}>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {t.blog.description}
            </p>
          </SectionReveal>
        </div>

        {/* Blog Cards Grid - Compact for Homepage */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            <div className="sm:col-span-2">
              <BlogCardSkeleton isLarge />
            </div>
            <BlogCardSkeleton />
            <BlogCardSkeleton />
            <BlogCardSkeleton />
          </div>
        ) : posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">{t.blog.no_posts}</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            <AnimatePresence mode="popLayout">
              {posts.slice(0, 4).map((post, index) => {
                // First featured post is large (span 2 cols on desktop)
                const isLarge =
                  post.isFeatured &&
                  featuredPosts.indexOf(post) < 1;

                return (
                  <BlogCard
                    key={post.id}
                    post={post}
                    index={index}
                    isLarge={isLarge}
                    onClick={() => handlePostClick(post)}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* View All Button */}
        {!loading && posts.length > 0 && onViewAll && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="text-center mt-10 sm:mt-14"
          >
            <Button
              variant="outline"
              size="lg"
              onClick={onViewAll}
              className="rounded-full px-8 border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-lg shadow-primary/5 hover:shadow-primary/20"
            >
              {t.blog.go_to_blog}
              {isRTL ? (
                <ArrowLeft className="w-4 h-4 ms-2" />
              ) : (
                <ArrowRight className="w-4 h-4 ms-2" />
              )}
            </Button>
          </motion.div>
        )}
      </div>

      {/* Blog Detail Modal */}
      {selectedPost && (
        <BlogDetailModal
          post={selectedPost}
          onClose={handleCloseDetail}
          relatedPosts={relatedPosts}
          onPostClick={handlePostClick}
        />
      )}
    </section>
  );
}
