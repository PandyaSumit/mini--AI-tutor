/**
 * User Service
 * Handles user profile and stats
 */

import apiClient from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { UserProfile, UserStats, ApiResponse } from '@/types';

class UserService {
  /**
   * Get user profile
   */
  async getProfile(): Promise<UserProfile> {
    try {
      const response = await apiClient.get<ApiResponse<UserProfile>>(
        API_ENDPOINTS.USER.GET_PROFILE
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await apiClient.put<ApiResponse<UserProfile>>(
        API_ENDPOINTS.USER.UPDATE_PROFILE,
        data
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user stats
   */
  async getStats(): Promise<UserStats> {
    try {
      const response = await apiClient.get<ApiResponse<UserStats>>(
        API_ENDPOINTS.USER.GET_STATS
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }
}

export const userService = new UserService();
export default userService;
