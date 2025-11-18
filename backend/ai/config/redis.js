/**
 * Redis Configuration for Conversation Caching
 * Provides fast, scalable session storage
 */

import { createClient } from 'redis';
import logger from '../../utils/logger.js';

class RedisClient {
  constructor() {
    this.client = null;
    this.isReady = false;
  }

  async connect() {
    if (this.client && this.isReady) {
      return this.client;
    }

    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        database: 5, // Use DB 5 for conversation cache (separate from other Redis uses)
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis: Too many reconnection attempts');
              return new Error('Redis reconnection failed');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      this.client.on('error', (err) => {
        logger.error('Redis Client Error:', err);
        this.isReady = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
        this.isReady = true;
      });

      this.client.on('reconnecting', () => {
        logger.warn('Redis client reconnecting...');
        this.isReady = false;
      });

      await this.client.connect();

      return this.client;
    } catch (error) {
      logger.error('Redis connection failed:', error);
      // Graceful degradation - app works without Redis
      this.client = this.createMockClient();
      return this.client;
    }
  }

  /**
   * Mock client for graceful degradation when Redis unavailable
   */
  createMockClient() {
    logger.warn('Using in-memory cache fallback (not scalable for production)');

    const mockCache = new Map();

    return {
      get: async (key) => mockCache.get(key) || null,
      setex: async (key, ttl, value) => {
        mockCache.set(key, value);
        setTimeout(() => mockCache.delete(key), ttl * 1000);
      },
      del: async (key) => mockCache.delete(key),
      keys: async (pattern) => Array.from(mockCache.keys()),
      isReady: false,
    };
  }

  async get(key) {
    if (!this.client) await this.connect();
    return this.client.get(key);
  }

  async setex(key, seconds, value) {
    if (!this.client) await this.connect();
    return this.client.setex(key, seconds, value);
  }

  async del(key) {
    if (!this.client) await this.connect();
    return this.client.del(key);
  }

  async keys(pattern) {
    if (!this.client) await this.connect();
    return this.client.keys(pattern);
  }

  async disconnect() {
    if (this.client && this.client.isOpen) {
      await this.client.quit();
      logger.info('Redis client disconnected');
    }
  }
}

// Singleton instance
const redisClient = new RedisClient();

// Initialize connection
redisClient.connect().catch(err => {
  logger.error('Redis initialization error:', err);
});

export default redisClient;
