/**
 * Production MongoDB Connection with Replica Sets
 * Optimized connection pooling and index creation
 */

import mongoose from 'mongoose';
import logger from './logger.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-tutor';

/**
 * MongoDB connection options for production
 */
const connectionOptions = {
  // Connection pooling
  maxPoolSize: 50,
  minPoolSize: 10,
  maxIdleTimeMS: 30000,

  // Replica set configuration
  replicaSet: 'rs0',
  readPreference: 'secondaryPreferred',
  w: 'majority',
  wtimeoutMS: 5000,

  // Timeouts
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,

  // Network
  family: 4, // Use IPv4

  // Performance
  autoIndex: false, // Don't build indexes automatically (we'll do it manually)
  autoCreate: false // Don't auto-create collections
};

/**
 * Connect to MongoDB with retry logic
 */
export async function connectDatabase() {
  try {
    logger.info('Connecting to MongoDB...', {
      uri: MONGODB_URI.replace(/\/\/.*:.*@/, '//***:***@') // Hide credentials in logs
    });

    await mongoose.connect(MONGODB_URI, connectionOptions);

    logger.info('MongoDB connected successfully', {
      host: mongoose.connection.host,
      database: mongoose.connection.name,
      readyState: mongoose.connection.readyState
    });

    // Setup connection event handlers
    setupConnectionHandlers();

    // Create indexes after connection
    await createIndexes();

    return mongoose.connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Setup MongoDB connection event handlers
 */
function setupConnectionHandlers() {
  mongoose.connection.on('connected', () => {
    logger.info('Mongoose connected to MongoDB');
  });

  mongoose.connection.on('error', (error) => {
    logger.error('Mongoose connection error', {
      error: error.message,
      stack: error.stack
    });
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('Mongoose disconnected from MongoDB');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('Mongoose reconnected to MongoDB');
  });

  // Handle application termination
  process.on('SIGINT', async () => {
    await gracefulShutdown('SIGINT');
  });

  process.on('SIGTERM', async () => {
    await gracefulShutdown('SIGTERM');
  });
}

/**
 * Create indexes on all models
 * Called after initial connection
 */
async function createIndexes() {
  try {
    logger.info('Creating MongoDB indexes...');

    // Import models
    const { default: VoiceSession } = await import('../models/VoiceSession.js');
    const { default: Conversation } = await import('../models/Conversation.js');
    const { default: Message } = await import('../models/Message.js');

    // VoiceSession indexes
    await VoiceSession.collection.createIndex({ userId: 1, status: 1 });
    await VoiceSession.collection.createIndex({ conversationId: 1 });
    await VoiceSession.collection.createIndex({ lastActivityAt: -1 });
    await VoiceSession.collection.createIndex({ userId: 1, createdAt: -1 });

    logger.info('VoiceSession indexes created', { count: 4 });

    // Conversation indexes
    await Conversation.collection.createIndex({ user: 1, isActive: 1, lastMessageAt: -1 });
    await Conversation.collection.createIndex({ user: 1, createdAt: -1 });
    await Conversation.collection.createIndex({ 'metadata.sessionId': 1 });

    logger.info('Conversation indexes created', { count: 3 });

    // Message indexes
    await Message.collection.createIndex({ conversation: 1, createdAt: 1 });
    await Message.collection.createIndex({ user: 1, createdAt: -1 });
    await Message.collection.createIndex({ conversation: 1, role: 1 });

    logger.info('Message indexes created', { count: 3 });

    logger.info('All MongoDB indexes created successfully', { totalIndexes: 10 });
  } catch (error) {
    logger.error('Failed to create indexes', {
      error: error.message,
      stack: error.stack
    });
    // Don't throw - indexes can be created later if needed
  }
}

/**
 * Graceful shutdown of MongoDB connection
 */
async function gracefulShutdown(signal) {
  logger.info(`${signal} received, closing MongoDB connection gracefully`);

  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error closing MongoDB connection', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

/**
 * Check if MongoDB connection is ready
 */
export function isDatabaseReady() {
  return mongoose.connection.readyState === 1; // 1 = connected
}

/**
 * Get database connection stats
 */
export function getDatabaseStats() {
  return {
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
    collections: Object.keys(mongoose.connection.collections).length
  };
}

/**
 * Close database connection
 */
export async function closeDatabase() {
  try {
    await mongoose.connection.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database', {
      error: error.message
    });
    throw error;
  }
}

export default {
  connectDatabase,
  isDatabaseReady,
  getDatabaseStats,
  closeDatabase
};
