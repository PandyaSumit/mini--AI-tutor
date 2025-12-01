'use client';

/**
 * Admin Courses Page
 * Review and manage course quality submissions
 */

import { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle,
  XCircle,
  Loader,
  AlertCircle,
  User,
  Calendar,
  Users as UsersIcon,
  Target,
  AlertTriangle,
} from 'lucide-react';
import { adminService } from '@/services/admin/adminService';

interface CourseReview {
  _id: string;
  title: string;
  description: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  courseType: string;
  visibility: string;
  statistics: {
    totalModules: number;
    totalLessons: number;
    totalEnrollments: number;
  };
  metadata: {
    learningOutcomes: string[];
    prerequisites: string[];
  };
  marketplace: {
    hasPassedQualityReview: boolean;
    qualityIssues: string[];
  };
  createdAt: Date;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseReview | null>(null);
  const [rejectIssues, setRejectIssues] = useState<string[]>([]);
  const [customIssue, setCustomIssue] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const commonIssues = [
    'Insufficient content (less than 10 lessons)',
    'Poor description quality',
    'Missing learning outcomes',
    'Incomplete modules',
    'Content not aligned with title/description',
    'Duplicate or spam content',
    'Inappropriate content',
    'Missing prerequisites information',
  ];

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getPendingCourses();
      setCourses(data);
    } catch (err: any) {
      console.error('Error loading courses:', err);
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (courseId: string) => {
    if (!confirm('Are you sure you want to approve this course for the marketplace?')) return;

    try {
      setProcessingId(courseId);
      await adminService.approveCourse(courseId);
      alert('Course approved successfully!');
      await loadCourses();
    } catch (err: any) {
      console.error('Error approving course:', err);
      alert(err.message || 'Failed to approve course');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectClick = (course: CourseReview) => {
    setSelectedCourse(course);
    setRejectIssues([]);
    setCustomIssue('');
    setShowRejectModal(true);
  };

  const toggleIssue = (issue: string) => {
    setRejectIssues((prev) =>
      prev.includes(issue) ? prev.filter((i) => i !== issue) : [...prev, issue]
    );
  };

  const handleRejectSubmit = async () => {
    if (!selectedCourse) return;

    const allIssues = [...rejectIssues];
    if (customIssue.trim()) {
      allIssues.push(customIssue.trim());
    }

    if (allIssues.length === 0) {
      alert('Please select or enter at least one quality issue');
      return;
    }

    try {
      setProcessingId(selectedCourse._id);
      await adminService.rejectCourse(selectedCourse._id, allIssues);
      alert('Course rejected with feedback');
      setShowRejectModal(false);
      setSelectedCourse(null);
      setRejectIssues([]);
      setCustomIssue('');
      await loadCourses();
    } catch (err: any) {
      console.error('Error rejecting course:', err);
      alert(err.message || 'Failed to reject course');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Courses</h3>
              <p className="text-red-700">{error}</p>
              <button
                onClick={loadCourses}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Course Quality Review</h1>
          <p className="text-gray-600 mt-2">Review courses pending marketplace approval</p>
        </div>
        <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-700">
            {courses.length} Pending {courses.length !== 1 ? 'Reviews' : 'Review'}
          </span>
        </div>
      </div>

      {/* Courses List */}
      {courses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-100">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No courses pending review</p>
        </div>
      ) : (
        <div className="space-y-6">
          {courses.map((course) => (
            <div key={course._id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              {/* Course Header */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="text-sm text-gray-600 flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {course.createdBy.name}
                      </span>
                      <span className="text-sm text-gray-600 flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Created {new Date(course.createdAt).toLocaleDateString()}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          course.courseType === 'marketplace'
                            ? 'bg-purple-100 text-purple-700'
                            : course.courseType === 'flagship'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {course.courseType}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Details */}
              <div className="p-6 space-y-6">
                {/* Description */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                  <p className="text-gray-900">{course.description}</p>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <BookOpen className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-600">{course.statistics.totalModules}</p>
                    <p className="text-sm text-gray-600">Modules</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <Target className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-600">{course.statistics.totalLessons}</p>
                    <p className="text-sm text-gray-600">Lessons</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <UsersIcon className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">{course.statistics.totalEnrollments}</p>
                    <p className="text-sm text-gray-600">Enrollments</p>
                  </div>
                </div>

                {/* Learning Outcomes */}
                {course.metadata.learningOutcomes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Learning Outcomes</h4>
                    <ul className="space-y-2">
                      {course.metadata.learningOutcomes.map((outcome, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-900">{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Prerequisites */}
                {course.metadata.prerequisites.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Prerequisites</h4>
                    <ul className="space-y-2">
                      {course.metadata.prerequisites.map((prereq, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-900">{prereq}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Quality Issues (if any from previous reviews) */}
                {course.marketplace.qualityIssues.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-red-900 mb-2 flex items-center">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      Previous Quality Issues
                    </h4>
                    <ul className="space-y-1">
                      {course.marketplace.qualityIssues.map((issue, idx) => (
                        <li key={idx} className="text-sm text-red-700">
                          • {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleRejectClick(course)}
                    disabled={processingId === course._id}
                    className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle className="w-5 h-5" />
                    <span className="font-medium">Reject</span>
                  </button>
                  <button
                    onClick={() => handleApprove(course._id)}
                    disabled={processingId === course._id}
                    className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingId === course._id ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    <span className="font-medium">Approve for Marketplace</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Course Quality Review</h3>
            <p className="text-gray-600 mb-4">
              Select quality issues for <span className="font-semibold">{selectedCourse.title}</span>:
            </p>

            {/* Common Issues */}
            <div className="space-y-2 mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">Common Issues:</p>
              {commonIssues.map((issue) => (
                <label key={issue} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rejectIssues.includes(issue)}
                    onChange={() => toggleIssue(issue)}
                    className="mt-1 w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="text-gray-900">{issue}</span>
                </label>
              ))}
            </div>

            {/* Custom Issue */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Custom Issue:</label>
              <textarea
                value={customIssue}
                onChange={(e) => setCustomIssue(e.target.value)}
                placeholder="Enter a custom quality issue (optional)..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Selected Issues Preview */}
            {(rejectIssues.length > 0 || customIssue.trim()) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm font-semibold text-red-900 mb-2">
                  Issues to be sent to instructor:
                </p>
                <ul className="space-y-1">
                  {rejectIssues.map((issue, idx) => (
                    <li key={idx} className="text-sm text-red-700">
                      • {issue}
                    </li>
                  ))}
                  {customIssue.trim() && (
                    <li className="text-sm text-red-700">• {customIssue.trim()}</li>
                  )}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedCourse(null);
                  setRejectIssues([]);
                  setCustomIssue('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={
                  processingId === selectedCourse._id ||
                  (rejectIssues.length === 0 && !customIssue.trim())
                }
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingId === selectedCourse._id ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
