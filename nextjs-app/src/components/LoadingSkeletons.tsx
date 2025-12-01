/**
 * Loading Skeleton Components
 * Provides better UX during data loading
 */

export function CourseCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="h-48 bg-gray-200"></div>

      {/* Content skeleton */}
      <div className="p-6">
        {/* Category badge */}
        <div className="h-6 w-24 bg-gray-200 rounded-full mb-3"></div>

        {/* Title */}
        <div className="h-6 bg-gray-200 rounded mb-3"></div>
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>

        {/* Description */}
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>

        {/* Stats */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="h-4 w-16 bg-gray-200 rounded"></div>
          <div className="h-4 w-20 bg-gray-200 rounded"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="h-8 w-20 bg-gray-200 rounded"></div>
          <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
      {/* Header with icon */}
      <div className="bg-gray-200 p-6">
        <div className="w-12 h-12 bg-gray-300 rounded mb-4"></div>
        <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>

      {/* Footer */}
      <div className="p-6">
        <div className="h-5 bg-gray-200 rounded w-32"></div>
      </div>
    </div>
  );
}

export function CourseGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, idx) => (
        <CourseCardSkeleton key={idx} />
      ))}
    </div>
  );
}

export function CategoryGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <CategoryCardSkeleton key={idx} />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="bg-gradient-to-br from-gray-300 to-gray-400 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="max-w-3xl">
          <div className="h-12 bg-gray-200 rounded mb-6 w-3/4"></div>
          <div className="h-6 bg-gray-200 rounded mb-2 w-full"></div>
          <div className="h-6 bg-gray-200 rounded mb-8 w-2/3"></div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="h-14 bg-gray-200 rounded-lg w-40"></div>
            <div className="h-14 bg-gray-200 rounded-lg w-40"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={idx} className="text-center animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-2 mx-auto w-24"></div>
          <div className="h-4 bg-gray-200 rounded mx-auto w-32"></div>
        </div>
      ))}
    </div>
  );
}
