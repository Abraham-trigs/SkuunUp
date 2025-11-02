// stores/useSidebarStore.ts
// Purpose: Manages sidebar open/close state with persistence via localStorage.

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  isOpen: boolean;
  initialized: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
  setOpen: (value: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isOpen: true,
      initialized: false,
      toggle: () => set((state) => ({ isOpen: !state.isOpen, initialized: true })),
      open: () => set({ isOpen: true, initialized: true }),
      close: () => set({ isOpen: false, initialized: true }),
      setOpen: (value: boolean) => set({ isOpen: value, initialized: true }),
    }),
    { name: "ford_sidebar_state" }
  )
);
