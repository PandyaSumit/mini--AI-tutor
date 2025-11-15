# Redis Cache - Quick Start Guide

## What Was Implemented

✅ **Complete production-ready Redis caching architecture** for Mini AI Tutor platform

### Key Features
- **Cache-aside pattern** with automatic cache population
- **Stale-while-revalidate (SWR)** for better performance
- **Distributed locks** to prevent cache stampede
- **Tag-based invalidation** for bulk cache operations
- **Circuit breaker** for Redis failures (automatic fallback to DB)
- **Redis-backed rate limiting** (100 req/15min configurable)
- **Comprehensive metrics** (hit ratio, latency, memory usage)
- **Admin endpoints** for monitoring and management

---

## Getting Started (5 Minutes)

### Step 1: Install Redis

**Option A: Docker (Recommended)**
```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

**Option B: Local Installation**
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server

# Verify
redis-cli ping  # Should return "PONG"
```

### Step 2: Configure Environment

Copy and update `.env.example`:
```bash
cd backend
cp .env.example .env

# Edit .env and set:
CACHE_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Leave empty for local dev
```

### Step 3: Start Your Server

```bash
npm install  # ioredis was already installed
npm run dev
```

You should see:
```
✅ Redis: Connected successfully
✅ Cache system initialized successfully!
📋 Cache Configuration:
   Redis Host: localhost:6379
   Cache Version: v1
   SWR Enabled: true
   Metrics Enabled: true
   Rate Limiting: true
```

### Step 4: Test It Works

```bash
# Health check
curl http://localhost:5000/api/cache/health

# Should return:
{
  "status": "healthy",
  "redis": {
    "status": "up",
    "circuitState": "CLOSED",
    "isConnected": true
  }
}
```

---

## How to Use (3 Common Patterns)

### Pattern 1: Cache a GET Route (Automatic)

```javascript
// routes/roadmapRoutes.js
import { cacheMiddleware, resourceCacheKey } from '../middleware/cacheMiddleware.js';
import cacheConfig from '../config/cache.js';

// Before:
router.get('/:id', authMiddleware, roadmapController.getById);

// After (with caching):
router.get('/:id',
  authMiddleware,
  cacheMiddleware({
    keyFn: resourceCacheKey('roadmap:detail', 'id'),
    ttl: cacheConfig.TTL.ROADMAP_DETAIL,  // 24 hours
  }),
  roadmapController.getById
);

// Now the route automatically:
// 1. Checks cache first (returns if found)
// 2. Calls controller if cache miss
// 3. Caches the response
// 4. Adds X-Cache header (HIT/MISS)
```

### Pattern 2: Invalidate Cache on Update

```javascript
import { invalidateCacheAfter } from '../middleware/cacheMiddleware.js';
import cacheManager from '../utils/CacheManager.js';

// Before:
router.put('/:id', authMiddleware, roadmapController.update);

// After (with invalidation):
router.put('/:id',
  authMiddleware,
  invalidateCacheAfter({
    keysFn: (req, res, data) => [
      cacheManager.generateKey('roadmap:detail', req.params.id),
      cacheManager.generateKey('user:roadmaps', req.user._id, 'list'),
    ],
  }),
  roadmapController.update
);

// Now after successful update:
// 1. Returns response to user
// 2. Automatically invalidates related caches in background
```

### Pattern 3: Manual Caching in Controller

```javascript
// controllers/userController.js
import cacheManager from '../utils/CacheManager.js';
import cacheConfig from '../config/cache.js';

export const getStats = async (req, res) => {
  const userId = req.user._id;
  const cacheKey = cacheManager.generateKey('user', userId, 'stats');

  // Try cache with SWR
  const { data, fromCache, stale } = await cacheManager.getWithSWR(
    cacheKey,
    async () => {
      // Fetch from DB (only if cache miss)
      return await calculateUserStats(userId);
    },
    cacheConfig.TTL.USER_STATS,  // 15 minutes
    cacheConfig.TTL.USER_STATS * 2  // Stale: 30 minutes
  );

  // Return cached or fresh data
  res.set('X-Cache', fromCache ? (stale ? 'STALE' : 'HIT') : 'MISS');
  res.json(data);
};
```

---

## Pre-configured TTLs

All TTLs are defined in `config/cache.js`:

```javascript
Conversations: 1 hour     (frequently changing)
Roadmaps: 24 hours       (read-heavy, stable)
Flashcards: 7 days       (rarely change)
Quiz Content: 30 days    (immutable)
User Profile: 5 minutes  (sensitive data)
User Stats: 15 minutes   (computed data)
```

You can override TTL per route:
```javascript
cacheMiddleware({
  keyFn: userCacheKey('stats'),
  ttl: 300,  // 5 minutes (override default)
})
```

---

## Monitoring & Admin Endpoints

All endpoints require authentication. Add to Postman/Insomnia:

### 1. Health Check (Public)
```
GET /api/cache/health
```

### 2. Get Metrics (Admin)
```
GET /api/cache/metrics
Headers: Authorization: Bearer YOUR_JWT_TOKEN

Response:
{
  "hitRatio": {
    "total": "85.50",
    "roadmap": "91.20"
  },
  "memory": {
    "usedMemoryHuman": "5.00M"
  },
  "server": {
    "totalKeys": 1250
  }
}
```

