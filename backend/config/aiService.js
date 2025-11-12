import Groq from 'groq-sdk';

/**
 * Centralized AI Service Configuration
 * Single source of truth for AI model initialization
 */

class AIService {
  constructor() {
    this.groq = null;
    this.isConfigured = false;
    this.initialize();
  }

  /**
   * Initialize AI service
   */
  initialize() {
    if (!process.env.GROQ_API_KEY) {
      console.warn('⚠️  GROQ_API_KEY not configured. AI features will be disabled.');
      return;
    }

    try {
      this.groq = new Groq({
        apiKey: process.env.GROQ_API_KEY
      });
      this.isConfigured = true;
      console.log('✅ AI Service (Groq) initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize AI Service:', error.message);
    }
  }

  /**
   * Get Groq client instance
   * @throws {Error} If AI service is not configured
   */
  getClient() {
    if (!this.isConfigured || !this.groq) {
      throw new Error('AI service not configured. Please set GROQ_API_KEY in environment variables.');
    }
    return this.groq;
  }

  /**
   * Check if AI service is ready
   */
  isReady() {
    return this.isConfigured && this.groq !== null;
  }

  /**
   * Get default model configuration
   */
  getDefaultModel() {
    return process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';
  }

  /**
   * Generate completion with standard settings
   */
  async generateCompletion(messages, options = {}) {
    const client = this.getClient();

    const defaultOptions = {
      model: this.getDefaultModel(),
      temperature: 0.7,
      max_tokens: 3000,
      top_p: 1,
      stream: false
    };

    return await client.chat.completions.create({
      messages,
      ...defaultOptions,
      ...options
    });
  }

  /**
   * Generate structured JSON response
   */
  async generateStructuredJSON(messages, options = {}) {
    return await this.generateCompletion(messages, {
      ...options,
      response_format: { type: 'json_object' }
    });
  }
}

// Export singleton instance
const aiService = new AIService();
export default aiService;
