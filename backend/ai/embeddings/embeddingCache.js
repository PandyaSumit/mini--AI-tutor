/**
 * Embedding Cache Layer
 * Multi-layer caching: LRU (hot) → Redis (warm) → Generate (cold)
 */

import { LRUCache } from 'lru-cache';
import crypto from 'crypto';
import cacheManager from '../../utils/CacheManager.js';
import aiConfig from '../../config/ai.js';

class EmbeddingCache {
  constructor() {
    // L1 Cache: In-memory LRU for hot embeddings
    this.lruCache = new LRUCache({
      max: aiConfig.embeddings.lruCacheSize,
      ttl: aiConfig.embeddings.cacheTTL * 1000, // Convert to ms
      updateAgeOnGet: true,
      updateAgeOnHas: true,
    });

    // Cache statistics
    this.stats = {
      hits: { lru: 0, redis: 0, total: 0 },
      misses: 0,
      sets: 0,
      errors: 0,
    };

    this.enabled = aiConfig.embeddings.cacheEnabled;
  }

  /**
   * Generate cache key from text
   */
  generateKey(text, prefix = 'emb') {
    // Use SHA-256 hash for cache key (deterministic)
    const hash = crypto.createHash('sha256').update(text).digest('hex');
    return `${prefix}:v1:${hash}`;
  }

  /**
   * Get embedding from cache
   * Checks: LRU → Redis → null
   */
  async get(text) {
    if (!this.enabled) {
      return null;
    }

    const key = this.generateKey(text);

    try {
      // L1: Check LRU cache (in-memory, fastest)
      const lruResult = this.lruCache.get(key);
      if (lruResult) {
        this.stats.hits.lru++;
        this.stats.hits.total++;
        return {
          embedding: lruResult,
          cached: true,
          source: 'lru',
        };
      }

      // L2: Check Redis cache (persistent, fast)
      const redisResult = await cacheManager.get(key);
      if (redisResult) {
        this.stats.hits.redis++;
        this.stats.hits.total++;

        // Promote to LRU cache for faster future access
        this.lruCache.set(key, redisResult);

        return {
          embedding: redisResult,
          cached: true,
          source: 'redis',
        };
      }

      // Cache miss
      this.stats.misses++;
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      this.stats.errors++;
      return null; // Fail gracefully
    }
  }

  /**
   * Set embedding in cache
   * Stores in both LRU and Redis
   */
  async set(text, embedding) {
    if (!this.enabled) {
      return false;
    }

    const key = this.generateKey(text);

    try {
      // Store in L1: LRU cache (in-memory)
      this.lruCache.set(key, embedding);

      // Store in L2: Redis cache (persistent)
      await cacheManager.set(key, embedding, aiConfig.embeddings.cacheTTL);

      this.stats.sets++;
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Get multiple embeddings from cache
   */
  async getMany(texts) {
    if (!this.enabled) {
      return new Map();
    }

    const results = new Map();

    for (const text of texts) {
      const cached = await this.get(text);
      if (cached) {
        results.set(text, cached.embedding);
      }
    }

    return results;
  }

  /**
   * Set multiple embeddings in cache
   */
  async setMany(textEmbeddingPairs) {
    if (!this.enabled) {
      return false;
    }

    try {
      for (const [text, embedding] of textEmbeddingPairs) {
        await this.set(text, embedding);
      }
      return true;
    } catch (error) {
      console.error('Batch cache set error:', error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Check if text is cached
   */
  async has(text) {
    const cached = await this.get(text);
    return cached !== null;
  }

  /**
   * Delete embedding from cache
   */
  async delete(text) {
    const key = this.generateKey(text);

    try {
      // Remove from LRU
      this.lruCache.delete(key);

      // Remove from Redis
      await cacheManager.del(key);

      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Clear all embedding caches
   */
  async clear() {
    try {
      // Clear LRU cache
      this.lruCache.clear();

      // Clear Redis embedding keys (pattern: emb:v1:*)
      const pattern = 'emb:v1:*';
      const keys = await cacheManager.redis.keys(pattern);
      if (keys.length > 0) {
        await cacheManager.delMany(keys);
      }

      console.log(`🧹 Cleared ${keys.length} embedding cache entries`);
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalRequests = this.stats.hits.total + this.stats.misses;
    const hitRatio = totalRequests > 0 ? (this.stats.hits.total / totalRequests) * 100 : 0;

    return {
      enabled: this.enabled,
      hits: {
        lru: this.stats.hits.lru,
        redis: this.stats.hits.redis,
        total: this.stats.hits.total,
      },
      misses: this.stats.misses,
      sets: this.stats.sets,
      errors: this.stats.errors,
      totalRequests,
      hitRatio: Math.round(hitRatio * 10) / 10,
      lruSize: this.lruCache.size,
      lruMax: this.lruCache.max,
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      hits: { lru: 0, redis: 0, total: 0 },
      misses: 0,
      sets: 0,
      errors: 0,
    };
  }

  /**
   * Get cache size info
   */
  async getCacheSize() {
    try {
      // LRU cache size
      const lruSize = this.lruCache.size;

      // Redis cache size (count keys)
      const pattern = 'emb:v1:*';
      const keys = await cacheManager.redis.keys(pattern);
      const redisSize = keys.length;

      return {
        lru: lruSize,
        redis: redisSize,
        total: redisSize, // Redis is source of truth
      };
    } catch (error) {
      console.error('Cache size error:', error);
      return {
        lru: this.lruCache.size,
        redis: 0,
        total: 0,
      };
    }
  }

  /**
   * Estimate memory usage
   */
  estimateMemory() {
    // Rough estimate: 384 dimensions × 4 bytes per float + overhead
    const bytesPerEmbedding = 384 * 4 + 100; // ~1.6KB per embedding
    const lruMemory = this.lruCache.size * bytesPerEmbedding;

    return {
      lru: {
        bytes: lruMemory,
        mb: Math.round((lruMemory / 1024 / 1024) * 10) / 10,
      },
      estimated: true,
    };
  }

  /**
   * Warm up cache with common texts
   */
  async warmup(texts, embedFn) {
    console.log(`🔥 Warming up embedding cache with ${texts.length} texts...`);

    let cached = 0;
    let generated = 0;

    for (const text of texts) {
      const result = await this.get(text);
      if (result) {
        cached++;
      } else if (embedFn) {
        // Generate and cache
        const embedding = await embedFn(text);
        await this.set(text, embedding);
        generated++;
      }
    }

    console.log(`✅ Cache warmup complete: ${cached} cached, ${generated} generated`);
    return { cached, generated };
  }
}

// Singleton instance
const embeddingCache = new EmbeddingCache();

export default embeddingCache;
