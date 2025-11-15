/**
 * Redis-backed Rate Limiter
 * Implements sliding window rate limiting
 */

import redisClient from '../config/redis.js';
import cacheConfig from '../config/cache.js';

class RateLimiter {
  constructor() {
    this.redis = null;
  }

  /**
   * Initialize rate limiter
   */
  async initialize() {
    this.redis = await redisClient.connect();
    return this.redis !== null;
  }

  /**
   * Check rate limit using sliding window
   */
  async checkLimit(identifier, maxRequests = null, windowSeconds = null) {
    maxRequests = maxRequests || cacheConfig.RATE_LIMIT.maxRequests;
    windowSeconds = windowSeconds || cacheConfig.RATE_LIMIT.windowSeconds;

    if (!this.redis || !redisClient.isConnected) {
      // If Redis is down, allow request (fail open)
      return {
        allowed: true,
        current: 0,
        limit: maxRequests,
        remaining: maxRequests,
        resetAt: Math.floor(Date.now() / 1000) + windowSeconds,
      };
    }

    const window = Math.floor(Date.now() / 1000 / windowSeconds);
    const key = `${cacheConfig.PREFIXES.RATE}:${identifier}:${window}`;

    try {
      // Increment counter
      const current = await redisClient.executeWithCircuitBreaker(
        async () => {
          const count = await this.redis.incr(key);

          // Set expiry on first increment
          if (count === 1) {
            await this.redis.expire(key, windowSeconds);
          }

          return count;
        },
        () => 0
      );

      const resetAt = (window + 1) * windowSeconds;

      return {
        allowed: current <= maxRequests,
        current,
        limit: maxRequests,
        remaining: Math.max(0, maxRequests - current),
        resetAt,
      };
    } catch (error) {
      console.error('Rate limit check error:', error.message);

      // Fail open - allow request if Redis is having issues
      return {
        allowed: true,
        current: 0,
        limit: maxRequests,
        remaining: maxRequests,
        resetAt: Math.floor(Date.now() / 1000) + windowSeconds,
      };
    }
  }

  /**
   * Reset rate limit for identifier
   */
  async reset(identifier) {
    if (!this.redis || !redisClient.isConnected) {
      return false;
    }

    const pattern = `${cacheConfig.PREFIXES.RATE}:${identifier}:*`;

    try {
      const keys = await redisClient.executeWithCircuitBreaker(
        async () => {
          const allKeys = [];
          const stream = this.redis.scanStream({ match: pattern, count: 100 });

          return new Promise((resolve, reject) => {
            stream.on('data', (keys) => {
              allKeys.push(...keys);
            });
            stream.on('end', () => {
              resolve(allKeys);
            });
            stream.on('error', reject);
          });
        },
        () => []
      );

      if (keys.length > 0) {
        await this.redis.del(...keys);
      }

      return true;
    } catch (error) {
      console.error('Rate limit reset error:', error.message);
      return false;
    }
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

/**
 * Express middleware for rate limiting
 */
const rateLimitMiddleware = (options = {}) => {
  const {
    maxRequests = cacheConfig.RATE_LIMIT.maxRequests,
    windowSeconds = cacheConfig.RATE_LIMIT.windowSeconds,
    keyGenerator = (req) => req.ip,
    skipFailedRequests = false,
    skipSuccessfulRequests = false,
  } = options;

  return async (req, res, next) => {
    if (!cacheConfig.RATE_LIMIT.enabled) {
      return next();
    }

    const identifier = keyGenerator(req);
    const result = await rateLimiter.checkLimit(identifier, maxRequests, windowSeconds);

    // Set rate limit headers
    res.set('X-RateLimit-Limit', result.limit);
    res.set('X-RateLimit-Remaining', result.remaining);
    res.set('X-RateLimit-Reset', result.resetAt);

    if (!result.allowed) {
      const retryAfter = result.resetAt - Math.floor(Date.now() / 1000);

      res.set('Retry-After', retryAfter);

      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        retryAfter,
        limit: result.limit,
      });
    }

    next();
  };
};

export { rateLimiter, rateLimitMiddleware };
