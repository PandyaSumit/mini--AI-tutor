import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * AI Streaming Service
 * Handles Server-Sent Events (SSE) streaming for real-time AI responses
 */

class AIStreamingService {
  /**
   * Stream AI chat with real-time thinking updates
   * @param {string} message - User message
   * @param {object} options - Options { mode: 'simple'|'rag', onThinkingUpdate, onResponse, onError, onComplete }
   */
  async streamChat(message, options = {}) {
    const {
      mode = 'simple',
      onThinkingUpdate,
      onResponse,
      onError,
      onComplete,
      onThinkingStart
    } = options;

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      const response = await fetch(`${API_URL}/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message, mode })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              if (onComplete) onComplete();
              return;
            }

            if (data === ':keepalive') {
              continue;
            }

            try {
              const event = JSON.parse(data);

              switch (event.type) {
                case 'thinking_start':
                  if (onThinkingStart) {
                    onThinkingStart(event.phases);
                  }
                  break;

                case 'thinking_update':
                  if (onThinkingUpdate) {
                    onThinkingUpdate(event.phase);
                  }
                  break;

                case 'thinking_complete':
                  // Thinking is done, response will follow
                  break;

                case 'response':
                  if (onResponse) {
                    onResponse(event.data);
                  }
                  break;

                case 'error':
                  if (onError) {
                    onError(new Error(event.error));
                  }
                  break;
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }

    } catch (error) {
      console.error('Streaming error:', error);
      if (onError) {
        onError(error);
      }
      throw error;
    }
  }
}

export default new AIStreamingService();
