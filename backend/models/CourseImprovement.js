import mongoose from 'mongoose';

const courseImprovementSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  suggestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'implemented', 'rejected'],
    default: 'pending',
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  improvementType: {
    type: String,
    enum: ['new_content', 'correction', 'clarification', 'update', 'other'],
    required: true
  },
  targetSection: {
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      default: null
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      default: null
    }
  },
  upvotes: {
    type: Number,
    default: 0
  },
  upvotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  implementedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  implementedAt: {
    type: Date,
    default: null
  },
  revenueShareAwarded: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  implementationNotes: {
    type: String,
    maxlength: 1000,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Indexes for efficient queries
courseImprovementSchema.index({ course: 1, status: 1 });
courseImprovementSchema.index({ suggestedBy: 1 });
courseImprovementSchema.index({ upvotes: -1 });

// Method to upvote suggestion
courseImprovementSchema.methods.upvote = function(userId) {
  if (!this.upvotedBy.includes(userId)) {
    this.upvotedBy.push(userId);
    this.upvotes += 1;
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to mark as implemented
courseImprovementSchema.methods.markImplemented = async function(implementerId, revenueShare, notes) {
  this.status = 'implemented';
  this.implementedBy = implementerId;
  this.implementedAt = new Date();
  this.revenueShareAwarded = revenueShare || 2;
  this.implementationNotes = notes;

  await this.save();

  // Add user as content improver to the course
  const Course = mongoose.model('Course');
  const course = await Course.findById(this.course);

  if (course) {
    await course.addContributor(this.suggestedBy, 'content_improver', this.revenueShareAwarded);

    // Award reputation points to the suggester
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(this.suggestedBy, {
      $inc: { 'reputation.score': 10, 'reputation.improvementsImplemented': 1 }
    });
  }

  return this;
};

export default mongoose.model('CourseImprovement', courseImprovementSchema);
