# 🚀 Quick Cache Test - 5 Minute Verification

Run these commands to verify your cache is working in under 5 minutes!

---

## Step 1: Start Redis (30 seconds)

```bash
# Option A: Direct Redis
redis-server --daemonize yes

# Option B: Docker
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Verify
redis-cli ping
# Expected: PONG
```

---

## Step 2: Start Your Server (1 minute)

```bash
cd backend
npm run dev
```

**Look for these success messages:**
```
✅ Redis: Connected successfully
✅ Cache system initialized successfully!
✅ Cache admin routes mounted at /api/cache
🚀 Server running on port 5000
```

---

## Step 3: Test Cache Health (15 seconds)

```bash
curl http://localhost:5000/api/cache/health
```

**Expected:**
```json
{
  "status": "ok",
  "cache": {
    "redis": {
      "status": "up",
      "circuitState": "CLOSED",
      "isConnected": true
    }
  }
}
```

✅ **If you see `"status": "ok"` - Cache is working!**

---

## Step 4: Test Cache Hit/Miss (1 minute)

Make the same request twice and watch the `X-Cache` header:

```bash
# First request - MISS (fetches from database)
curl -i http://localhost:5000/api/your-route-here

# Look for:
# X-Cache: MISS

# Second request - HIT (served from cache)
curl -i http://localhost:5000/api/your-route-here

# Look for:
# X-Cache: HIT
```

✅ **If first = MISS and second = HIT - Caching works!**

---

## Step 5: View Cache in Redis (30 seconds)

```bash
# See all cached keys
redis-cli KEYS "*"

# Example output:
# 1) "conv:v1:msgs:12345"
# 2) "user:v1:profile:67890"

# View a specific cache value
redis-cli GET "conv:v1:msgs:12345"

# Check how long until it expires
redis-cli TTL "conv:v1:msgs:12345"
# Shows seconds remaining
```

✅ **If you see keys - Data is being cached!**

---

## Step 6: Check Cache Metrics (30 seconds)

```bash
curl http://localhost:5000/api/cache/metrics | jq '.metrics.hitRatio'
```

**Expected:**
```json
{
  "total": 50,
  "conversation": 75,
  "roadmap": 60
}
```

✅ **Hit ratio > 0% means cache is serving requests!**

---

## 🎯 Quick Test Script

Run our automated test:

```bash
cd backend
./test-cache.sh
```

This will automatically check all 7 steps above!

---

## ✅ Success Checklist

Your cache is working if you see:

- [x] ✅ Redis responds to `ping` with `PONG`
- [x] ✅ Server logs show "Cache system initialized successfully"
- [x] ✅ `/api/cache/health` returns `"status": "ok"`
- [x] ✅ First request shows `X-Cache: MISS`
- [x] ✅ Second request shows `X-Cache: HIT`
- [x] ✅ `redis-cli KEYS "*"` shows cached keys
- [x] ✅ `/api/cache/metrics` shows hit ratio > 0%

---

## 🐛 Quick Troubleshooting

### Redis not running?
```bash
ps aux | grep redis-server
redis-cli ping
```

### Server not starting?
```bash
# Check environment variables
cat .env | grep CACHE_ENABLED
# Should be: CACHE_ENABLED=true
```

### No X-Cache header?
```bash
# Make sure you added cache middleware to your route
# See CACHE_EXAMPLES.md for how to add caching
```

---

## 📚 Learn More

- **Detailed Testing**: `CACHE_TESTING_GUIDE.md` - 13 comprehensive tests
- **Code Examples**: `CACHE_EXAMPLES.md` - 8 practical examples
- **Integration**: `CACHE_INTEGRATION_GUIDE.md` - How to add to routes
- **Quick Start**: `CACHE_QUICK_START.md` - Get started in 5 minutes

---

## 🎉 Next Steps

Once verified, add caching to your routes:

```javascript
import { cacheMiddleware, resourceCacheKey } from '../middleware/cacheMiddleware.js';

router.get(
  '/conversations/:id/messages',
  protect,
  cacheMiddleware({
    keyFn: resourceCacheKey('conv:msgs', 'id'),
    ttl: 3600 // 1 hour
  }),
  yourHandler
);
```

See `CACHE_EXAMPLES.md` for 8 real-world examples!

Happy caching! 🚀
