'use client';

/**
 * Instructor Verification Page
 * Onboarding flow for instructors to complete verification
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Upload,
  CheckCircle2,
  AlertCircle,
  User,
  Briefcase,
  Award,
  FileText,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export default function InstructorVerificationPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [verificationData, setVerificationData] = useState({
    // Personal Info
    professionalTitle: '',
    yearsOfExperience: '',
    bio: '',

    // Expertise Areas
    expertiseAreas: [] as Array<{
      subject: string;
      category: string;
    }>,

    // Documents
    identityDocument: null as File | null,
    certifications: [] as File[],
  });

  const steps: VerificationStep[] = [
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Tell us about your professional background',
      status: currentStep > 0 ? 'completed' : currentStep === 0 ? 'in_progress' : 'pending',
    },
    {
      id: 'expertise',
      title: 'Expertise Areas',
      description: 'Select your teaching subjects',
      status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'in_progress' : 'pending',
    },
    {
      id: 'verification',
      title: 'Identity Verification',
      description: 'Upload ID for age & identity verification',
      status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'in_progress' : 'pending',
    },
  ];

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // TODO: Implement API call to submit verification
      console.log('Verification data:', verificationData);

      // Redirect to instructor dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit verification');
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Professional Title
              </label>
              <input
                type="text"
                value={verificationData.professionalTitle}
                onChange={(e) =>
                  setVerificationData({
                    ...verificationData,
                    professionalTitle: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900"
                placeholder="e.g., Mathematics Professor, Software Engineer"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Years of Experience
              </label>
              <select
                value={verificationData.yearsOfExperience}
                onChange={(e) =>
                  setVerificationData({
                    ...verificationData,
                    yearsOfExperience: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900"
              >
                <option value="">Select experience</option>
                <option value="0-2">0-2 years</option>
                <option value="3-5">3-5 years</option>
                <option value="6-10">6-10 years</option>
                <option value="10+">10+ years</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Professional Bio
              </label>
              <textarea
                value={verificationData.bio}
                onChange={(e) =>
                  setVerificationData({
                    ...verificationData,
                    bio: e.target.value,
                  })
                }
                rows={6}
                maxLength={2000}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 resize-none"
                placeholder="Share your teaching philosophy, experience, and what makes you a great instructor..."
              />
              <p className="text-xs text-gray-500 mt-2">
                {verificationData.bio.length}/2000 characters
              </p>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Select the subjects you want to teach. You'll need to demonstrate expertise in each area.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {['Mathematics', 'Science', 'Programming', 'Business', 'Languages', 'Arts'].map(
                  (subject) => {
                    const isSelected = verificationData.expertiseAreas.some(
                      (area) => area.subject === subject
                    );
                    return (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setVerificationData({
                              ...verificationData,
                              expertiseAreas: verificationData.expertiseAreas.filter(
                                (area) => area.subject !== subject
                              ),
                            });
                          } else {
                            setVerificationData({
                              ...verificationData,
                              expertiseAreas: [
                                ...verificationData.expertiseAreas,
                                { subject, category: 'general' },
                              ],
                            });
                          }
                        }}
                        className={`p-4 rounded-xl border-2 transition-all text-center ${
                          isSelected
                            ? 'border-gray-900 bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="text-sm font-semibold text-gray-900">{subject}</div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-gray-900 mx-auto mt-2" />
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {verificationData.expertiseAreas.length > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-sm text-blue-900">
                  ✓ You've selected {verificationData.expertiseAreas.length} subject area(s). You'll be
                  able to publish courses in these subjects after verification is approved.
                </p>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-amber-900 mb-1">
                    Why we need ID verification
                  </h3>
                  <p className="text-sm text-amber-800">
                    We verify all instructors to ensure student safety and platform integrity. Your
                    documents are processed securely and only used for verification purposes.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Identity Document
              </label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-gray-300 transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Upload Government-Issued ID
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Passport, Driver's License, or National ID (Max 5MB)
                </p>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setVerificationData({
                        ...verificationData,
                        identityDocument: e.target.files[0],
                      });
                    }
                  }}
                  className="hidden"
                  id="id-upload"
                />
                <label
                  htmlFor="id-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-gray-800 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Choose File
                </label>
                {verificationData.identityDocument && (
                  <p className="text-sm text-green-600 mt-3 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {verificationData.identityDocument.name}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Certifications (Optional)
              </label>
              <p className="text-xs text-gray-600 mb-3">
                Upload any teaching certifications, degrees, or credentials to boost your profile
              </p>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-gray-300 transition-colors">
                <FileText className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <input
                  type="file"
                  accept=".pdf,image/*"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      setVerificationData({
                        ...verificationData,
                        certifications: Array.from(e.target.files),
                      });
                    }
                  }}
                  className="hidden"
                  id="cert-upload"
                />
                <label
                  htmlFor="cert-upload"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-900 rounded-lg text-sm font-medium cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  Upload Certificates
                </label>
                {verificationData.certifications.length > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    {verificationData.certifications.length} file(s) selected
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Instructor Verification</h1>
          <p className="text-gray-600">
            Complete these steps to start teaching and earning on our platform
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex-1">
                <div className="flex items-center">
                  <div className="flex items-center flex-col">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        step.status === 'completed'
                          ? 'bg-gray-900 border-gray-900'
                          : step.status === 'in_progress'
                          ? 'bg-white border-gray-900'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      {step.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : (
                        <span
                          className={`text-sm font-semibold ${
                            step.status === 'in_progress' ? 'text-gray-900' : 'text-gray-400'
                          }`}
                        >
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p
                        className={`text-xs font-semibold ${
                          step.status !== 'pending' ? 'text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        {step.title}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-4 ${
                        step.status === 'completed' ? 'bg-gray-900' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-900">{error}</p>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {steps[currentStep].title}
            </h2>
            <p className="text-gray-600">{steps[currentStep].description}</p>
          </div>

          {renderStepContent()}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            {currentStep > 0 ? (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-6 py-3 border border-gray-200 text-gray-900 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || !verificationData.identityDocument}
                className="px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit for Review
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <p className="text-sm text-blue-900">
            <strong>What happens next?</strong> Our team will review your application within 2-3
            business days. You'll receive an email once your verification is approved, and you can
            start creating and publishing courses immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
