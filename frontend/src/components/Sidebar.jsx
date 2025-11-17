import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
    Command,
    Mic
} from 'lucide-react';

const Sidebar = () => {
    const { user, logout } = useAuth();
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
            to: '/voice-tutor',
            label: 'Voice Tutor',
            icon: Mic,
            match: (path) => path === '/voice-tutor',
            badge: 'NEW'
        },
        {
            to: '/conversations',
            label: 'History',
            icon: BookOpen,
            match: (path) => path === '/conversations'
        }
    ];

    const SidebarContent = ({ isMobile = false }) => (
        <div className="flex flex-col h-full bg-white">
            {/* Header with Logo */}
            <div className={`${collapsed && !isMobile ? 'px-3 pt-6 pb-4' : 'px-5 pt-6 pb-4'} relative`}>
                {(!collapsed || isMobile) ? (
                    <div className="flex items-center justify-between">
                        <Link
                            to="/dashboard"
                            className="flex items-center gap-2.5 group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
                            </div>
                            <span className="text-[17px] font-semibold text-gray-900">Mini AI Tutor</span>
                        </Link>

                        {!isMobile && (
                            <button
                                onClick={() => setCollapsed(true)}
                                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors group"
                                aria-label="Collapse sidebar"
                            >
                                <svg
                                    className="w-4 h-4 text-gray-400 group-hover:text-gray-600"
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
                        className="w-full flex items-center justify-center p-2 hover:bg-gray-100 rounded-lg transition-colors group relative"
                        aria-label="Expand sidebar"
                        title="Expand sidebar"
                    >
                        <svg
                            className="w-5 h-5 text-gray-600 group-hover:text-gray-900"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>

                        {/* Tooltip */}
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                            Open Sidebar
                        </div>
                    </button>
                )}

                {isMobile && (
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="absolute top-6 right-5 p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                        aria-label="Close menu"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                )}
            </div>

            {/* Search Bar */}
            {(!collapsed || isMobile) && (
                <div className="px-5 pb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={2} />
                        <input
                            id="sidebar-search"
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-12 py-2 text-[13px] bg-gray-50 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all placeholder:text-gray-400"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-gray-400">
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
                                        ? 'bg-gray-100 text-gray-900'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }
                                `}
                                title={collapsed && !isMobile ? item.label : ''}
                                aria-label={item.label}
                            >
                                <Icon
                                    className={`flex-shrink-0 ${collapsed && !isMobile ? 'w-5 h-5' : 'w-[18px] h-[18px]'
                                        } ${isActive ? 'text-gray-700' : 'text-gray-400 group-hover:text-gray-600'
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
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                        {item.label}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Bottom Section */}
            <div className={`border-t border-gray-100 py-3 space-y-0.5 ${collapsed && !isMobile ? 'px-2' : 'px-3'}`}>
                {/* Help Center */}
                {(!collapsed || isMobile) ? (
                    <button className="w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-150 group">
                        <HelpCircle className="w-[18px] h-[18px] text-gray-400 group-hover:text-gray-600" strokeWidth={2} />
                        <span className="text-[14px] font-medium">Help center</span>
                    </button>
                ) : (
                    <button
                        className="w-full flex items-center justify-center px-2 py-2 rounded-md text-gray-600 hover:bg-gray-50 transition-all group relative"
                        title="Help center"
                    >
                        <HelpCircle className="w-5 h-5 text-gray-400 group-hover:text-gray-600" strokeWidth={2} />
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                            Help center
                        </div>
                    </button>
                )}

                {/* Notifications */}
                {(!collapsed || isMobile) ? (
                    <button className="w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-150 group relative">
                        <Bell className="w-[18px] h-[18px] text-gray-400 group-hover:text-gray-600" strokeWidth={2} />
                        <span className="text-[14px] font-medium flex-1 text-left">Notifications</span>
                        <span className="w-5 h-5 bg-red-500 text-white text-[11px] font-semibold rounded-full flex items-center justify-center">
                            3
                        </span>
                    </button>
                ) : (
                    <button
                        className="w-full flex items-center justify-center px-2 py-2 rounded-md text-gray-600 hover:bg-gray-50 transition-all group relative"
                        title="Notifications"
                    >
                        <div className="relative">
                            <Bell className="w-5 h-5 text-gray-400 group-hover:text-gray-600" strokeWidth={2} />
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </div>
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                            Notifications (3)
                        </div>
                    </button>
                )}

                {/* User Profile */}
                {(!collapsed || isMobile) ? (
                    <Link
                        to="/profile"
                        className="w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-150 group"
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
                        className="w-full flex items-center justify-center px-2 py-2 rounded-md text-gray-600 hover:bg-gray-50 transition-all group relative"
                        title={user?.name || 'Profile'}
                    >
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-semibold">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                            {user?.name || 'Profile'}
                        </div>
                    </Link>
                )}

                {/* Logout */}
                {(!collapsed || isMobile) ? (
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-150 group"
                        aria-label="Logout"
                    >
                        <LogOut className="w-[18px] h-[18px] text-gray-400 group-hover:text-red-500" strokeWidth={2} />
                        <span className="text-[14px] font-medium">Logout</span>
                    </button>
                ) : (
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center px-2 py-2 rounded-md text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all group relative"
                        title="Logout"
                        aria-label="Logout"
                    >
                        <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-500" strokeWidth={2} />
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                            Logout
                        </div>
                    </button>
                )}
            </div>

            {/* Premium CTA Card */}
            {(!collapsed || isMobile) && (
                <div className="px-3 pb-4">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100/80 rounded-xl p-4 border border-gray-200/60">
                        <div className="space-y-3">
                            <div>
                                <h4 className="text-[13px] font-semibold text-gray-900 mb-1">
                                    Learning Progress
                                </h4>
                                <p className="text-[11px] text-gray-500 leading-relaxed">
                                    Track your learning journey
                                </p>
                            </div>

                            {/* Progress Stats */}
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full w-[60%] bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"></div>
                                </div>
                                <span className="text-[11px] font-semibold text-gray-600">60%</span>
                            </div>

                            {/* CTA Button */}
                            <button className="w-full bg-gray-900 hover:bg-gray-800 text-white text-[13px] font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2">
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
                className="fixed top-5 left-5 z-50 lg:hidden bg-white p-2.5 rounded-lg shadow-md border border-gray-200/60 hover:shadow-lg transition-all active:scale-95"
                aria-label="Open menu"
                aria-expanded={mobileOpen}
            >
                <Menu className="w-5 h-5 text-gray-700" strokeWidth={2} />
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
                    fixed left-0 top-0 h-full bg-white z-50 
                    shadow-xl border-r border-gray-100
                    transition-transform duration-300 ease-out lg:hidden
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
                    w-64
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
                    className={`fixed left-0 top-0 h-full bg-white border-r border-gray-100 flex flex-col transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-64'
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