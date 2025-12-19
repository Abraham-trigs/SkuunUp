// app/store/useSidebarStore.ts
// Purpose: Zustand store managing sidebar collapse, active menu item, and safe hydration persistence.

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SidebarState {
  isOpen: boolean;
  activeItem: string | null;
  hydrated: boolean;
  toggle: () => void;
  setActiveItem: (item: string) => void;
  resetSidebar: () => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isOpen: false, // default collapsed
      activeItem: null,
      hydrated: false, // hydration check for Turbopack
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      setActiveItem: (item: string) => set({ activeItem: item }),
      resetSidebar: () => set({ isOpen: false, activeItem: null }),
    }),
    {
      name: "sidebar-storage",
      partialize: (state) => ({
        isOpen: state.isOpen,
        activeItem: state.activeItem,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    }
  )
);
