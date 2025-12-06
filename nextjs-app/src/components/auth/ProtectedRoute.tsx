/**
 * Protected Route Component
 * Enforces authentication and role-based access control
 */

'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers/AuthProvider';

type UserRole = 'learner' | 'verified_instructor' | 'platform_author' | 'admin';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole | UserRole[];
  requireVerification?: boolean;
  fallbackPath?: string;
  loadingComponent?: ReactNode;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requireVerification = false,
  fallbackPath = '/login',
  loadingComponent,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Not authenticated - redirect to login
    if (!user) {
      const currentPath = window.location.pathname;
      router.replace(`${fallbackPath}?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    // Check role requirement
    if (requiredRole) {
      const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      const hasRequiredRole = allowedRoles.includes(user.role as UserRole);

      if (!hasRequiredRole) {
        // Redirect to unauthorized page with context
        router.replace(`/unauthorized?required=${allowedRoles.join(',')}&current=${user.role}`);
        return;
      }
    }

    // Check verification requirement for instructors/authors
    if (requireVerification) {
      if (user.role === 'verified_instructor' || user.role === 'platform_author') {
        const verificationStatus = user.instructorVerification?.status;

        if (verificationStatus !== 'approved') {
          let redirectPath = '/instructor/verification';

          if (verificationStatus === 'pending') {
            redirectPath += '?status=pending';
          } else if (verificationStatus === 'rejected') {
            redirectPath += '?status=rejected';
          }

          router.replace(redirectPath);
          return;
        }
      }
    }
  }, [user, loading, requiredRole, requireVerification, router, fallbackPath]);

  // Show loading state
  if (loading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // Role check failed
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const hasRequiredRole = allowedRoles.includes(user.role as UserRole);

    if (!hasRequiredRole) {
      return null;
    }
  }

  // Verification check failed
  if (requireVerification) {
    if (user.role === 'verified_instructor' || user.role === 'platform_author') {
      const verificationStatus = user.instructorVerification?.status;
      if (verificationStatus !== 'approved') {
        return null;
      }
    }
  }

  // All checks passed - render children
  return <>{children}</>;
}

export default ProtectedRoute;
