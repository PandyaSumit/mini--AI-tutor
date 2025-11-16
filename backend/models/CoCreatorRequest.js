import mongoose from 'mongoose';

const coCreatorRequestSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  message: {
    type: String,
    maxlength: 1000,
    required: true
  },
  proposedContributions: {
    type: String,
    maxlength: 2000
  },
  requestedRevenueShare: {
    type: Number,
    default: 10,
    min: 0,
    max: 50
  },
  approvedRevenueShare: {
    type: Number,
    default: null,
    min: 0,
    max: 50
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  reviewNotes: {
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

// Index for efficient queries
coCreatorRequestSchema.index({ course: 1, status: 1 });
coCreatorRequestSchema.index({ requester: 1, status: 1 });

// Method to approve request
coCreatorRequestSchema.methods.approve = async function(reviewerId, revenueShare, notes) {
  this.status = 'approved';
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  this.approvedRevenueShare = revenueShare || this.requestedRevenueShare;
  this.reviewNotes = notes;

  await this.save();

  // Add user as co-creator to the course
  const Course = mongoose.model('Course');
  const course = await Course.findById(this.course);

  if (course) {
    await course.addContributor(this.requester, 'co-creator', this.approvedRevenueShare);
  }

  return this;
};

// Method to reject request
coCreatorRequestSchema.methods.reject = async function(reviewerId, notes) {
  this.status = 'rejected';
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  this.reviewNotes = notes;

  return this.save();
};

export default mongoose.model('CoCreatorRequest', coCreatorRequestSchema);
