import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  avatar: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['learner', 'verified_instructor', 'platform_author', 'admin'],
    default: 'learner'
  },
  learningStats: {
    totalConversations: {
      type: Number,
      default: 0
    },
    totalMessages: {
      type: Number,
      default: 0
    },
    totalTimeSpent: {
      type: Number,
      default: 0 // in minutes
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    lastActiveDate: {
      type: Date,
      default: null
    },
    topicProgress: {
      type: Map,
      of: Number,
      default: {}
    }
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    language: {
      type: String,
      default: 'en'
    },
    notifications: {
      type: Boolean,
      default: true
    }
  },
  reputation: {
    score: {
      type: Number,
      default: 0,
      min: 0
    },
    coursesCreated: {
      type: Number,
      default: 0
    },
    coursesCoCreated: {
      type: Number,
      default: 0
    },
    improvementsImplemented: {
      type: Number,
      default: 0
    },
    totalStudents: {
      type: Number,
      default: 0
    },
    averageCourseRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    badges: [{
      type: String,
      enum: ['founder', 'co-creator', 'expert', 'prolific', 'quality', 'helpful']
    }]
  },
  subscription: {
    tier: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired'],
      default: 'active'
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    }
  },
  contributorActivity: {
    errorReports: {
      type: Number,
      default: 0
    },
    suggestionsSubmitted: {
      type: Number,
      default: 0
    },
    suggestionsImplemented: {
      type: Number,
      default: 0
    },
    questionsAsked: {
      type: Number,
      default: 0
    },
    forumParticipation: {
      type: Number,
      default: 0
    },
    qualityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lastContributionDate: {
      type: Date,
      default: null
    },
    invitedToContribute: {
      type: Boolean,
      default: false
    },
    invitedAt: {
      type: Date,
      default: null
    }
  },
  // Instructor Verification System
  instructorVerification: {
    status: {
      type: String,
      enum: ['not_applied', 'pending', 'approved', 'rejected'],
      default: 'not_applied'
    },
    appliedAt: {
      type: Date,
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    rejectedAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      default: null
    },

    // KYC/Age Verification
    kycStatus: {
      type: String,
      enum: ['not_submitted', 'pending', 'verified', 'failed'],
      default: 'not_submitted'
    },
    kycProvider: {
      type: String,
      default: null // e.g., 'stripe_identity', 'manual'
    },
    kycVerifiedAt: {
      type: Date,
      default: null
    },
    dateOfBirth: {
      type: Date,
      default: null
    },
    age: {
      type: Number,
      default: null
    },

    // Subject Expertise
    expertiseAreas: [{
      subject: String,
      category: String,
      verificationMethod: {
        type: String,
        enum: ['quiz', 'portfolio', 'certification', 'manual_review']
      },
      verificationScore: Number,
      verifiedAt: Date
    }],

    // Portfolio/Credentials
    portfolio: {
      bio: {
        type: String,
        maxlength: 2000,
        default: null
      },
      professionalTitle: {
        type: String,
        maxlength: 200,
        default: null
      },
      yearsOfExperience: {
        type: Number,
        default: 0
      },
      certifications: [{
        name: String,
        issuer: String,
        url: String,
        verifiedAt: Date
      }],
      socialLinks: {
        linkedin: String,
        github: String,
        website: String
      }
    },

    // Terms acceptance
    termsAcceptedAt: {
      type: Date,
      default: null
    },
    termsVersion: {
      type: String,
      default: null
    }
  },

  // AI Usage Tracking
  aiUsage: {
    currentPeriodStart: {
      type: Date,
      default: () => new Date()
    },
    currentPeriodEnd: {
      type: Date,
      default: () => {
        const date = new Date();
        date.setMonth(date.getMonth() + 1);
        return date;
      }
    },

    // Monthly quotas
    quotas: {
      chatMessages: {
        limit: {
          type: Number,
          default: 100 // Learner default
        },
        used: {
          type: Number,
          default: 0
        },
        overage: {
          type: Number,
          default: 0
        }
      },
      voiceMinutes: {
        limit: {
          type: Number,
          default: 30 // Learner default
        },
        used: {
          type: Number,
          default: 0
        },
        overage: {
          type: Number,
          default: 0
        }
      },
      courseGenerations: {
        limit: {
          type: Number,
          default: 3 // Learner default
        },
        used: {
          type: Number,
          default: 0
        },
        overage: {
          type: Number,
          default: 0
        }
      }
    },

    // Historical tracking
    totalMessagesAllTime: {
      type: Number,
      default: 0
    },
    totalVoiceMinutesAllTime: {
      type: Number,
      default: 0
    },
    totalCoursesGenerated: {
      type: Number,
      default: 0
    },

    // Cost tracking
    estimatedCost: {
      type: Number,
      default: 0
    },
    lastResetAt: {
      type: Date,
      default: () => new Date()
    }
  },

  // Instructor Earnings
  earnings: {
    totalEarned: {
      type: Number,
      default: 0
    },
    availableBalance: {
      type: Number,
      default: 0
    },
    pendingBalance: {
      type: Number,
      default: 0
    },
    totalWithdrawn: {
      type: Number,
      default: 0
    },

    // Payout info
    payoutMethod: {
      type: String,
      enum: ['stripe', 'paypal', 'bank_transfer', null],
      default: null
    },
    payoutDetails: {
      type: Map,
      of: String,
      default: new Map()
    },

    nextPayoutDate: {
      type: Date,
      default: null
    },
    lastPayoutDate: {
      type: Date,
      default: null
    }
  },

  isVerified: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Update updatedAt timestamp
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Update learning stats method
userSchema.methods.updateLearningStats = function(updates) {
  Object.keys(updates).forEach(key => {
    if (this.learningStats[key] !== undefined) {
      this.learningStats[key] = updates[key];
    }
  });
  return this.save();
};

