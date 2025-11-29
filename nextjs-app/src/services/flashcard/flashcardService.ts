/**
 * Flashcard Service
 * Handles flashcard CRUD and generation
 */

import apiClient from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { Flashcard, FlashcardDeck, ApiResponse } from '@/types';

class FlashcardService {
  /**
   * Get all flashcards
   */
  async getFlashcards(): Promise<Flashcard[]> {
    try {
      const response = await apiClient.get<ApiResponse<Flashcard[]>>(
        API_ENDPOINTS.FLASHCARDS.GET_ALL
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get flashcards by deck
   */
  async getFlashcardsByDeck(deckName: string): Promise<FlashcardDeck> {
    try {
      const response = await apiClient.get<ApiResponse<FlashcardDeck>>(
        API_ENDPOINTS.FLASHCARDS.GET_BY_DECK(deckName)
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create flashcard
   */
  async createFlashcard(data: Partial<Flashcard>): Promise<Flashcard> {
    try {
      const response = await apiClient.post<ApiResponse<Flashcard>>(
        API_ENDPOINTS.FLASHCARDS.CREATE,
        data
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update flashcard
   */
  async updateFlashcard(
    id: string,
    data: Partial<Flashcard>
  ): Promise<Flashcard> {
    try {
      const response = await apiClient.put<ApiResponse<Flashcard>>(
        API_ENDPOINTS.FLASHCARDS.UPDATE(id),
        data
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete flashcard
   */
  async deleteFlashcard(id: string): Promise<void> {
    try {
      await apiClient.delete(API_ENDPOINTS.FLASHCARDS.DELETE(id));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate flashcards from content
   */
  async generateFlashcards(data: {
    content?: string;
    conversationId?: string;
    count?: number;
    difficulty?: string;
  }): Promise<Flashcard[]> {
    try {
      const response = await apiClient.post<ApiResponse<Flashcard[]>>(
        API_ENDPOINTS.FLASHCARDS.GENERATE,
        data
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }
}

export const flashcardService = new FlashcardService();
export default flashcardService;
