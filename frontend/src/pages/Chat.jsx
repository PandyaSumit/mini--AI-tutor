import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatService } from '../services/chatService';
import { studyMaterialService } from '../services/studyMaterialService';
import aiService from '../services/aiService';
import {
    Send,
    Loader,
    BookOpen,
    Code,
    Calculator,
    Globe,
    Brain,
    Sparkles,
    Plus,
    MessageCircle,
    User,
    AlertCircle,
    ArrowRight,
    Zap
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const topics = [
    { id: 'programming', label: 'Programming', icon: Code },
    { id: 'mathematics', label: 'Mathematics', icon: Calculator },
    { id: 'languages', label: 'Languages', icon: Globe },
    { id: 'general', label: 'General', icon: BookOpen },
];

const Chat = () => {
    const { conversationId } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState('general');
    const [conversationTitle, setConversationTitle] = useState('');
    const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
    const [aiMode, setAiMode] = useState('rag'); // 'rag' or 'simple'
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (conversationId) {
            loadConversation();
        }
    }, [conversationId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadConversation = async () => {
        try {
            const response = await chatService.getConversationMessages(conversationId);
            setMessages(response.data.messages);
            setConversationTitle(response.data.conversation.title);
            setSelectedTopic(response.data.conversation.topic);
        } catch (error) {
            console.error('Error loading conversation:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || loading) return;

        const userMessageText = inputMessage.trim();
        setInputMessage('');

        // Add user message to UI immediately
        const tempUserMessage = {
            role: 'user',
            content: userMessageText,
            createdAt: new Date(),
            _id: `temp-${Date.now()}`
        };
        setMessages(prev => [...prev, tempUserMessage]);
        setLoading(true);

        try {
            let aiResponse;

            // Use AI Service with RAG or simple mode
            if (aiMode === 'rag') {
                // RAG mode - get answer with sources
                aiResponse = await aiService.ragQuery(userMessageText, {
                    topK: 5,
                    collectionKey: 'knowledge'
                });

                const aiMessage = {
                    role: 'assistant',
                    content: aiResponse.answer,
                    createdAt: new Date(),
                    _id: `ai-${Date.now()}`,
                    sources: aiResponse.sources || [],
                    confidence: aiResponse.confidence,
                    model: aiResponse.model,
                    isRAG: true
                };

                setMessages(prev => {
                    const filtered = prev.filter(msg => msg._id !== tempUserMessage._id);
                    return [...filtered, tempUserMessage, aiMessage];
                });
            } else {
                // Simple mode - direct AI chat
                aiResponse = await aiService.chat(userMessageText);

                const aiMessage = {
                    role: 'assistant',
                    content: aiResponse.response,
                    createdAt: new Date(),
                    _id: `ai-${Date.now()}`,
                    model: aiResponse.model,
                    isRAG: false
                };

                setMessages(prev => {
                    const filtered = prev.filter(msg => msg._id !== tempUserMessage._id);
                    return [...filtered, tempUserMessage, aiMessage];
                });
            }

            // Optional: Save to database if conversationId exists
            if (conversationId) {
                try {
                    await chatService.sendMessage({
                        conversationId,
                        message: userMessageText,
                        topic: selectedTopic
                    });
                } catch (dbError) {
                    console.warn('Failed to save to database:', dbError);
                    // Continue anyway - we still show the AI response
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
            // Remove temp message on error
            setMessages(prev => prev.filter(msg => msg._id !== tempUserMessage._id));

            // Show error in a more user-friendly way
            const errorMessage = {
                role: 'assistant',
                content: error.response?.data?.error || 'Sorry, I encountered an error processing your message. Please try again.',
                createdAt: new Date(),
                _id: `error-${Date.now()}`,
                isError: true
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleGenerateFlashcards = async () => {
        if (!conversationId || messages.length === 0) {
            alert('Start a conversation first to generate flashcards!');
            return;
        }

        setGeneratingFlashcards(true);
        try {
            await studyMaterialService.generateFlashcards({
                conversationId,
                count: 10,
                difficulty: 'intermediate'
            });

            if (window.confirm('Flashcards generated successfully! Would you like to study them now?')) {
                navigate('/flashcards');
            }
        } catch (error) {
            console.error('Error generating flashcards:', error);
            alert(error.response?.data?.message || 'Failed to generate flashcards');
        } finally {
            setGeneratingFlashcards(false);
        }
    };

    const suggestedPrompts = [
        {
            icon: Code,
            title: 'Programming Help',
            prompt: 'Explain how async/await works in JavaScript with examples'
        },
        {
            icon: Calculator,
            title: 'Math Concepts',
            prompt: 'Teach me about derivatives in calculus'
        },
        {
            icon: Globe,
            title: 'Language Learning',
            prompt: 'Help me understand Spanish verb conjugations'
        },
        {
            icon: BookOpen,
            title: 'General Knowledge',
            prompt: 'Explain the theory of relativity in simple terms'
        }
    ];

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="mx-auto px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between gap-4">
                        {/* Title Section */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
                                    <MessageCircle className="w-5 h-5 text-white" strokeWidth={2} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h1 className="text-lg font-bold text-gray-900 truncate">
                                        {conversationTitle || 'New Conversation'}
                                    </h1>
                                    {!conversationId && (
                                        <p className="text-sm text-gray-500">Select a topic to begin</p>
                                    )}
                                </div>
                            </div>

                            {/* Topic Selector - Only for new conversations */}
                            {!conversationId && (
                                <div className="flex flex-wrap gap-2">
                                    {topics.map((topic) => {
                                        const Icon = topic.icon;
                                        const isSelected = selectedTopic === topic.id;
                                        return (
                                            <button
                                                key={topic.id}
                                                onClick={() => setSelectedTopic(topic.id)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isSelected
                                                    ? 'bg-gray-900 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                <Icon className="w-4 h-4" strokeWidth={2} />
                                                <span>{topic.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {/* AI Mode Toggle */}
                            <button
                                onClick={() => setAiMode(aiMode === 'rag' ? 'simple' : 'rag')}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                    aiMode === 'rag'
                                        ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                                title={aiMode === 'rag' ? 'RAG Mode: Smart answers with sources' : 'Simple Mode: Direct AI responses'}
                            >
                                {aiMode === 'rag' ? (
                                    <>
                                        <Sparkles className="w-4 h-4" strokeWidth={2} />
                                        <span className="hidden sm:inline">RAG</span>
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-4 h-4" strokeWidth={2} />
                                        <span className="hidden sm:inline">Simple</span>
                                    </>
                                )}
                            </button>

                            {conversationId && (
                                <>
                                    <button
                                        onClick={handleGenerateFlashcards}
                                        disabled={generatingFlashcards || messages.length === 0}
                                        className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Generate flashcards from this conversation"
                                    >
                                        {generatingFlashcards ? (
                                            <>
                                                <Loader className="w-4 h-4 animate-spin" strokeWidth={2} />
                                                <span>Generating...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Brain className="w-4 h-4" strokeWidth={2} />
                                                <span>Flashcards</span>
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => navigate('/chat')}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-all"
                                    >
                                        <Plus className="w-4 h-4" strokeWidth={2} />
                                        <span className="hidden sm:inline">New</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-8">
                <div className="mx-auto">
                    {messages.length === 0 ? (
                        /* Empty State */
                        <div className="max-w-3xl mx-auto">
                            {/* Hero */}
                            <div className="text-center mb-12">
                                <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                    <MessageCircle className="w-8 h-8 text-gray-600" strokeWidth={2} />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                                    How can I help you learn today?
                                </h2>
                                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                                    Ask me anything about programming, mathematics, languages, or any topic you'd like to explore.
                                </p>
                            </div>

                            {/* Suggested Prompts */}
                            <div className="space-y-3 mb-12">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Try asking:</h3>
                                {suggestedPrompts.map((suggestion, index) => {
                                    const Icon = suggestion.icon;
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => setInputMessage(suggestion.prompt)}
                                            className="w-full text-left p-5 bg-white border border-gray-200 rounded-xl hover:border-gray-900 hover:bg-gray-50 transition-all group"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-900 transition-colors">
                                                    <Icon className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" strokeWidth={2} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-gray-900 mb-1">{suggestion.title}</h4>
                                                    <p className="text-sm text-gray-600 line-clamp-2">{suggestion.prompt}</p>
                                                </div>
                                                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-all flex-shrink-0" strokeWidth={2} />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Features */}
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                                <h3 className="font-semibold text-gray-900 mb-4">What I can do:</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {[
                                        { icon: MessageCircle, text: 'Answer your questions' },
                                        { icon: Code, text: 'Explain code & concepts' },
                                        { icon: Brain, text: 'Generate flashcards' }
                                    ].map((feature, index) => {
                                        const Icon = feature.icon;
                                        return (
                                            <div key={index} className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 border border-gray-200">
                                                    <Icon className="w-4 h-4 text-gray-600" strokeWidth={2} />
                                                </div>
                                                <span className="text-sm text-gray-700">{feature.text}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Messages */
                        <div className="space-y-6">
                            {messages.map((message) => (
                                <div
                                    key={message._id}
                                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        {/* Avatar */}
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${message.role === 'user'
                                            ? 'bg-gray-900'
                                            : message.isError
                                                ? 'bg-red-100'
                                                : 'bg-gray-100'
                                            }`}>
                                            {message.role === 'user' ? (
                                                <User className="w-4 h-4 text-white" strokeWidth={2} />
                                            ) : message.isError ? (
                                                <AlertCircle className="w-4 h-4 text-red-600" strokeWidth={2} />
                                            ) : (
                                                <MessageCircle className="w-4 h-4 text-gray-600" strokeWidth={2} />
                                            )}
                                        </div>

                                        {/* Message Bubble */}
                                        <div
                                            className={`rounded-xl px-5 py-4 ${message.role === 'user'
                                                ? 'bg-gray-900 text-white'
                                                : message.isError
                                                    ? 'bg-red-50 text-red-900 border border-red-200'
                                                    : 'bg-gray-50 text-gray-900 border border-gray-200'
                                                }`}
                                        >
                                            {message.role === 'user' ? (
                                                <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{message.content}</p>
                                            ) : (
                                                <div className="prose prose-sm max-w-none">
                                                    <ReactMarkdown
                                                        components={{
                                                            code({ node, inline, className, children, ...props }) {
                                                                const match = /language-(\w+)/.exec(className || '');
                                                                return !inline && match ? (
                                                                    <SyntaxHighlighter
                                                                        style={vscDarkPlus}
                                                                        language={match[1]}
                                                                        PreTag="div"
                                                                        className="rounded-lg my-4 text-sm"
                                                                        {...props}
                                                                    >
                                                                        {String(children).replace(/\n$/, '')}
                                                                    </SyntaxHighlighter>
                                                                ) : (
                                                                    <code className="bg-gray-200 text-gray-900 px-1.5 py-0.5 rounded text-sm" {...props}>
                                                                        {children}
                                                                    </code>
                                                                );
                                                            },
                                                            p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed text-[15px] text-gray-900">{children}</p>,
                                                            ul: ({ children }) => <ul className="mb-4 ml-4 space-y-2 list-disc text-gray-900">{children}</ul>,
                                                            ol: ({ children }) => <ol className="mb-4 ml-4 space-y-2 list-decimal text-gray-900">{children}</ol>,
                                                            li: ({ children }) => <li className="text-[15px] text-gray-900">{children}</li>,
                                                            h1: ({ children }) => <h1 className="text-xl font-bold mb-3 text-gray-900">{children}</h1>,
                                                            h2: ({ children }) => <h2 className="text-lg font-bold mb-3 text-gray-900">{children}</h2>,
                                                            h3: ({ children }) => <h3 className="text-base font-bold mb-2 text-gray-900">{children}</h3>,
                                                            strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                                                            a: ({ children, href }) => <a href={href} className="text-gray-900 underline hover:text-gray-700" target="_blank" rel="noopener noreferrer">{children}</a>,
                                                        }}
                                                    >
                                                        {message.content}
                                                    </ReactMarkdown>
                                                </div>
                                            )}

                                            {/* RAG Sources Display */}
                                            {message.sources && message.sources.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-gray-300">
                                                    <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                                                        <BookOpen className="w-3 h-3" />
                                                        Sources ({message.sources.length}):
                                                    </p>
                                                    <div className="space-y-2">
                                                        {message.sources.map((source, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="text-xs bg-white p-3 rounded-lg border border-gray-200"
                                                            >
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="font-medium text-gray-700">
                                                                        Source {idx + 1}
                                                                    </span>
                                                                    <span className="text-green-600 font-semibold">
                                                                        {(source.score * 100).toFixed(0)}% match
                                                                    </span>
                                                                </div>
                                                                <p className="text-gray-600 line-clamp-2">
                                                                    {source.content}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Confidence Score & Model Info */}
                                            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                                                <div className="flex items-center gap-3">
                                                    {message.confidence && (
                                                        <span>
                                                            Confidence: {(message.confidence * 100).toFixed(0)}%
                                                        </span>
                                                    )}
                                                    {message.model && (
                                                        <span className="flex items-center gap-1">
                                                            {message.isRAG && <Sparkles className="w-3 h-3 text-purple-500" />}
                                                            {message.model}
                                                        </span>
                                                    )}
                                                </div>
                                                {message.metadata?.responseTime && (
                                                    <span>
                                                        {(message.metadata.responseTime / 1000).toFixed(2)}s
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Typing Indicator */}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="flex gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                            <MessageCircle className="w-4 h-4 text-gray-600" strokeWidth={2} />
                                        </div>
                                        <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-gray-100">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <form onSubmit={handleSendMessage}>
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                placeholder="Ask me anything..."
                                className="w-full pl-5 pr-14 py-3.5 text-[15px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400 bg-white"
                                disabled={loading}
                                autoComplete="off"
                            />
                            <button
                                type="submit"
                                disabled={loading || !inputMessage.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-gray-900 hover:bg-gray-800 text-white rounded-lg flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <Loader className="w-4 h-4 animate-spin" strokeWidth={2} />
                                ) : (
                                    <Send className="w-4 h-4" strokeWidth={2} />
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2.5 text-center">
                            Press Enter to send • AI can make mistakes, verify important information
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Chat;