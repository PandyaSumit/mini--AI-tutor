/**
 * Instructor Students Page
 * View and manage students enrolled in instructor's courses
 */

'use client';

import { useRequireRole } from '@/hooks/useRequireRole';
import { Users, Search, Filter } from 'lucide-react';

export default function InstructorStudentsPage() {
  useRequireRole({
    requiredRole: ['verified_instructor', 'platform_author', 'admin'],
    requireVerification: true,
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#212121] p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-[#f5f5f5] mb-2 flex items-center gap-3">
          <Users className="w-8 h-8 text-orange-600" />
          My Students
        </h1>
        <p className="text-slate-600 dark:text-[#c2c2c2]">
          Manage and track your students' progress across all your courses
        </p>
      </div>

      {/* Coming Soon Placeholder */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-lg p-12 text-center">
        <Users className="w-20 h-20 text-slate-300 dark:text-[#444444] mx-auto mb-6" />
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-[#f5f5f5] mb-4">
          Student Management Coming Soon
        </h2>
        <p className="text-slate-600 dark:text-[#c2c2c2] max-w-md mx-auto mb-8">
          This feature will allow you to view all students enrolled in your courses,
          track their progress, send messages, and provide personalized support.
        </p>
        <div className="flex gap-4 justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">0</div>
            <div className="text-sm text-slate-500 dark:text-[#9e9e9e]">Total Students</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">0%</div>
            <div className="text-sm text-slate-500 dark:text-[#9e9e9e]">Avg. Completion</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">0</div>
            <div className="text-sm text-slate-500 dark:text-[#9e9e9e]">Active This Week</div>
          </div>
        </div>
      </div>
    </div>
  );
}
