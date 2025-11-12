import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  userAnswer: mongoose.Schema.Types.Mixed, // String, Array, or Object for code
  isCorrect: Boolean,
  pointsEarned: Number,
  timeSpent: Number, // seconds
  codeSubmission: {
    code: String,
    language: String,
    testResults: [{
      testCase: Number,
      passed: Boolean,
      output: String,
      error: String
    }]
  }
});

const quizAttemptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
    index: true
  },
  attemptNumber: {
    type: Number,
    required: true
  },
  answers: [answerSchema],
  score: {
    pointsEarned: Number,
    totalPoints: Number,
    percentage: Number
  },
  passed: Boolean,
  timeStarted: {
    type: Date,
    default: Date.now
  },
  timeCompleted: Date,
  totalTimeSpent: Number, // seconds
  weakTopics: [String], // Topics where user performed poorly
  recommendedActions: [{
    type: String,
    description: String,
    resourceUrl: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate score and weak topics
quizAttemptSchema.methods.calculateResults = async function() {
  const Quiz = mongoose.model('Quiz');
  const quiz = await Quiz.findById(this.quiz);

  if (!quiz) throw new Error('Quiz not found');

  let pointsEarned = 0;
  const totalPoints = quiz.totalPoints;
  const topicPerformance = {};

  this.answers.forEach(answer => {
    if (answer.isCorrect) {
      pointsEarned += answer.pointsEarned;
    }

    // Track topic performance
    const question = quiz.questions.id(answer.questionId);
    if (question && question.tags) {
      question.tags.forEach(tag => {
        if (!topicPerformance[tag]) {
          topicPerformance[tag] = { correct: 0, total: 0 };
        }
        topicPerformance[tag].total += 1;
        if (answer.isCorrect) {
          topicPerformance[tag].correct += 1;
        }
      });
    }
  });

  // Identify weak topics (< 60% correct)
  this.weakTopics = Object.keys(topicPerformance).filter(topic => {
    const perf = topicPerformance[topic];
    return (perf.correct / perf.total) < 0.6;
  });

  // Calculate final score
  this.score = {
    pointsEarned,
    totalPoints,
    percentage: Math.round((pointsEarned / totalPoints) * 100)
  };

  this.passed = this.score.percentage >= quiz.settings.passingScore;
  this.timeCompleted = new Date();
  this.totalTimeSpent = Math.round((this.timeCompleted - this.timeStarted) / 1000);

  // Generate recommendations
  if (!this.passed) {
    this.recommendedActions = this.weakTopics.map(topic => ({
      type: 'review',
      description: `Review ${topic} concepts and practice more`,
      resourceUrl: null
    }));
  }

  return this.save();
};

// Index for efficient queries
quizAttemptSchema.index({ user: 1, quiz: 1, attemptNumber: 1 });
quizAttemptSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('QuizAttempt', quizAttemptSchema);
