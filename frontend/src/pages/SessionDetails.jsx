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
    Play,
    ChevronLeft,
    ChevronRight,
    Brain,
    BookOpen,
    Lightbulb,
    Code,
    FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { io } from 'socket.io-client';

const SessionDetails = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const messagesEndRef = useRef(null);
    const topicsScrollRef = useRef(null);
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
                setLoading(true);
                const sessionRes = await api.get(`/voice/sessions/${sessionId}`);
                setSession(sessionRes.data.session);

                if (sessionRes.data.session.conversationId) {
                    const messagesRes = await api.get(
                        `/conversations/${sessionRes.data.session.conversationId}/messages`
                    );
                    setMessages(messagesRes.data.data || []);
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

    // Helper functions
    const addMessage = (role, content) => {
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

    const getScoreColor = (score) => {
        if (!score) return 'text-gray-600';
        if (score >= 4.5) return 'text-green-600';
        if (score >= 3.5) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBgColor = (score) => {
        if (!score) return 'bg-gray-50 border-gray-200';
        if (score >= 4.5) return 'bg-green-50 border-green-200';
        if (score >= 3.5) return 'bg-yellow-50 border-yellow-200';
        return 'bg-red-50 border-red-200';
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading session...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
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

    // Convert lesson objectives to topics format
    const topics = lesson?.objectives?.map((obj, idx) => ({
        id: idx + 1,
        title: obj,
        duration: 0,
        understanding: 0,
        status: 'pending'
    })) || [];

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header */}
            <div className="border-b border-gray-100 flex-shrink-0">
                <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" strokeWidth={2} />
                            <span className="font-medium">Back to Dashboard</span>
                        </button>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleTTS}
                                className={`p-3 rounded-lg transition-all ${ttsEnabled
                                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                    }`}
                                title={ttsEnabled ? 'TTS Enabled' : 'TTS Disabled'}
                            >
                                {ttsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                            </button>
                            {isSpeaking && (
                                <button
                                    onClick={stopSpeaking}
                                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                                >
                                    Stop Speaking
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                <div className="h-full max-w-[1600px] mx-auto px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr,450px] gap-8 h-full">

                        {/* LEFT COLUMN */}
                        <div className="flex flex-col gap-6 overflow-y-auto">

                            {/* AI Speaking Animation */}
                            <div className="relative bg-gradient-to-br from-[#1a1f3a] via-[#2d3561] to-[#4a3f7a] rounded-xl overflow-hidden aspect-video flex items-center justify-center flex-shrink-0">
                                {/* Background */}
                                <div className="absolute inset-0 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20" />
                                    <div className="absolute top-10 left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
                                    <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
                                </div>

                                {/* AI Orb */}
                                <div className="relative z-10">
                                    {isSpeaking || isProcessing ? (
                                        <div className="relative">
                                            <div className="absolute inset-0 w-72 h-72 -translate-x-36 -translate-y-36 animate-spin" style={{ animationDuration: '30s' }}>
                                                {[...Array(12)].map((_, i) => (
                                                    <div
                                                        key={`outer-${i}`}
                                                        className="absolute w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"
                                                        style={{
                                                            top: '50%',
                                                            left: '50%',
                                                            transform: `rotate(${i * 30}deg) translateX(144px) translateY(-50%)`,
                                                            opacity: 0.4 + (i % 3) * 0.2,
                                                            animation: 'pulse 2s ease-in-out infinite',
                                                            animationDelay: `${i * 0.1}s`
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <div className="absolute inset-0 w-56 h-56 -translate-x-28 -translate-y-28 animate-spin" style={{ animationDuration: '20s', animationDirection: 'reverse' }}>
                                                {[...Array(8)].map((_, i) => (
                                                    <div
                                                        key={`middle-${i}`}
                                                        className="absolute w-2.5 h-2.5 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"
                                                        style={{
                                                            top: '50%',
                                                            left: '50%',
                                                            transform: `rotate(${i * 45}deg) translateX(112px) translateY(-50%)`,
                                                            opacity: 0.5,
                                                            animation: 'pulse 1.5s ease-in-out infinite',
                                                            animationDelay: `${i * 0.15}s`
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <div className="absolute inset-0 w-64 h-64 -translate-x-32 -translate-y-32">
                                                <div className="absolute inset-0 rounded-full border-2 border-blue-400/20 animate-ping" style={{ animationDuration: '2s' }} />
                                                <div className="absolute inset-4 rounded-full border-2 border-purple-400/30 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.3s' }} />
                                                <div className="absolute inset-8 rounded-full border-2 border-pink-400/20 animate-ping" style={{ animationDuration: '3s', animationDelay: '0.6s' }} />
                                            </div>
                                            <div className="relative w-48 h-48">
                                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 blur-2xl opacity-60 animate-pulse" />
                                                <div className="relative w-full h-full rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-2xl overflow-hidden">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent" />
                                                    <div className="absolute inset-0 opacity-30">
                                                        <svg className="w-full h-full animate-spin" style={{ animationDuration: '15s' }}>
                                                            <defs>
                                                                <linearGradient id="mesh-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                                    <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.8" />
                                                                    <stop offset="50%" stopColor="#A78BFA" stopOpacity="0.6" />
                                                                    <stop offset="100%" stopColor="#F472B6" stopOpacity="0.8" />
                                                                </linearGradient>
                                                            </defs>
                                                            <circle cx="96" cy="96" r="70" fill="none" stroke="url(#mesh-gradient)" strokeWidth="0.5" opacity="0.5" />
                                                            <circle cx="96" cy="96" r="60" fill="none" stroke="url(#mesh-gradient)" strokeWidth="0.5" opacity="0.4" />
                                                            <circle cx="96" cy="96" r="50" fill="none" stroke="url(#mesh-gradient)" strokeWidth="0.5" opacity="0.3" />
                                                        </svg>
                                                    </div>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm animate-pulse flex items-center justify-center">
                                                            <div className="w-12 h-12 rounded-full bg-white/30 animate-pulse" style={{ animationDelay: '0.3s' }} />
                                                        </div>
                                                    </div>
                                                </div>
                                                {[...Array(16)].map((_, i) => (
                                                    <div
                                                        key={`particle-${i}`}
                                                        className="absolute w-1.5 h-1.5 rounded-full bg-white"
                                                        style={{
                                                            top: '50%',
                                                            left: '50%',
                                                            transform: `rotate(${i * 22.5}deg) translateX(${100 + Math.sin(i) * 20}px) translateY(-50%)`,
                                                            opacity: 0.3 + Math.random() * 0.4,
                                                            animation: `float 3s ease-in-out infinite`,
                                                            animationDelay: `${i * 0.1}s`
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <div className="absolute -bottom-24 left-1/2 transform -translate-x-1/2 flex items-end gap-2">
                                                {[...Array(11)].map((_, i) => {
                                                    const height = 10 + Math.abs(5 - i) * 8;
                                                    return (
                                                        <div
                                                            key={`wave-${i}`}
                                                            className="w-2 rounded-full bg-gradient-to-t from-blue-400 via-purple-400 to-pink-400"
                                                            style={{
                                                                height: `${height}px`,
                                                                animation: `waveHeight 0.8s ease-in-out infinite`,
                                                                animationDelay: `${i * 0.08}s`,
                                                                opacity: 0.6 + (5 - Math.abs(5 - i)) * 0.08
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <div className="w-40 h-40 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-2xl relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
                                                <div className="relative z-10 flex items-center justify-center">
                                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                                        <div className="w-3 h-3 rounded-full bg-white/30" />
                                                    </div>
                                                </div>
                                                <div className="absolute inset-0 rounded-full border border-white/10" />
                                            </div>
                                            {[...Array(6)].map((_, i) => (
                                                <div
                                                    key={`idle-${i}`}
                                                    className="absolute w-1 h-1 rounded-full bg-gray-500/30"
                                                    style={{
                                                        top: '50%',
                                                        left: '50%',
                                                        transform: `rotate(${i * 60}deg) translateX(80px) translateY(-50%)`,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Status Overlay */}
                                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                                    <div className="flex items-center justify-between text-white">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                                                {isRecording ? (
                                                    <Mic className="w-5 h-5 text-red-400 animate-pulse" />
                                                ) : (
                                                    <Bot className="w-5 h-5" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {isRecording ? 'Listening...' : isSpeaking ? 'AI Speaking' : 'Ready'}
                                                </p>
                                                <p className="text-xs text-gray-300">
                                                    {session?.status === 'active' ? 'Active Session' : 'Completed'}
                                                </p>
                                            </div>
                                        </div>
                                        {(isSpeaking || isProcessing) && (
                                            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md rounded-full border border-white/10">
                                                <div className="flex gap-1">
                                                    <div className="w-1 h-3 bg-white rounded-full animate-pulse" />
                                                    <div className="w-1 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                                                    <div className="w-1 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                                                </div>
                                                <span className="text-sm font-medium">{processingStatus || 'Processing'}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Session Info */}
                            <div className="flex items-start justify-between flex-shrink-0">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                            {lesson ? 'Lesson Session' : 'AI Tutoring'}
                                        </span>
                                        {session?.status === 'active' && (
                                            <>
                                                <span className="text-sm text-gray-400">•</span>
                                                <span className="inline-flex items-center text-sm text-green-600">
                                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                                                    Live
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                        {lesson?.title || session?.title || 'AI Tutoring Session'}
                                    </h1>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-1.5">
                                            <Brain className="w-4 h-4" strokeWidth={2} />
                                            <span>AI Tutor</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-4 h-4" strokeWidth={2} />
                                            <span>{messages.length} exchanges</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Topics/Objectives - Horizontal Scroll */}
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

                            {/* Lesson Content Preview */}
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
                        </div>

                        {/* RIGHT COLUMN - Chat */}
                        <div className="flex flex-col gap-6 min-h-0">
                            <div className="flex-1 bg-gray-50 rounded-xl border border-gray-100 flex flex-col min-h-0">
                                {/* Chat Header */}
                                <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3 flex-shrink-0 bg-white rounded-t-xl">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                        <Bot className="w-5 h-5 text-white" strokeWidth={2} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">Live Conversation</h3>
                                        <p className="text-xs text-gray-500">Ask questions anytime</p>
                                    </div>
                                    {isRecording && (
                                        <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-full flex items-center gap-1.5">
                                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                            Recording
                                        </span>
                                    )}
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
                                    {messages.length === 0 && (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
                                                <Bot className="w-8 h-8 text-blue-600" />
                                            </div>
                                            <p className="text-gray-600 font-medium mb-2">Ready to start learning!</p>
                                            <p className="text-sm text-gray-500">
                                                Click the microphone or type to begin
                                            </p>
                                        </div>
                                    )}

                                    {messages.map((message) => (
                                        <div
                                            key={message._id}
                                            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            {message.role === 'assistant' && (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                                    <Bot className="w-4 h-4 text-white" strokeWidth={2} />
                                                </div>
                                            )}
                                            <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                                                <div className={`rounded-2xl px-4 py-3 ${message.role === 'user'
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
                                                    }`}>
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                                </div>
                                                <span className="text-xs text-gray-500 mt-1">
                                                    {formatTime(message.createdAt)}
                                                </span>
                                            </div>
                                            {message.role === 'user' && (
                                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                                    <User className="w-4 h-4 text-white" strokeWidth={2} />
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Current Transcript */}
                                    {currentTranscript && (
                                        <div className="flex gap-3 justify-end">
                                            <div className="flex flex-col items-end max-w-[85%]">
                                                <div className="rounded-2xl px-4 py-3 bg-blue-100 text-blue-700 border border-blue-200">
                                                    <p className="text-sm italic leading-relaxed">{currentTranscript}</p>
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center flex-shrink-0">
                                                <User className="w-4 h-4 text-white" strokeWidth={2} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Processing */}
                                    {isProcessing && processingStatus && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                                <Bot className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-2xl border border-gray-200">
                                                <Loader className="w-4 h-4 animate-spin" />
                                                <span>{processingStatus}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="px-6 py-5 border-t border-gray-200 flex-shrink-0 bg-white rounded-b-xl">
                                    {/* Voice Button */}
                                    <div className="mb-3 text-center">
                                        <button
                                            onClick={toggleRecording}
                                            disabled={isProcessing || isSpeaking}
                                            className={`relative inline-flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 ${isRecording
                                                ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50 scale-110'
                                                : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/50'
                                                } ${(isProcessing || isSpeaking) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
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
                                            {isRecording ? 'Click to stop' : 'Click to speak'}
                                        </p>
                                    </div>

                                    {/* Text Input */}
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={inputMessage}
                                            onChange={(e) => setInputMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                            placeholder="Type your question..."
                                            disabled={isProcessing || isRecording}
                                            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                                        />
                                        <button
                                            onClick={sendMessage}
                                            disabled={!inputMessage.trim() || isProcessing || isRecording}
                                            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                                        >
                                            <Send className="w-5 h-5" strokeWidth={2} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes waveHeight {
                    0%, 100% { transform: scaleY(1); }
                    50% { transform: scaleY(1.8); }
                }
                
                @keyframes float {
                    0%, 100% { 
                        transform: translateY(0px);
                        opacity: 0.3;
                    }
                    50% { 
                        transform: translateY(-10px);
                        opacity: 0.8;
                    }
                }

                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
};

export default SessionDetails;