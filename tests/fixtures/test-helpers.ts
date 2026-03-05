/**
 * Shared Test Helpers
 * Common utilities for E2E testing across the wellness coaching platform
 */

import { Page, expect } from '@playwright/test';
import { TEST_USERS, LOGIN_URLS, DASHBOARD_URLS, TEST_CONFIG, TestUser } from './test-users';

/**
 * Login as Coach using data-testid selectors
 * Works regardless of language setting (Hebrew/English/Spanish)
 */
export async function loginAsCoach(page: Page, user: TestUser = TEST_USERS.coach): Promise<void> {
  await page.goto(LOGIN_URLS.coach);

  // Use data-testid for reliable selection
  await page.locator('[data-testid="login-email-input"]').fill(user.email);
  await page.locator('[data-testid="login-password-input"]').fill(user.password);
  await page.locator('[data-testid="login-submit"]').click();

  await page.waitForURL(`**${DASHBOARD_URLS.coach}**`, { timeout: TEST_CONFIG.navigationTimeout });
}

/**
 * Login as Client using data-testid selectors
 */
export async function loginAsClient(page: Page, user: TestUser = TEST_USERS.client): Promise<void> {
  await page.goto(LOGIN_URLS.client);

  // Use data-testid for reliable selection
  await page.locator('[data-testid="client-login-email-input"]').fill(user.email);
  await page.locator('[data-testid="client-login-password-input"]').fill(user.password);
  await page.locator('[data-testid="client-login-submit"]').click();

  await page.waitForURL(`**${DASHBOARD_URLS.client}**`, { timeout: TEST_CONFIG.navigationTimeout });
}

/**
 * Login as Admin
 */
export async function loginAsAdmin(page: Page, user: TestUser = TEST_USERS.admin): Promise<void> {
  await page.goto(LOGIN_URLS.admin);

  // Admin login typically uses the coach login form
  await page.locator('[data-testid="login-email-input"]').fill(user.email);
  await page.locator('[data-testid="login-password-input"]').fill(user.password);
  await page.locator('[data-testid="login-submit"]').click();

  await page.waitForURL(`**${DASHBOARD_URLS.admin}**`, { timeout: TEST_CONFIG.navigationTimeout });
}

/**
 * Fill coach login form without submitting
 */
export async function fillCoachLoginForm(page: Page, email: string, password: string): Promise<void> {
  await page.locator('[data-testid="login-email-input"]').fill(email);
  await page.locator('[data-testid="login-password-input"]').fill(password);
}

/**
 * Fill client login form without submitting
 */
export async function fillClientLoginForm(page: Page, email: string, password: string): Promise<void> {
  await page.locator('[data-testid="client-login-email-input"]').fill(email);
  await page.locator('[data-testid="client-login-password-input"]').fill(password);
}

/**
 * Wait for page to be fully loaded
 */
export async function waitForPageReady(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(TEST_CONFIG.shortDelay);
}

/**
 * Logout from the application
 * Works for both coach and client portals
 */
export async function logout(page: Page): Promise<void> {
  // Try to find and click user menu
  const userMenu = page.locator('[data-testid="user-menu"], [data-testid="profile-menu"]').first();
  const avatarButton = page.getByRole('button').filter({ has: page.locator('.MuiAvatar-root') }).first();

  if (await userMenu.isVisible()) {
    await userMenu.click();
  } else if (await avatarButton.isVisible()) {
    await avatarButton.click();
  }

  // Click logout
  const logoutButton = page.getByRole('menuitem', { name: /logout|sign out/i })
    .or(page.locator('[data-testid="logout-button"]'))
    .or(page.getByText(/logout|sign out/i));

  await logoutButton.first().click();
}

/**
 * Clear all session data
 */
export async function clearSession(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Navigate and wait for page load
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await waitForPageReady(page);
}

/**
 * Set viewport for mobile testing
 */
export async function setMobileViewport(page: Page): Promise<void> {
  await page.setViewportSize({ width: 375, height: 667 });
}

/**
 * Set viewport for tablet testing
 */
export async function setTabletViewport(page: Page): Promise<void> {
  await page.setViewportSize({ width: 768, height: 1024 });
}

/**
 * Set viewport for desktop testing
 */
export async function setDesktopViewport(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1280, height: 800 });
}

/**
 * Take screenshot with standard naming
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({
    path: `tests/screenshots/${name}-${Date.now()}.png`,
    fullPage: true
  });
}

/**
 * Verify toast/notification message appears
 */
export async function verifyToast(page: Page, messagePattern: RegExp): Promise<void> {
  const toast = page.getByRole('alert')
    .or(page.locator('.MuiSnackbar-root'))
    .or(page.locator('.toast, .notification'));

  await expect(toast.filter({ hasText: messagePattern })).toBeVisible({
    timeout: TEST_CONFIG.timeout.short
  });
}

/**
 * Verify error message appears
 */
export async function verifyError(page: Page, messagePattern: RegExp): Promise<void> {
  await expect(page.getByText(messagePattern)).toBeVisible({
    timeout: TEST_CONFIG.timeout.short
  });
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(page: Page, urlPattern: string | RegExp): Promise<void> {
  await page.waitForResponse(
    response => {
      const matches = typeof urlPattern === 'string'
        ? response.url().includes(urlPattern)
        : urlPattern.test(response.url());
      return matches && response.status() < 400;
    },
    { timeout: TEST_CONFIG.apiTimeout }
  );
}

/**
 * Generate unique email for testing
 */
export function generateTestEmail(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@test.clinic.com`;
}

/**
 * Generate unique name for testing
 */
export function generateTestName(): { firstName: string; lastName: string } {
  const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Davis'];

  return {
    firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
    lastName: lastNames[Math.floor(Math.random() * lastNames.length)]
  };
}
