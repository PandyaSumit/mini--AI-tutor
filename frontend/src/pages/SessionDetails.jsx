import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Download,
    Share2,
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    FileText,
    Target,
    Brain,
    Play,
    Pause,
    BookOpen,
    MessageCircle,
    Clock,
    Send,
    User,
    Bot,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

const SessionDetails = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);
    const topicsScrollRef = useRef(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [showTranscript, setShowTranscript] = useState(false);
    const [aiSpeaking, setAISpeaking] = useState(false);
    const [inputMessage, setInputMessage] = useState('');
    const [chatMessages, setChatMessages] = useState([
        {
            id: 1,
            type: 'ai',
            content: 'Welcome to your Calculus session! Today we\'ll be covering derivatives and their applications. Feel free to ask me any questions as we go through the material.',
            timestamp: new Date(Date.now() - 3600000)
        }
    ]);

    // Mock session data
    const session = {
        id: sessionId,
        subject: 'Mathematics',
        topic: 'Calculus - Derivatives and Applications',
        date: '2024-01-15T14:30:00',
        duration: 2580,
        tutor: 'AI Tutor',
        overallScore: 4.2,
        segments: [
            {
                id: 1,
                title: 'What are the fundamental rules of differentiation?',
                startTime: 0,
                duration: 152,
                understanding: 4.4,
                status: 'excellent'
            },
            {
                id: 2,
                title: 'How do you apply the chain rule in complex functions?',
                startTime: 152,
                duration: 150,
                understanding: 4.6,
                status: 'excellent'
            },
            {
                id: 3,
                title: 'Can you explain the relationship between derivatives and slopes?',
                startTime: 302,
                duration: 206,
                understanding: 4.7,
                status: 'excellent'
            },
            {
                id: 4,
                title: 'What are the practical applications of derivatives in real life?',
                startTime: 508,
                duration: 110,
                understanding: 2.3,
                status: 'needs-work'
            },
            {
                id: 5,
                title: 'How do you find critical points using derivatives?',
                startTime: 618,
                duration: 310,
                understanding: 4.8,
                status: 'excellent'
            },
            {
                id: 6,
                title: 'What strategies help in solving optimization problems?',
                startTime: 928,
                duration: 180,
                understanding: 3.3,
                status: 'good'
            },
            {
                id: 7,
                title: 'How do you interpret derivative graphs?',
                startTime: 1108,
                duration: 165,
                understanding: 4.6,
                status: 'excellent'
            }
        ],
        transcript: [
            { time: 0, speaker: 'AI Tutor', text: 'Welcome to today\'s session on derivatives. Let\'s start by reviewing the fundamental rules...' },
            { time: 15, speaker: 'Student', text: 'I understand the power rule, but can you explain the chain rule again?' },
            { time: 45, speaker: 'AI Tutor', text: 'Of course! The chain rule states that if you have a composite function...' },
        ]
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const scrollTopics = (direction) => {
        if (topicsScrollRef.current) {
            const scrollAmount = 300;
            topicsScrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const togglePlayback = () => {
        setIsPlaying(!isPlaying);
        setAISpeaking(!isPlaying);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: inputMessage,
            timestamp: new Date()
        };
        setChatMessages(prev => [...prev, userMessage]);
        setInputMessage('');

        setAISpeaking(true);
        setTimeout(() => {
            const aiResponse = {
                id: Date.now() + 1,
                type: 'ai',
                content: 'Great question! Let me explain that concept in detail. The derivative represents the rate of change of a function at any given point, which is fundamental to understanding calculus...',
                timestamp: new Date()
            };
            setChatMessages(prev => [...prev, aiResponse]);

            setTimeout(() => {
                setAISpeaking(false);
            }, 3000);
        }, 1500);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        return `${mins} min`;
    };

    const formatChatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const jumpToSegment = (startTime) => {
        setCurrentTime(startTime);
        setIsPlaying(true);
        setAISpeaking(true);
    };

    const getScoreColor = (score) => {
        if (score >= 4.5) return 'text-green-600';
        if (score >= 3.5) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBgColor = (score) => {
        if (score >= 4.5) return 'bg-green-50 border-green-200';
        if (score >= 3.5) return 'bg-yellow-50 border-yellow-200';
        return 'bg-red-50 border-red-200';
    };

    const getStatusIcon = (status) => {
        if (status === 'excellent') return <CheckCircle2 className="w-4 h-4 text-green-600" strokeWidth={2} />;
        if (status === 'good') return <CheckCircle2 className="w-4 h-4 text-yellow-600" strokeWidth={2} />;
        return <AlertCircle className="w-4 h-4 text-red-600" strokeWidth={2} />;
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header */}
            <div className="border-b border-gray-100 flex-shrink-0">
                <div className="mx-auto px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate('/sessions')}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" strokeWidth={2} />
                            <span className="font-medium">Back to Sessions</span>
                        </button>
                        <div className="flex items-center gap-2">
                            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:border-gray-900 hover:bg-gray-50 text-gray-900 font-medium rounded-lg transition-all">
                                <Download className="w-4 h-4" strokeWidth={2} />
                                <span className="hidden sm:inline">Download</span>
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:border-gray-900 hover:bg-gray-50 text-gray-900 font-medium rounded-lg transition-all">
                                <Share2 className="w-4 h-4" strokeWidth={2} />
                                <span className="hidden sm:inline">Share</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                <div className="h-full mx-auto px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr,450px] gap-8 h-full">

                        {/* LEFT COLUMN: AI Animation + Session Info + Topics + Transcript */}
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
                                    {aiSpeaking ? (
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

                                {/* Controls */}
                                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                                    <div className="w-full h-1.5 bg-white/10 rounded-full mb-4 cursor-pointer backdrop-blur-sm">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full transition-all shadow-lg shadow-purple-500/50"
                                            style={{ width: `${(currentTime / session.duration) * 100}%` }}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between text-white">
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={togglePlayback}
                                                className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 backdrop-blur-sm flex items-center justify-center transition-all shadow-lg shadow-purple-500/30"
                                            >
                                                {isPlaying ? (
                                                    <Pause className="w-5 h-5" strokeWidth={2} fill="white" />
                                                ) : (
                                                    <Play className="w-5 h-5 ml-0.5" strokeWidth={2} fill="white" />
                                                )}
                                            </button>
                                            <span className="text-sm font-medium backdrop-blur-sm bg-black/20 px-3 py-1 rounded-full">
                                                {formatTime(currentTime)} / {formatTime(session.duration)}
                                            </span>
                                        </div>
                                        {aiSpeaking && (
                                            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md rounded-full border border-white/10">
                                                <div className="flex gap-1">
                                                    <div className="w-1 h-3 bg-white rounded-full animate-pulse" />
                                                    <div className="w-1 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                                                    <div className="w-1 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                                                </div>
                                                <span className="text-sm font-medium">AI Speaking</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Session Info */}
                            <div className="flex items-start justify-between flex-shrink-0">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                            {session.subject}
                                        </span>
                                        <span className="text-sm text-gray-500">•</span>
                                        <span className="text-sm text-gray-500">
                                            {new Date(session.date).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                        {session.topic}
                                    </h1>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-4 h-4" strokeWidth={2} />
                                            {formatDuration(session.duration)}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Brain className="w-4 h-4" strokeWidth={2} />
                                            {session.tutor}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                                    <span className="text-sm font-medium text-gray-600">Overall</span>
                                    <span className={`text-2xl font-bold ${getScoreColor(session.overallScore)}`}>
                                        {session.overallScore}
                                    </span>
                                </div>
                            </div>

                            {/* Topics Covered - Horizontal Scroll */}
                            <div className="relative flex-shrink-0">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Target className="w-5 h-5 text-gray-600" strokeWidth={2} />
                                        <h2 className="font-semibold text-gray-900">Topics Covered</h2>
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
                                    {session.segments.map((segment) => (
                                        <button
                                            key={segment.id}
                                            onClick={() => jumpToSegment(segment.startTime)}
                                            className={`flex-shrink-0 w-80 text-left p-4 bg-white border-2 rounded-xl transition-all hover:border-gray-900 hover:shadow-md group ${getScoreBgColor(segment.understanding)}`}
                                        >
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-lg bg-white border border-gray-300 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-900 group-hover:border-gray-900 transition-colors shadow-sm">
                                                    <Play className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" strokeWidth={2} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 leading-snug">
                                                        {segment.title}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <Clock className="w-3.5 h-3.5" strokeWidth={2} />
                                                        {formatDuration(segment.duration)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(segment.status)}
                                                    <span className="text-xs font-medium text-gray-600">
                                                        {segment.status === 'excellent' ? 'Excellent' : segment.status === 'good' ? 'Good' : 'Needs Work'}
                                                    </span>
                                                </div>
                                                <span className={`text-lg font-bold ${getScoreColor(segment.understanding)}`}>
                                                    {segment.understanding}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Transcript Toggle & Content */}
                            <div className="flex-shrink-0">
                                <button
                                    onClick={() => setShowTranscript(!showTranscript)}
                                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:border-gray-900 hover:bg-gray-50 text-gray-900 font-medium rounded-lg transition-all w-full justify-center mb-4"
                                >
                                    <FileText className="w-4 h-4" strokeWidth={2} />
                                    {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
                                </button>

                                {showTranscript && (
                                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                                        <h3 className="font-semibold text-gray-900 mb-4">Session Transcript</h3>
                                        <div className="space-y-4 max-h-96 overflow-y-auto">
                                            {session.transcript.map((entry, index) => (
                                                <div key={index} className="flex gap-3">
                                                    <span className="text-xs text-gray-500 font-mono w-12 flex-shrink-0">
                                                        {formatTime(entry.time)}
                                                    </span>
                                                    <div className="flex-1">
                                                        <div className="font-medium text-sm text-gray-900 mb-1">
                                                            {entry.speaker}
                                                        </div>
                                                        <p className="text-sm text-gray-700 leading-relaxed">{entry.text}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Chat + Understanding + Actions */}
                        <div className="flex flex-col gap-6 min-h-0">

                            {/* Chat Interface */}
                            <div className="flex-1 bg-gray-50 rounded-xl border border-gray-100 flex flex-col min-h-0">
                                <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3 flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                        <Bot className="w-5 h-5 text-white" strokeWidth={2} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Chat with AI Tutor</h3>
                                        <p className="text-xs text-gray-500">Ask questions about this session</p>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
                                    {chatMessages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            {message.type === 'ai' && (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                                    <Bot className="w-4 h-4 text-white" strokeWidth={2} />
                                                </div>
                                            )}
                                            <div className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                                                <div className={`rounded-2xl px-4 py-3 ${message.type === 'user'
                                                    ? 'bg-gray-900 text-white'
                                                    : 'bg-white text-gray-900 border border-gray-200'
                                                    }`}>
                                                    <p className="text-sm leading-relaxed">{message.content}</p>
                                                </div>
                                                <span className="text-xs text-gray-500 mt-1">{formatChatTime(message.timestamp)}</span>
                                            </div>
                                            {message.type === 'user' && (
                                                <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                                                    <User className="w-4 h-4 text-white" strokeWidth={2} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0">
                                    <form onSubmit={handleSendMessage} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={inputMessage}
                                            onChange={(e) => setInputMessage(e.target.value)}
                                            placeholder="Ask a question..."
                                            className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!inputMessage.trim()}
                                            className="px-5 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Send className="w-4 h-4" strokeWidth={2} />
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Understanding Summary */}
                            <div className="bg-gray-50 rounded-xl border border-gray-100 p-6 flex-shrink-0">
                                <h3 className="font-semibold text-gray-900 mb-4">Understanding Summary</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Excellent</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-green-600 rounded-full" style={{ width: '71%' }} />
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 w-6 text-right">5</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Good</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-yellow-600 rounded-full" style={{ width: '14%' }} />
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 w-6 text-right">1</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Needs Work</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-red-600 rounded-full" style={{ width: '14%' }} />
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 w-6 text-right">1</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-white rounded-xl border border-gray-100 p-6 flex-shrink-0">
                                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                                <div className="space-y-2">
                                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left">
                                        <BookOpen className="w-5 h-5 text-gray-600" strokeWidth={2} />
                                        <span className="font-medium text-gray-900">Review Topics</span>
                                    </button>
                                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left">
                                        <MessageCircle className="w-5 h-5 text-gray-600" strokeWidth={2} />
                                        <span className="font-medium text-gray-900">Ask Follow-up</span>
                                    </button>
                                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left">
                                        <Target className="w-5 h-5 text-gray-600" strokeWidth={2} />
                                        <span className="font-medium text-gray-900">Practice Quiz</span>
                                    </button>
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