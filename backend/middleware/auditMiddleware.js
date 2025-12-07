/**
 * Audit Logging Middleware
 *
 * Automatically logs sensitive actions for security and compliance
 * Tracks who did what, when, and from where
 */

import AuditLog from '../models/AuditLog.js';

// ===================================================
// AUDIT ACTION TYPES
// ===================================================

export const AUDIT_ACTIONS = {
  // Authentication
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  PASSWORD_RESET: 'PASSWORD_RESET',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',

  // User management
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  USER_BAN: 'USER_BAN',
  USER_UNBAN: 'USER_UNBAN',
  USER_RESTORE: 'USER_RESTORE',

  // Role and permission changes
  ROLE_CHANGE: 'ROLE_CHANGE',
  PERMISSION_GRANT: 'PERMISSION_GRANT',
  PERMISSION_REVOKE: 'PERMISSION_REVOKE',
  INSTRUCTOR_VERIFY: 'INSTRUCTOR_VERIFY',

  // Course management
  COURSE_CREATE: 'COURSE_CREATE',
  COURSE_UPDATE: 'COURSE_UPDATE',
  COURSE_DELETE: 'COURSE_DELETE',
  COURSE_PUBLISH: 'COURSE_PUBLISH',
  COURSE_UNPUBLISH: 'COURSE_UNPUBLISH',

  // Admin actions
  ADMIN_SETTINGS_CHANGE: 'ADMIN_SETTINGS_CHANGE',
  BULK_UPDATE: 'BULK_UPDATE',
  BULK_DELETE: 'BULK_DELETE',
  DATA_EXPORT: 'DATA_EXPORT',

  // AI usage
  AI_GENERATION: 'AI_GENERATION',
  AI_VOICE_SESSION: 'AI_VOICE_SESSION',

  // Suspicious activity
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
};

// ===================================================
// SEVERITY LEVELS
// ===================================================

/**
 * Determine severity level based on action
 * @param {string} action - Audit action type
 * @returns {string} Severity level
 */
const getSeverityLevel = (action) => {
  // Critical actions
  const critical = [
    AUDIT_ACTIONS.USER_DELETE,
    AUDIT_ACTIONS.USER_BAN,
    AUDIT_ACTIONS.BULK_DELETE,
    AUDIT_ACTIONS.ADMIN_SETTINGS_CHANGE,
  ];

  // High severity actions
  const high = [
    AUDIT_ACTIONS.ROLE_CHANGE,
    AUDIT_ACTIONS.PERMISSION_GRANT,
    AUDIT_ACTIONS.PERMISSION_REVOKE,
    AUDIT_ACTIONS.COURSE_DELETE,
    AUDIT_ACTIONS.BULK_UPDATE,
    AUDIT_ACTIONS.DATA_EXPORT,
  ];

  // Medium severity actions
  const medium = [
    AUDIT_ACTIONS.USER_UPDATE,
    AUDIT_ACTIONS.COURSE_PUBLISH,
    AUDIT_ACTIONS.COURSE_UNPUBLISH,
    AUDIT_ACTIONS.INSTRUCTOR_VERIFY,
  ];

  if (critical.includes(action)) return 'critical';
  if (high.includes(action)) return 'high';
  if (medium.includes(action)) return 'medium';
  return 'low';
};

// ===================================================
// AUDIT LOGGER HELPER
// ===================================================

/**
 * Log an action to the audit trail
 * @param {Object} logData - Log data
 * @returns {Promise<void>}
 */
export const logAudit = async (logData) => {
  try {
    // Ensure severity is set
    if (!logData.severity) {
      logData.severity = getSeverityLevel(logData.action);
    }

    // Ensure timestamp is set
    if (!logData.timestamp) {
      logData.timestamp = new Date();
    }

    // Create audit log
    await AuditLog.logAction(logData);

    // Log critical actions to console as well
    if (logData.severity === 'critical') {
      console.warn('[CRITICAL AUDIT]', {
        user: logData.userEmail,
        action: logData.action,
        resource: logData.resource,
        timestamp: logData.timestamp,
      });
    }
  } catch (error) {
    // Don't let logging errors break the application
    console.error('Failed to create audit log:', error);
  }
};

// ===================================================
// AUDIT MIDDLEWARE
// ===================================================

/**
 * Middleware to automatically log actions
 * Call this AFTER the action is completed
 *
 * @param {string} action - Action type from AUDIT_ACTIONS
 * @param {Object} options - Logging options
 * @returns {Function} Express middleware
 *
 * @example
 * router.post('/users', protect, createUser, auditLog(AUDIT_ACTIONS.USER_CREATE));
 */
