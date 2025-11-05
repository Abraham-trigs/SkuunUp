// stores/useUserStore.ts
// Purpose: Centralized user state for authenticated session, synced with /api/auth/me and login

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface School {
  id: string;
  name: string;
  domain: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  school: School;
  department?: string;
}

interface UserStoreState {
  user: User | null;
  loading: boolean;
  error: string | null;
  fetchUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useUserStore = create<UserStoreState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: false,
      error: null,

      // 🔄 Fetch authenticated user from /me
      fetchUser: async () => {
        set({ loading: true, error: null });
        try {
          const res = await fetch("/api/auth/me", { credentials: "include" });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || "Failed to fetch user");
          set({ user: data.user, loading: false });
        } catch (err: any) {
          console.error("fetchUser error:", err);
          set({ error: err.message, loading: false });
        }
      },

      // ✍️ Directly update or clear user
      setUser: (user) => set({ user }),

      // 🔑 Login helper
      login: async (email: string, password: string) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
            headers: { "Content-Type": "application/json" },
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || "Login failed");
          set({ user: data.user, loading: false });
        } catch (err: any) {
          console.error("login error:", err);
          set({ error: err.message, loading: false });
        }
      },

      // 🚪 Logout and clear store + call API
      logout: () => {
        set({ user: null, loading: false, error: null });
        fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      },
    }),
    {
      name: "user-storage",
      partialize: (state) => ({ user: state.user }),
    }
  )
);
