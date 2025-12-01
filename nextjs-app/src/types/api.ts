/**
 * API-related TypeScript types
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AIResponse {
  response?: string;
  answer?: string;
  sources?: Array<{
    content: string;
    score: number;
  }>;
  confidence?: number;
  model?: string;
  thinking?: {
    steps: Array<{
      id: string;
      title: string;
      description: string;
      status: string;
      timestamp: number;
    }>;
  };
  modeDetection?: {
    actualMode: 'rag' | 'general';
    confidence: number;
  };
}

export interface StreamingResponse {
  type: 'thinking' | 'content' | 'complete' | 'error';
  content?: string;
  thinking?: any;
  error?: string;
}
