/**
 * Voice Service
 * Handles voice session creation and management
 * Note: Full WebSocket implementation requires additional setup
 */

import apiClient from '@/lib/api/client';
import type { ApiResponse } from '@/types';

export interface VoiceSession {
  _id: string;
  user: string;
  lesson?: string;
  enrollment?: string;
  title?: string;
  status: 'active' | 'completed' | 'paused';
  conversationId?: string;
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface CreateSessionData {
  lesson?: string;
  enrollment?: string;
  title?: string;
  metadata?: Record<string, any>;
}

class VoiceService {
  /**
   * Create a new voice session
   */
  async createSession(data: CreateSessionData): Promise<VoiceSession> {
    try {
      const response = await apiClient.post<ApiResponse<VoiceSession>>(
        '/voice/sessions',
        data
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a specific voice session
   */
  async getSession(sessionId: string): Promise<VoiceSession> {
    try {
      const response = await apiClient.get<ApiResponse<VoiceSession>>(
        `/voice/sessions/${sessionId}`
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all voice sessions for current user
   */
  async getAllSessions(filters?: { status?: string; limit?: number }): Promise<VoiceSession[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get<ApiResponse<VoiceSession[]>>(
        `/voice/sessions?${params.toString()}`
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update session status
   */
  async updateSessionStatus(
    sessionId: string,
    status: 'active' | 'completed' | 'paused'
  ): Promise<VoiceSession> {
    try {
      const response = await apiClient.put<ApiResponse<VoiceSession>>(
        `/voice/sessions/${sessionId}/status`,
        { status }
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * End a voice session
   */
  async endSession(sessionId: string): Promise<VoiceSession> {
    try {
      const response = await apiClient.post<ApiResponse<VoiceSession>>(
        `/voice/sessions/${sessionId}/end`
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a voice session
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      await apiClient.delete(`/voice/sessions/${sessionId}`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(sessionId: string): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        `/voice/sessions/${sessionId}/stats`
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }
}

export const voiceService = new VoiceService();
export default voiceService;
