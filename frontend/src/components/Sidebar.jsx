import { useState, useEffect } from 'react';
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
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Settings,
    Menu,
    X
} from 'lucide-react';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

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
        },
        {
            to: '/settings',
            label: 'Settings',
            icon: Settings,
            match: (path) => path === '/settings'
        }
    ];

    const bottomNavItems = [
        {
            to: '/profile',
            label: 'Profile',
            icon: User,
            match: (path) => path === '/profile'
        }
    ];

    const SidebarContent = ({ isMobile = false }) => (
        <>
            {/* Header */}
            <div className="h-16 px-4 border-b border-gray-200 flex items-center justify-between">
                {(!collapsed || isMobile) ? (
                    <Link to="/dashboard" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-semibold text-gray-900">Mini AI Tutor</span>
                    </Link>
                ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto shadow-sm">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                )}
                {isMobile && (
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
                        aria-label="Close menu"
                    >
                        <X className="w-6 h-6" />
                    </button>
                )}
                {!collapsed && !isMobile && (
                    <button
                        onClick={() => setCollapsed(true)}
                        className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                        aria-label="Collapse sidebar"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-500" />
                    </button>
                )}
            </div>

            {/* Main Navigation */}
            <div className="flex-1 overflow-y-auto">
                {(!collapsed || isMobile) && (
                    <div className="px-4 py-3">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Menu</h3>
                    </div>
                )}
                <nav className="pb-4">
                    <div className={`space-y-1 ${collapsed && !isMobile ? 'px-2' : 'px-4'}`}>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = item.match(location.pathname);

                            return (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all group ${
                                        isActive
                                            ? 'bg-gray-900 text-white shadow-md'
                                            : 'text-gray-700 hover:bg-gray-50'
                                    } ${collapsed && !isMobile ? 'justify-center' : ''}`}
                                    title={collapsed && !isMobile ? item.label : ''}
                                    aria-label={item.label}
                                >
                                    <Icon
                                        className={`w-5 h-5 flex-shrink-0 ${
                                            isActive ? 'text-white' : 'text-gray-500'
                                        }`}
                                    />
                                    {(!collapsed || isMobile) && (
                                        <span className={`font-medium text-sm ${isActive ? 'text-white' : ''}`}>
                                            {item.label}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            </div>

            {/* Bottom Section */}
            <div className="border-t border-gray-200 p-3">
                <div className="space-y-1">
                    {bottomNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.match(location.pathname);

                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                                    isActive
                                        ? 'bg-gray-100 text-gray-900'
                                        : 'text-gray-700 hover:bg-gray-50'
                                } ${collapsed && !isMobile ? 'justify-center' : ''}`}
                                title={collapsed && !isMobile ? item.label : ''}
                                aria-label={item.label}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0 text-gray-500" />
                                {(!collapsed || isMobile) && <span className="font-medium text-sm">{item.label}</span>}
                            </Link>
                        );
                    })}

                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all group ${
                            collapsed && !isMobile ? 'justify-center' : ''
                        }`}
                        title={collapsed && !isMobile ? 'Logout' : ''}
                        aria-label="Logout"
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        {(!collapsed || isMobile) && <span className="font-medium text-sm">Logout</span>}
                    </button>
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Hamburger Button */}
            <button
                onClick={() => setMobileOpen(true)}
                className="fixed top-4 left-4 z-50 lg:hidden bg-white p-3 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                aria-label="Open menu"
                aria-expanded={mobileOpen}
            >
                <Menu className="w-6 h-6 text-gray-700" />
            </button>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden animate-fade-in"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Mobile Sidebar */}
            <div
                className={`fixed left-0 top-0 h-full bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 lg:hidden ${
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                } w-72`}
                role="dialog"
                aria-label="Navigation menu"
                aria-modal="true"
            >
                <SidebarContent isMobile={true} />
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden lg:block relative">
                <div
                    className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 flex flex-col ${
                        collapsed ? 'w-20' : 'w-72'
                    }`}
                >
                    <SidebarContent />

                    {/* Expand Button (when collapsed) */}
                    {collapsed && (
                        <button
                            onClick={() => setCollapsed(false)}
                            className="absolute bottom-4 -right-3 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-md"
                            aria-label="Expand sidebar"
                        >
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                        </button>
                    )}
                </div>

                {/* Spacer */}
                <div className={`${collapsed ? 'w-20' : 'w-72'} flex-shrink-0 transition-all duration-300`} />
            </div>

            {/* Mobile Spacer (for hamburger button) */}
            <div className="lg:hidden h-0" />
        </>
    );
};

export default Sidebar;
