import Groq from 'groq-sdk';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';

const getGroqClient = () => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error('GROQ_API_KEY environment variable is missing. Add it to backend/.env or your environment before starting the server.');
    }
    return new Groq({ apiKey });
};

export const sendMessage = async (req, res) => {
    try {
        const { conversationId, message, topic } = req.body;
        const userId = req.user.id;

        // Check if Groq API key is configured
        if (!process.env.GROQ_API_KEY) {
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

        // Call Groq API (create client at runtime)
        const model = process.env.GROQ_MODEL;
        if (!model) {
            return res.status(500).json({
                success: false,
                message: 'AI model not configured. Please set GROQ_MODEL in your .env to a supported Groq model. See https://console.groq.com/docs/deprecations for guidance.'
            });
        }

        let chatCompletion;
        try {
            chatCompletion = await getGroqClient().chat.completions.create({
                messages: messages,
                model,
                temperature: 0.7,
                max_tokens: 2000,
                top_p: 1,
                stream: false
            });
        } catch (err) {
            // If Groq returns a model decommissioned error, surface a helpful message
            const errMsg = String(err?.message || err);
            if (errMsg.includes('model_decommissioned') || errMsg.includes('decommissioned')) {
                return res.status(400).json({
                    success: false,
                    message: 'The configured model has been decommissioned. Please update GROQ_MODEL in your .env to a supported model.',
                    details: errMsg,
                    docs: 'https://console.groq.com/docs/deprecations'
                });
            }
            // Re-throw for outer catch to handle generically
            throw err;
        }

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
