/**
 * AI Orchestrator Service
 * Main service that coordinates all AI operations
 */

import { ChatGroq } from '@langchain/groq';
import embeddingService from '../ai/embeddings/embeddingService.js';
import chromaService from '../ai/vectorstore/chromaService.js';
import ingestionService from '../ai/vectorstore/ingestion.js';
import ragChain from '../ai/chains/ragChain.js';
import sanitizer from '../ai/security/sanitizer.js';
import envValidator from '../config/envValidator.js';
import aiConfig from '../config/ai.js';
import thinkingGenerator from '../ai/thinking/thinkingGenerator.js';

class AIOrchestrator {
  constructor() {
    this.llm = new ChatGroq({
      apiKey: aiConfig.llm.apiKey,
      model: aiConfig.llm.model,
      temperature: aiConfig.llm.temperature,
      maxTokens: aiConfig.llm.maxTokens,
      streaming: aiConfig.llm.streaming,
    });

    this.isInitialized = false;
  }

  /**
   * Initialize all AI services
   */
  async initialize() {
    console.log('🚀 Initializing AI Pipeline...');

    try {
      // Validate environment variables
      const validation = envValidator.validate();
      if (!validation.valid) {
        console.error('❌ Environment validation failed - AI pipeline may not work correctly');
        return { success: false, error: 'Environment validation failed', details: validation.errors };
      }

      // Initialize embedding service (required)
      await embeddingService.initialize();

      // Initialize ChromaDB (optional - graceful degradation)
      const chromaResult = await chromaService.initialize();
      const chromaAvailable = chromaResult.success;

      this.isInitialized = true;
      console.log('✅ AI Pipeline initialized successfully');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 AI Pipeline Ready:');
      console.log('   ✓ Local embeddings (BGE-small, FREE)');
      console.log(`   ${chromaAvailable ? '✓' : '✗'} Vector store (ChromaDB) ${chromaAvailable ? '' : '- DISABLED'}`);
      console.log(`   ${chromaAvailable ? '✓' : '✗'} RAG pipeline ${chromaAvailable ? '' : '- LIMITED'}`);
      console.log('   ✓ LLM (Groq)');
      console.log('   ✓ Security layer');
      console.log('   Cost: $0 embeddings + Groq LLM only');
      if (!chromaAvailable) {
        console.log('   ⚠️  Note: Some features require ChromaDB server');
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      return { success: true, chromaAvailable };
    } catch (error) {
      console.error('❌ AI Pipeline initialization failed:', error.message);
      this.isInitialized = false;
      return { success: false, error: error.message };
    }
  }

  /**
   * Chat with AI (simple completion)
   */
  async chat(message, context = {}) {
    const startTime = Date.now();

    // Security check
    const injectionCheck = sanitizer.detectInjection(message);
    if (injectionCheck.detected) {
      throw new Error('Potential prompt injection detected');
    }

    const sanitizedMessage = sanitizer.sanitizeText(message);

    // Generate thinking steps
    const thinkingSteps = thinkingGenerator.generateThinkingSteps(sanitizedMessage, {
      mode: 'simple',
      hasRAG: false
    });

    const response = await this.llm.invoke(sanitizedMessage);

    const thinkingSummary = thinkingGenerator.generateSummary(thinkingSteps);

    return {
      response: response.content,
      model: aiConfig.llm.model,
      sanitized: message !== sanitizedMessage,
      thinking: {
        steps: thinkingSteps,
        summary: thinkingSummary,
        totalDuration: Date.now() - startTime
      }
    };
  }

  /**
   * Chat with RAG (context-aware)
   */
  async chatWithRAG(question, options = {}) {
    const startTime = Date.now();

    if (!chromaService.isInitialized) {
      throw new Error('RAG features require ChromaDB server. Please start ChromaDB server first.');
    }

    const injectionCheck = sanitizer.detectInjection(question);
    if (injectionCheck.detected) {
      throw new Error('Potential prompt injection detected');
    }

    const sanitizedQuestion = sanitizer.sanitizeText(question);

    const result = await ragChain.query(sanitizedQuestion, options);

    // Generate thinking steps with RAG context
    const thinkingSteps = thinkingGenerator.generateThinkingSteps(sanitizedQuestion, {
      mode: 'rag',
      hasRAG: true,
      sources: result.sources || []
    });

    const thinkingSummary = thinkingGenerator.generateSummary(thinkingSteps);

    return {
      ...result,
      question: sanitizedQuestion,
      model: aiConfig.llm.model,
      thinking: {
        steps: thinkingSteps,
        summary: thinkingSummary,
        totalDuration: Date.now() - startTime
      }
    };
  }

  /**
   * Generate embeddings
   */
  async generateEmbeddings(texts) {
    if (!Array.isArray(texts)) {
      texts = [texts];
    }

    return await embeddingService.embedBatch(texts);
  }

  /**
   * Semantic search
   */
  async semanticSearch(query, options = {}) {
    if (!chromaService.isInitialized) {
      throw new Error('Search features require ChromaDB server. Please start ChromaDB server first.');
    }

    const { collectionKey = 'knowledge', topK = 5 } = options;

    const results = await chromaService.search(collectionKey, query, { topK });

    return {
      query,
      results: results.results,
      count: results.count,
      cached: results.queryCached,
    };
  }

  /**
   * Ingest content into vector store
   */
  async ingestContent(type, content, metadata = {}) {
    if (!chromaService.isInitialized) {
      throw new Error('Content ingestion requires ChromaDB server. Please start ChromaDB server first.');
    }

    return await ingestionService.ingestContent(type, content, metadata);
  }

  /**
   * Calculate text similarity
   */
  async calculateSimilarity(text1, text2) {
    return await embeddingService.similarity(text1, text2);
  }

  /**
   * Get AI pipeline statistics
   */
  async getStats() {
    const embeddingStats = embeddingService.getStats();
    const chromaStats = await chromaService.getStats();

    return {
      initialized: this.isInitialized,
      embeddings: embeddingStats,
      vectorStore: chromaStats,
      model: aiConfig.llm.model,
      cost: {
        embeddings: 0, // Always $0
        total: embeddingStats.service.totalCost || 0,
      },
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    const embeddingHealth = await embeddingService.healthCheck();
    const chromaHealth = await chromaService.healthCheck();

    return {
      status: this.isInitialized ? 'healthy' : 'not_initialized',
      embeddings: embeddingHealth,
      vectorStore: chromaHealth,
      model: aiConfig.llm.model,
    };
  }

  /**
   * Cleanup
   */
  async cleanup() {
    console.log('🧹 Cleaning up AI Pipeline...');
    await embeddingService.cleanup();
    await chromaService.cleanup();
    this.isInitialized = false;
    console.log('✅ AI Pipeline cleaned up');
  }
}

// Singleton instance
const aiOrchestrator = new AIOrchestrator();

export default aiOrchestrator;
