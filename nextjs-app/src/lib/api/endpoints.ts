/**
 * API endpoint constants
 */

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
  },

  // Chat
  CHAT: {
    SEND_MESSAGE: '/chat/send',
    GET_CONVERSATIONS: '/chat/conversations',
    GET_CONVERSATION: (id: string) => `/chat/conversations/${id}`,
    DELETE_CONVERSATION: (id: string) => `/chat/conversations/${id}`,
  },

  // AI
  AI: {
    CHAT: '/ai/chat',
    STREAM: '/ai/stream',
    SEMANTIC_SEARCH: '/ai/semantic-search',
  },

  // Courses
  COURSES: {
    GET_ALL: '/courses',
    GET_ONE: (id: string) => `/courses/${id}`,
    CREATE: '/courses',
    UPDATE: (id: string) => `/courses/${id}`,
    DELETE: (id: string) => `/courses/${id}`,
    ENROLL: (id: string) => `/courses/${id}/enroll`,
    GET_ENROLLED: '/courses/enrolled',
  },

  // Roadmaps
  ROADMAPS: {
    GET_ALL: '/roadmaps',
    GET_ONE: (id: string) => `/roadmaps/${id}`,
    CREATE: '/roadmaps',
    UPDATE: (id: string) => `/roadmaps/${id}`,
    DELETE: (id: string) => `/roadmaps/${id}`,
    UPDATE_PROGRESS: (id: string) => `/roadmaps/${id}/progress`,
  },

  // Flashcards
  FLASHCARDS: {
    GET_ALL: '/flashcards',
    GET_BY_DECK: (deck: string) => `/flashcards/deck/${deck}`,
    CREATE: '/flashcards',
    GENERATE: '/flashcards/generate',
    UPDATE: (id: string) => `/flashcards/${id}`,
    DELETE: (id: string) => `/flashcards/${id}`,
  },

  // Study Materials
  STUDY_MATERIALS: {
    GENERATE_FLASHCARDS: '/study-materials/flashcards/generate',
  },

  // User
  USER: {
    GET_PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
    GET_STATS: '/user/stats',
  },

  // Dashboard
  DASHBOARD: {
    GET_STATS: '/dashboard/stats',
    GET_RECENT_ACTIVITY: '/dashboard/activity',
  },
};
