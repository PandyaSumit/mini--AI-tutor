/**
 * Courses Page
 * Browse and enroll in courses
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { courseService } from '@/services/course';
import { BookOpen, Users, Clock, Star, TrendingUp, Filter, Search, GraduationCap } from 'lucide-react';
import type { Course } from '@/types';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const data = await courseService.getCourses();
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'programming', 'mathematics', 'science', 'languages', 'business'];

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Catalog</h1>
          <p className="text-gray-600">Explore structured learning paths and courses</p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={2} />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
            />
          </div>

          {/* Categories */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" strokeWidth={2} />
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-gray-400" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {searchQuery ? 'No courses found' : 'No courses available'}
            </h2>
            <p className="text-gray-600 mb-8">
              {searchQuery
                ? 'Try adjusting your search or filter criteria'
                : 'Check back soon for new courses'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-600">
                Showing {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <Link
                  key={course._id}
                  href={`/courses/${course._id}`}
                  className="group bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden"
                >
                  {/* Course Image/Thumbnail */}
                  <div className="aspect-video bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <GraduationCap className="w-16 h-16 text-white opacity-50" strokeWidth={1.5} />
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Category Badge */}
                    {course.category && (
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded mb-3">
                        {course.category}
                      </span>
                    )}

                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {course.title}
                    </h3>

                    {/* Description */}
                    {course.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4">{course.description}</p>
                    )}

                    {/* Instructor */}
                    {course.instructor && (
                      <p className="text-sm text-gray-500 mb-4">By {course.instructor}</p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" strokeWidth={2} />
                        <span>{course.duration || '8'} weeks</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" strokeWidth={2} />
                        <span>{course.lessons?.length || 0} lessons</span>
                      </div>
                    </div>

                    {/* Rating and Enrollment */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" strokeWidth={2} />
                        <span className="text-sm font-semibold text-gray-900">
                          {course.rating || '4.5'}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({course.enrolledCount || 0})
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Users className="w-4 h-4" strokeWidth={2} />
                        <span>{course.enrolledCount || 0} enrolled</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 pb-6">
                    <div className="w-full py-2 text-center bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-all group-hover:shadow-md">
                      {course.isEnrolled ? 'Continue Learning' : 'Enroll Now'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Featured Section */}
        {courses.length > 0 && (
          <div className="mt-12 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100 p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Popular This Week</h3>
                <p className="text-sm text-gray-600">Most enrolled courses this week</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {courses.slice(0, 3).map((course) => (
                <Link
                  key={course._id}
                  href={`/courses/${course._id}`}
                  className="p-4 bg-white rounded-lg border border-purple-200 hover:border-purple-300 hover:shadow-md transition-all"
                >
                  <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2">{course.title}</h4>
                  <p className="text-sm text-gray-600">{course.instructor || 'Expert Instructor'}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
