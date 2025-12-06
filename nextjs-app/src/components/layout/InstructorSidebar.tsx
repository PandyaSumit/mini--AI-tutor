/**
 * Instructor Sidebar Component
 * Navigation sidebar specifically for instructor pages
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  DollarSign,
  PlusCircle,
  BarChart3,
  Settings,
  LogOut,
  Search,
  Command,
  FileText,
  CheckCircle,
  MessageSquare,
  BookOpen,
} from "lucide-react";
import { PlatformLogo, SidebarHandlerIcon } from "@/components/icons";

interface NavItem {
  to: string;
  label: string;
  icon: any;
  match: (path: string) => boolean;
  badge?: string;
}

const instructorNavItems: NavItem[] = [
  {
    to: "/instructor/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    match: (path) => path === "/instructor/dashboard",
  },
  {
    to: "/instructor/courses",
    label: "My Courses",
    icon: GraduationCap,
    match: (path) => path.startsWith("/instructor/courses"),
  },
  {
    to: "/courses/create",
    label: "Create Course",
    icon: PlusCircle,
    match: (path) => path === "/courses/create",
    badge: "new",
  },
  {
    to: "/instructor/students",
    label: "Students",
    icon: Users,
    match: (path) => path.startsWith("/instructor/students"),
  },
  {
    to: "/instructor/earnings",
    label: "Earnings",
    icon: DollarSign,
    match: (path) => path.startsWith("/instructor/earnings"),
  },
  {
    to: "/instructor/analytics",
    label: "Analytics",
    icon: BarChart3,
    match: (path) => path.startsWith("/instructor/analytics"),
  },
];

// Learning section (instructors can also be students)
const learningNavItems: NavItem[] = [
  {
    to: "/dashboard",
    label: "Student Dashboard",
    icon: BookOpen,
    match: (path) => path === "/dashboard",
  },
  {
    to: "/chat",
    label: "AI Chat",
    icon: MessageSquare,
    match: (path) => path.startsWith("/chat"),
  },
  {
    to: "/courses",
    label: "Browse Courses",
    icon: GraduationCap,
    match: (path) => path === "/courses" || (path.startsWith("/courses") && !path.includes("/create")),
  },
];

interface SidebarContentProps {
  isMobile?: boolean;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onClose?: () => void;
}

const InstructorSidebarContent = ({
  isMobile = false,
  collapsed,
  setCollapsed,
  onClose,
}: SidebarContentProps) => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      await logout();
    }
  };

  // Check if instructor is verified
  const isVerified = user?.instructorVerification?.status === 'approved';

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#212121] text-slate-900 dark:text-[#f5f5f5]">
      {/* Header with Logo */}
      <div
        className={`border-b border-slate-100 dark:border-[#2a2a2a] ${
          collapsed && !isMobile
            ? "px-3 pt-[0.9rem] pb-4"
            : "px-5 pt-[0.9rem] pb-4"
        } relative`}
      >
        {!collapsed || isMobile ? (
          <div className="flex items-center justify-between">
            <Link
              href="/instructor/dashboard"
              className="flex items-center gap-2.5 group"
              onClick={onClose}
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <PlatformLogo />
              </div>
              <div className="flex flex-col">
                <span className="text-[17px] font-bold text-slate-900 dark:text-[#f5f5f5]">
                  Mindrift
                </span>
                <span className="text-[11px] text-orange-600 dark:text-orange-500 font-medium flex items-center gap-1">
                  {isVerified && <CheckCircle className="w-3 h-3" />}
                  Instructor Hub
                </span>
              </div>
            </Link>

            {!isMobile && (
              <button
                onClick={() => setCollapsed(true)}
                className="hover:bg-slate-100 dark:hover:bg-[#2a2a2a] rounded-md transition-colors group p-1.5"
                aria-label="Collapse sidebar"
              >
                <SidebarHandlerIcon className="w-6 h-6 text-slate-500 dark:text-[#bdbdbd]" />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => setCollapsed(false)}
            className="w-full flex items-center justify-center p-2 hover:bg-slate-100 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors group relative cursor-col-resize"
          >
            <div className="w-8 h-8 flex items-center justify-center relative">
              <PlatformLogo className="w-6 h-6 opacity-100 group-hover:opacity-0 transition-opacity" />
              <SidebarHandlerIcon className="absolute w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 dark:text-[#bdbdbd]" />
            </div>
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              Expand sidebar
            </div>
          </button>
        )}
      </div>

      {/* Search Bar */}
      {(!collapsed || isMobile) && (
        <div className="px-5 pb-4 pt-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#9e9e9e] z-10"
              strokeWidth={2}
            />
            <input
              id="sidebar-search"
              type="text"
              placeholder="Search..."
              autoComplete="off"
              spellCheck={false}
              aria-label="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-12 py-2 text-[13px] bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200/70 dark:border-[#2a2a2a] rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/80 dark:focus:ring-orange-500/70 focus:border-transparent transition-all placeholder:text-slate-400 dark:placeholder:text-[#888888]"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-slate-400 dark:text-[#9e9e9e]">
              <Command className="w-3 h-3" strokeWidth={2} />
              <span className="text-[11px] font-medium">K</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav
        className={`flex-1 overflow-y-auto ${
          collapsed && !isMobile ? "px-2" : "px-3"
        }`}
      >
        {/* Instructor Section */}
        <div className="space-y-0.5 pt-2">
          {(!collapsed || isMobile) && (
            <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 dark:text-[#9e9e9e] uppercase tracking-wider">
              Teaching
            </div>
          )}

          {instructorNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.match(pathname);

            return (
              <Link
                key={item.to}
                href={item.to}
                onClick={onClose}
                className={`group flex items-center gap-3 ${
                  collapsed && !isMobile ? "px-2 py-2.5 justify-center" : "px-3 py-2.5"
                } rounded-lg text-[14px] transition-all relative ${
                  isActive
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-slate-700 dark:text-[#e0e0e0] hover:bg-slate-100 dark:hover:bg-[#2a2a2a]"
                }`}
              >
                <Icon
                  className={`${collapsed && !isMobile ? "w-5 h-5" : "w-[18px] h-[18px]"} flex-shrink-0 ${
                    isActive ? "text-white" : "text-slate-500 dark:text-[#bdbdbd]"
                  }`}
                  strokeWidth={2}
                />
                {(!collapsed || isMobile) && (
                  <>
                    <span className="flex-1 font-medium">{item.label}</span>
                    {item.badge && (
                      <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {collapsed && !isMobile && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Learning Section */}
        <div className="space-y-0.5 pt-6">
          {(!collapsed || isMobile) && (
            <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 dark:text-[#9e9e9e] uppercase tracking-wider">
              Learning
            </div>
          )}

          {learningNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.match(pathname);

            return (
              <Link
                key={item.to}
                href={item.to}
                onClick={onClose}
                className={`group flex items-center gap-3 ${
                  collapsed && !isMobile ? "px-2 py-2.5 justify-center" : "px-3 py-2.5"
                } rounded-lg text-[14px] transition-all relative ${
                  isActive
                    ? "bg-slate-900 dark:bg-[#f5f5f5] text-white dark:text-[#212121] shadow-sm"
                    : "text-slate-700 dark:text-[#e0e0e0] hover:bg-slate-100 dark:hover:bg-[#2a2a2a]"
                }`}
              >
                <Icon
                  className={`${collapsed && !isMobile ? "w-5 h-5" : "w-[18px] h-[18px]"} flex-shrink-0 ${
                    isActive ? "text-white dark:text-[#212121]" : "text-slate-500 dark:text-[#bdbdbd]"
                  }`}
                  strokeWidth={2}
                />
                {(!collapsed || isMobile) && (
                  <span className="flex-1 font-medium">{item.label}</span>
                )}
                {collapsed && !isMobile && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div
        className={`border-t border-slate-100 dark:border-[#2a2a2a] ${
          collapsed && !isMobile ? "p-2" : "p-4"
        }`}
      >
        <div className={`space-y-1 ${collapsed && !isMobile ? "" : ""}`}>
          {/* User Profile */}
          {user && (
            <Link
              href="/profile"
              onClick={onClose}
              className={`group flex items-center gap-3 ${
                collapsed && !isMobile ? "px-2 py-2 justify-center" : "px-3 py-2"
              } rounded-lg text-[14px] hover:bg-slate-100 dark:hover:bg-[#2a2a2a] transition-colors relative`}
            >
              <div className={`${collapsed && !isMobile ? "w-8 h-8" : "w-8 h-8"} rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
              {(!collapsed || isMobile) && (
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-[#f5f5f5] truncate">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-[#9e9e9e] truncate flex items-center gap-1">
                    {isVerified && <CheckCircle className="w-3 h-3 text-green-600" />}
                    Instructor
                  </p>
                </div>
              )}
              {collapsed && !isMobile && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {user.name}
                </div>
              )}
            </Link>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={`group w-full flex items-center gap-3 ${
              collapsed && !isMobile ? "px-2 py-2.5 justify-center" : "px-3 py-2.5"
            } rounded-lg text-[14px] text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors relative`}
          >
            <LogOut className={`${collapsed && !isMobile ? "w-5 h-5" : "w-[18px] h-[18px]"} flex-shrink-0`} strokeWidth={2} />
            {(!collapsed || isMobile) && (
              <span className="flex-1 font-medium text-left">Logout</span>
            )}
            {collapsed && !isMobile && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                Logout
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export default function InstructorSidebar({ collapsed, setCollapsed }: SidebarProps) {
  return (
    <aside
      className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-white dark:bg-[#212121] border-r border-slate-100 dark:border-[#2a2a2a] transition-all duration-300 ease-in-out z-40 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <InstructorSidebarContent
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
    </aside>
  );
}

export { InstructorSidebarContent };
