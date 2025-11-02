// stores/useTopbarStore.ts
// Purpose: Manages Topbar UI states (notifications + profile) independently.

import { create } from "zustand";

interface TopbarState {
  notificationsOpen: boolean;
  profileOpen: boolean;
  toggleNotifications: () => void;
  toggleProfile: () => void;
  closeAll: () => void;
}

export const useTopbarStore = create<TopbarState>((set) => ({
  notificationsOpen: false,
  profileOpen: false,

  toggleNotifications: () => set((state) => ({ notificationsOpen: !state.notificationsOpen, profileOpen: false })),
  toggleProfile: () => set((state) => ({ profileOpen: !state.profileOpen, notificationsOpen: false })),
  closeAll: () => set({ notificationsOpen: false, profileOpen: false }),
}));
