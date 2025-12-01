'use client';

/**
 * Admin Layout
 * Protected layout for admin-only pages
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileCheck,
  BarChart3,
  Shield,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import Link from 'next/link';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Redirect if not admin
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Only render if user is admin
  if (!user || user.role !== 'admin') {
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Instructors', href: '/admin/instructors', icon: GraduationCap },
    { name: 'Courses', href: '/admin/courses', icon: FileCheck },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Audit Logs', href: '/admin/logs', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50"
        >
          {sidebarOpen ? (
            <X className="w-6 h-6 text-gray-700" />
          ) : (
            <Menu className="w-6 h-6 text-gray-700" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-gray-900 to-gray-800 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-700">
            <Shield className="w-8 h-8 text-red-500 mr-2" />
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors group"
              >
                <item.icon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-white" />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:pl-64' : ''}`}>
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-red-500" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Platform Administration</h2>
                <p className="text-sm text-gray-500">Manage your AI Tutor platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1 bg-red-50 border border-red-200 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-red-700">ADMIN MODE</span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
