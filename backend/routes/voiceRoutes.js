import express from 'express';
import multer from 'multer';
import {
  initializeVoiceSession,
  getSessionDetails,
  updateSessionSettings,
  endVoiceSession,
  getSessionHistory,
  updateSessionContext
} from '../controllers/voiceSessionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure multer for audio file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/voice/session/init
 * @desc    Initialize or get active voice session
 * @access  Private
 */
router.post('/session/init', initializeVoiceSession);

/**
 * @route   GET /api/voice/session/:sessionId
 * @desc    Get session details
 * @access  Private
 */
router.get('/session/:sessionId', getSessionDetails);

/**
 * @route   PUT /api/voice/session/:sessionId/settings
 * @desc    Update session settings
 * @access  Private
 */
router.put('/session/:sessionId/settings', updateSessionSettings);

/**
 * @route   POST /api/voice/session/:sessionId/end
 * @desc    End voice session
 * @access  Private
 */
router.post('/session/:sessionId/end', endVoiceSession);

/**
 * @route   PUT /api/voice/session/:sessionId/context
 * @desc    Update session context
 * @access  Private
 */
router.put('/session/:sessionId/context', updateSessionContext);

/**
 * @route   POST /api/voice/sessions
 * @desc    Create a new voice session (with optional lesson/enrollment)
 * @access  Private
 */
router.post('/sessions', async (req, res) => {
  try {
    const { lesson, enrollment, title } = req.body;
    const Session = (await import('../models/Session.js')).default;
    const VoiceSession = (await import('../models/VoiceSession.js')).default;
    const Conversation = (await import('../models/Conversation.js')).default;

    // Create conversation
    const conversation = await Conversation.create({
      user: req.user._id,
      title: title || 'Voice Learning Session',
      conversationType: 'voice'
    });

    // Create session
    const session = await Session.create({
      userId: req.user._id,
      title: title || 'Voice Learning Session',
      conversationId: conversation._id,
      lesson: lesson || null,
      enrollment: enrollment || null
    });

    // Create voice session
    const voiceSession = await VoiceSession.create({
      userId: req.user._id,
      conversationId: conversation._id,
      lesson: lesson || null,
      enrollment: enrollment || null,
      status: 'active',
      language: 'en-US',
      settings: {
        language: 'en-US',
        autoSpeak: true,
        ttsEnabled: true,
        sttMode: 'auto'
      }
    });

    // Populate the response
    const populatedSession = await Session.findById(session._id)
      .populate({
        path: 'lesson',
        populate: {
          path: 'module',
          populate: { path: 'course' }
        }
      })
      .populate('enrollment');

    res.status(201).json({
      success: true,
      session: populatedSession,
      voiceSession
    });
  } catch (error) {
    console.error('Error creating voice session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/voice/sessions/:sessionId
 * @desc    Get specific session details
 * @access  Private
 */
router.get('/sessions/:sessionId', async (req, res) => {
  try {
    console.log('📥 GET /sessions/:sessionId - Fetching session:', req.params.sessionId);
    console.log('👤 User:', req.user._id);

    const Session = (await import('../models/Session.js')).default;

    const session = await Session.findById(req.params.sessionId)
      .populate({
        path: 'lesson',
        populate: {
          path: 'module',
          populate: { path: 'course' }
        }
      })
      .populate('enrollment');

    console.log('📦 Session found:', !!session);

    if (!session) {
      console.log('❌ Session not found in database');
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    console.log('🔍 Session details:', {
      id: session._id,
      userId: session.userId,
      hasLesson: !!session.lesson,
      lessonId: session.lesson?._id,
      hasModule: !!session.lesson?.module,
      moduleId: session.lesson?.module?._id,
      hasCourse: !!session.lesson?.module?.course,
      courseId: session.lesson?.module?.course?._id
    });

    // Check if user owns this session
    if (session.userId.toString() !== req.user._id.toString()) {
      console.log('❌ Authorization failed - User does not own session');
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this session'
      });
    }

    console.log('✅ Sending session response');
    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('❌ Error fetching session:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/voice/sessions
 * @desc    Get user's session history
 * @access  Private
 */
router.get('/sessions', getSessionHistory);

/**
 * @route   POST /api/voice/upload-audio
 * @desc    Upload and process audio file (alternative to WebSocket)
 * @access  Private
 */
router.post('/upload-audio', upload.single('audio'), async (req, res) => {
  try {
    const { sessionId } = req.body;
    const audioBuffer = req.file.buffer;

    if (!sessionId || !audioBuffer) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and audio file required'
      });
    }

    const voiceOrchestrator = (await import('../services/voiceOrchestrator.js')).default;

    const result = await voiceOrchestrator.processVoiceInput(
      sessionId,
      audioBuffer,
      {
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size
      }
    );

    res.status(200).json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error uploading audio:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
