// app/components/store/useAuthStore.ts
// Purpose: Client-side auth store fully aligned with /api/auth/login + /auth/me contracts

"use client";

import { create } from "zustand";
import api from "@/lib/axios.ts";

// -------------------- Types --------------------
export interface School {
  id: string;
  name: string;
  domain: string;
}

export interface User {
  id: string;

  // Prisma-aligned personal info
  surname: string;
  firstName: string;
  otherNames?: string | null;

  email: string;
  role: string;

  schoolId: string;
  school: School;

  // Derived (server-inferred)
  department?: string | null;
}

interface AuthError {
  type: "login" | "logout" | "fetchMe" | "refresh" | null;
  message: string;
}

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  loading: {
    login: boolean;
    logout: boolean;
    refresh: boolean;
    fetchMe: boolean;
  };
  error: AuthError | null;

  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
  fetchMe: () => Promise<boolean>;
  fetchUser: () => Promise<boolean>;
  fetchUserOnce: () => Promise<boolean>;
  setUser: (user: User | null) => void;

  // UI helpers
  getUserFullName: () => string;
  getUserInitials: () => string;
}

let initialized = false;

// -------------------- Store --------------------
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoggedIn: false,
  loading: { login: false, logout: false, refresh: false, fetchMe: false },
  error: null,

  login: async (email, password) => {
    set({ loading: { ...get().loading, login: true }, error: null });
    try {
      const res = await api.post("/auth/login", { email, password });
      if (res.status === 200 && res.data.user) {
        set({ user: res.data.user, isLoggedIn: true });
        return true;
      }
      set({ error: { type: "login", message: "Login failed" } });
      return false;
    } catch (err: any) {
      set({
        error: {
          type: "login",
          message: err?.response?.data?.error || "Login failed",
        },
      });
      return false;
    } finally {
      set({ loading: { ...get().loading, login: false } });
    }
  },

  logout: async () => {
    set({ loading: { ...get().loading, logout: true }, error: null });
    try {
      await api.post("/auth/logout");
      set({ user: null, isLoggedIn: false });
    } catch {
      set({ error: { type: "logout", message: "Logout failed" } });
    } finally {
      set({ loading: { ...get().loading, logout: false } });
    }
  },

  refresh: async () => {
    set({ loading: { ...get().loading, refresh: true } });
    try {
      const res = await api.post("/auth/refresh");
      return res.status === 200;
    } catch {
      set({ user: null, isLoggedIn: false });
      return false;
    } finally {
      set({ loading: { ...get().loading, refresh: false } });
    }
  },

  fetchMe: async () => {
    set({ loading: { ...get().loading, fetchMe: true }, error: null });
    try {
      const res = await api.get("/auth/me");
      if (res.status === 200 && res.data.user) {
        set({ user: res.data.user, isLoggedIn: true });
        return true;
      }
      set({ user: null, isLoggedIn: false });
      return false;
    } catch {
      set({ user: null, isLoggedIn: false });
      return false;
    } finally {
      set({ loading: { ...get().loading, fetchMe: false } });
    }
  },

  fetchUser: async () => {
    const ok = await get().fetchMe();
    if (!ok) {
      const refreshed = await get().refresh();
      if (refreshed) return await get().fetchMe();
      return false;
    }
    return true;
  },

  fetchUserOnce: async () => {
    if (initialized) return !!get().user;
    initialized = true;
    return await get().fetchUser();
  },

  setUser: (user) => set({ user, isLoggedIn: !!user }),

  getUserFullName: () => {
    const u = get().user;
    if (!u) return "User";
    return [u.firstName, u.otherNames, u.surname].filter(Boolean).join(" ");
  },

  getUserInitials: () => {
    const u = get().user;
    if (!u) return "U";
    return [u.firstName, u.surname].map((n) => n?.[0]).filter(Boolean).join("").toUpperCase();
  },
}));

// -------------------- Notes --------------------
// Fully syncs with /auth/login and /auth/me endpoints.
// Includes department as optional field for staff.
// fetchUserOnce ensures single-time hydration on app bootstrap.
// UI helpers derive full name and initials without polluting API contract.
