'use client';

/**
 * Payment Cancel Page
 * Shown when user cancels Stripe checkout
 */

import { useRouter } from 'next/navigation';
import { XCircle, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-orange-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Payment Cancelled
        </h2>

        <p className="text-gray-600 mb-6">
          Your payment was cancelled. No charges have been made to your account.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            You can try again anytime. Your enrollment will be available as soon as you complete the payment.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Go Back and Try Again</span>
          </button>

          <Link
            href="/browse"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
          >
            Browse Other Courses
          </Link>

          <Link
            href="/dashboard"
            className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Need help? Contact our support team for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
