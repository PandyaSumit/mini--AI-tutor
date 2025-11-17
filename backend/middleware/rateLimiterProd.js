/**
 * Production Three-tier Rate Limiting Middleware
 * 1. Express API rate limiter (100 req/15min)
 * 2. Voice-specific rate limiter (10 req/min)
 * 3. Socket.IO event rate limiter (20 events/10sec per user)
 */

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createCacheClient } from '../config/redisCluster.js';
import logger from '../config/logger.js';

const redisClient = createCacheClient();

/**
 * Tier 1: General API Rate Limiter
 * 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  store: new RedisStore({
    // @ts-expect-error - Known issue with RedisStore type definitions
    client: redisClient,
    prefix: 'rl:api:',
    sendCommand: (...args) => redisClient.call(...args)
  }),
  skip: (req) => {
    // Skip rate limiting for health check endpoints
    return req.path === '/health' || req.path === '/ready';
  },
  handler: (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;

    logger.logRateLimitExceeded(
      req.user?.userId || 'anonymous',
      req.path,
      ip
    );

    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    });
  },
  onLimitReached: (req) => {
    logger.warn('API rate limit reached', {
      ip: req.ip || req.connection.remoteAddress,
      path: req.path,
      userId: req.user?.userId
    });
  }
});

/**
 * Tier 2: Voice-specific Rate Limiter
 * 10 requests per 1 minute per IP (stricter for resource-intensive operations)
 */
export const voiceLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 requests per window
  skipSuccessfulRequests: false, // Count all requests, not just successful ones
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - Known issue with RedisStore type definitions
    client: redisClient,
    prefix: 'rl:voice:',
    sendCommand: (...args) => redisClient.call(...args)
  }),
  handler: (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;

    logger.logRateLimitExceeded(
      req.user?.userId || 'anonymous',
      'voice:' + req.path,
      ip
    );

    res.status(429).json({
      error: 'Too many voice requests, please slow down.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    });
  },
  onLimitReached: (req) => {
    logger.warn('Voice rate limit reached', {
      ip: req.ip || req.connection.remoteAddress,
      path: req.path,
      userId: req.user?.userId
    });
  }
});

/**
 * Tier 3: Socket.IO Event Rate Limiter
 * 20 events per 10 seconds per user
 * Returns a function that checks rate limits for a specific socket
 */
export function socketRateLimiter(socket) {
  const userId = socket.userId;

  if (!userId) {
    logger.warn('Socket rate limiter called without userId', {
      socketId: socket.id
    });
    return async () => false; // Deny if no userId
  }

  /**
   * Check if event is allowed for this user
   * @param {string} eventName - Name of the Socket.IO event
   * @returns {Promise<boolean>} - true if allowed, false if rate limited
   */
  return async function checkRateLimit(eventName) {
    const key = `rl:socket:${userId}`;
    const window = 10; // 10 seconds
    const maxEvents = 20; // 20 events per window

    try {
      // Increment counter
      const current = await redisClient.incr(key);

      // Set expiry on first event
      if (current === 1) {
        await redisClient.expire(key, window);
      }

      // Check if limit exceeded
      if (current > maxEvents) {
        logger.logRateLimitExceeded(userId, `socket:${eventName}`, socket.handshake.address);

        // Emit error to client
        socket.emit('voice:error', {
          error: 'Too many events. Please slow down.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: window
        });

        return false; // Rate limit exceeded
      }

      return true; // Allowed
    } catch (error) {
      logger.error('Socket rate limiter error', {
        userId,
        eventName,
        error: error.message,
        stack: error.stack
      });

      // On error, allow the request (fail open)
      return true;
    }
  };
}

/**
 * Create middleware to attach rate limiter to socket
 * Use in Socket.IO connection handler
 */
export function createSocketRateLimiterMiddleware() {
  return function (socket, next) {
    // Attach rate limiter function to socket
    socket.checkRateLimit = socketRateLimiter(socket);
    next();
  };
}

/**
 * Reset rate limit for a specific user (admin function)
 * @param {string} userId - User ID
 * @param {string} type - Type of rate limit ('api', 'voice', 'socket')
 */
export async function resetRateLimit(userId, type = 'all') {
  try {
    const patterns = [];

    if (type === 'all' || type === 'api') {
      patterns.push(`rl:api:*${userId}*`);
    }
    if (type === 'all' || type === 'voice') {
      patterns.push(`rl:voice:*${userId}*`);
    }
    if (type === 'all' || type === 'socket') {
      patterns.push(`rl:socket:${userId}`);
    }

    for (const pattern of patterns) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    }

    logger.info('Rate limit reset', { userId, type });
    return true;
  } catch (error) {
    logger.error('Failed to reset rate limit', {
      userId,
      type,
      error: error.message
    });
    return false;
  }
}

/**
 * Get rate limit info for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Rate limit info
 */
export async function getRateLimitInfo(userId) {
  try {
    const socketKey = `rl:socket:${userId}`;
    const socketCount = await redisClient.get(socketKey);
    const socketTTL = await redisClient.ttl(socketKey);

    return {
      socket: {
        count: parseInt(socketCount) || 0,
        max: 20,
        resetIn: socketTTL > 0 ? socketTTL : 0
      }
    };
  } catch (error) {
    logger.error('Failed to get rate limit info', {
      userId,
      error: error.message
    });
    return null;
  }
}

export default {
  apiLimiter,
  voiceLimiter,
  socketRateLimiter,
  createSocketRateLimiterMiddleware,
  resetRateLimit,
  getRateLimitInfo
};
