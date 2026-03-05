/**
 * Playwright Global Setup
 * Runs before all E2E tests to ensure test infrastructure is ready.
 * - Verifies services are healthy
 * - Seeds test users
 * - Creates test data (relationships, appointments, goals)
 */

import axios from 'axios';
import { TEST_USERS, TEST_CONFIG } from './test-users';

const API_BASE_URL = TEST_CONFIG.apiBaseUrl;

async function waitForHealth(maxRetries = 30, delayMs = 2000): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
      if (response.status === 200) {
        console.log('API Gateway is healthy');
        return;
      }
    } catch {
      if (i < maxRetries - 1) {
        console.log(`Waiting for API Gateway... (${i + 1}/${maxRetries})`);
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  throw new Error(`API Gateway not healthy after ${maxRetries} retries`);
}

async function registerUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: string,
): Promise<string | null> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/register`,
      { email, password, firstName, lastName, name: `${firstName} ${lastName}`, role },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 },
    );
    console.log(`  Created user: ${email} (${role})`);
    return response.data?.access_token || null;
  } catch (error: any) {
    const msg = error.response?.data?.message;
    const msgStr = typeof msg === 'string' ? msg : JSON.stringify(msg || '');
    if (
      error.response?.status === 409 ||
      msgStr.includes('already exists')
    ) {
      console.log(`  User exists: ${email}`);
      return null;
    }
    console.warn(`  Failed to create ${email}: ${msgStr || error.message}`);
    return null;
  }
}

async function loginUser(email: string, password: string): Promise<string | null> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/login`,
      { email, password },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 },
    );
    return response.data?.access_token || null;
  } catch (error: any) {
    console.warn(`  Login failed for ${email}: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

async function seedUsers(): Promise<void> {
  console.log('\nSeeding test users...');

  const users = [
    { ...TEST_USERS.coach, role: 'coach' },
    { ...TEST_USERS.coach2, role: 'coach' },
    { ...TEST_USERS.coach3, role: 'coach' },
    { ...TEST_USERS.client, role: 'client' },
    { ...TEST_USERS.client2, role: 'client' },
    { ...TEST_USERS.admin, role: 'admin' },
  ];

  for (const u of users) {
    await registerUser(
      u.email,
      u.password,
      u.firstName || u.name.split(' ')[0],
      u.lastName || u.name.split(' ').slice(1).join(' '),
      u.role,
    );
  }
}

async function seedTestData(coachToken: string): Promise<void> {
  console.log('\nSeeding test data...');

  // Create a sample appointment for the test client with the test coach
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    await axios.post(
      `${API_BASE_URL}/appointments`,
      {
        patientName: TEST_USERS.client.name,
        patientEmail: TEST_USERS.client.email,
        date: tomorrow.toISOString().split('T')[0],
        time: '10:00',
        duration: 60,
        type: 'coaching_session',
        notes: 'E2E test appointment',
        meetingType: 'online',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${coachToken}`,
        },
        timeout: 10000,
      },
    );
    console.log('  Created sample appointment');
  } catch (error: any) {
    console.warn(
      `  Appointment creation skipped: ${error.response?.data?.message || error.message}`,
    );
  }
}

export default async function globalSetup(): Promise<void> {
  console.log('\n========================================');
  console.log('  Playwright Global Setup');
  console.log('========================================\n');
  console.log(`API: ${API_BASE_URL}`);

  // 1. Wait for services to be healthy
  await waitForHealth();

  // 2. Seed test users
  await seedUsers();

  // 3. Verify critical logins
  console.log('\nVerifying logins...');
  const coachToken = await loginUser(TEST_USERS.coach.email, TEST_USERS.coach.password);
  const clientToken = await loginUser(TEST_USERS.client.email, TEST_USERS.client.password);

  if (!coachToken) {
    console.warn('  Coach login failed - some tests may fail');
  } else {
    console.log('  Coach login verified');
  }

  if (!clientToken) {
    console.warn('  Client login failed - client tests may fail');
  } else {
    console.log('  Client login verified');
  }

  // 4. Seed test data if coach is authenticated
  if (coachToken) {
    await seedTestData(coachToken);
  }

  console.log('\nGlobal setup complete\n');
}
