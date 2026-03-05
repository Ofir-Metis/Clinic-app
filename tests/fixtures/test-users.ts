/**
 * Test Users Configuration
 * Predefined test users for each role in the wellness coaching platform
 */

export interface TestUser {
  email: string;
  password: string;
  role: 'coach' | 'client' | 'admin' | 'super_admin';
  name: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Test users for authentication and E2E testing
 * These users should be seeded in the database before running tests
 */
export const TEST_USERS: Record<string, TestUser> = {
  // Coach user for testing coach workflows
  coach: {
    email: 'test-coach@clinic.com',
    password: 'TestPass123',
    role: 'coach',
    name: 'Dr. Sarah Wilson',
    firstName: 'Sarah',
    lastName: 'Wilson'
  },

  // Secondary coach for multi-coach scenarios
  coach2: {
    email: 'test-coach2@clinic.com',
    password: 'CoachTest123!',
    role: 'coach',
    name: 'Dr. Michael Chen',
    firstName: 'Michael',
    lastName: 'Chen'
  },

  // Third coach for multi-coach client scenarios
  coach3: {
    email: 'test-coach3@clinic.com',
    password: 'CoachTest123!',
    role: 'coach',
    name: 'Dr. Emily Johnson',
    firstName: 'Emily',
    lastName: 'Johnson'
  },

  // Client user for testing client portal workflows
  client: {
    email: 'test-client@clinic.com',
    password: 'ClientTest123',
    role: 'client',
    name: 'John Smith',
    firstName: 'John',
    lastName: 'Smith'
  },

  // Secondary client for relationship testing
  client2: {
    email: 'test-client2@clinic.com',
    password: 'ClientTest123!',
    role: 'client',
    name: 'Jane Doe',
    firstName: 'Jane',
    lastName: 'Doe'
  },

  // Admin user for admin panel testing
  admin: {
    email: 'test-admin@clinic.com',
    password: 'AdminTest123!',
    role: 'admin',
    name: 'Admin User',
    firstName: 'Admin',
    lastName: 'User'
  },

  // Super admin with full access
  superAdmin: {
    email: 'ofir@metisight.net',
    password: '123456789',
    role: 'super_admin',
    name: 'Ofir Metisight',
    firstName: 'Ofir',
    lastName: 'Metisight'
  },

  // New user for registration tests (not in DB)
  newCoach: {
    email: 'new-coach@clinic.com',
    password: 'NewCoach123!',
    role: 'coach',
    name: 'New Coach',
    firstName: 'New',
    lastName: 'Coach'
  },

  // New client for registration tests (not in DB)
  newClient: {
    email: 'new-client@clinic.com',
    password: 'NewClient123!',
    role: 'client',
    name: 'New Client',
    firstName: 'New',
    lastName: 'Client'
  }
};

/**
 * Get user by role
 */
export function getUserByRole(role: TestUser['role']): TestUser {
  const users = Object.values(TEST_USERS).filter(u => u.role === role);
  if (users.length === 0) {
    throw new Error(`No test user found for role: ${role}`);
  }
  return users[0];
}

/**
 * Get all users of a specific role
 */
export function getUsersByRole(role: TestUser['role']): TestUser[] {
  return Object.values(TEST_USERS).filter(u => u.role === role);
}

/**
 * Login URLs by role
 */
export const LOGIN_URLS: Record<string, string> = {
  coach: '/login',
  client: '/client/login',
  admin: '/login'
};

/**
 * Dashboard URLs by role
 */
export const DASHBOARD_URLS: Record<string, string> = {
  coach: '/dashboard',
  client: '/client/dashboard',
  admin: '/admin/dashboard',
  super_admin: '/admin/dashboard'
};

/**
 * Test configuration
 */
export const TEST_CONFIG = {
  // API base URL (Gateway runs on port 4000)
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:4000',

  // Frontend base URL
  frontendBaseUrl: process.env.FRONTEND_BASE_URL || 'http://localhost:5173',

  // Timeouts (in milliseconds)
  defaultTimeout: 30000,
  navigationTimeout: 15000,
  apiTimeout: 10000,

  // Legacy timeout object for backwards compatibility
  timeout: {
    short: 5000,
    navigation: 15000,
    api: 10000
  },

  // Delays for animations
  shortDelay: 300,
  mediumDelay: 500,
  longDelay: 1000
};
