import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

/**
 * Enhanced Learning Roadmap Model
 * Deeply structured, module-wise roadmap with phases, modules, sub-modules
 * Includes quizzes, progress tracking, and personalization
 */

// Quiz Question Schema
const quizQuestionSchema = new mongoose.Schema({
  questionId: {
    type: String,
    default: () => nanoid(10)
  },
  type: {
    type: String,
    enum: ['mcq', 'true_false', 'fill_blank', 'coding', 'short_answer'],
    required: true
  },
  question: {
    type: String,
    required: true
  },
  options: [String], // For MCQ
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  explanation: String,
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  tags: [String],
  points: {
    type: Number,
    default: 1
  }
});

// Module Quiz Schema
const moduleQuizSchema = new mongoose.Schema({
  quizId: {
    type: String,
    default: () => nanoid(10)
  },
  title: String,
  description: String,
  questions: [quizQuestionSchema],
  passingScore: {
    type: Number,
    default: 70
  },
  timeLimit: Number, // minutes
  attempts: [{
    attemptDate: Date,
    score: Number,
    answers: mongoose.Schema.Types.Mixed,
    timeTaken: Number,
    passed: Boolean
  }],
  bestScore: Number,
  completed: {
    type: Boolean,
    default: false
  }
});

// Practical Task Schema
const practicalTaskSchema = new mongoose.Schema({
  taskId: {
    type: String,
    default: () => nanoid(10)
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: ['exercise', 'mini-project', 'coding-challenge', 'case-study', 'hands-on-lab'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  estimatedMinutes: Number,
  instructions: [String],
  expectedOutput: String,
  resources: [{
    title: String,
    url: String,
    type: String
  }],
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  submissionUrl: String,
  feedback: String
});

// Real Project Example Schema
const projectExampleSchema = new mongoose.Schema({
  exampleId: {
    type: String,
    default: () => nanoid(10)
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  industry: String, // e.g., "fintech", "e-commerce", "healthcare"
  realWorldApplication: String,
  technologiesUsed: [String],
  complexity: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  repositoryUrl: String,
  demoUrl: String,
  estimatedHours: Number,
  learningOutcomes: [String]
});

// Sub-Concept Schema
const subConceptSchema = new mongoose.Schema({
  subConceptId: {
    type: String,
    default: () => nanoid(10)
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  keyPoints: [String],
  examples: [String],
  resources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['video', 'article', 'text', 'interactive', 'documentation', 'exercise']
    },
    estimatedMinutes: Number
  }],
  completed: {
    type: Boolean,
    default: false
  }
});

// Core Concept Schema
const coreConceptSchema = new mongoose.Schema({
  conceptId: {
    type: String,
    default: () => nanoid(10)
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  importance: String,
  prerequisites: [String],
  subConcepts: [subConceptSchema],
  completed: {
    type: Boolean,
    default: false
  }
});

// Sub-Module Schema
const subModuleSchema = new mongoose.Schema({
  subModuleId: {
    type: String,
    default: () => nanoid(10)
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  order: Number,
  estimatedHours: Number,
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  learningObjectives: [String],
  coreConcepts: [coreConceptSchema],
  practicalTasks: [practicalTaskSchema],
  resources: [{
    title: String,
    url: String,
    type: String,
    estimatedMinutes: Number
  }],
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
});

// Module Schema
const moduleSchema = new mongoose.Schema({
  moduleId: {
    type: String,
    default: () => nanoid(10)
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  order: Number,
  estimatedHours: Number,
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  learningObjectives: [String],
  learningOutcomes: [String],
  realWorldApplications: [String],

  // Topics Breakdown
  topicsBreakdown: {
    coreConcepts: [coreConceptSchema],
    subModules: [subModuleSchema]
  },

  // Practical Components
  practicalTasks: [practicalTaskSchema],
  projectExamples: [projectExampleSchema],

  // Best Practices & Mistakes
  bestPractices: [{
    title: String,
    description: String,
    example: String
  }],
  commonMistakes: [{
    mistake: String,
    why: String,
    howToAvoid: String,
    correctApproach: String
  }],

  // Module End Components
  moduleEndSummary: {
    keyTakeaways: [String],
    skillsAcquired: [String],
    nextSteps: String,
    reflectionQuestions: [String]
  },

  // Integrated Quiz
  quiz: moduleQuizSchema,

  // Progress & Checkpoints
  checkpoints: [{
    checkpointId: String,
    title: String,
    description: String,
    validationType: {
      type: String,
      enum: ['quiz', 'project', 'peer-review', 'self-assessment']
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    score: Number
  }],

  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'skipped'],
    default: 'not_started'
  },
  startedAt: Date,
  completedAt: Date,
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  // Prerequisites
  prerequisiteModules: [String], // Module IDs

  // Metadata
  tags: [String],
  estimatedCompletionTime: Number, // in hours
  actualCompletionTime: Number
});

// Phase Schema (Major learning phases)
const phaseSchema = new mongoose.Schema({
  phaseId: {
    type: String,
    default: () => nanoid(10)
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  order: Number,
  phaseType: {
    type: String,
    enum: ['foundation', 'intermediate', 'advanced', 'specialization', 'mastery'],
    required: true
  },
  estimatedWeeks: Number,
  estimatedHours: Number,

  modules: [moduleSchema],

  phaseMilestone: {
    title: String,
    description: String,
    completionCriteria: {
      minimumModulesCompleted: Number,
      minimumAverageScore: Number,
      requiredProjects: Number
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  },

  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
});

// Main Enhanced Roadmap Schema
const enhancedRoadmapSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Basic Info
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  goal: {
    type: String,
    required: true
  },

  // Personalization
  personalization: {
    detectedSkillLevel: {
      type: String,
      enum: ['absolute_beginner', 'beginner', 'intermediate', 'advanced', 'expert']
    },
    userDeclaredLevel: {
      type: String,
      enum: ['absolute_beginner', 'beginner', 'intermediate', 'advanced', 'expert'],
      required: true
    },
    finalSkillLevel: String, // Computed from detected + declared

    learningPath: {
      type: String,
      enum: ['fast-track', 'detailed', 'custom'],
      default: 'detailed'
    },

    domain: String, // User's domain/industry
    priorExperience: [String],
    learningGoals: [String],

    preferences: {
      learningStyle: {
        type: String,
        enum: ['visual', 'auditory', 'kinesthetic', 'reading-writing', 'mixed']
      },
      pacePreference: {
        type: String,
        enum: ['slow', 'moderate', 'fast']
      },
      contentTypes: [{
        type: String,
        enum: ['video', 'text', 'hands-on', 'interactive', 'audio']
      }]
    },

    weeklyTimeCommitment: {
      type: Number,
      required: true // hours per week
    },

    targetCompletionDate: Date
  },

  // Roadmap Structure
  phases: [phaseSchema],

  // Overall Metadata
  metadata: {
    totalPhases: Number,
    totalModules: Number,
    totalSubModules: Number,
    totalEstimatedHours: Number,
    totalEstimatedWeeks: Number,
    difficultyProgression: [String],

    tags: [String],
    category: String,
    industry: String,

    // For ChromaDB
    embedding: [Number],
    embeddingModel: String
  },

  // Progress Tracking
  overallProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  progressMetrics: {
    phasesCompleted: {
      type: Number,
      default: 0
    },
    modulesCompleted: {
      type: Number,
      default: 0
    },
    subModulesCompleted: {
      type: Number,
      default: 0
    },
    quizzesCompleted: {
      type: Number,
      default: 0
    },
    averageQuizScore: Number,
    projectsCompleted: {
      type: Number,
      default: 0
    },
    totalTimeSpent: {
      type: Number,
      default: 0 // minutes
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    lastActivityDate: Date
  },

  // Adaptive Learning
  adaptiveData: {
    performanceHistory: [{
      date: Date,
      metric: String,
      value: Number
    }],
    strugglingTopics: [String],
    masteredTopics: [String],
    recommendedFocus: [String],
    pathAdjustments: [{
      date: Date,
      reason: String,
      changes: [String]
    }],
    remediationMode: {
      type: Boolean,
      default: false
    },
    acceleratedMode: {
      type: Boolean,
      default: false
    }
  },

  // Milestones (Major achievements across all phases)
  globalMilestones: [{
    milestoneId: String,
    title: String,
    description: String,
    targetDate: Date,
    phaseId: String,
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  }],

  // Status
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'abandoned'],
    default: 'draft'
  },

  // Certification
  certificateEligible: {
    type: Boolean,
    default: false
  },
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateData: {
    issuedAt: Date,
    certificateId: String,
    credentialUrl: String
  },

  // Generation Info
  generatedBy: {
    method: {
      type: String,
      enum: ['ai-full', 'ai-assisted', 'manual', 'template'],
      default: 'ai-full'
    },
    aiModel: String,
    generatedAt: Date,
    tokensUsed: Number
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
  timestamps: true
});

// Indexes
enhancedRoadmapSchema.index({ user: 1, status: 1 });
enhancedRoadmapSchema.index({ 'metadata.tags': 1 });
enhancedRoadmapSchema.index({ 'metadata.category': 1 });
enhancedRoadmapSchema.index({ 'personalization.finalSkillLevel': 1 });

// Methods

/**
 * Calculate overall progress based on all components
 */
enhancedRoadmapSchema.methods.calculateOverallProgress = function() {
  if (!this.phases || this.phases.length === 0) return 0;

  const totalPhases = this.phases.length;
  const totalProgress = this.phases.reduce((sum, phase) => sum + (phase.progress || 0), 0);

  this.overallProgress = Math.round(totalProgress / totalPhases);
  return this.overallProgress;
};

/**
 * Calculate phase progress
 */
enhancedRoadmapSchema.methods.calculatePhaseProgress = function(phaseId) {
  const phase = this.phases.find(p => p.phaseId === phaseId);
  if (!phase || !phase.modules || phase.modules.length === 0) return 0;

  const totalModules = phase.modules.length;
  const totalProgress = phase.modules.reduce((sum, module) => sum + (module.progress || 0), 0);

  phase.progress = Math.round(totalProgress / totalModules);
  return phase.progress;
};

/**
 * Calculate module progress
 */
enhancedRoadmapSchema.methods.calculateModuleProgress = function(moduleId) {
  let targetModule = null;
  let targetPhase = null;

  for (const phase of this.phases) {
    const module = phase.modules.find(m => m.moduleId === moduleId);
    if (module) {
      targetModule = module;
      targetPhase = phase;
      break;
    }
  }

  if (!targetModule) return 0;

  let totalItems = 0;
  let completedItems = 0;

  // Count core concepts
  if (targetModule.topicsBreakdown?.coreConcepts) {
    totalItems += targetModule.topicsBreakdown.coreConcepts.length;
    completedItems += targetModule.topicsBreakdown.coreConcepts.filter(c => c.completed).length;
  }

  // Count sub-modules
  if (targetModule.topicsBreakdown?.subModules) {
    totalItems += targetModule.topicsBreakdown.subModules.length;
    completedItems += targetModule.topicsBreakdown.subModules.filter(sm => sm.completed).length;
  }

  // Count practical tasks
  if (targetModule.practicalTasks) {
    totalItems += targetModule.practicalTasks.length;
    completedItems += targetModule.practicalTasks.filter(t => t.completed).length;
  }

  // Count quiz
  if (targetModule.quiz) {
    totalItems += 1;
    completedItems += targetModule.quiz.completed ? 1 : 0;
  }

  // Count checkpoints
  if (targetModule.checkpoints) {
    totalItems += targetModule.checkpoints.length;
    completedItems += targetModule.checkpoints.filter(cp => cp.completed).length;
  }

  targetModule.progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  return targetModule.progress;
};

/**
 * Update progress metrics
 */
enhancedRoadmapSchema.methods.updateProgressMetrics = function() {
  this.progressMetrics.phasesCompleted = this.phases.filter(p => p.status === 'completed').length;

  let totalModules = 0;
  let completedModules = 0;
  let totalSubModules = 0;
  let completedSubModules = 0;
  let totalQuizzes = 0;
  let completedQuizzes = 0;
  let totalQuizScores = 0;
  let quizScoreCount = 0;

  for (const phase of this.phases) {
    for (const module of phase.modules) {
      totalModules++;
      if (module.status === 'completed') completedModules++;

      if (module.topicsBreakdown?.subModules) {
        totalSubModules += module.topicsBreakdown.subModules.length;
        completedSubModules += module.topicsBreakdown.subModules.filter(sm => sm.completed).length;
      }

      if (module.quiz) {
        totalQuizzes++;
        if (module.quiz.completed) {
          completedQuizzes++;
          if (module.quiz.bestScore !== undefined) {
            totalQuizScores += module.quiz.bestScore;
            quizScoreCount++;
          }
        }
      }
    }
  }

  this.progressMetrics.modulesCompleted = completedModules;
  this.progressMetrics.subModulesCompleted = completedSubModules;
  this.progressMetrics.quizzesCompleted = completedQuizzes;
  this.progressMetrics.averageQuizScore = quizScoreCount > 0
    ? Math.round(totalQuizScores / quizScoreCount)
    : undefined;

  this.metadata.totalModules = totalModules;
  this.metadata.totalSubModules = totalSubModules;
};

/**
 * Get current active module
 */
enhancedRoadmapSchema.methods.getCurrentModule = function() {
  for (const phase of this.phases) {
    for (const module of phase.modules) {
      if (module.status === 'in_progress') {
        return module;
      }
    }
  }

  // If no in_progress module, return first not_started
  for (const phase of this.phases) {
    for (const module of phase.modules) {
      if (module.status === 'not_started') {
        return module;
      }
    }
  }

  return null;
};

/**
 * Get next recommended module
 */
enhancedRoadmapSchema.methods.getNextModule = function() {
  const currentModule = this.getCurrentModule();
  if (!currentModule) return null;

  let foundCurrent = false;

  for (const phase of this.phases) {
    for (const module of phase.modules) {
      if (foundCurrent && module.status === 'not_started') {
        // Check if prerequisites are met
        if (this.arePrerequisitesMet(module)) {
          return module;
        }
      }
      if (module.moduleId === currentModule.moduleId) {
        foundCurrent = true;
      }
    }
  }

  return null;
};

/**
 * Check if module prerequisites are met
 */
enhancedRoadmapSchema.methods.arePrerequisitesMet = function(module) {
  if (!module.prerequisiteModules || module.prerequisiteModules.length === 0) {
    return true;
  }

  for (const prereqId of module.prerequisiteModules) {
    let prereqMet = false;

    for (const phase of this.phases) {
      const prereqModule = phase.modules.find(m => m.moduleId === prereqId);
      if (prereqModule && prereqModule.status === 'completed') {
        prereqMet = true;
        break;
      }
    }

    if (!prereqMet) return false;
  }

  return true;
};

/**
 * Mark module as completed
 */
enhancedRoadmapSchema.methods.completeModule = async function(moduleId) {
  for (const phase of this.phases) {
    const module = phase.modules.find(m => m.moduleId === moduleId);
    if (module) {
      module.status = 'completed';
      module.completedAt = new Date();
      module.progress = 100;

      // Calculate actual completion time
      if (module.startedAt) {
        const hoursSpent = (module.completedAt - module.startedAt) / (1000 * 60 * 60);
        module.actualCompletionTime = Math.round(hoursSpent * 10) / 10;
      }

      // Recalculate phase and overall progress
      this.calculatePhaseProgress(phase.phaseId);
      this.calculateOverallProgress();
      this.updateProgressMetrics();

      await this.save();
      return true;
    }
  }

  return false;
};

/**
 * Determine if user should be on fast-track or detailed path
 */
enhancedRoadmapSchema.statics.determineLearningPath = function(skillLevel, priorExperience) {
  if (skillLevel === 'advanced' || skillLevel === 'expert') {
    return 'fast-track';
  }

  if (priorExperience && priorExperience.length >= 3) {
    return 'fast-track';
  }

  return 'detailed';
};

export default mongoose.model('EnhancedRoadmap', enhancedRoadmapSchema);
