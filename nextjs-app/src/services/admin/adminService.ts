/**
 * Admin Service
 * Handles admin-only operations and platform management
 */

import apiClient from '@/lib/api/client';
import type { ApiResponse } from '@/types';

interface DashboardStats {
  users: {
    total: number;
    byRole: {
      learner: number;
      verified_instructor: number;
      platform_author: number;
      admin: number;
    };
    newThisMonth: number;
  };
  courses: {
    total: number;
    byType: {
      personal: number;
      marketplace: number;
      flagship: number;
    };
    byVisibility: {
      private: number;
      unlisted: number;
      public: number;
    };
  };
  pendingReviews: {
    instructorApplications: number;
    courseQualityReviews: number;
  };
  aiUsage: {
    totalMessagesThisMonth: number;
    totalVoiceMinutesThisMonth: number;
    totalCoursesGenerated: number;
    estimatedCost: number;
  };
  revenue: {
    totalRevenue: number;
    platformShare: number;
    instructorShare: number;
    thisMonth: number;
  };
}

interface AIUsageAnalytics {
  totalUsers: number;
  totalUsage: {
    chatMessages: number;
    voiceMinutes: number;
    courseGenerations: number;
    estimatedCost: number;
  };
  byRole: {
    learner: { users: number; chatMessages: number; voiceMinutes: number; cost: number };
    verified_instructor: { users: number; chatMessages: number; voiceMinutes: number; cost: number };
    platform_author: { users: number; chatMessages: number; voiceMinutes: number; cost: number };
  };
  topUsers: Array<{
    userId: string;
    name: string;
    email: string;
    totalMessages: number;
    totalMinutes: number;
    totalCost: number;
  }>;
  dailyUsage: Array<{
    date: string;
    messages: number;
    minutes: number;
    cost: number;
  }>;
}

interface RevenueAnalytics {
  totalRevenue: number;
  platformRevenue: number;
  instructorRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  byMonth: Array<{
    month: string;
    revenue: number;
    platformShare: number;
    instructorShare: number;
    transactions: number;
  }>;
  topInstructors: Array<{
    userId: string;
    name: string;
    email: string;
    totalRevenue: number;
    totalSales: number;
    coursesPublished: number;
  }>;
  topCourses: Array<{
    courseId: string;
    title: string;
    instructorName: string;
    totalRevenue: number;
    totalSales: number;
    averageRating: number;
  }>;
}

interface InstructorApplication {
  _id: string;
  name: string;
  email: string;
  instructorVerification: {
    status: string;
    appliedAt: Date;
    kycStatus: string;
    age: number;
    expertiseAreas: Array<{
      subject: string;
      category: string;
      verificationMethod: string;
      verificationScore?: number;
    }>;
    portfolio: {
      bio: string;
      professionalTitle: string;
      yearsOfExperience: number;
      certifications: Array<{
        name: string;
        issuer: string;
        url?: string;
      }>;
      socialLinks: {
        linkedin?: string;
        github?: string;
        website?: string;
      };
    };
  };
}

interface CourseReview {
  _id: string;
  title: string;
  description: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  courseType: string;
  visibility: string;
  statistics: {
    totalModules: number;
    totalLessons: number;
    totalEnrollments: number;
  };
  metadata: {
    learningOutcomes: string[];
    prerequisites: string[];
  };
  marketplace: {
    hasPassedQualityReview: boolean;
    qualityIssues: string[];
  };
  createdAt: Date;
}

interface UserDetail {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  lastLogin: Date;
  instructorVerification?: any;
  aiUsage?: any;
  earnings?: any;
  courses: any[];
  enrollments: any[];
  aiUsageSummary: {
    totalMessages: number;
    totalVoiceMinutes: number;
    estimatedCost: number;
  };
}

interface AdminAction {
  _id: string;
  adminEmail: string;
  actionType: string;
  targetResource: string;
  requestMethod: string;
  requestPath: string;
  ipAddress: string;
  success: boolean;
  timestamp: Date;
}

class AdminService {
  /**
   * Get admin dashboard statistics
   */
  async getDashboard(): Promise<DashboardStats> {
    try {
      const response = await apiClient.get<ApiResponse<DashboardStats>>('/admin/dashboard');
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get AI usage analytics
   */
  async getAIUsageAnalytics(params?: { startDate?: string; endDate?: string }): Promise<AIUsageAnalytics> {
    try {
      const response = await apiClient.get<ApiResponse<AIUsageAnalytics>>('/admin/analytics/ai-usage', {
        params,
      });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(params?: { startDate?: string; endDate?: string }): Promise<RevenueAnalytics> {
    try {
      const response = await apiClient.get<ApiResponse<RevenueAnalytics>>('/admin/analytics/revenue', {
        params,
      });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get pending instructor applications
   */
  async getPendingInstructors(): Promise<InstructorApplication[]> {
    try {
      const response = await apiClient.get<ApiResponse<{ applications: InstructorApplication[] }>>(
        '/admin/instructors/pending'
      );
      return response.data.data.applications;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Approve instructor application
   */
  async approveInstructor(userId: string): Promise<void> {
    try {
      await apiClient.post(`/admin/instructors/${userId}/approve`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reject instructor application
   */
  async rejectInstructor(userId: string, reason: string): Promise<void> {
    try {
      await apiClient.post(`/admin/instructors/${userId}/reject`, { reason });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get courses pending quality review
   */
  async getPendingCourses(): Promise<CourseReview[]> {
    try {
      const response = await apiClient.get<ApiResponse<{ courses: CourseReview[] }>>(
        '/admin/courses/pending-review'
      );
      return response.data.data.courses;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Approve course for marketplace
   */
  async approveCourse(courseId: string): Promise<void> {
    try {
      await apiClient.post(`/admin/courses/${courseId}/approve`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reject course quality review
   */
  async rejectCourse(courseId: string, issues: string[]): Promise<void> {
    try {
      await apiClient.post(`/admin/courses/${courseId}/reject`, { issues });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get users with filters and pagination
   */
  async getUsers(params?: {
    role?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    users: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/admin/users', { params });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get detailed user information
   */
  async getUserDetail(userId: string): Promise<UserDetail> {
    try {
      const response = await apiClient.get<ApiResponse<UserDetail>>(`/admin/users/${userId}`);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get admin action logs
   */
  async getAdminLogs(params?: { limit?: number; adminId?: string }): Promise<AdminAction[]> {
    try {
      const response = await apiClient.get<ApiResponse<{ logs: AdminAction[] }>>('/admin/logs/actions', {
        params,
      });
      return response.data.data.logs;
    } catch (error) {
      throw error;
    }
  }
}

export const adminService = new AdminService();
export default adminService;
