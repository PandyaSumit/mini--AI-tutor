/**
 * Axios API client configuration
 */

import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { ApiError, ApiResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Important for cookie-based auth
});

// Request interceptor
apiClient.interceptors.request.use(
    (config) => {
        // Security: Token is in HTTP-only cookie, sent automatically via withCredentials
        // No need to manually add Authorization header from localStorage
        // This prevents XSS attacks from stealing and using the token
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
apiClient.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
        return response;
    },
    (error: AxiosError<ApiError>) => {
        if (error.response) {
            // Server responded with error status
            const apiError: ApiError = {
                message: error.response.data?.message || 'An error occurred',
                statusCode: error.response.status,
                errors: error.response.data?.errors,
            };

            // Handle authentication errors
            if (error.response.status === 401) {
                // HTTP-only cookies are managed by backend
                // Let the app-level auth logic (AuthProvider) handle routing
                // No need to manually clear cookies (they're HTTP-only)
            }

            return Promise.reject(apiError);
        } else if (error.request) {
            // Request made but no response
            return Promise.reject({
                message: 'Network error. Please check your connection.',
                statusCode: 0,
            });
        } else {
            // Something else happened
            return Promise.reject({
                message: error.message,
                statusCode: 0,
            });
        }
    }
);

export default apiClient;
