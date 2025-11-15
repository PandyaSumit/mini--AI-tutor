/**
 * AI Controller - Streaming Version
 * Handles streaming AI responses with real-time thinking display
 */

import aiOrchestrator from '../services/aiOrchestrator.js';
import {
  validate,
  chatMessageSchema,
  ragQuerySchema,
} from '../ai/security/inputValidator.js';

/**
 * POST /api/ai/chat/stream
 * Streaming chat with real-time thinking
 */
export async function chatStream(req, res) {
  try {
    const validation = validate(chatMessageSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const { message, mode = 'simple' } = req.body;

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Keep connection alive
    const keepAliveInterval = setInterval(() => {
      res.write(':keepalive\n\n');
    }, 15000);

    try {
      // Send initial thinking phase
      const thinkingPhases = [
        {
          phase: 'understanding',
          title: 'Understanding the question',
          status: 'in_progress',
          timestamp: Date.now()
        },
        {
          phase: 'analysis',
          title: mode === 'rag' ? 'Searching knowledge base' : 'Analyzing request',
          status: 'pending',
          timestamp: null
        },
        {
          phase: 'formulation',
          title: 'Formulating response',
          status: 'pending',
          timestamp: null
        }
      ];

      // Send initial thinking state
      res.write(`data: ${JSON.stringify({
        type: 'thinking_start',
        phases: thinkingPhases
      })}\n\n`);

      // Phase 1: Understanding (simulate 300-500ms)
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));

      thinkingPhases[0].status = 'completed';
      thinkingPhases[0].duration = 300 + Math.floor(Math.random() * 200);
      thinkingPhases[0].content = `Analyzing the user's query: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`;

      thinkingPhases[1].status = 'in_progress';
      thinkingPhases[1].timestamp = Date.now();

      res.write(`data: ${JSON.stringify({
        type: 'thinking_update',
        phase: thinkingPhases[0]
      })}\n\n`);

      // Phase 2: Analysis (simulate 400-600ms)
      await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 200));

      thinkingPhases[1].status = 'completed';
      thinkingPhases[1].duration = 400 + Math.floor(Math.random() * 200);
      thinkingPhases[1].content = mode === 'rag'
        ? 'Performing semantic search across knowledge base...'
        : 'Processing the query to determine the best approach...';

      thinkingPhases[2].status = 'in_progress';
      thinkingPhases[2].timestamp = Date.now();

      res.write(`data: ${JSON.stringify({
        type: 'thinking_update',
        phase: thinkingPhases[1]
      })}\n\n`);

      // Get actual AI response
      let aiResponse;
      if (mode === 'rag') {
        aiResponse = await aiOrchestrator.chatWithRAG(message, { topK: 5 });
      } else {
        aiResponse = await aiOrchestrator.chat(message);
      }

      // Phase 3: Formulation
      thinkingPhases[2].status = 'completed';
      thinkingPhases[2].duration = 200 + Math.floor(Math.random() * 150);
      thinkingPhases[2].content = 'Structuring a clear, accurate response...';

      res.write(`data: ${JSON.stringify({
        type: 'thinking_update',
        phase: thinkingPhases[2]
      })}\n\n`);

      // Send thinking complete
      res.write(`data: ${JSON.stringify({
        type: 'thinking_complete',
        summary: {
          totalSteps: thinkingPhases.length,
          totalDuration: thinkingPhases.reduce((sum, p) => sum + (p.duration || 0), 0)
        }
      })}\n\n`);

      // Send final response
      res.write(`data: ${JSON.stringify({
        type: 'response',
        data: {
          answer: aiResponse.response || aiResponse.answer,
          model: aiResponse.model,
          sources: aiResponse.sources,
          confidence: aiResponse.confidence,
          thinking: {
            steps: thinkingPhases,
            isComplete: true
          }
        }
      })}\n\n`);

      // Send done signal
      res.write('data: [DONE]\n\n');

    } catch (error) {
      console.error('Streaming error:', error);
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: error.message
      })}\n\n`);
    } finally {
      clearInterval(keepAliveInterval);
      res.end();
    }

  } catch (error) {
    console.error('Stream setup error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
}
