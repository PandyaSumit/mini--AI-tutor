'use client';

/**
 * Admin Instructors Page
 * Review and manage instructor applications
 */

import { useState, useEffect } from 'react';
import {
  GraduationCap,
  CheckCircle,
  XCircle,
  Loader,
  AlertCircle,
  ExternalLink,
  Award,
  Calendar,
  Mail,
  User,
} from 'lucide-react';
import { adminService } from '@/services/admin/adminService';

interface InstructorApplication {
  _id: string;
  name: string;
  email: string;
  instructorVerification: {
    status: string;
    appliedAt: Date;
    kycStatus: string;
    age: number;
    expertiseAreas: Array<{
      subject: string;
      category: string;
      verificationMethod: string;
      verificationScore?: number;
    }>;
    portfolio: {
      bio: string;
      professionalTitle: string;
      yearsOfExperience: number;
      certifications: Array<{
        name: string;
        issuer: string;
        url?: string;
      }>;
      socialLinks: {
        linkedin?: string;
        github?: string;
        website?: string;
      };
    };
  };
}

export default function AdminInstructorsPage() {
  const [applications, setApplications] = useState<InstructorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<InstructorApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getPendingInstructors();
      setApplications(data);
    } catch (err: any) {
      console.error('Error loading applications:', err);
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    if (!confirm('Are you sure you want to approve this instructor application?')) return;

    try {
      setProcessingId(userId);
      await adminService.approveInstructor(userId);
      alert('Instructor approved successfully!');
      await loadApplications();
    } catch (err: any) {
      console.error('Error approving instructor:', err);
      alert(err.message || 'Failed to approve instructor');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectClick = (application: InstructorApplication) => {
    setSelectedApp(application);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!selectedApp || !rejectReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setProcessingId(selectedApp._id);
      await adminService.rejectInstructor(selectedApp._id, rejectReason);
      alert('Instructor application rejected');
      setShowRejectModal(false);
      setSelectedApp(null);
      setRejectReason('');
      await loadApplications();
    } catch (err: any) {
      console.error('Error rejecting instructor:', err);
      alert(err.message || 'Failed to reject instructor');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading applications...</p>
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
              <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Applications</h3>
              <p className="text-red-700">{error}</p>
              <button
                onClick={loadApplications}
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
          <h1 className="text-3xl font-bold text-gray-900">Instructor Applications</h1>
          <p className="text-gray-600 mt-2">Review and manage instructor verification requests</p>
        </div>
        <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-700">
            {applications.length} Pending {applications.length !== 1 ? 'Applications' : 'Application'}
          </span>
        </div>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-100">
          <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No pending instructor applications</p>
        </div>
      ) : (
        <div className="space-y-6">
          {applications.map((app) => (
            <div key={app._id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              {/* Application Header */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{app.name}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-600 flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          {app.email}
                        </span>
                        <span className="text-sm text-gray-600 flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Applied {new Date(app.instructorVerification.appliedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        app.instructorVerification.kycStatus === 'verified'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      KYC: {app.instructorVerification.kycStatus}
                    </div>
                    {app.instructorVerification.age && (
                      <span className="text-sm text-gray-600">Age: {app.instructorVerification.age}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Application Details */}
              <div className="p-6 space-y-6">
                {/* Portfolio */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Professional Profile</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {app.instructorVerification.portfolio.professionalTitle && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Title: </span>
                        <span className="text-sm text-gray-900">
                          {app.instructorVerification.portfolio.professionalTitle}
                        </span>
                      </div>
                    )}
                    {app.instructorVerification.portfolio.yearsOfExperience > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Experience: </span>
                        <span className="text-sm text-gray-900">
                          {app.instructorVerification.portfolio.yearsOfExperience} years
                        </span>
                      </div>
                    )}
                    {app.instructorVerification.portfolio.bio && (
                      <div>
                        <span className="text-sm font-medium text-gray-700 block mb-1">Bio:</span>
                        <p className="text-sm text-gray-900">{app.instructorVerification.portfolio.bio}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expertise Areas */}
                {app.instructorVerification.expertiseAreas.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Expertise Areas</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {app.instructorVerification.expertiseAreas.map((area, idx) => (
                        <div key={idx} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{area.subject}</p>
                              <p className="text-sm text-gray-600">{area.category}</p>
                              <p className="text-xs text-purple-600 mt-1">
                                Verified by: {area.verificationMethod}
                              </p>
                            </div>
                            {area.verificationScore && (
                              <div className="text-right">
                                <p className="text-lg font-bold text-purple-600">{area.verificationScore}%</p>
                                <p className="text-xs text-gray-500">Score</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {app.instructorVerification.portfolio.certifications.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Certifications</h4>
                    <div className="space-y-2">
                      {app.instructorVerification.portfolio.certifications.map((cert, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-blue-50 rounded-lg p-3">
                          <div className="flex items-center space-x-3">
                            <Award className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-medium text-gray-900">{cert.name}</p>
                              <p className="text-sm text-gray-600">{cert.issuer}</p>
                            </div>
                          </div>
                          {cert.url && (
                            <a
                              href={cert.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <ExternalLink className="w-5 h-5" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social Links */}
                {Object.values(app.instructorVerification.portfolio.socialLinks).some((link) => link) && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Social Links</h4>
                    <div className="flex flex-wrap gap-3">
                      {app.instructorVerification.portfolio.socialLinks.linkedin && (
                        <a
                          href={app.instructorVerification.portfolio.socialLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span className="text-sm font-medium">LinkedIn</span>
                        </a>
                      )}
                      {app.instructorVerification.portfolio.socialLinks.github && (
                        <a
                          href={app.instructorVerification.portfolio.socialLinks.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span className="text-sm font-medium">GitHub</span>
                        </a>
                      )}
                      {app.instructorVerification.portfolio.socialLinks.website && (
                        <a
                          href={app.instructorVerification.portfolio.socialLinks.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span className="text-sm font-medium">Website</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleRejectClick(app)}
                    disabled={processingId === app._id}
                    className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle className="w-5 h-5" />
                    <span className="font-medium">Reject</span>
                  </button>
                  <button
                    onClick={() => handleApprove(app._id)}
                    disabled={processingId === app._id}
                    className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingId === app._id ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    <span className="font-medium">Approve as Instructor</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Application</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting {selectedApp.name}'s instructor application:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedApp(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={processingId === selectedApp._id || !rejectReason.trim()}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingId === selectedApp._id ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
