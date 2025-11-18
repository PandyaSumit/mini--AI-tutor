/**
 * UserProfile Model - Consolidated User Information
 * Stores extracted and inferred user characteristics across conversations
 */

import mongoose from 'mongoose';

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },

  // Personal information (extracted from conversations)
  personal: {
    name: {
      value: String,
      confidence: { type: Number, min: 0, max: 1 },
      lastUpdated: Date,
      source: String
    },
    nickname: {
      value: String,
      confidence: { type: Number, min: 0, max: 1 }
    },
    role: {
      value: String, // e.g., "full stack developer", "student"
      confidence: { type: Number, min: 0, max: 1 },
      lastUpdated: Date
    },
    location: {
      city: String,
      country: String,
      timezone: String,
      confidence: { type: Number, min: 0, max: 1 }
    },
    languages: [{
      language: String,
      proficiency: {
        type: String,
        enum: ['native', 'fluent', 'intermediate', 'beginner']
      },
      confidence: { type: Number, min: 0, max: 1 }
    }]
  },

  // Professional information
  professional: {
    occupation: String,
    industry: String,
    skills: [{
      name: String,
      level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert']
      },
      confidence: { type: Number, min: 0, max: 1 },
      lastMentioned: Date
    }],
    currentRole: String,
    company: String,
    yearsOfExperience: Number
  },

  // Learning profile
  learning: {
    goals: [{
      goal: String,
      category: String,
      priority: {
        type: String,
        enum: ['high', 'medium', 'low']
      },
      status: {
        type: String,
        enum: ['active', 'completed', 'paused', 'abandoned']
      },
      createdAt: Date,
      targetDate: Date
    }],
    interests: [{
      topic: String,
      category: String,
      strength: { type: Number, min: 0, max: 1 }, // How interested
      expertise: { type: Number, min: 0, max: 1 }, // How knowledgeable
      lastDiscussed: Date
    }],
    learningStyle: {
      preferredFormat: {
        type: String,
        enum: ['visual', 'auditory', 'reading', 'kinesthetic', 'mixed']
      },
      pace: {
        type: String,
        enum: ['fast', 'moderate', 'slow']
      },
      depth: {
        type: String,
        enum: ['overview', 'balanced', 'detailed', 'comprehensive']
      }
    },
    currentCourses: [{
      courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
      },
      enrolledAt: Date,
      progress: Number
    }]
  },

  // Preferences and behavior patterns
  preferences: {
    communication: {
      formality: {
        type: String,
        enum: ['very_formal', 'formal', 'neutral', 'casual', 'very_casual']
      },
      length: {
        type: String,
        enum: ['brief', 'moderate', 'detailed', 'comprehensive']
      },
      tone: {
        type: String,
        enum: ['professional', 'friendly', 'encouraging', 'direct', 'humorous']
      },
      preferredLanguage: String
    },
    interactionStyle: {
      questioningFrequency: {
        type: String,
        enum: ['rarely', 'occasionally', 'frequently', 'constantly']
      },
      examplePreference: {
        type: String,
        enum: ['few', 'balanced', 'many']
      },
      feedbackStyle: {
        type: String,
        enum: ['minimal', 'moderate', 'detailed']
      }
    },
    topics: {
      favorites: [String],
      avoid: [String]
    },
    timing: {
      activeHours: [{
        start: Number, // 0-23
        end: Number
      }],
      timezone: String,
      preferredSessionLength: Number // minutes
    }
  },

  // Behavioral patterns (inferred from usage)
  behavioral: {
    engagement: {
      totalConversations: { type: Number, default: 0 },
      totalMessages: { type: Number, default: 0 },
      averageSessionLength: { type: Number, default: 0 }, // minutes
      longestStreak: { type: Number, default: 0 }, // days
      currentStreak: { type: Number, default: 0 },
      lastActiveAt: Date
    },
    patterns: {
      peakActiveHours: [Number], // Hours user is most active
      averageMessagesPerSession: Number,
      topicDiversity: Number, // 0-1, how varied their interests are
      questionToStatementRatio: Number,
      averageResponseTime: Number // seconds
    },
    satisfaction: {
      helpfulRatings: { type: Number, default: 0 },
      unhelpfulRatings: { type: Number, default: 0 },
      bookmarks: { type: Number, default: 0 },
      satisfactionScore: { type: Number, default: 0.5, min: 0, max: 1 }
    }
  },

  // Relationship and context
  relationships: {
    mentionedPeople: [{
      name: String,
      relationship: String, // e.g., "colleague", "friend", "manager"
      context: String,
      firstMentioned: Date,
      lastMentioned: Date
    }],
    mentionedOrganizations: [{
      name: String,
      relationship: String, // e.g., "employer", "client", "school"
      context: String,
      firstMentioned: Date
    }]
  },

  // Psychological and emotional profile
  psychometric: {
    personality: {
      traits: [{
        trait: String, // e.g., "curious", "analytical", "patient"
        strength: { type: Number, min: 0, max: 1 },
        evidence: [String] // References to conversations
      }]
    },
    emotionalPatterns: {
      commonEmotions: [{
        emotion: String,
        frequency: Number
      }],
      stressTriggers: [String],
      motivations: [String]
    },
    cognitiveSty: {
      thinkingStyle: {
        type: String,
        enum: ['analytical', 'intuitive', 'practical', 'creative', 'mixed']
      },
      decisionMaking: {
        type: String,
        enum: ['quick', 'deliberate', 'collaborative', 'data_driven']
      }
    }
  },

  // Memory statistics and metadata
  meta: {
    profileCompleteness: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    totalMemories: {
      type: Number,
      default: 0
    },
    memoryDistribution: {
      facts: { type: Number, default: 0 },
      preferences: { type: Number, default: 0 },
      experiences: { type: Number, default: 0 },
      skills: { type: Number, default: 0 },
      goals: { type: Number, default: 0 }
    },
    dataQuality: {
      averageConfidence: { type: Number, default: 0.5 },
      contradictions: { type: Number, default: 0 },
      verifiedFacts: { type: Number, default: 0 }
    },
    privacySettings: {
      allowAnalytics: { type: Boolean, default: true },
      allowPersonalization: { type: Boolean, default: true },
      dataRetentionDays: { type: Number, default: 365 }
    }
  },

  // Version control
  version: {
    type: Number,
    default: 1
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps
userProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.meta.lastUpdated = Date.now();
  next();
});

