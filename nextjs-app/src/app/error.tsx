/**
 * Error Boundary
 * Catches and displays errors in the application
 */

'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        {/* Error Icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-red-600" strokeWidth={2} />
          </div>
        </div>

        {/* Message */}
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Something went wrong!</h2>
        <p className="text-lg text-gray-600 mb-8">
          We&apos;re sorry, but an unexpected error occurred. Please try again or return to the
          home page.
        </p>

        {/* Error Details (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
            <p className="text-sm text-red-800 font-mono break-all">{error.message}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-all shadow-sm hover:shadow active:scale-[0.98]"
          >
            <RefreshCw className="w-5 h-5" strokeWidth={2} />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-lg transition-all border-2 border-gray-200 active:scale-[0.98]"
          >
            <Home className="w-5 h-5" strokeWidth={2} />
            <span>Go Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
