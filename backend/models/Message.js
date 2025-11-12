import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message must have content'],
    maxlength: [10000, 'Message cannot exceed 10000 characters']
  },
  metadata: {
    model: String,
    tokens: Number,
    responseTime: Number, // in milliseconds
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: Date
  },
  reactions: [{
    type: {
      type: String,
      enum: ['helpful', 'not_helpful', 'bookmark']
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
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
messageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
messageSchema.index({ conversation: 1, createdAt: 1 });
messageSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
