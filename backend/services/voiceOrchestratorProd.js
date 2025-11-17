/**
 * Production Voice Orchestrator Service
 * Orchestrates AI response generation and STT processing with fallback chains
 * Uses circuit breaker pattern for external API calls (Groq, HuggingFace, OpenAI)
 */

import Groq from 'groq-sdk';
import CircuitBreaker from 'opossum';
import axios from 'axios';
import FormData from 'form-data';
import logger from '../config/logger.js';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Production Voice Orchestrator Service
 */
class VoiceOrchestratorService {
  constructor() {
    this.groqBreaker = null;
    this.setupCircuitBreakers();
  }

  /**
   * Setup circuit breakers for external API calls
   */
  setupCircuitBreakers() {
    // Circuit breaker for Groq API
    const breakerOptions = {
      timeout: 30000, // 30 seconds
      errorThresholdPercentage: 50, // Open circuit after 50% failures
      resetTimeout: 60000 // Try again after 1 minute
    };

    this.groqBreaker = new CircuitBreaker(
      async (messages, options) => {
        return await groq.chat.completions.create({
          model: options.model || 'llama-3.1-70b-versatile',
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 1000
        });
      },
      breakerOptions
    );

    // Circuit breaker events
    this.groqBreaker.on('open', () => {
      logger.warn('Groq API circuit breaker opened', {
        failures: this.groqBreaker.stats.failures
      });
    });

    this.groqBreaker.on('halfOpen', () => {
      logger.info('Groq API circuit breaker half-open, testing...');
    });

    this.groqBreaker.on('close', () => {
      logger.info('Groq API circuit breaker closed, normal operation resumed');
    });

    this.groqBreaker.fallback(() => {
      logger.warn('Groq API circuit breaker fallback triggered');
      return {
        choices: [{
          message: {
            content: "I'm experiencing high load right now. Please try again in a moment."
          }
        }],
        usage: { total_tokens: 0 }
      };
    });
  }

