/**
 * Dashboard Service
 * Handles dashboard stats and recent activity
 */

import apiClient from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { DashboardStats, ApiResponse } from '@/types';

class DashboardService {
  /**
   * Get dashboard statistics
   */
  async getStats(): Promise<DashboardStats> {
    try {
      const response = await apiClient.get<ApiResponse<DashboardStats>>(
        API_ENDPOINTS.DASHBOARD.GET_STATS
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(): Promise<any[]> {
    try {
      const response = await apiClient.get<ApiResponse<any[]>>(
        API_ENDPOINTS.DASHBOARD.GET_RECENT_ACTIVITY
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
