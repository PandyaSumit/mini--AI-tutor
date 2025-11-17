import { useState, useEffect } from 'react';
import { useCourseRole } from '../../context/CourseRoleContext';
import api from '../../services/api';

const CourseImprovements = ({ courseId }) => {
  const { userRole, canEdit } = useCourseRole();
  const [improvements, setImprovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    improvementType: 'new_content',
    targetSection: {}
  });

  useEffect(() => {
    fetchImprovements();
  }, [courseId, filter]);

  const fetchImprovements = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/courses/${courseId}/improvements?status=${filter}`);
      setImprovements(response.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load improvements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/courses/${courseId}/improvements`, formData);
      setFormData({
        title: '',
        description: '',
        improvementType: 'new_content',
        targetSection: {}
      });
      setShowForm(false);
      fetchImprovements();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit suggestion');
    }
  };

  const handleUpvote = async (improvementId) => {
    try {
      await api.post(`/courses/${courseId}/improvements/${improvementId}/upvote`);
      fetchImprovements();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to upvote');
    }
  };

  const handleImplement = async (improvementId) => {
    const notes = prompt('Add implementation notes (what changes you made):');
    if (!notes) return;

    try {
      await api.put(`/courses/${courseId}/improvements/${improvementId}/implement`, { notes });
      alert('Improvement marked as implemented!');
      fetchImprovements();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to implement');
    }
  };

  const handleReject = async (improvementId) => {
    const notes = prompt('Reason for rejection:');
    if (!notes) return;

    try {
      await api.put(`/courses/${courseId}/improvements/${improvementId}/reject`, { notes });
      alert('Suggestion rejected');
      fetchImprovements();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject');
    }
  };

  const getImprovementTypeLabel = (type) => {
    const types = {
      new_content: 'New Content',
      error_fix: 'Error Fix',
      clarity_improvement: 'Clarity Improvement',
      example_addition: 'Add Example',
      quiz_improvement: 'Quiz Improvement',
      other: 'Other'
    };
    return types[type] || type;
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      implemented: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Course Improvements</h3>
          <p className="text-gray-600 text-sm mt-1">
            Suggest improvements or vote on existing suggestions
          </p>
        </div>
        {userRole && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            {showForm ? 'Cancel' : '+ Suggest Improvement'}
          </button>
        )}
      </div>

      {/* Suggestion Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-4">New Improvement Suggestion</h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Brief description of the improvement"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.improvementType}
                onChange={(e) => setFormData({ ...formData, improvementType: e.target.value })}
              >
                <option value="new_content">New Content</option>
                <option value="error_fix">Error Fix</option>
                <option value="clarity_improvement">Clarity Improvement</option>
                <option value="example_addition">Add Example</option>
                <option value="quiz_improvement">Quiz Improvement</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Detailed description of what should be improved and why..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Submit Suggestion
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        {['pending', 'under_review', 'implemented', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === status
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Improvements List */}
      {loading ? (
        <p className="text-gray-600 text-center py-4">Loading improvements...</p>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : improvements.length === 0 ? (
        <p className="text-gray-600 text-center py-8">No improvements in this category yet.</p>
      ) : (
        <div className="space-y-4">
          {improvements.map((improvement) => (
            <div
              key={improvement._id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-gray-900">{improvement.title}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(improvement.status)}`}>
                      {improvement.status.replace('_', ' ')}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {getImprovementTypeLabel(improvement.improvementType)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{improvement.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>By: {improvement.suggestedBy?.name || 'Anonymous'}</span>
                    <span>•</span>
                    <span>{new Date(improvement.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4">
                {/* Upvote Button */}
                <button
                  onClick={() => handleUpvote(improvement._id)}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                  </svg>
                  <span className="text-sm font-medium">{improvement.upvotes || 0}</span>
                </button>

                {/* Founder/Co-Creator Actions */}
                {canEdit && improvement.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleImplement(improvement._id)}
                      className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-md transition-colors text-sm"
                    >
                      Implement
                    </button>
                    <button
                      onClick={() => handleReject(improvement._id)}
                      className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-md transition-colors text-sm"
                    >
                      Reject
                    </button>
                  </>
                )}

                {improvement.status === 'implemented' && improvement.implementedBy && (
                  <span className="text-xs text-green-600">
                    ✓ Implemented by {improvement.implementedBy.name}
                  </span>
                )}
              </div>

              {improvement.implementationNotes && (
                <div className="mt-3 bg-blue-50 p-3 rounded text-sm">
                  <p className="font-medium text-blue-900">Implementation Notes:</p>
                  <p className="text-blue-800">{improvement.implementationNotes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseImprovements;
