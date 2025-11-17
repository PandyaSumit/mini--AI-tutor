/**
 * MCP Handler - Safe Tool Execution
 * Handles platform action requests via MCP tools with privacy protection
 */

import logger from '../../utils/logger.js';

class MCPHandler {
  constructor() {
    this.toolRegistry = new Map();
    this.privacySafeFields = {
      user: ['firstName', 'lastName', 'email', 'role', 'enrolledCourses', 'skillLevel'],
      course: ['title', 'description', 'difficulty', 'duration', 'lessons', 'modules'],
      progress: ['courseId', 'progress', 'completedLessons', 'totalLessons', 'lastAccessed'],
    };
  }

  /**
   * Register MCP tool
   */
  registerTool(name, handler) {
    this.toolRegistry.set(name, handler);
    logger.info(`MCP tool registered: ${name}`);
  }

  /**
   * Filter sensitive data from tool response
   */
  filterSensitiveData(data, entityType = 'generic') {
    if (!data) return data;

    const safeFields = this.privacySafeFields[entityType] || [];

    if (Array.isArray(data)) {
      return data.map(item => this.filterSensitiveData(item, entityType));
    }

    if (typeof data === 'object' && data !== null) {
      const filtered = {};

      for (const [key, value] of Object.entries(data)) {
        // Skip sensitive fields
        if (key.match(/_id$|password|token|secret|key|internal|admin|private/i)) {
          continue;
        }

        // Include safe fields
        if (safeFields.length === 0 || safeFields.includes(key)) {
          filtered[key] = typeof value === 'object'
            ? this.filterSensitiveData(value, entityType)
            : value;
        }
      }

      return filtered;
    }

    return data;
  }

  /**
   * Detect which MCP tool to call based on query
   */
  async detectToolIntent(query, conversationContext = {}) {
    const queryLower = query.toLowerCase();

    // Progress queries
    if (queryLower.match(/\b(my )?(progress|completion|status|how (much|far))\b/i)) {
      return {
        tool: 'getUserProgress',
        confidence: 0.85,
        params: { userId: conversationContext.userId },
      };
    }

    // Course search/retrieval
    if (queryLower.match(/\b(find|get|show|provide|search for|give me).*(course|lesson|tutorial)\b/i)) {
      const courseMatch = query.match(/(?:course|tutorial|lesson) (?:on|about|for) ([a-zA-Z0-9\s]+)/i);
      const topic = courseMatch ? courseMatch[1].trim() : null;

      return {
        tool: 'searchCourses',
        confidence: 0.80,
        params: { query: topic || query, limit: 5 },
      };
    }

    // User identity
    if (queryLower.match(/\b(who am i|my (name|profile|info|details))\b/i)) {
      return {
        tool: 'getUserProfile',
        confidence: 0.90,
        params: { userId: conversationContext.userId },
      };
    }

    // Enrollment queries
    if (queryLower.match(/\b(enroll|join|register|sign up|start).*(course|class)\b/i)) {
      return {
        tool: 'enrollCourse',
        confidence: 0.75,
        params: { userId: conversationContext.userId },
      };
    }

    // Course recommendations
    if (queryLower.match(/\b(recommend|suggest|what should i|best course)\b/i)) {
      return {
        tool: 'getRecommendations',
        confidence: 0.80,
        params: { userId: conversationContext.userId },
      };
    }

    return null;
  }

