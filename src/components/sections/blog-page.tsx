"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  BookOpen,
  Clock,
  Star,
  User,
  Calendar,
  ArrowLeft,
  ArrowRight,
  X,
  Share2,
  Link2,
  ChevronDown,
  LayoutGrid,
  List,
  TrendingUp,
  Eye,
  Heart,
  Loader2,
  SlidersHorizontal,
  ArrowUp,
  Filter,
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
// Helper Functions
// ============================================
function toPersianNum(n: number): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(n).replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}

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

// ============================================
// Gradient Palettes (for posts without covers)
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
// Sort Types
// ============================================
type SortOption = "newest" | "popular" | "featured";
type ViewMode = "grid" | "list";

// ============================================
// Animated Counter Hook
// ============================================
function useAnimatedCounter(target: number, duration: number = 1200) {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target === prevTarget.current) return;
    prevTarget.current = target;

    const start = 0;
    const diff = target - start;
    const startTime = performance.now();

    function step(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(start + diff * eased));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }, [target, duration]);

  return count;
}

// ============================================
// Skeleton Components
// ============================================
function BlogGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card
          key={i}
          className="overflow-hidden border-border/30 bg-card/60 backdrop-blur-sm"
        >
          <div className="h-40 sm:h-48 bg-muted/50 animate-pulse" />
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
      ))}
    </div>
  );
}

function BlogListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card
          key={i}
          className="overflow-hidden border-border/30 bg-card/60 backdrop-blur-sm flex flex-col sm:flex-row"
        >
          <div className="w-full sm:w-48 h-40 sm:h-auto bg-muted/50 animate-pulse sm:rounded-s-none rounded-t-lg sm:rounded-t-none" />
          <CardContent className="p-4 sm:p-5 flex-1 space-y-3">
            <div className="h-5 w-20 rounded-full bg-muted/50 animate-pulse" />
            <div className="h-5 w-full rounded bg-muted/50 animate-pulse" />
            <div className="h-4 w-3/4 rounded bg-muted/50 animate-pulse" />
            <div className="flex gap-3 pt-3">
              <div className="h-4 w-20 rounded bg-muted/50 animate-pulse" />
              <div className="h-4 w-16 rounded bg-muted/50 animate-pulse" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================
