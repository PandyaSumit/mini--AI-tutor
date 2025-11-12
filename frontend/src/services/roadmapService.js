import api from './api';

export const roadmapService = {
  // Generate new roadmap
  generateRoadmap: async (data) => {
    const response = await api.post('/roadmaps/generate', data);
    return response.data;
  },

  // Get all roadmaps
  getRoadmaps: async (status = null) => {
    const params = status ? { status } : {};
    const response = await api.get('/roadmaps', { params });
    return response.data;
  },

  // Get single roadmap
  getRoadmap: async (id) => {
    const response = await api.get(`/roadmaps/${id}`);
    return response.data;
  },

  // Update progress
  updateProgress: async (id, data) => {
    const response = await api.put(`/roadmaps/${id}/progress`, data);
    return response.data;
  },

  // Complete milestone
  completeMilestone: async (id, milestoneIndex) => {
    const response = await api.put(`/roadmaps/${id}/milestones/${milestoneIndex}/complete`);
    return response.data;
  },

  // Adapt roadmap
  adaptRoadmap: async (id) => {
    const response = await api.post(`/roadmaps/${id}/adapt`);
    return response.data;
  },

  // Delete roadmap
  deleteRoadmap: async (id) => {
    const response = await api.delete(`/roadmaps/${id}`);
    return response.data;
  }
};
