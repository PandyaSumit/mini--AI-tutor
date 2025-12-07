/**
 * Permission Service
 *
 * Centralized service for checking user permissions
 * Provides methods to verify if users have specific permissions
 */

import { PERMISSIONS, ROLES, getRolePermissions, roleHasPermission } from '../config/permissions.js';

class PermissionService {
  /**
   * Check if a user has a specific permission
   * @param {Object} user - User object with role and optional permission overrides
   * @param {string} permission - Permission to check
   * @returns {boolean} True if user has permission
   */
  hasPermission(user, permission) {
    if (!user) {
      return false;
    }

    // Admins have all permissions
    if (user.role === ROLES.ADMIN) {
      return true;
    }

    // Check if user's role has this permission
    const rolePermissions = getRolePermissions(user.role);
    if (rolePermissions.includes(permission)) {
      return true;
    }

    // Check user-specific permission overrides (if implemented)
    if (user.permissions && user.permissions.includes(permission)) {
      return true;
    }

    return false;
  }

  /**
   * Check if user has ANY of the specified permissions
   * @param {Object} user - User object
   * @param {string[]} permissions - Array of permissions to check
   * @returns {boolean} True if user has at least one permission
   */
  hasAnyPermission(user, permissions) {
    return permissions.some(permission => this.hasPermission(user, permission));
  }

  /**
   * Check if user has ALL of the specified permissions
   * @param {Object} user - User object
   * @param {string[]} permissions - Array of permissions to check
   * @returns {boolean} True if user has all permissions
   */
  hasAllPermissions(user, permissions) {
    return permissions.every(permission => this.hasPermission(user, permission));
  }

  /**
   * Check if user has a specific role
   * @param {Object} user - User object
   * @param {string} role - Role to check
   * @returns {boolean} True if user has role
   */
  hasRole(user, role) {
    return user && user.role === role;
  }

  /**
   * Check if user has ANY of the specified roles
   * @param {Object} user - User object
   * @param {string[]} roles - Array of roles to check
   * @returns {boolean} True if user has at least one role
   */
  hasAnyRole(user, roles) {
    return roles.includes(user?.role);
  }

  /**
   * Check if user is the owner of a resource
   * @param {Object} user - User object
   * @param {Object} resource - Resource object with userId or user field
   * @returns {boolean} True if user owns the resource
   */
  isOwner(user, resource) {
    if (!user || !resource) {
      return false;
    }

    // Check different field names for owner
    const ownerId = resource.userId || resource.user || resource.createdBy || resource.instructor;

    if (!ownerId) {
      return false;
    }

    // Handle both string and ObjectId
    const ownerIdString = ownerId.toString ? ownerId.toString() : String(ownerId);
    const userIdString = user._id.toString ? user._id.toString() : String(user._id);

    return ownerIdString === userIdString;
  }

  /**
   * Check if user can edit a resource
   * Combines ownership check with edit permission
   * @param {Object} user - User object
   * @param {Object} resource - Resource object
   * @param {string} editPermission - Permission required to edit
   * @returns {boolean} True if user can edit
   */
  canEdit(user, resource, editPermission) {
    // Admins can edit everything
    if (this.hasRole(user, ROLES.ADMIN)) {
      return true;
    }

    // Owners with edit permission can edit
    if (this.isOwner(user, resource) && this.hasPermission(user, editPermission)) {
      return true;
    }

    // Check for global edit permission (e.g., edit_all)
    const globalEditPermission = editPermission.replace('_own', '_all');
    if (this.hasPermission(user, globalEditPermission)) {
      return true;
    }

    return false;
  }

  /**
   * Check if user can delete a resource
   * Combines ownership check with delete permission
   * @param {Object} user - User object
   * @param {Object} resource - Resource object
   * @param {string} deletePermission - Permission required to delete
   * @returns {boolean} True if user can delete
   */
  canDelete(user, resource, deletePermission) {
    // Admins can delete everything
    if (this.hasRole(user, ROLES.ADMIN)) {
      return true;
    }

    // Owners with delete permission can delete
    if (this.isOwner(user, resource) && this.hasPermission(user, deletePermission)) {
      return true;
    }

    // Check for global delete permission
    const globalDeletePermission = deletePermission.replace('_own', '_all');
    if (this.hasPermission(user, globalDeletePermission)) {
      return true;
    }

    return false;
  }

  /**
   * Check if user can view a resource
   * @param {Object} user - User object
   * @param {Object} resource - Resource object
   * @param {string} viewPermission - Permission required to view
   * @returns {boolean} True if user can view
   */
  canView(user, resource, viewPermission) {
    // Admins can view everything
    if (this.hasRole(user, ROLES.ADMIN)) {
      return true;
    }

    // Check if resource is public
    if (resource.isPublic || resource.isPublished) {
      return true;
    }

    // Owners can view their own resources
    if (this.isOwner(user, resource)) {
      return true;
    }

    // Check for view permission
    if (this.hasPermission(user, viewPermission)) {
      return true;
    }

    return false;
  }

