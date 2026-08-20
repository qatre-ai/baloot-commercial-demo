"use client";

import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuthStore } from "@/lib/auth/store";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LogIn, UserPlus, Mail, Lock, Phone, User,
  Music, Sparkles, Eye, EyeOff, Loader2, AlertCircle,
  ClipboardList
} from "lucide-react";
import { RegistrationForm } from "./registration-form";

type AuthTab = "login" | "register";

export function LoginModal() {
  const { isRTL } = useI18n();
  const { showLoginModal, setShowLoginModal, login, adminLogin } = useAuthStore();
  const setLastLoginError = useAuthStore((s) => s.setLastLoginError);
  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Reset error and submitting state when modal opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setError(null);
      setIsSubmitting(false);
      setLastLoginError(null);
    }
    setShowLoginModal(open);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLastLoginError(null);
    if (!loginEmail || !loginPassword) {
      setError(isRTL ? "ایمیل/شماره تلفن و رمز عبور الزامی است" : "Email/phone and password are required");
      return;
    }
    setIsSubmitting(true);
    // Smart login routing: if email looks like an admin email, try admin first; otherwise try student first
    const looksLikeAdmin = loginEmail.endsWith('@mab.ir') || loginEmail.endsWith('@mehravayebalout.ir');
    const genericError = isRTL ? "ایمیل/شماره تلفن یا رمز عبور اشتباه است" : "Invalid email/phone or password";
    if (looksLikeAdmin) {
      const adminSuccess = await adminLogin(loginEmail, loginPassword);
      if (adminSuccess) { setIsSubmitting(false); return; }
      setError(useAuthStore.getState().lastLoginError || genericError);
    } else {
      // Try student/instructor login first for regular emails
      const success = await login(loginEmail, loginPassword);
      if (success) { setIsSubmitting(false); return; }
      const studentErr = useAuthStore.getState().lastLoginError;
      // Fallback to admin login
      const adminSuccess = await adminLogin(loginEmail, loginPassword);
      if (!adminSuccess) {
        const finalErr = useAuthStore.getState().lastLoginError || studentErr || genericError;
        setError(finalErr);
      }
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={showLoginModal} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-background/95 backdrop-blur-2xl border-border/50">
        {/* Header with decorative background */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-primary/10 via-gold/5 to-primary/5">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 right-8 text-primary/10 text-4xl">♪</div>
            <div className="absolute bottom-2 left-12 text-gold/10 text-3xl">♫</div>
            <div className="absolute top-2 left-4 text-primary/5 text-5xl">𝄞</div>
          </div>

          <DialogHeader className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <DialogTitle className="text-xl font-bold">
                {isRTL ? "مهر آوای بلوط" : "Mehr Avaye Balout"}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {isRTL ? "ورود یا ثبت‌نام در حساب کاربری" : "Sign in or register for an account"}
              </DialogDescription>
            </div>
            <p className="text-sm text-muted-foreground">
              {activeTab === "login"
                ? (isRTL ? "به حساب کاربری خود وارد شوید" : "Sign in to your account")
                : (isRTL ? "حساب کاربری جدید ایجاد کنید" : "Create a new account")
              }
            </p>
          </DialogHeader>

          {/* Tabs */}
          <div className={cn("flex gap-2 mt-4 relative", isRTL && "flex-row-reverse")}>
            <button
              onClick={() => { setActiveTab("login"); setError(null); }}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2",
                activeTab === "login"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground"
              )}
            >
              <LogIn className="w-4 h-4" />
              {isRTL ? "ورود" : "Sign In"}
            </button>
            <button
              onClick={() => { setActiveTab("register"); setError(null); }}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2",
                activeTab === "register"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground"
              )}
            >
              <ClipboardList className="w-4 h-4" />
              {isRTL ? "ثبت‌نام جامع" : "Full Registration"}
            </button>
          </div>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-6 mt-4"
            >
              <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Forms */}
        <div className="px-6 pb-6">
          <AnimatePresence mode="wait">
            {activeTab === "login" ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleLogin}
                className="space-y-4 pt-4"
              >
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {isRTL ? "ایمیل یا شماره تلفن" : "Email or Phone Number"}
                  </Label>
                  <div className="relative">
                    <Mail className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
                    <Input
                      type="text"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className={cn("rounded-xl h-11", isRTL ? "pr-10" : "pl-10")}
                      placeholder={isRTL ? "example@email.com یا 09121234567" : "example@email.com or 09121234567"}
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {isRTL ? "رمز عبور" : "Password"}
                  </Label>
                  <div className="relative">
                    <Lock className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className={cn("rounded-xl h-11", isRTL ? "pr-10 pl-10" : "pl-10 pr-10")}
                      placeholder="••••••••"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground", isRTL ? "left-3" : "right-3")}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-11 shadow-lg shadow-primary/25 font-semibold"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
                      {isRTL ? "ورود به حساب" : "Sign In"}
                    </>
                  )}
                </Button>
              </motion.form>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
                transition={{ duration: 0.25 }}
                className="pt-4 space-y-4"
              >
                <div className="flex flex-col items-center py-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <ClipboardList className="w-8 h-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">
                      {isRTL ? "ثبت‌نام جامع" : "Comprehensive Registration"}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      {isRTL
                        ? "فرم ثبت‌نام جامع شامل اطلاعات شخصی، پروفایل موسیقی، آدرس و..."
                        : "Full registration form including personal info, music profile, address and more..."
                      }
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setShowRegistrationForm(true);
                      setShowLoginModal(false);
                    }}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 px-8 shadow-lg shadow-primary/25 font-semibold gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    {isRTL ? "شروع ثبت‌نام" : "Start Registration"}
                  </Button>
                  <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Music className="w-3 h-3" />{isRTL ? "۶ مرحله" : "6 Steps"}</span>
                    <span>•</span>
                    <span>{isRTL ? "مسیر ثبت‌نام هنرجو" : "Student registration"}</span>
                    <span>•</span>
                    <span>{isRTL ? "پروفایل موسیقی" : "Music Profile"}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>

      <RegistrationForm
        isOpen={showRegistrationForm}
        onClose={() => setShowRegistrationForm(false)}
      />
    </Dialog>
  );
}
