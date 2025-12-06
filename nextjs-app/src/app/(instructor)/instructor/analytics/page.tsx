/**
 * Instructor Analytics Page
 * View detailed analytics and insights for courses and students
 */

'use client';

import { useRequireRole } from '@/hooks/useRequireRole';
import { BarChart3, TrendingUp, Users, Eye } from 'lucide-react';

export default function InstructorAnalyticsPage() {
  useRequireRole({
    requiredRole: ['verified_instructor', 'platform_author', 'admin'],
    requireVerification: true,
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#212121] p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-[#f5f5f5] mb-2 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          Analytics
        </h1>
        <p className="text-slate-600 dark:text-[#c2c2c2]">
          Track course performance, student engagement, and revenue trends
        </p>
      </div>

      {/* Coming Soon Placeholder */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-lg p-12 text-center">
        <BarChart3 className="w-20 h-20 text-slate-300 dark:text-[#444444] mx-auto mb-6" />
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-[#f5f5f5] mb-4">
          Advanced Analytics Coming Soon
        </h2>
        <p className="text-slate-600 dark:text-[#c2c2c2] max-w-md mx-auto mb-8">
          This feature will provide detailed insights including enrollment trends,
          completion rates, revenue analytics, and student engagement metrics.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="bg-slate-50 dark:bg-[#2a2a2a] rounded-xl p-6">
            <Users className="w-8 h-8 text-blue-600 mb-3 mx-auto" />
            <div className="text-lg font-bold text-slate-900 dark:text-[#f5f5f5]">Enrollment Trends</div>
          </div>
          <div className="bg-slate-50 dark:bg-[#2a2a2a] rounded-xl p-6">
            <TrendingUp className="w-8 h-8 text-green-600 mb-3 mx-auto" />
            <div className="text-lg font-bold text-slate-900 dark:text-[#f5f5f5]">Revenue Analytics</div>
          </div>
          <div className="bg-slate-50 dark:bg-[#2a2a2a] rounded-xl p-6">
            <Eye className="w-8 h-8 text-purple-600 mb-3 mx-auto" />
            <div className="text-lg font-bold text-slate-900 dark:text-[#f5f5f5]">Engagement Metrics</div>
          </div>
          <div className="bg-slate-50 dark:bg-[#2a2a2a] rounded-xl p-6">
            <BarChart3 className="w-8 h-8 text-orange-600 mb-3 mx-auto" />
            <div className="text-lg font-bold text-slate-900 dark:text-[#f5f5f5]">Completion Rates</div>
          </div>
        </div>
      </div>
    </div>
  );
}
