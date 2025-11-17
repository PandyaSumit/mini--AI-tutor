/**
 * Semantic Query Classifier - Intent-Based Routing
 * Uses embeddings and semantic similarity to determine routing mode
 * No hardcoded keywords - pure semantic understanding
 */

import embeddingService from '../embeddings/embeddingService.js';
import chromaService from '../vectorstore/chromaService.js';
import logger from '../../utils/logger.js';

class SemanticQueryClassifier {
  constructor() {
    // Reference intents for semantic comparison (not keywords!)
    this.intentExamples = {
      rag: [
        'Explain the concept thoroughly with details',
        'What is the definition and meaning',
        'Teach me about this topic step by step',
        'I need to understand how something works',
        'Give me detailed information about this subject',
        'Help me learn this concept with examples',
      ],
      conversational: [
        'Hello, how are you doing today',
        'I appreciate your help, thank you',
        'That was helpful, I understand now',
        'Can we have a casual conversation',
        'What do you think about this',
        'Tell me something interesting',
      ],
      sessionMemory: [
        'What did you just tell me',
        'Repeat the previous explanation',
        'Go back to what you said before',
        'Continue from where you left off',
        'Tell me more about the last topic',
        'Expand on your previous answer',
      ],
      platformAction: [
        'Enroll me in this course',
        'Show my progress in the lessons',
        'Generate flashcards from this',
        'Create a learning roadmap for me',
        'Open the next lesson please',
        'Track my study analytics',
      ],
    };

    // Pre-compute embeddings for intent examples
    this.intentEmbeddings = null;
    this.isInitializing = false;
    this.initializationPromise = null;

    // Statistics
    this.stats = {
      totalClassifications: 0,
      modeBreakdown: {
        rag: 0,
        simple: 0,
        sessionMemory: 0,
        platformAction: 0,
      },
      fallbacks: 0,
      averageConfidence: 0,
      knowledgeBaseChecks: 0,
    };
  }

  /**
   * Pre-compute intent embeddings for faster classification
   */
  async initializeIntentEmbeddings() {
    // Prevent multiple simultaneous initializations
    if (this.isInitializing) {
      return this.initializationPromise;
    }

    if (this.intentEmbeddings) {
      return; // Already initialized
    }

    this.isInitializing = true;

    this.initializationPromise = (async () => {
      try {
        logger.info('Initializing semantic intent embeddings...');

        const allExamples = [
          ...this.intentExamples.rag,
          ...this.intentExamples.conversational,
          ...this.intentExamples.sessionMemory,
          ...this.intentExamples.platformAction,
        ];

        const embeddings = await embeddingService.embedBatch(allExamples);

        this.intentEmbeddings = {
          rag: embeddings.slice(0, this.intentExamples.rag.length),
          conversational: embeddings.slice(
            this.intentExamples.rag.length,
            this.intentExamples.rag.length + this.intentExamples.conversational.length
          ),
          sessionMemory: embeddings.slice(
            this.intentExamples.rag.length + this.intentExamples.conversational.length,
            this.intentExamples.rag.length + this.intentExamples.conversational.length + this.intentExamples.sessionMemory.length
          ),
          platformAction: embeddings.slice(
            this.intentExamples.rag.length + this.intentExamples.conversational.length + this.intentExamples.sessionMemory.length
          ),
        };

        logger.info('Semantic intent embeddings initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize intent embeddings:', error);
        // Don't throw - let classifier fall back gracefully
      } finally {
        this.isInitializing = false;
      }
    })();

    return this.initializationPromise;
  }

  /**
   * Calculate semantic similarity between query and intent examples
   */
  async calculateIntentSimilarity(queryEmbedding) {
    // Ensure embeddings are initialized
    if (!this.intentEmbeddings) {
      await this.initializeIntentEmbeddings();
    }

    // If still not initialized, throw error to trigger fallback
    if (!this.intentEmbeddings) {
      throw new Error('Intent embeddings not initialized');
    }

    const similarities = {};

    for (const [intent, embeddings] of Object.entries(this.intentEmbeddings)) {
      if (!embeddings || embeddings.length === 0) {
        similarities[intent] = 0;
        continue;
      }

      const scores = embeddings.map(intentEmb =>
        embeddingService.cosineSimilarity(queryEmbedding, intentEmb)
      );
      // Use max similarity across all examples for this intent
      similarities[intent] = Math.max(...scores);
    }

    return similarities;
  }

