/**
 * Memory Maintenance Background Jobs
 * Periodic tasks for memory consolidation, decay, and cleanup
 */

import industryMemoryManager from './industryMemoryManager.js';
import UserProfile from '../../models/UserProfile.js';
import Conversation from '../../models/Conversation.js';
import logger from '../../utils/logger.js';

class MemoryJobs {
  constructor() {
    this.jobs = {
      consolidation: null,
      decay: null,
      cleanup: null,
      healthCheck: null
    };

    this.config = {
      consolidation: {
        enabled: true,
        intervalHours: 24, // Run daily
        batchSize: 10 // Process N conversations at a time
      },
      decay: {
        enabled: true,
        intervalHours: 24, // Run daily
        batchSize: 50 // Process N users at a time
      },
      cleanup: {
        enabled: true,
        intervalHours: 168, // Run weekly
        archiveAfterDays: 90
      },
      healthCheck: {
        enabled: true,
        intervalHours: 1 // Run hourly
      }
    };
  }

  /**
   * Start all background jobs
   */
  startAll() {
    logger.info('Starting memory maintenance jobs');

    if (this.config.consolidation.enabled) {
      this.startConsolidationJob();
    }

    if (this.config.decay.enabled) {
      this.startDecayJob();
    }

    if (this.config.cleanup.enabled) {
      this.startCleanupJob();
    }

    if (this.config.healthCheck.enabled) {
      this.startHealthCheckJob();
    }

    logger.info('All memory maintenance jobs started');
  }

  /**
   * Stop all background jobs
   */
  stopAll() {
    logger.info('Stopping memory maintenance jobs');

    Object.keys(this.jobs).forEach(jobName => {
      if (this.jobs[jobName]) {
        clearInterval(this.jobs[jobName]);
        this.jobs[jobName] = null;
      }
    });

    logger.info('All memory maintenance jobs stopped');
  }

  /**
   * JOB 1: Memory Consolidation
   * Consolidate recent conversations into long-term memories
   */
  startConsolidationJob() {
    const intervalMs = this.config.consolidation.intervalHours * 60 * 60 * 1000;

    logger.info(`Starting consolidation job (interval: ${this.config.consolidation.intervalHours}h)`);

    // Run immediately on start
    this.runConsolidation();

    // Then run periodically
    this.jobs.consolidation = setInterval(() => {
      this.runConsolidation();
    }, intervalMs);
  }

  async runConsolidation() {
    logger.info('Running memory consolidation job');

    try {
      // Find conversations that need consolidation (older than 24h, not yet consolidated)
      const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const conversations = await Conversation.find({
        lastMessageAt: { $lt: cutoffDate },
        isActive: true,
        'metadata.consolidated': { $ne: true }
      })
      .limit(this.config.consolidation.batchSize)
      .select('_id user')
      .lean();

      logger.info(`Found ${conversations.length} conversations to consolidate`);

      const results = {
        success: 0,
        failed: 0,
        totalMemories: 0
      };

      for (const conv of conversations) {
        try {
          const result = await industryMemoryManager.consolidateMemories(conv.user, conv._id);

          // Mark conversation as consolidated
          await Conversation.findByIdAndUpdate(conv._id, {
            $set: { 'metadata.consolidated': true, 'metadata.consolidatedAt': Date.now() }
          });

          results.success++;
          results.totalMemories += result.consolidated;

          logger.info(`Consolidated conversation ${conv._id}: ${result.consolidated} memories`);

        } catch (error) {
          logger.error(`Failed to consolidate conversation ${conv._id}:`, error);
          results.failed++;
        }
      }

      logger.info('Consolidation job completed', results);

      return results;

    } catch (error) {
      logger.error('Consolidation job error:', error);
      throw error;
    }
  }

  /**
   * JOB 2: Memory Decay
   * Apply decay to all user memories
   */
  startDecayJob() {
    const intervalMs = this.config.decay.intervalHours * 60 * 60 * 1000;

    logger.info(`Starting decay job (interval: ${this.config.decay.intervalHours}h)`);

    // Run immediately on start
    this.runDecay();

    // Then run periodically
    this.jobs.decay = setInterval(() => {
      this.runDecay();
    }, intervalMs);
  }

  async runDecay() {
    logger.info('Running memory decay job');

    try {
      // Get all users with memories
      const users = await UserProfile.find({})
        .select('userId')
        .limit(this.config.decay.batchSize)
        .lean();

      logger.info(`Applying decay to ${users.length} users`);

      const results = {
        success: 0,
        failed: 0,
        totalForgotten: 0,
        totalDecayed: 0
      };

      for (const user of users) {
        try {
          const result = await industryMemoryManager.applyMemoryDecay(user.userId);

          results.success++;
          results.totalForgotten += result.forgotten;
          results.totalDecayed += result.decayed;

          logger.info(`Applied decay for user ${user.userId}: ${result.forgotten} forgotten, ${result.decayed} decayed`);

        } catch (error) {
          logger.error(`Failed to apply decay for user ${user.userId}:`, error);
          results.failed++;
        }
      }

      logger.info('Decay job completed', results);

      return results;

    } catch (error) {
      logger.error('Decay job error:', error);
      throw error;
    }
  }

