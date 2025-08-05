module.exports = {
  displayName: 'Integration Tests',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: [
    '**/*.integration.spec.ts',
    '**/*.integration.test.ts'
  ],
  
  // Module resolution
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/../../$1',
    '^@clinic/common/(.*)$': '<rootDir>/../../libs/common/src/$1',
    '^@clinic/common$': '<rootDir>/../../libs/common/src/index.ts',
  },
  
  // Test configuration
  testTimeout: parseInt(process.env.JEST_TIMEOUT) || 300000, // 5 minutes
  maxWorkers: 1, // Run integration tests sequentially
  detectOpenHandles: true,
  forceExit: true,
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  collectCoverageFrom: [
    '../../services/*/src/**/*.ts',
    '!../../services/*/src/**/*.spec.ts',
    '!../../services/*/src/**/*.test.ts',
    '!../../services/*/src/**/*.d.ts',
    '!../../services/*/src/**/index.ts',
    '!../../services/*/src/main.ts',
    '!../../services/*/src/**/*.module.ts',
    '!../../services/*/src/**/*.entity.ts',
    '!../../services/*/src/**/*.dto.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Setup and teardown
  globalSetup: '<rootDir>/global-setup.ts',
  globalTeardown: '<rootDir>/global-teardown.ts',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
  
  // Reporting
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/reports',
        outputName: 'integration-test-results.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
    [
      'jest-html-reporters',
      {
        publicPath: '<rootDir>/reports',
        filename: 'integration-test-report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'Healthcare Platform Integration Tests',
      },
    ],
  ],
  
  // Performance monitoring
  verbose: process.env.JEST_VERBOSE === 'true',
  silent: process.env.JEST_SILENT === 'true',
  
  // Error handling
  bail: process.env.JEST_BAIL === 'true' ? 1 : 0,
  errorOnDeprecated: true,
  
  // TypeScript configuration
  preset: 'ts-jest',
  tsconfig: '<rootDir>/tsconfig.json',
  
  // Test environment variables
  testEnvironmentOptions: {
    NODE_ENV: 'test',
  },
  
  // Mock configuration
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Performance optimization
  maxConcurrency: 1,
  
  // Custom matchers
  setupFilesAfterEnv: [
    '<rootDir>/jest-setup.ts',
    'jest-extended/all'
  ],
};