/**
 * Quota Middleware
 * SECURITY: Enforces AI usage limits (cannot be bypassed)
 * Triggers upgrade prompts when limits reached
 */

import User from '../models/User.js';

/**
 * Check if user has AI quota available
 * CRITICAL: All quota checks must be server-side
 */
export const checkAIQuota = (quotaType = 'chatMessages') => {
  return async (req, res, next) => {
    try {
      const userId = req.user._id;

      // SECURITY: Fetch fresh user data from database (NEVER trust client)
      const user = await User.findById(userId).select(
        'subscription aiUsage role'
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found',
        });
      }

      // Check if user has quota
      const hasQuota = user.hasAIQuota(quotaType);

      if (!hasQuota) {
        // Get upgrade URL based on current tier
        const upgradeInfo = getUpgradeInfo(user.subscription.tier);

        return res.status(429).json({
          success: false,
          error: 'FREE_TIER_EXHAUSTED',
          message: upgradeInfo.message,
          currentTier: user.subscription.tier,
          upgradeUrl: '/subscribe',
          upgradeTo: upgradeInfo.nextTier,
          upgradePrice: upgradeInfo.price,
          limits: {
            current: user.aiUsage.quotas[quotaType].used,
            limit: user.aiUsage.quotas[quotaType].limit,
          },
        });
      }

      // Quota available - add user to request for consumption tracking
      req.quotaUser = user;
      req.quotaType = quotaType;

      next();
    } catch (error) {
      console.error('Quota check error:', error);
      res.status(500).json({
        success: false,
        error: 'QUOTA_CHECK_FAILED',
        message: 'Failed to verify usage quota',
      });
    }
  };
};

/**
 * Consume AI quota after successful operation
 * MUST be called after AI operation completes
 */
export const consumeAIQuota = async (req, amount = 1) => {
  try {
    if (!req.quotaUser || !req.quotaType) {
      console.warn('⚠️  consumeAIQuota called without quota check');
      return;
    }

    // SECURITY: Update quota in database (atomic operation)
    await User.findByIdAndUpdate(req.quotaUser._id, {
      $inc: {
        [`aiUsage.quotas.${req.quotaType}.used`]: amount,
      },
      $set: {
        'aiUsage.lastUsedAt': new Date(),
      },
    });

    console.log(
      `✅ Consumed ${amount} ${req.quotaType} quota for user ${req.quotaUser._id}`
    );
  } catch (error) {
    console.error('Failed to consume quota:', error);
    // Don't throw - quota consumption failure shouldn't break the response
  }
};

/**
 * Get upgrade information based on current tier
 */
function getUpgradeInfo(currentTier) {
  const upgrades = {
    free: {
      message:
        'Your free AI messages are over. Continue learning with a Pro Subscription.',
      nextTier: 'basic',
      price: 999, // $9.99
    },
    basic: {
      message:
        'You've reached your monthly limit. Upgrade to Pro for unlimited messages.',
      nextTier: 'pro',
      price: 1999, // $19.99
    },
    pro: {
      message: 'You've reached your monthly limit. Please wait for next billing cycle.',
      nextTier: null,
      price: null,
    },
  };

  return upgrades[currentTier] || upgrades.free;
}

/**
 * Reset monthly quotas (called by cron job)
 * Run this at the start of each month
 */
export const resetMonthlyQuotas = async () => {
  try {
    console.log('🔄 Resetting monthly quotas...');

    await User.updateMany(
      {},
      {
        $set: {
          'aiUsage.quotas.chatMessages.used': 0,
          'aiUsage.quotas.voiceMinutes.used': 0,
          'aiUsage.quotas.courseGenerations.used': 0,
        },
      }
    );

    console.log('✅ Monthly quotas reset successfully');
  } catch (error) {
    console.error('❌ Failed to reset monthly quotas:', error);
  }
};

export default { checkAIQuota, consumeAIQuota, resetMonthlyQuotas };
