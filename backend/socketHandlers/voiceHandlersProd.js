/**
 * Production Voice Handlers with Job Queue Integration
 * Handles all voice-related Socket.IO events with rate limiting
 * CRITICAL: Audio is streamed to MinIO, never stored in memory
 */

import { socketRateLimiter } from '../middleware/rateLimiterProd.js';
import { addSTTJob, addAIJob } from '../queues/index.js';
import audioStorage from '../services/audioStorage.js';
import VoiceSession from '../models/VoiceSession.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import logger from '../config/logger.js';
import { sanitizeText } from '../middleware/securityProd.js';

/**
 * Register all voice-related Socket.IO event handlers
 * @param {Server} io - Socket.IO server instance
 */
export function registerVoiceHandlers(io) {
  io.on('connection', (socket) => {
    const userId = socket.userId;

    // Create rate limiter for this socket
    const checkRateLimit = socketRateLimiter(socket);

    logger.info('Voice handlers registered for socket', {
      socketId: socket.id,
      userId
    });

    /**
     * Event: voice:join
     * User joins a voice session
     */
    socket.on('voice:join', async (data) => {
      // Check rate limit
      if (!(await checkRateLimit('voice:join'))) return;

      try {
        const { language = 'en-US' } = data;

        logger.info('Voice session join requested', {
          socketId: socket.id,
          userId,
          language
        });

        // Find or create active voice session
        let session = await VoiceSession.findActiveSession(userId);

        if (!session) {
          session = new VoiceSession({
            userId,
            language,
            settings: {
              sttMode: 'auto',
              ttsEnabled: true,
              autoSpeak: true,
              language
            }
          });
          await session.save();

          logger.logSessionStart(userId, session._id.toString(), session.settings);
        }

        // Join session room
        socket.join(`session:${session._id}`);

        // Emit session started event
        socket.emit('voice:session-started', {
          sessionId: session._id.toString(),
          settings: session.settings,
          status: session.status
        });

        logger.info('Voice session started', {
          sessionId: session._id.toString(),
          userId
        });
      } catch (error) {
        logger.error('Error joining voice session', {
          error: error.message,
          stack: error.stack,
          userId
        });

        socket.emit('voice:error', {
          error: 'Failed to join voice session. Please try again.'
        });
      }
    });

    /**
     * Event: voice:audio-chunk
     * Receive and store audio chunks to MinIO
     * NEVER store in server memory!
     */
    socket.on('voice:audio-chunk', async (data) => {
      // Check rate limit
      if (!(await checkRateLimit('voice:audio-chunk'))) return;

      try {
        const { sessionId, audioChunk, chunkIndex, isLastChunk } = data;

        if (!sessionId || !audioChunk) {
          return socket.emit('voice:error', {
            error: 'Invalid audio chunk data'
          });
        }

        logger.debug('Audio chunk received', {
          sessionId,
          chunkIndex,
          size: audioChunk.length,
          isLast: isLastChunk
        });

        // Convert to Buffer if needed
        const buffer = Buffer.isBuffer(audioChunk)
          ? audioChunk
          : Buffer.from(audioChunk);

        // Store chunk immediately to MinIO (NEVER in memory!)
        await audioStorage.storeAudioChunk(sessionId, buffer, chunkIndex);

        // If this is the last chunk, queue STT job
        if (isLastChunk) {
          logger.info('Last audio chunk received, queuing STT job', {
            sessionId,
            userId
          });

          // Queue STT transcription job
          await addSTTJob({
            sessionId,
            userId,
            socketId: socket.id
          });

          // Emit processing status
          socket.emit('voice:processing', {
            sessionId,
            status: 'Transcribing audio...',
            progress: 0
          });
        }
      } catch (error) {
        logger.error('Error processing audio chunk', {
          error: error.message,
          stack: error.stack,
          userId
        });

        socket.emit('voice:error', {
          error: 'Failed to process audio. Please try again.'
        });
      }
    });

    /**
     * Event: voice:text-message
     * Handle text messages (from browser STT fallback)
     */
    socket.on('voice:text-message', async (data) => {
      // Check rate limit
      if (!(await checkRateLimit('voice:text-message'))) return;

      try {
        const { sessionId, text } = data;

        if (!sessionId || !text || text.trim().length === 0) {
          return socket.emit('voice:error', {
            error: 'Invalid message data'
          });
        }

        // Sanitize text input
        const sanitizedText = sanitizeText(text);

        if (sanitizedText.trim().length === 0) {
          return socket.emit('voice:error', {
            error: 'Message contains invalid content'
          });
        }

        if (sanitizedText.length > 5000) {
          return socket.emit('voice:error', {
            error: 'Message too long (max 5000 characters)'
          });
        }

        logger.info('Text message received from browser STT', {
          sessionId,
          userId,
          textLength: sanitizedText.length
        });

        // Find voice session
        const session = await VoiceSession.findById(sessionId);

        if (!session) {
          return socket.emit('voice:error', {
            error: 'Voice session not found'
          });
        }

        // Find or create conversation
        let conversation;
        if (session.conversationId) {
          conversation = await Conversation.findById(session.conversationId);
        }

        if (!conversation) {
          logger.info('Creating new conversation for voice session', {
            sessionId,
            userId
          });

          conversation = new Conversation({
            user: userId,
            title: `Voice Chat - ${new Date().toLocaleString()}`,
            metadata: {
              isVoiceSession: true,
              sessionId: session._id,
              language: session.language
            }
          });
          await conversation.save();

          session.conversationId = conversation._id;
          await session.save();
        }

        // Save user message
        const userMessage = new Message({
          conversation: conversation._id,
          user: userId,
          role: 'user',
          content: sanitizedText,
          metadata: {
            isVoice: true,
            sttProvider: 'browser'
          }
        });
        await userMessage.save();

        // Update conversation
        await conversation.incrementMessageCount();

        // Update session metadata
        await session.updateMetadata({
          totalMessages: session.metadata.totalMessages + 1,
          sttProvider: 'browser'
        });

        logger.info('User message saved, queuing AI job', {
          sessionId,
          conversationId: conversation._id.toString(),
          userId
        });

        // Queue AI response generation job
        await addAIJob({
          conversationId: conversation._id.toString(),
          userId,
          message: sanitizedText,
          socketId: socket.id
        });

        // Emit processing status
        socket.emit('voice:processing', {
          sessionId,
          status: 'Generating AI response...',
          progress: 0
        });
      } catch (error) {
        logger.error('Error processing text message', {
          error: error.message,
          stack: error.stack,
          userId
        });

        socket.emit('voice:error', {
          error: 'Failed to process message. Please try again.'
        });
      }
    });

    /**
     * Event: voice:tts-complete
     * Client notifies that TTS playback is complete
     */
    socket.on('voice:tts-complete', async (data) => {
      // Check rate limit
      if (!(await checkRateLimit('voice:tts-complete'))) return;

      try {
        const { sessionId } = data;

        if (!sessionId) {
          return socket.emit('voice:error', {
            error: 'Invalid session ID'
          });
        }

        logger.debug('TTS playback complete', {
          sessionId,
          userId
        });

        // Find session
        const session = await VoiceSession.findById(sessionId);

        if (session) {
          // Update session state
          session.isProcessing = false;
          session.lastActivityAt = new Date();
          await session.save();
        }

        // Emit ready event
        socket.emit('voice:ready', {
          sessionId
        });
      } catch (error) {
        logger.error('Error handling TTS complete', {
          error: error.message,
          stack: error.stack,
          userId
        });

        // Don't emit error - this is not critical
      }
    });

    /**
     * Event: voice:leave
     * User leaves voice session
     */
    socket.on('voice:leave', async (data) => {
      // Check rate limit
      if (!(await checkRateLimit('voice:leave'))) return;

      try {
        const { sessionId } = data;

        if (!sessionId) {
          return;
        }

        logger.info('Voice session leave requested', {
          sessionId,
          userId
        });

        // Find session
        const session = await VoiceSession.findById(sessionId);

        if (session) {
          // End session
          await session.endSession();

          // Leave session room
          socket.leave(`session:${sessionId}`);

          logger.logSessionEnd(userId, sessionId, session.metadata);

          // Emit ended event
          socket.emit('voice:ended', {
            sessionId,
            duration: session.metadata.totalDuration,
            messages: session.metadata.totalMessages
          });
        }
      } catch (error) {
        logger.error('Error leaving voice session', {
          error: error.message,
          stack: error.stack,
          userId
        });

        socket.emit('voice:error', {
          error: 'Failed to leave session'
        });
      }
    });

    /**
     * Event: voice:settings-update
     * Update voice session settings
     */
    socket.on('voice:settings-update', async (data) => {
      // Check rate limit
      if (!(await checkRateLimit('voice:settings-update'))) return;

      try {
        const { sessionId, settings } = data;

        if (!sessionId || !settings) {
          return socket.emit('voice:error', {
            error: 'Invalid settings data'
          });
        }

        logger.info('Settings update requested', {
          sessionId,
          userId,
          settings
        });

        // Find session
        const session = await VoiceSession.findById(sessionId);

        if (!session) {
          return socket.emit('voice:error', {
            error: 'Voice session not found'
          });
        }

        // Update settings
        await session.updateSettings(settings);

        logger.info('Settings updated', {
          sessionId,
          userId,
          newSettings: session.settings
        });

        // Emit confirmation
        socket.emit('voice:settings-updated', {
          sessionId,
          settings: session.settings
        });
      } catch (error) {
        logger.error('Error updating settings', {
          error: error.message,
          stack: error.stack,
          userId
        });

        socket.emit('voice:error', {
          error: 'Failed to update settings'
        });
      }
    });
  });

  logger.info('Voice handlers registered successfully');
}

export default registerVoiceHandlers;
