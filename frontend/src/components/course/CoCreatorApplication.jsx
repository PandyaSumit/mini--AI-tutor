import { useState } from 'react';
import { useCourseRole } from '../../context/CourseRoleContext';
import api from '../../services/api';

const CoCreatorApplication = ({ courseId, onSuccess }) => {
  const { contributorStatus, isCoCreator, isFounder } = useCourseRole();
  const [formData, setFormData] = useState({
    message: '',
    proposedContributions: '',
    requestedRevenueShare: 15
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Don't show if already co-creator or founder
  if (isCoCreator || isFounder) {
    return null;
  }

  // Check if user can apply
  const canApply = contributorStatus?.reputation?.canApplyAsCoCreator;
  const reputationScore = contributorStatus?.reputation?.score || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post(
        `/courses/${courseId}/co-creators/apply`,
        formData
      );

      setSuccess(true);
      setFormData({
        message: '',
        proposedContributions: '',
        requestedRevenueShare: 15
      });

      if (onSuccess) {
        onSuccess(response.data.data);
      }

      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="mb-4">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          Apply to Become a Co-Creator
        </h3>
        <p className="text-gray-600">
          Co-creators earn 10-20% revenue share and have full editing rights
        </p>
      </div>

      {!canApply && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You need 50+ reputation points or an invitation to apply as a co-creator.
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Your current reputation: <strong>{reputationScore}</strong>
              </p>
              {contributorStatus?.invited ? (
                <p className="text-sm text-green-700 mt-2">
                  ✓ You've been invited to contribute! You can now apply.
                </p>
              ) : (
                <p className="text-sm text-yellow-700 mt-2">
                  Keep contributing to courses to build your reputation!
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                Application submitted successfully! The course founder will review it soon.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Application Message
          </label>
          <textarea
            id="message"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Explain why you want to become a co-creator and what value you'll bring..."
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            required
            disabled={!canApply || loading}
          />
        </div>

        <div>
          <label htmlFor="proposedContributions" className="block text-sm font-medium text-gray-700 mb-2">
            Proposed Contributions
          </label>
          <textarea
            id="proposedContributions"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Describe specific lessons, modules, or content you plan to create..."
            value={formData.proposedContributions}
            onChange={(e) => setFormData({ ...formData, proposedContributions: e.target.value })}
            required
            disabled={!canApply || loading}
          />
        </div>

        <div>
          <label htmlFor="revenueShare" className="block text-sm font-medium text-gray-700 mb-2">
            Requested Revenue Share: {formData.requestedRevenueShare}%
          </label>
          <input
            type="range"
            id="revenueShare"
            min="10"
            max="20"
            step="1"
            className="w-full"
            value={formData.requestedRevenueShare}
            onChange={(e) => setFormData({ ...formData, requestedRevenueShare: parseInt(e.target.value) })}
            disabled={!canApply || loading}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>10% (minimum)</span>
            <span>20% (maximum)</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Final revenue share will be based on your actual contributions
          </p>
        </div>

        <button
          type="submit"
          disabled={!canApply || loading}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
            canApply && !loading
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>

      {canApply && (
        <div className="mt-6 bg-indigo-50 rounded-lg p-4">
          <h4 className="font-semibold text-indigo-900 mb-2">As a Co-Creator, you'll be able to:</h4>
          <ul className="space-y-1 text-sm text-indigo-800">
            <li>✓ Add new lessons and modules</li>
            <li>✓ Edit existing course content</li>
            <li>✓ Create quizzes and exercises</li>
            <li>✓ Respond to student questions</li>
            <li>✓ Earn 10-20% revenue share based on contributions</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default CoCreatorApplication;
