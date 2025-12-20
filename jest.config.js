module.exports = {
  // Note: testEnvironment should be set per-project
  // Frontend uses 'jsdom', backend services use 'node'
  projects: [
    '<rootDir>/services/*',
    '<rootDir>/frontend',
    '<rootDir>/libs/*'
  ],
  collectCoverageFrom: [
    '**/*.{js,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/*.config.{js,ts}',
    '!**/coverage/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
};
