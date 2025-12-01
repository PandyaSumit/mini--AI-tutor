/**
 * Browse Page Loading State
 * Shown during navigation to browse page
 */

import { CourseGridSkeleton } from '@/components/LoadingSkeletons';

export default function BrowseLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Skeleton */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="h-10 bg-white bg-opacity-20 rounded w-48 mb-4 animate-pulse"></div>
            <div className="h-6 bg-white bg-opacity-20 rounded w-3/4 mb-2 animate-pulse"></div>
            <div className="h-6 bg-white bg-opacity-20 rounded w-1/2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Skeleton */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </aside>

          {/* Courses Grid */}
          <div className="lg:col-span-3">
            <CourseGridSkeleton count={6} />
          </div>
        </div>
      </div>
    </div>
  );
}
