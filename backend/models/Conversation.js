import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Conversation must have a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters'],
    default: 'New Conversation'
  },
  topic: {
    type: String,
    enum: [
      'programming',
      'mathematics',
      'languages',
      'science',
      'history',
      'general',
      'other'
    ],
    default: 'general'
  },
  tags: [{
    type: String,
    trim: true
  }],
  messageCount: {
    type: Number,
    default: 0
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    model: {
      type: String,
      default: 'groq-llama'
    },
    totalTokens: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0
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

// Update updatedAt timestamp
conversationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
conversationSchema.index({ user: 1, createdAt: -1 });
conversationSchema.index({ user: 1, topic: 1 });
conversationSchema.index({ user: 1, isActive: 1 });

// Virtual for messages
conversationSchema.virtual('messages', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'conversation'
});

// Method to increment message count
conversationSchema.methods.incrementMessageCount = function() {
  this.messageCount += 1;
  this.lastMessageAt = Date.now();
  return this.save();
};

export default mongoose.model('Conversation', conversationSchema);
