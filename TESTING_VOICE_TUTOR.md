# 🎤 Testing Voice AI Tutor - Quick Start Guide

## Where to Test

### Option 1: Dedicated Test Page (Recommended for Testing)
**URL:** `http://localhost:3000/voice-tutor`

1. **Login to your application**
2. **Click "Voice Tutor"** in the sidebar (marked with "NEW" badge)
3. You'll see a complete testing interface with:
   - Voice chat component
   - Step-by-step instructions
   - Debug logs panel
   - Browser compatibility checks

### Option 2: SessionDetails Page Integration
Integrate the VoiceChat component into your existing SessionDetails page at line 696.

---

## Pre-Testing Checklist

### 1. Backend Setup ✅

Make sure backend is running:
```bash
cd backend
npm install  # Install new dependencies (socket.io, form-data, multer)
npm run dev
```

**Expected output:**
```
✅ WebSocket (Socket.IO) initialized for voice sessions
🔌 WebSocket server ready for voice sessions
🚀 Server running on port 5000
```

### 2. Environment Variables ✅

**Backend** (`.env`):
```env
# Required for Speech-to-Text
OPENAI_API_KEY=your_openai_api_key_here

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# Server port
PORT=5000
```

**Frontend** (`.env`):
```env
# API Base URL
VITE_API_URL=http://localhost:5000/api

# WebSocket URL (REQUIRED for voice chat)
VITE_WS_URL=http://localhost:5000
```

### 3. Frontend Setup ✅

```bash
cd frontend
npm install  # Install new dependency (socket.io-client)
npm run dev
```

---

## Testing Steps

### Step 1: Access the Test Page

1. Navigate to: **http://localhost:3000/voice-tutor**
2. You should see:
   - ✅ Green "Connected" indicator (top left)
   - 🎤 Voice chat interface
   - 📝 Instructions panel
   - 🐛 Debug logs panel
   - ✅ Browser compatibility checks

### Step 2: Test Voice Input 🎤

1. **Click the blue microphone button**
   - Button should turn red and pulse (recording)
   - You should see "🎤 Recording... Click to stop" at the bottom

2. **Speak your question** (e.g., "Explain quantum physics to me")

3. **Click the microphone again to stop**
   - Audio is sent to backend
   - You'll see "Processing..." indicator
   - STT transcribes your speech
   - AI generates response
   - Response is displayed and spoken aloud

4. **Check the debug logs** for events:
   - Transcription received
   - AI response received

### Step 3: Test Text Input 💬

1. **Type a message** in the input box (e.g., "What is machine learning?")
2. **Press Enter** or click the send button
3. AI should respond with both text and voice

### Step 4: Test TTS (Text-to-Speech) 🔊

1. Look for the **Volume icon** in the header
   - Blue = TTS enabled (AI will speak)
   - Gray = TTS disabled (text only)

2. Click to toggle on/off

3. When enabled, AI responses will be spoken using your browser's speech synthesis

---

## Browser Compatibility Check

On the test page, check the "Browser Check" panel:

### Required Features:
- ✅ **MediaRecorder API** - For audio recording
- ✅ **getUserMedia** - For microphone access
- ✅ **Speech Synthesis** - For text-to-speech
- ✅ **WebSocket** - For real-time communication

### Supported Browsers:
- ✅ Chrome 60+
- ✅ Edge 79+
- ✅ Firefox 55+
- ✅ Safari 14.1+

### HTTPS Requirement:
- **Development:** `localhost` works fine
- **Production:** Must use HTTPS for microphone access

---

## Common Issues & Solutions

### Issue 1: "Failed to connect to voice server"

**Symptoms:**
- Red "Disconnected" indicator
- Cannot send messages

**Solution:**
1. Check backend is running: `npm run dev` in backend folder
2. Verify `VITE_WS_URL=http://localhost:5000` in frontend `.env`
3. Check backend console for WebSocket initialization
4. Clear browser cache and reload

---

### Issue 2: "No speech detected" or STT errors

**Symptoms:**
- Recording works but no transcription
- Error: "STT failed" or "OpenAI API error"

**Solution:**
1. Verify `OPENAI_API_KEY` is set in backend `.env`
2. Check OpenAI API quota: https://platform.openai.com/usage
3. Try using text input as fallback (still works!)
4. Check backend logs for specific error messages

**Alternative:** Use browser-based STT (client-side, no API needed)
- This will be suggested automatically if OpenAI quota is exceeded

---

### Issue 3: Microphone permission denied

**Symptoms:**
- Browser asks for permission but recording doesn't start
- "Permission denied" error

**Solution:**
1. Click the camera icon in browser address bar
2. Allow microphone access for localhost
3. Refresh the page
4. Try recording again

**Chrome:**
- Settings → Privacy and security → Site settings → Microphone
- Allow for `http://localhost:3000`

---

### Issue 4: No audio output (TTS not speaking)

**Symptoms:**
- Text response appears but no voice
- Volume icon is enabled

