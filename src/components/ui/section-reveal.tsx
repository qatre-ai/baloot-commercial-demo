"use client";

import React, { useRef, ReactNode } from "react";
import { motion, useInView, Variants } from "framer-motion";
import { useSyncExternalStore } from "react";

// Respect prefers-reduced-motion
const emptySubscribe = () => () => {};
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    emptySubscribe,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false
  );
}

// ============================================
// Animation Variants
// ============================================
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const fadeInScale: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const variants = {
  "fade-up": fadeInUp,
  "fade-scale": fadeInScale,
  "fade-left": fadeInLeft,
  "fade-right": fadeInRight,
} as const;

type AnimationType = keyof typeof variants;

// ============================================
// Section Reveal Component
// ============================================
interface SectionRevealProps {
  children: ReactNode;
  animation?: AnimationType;
  delay?: number;
  className?: string;
  once?: boolean;
  margin?: string;
}

export function SectionReveal({
  children,
  animation = "fade-up",
  delay = 0,
  className,
  once = true,
  margin = "-80px",
}: SectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount: 0.1, margin });
  const prefersReducedMotion = usePrefersReducedMotion();

  const variant = variants[animation];

  // If reduced motion is preferred, just render children without animation
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variant}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// Stagger Container - for staggering children
// ============================================
interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  once?: boolean;
  margin?: string;
}

export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.08,
  once = true,
  margin = "-80px",
}: StaggerContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount: 0.1, margin });
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// Stagger Item - individual item inside StaggerContainer
// ============================================
interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  animation?: AnimationType;
}

export function StaggerItem({
  children,
  className,
  animation = "fade-up",
}: StaggerItemProps) {
  const variant = variants[animation];

  return (
    <motion.div variants={variant} className={className}>
      {children}
    </motion.div>
  );
}
