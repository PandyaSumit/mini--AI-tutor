/**
 * MCP Tools Setup
 * Register all MCP tools with the handler
 */

import mcpHandler from '../handlers/mcpHandler.js';
import {
  getUserProgress,
  searchCourses,
  getUserProfile,
  enrollCourse,
  getRecommendations,
  getUserAnalytics,
} from './tools/platformTools.js';
import logger from '../../utils/logger.js';

/**
 * Initialize and register all MCP tools
 */
export function setupMCPTools() {
  try {
    // Register user-related tools
    mcpHandler.registerTool('getUserProgress', getUserProgress);
    mcpHandler.registerTool('getUserProfile', getUserProfile);
    mcpHandler.registerTool('getUserAnalytics', getUserAnalytics);

    // Register course-related tools
    mcpHandler.registerTool('searchCourses', searchCourses);
    mcpHandler.registerTool('getRecommendations', getRecommendations);

    // Register action tools
    mcpHandler.registerTool('enrollCourse', enrollCourse);

    logger.info('MCP tools initialized successfully');

    return {
      success: true,
      toolsRegistered: 6,
    };
  } catch (error) {
    logger.error('Failed to setup MCP tools:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export default setupMCPTools;
