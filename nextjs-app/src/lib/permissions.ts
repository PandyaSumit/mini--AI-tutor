/**
 * Permissions Utility
 * Feature-level permission checks
 */

import type { User } from '@/types';

type UserRole = 'learner' | 'verified_instructor' | 'platform_author' | 'admin';

type Permission =
  // Learning permissions
  | 'view_courses'
  | 'enroll_courses'
  | 'use_ai_chat'
  | 'track_progress'
  | 'use_flashcards'
  | 'use_roadmaps'
  // Teaching permissions
  | 'create_courses'
  | 'edit_courses'
  | 'view_students'
  | 'view_earnings'
  | 'request_payouts'
  // Content creation permissions
  | 'use_curriculum_builder'
  | 'use_content_tools'
  | 'publish_content'
  // Admin permissions
  | 'manage_users'
  | 'verify_instructors'
  | 'view_analytics'
  | 'manage_settings';

// Permission matrix mapping roles to permissions
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  learner: [
    'view_courses',
    'enroll_courses',
    'use_ai_chat',
    'track_progress',
    'use_flashcards',
    'use_roadmaps',
  ],
  verified_instructor: [
    'view_courses',
    'enroll_courses',
    'use_ai_chat',
    'track_progress',
    'use_flashcards',
    'use_roadmaps',
    'create_courses',
    'edit_courses',
    'view_students',
    'view_earnings',
    'request_payouts',
  ],
  platform_author: [
    'view_courses',
    'enroll_courses',
    'use_ai_chat',
    'track_progress',
    'use_flashcards',
    'use_roadmaps',
    'create_courses',
    'edit_courses',
    'view_students',
    'view_earnings',
    'request_payouts',
    'use_curriculum_builder',
    'use_content_tools',
    'publish_content',
  ],
  admin: [
    'view_courses',
    'enroll_courses',
    'use_ai_chat',
    'track_progress',
    'use_flashcards',
    'use_roadmaps',
    'create_courses',
    'edit_courses',
    'view_students',
    'view_earnings',
    'request_payouts',
    'use_curriculum_builder',
    'use_content_tools',
    'publish_content',
    'manage_users',
    'verify_instructors',
    'view_analytics',
    'manage_settings',
  ],
};

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false;

  const role = user.role as UserRole;
  const permissions = ROLE_PERMISSIONS[role];

  return permissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(user: User | null, permissions: Permission[]): boolean {
  if (!user) return false;

  return permissions.some((permission) => hasPermission(user, permission));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(user: User | null, permissions: Permission[]): boolean {
  if (!user) return false;

  return permissions.every((permission) => hasPermission(user, permission));
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: User | null, role: UserRole | UserRole[]): boolean {
  if (!user) return false;

  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(user.role as UserRole);
}

/**
 * Check if instructor/author is verified
 */
export function isVerified(user: User | null): boolean {
  if (!user) return false;

  // Admin is always considered verified
  if (user.role === 'admin') return true;

  // Learners don't need verification
  if (user.role === 'learner') return true;

  // Check instructor/author verification
  if (user.role === 'verified_instructor' || user.role === 'platform_author') {
    return user.instructorVerification?.status === 'approved';
  }

  return false;
}

/**
 * Get user's role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    learner: 'Student',
    verified_instructor: 'Verified Instructor',
    platform_author: 'Platform Author',
    admin: 'Administrator',
  };

  return roleNames[role];
}

/**
 * Check if user can access a specific route
 */
export function canAccessRoute(user: User | null, routePath: string): boolean {
  if (!user) return false;

  // Route patterns
  const studentRoutes = /^\/(dashboard|my-courses|chat|progress|flashcards|roadmaps|profile)/;
  const instructorRoutes = /^\/(instructor)/;
  const authorRoutes = /^\/(author)/;
  const adminRoutes = /^\/(admin)/;

  const role = user.role as UserRole;

  // Admin can access everything
  if (role === 'admin') return true;

  // Check route access based on role
  if (studentRoutes.test(routePath)) {
    return true; // All roles can access student routes (learning)
  }

  if (instructorRoutes.test(routePath)) {
    return role === 'verified_instructor' || role === 'platform_author';
  }

  if (authorRoutes.test(routePath)) {
    return role === 'platform_author';
  }

  if (adminRoutes.test(routePath)) {
    return role === 'admin';
  }

  // Public routes
  return true;
}

export type { Permission, UserRole };
