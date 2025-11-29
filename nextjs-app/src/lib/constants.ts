/**
 * Application-wide constants
 */

export const APP_NAME = 'Mini AI Tutor';
export const APP_DESCRIPTION = 'Your AI-powered learning companion';

export const DEFAULT_TOPICS = [
  { id: 'programming', label: 'Programming' },
  { id: 'mathematics', label: 'Mathematics' },
  { id: 'languages', label: 'Languages' },
  { id: 'general', label: 'General' },
] as const;

export const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
] as const;

export const TOAST_DURATION = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 7000,
} as const;

export const LOCAL_STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  THEME: 'theme',
  SIDEBAR_COLLAPSED: 'sidebarCollapsed',
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  CHAT: '/chat',
  ROADMAPS: '/roadmaps',
  FLASHCARDS: '/flashcards',
  COURSES: '/courses',
  PROFILE: '/profile',
  CONVERSATIONS: '/conversations',
} as const;
