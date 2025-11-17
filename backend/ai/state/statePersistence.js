/**
 * State Persistence Layer for LangGraph
 * Provides Redis-backed checkpointing for long-running workflows
 */

import Redis from 'ioredis';
import logger from '../../utils/logger.js';

class StatePersistence {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: 3, // Dedicated DB for state persistence
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.redis.on('error', (err) => {
      logger.error('State persistence Redis error:', err);
    });

    this.redis.on('connect', () => {
      logger.info('✅ State persistence Redis connected (DB:3)');
    });

    // Default TTL for state: 7 days
    this.defaultTTL = parseInt(process.env.STATE_TTL_SECONDS || '604800');
  }

  /**
   * Save workflow state checkpoint
   */
  async saveCheckpoint(workflowId, checkpoint, metadata = {}) {
    try {
      const key = `checkpoint:${workflowId}`;
      const data = {
        checkpoint,
        metadata: {
          ...metadata,
          timestamp: Date.now(),
          version: '1.0',
        },
      };

      await this.redis.setex(key, this.defaultTTL, JSON.stringify(data));

      logger.debug(`Checkpoint saved: ${workflowId}`, {
        size: JSON.stringify(checkpoint).length,
        metadata,
      });

      return true;
    } catch (error) {
      logger.error(`Failed to save checkpoint ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Load workflow state checkpoint
   */
  async loadCheckpoint(workflowId) {
    try {
      const key = `checkpoint:${workflowId}`;
      const data = await this.redis.get(key);

      if (!data) {
        return null;
      }

      const parsed = JSON.parse(data);

      logger.debug(`Checkpoint loaded: ${workflowId}`, {
        age: Date.now() - parsed.metadata.timestamp,
      });

      return parsed.checkpoint;
    } catch (error) {
      logger.error(`Failed to load checkpoint ${workflowId}:`, error);
      return null;
    }
  }

  /**
   * List all checkpoints for a workflow type
   */
  async listCheckpoints(workflowType, userId) {
    try {
      const pattern = `checkpoint:${workflowType}:${userId}:*`;
      const keys = await this.redis.keys(pattern);

      const checkpoints = await Promise.all(
        keys.map(async (key) => {
          const data = await this.redis.get(key);
          if (!data) return null;

          const parsed = JSON.parse(data);
          return {
            workflowId: key.replace('checkpoint:', ''),
            metadata: parsed.metadata,
          };
        })
      );

      return checkpoints.filter((c) => c !== null);
    } catch (error) {
      logger.error('Failed to list checkpoints:', error);
      return [];
    }
  }

  /**
   * Delete checkpoint
   */
  async deleteCheckpoint(workflowId) {
    try {
      const key = `checkpoint:${workflowId}`;
      await this.redis.del(key);

      logger.debug(`Checkpoint deleted: ${workflowId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete checkpoint ${workflowId}:`, error);
      return false;
    }
  }

  /**
   * Save partial state update (for streaming updates)
   */
  async updateState(workflowId, partialState) {
    try {
      const current = await this.loadCheckpoint(workflowId);
      if (!current) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      const updated = {
        ...current,
        ...partialState,
        updatedAt: Date.now(),
      };

      await this.saveCheckpoint(workflowId, updated);
      return updated;
    } catch (error) {
      logger.error(`Failed to update state ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Extend checkpoint TTL (for active sessions)
   */
  async extendTTL(workflowId, additionalSeconds = 3600) {
    try {
      const key = `checkpoint:${workflowId}`;
      const ttl = await this.redis.ttl(key);

      if (ttl > 0) {
        await this.redis.expire(key, ttl + additionalSeconds);
        return true;
      }

      return false;
    } catch (error) {
      logger.error(`Failed to extend TTL ${workflowId}:`, error);
      return false;
    }
  }

  /**
   * Archive old checkpoints to MongoDB for long-term storage
   */
  async archiveCheckpoint(workflowId, WorkflowArchive) {
    try {
      const checkpoint = await this.loadCheckpoint(workflowId);
      if (!checkpoint) {
        return false;
      }

      // Save to MongoDB
      await WorkflowArchive.create({
        workflowId,
        checkpoint,
        archivedAt: new Date(),
      });

      // Delete from Redis
      await this.deleteCheckpoint(workflowId);

      logger.info(`Checkpoint archived: ${workflowId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to archive checkpoint ${workflowId}:`, error);
      return false;
    }
  }

  /**
   * Get statistics
   */
  async getStats() {
    try {
      const keys = await this.redis.keys('checkpoint:*');
      const totalCheckpoints = keys.length;

      // Get memory usage
      const info = await this.redis.info('memory');
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memory = memoryMatch ? memoryMatch[1].trim() : 'unknown';

      return {
        totalCheckpoints,
        memory,
        redis: {
          host: this.redis.options.host,
          port: this.redis.options.port,
          db: this.redis.options.db,
        },
      };
    } catch (error) {
      logger.error('Failed to get stats:', error);
      return { error: error.message };
    }
  }

  /**
   * Cleanup
   */
  async cleanup() {
    try {
      await this.redis.quit();
      logger.info('State persistence Redis disconnected');
    } catch (error) {
      logger.error('Error cleaning up state persistence:', error);
    }
  }
}

// Singleton instance
const statePersistence = new StatePersistence();

export default statePersistence;
