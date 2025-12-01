/**
 * CourseCard Component
 * Reusable card for displaying course information
 */

import Link from 'next/link';
import { Star, Users, Clock, BookOpen, TrendingUp } from 'lucide-react';

export interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  category?: string;
  difficulty?: string;
  thumbnail?: string;
  pricing: {
    model: 'free' | 'paid';
    amount?: number;
  };
  statistics: {
    enrollmentCount: number;
    averageRating: number;
    reviewCount: number;
    totalDuration: number;
    totalLessons: number;
  };
  createdBy?: {
    name: string;
    _id: string;
  };
  variant?: 'default' | 'compact' | 'featured';
  showInstructor?: boolean;
}

export default function CourseCard({
  id,
  title,
  description,
  category,
  difficulty,
  thumbnail,
  pricing,
  statistics,
  createdBy,
  variant = 'default',
  showInstructor = true,
}: CourseCardProps) {
  const isPaid = pricing.model === 'paid';
  const price = isPaid ? `$${(pricing.amount! / 100).toFixed(2)}` : 'Free';

  if (variant === 'compact') {
    return (
      <Link href={`/course/${id}`} className="group">
        <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-blue-300">
          {/* Thumbnail */}
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-32 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-white opacity-50" />
            </div>
          )}

          {/* Content */}
          <div className="p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {title}
            </h3>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span>{statistics.averageRating > 0 ? statistics.averageRating.toFixed(1) : 'New'}</span>
              </div>
              <span className="font-semibold text-blue-600">{price}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link href={`/course/${id}`} className="group">
        <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-blue-200 hover:border-blue-400">
          {/* Thumbnail */}
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-56 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative">
              <BookOpen className="w-16 h-16 text-white opacity-30" />
              <div className="absolute top-4 right-4 px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">
                FEATURED
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {/* Category & Difficulty */}
            <div className="flex items-center space-x-2 mb-3">
              {category && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {category}
                </span>
              )}
              {difficulty && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium capitalize">
                  {difficulty}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {title}
            </h3>

            {/* Description */}
            <p className="text-gray-600 mb-4 line-clamp-2 text-sm">{description}</p>

            {/* Stats */}
            <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="font-semibold">
                  {statistics.averageRating > 0 ? statistics.averageRating.toFixed(1) : 'New'}
                </span>
                {statistics.reviewCount > 0 && (
                  <span className="text-gray-500">({statistics.reviewCount})</span>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{statistics.enrollmentCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{statistics.totalDuration} min</span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              {showInstructor && createdBy && (
                <span className="text-sm text-gray-600">By {createdBy.name}</span>
              )}
              <span className="text-xl font-bold text-blue-600">{price}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Default variant
  return (
    <Link href={`/course/${id}`} className="group">
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-blue-300 h-full flex flex-col">
        {/* Thumbnail */}
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-white opacity-50" />
          </div>
        )}

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col">
          {/* Category & Difficulty */}
          <div className="flex items-center space-x-2 mb-3">
            {category && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {category}
              </span>
            )}
            {difficulty && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium capitalize">
                {difficulty}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {title}
          </h3>

          {/* Description */}
          <p className="text-gray-600 mb-4 line-clamp-3 text-sm flex-1">{description}</p>

          {/* Stats */}
          <div className="flex items-center flex-wrap gap-3 mb-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="font-semibold">
                {statistics.averageRating > 0 ? statistics.averageRating.toFixed(1) : 'New'}
              </span>
              {statistics.reviewCount > 0 && (
                <span className="text-gray-500">({statistics.reviewCount})</span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{statistics.enrollmentCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{statistics.totalDuration} min</span>
            </div>
            <div className="flex items-center space-x-1">
              <BookOpen className="w-4 h-4" />
              <span>{statistics.totalLessons} lessons</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            {showInstructor && createdBy ? (
              <span className="text-sm text-gray-600 truncate">By {createdBy.name}</span>
            ) : (
              <div />
            )}
            <span className="text-lg font-bold text-blue-600 ml-2">{price}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
