/**
 * Study Material Service
 * Handles generation of study materials like flashcards
 */

import apiClient from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { Flashcard, ApiResponse } from '@/types';

interface GenerateFlashcardsData {
  conversationId?: string;
  count?: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'intermediate';
}

class StudyMaterialService {
  /**
   * Generate flashcards from conversation
   */
  async generateFlashcards(
    data: GenerateFlashcardsData
  ): Promise<Flashcard[]> {
    try {
      const response = await apiClient.post<ApiResponse<Flashcard[]>>(
        API_ENDPOINTS.STUDY_MATERIALS.GENERATE_FLASHCARDS,
        data
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }
}

export const studyMaterialService = new StudyMaterialService();
export default studyMaterialService;
