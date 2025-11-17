# Voice Chat Integration Example

## Quick Integration Guide

This guide shows you how to add voice chat functionality to any page in your application.

---

## Option 1: Standalone Voice Chat Page

Create a dedicated voice tutoring page:

```jsx
// frontend/src/pages/VoiceTutor.jsx
import { useState } from 'react';
import VoiceChat from '../components/VoiceChat';

const VoiceTutor = () => {
  const token = localStorage.getItem('token'); // Or use your auth context

  const handleMessage = (message) => {
    console.log('New message:', message);
    // Optional: Save to local state, analytics, etc.
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Voice AI Tutor
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Talk to your AI tutor in real-time
            </p>
          </div>

          {/* Voice Chat */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg h-[600px]">
            <VoiceChat
              token={token}
              onMessage={handleMessage}
              className="h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceTutor;
```

Add route in `App.jsx`:
```jsx
import VoiceTutor from './pages/VoiceTutor';

// In your routes:
<Route path="/voice-tutor" element={<VoiceTutor />} />
```

---

## Option 2: Add to Existing Session Details Page

Integrate voice chat into the existing session details page:

```jsx
// frontend/src/pages/SessionDetails.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import VoiceChat from '../components/VoiceChat';

const SessionDetails = () => {
  const { sessionId } = useParams();
  const [activeTab, setActiveTab] = useState('voice'); // 'voice' or 'history'
  const token = localStorage.getItem('token');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('voice')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'voice'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                🎤 Voice Chat
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                📜 Session History
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'voice' ? (
              <div className="h-[600px]">
                <VoiceChat
                  token={token}
                  onMessage={(msg) => console.log('Message:', msg)}
                />
              </div>
            ) : (
              <div>
                {/* Your existing session history content */}
                <h2>Session History</h2>
                {/* ... */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionDetails;
```

---

## Option 3: Modal/Popup Voice Chat

Add a floating voice chat button that opens a modal:

```jsx
// frontend/src/components/VoiceChatModal.jsx
import { useState } from 'react';
import { X, Mic } from 'lucide-react';
import VoiceChat from './VoiceChat';

const VoiceChatModal = ({ token }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 text-white rounded-full
                   shadow-lg hover:bg-blue-700 flex items-center justify-center z-50
                   transition-transform hover:scale-110"
        title="Voice Tutor"
      >
        <Mic size={24} />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Content */}
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl
                          max-w-4xl w-full h-[700px] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b
                            border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Voice AI Tutor
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Voice Chat */}
              <div className="flex-1 overflow-hidden">
                <VoiceChat token={token} className="h-full" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceChatModal;
```

Use in your app layout:
```jsx
// frontend/src/App.jsx or Layout.jsx
import VoiceChatModal from './components/VoiceChatModal';

function App() {
  const token = localStorage.getItem('token');

  return (
    <div>
      {/* Your app content */}

      {/* Floating voice chat available everywhere */}
      {token && <VoiceChatModal token={token} />}
    </div>
  );
}
```

---

## Option 4: Split View (Side-by-Side)

Show content and voice chat side by side:

```jsx
// frontend/src/pages/Learn.jsx
import { useState } from 'react';
import VoiceChat from '../components/VoiceChat';

const Learn = () => {
  const token = localStorage.getItem('token');
  const [currentTopic, setCurrentTopic] = useState('JavaScript Basics');

  return (
    <div className="min-h-screen flex">
      {/* Content Area */}
      <div className="flex-1 bg-gray-50 dark:bg-gray-900 p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">{currentTopic}</h1>
          {/* Your learning content here */}
          <div className="prose dark:prose-invert">
            {/* Lesson content */}
          </div>
        </div>
      </div>

      {/* Voice Chat Sidebar */}
      <div className="w-96 border-l border-gray-200 dark:border-gray-700
                    bg-white dark:bg-gray-800">
        <VoiceChat
          token={token}
          onMessage={(msg) => {
            // Optionally update content based on conversation
            console.log('User asked:', msg);
          }}
          className="h-full"
        />
      </div>
    </div>
  );
};

export default Learn;
```

