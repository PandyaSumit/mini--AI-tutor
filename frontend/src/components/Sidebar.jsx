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
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {(!collapsed || isMobile) && (
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Mini AI Tutor</span>
          </Link>
        )}
        {collapsed && !isMobile && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-5 h-5 text-white" />
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
      </div>

      {/* User Info */}
      {(!collapsed || isMobile) && user && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-sm">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.match(location.pathname);

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all group ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                } ${collapsed && !isMobile ? 'justify-center' : ''}`}
                title={collapsed && !isMobile ? item.label : ''}
                aria-label={item.label}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${
                    isActive ? 'text-primary-600' : 'text-gray-500 group-hover:text-gray-700'
                  }`}
                />
                {(!collapsed || isMobile) && (
                  <span className={`font-medium ${isActive ? 'text-primary-700' : ''}`}>
                    {item.label}
                  </span>
                )}
                {(!collapsed || isMobile) && isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-600" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-gray-200 p-3 space-y-1">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.match(location.pathname);

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all group ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              } ${collapsed && !isMobile ? 'justify-center' : ''}`}
              title={collapsed && !isMobile ? item.label : ''}
              aria-label={item.label}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 ${
                  isActive ? 'text-primary-600' : 'text-gray-500 group-hover:text-gray-700'
                }`}
              />
              {(!collapsed || isMobile) && (
                <span className={`font-medium ${isActive ? 'text-primary-700' : ''}`}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}

        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all group ${
            collapsed && !isMobile ? 'justify-center' : ''
          }`}
          title={collapsed && !isMobile ? 'Logout' : ''}
          aria-label="Logout"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {(!collapsed || isMobile) && <span className="font-medium">Logout</span>}
        </button>
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
        } w-64`}
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
            collapsed ? 'w-20' : 'w-64'
          }`}
        >
          <SidebarContent />

          {/* Toggle Button - Desktop Only */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>

        {/* Spacer */}
        <div className={`${collapsed ? 'w-20' : 'w-64'} flex-shrink-0 transition-all duration-300`} />
      </div>

      {/* Mobile Spacer (for hamburger button) */}
      <div className="lg:hidden h-0" />
    </>
  );
};

export default Sidebar;
