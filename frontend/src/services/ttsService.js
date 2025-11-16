/**
 * Text-to-Speech Service
 * Uses browser's Web Speech API for free TTS
 */
class TTSService {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.currentUtterance = null;
    this.isSpeaking = false;
    this.isPaused = false;
    this.defaultSettings = {
      rate: 1.0, // Speed (0.1 to 10)
      pitch: 1.0, // Pitch (0 to 2)
      volume: 1.0, // Volume (0 to 1)
      lang: 'en-US',
      voice: null
    };
  }

  /**
   * Get available voices
   */
  getVoices() {
    return new Promise((resolve) => {
      let voices = this.synthesis.getVoices();

      if (voices.length > 0) {
        resolve(voices);
      } else {
        // Chrome loads voices asynchronously
        this.synthesis.onvoiceschanged = () => {
          voices = this.synthesis.getVoices();
          resolve(voices);
        };
      }
    });
  }

  /**
   * Get default voice for language
   */
  async getDefaultVoice(lang = 'en-US') {
    const voices = await this.getVoices();

    // Try to find a voice that matches the language
    const matchingVoice = voices.find(voice => voice.lang === lang);

    if (matchingVoice) {
      return matchingVoice;
    }

    // Fallback to first voice matching language code
    const langCode = lang.split('-')[0];
    const fallbackVoice = voices.find(voice => voice.lang.startsWith(langCode));

    return fallbackVoice || voices[0];
  }

  /**
   * Speak text
   */
  async speak(text, settings = {}) {
    return new Promise(async (resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error('Text-to-speech not supported in this browser'));
        return;
      }

      // Stop any current speech
      this.stop();

      // Create utterance
      this.currentUtterance = new SpeechSynthesisUtterance(text);

      // Apply settings
      const config = { ...this.defaultSettings, ...settings };
      this.currentUtterance.rate = config.rate;
      this.currentUtterance.pitch = config.pitch;
      this.currentUtterance.volume = config.volume;
      this.currentUtterance.lang = config.lang;

      // Set voice
      if (config.voice) {
        this.currentUtterance.voice = config.voice;
      } else {
        const defaultVoice = await this.getDefaultVoice(config.lang);
        if (defaultVoice) {
          this.currentUtterance.voice = defaultVoice;
        }
      }

      // Event handlers
      this.currentUtterance.onstart = () => {
        this.isSpeaking = true;
        this.isPaused = false;
        console.log('🔊 TTS started');
      };

      this.currentUtterance.onend = () => {
        this.isSpeaking = false;
        this.isPaused = false;
        console.log('🔊 TTS ended');
        resolve({ success: true });
      };

      this.currentUtterance.onerror = (error) => {
        this.isSpeaking = false;
        this.isPaused = false;
        console.error('TTS error:', error);
        reject(error);
      };

      this.currentUtterance.onpause = () => {
        this.isPaused = true;
      };

      this.currentUtterance.onresume = () => {
        this.isPaused = false;
      };

      // Speak
      this.synthesis.speak(this.currentUtterance);
    });
  }

  /**
   * Stop speaking
   */
  stop() {
    if (this.synthesis.speaking || this.synthesis.pending) {
      this.synthesis.cancel();
      this.isSpeaking = false;
      this.isPaused = false;
      console.log('🔊 TTS stopped');
    }
  }

  /**
   * Pause speaking
   */
  pause() {
    if (this.synthesis.speaking && !this.synthesis.paused) {
      this.synthesis.pause();
      console.log('🔊 TTS paused');
    }
  }

  /**
   * Resume speaking
   */
  resume() {
    if (this.synthesis.paused) {
      this.synthesis.resume();
      console.log('🔊 TTS resumed');
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isSpeaking: this.isSpeaking,
      isPaused: this.isPaused,
      speaking: this.synthesis.speaking,
      pending: this.synthesis.pending,
      paused: this.synthesis.paused
    };
  }

  /**
   * Set default settings
   */
  setDefaultSettings(settings) {
    Object.assign(this.defaultSettings, settings);
  }

  /**
   * Check if TTS is supported
   */
  isSupported() {
    return 'speechSynthesis' in window;
  }

  /**
   * Split long text into chunks (for better performance)
   */
  splitTextIntoChunks(text, maxLength = 200) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length <= maxLength) {
        currentChunk += sentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Speak long text in chunks
   */
  async speakLongText(text, settings = {}) {
    const chunks = this.splitTextIntoChunks(text);

    for (let i = 0; i < chunks.length; i++) {
      await this.speak(chunks[i], settings);
    }
  }

  /**
   * Get recommended voices for different use cases
   */
  async getRecommendedVoices() {
    const voices = await this.getVoices();

    const recommendations = {
      english: voices.filter(v => v.lang.startsWith('en')),
      female: voices.filter(v => v.name.toLowerCase().includes('female')),
      male: voices.filter(v => v.name.toLowerCase().includes('male')),
      highQuality: voices.filter(v => !v.localService), // Cloud-based voices
      local: voices.filter(v => v.localService)
    };

    return recommendations;
  }
}

export default new TTSService();
