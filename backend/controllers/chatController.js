import Groq from 'groq-sdk';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';

// Initialize Groq client (only if API key is available)
let groq = null;
if (process.env.GROQ_API_KEY) {
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
  });
}

// @desc    Send message to AI and get response
// @route   POST /api/chat/message
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, message, topic } = req.body;
    const userId = req.user.id;

    // Check if Groq API key is configured
    if (!groq) {
      return res.status(500).json({
        success: false,
        message: 'AI service not configured. Please set GROQ_API_KEY in your .env file. Get your free API key at https://console.groq.com'
      });
    }

    // Validate input
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    let conversation;

    // If conversationId exists, get the conversation
    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        user: userId
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }
    } else {
      // Create new conversation
      conversation = await Conversation.create({
        user: userId,
        title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        topic: topic || 'general'
      });
    }

    // Save user message
    const userMessage = await Message.create({
      conversation: conversation._id,
      user: userId,
      role: 'user',
      content: message
    });

    // Get conversation history for context
    const conversationHistory = await Message.find({
      conversation: conversation._id
    })
      .sort({ createdAt: 1 })
      .limit(20)
      .select('role content');

    // Prepare messages for Groq API
    const messages = [
      {
        role: 'system',
        content: `You are an AI tutor helping users learn various subjects. You are knowledgeable, patient, and encouraging.
        Adapt your teaching style to the user's level and provide clear, concise explanations.
        Use examples when appropriate and encourage questions.
        Current topic: ${conversation.topic}`
      },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    // Track response time
    const startTime = Date.now();

    // Call Groq API
    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile',
      temperature: 0.7,
      max_tokens: 2000,
      top_p: 1,
      stream: false
    });

    const responseTime = Date.now() - startTime;
    const aiResponse = chatCompletion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Save AI response
    const aiMessage = await Message.create({
      conversation: conversation._id,
      user: userId,
      role: 'assistant',
      content: aiResponse,
      metadata: {
        model: chatCompletion.model,
        tokens: chatCompletion.usage?.total_tokens || 0,
        responseTime
      }
    });

    // Update conversation
    await conversation.incrementMessageCount();
    await conversation.incrementMessageCount(); // Once for user message, once for AI

    // Update user stats
    const user = await User.findById(userId);
    user.learningStats.totalMessages += 2;
    user.updateStreak();

    // Update topic progress
    const topicProgress = user.learningStats.topicProgress.get(conversation.topic) || 0;
    user.learningStats.topicProgress.set(conversation.topic, topicProgress + 1);

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        conversationId: conversation._id,
        userMessage: {
          id: userMessage._id,
          content: userMessage.content,
          role: userMessage.role,
          createdAt: userMessage.createdAt
        },
        aiMessage: {
          id: aiMessage._id,
          content: aiMessage.content,
          role: aiMessage.role,
          createdAt: aiMessage.createdAt,
          metadata: aiMessage.metadata
        }
      }
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing chat message',
      error: error.message
    });
  }
};

// @desc    Get conversation messages
// @route   GET /api/chat/conversation/:conversationId
// @access  Private
export const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Verify conversation belongs to user
    const conversation = await Conversation.findOne({
      _id: conversationId,
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
      conversation: conversationId
    })
      .sort({ createdAt: 1 })
      .select('role content metadata createdAt');

    res.status(200).json({
      success: true,
      data: {
        conversation: {
          id: conversation._id,
          title: conversation.title,
          topic: conversation.topic,
          messageCount: conversation.messageCount,
          createdAt: conversation.createdAt
        },
        messages
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages',
      error: error.message
    });
  }
};
