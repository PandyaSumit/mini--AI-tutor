'use client';

/**
 * Categories Page
 * Browse courses by category
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Code,
  Briefcase,
  Palette,
  Music,
  Camera,
  Heart,
  Globe,
  TrendingUp,
  Loader,
  ArrowRight,
} from 'lucide-react';
import { publicCourseService } from '@/services/public/publicCourseService';
import { CategoryGridSkeleton } from '@/components/LoadingSkeletons';

// Category icons mapping
const categoryIcons: { [key: string]: any } = {
  'Programming': Code,
  'Development': Code,
  'Web Development': Code,
  'Business': Briefcase,
  'Marketing': TrendingUp,
  'Design': Palette,
  'Photography': Camera,
  'Music': Music,
  'Health': Heart,
  'Language': Globe,
  'Data Science': TrendingUp,
  'AI & ML': TrendingUp,
};

const categoryColors: { [key: string]: string } = {
  'Programming': 'from-blue-500 to-blue-600',
  'Development': 'from-blue-500 to-blue-600',
  'Web Development': 'from-purple-500 to-purple-600',
  'Business': 'from-green-500 to-green-600',
  'Marketing': 'from-orange-500 to-orange-600',
  'Design': 'from-pink-500 to-pink-600',
  'Photography': 'from-red-500 to-red-600',
  'Music': 'from-yellow-500 to-yellow-600',
  'Health': 'from-teal-500 to-teal-600',
  'Language': 'from-indigo-500 to-indigo-600',
  'Data Science': 'from-cyan-500 to-cyan-600',
  'AI & ML': 'from-violet-500 to-violet-600',
};

export default function CategoriesPage() {
  const router = useRouter();
  const [categoriesWithCounts, setCategoriesWithCounts] = useState<Array<{ name: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);

      // Get all categories
      const categories = await publicCourseService.getCategories();

      // Get course count for each category
      const categoriesWithCounts = await Promise.all(
        categories.map(async (category: string) => {
          const data = await publicCourseService.getCourses({
            category,
            limit: 1,
            page: 1,
          });
          return {
            name: category,
            count: data.pagination.total,
          };
        })
      );

      // Sort by count descending
      categoriesWithCounts.sort((a, b) => b.count - a.count);
      setCategoriesWithCounts(categoriesWithCounts);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const Icon = categoryIcons[category] || BookOpen;
    return Icon;
  };

  const getCategoryColor = (category: string) => {
    return categoryColors[category] || 'from-gray-500 to-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-white py-20 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
                Explore Course Categories
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Discover thousands of courses across diverse topics. Find the perfect learning path for your goals.
              </p>
            </div>
          </div>
        </section>

        {/* Loading Categories */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <CategoryGridSkeleton count={8} />
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-white py-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
              Explore Course Categories
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Discover thousands of courses across diverse topics. Find the perfect learning path for your goals.
            </p>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        {categoriesWithCounts.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Categories Available</h3>
            <p className="text-gray-600">Check back soon for new courses!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categoriesWithCounts.map((category) => {
              const Icon = getCategoryIcon(category.name);

              return (
                <Link
                  key={category.name}
                  href={`/browse?category=${encodeURIComponent(category.name)}`}
                  className="group"
                >
                  <div className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden h-full">
                    <div className="bg-gray-900 p-6 text-white">
                      <Icon className="w-12 h-12 mb-4" strokeWidth={2} />
                      <h3 className="text-xl font-bold mb-2">{category.name}</h3>
                      <p className="text-white text-opacity-90">
                        {category.count} {category.count === 1 ? 'course' : 'courses'}
                      </p>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center text-gray-600 group-hover:text-gray-900 font-medium transition-colors">
                        <span>Browse Courses</span>
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" strokeWidth={2} />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-white border-t border-gray-100 py-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Can't find what you're looking for?
          </h2>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Browse all courses or use our search to find the perfect course for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/browse"
              className="inline-flex items-center justify-center px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-all font-semibold shadow-sm hover:shadow active:scale-[0.98]"
            >
              Browse All Courses
            </Link>
            <Link
              href="/browse?search="
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-200 text-gray-900 rounded-xl hover:bg-gray-50 transition-all font-semibold active:scale-[0.98]"
            >
              Search Courses
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
