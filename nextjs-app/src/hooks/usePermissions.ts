/**
 * Permission Hooks
 *
 * React hooks for checking user permissions in components
 * IMPORTANT: These are for UX only - backend enforces actual permissions!
 */

'use client';

import { useMemo, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  PERMISSIONS,
  ROLES,
  hasPermission as checkPermission,
  hasAnyPermission as checkAnyPermission,
  hasAllPermissions as checkAllPermissions,
  hasRole as checkRole,
  hasAnyRole as checkAnyRole,
  isOwner as checkOwner,
  isAdmin as checkIsAdmin,
  isInstructor as checkIsInstructor,
  isPlatformAuthor as checkIsPlatformAuthor,
  getRolePermissions,
  type Role,
  type Permission,
} from '@/lib/permissions';

// ===================================================
// PERMISSION HOOKS
// ===================================================

/**
 * Hook to check if user has a specific permission
 * @param permission - Permission to check
 * @returns Object with hasPermission boolean and loading state
 *
 * @example
 * const { hasPermission, loading } = usePermission(PERMISSIONS.COURSE.CREATE);
 * if (hasPermission) {
 *   return <CreateCourseButton />;
 * }
 */
export function usePermission(permission: Permission) {
  const { user, loading } = useAuth();

  const hasPermission = useMemo(() => {
    if (!user || !user.role) return false;
    return checkPermission(user.role as Role, permission);
  }, [user, permission]);

  return { hasPermission, loading };
}

/**
 * Hook to check if user has ANY of the specified permissions
 * @param permissions - Array of permissions to check
 * @returns Object with hasAnyPermission boolean and loading state
 *
 * @example
 * const { hasAnyPermission } = useAnyPermission([
 *   PERMISSIONS.COURSE.VIEW_OWN,
 *   PERMISSIONS.COURSE.VIEW_ALL
 * ]);
 */
export function useAnyPermission(permissions: Permission[]) {
  const { user, loading } = useAuth();

  const hasAnyPermission = useMemo(() => {
    if (!user || !user.role) return false;
    return checkAnyPermission(user.role as Role, permissions);
  }, [user, permissions]);

  return { hasAnyPermission, loading };
}

/**
 * Hook to check if user has ALL of the specified permissions
 * @param permissions - Array of permissions to check
 * @returns Object with hasAllPermissions boolean and loading state
 *
 * @example
 * const { hasAllPermissions } = useAllPermissions([
 *   PERMISSIONS.COURSE.EDIT_OWN,
 *   PERMISSIONS.COURSE.PUBLISH
 * ]);
 */
export function useAllPermissions(permissions: Permission[]) {
  const { user, loading } = useAuth();

  const hasAllPermissions = useMemo(() => {
    if (!user || !user.role) return false;
    return checkAllPermissions(user.role as Role, permissions);
  }, [user, permissions]);

  return { hasAllPermissions, loading };
}

// ===================================================
// ROLE HOOKS
// ===================================================

/**
 * Hook to check if user has a specific role
 * @param role - Role to check
 * @returns Object with hasRole boolean and loading state
 *
 * @example
 * const { hasRole } = useRole(ROLES.ADMIN);
 */
export function useRole(role: Role) {
  const { user, loading } = useAuth();

  const hasRole = useMemo(() => {
    if (!user || !user.role) return false;
    return checkRole(user.role as Role, role);
  }, [user, role]);

  return { hasRole, loading };
}

/**
 * Hook to check if user has ANY of the specified roles
 * @param roles - Array of roles to check
 * @returns Object with hasAnyRole boolean and loading state
 *
 * @example
 * const { hasAnyRole } = useAnyRole([
 *   ROLES.VERIFIED_INSTRUCTOR,
 *   ROLES.PLATFORM_AUTHOR
 * ]);
 */
export function useAnyRole(roles: Role[]) {
  const { user, loading } = useAuth();

  const hasAnyRole = useMemo(() => {
    if (!user || !user.role) return false;
    return checkAnyRole(user.role as Role, roles);
  }, [user, roles]);

  return { hasAnyRole, loading };
}

