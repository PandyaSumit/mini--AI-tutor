'use client';

/**
 * Public Course Browse Page
 * Marketplace catalog with filters and search
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
  ChevronDown,
  Star,
  Loader,
  X,
} from 'lucide-react';
import { publicCourseService } from '@/services/public/publicCourseService';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
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
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-3">
          <Breadcrumbs
            items={[
              { label: 'Browse Courses', href: '/browse' },
              ...(selectedCategory ? [{ label: selectedCategory, href: `/browse?category=${encodeURIComponent(selectedCategory)}` }] : []),
            ]}
          />
        </div>
      </div>

      {/* Header Section */}
      <div className="bg-white py-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
              Explore Courses
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Discover {pagination.total.toLocaleString()}+ courses taught by expert instructors
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for courses..."
                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-all font-semibold shadow-sm hover:shadow active:scale-[0.98]"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 bg-gray-50">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900">Filters</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <div className="space-y-2">
                  {difficulties.map((diff) => (
                    <label key={diff} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="difficulty"
                        value={diff}
                        checked={selectedDifficulty === diff}
                        onChange={(e) => {
                          setSelectedDifficulty(e.target.value);
                          setPagination({ ...pagination, page: 1 });
                        }}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="ml-2 text-gray-700 capitalize">{diff}</span>
                    </label>
                  ))}
                  {selectedDifficulty && (
                    <button
                      onClick={() => {
                        setSelectedDifficulty('');
                        setPagination({ ...pagination, page: 1 });
                      }}
                      className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Mobile Filter Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
            >
              <Filter className="w-5 h-5" />
              <span className="font-medium">Filters</span>
              {hasActiveFilters && (
                <span className="px-2 py-0.5 bg-gray-900 text-white text-xs rounded-full">
                  {[selectedCategory, selectedDifficulty].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Filters Modal */}
          {showFilters && (
            <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50">
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-gray-900">Filters</h3>
                  <button onClick={() => setShowFilters(false)}>
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>

                {/* Same filters as desktop */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty
                  </label>
                  <div className="space-y-2">
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
                        <span className="ml-2 text-gray-700 capitalize">{diff}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={clearFilters}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => {
                      setShowFilters(false);
                      loadCourses();
                    }}
                    className="flex-1 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-all"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Sort & Results Count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                {pagination.total.toLocaleString()} {pagination.total === 1 ? 'course' : 'courses'} found
              </p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all"
              >
                <option value="-createdAt">Newest</option>
                <option value="createdAt">Oldest</option>
                <option value="title">Title (A-Z)</option>
                <option value="-title">Title (Z-A)</option>
                <option value="-marketplace.totalSales">Most Popular</option>
              </select>
            </div>

            {/* Course Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader className="w-12 h-12 animate-spin text-gray-900" />
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your filters or search query</p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-all font-medium shadow-sm hover:shadow active:scale-[0.98]"
                  >
                    Clear Filters
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
                      className="group bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
                    >
                      <div className="relative h-48 bg-gray-900 flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-white opacity-75" />
                        <div className="absolute top-3 right-3 px-3 py-1 bg-white rounded-full">
                          <span className="text-sm font-semibold text-gray-900 capitalize">
                            {course.difficulty || 'All Levels'}
                          </span>
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-gray-600 transition-colors text-lg">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          by {course.createdBy.name}
                          {course.createdBy.instructorVerification?.portfolio?.professionalTitle && (
                            <span className="text-gray-500">
                              {' • '}
                              {course.createdBy.instructorVerification.portfolio.professionalTitle}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-700 line-clamp-2 mb-4">
                          {course.description}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{course.statistics.enrollmentCount.toLocaleString()} students</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <BookOpen className="w-4 h-4" />
                            <span>{course.statistics.totalLessons} lessons</span>
                          </div>
                        </div>
                        {course.pricing.model === 'paid' ? (
                          <p className="text-2xl font-bold text-gray-900">
                            ${(course.pricing.amount / 100).toFixed(2)}
                          </p>
                        ) : (
                          <p className="text-2xl font-bold text-gray-900">Free</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                    >
                      Previous
                    </button>
                    <div className="flex gap-2">
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
                            className={`px-4 py-2 rounded-lg transition-all font-medium ${
                              pagination.page === pageNum
                                ? 'bg-gray-900 text-white shadow-sm'
                                : 'border-2 border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                      disabled={!pagination.hasMore}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
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
