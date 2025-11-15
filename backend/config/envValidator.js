/**
 * Environment Variable Validator
 * Validates required environment variables for AI pipeline
 */

class EnvValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validate all required environment variables
   */
  validate() {
    console.log('🔍 Validating environment variables...');

    // Required for basic operation
    this.checkRequired('NODE_ENV', 'development');
    this.checkRequired('PORT', '5000');
    this.checkRequired('MONGODB_URI');
    this.checkRequired('JWT_SECRET');

    // LLM Configuration (critical)
    this.checkRequired('GROQ_API_KEY', null, true); // Critical
    this.checkRequired('GROQ_MODEL', 'llama-3.3-70b-versatile');

    // AI Pipeline (with defaults)
    this.checkOptional('EMBEDDING_MODEL', 'Xenova/bge-small-en-v1.5');
    this.checkOptional('CHROMA_PATH', './data/chromadb');
    this.checkOptional('CACHE_ENABLED', 'true');
    this.checkOptional('FEATURE_RAG', 'true');
    this.checkOptional('FEATURE_VECTOR_SEARCH', 'true');

    // Redis (important but has fallback)
    this.checkOptional('REDIS_HOST', 'localhost');
    this.checkOptional('REDIS_PORT', '6379');

    // Report results
    if (this.errors.length > 0) {
      console.error('\n❌ Environment validation failed:');
      this.errors.forEach((err) => console.error(`   - ${err}`));
      console.error('');
      return { valid: false, errors: this.errors, warnings: this.warnings };
    }

    if (this.warnings.length > 0) {
      console.warn('\n⚠️  Environment warnings:');
      this.warnings.forEach((warn) => console.warn(`   - ${warn}`));
      console.warn('');
    }

    console.log('✅ Environment validation passed');
    return { valid: true, errors: [], warnings: this.warnings };
  }

  /**
   * Check required variable
   */
  checkRequired(key, defaultValue = null, critical = false) {
    const value = process.env[key];

    if (!value || value.trim() === '') {
      if (defaultValue) {
        process.env[key] = defaultValue;
        this.warnings.push(`${key} not set, using default: ${defaultValue}`);
      } else if (critical) {
        this.errors.push(`${key} is required and not set (CRITICAL)`);
      } else {
        this.errors.push(`${key} is required and not set`);
      }
    }
  }

  /**
   * Check optional variable
   */
  checkOptional(key, defaultValue) {
    const value = process.env[key];

    if (!value || value.trim() === '') {
      process.env[key] = defaultValue;
      // Don't warn for optional vars with defaults
    }
  }

  /**
   * Validate AI-specific configuration
   */
  validateAIConfig() {
    const checks = {
      embeddings: this.checkEmbeddingsConfig(),
      vectorStore: this.checkVectorStoreConfig(),
      llm: this.checkLLMConfig(),
      caching: this.checkCachingConfig(),
    };

    return checks;
  }

  checkEmbeddingsConfig() {
    const model = process.env.EMBEDDING_MODEL;
    const validModels = [
      'Xenova/bge-small-en-v1.5',
      'Xenova/gte-small',
      'Xenova/all-MiniLM-L6-v2',
    ];

    if (model && !validModels.includes(model)) {
      this.warnings.push(`Unknown embedding model: ${model}. May not work.`);
    }

    return { valid: true, model };
  }

  checkVectorStoreConfig() {
    const path = process.env.CHROMA_PATH;

    if (!path) {
      this.warnings.push('CHROMA_PATH not set, using default: ./data/chromadb');
    }

    return { valid: true, path };
  }

  checkLLMConfig() {
    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL;

    if (!apiKey) {
      this.errors.push('GROQ_API_KEY not set - AI features will not work');
      return { valid: false };
    }

    if (!model) {
      this.warnings.push('GROQ_MODEL not set, using default: llama-3.3-70b-versatile');
    }

    return { valid: true };
  }

  checkCachingConfig() {
    const enabled = process.env.CACHE_ENABLED !== 'false';
    const redisHost = process.env.REDIS_HOST;

    if (enabled && !redisHost) {
      this.warnings.push('Caching enabled but REDIS_HOST not set');
    }

    return { valid: true, enabled };
  }
}

export default new EnvValidator();
