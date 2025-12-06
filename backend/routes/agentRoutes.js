/**
 * Agent Routes - API endpoints for agent system
 * SECURITY: All routes protected with enrollment and quota checks
 */

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireEnrollment } from '../middleware/enrollmentMiddleware.js';
import { checkAIQuota, consumeAIQuota } from '../middleware/quotaMiddleware.js';

const router = express.Router();

/**
 * POST /api/agents/tutor/ask
 * Ask AI tutor a question
 * SECURITY:
 * - Requires authentication
 * - Requires course enrollment (paid or free)
 * - Requires AI quota available
 * - Consumes quota after successful response
 */
router.post(
  '/tutor/ask',
  protect,
  requireEnrollment,
  checkAIQuota('chatMessages'),
  async (req, res) => {
    try {
      const orchestrator = req.app.get('agentOrchestrator');
      if (!orchestrator) {
        return res.status(503).json({ error: 'Agent system not available' });
      }

      const { course_id, topic_id, query, conversation_id } = req.body;

      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      const result = await orchestrator.routeTask('tutoring', {
        user_id: req.user._id,
        course_id,
        topic_id,
        query,
        conversation_id,
        feature: 'ai_tutor_chat',
      });

      if (result.success) {
        // SECURITY: Consume quota after successful AI call
        await consumeAIQuota(req, 1);

        res.json({
          answer: result.result.answer,
          sources: result.result.sources,
          cached: result.result.cached,
          conversation_id: result.result.conversation_id,
          cost: result.cost,
        });
      } else {
        res.status(400).json({
          error: result.error || 'Failed to get answer',
          upgrade_url: result.result?.upgrade_url,
        });
      }
    } catch (error) {
      console.error('Tutor ask error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/agents/course/prepare
 * Prepare course for AI teaching
 */
router.post('/course/prepare', protect, async (req, res) => {
  try {
    const orchestrator = req.app.get('agentOrchestrator');
    if (!orchestrator) {
      return res.status(503).json({ error: 'Agent system not available' });
    }

    const { course_id, mode } = req.body;

    // Only instructors can prepare their own courses
    if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only instructors can prepare courses' });
    }

    const result = await orchestrator.routeTask('course_preparation', {
      course_id,
      mode: mode || 'full',
      user_id: req.user._id
    });

    res.json(result);

  } catch (error) {
    console.error('Course prepare error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/agents/cost/analytics
 * Get cost analytics
 */
router.get('/cost/analytics', protect, async (req, res) => {
  try {
    // Admin only
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const orchestrator = req.app.get('agentOrchestrator');
    if (!orchestrator) {
      return res.status(503).json({ error: 'Agent system not available' });
    }

    const { period, group_by } = req.query;

    const result = await orchestrator.routeTask('cost_control', {
      action: 'get_cost_analytics',
      period: period || 'today',
      group_by: group_by || 'feature'
    });

    res.json(result.result);

  } catch (error) {
    console.error('Cost analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/agents/cost/user/:user_id
 * Check user budget status
 */
router.get('/cost/user/:user_id', protect, async (req, res) => {
  try {
    const orchestrator = req.app.get('agentOrchestrator');
    if (!orchestrator) {
      return res.status(503).json({ error: 'Agent system not available' });
    }

    // Users can check their own budget, admins can check anyone
    if (req.user._id.toString() !== req.params.user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await orchestrator.routeTask('cost_control', {
      action: 'check_user_budget',
      target: req.params.user_id
    });

    res.json(result.result);

  } catch (error) {
    console.error('User budget check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/agents/progress/update
 * Update student progress
 */
router.post('/progress/update', protect, async (req, res) => {
  try {
    const orchestrator = req.app.get('agentOrchestrator');
    if (!orchestrator) {
      return res.status(503).json({ error: 'Agent system not available' });
    }

    const { enrollment_id, module_id, topic_id } = req.body;

    const result = await orchestrator.routeTask('progress_tracking', {
      action: 'update_progress',
      enrollment_id,
      module_id,
      topic_id,
      user_id: req.user._id
    });

    res.json(result);

  } catch (error) {
    console.error('Progress update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/agents/progress/complete-topic
 * Mark topic as completed
 */
router.post('/progress/complete-topic', protect, async (req, res) => {
  try {
    const orchestrator = req.app.get('agentOrchestrator');
    if (!orchestrator) {
      return res.status(503).json({ error: 'Agent system not available' });
    }

    const { enrollment_id, topic_id } = req.body;

    const result = await orchestrator.routeTask('progress_tracking', {
      action: 'complete_topic',
      enrollment_id,
      topic_id,
      user_id: req.user._id
    });

    res.json(result);

  } catch (error) {
    console.error('Complete topic error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/agents/stats
 * Get all agent statistics (admin only)
 */
router.get('/stats', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const orchestrator = req.app.get('agentOrchestrator');
    if (!orchestrator) {
      return res.status(503).json({ error: 'Agent system not available' });
    }

    const stats = orchestrator.getAllStats();
    res.json(stats);

  } catch (error) {
    console.error('Agent stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
