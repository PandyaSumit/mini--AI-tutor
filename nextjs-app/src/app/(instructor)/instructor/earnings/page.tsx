/**
 * Instructor Earnings Page
 * View revenue, earnings breakdown, and request payouts
 */

'use client';

import { useRequireRole } from '@/hooks/useRequireRole';
import { DollarSign, TrendingUp, Wallet, CreditCard } from 'lucide-react';

export default function InstructorEarningsPage() {
  useRequireRole({
    requiredRole: ['verified_instructor', 'platform_author', 'admin'],
    requireVerification: true,
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#212121] p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-[#f5f5f5] mb-2 flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-green-600" />
          Earnings
        </h1>
        <p className="text-slate-600 dark:text-[#c2c2c2]">
          Track your revenue, view earnings breakdown, and request payouts
        </p>
      </div>

      {/* Coming Soon Placeholder */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-lg p-12 text-center">
        <Wallet className="w-20 h-20 text-slate-300 dark:text-[#444444] mx-auto mb-6" />
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-[#f5f5f5] mb-4">
          Earnings Dashboard Coming Soon
        </h2>
        <p className="text-slate-600 dark:text-[#c2c2c2] max-w-md mx-auto mb-8">
          This feature will show your total earnings, revenue breakdown by course,
          payout history, and allow you to request withdrawals.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6">
            <TrendingUp className="w-8 h-8 text-green-600 mb-3" />
            <div className="text-2xl font-bold text-slate-900 dark:text-[#f5f5f5]">$0.00</div>
            <div className="text-sm text-slate-600 dark:text-[#c2c2c2]">Total Earnings</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6">
            <Wallet className="w-8 h-8 text-blue-600 mb-3" />
            <div className="text-2xl font-bold text-slate-900 dark:text-[#f5f5f5]">$0.00</div>
            <div className="text-sm text-slate-600 dark:text-[#c2c2c2]">Available Balance</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6">
            <CreditCard className="w-8 h-8 text-purple-600 mb-3" />
            <div className="text-2xl font-bold text-slate-900 dark:text-[#f5f5f5]">$0.00</div>
            <div className="text-sm text-slate-600 dark:text-[#c2c2c2]">Pending Payout</div>
          </div>
        </div>
      </div>
    </div>
  );
}
