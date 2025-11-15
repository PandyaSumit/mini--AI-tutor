/**
 * useAI Hook
 * React hook for using AI features in components
 */

import { useState, useCallback } from 'react';
import aiService from '../services/aiService';
import { useToast } from '../context/ToastContext';

export const useAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  /**
   * Chat with AI (simple)
   */
  const chat = useCallback(async (message, context = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await aiService.chat(message, context);
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to get AI response';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  /**
   * RAG Query (enhanced with knowledge base)
   */
  const askQuestion = useCallback(async (question, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await aiService.ragQuery(question, options);
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to process RAG query';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  /**
   * Semantic search
   */
  const search = useCallback(async (query, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await aiService.semanticSearch(query, options);
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Search failed';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  /**
   * Ingest content
   */
  const ingestContent = useCallback(async (type, content, metadata = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await aiService.ingestContent(type, content, metadata);
      showToast('Content added to knowledge base', 'success');
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to ingest content';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  /**
   * Get AI stats
   */
  const getStats = useCallback(async () => {
    try {
      return await aiService.getStats();
    } catch (err) {
      console.error('Failed to get AI stats:', err);
      return null;
    }
  }, []);

  /**
   * Health check
   */
  const checkHealth = useCallback(async () => {
    try {
      return await aiService.healthCheck();
    } catch (err) {
      console.error('AI health check failed:', err);
      return null;
    }
  }, []);

  /**
   * Search specific content types
   */
  const searchRoadmaps = useCallback(async (query, topK = 5) => {
    return search(query, { collectionKey: 'roadmaps', topK });
  }, [search]);

  const searchFlashcards = useCallback(async (query, topK = 5) => {
    return search(query, { collectionKey: 'flashcards', topK });
  }, [search]);

  const searchNotes = useCallback(async (query, topK = 5) => {
    return search(query, { collectionKey: 'notes', topK });
  }, [search]);

  return {
    // State
    loading,
    error,

    // Core AI functions
    chat,
    askQuestion,
    search,
    ingestContent,

    // Specific search functions
    searchRoadmaps,
    searchFlashcards,
    searchNotes,

    // Monitoring
    getStats,
    checkHealth,
  };
};

export default useAI;
