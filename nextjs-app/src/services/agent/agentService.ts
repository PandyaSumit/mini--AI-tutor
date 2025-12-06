/**
 * Agent Service
 * Handles multi-agent system API calls
 */

import apiClient from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export interface TutorAskRequest {
  course_id?: string;
  topic_id?: string;
  query: string;
  conversation_id?: string;
}

export interface TutorAskResponse {
  answer: string;
  sources?: any[];
  cached: boolean;
  conversation_id: string;
  cost: number;
  routing_decision?: string;
}

export interface UserBudgetResponse {
  cost_limit: number;
  current_cost: number;
  percent_used: number;
  within_budget: boolean;
  needs_throttle: boolean;
  messages_sent_today: number;
  messages_limit: number;
}

export interface CostAnalyticsResponse {
  period: string;
  total_cost: number;
  breakdown: any[];
  cache_hit_rate?: number;
}

export interface CoursePreparationRequest {
  course_id: string;
  mode?: 'full' | 'update' | 'incremental';
}

export interface ProgressUpdateRequest {
  enrollment_id: string;
  module_id?: string;
  topic_id?: string;
}

export interface CompleteTopicRequest {
  enrollment_id: string;
  topic_id: string;
}

class AgentService {
  /**
   * Ask AI tutor a question
   */
  async askTutor(data: TutorAskRequest): Promise<TutorAskResponse> {
    try {
      const response = await apiClient.post<TutorAskResponse>(
        API_ENDPOINTS.AGENTS.TUTOR_ASK,
        data
      );
      return response.data;
    } catch (error: any) {
      // Handle quota exceeded error
      if (error.response?.status === 400 && error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  }

  /**
   * Get user's budget status
   */
  async getUserBudget(userId: string): Promise<UserBudgetResponse> {
    try {
      const response = await apiClient.get<UserBudgetResponse>(
        API_ENDPOINTS.AGENTS.USER_BUDGET(userId)
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get cost analytics (admin only)
   */
  async getCostAnalytics(params?: {
    period?: string;
    group_by?: string;
  }): Promise<CostAnalyticsResponse> {
    try {
      const queryParams = new URLSearchParams(params as any).toString();
      const url = `${API_ENDPOINTS.AGENTS.COST_ANALYTICS}${
        queryParams ? `?${queryParams}` : ''
      }`;

      const response = await apiClient.get<CostAnalyticsResponse>(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Prepare course for AI teaching (instructor/admin only)
   */
  async prepareCourse(
    data: CoursePreparationRequest
  ): Promise<{ success: boolean; cost: number; collection_id?: string }> {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.AGENTS.COURSE_PREPARE,
        data
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update student progress
   */
  async updateProgress(
    data: ProgressUpdateRequest
  ): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.AGENTS.PROGRESS_UPDATE,
        data
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mark topic as completed
   */
  async completeTopic(data: CompleteTopicRequest): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.AGENTS.PROGRESS_COMPLETE_TOPIC,
        data
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all agent statistics (admin only)
   */
  async getAgentStats(): Promise<any> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.AGENTS.AGENT_STATS);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export const agentService = new AgentService();
export default agentService;
