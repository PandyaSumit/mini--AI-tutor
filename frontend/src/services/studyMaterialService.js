import api from './api';

export const studyMaterialService = {
  // Flashcards
  generateFlashcards: async (data) => {
    const response = await api.post('/study/flashcards/generate', data);
    return response.data;
  },

  getDueFlashcards: async (deck = null, limit = 20) => {
    const params = { limit };
    if (deck) params.deck = deck;
    const response = await api.get('/study/flashcards/due', { params });
    return response.data;
  },

  reviewFlashcard: async (id, quality, responseTime) => {
    const response = await api.post(`/study/flashcards/${id}/review`, {
      quality,
      responseTime
    });
    return response.data;
  },

  getDecks: async () => {
    const response = await api.get('/study/flashcards/decks');
    return response.data;
  },

  exportFlashcards: async (deck = null, format = 'csv') => {
    const params = { format };
    if (deck) params.deck = deck;
    const response = await api.get('/study/flashcards/export', {
      params,
      responseType: format === 'csv' ? 'blob' : 'json'
    });
    return response.data;
  },

  // Quizzes
  generateQuiz: async (data) => {
    const response = await api.post('/study/quizzes/generate', data);
    return response.data;
  },

  getQuizzes: async (topic = null) => {
    const params = topic ? { topic } : {};
    const response = await api.get('/study/quizzes', { params });
    return response.data;
  },

  getQuiz: async (id) => {
    const response = await api.get(`/study/quizzes/${id}`);
    return response.data;
  },

  submitQuizAttempt: async (id, answers) => {
    const response = await api.post(`/study/quizzes/${id}/submit`, { answers });
    return response.data;
  },

  exportQuiz: async (id) => {
    const response = await api.get(`/study/quizzes/${id}/export`, {
      responseType: 'blob'
    });
    return response.data;
  }
};
