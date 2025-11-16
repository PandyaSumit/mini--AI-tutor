import sttService from './sttService.js';
import Session from '../models/Session.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { emitToUser } from '../config/socket.js';
import aiOrchestrator from './aiOrchestrator.js';

/**
 * Voice AI Orchestrator - Manages voice-based tutoring sessions
 * Handles the complete flow: STT -> AI Processing -> Response
 */
class VoiceOrchestrator {
  constructor() {
    this.activeSessions = new Map(); // sessionId -> session state
  }

  /**
   * Initialize voice session
   */
  async initializeSession(userId, sessionId, settings = {}) {
    try {
      let session = await Session.findById(sessionId);

      if (!session) {
        // Create new session
        session = new Session({
          userId,
          status: 'active',
          sessionType: 'voice',
          settings: {
            voiceEnabled: true,
            autoTranscribe: true,
            ttsEnabled: true,
            language: settings.language || 'en-US',
            ...settings
          }
        });
        await session.save();
      }

      // Store in active sessions
      this.activeSessions.set(session._id.toString(), {
        userId,
        conversationHistory: [],
        isProcessing: false,
        startTime: Date.now()
      });

      await session.addEvent('voice_started', { timestamp: Date.now() });

      return session;
    } catch (error) {
      console.error('Error initializing voice session:', error);
      throw error;
    }
  }

