import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, Sparkles, MessageSquare, Sun, Moon } from 'lucide-react';
import { useThemeContext } from '../context/ThemeProvider';

const MobileHeader = ({ onMenuClick }) => {
    const location = useLocation();
    const isDashboard = location.pathname === '/dashboard';

    const getPageTitle = () => {
        const path = location.pathname;
        if (path.startsWith('/chat')) return 'AI Tutor';
        if (path.startsWith('/dashboard')) return 'Dashboard';
        if (path.startsWith('/roadmaps')) return 'Roadmaps';
        if (path.startsWith('/flashcards')) return 'Flashcards';
        if (path.startsWith('/voice-tutor')) return 'Voice Tutor';
        if (path.startsWith('/conversations')) return 'History';
        if (path.startsWith('/profile')) return 'Profile';
        return 'Mini AI Tutor';
    };

    const { theme, toggle } = useThemeContext();

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
                        to="/roadmaps/create"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 active:scale-95 transition-all"
                        aria-label="Create roadmap"
                    >
                        <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
                        Create
                    </Link>
                    <Link
                        to="/chat"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 active:scale-95 transition-all"
                        aria-label="Ask AI"
                    >
                        <MessageSquare className="w-3.5 h-3.5" strokeWidth={2} />
                        Ask
                    </Link>
                    {/* Theme toggle */}
                    <button
                        onClick={toggle}
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
                        onClick={toggle}
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
};

export default MobileHeader;
