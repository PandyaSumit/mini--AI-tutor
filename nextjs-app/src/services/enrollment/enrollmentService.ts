/**
 * Enrollment Service
 * Handles course enrollments and progress tracking
 */

import apiClient from '@/lib/api/client';
import type { ApiResponse } from '@/types';

export interface Enrollment {
  _id: string;
  user: string;
  course: string;
  status: 'active' | 'completed' | 'dropped';
  progress: {
    completedLessons: Array<{ lesson: string; completedAt: Date }>;
    currentLesson?: string;
    completionPercentage: number;
    totalTimeSpent: number;
  };
  enrolledAt: Date;
  lastAccessedAt: Date;
}

class EnrollmentService {
  /**
   * Get user's enrollment for a specific course
   */
  async getEnrollment(courseId: string): Promise<Enrollment> {
    try {
      const response = await apiClient.get<ApiResponse<Enrollment>>(
        `/enrollments/${courseId}`
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all enrollments for current user
   */
  async getAllEnrollments(): Promise<Enrollment[]> {
    try {
      const response = await apiClient.get<ApiResponse<Enrollment[]>>('/enrollments');
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update current lesson in enrollment
   */
  async updateCurrentLesson(courseId: string, lessonId: string): Promise<Enrollment> {
    try {
      const response = await apiClient.put<ApiResponse<Enrollment>>(
        `/enrollments/${courseId}/current-lesson`,
        { lessonId }
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mark a lesson as completed
   */
  async completeLesson(courseId: string, lessonId: string): Promise<Enrollment> {
    try {
      const response = await apiClient.post<ApiResponse<Enrollment>>(
        `/enrollments/${courseId}/lessons/${lessonId}/complete`
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update enrollment status
   */
  async updateStatus(
    courseId: string,
    status: 'active' | 'completed' | 'dropped'
  ): Promise<Enrollment> {
    try {
      const response = await apiClient.put<ApiResponse<Enrollment>>(
        `/enrollments/${courseId}/status`,
        { status }
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get enrollment statistics
   */
  async getStats(courseId: string): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        `/enrollments/${courseId}/stats`
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }
}

export const enrollmentService = new EnrollmentService();
export default enrollmentService;
