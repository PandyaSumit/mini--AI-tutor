import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  thumbnail: {
    type: String,
    default: null // URL to thumbnail image
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contributors: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    contributionType: {
      type: String,
      enum: ['founder', 'co-creator', 'content_improver', 'reviewer'],
      default: 'co-creator'
    },
    contributionDate: {
      type: Date,
      default: Date.now
    },
    contributionScore: {
      type: Number,
      default: 0
    },
    revenueShare: {
      type: Number,
      default: 0, // Percentage (0-100)
      min: 0,
      max: 100
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    }
  }],
  embedding: {
    type: [Number],
    default: null // 384-dimensional vector from BGE-small
  },
  specializationType: {
    type: String,
    enum: ['general', 'niche', 'audience-specific', 'advanced'],
    default: 'general'
  },
  specializationJustification: {
    type: String,
    maxlength: 1000,
    default: null
  },
  parentCourse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null // Set if this is a specialized version
  },
  qualityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isDraft: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    enum: ['programming', 'mathematics', 'science', 'language', 'business', 'design', 'other'],
    default: 'other'
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date,
    default: null
  },
  statistics: {
    totalModules: {
      type: Number,
      default: 0
    },
    totalLessons: {
      type: Number,
      default: 0
    },
    totalDuration: {
      type: Number,
      default: 0 // in minutes
    },
    enrollmentCount: {
      type: Number,
      default: 0
    },
    completionCount: {
      type: Number,
      default: 0
    }
  },
  metadata: {
    language: {
      type: String,
      default: 'en-US'
    },
    estimatedDuration: {
      type: Number,
      default: 0 // in hours
    },
    prerequisites: [{
      type: String
    }],
    learningOutcomes: [{
      type: String
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Update updatedAt on save
courseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for efficient queries
courseSchema.index({ instructor: 1, isPublished: 1, createdAt: -1 });
courseSchema.index({ category: 1, level: 1, isPublished: 1 });
courseSchema.index({ tags: 1 });
courseSchema.index({ 'statistics.enrollmentCount': -1 });

// Virtual for modules
courseSchema.virtual('modules', {
  ref: 'Module',
  localField: '_id',
  foreignField: 'course'
});

// Method to publish course
courseSchema.methods.publish = function() {
  this.isPublished = true;
  this.publishedAt = new Date();
  return this.save();
};

// Method to update statistics
courseSchema.methods.updateStatistics = async function() {
  const Module = mongoose.model('Module');
  const modules = await Module.find({ course: this._id });

  this.statistics.totalModules = modules.length;

  let totalLessons = 0;
  let totalDuration = 0;

  for (const module of modules) {
    const Lesson = mongoose.model('Lesson');
    const lessons = await Lesson.find({ module: module._id });
    totalLessons += lessons.length;
    totalDuration += lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0);
  }

  this.statistics.totalLessons = totalLessons;
  this.statistics.totalDuration = totalDuration;

  return this.save();
};

// Method to add contributor with revenue sharing
courseSchema.methods.addContributor = function(userId, contributionType = 'co-creator', revenueShare = 0) {
  // Check if user is already a contributor
  const existingContributor = this.contributors.find(
    c => c.user.toString() === userId.toString()
  );

  if (!existingContributor) {
    this.contributors.push({
      user: userId,
      contributionType,
      contributionDate: new Date(),
      contributionScore: 0,
      revenueShare: revenueShare,
      approvalStatus: 'approved',
      approvedBy: this.createdBy,
      approvedAt: new Date()
    });
    return this.save();
  } else {
    // Update existing contributor's revenue share if higher
    if (revenueShare > existingContributor.revenueShare) {
      existingContributor.revenueShare = revenueShare;
      return this.save();
    }
  }

  return Promise.resolve(this);
};

// Method to get the course founder
courseSchema.methods.getFounder = function() {
  const founder = this.contributors.find(c => c.contributionType === 'founder');
  return founder ? founder.user : this.createdBy;
};

// Method to check if user can contribute
courseSchema.methods.canUserContribute = function(userId) {
  // Creator can always contribute
  if (this.createdBy.toString() === userId.toString()) {
    return true;
  }

  // Check if user is already an approved contributor
  const isContributor = this.contributors.some(
    c => c.user.toString() === userId.toString() && c.approvalStatus === 'approved'
  );

  return isContributor;
};

// Method to check if course meets quality standards for publishing
courseSchema.methods.meetsQualityStandards = function() {
  // Requirements:
  // - At least 3 modules
  // - At least 12 total lessons (3 modules × 4 lessons minimum)
  // - Quality score >= 50
  const hasMinModules = this.statistics.totalModules >= 3;
  const hasMinLessons = this.statistics.totalLessons >= 12;
  const meetsQualityScore = this.qualityScore >= 50;

  return hasMinModules && hasMinLessons && meetsQualityScore;
};

// Static method to find published courses
courseSchema.statics.findPublished = function(filters = {}) {
  return this.find({ isPublished: true, ...filters }).sort({ 'statistics.enrollmentCount': -1 });
};

// Calculate revenue distribution among contributors
courseSchema.methods.calculateRevenueDistribution = function(totalRevenue) {
  const distribution = {};

  this.contributors.forEach(contributor => {
    if (contributor.approvalStatus === 'approved' && contributor.revenueShare > 0) {
      const userId = contributor.user.toString();
      const amount = (totalRevenue * contributor.revenueShare) / 100;

      if (!distribution[userId]) {
        distribution[userId] = {
          userId: contributor.user,
          type: contributor.contributionType,
          share: contributor.revenueShare,
          amount: 0
        };
      }

      distribution[userId].amount += amount;
    }
  });

  return Object.values(distribution);
};

// Calculate contribution-based revenue share for new co-creator
courseSchema.methods.calculateCoCreatorRevenue = async function(userId) {
  // Base share for co-creators: 10-20%
  // Calculated based on:
  // - Content added (lessons, modules)
  // - Quality ratings
  // - Student engagement with their content

  const Lesson = mongoose.model('Lesson');
  const Module = mongoose.model('Module');

  // Count lessons created by this user
  const lessonsCreated = await Lesson.countDocuments({
    course: this._id,
    createdBy: userId
  });

  // Count modules created by this user
  const modulesCreated = await Module.countDocuments({
    course: this._id,
    createdBy: userId
  });

  // Calculate contribution percentage
  const totalLessons = this.statistics.totalLessons || 1;
  const totalModules = this.statistics.totalModules || 1;

  const lessonContribution = lessonsCreated / totalLessons;
  const moduleContribution = modulesCreated / totalModules;

  // Average contribution
  const avgContribution = (lessonContribution + moduleContribution) / 2;

  // Map to 10-20% range
  const revenueShare = Math.min(Math.max(10 + (avgContribution * 10), 10), 20);

  return Math.round(revenueShare * 10) / 10; // Round to 1 decimal
};

// Calculate contributor revenue share based on implementations
courseSchema.methods.calculateContributorRevenue = function(implementationsCount) {
  // Contributors earn 2-5% based on number of implemented suggestions
  // 1-2 implementations: 2%
  // 3-5 implementations: 3%
  // 6-10 implementations: 4%
  // 11+ implementations: 5%

  if (implementationsCount >= 11) return 5;
  if (implementationsCount >= 6) return 4;
  if (implementationsCount >= 3) return 3;
  return 2;
};

// Adjust revenue shares to ensure total doesn't exceed 100%
courseSchema.methods.normalizeRevenueShares = function() {
  const totalShare = this.contributors.reduce((sum, c) => sum + (c.revenueShare || 0), 0);

  if (totalShare > 100) {
    // Proportionally reduce all shares
    const factor = 100 / totalShare;
    this.contributors.forEach(contributor => {
      if (contributor.revenueShare > 0) {
        contributor.revenueShare = Math.round(contributor.revenueShare * factor * 10) / 10;
      }
    });
  }

  return this.save();
};

// Get founder's current revenue share
courseSchema.methods.getFounderRevenue = function() {
  const founder = this.contributors.find(c => c.contributionType === 'founder');
  return founder ? founder.revenueShare : 0;
};

// Update founder's revenue based on co-creators
courseSchema.methods.updateFounderRevenue = function() {
  const founder = this.contributors.find(c => c.contributionType === 'founder');
  if (!founder) return;

  // Founder gets 50-60% base, reduced as co-creators are added
  const coCreatorCount = this.contributors.filter(
    c => c.contributionType === 'co-creator' && c.approvalStatus === 'approved'
  ).length;

  // Start at 60%, reduce by 2% per co-creator (min 50%)
  const founderShare = Math.max(60 - (coCreatorCount * 2), 50);

  founder.revenueShare = founderShare;
  return this.save();
};

export default mongoose.model('Course', courseSchema);
