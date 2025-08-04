import { test, expect, Page, Browser } from '@playwright/test';
import { TestDataManager } from './fixtures/test-data-manager';
import { UserCredentials } from './fixtures/user-credentials';
import { APITestSuite } from './fixtures/api-test-suite';
import { TherapistUITestSuite } from './fixtures/therapist-ui-tests';
import { ClientUITestSuite } from './fixtures/client-ui-tests';
import { AdminUITestSuite } from './fixtures/admin-ui-tests';

/**
 * Comprehensive System Test Suite
 * 
 * This test suite validates the entire clinic management system:
 * - Backend API functionality
 * - Complete UI testing for all user types
 * - Database creation with realistic test data
 * - End-to-end workflows
 * 
 * Test Data:
 * - 15 Therapists
 * - 150+ Clients (10+ per therapist, some shared)
 * - Admin account: ofir@metisight.net / 123456789
 */

const TEST_CONFIG = {
  BASE_URL: 'http://localhost:5173',
  API_URL: 'http://localhost:4000',
  ADMIN_EMAIL: 'ofir@metisight.net',
  ADMIN_PASSWORD: '123456789',
  THERAPIST_COUNT: 15,
  CLIENTS_PER_THERAPIST: 10,
  SHARED_CLIENTS_COUNT: 25,
  TEST_TIMEOUT: 300000, // 5 minutes per test
};

// Global test data manager
let testDataManager: TestDataManager;
let userCredentials: UserCredentials;
let apiTestSuite: APITestSuite;

