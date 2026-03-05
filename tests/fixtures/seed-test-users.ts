/**
 * Database Seeding Script for Test Users
 * Creates test users in the database before running E2E tests
 *
 * Usage:
 *   npx ts-node tests/fixtures/seed-test-users.ts
 *   OR
 *   node --loader ts-node/esm tests/fixtures/seed-test-users.ts
 */

import axios from 'axios';
import { TEST_USERS, TEST_CONFIG } from './test-users';

const API_BASE_URL = TEST_CONFIG.apiBaseUrl;

interface CreateUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}

async function createUser(user: CreateUserPayload): Promise<boolean> {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log(`✅ Created user: ${user.email} (${user.role})`);
    return true;
  } catch (error: any) {
    if (error.response?.status === 409 || error.response?.data?.message?.includes('already exists')) {
      console.log(`ℹ️  User already exists: ${user.email}`);
      return true;
    }

    console.error(`❌ Failed to create user ${user.email}:`, error.response?.data?.message || error.message);
    return false;
  }
}

async function verifyUserLogin(email: string, password: string): Promise<boolean> {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (response.data?.access_token) {
      console.log(`✅ Verified login for: ${email}`);
      return true;
    }

    return false;
  } catch (error: any) {
    console.error(`❌ Login verification failed for ${email}:`, error.response?.data?.message || error.message);
    return false;
  }
}

async function seedTestUsers(): Promise<void> {
  console.log('\n🌱 Seeding Test Users...\n');
  console.log(`API Base URL: ${API_BASE_URL}\n`);

  const usersToCreate = [
    // Coach user
    {
      email: TEST_USERS.coach.email,
      password: TEST_USERS.coach.password,
      firstName: TEST_USERS.coach.firstName || 'Sarah',
      lastName: TEST_USERS.coach.lastName || 'Wilson',
      role: 'coach'
    },
    // Second coach
    {
      email: TEST_USERS.coach2.email,
      password: TEST_USERS.coach2.password,
      firstName: TEST_USERS.coach2.firstName || 'Michael',
      lastName: TEST_USERS.coach2.lastName || 'Chen',
      role: 'coach'
    },
    // Third coach
    {
      email: TEST_USERS.coach3.email,
      password: TEST_USERS.coach3.password,
      firstName: TEST_USERS.coach3.firstName || 'Emily',
      lastName: TEST_USERS.coach3.lastName || 'Johnson',
      role: 'coach'
    },
    // Client user
    {
      email: TEST_USERS.client.email,
      password: TEST_USERS.client.password,
      firstName: TEST_USERS.client.firstName || 'John',
      lastName: TEST_USERS.client.lastName || 'Smith',
      role: 'client'
    },
    // Second client
    {
      email: TEST_USERS.client2.email,
      password: TEST_USERS.client2.password,
      firstName: TEST_USERS.client2.firstName || 'Jane',
      lastName: TEST_USERS.client2.lastName || 'Doe',
      role: 'client'
    },
    // Admin user
    {
      email: TEST_USERS.admin.email,
      password: TEST_USERS.admin.password,
      firstName: TEST_USERS.admin.firstName || 'Admin',
      lastName: TEST_USERS.admin.lastName || 'User',
      role: 'admin'
    }
  ];

  let successCount = 0;
  let failCount = 0;

  for (const user of usersToCreate) {
    const success = await createUser(user);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Created/Verified: ${successCount}`);
  console.log(`   Failed: ${failCount}`);

  // Verify logins
  console.log('\n🔐 Verifying Login Credentials...\n');

  const loginVerifications = [
    { email: TEST_USERS.coach.email, password: TEST_USERS.coach.password },
    { email: TEST_USERS.client.email, password: TEST_USERS.client.password },
    { email: TEST_USERS.admin.email, password: TEST_USERS.admin.password }
  ];

  let loginSuccess = 0;
  let loginFail = 0;

  for (const { email, password } of loginVerifications) {
    const success = await verifyUserLogin(email, password);
    if (success) {
      loginSuccess++;
    } else {
      loginFail++;
    }
  }

  console.log('\n📊 Login Verification Summary:');
  console.log(`   Successful: ${loginSuccess}`);
  console.log(`   Failed: ${loginFail}`);

  if (failCount > 0 || loginFail > 0) {
    console.log('\n⚠️  Some users could not be created or verified.');
    console.log('   Make sure the API server is running and the database is accessible.');
    process.exit(1);
  } else {
    console.log('\n✅ All test users are ready!');
    process.exit(0);
  }
}

// SQL script for direct database seeding (alternative method)
export const SQL_SEED_SCRIPT = `
-- Test Users Seed Script
-- Run this directly in PostgreSQL if the API method doesn't work

-- Insert test coach user
INSERT INTO "user" (email, password, "firstName", "lastName", role, "isActive", "createdAt", "updatedAt")
VALUES (
  'test-coach@clinic.com',
  '$2b$10$rIC7rCKPjR7Lrx.3VB1mZOXVHqMgQN9YJ5nBqgqP8KmDkfX/0m3jK', -- CoachTest123!
  'Sarah',
  'Wilson',
  'coach',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert second test coach
INSERT INTO "user" (email, password, "firstName", "lastName", role, "isActive", "createdAt", "updatedAt")
VALUES (
  'test-coach2@clinic.com',
  '$2b$10$rIC7rCKPjR7Lrx.3VB1mZOXVHqMgQN9YJ5nBqgqP8KmDkfX/0m3jK', -- CoachTest123!
  'Michael',
  'Chen',
  'coach',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert third test coach
INSERT INTO "user" (email, password, "firstName", "lastName", role, "isActive", "createdAt", "updatedAt")
VALUES (
  'test-coach3@clinic.com',
  '$2b$10$rIC7rCKPjR7Lrx.3VB1mZOXVHqMgQN9YJ5nBqgqP8KmDkfX/0m3jK', -- CoachTest123!
  'Emily',
  'Johnson',
  'coach',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert test client user
INSERT INTO "user" (email, password, "firstName", "lastName", role, "isActive", "createdAt", "updatedAt")
VALUES (
  'test-client@clinic.com',
  '$2b$10$Y.AwXpKo8dJrPD7JWB7wLe3gKKwEqZXVMoR7kxq.b8oKmX5Ot1Wj6', -- ClientTest123!
  'John',
  'Smith',
  'client',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert second test client
INSERT INTO "user" (email, password, "firstName", "lastName", role, "isActive", "createdAt", "updatedAt")
VALUES (
  'test-client2@clinic.com',
  '$2b$10$Y.AwXpKo8dJrPD7JWB7wLe3gKKwEqZXVMoR7kxq.b8oKmX5Ot1Wj6', -- ClientTest123!
  'Jane',
  'Doe',
  'client',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert test admin user
INSERT INTO "user" (email, password, "firstName", "lastName", role, "isActive", "createdAt", "updatedAt")
VALUES (
  'test-admin@clinic.com',
  '$2b$10$WpgJqN.YCf3lX5oL7IqQHuHqnHN9zVYbQPCR8vFXmKt5aGk2G1.WK', -- AdminTest123!
  'Admin',
  'User',
  'admin',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Verify users were created
SELECT id, email, "firstName", "lastName", role, "isActive" FROM "user" WHERE email LIKE 'test-%@clinic.com';
`;

// Run if called directly
if (require.main === module) {
  seedTestUsers().catch(console.error);
}

export { seedTestUsers };
