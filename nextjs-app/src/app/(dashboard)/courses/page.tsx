/**
 * Courses Page
 * Browse and enroll in courses
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { courseService } from "@/services/course";
import {
  BookOpen,
  Users,
  Clock,
  Star,
  TrendingUp,
  Filter,
  Search,
  GraduationCap,
} from "lucide-react";
import type { Course } from "@/types";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const data = await courseService.getCourses();
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching courses:", error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    "all",
    "programming",
    "mathematics",
    "science",
    "languages",
    "business",
  ];

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#212121]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-slate-200 dark:bg-[#2a2a2a] rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-72 rounded-xl bg-slate-100 dark:bg-[#1a1a1a] border border-slate-100 dark:border-[#2a2a2a]"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#212121]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-[#f5f5f5]">
              Course Catalog
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-[#bdbdbd]">
              Explore structured learning paths and AI-first courses curated for
              focused practice.
            </p>
          </div>

          {courses.length > 0 && (
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-[#2a2a2a] bg-white/80 dark:bg-[#1a1a1a]/80 px-4 py-2 text-xs text-slate-600 dark:text-[#d6d6d6]">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-slate-50 dark:bg-[#f5f5f5] dark:text-[#212121]">
                <BookOpen className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-medium">Learning activity</span>
                <span className="text-[11px] text-slate-400 dark:text-[#9e9e9e]">
                  {courses.length} active courses this week
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Search + Filters */}
        <div className="mb-8 space-y-4 lg:flex lg:items-center lg:justify-between lg:space-y-0 lg:gap-6">
          {/* Search */}
          <div className="relative w-full max-w-xl">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-[#9e9e9e]"
              strokeWidth={2}
            />
            <input
              type="text"
              placeholder="Search by course, topic, or instructor"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-[#2a2a2a] bg-white/90 dark:bg-[#1a1a1a] pl-11 pr-4 py-2.5 text-sm text-slate-900 dark:text-[#f5f5f5] placeholder:text-slate-400 dark:placeholder:text-[#8c8c8c] shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/80 dark:focus:ring-[#f5f5f5]/80 focus:border-transparent transition-all"
            />
          </div>

          {/* Categories */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1 lg:justify-end">
            <div className="hidden sm:flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-[#bdbdbd]">
              <Filter className="h-4 w-4" strokeWidth={2} />
              <span>Filter</span>
            </div>
            <div className="flex items-center gap-2">
              {categories.map((category) => {
                const isActive = selectedCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={[
                      "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border",
                      isActive
                        ? "bg-slate-900 text-slate-50 dark:bg-[#f5f5f5] dark:text-[#212121] border-slate-900 dark:border-[#f5f5f5] shadow-sm"
                        : "bg-white dark:bg-[#1a1a1a] text-slate-600 dark:text-[#d6d6d6] border-slate-200 dark:border-[#2a2a2a] hover:bg-slate-100 dark:hover:bg-[#242424]",
                    ].join(" ")}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a]">
              <BookOpen
                className="h-10 w-10 text-slate-400 dark:text-[#9e9e9e]"
                strokeWidth={1.5}
              />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-[#f5f5f5] mb-2">
              {searchQuery ? "No courses found" : "No courses available yet"}
            </h2>
            <p className="max-w-md text-sm text-slate-500 dark:text-[#bdbdbd] mb-6">
              {searchQuery
                ? "Try adjusting your search or filters. You can search by course title, description, or instructor."
                : "We’re still curating the best structured courses. Check back soon or suggest what you’d like to learn."}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between text-xs text-slate-500 dark:text-[#bdbdbd]">
              <p>
                Showing{" "}
                <span className="font-medium text-slate-700 dark:text-[#f5f5f5]">
                  {filteredCourses.length}
                </span>{" "}
                {filteredCourses.length === 1 ? "course" : "courses"}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => (
              <Link
  key={course._id}
  href={`/courses/${course._id}`}
  className="
    group flex flex-col overflow-hidden rounded-2xl
    border border-slate-200/80 dark:border-[#3a3a3a]
    bg-white/90 dark:bg-[#2a2a2a]
    shadow-sm dark:shadow-lg
    hover:shadow-md dark:hover:shadow-xl
    hover:border-slate-300 dark:hover:border-[#4a4a4a]
    transition-all duration-200
  "
>
  {/* Thumbnail */}
  <div
    className="
      relative aspect-video overflow-hidden
      bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700
      dark:from-[#2a2a2a] dark:via-[#343434] dark:to-[#262626]
    "
  >
    <div className="absolute inset-0 opacity-15 group-hover:opacity-25 transition-opacity bg-[radial-gradient(circle_at_top,_#ffffff,_transparent_60%)]" />
    <div className="flex h-full items-center justify-center">
      <GraduationCap
        className="h-12 w-12 text-slate-100/80"
        strokeWidth={1.5}
      />
    </div>
  </div>

  {/* Content */}
  <div className="flex flex-1 flex-col px-4 pt-4 pb-3">
    {/* Category + Instructor */}
    <div className="mb-3 flex items-center justify-between gap-2">
      {course.category && (
        <span
          className="
            inline-flex items-center rounded-full
            bg-slate-100 dark:bg-[#3a3a3a]
            px-2.5 py-1 text-[11px] font-medium
            text-slate-600 dark:text-[#f0f0f0]
            border border-slate-200 dark:border-[#4a4a4a]
          "
        >
          {course.category}
        </span>
      )}
      {course.instructor && (
        <p className="truncate text-[11px] text-slate-500 dark:text-[#cfcfcf]">
          by{" "}
          <span className="font-medium text-slate-600 dark:text-[#ffffff]">
            {course.instructor}
          </span>
        </p>
      )}
    </div>

    {/* Title */}
    <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-slate-900 dark:text-[#ffffff] group-hover:text-slate-900 dark:group-hover:text-white">
      {course.title}
    </h3>

    {/* Description */}
    {course.description && (
      <p className="mb-4 line-clamp-2 text-xs text-slate-500 dark:text-[#c2c2c2]">
        {course.description}
      </p>
    )}

    {/* Stats */}
    <div className="mb-3 flex items-center gap-4 text-[11px] text-slate-500 dark:text-[#c2c2c2]">
      <div className="inline-flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" strokeWidth={2} />
        <span>{course.duration || "8"} weeks</span>
      </div>
      <div className="inline-flex items-center gap-1.5">
        <BookOpen className="h-3.5 w-3.5" strokeWidth={2} />
        <span>{course.lessons?.length || 0} lessons</span>
      </div>
    </div>

    {/* Rating + Enrolled */}
    <div className="mt-auto flex items-center justify-between border-t border-slate-100 dark:border-[#3a3a3a] pt-3">
      <div className="flex items-center gap-1.5">
        <Star
          className="h-3.5 w-3.5 text-amber-400 fill-amber-400"
          strokeWidth={2}
        />
        <span className="text-xs font-semibold text-slate-900 dark:text-[#ffffff]">
          {course.rating || "4.5"}
        </span>
        <span className="text-[11px] text-slate-400 dark:text-[#a0a0a0]">
          ({course.enrolledCount || 0})
        </span>
      </div>
      <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-[#c2c2c2]">
        <Users className="h-3.5 w-3.5" strokeWidth={2} />
        <span>{course.enrolledCount || 0} enrolled</span>
      </div>
    </div>
  </div>

  {/* CTA */}
  <div className="px-4 pb-4 pt-1">
    <div className="w-full rounded-lg bg-slate-900 text-center text-xs font-medium text-slate-50 py-2.5 dark:bg-[#f5f5f5] dark:text-[#212121] group-hover:shadow-sm transition-all">
      {course.isEnrolled ? "Continue learning" : "Enroll now"}
    </div>
  </div>
</Link>

              ))}
            </div>
          </>
        )}

        {/* Featured Section */}
        {courses.length > 0 && (
          <div className="mt-10 rounded-2xl border border-violet-100/70 dark:border-[#2a2a2a] bg-gradient-to-br from-violet-50 via-slate-50 to-slate-100 dark:from-[#1a1a1a] dark:via-[#212121] dark:to-[#1a1a1a] px-6 py-6 sm:px-8 sm:py-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-slate-50 dark:bg-[#f5f5f5] dark:text-[#212121]">
                  <TrendingUp className="h-5 w-5" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-[#f5f5f5]">
                    Popular this week
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#bdbdbd]">
                    See where most learners are spending their time right now.
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#9e9e9e]">
                Based on recent enrollments and session activity.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
              {courses.slice(0, 3).map((course) => (
                <Link
                  key={course._id}
                  href={`/courses/${course._id}`}
                  className="group rounded-xl border border-violet-100/80 dark:border-[#2a2a2a] bg-white/90 dark:bg-[#1a1a1a] px-4 py-3 text-left hover:border-violet-200 dark:hover:border-[#3a3a3a] hover:shadow-sm transition-all"
                >
                  <h4 className="mb-1 line-clamp-2 text-sm font-semibold text-slate-900 dark:text-[#f5f5f5] group-hover:text-slate-900 dark:group-hover:text-white">
                    {course.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-[#bdbdbd]">
                    {course.instructor || "Expert instructor"}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
