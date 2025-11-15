import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatService } from '../services/chatService';
import { studyMaterialService } from '../services/studyMaterialService';
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
  Zap,
  ChevronRight,
  User
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const topics = [
  { id: 'programming', label: 'Programming', icon: Code, color: 'blue' },
  { id: 'mathematics', label: 'Mathematics', icon: Calculator, color: 'purple' },
  { id: 'languages', label: 'Languages', icon: Globe, color: 'green' },
  { id: 'general', label: 'General', icon: BookOpen, color: 'gray' },
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
      const response = await chatService.sendMessage({
        conversationId: conversationId || null,
        message: userMessageText,
        topic: selectedTopic
      });

      // Update messages with actual response
      setMessages(prev => {
        const filtered = prev.filter(msg => msg._id !== tempUserMessage._id);
        return [
          ...filtered,
          response.data.userMessage,
          response.data.aiMessage
        ];
      });

      // If new conversation, navigate to it
      if (!conversationId && response.data.conversationId) {
        navigate(`/chat/${response.data.conversationId}`, { replace: true });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg._id !== tempUserMessage._id));

      // Show error in a more user-friendly way
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
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
      prompt: 'Explain how async/await works in JavaScript with examples',
      color: 'blue'
    },
    {
      icon: Calculator,
      title: 'Math Concepts',
      prompt: 'Teach me about derivatives in calculus',
      color: 'purple'
    },
    {
      icon: Globe,
      title: 'Language Learning',
      prompt: 'Help me understand Spanish verb conjugations',
      color: 'green'
    },
    {
      icon: BookOpen,
      title: 'General Knowledge',
      prompt: 'Explain the theory of relativity in simple terms',
      color: 'orange'
    }
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-500',
      light: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-600',
      hover: 'hover:bg-blue-600'
    },
    purple: {
      bg: 'bg-purple-500',
      light: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-600',
      hover: 'hover:bg-purple-600'
    },
    green: {
      bg: 'bg-green-500',
      light: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-600',
      hover: 'hover:bg-green-600'
    },
    orange: {
      bg: 'bg-orange-500',
      light: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-600',
      hover: 'hover:bg-orange-600'
    },
    gray: {
      bg: 'bg-gray-600',
      light: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-600',
      hover: 'hover:bg-gray-700'
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Premium Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Title Section */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                    {conversationTitle || 'New Conversation'}
                  </h1>
                  {!conversationId && (
                    <p className="text-sm text-gray-500">Select a topic to get started</p>
                  )}
                </div>
              </div>

              {/* Topic Selector - Only for new conversations */}
              {!conversationId && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {topics.map((topic) => {
                    const Icon = topic.icon;
                    const colors = colorClasses[topic.color];
                    const isSelected = selectedTopic === topic.id;
                    return (
                      <button
                        key={topic.id}
                        onClick={() => setSelectedTopic(topic.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          isSelected
                            ? `${colors.bg} text-white shadow-md scale-105`
                            : `bg-white ${colors.text} border-2 ${colors.border} ${colors.hover} hover:text-white hover:shadow-md hover:scale-105`
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
            {conversationId && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleGenerateFlashcards}
                  disabled={generatingFlashcards || messages.length === 0}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95"
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
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
                >
                  <Plus className="w-4 h-4" strokeWidth={2} />
                  <span className="hidden sm:inline">New</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto">
          {messages.length === 0 ? (
            /* Premium Empty State */
            <div className="animate-fade-in">
              {/* Hero Section */}
              <div className="text-center py-8 sm:py-12 mb-8">
                <div className="relative inline-block mb-6">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl animate-scale-in">
                    <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-white" strokeWidth={2} />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-green-500 border-4 border-white flex items-center justify-center shadow-lg animate-pulse">
                    <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                  Start Learning with AI
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                  Ask me anything! I'm here to help you understand complex topics,
                  solve problems, and accelerate your learning journey.
                </p>
              </div>

              {/* Suggested Prompts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {suggestedPrompts.map((suggestion, index) => {
                  const Icon = suggestion.icon;
                  const colors = colorClasses[suggestion.color];
                  return (
                    <button
                      key={index}
                      onClick={() => setInputMessage(suggestion.prompt)}
                      className={`group text-left p-6 bg-white rounded-2xl border-2 ${colors.border} hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-slide-up`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className={`w-12 h-12 rounded-xl ${colors.light} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-6 h-6 ${colors.text}`} strokeWidth={2} />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {suggestion.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed mb-3">
                        "{suggestion.prompt}"
                      </p>
                      <div className="flex items-center gap-1 text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Try this prompt</span>
                        <ChevronRight className="w-4 h-4" strokeWidth={2} />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Features */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 sm:p-8 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                  What I can help you with
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { icon: MessageCircle, text: 'Answer questions' },
                    { icon: Code, text: 'Explain code' },
                    { icon: Brain, text: 'Create flashcards' }
                  ].map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div key={index} className="flex items-center gap-3 text-gray-700">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-blue-600" strokeWidth={2} />
                        </div>
                        <span className="text-sm font-medium">{feature.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div
                  key={message._id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className={`flex gap-3 max-w-[85%] sm:max-w-3xl ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-md ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-gray-700 to-gray-900'
                        : message.isError
                        ? 'bg-gradient-to-br from-red-500 to-pink-500'
                        : 'bg-gradient-to-br from-blue-500 to-purple-500'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="w-5 h-5 text-white" strokeWidth={2} />
                      ) : (
                        <Sparkles className="w-5 h-5 text-white" strokeWidth={2} />
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`rounded-2xl px-5 py-4 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-br-none shadow-lg'
                          : message.isError
                          ? 'bg-red-50 text-red-900 rounded-bl-none border-2 border-red-200'
                          : 'bg-white text-gray-900 rounded-bl-none shadow-md border border-gray-100'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      ) : (
                        <ReactMarkdown
                          className="markdown-content prose prose-sm max-w-none"
                          components={{
                            code({ node, inline, className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || '');
                              return !inline && match ? (
                                <SyntaxHighlighter
                                  style={vscDarkPlus}
                                  language={match[1]}
                                  PreTag="div"
                                  className="rounded-xl my-4"
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              ) : (
                                <code className={`${className} bg-gray-100 text-gray-900 px-1.5 py-0.5 rounded`} {...props}>
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      )}
                      {message.metadata?.responseTime && (
                        <p className="text-xs text-gray-500 mt-3 opacity-60">
                          Response time: {(message.metadata.responseTime / 1000).toFixed(2)}s
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {loading && (
                <div className="flex justify-start animate-slide-up">
                  <div className="flex gap-3 max-w-3xl">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
                      <Sparkles className="w-5 h-5 text-white" strokeWidth={2} />
                    </div>
                    <div className="bg-white rounded-2xl rounded-bl-none shadow-md border border-gray-100 px-6 py-4">
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

      {/* Premium Input Area */}
      <div className="bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <form onSubmit={handleSendMessage}>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me anything..."
                className="w-full pl-5 pr-14 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400 shadow-sm hover:border-gray-300 text-base"
                disabled={loading}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95"
              >
                {loading ? (
                  <Loader className="w-5 h-5 animate-spin" strokeWidth={2} />
                ) : (
                  <Send className="w-5 h-5" strokeWidth={2} />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Press Enter to send • AI can make mistakes, verify important information
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
