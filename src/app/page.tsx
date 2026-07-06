"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/sections/hero";
import { AnnouncementsSection } from "@/components/sections/announcements";
import { AboutSection } from "@/components/sections/about";
import { CoursesSection } from "@/components/sections/courses";
import { WorkshopsSection } from "@/components/sections/workshops";
import { BlogSection } from "@/components/sections/blog";
import { TestimonialsSection } from "@/components/sections/testimonials";
import { BlogPage } from "@/components/sections/blog-page";
import { AboutMostafaPage } from "@/components/sections/about-mostafa-page";
import { BranchesSection } from "@/components/sections/branches";
import { ContactSection } from "@/components/sections/contact";
import { SuperAdminPanel } from "@/components/admin/super-admin-panel";
import { LoginModal } from "@/components/auth/login-modal";
import { StudentDashboard } from "@/components/auth/student-dashboard";
import InstructorPanel from "@/components/instructor/instructor-panel";
import { useAuthStore } from "@/lib/auth/store";
import { useI18n } from "@/lib/i18n";
import { AnimatePresence, motion } from "framer-motion";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { SectionDivider } from "@/components/ui/section-divider";

export default function Home() {
  const { isRTL } = useI18n();
  const checkSession = useAuthStore((s) => s.checkSession);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const showAdminPanel = useAuthStore((s) => s.showAdminPanel);
  const setShowAdminPanel = useAuthStore((s) => s.setShowAdminPanel);
  const [showBlogPage, setShowBlogPage] = useState(false);
  const [showAboutPage, setShowAboutPage] = useState(false);
  const [selectedBlogPost, setSelectedBlogPost] = useState<unknown>(null);

  // Determine user role categories
  const isSuperAdmin = isAuthenticated && user?.userType === "admin" && user?.role === "super_admin";
  const isSubAdmin = isAuthenticated && user?.userType === "admin" && user?.role !== "super_admin";

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Handle blog post click from BlogPage
  const handleBlogPostClick = useCallback((post: unknown) => {
    setSelectedBlogPost(post);
  }, []);

  // Super admin: always show admin panel (no website)
  // Sub-admin: show website + admin panel toggle; when admin panel is open, hide website
  // Others: show website only
  const showWebsite = !isSuperAdmin && !(showAdminPanel && isSubAdmin);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Super Admin: Always show SuperAdminPanel full-screen (no website) */}
      {isSuperAdmin && (
        <SuperAdminPanel
          isOpen={true}
          onClose={() => setShowAdminPanel(false)}
        />
      )}

      {/* Sub-Admin: Show SuperAdminPanel when they explicitly open it */}
      {showAdminPanel && isSubAdmin && !isSuperAdmin && (
        <motion.div
          key="admin-fullscreen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-40 bg-background"
        >
          <SuperAdminPanel
            isOpen={true}
            onClose={() => setShowAdminPanel(false)}
          />
        </motion.div>
      )}

      {/* Website Content - hidden for super_admin or when sub-admin panel is open */}
      {showWebsite && (
        <>
          <ScrollProgress />
          <Header
            subPage={showAboutPage ? { title: isRTL ? "درباره مصطفی موگویی" : "About Mostafa Mogouyi", onBack: () => setShowAboutPage(false) }
              : showBlogPage ? { title: isRTL ? "بلاگ" : "Blog", onBack: () => setShowBlogPage(false) }
              : undefined}
          />
          <main id="main-content" className="flex-1 relative">
            <AnimatePresence mode="wait">
              {showAboutPage ? (
                <motion.div
                  key="about-page"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <AboutMostafaPage onBack={() => setShowAboutPage(false)} />
                </motion.div>
              ) : showBlogPage ? (
                <motion.div
                  key="blog-page"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <BlogPage
                    onBack={() => setShowBlogPage(false)}
                    onPostClick={handleBlogPostClick}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="home-page"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <HeroSection />
                  <SectionDivider />
                  <WorkshopsSection />
                  <SectionDivider variant="subtle" />
                  <AnnouncementsSection />
                  <SectionDivider variant="accent" />
                  <CoursesSection />
                  <SectionDivider />
                  <BlogSection onViewAll={() => setShowBlogPage(true)} />
                  <SectionDivider variant="subtle" />
                  <TestimonialsSection />
                  <SectionDivider variant="accent" />
                  <AboutSection onLearnMore={() => setShowAboutPage(true)} />
                  <SectionDivider />
                  <BranchesSection />
                  <SectionDivider variant="subtle" />
                  <ContactSection />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
          <Footer />
        </>
      )}

      {/* Student & Instructor Panels - always available */}
      <LoginModal />
      <StudentDashboard />
      <InstructorPanel />
    </div>
  );
}
