/**
 * AI Service
 * Connect to AI Pipeline API endpoints
 */

import api from './api';

export const aiService = {
  /**
   * Chat with AI (simple completion)
   */
  chat: async (message, context = {}) => {
    const response = await api.post('/ai/chat', {
      message,
      context,
    });
    return response.data;
  },

  /**
   * RAG Query - Enhanced chat with knowledge base
   */
  ragQuery: async (query, options = {}) => {
    const response = await api.post('/ai/rag/query', {
      query,
      topK: options.topK || 5,
      collectionKey: options.collectionKey || 'knowledge',
    });
    return response.data;
  },

  /**
   * Generate embeddings for texts
   */
  generateEmbeddings: async (texts) => {
    const response = await api.post('/ai/embeddings', {
      texts: Array.isArray(texts) ? texts : [texts],
    });
    return response.data;
  },

  /**
   * Semantic search across knowledge base
   */
  semanticSearch: async (query, options = {}) => {
    const response = await api.post('/ai/search', {
      query,
      topK: options.topK || 10,
      collectionKey: options.collectionKey || 'knowledge',
    });
    return response.data;
  },

  /**
   * Ingest content into knowledge base
   */
  ingestContent: async (type, content, metadata = {}) => {
    const response = await api.post('/ai/ingest', {
      type, // "roadmap", "flashcard", "note", "knowledge"
      content,
      metadata,
    });
    return response.data;
  },

  /**
   * Get AI statistics and performance
   */
  getStats: async () => {
    const response = await api.get('/ai/stats');
    return response.data;
  },

  /**
   * Health check for AI services
   */
  healthCheck: async () => {
    const response = await api.get('/ai/health');
    return response.data;
  },

  /**
   * Search roadmaps semantically
   */
  searchRoadmaps: async (query, topK = 5) => {
    return aiService.semanticSearch(query, {
      topK,
      collectionKey: 'roadmaps',
    });
  },

  /**
   * Search flashcards semantically
   */
  searchFlashcards: async (query, topK = 5) => {
    return aiService.semanticSearch(query, {
      topK,
      collectionKey: 'flashcards',
    });
  },

  /**
   * Search user notes semantically
   */
  searchNotes: async (query, topK = 5) => {
    return aiService.semanticSearch(query, {
      topK,
      collectionKey: 'notes',
    });
  },

  /**
   * Ask question with context from roadmap
   */
  askAboutRoadmap: async (question, roadmapId) => {
    return aiService.ragQuery(question, {
      collectionKey: 'roadmaps',
      topK: 3,
    });
  },

  /**
   * Get AI-powered learning recommendations
   */
  getRecommendations: async (userProfile) => {
    return aiService.ragQuery(
      `Based on my learning profile, what should I learn next? Profile: ${JSON.stringify(userProfile)}`,
      { topK: 5 }
    );
  },

  /**
   * AI Tutor chat with Socratic teaching method
   * @param {string} message - Student's question or message
   * @param {object} options - Tutor context options
   * @param {string} options.subject - Subject area (programming, mathematics, languages, sciences)
   * @param {string} options.level - Student level (beginner, intermediate, advanced)
   * @param {string} options.phase - Session phase (warmup, diagnostic, introduction, guidedPractice, independentPractice, reflection)
   * @param {array} options.conversationHistory - Previous conversation exchanges
   */
  tutorChat: async (message, options = {}) => {
    const response = await api.post('/ai/tutor', {
      message,
      subject: options.subject || 'general',
      level: options.level || 'intermediate',
      phase: options.phase || 'introduction',
      conversationHistory: options.conversationHistory || []
    });
    return response.data;
  },
};

export default aiService;
