import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header (for API clients)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in HTTP-only cookie (for web clients)
    else if (req.cookies && req.cookies.authToken) {
      token = req.cookies.authToken;
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please login.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

// Authorize specific roles (enhanced with detailed error messages)
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'You must be logged in to access this resource'
      });
    }

    if (!roles.includes(req.user.role)) {
      // Provide role-specific error messages
      const roleMessages = {
        learner: 'This feature is only available to instructors and authors',
        verified_instructor: 'This feature is only available to platform authors and administrators',
        platform_author: 'This feature is only available to administrators',
        admin: 'Access denied'
      };

      const message = roleMessages[req.user.role] || `Access denied. Required role: ${roles.join(' or ')}`;

      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        message,
        requiredRoles: roles,
        currentRole: req.user.role
      });
    }
    next();
  };
};

// Require instructor verification approval
export const requireVerification = async (req, res, next) => {
  try {
    const user = req.user;

    // Only check verification for instructors and authors
    if (user.role === 'verified_instructor' || user.role === 'platform_author') {
      const verificationStatus = user.instructorVerification?.status;

      if (verificationStatus !== 'approved') {
        return res.status(403).json({
          success: false,
          error: 'VERIFICATION_REQUIRED',
          message: 'Your instructor account must be verified to access this feature',
          verificationStatus: verificationStatus || 'not_submitted',
          verificationUrl: '/instructor/verification'
        });
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'VERIFICATION_CHECK_FAILED',
      message: 'Failed to verify instructor status'
    });
  }
};

// Require resource ownership (for courses, content, etc.)
export const requireOwnership = (resourceType = 'course') => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const resourceId = req.params.id || req.params.courseId || req.body.course_id;

      if (!resourceId) {
        return res.status(400).json({
          success: false,
          error: 'RESOURCE_ID_REQUIRED',
          message: 'Resource ID is required'
        });
      }

      // Admin can access all resources
      if (user.role === 'admin') {
        return next();
      }

      // Import models dynamically to avoid circular dependencies
      let Resource;
      if (resourceType === 'course') {
        const { default: Course } = await import('../models/Course.js');
        Resource = Course;
      }
      // Add more resource types as needed

      const resource = await Resource.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          error: 'RESOURCE_NOT_FOUND',
          message: `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} not found`
        });
      }

      // Check ownership
      const isOwner = resource.instructor?.toString() === user._id.toString() ||
                      resource.author?.toString() === user._id.toString() ||
                      resource.createdBy?.toString() === user._id.toString();

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          error: 'NOT_OWNER',
          message: `You do not have permission to modify this ${resourceType}`
        });
      }

      // Attach resource to request for use in handler
      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        error: 'OWNERSHIP_CHECK_FAILED',
        message: 'Failed to verify resource ownership'
      });
    }
  };
};
