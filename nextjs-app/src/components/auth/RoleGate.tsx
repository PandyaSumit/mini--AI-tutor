/**
 * Role Gate Component
 * Conditionally renders children based on user role
 */

'use client';

import { ReactNode } from 'react';
import { useAuth } from '../providers/AuthProvider';

type UserRole = 'learner' | 'verified_instructor' | 'platform_author' | 'admin';

interface RoleGateProps {
  children: ReactNode;
  allowedRoles: UserRole | UserRole[];
  fallback?: ReactNode;
  requireVerification?: boolean;
}

export function RoleGate({
  children,
  allowedRoles,
  fallback = null,
  requireVerification = false,
}: RoleGateProps) {
  const { user, loading } = useAuth();

  // Still loading
  if (loading) {
    return <>{fallback}</>;
  }

  // Not authenticated
  if (!user) {
    return <>{fallback}</>;
  }

  // Check role
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const hasRole = roles.includes(user.role as UserRole);

  if (!hasRole) {
    return <>{fallback}</>;
  }

  // Check verification if required
  if (requireVerification) {
    if (user.role === 'verified_instructor' || user.role === 'platform_author') {
      const verificationStatus = user.instructorVerification?.status;
      if (verificationStatus !== 'approved') {
        return <>{fallback}</>;
      }
    }
  }

  // All checks passed
  return <>{children}</>;
}

export default RoleGate;
