'use client';

/**
 * Public Layout Client Component
 * Client-side interactivity for public pages
 */

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Search,
  User,
  LogIn,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import NewsletterSignup from '@/components/NewsletterSignup';

interface PublicLayoutClientProps {
  children: React.ReactNode;
}

export default function PublicLayoutClient({ children }: PublicLayoutClientProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Browse Courses', href: '/browse' },
    { name: 'Categories', href: '/categories' },
    { name: 'For Instructors', href: '/teach' },
    { name: 'Features', href: '/#features' },
    { name: 'Pricing', href: '/#pricing' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-lg font-bold text-gray-900">Mini AI Tutor</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {loading ? (
                <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
              ) : user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center space-x-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-all font-medium shadow-sm hover:shadow active:scale-[0.98]"
                  >
                    <User className="w-4 h-4" />
                    <span>{user.name}</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-all font-medium shadow-sm hover:shadow active:scale-[0.98]"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" strokeWidth={2} />
              ) : (
                <Menu className="w-6 h-6" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="px-6 py-4 space-y-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 space-y-2">
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
                    >
                      Dashboard
                    </Link>
                    <div className="flex items-center space-x-2 py-2 text-gray-700">
                      <User className="w-4 h-4" />
                      <span>{user.name}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-center px-4 py-2.5 text-gray-600 hover:text-gray-900 transition-colors font-medium border border-gray-200 rounded-lg"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-center px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-all font-medium"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Newsletter Section */}
          <div className="mb-12">
            <NewsletterSignup variant="footer" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-gray-900" strokeWidth={2.5} />
                </div>
                <span className="text-xl font-bold">Mini AI Tutor</span>
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
