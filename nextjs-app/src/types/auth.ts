/**
 * Authentication-related TypeScript types
 */

import { User } from './user';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface Session {
  user: User;
  token: string;
  expiresAt: string;
}
