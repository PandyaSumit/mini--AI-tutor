/**
 * Minimal Jest Configuration for Unit Tests
 * Used for testing without full setup
 */

export default {
  testEnvironment: 'node',
  transform: {},
  preset: null,
  moduleFileExtensions: ['js', 'json'],
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 30000,
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  detectOpenHandles: false,
  forceExit: true,
};
