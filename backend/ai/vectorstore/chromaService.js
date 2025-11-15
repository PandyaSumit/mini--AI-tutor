/**
 * ChromaDB Vector Store Service
 * Manages vector storage and semantic search with ChromaDB
 */

import { ChromaClient } from 'chromadb';
import fs from 'fs';
import path from 'path';
import embeddingService from '../embeddings/embeddingService.js';
import aiConfig from '../../config/ai.js';

class ChromaService {
  constructor() {
    this.client = null;
    this.collections = new Map();
    this.isInitialized = false;

    // Statistics
    this.stats = {
      documentsAdded: 0,
      searchesPerformed: 0,
      collectionsCreated: 0,
    };
  }

  /**
   * Initialize ChromaDB client and collections
   */
  async initialize() {
    console.log('🚀 Initializing ChromaDB Vector Store...');

    try {
      // Ensure ChromaDB directory exists
      const chromaPath = aiConfig.vectorStore.path;
      if (!fs.existsSync(chromaPath)) {
        console.log(`   Creating ChromaDB directory: ${chromaPath}`);
        fs.mkdirSync(chromaPath, { recursive: true });
      }

      // Connect to ChromaDB
      this.client = new ChromaClient({
        path: chromaPath,
      });

      // Test connection
      await this.client.heartbeat();

      console.log('✅ ChromaDB connected successfully');
      console.log(`   Path: ${aiConfig.vectorStore.path}`);

      // Create default collections
      await this.ensureCollections();

      this.isInitialized = true;
      console.log('✅ ChromaDB Vector Store initialized');

      return { success: true };
    } catch (error) {
      console.error('❌ ChromaDB initialization failed:', error.message);
      console.log('   Make sure ChromaDB is running or using local storage');
      this.isInitialized = false;
      return { success: false, error: error.message };
    }
  }

  /**
   * Ensure all collections exist
   */
  async ensureCollections() {
    const collections = aiConfig.vectorStore.collections;

    for (const [name, collectionName] of Object.entries(collections)) {
      try {
        const collection = await this.getOrCreateCollection(collectionName);
        this.collections.set(name, collection);
        console.log(`   ✓ Collection ready: ${collectionName}`);
      } catch (error) {
        console.error(`   ✗ Failed to create collection ${collectionName}:`, error.message);
      }
    }
  }

  /**
   * Get or create a collection
   */
  async getOrCreateCollection(name) {
    try {
      // Try to get existing collection
      const collection = await this.client.getOrCreateCollection({
        name,
        metadata: {
          description: `Vector store for ${name}`,
          'hnsw:space': 'cosine', // Use cosine similarity
          'hnsw:M': aiConfig.vectorStore.hnswM,
          'hnsw:construction_ef': aiConfig.vectorStore.hnswEfConstruct,
          'hnsw:search_ef': aiConfig.vectorStore.hnswEfSearch,
        },
      });

      return collection;
    } catch (error) {
      console.error(`Failed to get/create collection ${name}:`, error);
      throw error;
    }
  }

  /**
   * Get collection by name
   */
  getCollection(collectionKey) {
    if (!this.collections.has(collectionKey)) {
      throw new Error(`Collection ${collectionKey} not found`);
    }
    return this.collections.get(collectionKey);
  }

  /**
   * Add documents to a collection
   */
  async addDocuments(collectionKey, documents) {
    if (!this.isInitialized) {
      throw new Error('ChromaDB not initialized');
    }

    const collection = this.getCollection(collectionKey);

    try {
      // Extract texts, ids, and metadata
      const texts = documents.map((doc) => doc.text);
      const ids = documents.map((doc) => doc.id || crypto.randomUUID());
      const metadatas = documents.map((doc) => doc.metadata || {});

      // Generate embeddings for all texts
      console.log(`📝 Generating embeddings for ${texts.length} documents...`);
      const embeddingResult = await embeddingService.embedBatch(texts);

      // Add to ChromaDB
      await collection.add({
        ids,
        documents: texts,
        embeddings: embeddingResult.embeddings,
        metadatas,
      });

      this.stats.documentsAdded += texts.length;

      console.log(`✅ Added ${texts.length} documents to ${collectionKey}`);
      console.log(`   Cache hits: ${embeddingResult.cached}/${texts.length}`);
      console.log(`   Time: ${embeddingResult.embedTime}ms`);

      return {
        success: true,
        count: texts.length,
        ids,
        embedTime: embeddingResult.embedTime,
        cached: embeddingResult.cached,
      };
    } catch (error) {
      console.error('Failed to add documents:', error);
      throw new Error(`Failed to add documents: ${error.message}`);
    }
  }

