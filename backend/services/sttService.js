import axios from 'axios';
import FormData from 'form-data';

/**
 * Speech-to-Text Service using OpenAI Whisper API
 * Free tier: Limited requests, use wisely
 */
class STTService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = 'whisper-1';
    this.apiUrl = 'https://api.openai.com/v1/audio/transcriptions';
  }

  /**
   * Transcribe audio buffer to text
   * @param {Buffer} audioBuffer - Audio file buffer
   * @param {string} language - Language code (e.g., 'en', 'es')
   * @returns {Promise<{text: string, language: string}>}
   */
  async transcribe(audioBuffer, language = 'en') {
    try {
      if (!this.apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', audioBuffer, {
        filename: 'audio.webm',
        contentType: 'audio/webm'
      });
      formData.append('model', this.model);
      formData.append('language', language);
      formData.append('response_format', 'json');

      // Call Whisper API
      const response = await axios.post(this.apiUrl, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: 30000 // 30 seconds
      });

      return {
        text: response.data.text,
        language: response.data.language || language
      };
    } catch (error) {
      console.error('STT Error:', error.response?.data || error.message);

      // Fallback: return empty transcript
      if (error.response?.status === 429) {
        throw new Error('STT rate limit exceeded. Please try again later.');
      }

      throw new Error(`STT failed: ${error.message}`);
    }
  }

  /**
   * Transcribe with timestamp segments (for detailed analysis)
   * @param {Buffer} audioBuffer
   * @param {string} language
   * @returns {Promise<{text: string, segments: Array}>}
   */
  async transcribeWithTimestamps(audioBuffer, language = 'en') {
    try {
      if (!this.apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const formData = new FormData();
      formData.append('file', audioBuffer, {
        filename: 'audio.webm',
        contentType: 'audio/webm'
      });
      formData.append('model', this.model);
      formData.append('language', language);
      formData.append('response_format', 'verbose_json');
      formData.append('timestamp_granularities', 'segment');

      const response = await axios.post(this.apiUrl, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: 30000
      });

      return {
        text: response.data.text,
        language: response.data.language,
        segments: response.data.segments || []
      };
    } catch (error) {
      console.error('STT with timestamps error:', error.response?.data || error.message);
      throw new Error(`STT failed: ${error.message}`);
    }
  }

  /**
   * Browser-based fallback STT (client-side Web Speech API)
   * This is returned as instructions to client
   */
  getFallbackInstructions() {
    return {
      useBrowserSTT: true,
      message: 'Use Web Speech API on client side',
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
