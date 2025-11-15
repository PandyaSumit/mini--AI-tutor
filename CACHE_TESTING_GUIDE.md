# Redis Cache Testing Guide

This guide will help you verify that the Redis caching system is working properly in your Mini AI Tutor application.

---

## 🚀 Step 1: Start Redis Server

### Option A: Using Redis directly
```bash
# Start Redis in the background
redis-server --daemonize yes

# Or start Redis in foreground (recommended for testing)
redis-server
```

### Option B: Using Docker
```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

### Verify Redis is running
```bash
redis-cli ping
# Expected output: PONG
```

---

## ✅ Step 2: Configure Environment

Make sure your `backend/.env` file has Redis configuration:

```env
CACHE_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
CACHE_METRICS_ENABLED=true
```

---

## 🧪 Step 3: Start Your Server

```bash
cd backend
npm run dev
```

### Expected Console Output

Look for these messages indicating successful cache initialization:

```
🚀 Initializing cache system...
📡 Connecting to Redis...
✅ Redis: Connected successfully
✅ Redis: Ready to accept commands
📦 Initializing cache manager...
🏷️  Initializing tag manager...
📊 Initializing metrics collection...
🚦 Initializing rate limiter...

✅ Cache system initialized successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Cache Configuration:
   Redis Host: localhost:6379
   TLS Enabled: false
   Cache Version: v1
   SWR Enabled: true
   Stampede Prevention: true
   Metrics Enabled: true
   Rate Limiting: true
   Rate Limit: 100 req/900s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Cache admin routes mounted at /api/cache
🚀 Server running on port 5000
```

---

## 🔍 Step 4: Test Cache Health

### Check Cache Health Endpoint

```bash
curl http://localhost:5000/api/cache/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "cache": {
    "redis": {
      "status": "up",
      "circuitState": "CLOSED",
      "failureCount": 0,
      "isConnected": true
    }
  },
  "timestamp": "2025-11-15T09:15:30.123Z"
}
```

---

## 📊 Step 5: Monitor Cache Metrics

### Get Comprehensive Metrics

```bash
curl http://localhost:5000/api/cache/metrics
```

**Expected Response:**
```json
{
  "success": true,
  "metrics": {
    "hitRatio": {
      "total": 0,
      "conversation": 0,
      "roadmap": 0
    },
    "latency": {
      "conversation": 0,
      "roadmap": 0
    },
    "memory": {
      "used": "1.2M",
      "peak": "1.5M",
      "percentage": "0.01%"
    },
    "server": {
      "version": "7.0.0",
      "uptime": 123,
      "connectedClients": 1
    }
  }
}
```

---

## 🧪 Step 6: Test Cache Functionality

### Test 1: Cache a Value Manually

```bash
# Test basic cache set/get
curl -X POST http://localhost:5000/api/cache/test \
  -H "Content-Type: application/json" \
  -d '{"key": "test:key", "value": "test value", "ttl": 60}'
```

### Test 2: Verify Cache Hit/Miss Headers

When you make requests to cached routes, check for the `X-Cache` header:

```bash
# First request (should be MISS)
curl -i http://localhost:5000/api/your-cached-route

# Second request (should be HIT)
curl -i http://localhost:5000/api/your-cached-route
```

**Look for:**
```
X-Cache: MISS   # First request - data fetched from DB
X-Cache: HIT    # Second request - data served from cache
```

---

## 🔧 Step 7: Test Cache Invalidation

### Invalidate by Keys

```bash
curl -X POST http://localhost:5000/api/cache/invalidate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "keys": ["user:123:profile", "conv:456:messages"]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Cache invalidated successfully",
  "invalidated": {
    "keys": 2,
    "tags": 0
  }
}
```

### Invalidate by Tags

```bash
curl -X POST http://localhost:5000/api/cache/invalidate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "tags": ["user:123"]
  }'
```

---

## 🧪 Step 8: Test with Redis CLI

### View All Cache Keys

```bash
redis-cli KEYS "*"
```

**Expected Output:**
```
1) "conv:v1:msg:12345"
2) "user:v1:profile:67890"
3) "roadmap:v1:detail:abc123"
```

### Get Cache Value

```bash
redis-cli GET "conv:v1:msg:12345"
```

### Monitor Redis Commands in Real-Time

```bash
redis-cli MONITOR
```

Then make requests to your API and watch the Redis commands being executed.

### Check Cache Memory Usage

```bash
redis-cli INFO memory
```

---

## 📈 Step 9: Test Cache Hit Ratio

### Generate Cache Traffic

```bash
# Make the same request 10 times
for i in {1..10}; do
  curl -s http://localhost:5000/api/some-route > /dev/null
  echo "Request $i completed"