  /**
   * Check if user is a course collaborator
   * @param {Object} user - User object
   * @param {Object} course - Course object with contributors array
   * @param {string[]} allowedTypes - Array of allowed contributor types
   * @returns {boolean} True if user is a collaborator of allowed type
   */
  isCourseCollaborator(user, course, allowedTypes = ['founder', 'co-creator']) {
    if (!user || !course || !course.contributors) {
      return false;
    }

    const userIdString = user._id.toString ? user._id.toString() : String(user._id);

    const contributor = course.contributors.find(c => {
      const contributorUserId = c.user?._id || c.user;
      const contributorIdString = contributorUserId.toString ? contributorUserId.toString() : String(contributorUserId);
      return contributorIdString === userIdString;
    });

    if (!contributor) {
      return false;
    }

    // Check if contributor type is allowed
    if (!allowedTypes.includes(contributor.contributionType)) {
      return false;
    }

    // Check approval status if not founder
    if (contributor.contributionType !== 'founder' && contributor.approvalStatus !== 'approved') {
      return false;
    }

    return true;
  }

  /**
   * Check if user is course founder
   * @param {Object} user - User object
   * @param {Object} course - Course object
   * @returns {boolean} True if user is founder
   */
  isCourseFounder(user, course) {
    return this.isCourseCollaborator(user, course, ['founder']);
  }

  /**
   * Check if user can edit course
   * @param {Object} user - User object
   * @param {Object} course - Course object
   * @returns {boolean} True if user can edit course
   */
  canEditCourse(user, course) {
    // Admins can edit any course
    if (this.hasRole(user, ROLES.ADMIN)) {
      return true;
    }

    // Founders and co-creators can edit
    if (this.isCourseCollaborator(user, course, ['founder', 'co-creator'])) {
      return true;
    }

    // Check for global edit permission
    if (this.hasPermission(user, PERMISSIONS.COURSE.EDIT_ALL)) {
      return true;
    }

    return false;
  }

  /**
   * Check AI usage quota
   * @param {Object} user - User object
   * @param {string} quotaType - Type of quota (chatMessages, voiceMinutes, courseGenerations)
   * @returns {object} Quota information
   */
  checkAIQuota(user, quotaType) {
    if (!user || !user.aiUsage || !user.aiUsage.quotas) {
      return { allowed: false, reason: 'No quota information' };
    }

    // Unlimited for certain roles
    if (this.hasPermission(user, PERMISSIONS.AI.UNLIMITED_USAGE)) {
      return { allowed: true, unlimited: true };
    }

    const quota = user.aiUsage.quotas[quotaType];
    if (!quota) {
      return { allowed: false, reason: 'Invalid quota type' };
    }

    const remaining = quota.limit - quota.used;
    const allowed = remaining > 0;

    return {
      allowed,
      remaining,
      used: quota.used,
      limit: quota.limit,
      percentage: quota.limit > 0 ? (quota.used / quota.limit) * 100 : 0
    };
  }

  /**
   * Get all permissions for a user
   * @param {Object} user - User object
   * @returns {string[]} Array of permission strings
   */
  getUserPermissions(user) {
    if (!user) {
      return [];
    }

    const rolePermissions = getRolePermissions(user.role);
    const userPermissions = user.permissions || [];

    // Combine and deduplicate
    return [...new Set([...rolePermissions, ...userPermissions])];
  }

  /**
   * Check if user can perform action on resource
   * Generic permission check with ownership consideration
   * @param {Object} options - Check options
   * @param {Object} options.user - User object
   * @param {string} options.action - Action to perform (view, edit, delete, etc.)
   * @param {Object} options.resource - Resource object
   * @param {string} options.resourceType - Type of resource (course, user, etc.)
   * @returns {boolean} True if action is allowed
   */
  can({ user, action, resource, resourceType }) {
    if (!user) {
      return false;
    }

    // Build permission string
    const permission = `${resourceType}:${action}`;

    // Check if user has the permission
    if (this.hasPermission(user, permission)) {
      return true;
    }

    // Check ownership-based permissions
    if (resource && this.isOwner(user, resource)) {
      const ownPermission = `${resourceType}:${action}_own`;
      if (this.hasPermission(user, ownPermission)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Assert that user has permission (throws error if not)
   * @param {Object} user - User object
   * @param {string} permission - Permission to check
   * @throws {Error} If user doesn't have permission
   */
  assertPermission(user, permission) {
    if (!this.hasPermission(user, permission)) {
      const error = new Error(`Permission denied: ${permission}`);
      error.statusCode = 403;
      throw error;
    }
  }

  /**
   * Assert that user has role (throws error if not)
   * @param {Object} user - User object
   * @param {string} role - Role to check
   * @throws {Error} If user doesn't have role
   */
  assertRole(user, role) {
    if (!this.hasRole(user, role)) {
      const error = new Error(`Role required: ${role}`);
      error.statusCode = 403;
      throw error;
    }
  }

  /**
   * Generate permission denial response
   * @param {string} permission - Permission that was denied
   * @param {string} customMessage - Optional custom message
   * @returns {Object} Error response object
   */
  deniedResponse(permission, customMessage) {
    return {
      success: false,
      error: customMessage || `You don't have permission to perform this action`,
      requiredPermission: permission,
      statusCode: 403
    };
  }
}

// Export singleton instance
export default new PermissionService();
