/**
 * Query Classifier - Intelligent Mode Detection
 * Automatically determines whether a query needs RAG retrieval or simple chat
 */

import { ChatGroq } from '@langchain/groq';
import aiConfig from '../../config/ai.js';
import logger from '../../utils/logger.js';

class QueryClassifier {
  constructor() {
    this.llm = null;

    // Rule-based patterns for fast classification
    this.ragPatterns = {
      // Question patterns that typically need factual knowledge
      questions: [
        /^(what|how|why|when|where|who|which|explain|define|describe)\s+/i,
        /\b(what is|how to|how do|how does|why is|explain|tell me about|define)\b/i,
        /\b(tutorial|guide|example|steps|learn|teach|show me)\b/i,
      ],

      // Keywords indicating need for knowledge base
      knowledgeKeywords: [
        /\b(course|lesson|module|chapter|topic|subject|curriculum)\b/i,
        /\b(python|javascript|java|c\+\+|programming|coding|algorithm|data structure)\b/i,
        /\b(machine learning|ai|deep learning|neural network)\b/i,
        /\b(database|sql|mongodb|api|rest|http)\b/i,
        /\b(react|vue|angular|node|express|django|flask)\b/i,
        /\b(calculus|algebra|statistics|mathematics|physics|chemistry)\b/i,
      ],

      // Learning-specific queries
      learningQueries: [
        /\b(learn|study|practice|exercise|quiz|test|review|understand)\b/i,
        /\b(roadmap|path|progress|skill|concept|prerequisite)\b/i,
      ],
    };

    this.simpleChatPatterns = {
      // Greetings and social
      greetings: [
        /^(hi|hello|hey|good morning|good afternoon|good evening|greetings)\b/i,
        /^(thanks|thank you|thx|ty|appreciate|grateful)\b/i,
        /^(bye|goodbye|see you|farewell|cya)\b/i,
      ],

      // Conversational follow-ups
      followUps: [
        /^(yes|no|okay|ok|sure|yeah|yep|nope|maybe)\b/i,
        /^(i see|got it|i understand|makes sense|that helps)\b/i,
        /^(continue|go on|tell me more|what else|next)\b/i,
      ],

      // Personal/motivational queries
      personal: [
        /\b(feel|feeling|think|believe|opinion|advice|suggest|recommend)\b/i,
        /\b(motivation|inspire|encourage|help|support)\b/i,
        /\b(tired|frustrated|confused|stuck|difficult|hard)\b/i,
      ],
    };

    // Statistics for monitoring
    this.stats = {
      totalClassifications: 0,
      ragSelected: 0,
      simpleChatSelected: 0,
      llmClassifications: 0,
      ruleBasedClassifications: 0,
      averageConfidence: 0,
    };
  }

  getLLM() {
    if (this.llm) return this.llm;

    const apiKey = aiConfig.llm.apiKey || process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ API key missing');
    }

    // Use fast model with low temperature for classification
    this.llm = new ChatGroq({
      apiKey,
      model: aiConfig.llm.model,
      temperature: 0.1, // Low temperature for consistent classification
      maxTokens: 100, // Short response needed
    });

