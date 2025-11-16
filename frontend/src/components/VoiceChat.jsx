import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Send, Loader2 } from 'lucide-react';
import voiceWebSocket from '../services/voiceWebSocket';
import browserSTT from '../services/browserSTT';

/**
 * VoiceChat Component
 * Provides two-way voice + text communication with AI tutor
 */
const VoiceChat = ({ token, onMessage, className = '' }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [useBrowserSTT, setUseBrowserSTT] = useState(false);
  const [sttMode, setSTTMode] = useState('server'); // 'server' or 'browser'

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize WebSocket connection
  useEffect(() => {
    const initConnection = async () => {
      try {
        await voiceWebSocket.connect(token);
        setIsConnected(true);

        // Setup event listeners
        voiceWebSocket.on('session-joined', (data) => {
          console.log('Session joined:', data);
          setSessionId(data.sessionId);
        });

        voiceWebSocket.on('transcribed', (data) => {
          setTranscript(data.text);
          addMessage('user', data.text);
        });

        voiceWebSocket.on('response', (data) => {
          addMessage('assistant', data.text);
          setIsSpeaking(data.shouldSpeak);
          setIsProcessing(false);
        });

        voiceWebSocket.on('processing', (data) => {
          setIsProcessing(true);
          setProcessingStatus(data.status);
        });

        voiceWebSocket.on('ready', () => {
          setIsSpeaking(false);
          setIsProcessing(false);
        });

        voiceWebSocket.on('error', (data) => {
          setError(data.error);
          setIsProcessing(false);
          setIsRecording(false);
        });

        // Handle fallback to browser STT
        voiceWebSocket.on('use-browser-stt', (data) => {
          console.log('⚠️ Falling back to browser STT:', data);
          setUseBrowserSTT(true);
          setSTTMode('browser');
          setError('Server STT unavailable. Using browser speech recognition (100% FREE)');
          setTimeout(() => setError(null), 5000); // Clear error after 5s
        });

        // Join session
        await voiceWebSocket.joinSession(null, {
          voiceEnabled: true,
          ttsEnabled: true,
          language: 'en-US'
        });
      } catch (error) {
        console.error('Failed to connect:', error);
        setError('Failed to connect to voice server');
      }
    };

    if (token) {
      initConnection();
    }

    return () => {
      voiceWebSocket.disconnect();
    };
  }, [token]);

  // Add message to chat
  const addMessage = (role, content) => {
    const newMessage = {
      id: Date.now(),
      role,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);

    // Call parent callback if provided
    if (onMessage) {
      onMessage(newMessage);
    }
  };

  // Handle voice recording
  const toggleRecording = async () => {
    try {
      if (isRecording) {
        // Stop recording
        if (sttMode === 'browser') {
          // Stop browser STT
          const finalTranscript = browserSTT.stop();
          if (finalTranscript && finalTranscript.trim()) {
            // Send transcript as text message
            voiceWebSocket.sendTextMessage(finalTranscript);
            addMessage('user', finalTranscript);
            setIsProcessing(true);
          }
        } else {
          // Stop server-side recording
          await voiceWebSocket.stopRecording();
        }
        setIsRecording(false);
        setTranscript('');
      } else {
        // Start recording
        setError(null);

        if (sttMode === 'browser') {
          // Use browser STT
          if (!browserSTT.isSupported()) {
            setError('Browser speech recognition not supported');
            return;
          }

          browserSTT.start({
            onStart: () => {
              setIsRecording(true);
            },
            onResult: (result) => {
              setTranscript(result.transcript);
            },
            onError: (error) => {
              console.error('Browser STT error:', error);
              setError(`Speech recognition error: ${error}`);
              setIsRecording(false);
            },
            onEnd: (finalTranscript) => {
              setIsRecording(false);
            }
          });
        } else {
          // Use server-side recording
          await voiceWebSocket.startRecording();
          setIsRecording(true);
        }
      }
    } catch (error) {
      console.error('Recording error:', error);
      setError(error.message);
      setIsRecording(false);
    }
  };

  // Handle text input
  const sendTextMessage = () => {
    if (!textInput.trim()) return;

    try {
      voiceWebSocket.sendTextMessage(textInput);
      addMessage('user', textInput);
      setTextInput('');
      setIsProcessing(true);
    } catch (error) {
      console.error('Send error:', error);
      setError(error.message);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };

  // Toggle TTS
  const toggleTTS = () => {
    setTtsEnabled(!ttsEnabled);
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTTS}
            className={`p-2 rounded-lg transition-colors ${
              ttsEnabled
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
            }`}
            title={ttsEnabled ? 'Disable voice output' : 'Enable voice output'}
          >
            {ttsEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            <p className="text-lg font-medium mb-2">Ready to learn!</p>
            <p className="text-sm">Click the microphone to start talking or type your message below.</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 flex items-center gap-2">
              <Loader2 className="animate-spin" size={16} />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {processingStatus === 'transcribing' && 'Transcribing...'}
                {processingStatus === 'thinking' && 'Thinking...'}
                {!processingStatus && 'Processing...'}
              </span>
            </div>
          </div>
        )}

        {/* Speaking indicator */}
        {isSpeaking && (
          <div className="flex justify-start">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 flex items-center gap-2">
              <Volume2 className="animate-pulse text-blue-600" size={16} />
              <span className="text-sm text-blue-600 dark:text-blue-400">Speaking...</span>
            </div>
          </div>
        )}

        {/* Current transcript */}
        {transcript && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Listening:</strong> {transcript}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2">
          {/* Voice Input Button */}
          {voiceEnabled && (
            <button
              onClick={toggleRecording}
              disabled={isProcessing || isSpeaking || !isConnected}
              className={`p-4 rounded-full transition-all ${
                isRecording
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed'
              }`}
              title={isRecording ? 'Stop recording' : 'Start recording'}
            >
              {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
          )}

          {/* Text Input */}
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isProcessing || !isConnected}
            placeholder="Type a message or click the mic..."
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-blue-500
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
          />

          {/* Send Button */}
          <button
            onClick={sendTextMessage}
            disabled={!textInput.trim() || isProcessing || !isConnected}
            className="p-4 bg-blue-600 text-white rounded-full hover:bg-blue-700
                     disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            title="Send message"
          >
            <Send size={20} />
          </button>
        </div>

        {/* Recording status */}
        {isRecording && (
          <div className="mt-2 text-center">
            <span className="text-sm text-red-600 dark:text-red-400 font-medium">
              🎤 Recording... Click to stop
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceChat;
