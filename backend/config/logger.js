/**
 * Winston Logger Configuration
 * Provides structured logging with file transports for production
 */

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const {
  combine,
  timestamp,
  errors,
  json,
  printf,
  colorize,
  simple
} = winston.format;

// Get log level from environment or default to 'info'
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const NODE_ENV = process.env.NODE_ENV || 'development';
const INSTANCE_ID = process.env.INSTANCE_ID || 'local';

// Custom format for console output in development
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]`;

  if (metadata.userId) msg += ` [User: ${metadata.userId}]`;
  if (metadata.sessionId) msg += ` [Session: ${metadata.sessionId}]`;
  if (metadata.jobId) msg += ` [Job: ${metadata.jobId}]`;

  msg += `: ${message}`;

  // Add metadata if present
  const metaKeys = Object.keys(metadata).filter(
    key => !['level', 'message', 'timestamp', 'service'].includes(key)
  );
  if (metaKeys.length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }

  return msg;
});

// Create logger instance
const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
  defaultMeta: {
    service: 'voice-ai-tutor',
    instance: INSTANCE_ID
  },
  transports: []
});

// File transport for errors
logger.add(new winston.transports.File({
  filename: path.join(__dirname, '../logs/error.log'),
  level: 'error',
  maxsize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  tailable: true
}));

// File transport for combined logs
logger.add(new winston.transports.File({
  filename: path.join(__dirname, '../logs/combined.log'),
  maxsize: 10 * 1024 * 1024, // 10MB
  maxFiles: 10,
  tailable: true
}));

// Console transport for non-production
if (NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'HH:mm:ss' }),
      consoleFormat
    )
  }));
}

// Helper methods for common logging patterns
logger.logConnection = (userId, socketId) => {
  logger.info('User connected', { userId, socketId });
};

logger.logDisconnection = (userId, socketId) => {
  logger.info('User disconnected', { userId, socketId });
};

logger.logSessionStart = (userId, sessionId, settings) => {
  logger.info('Voice session started', { userId, sessionId, settings });
};

logger.logSessionEnd = (userId, sessionId, metadata) => {
  logger.info('Voice session ended', { userId, sessionId, metadata });
};

logger.logJobQueued = (jobName, jobId, data) => {
  logger.info(`Job queued: ${jobName}`, { jobId, data });
};

logger.logJobCompleted = (jobName, jobId, duration) => {
  logger.info(`Job completed: ${jobName}`, { jobId, duration });
};

logger.logJobFailed = (jobName, jobId, error) => {
  logger.error(`Job failed: ${jobName}`, {
    jobId,
    error: error.message,
    stack: error.stack
  });
};

logger.logRateLimitExceeded = (userId, endpoint, ip) => {
  logger.warn('Rate limit exceeded', { userId, endpoint, ip });
};

logger.logAuthFailure = (reason, ip) => {
  logger.warn('Authentication failed', { reason, ip });
};

logger.logDatabaseQuery = (operation, collection, duration) => {
  if (LOG_LEVEL === 'debug') {
    logger.debug('Database query', { operation, collection, duration });
  }
};

logger.logExternalAPICall = (service, endpoint, duration, success) => {
  logger.info('External API call', { service, endpoint, duration, success });
};

export default logger;
