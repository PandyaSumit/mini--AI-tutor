/**
 * Session Details Page
 * AI tutoring session with voice and text interaction
 * Note: Voice features require browser APIs and Socket.IO setup
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Brain,
  BookOpen,
  AlertCircle,
  Loader,
} from 'lucide-react';
import { useAuth } from '@/hooks';

interface Message {
  _id: number | string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

interface Session {
  _id: string;
  title?: string;
  status: string;
  conversationId?: string;
  lesson?: {
    title: string;
    objectives?: string[];
  };
}

export default function SessionDetailsPage() {
  const params = useParams();
  const sessionId = params?.sessionId as string;
  const router = useRouter();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Session state
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  // Chat state
  const [inputMessage, setInputMessage] = useState('');

  useEffect(() => {
    // Fetch session data
    // This would normally call voiceService.getSession(sessionId)
    // For now, we'll use mock data
    setLoading(false);

    // Mock session data
    setSession({
      _id: sessionId,
      title: 'AI Tutoring Session',
      status: 'active',
      lesson: {
        title: 'Introduction to JavaScript',
        objectives: [
          'Understand variables and data types',
          'Learn about functions and scope',
          'Practice writing basic code',
        ],
      },
    });
  }, [sessionId]);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Voice recording would be implemented here
  };

  const sendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      _id: Date.now(),
      role: 'user',
      content: inputMessage,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage('');

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        _id: Date.now() + 1,
        role: 'assistant',
        content: 'I understand your question. Let me help you with that...',
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  const toggleTTS = () => {
    setTtsEnabled(!ttsEnabled);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
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
            onClick={() => router.push('/dashboard')}
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
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" strokeWidth={2} />
              <span className="font-medium">Dashboard</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTTS}
                className={`p-2.5 rounded-lg transition-all ${
                  ttsEnabled
                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                {ttsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto">
          <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6 px-6 py-8">
            {/* LEFT COLUMN - Session Info */}
            <div className="flex flex-col gap-6">
              {/* Session Info */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {session?.lesson ? 'Lesson Session' : 'AI Tutoring'}
                      </span>
                      {session?.status === 'active' && (
                        <span className="inline-flex items-center text-sm text-green-600">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                          Live
                        </span>
                      )}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {session?.lesson?.title || session?.title || 'AI Tutoring Session'}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
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
              </div>

              {/* Learning Objectives */}
              {session?.lesson && session.lesson.objectives && session.lesson.objectives.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-5 h-5 text-blue-600" strokeWidth={2} />
                    <h2 className="font-semibold text-gray-900">Learning Objectives</h2>
                  </div>
                  <ul className="space-y-2">
                    {session.lesson.objectives.map((obj, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN - Chat */}
            <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
                      <p className="text-sm text-gray-500">Use the microphone or type to begin</p>
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
                    <div
                      className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-3 shadow-sm ${
                          message.role === 'user'
                            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
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

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="flex-shrink-0 px-6 py-5 border-t border-gray-200 bg-white space-y-4">
                {/* Voice Button */}
                <div className="text-center py-1">
                  <button
                    onClick={toggleRecording}
                    disabled={isProcessing || isSpeaking}
                    className={`relative inline-flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 shadow-lg ${
                      isRecording
                        ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/50 scale-110'
                        : 'bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-blue-500/50'
                    } ${
                      isProcessing || isSpeaking
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:scale-105 active:scale-95'
                    }`}
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
      </main>
    </div>
  );
}
