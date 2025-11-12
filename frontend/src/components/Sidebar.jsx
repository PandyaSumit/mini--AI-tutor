import { useState } from 'react';
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
    Bell,
    Search,
    Mail
} from 'lucide-react';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);

    const handleLogout = async () => {
        if (window.confirm('Are you sure you want to logout?')) {
            await logout();
            navigate('/login');
        }
    };

    const topNavItems = [
        {
            to: '/search',
            label: 'Quick search',
            icon: Search,
            match: (path) => path === '/search',
            type: 'action'
        },
        {
            to: '/inbox',
            label: 'Inbox',
            icon: Mail,
            match: (path) => path === '/inbox',
            badge: '12',
            type: 'action'
        },
        {
            to: '/notifications',
            label: 'Notifications',
            icon: Bell,
            match: (path) => path === '/notifications',
            badge: '15+',
            type: 'action'
        }
    ];

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
            to: '/roadmaps/create',
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

    return (
        <>
            {/* Sidebar */}
            <div
                className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-50 flex flex-col ${collapsed ? 'w-20' : 'w-72'
                    }`}
            >
                {/* Header */}
                <div className="h-16 px-4 border-b border-gray-200 flex items-center justify-between">
                    {!collapsed ? (
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
                    {!collapsed && (
                        <button
                            onClick={() => setCollapsed(true)}
                            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-500" />
                        </button>
                    )}
                </div>

                {/* Top Action Items */}
                <div className="border-b border-gray-200 py-2">
                    <div className={`space-y-1 ${collapsed ? 'px-2' : 'px-4'}`}>
                        {topNavItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = item.match(location.pathname);

                            return (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${isActive
                                        ? 'bg-gray-100 text-gray-900'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        } ${collapsed ? 'justify-center' : ''}`}
                                    title={collapsed ? item.label : ''}
                                >
                                    <Icon className="w-5 h-5 flex-shrink-0" />
                                    {!collapsed && (
                                        <>
                                            <span className="font-medium text-sm flex-1">{item.label}</span>
                                            {item.badge && (
                                                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-200 text-gray-700">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </>
                                    )}
                                    {collapsed && item.badge && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 text-xs font-bold rounded-full bg-red-500 text-white flex items-center justify-center">
                                            {item.badge.replace('+', '')}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Main Navigation */}
                <div className="flex-1 overflow-y-auto">
                    {!collapsed && (
                        <div className="px-4 py-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Menu</h3>
                        </div>
                    )}
                    <nav className="pb-4">
                        <div className={`space-y-1 ${collapsed ? 'px-2' : 'px-4'}`}>
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = item.match(location.pathname);

                                return (
                                    <Link
                                        key={item.to}
                                        to={item.to}
                                        className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all group ${isActive
                                            ? 'bg-gray-900 text-white shadow-md'
                                            : 'text-gray-700 hover:bg-gray-50'
                                            } ${collapsed ? 'justify-center' : ''}`}
                                        title={collapsed ? item.label : ''}
                                    >
                                        <Icon
                                            className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500'
                                                }`}
                                        />
                                        {!collapsed && (
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
                    <div className={`space-y-1 ${collapsed ? '' : ''}`}>
                        {bottomNavItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = item.match(location.pathname);

                            return (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${isActive
                                        ? 'bg-gray-100 text-gray-900'
                                        : 'text-gray-700 hover:bg-gray-50'
                                        } ${collapsed ? 'justify-center' : ''}`}
                                    title={collapsed ? item.label : ''}
                                >
                                    <Icon className="w-5 h-5 flex-shrink-0 text-gray-500" />
                                    {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
                                </Link>
                            );
                        })}

                        <button
                            onClick={handleLogout}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all group ${collapsed ? 'justify-center' : ''
                                }`}
                            title={collapsed ? 'Logout' : ''}
                        >
                            <LogOut className="w-5 h-5 flex-shrink-0" />
                            {!collapsed && <span className="font-medium text-sm">Logout</span>}
                        </button>
                    </div>
                </div>

                {/* Expand Button (when collapsed) */}
                {collapsed && (
                    <button
                        onClick={() => setCollapsed(false)}
                        className="absolute bottom-4 -right-3 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-md"
                    >
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                )}
            </div>

            {/* Spacer to push content */}
            <div className={`${collapsed ? 'w-20' : 'w-72'} flex-shrink-0 transition-all duration-300`} />
        </>
    );
};

export default Sidebar;