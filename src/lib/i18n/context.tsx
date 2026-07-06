"use client";

import React, { createContext, useContext, useState, useCallback, useSyncExternalStore } from "react";
import fa from "./translations/fa";
import en from "./translations/en";
import type { TranslationKeys } from "./translations/fa";

export type Locale = "fa" | "en";
export type Direction = "rtl" | "ltr";

interface I18nContextType {
  locale: Locale;
  direction: Direction;
  t: TranslationKeys;
  setLocale: (locale: Locale) => void;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const translations: Record<Locale, TranslationKeys> = { fa, en };

// Helper to read localStorage safely (SSR compatible)
function getStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem("mab-locale");
    if (saved === "fa" || saved === "en") return saved;
  } catch {
    // localStorage may be blocked in some environments
  }
  return null;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Always initialize with "fa" for SSR consistency — prevents hydration mismatch
  // The real locale from localStorage is applied after mount via useSyncExternalStore
  const [locale, setLocaleState] = useState<Locale>("fa");

  // Use useSyncExternalStore to detect client-side locale from localStorage
  // Server snapshot always returns "fa" to match SSR, client reads localStorage
  const clientLocale = useSyncExternalStore(
    // subscribe: no-op since localStorage changes don't fire events we can subscribe to
    () => () => {},
    // getSnapshot: read from localStorage on client
    () => getStoredLocale() ?? "fa",
    // getServerSnapshot: always "fa" for SSR consistency
    () => "fa" as Locale
  );

  // Sync client-detected locale to state (only after hydration)
  const [hasSynced, setHasSynced] = useState(false);

  if (!hasSynced && clientLocale !== locale) {
    setLocaleState(clientLocale);
    setHasSynced(true);
  }

  const applyLocaleToDOM = useCallback((newLocale: Locale) => {
    if (typeof window === "undefined") return;
    const dir = newLocale === "fa" ? "rtl" : "ltr";
    const html = document.documentElement;
    html.setAttribute("dir", dir);
    html.setAttribute("lang", newLocale);

    if (newLocale === "fa") {
      html.style.fontFamily = "'Vazirmatn', system-ui, sans-serif";
    } else {
      html.style.fontFamily = "var(--font-geist-sans), system-ui, sans-serif";
    }
  }, []);

  // Apply locale to DOM on mount and when it changes
  const [mounted, setMounted] = useState(false);

  useSyncExternalStore(
    () => () => {},
    () => {
      if (!mounted) {
        setMounted(true);
      }
      if (mounted) {
        applyLocaleToDOM(locale);
      }
      return locale;
    },
    () => "fa"
  );

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem("mab-locale", newLocale);
    } catch {
      // localStorage may be blocked
    }
    applyLocaleToDOM(newLocale);
  }, [applyLocaleToDOM]);

  const direction: Direction = locale === "fa" ? "rtl" : "ltr";
  const t = translations[locale];
  const isRTL = direction === "rtl";

  return (
    <I18nContext.Provider value={{ locale, direction, t, setLocale, isRTL }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
