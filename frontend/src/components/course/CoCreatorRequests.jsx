import { useState, useEffect } from 'react';
import { useCourseRole } from '../../context/CourseRoleContext';
import api from '../../services/api';

const CoCreatorRequests = ({ courseId }) => {
  const { isFounder } = useCourseRole();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (!isFounder) return;
    fetchRequests();
  }, [courseId, isFounder]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/courses/${courseId}/co-creators/requests?status=pending`);
      setRequests(response.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    const request = requests.find(r => r._id === requestId);
    if (!request) return;

    const approvedShare = prompt(
      `Approve revenue share for ${request.requester.name}?\n\nThey requested: ${request.requestedRevenueShare}%\nEnter approved percentage (10-20):`,
      request.requestedRevenueShare
    );

    if (!approvedShare) return;

    const share = parseInt(approvedShare);
    if (isNaN(share) || share < 10 || share > 20) {
      alert('Invalid revenue share. Must be between 10-20%');
      return;
    }

    const notes = prompt('Add any notes for the applicant (optional):');

    try {
      setProcessingId(requestId);
      await api.put(`/courses/${courseId}/co-creators/requests/${requestId}/approve`, {
        approvedRevenueShare: share,
        notes: notes || ''
      });

      // Refresh requests list
      await fetchRequests();
      alert('Co-creator application approved!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    const request = requests.find(r => r._id === requestId);
    if (!request) return;

    const notes = prompt(
      `Reject application from ${request.requester.name}?\n\nPlease provide a reason:`,
      ''
    );

    if (notes === null) return; // User cancelled

    try {
      setProcessingId(requestId);
      await api.put(`/courses/${courseId}/co-creators/requests/${requestId}/reject`, {
        notes
      });

      // Refresh requests list
      await fetchRequests();
      alert('Application rejected');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  if (!isFounder) {
    return null; // Only founders can see this
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <p className="text-gray-600">Loading co-creator requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Co-Creator Applications</h3>
        <p className="text-gray-600">No pending applications at this time.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        Co-Creator Applications ({requests.length})
      </h3>

      <div className="space-y-4">
        {requests.map((request) => (
          <div
            key={request._id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">
                  {request.requester.name}
                </h4>
                <p className="text-sm text-gray-600">{request.requester.email}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>Reputation: {request.requester.reputation?.score || 0}</span>
                  <span>•</span>
                  <span>Requested: {request.requestedRevenueShare}% revenue</span>
                </div>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                Pending
              </span>
            </div>

            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-1">Message:</p>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                {request.message}
              </p>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Proposed Contributions:</p>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                {request.proposedContributions}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleApprove(request._id)}
                disabled={processingId === request._id}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {processingId === request._id ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={() => handleReject(request._id)}
                disabled={processingId === request._id}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {processingId === request._id ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoCreatorRequests;
