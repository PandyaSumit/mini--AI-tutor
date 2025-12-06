/**
 * Author Dashboard Layout
 * Layout wrapper for author pages with author-specific navigation
 */

"use client";

import { useState, useEffect } from "react";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import { usePathname } from "next/navigation";
import AuthorSidebar from "./AuthorSidebar";
import MobileHeader from "./MobileHeader";
import MobileSidebar from "./MobileSidebar";

interface AuthorDashboardLayoutProps {
  children: React.ReactNode;
}

export function AuthorDashboardLayout({ children }: AuthorDashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  // Load saved collapsed state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.SIDEBAR_COLLAPSED);
      if (saved !== null) setCollapsed(saved === "true");
    } catch (e) {
      // ignore (server-side or privacy settings)
    }
  }, []);

  // Persist collapsed state
  useEffect(() => {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.SIDEBAR_COLLAPSED,
        String(collapsed)
      );
    } catch (e) {
      // ignore
    }
  }, [collapsed]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <AuthorSidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Mobile Header */}
      <MobileHeader onMenuClick={() => setMobileMenuOpen(true)} />

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        variant="author"
      />

      {/* Main Content */}
      <main
        className={`pt-14 lg:pt-0 transition-all duration-300 ease-in-out ${
          collapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        <div className="w-full">{children}</div>
      </main>
    </div>
  );
}

export default AuthorDashboardLayout;
