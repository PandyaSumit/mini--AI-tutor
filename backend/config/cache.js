/**
 * Cache Configuration
 * Centralized TTL and cache strategy settings
 */

const cacheConfig = {
  // Cache TTL values (in seconds)
  TTL: {
    // Chat & Conversations
    CONVERSATION_MESSAGES: 3600,        // 1 hour
    CONVERSATION_LIST: 1800,            // 30 minutes

    // Roadmaps
    ROADMAP_DETAIL: 86400,              // 24 hours
    ROADMAP_STATS: 21600,               // 6 hours
    ROADMAP_LIST: 86400,                // 24 hours

    // Flashcards & Quizzes
    FLASHCARD_DECK: 604800,             // 7 days
    FLASHCARD_LIST: 604800,             // 7 days
    QUIZ_CONTENT: 2592000,              // 30 days
    QUIZ_ATTEMPTS: 86400,               // 24 hours

    // User Data
    USER_PROFILE_PUBLIC: 300,           // 5 minutes
    USER_STATS: 900,                    // 15 minutes
    USER_PREFERENCES: 3600,             // 1 hour

    // Infrastructure
    DISTRIBUTED_LOCK: 10,               // 10 seconds
    RATE_LIMIT_WINDOW: 900,             // 15 minutes
    TOKEN_BLACKLIST: 2592000,           // 30 days (match JWT expiry)
  },

  // Stale-While-Revalidate multiplier
  SWR_MULTIPLIER: 2,

  // Cache version for schema evolution
  CACHE_VERSION: process.env.CACHE_SCHEMA_VERSION || 'v1',

  // Redis connection settings
  REDIS: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0'),
    enableTLS: process.env.REDIS_TLS_ENABLED === 'true',
    maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
    retryDelayMs: parseInt(process.env.REDIS_RETRY_DELAY_MS || '100'),
    connectionTimeoutMs: parseInt(process.env.REDIS_CONNECTION_TIMEOUT_MS || '5000'),
    commandTimeoutMs: parseInt(process.env.REDIS_COMMAND_TIMEOUT_MS || '3000'),
  },

  // Circuit breaker settings
  CIRCUIT_BREAKER: {
    enabled: process.env.CIRCUIT_BREAKER_ENABLED !== 'false',
    threshold: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD || '5'),
    timeoutMs: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT_MS || '60000'),
  },

  // Rate limiting
  RATE_LIMIT: {
    enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    windowSeconds: parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS || '900'),
  },

  // Cache features
  FEATURES: {
    enabled: process.env.CACHE_ENABLED !== 'false',
    enableSWR: process.env.CACHE_ENABLE_SWR !== 'false',
    enableStampedePrevention: process.env.CACHE_ENABLE_STAMPEDE_PROTECTION !== 'false',
    metricsEnabled: process.env.CACHE_METRICS_ENABLED !== 'false',
  },

  // Key prefixes (namespaces)
  PREFIXES: {
    CONVERSATION: 'conv',
    MESSAGE: 'msg',
    USER: 'user',
    ROADMAP: 'roadmap',
    FLASHCARD: 'flashcard',
    QUIZ: 'quiz',
    TAG: 'tag',
    LOCK: 'lock',
    RATE: 'rate',
    METRIC: 'metric',
    BLACKLIST: 'blacklist',
  },
};

export default cacheConfig;
