/**
 * Mobile Header Component
 * Top navigation bar for mobile devices
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, Sparkles, MessageSquare, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks';

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const isDashboard = pathname === '/dashboard';

  const getPageTitle = () => {
    if (!pathname) return 'Mini AI Tutor';

    if (pathname.startsWith('/chat')) return 'AI Tutor';
    if (pathname.startsWith('/dashboard')) return 'Dashboard';
    if (pathname.startsWith('/roadmaps')) return 'Roadmaps';
    if (pathname.startsWith('/flashcards')) return 'Flashcards';
    if (pathname.startsWith('/courses')) return 'Courses';
    if (pathname.startsWith('/conversations')) return 'History';
    if (pathname.startsWith('/profile')) return 'Profile';
    return 'Mini AI Tutor';
  };

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 flex items-center justify-between border-transparent px-3 bg-white dark:bg-[#212121] shadow-sm">
      {/* Left: Menu Button */}
      <button
        onClick={onMenuClick}
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:text-gray-900 dark:hover:text-white focus:outline-none active:opacity-50 transition-all"
        aria-label="Open sidebar"
      >
        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" strokeWidth={2} />
      </button>

      {/* Center: Page Title */}
      <div className="flex-1 flex">
        <h1 className="text-base font-semibold text-gray-900 dark:text-white truncate px-2">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right: Action Buttons (Dashboard Only) */}
      {isDashboard ? (
        <div className="flex items-center gap-2">
          <Link
            href="/roadmaps/create"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 active:scale-95 transition-all"
            aria-label="Create roadmap"
          >
            <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
            Create
          </Link>
          <Link
            href="/chat"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 active:scale-95 transition-all"
            aria-label="Ask AI"
          >
            <MessageSquare className="w-3.5 h-3.5" strokeWidth={2} />
            Ask
          </Link>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-700" />
            )}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-700" />
            )}
          </button>
        </div>
      )}
    </header>
  );
}
