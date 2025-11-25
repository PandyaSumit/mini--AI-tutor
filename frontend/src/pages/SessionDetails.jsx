import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    Bot,
    ChevronRight,
    ChevronLeft,
    ChevronDown,
    ChevronUp,
    BookOpen,
    PlayCircle,
    GraduationCap,
    Lightbulb,
    Code,
    Target,
    Sparkles,
    Eye,
    EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { io } from 'socket.io-client';
import Whiteboard from '../components/Whiteboard';
import { CommandParser } from '../utils/CommandParser';
import LessonLayout from '../components/LessonLayout';
import ChatPanel from '../components/ChatPanel';
import LessonProgress from '../components/LessonProgress';
import WelcomeTour from '../components/WelcomeTour';
import LearningPathGuide from '../components/LearningPathGuide';
import QuickActionsPanel from '../components/QuickActionsPanel';
import ContextualHint from '../components/ContextualHint';

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
    const [whiteboardEverUsed, setWhiteboardEverUsed] = useState(false);

    // UI state - Collapsible sections
    const [sectionsExpanded, setSectionsExpanded] = useState({
        objectives: true,
        content: true,
        whiteboard: true
    });

    // Track unread messages
    const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
    const lastReadMessageCount = useRef(0);

    // Learning flow state
    const [currentPhase, setCurrentPhase] = useState('objectives'); // objectives, explore, interact, visualize, assess
    const [showWelcomeTour, setShowWelcomeTour] = useState(false);
    const [userInteractions, setUserInteractions] = useState({
        viewedObjectives: false,
        viewedContent: false,
        sentMessage: false,
        usedWhiteboard: false
    });

    // Section refs for scrolling
    const objectivesRef = useRef(null);
    const contentRef = useRef(null);
    const whiteboardRef = useRef(null);

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
                setWhiteboardEverUsed(true);
            }

            // Use cleaned text content (without [WB] blocks)
            content = parsed.textContent || content;

            // Mark as unread message
            setHasUnreadMessages(true);
        }

        const newMessage = {
            _id: Date.now(),
            role,
            content,
            createdAt: new Date()
        };
        setMessages(prev => {
            const updated = [...prev, newMessage];
            lastReadMessageCount.current = updated.length;
            return updated;
        });
    };

    // Track when messages are read (when chat is visible)
    useEffect(() => {
        if (messages.length > lastReadMessageCount.current) {
            // New messages arrived while chat might be closed
            setHasUnreadMessages(true);
        }
    }, [messages]);

    const toggleSection = (sectionName) => {
        setSectionsExpanded(prev => ({
            ...prev,
            [sectionName]: !prev[sectionName]
        }));
    };

    // Scroll to section
    const scrollToSection = (sectionName) => {
        const refs = {
            objectives: objectivesRef,
            content: contentRef,
            whiteboard: whiteboardRef
        };

        const ref = refs[sectionName];
        if (ref?.current) {
            ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Expand the section if collapsed
            if (!sectionsExpanded[sectionName]) {
                toggleSection(sectionName);
            }
        }
    };

    // Handle quick actions
    const handleQuickAction = (actionId) => {
        switch (actionId) {
            case 'objectives':
                scrollToSection('objectives');
                setCurrentPhase('objectives');
                setUserInteractions(prev => ({ ...prev, viewedObjectives: true }));
                break;
            case 'content':
                scrollToSection('content');
                setCurrentPhase('explore');
                setUserInteractions(prev => ({ ...prev, viewedContent: true }));
                break;
            case 'ask-ai':
            case 'chat':
                // Open chat panel if closed
                setCurrentPhase('interact');
                // Trigger chat focus (handled by LessonLayout)
                break;
            case 'visual':
            case 'whiteboard':
                if (whiteboardEverUsed || whiteboardCommands.length > 0) {
                    scrollToSection('whiteboard');
                }
                setCurrentPhase('visualize');
                // Could auto-send a prompt to AI
                handleTextMessage("Can you explain this concept visually?");
                break;
            case 'quiz':
                setCurrentPhase('assess');
                alert('Quiz feature coming soon!');
                break;
            default:
                break;
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e) => {
            // Only trigger if not typing in input/textarea
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            const shortcuts = {
                '1': 'objectives',
                '2': 'content',
                '3': 'ask-ai',
                '4': 'visual',
                '5': 'quiz'
            };

            if (shortcuts[e.key]) {
                e.preventDefault();
                handleQuickAction(shortcuts[e.key]);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [whiteboardEverUsed, whiteboardCommands]);

    // Update phase based on user interactions
    useEffect(() => {
        if (messages.length > 0 && !userInteractions.sentMessage) {
            setUserInteractions(prev => ({ ...prev, sentMessage: true }));
            setCurrentPhase('interact');
        }
        if (whiteboardCommands.length > 0 && !userInteractions.usedWhiteboard) {
            setUserInteractions(prev => ({ ...prev, usedWhiteboard: true }));
            setCurrentPhase('visualize');
        }
    }, [messages, whiteboardCommands]);

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
                </div>
            </div>
        </div>
    );

    // Progress bar component
    const progressBar = lesson && (
        <LessonProgress
            currentStep={1}
            totalSteps={lesson.objectives?.length || 5}
            completedSteps={0}
            estimatedTime={lesson.estimated_duration || '15 min'}
        />
    );

    const visualContent = (
        <div className="space-y-6">
            {/* Learning Path Guide - Shows recommended flow */}
            <LearningPathGuide
                currentPhase={currentPhase}
                onNavigate={handleQuickAction}
            />

            {/* Quick Actions Panel - Central navigation */}
            <QuickActionsPanel onAction={handleQuickAction} />

            {/* Contextual Hint - Welcome message for first-time users */}
            {!userInteractions.viewedObjectives && messages.length === 0 && (
                <ContextualHint
                    id="welcome-start"
                    type="next-step"
                    title="Welcome! Let's Get Started"
                    message="Begin by reviewing the Learning Objectives below to understand what you'll learn in this session."
                    actionLabel="View Objectives"
                    onAction={() => handleQuickAction('objectives')}
                />
            )}

            {/* Contextual Hint - Encourage asking AI */}
            {userInteractions.viewedObjectives && messages.length === 0 && (
                <ContextualHint
                    id="encourage-ai-interaction"
                    type="tip"
                    title="Try Asking Your AI Tutor!"
                    message="Have questions? Click 'Ask AI Tutor' or press '3' to get help. Try asking 'Explain this visually' or 'Give me an example'."
                    actionLabel="Open AI Chat"
                    onAction={() => handleQuickAction('ask-ai')}
                />
            )}

            {/* Contextual Hint - Visual learning */}
            {messages.length > 0 && !whiteboardEverUsed && (
                <ContextualHint
                    id="try-visual-learning"
                    type="tip"
                    title="Visual Learning Available!"
                    message="Ask the AI to 'show me visually' or 'draw a diagram' to see concepts animated on the whiteboard."
                    dismissible={true}
                />
            )}

            {/* Whiteboard Section - Collapsible, Smart Visibility */}
            {(whiteboardEverUsed || whiteboardCommands.length > 0) && (
                <div ref={whiteboardRef} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm scroll-mt-6">
                    {/* Collapsible Header */}
                    <button
                        onClick={() => toggleSection('whiteboard')}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-left">
                                <h2 className="text-lg font-bold text-slate-900">Visual Explanation</h2>
                                <p className="text-sm text-slate-500">
                                    {whiteboardCommands.length > 0
                                        ? `${whiteboardCommands.length} drawing commands`
                                        : 'AI will draw here when explaining concepts'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {whiteboardCommands.length > 0 && (
                                <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full">
                                    Active
                                </span>
                            )}
                            {sectionsExpanded.whiteboard ? (
                                <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                            )}
                        </div>
                    </button>

                    {/* Collapsible Content */}
                    {sectionsExpanded.whiteboard && (
                        <div className="border-t border-slate-100">
                            <Whiteboard
                                commands={whiteboardCommands}
                                isVisible={true}
                                autoPlay={true}
                                className="w-full"
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Call-to-action when whiteboard not used yet */}
            {!whiteboardEverUsed && whiteboardCommands.length === 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-dashed border-blue-200 p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Visual Learning Awaits!</h3>
                    <p className="text-slate-600 mb-4 max-w-md mx-auto">
                        Ask the AI Tutor to explain concepts visually, and watch as ideas come to life on the whiteboard
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                        <span className="px-4 py-2 bg-white rounded-lg text-sm text-slate-600 shadow-sm border border-slate-200">
                            "Explain loops visually"
                        </span>
                        <span className="px-4 py-2 bg-white rounded-lg text-sm text-slate-600 shadow-sm border border-slate-200">
                            "Draw how arrays work"
                        </span>
                    </div>
                </div>
            )}

            {/* Learning Objectives - Collapsible */}
            {lesson && lesson.objectives && lesson.objectives.length > 0 && (
                <div ref={objectivesRef} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm scroll-mt-6">
                    {/* Collapsible Header */}
                    <button
                        onClick={() => toggleSection('objectives')}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                                <Target className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-left">
                                <h2 className="text-lg font-bold text-slate-900">Learning Objectives</h2>
                                <p className="text-sm text-slate-500">{lesson.objectives.length} goals for this lesson</p>
                            </div>
                        </div>
                        {sectionsExpanded.objectives ? (
                            <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        )}
                    </button>

                    {/* Collapsible Content */}
                    {sectionsExpanded.objectives && (
                        <div className="border-t border-slate-100 p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {lesson.objectives.map((obj, idx) => (
                                    <div
                                        key={idx}
                                        className="group p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 relative overflow-hidden"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white border-2 border-blue-500 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
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
                </div>
            )}

            {/* Lesson Content - Collapsible */}
            {lesson && (lesson.content_structure?.keyPoints || lesson.content_structure?.examples) && (
                <div ref={contentRef} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm scroll-mt-6">
                    {/* Collapsible Header */}
                    <button
                        onClick={() => toggleSection('content')}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-sm">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-left">
                                <h2 className="text-lg font-bold text-slate-900">Lesson Content</h2>
                                <p className="text-sm text-slate-500">
                                    Key concepts and examples
                                </p>
                            </div>
                        </div>
                        {sectionsExpanded.content ? (
                            <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        )}
                    </button>

                    {/* Collapsible Content */}
                    {sectionsExpanded.content && (
                        <div className="border-t border-slate-100 p-6 space-y-6">
                            {/* Key Points */}
                            {lesson.content_structure?.keyPoints && lesson.content_structure.keyPoints.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
                                            <Lightbulb className="w-4 h-4 text-yellow-600" />
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-900">Key Points</h4>
                                    </div>
                                    <ul className="space-y-3">
                                        {lesson.content_structure.keyPoints.map((point, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                                                    {idx + 1}
                                                </div>
                                                <p className="text-sm text-slate-700 leading-relaxed flex-1">{point}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Examples Preview */}
                            {lesson.content_structure?.examples && lesson.content_structure.examples.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                                            <Code className="w-4 h-4 text-indigo-600" />
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-900">Code Examples</h4>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                        <p className="text-sm text-slate-600">
                                            <span className="font-semibold text-indigo-600">{lesson.content_structure.examples.length}</span> example{lesson.content_structure.examples.length > 1 ? 's' : ''} available
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">Ask the AI Tutor to walk through the examples</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    const footerContent = (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                    className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-all active:scale-95 flex items-center gap-2"
                    onClick={() => navigate('/dashboard')}
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Save & Exit</span>
                    <span className="sm:hidden">Exit</span>
                </button>
                <div className="flex items-center gap-3 flex-1 justify-end">
                    <button
                        onClick={() => {
                            // TODO: Implement quiz functionality
                            alert('Quiz feature coming soon!');
                        }}
                        className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all active:scale-95 flex items-center gap-2"
                    >
                        <GraduationCap className="w-4 h-4" />
                        <span className="hidden sm:inline">Take Quiz</span>
                    </button>
                    <button
                        onClick={() => {
                            // TODO: Implement next lesson navigation
                            alert('Next lesson feature coming soon!');
                        }}
                        className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-sm hover:shadow-md hover:shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <span>Next Lesson</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Progress Hint */}
            {lesson && lesson.objectives && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-500 text-center">
                        <CheckCircle2 className="w-3 h-3 inline mr-1 text-green-500" />
                        Complete all objectives to unlock the quiz
                    </p>
                </div>
            )}
        </div>
    );

    return (
        <>
            {/* Welcome Tour - First time users only */}
            <WelcomeTour
                onComplete={() => {
                    setShowWelcomeTour(false);
                    // Auto-expand objectives section after tour
                    if (!sectionsExpanded.objectives) {
                        toggleSection('objectives');
                    }
                }}
                onClose={() => setShowWelcomeTour(false)}
            />

            <LessonLayout
                header={headerContent}
                progressBar={progressBar}
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
                isProcessing={isProcessing}
                hasUnreadMessages={hasUnreadMessages}
            />
        </>
    );
};

export default SessionDetails;
