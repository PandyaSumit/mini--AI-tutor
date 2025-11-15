/**
 * Cache Initialization
 * Initialize all cache components on server startup
 */

const redisClient = require('./redis');
const cacheManager = require('../utils/CacheManager');
const cacheTagManager = require('../utils/CacheTagManager');
const cacheMetrics = require('../utils/CacheMetrics');
const { rateLimiter } = require('../middleware/cacheRateLimiter');
const cacheConfig = require('./cache');

/**
 * Initialize all cache components
 */
async function initializeCache() {
  console.log('🚀 Initializing cache system...');

  // Check if caching is enabled
  if (!cacheConfig.FEATURES.enabled) {
    console.log('⚠️  Cache is disabled (CACHE_ENABLED=false)');
    return { success: false, reason: 'Cache disabled' };
  }

  try {
    // Connect to Redis
    console.log('📡 Connecting to Redis...');
    const redis = await redisClient.connect();

    if (!redis) {
      console.error('❌ Redis connection failed - cache will be bypassed');
      return { success: false, reason: 'Redis connection failed' };
    }

    // Initialize cache manager
    console.log('📦 Initializing cache manager...');
    await cacheManager.initialize();

    // Initialize tag manager
    console.log('🏷️  Initializing tag manager...');
    await cacheTagManager.initialize();

    // Initialize metrics
    if (cacheConfig.FEATURES.metricsEnabled) {
      console.log('📊 Initializing metrics collection...');
      await cacheMetrics.initialize();
    }

    // Initialize rate limiter
    if (cacheConfig.RATE_LIMIT.enabled) {
      console.log('🚦 Initializing rate limiter...');
      await rateLimiter.initialize();
    }

    // Print configuration
    console.log('\n✅ Cache system initialized successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Cache Configuration:');
    console.log(`   Redis Host: ${cacheConfig.REDIS.host}:${cacheConfig.REDIS.port}`);
    console.log(`   TLS Enabled: ${cacheConfig.REDIS.enableTLS}`);
    console.log(`   Cache Version: ${cacheConfig.CACHE_VERSION}`);
    console.log(`   SWR Enabled: ${cacheConfig.FEATURES.enableSWR}`);
    console.log(`   Stampede Prevention: ${cacheConfig.FEATURES.enableStampedePrevention}`);
    console.log(`   Metrics Enabled: ${cacheConfig.FEATURES.metricsEnabled}`);
    console.log(`   Rate Limiting: ${cacheConfig.RATE_LIMIT.enabled}`);
    if (cacheConfig.RATE_LIMIT.enabled) {
      console.log(`   Rate Limit: ${cacheConfig.RATE_LIMIT.maxRequests} req/${cacheConfig.RATE_LIMIT.windowSeconds}s`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return { success: true };
  } catch (error) {
    console.error('❌ Cache initialization failed:', error.message);
    console.error(error.stack);
    return { success: false, reason: error.message };
  }
}

/**
 * Graceful shutdown - close Redis connection
 */
async function shutdownCache() {
  console.log('\n🛑 Shutting down cache system...');

  try {
    await redisClient.disconnect();
    console.log('✅ Cache system shutdown complete');
  } catch (error) {
    console.error('❌ Error during cache shutdown:', error.message);
  }
}

module.exports = {
  initializeCache,
  shutdownCache,
};
