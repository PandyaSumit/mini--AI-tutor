/**
 * AI Controller
 * Handles AI-related API requests
 */

import aiOrchestrator from '../services/aiOrchestrator.js';
import {
  validate,
  chatMessageSchema,
  ragQuerySchema,
  documentSchema,
  embeddingSchema,
} from '../ai/security/inputValidator.js';

class AIController {
  /**
   * POST /api/ai/chat
   * Smart chat with automatic mode detection (RAG or simple)
   */
  async chat(req, res) {
    try {
      const validation = validate(chatMessageSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }

      const { message, context } = validation.data;
      const { conversationHistory, forceMode, useLLMClassifier } = req.body;

      // Use smart chat by default for automatic mode detection
      const result = await aiOrchestrator.smartChat(message, {
        ...context,
        conversationHistory: conversationHistory || [],
        forceMode,
        useLLMClassifier: useLLMClassifier || false,
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('Smart chat error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/ai/chat/simple
   * Simple chat completion (explicit, for legacy/testing)
   */
  async chatSimple(req, res) {
    try {
      const validation = validate(chatMessageSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }

      const { message, context } = validation.data;

      const result = await aiOrchestrator.chat(message, context);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('Simple chat error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/ai/rag/query
   * RAG-enhanced query
   */
  async ragQuery(req, res) {
    try {
      const validation = validate(ragQuerySchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }

      const { query, filters, topK, collectionKey } = validation.data;

      const result = await aiOrchestrator.chatWithRAG(query, {
        topK,
        collectionKey,
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('RAG query error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/ai/embeddings
   * Generate embeddings
   */
  async generateEmbeddings(req, res) {
    try {
      const validation = validate(embeddingSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }

      const { texts } = validation.data;

      const result = await aiOrchestrator.generateEmbeddings(texts);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('Embedding error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/ai/search
   * Semantic search
   */
  async semanticSearch(req, res) {
    try {
      const validation = validate(ragQuerySchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }

      const { query, topK, collectionKey } = validation.data;

      const result = await aiOrchestrator.semanticSearch(query, {
        topK,
        collectionKey,
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/ai/ingest
   * Ingest content into vector store
   */
  async ingestContent(req, res) {
    try {
      const validation = validate(documentSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }

      const { content, type, metadata } = validation.data;

      const result = await aiOrchestrator.ingestContent(type, content, metadata);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('Ingestion error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/ai/stats
   * Get AI pipeline statistics
   */
  async getStats(req, res) {
    try {
      const stats = await aiOrchestrator.getStats();

      res.json({
        success: true,
        ...stats,
      });
    } catch (error) {
      console.error('Stats error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/ai/classifier/stats
   * Get query classifier statistics
   */
  async getClassifierStats(req, res) {
    try {
      const stats = aiOrchestrator.getClassifierStats();

      res.json({
        success: true,
        ...stats,
      });
    } catch (error) {
      console.error('Classifier stats error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/ai/health
   * Health check
   */
  async healthCheck(req, res) {
    try {
      const health = await aiOrchestrator.healthCheck();

      res.json({
        success: true,
        ...health,
      });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/ai/tutor
   * AI Tutor chat with Socratic teaching method
   */
  async tutorChat(req, res) {
    try {
      const validation = validate(chatMessageSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }

      const { message } = validation.data;
      const { subject, level, phase, conversationHistory } = req.body;

      const result = await aiOrchestrator.tutorChat(message, {
        subject: subject || 'general',
        level: level || 'intermediate',
        phase: phase || 'introduction',
        conversationHistory: conversationHistory || []
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('Tutor chat error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new AIController();
