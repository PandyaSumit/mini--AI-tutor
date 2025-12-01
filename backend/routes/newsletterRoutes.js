/**
 * Newsletter Routes
 * Public endpoints for newsletter subscription management
 */

import express from 'express';
import NewsletterSubscription from '../models/NewsletterSubscription.js';

const router = express.Router();

/**
 * POST /api/newsletter/subscribe
 * Subscribe to newsletter (PUBLIC)
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { email, source = 'other' } = req.body;

    // Validate email
    if (!email || !email.match(/^\S+@\S+\.\S+$/)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address',
      });
    }

    // Check if email already exists
    const existingSubscription = await NewsletterSubscription.findOne({ email: email.toLowerCase() });

    if (existingSubscription) {
      // If previously unsubscribed, reactivate
      if (existingSubscription.status === 'unsubscribed') {
        existingSubscription.status = 'active';
        existingSubscription.subscribedAt = new Date();
        existingSubscription.unsubscribedAt = undefined;
        existingSubscription.source = source;
        await existingSubscription.save();

        return res.status(200).json({
          success: true,
          message: 'Welcome back! You have been resubscribed to our newsletter.',
        });
      }

      // Already subscribed
      return res.status(200).json({
        success: true,
        message: 'You are already subscribed to our newsletter.',
      });
    }

    // Create new subscription
    const subscription = await NewsletterSubscription.create({
      email: email.toLowerCase(),
      source,
      metadata: {
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress,
        referrer: req.headers.referer || req.headers.referrer,
      },
    });

    // TODO: Send welcome email
    // TODO: Add to email marketing service (Mailchimp, SendGrid, etc.)

    res.status(201).json({
      success: true,
      message: 'Thank you for subscribing! Check your inbox for a confirmation email.',
      data: {
        email: subscription.email,
        subscribedAt: subscription.subscribedAt,
      },
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to subscribe. Please try again later.',
    });
  }
});

/**
 * POST /api/newsletter/unsubscribe
 * Unsubscribe from newsletter (PUBLIC)
 */
router.post('/unsubscribe', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !email.match(/^\S+@\S+\.\S+$/)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address',
      });
    }

    // Find and update subscription
    const subscription = await NewsletterSubscription.findOne({ email: email.toLowerCase() });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Email address not found in our subscription list.',
      });
    }

    if (subscription.status === 'unsubscribed') {
      return res.status(200).json({
        success: true,
        message: 'You are already unsubscribed.',
      });
    }

    // Unsubscribe
    subscription.status = 'unsubscribed';
    subscription.unsubscribedAt = new Date();
    await subscription.save();

    // TODO: Remove from email marketing service

    res.status(200).json({
      success: true,
      message: 'You have been successfully unsubscribed. We are sorry to see you go!',
    });
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unsubscribe. Please try again later.',
    });
  }
});

/**
 * GET /api/newsletter/stats
 * Get newsletter statistics (ADMIN ONLY - would need auth middleware in production)
 */
router.get('/stats', async (req, res) => {
  try {
    // Note: In production, add admin authentication middleware

    const [totalSubscribers, activeSubscribers, unsubscribed, recentSubscriptions] = await Promise.all([
      NewsletterSubscription.countDocuments(),
      NewsletterSubscription.countDocuments({ status: 'active' }),
      NewsletterSubscription.countDocuments({ status: 'unsubscribed' }),
      NewsletterSubscription.find({ status: 'active' })
        .sort({ subscribedAt: -1 })
        .limit(10)
        .select('email subscribedAt source'),
    ]);

    // Get subscriptions by source
    const bySource = await NewsletterSubscription.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalSubscribers,
        activeSubscribers,
        unsubscribed,
        bySource: bySource.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recentSubscriptions,
      },
    });
  } catch (error) {
    console.error('Newsletter stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch newsletter statistics.',
    });
  }
});

export default router;