### 3. Invalidate Cache (Admin)
```
POST /api/cache/invalidate
Headers: Authorization: Bearer YOUR_JWT_TOKEN
Body: {
  "keys": ["roadmap:detail:123:v1"],
  "tags": ["user:456"]
}
```

### 4. List Tags (Admin)
```
GET /api/cache/tags
Headers: Authorization: Bearer YOUR_JWT_TOKEN
```

### 5. Flush All (Admin) ⚠️
```
POST /api/cache/flush
Headers: Authorization: Bearer YOUR_JWT_TOKEN
Body: {
  "confirm": "FLUSH_ALL_CACHE"
}
```

---

## Testing Cache Behavior

### Test Cache Hit/Miss

```bash
# First request (cache miss)
curl -i http://localhost:5000/api/roadmaps/123
# Look for: X-Cache: MISS

# Second request (cache hit)
curl -i http://localhost:5000/api/roadmaps/123
# Look for: X-Cache: HIT
```

### Test Cache Invalidation

```bash
# Update roadmap
curl -X PUT http://localhost:5000/api/roadmaps/123 \
  -H "Authorization: Bearer TOKEN" \
  -d '{"title": "Updated"}'

# Next GET will be cache miss (cache was invalidated)
curl -i http://localhost:5000/api/roadmaps/123
# Look for: X-Cache: MISS
```

---

## Rate Limiting

Already configured globally: **100 requests per 15 minutes**

To customize per route:
```javascript
import { rateLimitMiddleware } from '../middleware/cacheRateLimiter.js';

// Stricter limit for auth
router.post('/register',
  rateLimitMiddleware({
    maxRequests: 5,
    windowSeconds: 900,  // 5 req / 15 min
  }),
  controller.register
);

// Per-user limit
router.post('/generate',
  authMiddleware,
  rateLimitMiddleware({
    maxRequests: 10,
    windowSeconds: 3600,  // 10 per hour per user
    keyGenerator: (req) => req.user._id.toString(),
  }),
  controller.generate
);
```

---

## Troubleshooting

### Cache Not Working?

```bash
# 1. Check Redis connection
redis-cli ping  # Should return PONG

# 2. Check health endpoint
curl http://localhost:5000/api/cache/health

# 3. Check environment
grep CACHE_ENABLED .env  # Should be true
grep REDIS_HOST .env     # Should match your Redis host

# 4. Check server logs
# Look for: "✅ Cache system initialized successfully!"
```

### Redis Connection Failed?

```bash
# Check if Redis is running
ps aux | grep redis

# Start Redis
docker start redis  # If using Docker
brew services start redis  # If using Homebrew

# Test connection
redis-cli -h localhost -p 6379 ping
```

### Circuit Breaker Open?

If you see "Circuit breaker OPEN" in logs:
- Redis is down or unreachable
- Too many consecutive failures (>5)
- App will automatically fallback to DB (no errors)
- Circuit will auto-recover after 60 seconds

---

## Production Checklist

Before deploying to production:

- [ ] Use managed Redis (AWS ElastiCache, Redis Cloud, Upstash)
- [ ] Enable TLS: Set `REDIS_TLS_ENABLED=true`
- [ ] Set strong password: `REDIS_PASSWORD=your_secure_password`
- [ ] Monitor metrics: Set up alerts for hit ratio < 70%
- [ ] Configure eviction: Redis should use `allkeys-lru`
- [ ] Set maxmemory: e.g., `maxmemory 2gb`
- [ ] Disable AOF/RDB: Cache-only, no persistence needed
- [ ] Test failover: Ensure app works when Redis is down

---

## Architecture Overview

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│  Express Middleware     │
│  1. Rate Limiter       │
│  2. Cache Middleware   │
└──────┬──────────────────┘
       │
       ├─── Cache Hit ──────► Return cached data
       │
       └─── Cache Miss ────┐
                           ▼
                  ┌─────────────────┐
                  │   Controller    │
                  │  (Fetch from DB)│
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  Cache Result   │
                  │  (Background)   │
                  └─────────────────┘
```

---

## Performance Expectations

With caching enabled:

- **API Response Time**: 5-50ms (from cache) vs 200-500ms (from DB)
- **Cache Hit Ratio**: Target 70-85% (varies by endpoint)
- **Redis Latency**: < 5ms average
- **Throughput**: 1000+ req/sec (limited by rate limiter)

---

## Next Steps

1. **Add caching to existing routes** - See `CACHE_INTEGRATION_GUIDE.md`
2. **Monitor metrics** - Check `/api/cache/metrics` daily
3. **Tune TTLs** - Adjust based on actual usage patterns
4. **Set up alerts** - Hit ratio < 70%, memory > 80%
5. **Plan scaling** - Redis Cluster when you hit 10k+ users

---

## Support & Documentation

- **Full Integration Guide**: `CACHE_INTEGRATION_GUIDE.md`
- **Cache Config**: `config/cache.js`
- **Example Routes**: See CACHE_INTEGRATION_GUIDE.md
- **Admin API**: All endpoints documented above

**Questions?** Check server logs for cache-related messages (look for ✅/❌ emojis)
