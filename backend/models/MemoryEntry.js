/**
 * MemoryEntry Model - Long-term Semantic Memory Storage
 * Stores consolidated memories with semantic embeddings for retrieval
 */

import mongoose from 'mongoose';

const memoryEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Memory Content
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },

  // Memory Type (hierarchical organization)
  type: {
    type: String,
    enum: ['fact', 'preference', 'experience', 'skill', 'goal', 'relationship', 'event'],
    required: true,
    index: true
  },

  // Namespace for hierarchical organization
  namespace: {
    category: {
      type: String,
      enum: ['personal', 'work', 'education', 'hobby', 'health', 'general'],
      default: 'general',
      index: true
    },
    subcategory: {
      type: String,
      maxlength: 50
    },
    topic: {
      type: String,
      maxlength: 100,
      index: true
    }
  },

  // Entities extracted from memory
  entities: [{
    type: { type: String }, // person, place, organization, skill, etc.
    value: { type: String },
    confidence: { type: Number, min: 0, max: 1 }
  }],

  // Temporal information
  temporal: {
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date, // For automatic memory decay
      index: true
    },
    timeContext: {
      type: String, // e.g., "2024-01", "today", "last week"
      maxlength: 50
    }
  },

  // Memory importance and decay
  importance: {
    score: {
      type: Number,
      default: 0.5,
      min: 0,
      max: 1,
      index: true
    },
    factors: {
      userMarked: { type: Boolean, default: false }, // User explicitly marked as important
      accessFrequency: { type: Number, default: 0 }, // How often accessed
      recency: { type: Number, default: 1.0 }, // Decay factor
      emotionalValence: { type: Number, default: 0 }, // -1 to 1
      contradictionCount: { type: Number, default: 0 } // How often contradicted
    },
    decayRate: {
      type: Number,
      default: 0.1, // Percentage decay per day
      min: 0,
      max: 1
    }
  },

  // Source tracking (provenance)
  source: {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      index: true
    },
    messageIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    }],
    extractionMethod: {
      type: String,
      enum: ['automatic', 'user_explicit', 'consolidated', 'inferred'],
      default: 'automatic'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.7
    }
  },

  // Semantic information for retrieval
  semantic: {
    embeddingId: {
      type: String, // ID in ChromaDB
      index: true
    },
    keywords: [{
      type: String,
      maxlength: 50
    }],
    relatedMemoryIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MemoryEntry'
    }],
    similarityThreshold: {
      type: Number,
      default: 0.7
    }
  },

  // Versioning for memory evolution
  version: {
    current: {
      type: Number,
      default: 1
    },
    history: [{
      version: Number,
      content: String,
      updatedAt: Date,
      reason: String // 'correction', 'refinement', 'consolidation'
    }]
  },

  // Status and lifecycle
  status: {
    type: String,
    enum: ['active', 'archived', 'deprecated', 'contradicted', 'consolidated'],
    default: 'active',
    index: true
  },

  // Privacy and compliance
  privacy: {
    level: {
      type: String,
      enum: ['public', 'private', 'sensitive', 'confidential'],
      default: 'private'
    },
    canShare: {
      type: Boolean,
      default: false
    },
    dataCategory: {
      type: String,
      enum: ['general', 'personal', 'health', 'financial', 'biometric', 'special'],
      default: 'general'
    },
    retentionPolicy: {
      type: String,
      enum: ['standard', 'extended', 'minimal', 'explicit_consent'],
      default: 'standard'
    },
    userConsent: {
      granted: { type: Boolean, default: true },
      grantedAt: Date
    }
  },

  // Access control
  accessControl: {
    readBy: [{
      type: String // 'user', 'admin', 'system', specific user IDs
    }],
    modifyBy: [{
      type: String
    }],
    deleteBy: [{
      type: String
    }]
  },

  // Audit trail
  audit: [{
    action: {
      type: String,
      enum: ['created', 'accessed', 'updated', 'consolidated', 'deprecated', 'deleted']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    actorId: String,
    details: mongoose.Schema.Types.Mixed
  }]
});

