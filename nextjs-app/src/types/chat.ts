/**
 * Chat-related TypeScript types
 */

export type MessageRole = 'user' | 'assistant' | 'system';
export type ConversationTopic = 'programming' | 'mathematics' | 'languages' | 'general';

export interface Message {
  _id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  sources?: Source[];
  confidence?: number;
  model?: string;
  thinking?: ThinkingProcess;
  isRAG?: boolean;
  modeDetection?: ModeDetection;
  metadata?: MessageMetadata;
  isError?: boolean;
}

export interface Source {
  content: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface ThinkingProcess {
  steps: ThinkingStep[];
  totalTime?: number;
}

export interface ThinkingStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  timestamp: number;
}

export interface ModeDetection {
  actualMode: 'rag' | 'general';
  confidence: number;
  reason?: string;
}

export interface MessageMetadata {
  type?: 'course_recommendation' | 'flashcard_generated' | 'roadmap_suggested';
  recommendations?: CourseRecommendations;
  responseTime?: number;
}

export interface CourseRecommendations {
  courses?: Array<{
    id: string;
    title: string;
    description: string;
    url: string;
  }>;
  lessons?: Array<{
    id: string;
    title: string;
    courseTitle: string;
    duration: number;
    url: string;
  }>;
}

export interface Conversation {
  _id: string;
  userId: string;
  title: string;
  topic: ConversationTopic;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatState {
  messages: Message[];
  loading: boolean;
  inputMessage: string;
  selectedTopic: ConversationTopic;
  conversationId?: string;
  conversationTitle?: string;
}