---

## Advanced: Custom Styling

Customize the VoiceChat component with Tailwind classes:

```jsx
<VoiceChat
  token={token}
  onMessage={handleMessage}
  className="
    h-full
    bg-gradient-to-b from-blue-50 to-white
    dark:from-gray-900 dark:to-gray-800
    rounded-xl
    shadow-2xl
  "
/>
```

---

## Using with Auth Context

If you use React Context for authentication:

```jsx
import { useAuth } from '../context/AuthContext';
import VoiceChat from '../components/VoiceChat';

function MyPage() {
  const { token, user } = useAuth();

  if (!token) {
    return <div>Please login to use voice chat</div>;
  }

  return (
    <VoiceChat
      token={token}
      onMessage={(msg) => {
        console.log(`${user.name} said:`, msg.content);
      }}
    />
  );
}
```

---

## Handling Events

React to voice chat events in your component:

```jsx
import { useState } from 'react';
import VoiceChat from '../components/VoiceChat';

function SmartPage() {
  const [conversationHistory, setConversationHistory] = useState([]);
  const [insights, setInsights] = useState([]);

  const handleMessage = (message) => {
    // Save to conversation history
    setConversationHistory(prev => [...prev, message]);

    // Extract insights (example)
    if (message.role === 'assistant') {
      const keywords = extractKeywords(message.content);
      setInsights(keywords);
    }

    // Save to backend
    saveMessageToBackend(message);
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Main Chat */}
      <div className="col-span-2">
        <VoiceChat token={token} onMessage={handleMessage} />
      </div>

      {/* Insights Sidebar */}
      <div className="col-span-1">
        <h3>Key Concepts</h3>
        <ul>
          {insights.map(insight => (
            <li key={insight}>{insight}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

---

## Testing

Test the voice chat component:

```jsx
// Simple test page
function TestVoiceChat() {
  const [logs, setLogs] = useState([]);

  return (
    <div>
      <VoiceChat
        token="your_test_token"
        onMessage={(msg) => {
          setLogs(prev => [...prev, `[${msg.role}] ${msg.content}`]);
        }}
      />

      <div className="mt-4 p-4 bg-gray-100">
        <h3>Debug Logs:</h3>
        {logs.map((log, i) => (
          <pre key={i}>{log}</pre>
        ))}
      </div>
    </div>
  );
}
```

---

## Production Checklist

Before deploying voice chat to production:

- [ ] Set `VITE_WS_URL` to production WebSocket URL (wss://)
- [ ] Enable SSL/TLS for secure WebSocket connections
- [ ] Set `OPENAI_API_KEY` with production API key
- [ ] Configure CORS to allow production frontend URL
- [ ] Test microphone permissions in production environment
- [ ] Add error tracking (Sentry, LogRocket, etc.)
- [ ] Implement rate limiting for API calls
- [ ] Add usage analytics
- [ ] Test on multiple browsers and devices
- [ ] Ensure HTTPS for microphone access
- [ ] Set up monitoring and alerts

---

## Troubleshooting Integration

### Component Not Rendering

**Check:**
1. Token is valid and passed correctly
2. WebSocket URL is correct in `.env`
3. Backend is running and accessible
4. No console errors

### Microphone Not Working

**Check:**
1. Using HTTPS (required in production)
2. Browser supports MediaRecorder API
3. User granted microphone permissions
4. No other app is using the microphone

### Messages Not Sending

**Check:**
1. WebSocket connection is established (green dot in header)
2. Session is joined successfully
3. Check browser console for errors
4. Verify backend logs show incoming messages

---

## Need Help?

1. Check `VOICE_TUTOR_SETUP.md` for detailed setup instructions
2. Review backend logs for errors
3. Check browser console for frontend errors
4. Test WebSocket connection with browser DevTools (Network → WS)
5. Verify all environment variables are set correctly

---

Happy coding! 🎤🤖
