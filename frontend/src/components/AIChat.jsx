/**
 * AI Chat Component
 * Enhanced chat with RAG (Retrieval Augmented Generation)
 * Shows sources and confidence scores
 */

import { useState, useRef, useEffect } from 'react';
import { useAI } from '../hooks/useAI';

const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [useRAG, setUseRAG] = useState(true);
  const messagesEndRef = useRef(null);
  const { chat, askQuestion, loading } = useAI();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      let result;
      if (useRAG) {
        // Use RAG for context-aware responses
        result = await askQuestion(input);

        const aiMessage = {
          role: 'assistant',
          content: result.answer,
          sources: result.sources || [],
          confidence: result.confidence,
          model: result.model,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        // Simple chat
        result = await chat(input);

        const aiMessage = {
          role: 'assistant',
          content: result.response,
          model: result.model,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        role: 'error',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">AI Tutor</h2>
            <p className="text-sm text-blue-100">
              {useRAG ? '🔍 RAG-Enhanced (with knowledge base)' : '💬 Simple Chat'}
            </p>
          </div>
          <button
            onClick={() => setUseRAG(!useRAG)}
            className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
          >
            {useRAG ? 'Switch to Simple' : 'Enable RAG'}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-2">Ask me anything!</h3>
            <p className="text-sm">
              {useRAG
                ? "I'll search the knowledge base to give you the best answer."
                : "I'll respond based on my training."}
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3/4 rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.role === 'error'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>

                {/* Show sources for RAG responses */}
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <p className="text-xs font-semibold text-gray-600 mb-2">
                      📚 Sources ({message.sources.length}):
                    </p>
                    {message.sources.map((source, idx) => (
                      <div
                        key={idx}
                        className="text-xs bg-white p-2 rounded mb-2 border border-gray-200"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-gray-700">
                            Source {idx + 1}
                          </span>
                          <span className="text-green-600">
                            {(source.score * 100).toFixed(0)}% match
                          </span>
                        </div>
                        <p className="text-gray-600 line-clamp-2">
                          {source.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Confidence score */}
                {message.confidence && (
                  <div className="mt-2 text-xs text-gray-600">
                    Confidence: {(message.confidence * 100).toFixed(0)}%
                  </div>
                )}

                {/* Timestamp */}
                <div className="mt-2 text-xs opacity-70">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-gray-50 rounded-b-lg">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={useRAG ? "Ask a question..." : "Chat with AI..."}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? '...' : 'Send'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {useRAG
            ? '💡 Tip: Questions will be answered using your knowledge base for more accurate responses.'
            : '💬 Simple chat mode - responses based on AI training only.'}
        </p>
      </form>
    </div>
  );
};

export default AIChat;
