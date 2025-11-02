// stores/useUserStore.ts
// Purpose: Centralized user state for authenticated session, synced with /api/auth/me.

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface School {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

interface ClassRef {
  id: string;
  name: string;
}

interface StaffProfile {
  id: string;
  position?: string | null;
  department?: Department | null;
  class?: ClassRef | null;
}

interface StudentProfile {
  id: string;
  class?: ClassRef | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  schoolId: string;
  school?: School | null;
  staff?: StaffProfile | null;
  student?: StudentProfile | null;
}

interface UserStoreState {
  user: User | null;
  loading: boolean;
  error: string | null;
  fetchUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserStoreState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: false,
      error: null,

      // 🔄 Fetch authenticated user data
      fetchUser: async () => {
        try {
          set({ loading: true, error: null });
          const res = await fetch("/api/auth/me", { credentials: "include" });
          if (!res.ok) {
            if (res.status === 401) {
              set({ user: null, loading: false });
              return;
            }
            throw new Error(`Failed with status ${res.status}`);
          }
          const data = await res.json();
          set({ user: data, loading: false });
        } catch (err: any) {
          console.error("useUserStore.fetchUser error:", err);
          set({ error: "Failed to fetch user", loading: false });
        }
      },

      // ✍️ Manually update or clear user
      setUser: (user) => set({ user }),

      // 🚪 Clear session data
      logout: () => {
        set({ user: null, loading: false, error: null });
        // Optional: clear cookie on API side if you have /api/auth/logout
        fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      },
    }),
    {
      name: "user-storage", // persisted key
      partialize: (state) => ({ user: state.user }), // store only user object
    }
  )
);
