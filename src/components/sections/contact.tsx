"use client";

import React, { useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { motion, useInView } from "framer-motion";
import { SectionReveal } from "@/components/ui/section-reveal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";

export function ContactSection() {
  const { t, isRTL } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [formState, setFormState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [selectedSubject, setSelectedSubject] = useState("general");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const isSending = formState === "sending";

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "", message: "" });
    setSelectedSubject("general");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormState("sending");
    try {
      const data = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: selectedSubject || 'general',
        message: formData.message,
      };

      if (!data.name || !data.email || !data.message) {
        setFormState("error");
        setTimeout(() => setFormState("idle"), 3000);
        return;
      }

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        if (data.subject === 'feedback') {
          try {
            await fetch('/api/testimonials', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: data.name,
                email: data.email,
                contentFa: data.message,
                source: 'contact',
                rating: 5,
              }),
            });
          } catch { /* silently fail */ }
        }
        setFormState("success");
        resetForm();
        setTimeout(() => setFormState("idle"), 3000);
      } else {
        setFormState("error");
        setTimeout(() => setFormState("idle"), 3000);
      }
    } catch {
      setFormState("error");
      setTimeout(() => setFormState("idle"), 3000);
    }
  };

  return (
    <section id="contact" ref={ref} className="py-20 sm:py-28 relative bg-muted/30">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <SectionReveal animation="fade-up" delay={0}>
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase mb-4">
              {t.contact.tag}
            </span>
          </SectionReveal>
          <SectionReveal animation="fade-up" delay={0.1}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
              {t.contact.title}
            </h2>
          </SectionReveal>
          <SectionReveal animation="fade-up" delay={0.2}>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {t.contact.description}
            </p>
          </SectionReveal>
        </div>

        {/* Contact Form — Full width, centered */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6 sm:p-8">
              {formState === "success" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-2">{t.contact.success}</h3>
                </motion.div>
              ) : formState === "error" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-2">{isRTL ? "خطا در ارسال پیام" : "Error sending message"}</h3>
                  <p className="text-sm text-muted-foreground">{isRTL ? "لطفاً دوباره تلاش کنید" : "Please try again later"}</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        {t.contact.name}
                      </Label>
                      <Input
                        id="name"
                        required
                        disabled={isSending}
                        value={formData.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        className="rounded-xl border-border/50 bg-background/50 focus:border-primary/50"
                        placeholder={isRTL ? "نام خود را وارد کنید" : "Enter your name"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        {t.contact.email}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        disabled={isSending}
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        className="rounded-xl border-border/50 bg-background/50 focus:border-primary/50"
                        placeholder={isRTL ? "email@example.com" : "email@example.com"}
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">
                        {t.contact.phone}
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        disabled={isSending}
                        value={formData.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        className="rounded-xl border-border/50 bg-background/50 focus:border-primary/50"
                        placeholder={isRTL ? "۰۹۱۲۳۴۵۶۷۸۹" : "09123456789"}
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-sm font-medium">
                        {t.contact.subject}
                      </Label>
                      <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={isSending}>
                        <SelectTrigger className="rounded-xl border-border/50 bg-background/50">
                          <SelectValue placeholder={t.contact.subject} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="course">{t.contact.subject_course}</SelectItem>
                          <SelectItem value="workshop">{t.contact.subject_workshop}</SelectItem>
                          <SelectItem value="general">{t.contact.subject_general}</SelectItem>
                          <SelectItem value="feedback">{t.contact.subject_feedback}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm font-medium">
                      {t.contact.message}
                    </Label>
                    <Textarea
                      id="message"
                      required
                      disabled={isSending}
                      rows={4}
                      value={formData.message}
                      onChange={(e) => updateField("message", e.target.value)}
                      className="rounded-xl border-border/50 bg-background/50 focus:border-primary/50 resize-none"
                      placeholder={isRTL ? "پیام خود را بنویسید..." : "Write your message..."}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSending}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300"
                    size="lg"
                  >
                    {formState === "sending" ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                        />
                        <span className="ms-2">{t.contact.sending}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 me-2" />
                        {t.contact.submit}
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
