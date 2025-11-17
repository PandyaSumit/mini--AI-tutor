/**
 * Adaptive Tutor Workflow using LangGraph
 * Implements stateful, adaptive learning with Socratic method
 */

import { StateGraph, END } from '@langchain/langgraph';
import { ChatGroq } from '@langchain/groq';
import statePersistence from '../state/statePersistence.js';
import chromaService from '../vectorstore/chromaService.js';
import tutorPrompts from '../prompts/tutorPrompts.js';
import aiConfig from '../../config/ai.js';
import logger from '../../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Tutor State Schema
 */
class TutorState {
  constructor(data = {}) {
    this.sessionId = data.sessionId || uuidv4();
    this.userId = data.userId;
    this.topic = data.topic || 'general';
    this.currentConcept = data.currentConcept || null;
    this.studentLevel = data.studentLevel || 'beginner'; // beginner | intermediate | advanced
    this.conversationHistory = data.conversationHistory || [];
    this.conceptsMastered = data.conceptsMastered || [];
    this.strugglingWith = data.strugglingWith || [];
    this.questionsAsked = data.questionsAsked || 0;
    this.correctAnswers = data.correctAnswers || 0;
    this.hintsGiven = data.hintsGiven || 0;
    this.lastInteraction = data.lastInteraction || new Date();
    this.nextAction = data.nextAction || 'assess'; // assess | explain | question | hint | advance | end
    this.currentPhase = data.currentPhase || 'introduction'; // introduction | learning | practice | mastery
    this.performance = data.performance || [];
    this.learningGoals = data.learningGoals || [];
    this.createdAt = data.createdAt || new Date();
  }

  /**
   * Calculate current mastery level (0-100)
   */
  getMasteryLevel() {
    if (this.questionsAsked === 0) return 0;
    return Math.round((this.correctAnswers / this.questionsAsked) * 100);
  }

  /**
   * Determine if student is struggling
   */
  isStruggling() {
    const recentPerformance = this.performance.slice(-3);
    if (recentPerformance.length < 3) return false;

    const recentScore = recentPerformance.filter((p) => p.correct).length;
    return recentScore < 1; // Less than 1/3 correct
  }

  /**
   * Should advance to next concept?
   */
  shouldAdvance() {
    const mastery = this.getMasteryLevel();
    return mastery >= 80 && this.questionsAsked >= 5;
  }

  /**
   * Add to conversation history
   */
  addMessage(role, content) {
    this.conversationHistory.push({
      role,
      content,
      timestamp: new Date(),
    });

    // Keep last 20 messages to manage memory
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }
  }

  /**
   * Record performance
   */
  recordPerformance(correct, concept) {
    this.performance.push({
      concept,
      correct,
      timestamp: new Date(),
    });

    if (correct) {
      this.correctAnswers++;
    }

    this.questionsAsked++;
  }
}

/**
 * Adaptive Tutor Graph
 */
class AdaptiveTutorGraph {
  constructor() {
    this.llm = null;
    this.graph = null;
    this.initializeGraph();
  }

  getLLM() {
    if (this.llm) return this.llm;

    const apiKey = aiConfig.llm.apiKey || process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ API key missing');
    }

    this.llm = new ChatGroq({
      apiKey,
      model: aiConfig.llm.model,
      temperature: 0.7,
      maxTokens: 1024,
    });

