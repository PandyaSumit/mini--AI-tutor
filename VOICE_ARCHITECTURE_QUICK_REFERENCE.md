# Voice and Speech Processing Architecture - Quick Reference

## Executive Summary

The Mini AI Tutor implements a **hybrid voice processing architecture** with intelligent fallback chains, real-time WebSocket streaming, and production-grade resilience. The system prioritizes **cost-effectiveness** (free browser STT), **reliability** (multi-tier fallbacks), and **scalability** (job queues + distributed storage).

---

## Key Architecture Decisions

### 1. Multi-Tier STT Fallback Chain
```
Hugging Face (Free) → OpenAI Whisper → Browser Web Speech API (Free)
- Automatic failover with 20s/15s timeouts
- No user intervention needed
- Graceful degradation when all server-side options fail
```

### 2. Client-Side TTS Only
```
Browser Web Speech Synthesis API (window.speechSynthesis)
- Zero API costs
- Zero latency (no network roundtrip)
- Works offline
- Multi-language support built-in
```

### 3. Real-Time WebSocket Streaming
```
Socket.IO → Audio chunks streamed in real-time
- 100 MB max buffer (for large audio)
- Ping/pong keep-alives (25s interval, 60s timeout)
- User room broadcasting (user:{userId})
```

### 4. Asynchronous Job Processing
```
BullMQ + Redis for STT and AI response generation
- 5 concurrent STT jobs, 10/second rate limit
- 2 concurrent AI jobs (to save costs)
- 3 retry attempts with exponential backoff
```

### 5. Distributed Audio Storage
```
MinIO S3-Compatible Storage (never in memory!)
- Chunk streaming directly to MinIO
- Cleanup after successful transcription
- Presigned URLs for temporary access
```

---

## Core Components

### Frontend
- **Web Speech API** (STT) - Built-in browser API
- **Web Speech Synthesis** (TTS) - Built-in browser API
- **Socket.IO Client** - Real-time bidirectional communication
- **MediaRecorder API** - Audio capture and chunking

### Backend Services

| Service | File | Purpose |
|---------|------|---------|
| **STT Service** | `services/sttService.js` | Fallback chain for transcription |
| **Voice Orchestrator** | `services/voiceOrchestrator.js` | Main workflow coordination |
| **Audio Storage** | `services/audioStorage.js` | MinIO integration |
| **Voice Handlers** | `socketHandlers/voiceHandlers.js` | Socket event processing |
| **AI Orchestrator** | `services/aiOrchestrator.js` | LLM response generation |

### Data Models

| Model | File | Purpose |
|-------|------|---------|
| **VoiceSession** | `models/VoiceSession.js` | Voice-specific session tracking |
| **Session** | `models/Session.js` | General session management |
| **Message** | `models/Message.js` | Conversation persistence |
| **Conversation** | `models/Conversation.js` | Conversation threading |

---

## Socket.IO Event Flow

### Client → Server (User Actions)

```
voice:join                    Initialize voice session
voice:start-recording        Start recording
voice:stop-recording         Complete recording
voice:audio-chunk            Stream audio chunk
voice:text-message          Text fallback (from browser STT)
voice:tts-complete          TTS playback finished
voice:leave                 Leave session gracefully
voice:end                   End session immediately
voice:settings-update       Update session settings (prod)
```

### Server → Client (Status Updates)

```
voice:joined                Session initialized
voice:recording-started     Recording active
voice:recording-stopped     Recording stopped
voice:transcribed          STT complete (text ready)
voice:processing           Processing update (status + progress)
voice:response             AI response ready (trigger TTS)
voice:use-browser-stt      Fallback to browser STT
voice:ready                Ready for next input
voice:error                Error occurred
voice:ended                Session ended
```

---

## STT Implementation Details

### Fallback Chain Logic

```javascript
1. Check available providers (env vars)
   ├─ HUGGINGFACE_API_KEY/HF_TOKEN → "huggingface"
   ├─ OPENAI_API_KEY → "openai"
   └─ Always → "browser"

2. Try Hugging Face (if configured)
   ├─ Endpoint: api-inference.huggingface.co
   ├─ Model: openai/whisper-large-v3
   ├─ Timeout: 20 seconds
   └─ Error detection: 503 (loading), 429 (quota)

3. Try OpenAI (if HF fails)
   ├─ Endpoint: api.openai.com/v1/audio/transcriptions
   ├─ Model: whisper-1
   ├─ Timeout: 15 seconds
   └─ Error detection: insufficient_quota, rate limits

4. Fallback to Browser STT
   ├─ Emit 'voice:use-browser-stt' event
   ├─ Include instructions + previous errors
   └─ Client handles with Web Speech API
```

