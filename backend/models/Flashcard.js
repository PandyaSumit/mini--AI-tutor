import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema({
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
  deck: {
    type: String,
    required: true,
    index: true
  },
  front: {
    type: String,
    required: true
  },
  back: {
    type: String,
    required: true
  },
  tags: [String],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  // Spaced Repetition (SM-2 Algorithm)
  spacedRepetition: {
    easeFactor: {
      type: Number,
      default: 2.5,
      min: 1.3
    },
    interval: {
      type: Number,
      default: 0 // days
    },
    repetitions: {
      type: Number,
      default: 0
    },
    nextReviewDate: {
      type: Date,
      default: Date.now
    },
    lastReviewDate: Date
  },
  // Performance tracking
  stats: {
    totalReviews: {
      type: Number,
      default: 0
    },
    correctReviews: {
      type: Number,
      default: 0
    },
    incorrectReviews: {
      type: Number,
      default: 0
    },
    averageResponseTime: Number, // milliseconds
    lastQuality: Number // 0-5 from SM-2
  },
  isActive: {
    type: Boolean,
    default: true
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

// Update timestamp
flashcardSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// SM-2 Algorithm Implementation
flashcardSchema.methods.updateSpacedRepetition = function(quality) {
  // quality: 0-5
  // 0-2: incorrect, 3-5: correct
  const sr = this.spacedRepetition;

  if (quality >= 3) {
    if (sr.repetitions === 0) {
      sr.interval = 1;
    } else if (sr.repetitions === 1) {
      sr.interval = 6;
    } else {
      sr.interval = Math.round(sr.interval * sr.easeFactor);
    }
    sr.repetitions += 1;
    this.stats.correctReviews += 1;
  } else {
    sr.repetitions = 0;
    sr.interval = 1;
    this.stats.incorrectReviews += 1;
  }

  // Update ease factor
  sr.easeFactor = sr.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (sr.easeFactor < 1.3) {
    sr.easeFactor = 1.3;
  }

  // Set next review date
  sr.lastReviewDate = new Date();
  sr.nextReviewDate = new Date(Date.now() + sr.interval * 24 * 60 * 60 * 1000);

  // Update stats
  this.stats.totalReviews += 1;
  this.stats.lastQuality = quality;

  return this.save();
};

// Check if card is due for review
flashcardSchema.methods.isDue = function() {
  return new Date() >= this.spacedRepetition.nextReviewDate;
};

// Calculate retention rate
flashcardSchema.methods.getRetentionRate = function() {
  if (this.stats.totalReviews === 0) return 0;
  return (this.stats.correctReviews / this.stats.totalReviews) * 100;
};

// Index for efficient queries
flashcardSchema.index({ user: 1, deck: 1 });
flashcardSchema.index({ user: 1, 'spacedRepetition.nextReviewDate': 1 });

export default mongoose.model('Flashcard', flashcardSchema);
