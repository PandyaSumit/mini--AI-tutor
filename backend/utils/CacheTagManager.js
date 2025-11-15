/**
 * CacheTagManager - Tag-based cache invalidation
 * Allows bulk invalidation of related cache entries
 */

import redisClient from '../config/redis.js';
import cacheConfig from '../config/cache.js';

class CacheTagManager {
  constructor() {
    this.redis = null;
  }

  /**
   * Initialize tag manager
   */
  async initialize() {
    this.redis = await redisClient.connect();
    return this.redis !== null;
  }

  /**
   * Add key to tag set
   */
  async tag(tagName, key) {
    if (!this.redis || !redisClient.isConnected) {
      return false;
    }

    const fullTagKey = `${cacheConfig.PREFIXES.TAG}:${tagName}`;

    try {
      await redisClient.executeWithCircuitBreaker(
        () => this.redis.sadd(fullTagKey, key),
        () => null
      );
      return true;
    } catch (error) {
      console.error('Tag add error:', error.message);
      return false;
    }
  }

  /**
   * Add multiple keys to a tag
   */
  async tagMany(tagName, keys) {
    if (!this.redis || !redisClient.isConnected || keys.length === 0) {
      return false;
    }

    const fullTagKey = `${cacheConfig.PREFIXES.TAG}:${tagName}`;

    try {
      await redisClient.executeWithCircuitBreaker(
        () => this.redis.sadd(fullTagKey, ...keys),
        () => null
      );
      return true;
    } catch (error) {
      console.error('Tag many error:', error.message);
      return false;
    }
  }

  /**
   * Get all keys associated with a tag
   */
  async getTaggedKeys(tagName) {
    if (!this.redis || !redisClient.isConnected) {
      return [];
    }

    const fullTagKey = `${cacheConfig.PREFIXES.TAG}:${tagName}`;

    try {
      const keys = await redisClient.executeWithCircuitBreaker(
        () => this.redis.smembers(fullTagKey),
        () => []
      );
      return keys || [];
    } catch (error) {
      console.error('Get tagged keys error:', error.message);
      return [];
    }
  }

  /**
   * Invalidate all keys with a specific tag
   */
  async invalidateTag(tagName) {
    if (!this.redis || !redisClient.isConnected) {
      return false;
    }

    const fullTagKey = `${cacheConfig.PREFIXES.TAG}:${tagName}`;

    try {
      // Get all keys with this tag
      const keys = await this.getTaggedKeys(tagName);

      if (keys.length === 0) {
        return true;
      }

      // Delete all tagged keys
      await redisClient.executeWithCircuitBreaker(
        () => this.redis.del(...keys),
        () => null
      );

      // Delete the tag set itself
      await redisClient.executeWithCircuitBreaker(
        () => this.redis.del(fullTagKey),
        () => null
      );

      console.log(`✅ Invalidated ${keys.length} keys with tag: ${tagName}`);
      return true;
    } catch (error) {
      console.error('Invalidate tag error:', error.message);
      return false;
    }
  }

  /**
   * Invalidate multiple tags
   */
  async invalidateTags(tags) {
    if (!Array.isArray(tags) || tags.length === 0) {
      return false;
    }

    const results = await Promise.allSettled(
      tags.map(tag => this.invalidateTag(tag))
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
    console.log(`✅ Invalidated ${successCount}/${tags.length} tags`);

    return successCount === tags.length;
  }

  /**
   * Remove specific key from tag
   */
  async untagKey(tagName, key) {
    if (!this.redis || !redisClient.isConnected) {
      return false;
    }

    const fullTagKey = `${cacheConfig.PREFIXES.TAG}:${tagName}`;

    try {
      await redisClient.executeWithCircuitBreaker(
        () => this.redis.srem(fullTagKey, key),
        () => null
      );
      return true;
    } catch (error) {
      console.error('Untag key error:', error.message);
      return false;
    }
  }

  /**
   * Cache data with automatic tagging
   */
  async setWithTags(key, data, ttl, tags = []) {
    if (!this.redis || !redisClient.isConnected) {
      return false;
    }

    try {
      // Set the cache data
      await redisClient.executeWithCircuitBreaker(
        () => this.redis.setex(key, ttl, JSON.stringify(data)),
        () => null
      );

      // Add to tag sets
      if (tags.length > 0) {
        for (const tag of tags) {
          await this.tag(tag, key);
        }
      }

      return true;
    } catch (error) {
      console.error('Set with tags error:', error.message);
      return false;
    }
  }

  /**
   * Get count of keys in a tag
   */
  async getTagSize(tagName) {
    if (!this.redis || !redisClient.isConnected) {
      return 0;
    }

    const fullTagKey = `${cacheConfig.PREFIXES.TAG}:${tagName}`;

    try {
      const count = await redisClient.executeWithCircuitBreaker(
        () => this.redis.scard(fullTagKey),
        () => 0
      );
      return count || 0;
    } catch (error) {
      console.error('Get tag size error:', error.message);
      return 0;
    }
  }

  /**
   * List all tags
   */
  async listTags() {
    if (!this.redis || !redisClient.isConnected) {
      return [];
    }

    try {
      const pattern = `${cacheConfig.PREFIXES.TAG}:*`;
      const keys = await redisClient.executeWithCircuitBreaker(
        async () => {
          const allKeys = [];
          const stream = this.redis.scanStream({ match: pattern, count: 100 });

          return new Promise((resolve, reject) => {
            stream.on('data', (keys) => {
              allKeys.push(...keys);
            });
            stream.on('end', () => {
              resolve(allKeys);
            });
            stream.on('error', reject);
          });
        },
        () => []
      );

      // Remove prefix from tag names
      return keys.map(key => key.replace(`${cacheConfig.PREFIXES.TAG}:`, ''));
    } catch (error) {
      console.error('List tags error:', error.message);
      return [];
    }
  }
}

// Singleton instance
const cacheTagManager = new CacheTagManager();

export default cacheTagManager;