  /**
   * Execute MCP tool safely
   */
  async executeTool(toolName, params = {}) {
    const handler = this.toolRegistry.get(toolName);

    if (!handler) {
      logger.warn(`MCP tool not found: ${toolName}`);
      return {
        success: false,
        error: 'Tool not available',
        message: 'This feature is currently not available.',
      };
    }

    try {
      logger.info(`Executing MCP tool: ${toolName}`, { params: this.sanitizeParams(params) });

      const result = await handler(params);

      // Filter sensitive data
      const entityType = this.getEntityType(toolName);
      const filtered = this.filterSensitiveData(result.data, entityType);

      return {
        success: true,
        data: filtered,
        metadata: {
          tool: toolName,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error(`MCP tool execution failed: ${toolName}`, error);

      return {
        success: false,
        error: error.message,
        message: 'Sorry, I encountered an error accessing that information.',
      };
    }
  }

  /**
   * Handle platform action query
   */
  async handlePlatformAction(query, options = {}) {
    const { userId, conversationHistory = [] } = options;

    // Detect tool intent
    const toolIntent = await this.detectToolIntent(query, { userId });

    if (!toolIntent) {
      return {
        handled: false,
        message: 'I understand you want platform information, but I\'m not sure exactly what. Could you be more specific?',
      };
    }

    // Execute tool
    const result = await this.executeTool(toolIntent.tool, toolIntent.params);

    if (!result.success) {
      return {
        handled: true,
        success: false,
        message: result.message || 'I couldn\'t retrieve that information right now.',
        error: result.error,
      };
    }

    // Format response
    const formattedResponse = this.formatToolResponse(toolIntent.tool, result.data);

    return {
      handled: true,
      success: true,
      data: result.data,
      message: formattedResponse,
      tool: toolIntent.tool,
      confidence: toolIntent.confidence,
    };
  }

  /**
   * Format tool response for user
   */
  formatToolResponse(toolName, data) {
    switch (toolName) {
      case 'getUserProgress':
        return this.formatProgressResponse(data);

      case 'searchCourses':
        return this.formatCoursesResponse(data);

      case 'getUserProfile':
        return this.formatProfileResponse(data);

      case 'getRecommendations':
        return this.formatRecommendationsResponse(data);

      default:
        return JSON.stringify(data, null, 2);
    }
  }

  /**
   * Format progress response
   */
  formatProgressResponse(data) {
    if (!data || data.length === 0) {
      return "You haven't started any courses yet. Let me know if you want recommendations!";
    }

    const progressList = data.map(item => {
      const percentage = ((item.completedLessons / item.totalLessons) * 100).toFixed(0);
      return `• **${item.courseTitle}**: ${percentage}% complete (${item.completedLessons}/${item.totalLessons} lessons)`;
    }).join('\n');

    return `Here's your learning progress:\n\n${progressList}`;
  }

  /**
   * Format courses response
   */
  formatCoursesResponse(data) {
    if (!data || data.length === 0) {
      return "I couldn't find any courses matching that topic in our database. Would you like a general explanation or external resources?";
    }

    const courseList = data.map((course, idx) => {
      return `${idx + 1}. **${course.title}**\n   ${course.description}\n   Difficulty: ${course.difficulty} | Duration: ${course.duration || 'N/A'}`;
    }).join('\n\n');

    return `I found these courses for you:\n\n${courseList}`;
  }

  /**
   * Format profile response
   */
  formatProfileResponse(data) {
    if (!data) {
      return "I only know what you share with me during this conversation. You can tell me more about yourself if you'd like!";
    }

    const name = data.firstName && data.lastName
      ? `${data.firstName} ${data.lastName}`
      : data.email;

    const enrolled = data.enrolledCourses
      ? `\nYou're enrolled in ${data.enrolledCourses.length} course(s).`
      : '';

    return `You are **${name}**${enrolled}`;
  }

  /**
   * Format recommendations response
   */
  formatRecommendationsResponse(data) {
    if (!data || data.length === 0) {
      return "I don't have enough information to make personalized recommendations yet. What topics are you interested in?";
    }

    const recList = data.map((rec, idx) => {
      return `${idx + 1}. **${rec.title}** - ${rec.reason}`;
    }).join('\n');

    return `Based on your profile, I recommend:\n\n${recList}`;
  }

  /**
   * Get entity type for filtering
   */
  getEntityType(toolName) {
    if (toolName.includes('User') || toolName.includes('Profile')) {
      return 'user';
    }
    if (toolName.includes('Course') || toolName.includes('Lesson')) {
      return 'course';
    }
    if (toolName.includes('Progress')) {
      return 'progress';
    }
    return 'generic';
  }

  /**
   * Sanitize params for logging (remove sensitive data)
   */
  sanitizeParams(params) {
    const sanitized = { ...params };
    if (sanitized.password) sanitized.password = '***';
    if (sanitized.token) sanitized.token = '***';
    return sanitized;
  }
}

// Singleton instance
const mcpHandler = new MCPHandler();

export default mcpHandler;
