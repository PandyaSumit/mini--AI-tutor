/**
 * BullMQ Job Queues Configuration
 * Handles asynchronous processing for STT and AI response generation
 * Uses Redis DB 2 for job queue data
 */

import { Queue } from 'bullmq';
import { createQueueConnection } from '../config/redisCluster.js';
import logger from '../config/logger.js';

// Redis connection for BullMQ
const connection = createQueueConnection();

/**
 * Default job options for all queues
 */
const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000
  },
  removeOnComplete: {
    age: 3600, // 1 hour
    count: 1000 // keep last 1000 jobs
  },
  removeOnFail: {
    age: 86400 // 24 hours
  }
};

/**
 * STT (Speech-to-Text) Queue
 * Processes audio transcription jobs with fallback chain
 */
export const sttQueue = new Queue('stt', {
  connection,
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 3 // 3 attempts for STT (Hugging Face -> OpenAI -> Browser STT)
  }
});

/**
 * AI Response Generation Queue
 * Processes AI response generation with Groq LLM
 */
export const aiQueue = new Queue('ai-response', {
  connection,
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 2 // 2 attempts for AI to save costs
  }
});

// Queue event handlers
sttQueue.on('error', (error) => {
  logger.error('STT Queue error', {
    error: error.message,
    stack: error.stack
  });
});

sttQueue.on('waiting', (job) => {
  logger.debug('STT job waiting', { jobId: job.id });
});

aiQueue.on('error', (error) => {
  logger.error('AI Queue error', {
    error: error.message,
    stack: error.stack
  });
});

aiQueue.on('waiting', (job) => {
  logger.debug('AI job waiting', { jobId: job.id });
});

/**
 * Add STT transcription job
 * @param {Object} data - Job data
 * @param {string} data.sessionId - Voice session ID
 * @param {string} data.userId - User ID
 * @param {string} data.socketId - Socket ID for emitting results
 * @returns {Promise<Job>}
 */
export async function addSTTJob(data) {
  try {
    const job = await sttQueue.add('transcribe', data, {
      priority: 1,
      jobId: `stt-${data.sessionId}-${Date.now()}`
    });

    logger.logJobQueued('STT', job.id, {
      sessionId: data.sessionId,
      userId: data.userId
    });

    return job;
  } catch (error) {
    logger.error('Failed to queue STT job', {
      error: error.message,
      stack: error.stack,
      data
    });
    throw error;
  }
}

/**
 * Add AI response generation job
 * @param {Object} data - Job data
 * @param {string} data.conversationId - Conversation ID
 * @param {string} data.userId - User ID
 * @param {string} data.message - User message
 * @param {string} data.socketId - Socket ID for emitting results
 * @returns {Promise<Job>}
 */
export async function addAIJob(data) {
  try {
    const job = await aiQueue.add('generate-response', data, {
      priority: 2,
      jobId: `ai-${data.conversationId}-${Date.now()}`
    });

    logger.logJobQueued('AI', job.id, {
      conversationId: data.conversationId,
      userId: data.userId
    });

    return job;
  } catch (error) {
    logger.error('Failed to queue AI job', {
      error: error.message,
      stack: error.stack,
      data
    });
    throw error;
  }
}

/**
 * Get queue statistics
 * @param {Queue} queue - BullMQ queue
 * @returns {Promise<Object>}
 */
export async function getQueueStats(queue) {
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount()
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed
    };
  } catch (error) {
    logger.error('Failed to get queue stats', {
      error: error.message,
      queue: queue.name
    });
    return null;
  }
}

/**
 * Clean old jobs from queues
 * @param {number} gracePeriod - Grace period in milliseconds (default 24 hours)
 */
export async function cleanOldJobs(gracePeriod = 86400000) {
  try {
    const [sttCleaned, aiCleaned] = await Promise.all([
      sttQueue.clean(gracePeriod, 100, 'completed'),
      aiQueue.clean(gracePeriod, 100, 'completed')
    ]);

    logger.info('Old jobs cleaned', {
      sttCleaned: sttCleaned.length,
      aiCleaned: aiCleaned.length
    });
  } catch (error) {
    logger.error('Failed to clean old jobs', {
      error: error.message,
      stack: error.stack
    });
  }
}

/**
 * Pause all queues
 */
export async function pauseAllQueues() {
  try {
    await Promise.all([
      sttQueue.pause(),
      aiQueue.pause()
    ]);

    logger.info('All queues paused');
  } catch (error) {
    logger.error('Failed to pause queues', {
      error: error.message
    });
  }
}

/**
 * Resume all queues
 */
export async function resumeAllQueues() {
  try {
    await Promise.all([
      sttQueue.resume(),
      aiQueue.resume()
    ]);

    logger.info('All queues resumed');
  } catch (error) {
    logger.error('Failed to resume queues', {
      error: error.message
    });
  }
}

/**
 * Graceful shutdown for all queues
 */
export async function shutdownQueues() {
  logger.info('Shutting down job queues gracefully');

  try {
    await Promise.all([
      sttQueue.close(),
      aiQueue.close()
    ]);

    logger.info('All queues shut down successfully');
  } catch (error) {
    logger.error('Error shutting down queues', {
      error: error.message,
      stack: error.stack
    });
  }
}

export default {
  sttQueue,
  aiQueue,
  addSTTJob,
  addAIJob,
  getQueueStats,
  cleanOldJobs,
  pauseAllQueues,
  resumeAllQueues,
  shutdownQueues
};
