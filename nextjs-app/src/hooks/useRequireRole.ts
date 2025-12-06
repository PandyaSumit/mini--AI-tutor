/**
 * useRequireRole Hook
 * Page-level hook to enforce role requirements
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

type UserRole = 'learner' | 'verified_instructor' | 'platform_author' | 'admin';

interface UseRequireRoleOptions {
  requiredRole: UserRole | UserRole[];
  requireVerification?: boolean;
  redirectTo?: string;
}

export function useRequireRole({
  requiredRole,
  requireVerification = false,
  redirectTo = '/unauthorized',
}: UseRequireRoleOptions) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Not authenticated
    if (!user) {
      const currentPath = window.location.pathname;
      router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    // Check role
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const hasRequiredRole = allowedRoles.includes(user.role as UserRole);

    if (!hasRequiredRole) {
      router.replace(`${redirectTo}?required=${allowedRoles.join(',')}&current=${user.role}`);
      return;
    }

    // Check verification
    if (requireVerification) {
      if (user.role === 'verified_instructor' || user.role === 'platform_author') {
        const verificationStatus = user.instructorVerification?.status;

        if (verificationStatus !== 'approved') {
          let path = '/instructor/verification';
          if (verificationStatus === 'pending') path += '?status=pending';
          else if (verificationStatus === 'rejected') path += '?status=rejected';

          router.replace(path);
          return;
        }
      }
    }
  }, [user, loading, requiredRole, requireVerification, redirectTo, router]);

  return { user, loading, isAuthorized: user !== null };
}

export default useRequireRole;
