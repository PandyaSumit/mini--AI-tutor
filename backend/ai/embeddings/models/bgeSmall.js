/**
 * BGE-Small Embedding Model Loader
 * Uses Xenova Transformers for local, free embeddings
 * Model: BAAI/bge-small-en-v1.5 (384 dimensions)
 */

import { pipeline } from '@xenova/transformers';
import aiConfig from '../../../config/ai.js';

class BGESmallModel {
  constructor() {
    this.model = null;
    this.modelName = 'Xenova/bge-small-en-v1.5';
    this.dimensions = 384;
    this.isLoading = false;
    this.loadPromise = null;
  }

  /**
   * Load the embedding model (lazy loading)
   */
  async load() {
    if (this.model) {
      return this.model;
    }

    if (this.isLoading) {
      // Wait for existing load to complete
      return this.loadPromise;
    }

    this.isLoading = true;
    console.log(`📦 Loading BGE-small embedding model (${this.modelName})...`);

    this.loadPromise = (async () => {
      try {
        const startTime = Date.now();

        // Load feature extraction pipeline
        this.model = await pipeline('feature-extraction', this.modelName, {
          quantized: true, // Use quantized model for faster inference
          progress_callback: (progress) => {
            if (progress.status === 'progress' && progress.progress) {
              const percent = Math.round(progress.progress * 100);
              if (percent % 20 === 0) { // Log every 20%
                console.log(`   Loading: ${percent}%`);
              }
            }
          },
        });

        const loadTime = Date.now() - startTime;
        console.log(`✅ BGE-small model loaded successfully (${loadTime}ms)`);
        console.log(`   Model: ${this.modelName}`);
        console.log(`   Dimensions: ${this.dimensions}`);
        console.log(`   Device: ${aiConfig.embeddings.device}`);

        this.isLoading = false;
        return this.model;
      } catch (error) {
        this.isLoading = false;
        console.error('❌ Failed to load BGE-small model:', error.message);
        throw new Error(`Failed to load embedding model: ${error.message}`);
      }
    })();

    return this.loadPromise;
  }

  /**
   * Generate embeddings for a single text
   */
  async embed(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Text must be a non-empty string');
    }

    // Ensure model is loaded
    const model = await this.load();

    try {
      const startTime = Date.now();

      // Generate embedding
      const output = await model(text, {
        pooling: 'mean', // Mean pooling
        normalize: true, // L2 normalization
      });

      // Extract embedding array
      const embedding = Array.from(output.data);

      const embedTime = Date.now() - startTime;

      return {
        embedding,
        dimensions: this.dimensions,
        embedTime,
        model: this.modelName,
      };
    } catch (error) {
      console.error('Embedding generation error:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple texts (batch)
   */
  async embedBatch(texts) {
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('Texts must be a non-empty array');
    }

    // Validate all texts
    for (const text of texts) {
      if (!text || typeof text !== 'string') {
        throw new Error('All texts must be non-empty strings');
      }
    }

    // Ensure model is loaded
    const model = await this.load();

    try {
      const startTime = Date.now();

      // Process in batches for efficiency
      const batchSize = aiConfig.embeddings.batchSize;
      const embeddings = [];

      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);

        // Generate embeddings for batch
        const outputs = await Promise.all(
          batch.map((text) =>
            model(text, {
              pooling: 'mean',
              normalize: true,
            })
          )
        );

        // Extract embedding arrays
        const batchEmbeddings = outputs.map((output) => Array.from(output.data));
        embeddings.push(...batchEmbeddings);
      }

      const embedTime = Date.now() - startTime;

      return {
        embeddings,
        count: texts.length,
        dimensions: this.dimensions,
        embedTime,
        avgTime: Math.round(embedTime / texts.length),
        model: this.modelName,
      };
    } catch (error) {
      console.error('Batch embedding generation error:', error);
      throw new Error(`Failed to generate batch embeddings: ${error.message}`);
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(embedding1, embedding2) {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have same dimensions');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Get model info
   */
  getInfo() {
    return {
      name: this.modelName,
      dimensions: this.dimensions,
      loaded: this.model !== null,
      device: aiConfig.embeddings.device,
      quantized: true,
    };
  }

  /**
   * Unload model from memory (for cleanup)
   */
  async unload() {
    if (this.model) {
      console.log('🧹 Unloading BGE-small model from memory...');
      this.model = null;
      this.isLoading = false;
      this.loadPromise = null;

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      console.log('✅ Model unloaded');
    }
  }
}

// Singleton instance
const bgeSmallModel = new BGESmallModel();

export default bgeSmallModel;
