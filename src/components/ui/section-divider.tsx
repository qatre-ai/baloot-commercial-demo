import React from "react";
import { cn } from "@/lib/utils";

// ============================================
// Section Divider - Elegant transition between sections
// Lightweight: pure CSS + tiny SVG, no animation overhead
// Matches the site's color system (primary, gold accents)
// RTL-compatible (uses inline-start/inline-end)
// ============================================

interface SectionDividerProps {
  /** Visual variant of the divider */
  variant?: "default" | "subtle" | "accent";
  /** Additional CSS classes */
  className?: string;
}

export function SectionDivider({ variant = "default", className }: SectionDividerProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center w-full select-none",
        variant === "subtle" ? "py-3 sm:py-4" : "py-4 sm:py-6",
        className
      )}
      aria-hidden="true"
    >
      {/* Gradient line - left side */}
      <div
        className={cn(
          "flex-1 h-px max-w-[30%]",
          variant === "accent"
            ? "bg-gradient-to-r from-transparent via-gold/40 to-gold/20"
            : variant === "subtle"
              ? "bg-gradient-to-r from-transparent via-border/40 to-border/20"
              : "bg-gradient-to-r from-transparent via-primary/20 to-primary/30"
        )}
      />

      {/* Center decorative diamond */}
      <div className="relative flex items-center justify-center px-3">
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={cn(
            variant === "accent"
              ? "text-gold/50"
              : variant === "subtle"
                ? "text-border/60"
                : "text-primary/30"
          )}
        >
          {/* Outer diamond */}
          <path
            d="M6 1L11 6L6 11L1 6L6 1Z"
            fill="currentColor"
            opacity="0.3"
          />
          {/* Inner dot */}
          <circle cx="6" cy="6" r="1.5" fill="currentColor" opacity="0.6" />
        </svg>
      </div>

      {/* Gradient line - right side */}
      <div
        className={cn(
          "flex-1 h-px max-w-[30%]",
          variant === "accent"
            ? "bg-gradient-to-l from-transparent via-gold/40 to-gold/20"
            : variant === "subtle"
              ? "bg-gradient-to-l from-transparent via-border/40 to-border/20"
              : "bg-gradient-to-l from-transparent via-primary/20 to-primary/30"
        )}
      />
    </div>
  );
}