// Post Grid Card
// ============================================
function PostGridCard({
  post,
  index,
  onClick,
}: {
  post: BlogPost;
  index: number;
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
  const isPopular = post.viewCount > 50;
  const visibleCategories = post.categories.slice(0, 2);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.4) }}
    >
      <Card
        onClick={onClick}
        className="group relative overflow-hidden border-border/30 bg-card/80 backdrop-blur-sm hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:shadow-primary/8 hover:-translate-y-1 cursor-pointer h-full flex flex-col"
      >
        {/* Cover Image / Gradient */}
        <div className="relative overflow-hidden h-44 sm:h-48">
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
                <BookOpen className="w-12 h-12 text-primary/20" />
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

          {/* Popular badge */}
          {isPopular && !post.isFeatured && (
            <div className="absolute top-3 start-3">
              <Badge className="bg-primary/90 text-primary-foreground border-0 gap-1 px-2 py-1 text-xs font-semibold shadow-lg">
                <TrendingUp className="w-3 h-3" />
                {isRTL ? "محبوب" : "Popular"}
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

          {/* View count badge */}
          {post.viewCount > 0 && (
            <div className="absolute bottom-3 end-3">
              <span className="flex items-center gap-1 text-[10px] text-white/80 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
                <Eye className="w-3 h-3" />
                {isRTL ? toPersianNum(post.viewCount) : post.viewCount}
              </span>
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
              isRTL && "font-[Vazirmatn]"
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
                  <span className="truncate max-w-[70px] font-medium">
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
// Post List Card (horizontal layout)
// ============================================
function PostListCard({
  post,
  index,
  onClick,
}: {
  post: BlogPost;
  index: number;
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
  const visibleCategories = post.categories.slice(0, 2);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: isRTL ? -30 : 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
    >
      <Card
        onClick={onClick}
        className="group relative overflow-hidden border-border/30 bg-card/80 backdrop-blur-sm hover:border-primary/30 transition-all duration-500 hover:shadow-lg hover:shadow-primary/8 cursor-pointer flex flex-col sm:flex-row"
      >
        {/* Cover Image / Gradient */}
        <div className="relative overflow-hidden w-full sm:w-52 h-44 sm:h-auto sm:min-h-[160px] shrink-0">
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
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/40 via-transparent to-transparent" />
            </>
          ) : (
            <div
              className={cn(
                "w-full h-full bg-gradient-to-br group-hover:scale-105 transition-transform duration-700 ease-out",
                GRADIENT_PALETTES[gradientIdx]
              )}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-primary/20" />
              </div>
            </div>
          )}

          {/* Featured badge */}
          {post.isFeatured && (
            <div className="absolute top-3 start-3">
              <Badge className="bg-gold text-gold-foreground border-0 gap-1 px-2 py-0.5 text-[10px] font-semibold shadow-lg shadow-gold/20">
                <Star className="w-2.5 h-2.5 fill-current" />
                {t.blog.featured}
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="relative p-4 sm:p-5 flex flex-col flex-1 gap-2">
          {/* Category badges */}
          {visibleCategories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {visibleCategories.map((cat, catIdx) => (
                <Badge
                  key={cat.id}
                  className={cn(
                    "text-white border-0 font-semibold w-fit",
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

          {/* Title */}
          <h3
            className={cn(
              "text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2 leading-relaxed",
              isRTL && "font-[Vazirmatn]"
            )}
          >
            {title}
          </h3>

          {/* Excerpt */}
          {excerpt && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {excerpt}
            </p>
          )}

          {/* Meta row */}
          <div
            className={cn(
              "flex items-center gap-3 text-xs text-muted-foreground pt-2 mt-auto",
              isRTL && "flex-row-reverse"
            )}
          >
            {/* Author */}
            {post.author && (
              <div className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse")}>
                {post.author.avatarUrl ? (
                  <Image
                    src={post.author.avatarUrl}
                    alt={post.author.name}
                    width={16}
                    height={16}
                    className="w-4 h-4 rounded-full object-cover ring-1 ring-border"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-2.5 h-2.5 text-primary" />
                  </div>
                )}
                <span className="truncate max-w-[80px] font-medium">{post.author.name}</span>
              </div>
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

            <span className="text-border/60">|</span>

            {/* Views */}
            {post.viewCount > 0 && (
              <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                <Eye className="w-3 h-3 shrink-0" />
                <span>{isRTL ? toPersianNum(post.viewCount) : post.viewCount}</span>
              </div>
            )}

            {/* Date */}
            {mounted && relativeDate && (
              <>
                <span className="text-border/60 hidden sm:inline">|</span>
                <span className="hidden sm:inline text-muted-foreground/70 whitespace-nowrap">
                  {relativeDate}
                </span>
              </>
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
// Featured Hero Card
// ============================================
function FeaturedHeroCard({
  post,
  onClick,
}: {
  post: BlogPost;
  onClick: () => void;
}) {
  const { t, isRTL, locale } = useI18n();
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const relativeDate = useRelativeDate(post.publishedAt, isRTL);

  const title = locale === "fa" ? post.titleFa : post.titleEn;
  const excerpt = locale === "fa" ? post.excerptFa : post.excerptEn;
  const coverAlt =
    locale === "fa" ? post.coverAltFa || post.titleFa : post.coverAltEn || post.titleEn;
  const hasCover = post.coverUrl && !imgError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card
        onClick={onClick}
        className="group relative overflow-hidden border-border/30 bg-card/80 backdrop-blur-sm hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 cursor-pointer"
      >
        <div className="relative h-64 sm:h-80 md:h-96 overflow-hidden">
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
                sizes="(max-width: 768px) 100vw, 768px"
                className={cn(
                  "object-cover group-hover:scale-105 transition-transform duration-700 ease-out",
                  imgLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
            </>
          ) : (
            <div
              className={cn(
                "w-full h-full bg-gradient-to-br group-hover:scale-105 transition-transform duration-700 ease-out",
                GRADIENT_PALETTES[0]
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen className="w-20 h-20 text-primary/15" />
              </div>
            </div>
          )}

          {/* Content overlay */}
          <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8">
            {/* Badges row */}
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-gold text-gold-foreground border-0 gap-1 px-2.5 py-1 text-xs font-semibold shadow-lg shadow-gold/20">
                <Star className="w-3 h-3 fill-current" />
                {t.blog.featured_article}
              </Badge>
              {post.categories.map((cat) => (
                <Badge
                  key={cat.id}
                  className="text-white border-0 text-xs font-semibold px-2.5 py-1 shadow-md"
                  style={{ backgroundColor: cat.color }}
                >
                  {locale === "fa" ? cat.nameFa : cat.nameEn}
                </Badge>
              ))}
            </div>

            {/* Title */}
            <h2
              className={cn(
                "text-xl sm:text-2xl md:text-3xl font-bold text-white leading-relaxed mb-3 line-clamp-3",
                isRTL && "font-[Vazirmatn]"
              )}
            >
              {title}
            </h2>

            {/* Excerpt */}
            {excerpt && (
              <p className="text-sm sm:text-base text-white/80 leading-relaxed line-clamp-2 mb-4 max-w-2xl">
                {excerpt}
              </p>
            )}

            {/* Meta row */}
            <div
              className={cn(
                "flex items-center gap-4 text-sm text-white/70",
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
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-white/30"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <span className="font-medium text-white/90">{post.author.name}</span>
                </div>
              )}

              {/* Reading time */}
              <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                <Clock className="w-4 h-4" />
                <span>
                  {isRTL ? toPersianNum(post.readingTime) : post.readingTime}{" "}
                  {t.blog.min_read}
                </span>
              </div>

              {/* Views */}
              {post.viewCount > 0 && (
                <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                  <Eye className="w-4 h-4" />
                  <span>{isRTL ? toPersianNum(post.viewCount) : post.viewCount}</span>
                </div>
              )}

              {/* Date */}
              {relativeDate && (
                <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                  <Calendar className="w-4 h-4" />
                  <span>{relativeDate}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ============================================
// Main BlogPage Component
// ============================================
export function BlogPage({
  onBack,
  onPostClick,
}: {
  onBack: () => void;
  onPostClick: (post: BlogPost) => void;
}) {
  const { t, isRTL, locale } = useI18n();

  // ---- State ----
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [page, setPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mounted, setMounted] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageSize = 9;

  // ---- Animated counters ----
  const animatedArticleCount = useAnimatedCounter(totalPosts, 1000);
  const totalViews = useMemo(
    () => posts.reduce((sum, p) => sum + (p.viewCount || 0), 0),
    [posts]
  );
  const animatedViewCount = useAnimatedCounter(totalViews, 1200);

  // ---- Mount ----
  useEffect(() => {
    setMounted(true);
  }, []);

  // ---- Debounce search ----
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ---- Fetch categories ----
  useEffect(() => {
    fetch("/api/blog-categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  // ---- Fetch posts ----
  const fetchPosts = useCallback(
    async (
      opts?: {
        pageNum?: number;
        append?: boolean;
        category?: string | null;
        search?: string;
        sort?: SortOption;
      }
    ) => {
      const pNum = opts?.pageNum ?? 1;
      const append = opts?.append ?? false;
      const cat = opts?.category !== undefined ? opts.category : activeCategory;
      const search = opts?.search !== undefined ? opts.search : debouncedSearch;
      const sort = opts?.sort ?? sortOption;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams({
          page: String(pNum),
          pageSize: String(pageSize),
          sort,
        });
        if (cat) params.set("category", cat);
        if (search) params.set("search", search);

        const res = await fetch(`/api/blog?${params.toString()}`);
        const data = await res.json();

        const newPosts: BlogPost[] = Array.isArray(data?.posts) ? data.posts : [];
        const total = data?.total ?? 0;
        const tPages = data?.totalPages ?? 1;

        setPosts((prev) => (append ? [...prev, ...newPosts] : newPosts));
        setTotalPosts(total);
        setTotalPages(tPages);
        setPage(pNum);
      } catch {
        if (!append) setPosts([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeCategory, debouncedSearch, sortOption, pageSize]
  );

  // Initial fetch & refetch when filters change
  useEffect(() => {
    fetchPosts({ pageNum: 1, append: false });
  }, [activeCategory, debouncedSearch, sortOption]);

  // ---- Handlers ----
  const handleCategoryClick = useCallback(
    (slug: string | null) => {
      setActiveCategory(slug);
      setPage(1);
    },
    []
  );

  const handleSortChange = useCallback((sort: SortOption) => {
    setSortOption(sort);
    setPage(1);
  }, []);

  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    fetchPosts({ pageNum: nextPage, append: true });
  }, [page, fetchPosts]);

  const handleClearFilters = useCallback(() => {
    setActiveCategory(null);
    setSearchQuery("");
    setDebouncedSearch("");
    setSortOption("newest");
    setPage(1);
  }, []);

  // ---- Scroll to top ----
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setShowScrollTop(container.scrollTop > 400);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // ---- Derived data ----
  const featuredPost = useMemo(() => {
    if (sortOption !== "featured" && sortOption !== "newest") return null;
    return posts.find((p) => p.isFeatured) || null;
  }, [posts, sortOption]);

  const regularPosts = useMemo(() => {
    if (featuredPost && sortOption !== "popular") {
      return posts.filter((p) => p.id !== featuredPost.id);
    }
    return posts;
  }, [posts, featuredPost, sortOption]);

  const hasActiveFilters = activeCategory || debouncedSearch || sortOption !== "newest";

  // ---- Keyboard support ----
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onBack();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onBack]);

  // ---- Page animation variants ----
  const pageVariants = {
    hidden: { x: 0, y: 0 },
    enter: {
      x: 0,
      y: 0,
      transition: { type: "spring", damping: 28, stiffness: 300 },
    },
    exit: {
      x: 0,
      y: 0,
      transition: { duration: 0.25 },
    },
  };

  // For mobile: slide from bottom; desktop: slide from right
  const mobilePageVariants = {
    hidden: { y: "100%" },
    enter: {
      y: 0,
      transition: { type: "spring", damping: 30, stiffness: 300 },
    },
    exit: {
      y: "100%",
      transition: { duration: 0.25 },
    },
  };

  const desktopPageVariants = {
    hidden: { x: "100%" },
    enter: {
      x: 0,
      transition: { type: "spring", damping: 30, stiffness: 300 },
    },
    exit: {
      x: "100%",
      transition: { duration: 0.25 },
    },
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-background"
        initial="hidden"
        animate="enter"
        exit="exit"
        variants={pageVariants}
      >
        {/* Mobile version */}
        <motion.div
          className="sm:hidden fixed inset-0 z-50 bg-background flex flex-col"
          initial="hidden"
          animate="enter"
          exit="exit"
          variants={mobilePageVariants}
        >
          <BlogPageContent
            onBack={onBack}
            onPostClick={onPostClick}
            posts={posts}
            categories={categories}
            loading={loading}
            loadingMore={loadingMore}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeCategory={activeCategory}
            handleCategoryClick={handleCategoryClick}
            sortOption={sortOption}
            handleSortChange={handleSortChange}
            viewMode={viewMode}
            setViewMode={setViewMode}
            page={page}
            totalPosts={totalPosts}
            totalPages={totalPages}
            handleLoadMore={handleLoadMore}
            handleClearFilters={handleClearFilters}
            hasActiveFilters={!!hasActiveFilters}
            featuredPost={featuredPost}
            regularPosts={regularPosts}
            animatedArticleCount={animatedArticleCount}
            animatedViewCount={animatedViewCount}
            showScrollTop={showScrollTop}
            scrollToTop={scrollToTop}
            scrollContainerRef={scrollContainerRef}
            mounted={mounted}
            isMobile
          />
        </motion.div>

        {/* Desktop version */}
        <motion.div
          className="hidden sm:flex fixed inset-0 z-50 bg-background flex-col"
          initial="hidden"
          animate="enter"
          exit="exit"
          variants={desktopPageVariants}
        >
          <BlogPageContent
            onBack={onBack}
            onPostClick={onPostClick}
            posts={posts}
            categories={categories}
            loading={loading}
            loadingMore={loadingMore}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeCategory={activeCategory}
            handleCategoryClick={handleCategoryClick}
            sortOption={sortOption}
            handleSortChange={handleSortChange}
            viewMode={viewMode}
            setViewMode={setViewMode}
            page={page}
            totalPosts={totalPosts}
            totalPages={totalPages}
            handleLoadMore={handleLoadMore}
            handleClearFilters={handleClearFilters}
            hasActiveFilters={!!hasActiveFilters}
            featuredPost={featuredPost}
            regularPosts={regularPosts}
            animatedArticleCount={animatedArticleCount}
            animatedViewCount={animatedViewCount}
            showScrollTop={showScrollTop}
            scrollToTop={scrollToTop}
            scrollContainerRef={scrollContainerRef}
            mounted={mounted}
            isMobile={false}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================
// Shared Content Component (used by both mobile & desktop)
// ============================================
function BlogPageContent({
  onBack,
  onPostClick,
  posts,
  categories,
  loading,
  loadingMore,
  searchQuery,
  setSearchQuery,
  activeCategory,
  handleCategoryClick,
  sortOption,
  handleSortChange,
  viewMode,
  setViewMode,
  page,
  totalPosts,
  totalPages,
  handleLoadMore,
  handleClearFilters,
  hasActiveFilters,
  featuredPost,
  regularPosts,
  animatedArticleCount,
  animatedViewCount,
  showScrollTop,
  scrollToTop,
  scrollContainerRef,
  mounted,
  isMobile,
}: {
  onBack: () => void;
  onPostClick: (post: BlogPost) => void;
  posts: BlogPost[];
  categories: BlogCategory[];
  loading: boolean;
  loadingMore: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeCategory: string | null;
  handleCategoryClick: (slug: string | null) => void;
  sortOption: SortOption;
  handleSortChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  page: number;
  totalPosts: number;
  totalPages: number;
  handleLoadMore: () => void;
  handleClearFilters: () => void;
  hasActiveFilters: boolean;
  featuredPost: BlogPost | null;
  regularPosts: BlogPost[];
  animatedArticleCount: number;
  animatedViewCount: number;
  showScrollTop: boolean;
  scrollToTop: () => void;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  mounted: boolean;
  isMobile: boolean;
}) {
  const { t, isRTL, locale } = useI18n();

  return (
    <>
      {/* ====== Page Header ====== */}
      <div className="relative shrink-0 border-b border-border/50">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-gold/3 to-primary/3 -z-10" />
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Top row: back button + title */}
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className={cn(
                "shrink-0 gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all",
                isRTL && "flex-row-reverse"
              )}
            >
              {isRTL ? (
                <ArrowRight className="w-4 h-4" />
              ) : (
                <ArrowLeft className="w-4 h-4" />
              )}
              <span className="text-sm">{t.blog.back_to_home}</span>
            </Button>
          </div>

          {/* Title + description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto mb-5 sm:mb-6"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase mb-3">
              {t.blog.tag}
            </span>
            <h1
              className={cn(
                "text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 leading-tight",
                isRTL && "font-[Vazirmatn]"
              )}
            >
              {t.blog.blog_page_title}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {t.blog.blog_page_description}
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-xl mx-auto mb-5"
          >
            <div className="relative">
              <Search
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground",
                  isRTL ? "right-3" : "left-3"
                )}
              />
              <Input
                type="text"
                placeholder={t.blog.search_placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "w-full bg-card/80 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-all ps-10 pe-10 h-11 rounded-xl",
                  isRTL && "pe-10 ps-10 text-right"
                )}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors",
                    isRTL ? "left-3" : "right-3"
                  )}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className={cn(
              "flex items-center justify-center gap-6 sm:gap-8 text-sm",
              isRTL && "flex-row-reverse"
            )}
          >
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">{t.blog.total_articles}:</span>
              <span className="font-bold text-foreground">
                {mounted
                  ? isRTL
                    ? toPersianNum(animatedArticleCount)
                    : animatedArticleCount
                  : "—"}
              </span>
            </div>
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Eye className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">{t.blog.total_views}:</span>
              <span className="font-bold text-foreground">
                {mounted
                  ? isRTL
                    ? toPersianNum(animatedViewCount)
                    : animatedViewCount
                  : "—"}
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ====== Filter/Sort Bar (sticky) ====== */}
      <div className="sticky top-0 z-40 shrink-0 border-b border-border/50 bg-background/95 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col gap-3">
            {/* Category pills */}
            {categories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {/* All categories */}
                <button
                  onClick={() => handleCategoryClick(null)}
                  className={cn(
                    "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border",
                    activeCategory === null
                      ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                      : "bg-card text-muted-foreground border-border/50 hover:border-primary/30 hover:text-primary"
                  )}
                >
                  {t.blog.all_categories}
                </button>

                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.slugFa)}
                    className={cn(
                      "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border",
                      activeCategory === cat.slugFa
                        ? "text-white border-transparent shadow-lg"
                        : "bg-card text-muted-foreground border-border/50 hover:border-primary/30 hover:text-primary"
                    )}
                    style={
                      activeCategory === cat.slugFa
                        ? { backgroundColor: cat.color }
                        : undefined
                    }
                  >
                    {locale === "fa" ? cat.nameFa : cat.nameEn}
                  </button>
                ))}
              </div>
            )}

            {/* Sort + view mode row */}
            <div className="flex items-center justify-between gap-3">
              <div
                className={cn(
                  "flex items-center gap-2 flex-1 min-w-0",
                  isRTL && "flex-row-reverse"
                )}
              >
                {/* Sort buttons */}
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
                  {(
                    [
                      { key: "newest", label: t.blog.sort_newest, icon: Clock },
                      { key: "popular", label: t.blog.sort_popular, icon: TrendingUp },
                      { key: "featured", label: t.blog.sort_featured, icon: Star },
                    ] as const
                  ).map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => handleSortChange(key)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                        sortOption === key
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="w-3 h-3" />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </div>

                {/* Active filter indicator */}
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className={cn(
                      "shrink-0 flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors",
                      isRTL && "flex-row-reverse"
                    )}
                  >
                    <X className="w-3 h-3" />
                    <span>{t.blog.clear_filter}</span>
                  </button>
                )}
              </div>

              {/* View mode toggle */}
              <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5 shrink-0">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-1.5 rounded-md transition-all duration-200",
                    viewMode === "grid"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-1.5 rounded-md transition-all duration-200",
                    viewMode === "list"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ====== Scrollable Content ====== */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
        style={{
          scrollbarGutter: "stable",
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* ====== Featured Hero ====== */}
          {!loading && featuredPost && viewMode === "grid" && (
            <div className="mb-8">
              <FeaturedHeroCard
                post={featuredPost}
                onClick={() => onPostClick(featuredPost)}
              />
            </div>
          )}

          {/* ====== Loading State ====== */}
          {loading ? (
            viewMode === "grid" ? (
              <BlogGridSkeleton />
            ) : (
              <BlogListSkeleton />
            )
          ) : regularPosts.length === 0 ? (
            /* ====== Empty States ====== */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                {debouncedSearch ? (
                  <Search className="w-10 h-10 text-muted-foreground/40" />
                ) : (
                  <BookOpen className="w-10 h-10 text-muted-foreground/40" />
                )}
              </div>
              <h3
                className={cn(
                  "text-xl font-bold text-foreground mb-2",
                  isRTL && "font-[Vazirmatn]"
                )}
              >
                {debouncedSearch ? t.blog.no_results : t.blog.no_posts}
              </h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                {debouncedSearch ? t.blog.try_different : ""}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="rounded-full gap-2"
                >
                  <Filter className="w-4 h-4" />
                  {t.blog.clear_filter}
                </Button>
              )}
            </motion.div>
          ) : (
            /* ====== Posts Grid / List ====== */
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                  <AnimatePresence mode="popLayout">
                    {regularPosts.map((post, index) => (
                      <PostGridCard
                        key={post.id}
                        post={post}
                        index={index}
                        onClick={() => onPostClick(post)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <AnimatePresence mode="popLayout">
                    {regularPosts.map((post, index) => (
                      <PostListCard
                        key={post.id}
                        post={post}
                        index={index}
                        onClick={() => onPostClick(post)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* ====== Load More / Pagination ====== */}
              <div className="mt-8 sm:mt-10">
                {/* Post count indicator */}
                <div
                  className={cn(
                    "text-center text-sm text-muted-foreground mb-4",
                    isRTL && "font-[Vazirmatn]"
                  )}
                >
                  {t.blog.showing_posts}{" "}
                  <span className="font-semibold text-foreground">
                    {isRTL ? toPersianNum(posts.length) : posts.length}
                  </span>{" "}
                  {t.blog.of}{" "}
                  <span className="font-semibold text-foreground">
                    {isRTL ? toPersianNum(totalPosts) : totalPosts}
                  </span>{" "}
                  {isRTL ? "مقاله" : "articles"}
                </div>

                {/* Load More button */}
                {page < totalPages && (
                  <div className="text-center">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="rounded-full px-8 border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-lg shadow-primary/5 hover:shadow-primary/20 gap-2"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{t.blog.loading}</span>
                        </>
                      ) : (
                        <>
                          <span>{t.blog.load_more}</span>
                          <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ====== Scroll to Top Button ====== */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToTop}
            className="fixed bottom-6 end-6 z-50 w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/25 hover:bg-primary/90 transition-colors flex items-center justify-center"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
