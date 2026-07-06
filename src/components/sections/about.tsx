"use client";

import React, { useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { SectionReveal } from "@/components/ui/section-reveal";
import { useTheme } from "next-themes";
import {
  Music,
  BookOpen,
  Award,
  Factory,
  GraduationCap,
  Users,
  Briefcase,
  PenTool,
  Wrench,
  Shield,
  Eye,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

// Portrait image paths (SEO-optimized filenames)
const PORTRAIT_LIGHT = "/images/founder/mostafa-mogouei-founder-mehr-avaye-balout-light.jpg";
const PORTRAIT_DARK = "/images/founder/mostafa-mogouei-founder-mehr-avaye-balout-dark.jpg";

// Highlight cards configuration
const highlights = [
  {
    titleKey: "highlight1_title" as const,
    descKey: "highlight1_desc" as const,
    icon: Music,
    gradient: "from-primary/20 via-primary/10 to-transparent",
    iconBg: "bg-primary/15",
    iconColor: "text-primary",
    borderHover: "hover:border-primary/30",
  },
  {
    titleKey: "highlight2_title" as const,
    descKey: "highlight2_desc" as const,
    icon: BookOpen,
    gradient: "from-amber-500/20 via-amber-500/10 to-transparent",
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-500",
    borderHover: "hover:border-amber-500/30",
  },
  {
    titleKey: "highlight3_title" as const,
    descKey: "highlight3_desc" as const,
    icon: Award,
    gradient: "from-emerald-500/20 via-emerald-500/10 to-transparent",
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-500",
    borderHover: "hover:border-emerald-500/30",
  },
  {
    titleKey: "highlight4_title" as const,
    descKey: "highlight4_desc" as const,
    icon: Factory,
    gradient: "from-violet-500/20 via-violet-500/10 to-transparent",
    iconBg: "bg-violet-500/15",
    iconColor: "text-violet-500",
    borderHover: "hover:border-violet-500/30",
  },
];

// Modal section config
interface ModalSection {
  titleKey: string;
  icon: React.ElementType;
  items: string[];
  accentColor: string;
}

function getModalSections(t: Record<string, string>): ModalSection[] {
  return [
    {
      titleKey: "education_title",
      icon: GraduationCap,
      items: [t.education_1, t.education_2, t.education_3, t.education_4, t.education_5],
      accentColor: "text-primary",
    },
    {
      titleKey: "teaching_title",
      icon: Users,
      items: [t.teaching_1, t.teaching_2, t.teaching_3, t.teaching_4, t.teaching_5],
      accentColor: "text-amber-500",
    },
    {
      titleKey: "management_title",
      icon: Briefcase,
      items: [t.management_1, t.management_2, t.management_3, t.management_4],
      accentColor: "text-emerald-500",
    },
    {
      titleKey: "publications_title",
      icon: PenTool,
      items: [t.publications_1, t.publications_2, t.publications_3, t.publications_4, t.publications_5],
      accentColor: "text-rose-500",
    },
    {
      titleKey: "industry_title",
      icon: Wrench,
      items: [t.industry_1, t.industry_2, t.industry_3],
      accentColor: "text-violet-500",
    },
    {
      titleKey: "awards_title",
      icon: Shield,
      items: [t.awards_1, t.awards_2, t.awards_3, t.awards_4, t.awards_5, t.awards_6],
      accentColor: "text-cyan-500",
    },
    {
      titleKey: "philosophy_title",
      icon: Eye,
      items: [t.philosophy_1, t.philosophy_2, t.philosophy_3, t.philosophy_4],
      accentColor: "text-orange-500",
    },
  ];
}

// Accordion section component for modal
function AccordionSection({
  section,
  t,
  isRTL,
  isOpen,
  onToggle,
}: {
  section: ModalSection;
  t: Record<string, string>;
  isRTL: boolean;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const Icon = section.icon;
  const title = (t as Record<string, string>)[section.titleKey];

  return (
    <div className="border-b border-border/50 last:border-b-0">
      <button
        onClick={onToggle}
        className={cn(
          "flex w-full items-center justify-between gap-3 py-4 px-2 text-left transition-colors hover:bg-muted/50 rounded-lg",
          isRTL && "text-right flex-row-reverse"
        )}
      >
        <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-muted/80", section.accentColor)}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="font-semibold text-foreground text-sm">{title}</span>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-300",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <ul className={cn("space-y-2 pb-4 px-2", isRTL && "text-right")}>
              {section.items.map((item, i) => (
                <li key={i} className={cn("flex items-start gap-2 text-sm text-muted-foreground", isRTL && "flex-row-reverse")}>
                  <span className={cn("w-1.5 h-1.5 rounded-full mt-2 shrink-0", section.accentColor.replace("text-", "bg-"))} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Portrait Frame Component - handles theme switching and image loading
function PortraitFrame({
  isInView,
  subtitle,
  isRTL,
}: {
  isInView: boolean;
  subtitle: string;
  isRTL: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const [imgError, setImgError] = useState(false);

  // Use useSyncExternalStore to safely detect client-side rendering without hydration mismatch.
  // During SSR, getServerSnapshot returns false → render a lightweight placeholder div.
  // During client hydration, React uses getServerSnapshot too (false), so the initial
  // hydrate matches the server HTML. Then React re-renders with getSnapshot (true) and
  // swaps in the real <Image>. This eliminates the src/srcSet hydration mismatch that
  // next/image can produce when theme-dependent src values differ between server/client.
  const isClient = useSyncExternalStore(
    () => () => {},  // subscribe noop – theme changes are handled by the resolvedTheme hook
    () => true,      // getSnapshot (client)
    () => false      // getServerSnapshot (server)
  );

  // Only use the theme-aware image on the client; always use light image as fallback
  const isDark = isClient && resolvedTheme === "dark";
  const portraitSrc = isDark ? PORTRAIT_DARK : PORTRAIT_LIGHT;

  const altText = isRTL
    ? "مصطفی موگویی - بنیان‌گذار و مدیر مؤسسه موسیقی مهر آوای بلوط - بیش از ۲۰ سال تجربه آموزش موسیقی"
    : "Mostafa Mogouei - Founder & Director of Mehr Avaye Balout Music Institute - Over 20 years of music education experience";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="relative shrink-0"
    >
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 via-amber-500/20 to-primary/20 blur-xl" />
        {/* Main circle with gradient border */}
        <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary via-amber-600 to-primary p-[3px]">
          <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
            {!imgError ? (
              isClient ? (
                <Image
                  src={portraitSrc}
                  alt={altText}
                  width={256}
                  height={256}
                  className="w-full h-full object-cover rounded-full"
                  priority={false}
                  loading="lazy"
                  sizes="(max-width: 640px) 192px, (max-width: 1024px) 224px, 256px"
                  quality={85}
                  unoptimized
                  onError={() => { try { setImgError(true); } catch { /* graceful fallback */ } }}
                />
              ) : (
                /* SSR placeholder: lightweight div matching the image dimensions so
                   server HTML and client hydration produce the same DOM structure.
                   The real <Image> replaces this after the client re-render. */
                <div
                  className="w-full h-full rounded-full bg-gradient-to-br from-primary/10 via-transparent to-amber-500/10"
                  role="img"
                  aria-label={altText}
                />
              )
            ) : (
              /* Fallback: Gradient placeholder when image fails to load */
              <>
                <div className="absolute inset-[3px] rounded-full bg-gradient-to-br from-primary/10 via-transparent to-amber-500/10" />
                <div className="relative flex flex-col items-center gap-2">
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Music className="w-12 h-12 sm:w-14 sm:h-14 text-primary/60" />
                  </motion.div>
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground/70 text-center px-4 leading-tight">
                    {subtitle}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
        {/* Decorative floating notes */}
        <motion.div
          animate={{ y: [-3, 3, -3], rotate: [0, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center backdrop-blur-sm"
        >
          <Music className="w-4 h-4 text-amber-500" />
        </motion.div>
        <motion.div
          animate={{ y: [3, -3, 3], rotate: [0, -5, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-1 -left-1 w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center backdrop-blur-sm"
        >
          <Music className="w-3.5 h-3.5 text-primary" />
        </motion.div>
      </div>
    </motion.div>
  );
}

export function AboutSection({ onLearnMore }: { onLearnMore?: () => void } = {}) {
  const { t, isRTL } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [modalOpen, setModalOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["education_title"]));

  const aboutT = t.about;
  const modalSections = getModalSections(aboutT as unknown as Record<string, string>);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <>
      <section id="about" ref={ref} className="py-20 sm:py-28 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <div className="absolute top-1/4 right-0 w-64 h-64 bg-primary/3 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-amber-500/3 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Tag */}
          <SectionReveal animation="fade-scale" delay={0}>
            <div className="flex justify-center mb-8">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase">
                {aboutT.tag}
              </span>
            </div>
          </SectionReveal>

          {/* Main Content: Portrait + Text */}
          <div className={cn(
            "flex flex-col lg:flex-row items-center gap-8 lg:gap-14 mb-10 sm:mb-12",
            isRTL && "lg:flex-row-reverse"
          )}>
            {/* Founder Portrait - Real photo with gradient border */}
            <PortraitFrame isInView={isInView} subtitle={aboutT.subtitle} isRTL={isRTL} />

            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, x: isRTL ? 30 : -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 }}
              className={cn(
                "flex-1 text-center lg:text-left",
                isRTL && "lg:text-right"
              )}
            >
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 leading-tight">
                {aboutT.title}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0 mb-4">
                {aboutT.description}
              </p>
              <Button
                onClick={() => onLearnMore ? onLearnMore() : setModalOpen(true)}
                variant="outline"
                className="group gap-2 rounded-full px-6 border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              >
                {aboutT.learn_more}
                <motion.span
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  {isRTL ? "←" : "→"}
                </motion.span>
              </Button>
            </motion.div>
          </div>

          {/* Highlight Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {highlights.map((highlight, index) => {
              const Icon = highlight.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 25 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="group"
                >
                  <div
                    className={cn(
                      "relative overflow-hidden rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm p-4 sm:p-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-lg",
                      highlight.borderHover
                    )}
                  >
                    <div
                      className={cn(
                        "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                        highlight.gradient
                      )}
                    />
                    <div className="relative">
                      <div
                        className={cn(
                          "w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110",
                          highlight.iconBg
                        )}
                      >
                        <Icon className={cn("w-4.5 h-4.5 sm:w-5 sm:h-5", highlight.iconColor)} />
                      </div>
                      <h3 className={cn("text-sm sm:text-base font-bold text-foreground mb-1", isRTL && "text-right")}>
                        {aboutT[highlight.titleKey]}
                      </h3>
                      <p className={cn("text-xs sm:text-sm text-muted-foreground leading-relaxed", isRTL && "text-right")}>
                        {aboutT[highlight.descKey]}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Detail Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] p-0 gap-0 overflow-hidden">
          {/* Modal Header */}
          <div className="relative bg-gradient-to-br from-primary/10 via-background to-amber-500/5 px-6 pt-6 pb-4 border-b border-border/50">
            <DialogHeader>
              <DialogTitle className={cn("text-xl font-bold", isRTL && "text-right")}>
                {aboutT.modal_title}
              </DialogTitle>
            </DialogHeader>
            <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-primary/30 via-amber-500/30 to-primary/30" />
          </div>

          {/* Modal Body */}
          <ScrollArea className="max-h-[calc(85vh-80px)] px-6">
            <div className="py-4 space-y-1">
              {modalSections.map((section) => (
                <AccordionSection
                  key={section.titleKey}
                  section={section}
                  t={aboutT as unknown as Record<string, string>}
                  isRTL={isRTL}
                  isOpen={openSections.has(section.titleKey)}
                  onToggle={() => toggleSection(section.titleKey)}
                />
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
