/**
 * Categories Page Loading State
 * Shown during navigation to categories page
 */

import { CategoryGridSkeleton } from '@/components/LoadingSkeletons';

export default function CategoriesLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Explore Course Categories
            </h1>
            <p className="text-xl text-blue-100">
              Discover thousands of courses across diverse topics. Find the perfect learning path for your goals.
            </p>
          </div>
        </div>
      </section>

      {/* Loading Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <CategoryGridSkeleton count={12} />
      </section>
    </div>
  );
}
