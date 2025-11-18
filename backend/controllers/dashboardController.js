/**
 * Dashboard Controller
 * Unified endpoint for dashboard summary data
 * Aggregates data from multiple sources with optimized queries
 */

import mongoose from 'mongoose';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import LearningRoadmap from '../models/LearningRoadmap.js';
import Flashcard from '../models/Flashcard.js';
import logger from '../utils/logger.js';

/**
 * @desc    Get all dashboard data in a single request
 * @route   GET /api/dashboard/summary
 * @access  Private
 *
 * Returns:
 * - User stats (conversations, messages, streak, topics)
 * - Recent conversations (last 3)
 * - Roadmaps
 * - Flashcard decks with due counts
 *
 * Performance: ~50-100ms for typical user
 * Replaces: 4 separate API calls
 */
export const getDashboardSummary = async (req, res) => {
  const startTime = Date.now();
  const userId = req.user._id; // Use _id directly (ObjectId) for better query compatibility

  // Track which data sources succeeded/failed
  const results = {
    stats: null,
    conversations: null,
    roadmaps: null,
    flashcards: null,
    errors: {}
  };

  try {
    // Execute all queries in parallel for maximum performance
    const [
      user,
      totalConversations,
      totalMessages,
      conversationsByTopic,
      recentMessages,
      recentConversations,
      conversationCount,
      roadmaps,
      flashcardDecks
    ] = await Promise.allSettled([
      // User stats queries
      User.findById(userId).select('learningStats').lean(),
      Conversation.countDocuments({ user: userId }),
      Message.countDocuments({ user: userId, role: 'user' }),
      Conversation.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$topic', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Message.countDocuments({
        user: userId,
        role: 'user',
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),

      // Recent conversations
      Conversation.find({ user: userId })
        .sort({ lastMessageAt: -1 })
        .limit(3)
        .select('title topic messageCount lastMessageAt createdAt isActive')
        .lean(),

      Conversation.countDocuments({ user: userId }),

      // Roadmaps
      LearningRoadmap.find({ user: userId })
        .sort({ createdAt: -1 })
        .select('goal status totalWeeks weeklyModules createdAt updatedAt')
        .lean(),

      // Flashcard decks
      Flashcard.aggregate([
        { $match: { user: userId, isActive: true } },
        {
          $group: {
            _id: '$deck',
            totalCards: { $sum: 1 },
            dueCards: {
              $sum: {
                $cond: [
                  { $lte: ['$spacedRepetition.nextReviewDate', new Date()] },
                  1,
                  0
                ]
              }
            },
            dueCount: {
              $sum: {
                $cond: [
                  { $lte: ['$spacedRepetition.nextReviewDate', new Date()] },
                  1,
                  0
                ]
              }
            },
            averageRetention: { $avg: '$stats.correctReviews' }
          }
        },
        { $sort: { totalCards: -1 } }
      ])
    ]);

    // Process stats data
    if (user.status === 'fulfilled' &&
        totalConversations.status === 'fulfilled' &&
        totalMessages.status === 'fulfilled') {

      results.stats = {
        totalConversations: totalConversations.value || 0,
        totalMessages: totalMessages.value || 0,
        currentStreak: user.value?.learningStats?.currentStreak || 0,
        totalTimeSpent: user.value?.learningStats?.totalTimeSpent || 0,
        topicProgress: user.value?.learningStats?.topicProgress
          ? Object.fromEntries(user.value.learningStats.topicProgress)
          : {},
        conversationsByTopic: conversationsByTopic.status === 'fulfilled'
          ? conversationsByTopic.value
          : [],
        recentActivity: {
          last7Days: recentMessages.status === 'fulfilled' ? recentMessages.value : 0
        }
      };
    } else {
      results.errors.stats = 'Failed to load user statistics';
      logger.error('Dashboard stats query failed:', {
        user: user.reason,
        totalConversations: totalConversations.reason,
        totalMessages: totalMessages.reason
      });
    }

    // Process conversations data
    if (recentConversations.status === 'fulfilled') {
      results.conversations = {
        conversations: Array.isArray(recentConversations.value)
          ? recentConversations.value
          : [],
        pagination: {
          total: conversationCount.status === 'fulfilled' ? conversationCount.value : 0,
          page: 1,
          pages: conversationCount.status === 'fulfilled'
            ? Math.ceil(conversationCount.value / 3)
            : 0
        }
      };
    } else {
      results.errors.conversations = 'Failed to load conversations';
      results.conversations = { conversations: [], pagination: { total: 0, page: 1, pages: 0 } };
      logger.error('Dashboard conversations query failed:', recentConversations.reason);
    }

    // Process roadmaps data
    if (roadmaps.status === 'fulfilled') {
      results.roadmaps = Array.isArray(roadmaps.value) ? roadmaps.value : [];
    } else {
      results.errors.roadmaps = 'Failed to load roadmaps';
      results.roadmaps = [];
      logger.error('Dashboard roadmaps query failed:', roadmaps.reason);
    }

    // Process flashcard decks data
    if (flashcardDecks.status === 'fulfilled') {
      results.flashcards = Array.isArray(flashcardDecks.value) ? flashcardDecks.value : [];
    } else {
      results.errors.flashcards = 'Failed to load flashcard decks';
      results.flashcards = [];
      logger.error('Dashboard flashcards query failed:', flashcardDecks.reason);
    }

    // Calculate total execution time
    const executionTime = Date.now() - startTime;

    // Log performance metrics
    logger.info('Dashboard summary loaded', {
      userId,
      executionTime: `${executionTime}ms`,
      hasErrors: Object.keys(results.errors).length > 0,
      errors: results.errors
    });

    // Return success with partial failure information if applicable
    res.status(200).json({
      success: true,
      data: {
        stats: results.stats,
        conversations: results.conversations,
        roadmaps: results.roadmaps,
        flashcards: results.flashcards,
        metadata: {
          loadedAt: new Date().toISOString(),
          executionTime: `${executionTime}ms`,
          partial: Object.keys(results.errors).length > 0,
          errors: Object.keys(results.errors).length > 0 ? results.errors : undefined
        }
      }
    });

  } catch (error) {
    // Catastrophic failure - return what we have
    logger.error('Dashboard summary catastrophic error:', error);

    res.status(500).json({
      success: false,
      message: 'Error loading dashboard data',
      error: error.message,
      data: {
        stats: results.stats,
        conversations: results.conversations,
        roadmaps: results.roadmaps,
        flashcards: results.flashcards,
        metadata: {
          loadedAt: new Date().toISOString(),
          executionTime: `${Date.now() - startTime}ms`,
          partial: true,
          errors: { ...results.errors, catastrophic: error.message }
        }
      }
    });
  }
};

/**
 * @desc    Get dashboard statistics only (lightweight)
 * @route   GET /api/dashboard/stats
 * @access  Private
 *
 * Lightweight endpoint for just stats without heavy data
 * Useful for navbar counters or minimal updates
 */
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const [user, totalConversations, roadmapCount, dueCards] = await Promise.all([
      User.findById(userId).select('learningStats').lean(),
      Conversation.countDocuments({ user: userId }),
      LearningRoadmap.countDocuments({ user: userId, status: { $in: ['in_progress', 'not_started'] } }),
      Flashcard.countDocuments({
        user: userId,
        isActive: true,
        'spacedRepetition.nextReviewDate': { $lte: new Date() }
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalConversations,
        activeRoadmaps: roadmapCount,
        dueCards,
        currentStreak: user?.learningStats?.currentStreak || 0
      }
    });

  } catch (error) {
    logger.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading dashboard statistics',
      error: error.message
    });
  }
};