// Calculate and update streak
userSchema.methods.updateStreak = function() {
  const today = new Date().setHours(0, 0, 0, 0);
  const lastActive = this.learningStats.lastActiveDate
    ? new Date(this.learningStats.lastActiveDate).setHours(0, 0, 0, 0)
    : null;

  if (!lastActive) {
    this.learningStats.currentStreak = 1;
  } else {
    const daysDiff = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      // Same day, no change
      return;
    } else if (daysDiff === 1) {
      // Consecutive day, increment streak
      this.learningStats.currentStreak += 1;
    } else {
      // Streak broken, reset
      this.learningStats.currentStreak = 1;
    }
  }

  this.learningStats.lastActiveDate = new Date();
};

// Check if user can create specialized course
userSchema.methods.canCreateSpecializedCourse = function() {
  // Requires Pro subscription OR reputation score >= 100
  const hasProSubscription = this.subscription.tier === 'pro' && this.subscription.status === 'active';
  const hasReputationRequirement = this.reputation.score >= 100;

  return hasProSubscription || hasReputationRequirement;
};

// Award reputation points
userSchema.methods.awardReputation = function(points, reason) {
  this.reputation.score += points;

  // Award badges based on achievements
  if (this.reputation.coursesCreated >= 1 && !this.reputation.badges.includes('founder')) {
    this.reputation.badges.push('founder');
  }
  if (this.reputation.coursesCoCreated >= 3 && !this.reputation.badges.includes('co-creator')) {
    this.reputation.badges.push('co-creator');
  }
  if (this.reputation.coursesCreated + this.reputation.coursesCoCreated >= 10 && !this.reputation.badges.includes('prolific')) {
    this.reputation.badges.push('prolific');
  }
  if (this.reputation.improvementsImplemented >= 10 && !this.reputation.badges.includes('helpful')) {
    this.reputation.badges.push('helpful');
  }
  if (this.reputation.averageCourseRating >= 4.5 && !this.reputation.badges.includes('quality')) {
    this.reputation.badges.push('quality');
  }
  if (this.reputation.score >= 500 && !this.reputation.badges.includes('expert')) {
    this.reputation.badges.push('expert');
  }

  return this.save();
};

