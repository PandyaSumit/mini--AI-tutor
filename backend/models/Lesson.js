import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Lesson title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Lesson content is required']
  },
  order: {
    type: Number,
    required: true,
    default: 0
  },
  duration: {
    type: Number,
    default: 0 // in minutes
  },
  objectives: [{
    type: String,
    trim: true
  }],
  isPublished: {
    type: Boolean,
    default: false
  },
  lessonType: {
    type: String,
    enum: ['video', 'text', 'interactive', 'voice', 'quiz', 'assignment'],
    default: 'interactive'
  },
  content_structure: {
    // For text-based lessons
    sections: [{
      heading: String,
      content: String,
      order: Number
    }],
    // For interactive/voice lessons
    keyPoints: [{
      type: String
    }],
    examples: [{
      title: String,
      code: String,
      explanation: String
    }],
    // For quizzes
    questions: [{
      question: String,
      options: [String],
      correctAnswer: Number,
      explanation: String
    }]
  },
  aiInstructions: {
    systemPrompt: {
      type: String,
      default: 'You are an expert tutor helping a student learn this topic. Provide clear, detailed explanations and encourage questions.'
    },
    teachingStyle: {
      type: String,
      enum: ['conversational', 'formal', 'socratic', 'practical'],
      default: 'conversational'
    },
    contextGuidelines: {
      type: String,
      default: 'Always refer back to the lesson content when answering questions. Build upon previous explanations in the conversation.'
    }
  },
  resources: [{
    title: String,
    type: {
      type: String,
      enum: ['link', 'document', 'video', 'code'],
      default: 'link'
    },
    url: String,
    description: String
  }],
  statistics: {
    sessionCount: {
      type: Number,
      default: 0
    },
    completionCount: {
      type: Number,
      default: 0
    },
    averageCompletionTime: {
      type: Number,
      default: 0 // in minutes
    }
  },
  metadata: {
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    tags: [{
      type: String
    }],
    prerequisites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson'
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
});

// Update updatedAt on save
lessonSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compound indexes for efficient queries
lessonSchema.index({ module: 1, order: 1 });
lessonSchema.index({ module: 1, isPublished: 1 });

// Method to get AI context for this lesson
lessonSchema.methods.getAIContext = function() {
  return {
    lessonTitle: this.title,
    lessonContent: this.content,
    objectives: this.objectives,
    keyPoints: this.content_structure?.keyPoints || [],
    examples: this.content_structure?.examples || [],
    systemPrompt: this.aiInstructions.systemPrompt,
    teachingStyle: this.aiInstructions.teachingStyle,
    contextGuidelines: this.aiInstructions.contextGuidelines
  };
};

// Method to mark lesson as completed for statistics
lessonSchema.methods.recordCompletion = async function(completionTime) {
  this.statistics.completionCount += 1;

  // Update average completion time
  const totalTime = (this.statistics.averageCompletionTime * (this.statistics.completionCount - 1)) + completionTime;
  this.statistics.averageCompletionTime = totalTime / this.statistics.completionCount;

  return this.save();
};

// Method to increment session count
lessonSchema.methods.incrementSessionCount = function() {
  this.statistics.sessionCount += 1;
  return this.save();
};

// Static method to find lessons by module
lessonSchema.statics.findByModule = function(moduleId) {
  return this.find({ module: moduleId, isPublished: true }).sort({ order: 1 });
};

export default mongoose.model('Lesson', lessonSchema);
