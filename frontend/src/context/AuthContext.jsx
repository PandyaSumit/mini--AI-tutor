import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on mount
        const storedUser = authService.getStoredUser();
        const storedToken = localStorage.getItem('token');

        if (storedToken && storedUser) {
            setUser(storedUser);
            setToken(storedToken);
            // Ensure userId is stored (for existing sessions)
            if (!localStorage.getItem('userId')) {
                localStorage.setItem('userId', storedUser._id || storedUser.id);
            }
        }
        setLoading(false);
    }, []);

    const register = async (userData) => {
        try {
            const response = await authService.register(userData);
            setUser(response.data.user);
            setToken(response.data.token);
            return response;
        } catch (error) {
            throw error;
        }
    };

    const login = async (credentials) => {
        try {
            const response = await authService.login(credentials);
            setUser(response.data.user);
            setToken(response.data.token);
            return response;
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
            setUser(null);
            setToken(null);
        } catch (error) {
            console.error('Logout error:', error);
            // Still clear local state even if API call fails
            setUser(null);
            setToken(null);
        }
    };

    const updateUser = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('userId', userData._id || userData.id); // Update userId
    };

    const value = {
        user,
        token,
        loading,
        register,
        login,
        logout,
        updateUser,
        isAuthenticated: !!user
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
