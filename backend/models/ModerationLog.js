import mongoose from 'mongoose';

const moderationLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation'
  },
  message: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  originalPrompt: {
    type: String,
    required: true
  },
  violationType: {
    type: String,
    enum: [
      'illegal_activity',
      'medical_diagnosis',
      'legal_advice',
      'financial_advice',
      'harmful_content',
      'copyright_violation',
      'impersonation',
      'non_educational',
      'spam',
      'harassment',
      'self_harm',
      'inappropriate_content',
      'out_of_scope'
    ],
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  action: {
    type: String,
    enum: ['refused', 'redirected', 'flagged', 'educational_alternative'],
    required: true
  },
  refusalMessage: String,
  alternativeSuggestion: String,
  requiresHumanReview: {
    type: Boolean,
    default: false
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  reviewNotes: String,
  metadata: {
    ipAddress: String,
    userAgent: String,
    sessionId: String
  },
  automaticFlags: {
    keywords: [String],
    patterns: [String],
    confidenceScore: Number
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Index for efficient queries and analytics
moderationLogSchema.index({ user: 1, createdAt: -1 });
moderationLogSchema.index({ violationType: 1, severity: 1 });
moderationLogSchema.index({ requiresHumanReview: 1, reviewedAt: 1 });

// Check if user has repeated violations
moderationLogSchema.statics.checkRepeatedViolations = async function(userId, days = 7) {
  const dateThreshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const count = await this.countDocuments({
    user: userId,
    createdAt: { $gte: dateThreshold },
    severity: { $in: ['high', 'critical'] }
  });

  return {
    count,
    shouldFlag: count >= 3
  };
};

// Get violation statistics for analytics
moderationLogSchema.statics.getStatistics = async function(dateRange) {
  const match = dateRange ? { createdAt: { $gte: dateRange.start, $lte: dateRange.end } } : {};

  return await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$violationType',
        count: { $sum: 1 },
        highSeverity: {
          $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] }
        },
        criticalSeverity: {
          $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
        }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

export default mongoose.model('ModerationLog', moderationLogSchema);
