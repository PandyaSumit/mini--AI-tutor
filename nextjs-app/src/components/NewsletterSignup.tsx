'use client';

/**
 * Newsletter Signup Component
 * Captures email leads for marketing
 */

import { useState } from 'react';
import { Mail, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface NewsletterSignupProps {
  variant?: 'inline' | 'popup' | 'footer';
  className?: string;
}

export default function NewsletterSignup({ variant = 'inline', className = '' }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');

    try {
      // TODO: Replace with actual API endpoint
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStatus('success');
        setMessage('Thank you for subscribing!');
        setEmail('');

        // Reset after 5 seconds
        setTimeout(() => {
          setStatus('idle');
          setMessage('');
        }, 5000);
      } else {
        const data = await response.json();
        setStatus('error');
        setMessage(data.error || 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred. Please try again later.');
      console.error('Newsletter subscription error:', error);
    }
  };

  if (variant === 'footer') {
    return (
      <div className={className}>
        <h3 className="text-lg font-semibold text-white mb-4">Stay Updated</h3>
        <p className="text-gray-300 mb-4 text-sm">
          Get the latest courses, tips, and updates delivered to your inbox.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={status === 'loading' || status === 'success'}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={status === 'loading' || status === 'success'}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {status === 'loading' ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : status === 'success' ? (
                'Subscribed!'
              ) : (
                'Subscribe'
              )}
            </button>
          </div>
          {message && (
            <div className={`flex items-center space-x-2 text-sm ${
              status === 'success' ? 'text-green-400' : 'text-red-400'
            }`}>
              {status === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span>{message}</span>
            </div>
          )}
        </form>
      </div>
    );
  }

  if (variant === 'popup') {
    return (
      <div className={`bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-2xl p-8 ${className}`}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">
            Join Our Learning Community
          </h3>
          <p className="text-blue-100">
            Get exclusive tips, course recommendations, and early access to new features.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            disabled={status === 'loading' || status === 'success'}
            className="w-full px-4 py-3 rounded-lg border-2 border-white border-opacity-20 bg-white bg-opacity-10 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status === 'loading' || status === 'success'}
            className="w-full px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? (
              <span className="flex items-center justify-center space-x-2">
                <Loader className="w-5 h-5 animate-spin" />
                <span>Subscribing...</span>
              </span>
            ) : status === 'success' ? (
              <span className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>Subscribed!</span>
              </span>
            ) : (
              'Subscribe Now'
            )}
          </button>
          {message && status === 'error' && (
            <div className="flex items-center space-x-2 text-sm text-white bg-red-500 bg-opacity-20 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span>{message}</span>
            </div>
          )}
        </form>
        <p className="text-xs text-blue-200 text-center mt-4">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </div>
    );
  }

  // Default inline variant
  return (
    <div className={`bg-white rounded-xl shadow-md p-8 ${className}`}>
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Mail className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Stay in the Loop
          </h3>
          <p className="text-gray-600 mb-4">
            Subscribe to get updates on new courses and learning tips.
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                disabled={status === 'loading' || status === 'success'}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-100"
              />
              <button
                type="submit"
                disabled={status === 'loading' || status === 'success'}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {status === 'loading' ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : status === 'success' ? (
                  'Subscribed!'
                ) : (
                  'Subscribe'
                )}
              </button>
            </div>
            {message && (
              <div className={`flex items-center space-x-2 text-sm ${
                status === 'success' ? 'text-green-600' : 'text-red-600'
              }`}>
                {status === 'success' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span>{message}</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
