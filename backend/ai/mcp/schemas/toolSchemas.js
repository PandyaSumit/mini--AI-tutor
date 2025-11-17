/**
 * Tool Input/Output Schemas using Zod
 * Provides type-safe validation for all MCP tools
 */

import { z } from 'zod';

// ============================================
// User Tools
// ============================================

export const getUserProfileSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
});

export const updateUserProfileSchema = z.object({
  userId: z.string().uuid(),
  updates: z.object({
    name: z.string().min(1).max(100).optional(),
    learningGoals: z.array(z.string()).optional(),
    preferredLanguage: z.string().optional(),
    timezone: z.string().optional(),
  }),
});

// ============================================
// Course Tools
// ============================================

export const getCourseSchema = z.object({
  courseId: z.string().uuid(),
});

export const listCoursesSchema = z.object({
  filters: z.object({
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    topic: z.string().optional(),
    published: z.boolean().optional(),
  }).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const enrollInCourseSchema = z.object({
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
});

export const updateCourseProgressSchema = z.object({
  enrollmentId: z.string().uuid(),
  moduleId: z.string().uuid(),
  progress: z.number().min(0).max(100),
  completed: z.boolean().optional(),
});

// ============================================
// Analytics Tools
// ============================================

export const getLearningAnalyticsSchema = z.object({
  userId: z.string().uuid(),
  timeRange: z.enum(['week', 'month', 'year', 'all']).default('month'),
  metrics: z.array(z.enum([
    'time_spent',
    'courses_completed',
    'quiz_scores',
    'study_streak',
    'topics_mastered',
  ])).optional(),
});

export const getCourseAnalyticsSchema = z.object({
  courseId: z.string().uuid(),
  metrics: z.array(z.enum([
    'enrollments',
    'completion_rate',
    'average_score',
    'time_to_complete',
    'user_satisfaction',
  ])).default(['enrollments', 'completion_rate']),
});

// ============================================
// Content Tools
// ============================================

export const searchKnowledgeBaseSchema = z.object({
  query: z.string().min(1).max(500),
  collection: z.enum(['knowledge', 'courses', 'roadmaps', 'flashcards']).default('knowledge'),
  topK: z.number().int().min(1).max(20).default(5),
  filters: z.object({
    difficulty: z.string().optional(),
    topic: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
});

export const generateFlashcardsSchema = z.object({
  conversationId: z.string().uuid(),
  count: z.number().int().min(1).max(50).default(10),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
});

export const generateQuizSchema = z.object({
  topic: z.string().min(1).max(200),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  questionCount: z.number().int().min(1).max(20).default(5),
  questionTypes: z.array(z.enum(['multiple_choice', 'true_false', 'short_answer'])).optional(),
});

// ============================================
// Session Tools
// ============================================

export const createVoiceSessionSchema = z.object({
  userId: z.string().uuid(),
  lessonId: z.string().uuid().optional(),
  settings: z.object({
    sttProvider: z.enum(['browser', 'huggingface', 'openai']).default('browser'),
    ttsProvider: z.enum(['browser', 'elevenlabs']).default('browser'),
    language: z.string().default('en-US'),
  }).optional(),
});

export const updateVoiceSessionSchema = z.object({
  sessionId: z.string().uuid(),
  action: z.enum(['start', 'pause', 'resume', 'end']),
  data: z.any().optional(),
});

// ============================================
// Moderation Tools
// ============================================

export const moderateContentSchema = z.object({
  content: z.string().min(1).max(10000),
  contentType: z.enum(['message', 'course', 'comment', 'post']),
  checkFor: z.array(z.enum([
    'hate_speech',
    'violence',
    'sexual_content',
    'spam',
    'personal_info',
  ])).optional(),
});

// ============================================
// Notification Tools
// ============================================

export const sendNotificationSchema = z.object({
  userId: z.string().uuid(),
  channel: z.enum(['email', 'push', 'in_app']),
  template: z.string(),
  data: z.record(z.any()),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
});

// ============================================
// Cache Tools
// ============================================

export const getCacheStatsSchema = z.object({
  scope: z.enum(['all', 'embeddings', 'vector', 'responses']).default('all'),
});

export const clearCacheSchema = z.object({
  scope: z.enum(['all', 'embeddings', 'vector', 'responses']),
  pattern: z.string().optional(),
});
