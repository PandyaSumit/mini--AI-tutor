/**
 * Cache Middleware for Express Routes
 * Automatically caches route responses with configurable TTL
 */

const cacheManager = require('../utils/CacheManager');
const cacheTagManager = require('../utils/CacheTagManager');
const cacheConfig = require('../config/cache');

/**
 * Cache middleware factory
 * @param {Object} options - Cache configuration options
 * @param {Function} options.keyFn - Function to generate cache key from request
 * @param {number} options.ttl - Cache TTL in seconds
 * @param {boolean} options.enableSWR - Enable stale-while-revalidate
 * @param {Function} options.shouldCache - Function to determine if response should be cached
 * @param {Array<string>} options.tags - Tags for bulk invalidation
 * @param {Function} options.tagsFn - Function to generate tags from request/response
 */
function cacheMiddleware(options = {}) {
  const {
    keyFn,
    ttl = 3600,
    enableSWR = false,
    shouldCache = () => true,
    tags = [],
    tagsFn = null,
  } = options;

  if (!keyFn) {
    throw new Error('keyFn is required for cache middleware');
  }

  return async (req, res, next) => {
    // Skip if caching is disabled
    if (!cacheConfig.FEATURES.enabled) {
      return next();
    }

    const cacheKey = keyFn(req);

    try {
      // Try to get from cache
      let cached;

      if (enableSWR && cacheConfig.FEATURES.enableSWR) {
        // Use stale-while-revalidate (advanced caching)
        // Note: This requires a fetch function, so we'll skip SWR in middleware
        // and just do regular cache lookup
        cached = await cacheManager.get(cacheKey);
      } else {
        cached = await cacheManager.get(cacheKey);
      }

      if (cached) {
        // Cache hit - return cached response
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);
        return res.json(cached);
      }

      // Cache miss - intercept response to cache it
      res.set('X-Cache', 'MISS');
      res.set('X-Cache-Key', cacheKey);

      const originalJson = res.json.bind(res);

      res.json = function(data) {
        // Check if we should cache this response
        if (shouldCache(req, res, data)) {
          // Cache asynchronously (don't block response)
          setImmediate(async () => {
            try {
              // Generate tags
              const cacheTags = tagsFn ? tagsFn(req, res, data) : tags;

              if (cacheTags && cacheTags.length > 0) {
                await cacheTagManager.setWithTags(cacheKey, data, ttl, cacheTags);
              } else {
                await cacheManager.set(cacheKey, data, ttl);
              }
            } catch (error) {
              console.error('Cache write error:', error.message);
            }
          });
        }

        return originalJson(data);
      };

      next();
    } catch (error) {
      // Cache error - bypass cache and continue
      console.error('Cache middleware error:', error.message);
      res.set('X-Cache', 'BYPASS');
      next();
    }
  };
}

/**
 * Invalidation middleware helper
 * Invalidates cache after successful write operations
 */
function invalidateCacheAfter(options = {}) {
  const {
    keys = [],
    keysFn = null,
    tags = [],
    tagsFn = null,
    condition = () => true,
  } = options;

  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      // Only invalidate on success (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300 && condition(req, res, data)) {
        setImmediate(async () => {
          try {
            // Invalidate specific keys
            const keysToInvalidate = keysFn ? keysFn(req, res, data) : keys;
            if (keysToInvalidate && keysToInvalidate.length > 0) {
              await cacheManager.delMany(keysToInvalidate);
              console.log(`🗑️  Invalidated ${keysToInvalidate.length} cache keys`);
            }

            // Invalidate tags
            const tagsToInvalidate = tagsFn ? tagsFn(req, res, data) : tags;
            if (tagsToInvalidate && tagsToInvalidate.length > 0) {
              await cacheTagManager.invalidateTags(tagsToInvalidate);
              console.log(`🗑️  Invalidated tags: ${tagsToInvalidate.join(', ')}`);
            }
          } catch (error) {
            console.error('Cache invalidation error:', error.message);
          }
        });
      }

      return originalJson(data);
    };

    next();
  };
}

/**
 * Conditional caching based on request/response
 */
function conditionalCache(options = {}) {
  const {
    condition = () => true,
    ...cacheOptions
  } = options;

  return (req, res, next) => {
    if (condition(req, res)) {
      return cacheMiddleware(cacheOptions)(req, res, next);
    }
    next();
  };
}

/**
 * Helper: Generate cache key for user-scoped data
 */
function userCacheKey(namespace, subpath = '') {
  return (req) => {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return cacheManager.generateKey(
      `${cacheConfig.PREFIXES.USER}:${namespace}`,
      userId,
      subpath || null
    );
  };
}

/**
 * Helper: Generate cache key for resource
 */
function resourceCacheKey(namespace, paramName = 'id', subpath = '') {
  return (req) => {
    const resourceId = req.params[paramName];
    if (!resourceId) {
      throw new Error(`${paramName} parameter not found in request`);
    }
    return cacheManager.generateKey(
      namespace,
      resourceId,
      subpath || null
    );
  };
}

module.exports = {
  cacheMiddleware,
  invalidateCacheAfter,
  conditionalCache,
  userCacheKey,
  resourceCacheKey,
};
