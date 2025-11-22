import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Mic,
    MicOff,
    Volume2,
    VolumeX,
    Clock,
    Send,
    User,
    Bot,
    Target,
    CheckCircle2,
    AlertCircle,
    Loader,
    ChevronLeft,
    ChevronRight,
    Brain,
    BookOpen,
    Lightbulb,
    Code,
    GripHorizontal,
    Maximize2,
    Minimize2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { io } from 'socket.io-client';
import Whiteboard from '../components/Whiteboard';
import { CommandParser } from '../utils/CommandParser';

const SessionDetails = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const messagesEndRef = useRef(null);
    const topicsScrollRef = useRef(null);
    const socketRef = useRef(null);
    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);
    const chatSheetRef = useRef(null);
    const dragStartY = useRef(0);
    const dragStartHeight = useRef(0);

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

    // Mobile chat drawer state
    const [chatHeight, setChatHeight] = useState(40); // percentage - start at half
    const [isDragging, setIsDragging] = useState(false);
    const [snapPoint, setSnapPoint] = useState('half'); // 'minimized' | 'half' | 'full'

    // Whiteboard state
    const [whiteboardCommands, setWhiteboardCommands] = useState([]);
    const [showWhiteboard, setShowWhiteboard] = useState(false);

    // Snap points in percentage
    const SNAP_POINTS = {
        minimized: 20,  // Show header and input
        half: 50,       // Half screen
        full: 85        // Almost full screen
    };

    // Fetch session data
    useEffect(() => {
        const fetchSessionData = async () => {
            try {
                setLoading(true);
                const sessionRes = await api.get(`/voice/sessions/${sessionId}`);
                setSession(sessionRes.data.session);

                if (sessionRes.data.session.conversationId) {
                    try {
                        const messagesRes = await api.get(
                            `/conversations/${sessionRes.data.session.conversationId}/messages`
                        );
                        setMessages(messagesRes.data.data || []);
                    } catch (msgError) {
                        console.error('⚠️ Error fetching messages:', msgError);
                        setMessages([]);
                    }
                }

                if (sessionRes.data.session.lesson) {
                    setLesson(sessionRes.data.session.lesson);
                }

                setLoading(false);
            } catch (err) {
                console.error('Error fetching session data:', err);
                setError('Failed to load session details');
                setLoading(false);
            }
        };

        if (sessionId && token) {
            fetchSessionData();
        }
    }, [sessionId, token]);

    // Initialize Socket.IO
    useEffect(() => {
        if (!token || !sessionId) return;

        let socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        socketUrl = socketUrl.replace(/\/api\/?$/, '');

        const socket = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling']
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('voice:join', {
                sessionId,
                settings: { language: 'en-US', ttsEnabled: true }
            });
        });

        socket.on('voice:transcribed', (data) => {
            setCurrentTranscript('');
            setProcessingStatus('Generating AI response...');
            addMessage('user', data.text);
        });

        socket.on('voice:processing', (data) => {
            setProcessingStatus(data.status);
        });

        socket.on('voice:response', (data) => {
            setIsProcessing(false);
            setProcessingStatus('');
            addMessage('assistant', data.text);
            if (data.shouldSpeak && ttsEnabled) {
                speakText(data.text);
            }
        });

        socket.on('voice:error', (data) => {
            console.error('Voice error:', data.error);
            setError(data.error);
            setIsProcessing(false);
            setIsRecording(false);
            setProcessingStatus('');
        });

        socket.on('voice:ready', () => {
            setIsSpeaking(false);
        });

        return () => {
            if (socket) {
                socket.emit('voice:leave', { sessionId });
                socket.disconnect();
            }
        };
    }, [token, sessionId, ttsEnabled]);

    // Initialize Speech Recognition
    useEffect(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
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
                recognition.start();
            }
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognition) {
                recognition.stop();
            }
        };
    }, [isRecording]);

    // Handle drag gestures for mobile chat
    const handleDragStart = (e) => {
        setIsDragging(true);
        const touch = e.touches ? e.touches[0] : e;
        dragStartY.current = touch.clientY;
        dragStartHeight.current = chatHeight;
    };

    const handleDragMove = (e) => {
        if (!isDragging) return;

        const touch = e.touches ? e.touches[0] : e;
        const deltaY = dragStartY.current - touch.clientY;
        const windowHeight = window.innerHeight;
        const deltaPercent = (deltaY / windowHeight) * 100;

        let newHeight = dragStartHeight.current + deltaPercent;
        newHeight = Math.max(SNAP_POINTS.minimized, Math.min(SNAP_POINTS.full, newHeight));

        setChatHeight(newHeight);
    };

    const handleDragEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);

        // Snap to nearest point
        const distances = Object.entries(SNAP_POINTS).map(([key, value]) => ({
            key,
            distance: Math.abs(chatHeight - value)
        }));

        const nearest = distances.reduce((prev, curr) =>
            curr.distance < prev.distance ? curr : prev
        );

        setSnapPoint(nearest.key);
        setChatHeight(SNAP_POINTS[nearest.key]);
    };

    const snapToPoint = (point) => {
        setSnapPoint(point);
        setChatHeight(SNAP_POINTS[point]);
    };

    // Helper functions
    const addMessage = (role, content) => {
        // Parse whiteboard commands if this is an assistant message
        if (role === 'assistant') {
            console.log('🎨 Parsing AI response for whiteboard commands:', content.substring(0, 200));
            const parsed = CommandParser.parseResponse(content);

            console.log('📊 Parsed result:', {
                hasWhiteboard: parsed.hasWhiteboard,
                commandCount: parsed.whiteboardCommands?.length || 0,
                textContent: parsed.textContent?.substring(0, 100)
            });

            // If whiteboard commands found, update whiteboard state
            if (parsed.hasWhiteboard && parsed.whiteboardCommands.length > 0) {
                console.log('✅ Adding whiteboard commands:', parsed.whiteboardCommands);
                setWhiteboardCommands(prev => [...prev, ...parsed.whiteboardCommands]);
                setShowWhiteboard(true);
            } else {
                console.log('⚠️ No whiteboard commands found in response');
            }

            // Use cleaned text content (without [WB] blocks)
            content = parsed.textContent || content;
        }

        const newMessage = {
            _id: Date.now(),
            role,
            content,
            createdAt: new Date()
        };
        setMessages(prev => [...prev, newMessage]);
    };

    const toggleRecording = () => {
        if (isRecording) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setIsRecording(false);
        } else {
            if (recognitionRef.current) {
                recognitionRef.current.start();
            }
            setIsRecording(true);
        }
    };

    const handleTextMessage = (text) => {
        if (!text.trim() || !socketRef.current) return;

        setIsProcessing(true);
        setProcessingStatus('Processing...');

        socketRef.current.emit('voice:text-message', {
            sessionId,
            text: text.trim()
        });
    };

    const sendMessage = () => {
        if (!inputMessage.trim()) return;
        handleTextMessage(inputMessage);
        setInputMessage('');
    };

    const speakText = (text) => {
        if (!synthRef.current || !text) return;

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

        setIsSpeaking(true);
        synthRef.current.speak(utterance);
    };

    const stopSpeaking = () => {
        if (synthRef.current) {
            synthRef.current.cancel();
            setIsSpeaking(false);
        }
    };

    const toggleTTS = () => {
        if (ttsEnabled && isSpeaking) {
            stopSpeaking();
        }
        setTtsEnabled(!ttsEnabled);
    };

    // Test whiteboard with sample commands
    const testWhiteboard = () => {
        console.log('🧪 Testing whiteboard with sample commands');

        const sampleCommands = [
            { type: 'TEXT', x: 400, y: 50, content: 'Python For Loop Demo', color: 'blue', size: 24, font: 'Arial' },
            { type: 'PAUSE', duration: 500 },
            { type: 'RECT', x: 100, y: 150, width: 200, height: 80, color: 'green', label: 'for i in range(4):', fillColor: 'lightgreen' },
            { type: 'PAUSE', duration: 500 },
            { type: 'ARROW', x1: 300, y1: 190, x2: 450, y2: 190, color: 'red', width: 3 },
            { type: 'PAUSE', duration: 300 },
            { type: 'RECT', x: 500, y: 150, width: 150, height: 80, color: 'blue', label: 'i = 0', fillColor: 'lightblue' },
            { type: 'PAUSE', duration: 300 },
            { type: 'RECT', x: 500, y: 250, width: 150, height: 80, color: 'blue', label: 'i = 1', fillColor: 'lightblue' },
            { type: 'PAUSE', duration: 300 },
            { type: 'RECT', x: 500, y: 350, width: 150, height: 80, color: 'blue', label: 'i = 2', fillColor: 'lightblue' },
            { type: 'PAUSE', duration: 300 },
            { type: 'RECT', x: 500, y: 450, width: 150, height: 80, color: 'blue', label: 'i = 3', fillColor: 'lightblue' },
            { type: 'PAUSE', duration: 500 },
            { type: 'TEXT', x: 400, y: 600, content: 'Loop executes 4 times!', color: 'purple', size: 20, font: 'Arial' }
        ];

        setWhiteboardCommands(sampleCommands);
        setShowWhiteboard(true);
    };

    const scrollTopics = (direction) => {
        if (topicsScrollRef.current) {
            const scrollAmount = 300;
            topicsScrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 relative">
                        <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping"></div>
                        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                            <Bot className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <p className="text-gray-600 font-medium">Loading session...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14 sm:h-16">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" strokeWidth={2} />
                            <span className="font-medium hidden sm:inline">Dashboard</span>
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={testWhiteboard}
                                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-xs sm:text-sm font-medium"
                                title="Test Whiteboard"
                            >
                                🎨 Test
                            </button>
                            {isSpeaking && (
                                <button
                                    onClick={stopSpeaking}
                                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs sm:text-sm font-medium"
                                >
                                    Stop
                                </button>
                            )}
                            <button
                                onClick={toggleTTS}
                                className={`p-2 sm:p-2.5 rounded-lg transition-all ${ttsEnabled
                                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                    }`}
                            >
                                {ttsEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden relative">
                <div className="h-full max-w-7xl mx-auto">
                    <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr,420px] xl:grid-cols-[1fr,480px] gap-0 lg:gap-6 lg:px-6 lg:py-8">

                        {/* LEFT COLUMN - Main Content */}
                        <div className="flex flex-col gap-4 sm:gap-6 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 lg:px-0 pb-[50vh] lg:pb-6">

                            {/* AI Visualization */}
                            <div className="relative bg-gradient-to-br from-[#1a1f3a] via-[#2d3561] to-[#4a3f7a] rounded-2xl overflow-hidden">
                                <div className="aspect-[16/9] sm:aspect-[21/9] lg:aspect-video flex items-center justify-center relative">
                                    {/* Animated Background */}
                                    <div className="absolute inset-0 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20" />
                                        <div className="absolute top-1/4 left-1/4 w-32 sm:w-48 lg:w-64 h-32 sm:h-48 lg:h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
                                        <div className="absolute bottom-1/4 right-1/4 w-40 sm:w-60 lg:w-80 h-40 sm:h-60 lg:h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
                                    </div>

                                    {/* AI Orb */}
                                    <div className="relative z-10 scale-75 sm:scale-90 lg:scale-100">
                                        {isSpeaking || isProcessing ? (
                                            <div className="relative">
                                                <div className="relative w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40">
                                                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 blur-xl opacity-60 animate-pulse" />
                                                    <div className="relative w-full h-full rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-2xl flex items-center justify-center">
                                                        <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full bg-white/20 backdrop-blur-sm animate-pulse" />
                                                    </div>
                                                </div>
                                                <div className="absolute -bottom-12 sm:-bottom-16 left-1/2 transform -translate-x-1/2 flex items-end gap-1 sm:gap-1.5">
                                                    {[...Array(7)].map((_, i) => {
                                                        const height = 8 + Math.abs(3 - i) * 4;
                                                        return (
                                                            <div
                                                                key={`wave-${i}`}
                                                                className="w-1 sm:w-1.5 lg:w-2 rounded-full bg-gradient-to-t from-blue-400 via-purple-400 to-pink-400"
                                                                style={{
                                                                    height: `${height}px`,
                                                                    animation: `waveHeight 0.8s ease-in-out infinite`,
                                                                    animationDelay: `${i * 0.1}s`
                                                                }}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative w-20 h-20 sm:w-28 sm:h-28 lg:w-36 lg:h-36 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-2xl">
                                                <div className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full bg-white/5 flex items-center justify-center">
                                                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3 rounded-full bg-white/30" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Status Overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 lg:p-6 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                                        <div className="flex items-center justify-between text-white">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                                                    {isRecording ? (
                                                        <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 animate-pulse" />
                                                    ) : (
                                                        <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs sm:text-sm font-medium">
                                                        {isRecording ? 'Listening...' : isSpeaking ? 'AI Speaking' : 'Ready'}
                                                    </p>
                                                    <p className="text-[10px] sm:text-xs text-gray-300">
                                                        {session?.status === 'active' ? 'Active Session' : 'Completed'}
                                                    </p>
                                                </div>
                                            </div>
                                            {(isSpeaking || isProcessing) && processingStatus && (
                                                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full">
                                                    <Loader className="w-3 h-3 animate-spin" />
                                                    <span className="text-xs font-medium">{processingStatus}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Session Info */}
                            <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                {lesson ? 'Lesson Session' : 'AI Tutoring'}
                                            </span>
                                            {session?.status === 'active' && (
                                                <>
                                                    <span className="text-sm text-gray-300 hidden sm:inline">•</span>
                                                    <span className="inline-flex items-center text-xs sm:text-sm text-green-600">
                                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                                                        Live
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2">
                                            {lesson?.title || session?.title || 'AI Tutoring Session'}
                                        </h1>
                                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                                            <div className="flex items-center gap-1.5">
                                                <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2} />
                                                <span>AI Tutor</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2} />
                                                <span>{messages.length} exchanges</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Learning Objectives - DO NOT CHANGE */}
                            {lesson && lesson.objectives && lesson.objectives.length > 0 && (
                                <div className="relative flex-shrink-0">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Target className="w-5 h-5 text-blue-600" strokeWidth={2} />
                                            <h2 className="font-semibold text-gray-900">Learning Objectives</h2>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => scrollTopics('left')}
                                                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                                            >
                                                <ChevronLeft className="w-4 h-4 text-gray-600" strokeWidth={2} />
                                            </button>
                                            <button
                                                onClick={() => scrollTopics('right')}
                                                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                                            >
                                                <ChevronRight className="w-4 h-4 text-gray-600" strokeWidth={2} />
                                            </button>
                                        </div>
                                    </div>
                                    <div
                                        ref={topicsScrollRef}
                                        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
                                    >
                                        {lesson.objectives.map((obj, idx) => (
                                            <div
                                                key={idx}
                                                className="flex-shrink-0 w-80 text-left p-4 bg-blue-50 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all group"
                                            >
                                                <div className="flex items-start gap-3 mb-3">
                                                    <div className="w-10 h-10 rounded-lg bg-white border border-blue-300 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:border-blue-600 transition-colors shadow-sm">
                                                        <CheckCircle2 className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" strokeWidth={2} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-gray-900 text-sm mb-1 leading-snug">
                                                            {obj}
                                                        </h3>
                                                        <p className="text-xs text-gray-500">
                                                            Objective {idx + 1}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Lesson Content Preview - DO NOT CHANGE */}
                            {lesson && (
                                <div className="bg-gray-50 rounded-xl border border-gray-100 p-6 flex-shrink-0">
                                    <div className="flex items-center gap-2 mb-4">
                                        <BookOpen className="w-5 h-5 text-purple-600" />
                                        <h3 className="font-semibold text-gray-900">Lesson Content</h3>
                                    </div>

                                    {/* Key Points */}
                                    {lesson.content_structure?.keyPoints && lesson.content_structure.keyPoints.length > 0 && (
                                        <div className="mb-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Lightbulb className="w-4 h-4 text-yellow-600" />
                                                <h4 className="text-sm font-semibold text-gray-700">Key Points</h4>
                                            </div>
                                            <ul className="space-y-2">
                                                {lesson.content_structure.keyPoints.slice(0, 3).map((point, idx) => (
                                                    <li key={idx} className="text-sm text-gray-600 pl-4 border-l-2 border-yellow-200">
                                                        {point}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Examples Preview */}
                                    {lesson.content_structure?.examples && lesson.content_structure.examples.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Code className="w-4 h-4 text-indigo-600" />
                                                <h4 className="text-sm font-semibold text-gray-700">Examples</h4>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {lesson.content_structure.examples.length} example(s) available
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Whiteboard Component */}
                            {showWhiteboard && (
                                <Whiteboard
                                    commands={whiteboardCommands}
                                    isVisible={showWhiteboard}
                                    autoPlay={true}
                                    onComplete={() => {
                                        console.log('Whiteboard animation completed');
                                    }}
                                />
                            )}
                        </div>

                        {/* RIGHT COLUMN - Desktop Chat */}
                        <div className="hidden lg:flex flex-col h-full max-h-[calc(100vh-8rem)]">
                            <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden min-h-0">
                                {/* Chat Header */}
                                <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3 bg-gradient-to-r from-blue-50 to-purple-50 flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
                                        <Bot className="w-5 h-5 text-white" strokeWidth={2} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">Live Conversation</h3>
                                        <p className="text-xs text-gray-500">Ask questions anytime</p>
                                    </div>
                                    {isRecording && (
                                        <span className="px-2.5 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-full flex items-center gap-1.5 shadow-sm">
                                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                                            Recording
                                        </span>
                                    )}
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gradient-to-br from-gray-50 to-white min-h-0">
                                    {messages.length === 0 && (
                                        <div className="h-full flex items-center justify-center">
                                            <div className="text-center py-12">
                                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto mb-4 shadow-lg">
                                                    <Bot className="w-10 h-10 text-blue-600" />
                                                </div>
                                                <p className="text-gray-700 font-semibold mb-2">Ready to start learning!</p>
                                                <p className="text-sm text-gray-500">
                                                    Use the microphone or type to begin
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {messages.map((message) => (
                                        <div
                                            key={message._id}
                                            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            {message.role === 'assistant' && (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-md">
                                                    <Bot className="w-4 h-4 text-white" strokeWidth={2} />
                                                </div>
                                            )}
                                            <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                                                <div className={`rounded-2xl px-4 py-3 shadow-sm ${message.role === 'user'
                                                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
                                                    : 'bg-white text-gray-900 border border-gray-200'
                                                    }`}>
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                                                </div>
                                                <span className="text-xs text-gray-400 mt-1 px-1">
                                                    {formatTime(message.createdAt)}
                                                </span>
                                            </div>
                                            {message.role === 'user' && (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center flex-shrink-0 shadow-md">
                                                    <User className="w-4 h-4 text-white" strokeWidth={2} />
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {currentTranscript && (
                                        <div className="flex gap-3 justify-end">
                                            <div className="flex flex-col items-end max-w-[80%]">
                                                <div className="rounded-2xl px-4 py-3 bg-blue-100 text-blue-700 border border-blue-200 shadow-sm">
                                                    <p className="text-sm italic leading-relaxed">{currentTranscript}</p>
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center flex-shrink-0 shadow-md">
                                                <User className="w-4 h-4 text-white" strokeWidth={2} />
                                            </div>
                                        </div>
                                    )}

                                    {isProcessing && processingStatus && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-md">
                                                <Bot className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2.5 rounded-2xl border border-gray-200 shadow-sm">
                                                <Loader className="w-4 h-4 animate-spin" />
                                                <span>{processingStatus}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="flex-shrink-0 px-6 py-5 border-t border-gray-200 bg-white space-y-4">
                                    {/* Voice Button */}
                                    <div className="text-center py-1">
                                        <button
                                            onClick={toggleRecording}
                                            disabled={isProcessing || isSpeaking}
                                            className={`relative inline-flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 shadow-lg ${isRecording
                                                ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/50 scale-110'
                                                : 'bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-blue-500/50'
                                                } ${(isProcessing || isSpeaking) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                                        >
                                            {isRecording ? (
                                                <MicOff className="w-7 h-7 text-white" strokeWidth={2.5} />
                                            ) : (
                                                <Mic className="w-7 h-7 text-white" strokeWidth={2.5} />
                                            )}
                                            {isRecording && (
                                                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></span>
                                            )}
                                        </button>
                                        <p className="text-xs text-gray-500 mt-2 font-medium">
                                            {isRecording ? 'Tap to stop' : 'Tap to speak'}
                                        </p>
                                    </div>

                                    {/* Text Input */}
                                    <div className="flex items-center gap-2.5">
                                        <input
                                            type="text"
                                            value={inputMessage}
                                            onChange={(e) => setInputMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                            placeholder="Type your question..."
                                            disabled={isProcessing || isRecording}
                                            className="flex-1 px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm placeholder:text-gray-400 transition-all"
                                        />
                                        <button
                                            onClick={sendMessage}
                                            disabled={!inputMessage.trim() || isProcessing || isRecording}
                                            className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-95 flex-shrink-0"
                                        >
                                            <Send className="w-5 h-5" strokeWidth={2} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Draggable Chat Bottom Sheet */}
                <div
                    ref={chatSheetRef}
                    className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white rounded-t-3xl shadow-2xl border-t border-gray-200 flex flex-col"
                    style={{
                        height: `${chatHeight}vh`,
                        transition: isDragging ? 'none' : 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        touchAction: 'none'
                    }}
                >
                    {/* Drag Handle */}
                    <div
                        className="flex-shrink-0 bg-white px-4 pt-3 pb-3 cursor-grab active:cursor-grabbing border-b border-gray-100"
                        onTouchStart={handleDragStart}
                        onTouchMove={handleDragMove}
                        onTouchEnd={handleDragEnd}
                        onMouseDown={handleDragStart}
                        onMouseMove={handleDragMove}
                        onMouseUp={handleDragEnd}
                    >
                        {/* Drag Handle Bar */}
                        <div className="flex items-center justify-center mb-3">
                            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
                                    <Bot className="w-5 h-5 text-white" strokeWidth={2} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-sm">Live Conversation</h3>
                                    <p className="text-xs text-gray-500">{messages.length} messages</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {isRecording && (
                                    <span className="px-2.5 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-full flex items-center gap-1.5 mr-2">
                                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                                        Rec
                                    </span>
                                )}
                                {snapPoint !== 'full' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            snapToPoint('full');
                                        }}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <Maximize2 className="w-4 h-4 text-gray-500" />
                                    </button>
                                )}
                                {snapPoint !== 'minimized' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            snapToPoint('minimized');
                                        }}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <Minimize2 className="w-4 h-4 text-gray-500" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Messages - Only show when not minimized */}
                    {snapPoint !== 'minimized' ? (
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0 overscroll-contain bg-gray-50">
                            {messages.length === 0 && (
                                <div className="h-full flex items-center justify-center">
                                    <div className="text-center py-8 px-4">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto mb-3 shadow-lg">
                                            <Bot className="w-8 h-8 text-blue-600" />
                                        </div>
                                        <p className="text-gray-700 font-semibold text-sm mb-1">Ready to start!</p>
                                        <p className="text-xs text-gray-500">
                                            Tap the mic or type to begin
                                        </p>
                                    </div>
                                </div>
                            )}

                            {messages.map((message) => (
                                <div
                                    key={message._id}
                                    className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {message.role === 'assistant' && (
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-md">
                                            <Bot className="w-3.5 h-3.5 text-white" strokeWidth={2} />
                                        </div>
                                    )}
                                    <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                                        <div className={`rounded-2xl px-3 py-2 shadow-sm ${message.role === 'user'
                                            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
                                            : 'bg-gray-50 text-gray-900 border border-gray-200'
                                            }`}>
                                            <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                                        </div>
                                        <span className="text-[10px] text-gray-400 mt-0.5 px-1">
                                            {formatTime(message.createdAt)}
                                        </span>
                                    </div>
                                    {message.role === 'user' && (
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center flex-shrink-0 shadow-md">
                                            <User className="w-3.5 h-3.5 text-white" strokeWidth={2} />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {currentTranscript && (
                                <div className="flex gap-2 justify-end">
                                    <div className="flex flex-col items-end max-w-[85%]">
                                        <div className="rounded-2xl px-3 py-2 bg-blue-100 text-blue-700 border border-blue-200 shadow-sm">
                                            <p className="text-xs italic leading-relaxed">{currentTranscript}</p>
                                        </div>
                                    </div>
                                    <div className="w-7 h-7 rounded-full bg-blue-400 flex items-center justify-center flex-shrink-0 shadow-md">
                                        <User className="w-3.5 h-3.5 text-white" strokeWidth={2} />
                                    </div>
                                </div>
                            )}

                            {isProcessing && processingStatus && (
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-md">
                                        <Bot className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-white px-3 py-2 rounded-2xl border border-gray-200 shadow-sm">
                                        <Loader className="w-3.5 h-3.5 animate-spin" />
                                        <span>{processingStatus}</span>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    ) : (
                        /* Minimized State Hint */
                        <div className="flex-1 flex items-center justify-center py-4 bg-gray-50">
                            <div className="text-center px-4">
                                <p className="text-sm text-gray-500 mb-1">Swipe up to view conversation</p>
                                <div className="flex items-center justify-center gap-1">
                                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Input Area - Always visible */}
                    <div className="flex-shrink-0 bg-white px-4 pb-5 pt-4 border-t border-gray-100 space-y-4 safe-area-bottom">
                        {/* Voice Button */}
                        <div className="flex justify-center py-1">
                            <button
                                onClick={toggleRecording}
                                disabled={isProcessing || isSpeaking}
                                className={`relative inline-flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 shadow-lg ${isRecording
                                    ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/50 scale-110'
                                    : 'bg-gradient-to-br from-blue-600 to-purple-600 shadow-blue-500/50'
                                    } ${(isProcessing || isSpeaking) ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                            >
                                {isRecording ? (
                                    <MicOff className="w-7 h-7 text-white" strokeWidth={2.5} />
                                ) : (
                                    <Mic className="w-7 h-7 text-white" strokeWidth={2.5} />
                                )}
                                {isRecording && (
                                    <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></span>
                                )}
                            </button>
                        </div>

                        {/* Text Input */}
                        <div className="flex items-center gap-2.5">
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                placeholder="Type your question..."
                                disabled={isProcessing || isRecording}
                                className="flex-1 px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-base placeholder:text-gray-400 transition-all"
                                style={{ fontSize: '16px' }}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!inputMessage.trim() || isProcessing || isRecording}
                                className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-xl disabled:from-gray-300 disabled:to-gray-400 transition-all shadow-md active:scale-95 flex-shrink-0"
                            >
                                <Send className="w-5 h-5" strokeWidth={2} />
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <style jsx>{`
                @keyframes waveHeight {
                    0%, 100% { transform: scaleY(1); }
                    50% { transform: scaleY(1.8); }
                }

                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }

                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }

                /* Custom scrollbar for chat */
                .overflow-y-auto::-webkit-scrollbar {
                    width: 6px;
                }

                .overflow-y-auto::-webkit-scrollbar-track {
                    background: transparent;
                }

                .overflow-y-auto::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 3px;
                }

                .overflow-y-auto::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }

                /* Smooth scrolling */
                .overflow-y-auto {
                    scroll-behavior: smooth;
                    -webkit-overflow-scrolling: touch;
                }

                /* Safe area for mobile devices */
                .safe-area-bottom {
                    padding-bottom: max(1.25rem, env(safe-area-inset-bottom));
                }

                /* Prevent zoom on input focus (iOS) */
                @media screen and (max-width: 768px) {
                    input[type="text"] {
                        font-size: 16px;
                    }
                }
            `}</style>
        </div>
    );
};

export default SessionDetails;