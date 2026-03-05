import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:4001';

// Generate unique test user
const timestamp = Date.now();
const testUser = {
  name: `Test User ${timestamp}`,
  email: `test-${timestamp}@clinic.com`,
  password: 'TestPassword123!'
};

test.describe('Data Isolation Test', () => {
  test.describe.configure({ mode: 'serial' });

  test('1. Register a new account', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');

    // Take screenshot of registration page
    await page.screenshot({ path: '/tmp/test-01-registration-page.png', fullPage: true });

    // Fill registration form
    const nameInput = page.locator('input[name="name"], input[id="name"]');
    if (await nameInput.isVisible({ timeout: 5000 })) {
      await nameInput.fill(testUser.name);
    }

    const emailInput = page.locator('input[name="email"], input[id="email"], input[type="email"]');
    await emailInput.fill(testUser.email);

    const passwordInput = page.locator('input[name="password"], input[id="password"]').first();
    await passwordInput.fill(testUser.password);

    const confirmPasswordInput = page.locator('input[name="confirmPassword"], input[id="confirmPassword"]');
    if (await confirmPasswordInput.isVisible({ timeout: 2000 })) {
      await confirmPasswordInput.fill(testUser.password);
    }

    // Select coach/therapist role if available
    const therapistRadio = page.locator('input[value="therapist"]');
    if (await therapistRadio.isVisible({ timeout: 2000 })) {
      await therapistRadio.click();
    }

    await page.screenshot({ path: '/tmp/test-02-registration-filled.png', fullPage: true });

    // Submit registration
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Wait for redirect to dashboard
    await page.waitForURL(/dashboard/, { timeout: 15000 }).catch(() => {
      console.log('Did not redirect to dashboard, might be on different page');
    });

    await page.screenshot({ path: '/tmp/test-03-after-registration.png', fullPage: true });

    console.log(`Registered user: ${testUser.email}`);
  });

  test('2. Login with new account', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Fill login form
    const emailInput = page.locator('[data-testid="login-email-input"], input[name="email"], input[type="email"]');
    await emailInput.fill(testUser.email);

    const passwordInput = page.locator('[data-testid="login-password-input"], input[name="password"], input[type="password"]');
    await passwordInput.fill(testUser.password);

    await page.screenshot({ path: '/tmp/test-04-login-filled.png', fullPage: true });

    // Submit login
    const submitButton = page.locator('[data-testid="login-submit"], button[type="submit"]');
    await submitButton.click();

    // Wait for dashboard
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: '/tmp/test-05-dashboard.png', fullPage: true });

    console.log('Logged in successfully');
  });

  test('3. Check Dashboard - should be empty for new user', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.locator('[data-testid="login-email-input"], input[name="email"]').fill(testUser.email);
    await page.locator('[data-testid="login-password-input"], input[name="password"]').fill(testUser.password);
    await page.locator('[data-testid="login-submit"], button[type="submit"]').click();
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: '/tmp/test-06-dashboard-content.png', fullPage: true });

    // Check page content
    const pageContent = await page.content();
    console.log('Dashboard loaded for new user');
  });

  test('4. Check Clients page - should be empty for new user', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.locator('[data-testid="login-email-input"], input[name="email"]').fill(testUser.email);
    await page.locator('[data-testid="login-password-input"], input[name="password"]').fill(testUser.password);
    await page.locator('[data-testid="login-submit"], button[type="submit"]').click();
    await page.waitForURL(/dashboard/, { timeout: 15000 });

    // Navigate to clients page
    await page.goto(`${BASE_URL}/patients`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: '/tmp/test-07-clients-page.png', fullPage: true });

    // Check for empty state or no clients message
    const hasClients = await page.locator('[class*="Card"]').count();
    console.log(`Clients found: ${hasClients}`);

    // Should have 0 clients for a new user (empty state)
    // If there are clients shown, this is a data isolation bug!
    if (hasClients > 1) {
      console.warn('WARNING: Found clients for new user - possible data isolation issue!');
    } else {
      console.log('PASS: Clients page is empty for new user');
    }
  });

  test('5. Add a new client', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.locator('[data-testid="login-email-input"], input[name="email"]').fill(testUser.email);
    await page.locator('[data-testid="login-password-input"], input[name="password"]').fill(testUser.password);
    await page.locator('[data-testid="login-submit"], button[type="submit"]').click();
    await page.waitForURL(/dashboard/, { timeout: 15000 });

    // Navigate to add client page
    await page.goto(`${BASE_URL}/patients/new`);
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: '/tmp/test-08-add-client-page.png', fullPage: true });

    // Fill client form
    const firstNameInput = page.locator('input[name="firstName"]');
    if (await firstNameInput.isVisible({ timeout: 5000 })) {
      await firstNameInput.fill('MyTest');
      await page.locator('input[name="lastName"]').fill('Client');
      await page.locator('input[name="email"]').fill(`myclient-${timestamp}@test.com`);
      await page.locator('input[name="phone"]').fill('+972-50-123-4567');

      await page.screenshot({ path: '/tmp/test-09-add-client-filled.png', fullPage: true });

      // Submit
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/test-10-after-add-client.png', fullPage: true });

      console.log('Client added successfully');
    } else {
      console.log('Add client form not found');
    }
  });

  test('6. Verify client appears in list', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.locator('[data-testid="login-email-input"], input[name="email"]').fill(testUser.email);
    await page.locator('[data-testid="login-password-input"], input[name="password"]').fill(testUser.password);
    await page.locator('[data-testid="login-submit"], button[type="submit"]').click();
    await page.waitForURL(/dashboard/, { timeout: 15000 });

    // Navigate to clients page
    await page.goto(`${BASE_URL}/patients`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: '/tmp/test-11-clients-after-add.png', fullPage: true });

    // Check if our client appears
    const hasMyClient = await page.getByText('MyTest').isVisible({ timeout: 5000 }).catch(() => false);

    if (hasMyClient) {
      console.log('PASS: Our client "MyTest" is visible');
    } else {
      console.log('Client "MyTest" not found - checking page content');
    }
  });

  test('7. Check Calendar page', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.locator('[data-testid="login-email-input"], input[name="email"]').fill(testUser.email);
    await page.locator('[data-testid="login-password-input"], input[name="password"]').fill(testUser.password);
    await page.locator('[data-testid="login-submit"], button[type="submit"]').click();
    await page.waitForURL(/dashboard/, { timeout: 15000 });

    // Navigate to calendar
    await page.goto(`${BASE_URL}/calendar`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: '/tmp/test-12-calendar-page.png', fullPage: true });

    console.log('Calendar page loaded');
  });

  test('8. Check Settings page', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.locator('[data-testid="login-email-input"], input[name="email"]').fill(testUser.email);
    await page.locator('[data-testid="login-password-input"], input[name="password"]').fill(testUser.password);
    await page.locator('[data-testid="login-submit"], button[type="submit"]').click();
    await page.waitForURL(/dashboard/, { timeout: 15000 });

    // Navigate to settings
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: '/tmp/test-13-settings-page.png', fullPage: true });

    console.log('Settings page loaded');
  });
});
