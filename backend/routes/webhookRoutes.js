/**
 * Stripe Webhook Handler
 * CRITICAL: This is the ONLY source of truth for payment verification
 * Security: Verifies webhook signature to prevent fraud
 */

import express from 'express';
import stripe, { STRIPE_WEBHOOK_SECRET, PRICING } from '../config/stripe.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';

const router = express.Router();

/**
 * @route   POST /api/webhooks/stripe
 * @desc    Handle Stripe webhook events
 * @access  Public (but signature verified)
 * @security Stripe signature verification prevents tampering
 *
 * CRITICAL: This endpoint must use express.raw() for body parsing
 * Add to server.js BEFORE express.json():
 * app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
 */
router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    // SECURITY: Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Handle successful checkout session
 * This is called when payment is completed
 */
async function handleCheckoutSessionCompleted(session) {
  console.log('✅ Checkout session completed:', session.id);

  const metadata = session.metadata;

  if (metadata.type === 'course_enrollment') {
    await handleCourseEnrollmentPayment(session);
  } else if (metadata.type === 'subscription') {
    await handleSubscriptionPayment(session);
  }
}

/**
 * Handle course enrollment payment
 * SECURITY: All enrollment logic here (cannot be bypassed)
 */
async function handleCourseEnrollmentPayment(session) {
  const { courseId, userId, instructorId, amount } = session.metadata;

  console.log(`💰 Processing course enrollment payment:`, {
    courseId,
    userId,
    amount: amount / 100,
  });

  try {
    // SECURITY: Double-check enrollment doesn't exist
    const existingEnrollment = await Enrollment.findOne({
      user: userId,
      course: courseId,
    });

    if (existingEnrollment) {
      console.warn('⚠️  User already enrolled, skipping duplicate enrollment');
      return;
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      user: userId,
      course: courseId,
      enrolledAt: new Date(),
      status: 'active',
      paymentStatus: 'paid',
      paymentAmount: parseInt(amount),
      paymentDate: new Date(),
      stripeSessionId: session.id,
    });

    console.log('✅ Enrollment created:', enrollment._id);

    // Calculate revenue split
    const totalAmount = parseInt(amount);
    const platformFee = Math.floor(
      (totalAmount * PRICING.PLATFORM_FEE_PERCENT) / 100
    );
    const instructorRevenue = totalAmount - platformFee;

    // Update course revenue
    await Course.findByIdAndUpdate(courseId, {
      $inc: {
        'marketplace.totalRevenue': totalAmount,
        'marketplace.totalSales': 1,
        'marketplace.platformRevenue': platformFee,
        'marketplace.instructorRevenue': instructorRevenue,
      },
    });

    // Update instructor earnings
    await User.findByIdAndUpdate(instructorId, {
      $inc: {
        'revenue.totalEarnings': instructorRevenue,
        'revenue.pendingPayout': instructorRevenue,
        'revenue.courseSales': 1,
      },
    });

    console.log(`💵 Revenue split: Platform $${platformFee / 100} | Instructor $${instructorRevenue / 100}`);
  } catch (error) {
    console.error('❌ Error processing course enrollment payment:', error);
    throw error;
  }
}

/**
 * Handle subscription payment
 * SECURITY: Updates user tier and quotas
 */
async function handleSubscriptionPayment(session) {
  const { userId, tier } = session.metadata;

  console.log(`📅 Processing subscription payment:`, { userId, tier });

  try {
    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription
    );

    // Update user subscription
    await User.findByIdAndUpdate(userId, {
      $set: {
        'subscription.tier': tier,
        'subscription.status': 'active',
        'subscription.startDate': new Date(subscription.current_period_start * 1000),
        'subscription.endDate': new Date(subscription.current_period_end * 1000),
        'subscription.stripeSubscriptionId': subscription.id,
        'subscription.stripeCustomerId': subscription.customer,
      },
    });

    // Update AI usage quotas based on new tier
    const user = await User.findById(userId);
    if (user) {
      await user.updateAIQuotasForRole();
      await user.save();
    }

    console.log(`✅ User ${userId} upgraded to ${tier} tier`);
  } catch (error) {
    console.error('❌ Error processing subscription payment:', error);
    throw error;
  }
}

/**
 * Handle recurring invoice payment
 */
async function handleInvoicePaymentSucceeded(invoice) {
  console.log('✅ Invoice paid:', invoice.id);

  // Extend subscription period
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);

  await User.findOneAndUpdate(
    { 'subscription.stripeSubscriptionId': subscription.id },
    {
      $set: {
        'subscription.status': 'active',
        'subscription.endDate': new Date(subscription.current_period_end * 1000),
      },
    }
  );
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice) {
  console.error('❌ Invoice payment failed:', invoice.id);

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);

  await User.findOneAndUpdate(
    { 'subscription.stripeSubscriptionId': subscription.id },
    {
      $set: {
        'subscription.status': 'past_due',
      },
    }
  );

  // TODO: Send email notification to user
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionDeleted(subscription) {
  console.log('🔴 Subscription cancelled:', subscription.id);

  await User.findOneAndUpdate(
    { 'subscription.stripeSubscriptionId': subscription.id },
    {
      $set: {
        'subscription.tier': 'free',
        'subscription.status': 'cancelled',
        'subscription.endDate': new Date(),
      },
    }
  );

  // Reset quotas to free tier
  const user = await User.findOne({
    'subscription.stripeSubscriptionId': subscription.id,
  });

  if (user) {
    await user.updateAIQuotasForRole();
    await user.save();
  }
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(subscription) {
  console.log('🔄 Subscription updated:', subscription.id);

  await User.findOneAndUpdate(
    { 'subscription.stripeSubscriptionId': subscription.id },
    {
      $set: {
        'subscription.status': subscription.status,
        'subscription.endDate': new Date(subscription.current_period_end * 1000),
      },
    }
  );
}

export default router;
