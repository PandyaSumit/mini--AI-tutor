/**
 * Jest Configuration for AI Orchestration Tests
 */

export default {
  // Use node environment
  testEnvironment: 'node',

  // Transform ESM modules - empty transform for native ESM
  transform: {},

  // Explicitly tell Jest this is an ESM project
  preset: null,

  // File extensions
  moduleFileExtensions: ['js', 'json'],

  // Test match patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
  ],

  // Coverage
  collectCoverageFrom: [
    'ai/**/*.js',
    'services/**/*.js',
    'controllers/**/*.js',
    '!ai/embeddings/models/**', // Exclude model files
    '!**/node_modules/**',
  ],

  coverageDirectory: 'coverage',

  coverageReporters: ['text', 'lcov', 'html'],

  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Test timeout (increased for AI operations)
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Detect open handles
  detectOpenHandles: true,

  // Force exit after tests
  forceExit: true,
};
