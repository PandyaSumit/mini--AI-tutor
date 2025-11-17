/**
 * STT (Speech-to-Text) Worker
 * Processes audio transcription jobs from BullMQ queue
 * Concurrency: 5 jobs, Rate limit: 10 jobs/second
 */

import { Worker } from 'bullmq';
import { createQueueConnection } from '../config/redisCluster.js';
import logger from '../config/logger.js';
import audioStorage from '../services/audioStorage.js';

const connection = createQueueConnection();

/**
 * Process STT transcription job
 * @param {Job} job - BullMQ job
 * @param {Object} io - Socket.IO server instance
 * @param {Object} voiceOrchestrator - Voice orchestrator service
 */
async function processSTTJob(job, io, voiceOrchestrator) {
  const { sessionId, userId, socketId } = job.data;
  const startTime = Date.now();

  try {
    logger.info('Processing STT job', {
      jobId: job.id,
      sessionId,
      userId
    });

    // Update progress: Starting
    await job.updateProgress(20);
    io.to(`user:${userId}`).emit('voice:processing', {
      status: 'Downloading audio...',
      progress: 20
    });

    // Download and merge audio from MinIO
    const audioBuffer = await audioStorage.downloadAndMergeAudio(sessionId);

    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error('No audio data found for session');
    }

    logger.info('Audio downloaded from MinIO', {
      jobId: job.id,
      sessionId,
      size: audioBuffer.length
    });

    // Update progress: Processing
    await job.updateProgress(40);
    io.to(`user:${userId}`).emit('voice:processing', {
      status: 'Transcribing audio...',
      progress: 40
    });

    // Process audio with STT (with fallback chain)
    const transcript = await voiceOrchestrator.processAudioWithSTT(audioBuffer);

    if (!transcript) {
      // STT failed, suggest browser STT fallback
      logger.warn('Server-side STT failed, switching to browser STT', {
        jobId: job.id,
        sessionId
      });

      io.to(`user:${userId}`).emit('voice:use-browser-stt', {
        message: 'Using browser speech recognition (100% FREE, instant!)'
      });

      // Clean up audio chunks
      await audioStorage.cleanupSessionAudio(sessionId);

      return {
        success: false,
        fallbackToBrowser: true,
        sessionId
      };
    }

    // Update progress: Cleaning up
    await job.updateProgress(80);

    // Cleanup audio files from MinIO
    const deletedCount = await audioStorage.cleanupSessionAudio(sessionId);

    logger.info('Audio chunks cleaned up', {
      jobId: job.id,
      sessionId,
      deletedCount
    });

    // Update progress: Complete
    await job.updateProgress(100);

    // Emit transcribed result
    io.to(`user:${userId}`).emit('voice:transcribed', {
      text: transcript,
      sessionId
    });

    const duration = Date.now() - startTime;
    logger.logJobCompleted('STT', job.id, duration);

    return {
      success: true,
      transcript,
      sessionId,
      duration
    };
  } catch (error) {
    logger.logJobFailed('STT', job.id, error);

    // Emit error to client
    io.to(`user:${userId}`).emit('voice:error', {
      error: 'Failed to transcribe audio. Please try again.'
    });

    throw error;
  }
}

/**
 * Create and start STT worker
 * @param {Object} io - Socket.IO server instance
 * @param {Object} voiceOrchestrator - Voice orchestrator service
 * @returns {Worker}
 */
export function createSTTWorker(io, voiceOrchestrator) {
  const worker = new Worker(
    'stt',
    async (job) => {
      return await processSTTJob(job, io, voiceOrchestrator);
    },
    {
      connection,
      concurrency: 5, // Process 5 jobs concurrently
      limiter: {
        max: 10, // Maximum 10 jobs
        duration: 1000 // per second
      }
    }
  );

  // Worker event handlers
  worker.on('completed', (job, result) => {
    logger.info('STT job completed', {
      jobId: job.id,
      sessionId: result.sessionId,
      success: result.success,
      duration: result.duration
    });
  });

  worker.on('failed', (job, error) => {
    logger.error('STT job failed', {
      jobId: job.id,
      error: error.message,
      stack: error.stack,
      attemptsMade: job.attemptsMade,
      attemptsLeft: job.opts.attempts - job.attemptsMade
    });
  });

  worker.on('progress', (job, progress) => {
    logger.debug('STT job progress', {
      jobId: job.id,
      progress
    });
  });

  worker.on('error', (error) => {
    logger.error('STT worker error', {
      error: error.message,
      stack: error.stack
    });
  });

  logger.info('STT worker started', {
    concurrency: 5,
    rateLimit: '10 jobs/second'
  });

  return worker;
}

export default createSTTWorker;
