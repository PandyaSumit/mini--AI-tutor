/**
 * AI Dashboard Page
 * Central hub for all AI-powered features
 */

import { useState } from 'react';
import AIChat from '../components/AIChat';
import SemanticSearch from '../components/SemanticSearch';

const AIDashboard = () => {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            🤖 AI Learning Assistant
          </h1>
          <p className="text-gray-600">
            Powered by RAG (Retrieval Augmented Generation) and Local Embeddings
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'chat'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            💬 AI Chat
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'search'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            🔍 Semantic Search
          </button>
        </div>

        {/* Content */}
        <div className="min-h-[600px]">
          {activeTab === 'chat' && <AIChat />}
          {activeTab === 'search' && <SemanticSearch />}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="font-semibold text-gray-900 mb-1">RAG-Enhanced Answers</h3>
            <p className="text-sm text-gray-600">
              Get accurate answers based on your knowledge base, not just AI training
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-3xl mb-2">💰</div>
            <h3 className="font-semibold text-gray-900 mb-1">100% FREE Embeddings</h3>
            <p className="text-sm text-gray-600">
              Local BGE-small model - $0 cost vs $30/month with OpenAI
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-semibold text-gray-900 mb-1">Smart Caching</h3>
            <p className="text-sm text-gray-600">
              Multi-layer cache for lightning-fast responses (85%+ hit ratio)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDashboard;
