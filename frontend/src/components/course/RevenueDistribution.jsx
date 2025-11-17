import { useState, useEffect } from 'react';
import { useCourseRole } from '../../context/CourseRoleContext';
import api from '../../services/api';

const RevenueDistribution = ({ courseId }) => {
  const { userRole, revenueShare } = useCourseRole();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/courses/${courseId}`);
      setCourse(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (contributionType) => {
    const colors = {
      founder: 'bg-purple-100 text-purple-800 border-purple-300',
      'co-creator': 'bg-blue-100 text-blue-800 border-blue-300',
      content_improver: 'bg-green-100 text-green-800 border-green-300',
      student: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[contributionType] || colors.student;
  };

  const getRoleLabel = (contributionType) => {
    const labels = {
      founder: 'Founder',
      'co-creator': 'Co-Creator',
      content_improver: 'Contributor',
      student: 'Student'
    };
    return labels[contributionType] || 'Student';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <p className="text-gray-600">Loading revenue distribution...</p>
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

  if (!course) return null;

  // Calculate total allocated and platform share
  const totalAllocated = course.contributors?.reduce((sum, c) => sum + (c.revenueShare || 0), 0) || 0;
  const platformShare = Math.max(0, 100 - totalAllocated);

  // Sort contributors by revenue share (descending)
  const sortedContributors = [...(course.contributors || [])].sort(
    (a, b) => (b.revenueShare || 0) - (a.revenueShare || 0)
  );

  // Only show to contributors (not regular students)
  if (userRole === 'student' || !userRole) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Revenue Distribution</h3>
        <p className="text-gray-600">
          Your revenue share: <span className="font-semibold text-indigo-600">{revenueShare}%</span>
        </p>
      </div>

      {/* Visual Revenue Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Revenue Allocation</span>
          <span className="text-sm text-gray-600">{totalAllocated.toFixed(1)}% allocated</span>
        </div>
        <div className="w-full h-8 bg-gray-200 rounded-lg overflow-hidden flex">
          {sortedContributors.map((contributor, index) => {
            const width = ((contributor.revenueShare || 0) / 100) * 100;
            const colors = ['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-pink-500'];
            const color = colors[index % colors.length];

            return width > 0 ? (
              <div
                key={contributor._id}
                className={`${color} flex items-center justify-center text-white text-xs font-medium`}
                style={{ width: `${width}%` }}
                title={`${contributor.user.name || 'Unknown'}: ${contributor.revenueShare}%`}
              >
                {width > 8 && `${contributor.revenueShare}%`}
              </div>
            ) : null;
          })}
          {platformShare > 0 && (
            <div
              className="bg-gray-400 flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${platformShare}%` }}
              title={`Platform: ${platformShare.toFixed(1)}%`}
            >
              {platformShare > 8 && `${platformShare.toFixed(1)}%`}
            </div>
          )}
        </div>
      </div>

      {/* Contributors Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Contributor</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Contribution</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Revenue Share</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedContributors.map((contributor) => (
              <tr key={contributor._id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium text-gray-900">
                      {contributor.user.name || 'Unknown User'}
                    </p>
                    <p className="text-sm text-gray-600">{contributor.user.email}</p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(contributor.contributionType)}`}>
                    {getRoleLabel(contributor.contributionType)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="text-sm text-gray-600">
                    <p>Score: {contributor.contributionScore || 0}</p>
                    <p className="text-xs text-gray-500">
                      Since {new Date(contributor.contributionDate).toLocaleDateString()}
                    </p>
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="text-lg font-bold text-indigo-600">
                    {contributor.revenueShare || 0}%
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    contributor.approvalStatus === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : contributor.approvalStatus === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {contributor.approvalStatus || 'pending'}
                  </span>
                </td>
              </tr>
            ))}

            {/* Platform Row */}
            {platformShare > 0 && (
              <tr className="border-b border-gray-100 bg-gray-50">
                <td className="py-3 px-4">
                  <p className="font-medium text-gray-900">Platform</p>
                </td>
                <td className="py-3 px-4">
                  <span className="px-3 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-800 border-gray-300">
                    Platform
                  </span>
                </td>
                <td className="py-3 px-4">
                  <p className="text-sm text-gray-600">Unallocated</p>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="text-lg font-bold text-gray-600">
                    {platformShare.toFixed(1)}%
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-700">
                    active
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Revenue Share Info */}
      <div className="mt-6 bg-indigo-50 rounded-lg p-4">
        <h4 className="font-semibold text-indigo-900 mb-2">How Revenue is Calculated</h4>
        <ul className="space-y-1 text-sm text-indigo-800">
          <li>• <strong>Founders:</strong> Start at 60%, decreases 2% per co-creator (minimum 50%)</li>
          <li>• <strong>Co-Creators:</strong> 10-20% based on content contribution</li>
          <li>• <strong>Contributors:</strong> 2-5% based on implemented suggestions</li>
          <li>• <strong>Platform:</strong> Receives remaining unallocated percentage</li>
        </ul>
      </div>

      {/* Example Calculation */}
      {course.pricing?.price > 0 && (
        <div className="mt-4 bg-green-50 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-2">Your Earnings Example</h4>
          <p className="text-sm text-green-800">
            If this course earns <strong>${course.pricing.price}</strong> per sale:
          </p>
          <p className="text-lg font-bold text-green-900 mt-2">
            You would earn: ${((course.pricing.price * revenueShare) / 100).toFixed(2)} per sale
          </p>
        </div>
      )}
    </div>
  );
};

export default RevenueDistribution;
