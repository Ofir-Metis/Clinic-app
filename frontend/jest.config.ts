/** @jest-config-loader ts-node */
import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
    },
  },
  testEnvironment: 'jest-environment-jsdom',
  setupFiles: ['<rootDir>/src/setupJestEnv.ts'],
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  transform: {
    '^.+\\.(t|j)sx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^../env$': '<rootDir>/src/__mocks__/env.ts',
    '^../env.ts$': '<rootDir>/src/__mocks__/env.ts',
  },
  testRegex: '.*\\.spec\\.tsx?$',
  collectCoverage: true,
  coverageThreshold: {
    global: { branches: 0, functions: 0, lines: 0, statements: 0 },
  },
};

export default config;
