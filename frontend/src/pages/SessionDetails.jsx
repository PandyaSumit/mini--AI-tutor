import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    Bot,
    ChevronRight,
    BookOpen,
    PlayCircle,
    GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { io } from 'socket.io-client';
import Whiteboard from '../components/Whiteboard';
import { CommandParser } from '../utils/CommandParser';
import LessonLayout from '../components/LessonLayout';
import ChatPanel from '../components/ChatPanel';

const SessionDetails = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();
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
    const [processingStatus, setProcessingStatus] = useState('');

    // Whiteboard state
    const [whiteboardCommands, setWhiteboardCommands] = useState([]);
    const [showWhiteboard, setShowWhiteboard] = useState(false);

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

    // Helper functions
    const addMessage = (role, content) => {
        // Parse whiteboard commands if this is an assistant message
        if (role === 'assistant') {
            const parsed = CommandParser.parseResponse(content);

            // If whiteboard commands found, update whiteboard state
            if (parsed.hasWhiteboard && parsed.whiteboardCommands.length > 0) {
                setWhiteboardCommands(prev => [...prev, ...parsed.whiteboardCommands]);
                setShowWhiteboard(true);
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
            { type: 'RECT', x: 500, y: 350, width: 150, height: 80, color: 'blue', label: 'i = 1', fillColor: 'lightblue' },
            { type: 'PAUSE', duration: 300 },
            { type: 'RECT', x: 500, y: 450, width: 150, height: 80, color: 'blue', label: 'i = 3', fillColor: 'lightblue' },
            { type: 'PAUSE', duration: 500 },
            { type: 'TEXT', x: 400, y: 600, content: 'Loop executes 4 times!', color: 'purple', size: 20, font: 'Arial' }
        ];
        setWhiteboardCommands(sampleCommands);
        setShowWhiteboard(true);
    };

    // Expose testWhiteboard to window for demo button
    useEffect(() => {
        window.testWhiteboard = testWhiteboard;
        return () => {
            delete window.testWhiteboard;
        };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 relative">
                        <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping"></div>
                        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                            <Bot className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <p className="text-gray-600 font-medium">Preparing your lesson...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
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

    // --- Layout Content Definitions ---

    const headerContent = (
        <div className="h-full max-w-[1920px] mx-auto px-4 sm:px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="p-2 -ml-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-lg font-bold text-slate-900 leading-tight">
                        {lesson?.title || session?.title || 'AI Tutoring Session'}
                    </h1>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {lesson ? 'Lesson Mode' : 'Free Tutoring'}
                        </span>
                        <span>•</span>
                        <span className="text-green-600 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            Live Session
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end mr-2">
                    <span className="text-xs font-medium text-slate-700">Progress</span>
                    <div className="w-32 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: '35%' }}></div>
                    </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center border border-white shadow-sm ring-1 ring-slate-100">
                    <span className="text-sm font-bold text-blue-700">JS</span>
                </div>
            </div>
        </div>
    );

    const visualContent = (
        <div className="flex flex-col gap-8 py-8 max-w-5xl mx-auto w-full">
            {/* Main Whiteboard Area - Hero Section */}
            <div className="w-full">
                <Whiteboard
                    commands={whiteboardCommands}
                    isVisible={true}
                    autoPlay={true}
                    className="w-full aspect-video shadow-lg ring-1 ring-slate-900/5 rounded-2xl"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Learning Objectives - Clean Cards */}
                {lesson && lesson.objectives && (
                    <div className="lg:col-span-2 space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
                            Learning Objectives
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {lesson.objectives.map((obj, idx) => (
                                <div 
                                    key={idx}
                                    className="group p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-default relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <span className="font-bold text-sm">{idx + 1}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-700 leading-relaxed group-hover:text-slate-900 transition-colors">{obj}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Key Points / Summary - Premium Panel */}
                {lesson && lesson.content_structure?.keyPoints && (
                    <div className="lg:col-span-1">
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 h-full">
                            <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
                                <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                                    <GraduationCap className="w-4 h-4" />
                                </div>
                                Key Takeaways
                            </h3>
                            <ul className="space-y-4">
                                {lesson.content_structure.keyPoints.map((point, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-600 group">
                                        <CheckCircle2 className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0 group-hover:text-indigo-600 transition-colors" />
                                        <span className="leading-relaxed group-hover:text-slate-900 transition-colors">{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const footerContent = (
        <div className="flex items-center justify-between gap-4 py-2">
            <button 
                className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-all active:scale-95 flex items-center gap-2"
                onClick={() => navigate('/dashboard')}
            >
                <ArrowLeft className="w-4 h-4" />
                Save & Exit
            </button>
            <div className="flex items-center gap-3">
                <button className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all active:scale-95">
                    Take Quiz
                </button>
                <button className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-sm hover:shadow-md hover:shadow-blue-200 transition-all active:scale-95 flex items-center gap-2">
                    Next Lesson
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );

    return (
        <LessonLayout
            header={headerContent}
            visualContent={visualContent}
            chatContent={
                <ChatPanel
                    messages={messages}
                    onSendMessage={handleTextMessage}
                    isRecording={isRecording}
                    onToggleRecording={toggleRecording}
                    isProcessing={isProcessing}
                    processingStatus={processingStatus}
                    currentTranscript={currentTranscript}
                    isSpeaking={isSpeaking}
                    onStopSpeaking={stopSpeaking}
                    ttsEnabled={ttsEnabled}
                    onToggleTTS={toggleTTS}
                    className="h-full"
                />
            }
            footer={footerContent}
        />
    );
};

export default SessionDetails;