  /**
   * Check if knowledge base has relevant content
   */
  async checkKnowledgeBaseRelevance(query, options = {}) {
    const { collectionKey = 'knowledge', minScore = 0.3 } = options;

    if (!chromaService.isInitialized) {
      return { available: false, reason: 'ChromaDB not initialized' };
    }

    this.stats.knowledgeBaseChecks++;

    try {
      const searchResults = await chromaService.search(collectionKey, query, {
        topK: 3,
      });

      if (searchResults.count === 0) {
        return { available: false, reason: 'Knowledge base empty' };
      }

      const bestScore = searchResults.results[0]?.score || 0;

      if (bestScore < minScore) {
        return {
          available: false,
          reason: 'Low relevance',
          bestScore,
          threshold: minScore,
        };
      }

      return {
        available: true,
        bestScore,
        documentCount: searchResults.count,
      };
    } catch (error) {
      logger.error('Knowledge base check failed:', error);
      return { available: false, reason: 'Check failed', error: error.message };
    }
  }

  /**
   * Detect references to previous conversation (session memory)
   */
  detectSessionMemoryIntent(query, conversationHistory = []) {
    // Semantic check for reference words with context
    const queryLower = query.toLowerCase();

    // Check if query is short and refers to previous context
    const isShortQuery = query.split(/\s+/).length <= 5;
    const hasConversationHistory = conversationHistory.length > 0;

    // Contextual reference indicators (not just keywords!)
    const contextualReferences = [
      /\b(that|this|it|above|before|previous|earlier|last|again)\b/i,
      /\b(continue|more|expand|elaborate)\b/i,
      /\b(what (did )?you (just )?(say|said|tell|told|mention|explain))\b/i,
    ];

    const hasReference = contextualReferences.some(pattern => pattern.test(query));

    // High confidence if: short query + history + reference words
    if (isShortQuery && hasConversationHistory && hasReference) {
      return { detected: true, confidence: 0.85 };
    }

    // Medium confidence if: has reference + history
    if (hasReference && hasConversationHistory) {
      return { detected: true, confidence: 0.65 };
    }

    return { detected: false, confidence: 0 };
  }

