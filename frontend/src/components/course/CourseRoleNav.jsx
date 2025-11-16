import { useState } from 'react';
import { useCourseRole } from '../../context/CourseRoleContext';

const CourseRoleNav = ({ activeTab, onTabChange }) => {
  const { userRole, isFounder, isCoCreator, isContributor, canEdit } = useCourseRole();

  // Define tabs based on user role
  const getTabs = () => {
    const tabs = [
      { id: 'overview', label: 'Overview', icon: '📚', roles: ['all'] },
      { id: 'lessons', label: 'Lessons', icon: '📖', roles: ['all'] }
    ];

    // Add tabs for contributors and above
    if (isContributor || isCoCreator || isFounder) {
      tabs.push({
        id: 'improvements',
        label: 'Improvements',
        icon: '💡',
        roles: ['contributor', 'co-creator', 'founder']
      });
      tabs.push({
        id: 'revenue',
        label: 'Revenue',
        icon: '💰',
        roles: ['contributor', 'co-creator', 'founder']
      });
    }

    // Add tabs for co-creators and founders
    if (canEdit) {
      tabs.push({
        id: 'edit',
        label: 'Edit Content',
        icon: '✏️',
        roles: ['co-creator', 'founder']
      });
    }

    // Add tabs for founders only
    if (isFounder) {
      tabs.push({
        id: 'co-creator-requests',
        label: 'Co-Creator Requests',
        icon: '👥',
        roles: ['founder']
      });
      tabs.push({
        id: 'analytics',
        label: 'Analytics',
        icon: '📊',
        roles: ['founder']
      });
    }

    return tabs;
  };

  const tabs = getTabs();

  return (
    <div className="bg-white border-b border-gray-200 mb-6">
      <div className="flex items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CourseRoleNav;
