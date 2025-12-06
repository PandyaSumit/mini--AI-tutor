/**
 * Author Dashboard
 * Main hub for platform authors showing curriculum stats, content library, and publishing queue
 */

'use client';

import { useRequireRole } from '@/hooks/useRequireRole';
import {
  BookOpen,
  FileText,
  Send,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  Plus,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';

export default function AuthorDashboardPage() {
  useRequireRole({
    requiredRole: ['platform_author', 'admin'],
    requireVerification: true,
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#212121] p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-[#f5f5f5]">
              Welcome back, Author! 👋
            </h1>
            <p className="text-slate-600 dark:text-[#c2c2c2] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Verified Platform Author
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-green-600 font-semibold">+0%</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-[#f5f5f5] mb-1">0</div>
          <div className="text-sm text-slate-600 dark:text-[#c2c2c2]">Total Curricula</div>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-green-600 font-semibold">+0%</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-[#f5f5f5] mb-1">0</div>
          <div className="text-sm text-slate-600 dark:text-[#c2c2c2]">Content Pieces</div>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-slate-500 dark:text-[#9e9e9e]">This month</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-[#f5f5f5] mb-1">0</div>
          <div className="text-sm text-slate-600 dark:text-[#c2c2c2]">Published</div>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm text-green-600 font-semibold">+0%</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-[#f5f5f5] mb-1">0</div>
          <div className="text-sm text-slate-600 dark:text-[#c2c2c2]">Total Learners</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-[#f5f5f5] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/author/curriculum"
            className="group bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all"
          >
            <BookOpen className="w-8 h-8 text-white mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Build Curriculum</h3>
            <p className="text-purple-100 text-sm">Create structured learning paths</p>
          </Link>

          <Link
            href="/author/content"
            className="group bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all"
          >
            <FileText className="w-8 h-8 text-white mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Write Content</h3>
            <p className="text-blue-100 text-sm">Create lessons and materials</p>
          </Link>

          <Link
            href="/author/publish"
            className="group bg-gradient-to-br from-green-600 to-green-700 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all"
          >
            <Send className="w-8 h-8 text-white mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Publish Content</h3>
            <p className="text-green-100 text-sm">Review and publish courses</p>
          </Link>
        </div>
      </div>

      {/* Recent Activity / Publishing Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Publishing Queue */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-[#f5f5f5] flex items-center gap-2">
              <Send className="w-5 h-5 text-purple-600" />
              Publishing Queue
            </h2>
            <Link
              href="/author/publish"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              View All →
            </Link>
          </div>
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-slate-300 dark:text-[#444444] mx-auto mb-3" />
            <p className="text-slate-600 dark:text-[#c2c2c2]">
              No items in publishing queue
            </p>
          </div>
        </div>

        {/* Content Library */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-[#f5f5f5] flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Recent Content
            </h2>
            <Link
              href="/author/library"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View Library →
            </Link>
          </div>
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-slate-300 dark:text-[#444444] mx-auto mb-3" />
            <p className="text-slate-600 dark:text-[#c2c2c2] mb-4">
              No content created yet
            </p>
            <Link
              href="/author/content"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Create Content
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
