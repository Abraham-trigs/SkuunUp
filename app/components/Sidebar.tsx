// components/Sidebar.tsx
// Purpose: Role-based sidebar navigation with animations and Zustand integration.

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
import { useSidebarStore } from "@/app/store/useSidebarStore.ts";
import { useUserStore } from "@/app/store/useUserStore.ts";

export type Role = "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";

const rolePermissions: Record<Role, string[]> = {
  ADMIN: [
    "dashboard",
    "students",
    "staff",
    "classes",
    "exams",
    "finance",
    "library",
    "sessions",
    "reports",
    "settings",
  ],
  TEACHER: ["dashboard", "students", "exams", "reports"],
  STUDENT: ["dashboard", "courses", "exams"],
  PARENT: ["dashboard", "children"],
};

interface MenuItem {
  label: string;
  icon: any;
  key: string;
  href: string;
}

const menuItems: MenuItem[] = [
  { label: "Dashboard", icon: Home, key: "dashboard", href: "/dashboard" },
  { label: "Classes", icon: Book, key: "classes", href: "/dashboard/classes" },
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
  const { isOpen, toggle } = useSidebarStore();
  const { user } = useUserStore();

  const role: Role = (user?.role as Role) || "ADMIN";
  const allowedItems = menuItems.filter((item) =>
    rolePermissions[role].includes(item.key)
  );

  return (
    <motion.aside
      initial={{ width: 64 }}
      animate={{ width: isOpen ? 256 : 64 }}
      transition={{ type: "spring", stiffness: 250, damping: 25 }}
      className="bg-ford-primary text-white h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between py-4 px-3 border-b border-ford-secondary">
        {isOpen && <span className="text-xl font-bold">Ford School</span>}
        <button
          onClick={toggle}
          className="text-white p-1 hover:bg-ford-secondary rounded-md"
          aria-label="Toggle Sidebar"
        >
          {isOpen ? "⯈" : "⯇"}
        </button>
      </div>

      {/* Menu */}
      <nav className="mt-6 flex-1 flex flex-col gap-2 relative">
        {allowedItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={clsx(
                "group relative flex items-center gap-4 px-4 py-2 rounded transition-colors",
                isActive
                  ? "bg-ford-secondary font-semibold"
                  : "hover:bg-ford-secondary",
                !isOpen && "justify-center"
              )}
            >
              <item.icon className="w-5 h-5" />
              {isOpen && <span>{item.label}</span>}
              {!isOpen && (
                <span className="absolute left-full ml-2 opacity-0 group-hover:opacity-100 transition-opacity bg-ford-secondary text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-ford-secondary">
        {isOpen && (
          <span className="text-sm text-white/70">
            © {new Date().getFullYear()} Ford School
          </span>
        )}
      </div>
    </motion.aside>
  );
}
