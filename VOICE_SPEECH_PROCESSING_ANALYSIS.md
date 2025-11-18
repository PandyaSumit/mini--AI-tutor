# Voice and Speech Processing Architecture - Comprehensive Analysis

**Project**: Mini AI Tutor  
**Analysis Date**: 2025-11-18  
**Thoroughness Level**: Very Thorough  
**Last Updated**: Based on current branch: claude/fix-knowledge-search-013h4rmmoBh7oJuwW8DUX9Rq

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Speech-to-Text (STT) Implementation](#speech-to-text-stt-implementation)
3. [Text-to-Speech (TTS) Implementation](#text-to-speech-tts-implementation)
4. [Audio Streaming and Processing](#audio-streaming-and-processing)
5. [Voice Session Management](#voice-session-management)
6. [WebSocket/Socket.IO Integration](#websocketsocketio-integration)
7. [Audio Storage and Retrieval](#audio-storage-and-retrieval)
8. [Voice Orchestration and Workflow](#voice-orchestration-and-workflow)
9. [Data Models](#data-models)
10. [Integration Points](#integration-points)
11. [Error Handling and Fallbacks](#error-handling-and-fallbacks)
12. [Production Considerations](#production-considerations)

---

## Architecture Overview

The Voice AI Tutor implements a **hybrid, multi-layered voice processing system** that combines:

- **Client-side speech processing** (Web Speech API for STT and native Speech Synthesis for TTS)
- **Server-side speech processing** (Hugging Face Whisper and OpenAI Whisper for STT)
- **Real-time WebSocket communication** (Socket.IO for bidirectional streaming)
- **Job queue system** (BullMQ with Redis for asynchronous processing)
- **Distributed storage** (MinIO S3-compatible for audio chunks)
- **AI response generation** (Groq LLM for intelligent tutoring)

### System Components Diagram

```
FRONTEND (React)
    │
    ├─→ Web Speech API (STT)
    ├─→ Web Speech Synthesis (TTS)
    ├─→ Audio Recording (MediaRecorder)
    └─→ voiceWebSocket.js (Socket.IO Client)
    
                    │ WebSocket
                    ▼
    
BACKEND (Node.js)
    │
    ├─→ Socket.IO Server (config/socket.js)
    ├─→ Voice Handlers (socketHandlers/voiceHandlers.js)
    ├─→ Voice Routes (routes/voiceRoutes.js)
    ├─→ Voice Orchestrator (services/voiceOrchestrator.js)
    ├─→ STT Service (services/sttService.js)
    ├─→ Audio Storage (services/audioStorage.js)
    └─→ Job Queues (queues/index.js)
    
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
    MongoDB     MinIO S3     Redis
    (Sessions)  (Audio)      (Jobs)
```

---

## Speech-to-Text (STT) Implementation

### Overview

The STT system implements an **intelligent three-tier fallback chain**:

```
Primary: Hugging Face API (Free, server-side)
    ↓ (if fails)
Fallback 1: OpenAI Whisper API (Paid, server-side)
    ↓ (if fails)
Fallback 2: Browser Web Speech API (Free, client-side)
```

### File: `backend/services/sttService.js`

**Class**: `STTService`

#### Key Characteristics

- **Fallback Chain Architecture**: Automatically tries multiple providers
- **No Blocking**: Fast timeouts (20s for HF, 15s for OpenAI) for quick fallback
- **Rate Limiting Handling**: Detects quota/rate limit errors and suggests browser STT
- **Language Support**: Multiple language codes (e.g., 'en', 'es', 'fr')
- **Robust Error Detection**: Distinguishes between API errors, quota issues, and transient failures

#### Main Methods

##### 1. `getProviders()`
```javascript
// Returns array of available STT providers based on environment configuration
// Example output: ['huggingface', 'openai', 'browser']
```

**Logic**:
- Checks for `HUGGINGFACE_API_KEY` or `HF_TOKEN` environment variable
- Checks for `OPENAI_API_KEY` environment variable
- Always includes 'browser' as last resort

##### 2. `transcribe(audioBuffer, language = 'en')`
```javascript
// Main entry point for transcription
// Input: Audio buffer (WebM format), language code
// Output: {text, language, provider, useBrowserSTT?, fallbackInstructions?, errors?}
```

**Process Flow**:

1. Get available providers
2. If only browser available → return immediately with `useBrowserSTT: true`
3. Try Hugging Face:
   - `POST https://api-inference.huggingface.co/models/openai/whisper-large-v3`
   - Timeout: 20 seconds
   - Detects model loading (503 error) and quota (429 error)
4. Try OpenAI (if HF fails):
   - `POST https://api.openai.com/v1/audio/transcriptions`
   - Timeout: 15 seconds
   - Detects insufficient quota and rate limits
5. All failed → Return `useBrowserSTT: true` with fallback instructions

##### 3. `transcribeWithHuggingFace(audioBuffer, language)`
```javascript
// Implementation Details:
// - Endpoint: Hugging Face Inference Router (Nov 2024 update)
// - Model: openai/whisper-large-v3
// - Format: WebM audio
// - Headers: Bearer token auth
// - Returns: {text: string, language: string}
```

**Error Handling**:
- 503 → "Model is loading, try again in 10-20 seconds"
- 429 → "Hugging Face rate limit exceeded"
- Other → Wrapped error message

##### 4. `transcribeWithOpenAI(audioBuffer, language)`
```javascript
// Implementation Details:
// - Model: whisper-1
// - Format: WebM audio via FormData
// - Response Format: JSON
// - Timeout: 15 seconds
// - Returns: {text: string, language: string}
```

**Error Handling**:
- insufficient_quota → "OpenAI quota exceeded"
- 429 → "OpenAI rate limit exceeded"
- Other → Wrapped error message

##### 5. `transcribeWithTimestamps(audioBuffer, language)`
```javascript
// Advanced method for detailed segment-level transcription
// Response Format: verbose_json with segment granularity
// Returns: {text, language, segments: [{id, seek, start, end, text}...]}
```

##### 6. `getFallbackInstructions()`
```javascript
// Returns instructions for client-side browser STT fallback
// Includes example Web Speech API implementation code
```

### Configuration

Environment variables used:
```env
HUGGINGFACE_API_KEY or HF_TOKEN    # Free or paid HF tokens
OPENAI_API_KEY                      # OpenAI API key
```

### Dependencies

```json
{
  "axios": "^1.6.5",           // HTTP requests
  "form-data": "^4.0.0"        // FormData for file uploads
}
```

---

## Text-to-Speech (TTS) Implementation

### Overview

**Location**: Client-side only (frontend/src/services/ttsService.js)

The TTS implementation is **client-side only**, using the browser's native **Web Speech Synthesis API** for several reasons:

1. **Cost**: Zero API costs (no external service charges)
2. **Latency**: Instant playback without network delay
3. **Privacy**: Audio processing happens locally
4. **Reliability**: Works offline or with poor connectivity
5. **Language Support**: Native browser voice support

### Implementation Details

**Browser API**: `window.speechSynthesis`

#### Key Features

- **Multi-language Support**: Different voices for different languages
- **Voice Selection**: Multiple voices available per language
- **Speech Control**: Start, pause, resume, cancel
- **Rate Control**: Adjustable speech rate (0.5x to 2x)
- **Pitch Control**: Adjustable pitch (0.5 to 2.0)
- **Volume Control**: Adjustable volume (0 to 1.0)

#### Configuration Options

```javascript
{
  language: 'en-US',      // Language code
  voice: 'default',       // Voice selection
  rate: 1.0,             // 0.5 to 2.0 (1.0 = normal)
  pitch: 1.0,            // 0.5 to 2.0 (1.0 = normal)
  volume: 1.0            // 0 to 1.0 (1.0 = max)
}
```

#### Session Settings Model

**File**: `backend/models/Session.js`

```javascript
settings: {
  voiceEnabled: boolean,      // Master voice control
  autoTranscribe: boolean,    // Auto transcription
  ttsEnabled: boolean,        // TTS output enabled
  language: string,           // Language code
  ttsVoice: string,          // Voice name
  ttsSpeed: number           // Speech rate
}
```

**File**: `backend/models/VoiceSession.js`

```javascript
settings: {
  sttMode: enum ['auto', 'browser', 'server'],  // STT provider mode
  ttsEnabled: boolean,                           // TTS enabled
  autoSpeak: boolean,                            // Auto-read responses
  language: string                               // Language code
}
```

---

## Audio Streaming and Processing

### Audio Chunking Strategy

**Approach**: Stream audio in **real-time chunks** to prevent memory overload

#### Client-Side Chunking

```javascript
// Frontend implementation (conceptual)
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const source = audioContext.createMediaStreamSource(stream);
const processor = audioContext.createScriptProcessor(4096, 1, 1);

processor.onaudioprocess = (event) => {
  const audioData = event.inputBuffer.getChannelData(0);
  // Send chunk via WebSocket
  socket.emit('voice:audio-chunk', {
    sessionId,
    audioChunk: audioData,
    chunkIndex: currentChunk++,
    isLastChunk: false
  });
};
```

#### Server-Side Chunk Handling

**File**: `backend/socketHandlers/voiceHandlers.js` (Development)  
**File**: `backend/socketHandlers/voiceHandlersProd.js` (Production)

**Event**: `voice:audio-chunk`

```javascript
socket.on('voice:audio-chunk', async (data) => {
  const { sessionId, chunk, isLast, metadata } = data;
  
  if (!socket.audioChunks) {
    socket.audioChunks = [];  // Accumulate chunks in socket
  }
  
  socket.audioChunks.push(chunk);
  
  if (isLast) {
    // Combine all chunks into complete audio
    const completeAudio = Buffer.concat(socket.audioChunks);
    socket.audioChunks = [];
    
    // Process complete audio
    const result = await voiceOrchestrator.processVoiceInput(
      sessionId,
      completeAudio,
      metadata
    );
  }
});
```

### Audio Format Specifications

**Supported Format**: WebM (Vorbis codec)

**Technical Specifications**:
- **Codec**: Vorbis (lossy)
- **Sample Rate**: 48 kHz
- **Channels**: Mono (1)
- **Bitrate**: ~128 kbps
- **Frame Size**: 4096 samples
- **Maximum File Size**: 10 MB per upload

### Audio Buffering and Storage

#### In-Memory Buffering (Development)

```javascript
// Temporary storage in socket object
socket.audioChunks = [];  // Array of Buffer objects
```

#### MinIO Storage (Production)

**File**: `backend/services/audioStorage.js`

Used to stream audio chunks directly to S3-compatible MinIO storage to avoid memory overload.

---

## Voice Session Management

### VoiceSession Model

**File**: `backend/models/VoiceSession.js`

#### Schema Structure

```javascript
{
  userId: ObjectId,                  // Reference to User
  conversationId: ObjectId,          // Reference to Conversation
  lesson: ObjectId,                  // Optional lesson reference
  enrollment: ObjectId,              // Optional enrollment reference
  
  status: enum ['active', 'ended', 'paused'],
  language: string,                  // Default: 'en-US'
  isProcessing: boolean,
  
  settings: {
    sttMode: enum ['auto', 'browser', 'server'],
    ttsEnabled: boolean,
    autoSpeak: boolean,
    language: string
  },
  
  metadata: {
    totalMessages: number,
    totalDuration: number,
    averageResponseTime: number,
    sttProvider: enum ['browser', 'huggingface', 'openai', null]
  },
  
  startedAt: Date,
  endedAt: Date,
  lastActivityAt: Date
}
```

#### Indexes

```javascript
// Single-field indexes
{ userId: 1, status: 1 }         // Find active sessions by user
{ userId: 1, createdAt: -1 }     // User session history
{ lastActivityAt: -1 }            // Cleanup inactive sessions

// Built-in timestamp tracking
timestamps: true                  // createdAt, updatedAt
```

#### Instance Methods

```javascript
updateMetadata(updates)      // Update metadata fields
endSession()                 // Mark session as ended
updateSettings(settings)     // Update session settings
```

#### Static Methods

```javascript
findActiveSession(userId)    // Get user's active session
getUserStats(userId)         // Aggregate session statistics
```

### Session Model

**File**: `backend/models/Session.js`

Broader session model that supports voice, text, and mixed modes.

#### Voice-Specific Fields

```javascript
sessionType: enum ['voice', 'text', 'mixed'],

voiceState: {
  isRecording: boolean,
  isSpeaking: boolean,
  isProcessing: boolean,
  lastTranscript: string,
  audioQuality: enum ['low', 'medium', 'high']
},

settings: {
  voiceEnabled: boolean,
  autoTranscribe: boolean,
  ttsEnabled: boolean,
  language: string,
  ttsVoice: string,
  ttsSpeed: number
},

audioRecordings: [{
  fileName: string,
  duration: number,
  timestamp: Date,
  transcriptId: ObjectId,
  size: number,
  url: string
}]
```

### Session Lifecycle

1. **Initialization** (`voice:join`)
   - Create or fetch active session
   - Initialize voice state
   - Join Socket.IO room

2. **Recording** (`voice:start-recording` → `voice:stop-recording`)
   - Update recording state
   - Accumulate audio chunks
   - Store to MinIO (production)

3. **Processing** (Automatic)
   - STT transcription
   - AI response generation
   - Message persistence

4. **Playback** (`voice:response` → `voice:tts-complete`)
   - Client handles TTS playback
   - Emit completion event

5. **Termination** (`voice:leave` or `voice:end`)
   - End session
   - Cleanup resources
   - Cleanup audio files from MinIO (production)

---

## WebSocket/Socket.IO Integration

### Socket.IO Configuration

**File**: `backend/config/socket.js`

#### Initialization

```javascript
const io = new Server(httpServer, {
  cors: {
    origin: [allowedOrigins],
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e8  // 100 MB for audio chunks
});
```

#### Authentication Middleware

```javascript
io.use(async (socket, next) => {
  // Verify JWT token from handshake
  // Extract user ID and email
  // Attach to socket object
});
```

#### Connection Handling

```javascript
io.on('connection', (socket) => {
  // Join user to personal room: user:{userId}
  socket.join(`user:${socket.userId}`);
  
  // Emit custom events to user
  // Handle disconnections
});
```

### Voice-Specific Socket Events

#### Development Handlers

**File**: `backend/socketHandlers/voiceHandlers.js`

| Event | Direction | Payload | Handler |
|-------|-----------|---------|---------|
| `voice:join` | Client → Server | `{sessionId?, settings}` | Initialize voice session |
| `voice:start-recording` | Client → Server | `{sessionId}` | Start recording state |
| `voice:stop-recording` | Client → Server | `{sessionId, audioBlob, metadata}` | Process complete audio |
| `voice:audio-chunk` | Client → Server | `{sessionId, chunk, isLast, metadata}` | Stream audio chunks |
| `voice:text-message` | Client → Server | `{sessionId, text}` | Send text message |
| `voice:tts-complete` | Client → Server | `{sessionId}` | TTS playback finished |
| `voice:leave` | Client → Server | `{sessionId}` | Leave session gracefully |
| `voice:end` | Client → Server | `{sessionId}` | End session immediately |

#### Response Events (Server → Client)

| Event | Payload | Meaning |
|-------|---------|---------|
| `voice:joined` | `{sessionId, status, settings, voiceState}` | Session initialized |
| `voice:recording-started` | `{sessionId}` | Recording active |
| `voice:recording-stopped` | `{sessionId}` | Recording stopped |
| `voice:transcribed` | `{sessionId, text, language}` | STT complete |
| `voice:processing` | `{sessionId, status, progress?}` | Processing update |
| `voice:response` | `{sessionId, text, messageId, shouldSpeak, metadata}` | AI response ready |
| `voice:error` | `{error: string}` | Error occurred |
| `voice:left` | `{sessionId}` | Left session |
| `voice:ended` | `{sessionId, duration, metrics}` | Session ended |
| `voice:use-browser-stt` | `{message, instructions, errors}` | Fallback to browser STT |
| `voice:ready` | `{sessionId}` | Ready for next input |

#### Production Handlers

**File**: `backend/socketHandlers/voiceHandlersProd.js`

**Enhanced Features**:
- Rate limiting per socket
- Text sanitization
- Session validation
- Job queue integration
- Comprehensive logging

### Room-Based Broadcasting

```javascript
// Emit to specific user
io.to(`user:${userId}`).emit('voice:response', data);

// Emit to specific session room
io.to(`session:${sessionId}`).emit('voice:processing', data);

// Broadcast to all connected clients
io.emit('event', data);
```

### Rate Limiting

**Production File**: `backend/middleware/rateLimiterProd.js`

```javascript
const checkRateLimit = socketRateLimiter(socket);

// Check before processing event
if (!(await checkRateLimit('voice:audio-chunk'))) {
  return;  // Rate limited
}
```

---

## Audio Storage and Retrieval

### MinIO S3-Compatible Storage

**File**: `backend/services/audioStorage.js`

#### Service Architecture

```javascript
class AudioStorageService {
  constructor() {
    this.client = null;          // MinIO client instance
    this.bucketName = 'voice-audio';
  }
}
```

#### Configuration

```javascript
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'localhost';
const MINIO_PORT = parseInt(process.env.MINIO_PORT) || 9000;
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'minioadmin';
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === 'true';
const BUCKET_NAME = 'voice-audio';
```

#### Key Methods

##### 1. `initialize()`
- Connect to MinIO
- Create bucket if doesn't exist
- Set public download policy

##### 2. `storeAudioChunk(sessionId, audioChunk, chunkIndex)`
```javascript
// Input: 
//   sessionId: string
//   audioChunk: Buffer
//   chunkIndex: number
// Output: objectKey: string
// 
// Storage path: sessions/{sessionId}/chunk_{chunkIndex:05d}_{timestamp}.webm
// Metadata: X-Session-Id, X-Chunk-Index, X-Timestamp headers
```

**Process**:
1. Generate unique object key with timestamp
2. Convert Buffer to stream
3. Upload to MinIO with metadata headers
4. Log operation

##### 3. `getSessionAudio(sessionId)`
```javascript
// Returns: Array of chunk objects sorted by chunk index
// Each chunk object: {key, size, lastModified}
```

**Process**:
1. List all objects with prefix `sessions/{sessionId}/`
2. Parse chunk index from filename
3. Sort by chunk index
4. Return sorted list

##### 4. `downloadAndMergeAudio(sessionId)`
```javascript
// Downloads and concatenates all chunks into complete audio buffer
// Input: sessionId
// Output: Buffer (complete audio data)
```

**Process**:
1. Get list of all chunks
2. Download each chunk as stream
3. Convert streams to buffers
4. Concatenate in order
5. Return merged buffer

**Performance Characteristics**:
- Streaming download (memory efficient)
- Sequential concatenation
- Proper error handling

##### 5. `cleanupSessionAudio(sessionId)`
```javascript
// Deletes all audio chunks for a session after processing
// Input: sessionId
// Output: deletedCount: number
```

**Purpose**: Cleanup after successful transcription to save storage

##### 6. `getPresignedUrl(objectKey, expirySeconds = 3600)`
```javascript
// Generates temporary download URL for audio file
// Useful for sharing or long-term access without direct S3 credentials
```

##### 7. `getStats()`
```javascript
// Returns storage statistics
// Output: {totalObjects, totalSize, totalSizeMB}
```

#### Dependencies

```json
{
  "minio": "^7.1.3"           // MinIO client library
}
```

### Storage Architecture

```
MinIO S3-Compatible Storage
│
└─ voice-audio (bucket)
   └─ sessions/
      └─ {sessionId}/
         ├─ chunk_00001_{timestamp}.webm
         ├─ chunk_00002_{timestamp}.webm
         ├─ chunk_00003_{timestamp}.webm
         └─ ...
```

### Production Storage Flow

**File**: `backend/socketHandlers/voiceHandlersProd.js`

```javascript
// Audio chunk received from client
socket.on('voice:audio-chunk', async (data) => {
  // NEVER store in memory!
  const buffer = Buffer.isBuffer(data.audioChunk) 
    ? data.audioChunk 
    : Buffer.from(data.audioChunk);
  
  // Stream directly to MinIO
  await audioStorage.storeAudioChunk(
    sessionId, 
    buffer, 
    chunkIndex
  );
  
  // If last chunk, queue STT job
  if (isLastChunk) {
    await addSTTJob({ sessionId, userId, socketId });
  }
});
```

---

## Voice Orchestration and Workflow

### Main Orchestrator

**File**: `backend/services/voiceOrchestrator.js`

**Purpose**: Coordinates the complete voice conversation flow

```javascript
class VoiceOrchestrator {
  constructor() {
    this.activeSessions = new Map();  // sessionId -> session state
  }
}
```

#### Complete Workflow Diagram

```
User Speaks (Audio Captured)
    ↓
voice:audio-chunk events
    ↓
voiceOrchestrator.processVoiceInput()
    ├─→ Update session state: isProcessing = true
    ├─→ emitToUser('voice:processing', {status: 'transcribing'})
    │
    ├─→ transcribeAudio(audioBuffer, language)
    │   ├─→ sttService.transcribe()
    │   ├─→ Try HuggingFace → OpenAI → Browser
    │   └─→ emitToUser('voice:transcribed', {text, language})
    │
    ├─→ Get/Create Conversation
    │
    ├─→ Save User Message
    │
    ├─→ emitToUser('voice:processing', {status: 'thinking'})
    │
    ├─→ generateAIResponse(conversationId, userMessage, context)
    │   ├─→ Build message history
    │   ├─→ Fetch lesson context (if applicable)
    │   ├─→ Call aiOrchestrator.tutorChat()
    │   ├─→ Get Groq LLM response
    │   └─→ Save AI message
    │
    ├─→ Update session metrics
    │
    ├─→ Update session state: isProcessing = false, isSpeaking = true
    │
    └─→ emitToUser('voice:response', {text, messageId, shouldSpeak})
            ↓
        Client receives AI response
            ↓
        Client uses Web Speech Synthesis to speak response
            ↓
        voice:tts-complete event
            ↓
        Ready for next input
```

#### Core Methods

##### 1. `initializeSession(userId, sessionId, settings = {})`

**Purpose**: Create or fetch voice session

**Process**:
1. Find or create Session in database
2. Store in activeSessions Map
3. Emit session initialized event
4. Record initialization event

**Returns**: Session object

##### 2. `processVoiceInput(sessionId, audioBuffer, metadata = {})`

**Purpose**: Main entry point for voice input processing

**Process**:

1. **Load Session**
   - Fetch from database
   - Validate authorization

2. **Update State**
   - Set `isProcessing = true`
   - Set `isRecording = false`
   - Emit processing status

3. **Transcribe Audio**
   - Call `transcribeAudio()` with STT service
   - Handle fallback to browser STT if needed
   - Emit transcription event

4. **Get/Create Conversation**
   - Check if session has conversation
   - Create if missing

5. **Save User Message**
   - Create Message document
   - Store in conversation
   - Update session metrics

6. **Generate AI Response**
   - Call `generateAIResponse()`
   - Save AI message
   - Update metrics

7. **Emit Response**
   - Send response to client
   - Include `shouldSpeak` flag
   - Include metadata

8. **Return Result**
   - transcription text
   - AI response text
   - Message ID

##### 3. `transcribeAudio(audioBuffer, language = 'en')`

**Purpose**: Transcribe audio using fallback chain

**Returns**:
```javascript
{
  text: string,
  language: string,
  provider: 'huggingface' | 'openai' | 'browser',
  useBrowserSTT?: boolean,
  fallbackInstructions?: object,
  errors?: array
}
```

##### 4. `generateAIResponse(conversationId, userMessage, context, sessionId)`

**Purpose**: Generate AI tutoring response

**Process**:

1. **Build Conversation History**
   - Fetch last 20 messages
   - Format as Q&A pairs

2. **Fetch Lesson Context** (if applicable)
   - Load lesson if sessionId provided
   - Extract lesson content, objectives, examples
   - Get custom system prompt

3. **Build System Prompt**
   ```javascript
   {
     subject: context.currentTopic,
     level: context.level,
     phase: context.phase,
     conversationHistory: [...],
     lessonContext: {
       title, content, objectives, keyPoints, examples, teachingStyle
     },
     customSystemPrompt: ...,
     contextGuidelines: ...
   }
   ```

4. **Call AI Orchestrator**
   - `aiOrchestrator.tutorChat(enhancedMessage, systemContext)`
   - Uses Groq LLM with enhanced context

5. **Save AI Message**
   - Store response in Message collection
   - Include metadata (model, tokens, thinking)

6. **Return Response**
   ```javascript
   {
     text: string,
     model: string,
     thinkingProcess: array,
     tokensUsed: number
   }
   ```

##### 5. `endSession(sessionId)`

**Purpose**: Properly close voice session

**Process**:
1. Update voice state (all false)
2. Record end event
3. Calculate duration
4. Update final metrics
5. Remove from active sessions
6. Emit end event

##### 6. `updateContext(sessionId, context)`

**Purpose**: Update session context for personalization

**Example Context**:
```javascript
{
  currentTopic: 'Photosynthesis',
  level: 'intermediate',
  phase: 'explanation',
  learningGoals: ['understand process', 'name stages'],
  questionsAsked: 3
}
```

#### Session State Management

```javascript
activeSessions.set(sessionId, {
  userId: string,
  conversationHistory: [
    {
      user: string,
      assistant: string,
      timestamp: number
    }
  ],
  isProcessing: boolean,
  startTime: number
});
```

### Production Orchestrator

**File**: `backend/services/voiceOrchestratorProd.js`

**Enhanced Features**:

1. **Circuit Breaker Pattern**
   - Protects against Groq API failures
   - Opens after 50% failure rate
   - Auto-recovery with fallback

2. **Separate STT and AI Methods**
   - `processAudioWithSTT()` - Standalone transcription
   - `generateAIResponse()` - Standalone AI generation

3. **Better Error Handling**
   - Distinct error logging
   - External API call metrics

#### Circuit Breaker Configuration

```javascript
const breakerOptions = {
  timeout: 30000,               // 30 second timeout
  errorThresholdPercentage: 50, // Open after 50% failures
  resetTimeout: 60000           // Retry after 1 minute
};

this.groqBreaker = new CircuitBreaker(
  async (messages, options) => {
    return await groq.chat.completions.create({...});
  },
  breakerOptions
);
```

#### Fallback Response

When circuit is open:
```javascript
{
  choices: [{
    message: {
      content: "I'm experiencing high load right now. Please try again in a moment."
    }
  }],
  usage: { total_tokens: 0 }
}
```

---

## Data Models

### VoiceSession Schema

**File**: `backend/models/VoiceSession.js`

```mongodb
{
  userId: ObjectId,                  // User reference (indexed)
  conversationId: ObjectId,          // Conversation reference (indexed)
  lesson: ObjectId,                  // Optional lesson reference
  enrollment: ObjectId,              // Optional enrollment reference
  status: 'active' | 'ended' | 'paused',
  language: 'en-US',
  isProcessing: false,
  
  settings: {
    sttMode: 'auto' | 'browser' | 'server',
    ttsEnabled: true,
    autoSpeak: true,
    language: 'en-US'
  },
  
  metadata: {
    totalMessages: 0,
    totalDuration: 0,
    averageResponseTime: 0,
    sttProvider: 'browser' | 'huggingface' | 'openai' | null
  },
  
  startedAt: Date,
  endedAt: Date,
  lastActivityAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `{userId: 1, status: 1}` - Find active sessions
- `{userId: 1, createdAt: -1}` - User history
- `{lastActivityAt: -1}` - Cleanup inactive

### Session Schema (Extended)

**File**: `backend/models/Session.js`

```mongodb
{
  userId: ObjectId,
  conversationId: ObjectId,
  lesson: ObjectId,
  enrollment: ObjectId,
  
  title: 'AI Tutoring Session',
  subject: 'General',
  status: 'active' | 'paused' | 'completed' | 'idle',
  sessionType: 'voice' | 'text' | 'mixed',
  
  voiceState: {
    isRecording: false,
    isSpeaking: false,
    isProcessing: false,
    lastTranscript: '',
    audioQuality: 'low' | 'medium' | 'high'
  },
  
  metrics: {
    duration: 0,                   // seconds
    messageCount: 0,
    voiceMessageCount: 0,
    textMessageCount: 0,
    averageResponseTime: 0,        // ms
    totalTokensUsed: 0
  },
  
  events: [{
    type: 'started' | 'paused' | 'resumed' | 'ended' | 'voice_started' | 'voice_ended' | 'error',
    timestamp: Date,
    metadata: Mixed
  }],
  
  context: {
    currentTopic: '',
    learningGoals: [],
    keyPoints: [],
    questionsAsked: 0,
    conceptsExplained: []
  },
  
  audioRecordings: [{
    fileName: string,
    duration: number,
    timestamp: Date,
    transcriptId: ObjectId,
    size: number,
    url: string
  }],
  
  settings: {
    voiceEnabled: true,
    autoTranscribe: true,
    ttsEnabled: true,
    language: 'en-US',
    ttsVoice: 'default',
    ttsSpeed: 1.0
  },
  
  startedAt: Date,
  lastActiveAt: Date,
  endedAt: Date
}
```

### Message Schema

**File**: `backend/models/Message.js`

```mongodb
{
  conversation: ObjectId,
  user: ObjectId,
  role: 'user' | 'assistant',
  content: string,
  
  metadata: {
    isVoice: boolean,
    audioMetadata?: {
      duration?: number,
      quality?: string
    },
    transcriptionLanguage?: string,
    model?: string,
    thinkingProcess?: array,
    tokensUsed?: number,
    sttProvider?: string
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

---

## Integration Points

### Frontend Components

**Location**: `frontend/src/`

Key components (not fully analyzed, but referenced):
- `VoiceChat.jsx` - Main UI component
- `services/voiceWebSocket.js` - Socket.IO client
- `services/browserSTT.js` - Web Speech API wrapper
- `services/ttsService.js` - Web Speech Synthesis wrapper
- `services/audioRecorder.js` - MediaRecorder wrapper

### HTTP Routes

**File**: `backend/routes/voiceRoutes.js`

```
POST   /api/voice/session/init
       Initialize voice session

GET    /api/voice/session/:sessionId
       Get session details

PUT    /api/voice/session/:sessionId/settings
       Update session settings

POST   /api/voice/session/:sessionId/end
       End session

PUT    /api/voice/session/:sessionId/context
       Update session context

POST   /api/voice/sessions
       Create new voice session (with lesson/enrollment)

GET    /api/voice/sessions/:sessionId
       Get session details with populated references

GET    /api/voice/sessions
       Get user's session history

POST   /api/voice/upload-audio
       Upload and process audio file (alternative to WebSocket)
```

### Socket.IO Integration in Server

**File**: `backend/server.js`

```javascript
// Initialize Socket.IO
const io = initializeSocketIO(httpServer);

// Register voice handlers
registerVoiceHandlers(io);
```

### Queue Integration (Production)

**File**: `backend/queues/index.js`

**STT Queue**:
```javascript
export const sttQueue = new Queue('stt', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { age: 3600, count: 1000 },
    removeOnFail: { age: 86400 }
  }
});
```

**AI Response Queue**:
```javascript
export const aiQueue = new Queue('ai-response', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 2000 },
    ...
  }
});
```

**Job Submission** (Production Handler):
```javascript
// When last audio chunk received
await addSTTJob({ sessionId, userId, socketId });

// When text message processed
await addAIJob({ 
  conversationId, 
  userId, 
  message: sanitizedText, 
  socketId 
});
```

### Worker Processors

**File**: `backend/workers/sttWorker.js`

```javascript
export function createSTTWorker(io, voiceOrchestrator) {
  const worker = new Worker(
    'stt',
    async (job) => processSTTJob(job, io, voiceOrchestrator),
    {
      connection,
      concurrency: 5,          // 5 concurrent jobs
      limiter: {
        max: 10,              // 10 jobs
        duration: 1000        // per second
      }
    }
  );
  
  // Event handlers for job lifecycle
  worker.on('completed', ...);
  worker.on('failed', ...);
  worker.on('progress', ...);
  
  return worker;
}
```

**STT Job Process**:
1. Download audio chunks from MinIO
2. Transcribe with voiceOrchestrator.processAudioWithSTT()
3. Emit transcription event to user
4. Cleanup audio chunks
5. Return results

---

## Error Handling and Fallbacks

### STT Fallback Chain

```
Audio Input
    ↓
Try Hugging Face
    ├─ Success: Return transcription
    ├─ 503 (Loading): "Try again in 10-20s"
    ├─ 429 (Quota): Fallback
    └─ Other error: Fallback
    ↓
Try OpenAI Whisper
    ├─ Success: Return transcription
    ├─ insufficient_quota: Fallback
    ├─ 429 (Rate limit): Fallback
    └─ Other error: Fallback
    ↓
Fallback to Browser STT
    ├─ Emit 'voice:use-browser-stt' event
    ├─ Send instructions & errors
    └─ Client handles with Web Speech API
```

### Error Event Emissions

```javascript
socket.emit('voice:error', {
  error: 'Error message'
});

// Special fallback event
socket.emit('voice:use-browser-stt', {
  message: 'Using browser speech recognition (100% FREE, instant!)',
  instructions: {...},
  errors: [{provider: 'huggingface', error: '...'}]
});
```

### Graceful Degradation

1. **API Configuration Missing**
   - Automatically skip unavailable providers
   - Fall back to next in chain

2. **API Rate Limit**
   - Detected and reported
   - Trigger browser STT fallback
   - Log for monitoring

3. **Network Failure**
   - Timeout-based fallback (20s HF, 15s OpenAI)
   - Fast fail to browser STT
   - User notified via events

4. **Processing Failure**
   - Circuit breaker prevents cascading failures
   - Fallback response sent
   - Error logged with context

---

## Production Considerations

### Environment Configuration

```env
# STT Providers
HUGGINGFACE_API_KEY=your_hf_key
HF_TOKEN=alternative_hf_key
OPENAI_API_KEY=your_openai_key

# MinIO Storage
MINIO_ENDPOINT=minio.example.com
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=true

# Socket.IO
FRONTEND_URL=https://app.example.com

# Redis (Job Queues)
REDIS_URL=redis://redis:6379/0  # Cache
# Redis DB 1: Session cache
# Redis DB 2: Job queue data

# AI
GROQ_API_KEY=your_groq_key
```

### Performance Optimization

#### Chunking Strategy
- **Audio chunks**: ~4KB each (4096 samples @ 48kHz)
- **Accumulation**: In socket object (not global)
- **Processing**: Batch after `isLastChunk`

#### Rate Limiting (Production)
- STT: 5 concurrent jobs, 10/second max
- AI: 2 concurrent jobs, 10/second max
- Socket events: Per-socket rate limiting

#### MinIO Optimization
- Stream direct from socket → MinIO (no memory buffering)
- Cleanup immediately after STT
- Presigned URLs for temporary access

#### AI Response Caching
- Industry-level memory system
- Conversation history (last 20 messages)
- Multi-tiered memory architecture

### Monitoring and Logging

**Logger**: Winston (backend/config/logger.js)

Key metrics logged:
- STT provider and success rate
- AI response time and token usage
- Session duration and message counts
- Queue job completion and failures
- External API call latency

### Deployment Checklist

- [ ] All environment variables configured
- [ ] MinIO bucket and permissions created
- [ ] Redis instances running (3 DBs needed)
- [ ] MongoDB collections indexed
- [ ] JWT secret configured
- [ ] SSL certificates for production
- [ ] Rate limiting configured
- [ ] Circuit breaker thresholds tuned
- [ ] Logging aggregation setup
- [ ] API key quotas verified (OpenAI, Hugging Face, Groq)

---

## Summary

### Architecture Strengths

1. **Resilient**: Multi-tier fallback chain ensures service availability
2. **Cost-effective**: Free browser STT, free embeddings, Groq LLM
3. **Real-time**: WebSocket streaming for low-latency communication
4. **Scalable**: Job queues and horizontal scaling capabilities
5. **Production-ready**: Circuit breakers, rate limiting, monitoring
6. **User-friendly**: Intelligent fallbacks without user intervention

### Key Files Reference

| Component | File(s) |
|-----------|---------|
| STT Service | `backend/services/sttService.js` |
| Voice Orchestrator | `backend/services/voiceOrchestrator.js` |
| Audio Storage | `backend/services/audioStorage.js` |
| Socket Handlers | `backend/socketHandlers/voiceHandlers.js` |
| Socket Config | `backend/config/socket.js` |
| Voice Routes | `backend/routes/voiceRoutes.js` |
| Voice Session Model | `backend/models/VoiceSession.js` |
| Session Model | `backend/models/Session.js` |
| Job Queues | `backend/queues/index.js` |
| STT Worker | `backend/workers/sttWorker.js` |
| Voice Controller | `backend/controllers/voiceSessionController.js` |

### Data Flow Summary

```
User Voice Input
    ↓
AudioBlob (WebM format)
    ↓
Socket.IO voice:audio-chunk events
    ↓
voiceHandlers.js (accumulates chunks)
    ↓
voiceOrchestrator.processVoiceInput()
    ├─→ sttService.transcribe() [HF → OpenAI → Browser]
    ├─→ Save Message to MongoDB
    ├─→ aiOrchestrator.tutorChat() [Groq LLM]
    └─→ Save AI Response
    ↓
Emit voice:response event to client
    ↓
Client Web Speech Synthesis (TTS)
    ↓
Client-side playback
    ↓
voice:tts-complete event
    ↓
Ready for next input
```

