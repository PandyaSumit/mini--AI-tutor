import io from 'socket.io-client';
import AudioRecorder from './audioRecorder';
import ttsService from './ttsService';

/**
 * Voice WebSocket Service
 * Manages WebSocket connection for voice sessions
 */
class VoiceWebSocket {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.sessionId = null;
    this.audioRecorder = new AudioRecorder();
    this.eventHandlers = new Map();
  }

  /**
   * Connect to WebSocket server
   */
  connect(token) {
    return new Promise((resolve, reject) => {
      const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:5000';

      this.socket = io(wsUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      // Connection events
      this.socket.on('connect', () => {
        console.log('✅ Connected to voice WebSocket');
        this.isConnected = true;
        resolve(this.socket);
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error);
        this.isConnected = false;
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected:', reason);
        this.isConnected = false;
        this.emit('disconnected', { reason });
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
        this.emit('reconnected', { attemptNumber });
      });

      // Voice events
      this.setupVoiceEventHandlers();
    });
  }

  /**
   * Setup voice event handlers
   */
  setupVoiceEventHandlers() {
    // Session joined
    this.socket.on('voice:joined', (data) => {
      console.log('🎙️ Joined voice session:', data);
      this.sessionId = data.sessionId;
      this.emit('session-joined', data);
    });

    // Recording started
    this.socket.on('voice:recording-started', (data) => {
      console.log('🎤 Recording started');
      this.emit('recording-started', data);
    });

    // Recording stopped
    this.socket.on('voice:recording-stopped', (data) => {
      console.log('🎤 Recording stopped');
      this.emit('recording-stopped', data);
    });

    // Voice processing status
    this.socket.on('voice:processing', (data) => {
      console.log('⚙️ Processing:', data.status);
      this.emit('processing', data);
    });

    // Transcription received
    this.socket.on('voice:transcribed', (data) => {
      console.log('📝 Transcribed:', data.text);
      this.emit('transcribed', data);
    });

    // AI response received
    this.socket.on('voice:response', async (data) => {
      console.log('🤖 AI Response:', data.text);
      this.emit('response', data);

      // Automatically speak if TTS is enabled
      if (data.shouldSpeak) {
        console.log('🔊 Starting TTS for AI response...');
        this.emit('tts-started'); // Notify UI that TTS started
        try {
          const result = await ttsService.speak(data.text);
          console.log('✅ TTS completed:', result);
          this.emit('tts-ended'); // Notify UI that TTS ended
          this.notifyTTSComplete();
        } catch (error) {
          console.error('❌ TTS error:', error);
          this.emit('tts-ended'); // Notify UI even on error
          // Notify server that TTS failed but don't break the flow
          this.notifyTTSComplete();
        }
      } else {
        console.log('🔇 TTS disabled, skipping speech');
        // Immediately notify ready if TTS is disabled
        this.notifyTTSComplete();
      }
    });

    // Session ready for next input
    this.socket.on('voice:ready', (data) => {
      console.log('✅ Ready for next input');
      this.emit('ready', data);
    });

    // Session ended
    this.socket.on('voice:ended', (data) => {
      console.log('🏁 Session ended');
      this.emit('session-ended', data);
    });

    // Voice left
    this.socket.on('voice:left', (data) => {
      console.log('👋 Left session');
      this.sessionId = null;
      this.emit('session-left', data);
    });

    // Browser STT fallback notification
    this.socket.on('voice:use-browser-stt', (data) => {
      console.log('⚡ Switching to browser STT mode:', data.message);
      this.emit('use-browser-stt', data);
    });

    // Errors
    this.socket.on('voice:error', (data) => {
      console.error('❌ Voice error:', data.error);
      this.emit('error', data);
    });
  }

  /**
   * Join voice session
   */
  async joinSession(sessionId = null, settings = {}) {
    if (!this.isConnected) {
      throw new Error('Not connected to WebSocket');
    }

    this.socket.emit('voice:join', {
      sessionId,
      settings: {
        voiceEnabled: true,
        autoTranscribe: true,
        ttsEnabled: true,
        language: 'en-US',
        ...settings
      }
    });
  }

  /**
   * Start recording
   */
  async startRecording() {
    if (!this.sessionId) {
      throw new Error('Not in a session');
    }

    // Start local recording
    await this.audioRecorder.startRecording();

    // Notify server
    this.socket.emit('voice:start-recording', {
      sessionId: this.sessionId
    });
  }

  /**
   * Stop recording and send audio
   */
  async stopRecording() {
    if (!this.sessionId) {
      throw new Error('Not in a session');
    }

    // Stop local recording
    const result = await this.audioRecorder.stopRecording();

    // Convert to base64
    const base64Audio = await AudioRecorder.blobToBase64(result.blob);

    // Send to server
    this.socket.emit('voice:stop-recording', {
      sessionId: this.sessionId,
      audioBlob: base64Audio,
      metadata: {
        mimeType: result.mimeType,
        size: result.size,
        duration: result.duration
      }
    });

    return result;
  }

  /**
   * Send text message (alternative to voice)
   */
  sendTextMessage(text) {
    if (!this.sessionId) {
      throw new Error('Not in a session');
    }

    this.socket.emit('voice:text-message', {
      sessionId: this.sessionId,
      text
    });
  }

  /**
   * Notify server that TTS is complete
   */
  notifyTTSComplete() {
    if (!this.sessionId) return;

    this.socket.emit('voice:tts-complete', {
      sessionId: this.sessionId
    });
  }

  /**
   * Leave session
   */
  leaveSession() {
    if (!this.sessionId) return;

    // Stop any ongoing recording
    if (this.audioRecorder.isRecording) {
      this.audioRecorder.cancelRecording();
    }

    // Stop TTS
    ttsService.stop();

    this.socket.emit('voice:leave', {
      sessionId: this.sessionId
    });

    this.sessionId = null;
  }

  /**
   * End session permanently
   */
  endSession() {
    if (!this.sessionId) return;

    // Stop any ongoing recording
    if (this.audioRecorder.isRecording) {
      this.audioRecorder.cancelRecording();
    }

    // Stop TTS
    ttsService.stop();

    this.socket.emit('voice:end', {
      sessionId: this.sessionId
    });

    this.sessionId = null;
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.sessionId) {
      this.leaveSession();
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnected = false;
  }

  /**
   * Event listener
   */
  on(event, callback) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (!this.eventHandlers.has(event)) return;

    const handlers = this.eventHandlers.get(event);
    const index = handlers.indexOf(callback);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Emit event to listeners
   */
  emit(event, data) {
    if (!this.eventHandlers.has(event)) return;

    const handlers = this.eventHandlers.get(event);
    handlers.forEach(callback => callback(data));
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      sessionId: this.sessionId,
      isRecording: this.audioRecorder.isRecording,
      isSpeaking: ttsService.isSpeaking
    };
  }
}

export default new VoiceWebSocket();
