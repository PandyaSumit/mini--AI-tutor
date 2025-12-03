/**
 * Payment Service
 * Handles Stripe checkout integration (NEVER exposes secret keys)
 */

import apiClient from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export interface CreateCheckoutSessionResponse {
  success: boolean;
  sessionId: string;
  url: string;
}

export interface PaymentSessionStatus {
  success: boolean;
  status: string;
  metadata?: any;
}

export interface Purchase {
  id: string;
  courseId: string;
  courseTitle: string;
  courseThumbnail?: string;
  amount: number;
  purchasedAt: string;
  progress: number;
}

class PaymentService {
  /**
   * Create Stripe checkout session for course enrollment
   * SECURITY: All validation happens server-side
   */
  async createCourseCheckout(courseId: string): Promise<CreateCheckoutSessionResponse> {
    try {
      const response = await apiClient.post<CreateCheckoutSessionResponse>(
        API_ENDPOINTS.PAYMENTS.CREATE_COURSE_CHECKOUT,
        { courseId }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create checkout session');
    }
  }

  /**
   * Create Stripe checkout session for subscription upgrade
   * SECURITY: Tier and pricing validated server-side
   */
  async createSubscriptionCheckout(tier: 'basic' | 'pro'): Promise<CreateCheckoutSessionResponse> {
    try {
      const response = await apiClient.post<CreateCheckoutSessionResponse>(
        API_ENDPOINTS.PAYMENTS.CREATE_SUBSCRIPTION_CHECKOUT,
        { tier }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create subscription checkout');
    }
  }

  /**
   * Verify payment session status
   */
  async verifyPaymentSession(sessionId: string): Promise<PaymentSessionStatus> {
    try {
      const response = await apiClient.get<PaymentSessionStatus>(
        API_ENDPOINTS.PAYMENTS.VERIFY_SESSION(sessionId)
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to verify payment');
    }
  }

  /**
   * Get user's purchase history
   */
  async getMyPurchases(): Promise<Purchase[]> {
    try {
      const response = await apiClient.get<{ success: boolean; purchases: Purchase[] }>(
        API_ENDPOINTS.PAYMENTS.MY_PURCHASES
      );
      return response.data.purchases;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get purchase history');
    }
  }

  /**
   * Redirect to Stripe Checkout
   * Opens Stripe-hosted checkout page
   */
  redirectToCheckout(checkoutUrl: string) {
    window.location.href = checkoutUrl;
  }
}

export const paymentService = new PaymentService();
export default paymentService;
