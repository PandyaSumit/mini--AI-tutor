/**
 * Admin Authorization Middleware
 *
 * CRITICAL SECURITY: This middleware ensures only verified admin users
 * can access admin-only routes and operations.
 *
 * Multi-layer security:
 * 1. User must be authenticated
 * 2. User role must be 'admin'
 * 3. Optional: Verify against whitelist of admin emails
 * 4. Log all admin actions for audit trail
 */

import AdminActionLog from '../models/AdminActionLog.js';

/**
 * Whitelist of admin emails (CONFIGURE THIS!)
 * For maximum security, only these emails can be admins
 * even if their role is set to 'admin' in database
 */
const ADMIN_EMAIL_WHITELIST = [
  // Add your email here
  process.env.ADMIN_EMAIL || 'admin@example.com',
  // You can add more trusted admin emails
];

/**
 * Main admin authorization middleware
 */
export const requireAdmin = async (req, res, next) => {
  try {
    // 1. Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // 2. Check if user has admin role
    if (req.user.role !== 'admin') {
      // Log unauthorized access attempt
      console.warn(`⚠️  SECURITY: Non-admin user ${req.user.email} (${req.user._id}) attempted to access admin route: ${req.originalUrl}`);

      return res.status(403).json({
        success: false,
        error: 'Access denied. Administrator privileges required.'
      });
    }

    // 3. (Optional) Verify against whitelist for extra security
    // Uncomment this block to enable whitelist checking
    /*
    if (!ADMIN_EMAIL_WHITELIST.includes(req.user.email)) {
      console.error(`🚨 SECURITY ALERT: User ${req.user.email} has admin role but not in whitelist!`);

      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not authorized as a platform administrator.'
      });
    }
    */

    // 4. Log admin access for audit trail
    console.log(`✅ Admin access: ${req.user.email} → ${req.method} ${req.originalUrl}`);

    // Admin is verified, proceed
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authorization check failed'
    });
  }
};

/**
 * Middleware to log admin actions
 * Use this for sensitive operations (approve instructor, delete user, etc.)
 */
export const logAdminAction = (actionType) => {
  return async (req, res, next) => {
    // Store original send function
    const originalSend = res.json;

    // Override res.json to log after response
    res.json = function(data) {
      // Log the admin action
      logAction(req, actionType, data.success || false);

      // Call original send
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Helper function to create audit log entry
 */
async function logAction(req, actionType, success) {
  try {
    await AdminActionLog.create({
      adminUser: req.user._id,
      adminEmail: req.user.email,
      actionType,
      targetResource: req.params.id || req.params.userId || null,
      requestMethod: req.method,
      requestPath: req.originalUrl,
      requestBody: sanitizeRequestBody(req.body),
      requestQuery: req.query,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      success,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // Don't throw - logging failure shouldn't break the request
  }
}

/**
 * Sanitize request body for logging (remove sensitive data)
 */
function sanitizeRequestBody(body) {
  if (!body) return null;

  const sanitized = { ...body };

  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.secret;
  delete sanitized.apiKey;
  delete sanitized.payoutDetails;

  return sanitized;
}

/**
 * Middleware to prevent non-admins from changing roles
 * Use this on user update endpoints
 */
export const preventRoleEscalation = (req, res, next) => {
  // If request body includes role change
  if (req.body.role) {
    // Only admins can change roles
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can modify user roles'
      });
    }

    // Prevent changing own role (safety measure)
    if (req.params.id === req.user._id.toString() || req.params.userId === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You cannot modify your own role for security reasons'
      });
    }

    // Log role change attempt
    console.log(`🔐 ROLE CHANGE: Admin ${req.user.email} attempting to change user ${req.params.id || req.params.userId} to role: ${req.body.role}`);
  }

  next();
};

/**
 * Check if user is admin (without blocking request)
 * Returns boolean, useful for conditional logic
 */
export const isAdmin = (req) => {
  return req.user && req.user.role === 'admin';
};

/**
 * Middleware to require platform author or admin
 */
export const requirePlatformAuthor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.user.role !== 'platform_author' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Platform author or administrator privileges required'
    });
  }

  next();
};

export default {
  requireAdmin,
  logAdminAction,
  preventRoleEscalation,
  isAdmin,
  requirePlatformAuthor
};
