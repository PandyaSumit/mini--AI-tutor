/**
 * AI Service
 * Handles AI chat interactions and semantic search
 */

import apiClient from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { AIResponse, ApiResponse, Message } from '@/types';

interface ChatOptions {
  conversationHistory?: Array<{
    role: string;
    content: string;
    isRAG?: boolean;
    sources?: any[];
  }>;
  mode?: 'general' | 'rag' | 'auto';
  context?: any;
}

interface SemanticSearchOptions {
  topK?: number;
  threshold?: number;
}

class AIService {
  /**
   * Send chat message to AI
   */
  async chat(
    message: string,
    options: ChatOptions = {}
  ): Promise<AIResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AIResponse>>(
        API_ENDPOINTS.AI.CHAT,
        {
          message,
          conversationHistory: options.conversationHistory || [],
          mode: options.mode || 'auto',
          context: options.context,
        }
      );

      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Perform semantic search
   */
  async semanticSearch(
    query: string,
    options: SemanticSearchOptions = {}
  ): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse>(
        API_ENDPOINTS.AI.SEMANTIC_SEARCH,
        {
          query,
          topK: options.topK || 5,
          threshold: options.threshold || 0.7,
        }
      );

      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate AI suggestions
   */
  async generateSuggestions(topic: string): Promise<string[]> {
    try {
      const response = await this.chat(
        `Generate 5 interesting questions or topics to explore about ${topic}`,
        { mode: 'general' }
      );

      // Parse response into array of suggestions
      const suggestions = response.response
        ?.split('\n')
        .filter((s) => s.trim())
        .slice(0, 5) || [];

      return suggestions;
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      return [];
    }
  }
}

export const aiService = new AIService();
export default aiService;
