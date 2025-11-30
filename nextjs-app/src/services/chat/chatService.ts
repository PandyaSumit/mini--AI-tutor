/**
 * Chat Service
 * Handles chat conversations and messages
 */

import apiClient from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { Conversation, Message, ApiResponse, ConversationTopic, AIResponse } from '@/types';

interface SendMessageData {
  conversationId?: string;
  message: string;
  topic?: ConversationTopic;
}

class ChatService {
  /**
   * Send a message in a conversation
   */
  async sendMessage(data: SendMessageData): Promise<AIResponse> {
    try {
      const response = await apiClient.post<AIResponse>(
        API_ENDPOINTS.CHAT.SEND_MESSAGE,
        data
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all conversations for current user
   */
  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await apiClient.get<ApiResponse<Conversation[]>>(
        API_ENDPOINTS.CHAT.GET_CONVERSATIONS
      );

      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a specific conversation with messages
   */
  async getConversationMessages(conversationId: string): Promise<{
    conversation: Conversation;
    messages: Message[];
  }> {
    try {
      const response = await apiClient.get<
        ApiResponse<{ conversation: Conversation; messages: Message[] }>
      >(API_ENDPOINTS.CHAT.GET_CONVERSATION(conversationId));

      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      await apiClient.delete(
        API_ENDPOINTS.CHAT.DELETE_CONVERSATION(conversationId)
      );
    } catch (error) {
      throw error;
    }
  }
}

export const chatService = new ChatService();
export default chatService;
