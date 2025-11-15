# Cache Integration Guide

This guide shows how to integrate Redis caching into your existing routes and controllers.

## Table of Contents
1. [Basic Cache Middleware Usage](#basic-cache-middleware-usage)
2. [Caching Roadmap Routes](#caching-roadmap-routes)
3. [Caching User Data](#caching-user-data)
4. [Cache Invalidation](#cache-invalidation)
5. [Rate Limiting](#rate-limiting)
6. [Monitoring & Metrics](#monitoring--metrics)

---

## Basic Cache Middleware Usage

### Example: Cache a Simple GET Route

```javascript
import { cacheMiddleware, resourceCacheKey } from '../middleware/cacheMiddleware.js';
import cacheConfig from '../config/cache.js';

// GET /api/roadmaps/:id - Get single roadmap
router.get('/:id',
  authMiddleware,
  cacheMiddleware({
    keyFn: resourceCacheKey('roadmap:detail', 'id'),
    ttl: cacheConfig.TTL.ROADMAP_DETAIL, // 24 hours
    tags: (req) => [`user:${req.user._id}`, `roadmap:${req.params.id}`],
  }),
  roadmapController.getById
);
```

### Example: Cache User Stats with Stale-While-Revalidate

```javascript
import { cacheMiddleware, userCacheKey } from '../middleware/cacheMiddleware.js';

// GET /api/user/stats - Get user statistics
router.get('/stats',
  authMiddleware,
  cacheMiddleware({
    keyFn: userCacheKey('stats'),
    ttl: cacheConfig.TTL.USER_STATS, // 15 minutes
    enableSWR: true, // Enable stale-while-revalidate
  }),
  userController.getStats
);
```

---

## Caching Roadmap Routes

### Complete Roadmap Routes Example

```javascript
// routes/roadmapRoutes.js
import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  cacheMiddleware,
  invalidateCacheAfter,
  userCacheKey,
  resourceCacheKey
} from '../middleware/cacheMiddleware.js';
import cacheConfig from '../config/cache.js';
import roadmapController from '../controllers/roadmapController.js';

const router = express.Router();

// GET /api/roadmaps - List user's roadmaps (CACHED)
router.get('/',
  authMiddleware,
  cacheMiddleware({
    keyFn: userCacheKey('roadmaps', 'list'),
    ttl: cacheConfig.TTL.ROADMAP_LIST, // 24 hours
    tags: (req) => [`user:${req.user._id}`],
  }),
  roadmapController.getAll
);

// GET /api/roadmaps/:id - Get single roadmap (CACHED)
router.get('/:id',
  authMiddleware,
  cacheMiddleware({
    keyFn: resourceCacheKey('roadmap:detail', 'id'),
    ttl: cacheConfig.TTL.ROADMAP_DETAIL, // 24 hours
    enableSWR: true, // Use stale data while refreshing
    tags: (req) => [`user:${req.user._id}`, `roadmap:${req.params.id}`],
  }),
  roadmapController.getById
);

// POST /api/roadmaps/generate - Create roadmap (INVALIDATE CACHE)
router.post('/generate',
  authMiddleware,
  invalidateCacheAfter({
    keysFn: (req, res, data) => [
      // Invalidate user's roadmap list
      cacheManager.generateKey('user:roadmaps', req.user._id, 'list'),
      // Invalidate user stats
      cacheManager.generateKey('user', req.user._id, 'stats'),
    ],
  }),
  roadmapController.generate
);

// PUT /api/roadmaps/:id - Update roadmap (INVALIDATE CACHE)
router.put('/:id',
  authMiddleware,
  invalidateCacheAfter({
    keysFn: (req, res, data) => [
      cacheManager.generateKey('roadmap:detail', req.params.id),
      cacheManager.generateKey('roadmap:stats', req.params.id),
      cacheManager.generateKey('user:roadmaps', req.user._id, 'list'),
    ],
  }),
  roadmapController.update
);

// DELETE /api/roadmaps/:id - Delete roadmap (INVALIDATE TAG)
router.delete('/:id',
  authMiddleware,
  invalidateCacheAfter({
    tagsFn: (req) => [`roadmap:${req.params.id}`, `user:${req.user._id}`],
  }),
  roadmapController.delete
);

export default router;
```

---

## Caching User Data

### User Stats with Manual Caching in Controller

```javascript
// controllers/userController.js
import cacheManager from '../utils/CacheManager.js';
import cacheConfig from '../config/cache.js';

export const getStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const cacheKey = cacheManager.generateKey('user', userId, 'stats');

    // Try to get from cache with SWR
    const { data, fromCache, stale } = await cacheManager.getWithSWR(
      cacheKey,
      async () => {
        // Fetch function - called if cache miss
        const stats = await calculateUserStats(userId);
        return stats;
      },
      cacheConfig.TTL.USER_STATS,
      cacheConfig.TTL.USER_STATS * 2 // Stale TTL
    );

    res.set('X-Cache', fromCache ? (stale ? 'STALE' : 'HIT') : 'MISS');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

async function calculateUserStats(userId) {
  const [conversations, roadmaps, flashcards] = await Promise.all([
    Conversation.countDocuments({ userId }),
    LearningRoadmap.countDocuments({ userId }),
    Flashcard.countDocuments({ userId }),
  ]);

  return {
    totalConversations: conversations,
    totalRoadmaps: roadmaps,
    totalFlashcards: flashcards,
    // ... more stats
  };
}
```

---

## Cache Invalidation

### Method 1: Using Invalidation Helpers (Recommended)

```javascript
// In your controller after saving data
import {
  invalidateRoadmapCache,
  invalidateUserCache,
  invalidateConversationCache,
} from '../utils/cacheInvalidation.js';

// After roadmap update
export const updateRoadmap = async (req, res) => {
  try {
    const roadmap = await LearningRoadmap.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    // Invalidate related caches
    await invalidateRoadmapCache(roadmap._id, req.user._id);

    res.json(roadmap);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### Method 2: Manual Cache Deletion

```javascript
import cacheManager from '../utils/CacheManager.js';

// Delete specific keys
await cacheManager.delMany([
  cacheManager.generateKey('roadmap:detail', roadmapId),
  cacheManager.generateKey('user:roadmaps', userId, 'list'),
]);
```

### Method 3: Tag-Based Invalidation

```javascript
import cacheTagManager from '../utils/CacheTagManager.js';

// Invalidate all caches for a user
await cacheTagManager.invalidateTag(`user:${userId}`);

// Invalidate multiple tags
await cacheTagManager.invalidateTags([
  `user:${userId}`,
  `roadmap:${roadmapId}`,
]);
```

---

## Rate Limiting

### Apply to Specific Routes

```javascript
import { rateLimitMiddleware } from '../middleware/cacheRateLimiter.js';

// Apply stricter rate limit to auth endpoints
router.post('/register',
  rateLimitMiddleware({
    maxRequests: 5,
    windowSeconds: 900, // 5 requests per 15 min
    keyGenerator: (req) => req.ip,
  }),
  authController.register
);

// Rate limit per user
router.post('/generate',
  authMiddleware,
  rateLimitMiddleware({
    maxRequests: 10,
    windowSeconds: 3600, // 10 roadmaps per hour
    keyGenerator: (req) => req.user._id.toString(),
  }),
  roadmapController.generate
);
```

---

## Monitoring & Metrics

### Check Cache Health

```bash
# Health check
curl http://localhost:5000/api/cache/health

# Response:
{
  "status": "healthy",
  "redis": {
    "status": "up",
    "circuitState": "CLOSED",
    "failureCount": 0,
    "isConnected": true
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### Get Cache Metrics

```bash
# Get comprehensive metrics (requires authentication)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5000/api/cache/metrics

# Response:
{
  "success": true,
  "metrics": {
    "hitRatio": {
      "total": "85.50",
      "conversation": "82.30",
      "roadmap": "91.20",
      "flashcard": "88.00",
      "user": "79.50"
    },
    "latency": {
      "conversation": "4.20",
      "roadmap": "3.80",
      "flashcard": "2.50"
    },
    "memory": {
      "usedMemory": 5242880,
      "usedMemoryHuman": "5.00M",
      "peakMemory": 6291456,
      "peakMemoryHuman": "6.00M",
      "memoryFragmentation": 1.05
    },
    "server": {
      "connectedClients": 3,
      "totalKeys": 1250,
      "evictedKeys": 0,
      "opsPerSec": 45
    }
  }
}
```

### Invalidate Cache Manually

```bash
# Invalidate specific keys
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"keys": ["roadmap:detail:123:v1", "user:stats:456:v1"]}' \
  http://localhost:5000/api/cache/invalidate

# Invalidate by tags
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tags": ["user:123", "roadmap:456"]}' \
  http://localhost:5000/api/cache/invalidate
```

### List Cache Tags

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5000/api/cache/tags
```

---

## Best Practices

### 1. Choose Appropriate TTLs

```javascript
// Read-heavy, infrequent updates → Long TTL
ROADMAP_DETAIL: 86400 (24 hours)
FLASHCARD_DECK: 604800 (7 days)

// Frequently changing data → Short TTL
USER_STATS: 900 (15 minutes)
CONVERSATION_LIST: 1800 (30 minutes)

// Real-time data → Very short TTL or no cache
CHAT_STREAMING: Do not cache
```

### 2. Use Tags for Related Data

```javascript
// When caching, add tags
cacheMiddleware({
  keyFn: resourceCacheKey('roadmap:detail', 'id'),
  ttl: 86400,
  tags: (req) => [
    `user:${req.user._id}`,      // Can invalidate all user data
    `roadmap:${req.params.id}`,  // Can invalidate all roadmap data
  ],
})
```

### 3. Always Invalidate on Writes

```javascript
// After create/update/delete, always invalidate
router.put('/:id',
  authMiddleware,
  invalidateCacheAfter({
    keysFn: (req) => [
      // Invalidate the updated resource
      cacheManager.generateKey('roadmap:detail', req.params.id),
      // Invalidate related lists
      cacheManager.generateKey('user:roadmaps', req.user._id, 'list'),
    ],
  }),
  controller.update
);
```

### 4. Don't Cache Sensitive Data in Plaintext

```javascript
// DON'T cache email, passwords, tokens
// DO cache only public/non-sensitive data
async function cacheUserProfile(userId, profile) {
  const redacted = {
    name: profile.name,
    avatar: profile.avatar,
    // NO email, password, etc.
  };
  await cacheManager.set(key, redacted, ttl);
}
```

### 5. Monitor Cache Performance

```javascript
// Set up alerts for:
- Hit ratio < 70%
- Latency > 50ms
- Memory usage > 80%
- Evicted keys > 1000/min
```

---

## Troubleshooting

### Cache Not Working

```bash
# Check Redis connection
curl http://localhost:5000/api/cache/health

# Check environment variables
echo $CACHE_ENABLED
echo $REDIS_HOST
```

### High Cache Misses

```bash
# Check hit ratio
curl -H "Auth: Bearer TOKEN" http://localhost:5000/api/cache/metrics

# Possible causes:
- TTL too short
- Too many invalidations
- Keys not matching
- Circuit breaker open
```

### Redis Connection Issues

```bash
# Check Redis server
redis-cli ping

# Check circuit breaker state
# Look for logs: "Circuit breaker OPEN"

# Reset circuit breaker (restart server or wait for timeout)
```

---

## Quick Start Checklist

- [ ] Install Redis locally or use cloud service
- [ ] Copy `.env.example` to `.env`
- [ ] Set `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- [ ] Set `CACHE_ENABLED=true`
- [ ] Start server - verify cache initialization logs
- [ ] Add `cacheMiddleware` to GET routes
- [ ] Add `invalidateCacheAfter` to POST/PUT/DELETE routes
- [ ] Test with `X-Cache` headers (HIT/MISS)
- [ ] Monitor metrics at `/api/cache/metrics`

---

## Support

For issues or questions:
1. Check server logs for cache errors
2. Test Redis connection: `redis-cli ping`
3. Verify environment variables
4. Check circuit breaker state in metrics
5. Review this guide for integration examples
