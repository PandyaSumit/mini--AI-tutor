/**
 * Authentication Service
 * Handles user login, registration, and session management
 */

import apiClient from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type {
    LoginCredentials,
    RegisterData,
    AuthResponse,
    User,
    ApiResponse,
} from '@/types';

class AuthService {
    /**
     * Login user with credentials
     */
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        try {
            const response = await apiClient.post<ApiResponse<AuthResponse>>(
                API_ENDPOINTS.AUTH.LOGIN,
                credentials
            );

            const { token, user } = response.data.data;

            // Store token in localStorage for client-side access
            if (typeof window !== 'undefined') {
                localStorage.setItem('authToken', token);
                // Also set token in cookie for middleware
                document.cookie = `authToken=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
            }

            return { token, user };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Register new user
     */
    async register(userData: RegisterData): Promise<AuthResponse> {
        try {
            const response = await apiClient.post<ApiResponse<AuthResponse>>(
                API_ENDPOINTS.AUTH.REGISTER,
                userData
            );

            const { token, user } = response.data.data;

            // Store token in localStorage for client-side access
            if (typeof window !== 'undefined') {
                localStorage.setItem('authToken', token);
                // Also set token in cookie for middleware
                document.cookie = `authToken=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
            }

            return { token, user };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Logout current user
     */
    async logout(): Promise<void> {
        try {
            await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);

            // Clear token from localStorage and cookie
            if (typeof window !== 'undefined') {
                localStorage.removeItem('authToken');
                // Clear authToken cookie
                document.cookie = 'authToken=; path=/; max-age=0';
            }
        } catch (error) {
            // Clear token even if request fails
            if (typeof window !== 'undefined') {
                localStorage.removeItem('authToken');
                document.cookie = 'authToken=; path=/; max-age=0';
            }
            throw error;
        }
    }

    /**
     * Get current authenticated user
     */
    async getCurrentUser(): Promise<User> {
        try {
            const response = await apiClient.get<ApiResponse<User>>(
                API_ENDPOINTS.AUTH.ME
            );

            return response.data.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        if (typeof window === 'undefined') return false;
        return !!localStorage.getItem('authToken');
    }

    /**
     * Get stored auth token
     */
    getToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('authToken');
    }
}

export const authService = new AuthService();
export default authService;
