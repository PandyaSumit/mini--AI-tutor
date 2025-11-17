/**
 * Base MCP Server Class
 * Implements Model Context Protocol for tool servers
 */

import { z } from 'zod';
import logger from '../../../utils/logger.js';
import Redis from 'ioredis';

export class MCPServer {
  constructor(name, description) {
    this.name = name;
    this.description = description;
    this.tools = new Map();
    this.stats = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      averageLatency: 0,
      callsByTool: {},
    };

    // Rate limiting (Redis-backed)
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: 4, // Dedicated DB for MCP rate limiting
    });

    logger.info(`MCP Server initialized: ${name}`);
  }

  /**
   * Register a tool
   */
  registerTool(toolDefinition) {
    const { name, description, inputSchema, auth, handler, rateLimit = 100 } = toolDefinition;

    if (!name || !handler) {
      throw new Error('Tool must have name and handler');
    }

    this.tools.set(name, {
      name,
      description: description || '',
      inputSchema: inputSchema || z.any(),
      auth: auth || ['any'],
      handler,
      rateLimit, // calls per minute
      enabled: true,
    });

    this.stats.callsByTool[name] = {
      total: 0,
      successful: 0,
      failed: 0,
    };

    logger.debug(`Tool registered: ${name}`);
  }

  /**
   * Get all tool definitions (for discovery)
   */
  getToolDefinitions() {
    const tools = [];

    for (const [name, tool] of this.tools.entries()) {
      if (!tool.enabled) continue;

      tools.push({
        name: tool.name,
        description: tool.description,
        inputSchema: this.schemaToJSON(tool.inputSchema),
        auth: tool.auth,
        server: this.name,
      });
    }

    return tools;
  }

  /**
   * Convert Zod schema to JSON schema
   */
  schemaToJSON(zodSchema) {
    try {
      // Simplified conversion - in production, use zod-to-json-schema library
      return {
        type: 'object',
        description: zodSchema.description || '',
      };
    } catch (error) {
      return { type: 'object' };
    }
  }

  /**
   * Execute a tool
   */
  async execute(toolName, input, context = {}) {
    const startTime = Date.now();

    try {
      // Get tool definition
      const tool = this.tools.get(toolName);

      if (!tool) {
        throw new Error(`Tool not found: ${toolName}`);
      }

      if (!tool.enabled) {
        throw new Error(`Tool disabled: ${toolName}`);
      }

      // Check rate limit
      await this.checkRateLimit(toolName, context.user?.id || context.ipAddress);

      // Validate input
      const validatedInput = await this.validateInput(tool.inputSchema, input);

      // Execute tool handler
      logger.debug(`Executing tool: ${toolName}`, { input: validatedInput });

      const result = await tool.handler(validatedInput, context);

      // Update stats
      const latency = Date.now() - startTime;
      this.updateStats(toolName, true, latency);

      logger.info(`Tool executed successfully: ${toolName}`, {
        latency,
        userId: context.user?.id,
      });

      return {
        success: true,
        tool: toolName,
        result,
        latency,
        server: this.name,
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      this.updateStats(toolName, false, latency);

      logger.error(`Tool execution failed: ${toolName}`, {
        error: error.message,
        latency,
        userId: context.user?.id,
      });

      return {
        success: false,
        tool: toolName,
        error: error.message,
        latency,
        server: this.name,
      };
    }
  }

  /**
   * Validate input against schema
   */
  async validateInput(schema, input) {
    try {
      return await schema.parseAsync(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        throw new Error(`Validation error: ${JSON.stringify(formattedErrors)}`);
      }

      throw error;
    }
  }

  /**
   * Check rate limit
   */
  async checkRateLimit(toolName, identifier) {
    if (!identifier) {
      identifier = 'anonymous';
    }

    const tool = this.tools.get(toolName);
    const key = `mcp:ratelimit:${this.name}:${toolName}:${identifier}`;

    try {
      const current = await this.redis.incr(key);

      if (current === 1) {
        // First call in this minute, set TTL
        await this.redis.expire(key, 60);
      }

      if (current > tool.rateLimit) {
        throw new Error(`Rate limit exceeded for ${toolName}: ${tool.rateLimit} calls/minute`);
      }
    } catch (error) {
      if (error.message.includes('Rate limit')) {
        throw error;
      }

      // If Redis fails, allow the call (fail open)
      logger.warn(`Rate limit check failed (allowing call): ${error.message}`);
    }
  }

  /**
   * Update statistics
   */
  updateStats(toolName, success, latency) {
    this.stats.totalCalls++;

    if (success) {
      this.stats.successfulCalls++;
    } else {
      this.stats.failedCalls++;
    }

    // Update average latency (moving average)
    const alpha = 0.1; // Weight for new value
    this.stats.averageLatency = alpha * latency + (1 - alpha) * this.stats.averageLatency;

    // Update tool-specific stats
    if (this.stats.callsByTool[toolName]) {
      this.stats.callsByTool[toolName].total++;

      if (success) {
        this.stats.callsByTool[toolName].successful++;
      } else {
        this.stats.callsByTool[toolName].failed++;
      }
    }
  }

  /**
   * Get server statistics
   */
  getStats() {
    return {
      server: this.name,
      description: this.description,
      tools: this.tools.size,
      stats: {
        ...this.stats,
        successRate: this.stats.totalCalls > 0
          ? Math.round((this.stats.successfulCalls / this.stats.totalCalls) * 100)
          : 0,
        averageLatency: Math.round(this.stats.averageLatency),
      },
      toolStats: this.stats.callsByTool,
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      // Check Redis connection
      await this.redis.ping();

      return {
        status: 'healthy',
        server: this.name,
        tools: this.tools.size,
        redis: 'connected',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        server: this.name,
        error: error.message,
      };
    }
  }

  /**
   * Cleanup
   */
  async cleanup() {
    try {
      await this.redis.quit();
      logger.info(`MCP Server cleaned up: ${this.name}`);
    } catch (error) {
      logger.error(`Error cleaning up MCP server ${this.name}:`, error);
    }
  }
}
