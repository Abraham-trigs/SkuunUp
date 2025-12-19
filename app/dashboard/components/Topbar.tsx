// app/components/Topbar.tsx
// Purpose: Responsive topbar showing user initials on mobile and first name on md+ screens

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, LogOut, ChevronDown } from "lucide-react";
import clsx from "clsx";

import { useTopbarStore } from "./store/useTopbarStore";
import { useSidebarStore } from "./store/sideBarStore";
import { useAuthStore } from "@/app/store/useAuthStore";

const formatTimestamp = (ts: string) =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function Topbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { isOpen: sidebarOpen } = useSidebarStore();
  const {
    notifications,
    notificationsOpen,
    profileOpen,
    toggleNotifications,
    toggleProfile,
    closeAll,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    unreadCount,
  } = useTopbarStore();

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const DESKTOP_WIDTH = 768;
  const CLOSED_WIDTH = 64;
  const OPEN_WIDTH = 256;

  // ---------------- Layout offset ----------------
  useEffect(() => {
    const updateStyle = () => {
      const isDesktop = window.innerWidth >= DESKTOP_WIDTH;
      setStyle({
        left: isDesktop ? CLOSED_WIDTH : sidebarOpen ? OPEN_WIDTH : 0,
        width: isDesktop ? `calc(100% - ${CLOSED_WIDTH}px)` : "100%",
        transition: "left 0.3s ease, width 0.3s ease",
      });
    };

    updateStyle();
    window.addEventListener("resize", updateStyle);
    return () => window.removeEventListener("resize", updateStyle);
  }, [sidebarOpen]);

  // ---------------- Identity (UI-only) ----------------
  const firstName = user?.firstName ?? "";
  const middleName = user?.middleName ?? "";
  const surname = user?.surname ?? "";

  const initials =
    firstName || surname
      ? `${firstName[0] ?? ""}${surname[0] ?? ""}`.toUpperCase()
      : "A";

  // ---------------- Logout ----------------
  const handleLogout = async () => {
    await logout();
    closeAll();
    router.replace("/auth/login");
  };

  // ---------------- Notifications ----------------
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ---------------- Outside click / ESC ----------------
  useEffect(() => {
    const handler = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent && e.key !== "Escape") return;

      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node) &&
        notifRef.current &&
        !notifRef.current.contains(e.target as Node)
      ) {
        closeAll();
      }
    };

    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", handler);
    };
  }, [closeAll]);

  return (
    <header
      style={style}
      className="fixed top-0 right-0 z-50 flex items-center justify-between px-4 py-3 text-white transition-all"
    >
      <div className="flex-1" />

      <div className="flex items-center gap-4 relative">
        {/* ---------------- Notifications ---------------- */}
        <div className="relative" ref={notifRef}>
          <button
            aria-label="Notifications"
            onClick={toggleNotifications}
            className="relative p-2 rounded hover:bg-ford-secondary"
          >
            <Bell className="w-5 h-5 text-ford-secondary" />
            {unreadCount() > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-ford-secondary text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount()}
              </span>
            )}
          </button>

          <div
            className={clsx(
              "absolute right-0 mt-2 w-72 max-h-80 bg-ford-primary rounded shadow-lg overflow-y-auto border border-ford-secondary transition-all origin-top",
              notificationsOpen
                ? "opacity-100 scale-100 pointer-events-auto"
                : "opacity-0 scale-95 pointer-events-none"
            )}
          >
            <div className="flex justify-between items-center px-4 py-2 border-b border-ford-secondary">
              <span>Notifications</span>
              <button
                className="text-xs hover:underline"
                onClick={markAllAsRead}
              >
                Mark all read
              </button>
            </div>

            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-gray-400">No notifications</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={clsx(
                    "px-4 py-2 flex justify-between cursor-pointer",
                    !n.read && "bg-gray-200 font-semibold"
                  )}
                >
                  <span className="text-sm">{n.message}</span>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(n.timestamp)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ---------------- Profile ---------------- */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={toggleProfile}
            className="flex items-center gap-2 p-2 rounded"
            aria-haspopup="menu"
            aria-expanded={profileOpen}
          >
            {/* Initials: mobile only */}
            <div className="md:hidden w-8 h-8 bg-ford-secondary text-ford-primary rounded-full flex items-center justify-center text-sm font-semibold">
              {initials}
            </div>

            {/* First name: md+ only */}
            <span className="hidden md:inline text-ford-secondary font-medium whitespace-nowrap">
              {firstName || "Account"}
            </span>

            <ChevronDown
              className={clsx(
                "w-4 h-4 text-ford-secondary transition-transform",
                profileOpen && "rotate-180"
              )}
            />
          </button>

          <div
            className={clsx(
              "absolute right-0 mt-2 w-44 bg-ford-primary rounded shadow-lg py-2 border border-ford-secondary transition-all origin-top",
              profileOpen
                ? "opacity-100 scale-100 pointer-events-auto"
                : "opacity-0 scale-95 pointer-events-none"
            )}
            role="menu"
          >
            <button
              className="w-full text-left px-4 py-2 hover:bg-ford-secondary"
              onClick={() => router.push("/profile")}
            >
              Profile
            </button>
            <button
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-ford-secondary"
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
