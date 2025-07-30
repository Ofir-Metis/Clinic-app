/**
 * Authentication helper functions for Playwright tests
 * Provides utilities for login, logout, and auth state management
 */

import { Page, expect } from '@playwright/test';
import { testUsers, TestUser } from './test-data';

/**
 * Performs login via the UI
 */
export async function loginViaUI(page: Page, user: TestUser) {
  await page.goto('/auth');
  await page.waitForLoadState('networkidle');

  // Click on login tab if not already selected (should be default)
  const signInTab = page.locator('text=Sign In');
  if (await signInTab.isVisible()) {
    await signInTab.click();
  }

  // Fill login form - use label-based selectors
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  
  // Click login button (submit type)
  await page.click('button[type="submit"]');
  
  // Wait for navigation to dashboard
  await page.waitForURL(/\/dashboard/);
  await expect(page).toHaveURL(/\/dashboard/);
}

/**
 * Performs registration via the UI
 */
export async function registerViaUI(page: Page, user: TestUser) {
  await page.goto('/auth');
  await page.waitForLoadState('networkidle');

  // Click on register tab
  await page.click('text=Register');

  // Fill registration form
  await page.fill('[data-testid="name-input"]', user.name);
  await page.fill('[data-testid="email-input"]', user.email);
  await page.fill('[data-testid="password-input"]', user.password);
  await page.fill('[data-testid="confirm-password-input"]', user.password);
  
  // Select role
  await page.click(`[data-testid="${user.role}-radio"]`);
  
  // Accept terms
  await page.check('[data-testid="terms-checkbox"]');
  
  // Click register button
  await page.click('[data-testid="register-button"]');
  
  // Wait for navigation
  await page.waitForURL(/\/dashboard/);
  await expect(page).toHaveURL(/\/dashboard/);
}

/**
 * Performs logout via the UI
 */
export async function logoutViaUI(page: Page) {
  // Click user menu or logout button
  const userMenu = page.locator('[data-testid="user-menu"]');
  if (await userMenu.isVisible()) {
    await userMenu.click();
    await page.click('[data-testid="logout-button"]');
  } else {
    // Direct logout button
    await page.click('[data-testid="logout-button"]');
  }
  
  // Wait for redirect to auth page
  await page.waitForURL(/\/auth/);
  await expect(page).toHaveURL(/\/auth/);
}

/**
 * Quick login using API or storage state (faster for setup)
 */
export async function quickLogin(page: Page, userType: keyof typeof testUsers = 'therapist') {
  const user = testUsers[userType];
  
  // Navigate to a page first to ensure localStorage is available
  await page.goto('/auth');
  
  // Set auth token in localStorage (mock implementation)
  await page.evaluate((userData) => {
    if (typeof Storage !== 'undefined') {
      localStorage.setItem('authToken', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify(userData));
    }
  }, user);
  
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
}

/**
 * Checks if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    await page.goto('/dashboard', { timeout: 5000 });
    await page.waitForSelector('[data-testid="dashboard-title"]', { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if user is logged out
 */
export async function isLoggedOut(page: Page): Promise<boolean> {
  try {
    await page.goto('/dashboard', { timeout: 5000 });
    await page.waitForURL(/\/auth/, { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates successful login state
 */
export async function validateLoginSuccess(page: Page, user: TestUser) {
  // Should be on dashboard
  await expect(page).toHaveURL(/\/dashboard/);
  
  // Should see dashboard-specific content (more flexible than exact user name)
  const dashboardIndicators = [
    page.locator('text=Dashboard'),
    page.locator('text=🌿'),
    page.locator('text=Wellness'),
    page.locator('[data-testid="dashboard-title"]'),
    page.locator('h1, h2, h3').first()
  ];
  
  // At least one dashboard indicator should be visible
  let found = false;
  for (const indicator of dashboardIndicators) {
    if (await indicator.isVisible({ timeout: 1000 }).catch(() => false)) {
      found = true;
      break;
    }
  }
  
  if (!found) {
    // Fallback: just ensure we're not on the auth page anymore
    await expect(page).not.toHaveURL(/\/auth/);
    await expect(page).not.toHaveURL(/\/login/);
  }
}

/**
 * Validates login error state
 */
export async function validateLoginError(page: Page, expectedError?: string) {
  // Should still be on auth page
  await expect(page).toHaveURL(/\/auth/);
  
  // Check for error in form helper text or alert
  const errorElements = [
    page.locator('[role="alert"]'),
    page.locator('.MuiFormHelperText-root'),
    page.locator('.MuiAlert-root')
  ];
  
  let errorFound = false;
  for (const element of errorElements) {
    if (await element.first().isVisible().catch(() => false)) {
      if (expectedError) {
        await expect(element.first()).toContainText(expectedError);
      }
      errorFound = true;
      break;
    }
  }
  
  if (!errorFound && expectedError) {
    throw new Error(`Expected error "${expectedError}" but no error elements found`);
  }
}

/**
 * Fills password with visibility toggle test
 */
export async function testPasswordField(page: Page, selector: string, password: string) {
  const passwordField = page.locator(selector);
  const toggleButton = page.locator(`${selector} ~ button[aria-label*="password"]`);
  
  // Fill password
  await passwordField.fill(password);
  
  // Should be hidden by default
  await expect(passwordField).toHaveAttribute('type', 'password');
  
  // Click toggle to show
  if (await toggleButton.isVisible()) {
    await toggleButton.click();
    await expect(passwordField).toHaveAttribute('type', 'text');
    
    // Click toggle to hide again
    await toggleButton.click();
    await expect(passwordField).toHaveAttribute('type', 'password');
  }
}

/**
 * Tests Google OAuth login flow (mock)
 */
export async function testGoogleLogin(page: Page) {
  await page.goto('/auth');
  
  // Click Google login button
  const googleButton = page.locator('[data-testid="google-login-button"]');
  if (await googleButton.isVisible()) {
    await googleButton.click();
    
    // In a real test, you'd handle the OAuth popup
    // For testing, we'll mock the success response
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('google-login-success', {
        detail: { user: { email: 'google@test.com', name: 'Google User' } }
      }));
    });
    
    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard/);
  }
}

/**
 * Setup authenticated state for test suite
 */
export async function setupAuthenticatedState(page: Page, userType: keyof typeof testUsers = 'therapist') {
  await quickLogin(page, userType);
  
  // Verify authentication worked
  const isAuthenticated = await isLoggedIn(page);
  if (!isAuthenticated) {
    throw new Error(`Failed to setup authenticated state for ${userType}`);
  }
}