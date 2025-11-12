import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

// @desc    Get all user conversations
// @route   GET /api/conversations
// @access  Private
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { topic, limit = 20, page = 1 } = req.query;

    // Build query
    const query = { user: userId };
    if (topic) {
      query.topic = topic;
    }

    // Get conversations with pagination
    const conversations = await Conversation.find(query)
      .sort({ lastMessageAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('title topic messageCount lastMessageAt createdAt isActive');

    // Get total count
    const total = await Conversation.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        conversations,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversations',
      error: error.message
    });
  }
};

// @desc    Get single conversation
// @route   GET /api/conversations/:id
// @access  Private
export const getConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findOne({
      _id: id,
      user: userId
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Get messages
    const messages = await Message.find({
      conversation: id
    })
      .sort({ createdAt: 1 })
      .select('role content metadata createdAt');

    res.status(200).json({
      success: true,
      data: {
        conversation,
        messages
      }
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversation',
      error: error.message
    });
  }
};

// @desc    Create new conversation
// @route   POST /api/conversations
// @access  Private
export const createConversation = async (req, res) => {
  try {
    const { title, topic } = req.body;
    const userId = req.user.id;

    const conversation = await Conversation.create({
      user: userId,
      title: title || 'New Conversation',
      topic: topic || 'general'
    });

    res.status(201).json({
      success: true,
      message: 'Conversation created successfully',
      data: { conversation }
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating conversation',
      error: error.message
    });
  }
};

// @desc    Update conversation
// @route   PUT /api/conversations/:id
// @access  Private
export const updateConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, topic, tags } = req.body;
    const userId = req.user.id;

    const conversation = await Conversation.findOne({
      _id: id,
      user: userId
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (title) conversation.title = title;
    if (topic) conversation.topic = topic;
    if (tags) conversation.tags = tags;

    await conversation.save();

    res.status(200).json({
      success: true,
      message: 'Conversation updated successfully',
      data: { conversation }
    });
  } catch (error) {
    console.error('Update conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating conversation',
      error: error.message
    });
  }
};

// @desc    Delete conversation
// @route   DELETE /api/conversations/:id
// @access  Private
export const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findOne({
      _id: id,
      user: userId
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Delete all messages in the conversation
    await Message.deleteMany({ conversation: id });

    // Delete the conversation
    await Conversation.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting conversation',
      error: error.message
    });
  }
};

// @desc    Search conversations
// @route   GET /api/conversations/search
// @access  Private
export const searchConversations = async (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.user.id;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const conversations = await Conversation.find({
      user: userId,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    })
      .sort({ lastMessageAt: -1 })
      .limit(20)
      .select('title topic messageCount lastMessageAt createdAt');

    res.status(200).json({
      success: true,
      data: { conversations }
    });
  } catch (error) {
    console.error('Search conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching conversations',
      error: error.message
    });
  }
};
