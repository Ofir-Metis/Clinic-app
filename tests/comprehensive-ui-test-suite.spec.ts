import { test, expect, Page, BrowserContext } from '@playwright/test';
import { faker } from '@faker-js/faker';

// Test data generators
const generateTestUser = (role: 'client' | 'coach' | 'admin') => ({
  email: faker.internet.email(),
  password: 'TestPassword123!',
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  phone: faker.phone.number(),
  role,
});

const generateAppointment = () => ({
  title: faker.lorem.words(3),
  description: faker.lorem.paragraph(),
  date: faker.date.future(),
  duration: faker.helpers.arrayElement([30, 60, 90]),
  type: faker.helpers.arrayElement(['video', 'phone', 'in-person']),
});

// Page Object Models
class LoginPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  async login(email: string, password: string) {
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
    await this.page.waitForLoadState('networkidle');
  }

  async expectLoginError(message?: string) {
    await expect(this.page.locator('[data-testid="error-message"]')).toBeVisible();
    if (message) {
      await expect(this.page.locator('[data-testid="error-message"]')).toContainText(message);
    }
  }
}

class DashboardPage {
  constructor(private page: Page) {}

  async expectToBeVisible() {
    await expect(this.page.locator('[data-testid="dashboard"]')).toBeVisible();
  }

  async navigateToSection(section: string) {
    await this.page.click(`[data-testid="nav-${section}"]`);
    await this.page.waitForLoadState('networkidle');
  }

  async expectNavigationItems(items: string[]) {
    for (const item of items) {
      await expect(this.page.locator(`[data-testid="nav-${item}"]`)).toBeVisible();
    }
  }
}

class ClientPortalPage {
  constructor(private page: Page) {}

  async expectDashboardMetrics() {
    await expect(this.page.locator('[data-testid="next-appointment"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="progress-summary"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="goals-section"]')).toBeVisible();
  }

  async bookAppointment(appointmentData: any) {
    await this.page.click('[data-testid="book-appointment-button"]');
    await this.page.waitForSelector('[data-testid="appointment-form"]');
    
    await this.page.fill('[data-testid="appointment-title"]', appointmentData.title);
    await this.page.fill('[data-testid="appointment-description"]', appointmentData.description);
    await this.page.selectOption('[data-testid="appointment-type"]', appointmentData.type);
    
    // Date and time selection
    await this.page.click('[data-testid="appointment-date"]');
    await this.page.click('[data-testid="date-picker-next-month"]');
    await this.page.click('[data-testid="date-15"]'); // Select 15th of next month
    
    await this.page.selectOption('[data-testid="appointment-time"]', '10:00');
    await this.page.click('[data-testid="submit-appointment"]');
    
    await expect(this.page.locator('[data-testid="booking-success"]')).toBeVisible();
  }

  async viewAppointments() {
    await this.page.click('[data-testid="nav-appointments"]');
    await expect(this.page.locator('[data-testid="appointments-list"]')).toBeVisible();
  }

  async uploadFile(filePath: string) {
    await this.page.click('[data-testid="nav-files"]');
    await this.page.setInputFiles('[data-testid="file-upload"]', filePath);
    await this.page.click('[data-testid="upload-submit"]');
    await expect(this.page.locator('[data-testid="upload-success"]')).toBeVisible();
  }

  async viewProfile() {
    await this.page.click('[data-testid="nav-profile"]');
    await expect(this.page.locator('[data-testid="profile-form"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="profile-email"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="profile-name"]')).toBeVisible();
  }

  async updateProfile(updates: any) {
    await this.viewProfile();
    
    if (updates.firstName) {
      await this.page.fill('[data-testid="profile-firstname"]', updates.firstName);
    }
    if (updates.lastName) {
      await this.page.fill('[data-testid="profile-lastname"]', updates.lastName);
    }
    if (updates.phone) {
      await this.page.fill('[data-testid="profile-phone"]', updates.phone);
    }
    
    await this.page.click('[data-testid="save-profile"]');
    await expect(this.page.locator('[data-testid="profile-saved"]')).toBeVisible();
  }

  async viewGoals() {
    await this.page.click('[data-testid="nav-goals"]');
    await expect(this.page.locator('[data-testid="goals-list"]')).toBeVisible();
  }

