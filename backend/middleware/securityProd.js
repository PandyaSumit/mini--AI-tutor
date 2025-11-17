/**
 * Production Security Middleware Bundle
 * Helmet, CORS, input validation, and XSS prevention
 */

import helmet from 'helmet';
import cors from 'cors';
import { body, param, validationResult } from 'express-validator';
import sanitizeHtml from 'sanitize-html';
import logger from '../config/logger.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Helmet security headers configuration
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", FRONTEND_URL],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for development
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny'
  },
  noSniff: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
});

/**
 * CORS configuration
 */
export const corsConfig = cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400 // 24 hours
});

/**
 * Sanitize HTML content to prevent XSS
 * @param {string} text - Text to sanitize
 * @returns {string} - Sanitized text
 */
export function sanitizeText(text) {
  if (!text) return '';

  return sanitizeHtml(text, {
    allowedTags: [], // No HTML tags allowed
    allowedAttributes: {}, // No attributes allowed
    disallowedTagsMode: 'recursiveEscape'
  });
}

/**
 * Custom sanitizer for express-validator
 */
export const textSanitizer = (value) => {
  return sanitizeText(value);
};

/**
 * Validation chain for voice text messages
 */
export const validateTextMessage = [
  body('sessionId')
    .isMongoId()
    .withMessage('Invalid session ID'),
  body('text')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Text must be between 1 and 5000 characters')
    .customSanitizer(textSanitizer),
  handleValidationErrors
];

/**
 * Validation chain for session creation
 */
export const validateSessionCreate = [
  body('language')
    .optional()
    .isString()
    .isIn(['en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'pt-BR', 'ja-JP', 'ko-KR', 'zh-CN'])
    .withMessage('Invalid language code'),
  body('settings')
    .optional()
    .isObject()
    .withMessage('Settings must be an object'),
  handleValidationErrors
];

/**
 * Validation chain for MongoDB ObjectId params
 */
export const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`),
  handleValidationErrors
];

/**
 * Validation chain for conversation creation
 */
export const validateConversationCreate = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters')
    .customSanitizer(textSanitizer),
  body('topic')
    .optional()
    .isIn(['programming', 'mathematics', 'science', 'language', 'other'])
    .withMessage('Invalid topic'),
  handleValidationErrors
];

/**
 * Validation chain for message creation
 */
export const validateMessageCreate = [
  body('conversationId')
    .isMongoId()
    .withMessage('Invalid conversation ID'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Content must be between 1 and 10000 characters')
    .customSanitizer(textSanitizer),
  handleValidationErrors
];

/**
 * Handle validation errors middleware
 */
export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg,
      value: err.value
    }));

    logger.warn('Validation failed', {
      errors: formattedErrors,
      path: req.path,
      method: req.method,
      ip: req.ip
    });

    return res.status(400).json({
      error: 'Validation failed',
      errors: formattedErrors
    });
  }

  next();
}

/**
 * Sanitize request body recursively
 */
export function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  next();
}

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj) {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = sanitizeText(obj[key]);
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

/**
 * Prevent parameter pollution
 */
export function preventParameterPollution(req, res, next) {
  // Check for duplicate query parameters
  const queryKeys = Object.keys(req.query);
  const duplicates = queryKeys.filter((key, index) => queryKeys.indexOf(key) !== index);

  if (duplicates.length > 0) {
    logger.warn('Parameter pollution detected', {
      duplicates,
      path: req.path,
      ip: req.ip
    });

    return res.status(400).json({
      error: 'Invalid request parameters'
    });
  }

  next();
}

/**
 * Request size limiter
 */
export function requestSizeLimiter(maxSizeBytes = 10 * 1024 * 1024) {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('content-length') || '0');

    if (contentLength > maxSizeBytes) {
      logger.warn('Request size exceeded', {
        size: contentLength,
        max: maxSizeBytes,
        path: req.path,
        ip: req.ip
      });

      return res.status(413).json({
        error: 'Request entity too large',
        maxSize: `${maxSizeBytes / (1024 * 1024)}MB`
      });
    }

    next();
  };
}

/**
 * Security headers for production
 */
export function securityHeaders(req, res, next) {
  // Remove powered-by header
  res.removeHeader('X-Powered-By');

  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Only set secure headers in production
  if (NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
}

/**
 * Bundle all security middleware
 */
export const securityMiddleware = [
  helmetConfig,
  corsConfig,
  securityHeaders,
  preventParameterPollution,
  sanitizeBody
];

export default {
  helmetConfig,
  corsConfig,
  sanitizeText,
  textSanitizer,
  validateTextMessage,
  validateSessionCreate,
  validateObjectId,
  validateConversationCreate,
  validateMessageCreate,
  handleValidationErrors,
  sanitizeBody,
  preventParameterPollution,
  requestSizeLimiter,
  securityHeaders,
  securityMiddleware
};