  /**
   * Main classification method using semantic understanding
   */
  async classify(query, options = {}) {
    const {
      conversationHistory = [],
      forceMode = null,
      collectionKey = 'knowledge',
      minKnowledgeScore = 0.3,
    } = options;

    this.stats.totalClassifications++;

    // Handle force mode
    if (forceMode) {
      this.stats.modeBreakdown[forceMode === 'rag' ? 'rag' : 'simple']++;
      return {
        mode: forceMode,
        confidence: 1.0,
        method: 'forced',
        reasoning: `Mode forced to ${forceMode}`,
      };
    }

    // Check for session memory intent first (most specific)
    const memoryIntent = this.detectSessionMemoryIntent(query, conversationHistory);
    if (memoryIntent.detected && memoryIntent.confidence > 0.7) {
      this.stats.modeBreakdown.sessionMemory++;
      return {
        mode: 'sessionMemory',
        confidence: memoryIntent.confidence,
        method: 'semantic',
        reasoning: 'Query references previous conversation context',
      };
    }

    // Get query embedding
    const queryEmbedding = await embeddingService.embed(query);

    // Calculate semantic similarity to intent examples
    const intentSimilarities = await this.calculateIntentSimilarity(queryEmbedding);

    logger.info('Intent similarities:', intentSimilarities);

    // Determine primary intent
    const sortedIntents = Object.entries(intentSimilarities)
      .sort(([, a], [, b]) => b - a);

    const [primaryIntent, primaryScore] = sortedIntents[0];
    const [secondaryIntent, secondaryScore] = sortedIntents[1];

    const confidenceDelta = primaryScore - secondaryScore;

    // Platform action detection
    if (primaryIntent === 'platformAction' && primaryScore > 0.6) {
      this.stats.modeBreakdown.platformAction++;
      return {
        mode: 'platformAction',
        confidence: primaryScore,
        method: 'semantic',
        reasoning: 'Query indicates platform action request',
        action: 'detect_specific_action', // Further processing needed
      };
    }

    // RAG candidate - but check knowledge base first!
    if (primaryIntent === 'rag' && primaryScore > 0.5) {
      const knowledgeCheck = await this.checkKnowledgeBaseRelevance(query, {
        collectionKey,
        minScore: minKnowledgeScore,
      });

      if (knowledgeCheck.available) {
        this.stats.modeBreakdown.rag++;
        this.updateAverageConfidence(primaryScore);

        return {
          mode: 'rag',
          confidence: primaryScore,
          method: 'semantic',
          reasoning: 'Knowledge retrieval intent detected with relevant documents',
          knowledgeScore: knowledgeCheck.bestScore,
          documentCount: knowledgeCheck.documentCount,
        };
      } else {
        // Knowledge base not available - fallback to simple
        this.stats.fallbacks++;
        this.stats.modeBreakdown.simple++;
        this.updateAverageConfidence(primaryScore);

        logger.warn(
          `RAG intent detected but knowledge base unavailable: ${knowledgeCheck.reason}`
        );

        return {
          mode: 'simple',
          confidence: primaryScore,
          method: 'semantic',
          reasoning: `RAG intended but falling back: ${knowledgeCheck.reason}`,
          fallback: true,
          originalIntent: 'rag',
          knowledgeCheck,
        };
      }
    }

    // Ambiguous intent - use confidence delta to decide
    if (confidenceDelta < 0.15 && primaryScore < 0.7) {
      // Too ambiguous - default to simple chat with low confidence
      this.stats.modeBreakdown.simple++;
      this.updateAverageConfidence(0.4);

      return {
        mode: 'simple',
        confidence: 0.4,
        method: 'semantic',
        reasoning: 'Intent ambiguous, defaulting to conversational',
        ambiguous: true,
        alternatives: { primaryIntent, secondaryIntent },
      };
    }

    // Conversational chat (default)
    this.stats.modeBreakdown.simple++;
    this.updateAverageConfidence(primaryScore);

    return {
      mode: 'simple',
      confidence: primaryScore,
      method: 'semantic',
      reasoning: `Primary intent: ${primaryIntent} with clear confidence`,
      intentSimilarities,
    };
  }

  /**
   * Update running average confidence
   */
  updateAverageConfidence(newConfidence) {
    const total = this.stats.totalClassifications;
    this.stats.averageConfidence =
      (this.stats.averageConfidence * (total - 1) + newConfidence) / total;
  }

  /**
   * Get classifier statistics
   */
  getStats() {
    return {
      ...this.stats,
      averageConfidence: Number(this.stats.averageConfidence.toFixed(3)),
      modePercentages: {
        rag: (
          (this.stats.modeBreakdown.rag / this.stats.totalClassifications) *
          100
        ).toFixed(1),
        simple: (
          (this.stats.modeBreakdown.simple / this.stats.totalClassifications) *
          100
        ).toFixed(1),
        sessionMemory: (
          (this.stats.modeBreakdown.sessionMemory / this.stats.totalClassifications) *
          100
        ).toFixed(1),
        platformAction: (
          (this.stats.modeBreakdown.platformAction / this.stats.totalClassifications) *
          100
        ).toFixed(1),
      },
      fallbackRate: (
        (this.stats.fallbacks / this.stats.totalClassifications) *
        100
      ).toFixed(1),
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalClassifications: 0,
      modeBreakdown: {
        rag: 0,
        simple: 0,
        sessionMemory: 0,
        platformAction: 0,
      },
      fallbacks: 0,
      averageConfidence: 0,
      knowledgeBaseChecks: 0,
    };
  }
}

// Singleton instance
const semanticQueryClassifier = new SemanticQueryClassifier();

export default semanticQueryClassifier;