  async createGoal(goalData: any) {
    await this.viewGoals();
    await this.page.click('[data-testid="create-goal-button"]');
    
    await this.page.fill('[data-testid="goal-title"]', goalData.title);
    await this.page.fill('[data-testid="goal-description"]', goalData.description);
    await this.page.selectOption('[data-testid="goal-category"]', goalData.category);
    
    await this.page.click('[data-testid="save-goal"]');
    await expect(this.page.locator('[data-testid="goal-created"]')).toBeVisible();
  }
}

class CoachDashboardPage {
  constructor(private page: Page) {}

  async expectDashboardMetrics() {
    await expect(this.page.locator('[data-testid="today-appointments"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="total-clients"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="revenue-summary"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="performance-metrics"]')).toBeVisible();
  }

  async viewClients() {
    await this.page.click('[data-testid="nav-clients"]');
    await expect(this.page.locator('[data-testid="clients-list"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="clients-search"]')).toBeVisible();
  }

  async searchClients(query: string) {
    await this.viewClients();
    await this.page.fill('[data-testid="clients-search"]', query);
    await this.page.press('[data-testid="clients-search"]', 'Enter');
    await this.page.waitForLoadState('networkidle');
  }

  async viewClientDetails(clientId: string) {
    await this.page.click(`[data-testid="client-${clientId}"]`);
    await expect(this.page.locator('[data-testid="client-profile"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="client-appointments"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="client-notes"]')).toBeVisible();
  }

  async createSessionNote(noteData: any) {
    await this.page.click('[data-testid="create-note-button"]');
    
    await this.page.fill('[data-testid="note-title"]', noteData.title);
    await this.page.fill('[data-testid="note-content"]', noteData.content);
    await this.page.selectOption('[data-testid="note-mood"]', noteData.mood);
    
    await this.page.click('[data-testid="save-note"]');
    await expect(this.page.locator('[data-testid="note-saved"]')).toBeVisible();
  }

  async viewSchedule() {
    await this.page.click('[data-testid="nav-schedule"]');
    await expect(this.page.locator('[data-testid="calendar-view"]')).toBeVisible();
  }

  async blockTimeSlot(date: string, time: string) {
    await this.viewSchedule();
    await this.page.click(`[data-testid="slot-${date}-${time}"]`);
    await this.page.click('[data-testid="block-slot"]');
    await expect(this.page.locator('[data-testid="slot-blocked"]')).toBeVisible();
  }

  async viewAnalytics() {
    await this.page.click('[data-testid="nav-analytics"]');
    await expect(this.page.locator('[data-testid="analytics-dashboard"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="revenue-chart"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="client-progress-chart"]')).toBeVisible();
  }
}

class AdminDashboardPage {
  constructor(private page: Page) {}

  async expectDashboardMetrics() {
    await expect(this.page.locator('[data-testid="system-overview"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="user-statistics"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="revenue-overview"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="system-health"]')).toBeVisible();
  }

  async viewUserManagement() {
    await this.page.click('[data-testid="nav-users"]');
    await expect(this.page.locator('[data-testid="users-table"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="create-user-button"]')).toBeVisible();
  }

  async createUser(userData: any) {
    await this.viewUserManagement();
    await this.page.click('[data-testid="create-user-button"]');
    
    await this.page.fill('[data-testid="user-email"]', userData.email);
    await this.page.fill('[data-testid="user-firstname"]', userData.firstName);
    await this.page.fill('[data-testid="user-lastname"]', userData.lastName);
    await this.page.selectOption('[data-testid="user-role"]', userData.role);
    
    await this.page.click('[data-testid="save-user"]');
    await expect(this.page.locator('[data-testid="user-created"]')).toBeVisible();
  }

  async searchUsers(query: string) {
    await this.viewUserManagement();
    await this.page.fill('[data-testid="users-search"]', query);
    await this.page.press('[data-testid="users-search"]', 'Enter');
    await this.page.waitForLoadState('networkidle');
  }

  async deactivateUser(userId: string) {
    await this.page.click(`[data-testid="user-${userId}-actions"]`);
    await this.page.click('[data-testid="deactivate-user"]');
    await this.page.click('[data-testid="confirm-deactivation"]');
    await expect(this.page.locator('[data-testid="user-deactivated"]')).toBeVisible();
  }

  async viewSystemSettings() {
    await this.page.click('[data-testid="nav-settings"]');
    await expect(this.page.locator('[data-testid="settings-form"]')).toBeVisible();
  }

