import { useCourseRole } from '../../context/CourseRoleContext';

/**
 * Debug component to show role detection status
 * Add this to CourseDetails page temporarily to debug
 */
const RoleDebug = () => {
  const roleContext = useCourseRole();

  return (
    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-bold text-yellow-900 mb-2">🔍 Role Debug Info</h3>

      <div className="bg-white rounded p-3 mb-2">
        <p className="text-sm font-semibold text-gray-700">Context Values:</p>
        <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
          {JSON.stringify({
            userRole: roleContext.userRole,
            revenueShare: roleContext.revenueShare,
            loading: roleContext.loading,
            error: roleContext.error,
            isFounder: roleContext.isFounder,
            isCoCreator: roleContext.isCoCreator,
            isContributor: roleContext.isContributor,
            isStudent: roleContext.isStudent,
            canEdit: roleContext.canEdit,
            canApprove: roleContext.canApprove,
            canSuggest: roleContext.canSuggest,
            canApplyAsCoCreator: roleContext.canApplyAsCoCreator
          }, null, 2)}
        </pre>
      </div>

      <div className="bg-white rounded p-3 mb-2">
        <p className="text-sm font-semibold text-gray-700">LocalStorage:</p>
        <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
          {JSON.stringify({
            userId: localStorage.getItem('userId'),
            user: localStorage.getItem('user') ? 'exists' : 'missing',
            token: localStorage.getItem('token') ? 'exists' : 'missing'
          }, null, 2)}
        </pre>
      </div>

      <div className="text-xs text-yellow-800 mt-2">
        <p><strong>Expected for Founder:</strong> userRole: "founder", canEdit: true, canApprove: true</p>
        <p><strong>If you see "student":</strong> Course doesn't have contributors array or user ID mismatch</p>
      </div>
    </div>
  );
};

export default RoleDebug;
