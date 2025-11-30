/**
 * Course Details Page
 * Shows course information, modules, lessons, and enrollment
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  Users,
  Clock,
  CheckCircle,
  Lock,
  Play,
  ChevronDown,
  ChevronUp,
  Award,
  Loader,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks';
import { courseService, enrollmentService, voiceService } from '@/services';
import type { Course } from '@/types';

interface Enrollment {
  _id: string;
  progress: {
    completedLessons: Array<{ lesson: string }>;
    completionPercentage: number;
    totalTimeSpent: number;
    currentLesson?: string;
  };
}

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params?.courseId as string;
  const router = useRouter();
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  // Fetch course and enrollment data
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);

        // Fetch course details
        const courseRes = await courseService.getCourse(courseId);
        setCourse(courseRes);

        // Expand all modules by default
        if (courseRes.modules) {
          setExpandedModules(courseRes.modules.map((m: any) => m._id));
        }

        // Check if user is enrolled
        if (user) {
          try {
            const enrollmentRes = await enrollmentService.getEnrollment(courseId);
            setEnrollment(enrollmentRes);
          } catch (err) {
            // Not enrolled yet
            setEnrollment(null);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching course:', err);
        setError('Failed to load course details');
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseData();
    }
  }, [courseId, user]);

  const handleEnroll = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      setEnrolling(true);
      await courseService.enroll(courseId);

      // Refresh enrollment status
      const enrollmentRes = await enrollmentService.getEnrollment(courseId);
      setEnrollment(enrollmentRes);

      setEnrolling(false);
    } catch (err: any) {
      console.error('Error enrolling:', err);
      alert(err.response?.data?.error || 'Failed to enroll in course');
      setEnrolling(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  const startLesson = async (lesson: any, moduleId: string) => {
    if (!enrollment) {
      await handleEnroll();
      return;
    }

    try {
      // Create a new session linked to this lesson
      const sessionRes = await voiceService.createSession({
        lesson: lesson._id,
        enrollment: enrollment._id,
        title: lesson.title,
      });

      // Update current lesson in enrollment
      await enrollmentService.updateCurrentLesson(courseId, lesson._id);

      // Navigate to session details
      router.push(`/session/${sessionRes._id}`);
    } catch (err) {
      console.error('Error starting lesson:', err);
      alert('Failed to start lesson session');
    }
  };

  const isLessonCompleted = (lessonId: string) => {
    if (!enrollment) return false;
    return enrollment.progress.completedLessons.some(
      (cl) => cl.lesson.toString() === lessonId.toString()
    );
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || 'Course not found'}</p>
          <button
            onClick={() => router.push('/courses')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => router.push('/courses')}
            className="flex items-center space-x-2 text-white/90 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Catalog</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold border ${getLevelColor(
                    course.level
                  )}`}
                >
                  {course.level}
                </span>
                <span className="text-white/90 capitalize">{course.category}</span>
              </div>

              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-white/90 text-lg mb-6">{course.description}</p>

              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5" />
                  <span>{course.statistics?.totalLessons || 0} lessons</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>{course.statistics?.enrollmentCount || 0} students</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>
                    {Math.ceil((course.statistics?.totalDuration || 0) / 60)} hours
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-6 text-gray-900">
                {enrollment ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Your Progress</h3>
                      <Award className="w-6 h-6 text-yellow-500" />
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Completion</span>
                        <span className="font-semibold">
                          {Math.round(enrollment.progress.completionPercentage)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                          style={{
                            width: `${enrollment.progress.completionPercentage}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center mb-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-2xl font-bold text-blue-600">
                          {enrollment.progress.completedLessons.length}
                        </p>
                        <p className="text-xs text-gray-600">Completed</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3">
                        <p className="text-2xl font-bold text-purple-600">
                          {Math.round(enrollment.progress.totalTimeSpent / 60)}h
                        </p>
                        <p className="text-xs text-gray-600">Time Spent</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (enrollment.progress.currentLesson) {
                          // Continue current lesson
                          const currentLesson = course.modules
                            ?.flatMap((m: any) => m.lessons)
                            .find((l: any) => l._id === enrollment.progress.currentLesson);
                          if (currentLesson) {
                            startLesson(currentLesson, '');
                          }
                        }
                      }}
                      className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium flex items-center justify-center space-x-2"
                    >
                      <Play className="w-5 h-5" />
                      <span>Continue Learning</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Start Learning Today</h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Enroll in this course to access all lessons and start learning with AI-powered
                      voice tutoring.
                    </p>
                    <button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {enrolling ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          <span>Enrolling...</span>
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-5 h-5" />
                          <span>Enroll for Free</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Curriculum</h2>

          <div className="space-y-4">
            {course.modules && course.modules.length > 0 ? (
              course.modules.map((module: any, moduleIndex: number) => (
                <div key={module._id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Module Header */}
                  <button
                    onClick={() => toggleModule(module._id)}
                    className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">{moduleIndex + 1}</span>
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">{module.title}</h3>
                        <p className="text-sm text-gray-500">
                          {module.statistics?.totalLessons || module.lessons?.length || 0} lessons •{' '}
                          {Math.ceil((module.statistics?.totalDuration || 0) / 60)} min
                        </p>
                      </div>
                    </div>
                    {expandedModules.includes(module._id) ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {/* Lessons */}
                  {expandedModules.includes(module._id) && (
                    <div className="bg-white">
                      {module.lessons && module.lessons.length > 0 ? (
                        module.lessons.map((lesson: any) => {
                          const completed = isLessonCompleted(lesson._id);

                          return (
                            <div
                              key={lesson._id}
                              className="px-6 py-4 border-t border-gray-100 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 flex-1">
                                  {completed ? (
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                  ) : enrollment ? (
                                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                                  ) : (
                                    <Lock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                  )}
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                                    <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                                      <span>{lesson.duration} min</span>
                                      <span>•</span>
                                      <span className="capitalize">{lesson.lessonType}</span>
                                      {lesson.objectives && (
                                        <>
                                          <span>•</span>
                                          <span>{lesson.objectives.length} objectives</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <button
                                  onClick={() => startLesson(lesson, module._id)}
                                  className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center space-x-2 transition-colors ${
                                    enrollment
                                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  <Play className="w-4 h-4" />
                                  <span>
                                    {completed ? 'Review' : enrollment ? 'Start' : 'Preview'}
                                  </span>
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-6 py-4 text-center text-gray-500">
                          No lessons available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">No modules available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
