/**
 * Input Validation with Zod
 * Validates and sanitizes AI inputs
 */

import { z } from 'zod';
import aiConfig from '../../config/ai.js';

// Chat message schema
export const chatMessageSchema = z.object({
  message: z.string().min(1).max(aiConfig.security.maxInputLength),
  conversationId: z.string().uuid().optional(),
  context: z.record(z.any()).optional(),
  userId: z.string().optional(),
});

// RAG query schema
export const ragQuerySchema = z.object({
  query: z.string().min(1).max(aiConfig.security.maxInputLength),
  filters: z.record(z.any()).optional(),
  topK: z.number().int().min(1).max(20).default(5),
  collectionKey: z.string().optional(),
});

// Document ingestion schema
export const documentSchema = z.object({
  content: z.union([z.string(), z.array(z.string())]),
  type: z.enum(['roadmap', 'flashcard', 'note', 'knowledge']),
  metadata: z.record(z.any()).optional(),
});

// Embedding request schema
export const embeddingSchema = z.object({
  texts: z.array(z.string().min(1).max(aiConfig.security.maxInputLength)),
});

// Agent task schema
export const agentTaskSchema = z.object({
  task: z.string().min(1).max(aiConfig.security.maxInputLength),
  tools: z.array(z.string()).optional(),
  maxIterations: z.number().int().min(1).max(10).default(5),
});

// Validator utility
export function validate(schema, data) {
  try {
    return { success: true, data: schema.parse(data) };
  } catch (error) {
    return {
      success: false,
      error: error.errors?.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
    };
  }
}
