// components/Topbar.tsx
// Purpose: Responsive, accessible top navigation bar integrated with TopbarStore and UserStore.

"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, User, LogOut, ChevronDown, Menu } from "lucide-react";
import clsx from "clsx";
import axios from "axios";
import { useTopbarStore } from "@/app/store/useTopbarStore.ts";
import { useUserStore } from "@/app/store/useUserStore.ts";
import { useSidebarStore } from "@/app/store/useSidebarStore.ts";

export default function Topbar() {
  const router = useRouter();

  const { user, clearUser } = useUserStore();
  const { isOpen: sidebarOpen, toggle: toggleSidebar } = useSidebarStore();
  const {
    notificationsOpen,
    profileOpen,
    toggleNotifications,
    toggleProfile,
    closeAll,
  } = useTopbarStore();

  const profileRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout");
      clearUser();
      closeAll();
      router.push("/auth/login");
    } catch (err) {
      console.error("Logout failed:", err);
      alert("Logout failed. Please try again.");
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        closeAll();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeAll]);

  return (
    <header className="flex items-center justify-between bg-ford-primary text-white px-4 py-3 sticky top-0 z-50 shadow-md">
      {/* Mobile sidebar toggle */}
      <button
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        className="p-2 rounded hover:bg-ford-secondary transition-colors md:hidden"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <div className="text-lg font-semibold tracking-wide truncate">
        Dashboard
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 relative">
        {/* Notifications */}
        <div className="relative">
          <button
            aria-label="Notifications"
            onClick={toggleNotifications}
            className="relative p-2 rounded hover:bg-ford-secondary transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-warning rounded-full" />
          </button>

          <div
            className={clsx(
              "absolute right-0 mt-2 w-64 bg-white text-black rounded shadow-lg p-4 border border-ford-secondary transition-all duration-200 origin-top",
              notificationsOpen
                ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
            )}
          >
            <p className="text-sm text-gray-700">No new notifications</p>
          </div>
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={toggleProfile}
            className="flex items-center gap-2 p-2 rounded hover:bg-ford-secondary transition-colors"
            aria-haspopup="menu"
            aria-expanded={profileOpen}
          >
            <User className="w-5 h-5" />
            <span className="hidden md:inline font-medium">
              {user?.name || "User"}
            </span>
            <ChevronDown
              className={clsx(
                "w-4 h-4 transition-transform duration-200",
                profileOpen && "rotate-180"
              )}
            />
          </button>

          <div
            className={clsx(
              "absolute right-0 mt-2 w-44 bg-white text-black rounded shadow-lg py-2 border border-ford-secondary transition-all duration-200 origin-top",
              profileOpen
                ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
            )}
            role="menu"
          >
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-100"
              onClick={() => router.push("/profile")}
            >
              Profile
            </button>

            <button
              className="w-full flex items-center gap-2 text-left px-4 py-2 hover:bg-gray-100 text-red-600"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