test.describe('🏥 Comprehensive Clinic System Test Suite', () => {
  test.setTimeout(TEST_CONFIG.TEST_TIMEOUT);

  test.beforeAll(async () => {
    console.log('🚀 Starting Comprehensive System Test Suite');
    console.log(`📊 Test Configuration:`, TEST_CONFIG);
    
    // Initialize test managers
    testDataManager = new TestDataManager(TEST_CONFIG);
    userCredentials = new UserCredentials();
    apiTestSuite = new APITestSuite(TEST_CONFIG.API_URL);
    
    console.log('📝 Test managers initialized');
  });

  test.describe('🗄️ Database Setup and Validation', () => {
    test('should setup comprehensive test database', async () => {
      console.log('🔧 Setting up test database...');
      
      // Create admin user
      await testDataManager.createAdminUser(
        TEST_CONFIG.ADMIN_EMAIL,
        TEST_CONFIG.ADMIN_PASSWORD
      );
      
      // Create therapists
      const therapists = await testDataManager.createTherapists(
        TEST_CONFIG.THERAPIST_COUNT
      );
      
      // Create clients for each therapist
      const clients = await testDataManager.createClientsForTherapists(
        therapists,
        TEST_CONFIG.CLIENTS_PER_THERAPIST
      );
      
      // Create shared clients (clients with multiple therapists)
      const sharedClients = await testDataManager.createSharedClients(
        therapists,
        TEST_CONFIG.SHARED_CLIENTS_COUNT
      );
      
      // Store all credentials
      userCredentials.setAdminCredentials(
        TEST_CONFIG.ADMIN_EMAIL,
        TEST_CONFIG.ADMIN_PASSWORD
      );
      userCredentials.setTherapistCredentials(therapists);
      userCredentials.setClientCredentials([...clients, ...sharedClients]);
      
      console.log(`✅ Database setup complete:`);
      console.log(`   - Admin: 1 user`);
      console.log(`   - Therapists: ${therapists.length} users`);
      console.log(`   - Clients: ${clients.length + sharedClients.length} users`);
      console.log(`   - Shared relationships: ${sharedClients.length} clients`);
      
      // Validate database integrity
      await testDataManager.validateDatabaseIntegrity();
    });
  });

  test.describe('🔗 Backend API Comprehensive Testing', () => {
    test('should validate all authentication endpoints', async () => {
      await apiTestSuite.testAuthenticationEndpoints(userCredentials);
    });

    test('should validate all therapist API endpoints', async () => {
      await apiTestSuite.testTherapistEndpoints(userCredentials);
    });

    test('should validate all client API endpoints', async () => {
      await apiTestSuite.testClientEndpoints(userCredentials);
    });

    test('should validate all admin API endpoints', async () => {
      await apiTestSuite.testAdminEndpoints(userCredentials);
    });

    test('should validate appointment system APIs', async () => {
      await apiTestSuite.testAppointmentEndpoints(userCredentials);
    });

    test('should validate file upload and recording APIs', async () => {
      await apiTestSuite.testFileUploadEndpoints(userCredentials);
    });

    test('should validate AI and session analysis APIs', async () => {
      await apiTestSuite.testAIEndpoints(userCredentials);
    });

    test('should validate billing and payment APIs', async () => {
      await apiTestSuite.testBillingEndpoints(userCredentials);
    });

    test('should validate Google integration APIs', async () => {
      await apiTestSuite.testGoogleIntegrationEndpoints(userCredentials);
    });
  });

  test.describe('👨‍⚕️ Therapist UI Comprehensive Testing', () => {
    let therapistUITests: TherapistUITestSuite;

    test.beforeEach(async ({ page }) => {
      therapistUITests = new TherapistUITestSuite(page, TEST_CONFIG.BASE_URL);
    });

    test('should test therapist dashboard functionality', async () => {
      const therapist = userCredentials.getRandomTherapist();
      await therapistUITests.testDashboardFunctionality(therapist);
    });

    test('should test therapist client management', async () => {
      const therapist = userCredentials.getRandomTherapist();
      await therapistUITests.testClientManagement(therapist);
    });

    test('should test appointment scheduling system', async () => {
      const therapist = userCredentials.getRandomTherapist();
      await therapistUITests.testAppointmentScheduling(therapist);
    });

    test('should test session notes and recording', async () => {
      const therapist = userCredentials.getRandomTherapist();
      await therapistUITests.testSessionNotesAndRecording(therapist);
    });

    test('should test AI session analysis features', async () => {
      const therapist = userCredentials.getRandomTherapist();
      await therapistUITests.testAISessionAnalysis(therapist);
    });

    test('should test therapist billing dashboard', async () => {
      const therapist = userCredentials.getRandomTherapist();
      await therapistUITests.testBillingDashboard(therapist);
    });

    test('should test therapist settings and profile', async () => {
      const therapist = userCredentials.getRandomTherapist();
      await therapistUITests.testSettingsAndProfile(therapist);
    });

    test('should test calendar and Google integration', async () => {
      const therapist = userCredentials.getRandomTherapist();
      await therapistUITests.testCalendarIntegration(therapist);
    });

    test('should test analytics and reporting', async () => {
      const therapist = userCredentials.getRandomTherapist();
      await therapistUITests.testAnalyticsAndReporting(therapist);
    });

    test('should test notification center', async () => {
      const therapist = userCredentials.getRandomTherapist();
      await therapistUITests.testNotificationCenter(therapist);
    });
  });

  test.describe('👤 Client UI Comprehensive Testing', () => {
    let clientUITests: ClientUITestSuite;

    test.beforeEach(async ({ page }) => {
      clientUITests = new ClientUITestSuite(page, TEST_CONFIG.BASE_URL);
    });

    test('should test client dashboard and progress tracking', async () => {
      const client = userCredentials.getRandomClient();
      await clientUITests.testDashboardAndProgress(client);
    });

    test('should test client goal management', async () => {
      const client = userCredentials.getRandomClient();
      await clientUITests.testGoalManagement(client);
    });

    test('should test client achievements system', async () => {
      const client = userCredentials.getRandomClient();
      await clientUITests.testAchievementsSystem(client);
    });

    test('should test client booking system', async () => {
      const client = userCredentials.getRandomClient();
      await clientUITests.testBookingSystem(client);
    });

    test('should test coach discovery and connection', async () => {
      const client = userCredentials.getRandomClient();
      await clientUITests.testCoachDiscovery(client);
    });

    test('should test client appointments management', async () => {
      const client = userCredentials.getRandomClient();
      await clientUITests.testAppointmentsManagement(client);
    });

    test('should test progress sharing features', async () => {
      const client = userCredentials.getRandomClient();
      await clientUITests.testProgressSharing(client);
    });

    test('should test client onboarding flow', async () => {
      const newClient = userCredentials.getNewClientCredentials();
      await clientUITests.testOnboardingFlow(newClient);
    });

    test('should test client invitations system', async () => {
      const client = userCredentials.getRandomClient();
      await clientUITests.testInvitationsSystem(client);
    });

    test('should test multi-language support', async () => {
      const client = userCredentials.getRandomClient();
      await clientUITests.testMultiLanguageSupport(client);
    });
  });

  test.describe('👑 Admin UI Comprehensive Testing', () => {
    let adminUITests: AdminUITestSuite;

    test.beforeEach(async ({ page }) => {
      adminUITests = new AdminUITestSuite(page, TEST_CONFIG.BASE_URL);
    });

    test('should test admin dashboard overview', async () => {
      const adminCreds = userCredentials.getAdminCredentials();
      await adminUITests.testDashboardOverview(adminCreds);
    });

    test('should test user management system', async () => {
      const adminCreds = userCredentials.getAdminCredentials();
      await adminUITests.testUserManagement(adminCreds);
    });

    test('should test view switching and impersonation', async () => {
      const adminCreds = userCredentials.getAdminCredentials();
      const therapist = userCredentials.getRandomTherapist();
      const client = userCredentials.getRandomClient();
      await adminUITests.testViewSwitchingAndImpersonation(adminCreds, therapist, client);
    });

    test('should test system configuration management', async () => {
      const adminCreds = userCredentials.getAdminCredentials();
      await adminUITests.testSystemConfiguration(adminCreds);
    });

    test('should test security settings and API management', async () => {
      const adminCreds = userCredentials.getAdminCredentials();
      await adminUITests.testSecurityAndAPIManagement(adminCreds);
    });

    test('should test backup and compliance management', async () => {
      const adminCreds = userCredentials.getAdminCredentials();
      await adminUITests.testBackupAndCompliance(adminCreds);
    });

    test('should test subscription and billing management', async () => {
      const adminCreds = userCredentials.getAdminCredentials();
      await adminUITests.testSubscriptionManagement(adminCreds);
    });

    test('should test system monitoring and health', async () => {
      const adminCreds = userCredentials.getAdminCredentials();
      await adminUITests.testSystemMonitoring(adminCreds);
    });

    test('should test invitation management', async () => {
      const adminCreds = userCredentials.getAdminCredentials();
      await adminUITests.testInvitationManagement(adminCreds);
    });

    test('should test audit logs and compliance', async () => {
      const adminCreds = userCredentials.getAdminCredentials();
      await adminUITests.testAuditLogsAndCompliance(adminCreds);
    });
  });

  test.describe('🔄 Cross-User Integration Testing', () => {
    test('should test therapist-client interaction flows', async ({ browser }) => {
      const therapist = userCredentials.getRandomTherapist();
      const client = userCredentials.getRandomClientForTherapist(therapist.email);
      
      // Test appointment booking from both sides
      await testTherapistClientInteraction(browser, therapist, client);
    });

    test('should test admin-therapist interaction flows', async ({ browser }) => {
      const admin = userCredentials.getAdminCredentials();
      const therapist = userCredentials.getRandomTherapist();
      
      // Test admin managing therapist account
      await testAdminTherapistInteraction(browser, admin, therapist);
    });

    test('should test admin-client interaction flows', async ({ browser }) => {
      const admin = userCredentials.getAdminCredentials();
      const client = userCredentials.getRandomClient();
      
      // Test admin managing client account
      await testAdminClientInteraction(browser, admin, client);
    });
  });

  test.afterAll(async () => {
    console.log('📊 Generating comprehensive test report...');
    
    // Generate test report with all credentials
    const report = await generateComprehensiveTestReport(userCredentials, testDataManager);
    
    console.log('✅ Comprehensive system test suite completed!');
    console.log('📋 Test report:', report);
  });
});

