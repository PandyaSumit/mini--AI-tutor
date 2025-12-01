'use client';

/**
 * Admin Dashboard Page
 * Platform overview and key metrics
 */

import { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Brain,
  Clock,
  Loader,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { adminService } from '@/services/admin/adminService';
import Link from 'next/link';

interface DashboardStats {
  users: {
    total: number;
    byRole: {
      learner: number;
      verified_instructor: number;
      platform_author: number;
      admin: number;
    };
    newThisMonth: number;
  };
  courses: {
    total: number;
    byType: {
      personal: number;
      marketplace: number;
      flagship: number;
    };
    byVisibility: {
      private: number;
      unlisted: number;
      public: number;
    };
  };
  pendingReviews: {
    instructorApplications: number;
    courseQualityReviews: number;
  };
  aiUsage: {
    totalMessagesThisMonth: number;
    totalVoiceMinutesThisMonth: number;
    totalCoursesGenerated: number;
    estimatedCost: number;
  };
  revenue: {
    totalRevenue: number;
    platformShare: number;
    instructorShare: number;
    thisMonth: number;
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getDashboard();
      setStats(data);
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Dashboard</h3>
              <p className="text-red-700">{error}</p>
              <button
                onClick={loadDashboard}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.users.total.toLocaleString(),
      subtitle: `${stats.users.newThisMonth} new this month`,
      icon: Users,
      color: 'blue',
      link: '/admin/users',
    },
    {
      title: 'Total Courses',
      value: stats.courses.total.toLocaleString(),
      subtitle: `${stats.courses.byVisibility.public} public`,
      icon: BookOpen,
      color: 'purple',
      link: '/admin/courses',
    },
    {
      title: 'Total Revenue',
      value: `$${(stats.revenue.totalRevenue / 100).toFixed(2)}`,
      subtitle: `$${(stats.revenue.thisMonth / 100).toFixed(2)} this month`,
      icon: DollarSign,
      color: 'green',
      link: '/admin/analytics',
    },
    {
      title: 'AI Usage Cost',
      value: `$${stats.aiUsage.estimatedCost.toFixed(2)}`,
      subtitle: 'This month',
      icon: Brain,
      color: 'orange',
      link: '/admin/analytics',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your AI Tutor platform</p>
      </div>

      {/* Pending Reviews Alert */}
      {(stats.pendingReviews.instructorApplications > 0 ||
        stats.pendingReviews.courseQualityReviews > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-900 mb-2">Pending Reviews</h3>
              <div className="flex flex-wrap gap-4">
                {stats.pendingReviews.instructorApplications > 0 && (
                  <Link
                    href="/admin/instructors"
                    className="text-sm text-yellow-700 hover:text-yellow-900 underline"
                  >
                    {stats.pendingReviews.instructorApplications} instructor application
                    {stats.pendingReviews.instructorApplications !== 1 ? 's' : ''}
                  </Link>
                )}
                {stats.pendingReviews.courseQualityReviews > 0 && (
                  <Link
                    href="/admin/courses"
                    className="text-sm text-yellow-700 hover:text-yellow-900 underline"
                  >
                    {stats.pendingReviews.courseQualityReviews} course quality review
                    {stats.pendingReviews.courseQualityReviews !== 1 ? 's' : ''}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const colorClasses = {
            blue: 'from-blue-500 to-blue-600',
            purple: 'from-purple-500 to-purple-600',
            green: 'from-green-500 to-green-600',
            orange: 'from-orange-500 to-orange-600',
          }[card.color];

          return (
            <Link
              key={card.title}
              href={card.link}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${colorClasses} rounded-lg flex items-center justify-center`}
                >
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{card.title}</h3>
              <p className="text-3xl font-bold text-gray-900 mb-2">{card.value}</p>
              <p className="text-sm text-gray-500">{card.subtitle}</p>
            </Link>
          );
        })}
      </div>

      {/* User Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Users by Role</h2>
            <Users className="w-6 h-6 text-gray-400" />
          </div>
          <div className="space-y-4">
            {[
              { label: 'Learners', value: stats.users.byRole.learner, color: 'blue' },
              {
                label: 'Verified Instructors',
                value: stats.users.byRole.verified_instructor,
                color: 'purple',
              },
              { label: 'Platform Authors', value: stats.users.byRole.platform_author, color: 'green' },
              { label: 'Admins', value: stats.users.byRole.admin, color: 'red' },
            ].map((item) => {
              const percentage = ((item.value / stats.users.total) * 100).toFixed(1);
              const colorClasses = {
                blue: 'bg-blue-500',
                purple: 'bg-purple-500',
                green: 'bg-green-500',
                red: 'bg-red-500',
              }[item.color];

              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    <span className="text-sm text-gray-500">
                      {item.value.toLocaleString()} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`${colorClasses} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Course Breakdown */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Courses by Type</h2>
            <BookOpen className="w-6 h-6 text-gray-400" />
          </div>
          <div className="space-y-4">
            {[
              { label: 'Personal Courses', value: stats.courses.byType.personal, color: 'blue' },
              { label: 'Marketplace Courses', value: stats.courses.byType.marketplace, color: 'purple' },
              { label: 'Flagship Courses', value: stats.courses.byType.flagship, color: 'green' },
            ].map((item) => {
              const percentage = ((item.value / stats.courses.total) * 100).toFixed(1);
              const colorClasses = {
                blue: 'bg-blue-500',
                purple: 'bg-purple-500',
                green: 'bg-green-500',
              }[item.color];

              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    <span className="text-sm text-gray-500">
                      {item.value.toLocaleString()} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`${colorClasses} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Usage & Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Usage */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">AI Usage (This Month)</h2>
            <Brain className="w-6 h-6 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Chat Messages</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.aiUsage.totalMessagesThisMonth.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Voice Minutes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.aiUsage.totalVoiceMinutesThisMonth.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Courses Generated</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.aiUsage.totalCoursesGenerated.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Revenue Breakdown</h2>
            <DollarSign className="w-6 h-6 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">
                ${(stats.revenue.totalRevenue / 100).toFixed(2)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Platform Share (30%)</p>
                <p className="text-xl font-bold text-blue-600">
                  ${(stats.revenue.platformShare / 100).toFixed(2)}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Instructor Share (70%)</p>
                <p className="text-xl font-bold text-purple-600">
                  ${(stats.revenue.instructorShare / 100).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border-2 border-green-200">
              <p className="text-sm text-gray-600 mb-1">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(stats.revenue.thisMonth / 100).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
