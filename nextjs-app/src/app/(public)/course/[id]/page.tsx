'use client';

/**
 * Public Course Detail Page
 * Shows full course information with enroll button
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Users,
  Clock,
  Star,
  CheckCircle,
  Play,
  Lock,
  Award,
  TrendingUp,
  Loader,
  AlertCircle,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { publicCourseService } from '@/services/public/publicCourseService';
import { enrollmentService } from '@/services';
import { useAuth } from '@/hooks/useAuth';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const courseId = params.id as string;

  const [course, setCourse] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  useEffect(() => {
    if (user && course) {
      checkEnrollment();
    }
  }, [user, course]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await publicCourseService.getCourseById(courseId);
      setCourse(data);
    } catch (err: any) {
      console.error('Error loading course:', err);
      setError(err.message || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    try {
      const enrollments = await enrollmentService.getMyEnrollments();
      const enrolled = enrollments.some((e: any) => e.course._id === courseId);
      setIsEnrolled(enrolled);
    } catch (error) {
      console.error('Error checking enrollment:', error);
    }
  };

  const handleEnroll = async () => {
    // Check if user is logged in
    if (!user) {
      // Store intended course for post-login enrollment
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('enrollAfterLogin', courseId);
      }
      // Redirect to login with return URL
      router.push(`/login?redirect=/course/${courseId}`);
      return;
    }

    try {
      setEnrolling(true);
      await enrollmentService.enrollInCourse(courseId);
      // Redirect to course in dashboard
      router.push(`/dashboard/courses/${courseId}`);
    } catch (err: any) {
      console.error('Enrollment error:', err);
      alert(err.response?.data?.error || 'Failed to enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Course Not Found</h3>
              <p className="text-red-700">{error || 'This course does not exist or is not publicly available.'}</p>
              <Link
                href="/browse"
                className="inline-block mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Browse All Courses
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isPaid = course.pricing.model === 'paid';
  const price = isPaid ? (course.pricing.amount / 100).toFixed(2) : 'Free';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Course Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
                  {course.category || 'General'}
                </span>
                {course.difficulty && (
                  <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium capitalize">
                    {course.difficulty}
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{course.title}</h1>
              <p className="text-xl text-blue-100 mb-6">{course.description}</p>

              {/* Stats */}
              <div className="flex flex-wrap gap-6 mb-6">
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-300 fill-current" />
                  <span className="font-semibold">
                    {course.statistics.averageRating > 0
                      ? course.statistics.averageRating.toFixed(1)
                      : 'New'}
                  </span>
                  {course.statistics.reviewCount > 0 && (
                    <span className="text-blue-100">({course.statistics.reviewCount} reviews)</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>{course.statistics.enrollmentCount.toLocaleString()} students</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>{course.statistics.totalDuration} min total</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5" />
                  <span>{course.statistics.totalLessons} lessons</span>
                </div>
              </div>

              {/* Instructor */}
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">
                    {course.createdBy.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-blue-100">Created by</p>
                  <p className="font-semibold">{course.createdBy.name}</p>
                  {course.createdBy.instructorVerification?.portfolio?.professionalTitle && (
                    <p className="text-sm text-blue-100">
                      {course.createdBy.instructorVerification.portfolio.professionalTitle}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Enroll Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-2xl p-6 sticky top-24">
                <div className="text-center mb-6">
                  {isPaid ? (
                    <div>
                      <p className="text-4xl font-bold text-gray-900 mb-2">${price}</p>
                      <p className="text-gray-600">One-time purchase</p>
                    </div>
                  ) : (
                    <p className="text-4xl font-bold text-green-600">Free</p>
                  )}
                </div>

                {isEnrolled ? (
                  <Link
                    href={`/dashboard/courses/${courseId}`}
                    className="block w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-center mb-4"
                  >
                    Go to Course
                  </Link>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling || authLoading}
                    className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                  >
                    {enrolling ? (
                      <span className="flex items-center justify-center space-x-2">
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Enrolling...</span>
                      </span>
                    ) : user ? (
                      'Enroll Now'
                    ) : (
                      'Login to Enroll'
                    )}
                  </button>
                )}

                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Lifetime access</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>AI-powered tutoring</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Voice learning sessions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Progress tracking</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column */}
          <div className="lg:col-span-2">
            {/* What You'll Learn */}
            {course.metadata.learningOutcomes.length > 0 && (
              <section className="bg-white rounded-xl shadow-md p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">What you'll learn</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {course.metadata.learningOutcomes.map((outcome: string, idx: number) => (
                    <div key={idx} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{outcome}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Course Content */}
            <section className="bg-white rounded-xl shadow-md p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Content</h2>
              <div className="space-y-4">
                {course.modules && course.modules.map((module: any, idx: number) => (
                  <div key={module._id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          Module {idx + 1}: {module.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {module.lessons?.length || 0} lessons
                      </div>
                    </div>
                    {module.lessons && module.lessons.length > 0 && (
                      <div className="divide-y divide-gray-200">
                        {module.lessons.map((lesson: any) => (
                          <div key={lesson._id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex items-center space-x-3">
                              {lesson.isPreview ? (
                                <Play className="w-5 h-5 text-blue-600" />
                              ) : (
                                <Lock className="w-5 h-5 text-gray-400" />
                              )}
                              <span className="text-gray-700">{lesson.title}</span>
                              {lesson.isPreview && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                  Preview
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">
                              {lesson.duration ? `${lesson.duration} min` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Prerequisites */}
            {course.metadata.prerequisites.length > 0 && (
              <section className="bg-white rounded-xl shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Prerequisites</h2>
                <ul className="space-y-3">
                  {course.metadata.prerequisites.map((prereq: string, idx: number) => (
                    <li key={idx} className="flex items-start space-x-3">
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{prereq}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1">
            {/* Instructor Profile */}
            {course.createdBy.instructorVerification?.portfolio && (
              <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <h3 className="font-bold text-gray-900 mb-4">About the Instructor</h3>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">
                      {course.createdBy.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{course.createdBy.name}</p>
                    {course.createdBy.instructorVerification.portfolio.professionalTitle && (
                      <p className="text-sm text-gray-600">
                        {course.createdBy.instructorVerification.portfolio.professionalTitle}
                      </p>
                    )}
                  </div>
                </div>
                {course.createdBy.instructorVerification.portfolio.bio && (
                  <p className="text-sm text-gray-700 mb-4">
                    {course.createdBy.instructorVerification.portfolio.bio}
                  </p>
                )}
                {course.createdBy.instructorVerification.portfolio.yearsOfExperience > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Award className="w-4 h-4" />
                    <span>{course.createdBy.instructorVerification.portfolio.yearsOfExperience} years of experience</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
