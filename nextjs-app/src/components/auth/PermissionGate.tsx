/**
 * Permission-Based UI Components
 *
 * Components that conditionally render based on user permissions
 * IMPORTANT: These are for UX only - backend enforces actual permissions!
 */

'use client';

import { ReactNode } from 'react';
import {
  usePermission,
  useAnyPermission,
  useAllPermissions,
  useRole,
  useAnyRole,
  useIsOwner,
  useCanEdit,
  useCanDelete,
} from '@/hooks/usePermissions';
import type { Role, Permission } from '@/lib/permissions';

// ===================================================
// PERMISSION GATE COMPONENTS
// ===================================================

interface PermissionGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}

/**
 * Render children only if user has required permission
 *
 * @example
 * <RequirePermission permission={PERMISSIONS.COURSE.CREATE}>
 *   <CreateCourseButton />
 * </RequirePermission>
 */
export function RequirePermission({
  permission,
  children,
  fallback = null,
  loadingFallback = null,
}: PermissionGateProps & { permission: Permission }) {
  const { hasPermission, loading } = usePermission(permission);

  if (loading && loadingFallback) {
    return <>{loadingFallback}</>;
  }

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Render children only if user has ANY of the required permissions
 *
 * @example
 * <RequireAnyPermission permissions={[PERMISSIONS.COURSE.VIEW_OWN, PERMISSIONS.COURSE.VIEW_ALL]}>
 *   <CourseList />
 * </RequireAnyPermission>
 */
export function RequireAnyPermission({
  permissions,
  children,
  fallback = null,
  loadingFallback = null,
}: PermissionGateProps & { permissions: Permission[] }) {
  const { hasAnyPermission, loading } = useAnyPermission(permissions);

  if (loading && loadingFallback) {
    return <>{loadingFallback}</>;
  }

  if (!hasAnyPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Render children only if user has ALL of the required permissions
 *
 * @example
 * <RequireAllPermissions permissions={[PERMISSIONS.COURSE.EDIT_OWN, PERMISSIONS.COURSE.PUBLISH]}>
 *   <PublishButton />
 * </RequireAllPermissions>
 */
export function RequireAllPermissions({
  permissions,
  children,
  fallback = null,
  loadingFallback = null,
}: PermissionGateProps & { permissions: Permission[] }) {
  const { hasAllPermissions, loading } = useAllPermissions(permissions);

  if (loading && loadingFallback) {
    return <>{loadingFallback}</>;
  }

  if (!hasAllPermissions) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ===================================================
// ROLE GATE COMPONENTS
// ===================================================

/**
 * Render children only if user has required role
 *
 * @example
 * <RequireRole role={ROLES.ADMIN}>
 *   <AdminPanel />
 * </RequireRole>
 */
export function RequireRole({
  role,
  children,
  fallback = null,
  loadingFallback = null,
}: PermissionGateProps & { role: Role }) {
  const { hasRole, loading } = useRole(role);

  if (loading && loadingFallback) {
    return <>{loadingFallback}</>;
  }

  if (!hasRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Render children only if user has ANY of the required roles
 *
 * @example
 * <RequireAnyRole roles={[ROLES.VERIFIED_INSTRUCTOR, ROLES.ADMIN]}>
 *   <CreateCourseButton />
 * </RequireAnyRole>
 */
export function RequireAnyRole({
  roles,
  children,
  fallback = null,
  loadingFallback = null,
}: PermissionGateProps & { roles: Role[] }) {
  const { hasAnyRole, loading } = useAnyRole(roles);

  if (loading && loadingFallback) {
    return <>{loadingFallback}</>;
  }

  if (!hasAnyRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ===================================================
// RESOURCE OWNERSHIP GATES
// ===================================================

/**
 * Render children only if user owns the resource
 *
 * @example
 * <RequireOwnership resource={course}>
 *   <EditButton />
 * </RequireOwnership>
 */
export function RequireOwnership({
  resource,
  children,
  fallback = null,
  loadingFallback = null,
}: PermissionGateProps & { resource: any }) {
  const { isOwner, loading } = useIsOwner(resource);

  if (loading && loadingFallback) {
    return <>{loadingFallback}</>;
  }

  if (!isOwner) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Render children only if user can edit the resource
 *
 * @example
 * <RequireCanEdit resource={course} permission={PERMISSIONS.COURSE.EDIT_OWN}>
 *   <EditCourseButton />
 * </RequireCanEdit>
 */
export function RequireCanEdit({
  resource,
  permission,
  children,
  fallback = null,
  loadingFallback = null,
}: PermissionGateProps & { resource: any; permission: Permission }) {
  const { canEdit, loading } = useCanEdit(resource, permission);

  if (loading && loadingFallback) {
    return <>{loadingFallback}</>;
  }

  if (!canEdit) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Render children only if user can delete the resource
 *
 * @example
 * <RequireCanDelete resource={course} permission={PERMISSIONS.COURSE.DELETE_OWN}>
 *   <DeleteButton />
 * </RequireCanDelete>
 */
export function RequireCanDelete({
  resource,
  permission,
  children,
  fallback = null,
  loadingFallback = null,
}: PermissionGateProps & { resource: any; permission: Permission }) {
  const { canDelete, loading } = useCanDelete(resource, permission);

  if (loading && loadingFallback) {
    return <>{loadingFallback}</>;
  }

  if (!canDelete) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ===================================================
// CONDITIONAL RENDER COMPONENTS
// ===================================================

interface ConditionalRenderProps {
  when: boolean;
  children: ReactNode;
  fallback?: ReactNode;
  loading?: boolean;
  loadingFallback?: ReactNode;
}

/**
 * Generic conditional render component
 * Useful for custom permission logic
 *
 * @example
 * const { isOwner } = useIsOwner(course);
 * <ConditionalRender when={isOwner}>
 *   <EditButton />
 * </ConditionalRender>
 */
export function ConditionalRender({
  when,
  children,
  fallback = null,
  loading = false,
  loadingFallback = null,
}: ConditionalRenderProps) {
  if (loading && loadingFallback) {
    return <>{loadingFallback}</>;
  }

  if (!when) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ===================================================
// COMPOUND PERMISSION GATE
// ===================================================

interface PermissionGateConfig {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean; // If true, requires ALL permissions; if false, requires ANY
  role?: Role;
  roles?: Role[];
  requireAllRoles?: boolean;
  resource?: any;
  requireOwnership?: boolean;
  canEdit?: boolean;
  editPermission?: Permission;
  canDelete?: boolean;
  deletePermission?: Permission;
}

/**
 * Compound permission gate with multiple check options
 * Provides a single component for complex permission logic
 *
 * @example
 * // Check single permission
 * <PermissionGate permission={PERMISSIONS.COURSE.CREATE}>
 *   <CreateButton />
 * </PermissionGate>
 *
 * // Check multiple permissions (ANY)
 * <PermissionGate permissions={[PERMISSIONS.COURSE.EDIT_OWN, PERMISSIONS.COURSE.EDIT_ALL]}>
 *   <EditButton />
 * </PermissionGate>
 *
 * // Check multiple permissions (ALL)
 * <PermissionGate permissions={[...]} requireAll>
 *   <AdvancedFeature />
 * </PermissionGate>
 *
 * // Check role
 * <PermissionGate role={ROLES.ADMIN}>
 *   <AdminPanel />
 * </PermissionGate>
 *
 * // Check ownership
 * <PermissionGate resource={course} requireOwnership>
 *   <OwnerActions />
 * </PermissionGate>
 *
 * // Check can edit
 * <PermissionGate resource={course} canEdit editPermission={PERMISSIONS.COURSE.EDIT_OWN}>
 *   <EditButton />
 * </PermissionGate>
 *
 * // Complex combination
 * <PermissionGate
 *   permissions={[PERMISSIONS.COURSE.EDIT_OWN]}
 *   resource={course}
 *   requireOwnership
 * >
 *   <EditButton />
 * </PermissionGate>
 */
export function PermissionGate({
  config,
  children,
  fallback = null,
  loadingFallback = null,
}: {
  config: PermissionGateConfig;
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}) {
  // Single permission check
  if (config.permission) {
    return (
      <RequirePermission
        permission={config.permission}
        fallback={fallback}
        loadingFallback={loadingFallback}
      >
        {children}
      </RequirePermission>
    );
  }

  // Multiple permissions check
  if (config.permissions) {
    if (config.requireAll) {
      return (
        <RequireAllPermissions
          permissions={config.permissions}
          fallback={fallback}
          loadingFallback={loadingFallback}
        >
          {children}
        </RequireAllPermissions>
      );
    } else {
      return (
        <RequireAnyPermission
          permissions={config.permissions}
          fallback={fallback}
          loadingFallback={loadingFallback}
        >
          {children}
        </RequireAnyPermission>
      );
    }
  }

  // Single role check
  if (config.role) {
    return (
      <RequireRole
        role={config.role}
        fallback={fallback}
        loadingFallback={loadingFallback}
      >
        {children}
      </RequireRole>
    );
  }

  // Multiple roles check
  if (config.roles) {
    return (
      <RequireAnyRole
        roles={config.roles}
        fallback={fallback}
        loadingFallback={loadingFallback}
      >
        {children}
      </RequireAnyRole>
    );
  }

  // Ownership check
  if (config.requireOwnership && config.resource) {
    return (
      <RequireOwnership
        resource={config.resource}
        fallback={fallback}
        loadingFallback={loadingFallback}
      >
        {children}
      </RequireOwnership>
    );
  }

  // Can edit check
  if (config.canEdit && config.resource && config.editPermission) {
    return (
      <RequireCanEdit
        resource={config.resource}
        permission={config.editPermission}
        fallback={fallback}
        loadingFallback={loadingFallback}
      >
        {children}
      </RequireCanEdit>
    );
  }

  // Can delete check
  if (config.canDelete && config.resource && config.deletePermission) {
    return (
      <RequireCanDelete
        resource={config.resource}
        permission={config.deletePermission}
        fallback={fallback}
        loadingFallback={loadingFallback}
      >
        {children}
      </RequireCanDelete>
    );
  }

  // No valid config, render children by default
  return <>{children}</>;
}

// Export all components
export default {
  RequirePermission,
  RequireAnyPermission,
  RequireAllPermissions,
  RequireRole,
  RequireAnyRole,
  RequireOwnership,
  RequireCanEdit,
  RequireCanDelete,
  ConditionalRender,
  PermissionGate,
};
