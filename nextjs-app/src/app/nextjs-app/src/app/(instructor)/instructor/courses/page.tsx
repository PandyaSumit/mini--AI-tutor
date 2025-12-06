/**
 * Instructor Courses Page
 * View and manage all courses created by the instructor
 */

'use client';

import { useRequireRole } from '@/hooks/useRequireRole';
import { GraduationCap, Plus, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function InstructorCoursesPage() {
  useRequireRole({
    requiredRole: ['verified_instructor', 'platform_author', 'admin'],
    requireVerification: true,
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#212121] p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-[#f5f5f5] mb-2 flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-orange-600" />
            My Courses
          </h1>
          <p className="text-slate-600 dark:text-[#c2c2c2]">
            Manage, edit, and track performance of your courses
          </p>
        </div>
        <Link
          href="/courses/create"
          className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
        >
          <Plus className="w-5 h-5" />
          Create Course
        </Link>
      </div>

      {/* Coming Soon Placeholder */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-lg p-12 text-center">
        <GraduationCap className="w-20 h-20 text-slate-300 dark:text-[#444444] mx-auto mb-6" />
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-[#f5f5f5] mb-4">
          Course Management Coming Soon
        </h2>
        <p className="text-slate-600 dark:text-[#c2c2c2] max-w-md mx-auto mb-8">
          This page will display all your courses with quick access to edit content,
          view analytics, manage pricing, and publish/unpublish courses.
        </p>
        <div className="flex gap-4 justify-center mb-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">0</div>
            <div className="text-sm text-slate-500 dark:text-[#9e9e9e]">Total Courses</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">0</div>
            <div className="text-sm text-slate-500 dark:text-[#9e9e9e]">Published</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">0</div>
            <div className="text-sm text-slate-500 dark:text-[#9e9e9e]">Drafts</div>
          </div>
        </div>
        <Link
          href="/courses/create"
          className="inline-flex items-center gap-2 px-8 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold text-lg"
        >
          <Plus className="w-6 h-6" />
          Create Your First Course
        </Link>
      </div>
    </div>
  );
}
