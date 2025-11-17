/**
 * Simple Logger Utility
 * Provides consistent logging across the application
 */

const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

class Logger {
  constructor(options = {}) {
    this.level = options.level || process.env.LOG_LEVEL || 'info';
    this.enableColors = options.enableColors !== false;
  }

  /**
   * Format log message with timestamp and level
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  }

  /**
   * Log error message
   */
  error(message, meta = {}) {
    console.error(this.formatMessage('error', message, meta));
  }

  /**
   * Log warning message
   */
  warn(message, meta = {}) {
    console.warn(this.formatMessage('warn', message, meta));
  }

  /**
   * Log info message
   */
  info(message, meta = {}) {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, meta));
    }
  }

  /**
   * Log debug message
   */
  debug(message, meta = {}) {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, meta));
    }
  }

  /**
   * Check if log level should be logged
   */
  shouldLog(level) {
    const levels = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(this.level);
    const requestedLevelIndex = levels.indexOf(level);
    return requestedLevelIndex <= currentLevelIndex;
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;
