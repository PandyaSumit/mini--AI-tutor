/**
 * VoiceSession Model
 * Represents an active voice chat session with proper indexing
 */

import mongoose from 'mongoose';

const voiceSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    index: true
  },
  // Course structure linkage
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    index: true,
    default: null
  },
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    index: true,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'ended', 'paused'],
    default: 'active',
    index: true
  },
  language: {
    type: String,
    default: 'en-US'
  },
  isProcessing: {
    type: Boolean,
    default: false
  },
  settings: {
    sttMode: {
      type: String,
      enum: ['auto', 'browser', 'server'],
      default: 'auto'
    },
    ttsEnabled: {
      type: Boolean,
      default: true
    },
    autoSpeak: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      default: 'en-US'
    }
  },
  metadata: {
    totalMessages: {
      type: Number,
      default: 0
    },
    totalDuration: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0
    },
    sttProvider: {
      type: String,
      enum: ['browser', 'huggingface', 'openai', null],
      default: null
    }
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date
  },
  lastActivityAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
voiceSessionSchema.index({ userId: 1, status: 1 });
voiceSessionSchema.index({ userId: 1, createdAt: -1 });
voiceSessionSchema.index({ lastActivityAt: -1 });

// Update lastActivityAt on save
voiceSessionSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastActivityAt = new Date();
  }
  next();
});

// Instance methods

/**
 * Update session metadata
 */
voiceSessionSchema.methods.updateMetadata = async function(updates) {
  Object.assign(this.metadata, updates);
  this.lastActivityAt = new Date();
  return await this.save();
};

/**
 * End session
 */
voiceSessionSchema.methods.endSession = async function() {
  this.status = 'ended';
  this.endedAt = new Date();
  this.isProcessing = false;
  this.lastActivityAt = new Date();
  return await this.save();
};

/**
 * Update settings
 */
voiceSessionSchema.methods.updateSettings = async function(settings) {
  Object.assign(this.settings, settings);
  this.lastActivityAt = new Date();
  return await this.save();
};

// Static methods

/**
 * Find active session for user
 */
voiceSessionSchema.statics.findActiveSession = async function(userId) {
  return await this.findOne({
    userId,
    status: 'active'
  }).sort({ createdAt: -1 });
};

/**
 * Get session stats for user
 */
voiceSessionSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        totalMessages: { $sum: '$metadata.totalMessages' },
        totalDuration: { $sum: '$metadata.totalDuration' },
        avgResponseTime: { $avg: '$metadata.averageResponseTime' }
      }
    }
  ]);

  return stats[0] || {
    totalSessions: 0,
    totalMessages: 0,
    totalDuration: 0,
    avgResponseTime: 0
  };
};

const VoiceSession = mongoose.model('VoiceSession', voiceSessionSchema);

export default VoiceSession;
