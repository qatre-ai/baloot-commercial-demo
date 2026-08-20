"use client";

import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Music2,
  Settings,
  Shield,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth/store";
import {
  getRoleHome,
  getRoleNavigation,
  resolveApplicationRole,
  type ApplicationRole,
  type NavigationItem,
} from "@/lib/application-shell/contract";
import { Button } from "@/components/ui/button";

const iconMap = {
  "layout-dashboard": LayoutDashboard,
  "book-open": BookOpen,
  "calendar-days": CalendarDays,
  "clipboard-list": ClipboardList,
  "file-text": FileText,
  "messages-square": MessageSquare,
  users: Users,
  "chart-no-axes-combined": BarChart3,
  "settings-2": Settings,
  "shield-check": Shield,
  "graduation-cap": GraduationCap,
  music: Music2,
  "user-plus": Users,
  presentation: BookOpen,
  wallet: BarChart3,
  megaphone: MessageSquare,
  "file-pen-line": FileText,
  "calendar-plus": CalendarDays,
} as const;

type ApplicationShellProps = {
  role: ApplicationRole;
  title: string;
  children: ReactNode;
  activeItem?: string;
  onNavigate?: (item: NavigationItem) => void;
  onLogout?: () => Promise<void> | void;
  hideSidebar?: boolean;
};

export function ApplicationShell({
  role,
  title,
  children,
  activeItem,
  onNavigate,
  onLogout,
  hideSidebar = false,
}: ApplicationShellProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const permissions = user?.permissions ?? [];
  const navigation = useMemo(
    () => getRoleNavigation(role, permissions),
    [permissions, role],
  );

  const handleNavigate = (item: NavigationItem) => {
    setMobileOpen(false);
    if (onNavigate) {
      onNavigate(item);
      return;
    }
    router.push(getRoleHome(role));
  };

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
      return;
    }
    await useAuthStore.getState().logout();
    router.replace("/");
  };

  const renderNavigation = (mobile = false) => (
    <nav className="flex flex-col gap-1 p-2" aria-label="Application navigation">
      {navigation.map((item) => {
        const Icon = iconMap[item.icon as keyof typeof iconMap] ?? LayoutDashboard;
        const isActive = activeItem === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleNavigate(item)}
            className={cn(
              "flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm transition-colors",
              "text-muted-foreground hover:bg-primary/8 hover:text-foreground",
              isActive && "bg-primary/12 font-semibold text-primary",
              !sidebarOpen && !mobile && "justify-center px-0",
            )}
            title={!sidebarOpen && !mobile ? item.labelFa : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {(sidebarOpen || mobile) && <span className="truncate">{item.labelFa}</span>}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-dvh w-full flex-col bg-background text-foreground" dir="rtl">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/70 bg-card/95 px-4 backdrop-blur md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {!hideSidebar && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="باز کردن منو"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {role === "student" ? (
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            ) : role === "instructor" ? (
              <Music2 className="h-5 w-5" aria-hidden="true" />
            ) : role === "super_admin" ? (
              <Shield className="h-5 w-5" aria-hidden="true" />
            ) : (
              <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.name ?? "کاربر مهر آوای بلوط"}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">خروج</span>
        </Button>
      </header>

      <div className="flex min-h-0 flex-1">
        {!hideSidebar && (
          <aside
            className={cn(
              "hidden shrink-0 border-l border-border/70 bg-card/45 transition-[width] duration-200 md:block",
              sidebarOpen ? "w-64" : "w-16",
            )}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-border/60 p-2">
                {sidebarOpen && (
                  <span className="px-2 text-xs font-semibold text-muted-foreground">
                    دسترسی سریع
                  </span>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label={sidebarOpen ? "جمع کردن منو" : "باز کردن منو"}
                  onClick={() => setSidebarOpen((value) => !value)}
                >
                  {sidebarOpen ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">{renderNavigation()}</div>
            </div>
          </aside>
        )}

        <main className="min-h-0 min-w-0 flex-1 overflow-auto">{children}</main>
      </div>

      {!hideSidebar && mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="بستن منو"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 right-0 flex w-[min(20rem,88vw)] flex-col bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/70 p-4">
              <span className="font-semibold">منوی برنامه</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="بستن منو"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="overflow-y-auto">{renderNavigation(true)}</div>
          </aside>
        </div>
      )}
    </div>
  );
}

export function roleForCurrentUser(): ApplicationRole | null {
  return resolveApplicationRole(useAuthStore.getState().user);
}

export function roleHomeForCurrentUser(): string {
  const role = roleForCurrentUser();
  return role ? getRoleHome(role) : "/";
}
