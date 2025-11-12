import api from './api';

export const chatService = {
  // Send message to AI
  sendMessage: async (data) => {
    const response = await api.post('/chat/message', data);
    return response.data;
  },

  // Get conversation messages
  getConversationMessages: async (conversationId) => {
    const response = await api.get(`/chat/conversation/${conversationId}`);
    return response.data;
  },

  // Get all conversations
  getConversations: async (params = {}) => {
    const response = await api.get('/conversations', { params });
    return response.data;
  },

  // Get single conversation
  getConversation: async (id) => {
    const response = await api.get(`/conversations/${id}`);
    return response.data;
  },

  // Create new conversation
  createConversation: async (data) => {
    const response = await api.post('/conversations', data);
    return response.data;
  },

  // Update conversation
  updateConversation: async (id, data) => {
    const response = await api.put(`/conversations/${id}`, data);
    return response.data;
  },

  // Delete conversation
  deleteConversation: async (id) => {
    const response = await api.delete(`/conversations/${id}`);
    return response.data;
  },

  // Search conversations
  searchConversations: async (query) => {
    const response = await api.get('/conversations/search', {
      params: { q: query }
    });
    return response.data;
  }
};
