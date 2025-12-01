/**
 * Central export file for all TypeScript types
 */

// User types
export type { User, UserProfile, UserPreferences, UserStats } from './user';

// Auth types
export type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  AuthState,
  Session,
} from './auth';

// Chat types
export type {
  Message,
  MessageRole,
  ConversationTopic,
  Conversation,
  ChatState,
  Source,
  ThinkingProcess,
  ThinkingStep,
  ModeDetection,
  MessageMetadata,
  CourseRecommendations,
} from './chat';

// Course types
export type {
  Course,
  Lesson,
  LessonResource,
  Quiz,
  QuizQuestion,
  CourseEnrollment,
  CourseRole,
} from './course';

// Roadmap types
export type {
  Roadmap,
  Milestone,
  Task,
  TaskResource,
  RoadmapProgress,
} from './roadmap';

// Flashcard types
export type {
  Flashcard,
  FlashcardDeck,
  FlashcardStudySession,
  FlashcardProgress,
} from './flashcard';

// API types
export type {
  ApiResponse,
  ApiError,
  PaginatedResponse,
  AIResponse,
  StreamingResponse,
} from './api';

// Common types
export type {
  Theme,
  Status,
  LoadingState,
  SelectOption,
  NavItem,
  ToastMessage,
  DashboardStats,
} from './common';
