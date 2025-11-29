/**
 * Mobile Sidebar Component
 * Slide-out navigation menu for mobile devices
 */

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, useTheme } from '@/hooks';
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
} from 'lucide-react';
import { PlatformLogo } from '@/components/icons';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    match: (path: string) => path === '/dashboard',
  },
  {
    to: '/chat',
    label: 'AI Chat',
    icon: MessageSquare,
    match: (path: string) => path.startsWith('/chat'),
  },
  {
    to: '/roadmaps',
    label: 'Roadmaps',
    icon: Map,
    match: (path: string) => path.startsWith('/roadmaps'),
  },
  {
    to: '/flashcards',
    label: 'Flashcards',
    icon: Brain,
    match: (path: string) => path.startsWith('/flashcards'),
  },
  {
    to: '/courses',
    label: 'Courses',
    icon: GraduationCap,
    match: (path: string) => path.startsWith('/courses'),
  },
  {
    to: '/conversations',
    label: 'History',
    icon: BookOpen,
    match: (path: string) => path === '/conversations',
  },
];

// Small theme toggle used in mobile sidebar
const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-all"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-yellow-400" />
      ) : (
        <Moon className="w-5 h-5 text-gray-300" />
      )}
      <span className="text-sm font-medium text-left">Theme</span>
      <div className="ml-auto text-xs text-gray-400">{theme === 'dark' ? 'Dark' : 'Light'}</div>
    </button>
  );
};

export default function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          lg:hidden fixed top-0 left-0 h-full w-[260px] bg-[#171717] z-50 shadow-2xl
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        role="dialog"
        aria-label="Navigation menu"
        aria-modal="true"
      >
        <div className="flex flex-col h-full text-white">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <PlatformLogo className="w-6 h-6 " />
              <span className="text-[17px] font-bold text-white">Mindrift</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-800 rounded-md transition-colors"
              aria-label="Close menu"
            >
              <X className="w-6 h-6 text-[#afafaf]" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.match(pathname || '');

                return (
                  <Link
                    key={item.to}
                    href={item.to}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg
                      transition-all duration-200
                      ${
                        isActive
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" strokeWidth={2} />
                    <span className="text-sm font-medium flex-1">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Bottom Section */}
          <div className="border-t border-gray-800 p-3 space-y-1">
            {/* Notifications */}
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-all">
              <Bell className="w-5 h-5" strokeWidth={2} />
              <span className="text-sm font-medium flex-1 text-left">Notifications</span>
              <span className="w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            {/* Help */}
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-all">
              <HelpCircle className="w-5 h-5" strokeWidth={2} />
              <span className="text-sm font-medium text-left">Help center</span>
            </button>

            {/* Profile */}
            <Link
              href="/profile"
              onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-all"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-medium truncate">{user?.name || 'Profile'}</span>
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-red-900/50 hover:text-red-400 transition-all"
            >
              <LogOut className="w-5 h-5" strokeWidth={2} />
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
