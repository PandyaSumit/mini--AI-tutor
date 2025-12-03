/**
 * Stripe Configuration
 * Handles all Stripe SDK initialization and configuration
 * NEVER expose secret keys to frontend
 */

import Stripe from 'stripe';

// Initialize Stripe with secret key (BACKEND ONLY)
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

// Stripe Webhook Secret (for webhook signature verification)
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// Pricing Configuration (in cents)
export const PRICING = {
  SUBSCRIPTIONS: {
    FREE: {
      price: 0,
      priceId: null,
      name: 'Free',
      features: {
        chatMessages: 50,
        voiceMinutes: 10,
        courseGenerations: 1,
      },
    },
    BASIC: {
      price: 999, // $9.99/month
      priceId: process.env.STRIPE_BASIC_PRICE_ID,
      name: 'Basic',
      features: {
        chatMessages: 500,
        voiceMinutes: 100,
        courseGenerations: 10,
      },
    },
    PRO: {
      price: 1999, // $19.99/month
      priceId: process.env.STRIPE_PRO_PRICE_ID,
      name: 'Pro',
      features: {
        chatMessages: 2000,
        voiceMinutes: 500,
        courseGenerations: 50,
      },
    },
  },

  // Platform fees
  PLATFORM_FEE_PERCENT: 30, // 30% platform fee
  INSTRUCTOR_SHARE_PERCENT: 70, // 70% instructor share
};

// Helper function to create checkout session URL
export function getCheckoutSuccessUrl(sessionId) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/payment/success?session_id=${sessionId}`;
}

export function getCheckoutCancelUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/payment/cancelled`;
}

export default stripe;