export const auditLog = (action, options = {}) => {
  return async (req, res, next) => {
    try {
      // Only log if user is authenticated (or if explicitly allowed for anonymous)
      if (!req.user && !options.allowAnonymous) {
        return next();
      }

      // Extract log data from request
      const logData = {
        user: req.user?._id,
        userEmail: req.user?.email || 'anonymous',
        userRole: req.user?.role || 'anonymous',
        action,
        resource: {
          type: options.resourceType || 'Unknown',
          id: options.getResourceId ? options.getResourceId(req, res) : null,
          name: options.getResourceName ? options.getResourceName(req, res) : null,
        },
        context: {
          ip: req.context?.ip || req.ip || 'unknown',
          userAgent: req.context?.userAgent || req.headers['user-agent'],
          method: req.method,
          path: req.originalUrl || req.url,
          statusCode: res.statusCode,
        },
        metadata: options.getMetadata ? options.getMetadata(req, res) : {},
        severity: options.severity || getSeverityLevel(action),
        status: res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'failure',
      };

      // Get changes if provided
      if (options.getChanges) {
        logData.changes = options.getChanges(req, res);
      }

      // Log to database
      await logAudit(logData);

      next();
    } catch (error) {
      console.error('Audit middleware error:', error);
      // Don't block the request
      next();
    }
  };
};

/**
 * Manually log an action from within a controller
 * @param {Object} req - Express request
 * @param {string} action - Action type
 * @param {Object} details - Additional details
 *
 * @example
 * await manualAuditLog(req, AUDIT_ACTIONS.COURSE_CREATE, {
 *   resourceType: 'Course',
 *   resourceId: course._id,
 *   resourceName: course.title,
 * });
 */
export const manualAuditLog = async (req, action, details = {}) => {
  try {
    const logData = {
      user: req.user?._id,
      userEmail: req.user?.email || 'anonymous',
      userRole: req.user?.role || 'anonymous',
      action,
      resource: {
        type: details.resourceType || 'Unknown',
        id: details.resourceId || null,
        name: details.resourceName || null,
      },
      context: {
        ip: req.context?.ip || req.ip || 'unknown',
        userAgent: req.context?.userAgent || req.headers['user-agent'],
        method: req.method,
        path: req.originalUrl || req.url,
        statusCode: details.statusCode || 200,
      },
      metadata: details.metadata || {},
      changes: details.changes || {},
      severity: details.severity || getSeverityLevel(action),
      status: details.status || 'success',
      error: details.error || null,
    };

    await logAudit(logData);
  } catch (error) {
    console.error('Manual audit log error:', error);
  }
};

// ===================================================
// SPECIALIZED AUDIT LOGGERS
// ===================================================

/**
 * Log authentication events
 * @param {Object} req - Express request
 * @param {Object} user - User object
 * @param {boolean} success - Whether login was successful
 */
export const logAuth = async (req, user, success = true) => {
  const action = success ? AUDIT_ACTIONS.LOGIN : AUDIT_ACTIONS.LOGIN_FAILED;

  await logAudit({
    user: user?._id || null,
    userEmail: user?.email || req.body?.email || 'unknown',
    userRole: user?.role || 'unknown',
    action,
    resource: {
      type: 'Auth',
      id: user?._id,
      name: user?.email,
    },
    context: {
      ip: req.context?.ip || req.ip || 'unknown',
      userAgent: req.headers['user-agent'],
      method: req.method,
      path: req.originalUrl,
      statusCode: success ? 200 : 401,
    },
    severity: success ? 'low' : 'medium',
    status: success ? 'success' : 'failure',
  });
};

/**
 * Log role changes
 * @param {Object} req - Express request
 * @param {Object} targetUser - User whose role is being changed
 * @param {string} oldRole - Previous role
 * @param {string} newRole - New role
 */
export const logRoleChange = async (req, targetUser, oldRole, newRole) => {
  await logAudit({
    user: req.user._id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: AUDIT_ACTIONS.ROLE_CHANGE,
    resource: {
      type: 'User',
      id: targetUser._id,
      name: targetUser.email,
    },
    changes: {
      before: { role: oldRole },
      after: { role: newRole },
    },
    context: {
      ip: req.context?.ip || req.ip,
      userAgent: req.headers['user-agent'],
      method: req.method,
      path: req.originalUrl,
      statusCode: 200,
    },
    severity: 'high',
    status: 'success',
  });
};

