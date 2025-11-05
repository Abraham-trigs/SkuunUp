// app/dashboard/layout.tsx
// Purpose: Fixed Sidebar + Topbar; handles auth, session, and responsive layout

"use client";

import { ReactNode, useEffect } from "react";
import Sidebar from "@/app/components/Sidebar";
import Topbar from "@/app/components/Topbar";
import { useUserStore } from "@/app/store/useUserStore.ts";
import { useSidebarStore } from "@/app/store/useSidebarStore.ts";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, fetchUser, loading } = useUserStore();
  const { isOpen } = useSidebarStore();
  const sidebarWidth = isOpen ? 256 : 64;

  // Hydrate user session on mount
  useEffect(() => {
    if (!user) fetchUser();
  }, [user, fetchUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Loading session...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        Not authenticated
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-gradient-to-br from-ford-primary/20 to-ford-secondary/10 backdrop-blur-md">
      {/* Sidebar fixed at top-left */}
      <Sidebar />

      {/* Main content container */}
      <div
        className="flex flex-col flex-1 transition-all duration-300"
        style={{ marginLeft: sidebarWidth }}
      >
        {/* Topbar dynamically adjusts width */}
        <Topbar />

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 mt-1">
          {children}
        </main>
      </div>
    </div>
  );
}
