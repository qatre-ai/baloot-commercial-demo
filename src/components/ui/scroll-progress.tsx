"use client";

import React, { useSyncExternalStore } from "react";
import { motion, useScroll, useSpring } from "framer-motion";

// Hydration-safe mounted check
const emptySubscribe = () => () => {};
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    emptySubscribe,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false
  );
}

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-gold to-primary origin-left z-[60]"
      style={{ scaleX }}
    />
  );
}
