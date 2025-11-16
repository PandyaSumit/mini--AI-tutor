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
