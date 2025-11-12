import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  targetDate: Date,
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: Date
});

const dailyTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  estimatedMinutes: Number,
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  resources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['video', 'article', 'interactive', 'documentation', 'exercise']
    }
  }]
});

const weeklyModuleSchema = new mongoose.Schema({
  weekNumber: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  objectives: [String],
  estimatedHours: Number,
  startDate: Date,
  endDate: Date,
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'remediation'],
    default: 'not_started'
  },
  dailyTasks: [dailyTaskSchema],
  prerequisiteModules: [Number], // Week numbers that must be completed first
  completionCriteria: {
    quizzesRequired: Number,
    projectsRequired: Number,
    minimumScore: Number
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
});

const learningRoadmapSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  goal: {
    type: String,
    required: true
  },
  currentLevel: {
    type: String,
    enum: ['novice', 'intermediate', 'advanced'],
    required: true
  },
  weeklyTimeCommitment: {
    type: Number,
    required: true // hours per week
  },
  targetDate: Date,
  preferredLearningModes: [{
    type: String,
    enum: ['video', 'text', 'hands-on', 'interactive']
  }],
  totalWeeks: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'abandoned'],
    default: 'active'
  },
  overview: {
    type: String,
    required: true
  },
  milestones: [milestoneSchema],
  weeklyModules: [weeklyModuleSchema],
  adaptiveData: {
    consecutiveMissedMilestones: {
      type: Number,
      default: 0
    },
    remediationMode: {
      type: Boolean,
      default: false
    },
    lastProgressUpdate: Date,
    performanceMetrics: {
      averageQuizScore: Number,
      completionRate: Number,
      timeOnTask: Number
    }
  },
  certificateEligible: {
    type: Boolean,
    default: false
  },
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateIssuedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
learningRoadmapSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate overall progress
learningRoadmapSchema.methods.calculateProgress = function() {
  if (this.weeklyModules.length === 0) return 0;

  const totalProgress = this.weeklyModules.reduce((sum, module) => sum + module.progress, 0);
  return Math.round(totalProgress / this.weeklyModules.length);
};

// Check if needs remediation
learningRoadmapSchema.methods.checkRemediationNeeded = function() {
  if (this.adaptiveData.consecutiveMissedMilestones >= 2) {
    this.adaptiveData.remediationMode = true;
    return true;
  }
  return false;
};

// Mark milestone as completed
learningRoadmapSchema.methods.completeMilestone = function(milestoneIndex) {
  if (this.milestones[milestoneIndex]) {
    this.milestones[milestoneIndex].completed = true;
    this.milestones[milestoneIndex].completedAt = new Date();
    this.adaptiveData.consecutiveMissedMilestones = 0;
  }
};

export default mongoose.model('LearningRoadmap', learningRoadmapSchema);
