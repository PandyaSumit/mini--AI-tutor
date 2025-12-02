/**
 * Categories Page Loading State
 */

export default function CategoriesLoading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-white py-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="h-14 w-96 bg-gray-200 rounded mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 w-64 bg-gray-200 rounded mx-auto animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Categories Grid Skeleton */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="bg-gray-200 p-6 h-48 animate-pulse">
                <div className="w-12 h-12 bg-gray-300 rounded-xl mb-4"></div>
                <div className="h-6 bg-gray-300 rounded mb-2 w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
              <div className="p-6">
                <div className="h-5 bg-gray-200 rounded animate-pulse w-32"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
