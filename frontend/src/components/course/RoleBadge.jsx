import { useCourseRole } from '../../context/CourseRoleContext';

const RoleBadge = () => {
  const { userRole, revenueShare, loading } = useCourseRole();

  if (loading || !userRole || userRole === 'student') {
    return null;
  }

  const getRoleConfig = () => {
    const configs = {
      founder: {
        label: 'Course Founder',
        bgColor: 'bg-gradient-to-r from-purple-600 to-indigo-600',
        textColor: 'text-white',
        icon: '👑',
        description: 'Full editorial control'
      },
      'co-creator': {
        label: 'Co-Creator',
        bgColor: 'bg-gradient-to-r from-blue-600 to-cyan-600',
        textColor: 'text-white',
        icon: '✨',
        description: 'Approved contributor'
      },
      content_improver: {
        label: 'Contributor',
        bgColor: 'bg-gradient-to-r from-green-600 to-emerald-600',
        textColor: 'text-white',
        icon: '🌟',
        description: 'Content improver'
      }
    };

    return configs[userRole] || null;
  };

  const config = getRoleConfig();
  if (!config) return null;

  return (
    <div className={`${config.bgColor} ${config.textColor} rounded-lg shadow-lg p-4 mb-6`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{config.icon}</span>
          <div>
            <h3 className="text-lg font-bold">{config.label}</h3>
            <p className="text-sm opacity-90">{config.description}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm opacity-90">Revenue Share</p>
          <p className="text-3xl font-bold">{revenueShare}%</p>
        </div>
      </div>
    </div>
  );
};

export default RoleBadge;
