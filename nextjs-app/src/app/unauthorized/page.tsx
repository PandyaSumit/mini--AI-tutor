/**
 * Unauthorized Access Page
 * Shown when user tries to access a route they don't have permission for
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Shield, Home, LogIn } from 'lucide-react';
import { getRoleDisplayName } from '@/lib/permissions';

export default function UnauthorizedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [countdown, setCountdown] = useState(10);

  const requiredRoles = searchParams.get('required')?.split(',') || [];
  const currentRole = searchParams.get('current');

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirect based on user role
          if (user) {
            switch (user.role) {
              case 'learner':
                router.push('/dashboard');
                break;
              case 'verified_instructor':
              case 'platform_author':
                router.push('/instructor/dashboard');
                break;
              case 'admin':
                router.push('/admin/dashboard');
                break;
              default:
                router.push('/dashboard');
            }
          } else {
            router.push('/login');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [user, router]);

  const handleGoHome = () => {
    if (user) {
      switch (user.role) {
        case 'learner':
          router.push('/dashboard');
          break;
        case 'verified_instructor':
        case 'platform_author':
          router.push('/instructor/dashboard');
          break;
        case 'admin':
          router.push('/admin/dashboard');
          break;
        default:
          router.push('/dashboard');
      }
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-red-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Access Denied
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page.
          </p>

          {/* Role information */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Your Role:</span>
                <span className="font-medium text-gray-900">
                  {currentRole ? getRoleDisplayName(currentRole as any) : 'Unknown'}
                </span>
              </div>
              {requiredRoles.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Required Role:</span>
                  <span className="font-medium text-gray-900">
                    {requiredRoles.map((r) => getRoleDisplayName(r as any)).join(' or ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Countdown */}
          <p className="text-sm text-gray-500 mb-6">
            Redirecting to your dashboard in {countdown} seconds...
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleGoHome}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Home className="w-5 h-5" />
              Go to Dashboard
            </button>

            {!user && (
              <button
                onClick={() => router.push('/login')}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <LogIn className="w-5 h-5" />
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Help text */}
        <p className="text-center text-sm text-gray-500 mt-6">
          If you believe this is an error, please contact support.
        </p>
      </div>
    </div>
  );
}
