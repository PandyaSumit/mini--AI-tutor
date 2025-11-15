/**
 * CacheManager - Handles all caching operations
 * Includes: Cache-aside, Stale-While-Revalidate, Distributed Locks
 */

import redisClient from '../config/redis.js';
import cacheConfig from '../config/cache.js';

class CacheManager {
  constructor() {
    this.redis = null;
    this.metricsEnabled = cacheConfig.FEATURES.metricsEnabled;
  }

  /**
   * Initialize cache manager
   */
  async initialize() {
    this.redis = await redisClient.connect();
    return this.redis !== null;
  }

  /**
   * Generate cache key with namespace and version
   */
  generateKey(namespace, identifier, subtype = null) {
    const parts = [namespace, identifier];
    if (subtype) parts.push(subtype);
    parts.push(cacheConfig.CACHE_VERSION);
    return parts.join(':');
  }

  /**
   * Get data from cache
   */
  async get(key) {
    if (!this.redis || !redisClient.isConnected) {
      return null;
    }

    try {
      const cached = await redisClient.executeWithCircuitBreaker(
        () => this.redis.get(key),
        () => null
      );

      if (cached) {
        await this.recordHit(this.getNamespaceFromKey(key));
        return JSON.parse(cached);
      }

      await this.recordMiss(this.getNamespaceFromKey(key));
      return null;
    } catch (error) {
      console.error('Cache get error:', error.message);
      return null;
    }
  }