// Method to calculate profile completeness
userProfileSchema.methods.calculateCompleteness = function() {
  let score = 0;
  let total = 0;

  // Personal (20%)
  if (this.personal.name?.value) score += 5;
  if (this.personal.role?.value) score += 5;
  if (this.personal.location?.city) score += 5;
  if (this.personal.languages?.length > 0) score += 5;
  total += 20;

  // Professional (15%)
  if (this.professional.occupation) score += 5;
  if (this.professional.skills?.length > 0) score += 5;
  if (this.professional.industry) score += 5;
  total += 15;

  // Learning (25%)
  if (this.learning.goals?.length > 0) score += 8;
  if (this.learning.interests?.length > 0) score += 8;
  if (this.learning.learningStyle?.preferredFormat) score += 4;
  if (this.learning.currentCourses?.length > 0) score += 5;
  total += 25;

  // Preferences (20%)
  if (this.preferences.communication?.formality) score += 5;
  if (this.preferences.communication?.length) score += 5;
  if (this.preferences.interactionStyle?.examplePreference) score += 5;
  if (this.preferences.topics?.favorites?.length > 0) score += 5;
  total += 20;

  // Behavioral (20%)
  if (this.behavioral.engagement?.totalConversations > 5) score += 10;
  if (this.behavioral.patterns?.topicDiversity > 0) score += 5;
  if (this.behavioral.satisfaction?.helpfulRatings > 0) score += 5;
  total += 20;

  this.meta.profileCompleteness = score / total;
  return this.meta.profileCompleteness;
};

// Method to update engagement metrics
userProfileSchema.methods.updateEngagement = function(sessionData) {
  this.behavioral.engagement.totalConversations += 1;
  this.behavioral.engagement.totalMessages += sessionData.messageCount || 0;
  this.behavioral.engagement.lastActiveAt = Date.now();

  if (sessionData.sessionLength) {
    const currentAvg = this.behavioral.engagement.averageSessionLength || 0;
    const count = this.behavioral.engagement.totalConversations;
    this.behavioral.engagement.averageSessionLength =
      (currentAvg * (count - 1) + sessionData.sessionLength) / count;
  }

  return this.save();
};

// Method to add or update interest
userProfileSchema.methods.updateInterest = function(topic, category, increase = true) {
  const existing = this.learning.interests.find(i => i.topic === topic);

  if (existing) {
    existing.strength = Math.max(0, Math.min(1, existing.strength + (increase ? 0.1 : -0.1)));
    existing.lastDiscussed = Date.now();
  } else {
    this.learning.interests.push({
      topic,
      category: category || 'general',
      strength: 0.5,
      expertise: 0.1,
      lastDiscussed: Date.now()
    });
  }

  return this.save();
};

// Static method to find profiles needing update
userProfileSchema.statics.findStale = function(daysOld = 30) {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  return this.find({
    'meta.lastUpdated': { $lt: cutoffDate }
  });
};

// Export
export default mongoose.model('UserProfile', userProfileSchema);
