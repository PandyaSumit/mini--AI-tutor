/**
 * Author Publishing Queue Page
 * Review and publish content
 */

'use client';

import { useRequireRole } from '@/hooks/useRequireRole';
import { Send } from 'lucide-react';

export default function PublishPage() {
  useRequireRole({
    requiredRole: ['platform_author', 'admin'],
    requireVerification: true,
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#212121] p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-[#f5f5f5] mb-2 flex items-center gap-3">
          <Send className="w-8 h-8 text-purple-600" />
          Publishing Queue
        </h1>
        <p className="text-slate-600 dark:text-[#c2c2c2]">
          Review and publish your content
        </p>
      </div>

      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-lg p-12 text-center">
        <Send className="w-20 h-20 text-slate-300 dark:text-[#444444] mx-auto mb-6" />
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-[#f5f5f5] mb-4">
          Publishing Workflow Coming Soon
        </h2>
        <p className="text-slate-600 dark:text-[#c2c2c2] max-w-md mx-auto">
          Review, approve, and publish content to the platform
        </p>
      </div>
    </div>
  );
}
