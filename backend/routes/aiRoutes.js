/**
 * AI API Routes
 * Routes for AI chat, RAG, embeddings, and semantic search
 */

import express from 'express';
import aiController from '../controllers/aiController.js';
import { chatStream } from '../controllers/aiStreamController.js';
import { protect } from '../middleware/authMiddleware.js';
import { rateLimitMiddleware } from '../middleware/cacheRateLimiter.js';

const router = express.Router();

// Rate limiting for AI endpoints
const aiRateLimit = rateLimitMiddleware({
  keyPrefix: 'ai',
  maxRequests: 50, // 50 requests
  windowSeconds: 3600, // per hour
});

// Chat endpoints (automatic mode detection)
router.post('/chat', protect, aiRateLimit, aiController.chat); // Smart chat with auto-detection
router.post('/chat/simple', protect, aiRateLimit, aiController.chatSimple); // Explicit simple chat
router.post('/chat/stream', protect, aiRateLimit, chatStream); // Streaming endpoint
router.post('/tutor', protect, aiRateLimit, aiController.tutorChat); // AI Tutor endpoint
router.post('/rag/query', protect, aiRateLimit, aiController.ragQuery); // Explicit RAG query

// Embeddings
router.post('/embeddings', protect, aiRateLimit, aiController.generateEmbeddings);

// Semantic search
router.post('/search', protect, aiController.semanticSearch);

// Content ingestion
router.post('/ingest', protect, aiController.ingestContent);

// Stats and health
router.get('/stats', protect, aiController.getStats);
router.get('/classifier/stats', protect, aiController.getClassifierStats); // Query classifier stats
router.get('/health', aiController.healthCheck);

export default router;
