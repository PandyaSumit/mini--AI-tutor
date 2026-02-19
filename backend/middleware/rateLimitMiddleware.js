/**
 * Role-Based Rate Limiting Middleware
 *
 * Implements different rate limits based on user roles
 * Protects expensive operations and prevents abuse
 */

import { ROLES } from '../config/permissions.js';

// ===================================================
// RATE LIMIT CONFIGURATION
// ===================================================

/**
 * Rate limit configurations by role
 * Higher roles get more generous limits
 */
export const RATE_LIMITS = {
  // General API limits (requests per 15 minutes)
  API: {
    [ROLES.LEARNER]: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
      message: 'Too many requests from this account, please try again later.',
    },
    [ROLES.VERIFIED_INSTRUCTOR]: {
      windowMs: 15 * 60 * 1000,
      max: 300, // 3x learner limit
      message: 'Rate limit exceeded. Please try again later.',
    },
    [ROLES.PLATFORM_AUTHOR]: {
      windowMs: 15 * 60 * 1000,
      max: 500, // 5x learner limit
      message: 'Rate limit exceeded. Please try again later.',
    },
    [ROLES.ADMIN]: {
      windowMs: 15 * 60 * 1000,
      max: 1000, // 10x learner limit
      message: 'Rate limit exceeded. Please try again later.',
    },
    // Anonymous/unauthenticated users
    ANONYMOUS: {
      windowMs: 15 * 60 * 1000,
      max: 50, // Strictest limit
      message: 'Too many requests. Please log in or try again later.',
    },
  },

  // AI operation limits (requests per hour)
  AI: {
    [ROLES.LEARNER]: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 20, // 20 AI requests per hour
      message: 'AI usage limit exceeded. Please upgrade or wait.',
    },
    [ROLES.VERIFIED_INSTRUCTOR]: {
      windowMs: 60 * 60 * 1000,
      max: 100,
      message: 'AI usage limit exceeded. Please try again later.',
    },
    [ROLES.PLATFORM_AUTHOR]: {
      windowMs: 60 * 60 * 1000,
      max: 500,
      message: 'AI usage limit exceeded. Please try again later.',
    },
    [ROLES.ADMIN]: {
      windowMs: 60 * 60 * 1000,
      max: -1, // Unlimited for admins
      message: 'Rate limit exceeded.',
    },
    ANONYMOUS: {
      windowMs: 60 * 60 * 1000,
      max: 5, // Very limited for anonymous
      message: 'AI usage limit exceeded. Please log in to continue.',
    },
  },

  // Voice interaction limits (minutes per day)
  VOICE: {
    [ROLES.LEARNER]: {
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      max: 30, // 30 voice sessions per day
      message: 'Daily voice usage limit reached. Please try again tomorrow.',
    },
    [ROLES.VERIFIED_INSTRUCTOR]: {
      windowMs: 24 * 60 * 60 * 1000,
      max: 100,
      message: 'Daily voice usage limit reached.',
    },
    [ROLES.PLATFORM_AUTHOR]: {
      windowMs: 24 * 60 * 60 * 1000,
      max: 300,
      message: 'Daily voice usage limit reached.',
    },
    [ROLES.ADMIN]: {
      windowMs: 24 * 60 * 60 * 1000,
      max: -1, // Unlimited
      message: 'Rate limit exceeded.',
    },
    ANONYMOUS: {
      windowMs: 24 * 60 * 60 * 1000,
      max: 0, // No voice for anonymous
      message: 'Voice features require authentication.',
    },
  },

  // Course creation limits (per day)
  COURSE_CREATE: {
    [ROLES.LEARNER]: {
      windowMs: 24 * 60 * 60 * 1000,
      max: 0, // Learners cannot create courses
      message: 'Course creation requires instructor permissions.',
    },
    [ROLES.VERIFIED_INSTRUCTOR]: {
      windowMs: 24 * 60 * 60 * 1000,
      max: 5, // 5 courses per day
      message: 'Daily course creation limit reached.',
    },
    [ROLES.PLATFORM_AUTHOR]: {
      windowMs: 24 * 60 * 60 * 1000,
      max: 20,
      message: 'Daily course creation limit reached.',
    },
    [ROLES.ADMIN]: {
      windowMs: 24 * 60 * 60 * 1000,
      max: -1, // Unlimited
      message: 'Rate limit exceeded.',
    },
    ANONYMOUS: {
      windowMs: 24 * 60 * 60 * 1000,
      max: 0,
      message: 'Course creation requires authentication.',
    },
  },

  // Bulk operations (exports, mass updates)
  BULK: {
    [ROLES.LEARNER]: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3,
      message: 'Bulk operation limit exceeded.',
    },
    [ROLES.VERIFIED_INSTRUCTOR]: {
      windowMs: 60 * 60 * 1000,
      max: 10,
      message: 'Bulk operation limit exceeded.',
    },
    [ROLES.PLATFORM_AUTHOR]: {
      windowMs: 60 * 60 * 1000,
      max: 50,
      message: 'Bulk operation limit exceeded.',
    },
    [ROLES.ADMIN]: {
      windowMs: 60 * 60 * 1000,
      max: -1, // Unlimited
      message: 'Rate limit exceeded.',
    },
    ANONYMOUS: {
      windowMs: 60 * 60 * 1000,
      max: 0,
      message: 'Bulk operations require authentication.',
    },
  },

  // Login attempts (per IP address)
  LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 failed login attempts
    message: 'Too many login attempts. Please try again later.',
    skipSuccessfulRequests: true, // Only count failed attempts
  },
};

