/**
 * Course Service
 * Handles course management and enrollment
 */

import apiClient from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { Course, CourseEnrollment, ApiResponse } from '@/types';

class CourseService {
  /**
   * Get all courses
   */
  async getCourses(): Promise<Course[]> {
    try {
      const response = await apiClient.get<ApiResponse<Course[]>>(
        API_ENDPOINTS.COURSES.GET_ALL
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get course by ID
   */
  async getCourseById(id: string): Promise<Course> {
    try {
      const response = await apiClient.get<ApiResponse<Course>>(
        API_ENDPOINTS.COURSES.GET_ONE(id)
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create new course
   */
  async createCourse(data: Partial<Course>): Promise<Course> {
    try {
      const response = await apiClient.post<ApiResponse<Course>>(
        API_ENDPOINTS.COURSES.CREATE,
        data
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update course
   */
  async updateCourse(id: string, data: Partial<Course>): Promise<Course> {
    try {
      const response = await apiClient.put<ApiResponse<Course>>(
        API_ENDPOINTS.COURSES.UPDATE(id),
        data
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete course
   */
  async deleteCourse(id: string): Promise<void> {
    try {
      await apiClient.delete(API_ENDPOINTS.COURSES.DELETE(id));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Enroll in course
   */
  async enrollInCourse(id: string): Promise<CourseEnrollment> {
    try {
      const response = await apiClient.post<ApiResponse<CourseEnrollment>>(
        API_ENDPOINTS.COURSES.ENROLL(id)
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get enrolled courses
   */
  async getEnrolledCourses(): Promise<Course[]> {
    try {
      const response = await apiClient.get<ApiResponse<Course[]>>(
        API_ENDPOINTS.COURSES.GET_ENROLLED
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Alias for getCourseById (used by CourseDetail page)
   */
  async getCourse(id: string): Promise<Course> {
    return this.getCourseById(id);
  }

  /**
   * Alias for enrollInCourse (used by CourseDetail page)
   */
  async enroll(id: string): Promise<CourseEnrollment> {
    return this.enrollInCourse(id);
  }

  /**
   * Check for similar courses
   */
  async checkSimilar(data: { prompt: string; level: string }): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        '/courses/check-similar',
        data
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate course preview
   */
  async generatePreview(data: {
    prompt: string;
    level: string;
    numModules: number;
  }): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        '/courses/generate/preview',
        data
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate full course
   */
  async generate(data: {
    prompt: string;
    level: string;
    numModules: number;
    lessonsPerModule: number;
  }): Promise<Course> {
    try {
      const response = await apiClient.post<ApiResponse<Course>>(
        '/courses/generate',
        data
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Publish a course
   */
  async publishCourse(id: string): Promise<Course> {
    try {
      const response = await apiClient.post<ApiResponse<Course>>(
        `/courses/${id}/publish`
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }
}

export const courseService = new CourseService();
export default courseService;
