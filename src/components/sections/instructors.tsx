"use client";

import React, { useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { motion, useInView } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Music, Guitar, Mic, Piano, Drum, Users } from "lucide-react";

// Instructor data
const instructorsData = [
  {
    id: "i1",
    nameFa: "استاد احمد محمدی",
    nameEn: "Maestro Ahmad Mohammadi",
    specialtyFa: "پیانو و تئوری موسیقی",
    specialtyEn: "Piano & Music Theory",
    experience: "18 سال",
    initials: "ا.م",
    gradient: "from-primary/20 to-primary/5",
  },
  {
    id: "i2",
    nameFa: "استاد فاطمه رضایی",
    nameEn: "Maestro Fatemeh Rezaei",
    specialtyFa: "ویلن و موسیقی کلاسیک",
    specialtyEn: "Violin & Classical Music",
    experience: "15 سال",
    initials: "ف.ر",
    gradient: "from-gold/20 to-gold/5",
  },
  {
    id: "i3",
    nameFa: "استاد علی حسینی",
    nameEn: "Maestro Ali Hosseini",
    specialtyFa: "گیتار کلاسیک و فلامنکو",
    specialtyEn: "Classical & Flamenco Guitar",
    experience: "12 سال",
    initials: "ا.ح",
    gradient: "from-primary/20 to-gold/5",
  },
  {
    id: "i4",
    nameFa: "استاد مریم کریمی",
    nameEn: "Maestro Maryam Karimi",
    specialtyFa: "آواز سنتی و پاپ",
    specialtyEn: "Traditional & Pop Vocals",
    experience: "20 سال",
    initials: "م.ک",
    gradient: "from-gold/20 to-primary/5",
  },
  {
    id: "i5",
    nameFa: "استاد رضا عباسی",
    nameEn: "Maestro Reza Abbasi",
    specialtyFa: "درامز و پرکاشن",
    specialtyEn: "Drums & Percussion",
    experience: "10 سال",
    initials: "ر.ع",
    gradient: "from-primary/20 to-primary/5",
  },
  {
    id: "i6",
    nameFa: "استاد سارا نوری",
    nameEn: "Maestro Sara Noori",
    specialtyFa: "سه‌تار و موسیقی سنتی",
    specialtyEn: "Setar & Traditional Music",
    experience: "14 سال",
    initials: "س.ن",
    gradient: "from-gold/20 to-gold/5",
  },
];

export function InstructorsSection() {
  const { t, isRTL, locale } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="instructors" ref={ref} className="py-20 sm:py-28 relative bg-muted/30">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/3 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center max-w-2xl mx-auto mb-12 sm:mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase mb-4">
            {t.instructors.tag}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
            {t.instructors.title}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            {t.instructors.description}
          </p>
        </motion.div>

        {/* Instructor Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {instructorsData.map((instructor, index) => (
            <motion.div
              key={instructor.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            >
              <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                  instructor.gradient
                )} />

                <CardContent className="relative p-6 sm:p-7">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16 rounded-2xl border-2 border-primary/20 shadow-lg group-hover:border-primary/40 transition-colors">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg rounded-2xl">
                        {locale === "fa" ? instructor.initials : instructor.nameEn.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-foreground mb-1 group-hover:text-primary transition-colors truncate">
                        {locale === "fa" ? instructor.nameFa : instructor.nameEn}
                      </h3>
                      <Badge variant="secondary" className="text-[10px] mb-2">
                        {t.instructors.specialty}: {locale === "fa" ? instructor.specialtyFa : instructor.specialtyEn}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {locale === "fa" ? `تجربه: ${instructor.experience}` : `Experience: ${instructor.experience}`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
