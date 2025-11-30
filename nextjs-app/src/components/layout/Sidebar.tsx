/**
 * Sidebar Component
 * Desktop navigation sidebar with collapsible functionality
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks";
import {
  LayoutDashboard,
  MessageSquare,
  Brain,
  Map,
  BookOpen,
  LogOut,
  Sparkles,
  Search,
  HelpCircle,
  Bell,
  Command,
  GraduationCap,
} from "lucide-react";
import { PlatformLogo, SidebarHandlerIcon } from "@/components/icons";

interface NavItem {
  to: string;
  label: string;
  icon: any;
  match: (path: string) => boolean;
  showInBottomNav: boolean;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    match: (path) => path === "/dashboard",
    showInBottomNav: true,
  },
  {
    to: "/chat",
    label: "AI Chat",
    icon: MessageSquare,
    match: (path) => path.startsWith("/chat"),
    showInBottomNav: true,
  },
  {
    to: "/roadmaps",
    label: "Roadmaps",
    icon: Map,
    match: (path) => path.startsWith("/roadmaps"),
    showInBottomNav: true,
  },
  {
    to: "/flashcards",
    label: "Flashcards",
    icon: Brain,
    match: (path) => path.startsWith("/flashcards"),
    showInBottomNav: true,
  },
  {
    to: "/courses",
    label: "Courses",
    icon: GraduationCap,
    match: (path) => path.startsWith("/courses"),
    showInBottomNav: false,
  },
  {
    to: "/conversations",
    label: "History",
    icon: BookOpen,
    match: (path) => path === "/conversations",
    showInBottomNav: false,
  },
];

interface SidebarContentProps {
  isMobile?: boolean;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onClose?: () => void;
}

const SidebarContent = ({
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
              href="/dashboard"
              className="flex items-center gap-2.5 group"
              onClick={onClose}
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <PlatformLogo />
              </div>
              <span className="text-[17px] font-bold text-slate-900 dark:text-[#f5f5f5]">
                Mindrift
              </span>
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
            {/* Tooltip */}
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
              className="w-full pl-9 pr-12 py-2 text-[13px] bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200/70 dark:border-[#2a2a2a] rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/80 dark:focus:ring-[#f5f5f5]/70 focus:border-transparent transition-all placeholder:text-slate-400 dark:placeholder:text-[#888888]"
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
        <div className="space-y-0.5 pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.match(pathname || "");

            return (
              <Link
                key={item.to}
                href={item.to}
                onClick={onClose}
                className={`
                  flex items-center gap-3 rounded-md
                  transition-all duration-150 group relative
                  ${
                    collapsed && !isMobile
                      ? "px-2 py-2 justify-center"
                      : "px-2.5 py-2"
                  }
                  ${
                    isActive
                      ? "bg-slate-100 text-slate-900 dark:bg-[#1a1a1a] dark:text-[#f5f5f5]"
                      : "text-slate-600 dark:text-[#c2c2c2] hover:bg-slate-50 dark:hover:bg-[#272727] hover:text-slate-900 dark:hover:text-white"
                  }
                `}
                title={collapsed && !isMobile ? item.label : ""}
                aria-label={item.label}
              >
                <Icon
                  className={`flex-shrink-0 ${
                    collapsed && !isMobile ? "w-5 h-5" : "w-[18px] h-[18px]"
                  } ${
                    isActive
                      ? "text-slate-800 dark:text-[#f5f5f5]"
                      : "text-slate-400 dark:text-[#9e9e9e] group-hover:text-slate-600 dark:group-hover:text-white"
                  }`}
                  strokeWidth={2}
                />
                {(!collapsed || isMobile) && (
                  <>
                    <span className="text-[14px] font-medium flex-1">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}

                {/* Tooltip for collapsed state */}
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

      {/* Bottom Section */}
      <div
        className={`border-t border-slate-100 dark:border-[#2a2a2a] py-3 space-y-0.5 ${
          collapsed && !isMobile ? "px-2" : "px-3"
        }`}
      >
        {/* Help Center */}
        {!collapsed || isMobile ? (
          <button className="w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-slate-600 dark:text-[#c2c2c2] hover:bg-slate-50 dark:hover:bg-[#272727] hover:text-slate-900 dark:hover:text-white transition-all duration-150 group">
            <HelpCircle
              className="w-[18px] h-[18px] text-slate-400 dark:text-[#9e9e9e] group-hover:text-slate-600 dark:group-hover:text-white"
              strokeWidth={2}
            />
            <span className="text-[14px] font-medium">Help center</span>
          </button>
        ) : (
          <button
            className="w-full flex items-center justify-center px-2 py-2 rounded-md text-slate-600 dark:text-[#c2c2c2] hover:bg-slate-50 dark:hover:bg-[#272727] transition-all group relative"
            title="Help center"
          >
            <HelpCircle
              className="w-5 h-5 text-slate-400 dark:text-[#9e9e9e] group-hover:text-slate-600 dark:group-hover:text-white"
              strokeWidth={2}
            />
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              Help center
            </div>
          </button>
        )}

        {/* Notifications */}
        {!collapsed || isMobile ? (
          <button className="w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-slate-600 dark:text-[#c2c2c2] hover:bg-slate-50 dark:hover:bg-[#272727] hover:text-slate-900 dark:hover:text-white transition-all duration-150 group relative">
            <Bell
              className="w-[18px] h-[18px] text-slate-400 dark:text-[#9e9e9e] group-hover:text-slate-600 dark:group-hover:text-white"
              strokeWidth={2}
            />
            <span className="text-[14px] font-medium flex-1 text-left">
              Notifications
            </span>
            <span className="w-5 h-5 bg-red-500 text-white text-[11px] font-semibold rounded-full flex items-center justify-center">
              3
            </span>
          </button>
        ) : (
          <button
            className="w-full flex items-center justify-center px-2 py-2 rounded-md text-slate-600 dark:text-[#c2c2c2] hover:bg-slate-50 dark:hover:bg-[#272727] transition-all group relative"
            title="Notifications"
          >
            <div className="relative">
              <Bell
                className="w-5 h-5 text-slate-400 dark:text-[#9e9e9e] group-hover:text-slate-600 dark:group-hover:text-white"
                strokeWidth={2}
              />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            </div>
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              Notifications (3)
            </div>
          </button>
        )}

        {/* User Profile */}
        {!collapsed || isMobile ? (
          <Link
            href="/profile"
            onClick={onClose}
            className="w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-slate-600 dark:text-[#c2c2c2] hover:bg-slate-50 dark:hover:bg-[#272727] hover:text-slate-900 dark:hover:text-white transition-all duration-150 group"
          >
            <div className="w-[18px] h-[18px] rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <span className="text-[14px] font-medium truncate">
              {user?.name || "User profile"}
            </span>
          </Link>
        ) : (
          <Link
            href="/profile"
            onClick={onClose}
            className="w-full flex items-center justify-center px-2 py-2 rounded-md text-slate-600 dark:text-[#c2c2c2] hover:bg-slate-50 dark:hover:bg-[#272727] transition-all group relative"
            title={user?.name || "Profile"}
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-semibold">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              {user?.name || "Profile"}
            </div>
          </Link>
        )}

        {/* Logout */}
        {!collapsed || isMobile ? (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-slate-600 dark:text-[#c2c2c2] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-150 group"
            aria-label="Logout"
          >
            <LogOut
              className="w-[18px] h-[18px] text-slate-400 dark:text-[#9e9e9e] group-hover:text-red-500 dark:group-hover:text-red-400"
              strokeWidth={2}
            />
            <span className="text-[14px] font-medium">Logout</span>
          </button>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-2 py-2 rounded-md text-slate-600 dark:text-[#c2c2c2] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all group relative"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut
              className="w-5 h-5 text-slate-400 dark:text-[#9e9e9e] group-hover:text-red-500 dark:group-hover:text-red-400"
              strokeWidth={2}
            />
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              Logout
            </div>
          </button>
        )}
      </div>

      {/* Progress CTA Card */}
      {(!collapsed || isMobile) && (
        <div className="px-3 pb-4">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-[#1a1a1a] dark:to-[#252525] rounded-xl p-4 border border-slate-200/70 dark:border-[#2a2a2a]">
            <div className="space-y-3">
              <p className="text-[11px] text-slate-500 dark:text-[#bdbdbd] leading-relaxed">
                Track your learning journey
              </p>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-200 dark:bg-[#333333] rounded-full overflow-hidden">
                  <div className="h-full w-[60%] bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" />
                </div>
                <span className="text-[11px] font-semibold text-slate-600 dark:text-[#d0d0d0]">
                  60%
                </span>
              </div>

              <button className="w-full bg-slate-900 dark:bg-[#f5f5f5] hover:bg-black dark:hover:bg-white text-white dark:text-[#212121] text-[13px] font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                View dashboard
                <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface SidebarProps {
  collapsed?: boolean;
  setCollapsed?: (b: boolean) => void;
}

export default function Sidebar({
  collapsed: collapsedProp,
  setCollapsed: setCollapsedProp,
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed =
    typeof collapsedProp === "boolean" ? collapsedProp : internalCollapsed;
  const setCollapsed = setCollapsedProp ?? setInternalCollapsed;

  // Keyboard shortcut for search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("sidebar-search")?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, []);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <div
          className={`fixed left-0 top-0 h-full bg-white dark:bg-[#212121] border-r border-slate-100 dark:border-[#2a2a2a] flex flex-col transition-all duration-300 ease-in-out z-40 ${
            collapsed ? "w-20" : "w-64"
          }`}
          style={{ willChange: "width" }}
        >
          <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} />
        </div>
      </div>
    </>
  );
}
