// app/dashboard/layout.tsx
// Purpose: Dashboard layout with Sidebar, Topbar, auth guard, and Ark-themed background

"use client";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import Sidebar from "@/app/dashboard/components/Sidebar.tsx";
import Topbar from "@/app/dashboard/components/Topbar.tsx";
import { useSidebarStore } from "@/app/dashboard/components/store/sideBarStore.ts";
import { useAuthStore } from "@/app/store/useAuthStore.ts";
import AppBackground from "../components/AppBackground.tsx";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isOpen } = useSidebarStore();
  const sidebarWidth = isOpen ? 256 : 34;

  const { fetchUserOnce } = useAuthStore();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      const ok = await fetchUserOnce();
      if (!mounted) return;

      if (!ok) router.replace("/auth/login");
      setAuthChecked(true);
    };

    checkAuth();
    return () => {
      mounted = false;
    };
  }, [fetchUserOnce, router]);

  // ⚡ Client-only: render nothing until authChecked
  if (typeof window === "undefined" || !authChecked) return null;

  return (
    <div className="h-full w-full overflow-hidden flex bg-ark-navy backdrop-blur-md">
      <Sidebar />
      <div
        className="flex flex-col flex-1 transition-all duration-300"
        style={{ marginLeft: sidebarWidth }}
      >
        <Topbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 mt-1">
          <AppBackground>{children}</AppBackground>
        </main>
      </div>
    </div>
  );
}

/*
Design reasoning:
- Maintains current auth guard logic, sidebar toggle width, and Topbar layout.
- Replaced legacy ford-* background gradient with Ark palette (lightblue → cyan) for modern, cohesive theme.
- Backdrop blur retained for glass-like effect, aligning with modern UI patterns.

Structure:
- Root flex container for sidebar + main content.
- Sidebar width dynamically controlled via Zustand store.
- Topbar and main content flex-1 for responsive resizing.

Implementation guidance:
- Auth check ensures client-only rendering until user is verified.
- Margin-left dynamically applied based on sidebar open state.
- Gradient background applied only here, not forcing color changes elsewhere.

Scalability insight:
- Ark palette integration ensures consistent theming across dashboard components.
- Flexible layout accommodates future global providers or overlays without structural changes.
- Sidebar and Topbar can independently evolve while maintaining responsive main content area.
*/
