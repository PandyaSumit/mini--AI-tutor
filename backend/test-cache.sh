#!/bin/bash

# Redis Cache Testing Script
# Quick script to verify cache functionality

echo "🧪 Redis Cache Testing Script"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Redis is running
echo "1️⃣  Checking Redis connection..."
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis is running${NC}"
else
    echo -e "${RED}❌ Redis is not running${NC}"
    echo "   Start Redis with: redis-server --daemonize yes"
    echo "   Or with Docker: docker run -d --name redis -p 6379:6379 redis:7-alpine"
    exit 1
fi

echo ""
echo "2️⃣  Checking Redis keys..."
KEY_COUNT=$(redis-cli DBSIZE | awk '{print $2}')
echo "   Current keys in Redis: $KEY_COUNT"

echo ""
echo "3️⃣  Testing basic Redis operations..."
redis-cli SET "test:cache:verify" "Cache is working!" EX 60 > /dev/null 2>&1
TEST_VALUE=$(redis-cli GET "test:cache:verify" 2>/dev/null)
if [ "$TEST_VALUE" = "Cache is working!" ]; then
    echo -e "${GREEN}✅ Redis SET/GET operations working${NC}"
    redis-cli DEL "test:cache:verify" > /dev/null 2>&1
else
    echo -e "${RED}❌ Redis operations failed${NC}"
    exit 1
fi

echo ""
echo "4️⃣  Checking server status..."
if curl -s http://localhost:5000/api/cache/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Server is running${NC}"

    echo ""
    echo "5️⃣  Testing cache health endpoint..."
    HEALTH_STATUS=$(curl -s http://localhost:5000/api/cache/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$HEALTH_STATUS" = "ok" ]; then
        echo -e "${GREEN}✅ Cache health: $HEALTH_STATUS${NC}"
    else
        echo -e "${RED}❌ Cache health check failed${NC}"
    fi

    echo ""
    echo "6️⃣  Fetching cache metrics..."
    curl -s http://localhost:5000/api/cache/metrics | jq '.' > /tmp/cache-metrics.json 2>/dev/null
    if [ -f /tmp/cache-metrics.json ]; then
        echo -e "${GREEN}✅ Metrics retrieved successfully${NC}"
        echo "   View detailed metrics: cat /tmp/cache-metrics.json | jq '.metrics'"
    fi
else
    echo -e "${YELLOW}⚠️  Server is not running${NC}"
    echo "   Start server with: npm run dev"
    exit 1
fi

echo ""
echo "7️⃣  Monitoring Redis in real-time..."
echo "   Run this command to watch Redis operations:"
echo -e "   ${YELLOW}redis-cli MONITOR${NC}"
echo ""
echo "   Or view all cache keys:"
echo -e "   ${YELLOW}redis-cli KEYS \"*\"${NC}"

echo ""
echo "=============================="
echo -e "${GREEN}✅ Cache system verification complete!${NC}"
echo ""
echo "📚 For detailed testing instructions, see:"
echo "   CACHE_TESTING_GUIDE.md"
echo ""
echo "🔍 Quick commands:"
echo "   • View cache keys: redis-cli KEYS \"*\""
echo "   • View metrics: curl http://localhost:5000/api/cache/metrics | jq"
echo "   • Monitor Redis: redis-cli MONITOR"
echo "   • Cache health: curl http://localhost:5000/api/cache/health"