    return this.llm;
  }

  /**
   * Classify query using rule-based patterns (fast)
   */
  classifyWithRules(query) {
    const queryLower = query.toLowerCase().trim();

    // Check for simple chat patterns first (most common)
    for (const patterns of Object.values(this.simpleChatPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(queryLower)) {
          return {
            mode: 'simple',
            confidence: 0.85,
            method: 'rule-based',
            reason: 'Matched conversational pattern',
          };
        }
      }
    }

    // Check for RAG patterns
    let ragScore = 0;

    // Question patterns (high weight)
    for (const pattern of this.ragPatterns.questions) {
      if (pattern.test(queryLower)) {
        ragScore += 0.4;
        break;
      }
    }

    // Knowledge keywords (medium weight)
    for (const pattern of this.ragPatterns.knowledgeKeywords) {
      if (pattern.test(queryLower)) {
        ragScore += 0.3;
        break;
      }
    }

    // Learning queries (medium weight)
    for (const pattern of this.ragPatterns.learningQueries) {
      if (pattern.test(queryLower)) {
        ragScore += 0.3;
        break;
      }
    }

    // If score is high enough, use RAG
    if (ragScore >= 0.6) {
      return {
        mode: 'rag',
        confidence: Math.min(ragScore, 0.95),
        method: 'rule-based',
        reason: 'Matched knowledge retrieval patterns',
      };
    }

    // Default to RAG if uncertain (safer to retrieve than miss info)
    if (ragScore >= 0.3) {
      return {
        mode: 'rag',
        confidence: 0.6,
        method: 'rule-based',
        reason: 'Partial match, defaulting to RAG for safety',
      };
    }

    // If query is very short and no patterns match, likely conversational
    if (queryLower.length < 20) {
      return {
        mode: 'simple',
        confidence: 0.7,
        method: 'rule-based',
        reason: 'Short query, likely conversational',
      };
    }

    // Default to RAG for ambiguous cases
    return {
      mode: 'rag',
      confidence: 0.5,
      method: 'rule-based',
      reason: 'Ambiguous query, defaulting to RAG',
    };
  }

  /**
   * Classify query using LLM (more accurate but slower)
   */
  async classifyWithLLM(query) {
    const prompt = `You are a query classifier for an AI tutoring platform. Determine if the user's query requires:
- "RAG" (Retrieval-Augmented Generation): Needs factual knowledge, course content, or stored information
- "SIMPLE" (Simple Chat): Conversational, greeting, opinion, or doesn't need retrieval

User query: "${query}"

Respond with ONLY a JSON object in this exact format:
{
  "mode": "rag" or "simple",
  "confidence": 0.0-1.0,
  "reason": "brief explanation"
}`;

    try {
      const response = await this.getLLM().invoke(prompt);
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        return {
          mode: parsed.mode.toLowerCase(),
          confidence: parsed.confidence,
          method: 'llm',
          reason: parsed.reason,
        };
      }

      throw new Error('Invalid LLM response format');
    } catch (error) {
      logger.warn('LLM classification failed, falling back to rules:', error);
      return this.classifyWithRules(query);
    }
  }

  /**
   * Main classification method - uses hybrid approach
   */
  async classify(query, options = {}) {
    const {
      useLLM = false, // Set to true for higher accuracy (slower)
      conversationHistory = [],
      forceMode = null, // Override for testing
    } = options;

    this.stats.totalClassifications++;

    // Allow manual override for testing
    if (forceMode) {
      return {
        mode: forceMode,
        confidence: 1.0,
        method: 'manual-override',
        reason: 'Forced by options',
      };
    }

    // Check conversation history for context clues
    const hasRecentRAG = conversationHistory
      .slice(-2)
      .some((msg) => msg.isRAG || msg.sources?.length > 0);

    // Use rule-based by default (fast)
    let classification = this.classifyWithRules(query);

    // Use LLM for ambiguous cases or if explicitly requested
    if (useLLM || (classification.confidence < 0.7 && !hasRecentRAG)) {
      classification = await this.classifyWithLLM(query);
      this.stats.llmClassifications++;
    } else {
      this.stats.ruleBasedClassifications++;
    }

    // Update statistics
    if (classification.mode === 'rag') {
      this.stats.ragSelected++;
    } else {
      this.stats.simpleChatSelected++;
    }

    // Update average confidence (moving average)
    this.stats.averageConfidence =
      (this.stats.averageConfidence * (this.stats.totalClassifications - 1) +
        classification.confidence) /
      this.stats.totalClassifications;

    logger.debug('Query classified:', {
      query: query.substring(0, 50),
      mode: classification.mode,
      confidence: classification.confidence,
      method: classification.method,
    });

    return classification;
  }

  /**
   * Batch classify multiple queries
   */
  async classifyBatch(queries) {
    return await Promise.all(
      queries.map((query) => this.classify(query))
    );
  }

  /**
   * Get classification statistics
   */
  getStats() {
    return {
      ...this.stats,
      ragPercentage: this.stats.totalClassifications > 0
        ? Math.round((this.stats.ragSelected / this.stats.totalClassifications) * 100)
        : 0,
      simpleChatPercentage: this.stats.totalClassifications > 0
        ? Math.round((this.stats.simpleChatSelected / this.stats.totalClassifications) * 100)
        : 0,
      llmUsagePercentage: this.stats.totalClassifications > 0
        ? Math.round((this.stats.llmClassifications / this.stats.totalClassifications) * 100)
        : 0,
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalClassifications: 0,
      ragSelected: 0,
      simpleChatSelected: 0,
      llmClassifications: 0,
      ruleBasedClassifications: 0,
      averageConfidence: 0,
    };
  }
}

export default new QueryClassifier();
