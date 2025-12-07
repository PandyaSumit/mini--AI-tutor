/**
 * Auth Provider
 * Manages authentication state across the application
 * Provides permission checking capabilities
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth/authService';
import type { User, AuthState } from '@/types';
import type { Role, Permission } from '@/lib/permissions';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasAnyRole,
  isOwner,
  canEdit,
  canDelete,
  getUserPermissions,
  isAdmin,
  isInstructor,
  isPlatformAuthor,
} from '@/lib/permissions';

interface PermissionChecks {
  // Permission checks
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;

  // Role checks
  hasRole: (role: Role) => boolean;
  hasAnyRole: (roles: Role[]) => boolean;

  // Resource ownership checks
  isOwner: (resource: any) => boolean;
  canEdit: (resource: any, editPermission: Permission) => boolean;
  canDelete: (resource: any, deletePermission: Permission) => boolean;

  // Role helper checks
  isAdmin: () => boolean;
  isInstructor: () => boolean;
  isPlatformAuthor: () => boolean;

  // Get all user permissions
  getUserPermissions: () => Permission[];
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;

  // Permission checking functions
  permissions: PermissionChecks;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
      router.push('/dashboard');
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
      router.push('/dashboard');
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

  // Memoized permission checking functions
  // These use the helper functions from @/lib/permissions
  const permissions = useMemo<PermissionChecks>(() => {
    const userRole = user?.role;
    const userId = user?._id;
    const userPermissions = user?.permissions;

    return {
      // Permission checks
      hasPermission: (permission: Permission) => {
        return hasPermission(userRole, permission, userPermissions);
      },

      hasAnyPermission: (permissions: Permission[]) => {
        return hasAnyPermission(userRole, permissions, userPermissions);
      },

      hasAllPermissions: (permissions: Permission[]) => {
        return hasAllPermissions(userRole, permissions, userPermissions);
      },

      // Role checks
      hasRole: (role: Role) => {
        return hasRole(userRole, role);
      },

      hasAnyRole: (roles: Role[]) => {
        return hasAnyRole(userRole, roles);
      },

      // Resource ownership checks
      isOwner: (resource: any) => {
        return isOwner(userId, resource);
      },

      canEdit: (resource: any, editPermission: Permission) => {
        return canEdit(userRole, userId, resource, editPermission, userPermissions);
      },

      canDelete: (resource: any, deletePermission: Permission) => {
        return canDelete(userRole, userId, resource, deletePermission, userPermissions);
      },

      // Role helper checks
      isAdmin: () => {
        return isAdmin(userRole);
      },

      isInstructor: () => {
        return isInstructor(userRole);
      },

      isPlatformAuthor: () => {
        return isPlatformAuthor(userRole);
      },

      // Get all user permissions
      getUserPermissions: () => {
        return getUserPermissions(userRole, userPermissions);
      },
    };
  }, [user?.role, user?._id, user?.permissions]);

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
        permissions,
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
