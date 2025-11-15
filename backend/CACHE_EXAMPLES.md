# Redis Cache - Practical Examples

This guide shows you exactly how to add caching to your existing routes with real examples.

---

## 🎯 Example 1: Cache Conversation Messages (Most Common)

### Before (No Cache):

```javascript
// routes/conversationRoutes.js
router.get('/conversations/:id/messages', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('messages');

    res.json({
      success: true,
      data: conversation.messages
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### After (With Cache - 1 hour TTL):

```javascript
// routes/conversationRoutes.js
import { cacheMiddleware, resourceCacheKey } from '../middleware/cacheMiddleware.js';
import cacheConfig from '../config/cache.js';

router.get(
  '/conversations/:id/messages',
  protect,
  cacheMiddleware({
    keyFn: resourceCacheKey('conv:msgs', 'id'),
    ttl: cacheConfig.TTL.CONVERSATION_MESSAGES, // 1 hour
    tags: [(req) => `conversation:${req.params.id}`]
  }),
  async (req, res) => {
    try {
      const conversation = await Conversation.findById(req.params.id)
        .populate('messages');

      res.json({
        success: true,
        data: conversation.messages
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
```

**How to verify it's working:**
```bash
# First request - X-Cache: MISS (fetches from DB)
curl -i http://localhost:5000/api/conversations/abc123/messages \
  -H "Authorization: Bearer YOUR_TOKEN"

# Second request - X-Cache: HIT (served from cache)
curl -i http://localhost:5000/api/conversations/abc123/messages \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎯 Example 2: Cache User Profile

### With Cache:

```javascript
// routes/userRoutes.js
import { cacheMiddleware, userCacheKey } from '../middleware/cacheMiddleware.js';
import cacheConfig from '../config/cache.js';

router.get(
  '/users/profile',
  protect,
  cacheMiddleware({
    keyFn: userCacheKey('profile'),
    ttl: cacheConfig.TTL.USER_PROFILE_PUBLIC, // 5 minutes
    tags: [(req) => `user:${req.user.id}`]
  }),
  async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, data: user });
  }
);
```

**Invalidate when user updates profile:**

```javascript
// routes/userRoutes.js
import { invalidateUserCache } from '../utils/cacheInvalidation.js';

router.put('/users/profile', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      req.body,
      { new: true }
    );

    // Invalidate user cache after update
    await invalidateUserCache(req.user.id);

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 🎯 Example 3: Cache Roadmap Details

### With Cache and Tag-based Invalidation:

```javascript
// routes/roadmapRoutes.js
import { cacheMiddleware, resourceCacheKey } from '../middleware/cacheMiddleware.js';
import { invalidateRoadmapCache } from '../utils/cacheInvalidation.js';
import cacheConfig from '../config/cache.js';

// GET roadmap - cached for 24 hours
router.get(
  '/roadmaps/:id',
  protect,
  cacheMiddleware({
    keyFn: resourceCacheKey('roadmap:detail', 'id'),
    ttl: cacheConfig.TTL.ROADMAP_DETAIL, // 24 hours
    tags: [
      (req) => `roadmap:${req.params.id}`,
      (req) => `user:${req.user.id}`
    ]
  }),
  async (req, res) => {
    const roadmap = await Roadmap.findById(req.params.id);
    res.json({ success: true, data: roadmap });
  }
);

// UPDATE roadmap - invalidate cache after update
router.put('/roadmaps/:id', protect, async (req, res) => {
  try {
    const roadmap = await Roadmap.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    // Invalidate roadmap cache
    await invalidateRoadmapCache(req.params.id, req.user.id);

    res.json({ success: true, data: roadmap });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 🎯 Example 4: Cache with Stale-While-Revalidate (SWR)

For better performance, serve stale data while refreshing in background:

```javascript
// routes/roadmapRoutes.js
router.get(
  '/roadmaps/:id/stats',
  protect,
  async (req, res) => {
    const cacheKey = `roadmap:v1:stats:${req.params.id}`;

    // Try SWR fetch
    const result = await cacheManager.getWithSWR(
      cacheKey,
      async () => {
        // This function fetches fresh data if needed
        return await calculateRoadmapStats(req.params.id);
      },
      cacheConfig.TTL.ROADMAP_STATS, // 6 hours
      cacheConfig.TTL.ROADMAP_STATS * 2 // 12 hours stale window
    );

    res.set('X-Cache', result.fromCache ? 'HIT' : 'MISS');
    res.set('X-Cache-Stale', result.stale ? 'true' : 'false');
    res.json({ success: true, data: result.data });
  }
);
```

**How SWR works:**
- **0-6 hours**: Fresh data, served from cache immediately
- **6-12 hours**: Stale data, served from cache immediately + refreshed in background
- **12+ hours**: Expired, fetched fresh with lock to prevent stampede

---

## 🎯 Example 5: Conditional Caching (Only Cache on Success)

```javascript
import { conditionalCache } from '../middleware/cacheMiddleware.js';

router.get(
  '/flashcards/:deckId',
  protect,
  conditionalCache({
    keyFn: resourceCacheKey('flashcard:deck', 'deckId'),
    ttl: cacheConfig.TTL.FLASHCARD_DECK,
    condition: (req, res, data) => {
      // Only cache if deck has flashcards
      return data.flashcards && data.flashcards.length > 0;
    }
  }),
  async (req, res) => {
    const deck = await FlashcardDeck.findById(req.params.deckId)
      .populate('flashcards');
    res.json({ success: true, data: deck });
  }
);
```

---

## 🎯 Example 6: Rate Limiting on Expensive Routes

```javascript
// routes/aiRoutes.js
import { rateLimitMiddleware } from '../middleware/cacheRateLimiter.js';

router.post(
  '/ai/generate-roadmap',
  protect,
  rateLimitMiddleware({
    maxRequests: 10, // 10 requests
    windowSeconds: 3600, // per hour
    keyPrefix: 'ai-generate'
  }),
  async (req, res) => {
    // Expensive AI operation
    const roadmap = await generateRoadmapWithAI(req.body);
    res.json({ success: true, data: roadmap });
  }
);
```

**Response when rate limited:**
```json
{
  "error": "Too many requests",
  "retryAfter": 3456
}
```

**Headers:**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
HTTP/1.1 429 Too Many Requests
```

---

## 🎯 Example 7: Invalidate After Mutation Middleware

Automatically invalidate cache after POST/PUT/DELETE:

```javascript
import { invalidateCacheAfter } from '../middleware/cacheMiddleware.js';

router.post(
  '/conversations/:id/messages',
  protect,
  invalidateCacheAfter({
    keysToInvalidate: (req) => [
      `conv:v1:msgs:${req.params.id}`,
      `user:v1:convs:${req.user.id}:list`
    ],
    tagsToInvalidate: (req) => [
      `conversation:${req.params.id}`,
      `user:${req.user.id}`
    ]
  }),
  async (req, res) => {
    const message = await Message.create({
      conversation: req.params.id,
      user: req.user.id,
      content: req.body.content
    });
    res.json({ success: true, data: message });
  }
);
```

---

## 🎯 Example 8: Manual Cache Operations

Sometimes you need manual control:

```javascript
import cacheManager from '../utils/CacheManager.js';
import cacheTagManager from '../utils/CacheTagManager.js';

router.get('/complex-data', protect, async (req, res) => {
  const cacheKey = cacheManager.generateKey('complex', req.user.id, 'data');

  // Try to get from cache
  let data = await cacheManager.get(cacheKey);

  if (!data) {
    // Fetch from multiple sources
    const [profile, stats, preferences] = await Promise.all([
      User.findById(req.user.id),
      getUserStats(req.user.id),
      getUserPreferences(req.user.id)
    ]);

    data = { profile, stats, preferences };

    // Cache with tags
    await cacheTagManager.setWithTags(
      cacheKey,
      data,
      3600, // 1 hour
      [`user:${req.user.id}`, 'user-data']
    );
  }

  res.json({ success: true, data });
});
```

---

## 🧪 Testing Your Cached Routes

### 1. Test Cache Hit/Miss

```bash
#!/bin/bash

echo "Testing cache for conversations..."

# First request - should be MISS
echo "Request 1 (should be MISS):"
curl -s -w "\nX-Cache: %{header_x_cache}\n" \
  http://localhost:5000/api/conversations/123/messages \
  -H "Authorization: Bearer $TOKEN"

sleep 1

# Second request - should be HIT
echo "Request 2 (should be HIT):"
curl -s -w "\nX-Cache: %{header_x_cache}\n" \
  http://localhost:5000/api/conversations/123/messages \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Verify Cache Keys in Redis

```bash
# View all conversation cache keys
redis-cli KEYS "conv:v1:*"

# View specific cache value
redis-cli GET "conv:v1:msgs:123"

# Check TTL (time to live)
redis-cli TTL "conv:v1:msgs:123"
```

### 3. Test Cache Invalidation

```bash
# Update conversation (should invalidate cache)
curl -X POST http://localhost:5000/api/conversations/123/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "New message"}'

# Next request should be MISS (cache was invalidated)
curl -s -w "\nX-Cache: %{header_x_cache}\n" \
  http://localhost:5000/api/conversations/123/messages \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Monitor Cache Performance

### Check Hit Ratio Over Time

```bash
# Make 100 requests
for i in {1..100}; do
  curl -s http://localhost:5000/api/conversations/123/messages \
    -H "Authorization: Bearer $TOKEN" > /dev/null
done

# Check metrics
curl -s http://localhost:5000/api/cache/metrics | jq '{
  hitRatio: .metrics.hitRatio,
  latency: .metrics.latency
}'
```

**Good performance indicators:**
- Hit ratio > 80% for frequently accessed data
- Latency < 5ms for cache hits
- Latency < 100ms for cache misses

---

## ⚡ Performance Comparison

### Without Cache:
```
Request 1: 250ms (DB query + processing)
Request 2: 245ms (DB query + processing)
Request 3: 252ms (DB query + processing)
Average: 249ms
```

### With Cache:
```
Request 1: 250ms (DB query + caching)
Request 2: 3ms (from cache)
Request 3: 2ms (from cache)
Average: 85ms (66% faster!)
```

---

## 🎓 Best Practices Summary

1. **Cache frequently accessed data** (conversations, profiles, roadmaps)
2. **Set appropriate TTLs** based on data volatility
3. **Always invalidate cache** after mutations (POST/PUT/DELETE)
4. **Use tags** for bulk invalidation of related data
5. **Add X-Cache headers** to debug cache behavior
6. **Monitor hit ratios** and adjust TTLs accordingly
7. **Use SWR** for better perceived performance
8. **Rate limit expensive operations** (AI generation, reports)

---

## 🚀 Quick Start Checklist

- [ ] Start Redis: `redis-server --daemonize yes`
- [ ] Add cache middleware to your route
- [ ] Test with `curl -i` to see X-Cache headers
- [ ] Add invalidation after mutations
- [ ] Monitor with `/api/cache/metrics`
- [ ] Check Redis keys with `redis-cli KEYS "*"`
- [ ] Verify hit ratio > 70% after some usage

Happy caching! 🎉
