/**
 * Vector Search Cache
 * Caches vector search results to reduce computation
 */

import crypto from 'crypto';
import cacheManager from '../../utils/CacheManager.js';
import aiConfig from '../../config/ai.js';

class VectorCache {
  constructor() {
    this.enabled = aiConfig.vectorStore.cacheEnabled;
    this.ttl = aiConfig.vectorStore.cacheTTL;
    this.stats = { hits: 0, misses: 0 };
  }

  generateKey(query, collectionKey, options = {}) {
    const keyData = `${collectionKey}:${query}:${JSON.stringify(options)}`;
    const hash = crypto.createHash('sha256').update(keyData).digest('hex');
    return `vec:v1:${hash}`;
  }

  async get(query, collectionKey, options = {}) {
    if (!this.enabled) return null;

    const key = this.generateKey(query, collectionKey, options);
    const result = await cacheManager.get(key);

    if (result) {
      this.stats.hits++;
      return result;
    }

    this.stats.misses++;
    return null;
  }

  async set(query, collectionKey, results, options = {}) {
    if (!this.enabled) return false;

    const key = this.generateKey(query, collectionKey, options);
    return await cacheManager.set(key, results, this.ttl);
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRatio: total > 0 ? Math.round((this.stats.hits / total) * 100) : 0,
    };
  }
}

export default new VectorCache();
