"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { useAuthStore } from "@/lib/auth/store";
import {
  getRoleHome,
  resolveApplicationRole,
  type ApplicationRole,
} from "@/lib/application-shell/contract";

type AuthenticatedRouteProps = {
  role: ApplicationRole;
  children: ReactNode;
};

export function AuthenticatedRoute({ role, children }: AuthenticatedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const checkSession = useAuthStore((state) => state.checkSession);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [checking, setChecking] = useState(true);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    let active = true;
    void checkSession().finally(() => {
      if (active) setChecking(false);
    });

    return () => {
      active = false;
    };
  }, [checkSession]);

  useEffect(() => {
    if (checking) return;

    if (!isAuthenticated || !user) {
      router.replace("/");
      return;
    }

    const resolvedRole = resolveApplicationRole(user);
    if (!resolvedRole) {
      router.replace("/");
      return;
    }

    const home = getRoleHome(resolvedRole);
    if (resolvedRole !== role || pathname !== home) {
      router.replace(home);
    }
  }, [checking, isAuthenticated, pathname, role, router, user]);

  if (checking || !isAuthenticated || !user || resolveApplicationRole(user) !== role) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background" dir="rtl">
        <div className="rounded-2xl border border-border bg-card px-6 py-4 text-sm text-muted-foreground">
          در حال بررسی دسترسی…
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
