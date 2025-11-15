/**
 * Redis Connection Setup with Circuit Breaker
 */

const Redis = require('ioredis');
const cacheConfig = require('./cache');

class RedisClient {
  constructor() {
    this.client = null;
    this.circuitState = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.isConnected = false;
  }

  /**
   * Initialize Redis connection
   */
  async connect() {
    if (this.client) {
      return this.client;
    }

    const config = cacheConfig.REDIS;

    const options = {
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
      retryStrategy: (times) => {
        if (times > config.maxRetries) {
          console.error('❌ Redis: Max retries reached, giving up');
          return null;
        }
        const delay = Math.min(times * config.retryDelayMs, 2000);
        console.log(`🔄 Redis: Retry attempt ${times}, delay ${delay}ms`);
        return delay;
      },
      maxRetriesPerRequest: config.maxRetries,
      enableReadyCheck: true,
      connectTimeout: config.connectionTimeoutMs,
      commandTimeout: config.commandTimeoutMs,
      lazyConnect: true,
    };

    // Add TLS if enabled
    if (config.enableTLS) {
      options.tls = {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      };
    }

    this.client = new Redis(options);

    // Event handlers
    this.client.on('connect', () => {
      console.log('✅ Redis: Connected successfully');
      this.isConnected = true;
      this.resetCircuit();
    });

    this.client.on('ready', () => {
      console.log('✅ Redis: Ready to accept commands');
    });

    this.client.on('error', (err) => {
      console.error('❌ Redis: Connection error:', err.message);
      this.isConnected = false;
      this.recordFailure();
    });

    this.client.on('close', () => {
      console.log('⚠️  Redis: Connection closed');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      console.log('🔄 Redis: Reconnecting...');
    });

    try {
      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error('❌ Redis: Failed to connect:', error.message);
      this.recordFailure();
      return null;
    }
  }

  /**
   * Get Redis client instance
   */
  getClient() {
    return this.client;
  }

  /**
   * Check if circuit breaker allows operation
   */
  canExecute() {
    if (!cacheConfig.CIRCUIT_BREAKER.enabled) {
      return true;
    }

    if (this.circuitState === 'CLOSED') {
      return true;
    }

    if (this.circuitState === 'OPEN') {
      const now = Date.now();
      const timeSinceLastFailure = now - this.lastFailureTime;

      if (timeSinceLastFailure > cacheConfig.CIRCUIT_BREAKER.timeoutMs) {
        console.log('🔄 Circuit breaker: Transitioning to HALF_OPEN');
        this.circuitState = 'HALF_OPEN';
        return true;
      }

      return false;
    }

    // HALF_OPEN state - allow single request to test
    return true;
  }

  /**
   * Record a failure
   */
  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= cacheConfig.CIRCUIT_BREAKER.threshold) {
      if (this.circuitState !== 'OPEN') {
        console.error('⚠️  Circuit breaker: OPEN (too many failures)');
        this.circuitState = 'OPEN';
      }
    }
  }

  /**
   * Record a success
   */
  recordSuccess() {
    if (this.circuitState === 'HALF_OPEN') {
      console.log('✅ Circuit breaker: Transitioning to CLOSED');
      this.resetCircuit();
    }
  }

  /**
   * Reset circuit breaker
   */
  resetCircuit() {
    this.circuitState = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
  }

  /**
   * Execute command with circuit breaker
   */
  async executeWithCircuitBreaker(fn, fallback = null) {
    if (!this.canExecute()) {
      console.warn('⚠️  Circuit breaker OPEN - using fallback');
      if (fallback) {
        return await fallback();
      }
      return null;
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      console.error('Redis operation failed:', error.message);

      if (fallback) {
        return await fallback();
      }
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      console.log('✅ Redis: Disconnected');
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    if (!this.client || !this.isConnected) {
      return {
        status: 'down',
        circuitState: this.circuitState,
        failureCount: this.failureCount,
      };
    }

    try {
      await this.client.ping();
      return {
        status: 'up',
        circuitState: this.circuitState,
        failureCount: this.failureCount,
        isConnected: this.isConnected,
      };
    } catch (error) {
      return {
        status: 'down',
        error: error.message,
        circuitState: this.circuitState,
        failureCount: this.failureCount,
      };
    }
  }
}

// Singleton instance
const redisClient = new RedisClient();

module.exports = redisClient;
