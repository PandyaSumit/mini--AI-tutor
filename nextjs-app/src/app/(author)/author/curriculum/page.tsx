/**
 * Author Curriculum Builder Page
 * Design and structure course curricula
 */

'use client';

import { useRequireRole } from '@/hooks/useRequireRole';
import { BookOpen, Plus } from 'lucide-react';

export default function CurriculumPage() {
  useRequireRole({
    requiredRole: ['platform_author', 'admin'],
    requireVerification: true,
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#212121] p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-[#f5f5f5] mb-2 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-purple-600" />
          Curriculum Builder
        </h1>
        <p className="text-slate-600 dark:text-[#c2c2c2]">
          Design structured learning paths and course outlines
        </p>
      </div>

      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-lg p-12 text-center">
        <BookOpen className="w-20 h-20 text-slate-300 dark:text-[#444444] mx-auto mb-6" />
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-[#f5f5f5] mb-4">
          Curriculum Builder Coming Soon
        </h2>
        <p className="text-slate-600 dark:text-[#c2c2c2] max-w-md mx-auto">
          Advanced curriculum design tools for platform authors
        </p>
      </div>
    </div>
  );
}
