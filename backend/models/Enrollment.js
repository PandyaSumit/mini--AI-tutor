import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'dropped'],
    default: 'active'
  },
  progress: {
    completedLessons: [{
      lesson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson'
      },
      completedAt: {
        type: Date,
        default: Date.now
      },
      timeSpent: {
        type: Number,
        default: 0 // in minutes
      }
    }],
    currentLesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      default: null
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    totalTimeSpent: {
      type: Number,
      default: 0 // in minutes
    }
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure one enrollment per user per course
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ user: 1, status: 1, lastAccessedAt: -1 });

// Update lastAccessedAt on save
enrollmentSchema.pre('save', function(next) {
  this.lastAccessedAt = Date.now();
  next();
});

// Method to mark lesson as completed
enrollmentSchema.methods.completeLesson = async function(lessonId, timeSpent = 0) {
  // Check if lesson already completed
  const alreadyCompleted = this.progress.completedLessons.some(
    cl => cl.lesson.toString() === lessonId.toString()
  );

  if (!alreadyCompleted) {
    this.progress.completedLessons.push({
      lesson: lessonId,
      completedAt: new Date(),
      timeSpent
    });

    // Update completion percentage
    const Course = mongoose.model('Course');
    const course = await Course.findById(this.course);

    if (course && course.statistics.totalLessons > 0) {
      this.progress.completionPercentage =
        (this.progress.completedLessons.length / course.statistics.totalLessons) * 100;
    }

    // Update total time spent
    this.progress.totalTimeSpent += timeSpent;

    // Check if course is completed
    if (this.progress.completionPercentage >= 100) {
      this.status = 'completed';
      this.completedAt = new Date();
    }
  }

  return this.save();
};

// Method to update current lesson
enrollmentSchema.methods.updateCurrentLesson = function(lessonId) {
  this.progress.currentLesson = lessonId;
  return this.save();
};

// Static method to find user's enrollments
enrollmentSchema.statics.findByUser = function(userId, status = null) {
  const query = { user: userId };
  if (status) query.status = status;

  return this.find(query)
    .populate('course')
    .sort({ lastAccessedAt: -1 });
};

// Static method to check if user is enrolled
enrollmentSchema.statics.isEnrolled = async function(userId, courseId) {
  const enrollment = await this.findOne({ user: userId, course: courseId });
  return !!enrollment;
};

export default mongoose.model('Enrollment', enrollmentSchema);
