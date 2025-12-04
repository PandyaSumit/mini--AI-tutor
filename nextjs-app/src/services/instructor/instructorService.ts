/**
 * Instructor Service
 * Handles all instructor-specific API calls
 */

import apiClient from '@/lib/api/client';

export interface VerificationData {
  professionalTitle: string;
  yearsOfExperience: number;
  bio: string;
  expertiseAreas: Array<{ subject: string; category: string }>;
  certifications: Array<{ name: string; issuer: string; url?: string; issuedDate?: string }>;
  socialLinks: {
    linkedin?: string;
    github?: string;
    website?: string;
  };
}

export interface VerificationStatus {
  status: 'not_applied' | 'pending' | 'approved' | 'rejected';
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  role: string;
  canCreateCourses: boolean;
}

export interface DashboardStats {
  overview: {
    totalStudents: number;
    totalCourses: number;
    publishedCourses: number;
    totalEnrollments: number;
    totalRevenue: number;
    totalEarnings: number;
    availableBalance: number;
    pendingBalance: number;
  };
  topCourses: Array<{
    id: string;
    title: string;
    enrollments: number;
    activeStudents: number;
    revenue: number;
    rating: number;
    reviews: number;
    avgProgress: number;
  }>;
  allCourses: Array<{
    id: string;
    title: string;
    enrollments: number;
    activeStudents: number;
    revenue: number;
    rating: number;
    reviews: number;
    avgProgress: number;
  }>;
}

export interface Student {
  studentId: string;
  studentName: string;
  studentEmail: string;
  totalCourses: number;
  courses: Array<{
    courseId: string;
    courseTitle: string;
    progress: number;
    status: string;
    enrolledAt: string;
    lastActivityAt?: string;
  }>;
  avgProgress: number;
  enrolledAt: string;
}

export interface EarningsData {
  summary: {
    totalEarned: number;
    availableBalance: number;
    pendingBalance: number;
    totalWithdrawn: number;
    nextPayoutDate?: string;
    lastPayoutDate?: string;
  };
  payoutMethod: string;
  revenueByCourse: Array<{
    courseId: string;
    courseTitle: string;
    totalRevenue: number;
    instructorRevenue: number;
  }>;
}

export interface PayoutResponse {
  success: boolean;
  message: string;
  data?: {
    amount: number;
    availableBalance: number;
    pendingBalance: number;
  };
}

class InstructorService {
  /**
   * Submit instructor verification application
   * Includes file uploads for ID and certifications
   */
  async submitVerification(formData: FormData): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post('/instructor/verification/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to submit verification');
    }
  }

  /**
   * Get current verification status
   */
  async getVerificationStatus(): Promise<VerificationStatus> {
    try {
      const response = await apiClient.get('/instructor/verification/status');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get verification status');
    }
  }

  /**
   * Get instructor dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await apiClient.get('/instructor/dashboard/stats');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get dashboard stats');
    }
  }

  /**
   * Get list of students enrolled in instructor's courses
   */
  async getStudents(): Promise<Student[]> {
    try {
      const response = await apiClient.get('/instructor/students');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get students');
    }
  }

  /**
   * Get instructor earnings data
   */
  async getEarnings(): Promise<EarningsData> {
    try {
      const response = await apiClient.get('/instructor/earnings');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get earnings');
    }
  }

  /**
   * Request payout of available balance
   */
  async requestPayout(amount: number): Promise<PayoutResponse> {
    try {
      const response = await apiClient.post('/instructor/earnings/payout-request', { amount });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to request payout');
    }
  }
}

export const instructorService = new InstructorService();
