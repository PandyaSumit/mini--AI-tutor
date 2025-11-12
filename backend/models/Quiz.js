import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['mcq', 'true_false', 'fill_blank', 'coding', 'short_answer'],
    required: true
  },
  question: {
    type: String,
    required: true
  },
  // For MCQ
  options: [String],
  correctAnswer: String, // Index or value

  // For coding questions
  codingChallenge: {
    language: String,
    starterCode: String,
    testCases: [{
      input: String,
      expectedOutput: String,
      isHidden: Boolean
    }],
    timeLimit: Number, // seconds
    memoryLimit: Number // MB
  },

  // Explanations
  explanation: {
    type: String,
    required: true
  },
  wrongAnswerHints: [{
    forAnswer: String,
    hint: String
  }],

  // Metadata
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  points: {
    type: Number,
    default: 1
  },
  tags: [String],

  // Analytics
  stats: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    correctAttempts: {
      type: Number,
      default: 0
    },
    averageTime: Number // seconds
  }
});

const quizSchema = new mongoose.Schema({
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
  roadmap: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningRoadmap'
  },
  weekModule: Number, // Reference to week number in roadmap
  title: {
    type: String,
    required: true
  },
  description: String,
  topic: {
    type: String,
    required: true,
    index: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'mixed'],
    default: 'medium'
  },
  questions: [questionSchema],
  settings: {
    timeLimit: Number, // minutes, null for untimed
    passingScore: {
      type: Number,
      default: 70 // percentage
    },
    shuffleQuestions: {
      type: Boolean,
      default: true
    },
    shuffleOptions: {
      type: Boolean,
      default: true
    },
    showExplanations: {
      type: Boolean,
      default: true
    },
    allowRetakes: {
      type: Boolean,
      default: true
    },
    maxAttempts: Number
  },
  generatedFrom: {
    source: {
      type: String,
      enum: ['conversation', 'topic', 'manual', 'roadmap']
    },
    sourceId: mongoose.Schema.Types.ObjectId
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalPoints: Number,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate total points
quizSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.totalPoints = this.questions.reduce((sum, q) => sum + (q.points || 1), 0);
  next();
});

// Index for efficient queries
quizSchema.index({ user: 1, topic: 1 });
quizSchema.index({ roadmap: 1, weekModule: 1 });

export default mongoose.model('Quiz', quizSchema);
