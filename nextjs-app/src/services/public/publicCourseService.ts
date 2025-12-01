/**
 * Public Course Service
 * For browsing courses without authentication
 */

import axios from 'axios';
import type { ApiResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Create axios instance without auth interceptors
const publicClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface PublicCourse {
  _id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  thumbnail?: string;
  createdBy: {
    _id: string;
    name: string;
    instructorVerification?: {
      portfolio?: {
        professionalTitle?: string;
      };
    };
  };
  pricing: {
    model: string;
    amount: number;
  };
  statistics: {
    totalModules: number;
    totalLessons: number;
    enrollmentCount: number;
  };
  metadata: {
    learningOutcomes: string[];
    prerequisites: string[];
  };
  createdAt: Date;
}

interface PublicCourseDetail extends PublicCourse {
  modules: Array<{
    _id: string;
    title: string;
    description: string;
    order: number;
    lessons: Array<{
      _id: string;
      title: string;
      description: string;
      duration: number;
      order: number;
      type: string;
      isPreview: boolean;
    }>;
  }>;
  statistics: {
    totalModules: number;
    totalLessons: number;
    enrollmentCount: number;
    averageRating: number;
    reviewCount: number;
    totalDuration: number;
  };
}

interface PlatformStats {
  totalCourses: number;
  totalEnrollments: number;
  totalInstructors: number;
}

class PublicCourseService {
  /**
   * Get all public courses with filters
   */
  async getCourses(params?: {
    page?: number;
    limit?: number;
    category?: string;
    difficulty?: string;
    search?: string;
    sort?: string;
  }): Promise<{
    courses: PublicCourse[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasMore: boolean;
    };
  }> {
    try {
      const response = await publicClient.get<ApiResponse<any>>('/public/courses', {
        params,
      });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get course details by ID
   */
  async getCourseById(courseId: string): Promise<PublicCourseDetail> {
    try {
      const response = await publicClient.get<ApiResponse<{ course: PublicCourseDetail }>>(
        `/public/courses/${courseId}`
      );
      return response.data.data.course;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get featured courses for homepage
   */
  async getFeaturedCourses(): Promise<PublicCourse[]> {
    try {
      const response = await publicClient.get<ApiResponse<{ courses: PublicCourse[] }>>(
        '/public/courses/featured'
      );
      return response.data.data.courses;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get platform statistics
   */
  async getPlatformStats(): Promise<PlatformStats> {
    try {
      const response = await publicClient.get<ApiResponse<PlatformStats>>('/public/stats');
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all available categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const response = await publicClient.get<ApiResponse<{ categories: string[] }>>(
        '/public/categories'
      );
      return response.data.data.categories;
    } catch (error) {
      throw error;
    }
  }
}

export const publicCourseService = new PublicCourseService();
export default publicCourseService;
