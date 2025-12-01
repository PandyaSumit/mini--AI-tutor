/**
 * Course Detail Loading State
 * Shown during navigation to course detail page
 */

export default function CourseDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* Hero Skeleton */}
      <div className="bg-gradient-to-r from-gray-400 to-gray-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Course Info Skeleton */}
            <div className="lg:col-span-2">
              <div className="flex space-x-2 mb-4">
                <div className="h-6 w-24 bg-white bg-opacity-20 rounded-full"></div>
                <div className="h-6 w-24 bg-white bg-opacity-20 rounded-full"></div>
              </div>
              <div className="h-12 bg-white bg-opacity-20 rounded mb-4"></div>
              <div className="h-12 bg-white bg-opacity-20 rounded w-3/4 mb-6"></div>
              <div className="h-6 bg-white bg-opacity-20 rounded mb-2"></div>
              <div className="h-6 bg-white bg-opacity-20 rounded w-2/3 mb-6"></div>

              {/* Stats Skeleton */}
              <div className="flex flex-wrap gap-6 mb-6">
                <div className="h-5 w-24 bg-white bg-opacity-20 rounded"></div>
                <div className="h-5 w-32 bg-white bg-opacity-20 rounded"></div>
                <div className="h-5 w-28 bg-white bg-opacity-20 rounded"></div>
              </div>
            </div>

            {/* Enroll Card Skeleton */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-2xl p-6">
                <div className="text-center mb-6">
                  <div className="h-12 bg-gray-200 rounded mx-auto w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mx-auto w-24"></div>
                </div>
                <div className="h-14 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-3">
                  <div className="h-5 bg-gray-200 rounded"></div>
                  <div className="h-5 bg-gray-200 rounded"></div>
                  <div className="h-5 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-8 mb-8">
              <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
              <div className="space-y-3">
                <div className="h-5 bg-gray-200 rounded"></div>
                <div className="h-5 bg-gray-200 rounded"></div>
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="h-8 bg-gray-200 rounded w-40 mb-6"></div>
              <div className="space-y-4">
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="h-40 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