// Compound indexes for efficient queries
memoryEntrySchema.index({ userId: 1, 'namespace.category': 1, 'temporal.createdAt': -1 });
memoryEntrySchema.index({ userId: 1, type: 1, status: 1 });
memoryEntrySchema.index({ userId: 1, 'importance.score': -1, 'temporal.lastAccessedAt': -1 });
memoryEntrySchema.index({ userId: 1, 'source.conversationId': 1 });
memoryEntrySchema.index({ 'temporal.expiresAt': 1 }, { expireAfterSeconds: 0 }); // TTL index
memoryEntrySchema.index({ 'semantic.embeddingId': 1 });

// Update timestamps
memoryEntrySchema.pre('save', function(next) {
  this.temporal.updatedAt = Date.now();

  // Calculate and apply decay if needed
  if (this.importance.decayRate > 0) {
    const daysSinceCreated = (Date.now() - this.temporal.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const decayFactor = Math.exp(-this.importance.decayRate * daysSinceCreated);
    this.importance.factors.recency = decayFactor;
  }

  next();
});

// Method to mark memory as accessed
memoryEntrySchema.methods.markAccessed = function() {
  this.temporal.lastAccessedAt = Date.now();
  this.importance.factors.accessFrequency += 1;

  // Add audit entry
  this.audit.push({
    action: 'accessed',
    timestamp: Date.now()
  });

  return this.save();
};

// Method to calculate composite importance score
memoryEntrySchema.methods.calculateImportanceScore = function() {
  const weights = {
    userMarked: 0.3,
    accessFrequency: 0.25,
    recency: 0.25,
    emotionalValence: 0.1,
    confidenceScore: 0.1
  };

  const factors = this.importance.factors;

  // Normalize access frequency (log scale)
  const normalizedFrequency = Math.min(Math.log10(factors.accessFrequency + 1) / 2, 1);

  // Emotional valence contribution (absolute value)
  const emotionalContribution = Math.abs(factors.emotionalValence);

  const score =
    (factors.userMarked ? 1 : 0) * weights.userMarked +
    normalizedFrequency * weights.accessFrequency +
    factors.recency * weights.recency +
    emotionalContribution * weights.emotionalValence +
    this.source.confidence * weights.confidenceScore;

  this.importance.score = Math.max(0, Math.min(1, score));
  return this.importance.score;
};

// Method to check if memory should be forgotten
memoryEntrySchema.methods.shouldForget = function() {
  // Don't forget user-marked important memories
  if (this.importance.factors.userMarked) {
    return false;
  }

  // Calculate age in days
  const ageInDays = (Date.now() - this.temporal.createdAt.getTime()) / (1000 * 60 * 60 * 24);

  // Forget if:
  // 1. Importance score too low and old
  // 2. Not accessed in a long time
  // 3. Has expiration date that passed

  const isOldAndUnimportant = ageInDays > 90 && this.importance.score < 0.2;
  const notAccessedRecently = (Date.now() - this.temporal.lastAccessedAt.getTime()) > (60 * 24 * 60 * 60 * 1000); // 60 days
  const hasExpired = this.temporal.expiresAt && this.temporal.expiresAt < Date.now();

  return isOldAndUnimportant || notAccessedRecently || hasExpired;
};

// Static method to find memories by namespace
memoryEntrySchema.statics.findByNamespace = function(userId, category, subcategory = null, topic = null) {
  const query = {
    userId,
    'namespace.category': category,
    status: 'active'
  };

  if (subcategory) query['namespace.subcategory'] = subcategory;
  if (topic) query['namespace.topic'] = topic;

  return this.find(query).sort({ 'importance.score': -1, 'temporal.lastAccessedAt': -1 });
};

// Static method to find recent memories
memoryEntrySchema.statics.findRecent = function(userId, limit = 10) {
  return this.find({
    userId,
    status: 'active'
  })
  .sort({ 'temporal.createdAt': -1 })
  .limit(limit);
};

export default mongoose.model('MemoryEntry', memoryEntrySchema);