// Check if student should be invited to become contributor
userSchema.methods.shouldBeInvitedAsContributor = function() {
  // Don't invite if already invited
  if (this.contributorActivity.invitedToContribute) {
    return false;
  }

  // Calculate quality score based on activity
  const errorReportWeight = 2;
  const suggestionWeight = 3;
  const questionWeight = 1;
  const forumWeight = 1.5;

  const totalActivity =
    (this.contributorActivity.errorReports * errorReportWeight) +
    (this.contributorActivity.suggestionsSubmitted * suggestionWeight) +
    (this.contributorActivity.questionsAsked * questionWeight) +
    (this.contributorActivity.forumParticipation * forumWeight);

  // Criteria: High quality activity
  const hasEnoughActivity = totalActivity >= 50;
  const hasGoodImplementationRate =
    this.contributorActivity.suggestionsSubmitted > 0 &&
    (this.contributorActivity.suggestionsImplemented / this.contributorActivity.suggestionsSubmitted) >= 0.3;

  return hasEnoughActivity || hasGoodImplementationRate;
};

// Update contributor quality score
userSchema.methods.updateContributorQuality = function() {
  const implemented = this.contributorActivity.suggestionsImplemented;
  const submitted = this.contributorActivity.suggestionsSubmitted;
  const errors = this.contributorActivity.errorReports;

  // Quality score = implementation rate * 60 + error reports * 20 + activity * 20
  let score = 0;

  if (submitted > 0) {
    score += (implemented / submitted) * 60;
  }

  score += Math.min(errors * 2, 20);
  score += Math.min((this.contributorActivity.forumParticipation / 10) * 20, 20);

  this.contributorActivity.qualityScore = Math.min(Math.round(score), 100);
  return this.save();
};

// Record contribution activity
userSchema.methods.recordContribution = function(type) {
  this.contributorActivity.lastContributionDate = new Date();

  switch(type) {
    case 'error_report':
      this.contributorActivity.errorReports += 1;
      this.awardReputation(5, 'error_report');
      break;
    case 'suggestion':
      this.contributorActivity.suggestionsSubmitted += 1;
      this.awardReputation(10, 'suggestion_submitted');
      break;
    case 'suggestion_implemented':
      this.contributorActivity.suggestionsImplemented += 1;
      this.reputation.improvementsImplemented += 1;
      this.awardReputation(50, 'suggestion_implemented');
      break;
    case 'question':
      this.contributorActivity.questionsAsked += 1;
      break;
    case 'forum':
      this.contributorActivity.forumParticipation += 1;
      this.awardReputation(2, 'forum_participation');
      break;
  }

  return this.updateContributorQuality();
};

// ==========================================
// NEW: Dual-Layer System Methods
// ==========================================

// Check if user can create marketplace courses
userSchema.methods.canCreateMarketplaceCourse = function() {
  return this.role === 'verified_instructor' ||
         this.role === 'platform_author' ||
         this.role === 'admin';
};

// Check if user can publish courses publicly
userSchema.methods.canPublishCourse = function() {
  return this.canCreateMarketplaceCourse();
};

// Get AI usage quotas based on role
userSchema.methods.getAIQuotas = function() {
  const quotasByRole = {
    learner: {
      chatMessages: 100,
      voiceMinutes: 30,
      courseGenerations: 3
    },
    verified_instructor: {
      chatMessages: 1000,
      voiceMinutes: 300,
      courseGenerations: 20
    },
    platform_author: {
      chatMessages: Infinity,
      voiceMinutes: Infinity,
      courseGenerations: Infinity
    },
    admin: {
      chatMessages: Infinity,
      voiceMinutes: Infinity,
      courseGenerations: Infinity
    }
  };

  return quotasByRole[this.role] || quotasByRole.learner;
};

// Update AI usage quotas based on role
userSchema.methods.updateAIQuotasForRole = function() {
  const quotas = this.getAIQuotas();

  this.aiUsage.quotas.chatMessages.limit = quotas.chatMessages;
  this.aiUsage.quotas.voiceMinutes.limit = quotas.voiceMinutes;
  this.aiUsage.quotas.courseGenerations.limit = quotas.courseGenerations;

  return this.save();
};

// Check if user has AI usage quota available
userSchema.methods.hasAIQuota = function(type) {
  const quota = this.aiUsage.quotas[type];

  if (!quota) return false;
  if (quota.limit === Infinity) return true;

  return quota.used < quota.limit;
};

