import voiceOrchestrator from '../services/voiceOrchestrator.js';
import Session from '../models/Session.js';
import { emitToUser } from '../config/socket.js';

/**
 * WebSocket handlers for voice sessions
 */
export const registerVoiceHandlers = (io) => {
  io.on('connection', (socket) => {
    const userId = socket.userId;

    /**
     * Join voice session
     */
    socket.on('voice:join', async (data) => {
      try {
        const { sessionId, settings } = data;

        let session;
        if (sessionId) {
          session = await Session.findById(sessionId);
          if (!session || session.userId.toString() !== userId) {
            socket.emit('voice:error', { error: 'Invalid session' });
            return;
          }
        } else {
          // Initialize new session
          session = await voiceOrchestrator.initializeSession(userId, null, settings);
        }

        // Join session room
        socket.join(`session:${session._id}`);

        socket.emit('voice:joined', {
          sessionId: session._id,
          status: session.status,
          settings: session.settings,
          voiceState: session.voiceState
        });

        console.log(`👤 User ${userId} joined voice session ${session._id}`);
      } catch (error) {
        console.error('Error joining voice session:', error);
        socket.emit('voice:error', { error: error.message });
      }
    });

    /**
     * Start recording
     */
    socket.on('voice:start-recording', async (data) => {
      try {
        const { sessionId } = data;

        const session = await Session.findById(sessionId);
        if (!session || session.userId.toString() !== userId) {
          socket.emit('voice:error', { error: 'Invalid session' });
          return;
        }

        await session.updateVoiceState({
          isRecording: true,
          isProcessing: false,
          isSpeaking: false
        });

        socket.emit('voice:recording-started', { sessionId });
        console.log(`🎤 Recording started for session ${sessionId}`);
      } catch (error) {
        console.error('Error starting recording:', error);
        socket.emit('voice:error', { error: error.message });
      }
    });

    /**
     * Stop recording and process audio
     */
    socket.on('voice:stop-recording', async (data) => {
      try {
        const { sessionId, audioBlob, metadata } = data;

        const session = await Session.findById(sessionId);
        if (!session || session.userId.toString() !== userId) {
          socket.emit('voice:error', { error: 'Invalid session' });
          return;
        }

        await session.updateVoiceState({
          isRecording: false
        });

        socket.emit('voice:recording-stopped', { sessionId });
        console.log(`🎤 Recording stopped for session ${sessionId}`);

        // If audio data is provided, process it
        if (audioBlob) {
          // Convert base64 to buffer if needed
          let audioBuffer;
          if (typeof audioBlob === 'string') {
            // Remove data URL prefix if present
            const base64Data = audioBlob.replace(/^data:audio\/\w+;base64,/, '');
            audioBuffer = Buffer.from(base64Data, 'base64');
          } else {
            audioBuffer = audioBlob;
          }

          // Process voice input
          const result = await voiceOrchestrator.processVoiceInput(
            sessionId,
            audioBuffer,
            metadata
          );

          // Log result based on mode
          if (result.useBrowserSTT) {
            console.log(`⚡ ${result.message || 'Switched to browser STT mode'}`);
          } else if (result.transcription) {
            console.log(`✅ Voice processed: "${result.transcription}"`);
          }
        }
      } catch (error) {
        console.error('Error stopping recording:', error);
        socket.emit('voice:error', { error: error.message });
      }
    });

    /**
     * Send audio chunk (for streaming processing)
     */
    socket.on('voice:audio-chunk', async (data) => {
      try {
        const { sessionId, chunk, isLast, metadata } = data;

        const session = await Session.findById(sessionId);
        if (!session || session.userId.toString() !== userId) {
          socket.emit('voice:error', { error: 'Invalid session' });
          return;
        }

        // Store chunks in socket for accumulation
        if (!socket.audioChunks) {
          socket.audioChunks = [];
        }

        socket.audioChunks.push(chunk);

        // If this is the last chunk, process accumulated audio
        if (isLast) {
          const completeAudio = Buffer.concat(socket.audioChunks);
          socket.audioChunks = []; // Clear chunks

          // Process voice input
          const result = await voiceOrchestrator.processVoiceInput(
            sessionId,
            completeAudio,
            metadata
          );

          console.log(`✅ Streaming voice processed: "${result.transcription}"`);
        }
      } catch (error) {
        console.error('Error processing audio chunk:', error);
        socket.emit('voice:error', { error: error.message });
      }
    });

    /**
     * Send text message (alternative to voice)
     */
    socket.on('voice:text-message', async (data) => {
      try {
        const { sessionId, text } = data;

        const session = await Session.findById(sessionId);
        if (!session || session.userId.toString() !== userId) {
          socket.emit('voice:error', { error: 'Invalid session' });
          return;
        }

        // Emit transcription event (simulating STT)
        emitToUser(userId, 'voice:transcribed', {
          sessionId,
          text,
          language: session.settings.language
        });

        // Process as if it were voice input (without STT step)
        const response = await voiceOrchestrator.generateAIResponse(
          session.conversationId,
          text,
          session.context
        );

        // Save messages, update metrics, etc.
        const Message = (await import('../models/Message.js')).default;

        const userMessage = new Message({
          conversation: session.conversationId,
          user: session.userId,
          role: 'user',
          content: text,
          metadata: { isVoice: false }
        });
        await userMessage.save();

        const aiMessage = new Message({
          conversation: session.conversationId,
          user: session.userId,
          role: 'assistant',
          content: response.text,
          metadata: {
            model: response.model,
            tokensUsed: response.tokensUsed
          }
        });
        await aiMessage.save();

        // Update metrics
        await session.updateMetrics({
          messageCount: session.metrics.messageCount + 2,
          textMessageCount: session.metrics.textMessageCount + 1
        });

        // Emit response
        emitToUser(userId, 'voice:response', {
          sessionId,
          text: response.text,
          messageId: aiMessage._id,
          shouldSpeak: session.settings.ttsEnabled,
          metadata: {
            model: response.model,
            tokensUsed: response.tokensUsed
          }
        });
      } catch (error) {
        console.error('Error processing text message:', error);
        socket.emit('voice:error', { error: error.message });
      }
    });

    /**
     * TTS complete (client finished speaking)
     */
    socket.on('voice:tts-complete', async (data) => {
      try {
        const { sessionId } = data;

        const session = await Session.findById(sessionId);
        if (!session) return;

        await session.updateVoiceState({
          isSpeaking: false
        });

        socket.emit('voice:ready', { sessionId });
      } catch (error) {
        console.error('Error handling TTS complete:', error);
      }
    });

    /**
     * Leave voice session
     */
    socket.on('voice:leave', async (data) => {
      try {
        const { sessionId } = data;

        const session = await Session.findById(sessionId);
        if (!session || session.userId.toString() !== userId) {
          return;
        }

        // Leave session room
        socket.leave(`session:${sessionId}`);

        // Update session state
        await session.updateVoiceState({
          isRecording: false,
          isSpeaking: false,
          isProcessing: false
        });

        socket.emit('voice:left', { sessionId });
        console.log(`👤 User ${userId} left voice session ${sessionId}`);
      } catch (error) {
        console.error('Error leaving voice session:', error);
      }
    });

    /**
     * End voice session
     */
    socket.on('voice:end', async (data) => {
      try {
        const { sessionId } = data;

        const session = await Session.findById(sessionId);
        if (!session || session.userId.toString() !== userId) {
          socket.emit('voice:error', { error: 'Invalid session' });
          return;
        }

        await voiceOrchestrator.endSession(sessionId);

        socket.leave(`session:${sessionId}`);
        console.log(`🏁 Voice session ${sessionId} ended`);
      } catch (error) {
        console.error('Error ending voice session:', error);
        socket.emit('voice:error', { error: error.message });
      }
    });
  });
};

export default registerVoiceHandlers;