  /**
   * Set data in cache with TTL
   */
  async set(key, data, ttl) {
    if (!this.redis || !redisClient.isConnected) {
      return false;
    }

    try {
      await redisClient.executeWithCircuitBreaker(
        () => this.redis.setex(key, ttl, JSON.stringify(data)),
        () => null
      );
      return true;
    } catch (error) {
      console.error('Cache set error:', error.message);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async del(key) {
    if (!this.redis || !redisClient.isConnected) {
      return false;
    }

    try {
      await redisClient.executeWithCircuitBreaker(
        () => this.redis.del(key),
        () => null
      );
      return true;
    } catch (error) {
      console.error('Cache del error:', error.message);
      return false;
    }
  }

  /**
   * Delete multiple keys
   */
  async delMany(keys) {
    if (!this.redis || !redisClient.isConnected || keys.length === 0) {
      return false;
    }

    try {
      await redisClient.executeWithCircuitBreaker(
        () => this.redis.del(...keys),
        () => null
      );
      return true;
    } catch (error) {
      console.error('Cache delMany error:', error.message);
      return false;
    }
  }

  /**
   * Get with Stale-While-Revalidate
   */
  async getWithSWR(key, fetchFn, ttl, staleTTL = null) {
    if (!cacheConfig.FEATURES.enableSWR) {
      return await this.getWithFallback(key, fetchFn, ttl);
    }

    staleTTL = staleTTL || ttl * cacheConfig.SWR_MULTIPLIER;

    // Try to get from cache
    const cached = await this.get(key);
    const cacheAge = await this.getTTL(key);

    if (cached) {
      // Fresh data - return immediately
      if (cacheAge > (staleTTL - ttl)) {
        return { data: cached, fromCache: true, stale: false };
      }

      // Stale data - return and refresh in background
      if (cacheAge > 0) {
        this.refreshInBackground(key, fetchFn, ttl);
        return { data: cached, fromCache: true, stale: true };
      }
    }

    // No cache or expired - fetch with stampede prevention
    return await this.fetchWithLock(key, fetchFn, ttl);
  }

  /**
   * Get with fallback to fetch function
   */
  async getWithFallback(key, fetchFn, ttl) {
    const cached = await this.get(key);

    if (cached) {
      return { data: cached, fromCache: true, stale: false };
    }

    // Fetch from source
    const freshData = await fetchFn();

    // Cache the fresh data
    await this.set(key, freshData, ttl);

    return { data: freshData, fromCache: false, stale: false };
  }

  /**
   * Refresh cache in background (non-blocking)
   */
  async refreshInBackground(key, fetchFn, ttl) {
    const lockKey = `${cacheConfig.PREFIXES.LOCK}:${key}:refresh`;

    // Try to acquire lock (non-blocking)
    const acquired = await this.acquireLock(lockKey, 10);

    if (!acquired) {
      // Another process is already refreshing
      return;
    }

    // Refresh asynchronously
    setImmediate(async () => {
      try {
        const freshData = await fetchFn();
        await this.set(key, freshData, ttl);
      } catch (error) {
        console.error(`Background refresh failed for ${key}:`, error.message);
      } finally {
        await this.releaseLock(lockKey);
      }
    });
  }

  /**
   * Fetch with distributed lock (stampede prevention)
   */
  async fetchWithLock(key, fetchFn, ttl) {
    if (!cacheConfig.FEATURES.enableStampedePrevention) {
      const freshData = await fetchFn();
      await this.set(key, freshData, ttl);
      return { data: freshData, fromCache: false, stale: false };
    }

    const lockKey = `${cacheConfig.PREFIXES.LOCK}:${key}:fetch`;
    const lockTimeout = 10; // 10 seconds
    let retries = 10;

    while (retries > 0) {
      // Try to acquire lock
      const acquired = await this.acquireLock(lockKey, lockTimeout);

      if (acquired) {
        try {
          // Lock acquired - fetch data
          const freshData = await fetchFn();
          await this.set(key, freshData, ttl);
          return { data: freshData, fromCache: false, stale: false };
        } finally {
          await this.releaseLock(lockKey);
        }
      }

      // Wait and retry
      await this.sleep(50);
      retries--;

      // Check if data appeared while waiting
      const cached = await this.get(key);
      if (cached) {
        return { data: cached, fromCache: true, stale: false };
      }
    }

    // Timeout - fetch without lock (fallback)
    const freshData = await fetchFn();
    return { data: freshData, fromCache: false, stale: false };
  }

  /**
   * Acquire distributed lock
   */
  async acquireLock(lockKey, ttl) {
    if (!this.redis) return false;

    try {
      const result = await redisClient.executeWithCircuitBreaker(
        () => this.redis.set(lockKey, '1', 'EX', ttl, 'NX'),
        () => null
      );
      return result === 'OK';
    } catch (error) {
      return false;
    }
  }

  /**
   * Release distributed lock
   */
  async releaseLock(lockKey) {
    if (!this.redis) return;

    try {
      await this.del(lockKey);
    } catch (error) {
      console.error('Lock release error:', error.message);
    }
  }

  /**
   * Get TTL of a key
   */
  async getTTL(key) {
    if (!this.redis) return -1;

    try {
      return await redisClient.executeWithCircuitBreaker(
        () => this.redis.ttl(key),
        () => -1
      );
    } catch (error) {
      return -1;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key) {
    if (!this.redis) return false;

    try {
      const result = await redisClient.executeWithCircuitBreaker(
        () => this.redis.exists(key),
        () => 0
      );
      return result === 1;
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract namespace from key
   */
  getNamespaceFromKey(key) {
    return key.split(':')[0] || 'unknown';
  }

  /**
   * Record cache hit
   */
  async recordHit(namespace) {
    if (!this.metricsEnabled || !this.redis) return;

    try {
      await this.redis.hincrby('metric:cache:hits', namespace, 1);
      await this.redis.hincrby('metric:cache:hits', 'total', 1);
    } catch (error) {
      // Silently fail metrics
    }
  }

  /**
   * Record cache miss
   */
  async recordMiss(namespace) {
    if (!this.metricsEnabled || !this.redis) return;

    try {
      await this.redis.hincrby('metric:cache:misses', namespace, 1);
      await this.redis.hincrby('metric:cache:misses', 'total', 1);
    } catch (error) {
      // Silently fail metrics
    }
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Flush all cache (use with caution)
   */
  async flushAll() {
    if (!this.redis) return false;

    try {
      await redisClient.executeWithCircuitBreaker(
        () => this.redis.flushdb(),
        () => null
      );
      console.warn('⚠️  Cache flushed!');
      return true;
    } catch (error) {
      console.error('Cache flush error:', error.message);
      return false;
    }
  }
}

// Singleton instance
const cacheManager = new CacheManager();

export default cacheManager;
