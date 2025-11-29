/**
 * 404 Not Found Page
 * Displayed when a route doesn't exist
 */

import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-900">404</h1>
          <div className="h-1 w-24 bg-gray-900 mx-auto mt-4"></div>
        </div>

        {/* Message */}
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h2>
        <p className="text-lg text-gray-600 mb-8">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved
          or deleted.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-all shadow-sm hover:shadow active:scale-[0.98]"
          >
            <Home className="w-5 h-5" strokeWidth={2} />
            <span>Go Home</span>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-lg transition-all border-2 border-gray-200 active:scale-[0.98]"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2} />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
}
