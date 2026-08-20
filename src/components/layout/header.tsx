"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useAuthStore } from "@/lib/auth/store";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  Menu, Moon, Sun, Globe, LogIn, User, Music, Shield,
  LayoutDashboard, LogOut, ArrowLeft, ArrowRight, Home, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { getRoleHome, resolveApplicationRole } from "@/lib/application-shell/contract";

const navKeys = ["announcements", "about", "courses", "workshops", "blog", "branches", "contact"] as const;

// Consistent easing curve for all header animations
const headerEase = [0.22, 1, 0.36, 1] as const;

// Hydration-safe mounted check using useSyncExternalStore
const emptySubscribe = () => () => {};
function useHasMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export interface SubPageContext {
  title: string;
  onBack: () => void;
}

export function Header({ subPage }: { subPage?: SubPageContext }) {
  const router = useRouter();
  const { t, locale, setLocale, isRTL } = useI18n();
  const { theme, setTheme } = useTheme();
  const {
    user, isAuthenticated, showAdminPanel,
    setShowLoginModal, logout, checkSession,
  } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mounted = useHasMounted();

  // Determine user type
  const isAdminUser = isAuthenticated && user?.userType === "admin";
  const isInstructorUser = isAuthenticated && user?.role === "instructor";
  const isStudentUser = isAuthenticated && user?.userType !== "admin" && user?.role !== "instructor";

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const toggleLanguage = () => {
    setLocale(locale === "fa" ? "en" : "fa");
  };

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
  };

  const handleBack = () => {
    setMobileOpen(false);
    subPage?.onBack();
  };

  const openApplication = () => {
    const role = resolveApplicationRole(user);
    if (role) router.push(getRoleHome(role));
  };

  // When in sub-page mode, always use solid glass-morphism background
  const isSubPage = !!subPage;
  const headerBg = isSubPage
    ? "bg-background/90 backdrop-blur-xl shadow-[0_1px_3px_0_oklch(0_0_0/0.05),0_4px_12px_-4px_oklch(0_0_0/0.08)] border-b border-border/40"
    : scrolled
      ? "bg-background/80 backdrop-blur-xl shadow-[0_1px_3px_0_oklch(0_0_0/0.05),0_4px_12px_-4px_oklch(0_0_0/0.08)] border-b border-border/40"
      : "bg-transparent";

  // Duration for staggered nav item animations
  const navItemDuration = 0.25;
  const navItemStagger = 0.03; // 30ms stagger

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        showAdminPanel && isAdminUser ? "hidden" : "",
        headerBg
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">

          {/* ─── Left: Logo + (Back button on mobile in sub-page) ────────── */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* ── Mobile: Back arrow button in sub-page mode ── */}
            <AnimatePresence>
              {isSubPage && (
                <motion.button
                  initial={{ opacity: 0, x: isRTL ? 12 : -12, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: isRTL ? 12 : -12, scale: 0.8 }}
                  transition={{ duration: 0.35, ease: headerEase }}
                  onClick={handleBack}
                  aria-label={isRTL ? "بازگشت به صفحه اصلی" : "Back to Home"}
                  className={cn(
                    "md:hidden flex items-center justify-center",
                    "w-9 h-9 rounded-full",
                    "bg-primary/10 hover:bg-primary/20 border border-primary/15 hover:border-primary/30",
                    "text-primary",
                    "transition-all duration-300 hover:shadow-md hover:shadow-primary/5",
                    "shrink-0"
                  )}
                >
                  {isRTL ? (
                    <ArrowRight className="w-4 h-4" />
                  ) : (
                    <ArrowLeft className="w-4 h-4" />
                  )}
                </motion.button>
              )}
            </AnimatePresence>

            {/* ── Logo — 9:16 portrait aspect ratio ── */}
            {/* In sub-page mode: logo is brand identity only (no navigation). Use breadcrumb (desktop) or back arrow (mobile) to go back. */}
            <button
              onClick={() => { if (!isSubPage) scrollToSection("hero"); }}
              className={cn(
                "group relative transition-all duration-300",
                !isSubPage && "hover:scale-[1.06]",
                isSubPage && "cursor-default",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "rounded-lg shrink-0"
              )}
              aria-label={isRTL ? "مهر آوای بلوط" : "Mehr Avaye Balout"}
            >
              <div className="relative w-8 h-[57px] sm:w-[42px] sm:h-[75px] rounded-lg bg-card border border-primary/15 group-hover:border-primary/40 transition-all duration-300 shadow-[0_2px_8px_-2px_oklch(0.38_0.16_348/0.15),0_1px_3px_-1px_oklch(0_0_0/0.08)] group-hover:shadow-[0_4px_14px_-4px_oklch(0.38_0.16_348/0.25),0_2px_6px_-2px_oklch(0_0_0/0.1)]">
                <img
                  src="/logo-header-portrait.png"
                  alt="Mehr Avaye Balout"
                  className="w-full h-full object-contain object-center p-[2px]"
                  draggable={false}
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/0 via-primary/0 to-gold/0 group-hover:from-primary/[0.06] group-hover:to-gold/[0.08] transition-all duration-500 pointer-events-none" />
              </div>
            </button>
          </div>

          {/* ─── Center: Nav (home) ↔ Breadcrumb (sub-page) transition ─── */}
          <div className="flex-1 flex justify-center">
            <AnimatePresence mode="wait">
              {/* ── Home Mode: Staggered nav links ── */}
              {!isAdminUser && !isSubPage && (
                <motion.nav
                  key="main-nav"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: navItemStagger } },
                    exit: { transition: { staggerChildren: navItemStagger, staggerDirection: -1 } },
                  }}
                  className="hidden md:flex items-center gap-0.5"
                  role="navigation"
                  aria-label={isRTL ? "منوی اصلی" : "Main navigation"}
                >
                  {navKeys.map((key) => (
                    <motion.button
                      key={key}
                      variants={{
                        hidden: { opacity: 0, y: 8 },
                        visible: { opacity: 1, y: 0, transition: { duration: navItemDuration, ease: headerEase } },
                        exit: { opacity: 0, y: -8, transition: { duration: navItemDuration, ease: headerEase } },
                      }}
                      onClick={() => scrollToSection(key)}
                      className="relative px-3 lg:px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-300 rounded-lg hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1 focus-visible:ring-offset-background group/nav"
                    >
                      {t.nav[key]}
                      <span className="absolute bottom-1 start-3 end-3 h-px bg-primary scale-x-0 group-hover/nav:scale-x-100 transition-transform duration-300" />
                    </motion.button>
                  ))}
                </motion.nav>
              )}

              {/* ── Sub-page Mode: Breadcrumb pill ── */}
              {isSubPage && (
                <motion.div
                  key="breadcrumb"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.4, delay: 0.1, ease: headerEase }}
                  className="hidden md:flex items-center"
                >
                  <div
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full",
                      "bg-muted/50 backdrop-blur-sm border border-border/50",
                      "shadow-[0_1px_3px_0_oklch(0_0_0/0.04)]"
                    )}
                  >
                    {/* Back arrow + Home link */}
                    <button
                      onClick={handleBack}
                      className={cn(
                        "flex items-center gap-1.5",
                        "text-sm text-muted-foreground hover:text-primary",
                        "transition-colors duration-200 group/breadcrumb"
                      )}
                    >
                      {isRTL ? (
                        <ArrowRight className="w-3.5 h-3.5 group-hover/breadcrumb:-translate-x-0.5 transition-transform duration-200" />
                      ) : (
                        <ArrowLeft className="w-3.5 h-3.5 group-hover/breadcrumb:-translate-x-0.5 transition-transform duration-200" />
                      )}
                      <Home className="w-3 h-3 opacity-60 group-hover/breadcrumb:opacity-100 transition-opacity duration-200" />
                      <span>{isRTL ? "صفحه اصلی" : "Home"}</span>
                    </button>

                    {/* Chevron separator */}
                    {isRTL ? (
                      <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                    )}

                    {/* Page title — highlighted */}
                    <span className="text-sm font-semibold text-primary truncate max-w-[240px]">
                      {subPage.title}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Mobile: Page title centered in sub-page mode ── */}
            <AnimatePresence>
              {isSubPage && (
                <motion.span
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.35, ease: headerEase }}
                  className="md:hidden absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-foreground truncate max-w-[45vw]"
                >
                  {subPage.title}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* ─── Right: Actions ────────────────────────────────────────── */}
          <motion.div
            animate={isSubPage ? { scale: [1, 1.02, 1] } : { scale: 1 }}
            transition={{ duration: 0.4, ease: headerEase, delay: 0.15 }}
            className="flex items-center gap-1.5 sm:gap-2"
          >
            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLanguage}
              className="relative w-9 h-9 rounded-full hover:bg-primary/10"
              aria-label="Toggle language"
            >
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span className="absolute -bottom-0.5 -end-0.5 text-[9px] font-bold text-primary">
                {locale === "fa" ? "EN" : "فا"}
              </span>
            </Button>

            {/* Theme Toggle */}
            {mounted ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-9 h-9 rounded-full hover:bg-primary/10"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 text-gold" />
                ) : (
                  <Moon className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="w-9 h-9 rounded-full hover:bg-primary/10"
                aria-label="Toggle theme"
              >
                <Moon className="w-4 h-4 text-muted-foreground" />
              </Button>
            )}

            {/* Auth Button - Desktop */}
            {isAuthenticated && user ? (
              <>
                {isAdminUser && (
                  <Button
                    onClick={openApplication}
                    variant="ghost"
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 transition-all duration-300"
                  >
                    <LayoutDashboard className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-medium text-foreground">
                      {user.role === "super_admin"
                        ? (isRTL ? "سوپر ادمین" : "Super Admin")
                        : (isRTL ? "پنل مدیریت" : "Admin Panel")}
                    </span>
                  </Button>
                )}

                {isInstructorUser && (
                  <Button
                    onClick={openApplication}
                    variant="ghost"
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 hover:bg-sky-500/20 transition-all duration-300"
                  >
                    <Music className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span className="text-sm font-medium text-foreground">{isRTL ? "پنل مدرس" : "Instructor"}</span>
                  </Button>
                )}

                <button
                  onClick={() => {
                    openApplication();
                  }}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-all duration-300 group"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-primary-foreground" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors max-w-[80px] truncate">
                    {user.name}
                  </span>
                </button>
              </>
            ) : (
              <Button
                onClick={() => setShowLoginModal(true)}
                className="hidden sm:flex bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-5 shadow-[0_2px_10px_-2px_oklch(0.38_0.16_348/0.35)] hover:shadow-[0_4px_16px_-4px_oklch(0.38_0.16_348/0.4)] transition-all duration-300"
                size="sm"
              >
                <LogIn className="w-4 h-4 me-1.5" />
                {isRTL ? "ورود هنرجو" : "Student Login"}
              </Button>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden w-9 h-9">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side={isRTL ? "right" : "left"} className="w-72 bg-background/95 backdrop-blur-xl border-e-0">
                <SheetTitle className="text-primary font-bold text-lg mb-6 flex items-center gap-3">
                  <div className="w-8 h-[57px] rounded-lg bg-card border border-primary/15">
                    <img src="/logo-header-portrait.png" alt="" className="w-full h-full object-contain object-center p-[2px]" draggable={false} />
                  </div>
                  {t.hero.title}
                </SheetTitle>
                <nav className="flex flex-col gap-2">
                  {/* Sub-page: Back to Home first */}
                  {isSubPage && (
                    <motion.button
                      initial={{ opacity: 0, x: isRTL ? 16 : -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, ease: headerEase }}
                      onClick={handleBack}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-base font-medium text-primary hover:bg-primary/5 rounded-xl transition-all duration-200",
                        isRTL ? "text-right flex-row-reverse" : "text-left"
                      )}
                    >
                      {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                      <Home className="w-4 h-4" />
                      {isRTL ? "بازگشت به صفحه اصلی" : "Back to Home"}
                    </motion.button>
                  )}

                  {/* Navigation links - only on home page, hide for admin users */}
                  {!isAdminUser && !isSubPage && navKeys.map((key) => (
                    <button
                      key={key}
                      onClick={() => scrollToSection(key)}
                      className="px-4 py-3 text-base font-medium text-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all duration-200 text-start"
                    >
                      {t.nav[key]}
                    </button>
                  ))}

                  {/* Sub-page: Show key navigation shortcuts */}
                  {isSubPage && !isAdminUser && (
                    <>
                      <div className="h-px bg-border/50 my-1" />
                      <p className="px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">
                        {isRTL ? "دسترسی سریع" : "Quick Access"}
                      </p>
                      {["courses", "contact", "branches"].map((key) => (
                        <button
                          key={key}
                          onClick={() => {
                            handleBack();
                            setTimeout(() => {
                              document.getElementById(key)?.scrollIntoView({ behavior: "smooth" });
                            }, 500);
                          }}
                          className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200 text-start"
                        >
                          {t.nav[key as keyof typeof t.nav]}
                        </button>
                      ))}
                    </>
                  )}

                  <div className="mt-4 pt-4 border-t space-y-2">
                    {isAuthenticated && user ? (
                      <>
                        {isAdminUser && (
                          <Button
                            onClick={() => { openApplication(); setMobileOpen(false); }}
                            className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-xl gap-2 border border-amber-500/20"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            {user.role === "super_admin"
                              ? (isRTL ? "پنل سوپر ادمین" : "Super Admin Panel")
                              : (isRTL ? "پنل مدیریت" : "Admin Panel")}
                          </Button>
                        )}
                        {isInstructorUser && (
                          <Button
                            onClick={() => { openApplication(); setMobileOpen(false); }}
                            variant="outline"
                            className="w-full rounded-xl gap-2 border-sky-500/30 hover:border-sky-500/60 text-sky-600 dark:text-sky-400"
                          >
                            <Music className="w-4 h-4" />
                            {isRTL ? "پنل مدرس" : "Instructor Panel"}
                          </Button>
                        )}
                        {isStudentUser && (
                          <Button
                            onClick={() => { openApplication(); setMobileOpen(false); }}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2"
                          >
                            <User className="w-4 h-4" />
                            {isRTL ? "پنل هنرجو" : "Student Panel"}
                          </Button>
                        )}
                        <Button
                          onClick={handleLogout}
                          variant="outline"
                          className="w-full rounded-xl gap-2 text-red-500 border-red-500/20 hover:bg-red-500/10"
                        >
                          <LogOut className="w-4 h-4" />
                          {isRTL ? "خروج" : "Logout"}
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => { setShowLoginModal(true); setMobileOpen(false); }}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2"
                      >
                        <LogIn className="w-4 h-4" />
                        {isRTL ? "ورود هنرجو" : "Student Login"}
                      </Button>
                    )}
                    {!isAdminUser && !isSubPage && (
                      <Button
                        onClick={() => { scrollToSection("contact"); setMobileOpen(false); }}
                        variant="outline"
                        className="w-full rounded-xl"
                      >
                        {t.nav.contact}
                      </Button>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </motion.div>
        </div>
      </div>
    </header>
  );
}
