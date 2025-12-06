/**
 * AI Workflow Routes
 * Routes for LangGraph workflows and advanced RAG
 */

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import advancedRagChain from '../ai/chains/advancedRagChain.js';
import adaptiveTutorGraph from '../ai/graphs/adaptiveTutorGraph.js';
import platformServer from '../ai/mcp/servers/platformServer.js';
import statePersistence from '../ai/state/statePersistence.js';
import logger from '../utils/logger.js';

const router = express.Router();

// ============================================
// Advanced RAG Endpoints
// ============================================

/**
 * POST /api/ai/workflows/rag/multi-query
 * Multi-query RAG retrieval
 */
router.post('/rag/multi-query', protect, async (req, res) => {
  try {
    const { query, collectionKey, topK, numQueries } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const result = await advancedRagChain.multiQueryRetrieval(query, {
      collectionKey,
      topK,
      numQueries,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error('Multi-query RAG error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/workflows/rag/conversational
 * Conversational RAG with history
 */
router.post('/rag/conversational', protect, async (req, res) => {
  try {
    const { query, collectionKey, topK, conversationHistory } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const result = await advancedRagChain.conversationalRAG(query, {
      collectionKey,
      topK,
      conversationHistory,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error('Conversational RAG error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/workflows/rag/self-query
 * Self-query RAG with metadata extraction
 */
router.post('/rag/self-query', protect, async (req, res) => {
  try {
    const { query, collectionKey, topK } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const result = await advancedRagChain.selfQueryRAG(query, {
      collectionKey,
      topK,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error('Self-query RAG error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/workflows/rag/hybrid
 * Hybrid semantic + keyword search
 */
router.post('/rag/hybrid', protect, async (req, res) => {
  try {
    const { query, collectionKey, topK, alpha } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const result = await advancedRagChain.hybridSearch(query, {
      collectionKey,
      topK,
      alpha,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error('Hybrid search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Adaptive Tutor Workflow Endpoints
// ============================================

/**
 * POST /api/ai/workflows/tutor/start
 * Start a new adaptive tutoring session
 */
router.post('/tutor/start', protect, async (req, res) => {
  try {
    const { topic, level = 'beginner' } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const result = await adaptiveTutorGraph.start(req.user.id, topic, level);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error('Start tutor session error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/workflows/tutor/interact
 * Continue tutoring session with user message
 */
router.post('/tutor/interact', protect, async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ error: 'SessionId and message are required' });
    }

    const result = await adaptiveTutorGraph.interact(sessionId, message);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error('Tutor interact error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ai/workflows/tutor/session/:sessionId
 * Get tutoring session state
 */
router.get('/tutor/session/:sessionId', protect, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const result = await adaptiveTutorGraph.getSession(sessionId);

    if (!result) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error('Get tutor session error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/workflows/tutor/end
 * End tutoring session
 */
router.post('/tutor/end', protect, async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'SessionId is required' });
    }

    const result = await adaptiveTutorGraph.endSession(sessionId);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error('End tutor session error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ai/workflows/tutor/sessions
 * List user's tutoring sessions
 */
router.get('/tutor/sessions', protect, async (req, res) => {
  try {
    const sessions = await statePersistence.listCheckpoints('tutor', req.user.id);

    res.json({
      success: true,
      sessions,
    });
  } catch (error) {
    logger.error('List tutor sessions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// MCP Tool Execution Endpoints
// ============================================

/**
 * GET /api/ai/workflows/mcp/tools
 * List available MCP tools
 */
router.get('/mcp/tools', protect, async (req, res) => {
  try {
    const tools = platformServer.getToolDefinitions();

    res.json({
      success: true,
      server: platformServer.name,
      tools,
    });
  } catch (error) {
    logger.error('List MCP tools error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/workflows/mcp/execute
 * Execute an MCP tool
 */
router.post('/mcp/execute', protect, async (req, res) => {
  try {
    const { tool, input } = req.body;

    if (!tool) {
      return res.status(400).json({ error: 'Tool name is required' });
    }

    const context = {
      user: {
        id: req.user.id,
        isAdmin: req.user.isAdmin || false,
      },
      ipAddress: req.ip,
    };

    const result = await platformServer.execute(tool, input, context);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    logger.error('Execute MCP tool error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ai/workflows/mcp/stats
 * Get MCP server statistics
 */
router.get('/mcp/stats', protect, async (req, res) => {
  try {
    const stats = platformServer.getStats();

    res.json({
      success: true,
      ...stats,
    });
  } catch (error) {
    logger.error('Get MCP stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ai/workflows/mcp/health
 * MCP server health check
 */
router.get('/mcp/health', async (req, res) => {
  try {
    const health = await platformServer.healthCheck();

    res.json({
      success: true,
      ...health,
    });
  } catch (error) {
    logger.error('MCP health check error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// State Management Endpoints
// ============================================

/**
 * GET /api/ai/workflows/state/stats
 * Get state persistence statistics
 */
router.get('/state/stats', protect, async (req, res) => {
  try {
    const stats = await statePersistence.getStats();

    res.json({
      success: true,
      ...stats,
    });
  } catch (error) {
    logger.error('Get state stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