  async updateSystemSettings(settings: any) {
    await this.viewSystemSettings();
    
    if (settings.siteName) {
      await this.page.fill('[data-testid="setting-site-name"]', settings.siteName);
    }
    if (settings.timezone) {
      await this.page.selectOption('[data-testid="setting-timezone"]', settings.timezone);
    }
    
    await this.page.click('[data-testid="save-settings"]');
    await expect(this.page.locator('[data-testid="settings-saved"]')).toBeVisible();
  }

  async viewAuditLogs() {
    await this.page.click('[data-testid="nav-audit"]');
    await expect(this.page.locator('[data-testid="audit-logs-table"]')).toBeVisible();
  }

  async filterAuditLogs(filters: any) {
    await this.viewAuditLogs();
    
    if (filters.user) {
      await this.page.selectOption('[data-testid="audit-user-filter"]', filters.user);
    }
    if (filters.action) {
      await this.page.selectOption('[data-testid="audit-action-filter"]', filters.action);
    }
    if (filters.dateFrom) {
      await this.page.fill('[data-testid="audit-date-from"]', filters.dateFrom);
    }
    
    await this.page.click('[data-testid="apply-audit-filters"]');
    await this.page.waitForLoadState('networkidle');
  }

  async viewSystemHealth() {
    await this.page.click('[data-testid="nav-system-health"]');
    await expect(this.page.locator('[data-testid="health-dashboard"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="service-status"]')).toBeVisible();
  }

  async viewReports() {
    await this.page.click('[data-testid="nav-reports"]');
    await expect(this.page.locator('[data-testid="reports-dashboard"]')).toBeVisible();
  }

  async generateReport(reportType: string) {
    await this.viewReports();
    await this.page.selectOption('[data-testid="report-type"]', reportType);
    await this.page.click('[data-testid="generate-report"]');
    await expect(this.page.locator('[data-testid="report-generated"]')).toBeVisible();
  }

  async impersonateUser(userId: string) {
    await this.page.click(`[data-testid="user-${userId}-actions"]`);
    await this.page.click('[data-testid="impersonate-user"]');
    await this.page.click('[data-testid="confirm-impersonation"]');
    await expect(this.page.locator('[data-testid="impersonation-banner"]')).toBeVisible();
  }

  async stopImpersonation() {
    await this.page.click('[data-testid="stop-impersonation"]');
    await expect(this.page.locator('[data-testid="impersonation-banner"]')).not.toBeVisible();
  }
}

// Utility functions
async function createTestUsers(page: Page) {
  const testUsers = {
    client: generateTestUser('client'),
    coach: generateTestUser('coach'),
    admin: generateTestUser('admin'),
  };

  // Register users via API
  for (const [role, userData] of Object.entries(testUsers)) {
    await page.request.post('/api/auth/register', {
      data: {
        ...userData,
        isEmailVerified: true,
        isActive: true,
      },
    });
  }

  return testUsers;
}

async function cleanupTestData(page: Page, testUsers: any) {
  // Clean up created test data
  for (const userData of Object.values(testUsers)) {
    await page.request.delete(`/api/admin/users/${(userData as any).email}`);
  }
}

