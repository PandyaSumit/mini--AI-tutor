/**
 * Roadmap Service
 * Handles learning roadmaps and progress tracking
 */

import apiClient from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { Roadmap, RoadmapProgress, ApiResponse } from '@/types';

class RoadmapService {
  /**
   * Get all roadmaps
   */
  async getRoadmaps(): Promise<Roadmap[]> {
    try {
      const response = await apiClient.get<ApiResponse<Roadmap[]>>(
        API_ENDPOINTS.ROADMAPS.GET_ALL
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get roadmap by ID
   */
  async getRoadmapById(id: string): Promise<Roadmap> {
    try {
      const response = await apiClient.get<ApiResponse<Roadmap>>(
        API_ENDPOINTS.ROADMAPS.GET_ONE(id)
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create new roadmap
   */
  async createRoadmap(data: Partial<Roadmap>): Promise<Roadmap> {
    try {
      const response = await apiClient.post<ApiResponse<Roadmap>>(
        API_ENDPOINTS.ROADMAPS.CREATE,
        data
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update roadmap
   */
  async updateRoadmap(id: string, data: Partial<Roadmap>): Promise<Roadmap> {
    try {
      const response = await apiClient.put<ApiResponse<Roadmap>>(
        API_ENDPOINTS.ROADMAPS.UPDATE(id),
        data
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete roadmap
   */
  async deleteRoadmap(id: string): Promise<void> {
    try {
      await apiClient.delete(API_ENDPOINTS.ROADMAPS.DELETE(id));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update roadmap progress
   */
  async updateProgress(
    id: string,
    progress: Partial<RoadmapProgress>
  ): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.ROADMAPS.UPDATE_PROGRESS(id), progress);
    } catch (error) {
      throw error;
    }
  }
}

export const roadmapService = new RoadmapService();
export default roadmapService;
