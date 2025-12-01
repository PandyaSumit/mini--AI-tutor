/**
 * Login Page
 * User authentication page
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks';
import { enrollmentService } from '@/services';
import {
  Sparkles,
  Brain,
  Target,
  Zap,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  Shield,
  Users,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import type { Metadata } from 'next';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Learning',
    description: 'Adaptive study paths that evolve with you',
    stat: '10x faster',
  },
  {
    icon: Target,
    title: 'Smart Roadmaps',
    description: 'Structured plans with milestone tracking',
    stat: '95% completion',
  },
  {
    icon: Zap,
    title: 'Intelligent Flashcards',
    description: 'Scientifically-proven spaced repetition',
    stat: '2x retention',
  },
];

const stats = [
  { icon: Users, label: '50K+ Learners', value: '50,000+' },
  { icon: TrendingUp, label: 'Success Rate', value: '95%' },
  { icon: Shield, label: 'Secure & Private', value: 'Bank-level' },
];

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Handle redirect after authentication
  useEffect(() => {
    if (user) {
      handlePostLoginRedirect();
    }
  }, [user, router]);

  const handlePostLoginRedirect = async () => {
    try {
      // Check for enrollment intention
      const enrollCourseId = sessionStorage.getItem('enrollAfterLogin');

      if (enrollCourseId) {
        // Clear the stored intention
        sessionStorage.removeItem('enrollAfterLogin');

        // Enroll in the course
        await enrollmentService.enrollInCourse(enrollCourseId);

        // Redirect to the course
        router.push(`/dashboard/courses/${enrollCourseId}`);
        return;
      }

      // Check for redirect URL in query params
      const redirect = searchParams.get('redirect');
      if (redirect) {
        router.push(redirect);
        return;
      }

      // Default redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Post-login redirect error:', error);
      // Fallback to dashboard on error
      router.push('/dashboard');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      // Navigation handled by AuthProvider
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Brand Experience */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[45%] relative overflow-hidden ">
        {/* Background - Subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />

        {/* Decorative elements - Very subtle */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500 rounded-full blur-3xl" />
        </div>

        {/* Content Container */}
        <div className="relative w-full flex flex-col p-12 xl:p-16 2xl:p-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-16 group w-fit">
            <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
              <Sparkles className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold text-gray-900">Mini AI Tutor</span>
          </Link>

          {/* Main Content */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            {/* Headline */}
            <div className="mb-12">
              <h1 className="text-4xl xl:text-5xl font-bold text-gray-900 leading-tight mb-4">
                Welcome back to
                <span className="block mt-1">your learning hub</span>
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                Continue your journey with AI-powered education designed for modern learners.
              </p>
            </div>

            {/* Features - Clean cards */}
            <div className="space-y-3 mb-12">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="group p-5 rounded-xl border border-gray-100 bg-white/50 hover:bg-white hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-900 transition-colors">
                        <Icon
                          className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors"
                          strokeWidth={2}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-1">
                          <h3 className="font-semibold text-gray-900 text-[15px]">{feature.title}</h3>
                          <span className="text-xs font-semibold text-gray-400 whitespace-nowrap">
                            {feature.stat}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stats Bar */}
            <div className="flex items-center gap-6 pt-6 border-t border-gray-100">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-gray-400" strokeWidth={2} />
                    <div className="text-xs">
                      <div className="font-semibold text-gray-900">{stat.value}</div>
                      <div className="text-gray-500">{stat.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Links */}
          <div className="flex items-center gap-6 text-xs text-gray-500">
            <Link href="#" className="hover:text-gray-900 transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-gray-900 transition-colors">
              Terms
            </Link>
            <Link href="#" className="hover:text-gray-900 transition-colors">
              Help
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-10">
            <Link href="/" className="inline-flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center shadow-sm">
                <Sparkles className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold text-gray-900">Mini AI Tutor</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-2">Welcome back</h1>
            <p className="text-gray-600">Sign in to continue your learning journey</p>
          </div>

          {/* Form Container */}
          <div className="space-y-6">
            {/* Header - Desktop Only */}
            <div className="hidden lg:block">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to your account</h2>
              <p className="text-gray-600">Enter your credentials to continue</p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-red-900">{error}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-900">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail
                      className={`h-[18px] w-[18px] transition-colors ${
                        focusedField === 'email' ? 'text-gray-900' : 'text-gray-400'
                      }`}
                      strokeWidth={2}
                    />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-11 pr-4 py-3 text-[15px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400 bg-white"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-900">
                    Password
                  </label>
                  <Link
                    href="#"
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock
                      className={`h-[18px] w-[18px] transition-colors ${
                        focusedField === 'password' ? 'text-gray-900' : 'text-gray-400'
                      }`}
                      strokeWidth={2}
                    />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-11 pr-12 py-3 text-[15px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400 bg-white"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-900 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-[18px] w-[18px]" strokeWidth={2} />
                    ) : (
                      <Eye className="h-[18px] w-[18px]" strokeWidth={2} />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-[0.99] mt-6"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="w-4 h-4" strokeWidth={2} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-gray-500">New to Mini AI Tutor?</span>
              </div>
            </div>

            {/* Sign Up Link */}
            <Link
              href="/register"
              className="w-full border-2 border-gray-200 hover:border-gray-900 hover:bg-gray-50 text-gray-900 font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              <span>Create an account</span>
              <ArrowRight
                className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                strokeWidth={2}
              />
            </Link>

            {/* Security Note */}
            <div className="pt-4">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <Shield className="w-3.5 h-3.5" strokeWidth={2} />
                <span>Secured with 256-bit encryption</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