  /**
   * Search for similar documents
   */
  async search(collectionKey, query, options = {}) {
    if (!this.isInitialized) {
      throw new Error('ChromaDB not initialized');
    }

    const collection = this.getCollection(collectionKey);

    try {
      const {
        topK = aiConfig.vectorStore.searchTopK,
        where = null,
        whereDocument = null,
      } = options;

      // Generate query embedding
      const queryEmbedding = await embeddingService.embed(query);

      // Search in ChromaDB
      const results = await collection.query({
        queryEmbeddings: [queryEmbedding.embedding],
        nResults: topK,
        where,
        whereDocument,
      });

      this.stats.searchesPerformed++;

      // Format results
      const formattedResults = this.formatSearchResults(results, queryEmbedding.cached);

      return formattedResults;
    } catch (error) {
      console.error('Search error:', error);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  /**
   * Format search results
   */
  formatSearchResults(results, queryCached) {
    const documents = results.documents[0] || [];
    const metadatas = results.metadatas[0] || [];
    const distances = results.distances[0] || [];
    const ids = results.ids[0] || [];

    const formatted = documents.map((doc, idx) => ({
      id: ids[idx],
      content: doc,
      metadata: metadatas[idx],
      score: 1 - distances[idx], // Convert distance to similarity score (0-1)
      distance: distances[idx],
    }));

    return {
      results: formatted,
      count: formatted.length,
      queryCached,
    };
  }

  /**
   * Delete documents by ID
   */
  async deleteDocuments(collectionKey, ids) {
    if (!this.isInitialized) {
      throw new Error('ChromaDB not initialized');
    }

    const collection = this.getCollection(collectionKey);

    try {
      await collection.delete({
        ids,
      });

      return {
        success: true,
        deleted: ids.length,
      };
    } catch (error) {
      console.error('Delete error:', error);
      throw new Error(`Failed to delete documents: ${error.message}`);
    }
  }

  /**
   * Update documents
   */
  async updateDocuments(collectionKey, documents) {
    if (!this.isInitialized) {
      throw new Error('ChromaDB not initialized');
    }

    const collection = this.getCollection(collectionKey);

    try {
      const texts = documents.map((doc) => doc.text);
      const ids = documents.map((doc) => doc.id);
      const metadatas = documents.map((doc) => doc.metadata || {});

      // Generate new embeddings
      const embeddingResult = await embeddingService.embedBatch(texts);

      // Update in ChromaDB
      await collection.update({
        ids,
        documents: texts,
        embeddings: embeddingResult.embeddings,
        metadatas,
      });

      return {
        success: true,
        updated: ids.length,
        embedTime: embeddingResult.embedTime,
      };
    } catch (error) {
      console.error('Update error:', error);
      throw new Error(`Failed to update documents: ${error.message}`);
    }
  }

  /**
   * Get collection count
   */
  async getCount(collectionKey) {
    if (!this.isInitialized) {
      throw new Error('ChromaDB not initialized');
    }

    const collection = this.getCollection(collectionKey);

    try {
      const count = await collection.count();
      return count;
    } catch (error) {
      console.error('Count error:', error);
      return 0;
    }
  }

  /**
   * Clear collection
   */
  async clearCollection(collectionKey) {
    if (!this.isInitialized) {
      throw new Error('ChromaDB not initialized');
    }

    try {
      const collectionName = aiConfig.vectorStore.collections[collectionKey];

      // Delete and recreate collection
      await this.client.deleteCollection({ name: collectionName });
      const newCollection = await this.getOrCreateCollection(collectionName);
      this.collections.set(collectionKey, newCollection);

      return {
        success: true,
        collection: collectionKey,
      };
    } catch (error) {
      console.error('Clear collection error:', error);
      throw new Error(`Failed to clear collection: ${error.message}`);
    }
  }

  /**
   * Get statistics
   */
  async getStats() {
    const collectionCounts = {};

    for (const [key] of this.collections) {
      collectionCounts[key] = await this.getCount(key);
    }

    return {
      initialized: this.isInitialized,
      collections: collectionCounts,
      stats: this.stats,
      totalDocuments: Object.values(collectionCounts).reduce((a, b) => a + b, 0),
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      if (!this.isInitialized) {
        return {
          status: 'not_initialized',
          message: 'ChromaDB not initialized',
        };
      }

      await this.client.heartbeat();

      return {
        status: 'healthy',
        collections: this.collections.size,
        path: aiConfig.vectorStore.path,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }

  /**
   * Cleanup
   */
  async cleanup() {
    console.log('🧹 Cleaning up ChromaDB...');
    this.collections.clear();
    this.client = null;
    this.isInitialized = false;
    console.log('✅ ChromaDB cleaned up');
  }
}

// Singleton instance
const chromaService = new ChromaService();

export default chromaService;