### Key Error Handling

```javascript
// Quota exceeded → Trigger fallback
if (error.response?.data?.error?.code === 'insufficient_quota') {
  // Try next provider
}

// Rate limited → Trigger fallback
if (error.response?.status === 429) {
  // Try next provider
}

// Model loading → Helpful message
if (error.response?.status === 503) {
  throw new Error('Model is loading, try again in 10-20 seconds');
}
```

---

## Voice Session Lifecycle

```
┌─────────────────────────────────────────┐
│ 1. INITIALIZE (voice:join)              │
│    ├─ Create/fetch Session              │
│    ├─ Store in activeSessions map       │
│    └─ Emit voice:joined event           │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 2. RECORDING                            │
│    ├─ voice:start-recording             │
│    ├─ Accumulate audio chunks           │
│    └─ voice:stop-recording              │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 3. PROCESSING                           │
│    ├─ STT: transcribeAudio()            │
│    ├─ Create/get Conversation           │
│    ├─ Save user Message                 │
│    ├─ AI: generateAIResponse()          │
│    ├─ Save AI Message                   │
│    └─ Update metrics                    │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 4. RESPONSE                             │
│    ├─ Emit voice:response event         │
│    ├─ Client: Web Speech Synthesis      │
│    └─ Client: voice:tts-complete        │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 5. READY FOR NEXT INPUT                 │
│    └─ Emit voice:ready event            │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 6. TERMINATE (voice:leave or end)       │
│    ├─ Mark session as ended             │
│    ├─ Calculate duration                │
│    ├─ Update metrics                    │
│    ├─ Cleanup MinIO audio (prod)        │
│    └─ Emit voice:ended event            │
└─────────────────────────────────────────┘
```

---

## Audio Streaming Architecture

### Development (In-Memory)

```
Client Audio Chunks
    ↓
WebSocket voice:audio-chunk
    ↓
voiceHandlers.js accumulates in socket.audioChunks[]
    ↓
Last chunk received (isLastChunk = true)
    ↓
Buffer.concat() all chunks
    ↓
processVoiceInput() executes STT + AI
```

### Production (MinIO Storage)

```
Client Audio Chunks
    ↓
WebSocket voice:audio-chunk
    ↓
voiceHandlersProd.js rate limiting
    ↓
audioStorage.storeAudioChunk() → MinIO
    ↓
Last chunk received
    ↓
Queue STT job via BullMQ
    ↓
sttWorker downloads + merges from MinIO
    ↓
Cleanup: audioStorage.cleanupSessionAudio()
```

### Audio Format Specifications

```
Format: WebM (Vorbis codec)
Sample Rate: 48 kHz
Channels: Mono (1)
Bitrate: ~128 kbps
Frame Size: 4096 samples
Max Upload: 10 MB
```

---

## API Endpoints (HTTP)

### Session Management

```
POST   /api/voice/session/init
       Create or fetch active voice session
       Body: {settings: {language?, ...}}
       Returns: {session: {id, status, settings, ...}}

POST   /api/voice/sessions
       Create new voice session with lesson/enrollment
       Body: {lesson?, enrollment?, title?}
       Returns: {session, voiceSession}

GET    /api/voice/sessions/:sessionId
       Get session details with populated references
       Returns: {session: {...}}

GET    /api/voice/sessions
       Get user's session history
       Query: {limit?, skip?}
       Returns: {sessions: [...], pagination: {...}}

PUT    /api/voice/session/:sessionId/settings
       Update session settings
       Body: {settings: {...}}
       Returns: {session}

PUT    /api/voice/session/:sessionId/context
       Update session context for personalization
       Body: {context: {...}}
       Returns: {session}

POST   /api/voice/session/:sessionId/end
       End voice session
       Returns: {session}

POST   /api/voice/upload-audio
       Upload and process audio file (alternative to WebSocket)
       Body: FormData {sessionId, audio: File}
       Returns: {result: {...}}
```

---

## Configuration Environment Variables

### Required for Production

