import api from './api';

export const userService = {
  // Get user profile
  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (data) => {
    const response = await api.put('/user/profile', data);
    return response.data;
  },

  // Get user statistics
  getStats: async () => {
    const response = await api.get('/user/stats');
    return response.data;
  },

  // Delete user account
  deleteAccount: async () => {
    const response = await api.delete('/user/account');
    return response.data;
  }
};
