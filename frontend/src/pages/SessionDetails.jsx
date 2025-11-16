import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Mic,
    MicOff,
    Volume2,
    VolumeX,
    BookOpen,
    MessageCircle,
    Clock,
    Send,
    User,
    Bot,
    Target,
    Lightbulb,
    Code,
    CheckCircle,
    AlertCircle,
    Loader
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { io } from 'socket.io-client';

const SessionDetails = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);
    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);

    // Session state
    const [session, setSession] = useState(null);
    const [lesson, setLesson] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Voice state
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [ttsEnabled, setTtsEnabled] = useState(true);
    const [currentTranscript, setCurrentTranscript] = useState('');

    // Chat state
    const [inputMessage, setInputMessage] = useState('');
    const [processingStatus, setProcessingStatus] = useState('');

    // Fetch session data
    useEffect(() => {
        const fetchSessionData = async () => {
            try {
                console.log('🔄 Starting session data fetch...');
                console.log('📋 Session ID:', sessionId);
                console.log('🔑 Token exists:', !!token);

                setLoading(true);

                // Fetch session details
                console.log('📥 Fetching session from:', `/voice/sessions/${sessionId}`);
                const sessionRes = await api.get(`/voice/sessions/${sessionId}`);
                console.log('✅ Session response received:', sessionRes.data);

                setSession(sessionRes.data.session);
                console.log('💾 Session set in state');

                // Fetch conversation messages
                if (sessionRes.data.session.conversationId) {
                    console.log('💬 Fetching messages for conversation:', sessionRes.data.session.conversationId);
                    const messagesRes = await api.get(
                        `/conversations/${sessionRes.data.session.conversationId}/messages`
                    );
                    console.log('✅ Messages received:', messagesRes.data.data?.length || 0);
                    setMessages(messagesRes.data.data || []);
                }

                // Fetch lesson data if session is linked to a lesson
                if (sessionRes.data.session.lesson) {
                    console.log('📚 Lesson found in session:', sessionRes.data.session.lesson);
                    // Lesson is already populated with module and course, so just use it directly
                    setLesson(sessionRes.data.session.lesson);
                    console.log('💾 Lesson set in state');
                }

                console.log('✅ All data loaded, setting loading to false');
                setLoading(false);
            } catch (err) {
                console.error('❌ Error fetching session data:', err);
                console.error('Error details:', {
                    message: err.message,
                    response: err.response?.data,
                    status: err.response?.status
                });
                setError('Failed to load session details');
                setLoading(false);
            }
        };

        console.log('🎬 useEffect triggered');
        console.log('Conditions - sessionId:', sessionId, 'token:', !!token);

        if (sessionId && token) {
            console.log('✅ Conditions met, calling fetchSessionData');
            fetchSessionData();
        } else {
            console.log('❌ Conditions not met, skipping fetch');
        }
    }, [sessionId, token]);

    // Initialize Socket.IO connection
    useEffect(() => {
        console.log('🔄 Socket useEffect triggered');
        console.log('Token exists:', !!token, 'SessionId:', sessionId);

        if (!token || !sessionId) {
            console.log('❌ Missing token or sessionId, skipping socket connection');
            return;
        }

        console.log('🔌 Attempting to connect to socket...');
        // Socket.IO needs the base URL without /api suffix
        let socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        // Remove /api suffix if present (Socket.IO doesn't use it)
        socketUrl = socketUrl.replace(/\/api\/?$/, '');
        console.log('Original VITE_API_URL:', import.meta.env.VITE_API_URL);
        console.log('Socket URL (cleaned):', socketUrl);
        console.log('Token (first 20 chars):', token?.substring(0, 20));

        // Connect to WebSocket
        const socket = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling']
        });

        socketRef.current = socket;
        console.log('✅ Socket instance created and stored in ref');

        // Socket event handlers
        socket.on('connect', () => {
            console.log('✅✅✅ Connected to voice server! Socket ID:', socket.id);
            console.log('Socket connected state:', socket.connected);

            // Join the session
            console.log('📤 Sending voice:join event...');
            socket.emit('voice:join', {
                sessionId,
                settings: {
                    language: 'en-US',
                    ttsEnabled: true
                }
            });
        });

        socket.on('connect_error', (error) => {
            console.error('❌❌❌ Socket connection error:', error);
            console.error('Error message:', error.message);
            console.error('Error type:', error.type);
        });

        socket.on('connect_timeout', () => {
            console.error('❌ Socket connection timeout');
        });

        socket.on('voice:joined', (data) => {
            console.log('✅ Joined voice session:', data);
        });

        socket.on('voice:transcribed', (data) => {
            console.log('📥 voice:transcribed received:', data.text);
            setCurrentTranscript('');
            setProcessingStatus('Generating AI response...');

            // Add user message to chat
            addMessage('user', data.text);
            console.log('✅ User message added to chat');
        });

        socket.on('voice:processing', (data) => {
            console.log('📥 voice:processing received:', data.status);
            setProcessingStatus(data.status);
        });

        socket.on('voice:response', (data) => {
            console.log('📥 voice:response received!');
            console.log('Response text:', data.text?.substring(0, 100));
            console.log('Should speak:', data.shouldSpeak);

            setIsProcessing(false);
            setProcessingStatus('');
            console.log('✅ Processing state cleared');

            // Add AI message to chat
            addMessage('assistant', data.text);
            console.log('✅ Assistant message added to chat');

            // Speak the response if TTS is enabled
            if (data.shouldSpeak && ttsEnabled) {
                console.log('🔊 Speaking response...');
                speakText(data.text);
            }
        });

        socket.on('voice:use-browser-stt', (data) => {
            console.log('Falling back to browser STT:', data.message);
            setIsProcessing(false);
            setProcessingStatus('');
        });

        socket.on('voice:error', (data) => {
            console.error('❌ voice:error received:', data.error);
            setError(data.error);
            setIsProcessing(false);
            setIsRecording(false);
            setProcessingStatus('');
            console.log('✅ Error state set, processing cleared');
        });

        socket.on('voice:ready', () => {
            setIsSpeaking(false);
        });

        socket.on('disconnect', () => {
            console.log('❌ Disconnected from voice server');
        });

        return () => {
            if (socket) {
                socket.emit('voice:leave', { sessionId });
                socket.disconnect();
            }
        };
    }, [token, sessionId, ttsEnabled]);

    // Initialize Speech Recognition (Browser STT)
    useEffect(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech Recognition not supported');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            if (finalTranscript) {
                setCurrentTranscript('');
                handleTextMessage(finalTranscript);
            } else {
                setCurrentTranscript(interimTranscript);
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsRecording(false);
        };

        recognition.onend = () => {
            if (isRecording) {
                recognition.start(); // Restart if still recording
            }
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognition) {
                recognition.stop();
            }
        };
    }, [isRecording]);

    // Add message to chat
    const addMessage = (role, content) => {
        const newMessage = {
            _id: Date.now(),
            role,
            content,
            createdAt: new Date()
        };
        setMessages(prev => [...prev, newMessage]);
    };

    // Handle voice recording
    const toggleRecording = () => {
        if (isRecording) {
            // Stop recording
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setIsRecording(false);
        } else {
            // Start recording
            if (recognitionRef.current) {
                recognitionRef.current.start();
            }
            setIsRecording(true);
        }
    };

    // Handle text message
    const handleTextMessage = (text) => {
        if (!text.trim()) {
            console.log('❌ Empty message, not sending');
            return;
        }

        if (!socketRef.current) {
            console.error('❌ Socket not connected!');
            setError('Not connected to server. Please refresh the page.');
            return;
        }

        console.log('📤 Sending message:', text);
        console.log('🔌 Socket connected:', socketRef.current.connected);
        console.log('📋 Session ID:', sessionId);

        setIsProcessing(true);
        setProcessingStatus('Processing...');

        // Send via Socket.IO
        socketRef.current.emit('voice:text-message', {
            sessionId,
            text: text.trim()
        });

        console.log('✅ Message emitted via socket');
    };

    // Send text message (button click)
    const sendMessage = () => {
        if (!inputMessage.trim()) return;

        handleTextMessage(inputMessage);
        setInputMessage('');
    };

    // Text-to-Speech
    const speakText = (text) => {
        if (!synthRef.current || !text) return;

        // Cancel any ongoing speech
        synthRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => {
            setIsSpeaking(true);
            if (socketRef.current) {
                socketRef.current.emit('voice:tts-start', { sessionId });
            }
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            if (socketRef.current) {
                socketRef.current.emit('voice:tts-complete', { sessionId });
            }
        };

        utterance.onerror = (event) => {
            console.error('TTS error:', event);
            setIsSpeaking(false);
        };

        setIsSpeaking(true);
        synthRef.current.speak(utterance);
    };

    // Stop TTS
    const stopSpeaking = () => {
        if (synthRef.current) {
            synthRef.current.cancel();
            setIsSpeaking(false);
        }
    };

    // Toggle TTS
    const toggleTTS = () => {
        if (ttsEnabled && isSpeaking) {
            stopSpeaking();
        }
        setTtsEnabled(!ttsEnabled);
    };

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading session...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {lesson ? lesson.title : session?.title || 'AI Tutoring Session'}
                                </h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    {session?.status === 'active' && (
                                        <span className="inline-flex items-center text-green-600">
                                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                                            Active Session
                                        </span>
                                    )}
                                    {session?.status === 'completed' && 'Completed Session'}
                                </p>
                            </div>
                        </div>

                        {/* Voice Controls */}
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={toggleTTS}
                                className={`p-3 rounded-lg transition-all ${
                                    ttsEnabled
                                        ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                }`}
                                title={ttsEnabled ? 'TTS Enabled' : 'TTS Disabled'}
                            >
                                {ttsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                            </button>

                            {isSpeaking && (
                                <button
                                    onClick={stopSpeaking}
                                    className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                                >
                                    Stop Speaking
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Lesson Content */}
                    {lesson && (
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                                <div className="flex items-center space-x-2 mb-4">
                                    <BookOpen className="w-5 h-5 text-blue-600" />
                                    <h2 className="text-lg font-semibold text-gray-900">Lesson Content</h2>
                                </div>

                                {/* Objectives */}
                                {lesson.objectives && lesson.objectives.length > 0 && (
                                    <div className="mb-6">
                                        <div className="flex items-center space-x-2 mb-3">
                                            <Target className="w-4 h-4 text-purple-600" />
                                            <h3 className="text-sm font-semibold text-gray-700">Learning Objectives</h3>
                                        </div>
                                        <ul className="space-y-2">
                                            {lesson.objectives.map((obj, idx) => (
                                                <li key={idx} className="flex items-start space-x-2 text-sm text-gray-600">
                                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                    <span>{obj}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Key Points */}
                                {lesson.content_structure?.keyPoints && lesson.content_structure.keyPoints.length > 0 && (
                                    <div className="mb-6">
                                        <div className="flex items-center space-x-2 mb-3">
                                            <Lightbulb className="w-4 h-4 text-yellow-600" />
                                            <h3 className="text-sm font-semibold text-gray-700">Key Points</h3>
                                        </div>
                                        <ul className="space-y-2">
                                            {lesson.content_structure.keyPoints.map((point, idx) => (
                                                <li key={idx} className="text-sm text-gray-600 pl-4 border-l-2 border-yellow-200">
                                                    {point}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Examples */}
                                {lesson.content_structure?.examples && lesson.content_structure.examples.length > 0 && (
                                    <div>
                                        <div className="flex items-center space-x-2 mb-3">
                                            <Code className="w-4 h-4 text-indigo-600" />
                                            <h3 className="text-sm font-semibold text-gray-700">Examples</h3>
                                        </div>
                                        <div className="space-y-3">
                                            {lesson.content_structure.examples.map((example, idx) => (
                                                <div key={idx} className="bg-gray-50 rounded-lg p-3">
                                                    <p className="text-xs font-semibold text-gray-700 mb-2">{example.title}</p>
                                                    {example.code && (
                                                        <pre className="bg-gray-900 text-gray-100 p-2 rounded text-xs overflow-x-auto mb-2">
                                                            <code>{example.code}</code>
                                                        </pre>
                                                    )}
                                                    {example.explanation && (
                                                        <p className="text-xs text-gray-600">{example.explanation}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Lesson Content */}
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Full Content</h3>
                                    <div className="prose prose-sm max-w-none text-gray-600">
                                        {lesson.content}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Right Column - Chat Interface */}
                    <div className={lesson ? 'lg:col-span-2' : 'lg:col-span-3'}>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-12rem)]">
                            {/* Chat Header */}
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <MessageCircle className="w-5 h-5 text-blue-600" />
                                        <h2 className="text-lg font-semibold text-gray-900">Live Conversation</h2>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                                        <Clock className="w-4 h-4" />
                                        <span>{messages.length} messages</span>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                                {messages.length === 0 && (
                                    <div className="text-center py-12">
                                        <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500">
                                            {lesson
                                                ? 'Start asking questions about the lesson!'
                                                : 'Start a conversation with your AI tutor'}
                                        </p>
                                    </div>
                                )}

                                {messages.map((message) => (
                                    <div
                                        key={message._id}
                                        className={`flex items-start space-x-3 ${
                                            message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                                        }`}
                                    >
                                        <div
                                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                                message.role === 'user'
                                                    ? 'bg-blue-600'
                                                    : 'bg-gradient-to-br from-purple-500 to-pink-500'
                                            }`}
                                        >
                                            {message.role === 'user' ? (
                                                <User className="w-4 h-4 text-white" />
                                            ) : (
                                                <Bot className="w-4 h-4 text-white" />
                                            )}
                                        </div>
                                        <div
                                            className={`flex-1 max-w-2xl ${
                                                message.role === 'user' ? 'text-right' : 'text-left'
                                            }`}
                                        >
                                            <div
                                                className={`inline-block px-4 py-2 rounded-2xl ${
                                                    message.role === 'user'
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 text-gray-900'
                                                }`}
                                            >
                                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1 px-2">
                                                {new Date(message.createdAt).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                {/* Current Transcript (interim) */}
                                {currentTranscript && (
                                    <div className="flex items-start space-x-3 flex-row-reverse space-x-reverse">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-blue-400">
                                            <User className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="flex-1 max-w-2xl text-right">
                                            <div className="inline-block px-4 py-2 rounded-2xl bg-blue-100 text-blue-700 opacity-70">
                                                <p className="text-sm italic">{currentTranscript}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Processing Status */}
                                {isProcessing && processingStatus && (
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                                            <Bot className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                                            <Loader className="w-4 h-4 animate-spin" />
                                            <span>{processingStatus}</span>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                                {/* Microphone Button */}
                                <div className="mb-3 text-center">
                                    <button
                                        onClick={toggleRecording}
                                        disabled={isProcessing || isSpeaking}
                                        className={`relative inline-flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 ${
                                            isRecording
                                                ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50 scale-110'
                                                : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/50'
                                        } ${(isProcessing || isSpeaking) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {isRecording ? (
                                            <MicOff className="w-7 h-7 text-white" />
                                        ) : (
                                            <Mic className="w-7 h-7 text-white" />
                                        )}
                                        {isRecording && (
                                            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></span>
                                        )}
                                    </button>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {isRecording ? 'Click to stop recording' : 'Click to start speaking'}
                                    </p>
                                </div>

                                {/* Text Input */}
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                        placeholder="Type your question or use voice..."
                                        disabled={isProcessing || isRecording}
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    />
                                    <button
                                        onClick={sendMessage}
                                        disabled={!inputMessage.trim() || isProcessing || isRecording}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                                    >
                                        <Send className="w-5 h-5" />
                                        <span>Send</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SessionDetails;
