/**
 * Mobile Sidebar Component
 * Slide-out navigation menu for mobile devices
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, useTheme } from "@/hooks";
import {
  LayoutDashboard,
  MessageSquare,
  Brain,
  Map,
  BookOpen,
  GraduationCap,
  LogOut,
  X,
  Bell,
  HelpCircle,
  Sun,
  Moon,
} from "lucide-react";
import { PlatformLogo } from "@/components/icons";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: 'student' | 'instructor' | 'author';
}

const studentNavItems = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    match: (path: string) => path === "/dashboard",
  },
  {
    to: "/chat",
    label: "AI Chat",
    icon: MessageSquare,
    match: (path: string) => path.startsWith("/chat"),
  },
  {
    to: "/roadmaps",
    label: "Roadmaps",
    icon: Map,
    match: (path: string) => path.startsWith("/roadmaps"),
  },
  {
    to: "/flashcards",
    label: "Flashcards",
    icon: Brain,
    match: (path: string) => path.startsWith("/flashcards"),
  },
  {
    to: "/courses",
    label: "Courses",
    icon: GraduationCap,
    match: (path: string) => path.startsWith("/courses"),
  },
  {
    to: "/conversations",
    label: "History",
    icon: BookOpen,
    match: (path: string) => path === "/conversations",
  },
];

const instructorNavItems = [
  {
    to: "/instructor/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    match: (path: string) => path === "/instructor/dashboard",
  },
  {
    to: "/instructor/courses",
    label: "My Courses",
    icon: GraduationCap,
    match: (path: string) => path.startsWith("/instructor/courses"),
  },
  {
    to: "/courses/create",
    label: "Create Course",
    icon: BookOpen,
    match: (path: string) => path === "/courses/create",
  },
  {
    to: "/instructor/students",
    label: "Students",
    icon: Brain,
    match: (path: string) => path === "/instructor/students",
  },
  {
    to: "/instructor/earnings",
    label: "Earnings",
    icon: MessageSquare,
    match: (path: string) => path === "/instructor/earnings",
  },
  {
    to: "/chat",
    label: "AI Chat",
    icon: MessageSquare,
    match: (path: string) => path.startsWith("/chat") && !path.startsWith("/instructor"),
  },
];

const authorNavItems = [
  {
    to: "/author/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    match: (path: string) => path === "/author/dashboard",
  },
  {
    to: "/author/curriculum",
    label: "Curriculum Builder",
    icon: BookOpen,
    match: (path: string) => path === "/author/curriculum",
  },
  {
    to: "/author/content",
    label: "Content Writing",
    icon: Brain,
    match: (path: string) => path === "/author/content",
  },
  {
    to: "/author/library",
    label: "Content Library",
    icon: GraduationCap,
    match: (path: string) => path === "/author/library",
  },
  {
    to: "/author/publish",
    label: "Publishing Queue",
    icon: MessageSquare,
    match: (path: string) => path === "/author/publish",
  },
  {
    to: "/chat",
    label: "AI Chat",
    icon: MessageSquare,
    match: (path: string) => path.startsWith("/chat") && !path.startsWith("/author"),
  },
];

// Small theme toggle used in mobile sidebar
const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-[#e0e0e0] hover:bg-slate-100 dark:hover:bg-[#2a2a2a] transition-all"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-yellow-400" />
      ) : (
        <Moon className="w-5 h-5 text-slate-500" />
      )}
      <span className="text-sm font-medium text-left">Theme</span>
      <div className="ml-auto text-xs text-slate-500 dark:text-[#a8a8a8]">
        {isDark ? "Dark" : "Light"}
      </div>
    </button>
  );
};

export default function MobileSidebar({ isOpen, onClose, variant = 'student' }: MobileSidebarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      await logout();
    }
  };

  // Select navigation items based on variant
  const navItems = variant === 'instructor'
    ? instructorNavItems
    : variant === 'author'
    ? authorNavItems
    : studentNavItems;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          lg:hidden fixed top-0 left-0 h-full w-[260px] z-50 shadow-2xl
          bg-white dark:bg-[#212121]
          text-slate-900 dark:text-[#f5f5f5]
          transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        role="dialog"
        aria-label="Navigation menu"
        aria-modal="true"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-[#2a2a2a]">
            <div className="flex items-center gap-2">
              <PlatformLogo className="w-6 h-6" />
              <span className="text-[17px] font-bold text-slate-900 dark:text-[#f5f5f5]">
                Mindrift
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-[#2a2a2a] transition-colors"
              aria-label="Close menu"
            >
              <X className="w-6 h-6 text-slate-500 dark:text-[#bdbdbd]" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.match(pathname || "");

                return (
                  <Link
                    key={item.to}
                    href={item.to}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg
                      text-sm font-medium
                      transition-all duration-200
                      ${
                        isActive
                          ? "bg-slate-100 text-slate-900 dark:bg-[#2a2a2a] dark:text-[#f5f5f5]"
                          : "text-slate-700 dark:text-[#d0d0d0] hover:bg-slate-100 dark:hover:bg-[#2a2a2a] hover:text-slate-900 dark:hover:text-white"
                      }
                    `}
                  >
                    <Icon
                      className="w-5 h-5 text-slate-500 dark:text-[#bdbdbd]"
                      strokeWidth={2}
                    />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Bottom Section */}
          <div className="border-t border-slate-200 dark:border-[#2a2a2a] p-3 space-y-1">
            {/* Notifications */}
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-[#d0d0d0] hover:bg-slate-100 dark:hover:bg-[#2a2a2a] hover:text-slate-900 dark:hover:text-white transition-all">
              <Bell
                className="w-5 h-5 text-slate-500 dark:text-[#bdbdbd]"
                strokeWidth={2}
              />
              <span className="text-sm font-medium flex-1 text-left">
                Notifications
              </span>
              <span className="w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            {/* Help */}
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-[#d0d0d0] hover:bg-slate-100 dark:hover:bg-[#2a2a2a] hover:text-slate-900 dark:hover:text-white transition-all">
              <HelpCircle
                className="w-5 h-5 text-slate-500 dark:text-[#bdbdbd]"
                strokeWidth={2}
              />
              <span className="text-sm font-medium text-left">Help center</span>
            </button>

            {/* Profile */}
            <Link
              href="/profile"
              onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-[#d0d0d0] hover:bg-slate-100 dark:hover:bg-[#2a2a2a] hover:text-slate-900 dark:hover:text-white transition-all"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <span className="text-sm font-medium truncate">
                {user?.name || "Profile"}
              </span>
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-[#d0d0d0] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all"
            >
              <LogOut
                className="w-5 h-5 text-slate-500 dark:text-[#bdbdbd]"
                strokeWidth={2}
              />
              <span className="text-sm font-medium text-left">Logout</span>
            </button>

            {/* Theme Toggle */}
            <div className="pt-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
