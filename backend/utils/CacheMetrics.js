/**
 * Cache Metrics Collection
 * Tracks cache performance, hit ratios, latency, etc.
 */

const redisClient = require('../config/redis');
const cacheConfig = require('../config/cache');

class CacheMetrics {
  constructor() {
    this.redis = null;
  }

  /**
   * Initialize metrics
   */
  async initialize() {
    this.redis = await redisClient.connect();
    return this.redis !== null;
  }

  /**
   * Record cache hit
   */
  async recordHit(namespace = 'total') {
    if (!this.redis || !cacheConfig.FEATURES.metricsEnabled) return;

    try {
      await redisClient.executeWithCircuitBreaker(
        async () => {
          await this.redis.hincrby('metric:cache:hits', namespace, 1);
          await this.redis.hincrby('metric:cache:hits', 'total', 1);
        },
        () => null
      );
    } catch (error) {
      // Silently fail metrics
    }
  }

  /**
   * Record cache miss
   */
  async recordMiss(namespace = 'total') {
    if (!this.redis || !cacheConfig.FEATURES.metricsEnabled) return;

    try {
      await redisClient.executeWithCircuitBreaker(
        async () => {
          await this.redis.hincrby('metric:cache:misses', namespace, 1);
          await this.redis.hincrby('metric:cache:misses', 'total', 1);
        },
        () => null
      );
    } catch (error) {
      // Silently fail metrics
    }
  }

  /**
   * Record operation latency
   */
  async recordLatency(namespace, latencyMs) {
    if (!this.redis || !cacheConfig.FEATURES.metricsEnabled) return;

    try {
      await redisClient.executeWithCircuitBreaker(
        async () => {
          await this.redis.lpush(`metric:latency:${namespace}`, latencyMs);
          await this.redis.ltrim(`metric:latency:${namespace}`, 0, 999); // Keep last 1000
        },
        () => null
      );
    } catch (error) {
      // Silently fail metrics
    }
  }