// Consume AI usage quota
userSchema.methods.consumeAIQuota = function(type, amount = 1) {
  const quota = this.aiUsage.quotas[type];

  if (!quota) {
    throw new Error(`Invalid quota type: ${type}`);
  }

  // Unlimited quota
  if (quota.limit === Infinity) {
    return this.save();
  }

  quota.used += amount;

  // Track overage
  if (quota.used > quota.limit) {
    quota.overage = quota.used - quota.limit;
  }

  // Update all-time tracking
  if (type === 'chatMessages') {
    this.aiUsage.totalMessagesAllTime += amount;
  } else if (type === 'voiceMinutes') {
    this.aiUsage.totalVoiceMinutesAllTime += amount;
  } else if (type === 'courseGenerations') {
    this.aiUsage.totalCoursesGenerated += amount;
  }

  return this.save();
};

// Reset monthly AI usage quota
userSchema.methods.resetAIQuota = function() {
  const now = new Date();

  // Check if period has ended
  if (now < this.aiUsage.currentPeriodEnd) {
    return Promise.resolve(this);
  }

  // Reset usage
  this.aiUsage.quotas.chatMessages.used = 0;
  this.aiUsage.quotas.chatMessages.overage = 0;
  this.aiUsage.quotas.voiceMinutes.used = 0;
  this.aiUsage.quotas.voiceMinutes.overage = 0;
  this.aiUsage.quotas.courseGenerations.used = 0;
  this.aiUsage.quotas.courseGenerations.overage = 0;

  // Set new period
  this.aiUsage.currentPeriodStart = now;
  const nextPeriod = new Date(now);
  nextPeriod.setMonth(nextPeriod.getMonth() + 1);
  this.aiUsage.currentPeriodEnd = nextPeriod;
  this.aiUsage.lastResetAt = now;

  return this.save();
};

// Calculate age from date of birth
userSchema.methods.calculateAge = function() {
  if (!this.instructorVerification.dateOfBirth) {
    return null;
  }

  const today = new Date();
  const birthDate = new Date(this.instructorVerification.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  this.instructorVerification.age = age;
  return age;
};

// Check if user meets instructor requirements
userSchema.methods.meetsInstructorRequirements = function() {
  const age = this.calculateAge();

  return {
    ageVerified: age !== null && age >= 18,
    kycVerified: this.instructorVerification.kycStatus === 'verified',
    hasExpertise: this.instructorVerification.expertiseAreas.length > 0,
    termsAccepted: !!this.instructorVerification.termsAcceptedAt,
    allMet: function() {
      return this.ageVerified && this.kycVerified && this.hasExpertise && this.termsAccepted;
    }
  };
};

// Approve instructor application
userSchema.methods.approveAsInstructor = function() {
  const requirements = this.meetsInstructorRequirements();

  if (!requirements.allMet()) {
    throw new Error('User does not meet all instructor requirements');
  }

  this.role = 'verified_instructor';
  this.instructorVerification.status = 'approved';
  this.instructorVerification.approvedAt = new Date();

  // Update AI quotas for new role
  return this.updateAIQuotasForRole();
};

// Reject instructor application
userSchema.methods.rejectInstructorApplication = function(reason) {
  this.instructorVerification.status = 'rejected';
  this.instructorVerification.rejectedAt = new Date();
  this.instructorVerification.rejectionReason = reason;

  return this.save();
};

// Add earnings
userSchema.methods.addEarnings = function(amount, description) {
  this.earnings.totalEarned += amount;
  this.earnings.availableBalance += amount;

  return this.save();
};

// Request payout
userSchema.methods.requestPayout = function(amount) {
  if (amount > this.earnings.availableBalance) {
    throw new Error('Insufficient balance for payout');
  }

  this.earnings.availableBalance -= amount;
  this.earnings.pendingBalance += amount;

  return this.save();
};

// Complete payout
userSchema.methods.completePayout = function(amount) {
  this.earnings.pendingBalance -= amount;
  this.earnings.totalWithdrawn += amount;
  this.earnings.lastPayoutDate = new Date();

  return this.save();
};

export default mongoose.model('User', userSchema);