  /**
   * Process voice input (audio buffer)
   */
  async processVoiceInput(sessionId, audioBuffer, metadata = {}) {
    try {
      const session = await Session.findById(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const sessionState = this.activeSessions.get(sessionId.toString());
      if (!sessionState) {
        throw new Error('Session not initialized');
      }

      // Update state: processing
      sessionState.isProcessing = true;
      await session.updateVoiceState({
        isProcessing: true,
        isRecording: false
      });

      // Emit status to user
      emitToUser(session.userId, 'voice:processing', {
        sessionId,
        status: 'transcribing'
      });

      // Step 1: Transcribe audio using STT
      const transcription = await this.transcribeAudio(audioBuffer, session.settings.language);

      if (!transcription.text || transcription.text.trim().length === 0) {
        throw new Error('No speech detected');
      }

      // Emit transcription to user
      emitToUser(session.userId, 'voice:transcribed', {
        sessionId,
        text: transcription.text,
        language: transcription.language
      });

      // Update session
      await session.updateVoiceState({
        lastTranscript: transcription.text
      });

      // Step 2: Get or create conversation
      let conversation = session.conversationId
        ? await Conversation.findById(session.conversationId)
        : null;

      if (!conversation) {
        conversation = new Conversation({
          userId: session.userId,
          title: `Voice Session - ${new Date().toLocaleString()}`,
          context: {
            mode: 'voice',
            language: session.settings.language
          }
        });
        await conversation.save();

        session.conversationId = conversation._id;
        await session.save();
      }

      // Step 3: Save user message
      const userMessage = new Message({
        conversationId: conversation._id,
        role: 'user',
        content: transcription.text,
        metadata: {
          isVoice: true,
          audioMetadata: metadata,
          transcriptionLanguage: transcription.language
        }
      });
      await userMessage.save();

      // Update metrics
      await session.updateMetrics({
        messageCount: session.metrics.messageCount + 1,
        voiceMessageCount: session.metrics.voiceMessageCount + 1
      });

      // Emit status: generating AI response
      emitToUser(session.userId, 'voice:processing', {
        sessionId,
        status: 'thinking'
      });

      // Step 4: Generate AI response
      const aiResponse = await this.generateAIResponse(
        conversation._id,
        transcription.text,
        session.context
      );

      // Step 5: Save AI message
      const aiMessage = new Message({
        conversationId: conversation._id,
        role: 'assistant',
        content: aiResponse.text,
        metadata: {
          model: aiResponse.model,
          thinkingProcess: aiResponse.thinkingProcess,
          tokensUsed: aiResponse.tokensUsed
        }
      });
      await aiMessage.save();

      // Update metrics
      await session.updateMetrics({
        messageCount: session.metrics.messageCount + 1,
        totalTokensUsed: session.metrics.totalTokensUsed + (aiResponse.tokensUsed || 0)
      });

      // Update session state
      sessionState.isProcessing = false;
      sessionState.conversationHistory.push({
        user: transcription.text,
        assistant: aiResponse.text,
        timestamp: Date.now()
      });

      await session.updateVoiceState({
        isProcessing: false,
        isSpeaking: true
      });

      // Step 6: Emit AI response to client (client will handle TTS)
      emitToUser(session.userId, 'voice:response', {
        sessionId,
        text: aiResponse.text,
        messageId: aiMessage._id,
        shouldSpeak: session.settings.ttsEnabled,
        metadata: {
          model: aiResponse.model,
          tokensUsed: aiResponse.tokensUsed
        }
      });

      return {
        transcription: transcription.text,
        response: aiResponse.text,
        messageId: aiMessage._id
      };
    } catch (error) {
      console.error('Error processing voice input:', error);

      // Update session state
      const session = await Session.findById(sessionId);
      if (session) {
        await session.updateVoiceState({
          isProcessing: false,
          isRecording: false,
          isSpeaking: false
        });
      }

      // Emit error to user
      emitToUser(session.userId, 'voice:error', {
        sessionId,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Transcribe audio buffer
   */
  async transcribeAudio(audioBuffer, language = 'en') {
    try {
      // Use OpenAI Whisper for transcription
      const result = await sttService.transcribe(audioBuffer, language);
      return result;
    } catch (error) {
      console.error('Transcription error:', error);

      // If Whisper fails, return fallback instructions
      if (error.message.includes('rate limit')) {
        return {
          text: null,
          useFallback: true,
          fallbackInstructions: sttService.getFallbackInstructions()
        };
      }

      throw error;
    }
  }

  /**
   * Generate AI response using existing AI orchestrator
   */
  async generateAIResponse(conversationId, userMessage, context = {}) {
    try {
      // Get conversation history
      const messages = await Message.find({ conversationId })
        .sort({ createdAt: 1 })
        .limit(20); // Last 20 messages for context

      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Use AI orchestrator (already implemented)
      const response = await aiOrchestrator.processMessage(
        userMessage,
        {
          conversationHistory,
          context: {
            ...context,
            mode: 'voice',
            responseStyle: 'conversational' // More natural for voice
          }
        }
      );

      return {
        text: response.content || response.text || response,
        model: response.model || 'llama-3.1-70b-versatile',
        thinkingProcess: response.thinkingProcess || [],
        tokensUsed: response.usage?.total_tokens || 0
      };
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw error;
    }
  }

  /**
   * End voice session
   */
  async endSession(sessionId) {
    try {
      const session = await Session.findById(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      await session.updateVoiceState({
        isRecording: false,
        isSpeaking: false,
        isProcessing: false
      });

      await session.addEvent('voice_ended', {
        timestamp: Date.now(),
        duration: Date.now() - session.startedAt
      });

      // Remove from active sessions
      this.activeSessions.delete(sessionId.toString());

      // Update session duration
      const duration = Math.floor((Date.now() - session.startedAt) / 1000);
      await session.updateMetrics({ duration });

      emitToUser(session.userId, 'voice:ended', {
        sessionId,
        duration,
        metrics: session.metrics
      });

      return session;
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }

  /**
   * Update session context (for personalization)
   */
  async updateContext(sessionId, context) {
    try {
      const session = await Session.findById(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      Object.assign(session.context, context);
      await session.save();

      return session;
    } catch (error) {
      console.error('Error updating context:', error);
      throw error;
    }
  }

  /**
   * Get session status
   */
  async getSessionStatus(sessionId) {
    const session = await Session.findById(sessionId);
    const sessionState = this.activeSessions.get(sessionId.toString());

    return {
      session: session,
      state: sessionState,
      isActive: this.activeSessions.has(sessionId.toString())
    };
  }
}

export default new VoiceOrchestrator();