```env
# STT Providers
HUGGINGFACE_API_KEY=xxx        # or HF_TOKEN=xxx
OPENAI_API_KEY=xxx            # Optional but recommended

# AI/LLM
GROQ_API_KEY=xxx

# MinIO Storage
MINIO_ENDPOINT=minio.example.com
MINIO_PORT=9000
MINIO_ACCESS_KEY=xxx
MINIO_SECRET_KEY=xxx
MINIO_USE_SSL=true

# Database
MONGODB_URI=mongodb+srv://...

# Cache/Queues
REDIS_URL=redis://redis:6379
# Note: Uses Redis DBs 0 (cache), 1 (sessions), 2 (jobs)

# Socket.IO
FRONTEND_URL=https://app.example.com

# JWT
JWT_SECRET=your_secret_key
```

---

## Performance Characteristics

### STT Latency

| Provider | Latency | Reliability | Cost |
|----------|---------|-------------|------|
| Hugging Face | 5-10s | 95% | Free |
| OpenAI Whisper | 10-15s | 98% | $0.006/min |
| Browser Web Speech | <1s | 90% | Free |

### AI Response Latency

- Groq LLM: 2-5 seconds (via circuit breaker)
- Message retrieval: <100ms
- Database operations: <50ms

### Memory Usage

- Development: ~50MB base + audio chunks (temporary)
- Production: ~20MB base (audio → MinIO immediately)
- Socket buffer: Max 100MB (configurable)

### Storage

- Audio chunks: ~128 kbps × duration
- Sessions: ~1KB per session + metadata
- Messages: ~500 bytes per message
- Auto-cleanup: After successful STT

---

## Error Scenarios and Handling

### Scenario 1: All Server-Side STT Fails

```
User speaks → HF fails → OpenAI fails
    ↓
Server emits 'voice:use-browser-stt' event
    ↓
Client receives instructions + previous errors
    ↓
Client switches to Web Speech API
    ↓
Client sends text via 'voice:text-message' event
    ↓
Server processes as text input (skip STT)
```

### Scenario 2: Network Interruption During Audio Streaming

```
Client sending chunks → Socket disconnects
    ↓
Partial chunks accumulated in MinIO (prod)
    ↓
Session marked as error
    ↓
Client reconnects and retries
    ↓
Old chunks cleaned up on retry
```

### Scenario 3: Groq API Circuit Breaker Opens

```
50% of Groq calls fail → Circuit breaker opens
    ↓
All subsequent calls get fallback response
    ↓
Circuit half-open after 60s
    ↓
Test request sent
    ↓
Success: Circuit closes, normal operation resumes
```

---

## Production Deployment Checklist

```
[ ] STT API keys configured and quotas verified
[ ] MinIO running with voice-audio bucket created
[ ] Redis instances running (DBs 0, 1, 2)
[ ] MongoDB indexes created
[ ] Socket.IO CORS origins configured
[ ] Rate limiting configured (5 STT, 2 AI jobs/second)
[ ] Circuit breaker thresholds tuned (50% error = open)
[ ] Logging aggregation setup (Winston → ELK/CloudWatch)
[ ] SSL certificates installed
[ ] JWT secret configured
[ ] Health monitoring for external APIs
[ ] Audio retention policy defined (cleanup frequency)
[ ] Backup strategy for MinIO storage
```

---

## Key Files Location Summary

```
BACKEND SERVICES:
  services/sttService.js              → STT with fallback chain
  services/voiceOrchestrator.js       → Main workflow
  services/voiceOrchestratorProd.js   → Production variant
  services/audioStorage.js            → MinIO integration
  services/aiOrchestrator.js          → LLM integration

SOCKET HANDLERS:
  socketHandlers/voiceHandlers.js     → Development handlers
  socketHandlers/voiceHandlersProd.js → Production handlers

CONTROLLERS & ROUTES:
  controllers/voiceSessionController.js → HTTP endpoints
  routes/voiceRoutes.js                → Route definitions

DATA MODELS:
  models/VoiceSession.js   → Voice-specific model
  models/Session.js        → General session model
  models/Message.js        → Message persistence
  models/Conversation.js   → Conversation threading

WORKERS & QUEUES:
  workers/sttWorker.js     → STT job processor
  queues/index.js          → Queue definitions

CONFIGURATION:
  config/socket.js         → Socket.IO setup
  config/ai.js             → AI service config
```

---

## Quick Start: Adding a New Voice Feature

### Example: Add custom voice model support

1. **Extend STT Service** (`services/sttService.js`)
   ```javascript
   async transcribeWithCustomModel(audioBuffer, language) {
     // Add new STT provider
   }
   ```

