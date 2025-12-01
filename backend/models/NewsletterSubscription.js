/**
 * Newsletter Subscription Model
 * Stores email subscriptions for marketing
 */

import mongoose from 'mongoose';

const newsletterSubscriptionSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    status: {
      type: String,
      enum: ['active', 'unsubscribed'],
      default: 'active',
    },
    source: {
      type: String,
      enum: ['footer', 'homepage', 'popup', 'inline', 'other'],
      default: 'other',
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
    unsubscribedAt: {
      type: Date,
    },
    metadata: {
      userAgent: String,
      ip: String,
      referrer: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
newsletterSubscriptionSchema.index({ email: 1 });
newsletterSubscriptionSchema.index({ status: 1 });
newsletterSubscriptionSchema.index({ subscribedAt: -1 });

const NewsletterSubscription = mongoose.model('NewsletterSubscription', newsletterSubscriptionSchema);

export default NewsletterSubscription;
