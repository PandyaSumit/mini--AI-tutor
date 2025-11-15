import Groq from 'groq-sdk';

/**
 * Centralized AI Service Configuration
 * Single source of truth for AI model initialization
 */

class AIService {
    constructor() {
        this.groq = null;
        this.isConfigured = false;
        // Do not initialize on import — initialize lazily when first used.
    }

    /**
     * Initialize AI service
     */
    initialize() {
        const apiKey = process.env.GROQ_API_KEY;
        console.log('apiKey: ', apiKey);
        if (!apiKey) {
            // Don't throw here — callers will receive a clear error if they try to use the service.
            console.warn('⚠️  GROQ_API_KEY not configured. AI features will be disabled.');
            this.groq = null;
            this.isConfigured = false;
            return;
        }

        try {
            this.groq = new Groq({ apiKey });
            this.isConfigured = true;
            console.log('✅ AI Service (Groq) initialized successfully');
        } catch (error) {
            this.groq = null;
            this.isConfigured = false;
            console.error('❌ Failed to initialize AI Service:', error?.message || error);
        }
    }

    /**
     * Get Groq client instance
     * @throws {Error} If AI service is not configured
     */
    getClient() {
        // Attempt lazy initialization in case dotenv wasn't loaded at import-time
        if (!this.isConfigured || !this.groq) {
            this.initialize();
        }

        if (!this.isConfigured || !this.groq) {
            throw new Error('AI service not configured. Please set GROQ_API_KEY in your .env or environment and restart the server.');
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
        // Prefer an explicit GROQ_MODEL; fallback to a supported Llama 3.3 model
        return process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
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

// Do NOT initialize here — server.js will call initialize() after dotenv.config() loads
// This ensures environment variables are properly available before Groq client is created.

export default aiService;