// ===================================================
// RESOURCE OWNERSHIP HOOKS
// ===================================================

/**
 * Hook to check if user owns a resource
 * @param resource - Resource to check ownership
 * @returns Object with isOwner boolean and loading state
 *
 * @example
 * const { isOwner } = useIsOwner(course);
 */
export function useIsOwner(resource: any) {
  const { user, loading } = useAuth();

  const isOwner = useMemo(() => {
    if (!user) return false;
    return checkOwner(user._id, resource);
  }, [user, resource]);

  return { isOwner, loading };
}

/**
 * Hook to check if user can edit a resource
 * Combines ownership check with edit permission
 * @param resource - Resource to check
 * @param editPermission - Permission required to edit (e.g., PERMISSIONS.COURSE.EDIT_OWN)
 * @returns Object with canEdit boolean and loading state
 *
 * @example
 * const { canEdit } = useCanEdit(course, PERMISSIONS.COURSE.EDIT_OWN);
 */
export function useCanEdit(resource: any, editPermission: Permission) {
  const { user, loading } = useAuth();

  const canEdit = useMemo(() => {
    if (!user || !user.role) return false;

    // Admins can edit everything
    if (checkIsAdmin(user.role as Role)) {
      return true;
    }

    // Check if user owns the resource and has edit permission
    const ownsResource = checkOwner(user._id, resource);
    if (ownsResource && checkPermission(user.role as Role, editPermission)) {
      return true;
    }

    // Check for global edit permission (e.g., edit_all)
    const globalPermission = editPermission.replace('_own', '_all');
    if (checkPermission(user.role as Role, globalPermission)) {
      return true;
    }

    return false;
  }, [user, resource, editPermission]);

  return { canEdit, loading };
}

/**
 * Hook to check if user can delete a resource
 * Combines ownership check with delete permission
 * @param resource - Resource to check
 * @param deletePermission - Permission required to delete
 * @returns Object with canDelete boolean and loading state
 *
 * @example
 * const { canDelete } = useCanDelete(course, PERMISSIONS.COURSE.DELETE_OWN);
 */
export function useCanDelete(resource: any, deletePermission: Permission) {
  const { user, loading } = useAuth();

  const canDelete = useMemo(() => {
    if (!user || !user.role) return false;

    // Admins can delete everything
    if (checkIsAdmin(user.role as Role)) {
      return true;
    }

    // Check if user owns the resource and has delete permission
    const ownsResource = checkOwner(user._id, resource);
    if (ownsResource && checkPermission(user.role as Role, deletePermission)) {
      return true;
    }

    // Check for global delete permission
    const globalPermission = deletePermission.replace('_own', '_all');
    if (checkPermission(user.role as Role, globalPermission)) {
      return true;
    }

    return false;
  }, [user, resource, deletePermission]);

  return { canDelete, loading };
}

// ===================================================
// ROLE HELPER HOOKS
// ===================================================

/**
 * Hook to check if user is admin
 * @returns Object with isAdmin boolean and loading state
 *
 * @example
 * const { isAdmin } = useIsAdmin();
 */
export function useIsAdmin() {
  const { user, loading } = useAuth();

  const isAdmin = useMemo(() => {
    if (!user || !user.role) return false;
    return checkIsAdmin(user.role as Role);
  }, [user]);

  return { isAdmin, loading };
}

/**
 * Hook to check if user is instructor (verified_instructor, platform_author, or admin)
 * @returns Object with isInstructor boolean and loading state
 *
 * @example
 * const { isInstructor } = useIsInstructor();
 */
export function useIsInstructor() {
  const { user, loading } = useAuth();

  const isInstructor = useMemo(() => {
    if (!user || !user.role) return false;
    return checkIsInstructor(user.role as Role);
  }, [user]);

  return { isInstructor, loading };
}

/**
 * Hook to check if user is platform author
 * @returns Object with isPlatformAuthor boolean and loading state
 *
 * @example
 * const { isPlatformAuthor } = useIsPlatformAuthor();
 */
