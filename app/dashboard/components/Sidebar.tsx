"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  Home,
  Users,
  Settings,
  Book,
  BarChart2,
  BookOpen,
  FileText,
  Archive,
} from "lucide-react";
import { useSidebarStore } from "./store/sideBarStore.ts";
import { useAuthStore } from "@/app/store/useAuthStore.ts"; // Switched to AuthStore
import { useMemo, useEffect, useState } from "react";
import { useDebounce } from "@/app/hooks/useDebounce.ts";

export type Role = "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";

const rolePermissions: Record<Role, string[]> = {
  ADMIN: [
    "dashboard",
    "classes",
    "subject",
    "students",
    "staff",
    "exams",
    "finance",
    "library",
    "sessions",
    "reports",
    "settings",
  ],
  TEACHER: ["dashboard", "classes", "subject", "students", "exams", "reports"],
  STUDENT: ["dashboard", "courses", "exams"],
  PARENT: ["dashboard", "children"],
};

const menuItems = [
  { label: "Dashboard", icon: Home, key: "dashboard", href: "/dashboard" },
  { label: "Classes", icon: Book, key: "classes", href: "/dashboard/classes" },
  {
    label: "Subjects",
    icon: BookOpen,
    key: "subject",
    href: "/dashboard/subjects",
  },
  {
    label: "Students",
    icon: Users,
    key: "students",
    href: "/dashboard/students",
  },
  { label: "Staff", icon: Users, key: "staff", href: "/dashboard/staff" },
  { label: "Exams", icon: BookOpen, key: "exams", href: "/dashboard/exams" },
  {
    label: "Finance",
    icon: FileText,
    key: "finance",
    href: "/dashboard/finance",
  },
  {
    label: "Library",
    icon: Archive,
    key: "library",
    href: "/dashboard/library",
  },
  {
    label: "School Sessions",
    icon: Settings,
    key: "sessions",
    href: "/dashboard/sessions",
  },
  {
    label: "Reports",
    icon: BarChart2,
    key: "reports",
    href: "/dashboard/reports",
  },
  {
    label: "Settings",
    icon: Settings,
    key: "settings",
    href: "/dashboard/settings",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const hydrated = useSidebarStore((state) => state.hydrated);
  const setActiveItem = useSidebarStore((state) => state.setActiveItem);
  const activeItem = useSidebarStore((state) => state.activeItem);

  // FIX: Access authenticated user session
  const user = useAuthStore((state) => state.user);
  const getUserInitials = useAuthStore((state) => state.getUserInitials);
  const getUserFullName = useAuthStore((state) => state.getUserFullName);

  const role: Role = (user?.role as Role) || "ADMIN";

  const allowedItems = useMemo(
    () =>
      menuItems.filter(
        (item) => rolePermissions[role]?.includes(item.key) || false
      ),
    [role]
  );

  const debouncedPath = useDebounce(pathname, 100);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!hydrated) return;

    const normalizedPath = debouncedPath.replace(/\/+$/, "");

    const matched = [...allowedItems]
      .sort((a, b) => b.href.length - a.href.length)
      .find((item) => {
        const itemPath = item.href.replace(/\/+$/, "");
        return (
          normalizedPath === itemPath ||
          normalizedPath.startsWith(itemPath + "/")
        );
      });

    if (
      matched &&
      matched.key !== activeItem &&
      typeof setActiveItem === "function"
    ) {
      setActiveItem(matched.key);
    }
  }, [hydrated, debouncedPath, allowedItems, activeItem, setActiveItem]);

  return (
    <motion.aside
      initial={{ width: 64 }}
      animate={{ width: hovered ? 256 : 64 }}
      transition={{ type: "spring", stiffness: 250, damping: 25 }}
      className={clsx(
        "fixed top-0 left-0 bottom-0 z-40 flex flex-col overflow-hidden",
        "bg-ark-navy border-r border-ark-cyan"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-center flex-shrink-0 py-4 px-3 border-b border-ark-cyan">
        <span className="text-xl font-bold truncate text-white">
          {hovered ? user?.school?.name || "SkuunUp" : "SU"}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {allowedItems.map((item) => {
          const isActive = activeItem === item.key;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={clsx(
                "group flex items-center gap-4 px-3 py-2 rounded transition-all whitespace-nowrap",
                !hovered && "justify-center",
                isActive
                  ? "bg-ark-cyan text-ark-navy"
                  : "bg-transparent text-ark-lightblue"
              )}
              title={!hovered ? item.label : undefined}
            >
              <item.icon
                className={clsx(
                  "w-5 h-5 flex-shrink-0",
                  isActive ? "text-ark-navy" : "text-ark-lightblue"
                )}
              />
              {hovered && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-3 border-t border-ark-cyan bg-ark-navy/50">
        <div
          className={clsx(
            "flex items-center gap-3",
            !hovered && "justify-center"
          )}
        >
          <div className="h-8 w-8 rounded-full bg-ark-cyan flex items-center justify-center font-bold text-ark-navy text-xs flex-shrink-0">
            {getUserInitials()}
          </div>
          {hovered && (
            <div className="flex flex-col min-w-0 overflow-hidden">
              <span className="text-xs font-semibold text-white truncate">
                {getUserFullName()}
              </span>
              <span className="text-[10px] text-ark-lightblue/70 uppercase">
                {role}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