/**
 * Log resource deletion
 * @param {Object} req - Express request
 * @param {string} resourceType - Type of resource
 * @param {Object} resource - Resource being deleted
 */
export const logDeletion = async (req, resourceType, resource) => {
  const action = resourceType === 'User' ? AUDIT_ACTIONS.USER_DELETE : AUDIT_ACTIONS.COURSE_DELETE;

  await logAudit({
    user: req.user._id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action,
    resource: {
      type: resourceType,
      id: resource._id,
      name: resource.name || resource.title || resource.email || 'Unknown',
    },
    changes: {
      before: resource.toObject ? resource.toObject() : resource,
      after: null,
    },
    context: {
      ip: req.context?.ip || req.ip,
      userAgent: req.headers['user-agent'],
      method: req.method,
      path: req.originalUrl,
      statusCode: 200,
    },
    severity: 'critical',
    status: 'success',
  });
};

/**
 * Log unauthorized access attempts
 * @param {Object} req - Express request
 * @param {string} reason - Reason for denial
 */
export const logUnauthorizedAccess = async (req, reason = 'Permission denied') => {
  await logAudit({
    user: req.user?._id || null,
    userEmail: req.user?.email || 'anonymous',
    userRole: req.user?.role || 'anonymous',
    action: AUDIT_ACTIONS.UNAUTHORIZED_ACCESS,
    resource: {
      type: 'Access',
      id: null,
      name: req.originalUrl,
    },
    context: {
      ip: req.context?.ip || req.ip,
      userAgent: req.headers['user-agent'],
      method: req.method,
      path: req.originalUrl,
      statusCode: 403,
    },
    metadata: {
      reason,
    },
    severity: 'high',
    status: 'failure',
  });
};

/**
 * Log rate limit exceeded
 * @param {Object} req - Express request
 * @param {string} limitType - Type of rate limit
 */
export const logRateLimitExceeded = async (req, limitType) => {
  await logAudit({
    user: req.user?._id || null,
    userEmail: req.user?.email || 'anonymous',
    userRole: req.user?.role || 'anonymous',
    action: AUDIT_ACTIONS.RATE_LIMIT_EXCEEDED,
    resource: {
      type: 'RateLimit',
      id: null,
      name: limitType,
    },
    context: {
      ip: req.context?.ip || req.ip,
      userAgent: req.headers['user-agent'],
      method: req.method,
      path: req.originalUrl,
      statusCode: 429,
    },
    metadata: {
      limitType,
      rateLimit: req.rateLimit || {},
    },
    severity: 'medium',
    status: 'failure',
  });
};

// ===================================================
// AUDIT TRAIL MIDDLEWARE (REQUEST/RESPONSE LOGGING)
// ===================================================

/**
 * Middleware to log all requests (use sparingly, creates lots of logs)
 * Only enable for high-security endpoints
 */
export const auditTrail = (options = {}) => {
  return async (req, res, next) => {
    // Skip if not authenticated and not allowing anonymous
    if (!req.user && !options.allowAnonymous) {
      return next();
    }

    // Capture response
    const originalSend = res.send;
    const startTime = Date.now();

    res.send = function (data) {
      res.send = originalSend; // Restore original

      // Log after response is sent
      process.nextTick(async () => {
        try {
          await logAudit({
            user: req.user?._id || null,
            userEmail: req.user?.email || 'anonymous',
            userRole: req.user?.role || 'anonymous',
            action: `${req.method}_REQUEST`,
            resource: {
              type: 'API',
              id: null,
              name: req.originalUrl,
            },
            context: {
              ip: req.context?.ip || req.ip,
              userAgent: req.headers['user-agent'],
              method: req.method,
              path: req.originalUrl,
              statusCode: res.statusCode,
            },
            metadata: {
              duration: Date.now() - startTime,
              query: req.query,
              params: req.params,
            },
            severity: 'low',
            status: res.statusCode < 400 ? 'success' : 'failure',
          });
        } catch (error) {
          console.error('Audit trail error:', error);
        }
      });

      return originalSend.call(this, data);
    };

    next();
  };
};

// ===================================================
// EXPORTS
// ===================================================

export default {
  auditLog,
  manualAuditLog,
  logAuth,
  logRoleChange,
  logDeletion,
  logUnauthorizedAccess,
  logRateLimitExceeded,
  auditTrail,
  AUDIT_ACTIONS,
};
