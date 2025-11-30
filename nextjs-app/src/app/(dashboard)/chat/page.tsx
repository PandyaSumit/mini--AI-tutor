/**
 * Chat Page
 * AI Tutor chat interface - Professional, Modern, Minimalistic Design
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { chatService } from '@/services/chat';
import { Send, Sparkles, Loader2, Settings, RotateCcw, Mic, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage({
        message: userMessage.content,
        conversationId: undefined,
      });
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response || 'Sorry, I could not process your request.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, there was an error processing your message. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 px-6 py-4 bg-white">
          <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">AI Tutor</h1>
            <p className="text-sm text-gray-500">Ask me anything about your studies</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-blue-600" strokeWidth={2} />
              </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Start a Conversation</h2>
            <p className="text-gray-600 max-w-md mb-6">
              Ask questions, get explanations, or discuss any topic you&apos;re learning
              </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
                {[
                  'Explain quantum physics',
                  'Help me with calculus',
                  'What is machine learning?',
                  'How does photosynthesis work?',
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(suggestion)}
                  className="px-4 py-3 text-left border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all"
                  >
                  <span className="text-sm text-gray-700">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
          <>
              {messages.map((message) => (
                <div
                  key={message.id}
                className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" strokeWidth={2} />
                    </div>
                  )}

                    <div
                  className={`max-w-2xl ${
                        message.role === 'user'
                      ? 'bg-gray-900 text-white rounded-2xl rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-sm'
                  } px-5 py-3`}
                    >
                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-gray-300' : 'text-gray-500'
                    }`}
                  >
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" strokeWidth={2} />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-5 py-3">
                    <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-gray-600 animate-spin" strokeWidth={2} />
                    <span className="text-sm text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
          </>
          )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 px-6 py-4 bg-white">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="w-full px-5 py-4 pr-14 text-[15px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-900 hover:bg-gray-800 text-white rounded-lg flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
                ) : (
                <Send className="w-5 h-5" strokeWidth={2} />
                )}
              </button>
            </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Press Enter to send • AI can make mistakes, please verify important information
          </p>
        </form>
      </div>
    </div>
  );
}
