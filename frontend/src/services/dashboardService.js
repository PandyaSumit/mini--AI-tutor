/**
 * Dashboard Service
 * Handles API calls for dashboard data
 */

import api from './api';

/**
 * Get complete dashboard summary data in a single request
 * Optimized endpoint that aggregates stats, conversations, roadmaps, and flashcards
 * @returns {Promise} Dashboard summary data
 */
const getDashboardSummary = async () => {
  try {
    const response = await api.get('/dashboard/summary');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    throw error;
  }
};

/**
 * Get lightweight dashboard statistics (just counters)
 * @returns {Promise} Dashboard statistics
 */
const getDashboardStats = async () => {
  try {
    const response = await api.get('/dashboard/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

export const dashboardService = {
  getDashboardSummary,
  getDashboardStats
};
