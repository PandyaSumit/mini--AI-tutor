import express from 'express';
import {
  getConversations,
  getConversation,
  createConversation,
  updateConversation,
  deleteConversation,
  searchConversations
} from '../controllers/conversationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.get('/', protect, getConversations);
router.post('/', protect, createConversation);
router.get('/search', protect, searchConversations);

// Get messages for a conversation (must be before /:id route)
router.get('/:conversationId/messages', protect, async (req, res) => {
  try {
    const Message = (await import('../models/Message.js')).default;
    const Conversation = (await import('../models/Conversation.js')).default;

    console.log('📥 Fetching messages for conversation:', req.params.conversationId);

    // Check if conversation exists and user has access
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation) {
      console.log('❌ Conversation not found');
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Check if user owns this conversation
    if (conversation.user.toString() !== req.user._id.toString()) {
      console.log('❌ User does not own conversation');
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this conversation'
      });
    }

    // Fetch messages
    const messages = await Message.find({ conversation: req.params.conversationId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name email');

    console.log('✅ Found', messages.length, 'messages');

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Other conversation routes (must be after specific routes)
router.get('/:id', protect, getConversation);
router.put('/:id', protect, updateConversation);
router.delete('/:id', protect, deleteConversation);

export default router;
