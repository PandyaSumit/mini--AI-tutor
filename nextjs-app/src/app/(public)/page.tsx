'use client';

/**
 * Public Homepage (Landing Page)
 * Main entry point for unauthenticated users
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Users,
  Award,
  TrendingUp,
  ArrowRight,
  Star,
  Clock,
  Play,
} from 'lucide-react';
import { publicCourseService } from '@/services/public/publicCourseService';

export default function HomePage() {
  const [featuredCourses, setFeaturedCourses] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalCourses: 0, totalEnrollments: 0, totalInstructors: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [courses, platformStats] = await Promise.all([
        publicCourseService.getFeaturedCourses(),
        publicCourseService.getPlatformStats(),
      ]);
      setFeaturedCourses(courses);
      setStats(platformStats);
    } catch (error) {
      console.error('Error loading homepage data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Learn Anything with AI-Powered Personalized Education
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Discover thousands of courses taught by expert instructors. Get personalized AI tutoring, voice sessions, and adaptive learning paths.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/browse"
                className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-center flex items-center justify-center space-x-2"
              >
                <span>Browse Courses</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/signup"
                className="px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition-all font-semibold text-center"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white border-b border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-2">
                {stats.totalCourses.toLocaleString()}+
              </p>
              <p className="text-gray-600">Courses Available</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-2">
                {stats.totalEnrollments.toLocaleString()}+
              </p>
              <p className="text-gray-600">Active Learners</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-pink-600" />
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-2">
                {stats.totalInstructors.toLocaleString()}+
              </p>
              <p className="text-gray-600">Expert Instructors</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Courses
            </h2>
            <p className="text-xl text-gray-600">
              Start learning from our most popular courses
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredCourses.slice(0, 8).map((course) => (
                <Link
                  key={course._id}
                  href={`/course/${course._id}`}
                  className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden border border-gray-100"
                >
                  <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-white opacity-75" />
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {course.createdBy.name}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{course.statistics.enrollmentCount}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{course.statistics.totalLessons} lessons</span>
                      </div>
                    </div>
                    {course.pricing.model === 'paid' ? (
                      <p className="mt-3 font-bold text-blue-600">
                        ${(course.pricing.amount / 100).toFixed(2)}
                      </p>
                    ) : (
                      <p className="mt-3 font-bold text-green-600">Free</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              href="/browse"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              <span>View All Courses</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose AI Tutor?
            </h2>
            <p className="text-xl text-gray-600">
              The future of personalized learning
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Adaptive Learning Paths
              </h3>
              <p className="text-gray-600">
                AI-powered personalized learning paths that adapt to your pace and style
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-md">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Play className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Voice AI Sessions
              </h3>
              <p className="text-gray-600">
                Practice with voice-enabled AI tutor for interactive learning
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-md">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Expert Instructors
              </h3>
              <p className="text-gray-600">
                Learn from verified industry professionals and subject matter experts
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Learning?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of learners achieving their goals with AI-powered education
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg"
          >
            Sign Up for Free
          </Link>
        </div>
      </section>
    </div>
  );
}