  /**
   * Get cache hit ratio for namespace
   */
  async getHitRatio(namespace = 'total') {
    if (!this.redis) return 0;

    try {
      const [hits, misses] = await redisClient.executeWithCircuitBreaker(
        async () => {
          const h = await this.redis.hget('metric:cache:hits', namespace);
          const m = await this.redis.hget('metric:cache:misses', namespace);
          return [parseInt(h || 0), parseInt(m || 0)];
        },
        () => [0, 0]
      );

      const total = hits + misses;
      return total > 0 ? ((hits / total) * 100).toFixed(2) : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get average latency for namespace
   */
  async getAvgLatency(namespace) {
    if (!this.redis) return 0;

    try {
      const latencies = await redisClient.executeWithCircuitBreaker(
        () => this.redis.lrange(`metric:latency:${namespace}`, 0, -1),
        () => []
      );

      if (!latencies || latencies.length === 0) return 0;

      const sum = latencies.reduce((acc, val) => acc + parseFloat(val), 0);
      return (sum / latencies.length).toFixed(2);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get all hit/miss stats
   */
  async getAllStats() {
    if (!this.redis) return {};

    try {
      const [hits, misses] = await redisClient.executeWithCircuitBreaker(
        async () => {
          const h = await this.redis.hgetall('metric:cache:hits');
          const m = await this.redis.hgetall('metric:cache:misses');
          return [h, m];
        },
        () => [{}, {}]
      );

      return {
        hits: hits || {},
        misses: misses || {},
      };
    } catch (error) {
      return { hits: {}, misses: {} };
    }
  }

  /**
   * Get memory usage statistics
   */
  async getMemoryUsage() {
    if (!this.redis) {
      return {
        usedMemory: 0,
        usedMemoryHuman: '0B',
        peakMemory: 0,
        peakMemoryHuman: '0B',
        memoryFragmentation: 0,
      };
    }

    try {
      const info = await redisClient.executeWithCircuitBreaker(
        () => this.redis.info('memory'),
        () => ''
      );

      const lines = info.split('\r\n');
      const stats = {};

      lines.forEach(line => {
        const [key, value] = line.split(':');
        if (key && value) {
          stats[key] = value;
        }
      });

      return {
        usedMemory: parseInt(stats.used_memory || 0),
        usedMemoryHuman: stats.used_memory_human || '0B',
        peakMemory: parseInt(stats.used_memory_peak || 0),
        peakMemoryHuman: stats.used_memory_peak_human || '0B',
        memoryFragmentation: parseFloat(stats.mem_fragmentation_ratio || 0),
      };
    } catch (error) {
      return {
        usedMemory: 0,
        usedMemoryHuman: '0B',
        peakMemory: 0,
        peakMemoryHuman: '0B',
        memoryFragmentation: 0,
      };
    }
  }

  /**
   * Get Redis server info
   */
  async getServerInfo() {
    if (!this.redis) {
      return {
        connectedClients: 0,
        totalKeys: 0,
        evictedKeys: 0,
        opsPerSec: 0,
      };
    }

    try {
      const [info, dbSize] = await redisClient.executeWithCircuitBreaker(
        async () => {
          const i = await this.redis.info('stats');
          const d = await this.redis.dbsize();
          return [i, d];
        },
        () => ['', 0]
      );

      const lines = info.split('\r\n');
      const stats = {};

      lines.forEach(line => {
        const [key, value] = line.split(':');
        if (key && value) {
          stats[key] = value;
        }
      });

      return {
        connectedClients: parseInt(stats.connected_clients || 0),
        totalKeys: dbSize || 0,
        evictedKeys: parseInt(stats.evicted_keys || 0),
        opsPerSec: parseInt(stats.instantaneous_ops_per_sec || 0),
      };
    } catch (error) {
      return {
        connectedClients: 0,
        totalKeys: 0,
        evictedKeys: 0,
        opsPerSec: 0,
      };
    }
  }

  /**
   * Get comprehensive metrics summary
   */
  async getSummary() {
    const [hitRatios, memory, server, allStats] = await Promise.all([
      Promise.all([
        this.getHitRatio('total'),
        this.getHitRatio(cacheConfig.PREFIXES.CONVERSATION),
        this.getHitRatio(cacheConfig.PREFIXES.ROADMAP),
        this.getHitRatio(cacheConfig.PREFIXES.FLASHCARD),
        this.getHitRatio(cacheConfig.PREFIXES.USER),
      ]),
      this.getMemoryUsage(),
      this.getServerInfo(),
      this.getAllStats(),
    ]);

    return {
      hitRatio: {
        total: hitRatios[0],
        conversation: hitRatios[1],
        roadmap: hitRatios[2],
        flashcard: hitRatios[3],
        user: hitRatios[4],
      },
      latency: {
        conversation: await this.getAvgLatency(cacheConfig.PREFIXES.CONVERSATION),
        roadmap: await this.getAvgLatency(cacheConfig.PREFIXES.ROADMAP),
        flashcard: await this.getAvgLatency(cacheConfig.PREFIXES.FLASHCARD),
      },
      memory,
      server,
      raw: allStats,
      circuitBreaker: {
        state: redisClient.circuitState,
        failureCount: redisClient.failureCount,
      },
    };
  }

  /**
   * Reset all metrics
   */
  async reset() {
    if (!this.redis) return false;

    try {
      await redisClient.executeWithCircuitBreaker(
        async () => {
          await this.redis.del('metric:cache:hits');
          await this.redis.del('metric:cache:misses');

          // Delete all latency keys
          const keys = await this.redis.keys('metric:latency:*');
          if (keys.length > 0) {
            await this.redis.del(...keys);
          }
        },
        () => null
      );

      console.log('✅ Cache metrics reset');
      return true;
    } catch (error) {
      console.error('Metrics reset error:', error.message);
      return false;
    }
  }
}

// Singleton instance
const cacheMetrics = new CacheMetrics();

module.exports = cacheMetrics;
