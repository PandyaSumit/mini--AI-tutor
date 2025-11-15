import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { MessageSquare, LayoutDashboard, BookOpen, User, LogOut, Brain, Map } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const location = useLocation();

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/chat', label: 'Chat', icon: MessageSquare },
    { to: '/flashcards', label: 'Flashcards', icon: Brain },
    { to: '/roadmaps/create', label: 'Roadmaps', icon: Map },
    { to: '/conversations', label: 'History', icon: BookOpen },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center">
            <span className={`text-2xl font-bold ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>
              Mini AI Tutor
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to ||
                (link.to === '/chat' && location.pathname.startsWith('/chat')) ||
                (link.to === '/flashcards' && location.pathname.startsWith('/flashcards')) ||
                (link.to === '/roadmaps/create' && location.pathname.startsWith('/roadmaps'));

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? isDark
                        ? 'bg-primary-600 text-white font-medium'
                        : 'bg-primary-100 text-primary-600 font-medium'
                      : isDark
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden md:inline">{link.label}</span>
                </Link>
              );
            })}

            <ThemeToggle />

            <button
              onClick={handleLogout}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                isDark
                  ? 'text-red-400 hover:bg-red-900/20'
                  : 'text-red-600 hover:bg-red-50'
              }`}
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
