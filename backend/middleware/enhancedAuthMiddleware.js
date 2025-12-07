/**
 * Enhanced Authentication Middleware
 *
 * Provides advanced authentication features:
 * - Token validation from cookies or headers
 * - Graceful error handling for expired tokens
 * - Optional authentication support
 * - Request context tracking (IP, user agent)
 * - User enrichment with role and permissions
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ===================================================
// REQUEST CONTEXT HELPERS
// ===================================================

/**
 * Extract request context for security logging
 * @param {Object} req - Express request object
 * @returns {Object} Request context
 */
export const getRequestContext = (req) => {
  return {
    ip: req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0],
    userAgent: req.headers['user-agent'] || 'Unknown',
    method: req.method,
    path: req.originalUrl || req.url,
    timestamp: new Date(),
  };
};

/**
 * Attach request context to request object
 */
export const attachRequestContext = (req, res, next) => {
  req.context = getRequestContext(req);
  next();
};

// ===================================================
// TOKEN EXTRACTION
// ===================================================

/**
 * Extract JWT token from request
 * Checks both Authorization header and HTTP-only cookie
 * @param {Object} req - Express request object
 * @returns {string|null} JWT token or null
 */
export const extractToken = (req) => {
  let token = null;

  // Check Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check HTTP-only cookie
  else if (req.cookies && req.cookies.authToken) {
    token = req.cookies.authToken;
  }

  return token;
};

// ===================================================
// TOKEN VERIFICATION
// ===================================================

/**
 * Verify JWT token and return decoded payload
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      const err = new Error('Token has expired');
      err.code = 'TOKEN_EXPIRED';
      err.statusCode = 401;
      throw err;
    } else if (error.name === 'JsonWebTokenError') {
      const err = new Error('Invalid token');
      err.code = 'INVALID_TOKEN';
      err.statusCode = 401;
      throw err;
    } else {
      const err = new Error('Token verification failed');
      err.code = 'VERIFICATION_FAILED';
      err.statusCode = 401;
      throw err;
    }
  }
};

// ===================================================
// USER LOADING
// ===================================================

/**
 * Load user from database and enrich with permissions
 * @param {string} userId - User ID from token
 * @returns {Object} User object with permissions
 * @throws {Error} If user not found or inactive
 */
export const loadUser = async (userId) => {
  const user = await User.findById(userId).select('-password');

  if (!user) {
    const err = new Error('User not found');
    err.code = 'USER_NOT_FOUND';
    err.statusCode = 401;
    throw err;
  }

  // Check if user is active/not banned
  if (user.status === 'banned' || user.status === 'inactive') {
    const err = new Error(`Account is ${user.status}`);
    err.code = 'ACCOUNT_INACTIVE';
    err.statusCode = 403;
    throw err;
  }

  return user;
};

// ===================================================
// ENHANCED PROTECT MIDDLEWARE
// ===================================================

/**
 * Enhanced authentication middleware
 * Validates token, loads user, attaches context
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 *
 * @example
 * router.get('/protected', protect, (req, res) => {
 *   res.json({ user: req.user, context: req.context });
 * });
 */
export const protect = async (req, res, next) => {
  try {
    // Attach request context (IP, user agent, etc.)
    if (!req.context) {
      req.context = getRequestContext(req);
    }

    // Extract token
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NO_TOKEN',
        message: 'Please provide a valid authentication token'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return res.status(error.statusCode || 401).json({
        success: false,
        error: error.message,
        code: error.code,
        // Include helpful message for expired tokens
        ...(error.code === 'TOKEN_EXPIRED' && {
          message: 'Your session has expired. Please log in again.',
        }),
      });
    }

    // Load user
    try {
      req.user = await loadUser(decoded.id);
    } catch (error) {
      return res.status(error.statusCode || 401).json({
        success: false,
        error: error.message,
        code: error.code,
      });
    }

    // Attach user ID to context for logging
    req.context.userId = req.user._id.toString();
    req.context.userRole = req.user.role;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error during authentication',
      code: 'AUTH_SERVER_ERROR',
    });
  }
};

// ===================================================
// OPTIONAL AUTHENTICATION
// ===================================================

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but continues even if not
 * Useful for routes that show different content for logged-in users
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 *
 * @example
 * // Public route with enhanced features for logged-in users
 * router.get('/courses', optionalAuth, (req, res) => {
 *   const courses = await Course.find();
 *   // Show additional details if user is logged in
 *   if (req.user) {
 *     courses.forEach(c => c.isEnrolled = c.students.includes(req.user._id));
 *   }
 *   res.json(courses);
 * });
 */
export const optionalAuth = async (req, res, next) => {
  try {
    // Attach request context
    if (!req.context) {
      req.context = getRequestContext(req);
    }

    // Extract token
    const token = extractToken(req);

    // If no token, continue without user
    if (!token) {
      req.user = null;
      return next();
    }

    // Try to verify token and load user
    try {
      const decoded = verifyToken(token);
      req.user = await loadUser(decoded.id);

      // Attach user info to context
      req.context.userId = req.user._id.toString();
      req.context.userRole = req.user.role;
    } catch (error) {
      // If token is invalid, continue without user (don't fail the request)
      req.user = null;
      console.warn('Optional auth failed:', error.message);
    }

    next();
  } catch (error) {
    // Don't fail the request for optional auth
    console.error('Optional auth error:', error);
    req.user = null;
    next();
  }
};

// ===================================================
// REQUIRE AUTHENTICATION
// ===================================================

/**
 * Middleware to ensure user is authenticated
 * Simpler alternative to protect() for clarity
 *
 * @example
 * router.get('/dashboard', requireAuth, getDashboard);
 */
export const requireAuth = protect;

// ===================================================
// TOKEN REFRESH HELPER
// ===================================================

/**
 * Check if token is close to expiring
 * @param {string} token - JWT token
 * @param {number} thresholdMinutes - Minutes before expiry to consider "close"
 * @returns {boolean} True if token expires soon
 */
export const isTokenExpiringSoon = (token, thresholdMinutes = 15) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return false;

    const expiresAt = decoded.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const threshold = thresholdMinutes * 60 * 1000;

    return (expiresAt - now) < threshold;
  } catch (error) {
    return false;
  }
};

/**
 * Middleware to send refresh token warning in response headers
 * Useful for SPAs to know when to refresh tokens
 */
export const tokenRefreshWarning = (req, res, next) => {
  const token = extractToken(req);

  if (token && isTokenExpiringSoon(token)) {
    res.setHeader('X-Token-Expiring-Soon', 'true');
  }

  next();
};

// ===================================================
// AUTHENTICATION ERROR CODES
// ===================================================

export const AUTH_ERROR_CODES = {
  NO_TOKEN: 'NO_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
  AUTH_SERVER_ERROR: 'AUTH_SERVER_ERROR',
};

// ===================================================
// EXPORTS
// ===================================================

export default {
  protect,
  requireAuth,
  optionalAuth,
  attachRequestContext,
  getRequestContext,
  extractToken,
  verifyToken,
  loadUser,
  isTokenExpiringSoon,
  tokenRefreshWarning,
  AUTH_ERROR_CODES,
};
