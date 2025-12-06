/**
 * Author Analytics Page
 * Track content performance and impact
 */

'use client';

import { useRequireRole } from '@/hooks/useRequireRole';
import { BarChart3 } from 'lucide-react';

export default function AuthorAnalyticsPage() {
  useRequireRole({
    requiredRole: ['platform_author', 'admin'],
    requireVerification: true,
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#212121] p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-[#f5f5f5] mb-2 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          Analytics
        </h1>
        <p className="text-slate-600 dark:text-[#c2c2c2]">
          Track content performance and learner impact
        </p>
      </div>

      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-lg p-12 text-center">
        <BarChart3 className="w-20 h-20 text-slate-300 dark:text-[#444444] mx-auto mb-6" />
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-[#f5f5f5] mb-4">
          Analytics Dashboard Coming Soon
        </h2>
        <p className="text-slate-600 dark:text-[#c2c2c2] max-w-md mx-auto">
          Comprehensive analytics for your educational content
        </p>
      </div>
    </div>
  );
}
