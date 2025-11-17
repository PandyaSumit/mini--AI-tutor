import axios from 'axios';
import FormData from 'form-data';

/**
 * Speech-to-Text Service with Multiple FREE Providers
 * Fallback chain: Hugging Face (Free) → OpenAI Whisper → Browser API
 */
class STTService {
    constructor() {
        // Read API keys at call time to avoid import-order issues
        this.openaiModel = 'whisper-1';
        this.openaiUrl = 'https://api.openai.com/v1/audio/transcriptions';
        this.hfModel = 'openai/whisper-large-v3';
        // Updated to new HF Inference router endpoint (Nov 2024)
        this.hfUrl = 'https://api-inference.huggingface.co/models/openai/whisper-large-v3';
    }

    /**
     * Get available providers
     */
    getProviders() {
        const providers = [];

        // Check Hugging Face
        const hfKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
        if (hfKey) {
            providers.push('huggingface');
        }

        // Check OpenAI
        const openaiKey = process.env.OPENAI_API_KEY;
        if (openaiKey) {
            providers.push('openai');
        }

        // Browser is always available as fallback
        providers.push('browser');

        return providers;
    }

    /**
     * Transcribe audio with automatic fallback
     * @param {Buffer} audioBuffer - Audio file buffer
     * @param {string} language - Language code (e.g., 'en', 'es')
     * @returns {Promise<{text: string, language: string, provider: string}>}
     */
    async transcribe(audioBuffer, language = 'en') {
        const providers = this.getProviders();
        const errors = [];

        console.log(`🎤 STT providers available: ${providers.join(' → ')}`);

        // If only browser is available, return immediately
        if (providers.length === 1 && providers[0] === 'browser') {
            console.log('⚡ No server-side STT configured, using browser STT immediately');
            return {
                text: null,
                language,
                provider: 'browser',
                useBrowserSTT: true,
                fallbackInstructions: this.getFallbackInstructions(),
                errors: []
            };
        }

        // Try Hugging Face first (Free!)
        if (providers.includes('huggingface')) {
            try {
                console.log('🔄 Trying Hugging Face STT (Free)...');
                const result = await this.transcribeWithHuggingFace(audioBuffer, language);
                console.log('✅ Hugging Face STT succeeded');
                return { ...result, provider: 'huggingface' };
            } catch (error) {
                console.warn('⚠️ Hugging Face STT failed:', error.message);
                errors.push({ provider: 'huggingface', error: error.message });
            }
        }

        // Try OpenAI Whisper (if configured)
        if (providers.includes('openai')) {
            try {
                console.log('🔄 Trying OpenAI Whisper STT...');
                const result = await this.transcribeWithOpenAI(audioBuffer, language);
                console.log('✅ OpenAI Whisper STT succeeded');
                return { ...result, provider: 'openai' };
            } catch (error) {
                console.warn('⚠️ OpenAI Whisper STT failed:', error.message);
                errors.push({ provider: 'openai', error: error.message });
            }
        }

        // All server-side options failed, suggest browser STT
        console.log('⚠️ All server-side STT options failed, suggesting browser STT');
        return {
            text: null,
            language,
            provider: 'browser',
            useBrowserSTT: true,
            fallbackInstructions: this.getFallbackInstructions(),
            errors
        };
    }

    /**
     * Transcribe using Hugging Face Inference API (FREE!)
     */
    async transcribeWithHuggingFace(audioBuffer, language = 'en') {
        const hfKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;

        if (!hfKey) {
            throw new Error('Hugging Face API key not configured');
        }

        try {
            const response = await axios.post(this.hfUrl, audioBuffer, {
                headers: {
                    'Authorization': `Bearer ${hfKey}`,
                    'Content-Type': 'audio/webm'
                },
                timeout: 20000 // 20 seconds (faster fallback)
            });

            // HF returns: { text: "transcribed text" }
            const text = response.data.text || response.data;

            return {
                text: typeof text === 'string' ? text : JSON.stringify(text),
                language: language
            };
        } catch (error) {
            // Check if model is loading
            if (error.response?.status === 503) {
                throw new Error('Model is loading, please try again in 10-20 seconds');
            }

            // Check quota
            if (error.response?.status === 429) {
                throw new Error('Hugging Face rate limit exceeded');
            }

            console.error('Hugging Face STT Error:', error.response?.data || error.message);
            throw new Error(`Hugging Face STT failed: ${error.message}`);
        }
    }

    /**
     * Transcribe using OpenAI Whisper API
     */
    async transcribeWithOpenAI(audioBuffer, language = 'en') {
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        try {
            // Create form data
            const formData = new FormData();
            formData.append('file', audioBuffer, {
                filename: 'audio.webm',
                contentType: 'audio/webm'
            });
            formData.append('model', this.openaiModel);
            formData.append('language', language);
            formData.append('response_format', 'json');

            // Call Whisper API
            const response = await axios.post(this.openaiUrl, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${apiKey}`
                },
                timeout: 15000 // 15 seconds (faster fallback)
            });

            return {
                text: response.data.text,
                language: response.data.language || language
            };
        } catch (error) {
            // Check for quota error
            if (error.response?.data?.error?.code === 'insufficient_quota') {
                throw new Error('OpenAI quota exceeded');
            }

            // Check rate limit
            if (error.response?.status === 429) {
                throw new Error('OpenAI rate limit exceeded');
            }

            console.error('OpenAI STT Error:', error.response?.data || error.message);
            throw new Error(`OpenAI STT failed: ${error.message}`);
        }
    }

    /**
     * Transcribe with timestamp segments (for detailed analysis)
     */
    async transcribeWithTimestamps(audioBuffer, language = 'en') {
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            throw new Error('Timestamps only available with OpenAI API key');
        }

        try {
            const formData = new FormData();
            formData.append('file', audioBuffer, {
                filename: 'audio.webm',
                contentType: 'audio/webm'
            });
            formData.append('model', this.openaiModel);
            formData.append('language', language);
            formData.append('response_format', 'verbose_json');
            formData.append('timestamp_granularities', 'segment');

            const response = await axios.post(this.openaiUrl, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${apiKey}`
                },
                timeout: 30000
            });

            return {
                text: response.data.text,
                language: response.data.language,
                segments: response.data.segments || [],
                provider: 'openai'
            };
        } catch (error) {
            console.error('STT with timestamps error:', error.response?.data || error.message);
            throw new Error(`STT failed: ${error.message}`);
        }
    }

    /**
     * Browser-based fallback STT (client-side Web Speech API)
     */
    getFallbackInstructions() {
        return {
            useBrowserSTT: true,
            message: 'Use Web Speech API on client side (100% FREE)',
            instructions: 'All server-side STT providers are unavailable. Use browser-based speech recognition.',
            example: `
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');
          // Send transcript to backend via WebSocket
        };

        recognition.start();
      `
        };
    }
}

export default new STTService();
