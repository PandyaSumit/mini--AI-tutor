/**
 * Course Details Page
 * Shows course information, modules, lessons, and enrollment
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
} from "lucide-react";
import { useAuth } from "@/hooks";
import { courseService, enrollmentService, voiceService, paymentService } from "@/services";
import type { Course } from "@/types";

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

        const courseRes = await courseService.getCourse(courseId);
        setCourse(courseRes);

        if (courseRes.modules) {
          setExpandedModules(courseRes.modules.map((m: any) => m._id));
        }

        if (user) {
          try {
            const enrollmentRes = await enrollmentService.getEnrollment(courseId);
            setEnrollment(enrollmentRes);
          } catch {
            setEnrollment(null);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching course:", err);
        setError("Failed to load course details");
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseData();
    }
  }, [courseId, user]);

  const handleEnroll = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    // Check if course is paid - redirect to Stripe checkout
    if (course && course.pricing?.model === 'paid') {
      try {
        setEnrolling(true);
        const response = await paymentService.createCourseCheckout(courseId);
        // Redirect to Stripe Checkout
        paymentService.redirectToCheckout(response.url);
      } catch (err: any) {
        console.error("Payment error:", err);
        alert(err.message || "Failed to start checkout");
        setEnrolling(false);
      }
      return;
    }

    // Free course - enroll directly
    try {
      setEnrolling(true);
      await courseService.enroll(courseId);

      const enrollmentRes = await enrollmentService.getEnrollment(courseId);
      setEnrollment(enrollmentRes);

      setEnrolling(false);
    } catch (err: any) {
      console.error("Error enrolling:", err);
      alert(err.response?.data?.error || "Failed to enroll in course");
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
      const sessionRes = await voiceService.createSession({
        lesson: lesson._id,
        enrollment: enrollment._id,
        title: lesson.title,
      });

      await enrollmentService.updateCurrentLesson(courseId, lesson._id);

      router.push(`/session/${sessionRes._id}`);
    } catch (err) {
      console.error("Error starting lesson:", err);
      alert("Failed to start lesson session");
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
      case "beginner":
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700";
      case "advanced":
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-[#2a2a2a] dark:text-[#e0e0e0] dark:border-[#3a3a3a]";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#212121] flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-10 h-10 animate-spin text-slate-800 dark:text-[#f5f5f5] mx-auto mb-4" />
          <p className="text-slate-600 dark:text-[#c2c2c2]">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#212121] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-4">
            {error || "Course not found"}
          </p>
          <button
            onClick={() => router.push("/courses")}
            className="px-6 py-2 rounded-lg bg-slate-900 text-white dark:bg-[#f5f5f5] dark:text-[#212121] hover:bg-black/90 dark:hover:bg-white transition-colors text-sm font-medium"
          >
            Back to catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#212121]">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-[#2a2a2a] bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push("/courses")}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-[#c2c2c2] hover:text-slate-900 dark:hover:text-white mb-5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to catalog</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: main info */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold border inline-flex items-center gap-1 ${getLevelColor(
                    course.level
                  )}`}
                >
                  <span className="capitalize">{course.level || "level"}</span>
                </span>
                {course.category && (
                  <span className="text-xs text-slate-500 dark:text-[#bdbdbd] capitalize px-2 py-1 rounded-full border border-slate-200 dark:border-[#3a3a3a] bg-slate-50 dark:bg-[#242424]">
                    {course.category}
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-[#f5f5f5] mb-3">
                {course.title}
              </h1>
              {course.description && (
                <p className="text-sm text-slate-600 dark:text-[#c2c2c2] max-w-2xl mb-5">
                  {course.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-[#bdbdbd]">
                <div className="inline-flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>
                    {course.statistics?.totalLessons || 0} lessons
                  </span>
                </div>
                <div className="inline-flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>
                    {course.statistics?.enrollmentCount || 0} learners
                  </span>
                </div>
                <div className="inline-flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    {Math.ceil((course.statistics?.totalDuration || 0) / 60)} hours
                  </span>
                </div>
              </div>
            </div>

            {/* Right: enrollment card */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl border border-slate-200 dark:border-[#2a2a2a] bg-white/95 dark:bg-[#1a1a1a] px-5 py-5 shadow-sm">
                {enrollment ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-[#f5f5f5]">
                        Your progress
                      </h3>
                      <Award className="w-5 h-5 text-yellow-400" />
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500 dark:text-[#bdbdbd]">
                          Completion
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {Math.round(enrollment.progress.completionPercentage)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-[#2a2a2a] rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-purple-600 h-2.5 rounded-full transition-all"
                          style={{
                            width: `${enrollment.progress.completionPercentage}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-center mb-4">
                      <div className="rounded-lg bg-slate-50 dark:bg-[#252525] px-3 py-3">
                        <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                          {enrollment.progress.completedLessons.length}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-[#bdbdbd]">
                          Lessons done
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-50 dark:bg-[#252525] px-3 py-3">
                        <p className="text-xl font-semibold text-purple-600 dark:text-purple-400">
                          {Math.round(enrollment.progress.totalTimeSpent / 60)}h
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-[#bdbdbd]">
                          Time spent
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (enrollment.progress.currentLesson) {
                          const currentLesson = course.modules
                            ?.flatMap((m: any) => m.lessons)
                            .find(
                              (l: any) => l._id === enrollment.progress.currentLesson
                            );
                          if (currentLesson) startLesson(currentLesson, "");
                        }
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 text-white dark:bg-[#f5f5f5] dark:text-[#212121] hover:bg-black dark:hover:bg-white transition-colors text-sm font-medium py-2.5"
                    >
                      <Play className="w-4 h-4" />
                      <span>Continue learning</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-[#f5f5f5] mb-2.5">
                      Start learning today
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-[#bdbdbd] mb-5">
                      Enroll to unlock all modules, lessons and AI-powered voice
                      tutoring for this course.
                    </p>
                    <button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-colors text-sm font-medium py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {enrolling ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          <span>Enrolling...</span>
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-4 h-4" />
                          <span>Enroll for free</span>
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
        <div className="rounded-2xl border border-slate-200 dark:border-[#2a2a2a] bg-white/95 dark:bg-[#1a1a1a] shadow-sm px-5 py-5 sm:px-6 sm:py-6 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-[#f5f5f5] mb-4">
            Course curriculum
          </h2>

          <div className="space-y-4">
            {course.modules && course.modules.length > 0 ? (
              course.modules.map((module: any, moduleIndex: number) => (
                <div
                  key={module._id}
                  className="border border-slate-200 dark:border-[#2a2a2a] rounded-xl overflow-hidden"
                >
                  {/* Module Header */}
                  <button
                    onClick={() => toggleModule(module._id)}
                    className="w-full px-4 sm:px-5 py-4 bg-slate-50 dark:bg-[#222222] hover:bg-slate-100 dark:hover:bg-[#262626] transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-900 text-white dark:bg-[#f5f5f5] dark:text-[#212121] flex items-center justify-center text-sm font-semibold">
                        {moduleIndex + 1}
                      </div>
                      <div className="text-left">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-[#f5f5f5]">
                          {module.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-[#bdbdbd]">
                          {module.statistics?.totalLessons ||
                            module.lessons?.length ||
                            0}{" "}
                          lessons •{" "}
                          {Math.ceil(
                            (module.statistics?.totalDuration || 0) / 60
                          )}{" "}
                          min
                        </p>
                      </div>
                    </div>
                    {expandedModules.includes(module._id) ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 dark:text-[#9e9e9e]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 dark:text-[#9e9e9e]" />
                    )}
                  </button>

                  {/* Lessons */}
                  {expandedModules.includes(module._id) && (
                    <div className="bg-white dark:bg-[#1a1a1a]">
                      {module.lessons && module.lessons.length > 0 ? (
                        module.lessons.map((lesson: any) => {
                          const completed = isLessonCompleted(lesson._id);

                          return (
                            <div
                              key={lesson._id}
                              className="px-4 sm:px-5 py-4 border-t border-slate-100 dark:border-[#2a2a2a] hover:bg-slate-50 dark:hover:bg-[#222222] transition-colors"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center gap-3 flex-1">
                                  {completed ? (
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                  ) : enrollment ? (
                                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-[#3a3a3a] flex-shrink-0" />
                                  ) : (
                                    <Lock className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                  )}
                                  <div className="flex-1">
                                    <h4 className="text-sm font-medium text-slate-900 dark:text-[#f5f5f5]">
                                      {lesson.title}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-[#bdbdbd] mt-1">
                                      <span>{lesson.duration} min</span>
                                      <span>•</span>
                                      <span className="capitalize">
                                        {lesson.lessonType}
                                      </span>
                                      {lesson.objectives && (
                                        <>
                                          <span>•</span>
                                          <span>
                                            {lesson.objectives.length} objectives
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <button
                                  onClick={() => startLesson(lesson, module._id)}
                                  className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                                    enrollment
                                      ? "bg-slate-900 text-white hover:bg-black dark:bg-[#f5f5f5] dark:text-[#212121] dark:hover:bg-white"
                                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-[#2a2a2a] dark:text-[#f5f5f5] dark:hover:bg-[#333333]"
                                  }`}
                                >
                                  <Play className="w-4 h-4" />
                                  <span>
                                    {completed ? "Review" : enrollment ? "Start" : "Preview"}
                                  </span>
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-6 py-4 text-center text-sm text-slate-500 dark:text-[#bdbdbd]">
                          No lessons available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-sm text-slate-500 dark:text-[#bdbdbd] py-8">
                No modules available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
