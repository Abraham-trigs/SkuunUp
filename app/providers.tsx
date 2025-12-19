// app/providers.tsx
// Purpose: Hydrates Zustand stores with server-provided user and maintains UI state (Sidebar, Topbar).

"use client";

import { useEffect, ReactNode } from "react";
import { useUserStore } from "@/app/store/useUserStore.ts";
import { useSidebarStore } from "@/app/store/useSidebarStore.ts";
import { useTopbarStore } from "@/app/dashboard/components/store/useTopbarStore.ts";

interface ProvidersProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    schoolId: string;
  };
  children: ReactNode;
}

export function Providers({ user, children }: ProvidersProps) {
  const { setUser } = useUserStore();
  const { setOpen: setSidebarOpen } = useSidebarStore();
  const { closeAll: closeTopbarDropdowns } = useTopbarStore();

  useEffect(() => {
    // Hydrate user store
    if (user) setUser(user);

    // Optional: ensure sidebar is open by default on desktop
    setSidebarOpen(true);

    // Close all topbar dropdowns initially
    closeTopbarDropdowns();
  }, [user, setUser, setSidebarOpen, closeTopbarDropdowns]);

  return <>{children}</>;
}
