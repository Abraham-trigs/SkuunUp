// stores/useTopbarStore.ts
// Purpose: Topbar UI state (notifications + profile) with mock notifications.

import { create } from "zustand";

export interface Notification {
  id: string;
  message: string;
  read: boolean;
  timestamp: string;
}

interface TopbarState {
  notificationsOpen: boolean;
  profileOpen: boolean;
  notifications: Notification[];
  toggleNotifications: () => void;
  toggleProfile: () => void;
  closeAll: () => void;
  fetchNotifications: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  unreadCount: () => number;
}

export const useTopbarStore = create<TopbarState>((set, get) => ({
  notificationsOpen: false,
  profileOpen: false,
  notifications: [],

  toggleNotifications: () =>
    set((state) => ({ notificationsOpen: !state.notificationsOpen, profileOpen: false })),

  toggleProfile: () =>
    set((state) => ({ profileOpen: !state.profileOpen, notificationsOpen: false })),

  closeAll: () => set({ notificationsOpen: false, profileOpen: false }),

  fetchNotifications: () => {
    // ⚡ Mock notifications
    set({
      notifications: [
        { id: "1", message: "Welcome to Ford Dashboard!", read: false, timestamp: new Date().toISOString() },
        { id: "2", message: "New exam results posted.", read: false, timestamp: new Date().toISOString() },
      ],
    });
  },

  markAsRead: (id: string) => {
    set({
      notifications: get().notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    });
  },

  markAllAsRead: () => {
    set({
      notifications: get().notifications.map((n) => ({ ...n, read: true })),
    });
  },

  unreadCount: () => get().notifications.filter((n) => !n.read).length,
}));
