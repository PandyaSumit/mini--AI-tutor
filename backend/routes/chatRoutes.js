import express from 'express';
import {
  sendMessage,
  getConversationMessages
} from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';
import { chatLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes are protected
router.post('/message', protect, chatLimiter, sendMessage);
router.get('/conversation/:conversationId', protect, getConversationMessages);

export default router;
