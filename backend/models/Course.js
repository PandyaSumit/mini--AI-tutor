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
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Static method to find published courses
courseSchema.statics.findPublished = function(filters = {}) {
  return this.find({ isPublished: true, ...filters }).sort({ 'statistics.enrollmentCount': -1 });
};

export default mongoose.model('Course', courseSchema);
