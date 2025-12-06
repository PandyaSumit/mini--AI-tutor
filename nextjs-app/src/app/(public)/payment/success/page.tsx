'use client';

/**
 * Payment Success Page
 * Shown after successful Stripe checkout
 * Verifies payment and redirects to appropriate page
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Loader, AlertCircle, ArrowRight } from 'lucide-react';
import { paymentService } from '@/services';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentType, setPaymentType] = useState<'course' | 'subscription' | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setErrorMessage('No session ID provided');
      return;
    }

    verifyPayment();
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      const response = await paymentService.verifyPaymentSession(sessionId!);

      if (response.success && response.status === 'complete') {
        setStatus('success');

        // Determine payment type from metadata
        const metadata = response.metadata;
        if (metadata?.type === 'course_enrollment') {
          setPaymentType('course');
          // Redirect to course after 3 seconds
          setTimeout(() => {
            router.push(`/dashboard/courses/${metadata.courseId}`);
          }, 3000);
        } else if (metadata?.type === 'subscription') {
          setPaymentType('subscription');
          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            router.push('/dashboard');
          }, 3000);
        }
      } else {
        setStatus('error');
        setErrorMessage('Payment verification failed');
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to verify payment');
    }
  };

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Verifying Payment
          </h2>
          <p className="text-gray-600">
            Please wait while we confirm your payment...
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Verification Failed
          </h2>
          <p className="text-gray-600 mb-6">
            {errorMessage || 'We could not verify your payment. Please contact support.'}
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/browse"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/50">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Payment Successful!
        </h2>

        {paymentType === 'course' ? (
          <>
            <p className="text-lg text-gray-600 mb-4">
              You have successfully enrolled in the course.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                You now have lifetime access to all course materials, AI tutoring, and voice learning sessions.
              </p>
            </div>
          </>
        ) : paymentType === 'subscription' ? (
          <>
            <p className="text-lg text-gray-600 mb-4">
              Your subscription has been activated!
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                You now have access to increased AI message limits and premium features.
              </p>
            </div>
          </>
        ) : (
          <p className="text-lg text-gray-600 mb-6">
            Your payment has been processed successfully.
          </p>
        )}

        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
          <Loader className="w-4 h-4 animate-spin" />
          <span>Redirecting you in a moment...</span>
        </div>

        <div className="flex flex-col gap-3">
          {paymentType === 'course' ? (
            <button
              onClick={() => router.push('/dashboard/courses')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
            >
              <span>Go to My Courses</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}

          <Link
            href="/browse"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
          >
            Browse More Courses
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            A receipt has been sent to your email address.
          </p>
        </div>
      </div>
    </div>
  );
}
