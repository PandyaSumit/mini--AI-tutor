/**
 * Redis Clustering Configuration for Production
 * Provides separate Redis clients for Socket.IO adapter, BullMQ queues, and caching
 * Supports horizontal scaling with proper retry logic and event handling
 */

import Redis from 'ioredis';
import logger from './logger.js';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT) || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';

/**
 * Common Redis connection options
 */
const baseOptions = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  connectTimeout: 10000,
  commandTimeout: 5000,
  keepAlive: 30000,
  family: 4, // IPv4
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    logger.debug(`Redis retry attempt ${times}, waiting ${delay}ms`);
    return delay;
  }
};

/**
 * Create Redis client for general caching and Socket.IO adapter
 * Uses DB 0
 */
export function createCacheClient() {
  const client = new Redis({
    ...baseOptions,
    db: 0,
    lazyConnect: false
  });

  // Event handlers
  client.on('connect', () => {
    logger.info('Redis cache client connecting', { host: REDIS_HOST, port: REDIS_PORT });
  });

  client.on('ready', () => {
    logger.info('Redis cache client ready', { host: REDIS_HOST, port: REDIS_PORT });
  });

  client.on('error', (error) => {
    logger.error('Redis cache client error', {
      error: error.message,
      stack: error.stack
    });
  });

  client.on('close', () => {
    logger.warn('Redis cache client connection closed');
  });

  client.on('reconnecting', () => {
    logger.info('Redis cache client reconnecting');
  });

  return client;
}

/**
 * Create Redis pub/sub clients for Socket.IO adapter
 * Uses DB 1 for Socket.IO message passing
 */
export function createSocketIOClients() {
  const pubClient = new Redis({
    ...baseOptions,
    db: 1,
    lazyConnect: false
  });

  const subClient = pubClient.duplicate();

  // Publisher event handlers
  pubClient.on('connect', () => {
    logger.info('Redis pub client (Socket.IO) connecting');
  });

  pubClient.on('ready', () => {
    logger.info('Redis pub client (Socket.IO) ready');
  });

  pubClient.on('error', (error) => {
    logger.error('Redis pub client error', {
      error: error.message,
      stack: error.stack
    });
  });

  // Subscriber event handlers
  subClient.on('connect', () => {
    logger.info('Redis sub client (Socket.IO) connecting');
  });

  subClient.on('ready', () => {
    logger.info('Redis sub client (Socket.IO) ready');
  });

  subClient.on('error', (error) => {
    logger.error('Redis sub client error', {
      error: error.message,
      stack: error.stack
    });
  });

  return { pubClient, subClient };
}

/**
 * Create Redis connection for BullMQ job queues
 * Uses DB 2 for job queue data
 * Note: BullMQ requires maxRetriesPerRequest: null
 */
export function createQueueConnection() {
  return {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD || undefined,
    db: 2,
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      logger.debug(`Redis queue retry attempt ${times}, waiting ${delay}ms`);
      return delay;
    }
  };
}

/**
 * Track active Socket.IO connections in Redis
 */
export class ConnectionTracker {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  /**
   * Add user connection
   */
  async addConnection(userId, socketId) {
    try {
      await this.redis.sadd(`connections:${userId}`, socketId);
      await this.redis.incr('stats:total_connections');
      logger.debug('Connection tracked', { userId, socketId });
    } catch (error) {
      logger.error('Failed to track connection', {
        userId,
        socketId,
        error: error.message
      });
    }
  }

  /**
   * Remove user connection
   */
  async removeConnection(userId, socketId) {
    try {
      await this.redis.srem(`connections:${userId}`, socketId);
      await this.redis.decr('stats:total_connections');
      logger.debug('Connection removed', { userId, socketId });
    } catch (error) {
      logger.error('Failed to remove connection', {
        userId,
        socketId,
        error: error.message
      });
    }
  }

  /**
   * Get all connections for a user
   */
  async getUserConnections(userId) {
    try {
      return await this.redis.smembers(`connections:${userId}`);
    } catch (error) {
      logger.error('Failed to get user connections', {
        userId,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Get total connection count
   */
  async getTotalConnections() {
    try {
      const count = await this.redis.get('stats:total_connections');
      return parseInt(count) || 0;
    } catch (error) {
      logger.error('Failed to get total connections', {
        error: error.message
      });
      return 0;
    }
  }

  /**
   * Check if user is connected
   */
  async isUserConnected(userId) {
    try {
      const connections = await this.getUserConnections(userId);
      return connections.length > 0;
    } catch (error) {
      logger.error('Failed to check user connection', {
        userId,
        error: error.message
      });
      return false;
    }
  }
}

/**
 * Graceful shutdown for all Redis clients
 */
export async function shutdownRedis(clients) {
  logger.info('Shutting down Redis clients gracefully');

  const shutdownPromises = clients.map(async (client) => {
    if (client && typeof client.quit === 'function') {
      try {
        await client.quit();
        logger.info('Redis client closed successfully');
      } catch (error) {
        logger.error('Error closing Redis client', {
          error: error.message
        });
        // Force disconnect if quit fails
        client.disconnect();
      }
    }
  });

  await Promise.all(shutdownPromises);
  logger.info('All Redis clients shut down');
}

export default {
  createCacheClient,
  createSocketIOClients,
  createQueueConnection,
  ConnectionTracker,
  shutdownRedis
};
