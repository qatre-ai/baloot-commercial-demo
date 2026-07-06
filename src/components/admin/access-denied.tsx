"use client";

import { ShieldX } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Friendly "Access Denied" component shown when a sub-admin tries to access
 * a tab or action they don't have permission for.
 */
export function AccessDenied({ message }: { message?: string }) {
  const { isRTL } = useI18n();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
        <ShieldX className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">
        {isRTL ? "دسترسی غیر مجاز" : "Access Denied"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-md">
        {message ||
          (isRTL
            ? "شما اجازه دسترسی به این بخش را ندارید. در صورت نیاز، با سوپر ادمین تماس بگیرید."
            : "You don't have permission to access this section. Contact the super admin if you need access.")}
      </p>
    </div>
  );
}
