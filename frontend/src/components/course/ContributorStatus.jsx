import { useState, useEffect } from 'react';
import api from '../../services/api';

const ContributorStatus = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/invitations/my-status');
      setStatus(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load status');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <p className="text-gray-600">Loading contributor status...</p>
      </div>
    );
  }

  if (error) {
    return null; // Silently fail for non-critical widget
  }

  if (!status) return null;

  // Calculate progress toward contributor invitation
  const calculateProgress = () => {
    const activity = status.activity || {};
    const points =
      (activity.errorReports * 2) +
      (activity.suggestionsSubmitted * 3) +
      (activity.questionsAsked * 1) +
      (activity.forumParticipation * 1.5);

    return Math.min((points / 50) * 100, 100);
  };

  const progress = calculateProgress();

  // If already invited, show different UI
  if (status.invited) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-md p-6 mb-6 border-l-4 border-green-500">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-green-900 mb-1">You're a Contributor!</h3>
            <p className="text-green-800 mb-3">
              Invited on {new Date(status.invitedAt).toLocaleDateString()}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-lg p-3">
                <p className="text-sm text-gray-600">Quality Score</p>
                <p className="text-2xl font-bold text-indigo-600">{status.qualityScore}/100</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-sm text-gray-600">Reputation</p>
                <p className="text-2xl font-bold text-indigo-600">{status.reputation.score}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Your Contributions</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Suggestions Submitted</p>
                  <p className="font-semibold text-gray-900">{status.activity.suggestionsSubmitted}</p>
                </div>
                <div>
                  <p className="text-gray-600">Suggestions Implemented</p>
                  <p className="font-semibold text-green-600">{status.activity.suggestionsImplemented}</p>
                </div>
                <div>
                  <p className="text-gray-600">Error Reports</p>
                  <p className="font-semibold text-gray-900">{status.activity.errorReports}</p>
                </div>
                <div>
                  <p className="text-gray-600">Forum Posts</p>
                  <p className="font-semibold text-gray-900">{status.activity.forumParticipation}</p>
                </div>
              </div>
            </div>

            {status.reputation.canApplyAsCoCreator && (
              <div className="mt-4 bg-indigo-100 rounded-lg p-3 border border-indigo-300">
                <p className="text-sm font-semibold text-indigo-900">
                  ✨ You can now apply to become a co-creator and earn 10-20% revenue!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show progress toward invitation
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-indigo-500">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-800 mb-1">Contributor Path</h3>
        <p className="text-gray-600 text-sm">
          Keep contributing to get invited as an official contributor!
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress to Invitation</span>
          <span className="text-sm font-bold text-indigo-600">{progress.toFixed(0)}%</span>
        </div>
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        {progress < 100 && (
          <p className="text-xs text-gray-500 mt-1">
            {Math.ceil((50 - ((progress / 100) * 50)) / 2)} more error reports or {Math.ceil((50 - ((progress / 100) * 50)) / 3)} more suggestions needed
          </p>
        )}
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Error Reports</span>
            <span className="text-lg font-bold text-gray-900">{status.activity.errorReports}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">2 points each</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Suggestions</span>
            <span className="text-lg font-bold text-gray-900">{status.activity.suggestionsSubmitted}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">3 points each</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Implemented</span>
            <span className="text-lg font-bold text-green-600">{status.activity.suggestionsImplemented}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Quality matters!</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Forum Posts</span>
            <span className="text-lg font-bold text-gray-900">{status.activity.forumParticipation}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">1.5 points each</p>
        </div>
      </div>

      {/* Current Scores */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
          <p className="text-sm text-indigo-700 mb-1">Quality Score</p>
          <p className="text-2xl font-bold text-indigo-900">{status.qualityScore}/100</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
          <p className="text-sm text-purple-700 mb-1">Reputation</p>
          <p className="text-2xl font-bold text-purple-900">{status.reputation.score}</p>
        </div>
      </div>

      {/* Benefits Preview */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">Contributor Benefits</h4>
        <ul className="space-y-1 text-sm text-gray-700">
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Earn 2-5% revenue from implemented suggestions
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Path to co-creator status (10-20% revenue)
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Build reputation and expertise recognition
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ContributorStatus;