done
```

### Check Hit Ratio

```bash
curl http://localhost:5000/api/cache/metrics | jq '.metrics.hitRatio'
```

**Expected Output:**
```json
{
  "total": 90,
  "conversation": 100,
  "roadmap": 85
}
```

A hit ratio of 90% means 9 out of 10 requests were served from cache.

---

## 🔍 Step 10: Test Rate Limiting

```bash
# Make 105 requests rapidly (limit is 100 per 15 min)
for i in {1..105}; do
  curl -s -w "%{http_code}\n" http://localhost:5000/api/some-rate-limited-route
done
```

**Expected:**
- First 100 requests: `200 OK`
- Last 5 requests: `429 Too Many Requests`

Check headers:
```bash
curl -i http://localhost:5000/api/rate-limited-route
```

**Look for:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
```

---

## 🧰 Step 11: Test Circuit Breaker

### Stop Redis to Test Fallback

```bash
# Stop Redis
redis-cli shutdown

# Or if using Docker
docker stop redis
```

### Make a Request

```bash
curl http://localhost:5000/api/some-cached-route
```

**Expected Behavior:**
- Server continues to work (doesn't crash)
- Requests go directly to database
- Console shows circuit breaker messages:
```
⚠️  Circuit breaker OPEN - using fallback
```

### Restart Redis

```bash
# Start Redis again
redis-server --daemonize yes

# Or Docker
docker start redis
```

The circuit breaker should automatically recover.

---

## 📊 Step 12: Inspect Cache Tags

### List All Tags

```bash
curl http://localhost:5000/api/cache/tags \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "tags": [
    {
      "tag": "user:123",
      "keyCount": 5
    },
    {
      "tag": "roadmap:456",
      "keyCount": 3
    }
  ]
}
```

---

## 🎯 Step 13: Integration Test Example

Here's a complete test scenario:

```bash
#!/bin/bash

echo "🧪 Testing Cache System..."

# 1. Check health
echo "1. Checking cache health..."
curl -s http://localhost:5000/api/cache/health | jq '.status'

# 2. First request (cache MISS)
echo "2. First request (should be MISS)..."
curl -s -i http://localhost:5000/api/conversations 2>&1 | grep X-Cache

# 3. Second request (cache HIT)
echo "3. Second request (should be HIT)..."
curl -s -i http://localhost:5000/api/conversations 2>&1 | grep X-Cache

# 4. Check metrics
echo "4. Checking cache metrics..."
curl -s http://localhost:5000/api/cache/metrics | jq '.metrics.hitRatio.total'

# 5. Check Redis keys
echo "5. Checking Redis keys..."
redis-cli KEYS "*" | wc -l

echo "✅ Cache test complete!"
```

---

## 🐛 Troubleshooting

### Redis Not Connecting

**Check if Redis is running:**
```bash
ps aux | grep redis-server
```

**Check Redis port:**
```bash
netstat -tulpn | grep 6379
```

**Test connection:**
```bash
redis-cli ping
```

### Cache Not Working

**Check environment variables:**
```bash
cat backend/.env | grep CACHE
```

**Check server logs for errors:**
```bash
# Look for these messages
✅ Cache system initialized successfully!
✅ Redis: Connected successfully
```

### High Memory Usage

**Check Redis memory:**
```bash
redis-cli INFO memory | grep used_memory_human
```

**Clear all cache:**
```bash
curl -X POST http://localhost:5000/api/cache/flush \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"confirm": "FLUSH_ALL_CACHE"}'
```

---

## 📚 Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/cache/health` | GET | Check cache system health |
| `/api/cache/metrics` | GET | Get performance metrics |
| `/api/cache/invalidate` | POST | Invalidate cache by keys/tags |
| `/api/cache/tags` | GET | List all cache tags |
| `/api/cache/flush` | POST | Flush all cache (use with caution) |

---

## ✅ Success Indicators

Your cache is working properly if you see:

1. ✅ Redis connection successful on server startup
2. ✅ `X-Cache: HIT` headers on repeated requests
3. ✅ Cache hit ratio > 70% after some usage
4. ✅ Response times decrease on cached requests
5. ✅ Circuit breaker opens/closes properly when Redis fails/recovers
6. ✅ Rate limiting returns 429 after limit exceeded
7. ✅ Cache metrics show accurate hit/miss counts

---

## 🎓 Next Steps

1. **Integrate caching into your routes** using the patterns in `CACHE_INTEGRATION_GUIDE.md`
2. **Monitor cache performance** in production using the metrics endpoint
3. **Tune TTL values** in `config/cache.js` based on your data patterns
4. **Set up Redis monitoring** tools like RedisInsight or Redis Commander

Happy caching! 🚀