2. **Update Provider List** (`getProviders()`)
   ```javascript
   if (process.env.CUSTOM_MODEL_KEY) {
     providers.push('custom');
   }
   ```

3. **Update Fallback Chain** (`transcribe()`)
   ```javascript
   if (providers.includes('custom')) {
     try {
       return await this.transcribeWithCustomModel(...);
     } catch (error) {
       // Continue fallback
     }
   }
   ```

4. **Test Fallback** - Let it fail and verify it falls back to next provider

5. **Add Logging** - Use logger for monitoring new provider usage

---

## Common Integration Patterns

### Pattern 1: Override TTS Voice per User

```javascript
// In VoiceSession settings
settings: {
  ttsVoice: 'google.en-US-Neural2-C',  // Custom voice
  ttsSpeed: 1.2,
  ttsLanguage: 'en-US'
}

// Frontend uses in Web Speech Synthesis
const utterance = new SpeechSynthesisUtterance(text);
utterance.voice = window.speechSynthesis.getVoices()
  .find(v => v.name === session.settings.ttsVoice);
```

### Pattern 2: Context-Aware AI Responses

```javascript
// Pass lesson context to generateAIResponse()
const context = {
  currentTopic: 'Photosynthesis',
  level: 'intermediate',
  lessonId: sessionId,
  customSystemPrompt: lesson.systemPrompt
};

await voiceOrchestrator.generateAIResponse(
  conversationId,
  userMessage,
  context,
  sessionId
);
```

### Pattern 3: Audio Analytics

```javascript
// Track STT provider performance
metadata: {
  sttProvider: 'huggingface' | 'openai' | 'browser',
  transcriptionQuality: 0.95,
  processingTime: 5230  // ms
}

// Query for analytics
VoiceSession.aggregate([
  { $match: { sttProvider: 'browser' } },
  { $group: { _id: '$sttProvider', count: { $sum: 1 } } }
]);
```

---

## Troubleshooting Guide

### Issue: "No STT provider available"

**Symptoms**: All STT methods return useBrowserSTT: true

**Causes**: API keys not configured, quotas exceeded

**Solution**:
1. Verify HUGGINGFACE_API_KEY or OPENAI_API_KEY set
2. Check API quota usage in provider dashboard
3. Temporarily disable providers: Set env vars to empty
4. Check logs: Look for specific error messages

### Issue: Audio chunks not received

**Symptoms**: No transcription, stuck on "processing"

**Causes**: Network interruption, socket disconnection, payload too large

**Solution**:
1. Check Socket.IO maxHttpBufferSize (100MB configured)
2. Verify WebSocket connection status
3. Check browser console for errors
4. Try smaller audio chunks (4KB instead of larger)

### Issue: MinIO storage errors

**Symptoms**: "MinIO client not initialized"

**Causes**: MinIO not running, bucket permission issues

**Solution**:
1. Verify MinIO is running: `docker-compose ps`
2. Check credentials in .env
3. Verify bucket exists: `mc ls minio/voice-audio`
4. Check bucket policy allows uploads

### Issue: Groq circuit breaker open

**Symptoms**: "I'm experiencing high load right now..."

**Causes**: Groq API errors exceeding 50% threshold

**Solution**:
1. Check Groq API status dashboard
2. Wait 60 seconds for circuit to half-open
3. Verify GROQ_API_KEY is correct
4. Check rate limiting isn't being hit
5. Monitor logs for specific API errors

---

## Monitoring and Metrics

### Key Metrics to Track

```javascript
// STT Performance
- transcriptions_total (by provider)
- transcription_latency (by provider)
- transcription_failures (by error type)
- fallback_to_browser_percentage

// AI Performance
- response_generation_latency
- ai_errors (by error type)
- circuit_breaker_open_events

// Session Performance
- active_sessions_count
- session_duration (avg, p50, p95)
- messages_per_session
- error_rate_per_session

// Storage Performance
- audio_chunks_stored
- storage_cleanup_latency
- failed_cleanup_count

// WebSocket Performance
- active_connections
- connection_errors
- message_delivery_latency
```

### Recommended Monitoring Stack

```
Backend Logs: Winston → CloudWatch/ELK
Metrics: Prometheus + Grafana
Tracing: OpenTelemetry (already configured)
Alerts: CloudWatch/PagerDuty thresholds
```

---

