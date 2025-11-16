/**
 * Production Server with Complete Service Initialization
 * Horizontally scalable backend with Redis clustering
 */

import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import compression from 'compression';
import logger from './config/logger.js';
import { connectDatabase, isDatabaseReady, closeDatabase } from './config/databaseProd.js';
import { setupSocketIO, closeSocketIO } from './config/socketIOProd.js';
import { createCacheClient } from './config/redisCluster.js';
import { securityMiddleware, requestSizeLimiter } from './middleware/securityProd.js';
import { apiLimiter } from './middleware/rateLimiterProd.js';
import { registerVoiceHandlers } from './socketHandlers/voiceHandlersProd.js';
import { createSTTWorker } from './workers/sttWorker.js';
import { createAIWorker } from './workers/aiWorker.js';
import audioStorage from './services/audioStorage.js';
import voiceOrchestrator from './services/voiceOrchestratorProd.js';
import VoiceSession from './models/VoiceSession.js';
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';

// Environment variables
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const INSTANCE_ID = process.env.INSTANCE_ID || 'local';

// Global state
let httpServer = null;
let io = null;
let redisClient = null;
let sttWorker = null;
let aiWorker = null;
let isShuttingDown = false;

/**
 * Validate required environment variables
 */
function validateEnvironment() {
  const required = [
    'MONGODB_URI',
    'REDIS_HOST',
    'JWT_SECRET',
    'GROQ_API_KEY',
    'MINIO_ENDPOINT',
    'MINIO_ACCESS_KEY',
    'MINIO_SECRET_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    logger.error('Missing required environment variables', {
      missing
    });
    process.exit(1);
  }

  // Validate JWT_SECRET length
  if (process.env.JWT_SECRET.length < 32) {
    logger.error('JWT_SECRET must be at least 32 characters long');
    process.exit(1);
  }

  logger.info('Environment variables validated');
}

/**
 * Initialize Express app
 */
function createExpressApp() {
  const app = express();

  // Security middleware
  app.use(securityMiddleware);

  // Compression
  app.use(compression());

  // Request parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Rate limiting for API routes
  app.use('/api', apiLimiter);

  // Request size limiter
  app.use(requestSizeLimiter(10 * 1024 * 1024)); // 10MB max

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      instance: INSTANCE_ID,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  // Ready check endpoint
  app.get('/ready', async (req, res) => {
    const dbReady = isDatabaseReady();
    const redisReady = redisClient && redisClient.status === 'ready';
    const minioReady = await audioStorage.healthCheck();

    const ready = dbReady && redisReady && minioReady;

    res.status(ready ? 200 : 503).json({
      ready,
      services: {
        database: dbReady ? 'ready' : 'not ready',
        redis: redisReady ? 'ready' : 'not ready',
        minio: minioReady ? 'ready' : 'not ready'
      },
      instance: INSTANCE_ID,
      timestamp: new Date().toISOString()
    });
  });

  // Stats endpoint (for monitoring)
  app.get('/stats', async (req, res) => {
    try {
      const [
        dbStats,
        minioStats,
        circuitBreakerStats
      ] = await Promise.all([
        { connected: isDatabaseReady() },
        audioStorage.getStats(),
        voiceOrchestrator.getStats()
      ]);

      res.json({
        instance: INSTANCE_ID,
        database: dbStats,
        minio: minioStats,
        circuitBreaker: circuitBreakerStats,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get stats'
      });
    }
  });

  // Global error handler
  app.use((err, req, res, next) => {
    logger.error('Unhandled error', {
      error: err.message,
      stack: NODE_ENV === 'production' ? undefined : err.stack,
      path: req.path,
      method: req.method
    });

    res.status(500).json({
      error: NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not found'
    });
  });

  logger.info('Express app created');
  return app;
}

/**
 * Initialize all services
 */
async function initialize() {
  try {
    logger.info('Starting Voice AI Tutor backend', {
      instance: INSTANCE_ID,
      nodeEnv: NODE_ENV,
      nodeVersion: process.version
    });

    // Validate environment
    validateEnvironment();

    // 1. Connect to MongoDB
    logger.info('Step 1/7: Connecting to MongoDB...');
    await connectDatabase();

    // 2. Connect to Redis
    logger.info('Step 2/7: Connecting to Redis...');
    redisClient = createCacheClient();
    await new Promise((resolve, reject) => {
      redisClient.once('ready', resolve);
      redisClient.once('error', reject);
      setTimeout(() => reject(new Error('Redis connection timeout')), 10000);
    });

    // 3. Initialize MinIO
    logger.info('Step 3/7: Initializing MinIO...');
    await audioStorage.initialize();

    // 4. Create Express app and HTTP server
    logger.info('Step 4/7: Creating Express app...');
    const app = createExpressApp();
    httpServer = createServer(app);

    // 5. Setup Socket.IO with Redis adapter
    logger.info('Step 5/7: Setting up Socket.IO...');
    io = setupSocketIO(httpServer);

    // 6. Register voice handlers
    logger.info('Step 6/7: Registering voice handlers...');
    registerVoiceHandlers(io);

    // 7. Start BullMQ workers
    logger.info('Step 7/7: Starting job workers...');

    // Create models object for workers
    const models = { VoiceSession, Conversation, Message };

    sttWorker = createSTTWorker(io, voiceOrchestrator);
    aiWorker = createAIWorker(io, voiceOrchestrator, models);

    // Start HTTP server
    httpServer.listen(PORT, () => {
      logger.info('Server started successfully', {
        instance: INSTANCE_ID,
        port: PORT,
        nodeEnv: NODE_ENV,
        processId: process.pid
      });

      logger.info('All services initialized successfully');
    });
  } catch (error) {
    logger.error('Failed to initialize server', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
async function gracefulShutdown(signal) {
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress');
    return;
  }

  isShuttingDown = true;

  logger.info(`${signal} received, starting graceful shutdown`);

  try {
    // 1. Stop accepting new connections
    if (httpServer) {
      logger.info('Closing HTTP server...');
      await new Promise((resolve) => {
        httpServer.close(resolve);
      });
      logger.info('HTTP server closed');
    }

    // 2. Close Socket.IO
    if (io) {
      logger.info('Closing Socket.IO...');
      await closeSocketIO();
      logger.info('Socket.IO closed');
    }

    // 3. Stop workers
    if (sttWorker) {
      logger.info('Closing STT worker...');
      await sttWorker.close();
      logger.info('STT worker closed');
    }

    if (aiWorker) {
      logger.info('Closing AI worker...');
      await aiWorker.close();
      logger.info('AI worker closed');
    }

    // 4. Close Redis
    if (redisClient) {
      logger.info('Closing Redis connection...');
      await redisClient.quit();
      logger.info('Redis connection closed');
    }

    // 5. Close MongoDB
    logger.info('Closing MongoDB connection...');
    await closeDatabase();
    logger.info('MongoDB connection closed');

    logger.info('Graceful shutdown completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', {
    error: error.message,
    stack: error.stack
  });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled promise rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: String(promise)
  });
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start the application
initialize().catch((error) => {
  logger.error('Failed to start application', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// Export for testing
export { httpServer, io };
