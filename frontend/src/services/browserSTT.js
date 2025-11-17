/**
 * Browser-based Speech Recognition Service (Client-Side STT)
 * Uses Web Speech API - completely FREE, no API key needed!
 */
class BrowserSTTService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.transcript = '';
    this.interimTranscript = '';
  }

  /**
   * Check if browser supports Speech Recognition
   */
  isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * Initialize speech recognition
   */
  initialize(options = {}) {
    if (!this.isSupported()) {
      throw new Error('Speech Recognition not supported in this browser');
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    // Configuration
    this.recognition.continuous = options.continuous ?? true;
    this.recognition.interimResults = options.interimResults ?? true;
    this.recognition.lang = options.language || 'en-US';
    this.recognition.maxAlternatives = 1;

    return this.recognition;
  }

  /**
   * Start listening
   */
  start(callbacks = {}) {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        this.initialize();
      }

      this.transcript = '';
      this.interimTranscript = '';
      this.isListening = true;

      // Event handlers
      this.recognition.onstart = () => {
        console.log('🎤 Browser STT: Started listening');
        if (callbacks.onStart) callbacks.onStart();
      };

      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          this.transcript += finalTranscript;
        }

        // Store latest interim transcript
        this.interimTranscript = interimTranscript;

        // Call callbacks
        if (callbacks.onResult) {
          callbacks.onResult({
            transcript: this.transcript + interimTranscript, // Include interim for real-time display
            interimTranscript,
            isFinal: !!finalTranscript
          });
        }
      };

      this.recognition.onerror = (event) => {
        console.error('Browser STT Error:', event.error);
        this.isListening = false;

        if (callbacks.onError) {
          callbacks.onError(event.error);
        }

        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.onend = () => {
        console.log('🎤 Browser STT: Stopped listening');
        this.isListening = false;

        if (callbacks.onEnd) {
          callbacks.onEnd(this.transcript);
        }

        resolve(this.transcript);
      };

      // Start recognition
      try {
        this.recognition.start();
      } catch (error) {
        this.isListening = false;
        reject(error);
      }
    });
  }

  /**
   * Stop listening
   */
  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
    // Include any pending interim results in the final transcript
    const finalTranscript = this.transcript + (this.interimTranscript || '');
    console.log('🎤 Browser STT stop() returning:', finalTranscript);
    return finalTranscript.trim();
  }

  /**
   * Abort listening
   */
  abort() {
    if (this.recognition && this.isListening) {
      this.recognition.abort();
      this.isListening = false;
    }
  }

  /**
   * Get current transcript
   */
  getTranscript() {
    return this.transcript;
  }

  /**
   * Reset transcript
   */
  reset() {
    this.transcript = '';
    this.interimTranscript = '';
  }
}

export default new BrowserSTTService();
