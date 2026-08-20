import type { User } from "@/lib/auth/store";

export type ApplicationRole = "student" | "instructor" | "admin" | "super_admin";

export type NavigationPermission = {
  resource: string;
  action: string;
  granted?: boolean;
};

export type NavigationItem = {
  id: string;
  labelFa: string;
  labelEn: string;
  icon: string;
  tab?: string;
  permission?: NavigationPermission;
  superAdminOnly?: boolean;
};

const STUDENT_NAVIGATION: readonly NavigationItem[] = [
  { id: "profile", labelFa: "پروفایل من", labelEn: "My profile", icon: "user", tab: "profile" },
  { id: "classes", labelFa: "کلاس‌ها", labelEn: "Classes", icon: "book-open", tab: "classes" },
  { id: "schedule", labelFa: "برنامه هفتگی", labelEn: "Schedule", icon: "calendar-days", tab: "schedule" },
  { id: "exercises", labelFa: "تمرین‌ها", labelEn: "Exercises", icon: "clipboard-list", tab: "exercises" },
  { id: "announcements", labelFa: "اطلاعیه‌ها", labelEn: "Announcements", icon: "megaphone", tab: "announcements" },
  { id: "financial", labelFa: "امور مالی", labelEn: "Financial", icon: "wallet", tab: "financial" },
];

const INSTRUCTOR_NAVIGATION: readonly NavigationItem[] = [
  { id: "dashboard", labelFa: "داشبورد", labelEn: "Dashboard", icon: "layout-dashboard", tab: "dashboard" },
  { id: "schedule", labelFa: "برنامه هفتگی", labelEn: "Schedule", icon: "calendar-days", tab: "schedule" },
  { id: "classes", labelFa: "کلاس‌ها", labelEn: "Classes", icon: "book-open", tab: "classes" },
  { id: "exercises", labelFa: "تمرین‌ها", labelEn: "Exercises", icon: "clipboard-list", tab: "exercises" },
  { id: "submissions", labelFa: "تصحیح", labelEn: "Grading", icon: "file-pen-line", tab: "submissions" },
  { id: "requests", labelFa: "درخواست‌ها", labelEn: "Requests", icon: "file-text", tab: "requests" },
  { id: "makeup", labelFa: "جلسه جبرانی", labelEn: "Makeup", icon: "calendar-plus", tab: "makeup" },
  { id: "announcements", labelFa: "اطلاعیه‌ها", labelEn: "Announcements", icon: "megaphone", tab: "announcements" },
];

const ADMIN_NAVIGATION: readonly NavigationItem[] = [
  { id: "dashboard", labelFa: "داشبورد", labelEn: "Dashboard", icon: "layout-dashboard", tab: "dashboard" },
  { id: "pending-registrations", labelFa: "ثبت‌نام‌های آنلاین", labelEn: "Online registrations", icon: "user-plus", tab: "pending-registrations", permission: { resource: "users", action: "read" } },
  { id: "registrations", labelFa: "ثبت‌نام‌ها", labelEn: "Enrollments", icon: "clipboard-check", tab: "registrations", permission: { resource: "enrollments", action: "read" } },
  { id: "users", labelFa: "هنرجویان", labelEn: "Students", icon: "users", tab: "users", permission: { resource: "users", action: "read" } },
  { id: "courses", labelFa: "دوره‌ها", labelEn: "Courses", icon: "book-open", tab: "courses", permission: { resource: "courses", action: "read" } },
  { id: "workshops", labelFa: "کارگاه‌ها", labelEn: "Workshops", icon: "presentation", tab: "workshops", permission: { resource: "workshops", action: "read" } },
  { id: "schedules", labelFa: "برنامه کلاس‌ها", labelEn: "Class schedules", icon: "calendar-days", tab: "schedules", permission: { resource: "schedules", action: "read" } },
  { id: "financial", labelFa: "پرداخت‌ها", labelEn: "Payments", icon: "wallet", tab: "financial", permission: { resource: "payments", action: "read" } },
  { id: "messages", labelFa: "پیام‌ها", labelEn: "Messages", icon: "messages-square", tab: "messages", permission: { resource: "messages", action: "read" } },
];

const SUPER_ADMIN_NAVIGATION: readonly NavigationItem[] = [
  ...ADMIN_NAVIGATION,
  { id: "analytics", labelFa: "تحلیل و گزارش", labelEn: "Analytics", icon: "chart-no-axes-combined", tab: "analytics", permission: { resource: "analytics", action: "read" } },
  { id: "security", labelFa: "امنیت", labelEn: "Security", icon: "shield-check", tab: "security", superAdminOnly: true },
  { id: "audit-logs", labelFa: "لاگ‌های فعالیت", labelEn: "Audit logs", icon: "scroll-text", tab: "audit-logs", superAdminOnly: true },
  { id: "backups", labelFa: "پشتیبان‌گیری", labelEn: "Backups", icon: "database-backup", tab: "backups", superAdminOnly: true },
  { id: "settings", labelFa: "تنظیمات", labelEn: "Settings", icon: "settings-2", tab: "settings", superAdminOnly: true },
];

function hasPermission(
  item: NavigationItem,
  permissions: readonly NavigationPermission[],
  role: ApplicationRole
): boolean {
  if (item.superAdminOnly) return role === "super_admin";
  if (!item.permission || role === "super_admin") return true;
  return permissions.some(
    (permission) =>
      permission.granted !== false &&
      permission.resource === item.permission?.resource &&
      permission.action === item.permission?.action
  );
}

export function resolveApplicationRole(user: Pick<User, "role" | "userType"> | null | undefined): ApplicationRole | null {
  if (!user) return null;
  if (user.userType === "admin" && user.role === "super_admin") return "super_admin";
  if (user.userType === "admin") return "admin";
  if (user.role === "instructor") return "instructor";
  if (user.role === "student") return "student";
  return null;
}

export function getRoleHome(role: ApplicationRole): "/student" | "/instructor" | "/admin" | "/super-admin" {
  if (role === "super_admin") return "/super-admin";
  if (role === "admin") return "/admin";
  if (role === "instructor") return "/instructor";
  return "/student";
}

export function getRoleNavigation(
  role: ApplicationRole,
  permissions: readonly NavigationPermission[] = []
): readonly NavigationItem[] {
  const navigation =
    role === "student"
      ? STUDENT_NAVIGATION
      : role === "instructor"
        ? INSTRUCTOR_NAVIGATION
        : role === "super_admin"
          ? SUPER_ADMIN_NAVIGATION
          : ADMIN_NAVIGATION;

  return navigation.filter((item) => hasPermission(item, permissions, role));
}
