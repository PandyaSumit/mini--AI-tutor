/**
 * Embedding Service
 * Main service for generating text embeddings using local models
 * Features: Multi-layer caching, batch processing, cost = $0
 */

import bgeSmallModel from './models/bgeSmall.js';
import embeddingCache from './embeddingCache.js';
import aiConfig from '../../config/ai.js';

class EmbeddingService {
  constructor() {
    this.model = bgeSmallModel;
    this.cache = embeddingCache;
    this.dimensions = 384;

    // Statistics
    this.stats = {
      totalEmbeddings: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalTime: 0,
      batchProcessed: 0,
    };
  }

  /**
   * Initialize the embedding service
   */
  async initialize() {
    console.log('🚀 Initializing Embedding Service...');

    try {
      // Pre-load the model for faster first embedding
      if (aiConfig.embeddings.cacheEnabled) {
        console.log('   Pre-loading BGE-small model...');
        await this.model.load();
      }

      console.log('✅ Embedding Service initialized');
      console.log(`   Model: ${this.model.modelName}`);
      console.log(`   Dimensions: ${this.dimensions}`);
      console.log(`   Cache: ${aiConfig.embeddings.cacheEnabled ? 'Enabled' : 'Disabled'}`);
      console.log(`   Cost: $0 (100% free local embeddings)`);

      return { success: true };
    } catch (error) {
      console.error('❌ Embedding Service initialization failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate embedding for a single text
   * Uses cache if available
   */
  async embed(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Text must be a non-empty string');
    }

    // Truncate if too long
    const maxLength = aiConfig.security.maxInputLength;
    if (text.length > maxLength) {
      text = text.substring(0, maxLength);
    }

    const startTime = Date.now();

    try {
      // Try cache first
      const cached = await this.cache.get(text);
      if (cached) {
        this.stats.cacheHits++;
        this.stats.totalEmbeddings++;

        return {
          embedding: cached.embedding,
          dimensions: this.dimensions,
          cached: true,
          source: cached.source,
          embedTime: Date.now() - startTime,
          cost: 0, // Always $0
        };
      }

      // Cache miss - generate embedding
      this.stats.cacheMisses++;

      const result = await this.model.embed(text);

      // Cache the result
      await this.cache.set(text, result.embedding);

      this.stats.totalEmbeddings++;
      this.stats.totalTime += result.embedTime;

      return {
        embedding: result.embedding,
        dimensions: this.dimensions,
        cached: false,
        source: 'model',
        embedTime: result.embedTime,
        cost: 0, // Always $0
      };
    } catch (error) {
      console.error('Embedding error:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple texts
   * Optimized with caching and batch processing
   */
  async embedBatch(texts) {
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('Texts must be a non-empty array');
    }

    const startTime = Date.now();

    try {
      // Step 1: Check cache for all texts
      const cacheResults = await this.cache.getMany(texts);

      // Step 2: Identify texts that need embedding
      const textsToEmbed = texts.filter((text) => !cacheResults.has(text));

      // Step 3: Generate embeddings for cache misses
      let newEmbeddings = [];
      if (textsToEmbed.length > 0) {
        const result = await this.model.embedBatch(textsToEmbed);
        newEmbeddings = result.embeddings;

        // Cache new embeddings
        const pairs = textsToEmbed.map((text, idx) => [text, newEmbeddings[idx]]);
        await this.cache.setMany(pairs);

        this.stats.totalTime += result.embedTime;
      }

      // Step 4: Combine cached and new embeddings in original order
      const embeddings = texts.map((text) => {
        if (cacheResults.has(text)) {
          return cacheResults.get(text);
        } else {
          const idx = textsToEmbed.indexOf(text);
          return newEmbeddings[idx];
        }
      });

      // Update stats
      this.stats.cacheHits += cacheResults.size;
      this.stats.cacheMisses += textsToEmbed.length;
      this.stats.totalEmbeddings += texts.length;
      this.stats.batchProcessed++;

      const totalTime = Date.now() - startTime;

      return {
        embeddings,
        count: texts.length,
        dimensions: this.dimensions,
        cached: cacheResults.size,
        generated: textsToEmbed.length,
        embedTime: totalTime,
        avgTime: Math.round(totalTime / texts.length),
        cost: 0, // Always $0
        cacheHitRatio: Math.round((cacheResults.size / texts.length) * 100),
      };
    } catch (error) {
      console.error('Batch embedding error:', error);
      throw new Error(`Failed to generate batch embeddings: ${error.message}`);
    }
  }

  /**
   * Calculate similarity between two texts
   */
  async similarity(text1, text2) {
    const [emb1, emb2] = await Promise.all([this.embed(text1), this.embed(text2)]);

    const similarity = this.model.cosineSimilarity(emb1.embedding, emb2.embedding);

    return {
      similarity,
      text1Length: text1.length,
      text2Length: text2.length,
      cached1: emb1.cached,
      cached2: emb2.cached,
    };
  }

  /**
   * Find most similar text from a list
   */
  async findMostSimilar(query, candidates, topK = 5) {
    if (!Array.isArray(candidates) || candidates.length === 0) {
      throw new Error('Candidates must be a non-empty array');
    }

    // Embed query and all candidates
    const [queryEmb, candidateEmbs] = await Promise.all([
      this.embed(query),
      this.embedBatch(candidates),
    ]);

    // Calculate similarities
    const similarities = candidateEmbs.embeddings.map((candEmb, idx) => ({
      text: candidates[idx],
      similarity: this.model.cosineSimilarity(queryEmb.embedding, candEmb),
      index: idx,
    }));

    // Sort by similarity (descending)
    similarities.sort((a, b) => b.similarity - a.similarity);

    // Return top K
    return {
      query,
      results: similarities.slice(0, topK),
      totalCandidates: candidates.length,
      topK,
    };
  }

  /**
   * Get service statistics
   */
  getStats() {
    const cacheStats = this.cache.getStats();
    const totalRequests = this.stats.cacheHits + this.stats.cacheMisses;
    const cacheHitRatio = totalRequests > 0 ? (this.stats.cacheHits / totalRequests) * 100 : 0;
    const avgTime =
      this.stats.cacheMisses > 0 ? this.stats.totalTime / this.stats.cacheMisses : 0;

    return {
      service: {
        totalEmbeddings: this.stats.totalEmbeddings,
        cacheHits: this.stats.cacheHits,
        cacheMisses: this.stats.cacheMisses,
        cacheHitRatio: Math.round(cacheHitRatio * 10) / 10,
        avgEmbedTime: Math.round(avgTime),
        batchProcessed: this.stats.batchProcessed,
        totalCost: 0, // Always $0
      },
      cache: cacheStats,
      model: this.model.getInfo(),
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalEmbeddings: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalTime: 0,
      batchProcessed: 0,
    };
    this.cache.resetStats();
  }

  /**
   * Clear cache
   */
  async clearCache() {
    await this.cache.clear();
  }

  /**
   * Get cache size
   */
  async getCacheSize() {
    return await this.cache.getCacheSize();
  }

  /**
   * Estimate cost savings vs OpenAI
   */
  estimateSavings() {
    const openaiCostPer1k = 0.0001; // $0.0001 per 1K tokens
    const avgTokensPerText = 100; // Rough estimate
    const estimatedTokens = this.stats.totalEmbeddings * avgTokensPerText;
    const estimatedOpenAICost = (estimatedTokens / 1000) * openaiCostPer1k;

    return {
      totalEmbeddings: this.stats.totalEmbeddings,
      estimatedTokens,
      localCost: 0,
      estimatedOpenAICost: Math.round(estimatedOpenAICost * 1000) / 1000,
      savings: Math.round(estimatedOpenAICost * 1000) / 1000,
      savingsPercent: 100,
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const testText = 'Health check test embedding';
      const result = await this.embed(testText);

      return {
        status: 'healthy',
        model: this.model.modelName,
        dimensions: this.dimensions,
        cacheEnabled: aiConfig.embeddings.cacheEnabled,
        testEmbedTime: result.embedTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }

  /**
   * Cleanup (for graceful shutdown)
   */
  async cleanup() {
    console.log('🧹 Cleaning up Embedding Service...');
    await this.model.unload();
    console.log('✅ Embedding Service cleaned up');
  }
}

// Singleton instance
const embeddingService = new EmbeddingService();

export default embeddingService;
