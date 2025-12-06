/**
 * Auth Provider
 * Manages authentication state across the application
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth/authService';
import type { User, AuthState } from '@/types';

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Helper function for role-based routing after login/register
  const getPostAuthRoute = (user: User): string => {
    // Admin goes to admin dashboard
    if (user.role === 'admin') {
      return '/admin/dashboard';
    }

    // Platform Author - check verification status
    if (user.role === 'platform_author') {
      const verificationStatus = user.instructorVerification?.status;

      // If not verified, send to verification page
      if (verificationStatus !== 'approved') {
        if (verificationStatus === 'pending') {
          return '/instructor/verification?status=pending';
        } else if (verificationStatus === 'rejected') {
          return '/instructor/verification?status=rejected';
        } else {
          // Not applied yet
          return '/instructor/verification';
        }
      }

      // Verified authors go to author dashboard
      return '/author/dashboard';
    }

    // Verified Instructor - check verification status
    if (user.role === 'verified_instructor') {
      const verificationStatus = user.instructorVerification?.status;

      // If not verified, send to verification page
      if (verificationStatus !== 'approved') {
        if (verificationStatus === 'pending') {
          return '/instructor/verification?status=pending';
        } else if (verificationStatus === 'rejected') {
          return '/instructor/verification?status=rejected';
        } else {
          // Not applied yet
          return '/instructor/verification';
        }
      }

      // Verified instructors go to instructor dashboard
      return '/instructor/dashboard';
    }

    // Students (learner role) go to student dashboard
    return '/dashboard';
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Try to get current user - backend will validate HTTP-only cookie
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (err: any) {
      console.error('Auth check failed:', err);
      // If getCurrentUser fails, user is not authenticated
      setError(null); // Don't set error for normal "not authenticated" state
      setUser(null);
      // No need to clear cookies - they're HTTP-only and managed by backend
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.login({ email, password });
      setUser(response.user);

      // Role-based routing
      const redirectRoute = getPostAuthRoute(response.user);
      router.push(redirectRoute);
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.register(data);
      setUser(response.user);

      // Role-based routing
      const redirectRoute = getPostAuthRoute(response.user);
      router.push(redirectRoute);
    } catch (err: any) {
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    // Immediately clear user state (optimistic update)
    setUser(null);
    setError(null);

    try {
      // Call backend to clear cookie
      await authService.logout();
    } catch (err: any) {
      console.error('Logout error:', err);
      // Continue with logout even if API call fails
    } finally {
      // Force redirect to login page
      // Use replace to prevent back button from going to protected pages
      router.replace('/login');
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (err: any) {
      console.error('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
