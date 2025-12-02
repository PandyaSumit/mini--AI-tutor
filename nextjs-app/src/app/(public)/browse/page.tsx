'use client';

/**
 * Browse Courses Page
 * Unified design matching landing page aesthetic
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  BookOpen,
  Users,
  Clock,
  Search,
  Filter,
  Loader,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { publicCourseService } from '@/services/public/publicCourseService';

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [sortBy, setSortBy] = useState('-createdAt');
  const [showFilters, setShowFilters] = useState(false);

  const difficulties = ['beginner', 'intermediate', 'advanced'];

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    // Get initial values from URL params
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const search = searchParams.get('search');

    if (category) setSelectedCategory(category);
    if (difficulty) setSelectedDifficulty(difficulty);
    if (search) setSearchQuery(search);

    loadCourses();
  }, [searchParams, selectedCategory, selectedDifficulty, sortBy, pagination.page]);

  const loadCategories = async () => {
    try {
      const cats = await publicCourseService.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadCourses = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
        sort: sortBy,
      };

      if (selectedCategory) params.category = selectedCategory;
      if (selectedDifficulty) params.difficulty = selectedDifficulty;
      if (searchQuery) params.search = searchQuery;

      const data = await publicCourseService.getCourses(params);
      setCourses(data.courses);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    loadCourses();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedDifficulty('');
    setSortBy('-createdAt');
    setPagination({ ...pagination, page: 1 });
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedDifficulty;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Matching Landing Page Style */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center space-x-2 bg-blue-50 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">
                {pagination.total.toLocaleString()}+ Courses Available
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Explore Courses
            </h1>
            <p className="text-xl text-gray-600">
              Discover courses taught by expert instructors. Learn at your own pace with AI-powered assistance.
            </p>
          </div>

          {/* Search Bar - Matching Landing Page Style */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for courses..."
                className="w-full pl-12 pr-32 py-4 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Filters & Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Desktop - Matching Landing Page Cards */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Difficulty Level
                </label>
                <div className="space-y-3">
                  {difficulties.map((diff) => (
                    <label key={diff} className="flex items-center cursor-pointer group">
                      <input
                        type="radio"
                        name="difficulty"
                        value={diff}
                        checked={selectedDifficulty === diff}
                        onChange={(e) => {
                          setSelectedDifficulty(e.target.value);
                          setPagination({ ...pagination, page: 1 });
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-gray-700 capitalize group-hover:text-gray-900">
                        {diff}
                      </span>
                    </label>
                  ))}
                  {selectedDifficulty && (
                    <button
                      onClick={() => {
                        setSelectedDifficulty('');
                        setPagination({ ...pagination, page: 1 });
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Clear selection
                    </button>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Mobile Filter Button - Matching Landing Page Button Style */}
          <div className="lg:hidden mb-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Filter className="w-5 h-5 text-gray-700" />
              <span className="font-medium text-gray-900">Filters</span>
              {hasActiveFilters && (
                <span className="px-2.5 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded-full">
                  {[selectedCategory, selectedDifficulty].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Filters Modal - Matching Design System */}
          {showFilters && (
            <>
              <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowFilters(false)} />
              <div className="lg:hidden fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white z-50 overflow-y-auto shadow-2xl">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <X className="w-6 h-6 text-gray-500" />
                    </button>
                  </div>

                  {/* Category Filter */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Difficulty Filter */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Difficulty Level
                    </label>
                    <div className="space-y-3">
                      {difficulties.map((diff) => (
                        <label key={diff} className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="difficulty-mobile"
                            value={diff}
                            checked={selectedDifficulty === diff}
                            onChange={(e) => setSelectedDifficulty(e.target.value)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="ml-3 text-gray-700 capitalize">{diff}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-8">
                    <button
                      onClick={clearFilters}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={() => {
                        setShowFilters(false);
                        loadCourses();
                      }}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Sort & Results Count - Matching Landing Page Typography */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {pagination.total.toLocaleString()} {pagination.total === 1 ? 'Course' : 'Courses'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {hasActiveFilters ? 'Filtered results' : 'All available courses'}
                </p>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-medium shadow-sm"
              >
                <option value="-createdAt">Newest First</option>
                <option value="createdAt">Oldest First</option>
                <option value="title">Title (A-Z)</option>
                <option value="-title">Title (Z-A)</option>
                <option value="-marketplace.totalSales">Most Popular</option>
              </select>
            </div>

            {/* Course Grid - Matching Landing Page Card Style */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-600">Loading courses...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl shadow-md border border-gray-100">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No courses found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {hasActiveFilters
                    ? 'Try adjusting your filters or search query to find more courses.'
                    : 'Check back soon for new courses!'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                  >
                    <X className="w-4 h-4" />
                    <span>Clear All Filters</span>
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <Link
                      key={course._id}
                      href={`/course/${course._id}`}
                      className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden border border-gray-100"
                    >
                      {/* Course Thumbnail */}
                      <div className="relative h-48 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                        <BookOpen className="w-16 h-16 text-white opacity-75 transform group-hover:scale-110 transition-transform" />
                        {course.difficulty && (
                          <div className="absolute top-3 right-3 px-3 py-1 bg-white rounded-full shadow-sm">
                            <span className="text-xs font-semibold text-gray-900 capitalize">
                              {course.difficulty}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Course Info */}
                      <div className="p-5">
                        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors text-lg leading-snug">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                          by <span className="font-medium">{course.createdBy.name}</span>
                          {course.createdBy.instructorVerification?.portfolio?.professionalTitle && (
                            <span className="text-gray-400">
                              {' • '}
                              {course.createdBy.instructorVerification.portfolio.professionalTitle}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-700 line-clamp-2 mb-4 leading-relaxed">
                          {course.description}
                        </p>

                        {/* Course Stats */}
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4 pb-4 border-b border-gray-100">
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span className="font-medium">{course.statistics.enrollmentCount.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">{course.statistics.totalLessons} lessons</span>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="flex items-center justify-between">
                          {course.pricing.model === 'paid' ? (
                            <p className="text-2xl font-bold text-blue-600">
                              ${(course.pricing.amount / 100).toFixed(2)}
                            </p>
                          ) : (
                            <p className="text-2xl font-bold text-green-600">Free</p>
                          )}
                          <div className="flex items-center space-x-1 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-sm font-medium">View Course</span>
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination - Matching Landing Page Button Style */}
                {pagination.totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                      disabled={pagination.page === 1}
                      className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                      Previous
                    </button>
                    <div className="hidden sm:flex gap-2">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPagination({ ...pagination, page: pageNum })}
                            className={`px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm ${
                              pagination.page === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    {/* Mobile page indicator */}
                    <div className="sm:hidden px-4 py-2 text-sm font-medium text-gray-700">
                      Page {pagination.page} of {pagination.totalPages}
                    </div>
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                      disabled={!pagination.hasMore}
                      className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