    return this.llm;
  }

  /**
   * Initialize the LangGraph workflow
   */
  initializeGraph() {
    // Create state graph
    this.graph = new StateGraph({
      channels: {
        sessionId: null,
        userId: null,
        topic: null,
        currentConcept: null,
        studentLevel: null,
        conversationHistory: null,
        conceptsMastered: null,
        strugglingWith: null,
        questionsAsked: null,
        correctAnswers: null,
        hintsGiven: null,
        lastInteraction: null,
        nextAction: null,
        currentPhase: null,
        performance: null,
        learningGoals: null,
      },
    });

    // Define nodes
    this.graph.addNode('initialize', this.initializeNode.bind(this));
    this.graph.addNode('assess', this.assessNode.bind(this));
    this.graph.addNode('explain', this.explainNode.bind(this));
    this.graph.addNode('question', this.questionNode.bind(this));
    this.graph.addNode('evaluate', this.evaluateNode.bind(this));
    this.graph.addNode('hint', this.hintNode.bind(this));
    this.graph.addNode('advance', this.advanceNode.bind(this));
    this.graph.addNode('summarize', this.summarizeNode.bind(this));

    // Define edges with conditional logic
    this.graph.setEntryPoint('initialize');

    this.graph.addEdge('initialize', 'assess');
    this.graph.addEdge('assess', 'explain');
    this.graph.addEdge('explain', 'question');
    this.graph.addEdge('question', 'evaluate');

    // Conditional routing from evaluate
    this.graph.addConditionalEdges('evaluate', this.routeAfterEvaluation.bind(this), {
      hint: 'hint',
      advance: 'advance',
      question: 'question',
      explain: 'explain',
      end: END,
    });

    this.graph.addEdge('hint', 'question');
    this.graph.addEdge('advance', 'explain');
    this.graph.addEdge('summarize', END);

    // Compile graph
    this.compiled = this.graph.compile();
  }

  /**
   * Node: Initialize session
   */
  async initializeNode(state) {
    logger.info(`Initializing tutor session: ${state.sessionId}`);

    const tutorState = new TutorState(state);

    // Search for relevant learning materials
    try {
      const materials = await chromaService.search('knowledge', tutorState.topic, {
        topK: 3,
      });

      tutorState.learningGoals = materials.results.map((r) => r.metadata.title || r.content.substring(0, 100));
    } catch (error) {
      logger.warn('Failed to load learning materials:', error);
    }

    tutorState.addMessage('system', `Starting adaptive tutoring session on ${tutorState.topic}`);

    return tutorState;
  }

  /**
   * Node: Assess current knowledge level
   */
  async assessNode(state) {
    logger.debug(`Assessing knowledge level for session: ${state.sessionId}`);

    const tutorState = new TutorState(state);

    const systemPrompt = tutorPrompts.generate({
      subject: tutorState.topic,
      level: tutorState.studentLevel,
      phase: 'assessment',
    });

    const assessmentPrompt = `${systemPrompt}

Based on the conversation so far, assess the student's current understanding level.
Provide a brief, encouraging message acknowledging their level.`;

    try {
      const response = await this.getLLM().invoke(assessmentPrompt);
      tutorState.addMessage('tutor', response.content);
      tutorState.nextAction = 'explain';
      tutorState.currentPhase = 'learning';

      return tutorState;
    } catch (error) {
      logger.error('Assessment node error:', error);
      throw error;
    }
  }

  /**
   * Node: Explain concept
   */
  async explainNode(state) {
    logger.debug(`Explaining concept for session: ${state.sessionId}`);

    const tutorState = new TutorState(state);

    // Set current concept if not set
    if (!tutorState.currentConcept) {
      tutorState.currentConcept = `Fundamentals of ${tutorState.topic}`;
    }

    const systemPrompt = tutorPrompts.generate({
      subject: tutorState.topic,
      level: tutorState.studentLevel,
      phase: 'explanation',
    });

    const conversationContext = tutorState.conversationHistory
      .slice(-5)
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');

    const explanationPrompt = `${systemPrompt}

Current concept: ${tutorState.currentConcept}

Conversation so far:
${conversationContext}

Provide a clear, concise explanation of "${tutorState.currentConcept}" appropriate for a ${tutorState.studentLevel} student.
Use analogies and examples. Break down complex ideas into simple steps.`;

    try {
      const response = await this.getLLM().invoke(explanationPrompt);
      tutorState.addMessage('tutor', response.content);
      tutorState.nextAction = 'question';

      return tutorState;
    } catch (error) {
      logger.error('Explanation node error:', error);
      throw error;
    }
  }

  /**
   * Node: Ask question to check understanding
   */
  async questionNode(state) {
    logger.debug(`Asking question for session: ${state.sessionId}`);

    const tutorState = new TutorState(state);

    const systemPrompt = tutorPrompts.generate({
      subject: tutorState.topic,
      level: tutorState.studentLevel,
      phase: 'questioning',
    });

    const questionPrompt = `${systemPrompt}

Current concept: ${tutorState.currentConcept}
Student level: ${tutorState.studentLevel}
Questions asked: ${tutorState.questionsAsked}

Create a Socratic question to check the student's understanding of "${tutorState.currentConcept}".
The question should:
1. Guide the student to think critically
2. Be appropriate for ${tutorState.studentLevel} level
3. Have a clear, verifiable answer
4. Build on previous discussion

Return ONLY the question, no explanations.`;

    try {
      const response = await this.getLLM().invoke(questionPrompt);
      tutorState.addMessage('tutor', response.content);
      tutorState.nextAction = 'evaluate';
      tutorState.currentPhase = 'practice';

      return tutorState;
    } catch (error) {
      logger.error('Question node error:', error);
      throw error;
    }
  }

  /**
   * Node: Evaluate student's answer
   */
  async evaluateNode(state) {
    logger.debug(`Evaluating answer for session: ${state.sessionId}`);

    const tutorState = new TutorState(state);

    // Get student's last message
    const studentMessages = tutorState.conversationHistory.filter(
      (msg) => msg.role === 'user'
    );
    const lastStudentMessage = studentMessages[studentMessages.length - 1]?.content || '';

    // Get tutor's last question
    const tutorMessages = tutorState.conversationHistory.filter(
      (msg) => msg.role === 'tutor'
    );
    const lastQuestion = tutorMessages[tutorMessages.length - 1]?.content || '';

    const evaluationPrompt = `Evaluate the student's answer to your question.

Your question: "${lastQuestion}"
Student's answer: "${lastStudentMessage}"
Current concept: ${tutorState.currentConcept}

Provide your evaluation in this JSON format:
{
  "correct": true/false,
  "feedback": "brief feedback message",
  "understanding": "poor/partial/good/excellent",
  "suggestHint": true/false
}

Return ONLY valid JSON:`;

    try {
      const response = await this.getLLM().invoke(evaluationPrompt);
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const evaluation = JSON.parse(jsonMatch[0]);

        tutorState.recordPerformance(evaluation.correct, tutorState.currentConcept);

        tutorState.addMessage('tutor', evaluation.feedback);

        // Determine next action based on evaluation
        if (evaluation.correct) {
          if (tutorState.shouldAdvance()) {
            tutorState.nextAction = 'advance';
          } else {
            tutorState.nextAction = 'question';
          }
        } else {
          if (evaluation.suggestHint || tutorState.hintsGiven < 2) {
            tutorState.nextAction = 'hint';
          } else {
            tutorState.nextAction = 'explain';
          }
        }

        // Adjust difficulty based on performance
        if (tutorState.isStruggling() && tutorState.studentLevel !== 'beginner') {
          tutorState.studentLevel = tutorState.studentLevel === 'advanced' ? 'intermediate' : 'beginner';
          logger.info(`Adjusted difficulty to ${tutorState.studentLevel} for session ${tutorState.sessionId}`);
        }

        return tutorState;
      } else {
        throw new Error('Invalid evaluation response format');
      }
    } catch (error) {
      logger.error('Evaluation node error:', error);
      // Default behavior on error
      tutorState.nextAction = 'question';
      return tutorState;
    }
  }

  /**
   * Node: Provide hint
   */
  async hintNode(state) {
    logger.debug(`Providing hint for session: ${state.sessionId}`);

    const tutorState = new TutorState(state);

    const hintPrompt = `Provide a helpful hint for the student struggling with "${tutorState.currentConcept}".

The hint should:
1. Guide without giving away the answer
2. Simplify the concept
3. Provide an analogy or example
4. Encourage the student to think

Keep it brief and encouraging.`;

    try {
      const response = await this.getLLM().invoke(hintPrompt);
      tutorState.addMessage('tutor', response.content);
      tutorState.hintsGiven++;
      tutorState.nextAction = 'question';

      return tutorState;
    } catch (error) {
      logger.error('Hint node error:', error);
      throw error;
    }
  }

  /**
   * Node: Advance to next concept
   */
  async advanceNode(state) {
    logger.debug(`Advancing to next concept for session: ${state.sessionId}`);

    const tutorState = new TutorState(state);

    tutorState.conceptsMastered.push(tutorState.currentConcept);
    tutorState.strugglingWith = tutorState.strugglingWith.filter(
      (c) => c !== tutorState.currentConcept
    );

    // Determine next concept (simplified - in production, use knowledge graph)
    const nextConcept = `Advanced ${tutorState.topic} - Level ${tutorState.conceptsMastered.length + 1}`;
    tutorState.currentConcept = nextConcept;

    // Reset performance counters for new concept
    tutorState.questionsAsked = 0;
    tutorState.correctAnswers = 0;
    tutorState.hintsGiven = 0;

    tutorState.addMessage('tutor', `Excellent! You've mastered that concept. Let's move on to: ${nextConcept}`);
    tutorState.nextAction = 'explain';
    tutorState.currentPhase = 'learning';

    return tutorState;
  }

  /**
   * Node: Summarize session
   */
  async summarizeNode(state) {
    logger.debug(`Summarizing session: ${state.sessionId}`);

    const tutorState = new TutorState(state);

    const summaryPrompt = `Create a brief summary of this tutoring session.

Topic: ${tutorState.topic}
Concepts mastered: ${tutorState.conceptsMastered.join(', ')}
Overall mastery: ${tutorState.getMasteryLevel()}%
Questions asked: ${tutorState.questionsAsked}
Correct answers: ${tutorState.correctAnswers}

Provide encouraging feedback and suggestions for next steps.`;

    try {
      const response = await this.getLLM().invoke(summaryPrompt);
      tutorState.addMessage('tutor', response.content);
      tutorState.nextAction = 'end';

      return tutorState;
    } catch (error) {
      logger.error('Summarize node error:', error);
      throw error;
    }
  }

  /**
   * Routing logic after evaluation
   */
  routeAfterEvaluation(state) {
    const tutorState = new TutorState(state);
    return tutorState.nextAction;
  }

  /**
   * Start a new tutoring session
   */
  async start(userId, topic, level = 'beginner') {
    const sessionId = `tutor:${userId}:${Date.now()}`;

    const initialState = new TutorState({
      sessionId,
      userId,
      topic,
      studentLevel: level,
    });

    try {
      // Run first step of graph
      const result = await this.compiled.invoke(initialState);

      // Save checkpoint
      await statePersistence.saveCheckpoint(sessionId, result, {
        userId,
        topic,
        type: 'adaptive-tutor',
      });

      logger.info(`Started tutor session: ${sessionId}`);

      return {
        sessionId,
        state: result,
        message: result.conversationHistory[result.conversationHistory.length - 1]?.content,
      };
    } catch (error) {
      logger.error('Failed to start tutor session:', error);
      throw error;
    }
  }

  /**
   * Continue session with user message
   */
  async interact(sessionId, userMessage) {
    try {
      // Load checkpoint
      const checkpoint = await statePersistence.loadCheckpoint(sessionId);

      if (!checkpoint) {
        throw new Error(`Session ${sessionId} not found or expired`);
      }

      const tutorState = new TutorState(checkpoint);

      // Add user message
      tutorState.addMessage('user', userMessage);
      tutorState.lastInteraction = new Date();

      // Continue graph execution
      const result = await this.compiled.invoke(tutorState);

      // Save updated checkpoint
      await statePersistence.saveCheckpoint(sessionId, result);

      // Extend TTL for active session
      await statePersistence.extendTTL(sessionId);

      return {
        sessionId,
        state: result,
        message: result.conversationHistory[result.conversationHistory.length - 1]?.content,
        nextAction: result.nextAction,
        mastery: result.getMasteryLevel(),
      };
    } catch (error) {
      logger.error(`Failed to interact with session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get session state
   */
  async getSession(sessionId) {
    const checkpoint = await statePersistence.loadCheckpoint(sessionId);

    if (!checkpoint) {
      return null;
    }

    const tutorState = new TutorState(checkpoint);

    return {
      sessionId,
      state: tutorState,
      mastery: tutorState.getMasteryLevel(),
      isStruggling: tutorState.isStruggling(),
      shouldAdvance: tutorState.shouldAdvance(),
    };
  }

  /**
   * End session
   */
  async endSession(sessionId) {
    try {
      const checkpoint = await statePersistence.loadCheckpoint(sessionId);

      if (!checkpoint) {
        return null;
      }

      const tutorState = new TutorState(checkpoint);

      // Generate summary
      const summary = await this.summarizeNode(tutorState);

      // Archive to MongoDB (if WorkflowArchive model provided)
      // await statePersistence.archiveCheckpoint(sessionId, WorkflowArchive);

      // Delete from Redis
      await statePersistence.deleteCheckpoint(sessionId);

      logger.info(`Ended tutor session: ${sessionId}`);

      return {
        sessionId,
        summary: summary.conversationHistory[summary.conversationHistory.length - 1]?.content,
        stats: {
          conceptsMastered: summary.conceptsMastered,
          mastery: summary.getMasteryLevel(),
          questionsAsked: summary.questionsAsked,
          correctAnswers: summary.correctAnswers,
        },
      };
    } catch (error) {
      logger.error(`Failed to end session ${sessionId}:`, error);
      throw error;
    }
  }
}

export default new AdaptiveTutorGraph();
