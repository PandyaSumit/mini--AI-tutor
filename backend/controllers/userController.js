import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          learningStats: user.learningStats,
          preferences: user.preferences,
          isVerified: user.isVerified,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const { name, avatar, preferences } = req.body;

    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          preferences: user.preferences
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// @desc    Get user learning statistics
// @route   GET /api/user/stats
// @access  Private
export const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user with stats
    const user = await User.findById(userId);

    // Get total conversations
    const totalConversations = await Conversation.countDocuments({ user: userId });

    // Get total messages
    const totalMessages = await Message.countDocuments({ user: userId, role: 'user' });

    // Get conversations by topic
    const conversationsByTopic = await Conversation.aggregate([
      { $match: { user: user._id } },
      { $group: { _id: '$topic', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentMessages = await Message.countDocuments({
      user: userId,
      role: 'user',
      createdAt: { $gte: sevenDaysAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalConversations,
          totalMessages,
          currentStreak: user.learningStats.currentStreak,
          totalTimeSpent: user.learningStats.totalTimeSpent,
          topicProgress: Object.fromEntries(user.learningStats.topicProgress),
          conversationsByTopic,
          recentActivity: {
            last7Days: recentMessages
          }
        }
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics',
      error: error.message
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/user/account
// @access  Private
export const deleteUserAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Delete all user's messages
    await Message.deleteMany({ user: userId });

    // Delete all user's conversations
    await Conversation.deleteMany({ user: userId });

    // Delete user
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting account',
      error: error.message
    });
  }
};
