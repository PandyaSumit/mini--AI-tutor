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
    enum: ['user', 'admin'],
    default: 'user'
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

export default mongoose.model('User', userSchema);
