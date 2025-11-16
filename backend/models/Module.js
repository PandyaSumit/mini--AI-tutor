import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Module title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Module description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  order: {
    type: Number,
    required: true,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  objectives: [{
    type: String,
    trim: true
  }],
  statistics: {
    totalLessons: {
      type: Number,
      default: 0
    },
    totalDuration: {
      type: Number,
      default: 0 // in minutes
    },
    completionCount: {
      type: Number,
      default: 0
    }
  },
  metadata: {
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    estimatedTime: {
      type: Number,
      default: 0 // in minutes
    }
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
moduleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compound indexes for efficient queries
moduleSchema.index({ course: 1, order: 1 });
moduleSchema.index({ course: 1, isPublished: 1 });

// Virtual for lessons
moduleSchema.virtual('lessons', {
  ref: 'Lesson',
  localField: '_id',
  foreignField: 'module'
});

// Method to update statistics
moduleSchema.methods.updateStatistics = async function() {
  const Lesson = mongoose.model('Lesson');
  const lessons = await Lesson.find({ module: this._id });

  this.statistics.totalLessons = lessons.length;
  this.statistics.totalDuration = lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0);

  return this.save();
};

// Method to get next lesson order number
moduleSchema.methods.getNextLessonOrder = async function() {
  const Lesson = mongoose.model('Lesson');
  const lastLesson = await Lesson.findOne({ module: this._id }).sort({ order: -1 });
  return lastLesson ? lastLesson.order + 1 : 0;
};

// Static method to get modules by course with lessons populated
moduleSchema.statics.findByCourseWithLessons = function(courseId) {
  return this.find({ course: courseId })
    .sort({ order: 1 })
    .populate({
      path: 'lessons',
      options: { sort: { order: 1 } }
    });
};

export default mongoose.model('Module', moduleSchema);