// ===================================================
// IN-MEMORY RATE LIMIT STORE
// ===================================================

/**
 * Simple in-memory rate limit store
 * For production, use Redis for distributed rate limiting
 */
class RateLimitStore {
  constructor() {
    this.hits = new Map();
    this.resetTimes = new Map();
  }

  /**
   * Increment hit count for a key
   * @param {string} key - Rate limit key
   * @param {number} windowMs - Window duration in milliseconds
   * @returns {Object} Hit count and reset time
   */
  increment(key, windowMs) {
    const now = Date.now();

    // Check if window has expired
    const resetTime = this.resetTimes.get(key);
    if (resetTime && now >= resetTime) {
      // Window expired, reset counter
      this.hits.delete(key);
      this.resetTimes.delete(key);
    }

    // Get current hits
    const currentHits = this.hits.get(key) || 0;
    const newHits = currentHits + 1;

    // Update hits
    this.hits.set(key, newHits);

    // Set reset time if not already set
    if (!this.resetTimes.has(key)) {
      this.resetTimes.set(key, now + windowMs);
    }

    return {
      current: newHits,
      resetTime: this.resetTimes.get(key),
    };
  }

  /**
   * Get current hit count for a key
   */
  get(key) {
    const now = Date.now();
    const resetTime = this.resetTimes.get(key);

    // Check if window expired
    if (resetTime && now >= resetTime) {
      return { current: 0, resetTime: null };
    }

    return {
      current: this.hits.get(key) || 0,
      resetTime: resetTime || null,
    };
  }

  /**
   * Reset hit count for a key
   */
  reset(key) {
    this.hits.delete(key);
    this.resetTimes.delete(key);
  }

  /**
   * Clear expired entries (cleanup)
   */
  cleanup() {
    const now = Date.now();
    for (const [key, resetTime] of this.resetTimes.entries()) {
      if (now >= resetTime) {
        this.hits.delete(key);
        this.resetTimes.delete(key);
      }
    }
  }
}

// Global rate limit store
const rateLimitStore = new RateLimitStore();

// Cleanup expired entries every 10 minutes
setInterval(() => {
  rateLimitStore.cleanup();
}, 10 * 60 * 1000);

// ===================================================
// RATE LIMIT KEY GENERATION
// ===================================================

/**
 * Generate rate limit key based on user or IP
 * @param {Object} req - Express request
 * @param {string} limitType - Type of rate limit
 * @returns {string} Rate limit key
 */
const generateRateLimitKey = (req, limitType) => {
  if (req.user) {
    // Authenticated: use user ID
    return `${limitType}:user:${req.user._id}`;
  } else {
    // Anonymous: use IP address
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    return `${limitType}:ip:${ip}`;
  }
};

// ===================================================
// RATE LIMIT MIDDLEWARE FACTORY
// ===================================================

/**
 * Create rate limit middleware for a specific operation type
 * @param {string} limitType - Type of rate limit (API, AI, VOICE, etc.)
 * @returns {Function} Express middleware
 *
 * @example
 * router.post('/ai/chat', protect, createRateLimit('AI'), handleAIChat);
 */