// Test suites
test.describe('Healthcare Platform - Complete UI Test Suite', () => {
  let testUsers: any;
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    testUsers = await createTestUsers(page);
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await cleanupTestData(page, testUsers);
    await context.close();
  });

  test.describe('Authentication Flow', () => {
    test('should display login page correctly', async ({ page }) => {
      await loginPage.navigate();
      
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
      await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="forgot-password-link"]')).toBeVisible();
      await expect(page.locator('[data-testid="register-link"]')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await loginPage.navigate();
      await loginPage.login('invalid@email.com', 'wrongpassword');
      await loginPage.expectLoginError('Invalid credentials');
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await loginPage.navigate();
      await page.click('[data-testid="login-button"]');
      
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    });

    test('should redirect to forgot password page', async ({ page }) => {
      await loginPage.navigate();
      await page.click('[data-testid="forgot-password-link"]');
      
      await expect(page.url()).toContain('/forgot-password');
      await expect(page.locator('[data-testid="forgot-password-form"]')).toBeVisible();
    });

    test('should redirect to registration page', async ({ page }) => {
      await loginPage.navigate();
      await page.click('[data-testid="register-link"]');
      
      await expect(page.url()).toContain('/register');
      await expect(page.locator('[data-testid="register-form"]')).toBeVisible();
    });
  });

  test.describe('Client Portal - Complete Feature Testing', () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.navigate();
      await loginPage.login(testUsers.client.email, testUsers.client.password);
    });

    test('should display client dashboard with all sections', async ({ page }) => {
      const clientPortal = new ClientPortalPage(page);
      
      await dashboardPage.expectToBeVisible();
      await clientPortal.expectDashboardMetrics();
      
      // Check navigation items specific to client
      const expectedNavItems = ['dashboard', 'appointments', 'goals', 'progress', 'files', 'messages', 'profile'];
      await dashboardPage.expectNavigationItems(expectedNavItems);
    });

    test('should allow booking new appointment', async ({ page }) => {
      const clientPortal = new ClientPortalPage(page);
      const appointmentData = generateAppointment();
      
      await clientPortal.bookAppointment(appointmentData);
    });

    test('should display appointments list', async ({ page }) => {
      const clientPortal = new ClientPortalPage(page);
      await clientPortal.viewAppointments();
      
      // Test appointment filtering
      await page.selectOption('[data-testid="appointment-filter"]', 'upcoming');
      await page.waitForLoadState('networkidle');
      
      await page.selectOption('[data-testid="appointment-filter"]', 'past');
      await page.waitForLoadState('networkidle');
    });

    test('should allow file upload and management', async ({ page }) => {
      const clientPortal = new ClientPortalPage(page);
      
      // Create a test file
      const testFilePath = './test-files/test-document.pdf';
      await clientPortal.uploadFile(testFilePath);
      
      // Test file listing and filtering
      await expect(page.locator('[data-testid="files-list"]')).toBeVisible();
      await page.fill('[data-testid="files-search"]', 'test-document');
      await page.waitForLoadState('networkidle');
    });

    test('should allow profile management', async ({ page }) => {
      const clientPortal = new ClientPortalPage(page);
      
      await clientPortal.viewProfile();
      
      const profileUpdates = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        phone: faker.phone.number(),
      };
      
      await clientPortal.updateProfile(profileUpdates);
    });

    test('should allow goal creation and management', async ({ page }) => {
      const clientPortal = new ClientPortalPage(page);
      
      const goalData = {
        title: faker.lorem.words(3),
        description: faker.lorem.paragraph(),
        category: 'health',
      };
      
      await clientPortal.createGoal(goalData);
      
      // Test goal progress tracking
      await page.click('[data-testid="goal-progress-update"]');
      await page.fill('[data-testid="progress-notes"]', faker.lorem.sentence());
      await page.click('[data-testid="save-progress"]');
      await expect(page.locator('[data-testid="progress-saved"]')).toBeVisible();
    });

    test('should display progress tracking', async ({ page }) => {
      await dashboardPage.navigateToSection('progress');
      
      await expect(page.locator('[data-testid="progress-charts"]')).toBeVisible();
      await expect(page.locator('[data-testid="mood-tracker"]')).toBeVisible();
      await expect(page.locator('[data-testid="achievements"]')).toBeVisible();
    });

    test('should allow messaging with coach', async ({ page }) => {
      await dashboardPage.navigateToSection('messages');
      
      await expect(page.locator('[data-testid="messages-list"]')).toBeVisible();
      
      // Send a new message
      await page.click('[data-testid="compose-message"]');
      await page.fill('[data-testid="message-subject"]', faker.lorem.words(3));
      await page.fill('[data-testid="message-content"]', faker.lorem.paragraph());
      await page.click('[data-testid="send-message"]');
      
      await expect(page.locator('[data-testid="message-sent"]')).toBeVisible();
    });
  });

  test.describe('Coach Dashboard - Complete Feature Testing', () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.navigate();
      await loginPage.login(testUsers.coach.email, testUsers.coach.password);
    });

    test('should display coach dashboard with all metrics', async ({ page }) => {
      const coachDashboard = new CoachDashboardPage(page);
      
      await dashboardPage.expectToBeVisible();
      await coachDashboard.expectDashboardMetrics();
      
      const expectedNavItems = [
        'dashboard', 'clients', 'schedule', 'appointments', 
        'notes', 'analytics', 'billing', 'profile'
      ];
      await dashboardPage.expectNavigationItems(expectedNavItems);
    });

    test('should allow client management', async ({ page }) => {
      const coachDashboard = new CoachDashboardPage(page);
      
      await coachDashboard.viewClients();
      
      // Test client search
      await coachDashboard.searchClients('test');
      
      // Test client filtering
      await page.selectOption('[data-testid="clients-filter"]', 'active');
      await page.waitForLoadState('networkidle');
    });

    test('should allow viewing client details', async ({ page }) => {
      const coachDashboard = new CoachDashboardPage(page);
      
      await coachDashboard.viewClients();
      
      // Click on first client (assuming there's at least one)
      const firstClient = page.locator('[data-testid^="client-"]').first();
      const clientId = await firstClient.getAttribute('data-testid');
      if (clientId) {
        const id = clientId.replace('client-', '');
        await coachDashboard.viewClientDetails(id);
      }
    });

    test('should allow session note creation', async ({ page }) => {
      const coachDashboard = new CoachDashboardPage(page);
      
      await dashboardPage.navigateToSection('notes');
      
      const noteData = {
        title: faker.lorem.words(3),
        content: faker.lorem.paragraphs(2),
        mood: 'positive',
      };
      
      await coachDashboard.createSessionNote(noteData);
    });

    test('should display and manage schedule', async ({ page }) => {
      const coachDashboard = new CoachDashboardPage(page);
      
      await coachDashboard.viewSchedule();
      
      // Test different calendar views
      await page.click('[data-testid="calendar-view-week"]');
      await page.waitForLoadState('networkidle');
      
      await page.click('[data-testid="calendar-view-month"]');
      await page.waitForLoadState('networkidle');
      
      // Test time slot blocking
      await coachDashboard.blockTimeSlot('2024-02-15', '10:00');
    });

    test('should display analytics and reports', async ({ page }) => {
      const coachDashboard = new CoachDashboardPage(page);
      
      await coachDashboard.viewAnalytics();
      
      // Test different time periods
      await page.selectOption('[data-testid="analytics-period"]', '30d');
      await page.waitForLoadState('networkidle');
      
      await page.selectOption('[data-testid="analytics-period"]', '90d');
      await page.waitForLoadState('networkidle');
    });

    test('should allow appointment management', async ({ page }) => {
      await dashboardPage.navigateToSection('appointments');
      
      await expect(page.locator('[data-testid="appointments-calendar"]')).toBeVisible();
      
      // Test appointment status updates
      const firstAppointment = page.locator('[data-testid^="appointment-"]').first();
      await firstAppointment.click();
      
      await page.selectOption('[data-testid="appointment-status"]', 'completed');
      await page.click('[data-testid="save-appointment"]');
      await expect(page.locator('[data-testid="appointment-updated"]')).toBeVisible();
    });

    test('should allow billing management', async ({ page }) => {
      await dashboardPage.navigateToSection('billing');
      
      await expect(page.locator('[data-testid="billing-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="revenue-summary"]')).toBeVisible();
      await expect(page.locator('[data-testid="pending-payments"]')).toBeVisible();
      
      // Test invoice generation
      await page.click('[data-testid="generate-invoice"]');
      await page.selectOption('[data-testid="invoice-client"]', testUsers.client.email);
      await page.fill('[data-testid="invoice-amount"]', '150');
      await page.click('[data-testid="create-invoice"]');
      await expect(page.locator('[data-testid="invoice-created"]')).toBeVisible();
    });
  });

  test.describe('Admin Dashboard - Complete Feature Testing', () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.navigate();
      await loginPage.login(testUsers.admin.email, testUsers.admin.password);
    });

    test('should display admin dashboard with system overview', async ({ page }) => {
      const adminDashboard = new AdminDashboardPage(page);
      
      await dashboardPage.expectToBeVisible();
      await adminDashboard.expectDashboardMetrics();
      
      const expectedNavItems = [
        'dashboard', 'users', 'system-health', 'analytics', 
        'settings', 'audit', 'reports', 'backups'
      ];
      await dashboardPage.expectNavigationItems(expectedNavItems);
    });

    test('should allow comprehensive user management', async ({ page }) => {
      const adminDashboard = new AdminDashboardPage(page);
      
      await adminDashboard.viewUserManagement();
      
      // Test user creation
      const newUser = generateTestUser('coach');
      await adminDashboard.createUser(newUser);
      
      // Test user search
      await adminDashboard.searchUsers(newUser.email);
      
      // Test user filtering
      await page.selectOption('[data-testid="users-role-filter"]', 'coach');
      await page.waitForLoadState('networkidle');
      
      await page.selectOption('[data-testid="users-status-filter"]', 'active');
      await page.waitForLoadState('networkidle');
    });

    test('should allow user impersonation', async ({ page }) => {
      const adminDashboard = new AdminDashboardPage(page);
      
      await adminDashboard.viewUserManagement();
      
      // Find a client user to impersonate
      const clientRow = page.locator('[data-testid*="user-"][data-role="client"]').first();
      if (await clientRow.count() > 0) {
        const userId = await clientRow.getAttribute('data-testid');
        if (userId) {
          const id = userId.replace('user-', '');
          await adminDashboard.impersonateUser(id);
          
          // Verify impersonation is active
          await expect(page.locator('[data-testid="impersonation-banner"]')).toContainText('client');
          
          // Stop impersonation
          await adminDashboard.stopImpersonation();
        }
      }
    });

    test('should allow system settings management', async ({ page }) => {
      const adminDashboard = new AdminDashboardPage(page);
      
      const settingsUpdates = {
        siteName: 'Test Healthcare Platform',
        timezone: 'America/New_York',
      };
      
      await adminDashboard.updateSystemSettings(settingsUpdates);
    });

    test('should display audit logs with filtering', async ({ page }) => {
      const adminDashboard = new AdminDashboardPage(page);
      
      await adminDashboard.viewAuditLogs();
      
      const auditFilters = {
        action: 'login',
        dateFrom: '2024-01-01',
      };
      
      await adminDashboard.filterAuditLogs(auditFilters);
    });

    test('should display system health monitoring', async ({ page }) => {
      const adminDashboard = new AdminDashboardPage(page);
      
      await adminDashboard.viewSystemHealth();
      
      // Check individual service status
      const services = [
        'api-gateway', 'auth-service', 'appointments-service',
        'files-service', 'notifications-service', 'ai-service'
      ];
      
      for (const service of services) {
        await expect(page.locator(`[data-testid="service-${service}"]`)).toBeVisible();
      }
    });

    test('should allow report generation', async ({ page }) => {
      const adminDashboard = new AdminDashboardPage(page);
      
      const reportTypes = ['user-activity', 'revenue', 'system-performance'];
      
      for (const reportType of reportTypes) {
        await adminDashboard.generateReport(reportType);
        
        // Verify report download
        await expect(page.locator('[data-testid="download-report"]')).toBeVisible();
      }
    });

    test('should allow backup management', async ({ page }) => {
      await dashboardPage.navigateToSection('backups');
      
      await expect(page.locator('[data-testid="backups-list"]')).toBeVisible();
      
      // Test backup creation
      await page.click('[data-testid="create-backup"]');
      await page.selectOption('[data-testid="backup-type"]', 'full');
      await page.click('[data-testid="start-backup"]');
      await expect(page.locator('[data-testid="backup-started"]')).toBeVisible();
    });

    test('should display comprehensive analytics', async ({ page }) => {
      await dashboardPage.navigateToSection('analytics');
      
      await expect(page.locator('[data-testid="platform-analytics"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-engagement"]')).toBeVisible();
      await expect(page.locator('[data-testid="revenue-analytics"]')).toBeVisible();
      await expect(page.locator('[data-testid="system-performance"]')).toBeVisible();
      
      // Test different analytics views
      await page.click('[data-testid="analytics-view-users"]');
      await page.waitForLoadState('networkidle');
      
      await page.click('[data-testid="analytics-view-revenue"]');
      await page.waitForLoadState('networkidle');
      
      await page.click('[data-testid="analytics-view-performance"]');
      await page.waitForLoadState('networkidle');
    });
  });

  test.describe('Cross-Platform Features', () => {
    test('should handle responsive design across devices', async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await loginPage.navigate();
      
      await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible();
      
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
      
      // Test desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(page.locator('[data-testid="full-sidebar"]')).toBeVisible();
    });

    test('should handle real-time notifications', async ({ page, context }) => {
      // Login as coach in first tab
      await loginPage.navigate();
      await loginPage.login(testUsers.coach.email, testUsers.coach.password);
      
      // Open second tab as client
      const clientPage = await context.newPage();
      const clientLogin = new LoginPage(clientPage);
      await clientLogin.navigate();
      await clientLogin.login(testUsers.client.email, testUsers.client.password);
      
      // Book appointment as client
      const clientPortal = new ClientPortalPage(clientPage);
      const appointmentData = generateAppointment();
      await clientPortal.bookAppointment(appointmentData);
      
      // Check notification appears for coach
      await expect(page.locator('[data-testid="notification-popup"]')).toBeVisible();
      await expect(page.locator('[data-testid="notification-content"]')).toContainText('New appointment');
      
      await clientPage.close();
    });

    test('should handle file upload with different formats', async ({ page }) => {
      await loginPage.navigate();
      await loginPage.login(testUsers.client.email, testUsers.client.password);
      
      const clientPortal = new ClientPortalPage(page);
      
      const testFiles = [
        './test-files/document.pdf',
        './test-files/image.jpg',
        './test-files/audio.mp3',
        './test-files/video.mp4'
      ];
      
      for (const filePath of testFiles) {
        await clientPortal.uploadFile(filePath);
      }
    });

    test('should handle search functionality', async ({ page }) => {
      await loginPage.navigate();
      await loginPage.login(testUsers.coach.email, testUsers.coach.password);
      
      // Global search
      await page.fill('[data-testid="global-search"]', 'test');
      await page.press('[data-testid="global-search"]', 'Enter');
      
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
      
      // Test search filters
      await page.selectOption('[data-testid="search-filter-type"]', 'clients');
      await page.waitForLoadState('networkidle');
      
      await page.selectOption('[data-testid="search-filter-type"]', 'appointments');
      await page.waitForLoadState('networkidle');
    });

    test('should handle data export functionality', async ({ page }) => {
      await loginPage.navigate();
      await loginPage.login(testUsers.admin.email, testUsers.admin.password);
      
      await dashboardPage.navigateToSection('reports');
      
      // Test different export formats
      const exportFormats = ['pdf', 'excel', 'csv'];
      
      for (const format of exportFormats) {
        await page.selectOption('[data-testid="export-format"]', format);
        await page.click('[data-testid="export-data"]');
        
        // Wait for download
        const downloadPromise = page.waitForEvent('download');
        await downloadPromise;
      }
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate offline mode
      await page.context().setOffline(true);
      
      await loginPage.navigate();
      await expect(page.locator('[data-testid="offline-message"]')).toBeVisible();
      
      // Restore connection
      await page.context().setOffline(false);
      await page.reload();
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    });

    test('should handle session timeout', async ({ page }) => {
      await loginPage.navigate();
      await loginPage.login(testUsers.client.email, testUsers.client.password);
      
      // Simulate expired token
      await page.evaluate(() => {
        localStorage.setItem('authToken', 'expired-token');
      });
      
      // Try to access protected route
      await page.goto('/dashboard');
      
      // Should redirect to login
      await expect(page.url()).toContain('/login');
      await expect(page.locator('[data-testid="session-expired-message"]')).toBeVisible();
    });

    test('should validate form inputs properly', async ({ page }) => {
      await loginPage.navigate();
      await page.click('[data-testid="register-link"]');
      
      // Test email validation
      await page.fill('[data-testid="register-email"]', 'invalid-email');
      await page.click('[data-testid="register-button"]');
      await expect(page.locator('[data-testid="email-validation-error"]')).toBeVisible();
      
      // Test password strength
      await page.fill('[data-testid="register-password"]', '123');
      await page.blur('[data-testid="register-password"]');
      await expect(page.locator('[data-testid="password-strength-weak"]')).toBeVisible();
    });

    test('should handle large file uploads', async ({ page }) => {
      await loginPage.navigate();
      await loginPage.login(testUsers.client.email, testUsers.client.password);
      
      const clientPortal = new ClientPortalPage(page);
      await dashboardPage.navigateToSection('files');
      
      // Simulate large file upload
      await page.setInputFiles('[data-testid="file-upload"]', './test-files/large-file.mp4');
      
      // Should show progress bar
      await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
      
      // Should handle file size limits
      await expect(page.locator('[data-testid="file-size-error"]')).toBeVisible({ timeout: 10000 });
    });
  });
});

// Performance and accessibility tests
test.describe('Performance and Accessibility', () => {
  test('should meet accessibility standards', async ({ page }) => {
    await page.goto('/login');
    
    // Check for ARIA labels
    await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute('aria-label');
    await expect(page.locator('[data-testid="password-input"]')).toHaveAttribute('aria-label');
    
    // Check keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="email-input"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="password-input"]')).toBeFocused();
  });

  test('should load pages within performance thresholds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/dashboard');
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });
});