async function testTherapistClientInteraction(browser: Browser, therapist: any, client: any) {
  const therapistPage = await browser.newPage();
  const clientPage = await browser.newPage();
  
  // Therapist creates appointment
  const therapistUITests = new TherapistUITestSuite(therapistPage, TEST_CONFIG.BASE_URL);
  await therapistUITests.loginAsTherapist(therapist);
  await therapistUITests.createAppointmentForClient(client);
  
  // Client views and confirms appointment
  const clientUITests = new ClientUITestSuite(clientPage, TEST_CONFIG.BASE_URL);
  await clientUITests.loginAsClient(client);
  await clientUITests.viewAndConfirmAppointment();
  
  await therapistPage.close();
  await clientPage.close();
}

async function testAdminTherapistInteraction(browser: Browser, admin: any, therapist: any) {
  const adminPage = await browser.newPage();
  const therapistPage = await browser.newPage();
  
  // Admin impersonates therapist
  const adminUITests = new AdminUITestSuite(adminPage, TEST_CONFIG.BASE_URL);
  await adminUITests.loginAsAdmin(admin);
  await adminUITests.impersonateUser(therapist);
  
  // Verify therapist view
  await adminUITests.verifyImpersonationView(therapist);
  
  await adminPage.close();
  await therapistPage.close();
}

async function testAdminClientInteraction(browser: Browser, admin: any, client: any) {
  const adminPage = await browser.newPage();
  
  // Admin manages client account
  const adminUITests = new AdminUITestSuite(adminPage, TEST_CONFIG.BASE_URL);
  await adminUITests.loginAsAdmin(admin);
  await adminUITests.manageClientAccount(client);
  
  await adminPage.close();
}

async function generateComprehensiveTestReport(
  userCredentials: UserCredentials,
  testDataManager: TestDataManager
): Promise<any> {
  const report = {
    timestamp: new Date().toISOString(),
    testConfiguration: TEST_CONFIG,
    userCredentials: userCredentials.getAllCredentials(),
    databaseStats: await testDataManager.getDatabaseStats(),
    testResults: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      coverage: {}
    }
  };
  
  // Save report to file
  const fs = require('fs');
  fs.writeFileSync(
    'test-results/comprehensive-test-report.json',
    JSON.stringify(report, null, 2)
  );
  
  return report;
}