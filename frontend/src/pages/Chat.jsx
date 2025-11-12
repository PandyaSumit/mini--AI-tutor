import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatService } from '../services/chatService';
import { studyMaterialService } from '../services/studyMaterialService';
import { Send, Loader, BookOpen, Code, Calculator, Globe, History, Brain, Sparkles } from 'lucide-react';
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
  const messagesEndRef = useRef(null);

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
      alert('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
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

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {conversationTitle || 'New Conversation'}
            </h1>
            {!conversationId && (
              <div className="flex gap-2 mt-2">
                {topics.map((topic) => {
                  const Icon = topic.icon;
                  return (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopic(topic.id)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedTopic === topic.id
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {topic.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {conversationId && (
            <div className="flex gap-2">
              <button
                onClick={handleGenerateFlashcards}
                disabled={generatingFlashcards || messages.length === 0}
                className="btn-secondary flex items-center gap-2"
                title="Generate flashcards from this conversation"
              >
                {generatingFlashcards ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span className="hidden md:inline">Generating...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    <span className="hidden md:inline">Create Flashcards</span>
                  </>
                )}
              </button>
              <button
                onClick={() => navigate('/chat')}
                className="btn-secondary"
              >
                New Chat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Start Learning with AI
              </h2>
              <p className="text-gray-600 mb-6">
                Ask me anything! I'm here to help you learn.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <button
                  onClick={() => setInputMessage('Explain how functions work in JavaScript')}
                  className="p-4 text-left bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <Code className="w-5 h-5 text-primary-600 mb-2" />
                  <p className="font-medium text-gray-900">Programming</p>
                  <p className="text-sm text-gray-600">Learn coding concepts</p>
                </button>
                <button
                  onClick={() => setInputMessage('Teach me about calculus derivatives')}
                  className="p-4 text-left bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <Calculator className="w-5 h-5 text-primary-600 mb-2" />
                  <p className="font-medium text-gray-900">Mathematics</p>
                  <p className="text-sm text-gray-600">Master math topics</p>
                </button>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl ${
                    message.role === 'user'
                      ? 'bg-primary-600 text-white rounded-2xl rounded-br-none'
                      : 'bg-white text-gray-900 rounded-2xl rounded-bl-none shadow-md'
                  } px-6 py-4`}
                >
                  {message.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
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
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
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
                    <p className="text-xs text-gray-500 mt-2">
                      Response time: {(message.metadata.responseTime / 1000).toFixed(2)}s
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl rounded-bl-none shadow-md px-6 py-4">
                <Loader className="w-5 h-5 animate-spin text-primary-600" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <form onSubmit={handleSendMessage} className="max-w-5xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="btn-primary px-6"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;
