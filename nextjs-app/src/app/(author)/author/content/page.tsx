/**
 * Author Content Writing Page
 * Write and edit course content
 */

'use client';

import { useRequireRole } from '@/hooks/useRequireRole';
import { FileText, Plus } from 'lucide-react';

export default function ContentPage() {
  useRequireRole({
    requiredRole: ['platform_author', 'admin'],
    requireVerification: true,
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#212121] p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-[#f5f5f5] mb-2 flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-600" />
          Content Writing
        </h1>
        <p className="text-slate-600 dark:text-[#c2c2c2]">
          Create high-quality educational content
        </p>
      </div>

      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-lg p-12 text-center">
        <FileText className="w-20 h-20 text-slate-300 dark:text-[#444444] mx-auto mb-6" />
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-[#f5f5f5] mb-4">
          Content Editor Coming Soon
        </h2>
        <p className="text-slate-600 dark:text-[#c2c2c2] max-w-md mx-auto">
          Rich text editor with AI-powered writing assistance
        </p>
      </div>
    </div>
  );
}
