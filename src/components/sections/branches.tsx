"use client";

import React, { useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { SectionReveal } from "@/components/ui/section-reveal";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Clock, Navigation, ChevronDown, Map, Smartphone, Star } from "lucide-react";

// Branch data — coordinates for map links
const branchesData = [
  {
    id: "b1",
    nameKey: "branch1_name" as const,
    addressFa: "تهران، آیت‌الله سعیدی، بلوار معلم (محله بهداشت)، جنب خیابان سلیمانی، پلاک ۸۸، طبقه فوقانی اسناد رسمی",
    addressEn: "Tehran, Ayatollah Saeedi, Moallem Blvd (Behdasht Neighborhood), Next to Soleymani St., No. 88, Upper Floor, Official Documents Office",
    phone: "021-66245295",
    mobilePhone: "0939-3565959",
    hoursFa: "شنبه تا پنج‌شنبه: ۹ صبح تا ۹ شب",
    hoursEn: "Saturday to Thursday: 9 AM - 9 PM",
    mapColor: "from-primary/20 to-primary/5",
    isMain: true,
    // Coordinates — Moallem Blvd, Yaftabad area
    lat: 35.6735,
    lng: 51.3850,
  },
  {
    id: "b2",
    nameKey: "branch2_name" as const,
    addressFa: "تهران، محله یافت‌آباد، چهارراه قهوه‌خانه، بلوار الغدیر، خیابان توحید، پلاک ۱",
    addressEn: "Tehran, Yaftabad, Chaharragh-e Qahvehkhaneh, Alghadir Blvd, Tawhid St., No. 1",
    phone: "021-66789550",
    mobilePhone: "0939-3565959",
    hoursFa: "شنبه تا پنج‌شنبه: ۱۰ صبح تا ۸ شب",
    hoursEn: "Saturday to Thursday: 10 AM - 8 PM",
    mapColor: "from-gold/20 to-gold/5",
    isMain: false,
    // Coordinates — Alghadir Blvd, Yaftabad area
    lat: 35.6700,
    lng: 51.3900,
  },
];

// Navigation app link generators
function getGoogleMapsUrl(lat: number, lng: number, label: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(label)}`;
}

function getBaladUrl(lat: number, lng: number, label: string) {
  // Balad deep link format
  return `https://balad.ir/?lat=${lat}&lng=${lng}&label=${encodeURIComponent(label)}`;
}

function getNeshanUrl(lat: number, lng: number, label: string) {
  // Neshan deep link format
  return `https://neshan.org/maps/@${lat},${lng},16z/places/${encodeURIComponent(label)}`;
}

// Navigation dropdown per branch
function NavDropdown({ branch, locale, isRTL }: {
  branch: typeof branchesData[number];
  locale: string;
  isRTL: boolean;
}) {
  const [open, setOpen] = useState(false);
  const label = locale === "fa" ? branch.addressFa : branch.addressEn;

  const apps = [
    {
      name: isRTL ? "گوگل مپ" : "Google Maps",
      href: getGoogleMapsUrl(branch.lat, branch.lng, label),
      color: "hover:bg-blue-500/10 hover:border-blue-500/25",
    },
    {
      name: isRTL ? "بلد" : "Balad",
      href: getBaladUrl(branch.lat, branch.lng, label),
      color: "hover:bg-emerald-500/10 hover:border-emerald-500/25",
    },
    {
      name: isRTL ? "نشان" : "Neshan",
      href: getNeshanUrl(branch.lat, branch.lng, label),
      color: "hover:bg-orange-500/10 hover:border-orange-500/25",
    },
  ];

  return (
    <div className="relative mt-5">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-primary/30 hover:border-primary/60 hover:bg-primary/5 text-sm font-medium text-foreground transition-all duration-300",
          open && "border-primary/60 bg-primary/5",
          isRTL && "flex-row-reverse"
        )}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Navigation className="w-4 h-4 text-primary" />
        {isRTL ? "مسیریابی" : "Directions"}
        <ChevronDown className={cn(
          "w-3.5 h-3.5 text-muted-foreground transition-transform duration-300",
          open && "rotate-180"
        )} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full mt-2 inset-x-0 z-20 bg-card border border-border/60 rounded-xl shadow-lg shadow-black/8 overflow-hidden"
          >
            {apps.map((app, i) => (
              <a
                key={app.name}
                href={app.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground transition-all duration-200 border-b border-border/30 last:border-b-0",
                  app.color
                )}
                onClick={() => setOpen(false)}
              >
                <Map className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{app.name}</span>
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function BranchesSection() {
  const { t, isRTL, locale } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="branches" ref={ref} className="py-20 sm:py-28 relative">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/[0.03] rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <SectionReveal animation="fade-right" delay={0}>
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase mb-4">
              {t.branches.tag}
            </span>
          </SectionReveal>
          <SectionReveal animation="fade-up" delay={0.1}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
              {t.branches.title}
            </h2>
          </SectionReveal>
          <SectionReveal animation="fade-up" delay={0.2}>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {t.branches.description}
            </p>
          </SectionReveal>
        </div>

        {/* Branch Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-4xl mx-auto">
          {branchesData.map((branch, index) => (
            <motion.div
              key={branch.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.2 }}
            >
              <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5">
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                  branch.mapColor
                )} />

                <CardContent className="relative p-6 sm:p-8">
                  {/* Branch Name */}
                  <h3 className="text-xl font-bold text-foreground mb-5 group-hover:text-primary transition-colors flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    {t.branches[branch.nameKey]}
                    {branch.isMain && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold border border-primary/20">
                        <Star className="w-3 h-3 fill-primary" />
                        {isRTL ? "شعبه اصلی" : "Main"}
                      </span>
                    )}
                  </h3>

                  {/* Details */}
                  <div className="space-y-4">
                    {/* Address */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4 text-gold" />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block mb-1">{t.branches.address}</span>
                        <span className="text-sm text-foreground leading-relaxed">
                          {locale === "fa" ? branch.addressFa : branch.addressEn}
                        </span>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4 text-gold" />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block mb-0.5">{t.branches.phone}</span>
                        <div className="flex flex-col gap-0.5">
                          <a href={`tel:${branch.phone}`} className="text-sm text-foreground hover:text-primary transition-colors" dir="ltr">
                            {branch.phone}
                          </a>
                          <a href={`tel:${branch.mobilePhone}`} className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1" dir="ltr">
                            <Smartphone className="w-3 h-3" />
                            {branch.mobilePhone}
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Hours */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-gold" />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block mb-0.5">{t.branches.hours}</span>
                        <span className="text-sm text-foreground">
                          {locale === "fa" ? branch.hoursFa : branch.hoursEn}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Dropdown */}
                  <NavDropdown branch={branch} locale={locale} isRTL={isRTL} />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
