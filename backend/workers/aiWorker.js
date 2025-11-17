/**
 * AI Response Generation Worker
 * Processes AI response generation jobs from BullMQ queue
 * Concurrency: 10 jobs, Rate limit: 20 jobs/second
 */

import { Worker } from 'bullmq';
import { createQueueConnection } from '../config/redisCluster.js';
import logger from '../config/logger.js';

const connection = createQueueConnection();

/**
 * Process AI response generation job
 * @param {Job} job - BullMQ job
 * @param {Object} io - Socket.IO server instance
 * @param {Object} voiceOrchestrator - Voice orchestrator service
 * @param {Object} models - Database models
 */
async function processAIJob(job, io, voiceOrchestrator, models) {
  const { conversationId, userId, message, socketId } = job.data;
  const startTime = Date.now();

  try {
    logger.info('Processing AI job', {
      jobId: job.id,
      conversationId,
      userId
    });

    // Update progress: Starting
    await job.updateProgress(20);
    io.to(`user:${userId}`).emit('voice:processing', {
      status: 'Preparing context...',
      progress: 20
    });

    // Fetch conversation context (last 10 messages)
    const { Message } = models;
    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('role content')
      .lean();

    // Reverse to get chronological order
    const context = messages.reverse().map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    logger.debug('Conversation context fetched', {
      jobId: job.id,
      conversationId,
      messageCount: context.length
    });

    // Update progress: Generating
    await job.updateProgress(40);
    io.to(`user:${userId}`).emit('voice:processing', {
      status: 'Generating AI response...',
      progress: 40
    });

    // Generate AI response
    const response = await voiceOrchestrator.generateAIResponse(
      conversationId,
      userId,
      message,
      context
    );

    if (!response || !response.text) {
      throw new Error('AI response generation failed');
    }

    logger.info('AI response generated', {
      jobId: job.id,
      conversationId,
      tokens: response.usage?.total_tokens || 0,
      length: response.text.length
    });

    // Update progress: Complete
    await job.updateProgress(100);

    // Emit response to client
    io.to(`user:${userId}`).emit('voice:response', {
      text: response.text,
      shouldSpeak: true, // Enable TTS by default
      conversationId,
      metadata: {
        tokens: response.usage?.total_tokens || 0,
        model: response.model || 'groq-llama'
      }
    });

    const duration = Date.now() - startTime;
    logger.logJobCompleted('AI', job.id, duration);

    return {
      success: true,
      response: response.text,
      conversationId,
      duration,
      tokens: response.usage?.total_tokens || 0
    };
  } catch (error) {
    logger.logJobFailed('AI', job.id, error);

    // Emit error to client
    io.to(`user:${userId}`).emit('voice:error', {
      error: 'Failed to generate AI response. Please try again.'
    });

    throw error;
  }
}

/**
 * Create and start AI worker
 * @param {Object} io - Socket.IO server instance
 * @param {Object} voiceOrchestrator - Voice orchestrator service
 * @param {Object} models - Database models
 * @returns {Worker}
 */
export function createAIWorker(io, voiceOrchestrator, models) {
  const worker = new Worker(
    'ai-response',
    async (job) => {
      return await processAIJob(job, io, voiceOrchestrator, models);
    },
    {
      connection,
      concurrency: 10, // Process 10 jobs concurrently
      limiter: {
        max: 20, // Maximum 20 jobs
        duration: 1000 // per second
      }
    }
  );

  // Worker event handlers
  worker.on('completed', (job, result) => {
    logger.info('AI job completed', {
      jobId: job.id,
      conversationId: result.conversationId,
      success: result.success,
      duration: result.duration,
      tokens: result.tokens
    });
  });

  worker.on('failed', (job, error) => {
    logger.error('AI job failed', {
      jobId: job.id,
      error: error.message,
      stack: error.stack,
      attemptsMade: job.attemptsMade,
      attemptsLeft: job.opts.attempts - job.attemptsMade
    });
  });

  worker.on('progress', (job, progress) => {
    logger.debug('AI job progress', {
      jobId: job.id,
      progress
    });
  });

  worker.on('error', (error) => {
    logger.error('AI worker error', {
      error: error.message,
      stack: error.stack
    });
  });

  logger.info('AI worker started', {
    concurrency: 10,
    rateLimit: '20 jobs/second'
  });

  return worker;
}

export default createAIWorker;