**Solution:**
1. Check system volume is not muted
2. Verify browser allows audio playback
3. Try a different browser (Chrome recommended for TTS)
4. Check browser console for TTS errors

---

### Issue 5: Backend crashes or "Cannot find module"

**Symptoms:**
- Backend server crashes on startup
- Module import errors

**Solution:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## What to Test

### Basic Functionality ✅
- [ ] Connect to WebSocket server
- [ ] Record voice input
- [ ] Transcribe speech to text
- [ ] Send text messages
- [ ] Receive AI responses
- [ ] Hear TTS output
- [ ] Toggle TTS on/off
- [ ] View message history

### Edge Cases ✅
- [ ] Very long recording (>30 seconds)
- [ ] Silent recording (no speech)
- [ ] Multiple rapid messages
- [ ] Special characters in text
- [ ] Different languages (if supported)
- [ ] Network interruption
- [ ] Reconnection after disconnect

### UI/UX ✅
- [ ] Visual indicators (recording, processing, speaking)
- [ ] Error messages are clear
- [ ] Loading states work correctly
- [ ] Responsive design on mobile
- [ ] Dark mode compatibility

---

## Debug Logging

The test page includes a debug panel that shows:
- 📝 **Transcriptions:** When speech is converted to text
- 🤖 **AI Responses:** When AI generates a response
- ❌ **Errors:** Any errors that occur
- 🔌 **Connection events:** WebSocket connect/disconnect

**To clear logs:** Click "Clear" button in the debug panel

**To see more details:** Open browser DevTools → Console

---

## Performance Testing

### Expected Latencies:
- **Voice → Transcription:** 2-5 seconds
- **Transcription → AI Response:** 2-4 seconds
- **TTS Speaking:** Immediate (starts as soon as text arrives)
- **Total (Voice → AI speaks):** 4-10 seconds

### If slower:
- Check internet connection
- Verify backend isn't rate limited
- Check OpenAI API status
- Monitor backend CPU/memory usage

---

## Testing Checklist

Before deploying to production:

### Backend ✅
- [ ] WebSocket server starts without errors
- [ ] Session model saves correctly
- [ ] Voice routes are accessible
- [ ] STT service connects to OpenAI
- [ ] Error handling works
- [ ] Logs are informative

### Frontend ✅
- [ ] VoiceChat component renders
- [ ] WebSocket connects successfully
- [ ] Audio recording works
- [ ] TTS speaks responses
- [ ] Error messages display
- [ ] UI is responsive

### Integration ✅
- [ ] End-to-end flow works (voice → AI → speech)
- [ ] Session persistence works
- [ ] Conversation history saves
- [ ] Metrics are tracked
- [ ] Multiple sessions don't interfere

---

## Next Steps After Testing

1. **If everything works:**
   - ✅ Integrate into your actual SessionDetails page
   - ✅ Customize UI to match your design
   - ✅ Add analytics/tracking
   - ✅ Deploy to staging environment

2. **If issues persist:**
   - 📧 Check backend logs in `backend/logs/`
   - 🔍 Review browser console errors
   - 📚 Consult `VOICE_TUTOR_SETUP.md` for detailed docs
   - 💬 Check WebSocket connection in DevTools → Network → WS

---

## Quick Commands

```bash
# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev

# Test WebSocket connection manually
# In browser console:
const socket = io('http://localhost:5000', {
  auth: { token: localStorage.getItem('token') }
});
socket.on('connect', () => console.log('Connected!'));

# Check if microphone works
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => console.log('Mic works!', stream))
  .catch(err => console.error('Mic error:', err));

# Check if TTS works
const utterance = new SpeechSynthesisUtterance('Hello world');
window.speechSynthesis.speak(utterance);
```

---

## Support

### Documentation Files:
- **Setup Guide:** `VOICE_TUTOR_SETUP.md`
- **Integration Examples:** `VOICE_INTEGRATION_EXAMPLE.md`
- **This Testing Guide:** `TESTING_VOICE_TUTOR.md`

### Common Commands:
```bash
# Check if backend dependencies are installed
cd backend && npm list socket.io multer form-data

# Check if frontend dependencies are installed
cd frontend && npm list socket.io-client

# View backend logs
cd backend && tail -f logs/app.log

# Restart everything
# Terminal 1: cd backend && npm run dev
# Terminal 2: cd frontend && npm run dev
```

---

## Success Indicators

You'll know everything is working when:

1. ✅ Green "Connected" status in voice chat
2. ✅ All browser checks pass (green checkmarks)
3. ✅ Recording button turns red when clicked
4. ✅ Your speech is transcribed correctly
5. ✅ AI responds with relevant answer
6. ✅ You hear the AI speaking (if TTS enabled)
7. ✅ Debug logs show successful events
8. ✅ No errors in browser console or backend logs

---

**Happy Testing! 🎉**

If you encounter any issues not covered here, check the main setup documentation or review the backend logs for specific error messages.
