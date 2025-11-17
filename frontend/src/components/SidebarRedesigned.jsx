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
    Menu,
    X,
    Search,
    HelpCircle,
    Bell,
    Command,
    Mic,
    Zap,
    Target,
    TrendingUp,
    Star,
    ChevronDown,
    ChevronRight,
    Plus,
    Clock,
    Award
} from 'lucide-react';

/**
 * Redesigned Sidebar Navigation
 *
 * Design Principles Applied:
 * 1. Mobile-First: Touch-optimized, thumb-friendly zones
 * 2. Information Architecture: Grouped by user journey & frequency
 * 3. Gestalt Principles: Visual grouping, proximity, similarity
 * 4. WCAG 2.1 AAA: High contrast, keyboard nav, screen reader optimized
 * 5. Progressive Disclosure: Collapsible sections, contextual actions
 * 6. Minimalism: Essential features only, clear hierarchy
 */

const SidebarRedesigned = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // State management
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedSections, setExpandedSections] = useState({
        learn: true,
        practice: true
    });

    // Quick stats (fetch from API)
    const [userStats, setUserStats] = useState({
        streak: 12,
        coursesActive: 3,
        xp: 2450,
        level: 8,
        notifications: 3
    });

    // Close mobile menu on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    // Escape key handler
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && mobileOpen) {
                setMobileOpen(false);
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [mobileOpen]);

    // Cmd/Ctrl+K for search
    useEffect(() => {
        const handleKeyPress = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('sidebar-search-redesigned')?.focus();
            }
        };
        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, []);

    // Prevent body scroll when mobile menu open
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [mobileOpen]);

    const handleLogout = async () => {
        if (window.confirm('Are you sure you want to logout?')) {
            await logout();
            navigate('/login');
        }
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    /**
     * IMPROVED INFORMATION ARCHITECTURE
     * Grouped by user journey and task frequency
     */
    const navigationSections = [
        {
            id: 'quick',
            label: null, // No header - primary actions
            items: [
                {
                    to: '/dashboard',
                    label: 'Home',
                    icon: LayoutDashboard,
                    description: 'Overview & progress',
                    match: (path) => path === '/dashboard',
                    priority: 'primary'
                }
            ]
        },
        {
            id: 'learn',
            label: 'Learning',
            collapsible: true,
            expanded: expandedSections.learn,
            items: [
                {
                    to: '/chat',
                    label: 'AI Tutor',
                    icon: Sparkles,
                    description: 'Ask questions, get answers',
                    match: (path) => path.startsWith('/chat'),
                    priority: 'high',
                    badge: 'AI'
                },
                {
                    to: '/voice-tutor',
                    label: 'Voice Learn',
                    icon: Mic,
                    description: 'Hands-free learning',
                    match: (path) => path === '/voice-tutor',
                    priority: 'high',
                    badge: 'NEW'
                },
                {
                    to: '/roadmaps',
                    label: 'Roadmaps',
                    icon: Map,
                    description: 'Learning paths',
                    match: (path) => path.startsWith('/roadmaps'),
                    priority: 'medium'
                }
            ]
        },
        {
            id: 'practice',
            label: 'Practice',
            collapsible: true,
            expanded: expandedSections.practice,
            items: [
                {
                    to: '/flashcards',
                    label: 'Flashcards',
                    icon: Brain,
                    description: 'Review & memorize',
                    match: (path) => path.startsWith('/flashcards'),
                    priority: 'medium'
                },
                {
                    to: '/quizzes',
                    label: 'Quizzes',
                    icon: Target,
                    description: 'Test your knowledge',
                    match: (path) => path.startsWith('/quizzes'),
                    priority: 'medium'
                }
            ]
        },
        {
            id: 'track',
            label: 'Progress',
            items: [
                {
                    to: '/conversations',
                    label: 'History',
                    icon: Clock,
                    description: 'Past conversations',
                    match: (path) => path === '/conversations',
                    priority: 'low'
                },
                {
                    to: '/achievements',
                    label: 'Achievements',
                    icon: Award,
                    description: 'Badges & milestones',
                    match: (path) => path === '/achievements',
                    priority: 'low'
                }
            ]
        }
    ];

    const SidebarContent = ({ isMobile = false }) => (
        <div className="flex flex-col h-full bg-white">
            {/* Header - Improved branding & actions */}
            <div className={`${collapsed && !isMobile ? 'px-3 pt-5 pb-4' : 'px-4 pt-5 pb-4'} border-b border-gray-100`}>
                {(!collapsed || isMobile) ? (
                    <div className="space-y-3">
                        {/* Logo & Brand */}
                        <div className="flex items-center justify-between">
                            <Link
                                to="/dashboard"
                                className="flex items-center gap-2.5 group"
                            >
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-sm">
                                    <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[15px] font-bold text-gray-900 leading-none">Mini AI Tutor</span>
                                    <span className="text-[10px] text-gray-500 leading-none mt-0.5">Learn smarter</span>
                                </div>
                            </Link>

                            {!isMobile && (
                                <button
                                    onClick={() => setCollapsed(true)}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                    aria-label="Collapse sidebar"
                                >
                                    <ChevronRight className="w-4 h-4 text-gray-400" strokeWidth={2} />
                                </button>
                            )}
                        </div>

                        {/* User Profile Chip - Moved to top for easier access */}
                        <Link
                            to="/profile"
                            className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-all group"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-gray-900 truncate">
                                    {user?.name || 'User'}
                                </p>
                                <p className="text-[11px] text-gray-500 truncate">
                                    Level {userStats.level} • {userStats.xp} XP
                                </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" strokeWidth={2} />
                        </Link>

                        {/* Streak & Quick Stats */}
                        <div className="grid grid-cols-3 gap-2 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-2.5 border border-amber-100">
                            <div className="text-center">
                                <div className="text-[18px] font-bold text-amber-600">{userStats.streak}</div>
                                <div className="text-[9px] text-amber-700 uppercase font-semibold">Day Streak</div>
                            </div>
                            <div className="text-center border-x border-amber-200">
                                <div className="text-[18px] font-bold text-indigo-600">{userStats.coursesActive}</div>
                                <div className="text-[9px] text-indigo-700 uppercase font-semibold">Active</div>
                            </div>
                            <div className="text-center">
                                <div className="text-[18px] font-bold text-purple-600">{userStats.xp}</div>
                                <div className="text-[9px] text-purple-700 uppercase font-semibold">Total XP</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setCollapsed(false)}
                        className="w-full flex items-center justify-center p-2 hover:bg-gray-100 rounded-lg transition-colors group relative"
                        aria-label="Expand sidebar"
                        title="Expand sidebar"
                    >
                        <Menu className="w-5 h-5 text-gray-600" strokeWidth={2} />

                        {/* Tooltip */}
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                            Expand
                        </div>
                    </button>
                )}

                {isMobile && (
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="absolute top-5 right-4 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Close menu"
                    >
                        <X className="w-5 h-5 text-gray-500" strokeWidth={2} />
                    </button>
                )}
            </div>

            {/* Search - More prominent with better UX */}
            {(!collapsed || isMobile) && (
                <div className="px-4 pt-4 pb-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={2} />
                        <input
                            id="sidebar-search-redesigned"
                            type="text"
                            placeholder="Quick search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-16 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all placeholder:text-gray-400"
                        />
                        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-gray-200 text-gray-600 text-[10px] font-semibold rounded border border-gray-300 flex items-center gap-0.5">
                            <Command className="w-2.5 h-2.5" strokeWidth={2.5} />K
                        </kbd>
                    </div>
                </div>
            )}

            {/* Main Navigation - Improved grouping & hierarchy */}
            <nav className={`flex-1 overflow-y-auto ${collapsed && !isMobile ? 'px-2 pt-4' : 'px-4 pt-2'}`}>
                <div className="space-y-6">
                    {navigationSections.map((section) => (
                        <div key={section.id} className="space-y-1">
                            {/* Section Header */}
                            {section.label && (!collapsed || isMobile) && (
                                <div className="flex items-center justify-between px-2 pt-2 pb-1.5">
                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                        {section.label}
                                    </h3>
                                    {section.collapsible && (
                                        <button
                                            onClick={() => toggleSection(section.id)}
                                            className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                                            aria-label={`Toggle ${section.label}`}
                                        >
                                            {section.expanded ? (
                                                <ChevronDown className="w-3.5 h-3.5 text-gray-400" strokeWidth={2} />
                                            ) : (
                                                <ChevronRight className="w-3.5 h-3.5 text-gray-400" strokeWidth={2} />
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Navigation Items */}
                            {(!section.collapsible || section.expanded || collapsed) && (
                                <div className="space-y-0.5">
                                    {section.items.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = item.match(location.pathname);

                                        return (
                                            <Link
                                                key={item.to}
                                                to={item.to}
                                                className={`
                                                    flex items-center gap-3 rounded-lg
                                                    transition-all duration-200 group relative
                                                    ${collapsed && !isMobile
                                                        ? 'px-3 py-3 justify-center'
                                                        : 'px-3 py-2.5'
                                                    }
                                                    ${isActive
                                                        ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                                        : 'text-gray-700 hover:bg-gray-50'
                                                    }
                                                    ${item.priority === 'primary' ? 'font-semibold' : ''}
                                                `}
                                                title={collapsed && !isMobile ? item.label : ''}
                                                aria-label={item.label}
                                                aria-current={isActive ? 'page' : undefined}
                                            >
                                                <Icon
                                                    className={`flex-shrink-0 ${
                                                        collapsed && !isMobile ? 'w-5 h-5' : 'w-[18px] h-[18px]'
                                                    } ${
                                                        isActive ? 'text-indigo-600' : 'text-gray-500'
                                                    }`}
                                                    strokeWidth={isActive ? 2.5 : 2}
                                                />

                                                {(!collapsed || isMobile) && (
                                                    <>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-[14px] font-medium truncate">
                                                                {item.label}
                                                            </div>
                                                            {item.description && !isActive && (
                                                                <div className="text-[11px] text-gray-500 truncate">
                                                                    {item.description}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {item.badge && (
                                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                                                item.badge === 'NEW'
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : 'bg-indigo-100 text-indigo-700'
                                                            }`}>
                                                                {item.badge}
                                                            </span>
                                                        )}
                                                    </>
                                                )}

                                                {/* Tooltip for collapsed state */}
                                                {collapsed && !isMobile && (
                                                    <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                                                        <div className="font-medium">{item.label}</div>
                                                        {item.description && (
                                                            <div className="text-[10px] text-gray-300 mt-0.5">{item.description}</div>
                                                        )}
                                                    </div>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </nav>

            {/* Bottom Section - Cleaner utilities */}
            <div className={`border-t border-gray-100 py-3 space-y-1 ${collapsed && !isMobile ? 'px-2' : 'px-4'}`}>
                {/* Notifications with better badge */}
                {(!collapsed || isMobile) ? (
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 transition-all group">
                        <div className="relative">
                            <Bell className="w-[18px] h-[18px] text-gray-500" strokeWidth={2} />
                            {userStats.notifications > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                                    {userStats.notifications}
                                </span>
                            )}
                        </div>
                        <span className="text-[14px] font-medium flex-1 text-left">Notifications</span>
                    </button>
                ) : (
                    <button
                        className="w-full flex items-center justify-center px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-all group relative"
                        title="Notifications"
                    >
                        <div className="relative">
                            <Bell className="w-5 h-5 text-gray-500" strokeWidth={2} />
                            {userStats.notifications > 0 && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                            )}
                        </div>
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                            {userStats.notifications} new
                        </div>
                    </button>
                )}

                {/* Help Center */}
                {(!collapsed || isMobile) ? (
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 transition-all group">
                        <HelpCircle className="w-[18px] h-[18px] text-gray-500" strokeWidth={2} />
                        <span className="text-[14px] font-medium">Help & Support</span>
                    </button>
                ) : (
                    <button
                        className="w-full flex items-center justify-center px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-all group relative"
                        title="Help & Support"
                    >
                        <HelpCircle className="w-5 h-5 text-gray-500" strokeWidth={2} />
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                            Help
                        </div>
                    </button>
                )}

                {/* Logout */}
                {(!collapsed || isMobile) ? (
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all group"
                        aria-label="Logout"
                    >
                        <LogOut className="w-[18px] h-[18px] text-gray-500 group-hover:text-red-500" strokeWidth={2} />
                        <span className="text-[14px] font-medium">Sign out</span>
                    </button>
                ) : (
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center px-3 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all group relative"
                        title="Sign out"
                        aria-label="Logout"
                    >
                        <LogOut className="w-5 h-5 text-gray-500 group-hover:text-red-500" strokeWidth={2} />
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                            Sign out
                        </div>
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Hamburger - Better positioning for thumb */}
            <button
                onClick={() => setMobileOpen(true)}
                className="fixed bottom-6 right-6 z-50 lg:hidden bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 hover:bg-indigo-700"
                aria-label="Open menu"
                aria-expanded={mobileOpen}
            >
                <Menu className="w-6 h-6" strokeWidth={2} />
            </button>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-200"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Mobile Sidebar */}
            <div
                className={`
                    fixed left-0 top-0 h-full bg-white z-50
                    shadow-2xl
                    transition-transform duration-300 ease-out lg:hidden
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
                    w-80
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
                    className={`fixed left-0 top-0 h-full bg-white border-r border-gray-100 flex flex-col transition-all duration-300 shadow-sm ${
                        collapsed ? 'w-[72px]' : 'w-72'
                    }`}
                >
                    <SidebarContent />
                </div>

                {/* Spacer */}
                <div className={`flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-72'}`} />
            </div>
        </>
    );
};

export default SidebarRedesigned;
