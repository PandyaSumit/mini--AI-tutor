import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const CourseRoleContext = createContext();

export const CourseRoleProvider = ({ children, courseId }) => {
  const [userRole, setUserRole] = useState(null);
  const [revenueShare, setRevenueShare] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contributorStatus, setContributorStatus] = useState(null);

  useEffect(() => {
    if (!courseId) {
      setLoading(false);
      return;
    }

    const fetchUserRole = async () => {
      try {
        setLoading(true);

        // Fetch course details to determine user's role
        const courseRes = await api.get(`/courses/${courseId}`);
        const course = courseRes.data.data;

        // Get current user ID from auth context
        const userId = localStorage.getItem('userId');

        // Find user's contributor entry in the course
        const contributor = course.contributors?.find(
          c => c.user._id === userId || c.user === userId
        );

        if (contributor) {
          setUserRole(contributor.contributionType);
          setRevenueShare(contributor.revenueShare || 0);
        } else {
          setUserRole('student');
          setRevenueShare(0);
        }

        // Fetch contributor status if not founder/co-creator
        if (!contributor || contributor.contributionType === 'content_improver') {
          try {
            const statusRes = await api.get('/invitations/my-status');
            setContributorStatus(statusRes.data.data);
          } catch (err) {
            console.warn('Could not fetch contributor status:', err);
          }
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching user role:', err);
        setError(err.message);
        setUserRole('student'); // Default to student on error
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [courseId]);

  const refreshRole = async () => {
    if (!courseId) return;

    try {
      const courseRes = await api.get(`/courses/${courseId}`);
      const course = courseRes.data.data;
      const userId = localStorage.getItem('userId');

      const contributor = course.contributors?.find(
        c => c.user._id === userId || c.user === userId
      );

      if (contributor) {
        setUserRole(contributor.contributionType);
        setRevenueShare(contributor.revenueShare || 0);
      }
    } catch (err) {
      console.error('Error refreshing role:', err);
    }
  };

  const value = {
    userRole,
    revenueShare,
    loading,
    error,
    contributorStatus,
    refreshRole,
    isFounder: userRole === 'founder',
    isCoCreator: userRole === 'co-creator',
    isContributor: userRole === 'content_improver',
    isStudent: userRole === 'student' || !userRole,
    canEdit: userRole === 'founder' || userRole === 'co-creator',
    canApprove: userRole === 'founder',
    canSuggest: !!userRole, // Anyone logged in can suggest
    canApplyAsCoCreator: contributorStatus?.reputation?.canApplyAsCoCreator || false
  };

  return (
    <CourseRoleContext.Provider value={value}>
      {children}
    </CourseRoleContext.Provider>
  );
};

export const useCourseRole = () => {
  const context = useContext(CourseRoleContext);
  if (!context) {
    throw new Error('useCourseRole must be used within a CourseRoleProvider');
  }
  return context;
};

// Custom hooks for common permission checks
export const useCanEdit = () => {
  const { canEdit, loading } = useCourseRole();
  return { canEdit, loading };
};

export const useCanApprove = () => {
  const { canApprove, loading } = useCourseRole();
  return { canApprove, loading };
};

export const useRevenueShare = () => {
  const { revenueShare, userRole, loading } = useCourseRole();
  return { revenueShare, userRole, loading };
};

export const useContributorStatus = () => {
  const { contributorStatus, loading } = useCourseRole();
  return { contributorStatus, loading };
};
