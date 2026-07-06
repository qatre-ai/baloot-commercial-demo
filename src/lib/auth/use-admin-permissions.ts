"use client";

import { useAuthStore } from "@/lib/auth/store";

// Permission → Tab mapping
// super_admin-only tabs: security, backups, audit-logs, settings, admins-management
// Other tabs require specific resource permissions
export const TAB_PERMISSIONS: Record<string, { resource?: string; action: string; superAdminOnly?: boolean }> = {
  "dashboard": { action: "read" }, // any admin
  "users": { resource: "users", action: "read" },
  "instructors": { resource: "instructors", action: "read" },
  "courses": { resource: "courses", action: "read" },
  "content": { resource: "announcements", action: "read" }, // content = announcements + workshops + blog
  "class-schedules": { resource: "schedules", action: "read" },
  "schedule-requests": { resource: "schedules", action: "read" },
  "registrations": { resource: "enrollments", action: "read" },
  "pending-registrations": { resource: "users", action: "read" }, // registration approval = user management
  "workshop-tickets": { resource: "workshops", action: "read" },
  "financial": { resource: "payments", action: "read" },
  "messages": { resource: "messages", action: "read" }, // also contact_messages
  "testimonials": { resource: "testimonials", action: "read" },
  "security": { action: "read", superAdminOnly: true },
  "backups": { action: "read", superAdminOnly: true },
  "analytics": { resource: "analytics", action: "read" },
  "audit-logs": { action: "read", superAdminOnly: true },
  "settings": { action: "read", superAdminOnly: true },
};

/**
 * Hook for admin permission checks in the frontend.
 * Use this to:
 *   - Filter sidebar tabs based on user permissions
 *   - Hide/show action buttons based on permissions
 *   - Prevent navigation to unauthorized tabs
 *
 * Usage:
 *   const { isSuperAdmin, can, canAccessTab } = useAdminPermissions();
 *   if (!can("payments", "create")) return null;
 *   const visibleTabs = TABS.filter(t => canAccessTab(t.value));
 */
export function useAdminPermissions() {
  const user = useAuthStore((s) => s.user);

  const isSuperAdmin = user?.userType === "admin" && user?.role === "super_admin";
  const permissions = user?.permissions || [];

  // Check if user has a specific permission
  const can = (resource: string, action: string): boolean => {
    if (isSuperAdmin) return true;
    return permissions.some(
      (p) => p.resource === resource && p.action === action && p.granted
    );
  };

  // Check if user can access a specific tab (by tab value)
  const canAccessTab = (tabValue: string): boolean => {
    const perm = TAB_PERMISSIONS[tabValue];
    if (!perm) return isSuperAdmin; // unknown tab → only super_admin
    if (perm.superAdminOnly) return isSuperAdmin;
    if (!perm.resource) return true; // any admin can access (e.g. dashboard)
    return can(perm.resource, perm.action);
  };

  // Special case: messages tab requires either messages OR contact_messages permission
  const canAccessMessages = (): boolean => {
    if (isSuperAdmin) return true;
    return can("messages", "read") || can("contact_messages", "read");
  };

  return {
    user,
    isSuperAdmin,
    permissions,
    can,
    canAccessTab,
    canAccessMessages,
  };
}
