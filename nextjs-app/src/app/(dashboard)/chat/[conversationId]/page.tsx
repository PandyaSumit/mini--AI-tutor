'use client';

/**
 * Conversation Detail Page
 * View and continue a specific conversation
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Send, Loader, Brain, Sparkles, ArrowLeft, BookOpen } from 'lucide-react';
import { chatService } from '@/services/chat/chatService';
import { studyMaterialService } from '@/services/studyMaterial/studyMaterialService';
import ReactMarkdown from 'react-markdown';

interface Message {
  _id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  thinking?: string;
  isRAG?: boolean;
  sources?: any[];
}

interface Conversation {
  _id: string;
  title: string;
  topic?: string;
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadConversation();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversation = async () => {
    try {
      setLoadingConversation(true);
      setError(null);

      const response = await chatService.getConversationMessages(conversationId);
      setConversation(response.conversation);
      setMessages(response.messages);
    } catch (err: any) {
      console.error('Error loading conversation:', err);
      setError(err.message || 'Failed to load conversation');
    } finally {
      setLoadingConversation(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userMessageText = inputMessage.trim();
    setInputMessage('');

    const tempUserMessage: Message = {
      _id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessageText,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, tempUserMessage]);
    setLoading(true);

    try {
      const response = await chatService.sendMessage({
        conversationId,
        message: userMessageText,
        topic: conversation?.topic || 'general',
      });

      // Replace temp message with real one and add AI response
      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg._id !== tempUserMessage._id);
        return [...filtered, response.userMessage, response.aiMessage];
      });
    } catch (err: any) {
      console.error('Error sending message:', err);

      // Add error message
      const errorMessage: Message = {
        _id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleGenerateFlashcards = async () => {
    if (messages.length === 0) {
      alert('Start a conversation first to generate flashcards!');
      return;
    }

    try {
      setGeneratingFlashcards(true);

      const conversationText = messages
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join('\n\n');

      await studyMaterialService.generateFlashcards({
        topic: conversation?.title || 'Conversation',
        content: conversationText,
        count: 10,
      });

      alert('Flashcards generated successfully! Check your flashcards page.');
      router.push('/flashcards');
    } catch (err: any) {
      console.error('Error generating flashcards:', err);
      alert(err.message || 'Failed to generate flashcards');
    } finally {
      setGeneratingFlashcards(false);
    }
  };

  if (loadingConversation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
          <button
            onClick={() => router.push('/conversations')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Conversations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/conversations')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {conversation?.title || 'Conversation'}
              </h1>
              {conversation?.topic && (
                <p className="text-sm text-gray-500 capitalize">{conversation.topic}</p>
              )}
            </div>
          </div>

          <button
            onClick={handleGenerateFlashcards}
            disabled={generatingFlashcards || messages.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <BookOpen className="w-4 h-4" />
            <span>{generatingFlashcards ? 'Generating...' : 'Generate Flashcards'}</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl rounded-2xl px-6 py-4 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-white shadow-md border border-gray-100'
                  }`}
                >
                  {message.role === 'assistant' && message.thinking && (
                    <div className="mb-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                      <div className="flex items-center space-x-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-semibold text-purple-900">
                          Thinking Process
                        </span>
                      </div>
                      <p className="text-sm text-purple-700 italic">{message.thinking}</p>
                    </div>
                  )}

                  <div
                    className={`prose prose-sm max-w-none ${
                      message.role === 'user' ? 'prose-invert' : ''
                    }`}
                  >
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>

                  {message.isRAG && message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">Sources:</p>
                      <div className="space-y-1">
                        {message.sources.map((source: any, idx: number) => (
                          <div key={idx} className="text-xs text-gray-600">
                            • {source.metadata?.source || 'Course Material'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white shadow-md border border-gray-100 rounded-2xl px-6 py-4">
                <div className="flex items-center space-x-2">
                  <Loader className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-gray-600">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-4 shadow-lg">
        <div className="max-w-5xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Type your message... (Shift+Enter for new line)"
              rows={1}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-md"
            >
              <Send className="w-5 h-5" />
              <span className="font-medium">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
