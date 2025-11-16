import voiceOrchestrator from '../services/voiceOrchestrator.js';
import Session from '../models/Session.js';
import { emitToUser } from '../config/socket.js';

/**
 * Voice Session Controller
 * Handles HTTP endpoints for voice session management
 */

/**
 * Create or get active voice session
 */
export const initializeVoiceSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { settings } = req.body;

    // Check if user has an active voice session
    let session = await Session.getActiveSession(userId);

    if (!session || session.sessionType !== 'voice') {
      // Create new voice session
      session = await voiceOrchestrator.initializeSession(userId, null, settings);
    }

    res.status(200).json({
      success: true,
      session: {
        id: session._id,
        status: session.status,
        settings: session.settings,
        voiceState: session.voiceState,
        metrics: session.metrics
      }
    });
  } catch (error) {
    console.error('Error initializing voice session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get session details
 */
export const getSessionDetails = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await Session.findById(sessionId).populate('conversationId');

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Check ownership
    if (session.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    res.status(200).json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Error getting session details:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update session settings
 */
export const updateSessionSettings = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const { settings } = req.body;

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    if (session.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Update settings
    Object.assign(session.settings, settings);
    await session.save();

    // Emit update to client
    emitToUser(userId, 'session:updated', {
      sessionId: session._id,
      settings: session.settings
    });

    res.status(200).json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Error updating session settings:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * End voice session
 */
export const endVoiceSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    if (session.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // End session
    const endedSession = await voiceOrchestrator.endSession(sessionId);

    res.status(200).json({
      success: true,
      session: endedSession
    });
  } catch (error) {
    console.error('Error ending voice session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get user's session history
 */
export const getSessionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, skip = 0 } = req.query;

    const sessions = await Session.find({ userId })
      .sort({ startedAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate('conversationId');

    const total = await Session.countDocuments({ userId });

    res.status(200).json({
      success: true,
      sessions,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });
  } catch (error) {
    console.error('Error getting session history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update session context (for personalization)
 */
export const updateSessionContext = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const { context } = req.body;

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    if (session.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const updatedSession = await voiceOrchestrator.updateContext(sessionId, context);

    res.status(200).json({
      success: true,
      session: updatedSession
    });
  } catch (error) {
    console.error('Error updating session context:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
