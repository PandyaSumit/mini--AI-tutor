# Two-Way Voice + Text AI Tutor - Setup Guide

## Overview

This implementation provides a **real-time, two-way voice and text communication** system for the AI Tutor. It supports:

- ✅ **Real-time WebSocket communication** (Socket.IO)
- ✅ **Speech-to-Text (STT)** using OpenAI Whisper API
- ✅ **Text-to-Speech (TTS)** using browser's Web Speech API (free!)
- ✅ **Two-way conversation** with AI tutor
- ✅ **Session management** and history
- ✅ **Mixed voice + text input**
- ✅ **Free tier compatible** (no paid services required for basic usage)

---

## Architecture

### Backend Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                        │
│  - Microphone Input (MediaRecorder API)                     │
│  - Text-to-Speech (Web Speech API)                          │
│  - WebSocket Connection (Socket.IO)                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ WebSocket (wss://)
┌─────────────────────────────────────────────────────────────┐
│                   Backend Server (Node.js)                  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  WebSocket Layer (Socket.IO)                         │  │
│  │  - Voice event handlers                              │  │
│  │  - Session management                                │  │
│  │  - Real-time communication                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Voice Orchestrator                                  │  │
│  │  - Process voice input                               │  │
│  │  - Manage conversation flow                          │  │
│  │  - Coordinate STT → AI → Response                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│         ┌──────────────────┼──────────────────┐            │
│         ▼                  ▼                  ▼             │
│  ┌───────────┐   ┌──────────────┐   ┌──────────────┐      │
│  │    STT    │   │      AI      │   │   Session    │      │
│  │  Service  │   │ Orchestrator │   │   Manager    │      │
│  │ (Whisper) │   │   (LLM)      │   │  (MongoDB)   │      │
│  └───────────┘   └──────────────┘   └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User speaks → Audio recorded → Sent via WebSocket → STT (Whisper)
    → Transcription → AI Processing → Response text
    → Sent to client → TTS speaks response → Ready for next input
```

---

## Installation

### 1. Backend Setup

#### Install Dependencies

```bash
cd backend
npm install
```

**New Dependencies Added:**
- `socket.io` - WebSocket server
- `multer` - File upload handling (for audio files)

#### Environment Variables

Add to `backend/.env`:

```env
# OpenAI API Key (for Whisper STT)
OPENAI_API_KEY=your_openai_api_key_here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Server Port
PORT=5000

# JWT Secret (if not already set)
JWT_SECRET=your_jwt_secret_here

# MongoDB Connection (if not already set)
MONGODB_URI=your_mongodb_connection_string
```

**Note:** OpenAI offers a free tier with limited requests. For production, you may want to implement rate limiting or use browser-based STT fallback.

### 2. Frontend Setup

#### Install Dependencies

```bash
cd frontend
npm install
```

**New Dependencies Added:**
- `socket.io-client` - WebSocket client

#### Environment Variables

Add to `frontend/.env`:

```env
# WebSocket URL
VITE_WS_URL=http://localhost:5000

# API URL (if not already set)
VITE_API_URL=http://localhost:5000/api
```

---

## Usage

### Starting the Application

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```

   You should see:
   ```
   ✅ WebSocket (Socket.IO) initialized for voice sessions
   🔌 WebSocket server ready for voice sessions
   🚀 Server running on port 5000
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

### Using Voice Chat

#### In Your React Components

```jsx
import VoiceChat from '../components/VoiceChat';
import { useAuth } from '../context/AuthContext';

function SessionPage() {
  const { token } = useAuth();

  const handleMessage = (message) => {
    console.log('New message:', message);
  };

  return (
    <div className="h-screen">
      <VoiceChat
        token={token}
        onMessage={handleMessage}
      />
    </div>
  );
}
```

#### Voice Interaction Flow

1. **Connect:** Component automatically connects to WebSocket server
2. **Start Session:** Session is automatically created
3. **Voice Input:**
   - Click microphone button
   - Speak your question
   - Click again to stop
   - Audio is automatically transcribed and sent to AI
4. **Text Input:** Alternatively, type your message and press Enter
5. **AI Response:** Response is displayed and optionally spoken aloud
6. **Continue:** Repeat for ongoing conversation

---

## API Endpoints

### REST API

#### Initialize Voice Session
```http
POST /api/voice/session/init
Authorization: Bearer <token>
Content-Type: application/json

{
  "settings": {
    "voiceEnabled": true,
    "ttsEnabled": true,
    "language": "en-US"
  }
}
```

#### Get Session Details
```http
GET /api/voice/session/:sessionId
Authorization: Bearer <token>
```

#### End Session
```http
POST /api/voice/session/:sessionId/end
Authorization: Bearer <token>
```

#### Get Session History
```http
GET /api/voice/sessions?limit=10&skip=0
Authorization: Bearer <token>
```

### WebSocket Events

#### Client → Server

| Event | Data | Description |
|-------|------|-------------|
| `voice:join` | `{ sessionId?, settings }` | Join or create session |
| `voice:start-recording` | `{ sessionId }` | Start recording |
| `voice:stop-recording` | `{ sessionId, audioBlob, metadata }` | Stop and send audio |
| `voice:text-message` | `{ sessionId, text }` | Send text message |
| `voice:leave` | `{ sessionId }` | Leave session |
| `voice:end` | `{ sessionId }` | End session permanently |

#### Server → Client

| Event | Data | Description |
|-------|------|-------------|
| `voice:joined` | `{ sessionId, status, settings }` | Session joined |
| `voice:processing` | `{ sessionId, status }` | Processing status update |
| `voice:transcribed` | `{ sessionId, text, language }` | Speech transcribed |
| `voice:response` | `{ sessionId, text, shouldSpeak }` | AI response |
| `voice:ready` | `{ sessionId }` | Ready for next input |
| `voice:error` | `{ error }` | Error occurred |

---

## Database Schema

### Session Model

```javascript
{
  userId: ObjectId,
  conversationId: ObjectId,
  title: String,
  status: 'active' | 'paused' | 'completed' | 'idle',
  sessionType: 'voice' | 'text' | 'mixed',

  voiceState: {
    isRecording: Boolean,
    isSpeaking: Boolean,
    isProcessing: Boolean,
    lastTranscript: String
  },

  metrics: {
    duration: Number,
    messageCount: Number,
    voiceMessageCount: Number,
    textMessageCount: Number,
    totalTokensUsed: Number
  },

  settings: {
    voiceEnabled: Boolean,
    ttsEnabled: Boolean,
    language: String
  },

  timestamps: true
}
```

---

## Free Tier Limits

### OpenAI Whisper STT
- **Free tier:** Limited requests per month
- **Alternative:** Browser Web Speech API (client-side, free)
- **Fallback:** Automatically suggests browser API if quota exceeded

### Web Speech API (TTS)
- **Cost:** Completely free
- **Support:** Most modern browsers (Chrome, Edge, Safari)
- **Quality:** Good natural voices

### Socket.IO
- **Cost:** Free (self-hosted)
- **Scalability:** Can handle thousands of concurrent connections

---

## Browser Support

### Required Features
- ✅ MediaRecorder API (for audio recording)
- ✅ getUserMedia (for microphone access)
- ✅ Web Speech API (for TTS)
- ✅ WebSocket support

### Supported Browsers
- ✅ Chrome 60+
- ✅ Edge 79+
- ✅ Firefox 55+
- ✅ Safari 14.1+
- ✅ Opera 47+

---

## Troubleshooting

### 1. Microphone Access Denied

**Solution:** Browser requires HTTPS for microphone access in production.
- Development: Use `localhost` (allowed)
- Production: Deploy with SSL/TLS certificate

### 2. STT Rate Limit Exceeded

**Error:** "STT rate limit exceeded"

**Solution:**
- Use browser Web Speech API as fallback
- Implement client-side STT first, server-side as backup
- Add OpenAI API credits

### 3. WebSocket Connection Failed

**Error:** "Failed to connect to voice server"

**Check:**
1. Backend server is running
2. Port 5000 is accessible
3. CORS settings allow frontend origin
4. JWT token is valid

### 4. No Audio Output (TTS)

**Check:**
1. TTS is enabled (Volume icon should be highlighted)
2. Browser supports Web Speech API
3. System audio is not muted
4. Browser permissions allow audio playback

---

## Scaling Considerations

### For Production

1. **Load Balancing:**
   - Use sticky sessions for WebSocket connections
   - Redis adapter for Socket.IO across multiple servers

2. **STT Service:**
   - Consider self-hosted Whisper for unlimited usage
   - Implement queue system for audio processing
   - Cache common phrases/responses

3. **Database:**
   - Index on `userId`, `sessionId`, `createdAt`
   - Archive old sessions to separate collection
   - Implement session cleanup job

4. **Audio Storage:**
   - Store recordings in S3/Cloud Storage
   - Implement retention policy
   - Add compression for storage efficiency

---

## Security

### Authentication
- ✅ JWT token validation on WebSocket connection
- ✅ User verification for all voice events
- ✅ Session ownership validation

### Data Privacy
- Audio data transmitted over secure WebSocket
- Optional: Encrypt audio before transmission
- Delete recordings after processing (configurable)

### Rate Limiting
- Implement per-user rate limits
- Limit audio file sizes (10MB default)
- Limit session duration

---

## Performance Optimization

### Client-Side
- Use client-side STT when possible (free, instant)
- Compress audio before sending
- Implement audio chunk streaming for long recordings

### Server-Side
- Process audio asynchronously
- Implement caching for AI responses
- Use Redis for session state

---

## Future Enhancements

1. **Multi-language Support:** Auto-detect language, support 20+ languages
2. **Voice Profiles:** Personalized TTS voices per user
3. **Group Sessions:** Multi-user voice sessions
4. **Speech Analytics:** Emotion detection, sentiment analysis
5. **Offline Mode:** Browser-based STT/TTS for offline usage

---

## Support

For issues or questions:
1. Check logs: `backend/logs/` and browser console
2. Verify environment variables are set correctly
3. Test with simple HTTP endpoints before using WebSocket
4. Review WebSocket connection in browser DevTools → Network → WS

---

## License

MIT License - Free for personal and commercial use

---

## Credits

Built using:
- **Socket.IO** - Real-time communication
- **OpenAI Whisper** - Speech-to-text
- **Web Speech API** - Text-to-speech
- **Express.js** - Backend framework
- **React** - Frontend framework
- **MongoDB** - Database