  /**
   * JOB 3: Cleanup
   * Archive old memories and clean up stale data
   */
  startCleanupJob() {
    const intervalMs = this.config.cleanup.intervalHours * 60 * 60 * 1000;

    logger.info(`Starting cleanup job (interval: ${this.config.cleanup.intervalHours}h)`);

    // Run immediately on start
    this.runCleanup();

    // Then run periodically
    this.jobs.cleanup = setInterval(() => {
      this.runCleanup();
    }, intervalMs);
  }

  async runCleanup() {
    logger.info('Running memory cleanup job');

    try {
      const cutoffDate = new Date(Date.now() - this.config.cleanup.archiveAfterDays * 24 * 60 * 60 * 1000);

      // Archive old memories
      const { MemoryEntry } = await import('../../models/MemoryEntry.js').then(m => ({ MemoryEntry: m.default }));

      const archivedCount = await MemoryEntry.updateMany(
        {
          status: 'active',
          'temporal.lastAccessedAt': { $lt: cutoffDate },
          'importance.factors.userMarked': false
        },
        {
          $set: { status: 'archived' }
        }
      );

      logger.info(`Archived ${archivedCount.modifiedCount} old memories`);

      // Clean up expired memories
      const deletedCount = await MemoryEntry.deleteMany({
        status: 'archived',
        'temporal.expiresAt': { $lt: Date.now() }
      });

      logger.info(`Deleted ${deletedCount.deletedCount} expired memories`);

      return {
        archived: archivedCount.modifiedCount,
        deleted: deletedCount.deletedCount
      };

    } catch (error) {
      logger.error('Cleanup job error:', error);
      throw error;
    }
  }

  /**
   * JOB 4: Health Check
   * Monitor memory system health and performance
   */
  startHealthCheckJob() {
    const intervalMs = this.config.healthCheck.intervalHours * 60 * 60 * 1000;

    logger.info(`Starting health check job (interval: ${this.config.healthCheck.intervalHours}h)`);

    // Run periodically
    this.jobs.healthCheck = setInterval(() => {
      this.runHealthCheck();
    }, intervalMs);
  }

  async runHealthCheck() {
    logger.info('Running memory health check');

    try {
      const stats = industryMemoryManager.getStats();

      // Log statistics
      logger.info('Memory system health:', {
        retrievals: stats.retrievals,
        consolidations: stats.consolidations,
        forgettingEvents: stats.forgettingEvents,
        cacheHitRate: (stats.cacheHits / (stats.cacheHits + stats.cacheMisses) * 100).toFixed(1) + '%'
      });

      // Check for issues
      const issues = [];

      // Low cache hit rate
      if (stats.cacheHits + stats.cacheMisses > 100) {
        const hitRate = stats.cacheHits / (stats.cacheHits + stats.cacheMisses);
        if (hitRate < 0.5) {
          issues.push({
            type: 'low_cache_hit_rate',
            severity: 'warning',
            value: hitRate,
            message: 'Cache hit rate below 50%'
          });
        }
      }

      // High forgetting rate
      if (stats.consolidations > 0) {
        const forgettingRate = stats.forgettingEvents / stats.consolidations;
        if (forgettingRate > 0.5) {
          issues.push({
            type: 'high_forgetting_rate',
            severity: 'info',
            value: forgettingRate,
            message: 'More than 50% of consolidated memories are being forgotten'
          });
        }
      }

      if (issues.length > 0) {
        logger.warn('Memory system issues detected:', issues);
      } else {
        logger.info('Memory system health: OK');
      }

      return {
        status: issues.length === 0 ? 'healthy' : 'issues_detected',
        stats,
        issues
      };

    } catch (error) {
      logger.error('Health check error:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Manual trigger for specific job
   */
  async triggerJob(jobName) {
    logger.info(`Manually triggering job: ${jobName}`);

    switch (jobName) {
      case 'consolidation':
        return await this.runConsolidation();
      case 'decay':
        return await this.runDecay();
      case 'cleanup':
        return await this.runCleanup();
      case 'healthCheck':
        return await this.runHealthCheck();
      default:
        throw new Error(`Unknown job: ${jobName}`);
    }
  }

  /**
   * Get job status
   */
  getStatus() {
    return {
      jobs: Object.keys(this.jobs).map(name => ({
        name,
        running: this.jobs[name] !== null,
        config: this.config[name]
      })),
      stats: industryMemoryManager.getStats()
    };
  }
}

// Singleton instance
const memoryJobs = new MemoryJobs();

export default memoryJobs;
