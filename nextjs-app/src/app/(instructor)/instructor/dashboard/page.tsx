/**
 * Instructor Dashboard
 * Main hub for verified instructors showing stats, courses, earnings, and students
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';
import { useRequireRole } from '@/hooks/useRequireRole';
import { instructorService } from '@/services';
import type { DashboardStats } from '@/services/instructor/instructorService';
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Award,
  Clock,
  Star,
  Loader,
  AlertCircle,
  Plus,
  Eye,
  BarChart3,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function InstructorDashboardPage() {
  useRequireRole({
    requiredRole: ['verified_instructor', 'platform_author', 'admin'],
    requireVerification: true,
  });

  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verify user is verified instructor
    if (user && user.instructorVerification?.status !== 'approved') {
      router.push('/instructor/verification');
      return;
    }

    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await instructorService.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#212121] flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-[#c2c2c2]">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#212121] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-lg p-8 max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-[#f5f5f5] text-center mb-2">
            Failed to Load Dashboard
          </h2>
          <p className="text-slate-600 dark:text-[#c2c2c2] text-center mb-6">{error}</p>
          <button
            onClick={fetchDashboardStats}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const { overview, topCourses } = stats;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#212121] p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-[#f5f5f5] mb-2">
              Welcome back, {user?.name}! 👋
            </h1>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                Verified Instructor
              </span>
            </div>
          </div>
          <Link
            href="/courses/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/30 font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Course</span>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Students */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm p-6 border border-slate-200 dark:border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-[#f5f5f5] mb-1">
            {overview.totalStudents.toLocaleString()}
          </p>
          <p className="text-sm text-slate-600 dark:text-[#c2c2c2]">Total Students</p>
        </div>

        {/* Total Courses */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm p-6 border border-slate-200 dark:border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs font-medium text-slate-600 dark:text-[#c2c2c2]">
              {overview.publishedCourses} published
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-[#f5f5f5] mb-1">
            {overview.totalCourses}
          </p>
          <p className="text-sm text-slate-600 dark:text-[#c2c2c2]">Total Courses</p>
        </div>

        {/* Total Revenue */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm p-6 border border-slate-200 dark:border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-[#f5f5f5] mb-1">
            ${(overview.totalRevenue / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-slate-600 dark:text-[#c2c2c2]">Total Revenue</p>
        </div>

        {/* Available Balance */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl shadow-sm p-6 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <Link
              href="/instructor/earnings"
              className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
            >
              View Details
            </Link>
          </div>
          <p className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-1">
            ${(overview.availableBalance / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-300">Available to Withdraw</p>
        </div>
      </div>

      {/* Top Performing Courses */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm p-6 border border-slate-200 dark:border-[#2a2a2a] mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-[#f5f5f5]">
            Top Performing Courses
          </h2>
          <Link
            href="/courses"
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
          >
            View All
            <Eye className="w-4 h-4" />
          </Link>
        </div>

        {topCourses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-slate-300 dark:text-[#3a3a3a] mx-auto mb-4" />
            <p className="text-slate-600 dark:text-[#c2c2c2] mb-4">
              You haven't created any courses yet
            </p>
            <Link
              href="/courses/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Course</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {topCourses.map((course, index) => (
              <div
                key={course.id}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-[#222222] hover:bg-slate-100 dark:hover:bg-[#262626] transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-[#f5f5f5] mb-1">
                      {course.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-[#c2c2c2]">
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {course.enrollments} students
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        {course.rating > 0 ? course.rating.toFixed(1) : 'New'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <BarChart3 className="w-4 h-4" />
                        {course.avgProgress}% avg progress
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    ${(course.revenue / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-[#9e9e9e]">Revenue</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/instructor/students"
          className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm p-6 border border-slate-200 dark:border-[#2a2a2a] hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-[#f5f5f5] mb-2">
            My Students
          </h3>
          <p className="text-sm text-slate-600 dark:text-[#c2c2c2] mb-4">
            View and manage students enrolled in your courses
          </p>
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:underline">
            View All Students →
          </span>
        </Link>

        <Link
          href="/instructor/earnings"
          className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm p-6 border border-slate-200 dark:border-[#2a2a2a] hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-[#f5f5f5] mb-2">
            Earnings & Payouts
          </h3>
          <p className="text-sm text-slate-600 dark:text-[#c2c2c2] mb-4">
            Track your revenue and request withdrawals
          </p>
          <span className="text-sm font-medium text-green-600 dark:text-green-400 group-hover:underline">
            View Earnings →
          </span>
        </Link>

        <Link
          href="/courses"
          className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm p-6 border border-slate-200 dark:border-[#2a2a2a] hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-[#f5f5f5] mb-2">
            My Courses
          </h3>
          <p className="text-sm text-slate-600 dark:text-[#c2c2c2] mb-4">
            Manage and edit your published courses
          </p>
          <span className="text-sm font-medium text-purple-600 dark:text-purple-400 group-hover:underline">
            View Courses →
          </span>
        </Link>
      </div>
    </div>
  );
}