  /**
   * Generate AI response using Groq LLM
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID
   * @param {string} userMessage - User's message
   * @param {Array} context - Conversation context (last 10 messages)
   * @returns {Promise<Object>} - {text, usage, model}
   */
  async generateAIResponse(conversationId, userId, userMessage, context = []) {
    const startTime = Date.now();

    try {
      logger.info('Generating AI response', {
        conversationId,
        userId,
        messageLength: userMessage.length,
        contextLength: context.length
      });

      // Build messages array for Groq
      const messages = [
        {
          role: 'system',
          content: 'You are a helpful AI tutor. Provide clear, concise, and educational responses. Break down complex topics into understandable explanations.'
        },
        ...context,
        {
          role: 'user',
          content: userMessage
        }
      ];

      // Call Groq API with circuit breaker
      const response = await this.groqBreaker.fire(messages, {
        model: 'llama-3.1-70b-versatile',
        temperature: 0.7,
        max_tokens: 1000
      });

      const responseText = response.choices[0].message.content;
      const duration = Date.now() - startTime;

      // Save AI message to database
      const { default: Message } = await import('../models/Message.js');
      const aiMessage = new Message({
        conversation: conversationId,
        user: userId,
        role: 'assistant',
        content: responseText,
        metadata: {
          model: 'groq-llama',
          tokens: response.usage?.total_tokens || 0,
          responseTime: duration,
          isVoice: true
        }
      });

      await aiMessage.save();

      logger.logExternalAPICall('Groq', 'chat.completions', duration, true);

      logger.info('AI response generated successfully', {
        conversationId,
        userId,
        tokens: response.usage?.total_tokens || 0,
        duration,
        responseLength: responseText.length
      });

      return {
        text: responseText,
        usage: response.usage,
        model: 'groq-llama',
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error('Failed to generate AI response', {
        conversationId,
        userId,
        error: error.message,
        stack: error.stack,
        duration
      });

      logger.logExternalAPICall('Groq', 'chat.completions', duration, false);

      throw error;
    }
  }

  /**
   * Process audio with STT using fallback chain
   * Fallback order: Hugging Face -> OpenAI Whisper -> Browser STT
   * @param {Buffer} audioBuffer - Audio data as Buffer
   * @returns {Promise<string|null>} - Transcribed text or null (triggers browser STT)
   */
  async processAudioWithSTT(audioBuffer) {
    // Try Hugging Face first
    if (HUGGINGFACE_API_KEY) {
      try {
        logger.info('Attempting STT with Hugging Face', {
          audioSize: audioBuffer.length
        });

        const transcript = await this.huggingFaceSTT(audioBuffer);

        if (transcript && transcript.trim().length > 0) {
          logger.info('STT successful with Hugging Face', {
            transcriptLength: transcript.length
          });
          return transcript;
        }
      } catch (error) {
        logger.warn('Hugging Face STT failed, trying fallback', {
          error: error.message
        });
      }
    }

    // Try OpenAI Whisper as fallback
    if (OPENAI_API_KEY) {
      try {
        logger.info('Attempting STT with OpenAI Whisper', {
          audioSize: audioBuffer.length
        });

        const transcript = await this.openAIWhisperSTT(audioBuffer);

        if (transcript && transcript.trim().length > 0) {
          logger.info('STT successful with OpenAI Whisper', {
            transcriptLength: transcript.length
          });
          return transcript;
        }
      } catch (error) {
        logger.warn('OpenAI Whisper STT failed, suggesting browser STT', {
          error: error.message
        });
      }
    }

    // All server-side STT failed, return null to trigger browser STT
    logger.warn('All server-side STT options failed, fallback to browser STT');
    return null;
  }

  /**
   * Hugging Face STT API
   * @param {Buffer} audioBuffer - Audio data
   * @returns {Promise<string>} - Transcribed text
   */
  async huggingFaceSTT(audioBuffer) {
    const startTime = Date.now();

    try {
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/openai/whisper-large-v3',
        audioBuffer,
        {
          headers: {
            'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
            'Content-Type': 'audio/webm'
          },
          timeout: 30000
        }
      );

      const duration = Date.now() - startTime;
      logger.logExternalAPICall('HuggingFace', 'whisper-large-v3', duration, true);

      return response.data.text || '';
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logExternalAPICall('HuggingFace', 'whisper-large-v3', duration, false);
      throw error;
    }
  }

  /**
   * OpenAI Whisper STT API
   * @param {Buffer} audioBuffer - Audio data
   * @returns {Promise<string>} - Transcribed text
   */
  async openAIWhisperSTT(audioBuffer) {
    const startTime = Date.now();

    try {
      const form = new FormData();
      form.append('file', audioBuffer, {
        filename: 'audio.webm',
        contentType: 'audio/webm'
      });
      form.append('model', 'whisper-1');

      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        form,
        {
          headers: {
            ...form.getHeaders(),
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          timeout: 30000
        }
      );

      const duration = Date.now() - startTime;
      logger.logExternalAPICall('OpenAI', 'whisper-1', duration, true);

      return response.data.text || '';
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logExternalAPICall('OpenAI', 'whisper-1', duration, false);
      throw error;
    }
  }

  /**
   * Get circuit breaker stats
   * @returns {Object} - Circuit breaker statistics
   */
  getStats() {
    return {
      groq: {
        state: this.groqBreaker.opened ? 'open' : this.groqBreaker.halfOpen ? 'half-open' : 'closed',
        stats: this.groqBreaker.stats
      }
    };
  }

  /**
   * Health check for external services
   * @returns {Promise<Object>} - Health status
   */
  async healthCheck() {
    const health = {
      groq: 'unknown',
      huggingface: 'disabled',
      openai: 'disabled'
    };

    // Check Groq circuit breaker
    health.groq = this.groqBreaker.opened ? 'down' : 'up';

    // Check if API keys are configured
    if (HUGGINGFACE_API_KEY) {
      health.huggingface = 'configured';
    }

    if (OPENAI_API_KEY) {
      health.openai = 'configured';
    }

    return health;
  }
}

// Singleton instance
const voiceOrchestrator = new VoiceOrchestratorService();

export default voiceOrchestrator;
