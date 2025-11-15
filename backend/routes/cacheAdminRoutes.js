/**
 * Cache Admin Routes
 * Endpoints for cache monitoring, invalidation, and management
 */

import express from 'express';
const router = express.Router();
import { protect as authMiddleware } from '../middleware/authMiddleware.js';
import cacheManager from '../utils/CacheManager.js';
import cacheTagManager from '../utils/CacheTagManager.js';
import cacheMetrics from '../utils/CacheMetrics.js';
import redisClient from '../config/redis.js';
import { rateLimiter } from '../middleware/cacheRateLimiter.js';

// Admin-only middleware (you can enhance this with role-based access)
const adminOnly = (req, res, next) => {
  // TODO: Add proper admin role check
  // For now, just ensure user is authenticated
  if (!req.user) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

/**
 * GET /api/cache/health
 * Check cache health status
 */
router.get('/health', async (req, res) => {
  try {
    const health = await redisClient.healthCheck();

    res.json({
      status: health.status === 'up' ? 'healthy' : 'unhealthy',
      redis: health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
});

/**
 * GET /api/cache/metrics
 * Get comprehensive cache metrics
 */
router.get('/metrics', authMiddleware, adminOnly, async (req, res) => {
  try {
    const metrics = await cacheMetrics.getSummary();

    res.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/cache/invalidate
 * Invalidate cache by keys, patterns, or tags
 */
router.post('/invalidate', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { keys, tags } = req.body;

    let deletedKeys = 0;
    let deletedTags = 0;

    // Invalidate specific keys
    if (keys && Array.isArray(keys) && keys.length > 0) {
      await cacheManager.delMany(keys);
      deletedKeys = keys.length;
    }

    // Invalidate by tags
    if (tags && Array.isArray(tags) && tags.length > 0) {
      await cacheTagManager.invalidateTags(tags);
      deletedTags = tags.length;
    }

    res.json({
      success: true,
      deleted: {
        keys: deletedKeys,
        tags: deletedTags,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/cache/tags
 * List all cache tags
 */
router.get('/tags', authMiddleware, adminOnly, async (req, res) => {
  try {
    const tags = await cacheTagManager.listTags();

    const tagDetails = await Promise.all(
      tags.map(async (tag) => {
        const size = await cacheTagManager.getTagSize(tag);
        return { tag, keyCount: size };
      })
    );

    res.json({
      success: true,
      tags: tagDetails,
      total: tags.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/cache/flush
 * Flush all cache (use with extreme caution!)
 */
router.post('/flush', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { confirm } = req.body;

    if (confirm !== 'FLUSH_ALL_CACHE') {
      return res.status(400).json({
        success: false,
        error: 'Confirmation required. Send { "confirm": "FLUSH_ALL_CACHE" }',
      });
    }

    await cacheManager.flushAll();

    res.json({
      success: true,
      message: 'All cache flushed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/cache/metrics/reset
 * Reset cache metrics
 */
router.post('/metrics/reset', authMiddleware, adminOnly, async (req, res) => {
  try {
    await cacheMetrics.reset();

    res.json({
      success: true,
      message: 'Cache metrics reset',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/cache/rate-limit/:identifier
 * Check rate limit status for identifier
 */
router.get('/rate-limit/:identifier', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { identifier } = req.params;
    const result = await rateLimiter.checkLimit(identifier);

    res.json({
      success: true,
      rateLimit: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/cache/rate-limit/:identifier
 * Reset rate limit for identifier
 */
router.delete('/rate-limit/:identifier', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { identifier } = req.params;
    await rateLimiter.reset(identifier);

    res.json({
      success: true,
      message: `Rate limit reset for ${identifier}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
