import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  rootDir: 'src',
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testRegex: '.*\\.spec\\.ts$',
  collectCoverage: true,
};
export default config;