export const createRateLimit = (limitType) => {
  return (req, res, next) => {
    try {
      // Get user role or default to anonymous
      const role = req.user?.role || 'ANONYMOUS';

      // Get rate limit config for this role and type
      const config = RATE_LIMITS[limitType]?.[role];

      if (!config) {
        // No rate limit configured, allow request
        return next();
      }

      // Unlimited access (max: -1)
      if (config.max === -1) {
        return next();
      }

      // Zero access (max: 0)
      if (config.max === 0) {
        return res.status(403).json({
          success: false,
          error: config.message || 'Access denied',
          rateLimit: {
            limit: 0,
            remaining: 0,
            resetTime: null,
          },
        });
      }

      // Generate rate limit key
      const key = generateRateLimitKey(req, limitType);

      // Increment hit counter
      const { current, resetTime } = rateLimitStore.increment(key, config.windowMs);

      // Calculate remaining requests
      const remaining = Math.max(0, config.max - current);

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', config.max);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', new Date(resetTime).toISOString());

      // Check if limit exceeded
      if (current > config.max) {
        return res.status(429).json({
          success: false,
          error: config.message || 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          rateLimit: {
            limit: config.max,
            remaining: 0,
            resetTime: new Date(resetTime).toISOString(),
            retryAfter: Math.ceil((resetTime - Date.now()) / 1000), // seconds
          },
        });
      }

      // Attach rate limit info to request for logging
      req.rateLimit = {
        type: limitType,
        limit: config.max,
        current,
        remaining,
        resetTime: new Date(resetTime).toISOString(),
      };

      next();
    } catch (error) {
      console.error('Rate limit error:', error);
      // Don't block request on rate limit errors
      next();
    }
  };
};

// ===================================================
// PREDEFINED RATE LIMITERS
// ===================================================

/**
 * General API rate limiter
 * Different limits based on user role
 */
export const apiRateLimit = createRateLimit('API');

/**
 * AI operation rate limiter
 * Stricter limits on expensive AI operations
 */
export const aiRateLimit = createRateLimit('AI');

/**
 * Voice interaction rate limiter
 * Daily limits on voice minutes
 */
export const voiceRateLimit = createRateLimit('VOICE');

/**
 * Course creation rate limiter
 * Daily limits on course creation
 */
export const courseCreateRateLimit = createRateLimit('COURSE_CREATE');

/**
 * Bulk operation rate limiter
 * Hourly limits on bulk exports/updates
 */
export const bulkOperationRateLimit = createRateLimit('BULK');

/**
 * Login attempt rate limiter
 * IP-based, same limit for all users
 */
export const loginRateLimit = (req, res, next) => {
  const config = RATE_LIMITS.LOGIN;
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const key = `login:ip:${ip}`;

  const { current, resetTime } = rateLimitStore.increment(key, config.windowMs);
  const remaining = Math.max(0, config.max - current);

  res.setHeader('X-RateLimit-Limit', config.max);
  res.setHeader('X-RateLimit-Remaining', remaining);

  if (current > config.max) {
    return res.status(429).json({
      success: false,
      error: config.message,
      code: 'LOGIN_RATE_LIMIT_EXCEEDED',
      rateLimit: {
        retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
      },
    });
  }

  next();
};

// ===================================================
// RATE LIMIT BYPASS FOR TESTING
// ===================================================

/**
 * Reset rate limits for a user (admin only, for testing)
 * @param {string} userId - User ID
 * @param {string} limitType - Type of rate limit to reset
 */
export const resetUserRateLimit = (userId, limitType) => {
  const key = `${limitType}:user:${userId}`;
  rateLimitStore.reset(key);
};

/**
 * Get current rate limit status for a user
 * @param {string} userId - User ID
 * @param {string} limitType - Type of rate limit
 * @returns {Object} Current rate limit status
 */
export const getRateLimitStatus = (userId, limitType, role) => {
  const key = `${limitType}:user:${userId}`;
  const { current, resetTime } = rateLimitStore.get(key);
  const config = RATE_LIMITS[limitType]?.[role];

  if (!config) {
    return { error: 'Rate limit not configured' };
  }

  return {
    limit: config.max,
    current,
    remaining: Math.max(0, config.max - current),
    resetTime: resetTime ? new Date(resetTime).toISOString() : null,
  };
};

// ===================================================
// EXPORTS
// ===================================================

export default {
  createRateLimit,
  apiRateLimit,
  aiRateLimit,
  voiceRateLimit,
  courseCreateRateLimit,
  bulkOperationRateLimit,
  loginRateLimit,
  resetUserRateLimit,
  getRateLimitStatus,
  RATE_LIMITS,
};
