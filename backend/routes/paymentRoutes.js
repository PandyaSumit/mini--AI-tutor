/**
 * Payment Routes
 * Handles all Stripe payment operations (BACKEND ONLY)
 * Security: All sensitive operations must be server-side
 */

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import stripe, { PRICING, getCheckoutSuccessUrl, getCheckoutCancelUrl } from '../config/stripe.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';

const router = express.Router();

/**
 * @route   POST /api/payments/create-course-checkout
 * @desc    Create Stripe checkout session for course enrollment
 * @access  Private (Student only)
 * @security Server-side validation of:
 *           - User authentication
 *           - Course exists and is paid
 *           - User hasn't already purchased
 *           - Price matches course price (prevent tampering)
 */
router.post('/create-course-checkout', protect, async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user._id;

    // SECURITY: Validate course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // SECURITY: Check if course is paid
    if (course.pricing.model === 'free') {
      return res.status(400).json({
        success: false,
        message: 'This course is free. No payment required.',
      });
    }

    // SECURITY: Check if user already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: userId,
      course: courseId,
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course',
      });
    }

    // SECURITY: Use course price from database (NEVER trust frontend)
    const amount = course.pricing.amount;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course pricing',
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: course.title,
              description: course.description?.substring(0, 200) || 'Course enrollment',
              images: course.thumbnail ? [course.thumbnail] : [],
            },
            unit_amount: amount, // Amount in cents from database
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'course_enrollment',
        courseId: courseId.toString(),
        userId: userId.toString(),
        instructorId: course.instructor.toString(),
        amount: amount.toString(),
      },
      success_url: getCheckoutSuccessUrl('{CHECKOUT_SESSION_ID}'),
      cancel_url: getCheckoutCancelUrl(),
      customer_email: req.user.email,
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Create course checkout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/payments/create-subscription-checkout
 * @desc    Create Stripe checkout session for subscription upgrade
 * @access  Private
 * @security Server-side validation of tier and pricing
 */
router.post('/create-subscription-checkout', protect, async (req, res) => {
  try {
    const { tier } = req.body; // 'basic' or 'pro'
    const userId = req.user._id;

    // SECURITY: Validate tier
    const validTiers = ['basic', 'pro'];
    if (!tier || !validTiers.includes(tier.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription tier',
      });
    }

    const tierUpper = tier.toUpperCase();
    const pricingConfig = PRICING.SUBSCRIPTIONS[tierUpper];

    if (!pricingConfig.priceId) {
      return res.status(500).json({
        success: false,
        message: 'Subscription pricing not configured. Please contact support.',
      });
    }

    // SECURITY: Check if user already has this or higher tier
    const currentUser = await User.findById(userId);
    const tierHierarchy = { free: 0, basic: 1, pro: 2 };

    if (tierHierarchy[currentUser.subscription.tier] >= tierHierarchy[tier]) {
      return res.status(400).json({
        success: false,
        message: `You already have ${currentUser.subscription.tier} tier or higher`,
      });
    }

    // Create Stripe checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: pricingConfig.priceId,
          quantity: 1,
        },
      ],
      metadata: {
        type: 'subscription',
        userId: userId.toString(),
        tier: tier,
      },
      success_url: getCheckoutSuccessUrl('{CHECKOUT_SESSION_ID}'),
      cancel_url: getCheckoutCancelUrl(),
      customer_email: req.user.email,
      subscription_data: {
        metadata: {
          userId: userId.toString(),
          tier: tier,
        },
      },
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Create subscription checkout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription checkout',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/payments/verify-session/:sessionId
 * @desc    Verify payment session status
 * @access  Private
 * @security Backend verification only
 */
router.get('/verify-session/:sessionId', protect, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // SECURITY: Verify this session belongs to the requesting user
    if (session.metadata.userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to payment session',
      });
    }

    res.json({
      success: true,
      status: session.payment_status,
      metadata: session.metadata,
    });
  } catch (error) {
    console.error('Verify session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment session',
    });
  }
});

/**
 * @route   GET /api/payments/my-purchases
 * @desc    Get user's purchase history
 * @access  Private
 */
router.get('/my-purchases', protect, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user._id })
      .populate('course', 'title thumbnail pricing')
      .sort({ createdAt: -1 });

    const purchases = enrollments.map((enrollment) => ({
      id: enrollment._id,
      courseId: enrollment.course._id,
      courseTitle: enrollment.course.title,
      courseThumbnail: enrollment.course.thumbnail,
      amount: enrollment.course.pricing.amount,
      purchasedAt: enrollment.createdAt,
      progress: enrollment.progress.percentage,
    }));

    res.json({
      success: true,
      purchases,
    });
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve purchase history',
    });
  }
});

export default router;
