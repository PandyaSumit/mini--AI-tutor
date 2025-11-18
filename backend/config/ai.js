/**
 * AI Pipeline Configuration
 * Settings for LangChain, LangGraph, Embeddings, Vector Store, MCP Server
 */

const aiConfig = {
  // ============================================
  // LLM Configuration (Groq)
  // ============================================
  llm: {
    provider: 'groq',
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '2048'),
    streaming: process.env.LLM_STREAMING !== 'false',
    timeout: parseInt(process.env.LLM_TIMEOUT_MS || '60000'),
  },

  // ============================================
  // Embeddings Configuration (Local, Free)
  // ============================================
  embeddings: {
    // Primary embedding model
    model: process.env.EMBEDDING_MODEL || 'Xenova/bge-small-en-v1.5',

    // Model options and fallbacks
    models: {
      primary: 'Xenova/bge-small-en-v1.5',      // 384 dim, fast, high quality
      secondary: 'Xenova/gte-small',            // 384 dim, alternative
      fallback: 'Xenova/all-MiniLM-L6-v2',      // 384 dim, very fast
    },

    // Embedding dimensions
    dimensions: 384,

    // Batch processing
    batchSize: parseInt(process.env.EMBEDDING_BATCH_SIZE || '32'),
    maxBatchWaitMs: parseInt(process.env.EMBEDDING_MAX_WAIT_MS || '100'),

    // Performance
    device: process.env.EMBEDDING_DEVICE || 'cpu', // 'cpu' or 'gpu'
    numThreads: parseInt(process.env.EMBEDDING_THREADS || '4'),

    // Caching
    cacheEnabled: process.env.EMBEDDING_CACHE_ENABLED !== 'false',
    cacheTTL: parseInt(process.env.EMBEDDING_CACHE_TTL || '86400'), // 24 hours
    lruCacheSize: parseInt(process.env.EMBEDDING_LRU_SIZE || '1000'), // In-memory cache
  },

  // ============================================
  // Vector Database Configuration (ChromaDB)
  // ============================================
  vectorStore: {
    // ChromaDB connection
    host: process.env.CHROMA_HOST || 'localhost',
    port: parseInt(process.env.CHROMA_PORT || '8000'),
    path: process.env.CHROMA_PATH || './data/chromadb',

    // Collection settings
    collections: {
      knowledge: 'knowledge_base',
      conversations: 'conversations',
      courses: 'courses',
      roadmaps: 'roadmaps',
      flashcards: 'flashcards',
      notes: 'user_notes',
    },

    // Search settings
    searchTopK: parseInt(process.env.VECTOR_SEARCH_TOP_K || '5'),
    searchThreshold: parseFloat(process.env.VECTOR_SEARCH_THRESHOLD || '0.5'),

    // Index settings (HNSW)
    indexType: 'hnsw',
    hnswM: parseInt(process.env.HNSW_M || '16'),           // Connections per node
    hnswEfConstruct: parseInt(process.env.HNSW_EF_CONSTRUCT || '200'),
    hnswEfSearch: parseInt(process.env.HNSW_EF_SEARCH || '50'),

    // Caching
    cacheEnabled: process.env.VECTOR_CACHE_ENABLED !== 'false',
    cacheTTL: parseInt(process.env.VECTOR_CACHE_TTL || '3600'), // 1 hour
  },

  // ============================================
  // RAG (Retrieval Augmented Generation)
  // ============================================
  rag: {
    // Retrieval settings
    topK: parseInt(process.env.RAG_TOP_K || '5'),
    minScore: parseFloat(process.env.RAG_MIN_SCORE || '0.5'),
    maxContextLength: parseInt(process.env.RAG_MAX_CONTEXT_LENGTH || '4000'),

    // Context window optimization
    useCompression: process.env.RAG_USE_COMPRESSION !== 'false',
    compressionRatio: parseFloat(process.env.RAG_COMPRESSION_RATIO || '0.5'),

    // Reranking
    enableReranking: process.env.RAG_RERANKING === 'true',

    // Caching
    cacheResponses: process.env.RAG_CACHE_RESPONSES !== 'false',
    responseCacheTTL: parseInt(process.env.RAG_RESPONSE_CACHE_TTL || '3600'),
  },

  // ============================================
  // LangGraph Configuration
  // ============================================
  graph: {
    // Execution settings
    maxIterations: parseInt(process.env.GRAPH_MAX_ITERATIONS || '10'),
    timeout: parseInt(process.env.GRAPH_TIMEOUT_MS || '120000'), // 2 minutes

    // Retry logic
    maxRetries: parseInt(process.env.GRAPH_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.GRAPH_RETRY_DELAY_MS || '1000'),

    // Memory settings
    memoryType: process.env.GRAPH_MEMORY_TYPE || 'buffer', // 'buffer' or 'summary'
    memoryMaxMessages: parseInt(process.env.GRAPH_MEMORY_MAX_MESSAGES || '10'),

    // Debugging
    verbose: process.env.GRAPH_VERBOSE === 'true',
    logSteps: process.env.GRAPH_LOG_STEPS === 'true',
  },

  // ============================================
  // MCP Server Configuration
  // ============================================
  mcp: {
    // Server settings
    enabled: process.env.MCP_ENABLED !== 'false',
    port: parseInt(process.env.MCP_PORT || '3001'),

    // Tool execution
    timeout: parseInt(process.env.MCP_TOOL_TIMEOUT || '30000'),
    maxConcurrent: parseInt(process.env.MCP_MAX_CONCURRENT || '5'),

    // Security
    sandbox: process.env.MCP_SANDBOX !== 'false',
    allowedOperations: (process.env.MCP_ALLOWED_OPERATIONS || 'read,search,scrape').split(','),

    // Resource limits
    maxFileSize: parseInt(process.env.MCP_MAX_FILE_SIZE || '10485760'), // 10MB
    maxExecutionTime: parseInt(process.env.MCP_MAX_EXECUTION_TIME || '10000'), // 10s
    maxMemory: parseInt(process.env.MCP_MAX_MEMORY || '536870912'), // 512MB

    // Caching
    cacheEnabled: process.env.MCP_CACHE_ENABLED !== 'false',
    cacheTTL: parseInt(process.env.MCP_CACHE_TTL || '3600'),

    // Tool-specific settings
    tools: {
      webSearch: {
        enabled: process.env.MCP_TOOL_WEB_SEARCH !== 'false',
        maxResults: parseInt(process.env.MCP_WEB_SEARCH_MAX_RESULTS || '10'),
      },
      scraping: {
        enabled: process.env.MCP_TOOL_SCRAPING !== 'false',
        maxPages: parseInt(process.env.MCP_SCRAPING_MAX_PAGES || '5'),
        timeout: parseInt(process.env.MCP_SCRAPING_TIMEOUT || '10000'),
      },
      fileOps: {
        enabled: process.env.MCP_TOOL_FILE_OPS !== 'false',
        allowedPaths: (process.env.MCP_ALLOWED_PATHS || './data,./uploads').split(','),
      },
      codeExec: {
        enabled: process.env.MCP_TOOL_CODE_EXEC === 'true', // Disabled by default
        allowedLanguages: (process.env.MCP_CODE_LANGUAGES || 'python,javascript').split(','),
      },
    },
  },

  // ============================================
  // Memory Configuration
  // ============================================
  memory: {
    // Conversation memory
    conversationBufferSize: parseInt(process.env.MEMORY_BUFFER_SIZE || '10'),
    conversationTTL: parseInt(process.env.MEMORY_CONVERSATION_TTL || '3600'),

    // Summary memory
    useSummary: process.env.MEMORY_USE_SUMMARY === 'true',
    summaryEveryN: parseInt(process.env.MEMORY_SUMMARY_EVERY_N || '5'),
    summaryMaxTokens: parseInt(process.env.MEMORY_SUMMARY_MAX_TOKENS || '500'),

    // Vector memory (semantic)
    useVectorMemory: process.env.MEMORY_USE_VECTOR !== 'false',
    vectorMemoryTopK: parseInt(process.env.MEMORY_VECTOR_TOP_K || '3'),

    // Storage
    backend: process.env.MEMORY_BACKEND || 'redis', // 'redis' or 'mongodb'
  },

  // ============================================
  // Security Configuration
  // ============================================
  security: {
    // Input validation
    maxInputLength: parseInt(process.env.SECURITY_MAX_INPUT_LENGTH || '10000'),
    validateInputs: process.env.SECURITY_VALIDATE_INPUTS !== 'false',

    // Prompt injection detection
    detectInjection: process.env.SECURITY_DETECT_INJECTION !== 'false',
    injectionThreshold: parseFloat(process.env.SECURITY_INJECTION_THRESHOLD || '0.7'),

    // Sanitization
    sanitizeOutputs: process.env.SECURITY_SANITIZE_OUTPUTS !== 'false',
    allowedTags: (process.env.SECURITY_ALLOWED_TAGS || 'p,br,strong,em,code,pre').split(','),

    // Rate limiting (AI-specific)
    rateLimiting: {
      enabled: process.env.AI_RATE_LIMIT_ENABLED !== 'false',

      // Tiers
      free: {
        requestsPerHour: parseInt(process.env.AI_RATE_FREE_REQUESTS || '100'),
        aiCallsPerHour: parseInt(process.env.AI_RATE_FREE_AI_CALLS || '10'),
        embeddingsPerHour: parseInt(process.env.AI_RATE_FREE_EMBEDDINGS || '100'),
      },
      pro: {
        requestsPerHour: parseInt(process.env.AI_RATE_PRO_REQUESTS || '1000'),
        aiCallsPerHour: parseInt(process.env.AI_RATE_PRO_AI_CALLS || '100'),
        embeddingsPerHour: parseInt(process.env.AI_RATE_PRO_EMBEDDINGS || '1000'),
      },
      enterprise: {
        requestsPerHour: parseInt(process.env.AI_RATE_ENTERPRISE_REQUESTS || '10000'),
        aiCallsPerHour: parseInt(process.env.AI_RATE_ENTERPRISE_AI_CALLS || '1000'),
        embeddingsPerHour: parseInt(process.env.AI_RATE_ENTERPRISE_EMBEDDINGS || '10000'),
      },
    },
  },

  // ============================================
  // Cost Optimization
  // ============================================
  optimization: {
    // Token optimization
    reduceContext: process.env.OPTIMIZE_REDUCE_CONTEXT !== 'false',
    useStreaming: process.env.OPTIMIZE_USE_STREAMING !== 'false',
    compressHistory: process.env.OPTIMIZE_COMPRESS_HISTORY !== 'false',

    // Caching strategy
    aggressiveCaching: process.env.OPTIMIZE_AGGRESSIVE_CACHE === 'true',
    deduplicateQueries: process.env.OPTIMIZE_DEDUPE_QUERIES !== 'false',

    // Embedding optimization
    reuseEmbeddings: process.env.OPTIMIZE_REUSE_EMBEDDINGS !== 'false',
    batchEmbeddings: process.env.OPTIMIZE_BATCH_EMBEDDINGS !== 'false',

    // Target metrics
    targetCacheHitRatio: parseFloat(process.env.OPTIMIZE_TARGET_CACHE_RATIO || '0.85'),
    targetTokenReduction: parseFloat(process.env.OPTIMIZE_TARGET_TOKEN_REDUCTION || '0.60'),
  },

  // ============================================
  // Monitoring & Analytics
  // ============================================
  monitoring: {
    // Metrics collection
    enabled: process.env.MONITORING_ENABLED !== 'false',
    collectInterval: parseInt(process.env.MONITORING_INTERVAL || '60000'), // 1 minute

    // Tracked metrics
    trackTokens: process.env.MONITORING_TRACK_TOKENS !== 'false',
    trackLatency: process.env.MONITORING_TRACK_LATENCY !== 'false',
    trackCacheHits: process.env.MONITORING_TRACK_CACHE !== 'false',
    trackCosts: process.env.MONITORING_TRACK_COSTS !== 'false',

    // Alerts
    alertOnHighCost: process.env.MONITORING_ALERT_HIGH_COST === 'true',
    costThreshold: parseFloat(process.env.MONITORING_COST_THRESHOLD || '100'), // $100

    // Storage
    metricsRetention: parseInt(process.env.MONITORING_RETENTION_DAYS || '30'),
  },

  // ============================================
  // Feature Flags
  // ============================================
  features: {
    enableRAG: process.env.FEATURE_RAG !== 'false',
    enableAgents: process.env.FEATURE_AGENTS !== 'false',
    enableTools: process.env.FEATURE_TOOLS !== 'false',
    enableStreaming: process.env.FEATURE_STREAMING !== 'false',
    enableVectorSearch: process.env.FEATURE_VECTOR_SEARCH !== 'false',
    enableMemory: process.env.FEATURE_MEMORY !== 'false',
  },
};

export default aiConfig;
