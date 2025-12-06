/**
 * BaseAgent - Abstract base class for all platform agents
 * Provides common functionality: logging, cost tracking, error handling
 */

import { EventEmitter } from 'events';
import AIUsageLog from '../../models/AIUsageLog.js';

class BaseAgent extends EventEmitter {
  constructor(name, config = {}) {
    super();
    this.name = name;
    this.config = config;
    this.isActive = false;

    // Cost tracking
    this.stats = {
      totalCost: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastActivity: null
    };

    // Dependencies (injected)
    this.dependencies = {};
  }

  /**
   * Initialize agent with dependencies
   */
  async initialize(dependencies = {}) {
    this.dependencies = { ...this.dependencies, ...dependencies };
    this.isActive = true;
    this.log('info', 'Agent initialized');
    return { success: true };
  }

  /**
   * Shutdown agent gracefully
   */
  async shutdown() {
    this.isActive = false;
    this.log('info', 'Agent shut down', { stats: this.stats });
    return { success: true };
  }

  /**
   * Execute agent task (must be implemented by subclasses)
   */
  async execute(task) {
    throw new Error(`Agent ${this.name} must implement execute() method`);
  }

  /**
   * Handle task with full lifecycle: logging, cost tracking, error handling
   */
  async handle(task) {
    if (!this.isActive) {
      throw new Error(`Agent ${this.name} is not active`);
    }

    const startTime = Date.now();
    const taskId = this.generateTaskId();

    this.log('info', 'Task started', { taskId, task: this.sanitizeTask(task) });

    try {
      // Execute the task
      const result = await this.execute(task);

      // Track metrics
      const duration = Date.now() - startTime;
      this.trackSuccess(duration, result.cost || 0);

      // Log usage if cost was incurred
      if (result.cost && result.cost > 0) {
        await this.logUsage({
          task,
          result,
          cost: result.cost,
          duration
        });
      }

      this.log('info', 'Task completed', {
        taskId,
        duration,
        cost: result.cost
      });

      // Emit success event
      this.emit('task:success', { taskId, task, result, duration });

      return {
        success: true,
        agent: this.name,
        taskId,
        result,
        duration,
        cost: result.cost || 0
      };

    } catch (error) {
      // Track failure
      this.trackFailure();

      this.log('error', 'Task failed', {
        taskId,
        error: error.message,
        stack: error.stack
      });

      // Emit failure event
      this.emit('task:failed', { taskId, task, error });

      return {
        success: false,
        agent: this.name,
        taskId,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Track successful execution
   */
  trackSuccess(duration, cost) {
    this.stats.totalRequests++;
    this.stats.successfulRequests++;
    this.stats.totalCost += cost;

    // Update average response time
    this.stats.averageResponseTime =
      (this.stats.averageResponseTime * (this.stats.successfulRequests - 1) + duration) /
      this.stats.successfulRequests;

    this.stats.lastActivity = new Date();
  }

  /**
   * Track failed execution
   */
  trackFailure() {
    this.stats.totalRequests++;
    this.stats.failedRequests++;
    this.stats.lastActivity = new Date();
  }

  /**
   * Log usage to database
   */
  async logUsage({ task, result, cost, duration }) {
    try {
      await AIUsageLog.create({
        agent_name: this.name,
        user_id: task.user_id,
        course_id: task.course_id,
        feature: task.feature || this.name,
        query: task.query || JSON.stringify(task).slice(0, 500),
        routing_decision: result.routing_decision || 'agent_execution',
        cost,
        response_time_ms: duration,
        timestamp: new Date()
      });
    } catch (error) {
      this.log('error', 'Failed to log usage', { error: error.message });
    }
  }

  /**
   * Logging helper
   */
  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      agent: this.name,
      level,
      message,
      ...data
    };

    // Emit log event (for centralized logging)
    this.emit('log', logEntry);

    // Also console log for development
    if (level === 'error') {
      console.error(`[${timestamp}] [${this.name}] ERROR:`, message, data);
    } else if (process.env.DEBUG_AGENTS) {
      console.log(`[${timestamp}] [${this.name}] ${level.toUpperCase()}:`, message);
    }
  }

  /**
   * Generate unique task ID
   */
  generateTaskId() {
    return `${this.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sanitize task for logging (remove sensitive data)
   */
  sanitizeTask(task) {
    const sanitized = { ...task };
    delete sanitized.api_key;
    delete sanitized.password;
    delete sanitized.token;
    return sanitized;
  }

  /**
   * Get agent statistics
   */
  getStats() {
    return {
      agent: this.name,
      isActive: this.isActive,
      stats: { ...this.stats },
      config: this.config
    };
  }
}

export default BaseAgent;
