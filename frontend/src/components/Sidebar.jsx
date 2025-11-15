import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
    LayoutDashboard,
    MessageSquare,
    Brain,
    Map,
    BookOpen,
    User,
    LogOut,
    Sparkles,
    Settings,
    Menu,
    X,
    Search,
    HelpCircle,
    Bell,
    Command
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const { isDark } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Close mobile menu on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    // Close mobile menu on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && mobileOpen) {
                setMobileOpen(false);
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [mobileOpen]);

    // Keyboard shortcut for search (Cmd+K or Ctrl+K)
    useEffect(() => {
        const handleKeyPress = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('sidebar-search')?.focus();
            }
        };
        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, []);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [mobileOpen]);

    const handleLogout = async () => {
        if (window.confirm('Are you sure you want to logout?')) {
            await logout();
            navigate('/login');
        }
    };

    const navItems = [
        {
            to: '/dashboard',
            label: 'Dashboard',
            icon: LayoutDashboard,
            match: (path) => path === '/dashboard'
        },
        {
            to: '/chat',
            label: 'AI Chat',
            icon: MessageSquare,
            match: (path) => path.startsWith('/chat')
        },
        {
            to: '/roadmaps',
            label: 'Roadmaps',
            icon: Map,
            match: (path) => path.startsWith('/roadmaps')
        },
        {
            to: '/flashcards',
            label: 'Flashcards',
            icon: Brain,
            match: (path) => path.startsWith('/flashcards')
        },
        {
            to: '/conversations',
            label: 'History',
            icon: BookOpen,
            match: (path) => path === '/conversations'
        }
    ];

    const SidebarContent = ({ isMobile = false }) => (
        <div className={`flex flex-col h-full transition-colors duration-300 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            {/* Header with Logo and Theme Toggle */}
            <div className={`${collapsed && !isMobile ? 'px-3 pt-6 pb-4' : 'px-5 pt-6 pb-4'} relative`}>
                {(!collapsed || isMobile) ? (
                    <div className="flex items-center justify-between">
                        <Link
                            to="/dashboard"
                            className="flex items-center gap-2.5 group"
                        >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-primary-600' : 'bg-gray-900'}`}>
                                <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
                            </div>
                            <span className={`text-[17px] font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Mini AI Tutor</span>
                        </Link>

                        {!isMobile && (
                            <button
                                onClick={() => setCollapsed(true)}
                                className={`p-1.5 rounded-md transition-colors group ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                aria-label="Collapse sidebar"
                            >
                                <svg
                                    className={`w-4 h-4 ${isDark ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-400 group-hover:text-gray-600'}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                    </div>
                ) : (
                    <button
                        onClick={() => setCollapsed(false)}
                        className={`w-full flex items-center justify-center p-2 rounded-lg transition-colors group relative ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                        aria-label="Expand sidebar"
                        title="Expand sidebar"
                    >
                        <svg
                            className={`w-5 h-5 ${isDark ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-600 group-hover:text-gray-900'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>

                        {/* Tooltip */}
                        <div className={`absolute left-full ml-2 px-2 py-1 text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-900 text-white'}`}>
                            Open Sidebar
                        </div>
                    </button>
                )}

                {isMobile && (
                    <button
                        onClick={() => setMobileOpen(false)}
                        className={`absolute top-6 right-5 p-1.5 rounded-md transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                        aria-label="Close menu"
                    >
                        <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    </button>
                )}
            </div>

            {/* Theme Toggle - Only when not collapsed */}
            {(!collapsed || isMobile) && (
                <div className="px-5 pb-2">
                    <ThemeToggle />
                </div>
            )}

            {/* Search Bar */}
            {(!collapsed || isMobile) && (
                <div className="px-5 pb-4">
                    <div className="relative">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} strokeWidth={2} />
                        <input
                            id="sidebar-search"
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-9 pr-12 py-2 text-[13px] rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                                isDark
                                    ? 'bg-gray-700 border border-gray-600 text-gray-200 placeholder:text-gray-400 focus:ring-primary-500'
                                    : 'bg-gray-50 border border-gray-200/60 text-gray-900 placeholder:text-gray-400 focus:ring-gray-900'
                            }`}
                        />
                        <div className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            <Command className="w-3 h-3" strokeWidth={2} />
                            <span className="text-[11px] font-medium">K</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Navigation */}
            <nav className={`flex-1 overflow-y-auto ${collapsed && !isMobile ? 'px-2' : 'px-3'}`}>
                <div className="space-y-0.5">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.match(location.pathname);

                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={`
                                    flex items-center gap-3 rounded-md
                                    transition-all duration-150 group relative
                                    ${collapsed && !isMobile
                                        ? 'px-2 py-2 justify-center'
                                        : 'px-2.5 py-2'
                                    }
                                    ${isActive
                                        ? isDark
                                            ? 'bg-gray-700 text-gray-100'
                                            : 'bg-gray-100 text-gray-900'
                                        : isDark
                                            ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }
                                `}
                                title={collapsed && !isMobile ? item.label : ''}
                                aria-label={item.label}
                            >
                                <Icon
                                    className={`flex-shrink-0 ${collapsed && !isMobile ? 'w-5 h-5' : 'w-[18px] h-[18px]'
                                        } ${isActive
                                            ? isDark ? 'text-primary-400' : 'text-gray-700'
                                            : isDark
                                                ? 'text-gray-500 group-hover:text-gray-400'
                                                : 'text-gray-400 group-hover:text-gray-600'
                                        }`}
                                    strokeWidth={2}
                                />
                                {(!collapsed || isMobile) && (
                                    <span className="text-[14px] font-medium flex-1">
                                        {item.label}
                                    </span>
                                )}

                                {/* Tooltip for collapsed state */}
                                {collapsed && !isMobile && (
                                    <div className={`absolute left-full ml-2 px-2 py-1 text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-900 text-white'}`}>
                                        {item.label}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Bottom Section */}
            <div className={`border-t py-3 space-y-0.5 ${collapsed && !isMobile ? 'px-2' : 'px-3'} ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                {/* Help Center */}
                {(!collapsed || isMobile) ? (
                    <button className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-md transition-all duration-150 group ${
                        isDark
                            ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}>
                        <HelpCircle className={`w-[18px] h-[18px] ${isDark ? 'text-gray-500 group-hover:text-gray-400' : 'text-gray-400 group-hover:text-gray-600'}`} strokeWidth={2} />
                        <span className="text-[14px] font-medium">Help center</span>
                    </button>
                ) : (
                    <button
                        className={`w-full flex items-center justify-center px-2 py-2 rounded-md transition-all group relative ${
                            isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                        title="Help center"
                    >
                        <HelpCircle className={`w-5 h-5 ${isDark ? 'text-gray-500 group-hover:text-gray-400' : 'text-gray-400 group-hover:text-gray-600'}`} strokeWidth={2} />
                        <div className={`absolute left-full ml-2 px-2 py-1 text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-900 text-white'}`}>
                            Help center
                        </div>
                    </button>
                )}

                {/* Notifications */}
                {(!collapsed || isMobile) ? (
                    <button className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-md transition-all duration-150 group relative ${
                        isDark
                            ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}>
                        <Bell className={`w-[18px] h-[18px] ${isDark ? 'text-gray-500 group-hover:text-gray-400' : 'text-gray-400 group-hover:text-gray-600'}`} strokeWidth={2} />
                        <span className="text-[14px] font-medium flex-1 text-left">Notifications</span>
                        <span className="w-5 h-5 bg-red-500 text-white text-[11px] font-semibold rounded-full flex items-center justify-center">
                            3
                        </span>
                    </button>
                ) : (
                    <button
                        className={`w-full flex items-center justify-center px-2 py-2 rounded-md transition-all group relative ${
                            isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                        title="Notifications"
                    >
                        <div className="relative">
                            <Bell className={`w-5 h-5 ${isDark ? 'text-gray-500 group-hover:text-gray-400' : 'text-gray-400 group-hover:text-gray-600'}`} strokeWidth={2} />
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </div>
                        <div className={`absolute left-full ml-2 px-2 py-1 text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-900 text-white'}`}>
                            Notifications (3)
                        </div>
                    </button>
                )}

                {/* User Profile */}
                {(!collapsed || isMobile) ? (
                    <Link
                        to="/profile"
                        className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-md transition-all duration-150 group ${
                            isDark
                                ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                        <div className="w-[18px] h-[18px] rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="text-[14px] font-medium truncate">
                            {user?.name || 'User Profile'}
                        </span>
                    </Link>
                ) : (
                    <Link
                        to="/profile"
                        className={`w-full flex items-center justify-center px-2 py-2 rounded-md transition-all group relative ${
                            isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                        title={user?.name || 'Profile'}
                    >
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-semibold">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className={`absolute left-full ml-2 px-2 py-1 text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-900 text-white'}`}>
                            {user?.name || 'Profile'}
                        </div>
                    </Link>
                )}

                {/* Logout */}
                {(!collapsed || isMobile) ? (
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-md transition-all duration-150 group ${
                            isDark
                                ? 'text-gray-400 hover:bg-red-900/20 hover:text-red-400'
                                : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
                        }`}
                        aria-label="Logout"
                    >
                        <LogOut className={`w-[18px] h-[18px] ${isDark ? 'text-gray-500 group-hover:text-red-400' : 'text-gray-400 group-hover:text-red-500'}`} strokeWidth={2} />
                        <span className="text-[14px] font-medium">Logout</span>
                    </button>
                ) : (
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center justify-center px-2 py-2 rounded-md transition-all group relative ${
                            isDark
                                ? 'text-gray-400 hover:bg-red-900/20 hover:text-red-400'
                                : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
                        }`}
                        title="Logout"
                        aria-label="Logout"
                    >
                        <LogOut className={`w-5 h-5 ${isDark ? 'text-gray-500 group-hover:text-red-400' : 'text-gray-400 group-hover:text-red-500'}`} strokeWidth={2} />
                        <div className={`absolute left-full ml-2 px-2 py-1 text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-900 text-white'}`}>
                            Logout
                        </div>
                    </button>
                )}
            </div>

            {/* Premium CTA Card */}
            {(!collapsed || isMobile) && (
                <div className="px-3 pb-4">
                    <div className={`rounded-xl p-4 border transition-colors duration-300 ${
                        isDark
                            ? 'bg-gradient-to-br from-gray-700 to-gray-750 border-gray-600/60'
                            : 'bg-gradient-to-br from-gray-50 to-gray-100/80 border-gray-200/60'
                    }`}>
                        <div className="space-y-3">
                            <div>
                                <h4 className={`text-[13px] font-semibold mb-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                                    Learning Progress
                                </h4>
                                <p className={`text-[11px] leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Track your learning journey
                                </p>
                            </div>

                            {/* Progress Stats */}
                            <div className="flex items-center gap-2">
                                <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                                    <div className="h-full w-[60%] bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"></div>
                                </div>
                                <span className={`text-[11px] font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>60%</span>
                            </div>

                            {/* CTA Button */}
                            <button className={`w-full text-[13px] font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 ${
                                isDark
                                    ? 'bg-primary-600 hover:bg-primary-700 text-white'
                                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                            }`}>
                                View Dashboard
                                <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <>
            {/* Mobile Hamburger Button */}
            <button
                onClick={() => setMobileOpen(true)}
                className={`fixed top-5 left-5 z-50 lg:hidden p-2.5 rounded-lg shadow-md border hover:shadow-lg transition-all active:scale-95 ${
                    isDark
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-gray-200/60'
                }`}
                aria-label="Open menu"
                aria-expanded={mobileOpen}
            >
                <Menu className={`w-5 h-5 ${isDark ? 'text-gray-200' : 'text-gray-700'}`} strokeWidth={2} />
            </button>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-200"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Mobile Sidebar */}
            <div
                className={`
                    fixed left-0 top-0 h-full z-50
                    shadow-xl border-r
                    transition-transform duration-300 ease-out lg:hidden
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
                    w-64
                    ${isDark
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-gray-100'
                    }
                `}
                role="dialog"
                aria-label="Navigation menu"
                aria-modal="true"
            >
                <SidebarContent isMobile={true} />
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
                <div
                    className={`fixed left-0 top-0 h-full border-r flex flex-col transition-all duration-300 ${
                        collapsed ? 'w-[72px]' : 'w-64'
                    } ${
                        isDark
                            ? 'bg-gray-800 border-gray-700'
                            : 'bg-white border-gray-100'
                    }`}
                >
                    <SidebarContent />
                </div>

                {/* Spacer */}
                <div className={`flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-64'
                    }`} />
            </div>
        </>
    );
};

export default Sidebar;