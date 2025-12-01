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

            // Security: HTTP-only cookie is set by backend automatically
            // No need to store token in localStorage (XSS vulnerability)
            // Token will be sent automatically with requests via withCredentials

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

            // Security: HTTP-only cookie is set by backend automatically
            // No need to store token in localStorage (XSS vulnerability)
            // Token will be sent automatically with requests via withCredentials

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
            // Backend will clear the HTTP-only cookie
            await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
        } catch (error) {
            // Even if request fails, cookie will be cleared on next auth check
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
     * Note: We can't directly check HTTP-only cookies from JavaScript
     * This method now attempts to get current user from the API
     */
    async isAuthenticatedAsync(): Promise<boolean> {
        try {
            await this.getCurrentUser();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Check if user is authenticated (synchronous version)
     * Note: Less reliable since we can't access HTTP-only cookies
     * Use isAuthenticatedAsync() for accurate check
     */
    isAuthenticated(): boolean {
        // We can't reliably check HTTP-only cookies from JavaScript
        // This is a limitation but improves security
        // Rely on API calls to verify authentication
        return false; // Always return false, use API checks instead
    }

    /**
     * Get stored auth token
     * Note: No longer storing tokens in localStorage for security
     * Tokens are in HTTP-only cookies, inaccessible to JavaScript
     */
    getToken(): string | null {
        // Security: Token is in HTTP-only cookie, not accessible to JavaScript
        // This prevents XSS attacks from stealing the token
        return null;
    }
}

export const authService = new AuthService();
export default authService;
