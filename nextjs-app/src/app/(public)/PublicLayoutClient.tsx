'use client';

/**
 * Public Layout Client Component
 * Enhanced navigation with dropdowns and search
 */

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  LogIn,
  Menu,
  X,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Grid,
  Award,
  Gift,
  Briefcase,
  Users,
  Building2,
} from 'lucide-react';
import { useState } from 'react';
import NewsletterSignup from '@/components/NewsletterSignup';
import { NavDropdown, UserMenu, SearchBar, NavDropdownItem } from '@/components/navigation';

interface PublicLayoutClientProps {
  children: React.ReactNode;
}

export default function PublicLayoutClient({ children }: PublicLayoutClientProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Explore dropdown items
  const exploreItems: NavDropdownItem[] = [
    {
      label: 'Browse All Courses',
      href: '/browse',
      description: 'Explore our full course catalog',
      icon: Grid,
    },
    {
      label: 'Categories',
      href: '/categories',
      description: 'Find courses by subject',
      icon: BookOpen,
    },
    {
      label: 'Featured Courses',
      href: '/browse?featured=true',
      description: 'Top-rated and popular courses',
      icon: Sparkles,
    },
    {
      label: 'New Releases',
      href: '/browse?sort=newest',
      description: 'Latest course additions',
      icon: TrendingUp,
    },
    {
      label: 'Free Courses',
      href: '/browse?price=free',
      description: 'Start learning at no cost',
      icon: Gift,
    },
  ];

  // Business dropdown items
  const businessItems: NavDropdownItem[] = [
    {
      label: 'Enterprise Solutions',
      href: '/business/enterprise',
      description: 'Custom training for large teams',
      icon: Building2,
    },
    {
      label: 'Team Plans',
      href: '/business/teams',
      description: 'Learning plans for small teams',
      icon: Users,
    },
    {
      label: 'Request Demo',
      href: '/business/demo',
      description: 'See how it works for your organization',
      icon: Briefcase,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block">AI Tutor</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1 flex-1 px-8">
              <NavDropdown label="Explore" items={exploreItems} />

              <Link
                href="/teach"
                className="px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors font-medium rounded-lg hover:bg-gray-50"
              >
                Teach
              </Link>

              <NavDropdown label="For Business" items={businessItems} />
            </nav>

            {/* Search Bar - Desktop */}
            <div className="hidden md:block flex-1 max-w-md mx-4">
              <SearchBar placeholder="Search courses..." />
            </div>

            {/* Desktop Auth/User Menu */}
            <div className="hidden md:flex items-center space-x-2">
              {loading ? (
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : user ? (
                <UserMenu />
              ) : (
                <>
                  <Link
                    href="/login"
                    className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors font-medium rounded-lg hover:bg-gray-50"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Log In</span>
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Mobile Menu Content */}
            <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white z-50 md:hidden shadow-2xl overflow-y-auto">
              <div className="p-4">
                {/* Close button */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-lg font-bold text-gray-900">Menu</span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100"
                  >
                    <X className="w-6 h-6 text-gray-700" />
                  </button>
                </div>

                {/* Search - Mobile */}
                <div className="mb-6">
                  <SearchBar variant="mobile" placeholder="Search courses..." />
                </div>

                {/* User Info - Mobile */}
                {user && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{user.name}</div>
                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Links */}
                <div className="space-y-1">
                  {/* Explore Section */}
                  <div className="mb-4">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Explore
                    </div>
                    {exploreItems.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={index}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center space-x-3 px-3 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          {Icon && <Icon className="w-5 h-5 text-blue-600" />}
                          <div>
                            <div className="text-sm font-medium">{item.label}</div>
                            {item.description && (
                              <div className="text-xs text-gray-500">{item.description}</div>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Teach */}
                  <Link
                    href="/teach"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="text-sm font-medium">Become an Instructor</div>
                      <div className="text-xs text-gray-500">Teach on AI Tutor</div>
                    </div>
                  </Link>

                  {/* For Business */}
                  <div className="mt-4 mb-4">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      For Business
                    </div>
                    {businessItems.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={index}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center space-x-3 px-3 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          {Icon && <Icon className="w-5 h-5 text-blue-600" />}
                          <div>
                            <div className="text-sm font-medium">{item.label}</div>
                            {item.description && (
                              <div className="text-xs text-gray-500">{item.description}</div>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Auth Buttons - Mobile */}
                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    {user ? (
                      <>
                        <Link
                          href="/dashboard"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block w-full text-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          Go to Dashboard
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block w-full text-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                          Log In
                        </Link>
                        <Link
                          href="/register"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block w-full text-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          Sign Up
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Newsletter Section */}
          <div className="mb-12">
            <NewsletterSignup variant="footer" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">AI Tutor</span>
              </div>
              <p className="text-gray-400 text-sm">
                Empowering learners worldwide with AI-powered personalized education.
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/browse" className="text-gray-400 hover:text-white text-sm">
                    Browse Courses
                  </Link>
                </li>
                <li>
                  <Link href="/categories" className="text-gray-400 hover:text-white text-sm">
                    Categories
                  </Link>
                </li>
                <li>
                  <Link href="/teach" className="text-gray-400 hover:text-white text-sm">
                    Become an Instructor
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-gray-400 hover:text-white text-sm">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-400 hover:text-white text-sm">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-gray-400 hover:text-white text-sm">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy" className="text-gray-400 hover:text-white text-sm">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-gray-400 hover:text-white text-sm">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="text-gray-400 hover:text-white text-sm">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} AI Tutor. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
