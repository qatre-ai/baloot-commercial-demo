"use client";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { I18nProvider } from "@/lib/i18n/context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <I18nProvider>
        {children}
      </I18nProvider>
    </ThemeProvider>
  );
}
