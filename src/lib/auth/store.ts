"use client";

import { create } from "zustand";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  avatarUrl: string | null;
  userType?: string;
  mustChangePassword?: boolean;
  twoFactorEnabled?: boolean;
  isKnownDevice?: boolean;
  permissions?: Array<{ id: string; resource: string; action: string; granted: boolean }>;
  createdAt?: string;
  isActive?: boolean;
}

interface AuthState {
  user: User | null;
  sessionToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  showLoginModal: boolean;
  showDashboard: boolean;
  showAdminPanel: boolean;
  showInstructorPanel: boolean;
  lastLoginError: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setLastLoginError: (msg: string | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, phone: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  setShowLoginModal: (show: boolean) => void;
  setShowDashboard: (show: boolean) => void;
  setShowAdminPanel: (show: boolean) => void;
  setShowInstructorPanel: (show: boolean) => void;
}

// Generate a simple browser fingerprint
async function generateDeviceFingerprint(): Promise<string> {
  try {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + "x" + screen.height,
      new Date().getTimezoneOffset().toString(),
      navigator.hardwareConcurrency?.toString() || "0",
    ];
    const raw = components.join("|");
    const encoder = new TextEncoder();
    const data = encoder.encode(raw);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return "unknown";
  }
}

// Helper: make an authenticated fetch with the session token header
export function authFetch(url: string, options: RequestInit = {}, token?: string | null): Promise<Response> {
  const t = token || (typeof window !== "undefined" ? localStorage.getItem("mab-session-token") : null);
  const headers = new Headers(options.headers || {});
  if (t) {
    headers.set("X-Session-Token", t);
  }
  return fetch(url, { ...options, headers, credentials: "include" });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  sessionToken: null,
  isLoading: false,  // Start as false to avoid hydration mismatch; checkSession will set correct state
  isAuthenticated: false,
  showLoginModal: false,
  showDashboard: false,
  showAdminPanel: false,
  showInstructorPanel: false,
  lastLoginError: null,

  setUser: (user) =>
    set({ user, isAuthenticated: !!user, isLoading: false }),

  setLoading: (isLoading) => set({ isLoading }),

  setLastLoginError: (msg) => set({ lastLoginError: msg }),

  login: async (email, password) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login failed");
      }

      const data = await res.json();
      // Store session token for header-based auth fallback
      if (data.sessionToken) {
        localStorage.setItem("mab-session-token", data.sessionToken);
      }
      set({
        user: data.user,
        sessionToken: data.sessionToken || null,
        isAuthenticated: true,
        showLoginModal: false,
        showDashboard: true,
        isLoading: false,
        lastLoginError: null,
      });
      return true;
    } catch (error) {
      console.error("[LOGIN_ERROR]", error);
      const msg = error instanceof Error ? error.message : "Login failed";
      set({ lastLoginError: msg });
      return false;
    }
  },

  adminLogin: async (email, password) => {
    try {
      const fingerprint = await generateDeviceFingerprint();

      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, deviceFingerprint: fingerprint }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Admin login failed");
      }

      const data = await res.json();
      // Store session token for header-based auth fallback
      if (data.sessionToken) {
        localStorage.setItem("mab-session-token", data.sessionToken);
      }
      const isSuperAdmin = data.user?.role === "super_admin";
      set({
        user: data.user,
        sessionToken: data.sessionToken || null,
        isAuthenticated: true,
        showLoginModal: false,
        // Only auto-open full admin panel for super_admin
        // Sub-admins use the AdminPanel toggle button on the website
        showAdminPanel: isSuperAdmin,
        isLoading: false,
        lastLoginError: null,
      });
      return true;
    } catch (error) {
      console.error("[ADMIN_LOGIN_ERROR]", error);
      const msg = error instanceof Error ? error.message : "Admin login failed";
      set({ lastLoginError: msg });
      return false;
    }
  },

  register: async (name, email, phone, password) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Registration failed");
      }

      const data = await res.json();
      // Store session token for header-based auth fallback
      if (data.sessionToken) {
        localStorage.setItem("mab-session-token", data.sessionToken);
      }
      set({
        user: data.user,
        sessionToken: data.sessionToken || null,
        isAuthenticated: true,
        showLoginModal: false,
        showDashboard: true,
        isLoading: false,
      });
      return true;
    } catch (error) {
      console.error("[REGISTER_ERROR]", error);
      return false;
    }
  },

  logout: async () => {
    try {
      const user = get().user;
      if (user?.userType === "admin") {
        await authFetch("/api/admin/auth/logout", { method: "POST" });
      } else {
        await authFetch("/api/auth/logout", { method: "POST" });
      }
    } finally {
      localStorage.removeItem("mab-session-token");
      set({
        user: null,
        sessionToken: null,
        isAuthenticated: false,
        showDashboard: false,
        showAdminPanel: false,
        showInstructorPanel: false,
      });
    }
  },

  checkSession: async () => {
    try {
      // Try admin session first (with header-based token fallback)
      const adminRes = await authFetch("/api/admin/auth/me");
      if (adminRes.ok) {
        const data = await adminRes.json();
        if (data.user) {
          const isSuperAdmin = data.user.role === "super_admin";
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            // Auto-show admin panel only for super_admin (full dashboard)
            // Sub-admins use the AdminPanel toggle button on the website
            showAdminPanel: isSuperAdmin,
          });
          return;
        }
      }

      // Fallback to student session
      const res = await authFetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            // Never show admin panel for student/instructor users
            showAdminPanel: false,
          });
          return;
        }
      }
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setShowLoginModal: (show) => set({ showLoginModal: show }),
  setShowDashboard: (show) => set({ showDashboard: show }),
  setShowAdminPanel: (show) => set({ showAdminPanel: show }),
  setShowInstructorPanel: (show) => set({ showInstructorPanel: show }),
}));
