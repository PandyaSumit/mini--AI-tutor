'use client';

/**
 * Upgrade Modal
 * Shown when user hits free tier limit
 * Prompts upgrade to paid subscription
 */

import { useState } from 'react';
import { X, Zap, Check, Loader2, CreditCard } from 'lucide-react';
import { paymentService } from '@/services/payment';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: string;
  message?: string;
  upgradeTo?: string;
}

const TIER_FEATURES = {
  basic: {
    name: 'Basic',
    price: '$9.99/month',
    features: [
      '500 AI messages per month',
      '100 voice minutes',
      '10 AI course generations',
      'Priority support',
      'No ads',
    ],
  },
  pro: {
    name: 'Pro',
    price: '$19.99/month',
    features: [
      '2,000 AI messages per month',
      '500 voice minutes',
      '50 AI course generations',
      'Priority support',
      'Advanced analytics',
      'Early access to new features',
    ],
  },
};

export default function UpgradeModal({
  isOpen,
  onClose,
  currentTier = 'free',
  message,
  upgradeTo = 'basic',
}: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const tierInfo = TIER_FEATURES[upgradeTo as keyof typeof TIER_FEATURES];

  const handleUpgrade = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await paymentService.createSubscriptionCheckout(
        upgradeTo as 'basic' | 'pro'
      );

      // Redirect to Stripe Checkout
      paymentService.redirectToCheckout(response.url);
    } catch (err: any) {
      setError(err.message || 'Failed to start checkout');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Header */}
        <div className="p-8 pb-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/50">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Upgrade to Continue
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {message || `Your ${currentTier} plan limit has been reached`}
          </p>
        </div>

        {/* Plan Details */}
        <div className="px-8 pb-6">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {tierInfo.name}
              </h3>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tierInfo.price}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  billed monthly
                </p>
              </div>
            </div>

            <ul className="space-y-3">
              {tierInfo.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-8 pb-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-8 pb-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Maybe Later
          </button>
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                <span>Upgrade Now</span>
              </>
            )}
          </button>
        </div>

        {/* Footer Note */}
        <div className="px-8 pb-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Secure payment powered by Stripe • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}
