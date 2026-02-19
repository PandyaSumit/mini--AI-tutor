/**
 * RBAC (Role-Based Access Control) Middleware
 *
 * Provides middleware functions for checking permissions and authorizing users
 * Uses the centralized PermissionService for all permission checks
 */

import permissionService from '../services/permissionService.js';
import { PERMISSIONS, ROLES } from '../config/permissions.js';

// ===================================================
// PERMISSION-BASED MIDDLEWARE
// ===================================================

/**
 * Middleware to require a specific permission
 * @param {string} permission - Permission required
 * @param {Object} options - Additional options
 * @param {string} options.message - Custom error message
 * @returns {Function} Express middleware
 *
 * @example
 * router.post('/courses', protect, requirePermission(PERMISSIONS.COURSE.CREATE), createCourse);
 */
export const requirePermission = (permission, options = {}) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Check if user has the permission
      if (!permissionService.hasPermission(req.user, permission)) {
        return res.status(403).json({
          success: false,
          error: options.message || `You don't have permission to perform this action`,
          requiredPermission: permission
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Authorization check failed'
      });
    }
  };
};

/**
 * Middleware to require ANY of the specified permissions
 * @param {string[]} permissions - Array of permissions (user needs at least one)
 * @param {Object} options - Additional options
 * @returns {Function} Express middleware
 *
 * @example
 * router.get('/courses/:id', protect,
 *   requireAnyPermission([PERMISSIONS.COURSE.VIEW_OWN, PERMISSIONS.COURSE.VIEW_ALL]),
 *   getCourse
 * );
 */
export const requireAnyPermission = (permissions, options = {}) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      if (!permissionService.hasAnyPermission(req.user, permissions)) {
        return res.status(403).json({
          success: false,
          error: options.message || 'You don\'t have the required permissions',
          requiredPermissions: permissions
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Authorization check failed'
      });
    }
  };
};

/**
 * Middleware to require ALL of the specified permissions
 * @param {string[]} permissions - Array of permissions (user needs all)
 * @param {Object} options - Additional options
 * @returns {Function} Express middleware
 */
export const requireAllPermissions = (permissions, options = {}) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      if (!permissionService.hasAllPermissions(req.user, permissions)) {
        return res.status(403).json({
          success: false,
          error: options.message || 'You don\'t have all required permissions',
          requiredPermissions: permissions
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Authorization check failed'
      });
    }
  };
};

// ===================================================
// ROLE-BASED MIDDLEWARE
// ===================================================

/**
 * Middleware to require a specific role
 * @param {string} role - Role required
 * @param {Object} options - Additional options
 * @returns {Function} Express middleware
 *
 * @example
 * router.get('/admin/dashboard', protect, requireRole(ROLES.ADMIN), getAdminDashboard);
 */
export const requireRole = (role, options = {}) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      if (!permissionService.hasRole(req.user, role)) {
        return res.status(403).json({
          success: false,
          error: options.message || `Role '${role}' is required`,
          requiredRole: role
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Authorization check failed'
      });
    }
  };
};

/**
 * Middleware to require ANY of the specified roles
 * @param {string[]} roles - Array of roles (user needs at least one)
 * @param {Object} options - Additional options
 * @returns {Function} Express middleware
 *
 * @example
 * router.post('/courses', protect,
 *   requireAnyRole([ROLES.VERIFIED_INSTRUCTOR, ROLES.PLATFORM_AUTHOR, ROLES.ADMIN]),
 *   createCourse
 * );
 */
export const requireAnyRole = (roles, options = {}) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      if (!permissionService.hasAnyRole(req.user, roles)) {
        return res.status(403).json({
          success: false,
          error: options.message || 'You don\'t have the required role',
          requiredRoles: roles,
          currentRole: req.user.role
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Authorization check failed'
      });
    }
  };
};

// ===================================================
// RESOURCE OWNERSHIP MIDDLEWARE
// ===================================================

/**
 * Middleware to check if user owns the resource
 * Fetches resource and checks ownership
 * @param {Function} fetchResource - Function to fetch resource (receives req)
 * @param {Object} options - Additional options
 * @param {string} options.message - Custom error message
 * @param {string} options.resourceKey - Key to store resource in req (default: 'resource')
 * @returns {Function} Express middleware
 *
 * @example
 * router.put('/courses/:id', protect,
 *   checkOwnership(async (req) => await Course.findById(req.params.id)),
 *   updateCourse
 * );
 */
export const checkOwnership = (fetchResource, options = {}) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Fetch the resource
      const resource = await fetchResource(req);

      if (!resource) {
        return res.status(404).json({
          success: false,
          error: 'Resource not found'
        });
      }

      // Admins can access any resource
      if (permissionService.hasRole(req.user, ROLES.ADMIN)) {
        req[options.resourceKey || 'resource'] = resource;
        return next();
      }

      // Check ownership
      if (!permissionService.isOwner(req.user, resource)) {
        return res.status(403).json({
          success: false,
          error: options.message || 'You can only access your own resources'
        });
      }

      // Store resource in request for use in controller
      req[options.resourceKey || 'resource'] = resource;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Ownership check failed',
        details: error.message
      });
    }
  };
};

/**
 * Middleware to check if user can edit a resource
 * Combines ownership and permission checks
 * @param {Function} fetchResource - Function to fetch resource
 * @param {string} editPermission - Permission required to edit
 * @param {Object} options - Additional options
 * @returns {Function} Express middleware
 */