export function useIsPlatformAuthor() {
  const { user, loading } = useAuth();

  const isPlatformAuthor = useMemo(() => {
    if (!user || !user.role) return false;
    return checkIsPlatformAuthor(user.role as Role);
  }, [user]);

  return { isPlatformAuthor, loading };
}

// ===================================================
// COMPREHENSIVE PERMISSION HOOK
// ===================================================

/**
 * Comprehensive hook that provides all permission checking functions
 * @returns Object with all permission checking functions
 *
 * @example
 * const { hasPermission, isOwner, canEdit, isAdmin } = usePermissions();
 *
 * if (hasPermission(PERMISSIONS.COURSE.CREATE)) {
 *   // Show create button
 * }
 *
 * if (isOwner(course)) {
 *   // Show edit button
 * }
 */
export function usePermissions() {
  const { user, loading } = useAuth();

  // Memoize permission checking functions
  const hasPermission = useCallback(
    (permission: Permission) => {
      if (!user || !user.role) return false;
      return checkPermission(user.role as Role, permission);
    },
    [user]
  );

  const hasAnyPermission = useCallback(
    (permissions: Permission[]) => {
      if (!user || !user.role) return false;
      return checkAnyPermission(user.role as Role, permissions);
    },
    [user]
  );

  const hasAllPermissions = useCallback(
    (permissions: Permission[]) => {
      if (!user || !user.role) return false;
      return checkAllPermissions(user.role as Role, permissions);
    },
    [user]
  );

  const hasRole = useCallback(
    (role: Role) => {
      if (!user || !user.role) return false;
      return checkRole(user.role as Role, role);
    },
    [user]
  );

  const hasAnyRole = useCallback(
    (roles: Role[]) => {
      if (!user || !user.role) return false;
      return checkAnyRole(user.role as Role, roles);
    },
    [user]
  );

  const isOwner = useCallback(
    (resource: any) => {
      if (!user) return false;
      return checkOwner(user._id, resource);
    },
    [user]
  );

  const canEdit = useCallback(
    (resource: any, editPermission: Permission) => {
      if (!user || !user.role) return false;

      if (checkIsAdmin(user.role as Role)) {
        return true;
      }

      const ownsResource = checkOwner(user._id, resource);
      if (ownsResource && checkPermission(user.role as Role, editPermission)) {
        return true;
      }

      const globalPermission = editPermission.replace('_own', '_all');
      if (checkPermission(user.role as Role, globalPermission)) {
        return true;
      }

      return false;
    },
    [user]
  );

  const canDelete = useCallback(
    (resource: any, deletePermission: Permission) => {
      if (!user || !user.role) return false;

      if (checkIsAdmin(user.role as Role)) {
        return true;
      }

      const ownsResource = checkOwner(user._id, resource);
      if (ownsResource && checkPermission(user.role as Role, deletePermission)) {
        return true;
      }

      const globalPermission = deletePermission.replace('_own', '_all');
      if (checkPermission(user.role as Role, globalPermission)) {
        return true;
      }

      return false;
    },
    [user]
  );

  const isAdmin = useMemo(() => {
    if (!user || !user.role) return false;
    return checkIsAdmin(user.role as Role);
  }, [user]);

  const isInstructor = useMemo(() => {
    if (!user || !user.role) return false;
    return checkIsInstructor(user.role as Role);
  }, [user]);

  const isPlatformAuthor = useMemo(() => {
    if (!user || !user.role) return false;
    return checkIsPlatformAuthor(user.role as Role);
  }, [user]);

  const allPermissions = useMemo(() => {
    if (!user || !user.role) return [];
    return getRolePermissions(user.role as Role);
  }, [user]);

  return {
    // State
    user,
    loading,
    role: user?.role as Role | undefined,
    allPermissions,

    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,

    // Role checks
    hasRole,
    hasAnyRole,

    // Resource checks
    isOwner,
    canEdit,
    canDelete,

    // Role helpers
    isAdmin,
    isInstructor,
    isPlatformAuthor,
  };
}

export default usePermissions;
