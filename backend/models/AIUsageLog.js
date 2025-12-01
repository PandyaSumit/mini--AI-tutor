import mongoose from 'mongoose';

/**
 * AIUsageLog Model
 * Tracks detailed AI usage for quota management and cost tracking
 */

const aiUsageLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  usageType: {
    type: String,
    enum: ['chat_message', 'voice_session', 'course_generation', 'flashcard_generation', 'roadmap_generation'],
    required: true,
    index: true
  },

  // Resource consumption
  tokensUsed: {
    type: Number,
    default: 0
  },

  minutesUsed: {
    type: Number,
    default: 0 // For voice sessions
  },

  estimatedCost: {
    type: Number,
    default: 0 // USD
  },

  // Context
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null
  },

  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    default: null
  },

  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    default: null
  },

  roadmapId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Roadmap',
    default: null
  },

  // Metadata
  model: {
    type: String,
    default: null // e.g., 'gpt-4', 'whisper', 'claude-3'
  },

  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },

  // Quota tracking
  quotaStatus: {
    type: String,
    enum: ['within_quota', 'over_quota', 'unlimited'],
    default: 'within_quota'
  },

  chargeableToUser: {
    type: Boolean,
    default: true
  },

  // Additional metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
aiUsageLogSchema.index({ user: 1, timestamp: -1 });
aiUsageLogSchema.index({ user: 1, usageType: 1, timestamp: -1 });
aiUsageLogSchema.index({ timestamp: -1 }); // For cleanup/archival

// Static method: Get usage summary for user in date range
aiUsageLogSchema.statics.getUserUsageSummary = async function(userId, startDate, endDate) {
  const summary = await this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$usageType',
        count: { $sum: 1 },
        totalTokens: { $sum: '$tokensUsed' },
        totalMinutes: { $sum: '$minutesUsed' },
        totalCost: { $sum: '$estimatedCost' }
      }
    }
  ]);

  // Convert to object for easier access
  const result = {
    chat_message: { count: 0, totalTokens: 0, totalCost: 0 },
    voice_session: { count: 0, totalMinutes: 0, totalCost: 0 },
    course_generation: { count: 0, totalTokens: 0, totalCost: 0 },
    flashcard_generation: { count: 0, totalTokens: 0, totalCost: 0 },
    roadmap_generation: { count: 0, totalTokens: 0, totalCost: 0 },
    total: { count: 0, totalCost: 0 }
  };

  summary.forEach(item => {
    result[item._id] = {
      count: item.count,
      totalTokens: item.totalTokens || 0,
      totalMinutes: item.totalMinutes || 0,
      totalCost: item.totalCost
    };

    result.total.count += item.count;
    result.total.totalCost += item.totalCost;
  });

  return result;
};

// Static method: Track usage
aiUsageLogSchema.statics.trackUsage = async function(data) {
  const {
    userId,
    usageType,
    tokensUsed = 0,
    minutesUsed = 0,
    estimatedCost = 0,
    courseId = null,
    sessionId = null,
    conversationId = null,
    roadmapId = null,
    model = null,
    quotaStatus = 'within_quota',
    metadata = {}
  } = data;

  return this.create({
    user: userId,
    usageType,
    tokensUsed,
    minutesUsed,
    estimatedCost,
    courseId,
    sessionId,
    conversationId,
    roadmapId,
    model,
    quotaStatus,
    metadata
  });
};

// Static method: Get daily usage for user
aiUsageLogSchema.statics.getDailyUsage = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
        },
        count: { $sum: 1 },
        totalCost: { $sum: '$estimatedCost' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

// Static method: Get total platform usage
aiUsageLogSchema.statics.getPlatformUsage = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: null,
        totalUsers: { $addToSet: '$user' },
        totalRequests: { $sum: 1 },
        totalTokens: { $sum: '$tokensUsed' },
        totalMinutes: { $sum: '$minutesUsed' },
        totalCost: { $sum: '$estimatedCost' }
      }
    },
    {
      $project: {
        _id: 0,
        totalUsers: { $size: '$totalUsers' },
        totalRequests: 1,
        totalTokens: 1,
        totalMinutes: 1,
        totalCost: 1
      }
    }
  ]);
};

// Auto-delete old logs (older than 12 months)
aiUsageLogSchema.statics.cleanupOldLogs = async function() {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - 12);

  const result = await this.deleteMany({
    timestamp: { $lt: cutoffDate }
  });

  console.log(`🧹 Cleaned up ${result.deletedCount} old AI usage logs`);
  return result;
};

export default mongoose.model('AIUsageLog', aiUsageLogSchema);
