/**
 * Semantic Search Service
 * Simplified interface for vector similarity search
 */

import chromaService from './chromaService.js';
import vectorCache from './vectorCache.js';
import aiConfig from '../../config/ai.js';

class SearchService {
  /**
   * Search for similar content across all collections
   */
  async searchAll(query, options = {}) {
    const { topK = 5, minScore = 0.5 } = options;

    // Search across all collections
    const collections = ['knowledge', 'conversations', 'roadmaps', 'flashcards', 'notes'];
    const results = [];

    for (const collectionKey of collections) {
      try {
        const collectionResults = await chromaService.search(collectionKey, query, {
          topK: Math.ceil(topK / collections.length) + 1,
        });

        results.push(...collectionResults.results.filter((r) => r.score >= minScore));
      } catch (error) {
        console.error(`Search error in ${collectionKey}:`, error.message);
      }
    }

    // Sort by score and return top K
    results.sort((a, b) => b.score - a.score);

    return {
      query,
      results: results.slice(0, topK),
      count: results.length,
      collections: collections.length,
    };
  }

  /**
   * Search within a specific collection
   */
  async searchCollection(collectionKey, query, options = {}) {
    const { topK = aiConfig.vectorStore.searchTopK, where = null } = options;

    // Check cache first
    const cached = await vectorCache.get(query, collectionKey, options);
    if (cached) {
      return { ...cached, cached: true };
    }

    // Search in vector store
    const results = await chromaService.search(collectionKey, query, { topK, where });

    // Cache results
    await vectorCache.set(query, collectionKey, results, options);

    return {
      ...results,
      cached: false,
    };
  }

  /**
   * Find similar documents to a given document
   */
  async findSimilar(collectionKey, documentId, topK = 5) {
    // Get the document first
    const collection = chromaService.getCollection(collectionKey);

    // This is a placeholder - ChromaDB would need the actual implementation
    // For now, return empty results
    return {
      documentId,
      results: [],
      count: 0,
    };
  }

  /**
   * Search with metadata filters
   */
  async searchWithFilters(query, filters = {}, options = {}) {
    const {
      type = null,
      userId = null,
      difficulty = null,
      tags = null,
      topK = 5,
    } = { ...filters, ...options };

    // Build where clause
    const where = {};
    if (type) where.type = type;
    if (userId) where.userId = userId;
    if (difficulty) where.difficulty = difficulty;
    if (tags) where.tags = { $in: tags };

    // Determine collection based on type
    const collectionKey = type ? this.getCollectionForType(type) : 'knowledge';

    return await this.searchCollection(collectionKey, query, {
      topK,
      where: Object.keys(where).length > 0 ? where : null,
    });
  }

  /**
   * Get collection key for content type
   */
  getCollectionForType(type) {
    const collectionMap = {
      knowledge: 'knowledge',
      roadmap: 'roadmaps',
      flashcard: 'flashcards',
      note: 'notes',
      conversation: 'conversations',
    };
    return collectionMap[type] || 'knowledge';
  }

  /**
   * Search for learning resources
   */
  async searchLearningResources(query, difficulty = null, topK = 5) {
    const collections = ['roadmaps', 'flashcards', 'knowledge'];
    const results = [];

    for (const collectionKey of collections) {
      try {
        const where = difficulty ? { difficulty } : null;
        const collectionResults = await chromaService.search(collectionKey, query, {
          topK: Math.ceil(topK / collections.length),
          where,
        });

        results.push(...collectionResults.results);
      } catch (error) {
        console.error(`Search error in ${collectionKey}:`, error.message);
      }
    }

    // Sort by score
    results.sort((a, b) => b.score - a.score);

    return {
      query,
      results: results.slice(0, topK),
      difficulty,
    };
  }

  /**
   * Search user's content
   */
  async searchUserContent(userId, query, topK = 5) {
    return await this.searchWithFilters(query, { userId }, { topK });
  }
}

export default new SearchService();
