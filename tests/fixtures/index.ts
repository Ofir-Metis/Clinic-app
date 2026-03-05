/**
 * Test Fixtures Index
 * Central export for all test utilities and fixtures
 */

// Test users and authentication
export * from './test-users';

// API client for integration testing
export * from './api-client';

// Dynamic test data generation
export * from './test-data-factory';

// Google API mocks
export * from './google-mocks';

// Shared test helpers (login, navigation, etc.)
export * from './test-helpers';

// Database seeding (for setup)
export { seedTestUsers, SQL_SEED_SCRIPT } from './seed-test-users';