export const checkCanEdit = (fetchResource, editPermission, options = {}) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const resource = await fetchResource(req);

      if (!resource) {
        return res.status(404).json({
          success: false,
          error: 'Resource not found'
        });
      }

      if (!permissionService.canEdit(req.user, resource, editPermission)) {
        return res.status(403).json({
          success: false,
          error: options.message || 'You don\'t have permission to edit this resource'
        });
      }

      req[options.resourceKey || 'resource'] = resource;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Edit permission check failed',
        details: error.message
      });
    }
  };
};

/**
 * Middleware to check if user can delete a resource
 * @param {Function} fetchResource - Function to fetch resource
 * @param {string} deletePermission - Permission required to delete
 * @param {Object} options - Additional options
 * @returns {Function} Express middleware
 */
export const checkCanDelete = (fetchResource, deletePermission, options = {}) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const resource = await fetchResource(req);

      if (!resource) {
        return res.status(404).json({
          success: false,
          error: 'Resource not found'
        });
      }

      if (!permissionService.canDelete(req.user, resource, deletePermission)) {
        return res.status(403).json({
          success: false,
          error: options.message || 'You don\'t have permission to delete this resource'
        });
      }

      req[options.resourceKey || 'resource'] = resource;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Delete permission check failed',
        details: error.message
      });
    }
  };
};

// ===================================================
// COURSE-SPECIFIC MIDDLEWARE
// ===================================================

/**
 * Middleware to check if user can edit a course
 * Checks for founder, co-creator, or admin status
 * @param {Object} options - Additional options
 * @returns {Function} Express middleware
 */
export const checkCanEditCourse = (options = {}) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Course should be loaded by previous middleware or fetch it
      let course = req.course;
      if (!course) {
        const Course = (await import('../models/Course.js')).default;
        course = await Course.findById(req.params.courseId || req.params.id);
      }

      if (!course) {
        return res.status(404).json({
          success: false,
          error: 'Course not found'
        });
      }

      if (!permissionService.canEditCourse(req.user, course)) {
        return res.status(403).json({
          success: false,
          error: options.message || 'You don\'t have permission to edit this course'
        });
      }

      req.course = course;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Course edit permission check failed',
        details: error.message
      });
    }
  };
};

/**
 * Middleware to check if user is course founder
 * @param {Object} options - Additional options
 * @returns {Function} Express middleware
 */
export const checkCourseFounder = (options = {}) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      let course = req.course;
      if (!course) {
        const Course = (await import('../models/Course.js')).default;
        course = await Course.findById(req.params.courseId || req.params.id);
      }

      if (!course) {
        return res.status(404).json({
          success: false,
          error: 'Course not found'
        });
      }

      if (!permissionService.isCourseFounder(req.user, course)) {
        return res.status(403).json({
          success: false,
          error: options.message || 'Only the course founder can perform this action'
        });
      }

      req.course = course;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Founder check failed',
        details: error.message
      });
    }
  };
};

// ===================================================
// AI QUOTA MIDDLEWARE
// ===================================================

/**
 * Middleware to check AI usage quota
 * @param {string} quotaType - Type of quota to check (chatMessages, voiceMinutes, courseGenerations)
 * @param {Object} options - Additional options
 * @returns {Function} Express middleware
 *
 * @example
 * router.post('/ai/chat', protect, checkAIQuota('chatMessages'), sendAIMessage);
 */
export const checkAIQuota = (quotaType, options = {}) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const quotaCheck = permissionService.checkAIQuota(req.user, quotaType);

      if (!quotaCheck.allowed) {
        return res.status(429).json({
          success: false,
          error: 'AI usage quota exceeded',
          quotaType,
          quota: quotaCheck
        });
      }

      // Store quota info in request for controller use
      req.aiQuota = quotaCheck;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Quota check failed',
        details: error.message
      });
    }
  };
};

// ===================================================
// COMBINED MIDDLEWARE HELPERS
// ===================================================

/**
 * Middleware to require permission OR ownership
 * User can proceed if they either have the permission OR own the resource
 * @param {Function} fetchResource - Function to fetch resource
 * @param {string} permission - Permission to check
 * @param {Object} options - Additional options
 * @returns {Function} Express middleware
 */
export const requirePermissionOrOwnership = (fetchResource, permission, options = {}) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Check if user has the permission (e.g., admin can access all)
      if (permissionService.hasPermission(req.user, permission)) {
        return next();
      }

      // Otherwise, check ownership
      const resource = await fetchResource(req);

      if (!resource) {
        return res.status(404).json({
          success: false,
          error: 'Resource not found'
        });
      }

      if (!permissionService.isOwner(req.user, resource)) {
        return res.status(403).json({
          success: false,
          error: options.message || 'Access denied'
        });
      }

      req[options.resourceKey || 'resource'] = resource;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Authorization check failed',
        details: error.message
      });
    }
  };
};

// ===================================================
// EXPORT ALL MIDDLEWARE
// ===================================================

export default {
  // Permission-based
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,

  // Role-based
  requireRole,
  requireAnyRole,

  // Resource ownership
  checkOwnership,
  checkCanEdit,
  checkCanDelete,

  // Course-specific
  checkCanEditCourse,
  checkCourseFounder,

  // AI quota
  checkAIQuota,

  // Combined
  requirePermissionOrOwnership,

  // Re-export for convenience
  PERMISSIONS,
  ROLES,
};
