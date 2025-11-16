import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    index: true
  },
  title: {
    type: String,
    default: 'AI Tutoring Session'
  },
  subject: {
    type: String,
    default: 'General'
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'idle'],
    default: 'idle'
  },
  sessionType: {
    type: String,
    enum: ['voice', 'text', 'mixed'],
    default: 'mixed'
  },
  // Voice session state
  voiceState: {
    isRecording: { type: Boolean, default: false },
    isSpeaking: { type: Boolean, default: false },
    isProcessing: { type: Boolean, default: false },
    lastTranscript: { type: String, default: '' },
    audioQuality: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
  },
  // Session metrics
  metrics: {
    duration: { type: Number, default: 0 }, // in seconds
    messageCount: { type: Number, default: 0 },
    voiceMessageCount: { type: Number, default: 0 },
    textMessageCount: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 }, // in ms
    totalTokensUsed: { type: Number, default: 0 }
  },
  // Session timeline/events
  events: [{
    type: {
      type: String,
      enum: ['started', 'paused', 'resumed', 'ended', 'voice_started', 'voice_ended', 'error']
    },
    timestamp: { type: Date, default: Date.now },
    metadata: mongoose.Schema.Types.Mixed
  }],
  // Session context/memory
  context: {
    currentTopic: { type: String, default: '' },
    learningGoals: [String],
    keyPoints: [String],
    questionsAsked: { type: Number, default: 0 },
    conceptsExplained: [String]
  },
  // Audio recordings metadata (optional)
  audioRecordings: [{
    fileName: String,
    duration: Number,
    timestamp: Date,
    transcriptId: mongoose.Schema.Types.ObjectId,
    size: Number, // in bytes
    url: String // S3 or storage URL
  }],
  // Session settings
  settings: {
    voiceEnabled: { type: Boolean, default: true },
    autoTranscribe: { type: Boolean, default: true },
    ttsEnabled: { type: Boolean, default: true },
    language: { type: String, default: 'en-US' },
    ttsVoice: { type: String, default: 'default' },
    ttsSpeed: { type: Number, default: 1.0 }
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for performance
sessionSchema.index({ userId: 1, startedAt: -1 });
sessionSchema.index({ status: 1, lastActiveAt: -1 });
sessionSchema.index({ conversationId: 1 });

// Methods
sessionSchema.methods.updateMetrics = function(updates) {
  Object.assign(this.metrics, updates);
  this.lastActiveAt = Date.now();
  return this.save();
};

sessionSchema.methods.addEvent = function(type, metadata = {}) {
  this.events.push({ type, metadata, timestamp: Date.now() });
  this.lastActiveAt = Date.now();
  return this.save();
};

sessionSchema.methods.updateVoiceState = function(state) {
  Object.assign(this.voiceState, state);
  this.lastActiveAt = Date.now();
  return this.save();
};

sessionSchema.methods.complete = function() {
  this.status = 'completed';
  this.endedAt = Date.now();
  this.voiceState.isRecording = false;
  this.voiceState.isSpeaking = false;
  this.voiceState.isProcessing = false;
  return this.save();
};

// Statics
sessionSchema.statics.getActiveSession = function(userId) {
  return this.findOne({ userId, status: { $in: ['active', 'paused'] } })
    .sort({ lastActiveAt: -1 });
};

sessionSchema.statics.getUserSessions = function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ startedAt: -1 })
    .limit(limit)
    .populate('conversationId');
};

const Session = mongoose.model('Session', sessionSchema);
export default Session;
