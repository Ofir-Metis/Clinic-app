/**
 * Visual Regression Tests
 * Screenshot comparisons for key pages across desktop and mobile viewports
 */

import { test, expect, Page } from '@playwright/test';
import { TEST_USERS, LOGIN_URLS, DASHBOARD_URLS, TEST_CONFIG } from '../../fixtures/test-users';

// Helper to login as coach using data-testid selectors
async function loginAsCoach(page: Page): Promise<void> {
  await page.goto(LOGIN_URLS.coach);

  // Use data-testid for reliable selection (works regardless of language)
  await page.locator('[data-testid="login-email-input"]').fill(TEST_USERS.coach.email);
  await page.locator('[data-testid="login-password-input"]').fill(TEST_USERS.coach.password);
  await page.locator('[data-testid="login-submit"]').click();

  await page.waitForURL(`**${DASHBOARD_URLS.coach}**`, { timeout: TEST_CONFIG.navigationTimeout });
}

// Helper to login as client using data-testid selectors
async function loginAsClient(page: Page): Promise<void> {
  await page.goto(LOGIN_URLS.client);

  // Use data-testid for reliable selection
  await page.locator('[data-testid="client-login-email-input"]').fill(TEST_USERS.client.email);
  await page.locator('[data-testid="client-login-password-input"]').fill(TEST_USERS.client.password);
  await page.locator('[data-testid="client-login-submit"]').click();

  await page.waitForURL(`**${DASHBOARD_URLS.client}**`, { timeout: TEST_CONFIG.navigationTimeout });
}

// Wait for page to be fully loaded
async function waitForPageReady(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500); // Allow animations to complete
}

test.describe('Visual Regression Tests', () => {
  test.describe('Coach Portal - Desktop', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
    });

    test('login page', async ({ page }) => {
      await page.goto(LOGIN_URLS.coach);
      await waitForPageReady(page);

      await expect(page).toHaveScreenshot('coach-login-desktop.png', {
        fullPage: false,
        maxDiffPixels: 100,
        threshold: 0.2
      });
    });

    test('dashboard', async ({ page }) => {
      await loginAsCoach(page);
      await waitForPageReady(page);

      await expect(page).toHaveScreenshot('coach-dashboard-desktop.png', {
        fullPage: false,
        maxDiffPixels: 200,
        threshold: 0.2
      });
    });

    test('clients page', async ({ page }) => {
      await loginAsCoach(page);
      await page.goto('/clients');
      await waitForPageReady(page);

      await expect(page).toHaveScreenshot('coach-clients-desktop.png', {
        fullPage: false,
        maxDiffPixels: 200,
        threshold: 0.2
      });
    });

    test('calendar page', async ({ page }) => {
      await loginAsCoach(page);
      await page.goto('/calendar');
      await waitForPageReady(page);

      await expect(page).toHaveScreenshot('coach-calendar-desktop.png', {
        fullPage: false,
        maxDiffPixels: 300, // Calendar content varies by date
        threshold: 0.25
      });
    });

    test('settings page', async ({ page }) => {
      await loginAsCoach(page);
      await page.goto('/settings');
      await waitForPageReady(page);

      await expect(page).toHaveScreenshot('coach-settings-desktop.png', {
        fullPage: false,
        maxDiffPixels: 150,
        threshold: 0.2
      });
    });
  });

  test.describe('Coach Portal - Mobile', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test('login page', async ({ page }) => {
      await page.goto(LOGIN_URLS.coach);
      await waitForPageReady(page);

      await expect(page).toHaveScreenshot('coach-login-mobile.png', {
        fullPage: false,
        maxDiffPixels: 100,
        threshold: 0.2
      });
    });

    test('dashboard', async ({ page }) => {
      await loginAsCoach(page);
      await waitForPageReady(page);

      await expect(page).toHaveScreenshot('coach-dashboard-mobile.png', {
        fullPage: false,
        maxDiffPixels: 200,
        threshold: 0.2
      });
    });

    test('clients page', async ({ page }) => {
      await loginAsCoach(page);
      await page.goto('/clients');
      await waitForPageReady(page);

      await expect(page).toHaveScreenshot('coach-clients-mobile.png', {
        fullPage: false,
        maxDiffPixels: 200,
        threshold: 0.2
      });
    });

    test('navigation menu expanded', async ({ page }) => {
      await loginAsCoach(page);
      await waitForPageReady(page);

      // Open mobile menu
      const hamburger = page.getByRole('button', { name: /menu|hamburger/i })
        .or(page.locator('[data-testid="mobile-menu-button"]'));

      if (await hamburger.first().isVisible()) {
        await hamburger.first().click();
        await page.waitForTimeout(300);

        await expect(page).toHaveScreenshot('coach-mobile-menu.png', {
          fullPage: false,
          maxDiffPixels: 150,
          threshold: 0.2
        });
      }
    });
  });

  test.describe('Client Portal - Desktop', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
    });

    test('login page', async ({ page }) => {
      await page.goto(LOGIN_URLS.client);
      await waitForPageReady(page);

      await expect(page).toHaveScreenshot('client-login-desktop.png', {
        fullPage: false,
        maxDiffPixels: 100,
        threshold: 0.2
      });
    });

    test('dashboard', async ({ page }) => {
      await loginAsClient(page);
      await waitForPageReady(page);

      await expect(page).toHaveScreenshot('client-dashboard-desktop.png', {
        fullPage: false,
        maxDiffPixels: 200,
        threshold: 0.2
      });
    });

    test('coach discovery page', async ({ page }) => {
      await loginAsClient(page);
      await page.goto('/client/discover-coaches');
      await waitForPageReady(page);

      await expect(page).toHaveScreenshot('client-discovery-desktop.png', {
        fullPage: false,
        maxDiffPixels: 250,
        threshold: 0.2
      });
    });

    test('goals page', async ({ page }) => {
      await loginAsClient(page);
      await page.goto('/client/goals');
      await waitForPageReady(page);

      await expect(page).toHaveScreenshot('client-goals-desktop.png', {
        fullPage: false,
        maxDiffPixels: 200,
        threshold: 0.2
      });
    });

    test('achievements page', async ({ page }) => {
      await loginAsClient(page);
      await page.goto('/client/achievements');
      await waitForPageReady(page);

      await expect(page).toHaveScreenshot('client-achievements-desktop.png', {
        fullPage: false,
        maxDiffPixels: 200,
        threshold: 0.2
      });
    });
  });

  test.describe('Client Portal - Mobile', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test('login page', async ({ page }) => {
      await page.goto(LOGIN_URLS.client);
      await waitForPageReady(page);

      await expect(page).toHaveScreenshot('client-login-mobile.png', {
        fullPage: false,
        maxDiffPixels: 100,
        threshold: 0.2
      });
    });

    test('dashboard', async ({ page }) => {
      await loginAsClient(page);
      await waitForPageReady(page);

      await expect(page).toHaveScreenshot('client-dashboard-mobile.png', {
        fullPage: false,
        maxDiffPixels: 200,
        threshold: 0.2
      });
    });

    test('coach discovery page', async ({ page }) => {
      await loginAsClient(page);
      await page.goto('/client/discover-coaches');
      await waitForPageReady(page);

      await expect(page).toHaveScreenshot('client-discovery-mobile.png', {
        fullPage: false,
        maxDiffPixels: 250,
        threshold: 0.2
      });
    });

    test('goals page', async ({ page }) => {
      await loginAsClient(page);
      await page.goto('/client/goals');
      await waitForPageReady(page);

      await expect(page).toHaveScreenshot('client-goals-mobile.png', {
        fullPage: false,
        maxDiffPixels: 200,
        threshold: 0.2
      });
    });
  });

  test.describe('Tablet Viewports', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
    });

    test('coach dashboard - tablet', async ({ page }) => {
      await loginAsCoach(page);
      await waitForPageReady(page);

      await expect(page).toHaveScreenshot('coach-dashboard-tablet.png', {
        fullPage: false,
        maxDiffPixels: 200,
        threshold: 0.2
      });
    });

    test('client dashboard - tablet', async ({ page }) => {
      await loginAsClient(page);
      await waitForPageReady(page);

      await expect(page).toHaveScreenshot('client-dashboard-tablet.png', {
        fullPage: false,
        maxDiffPixels: 200,
        threshold: 0.2
      });
    });
  });

  test.describe('Dark Mode (if available)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      // Enable dark mode via system preference
      await page.emulateMedia({ colorScheme: 'dark' });
    });

    test('coach login - dark mode', async ({ page }) => {
      await page.goto(LOGIN_URLS.coach);
      await waitForPageReady(page);

      await expect(page).toHaveScreenshot('coach-login-dark.png', {
        fullPage: false,
        maxDiffPixels: 100,
        threshold: 0.2
      });
    });

    test('coach dashboard - dark mode', async ({ page }) => {
      await loginAsCoach(page);
      await waitForPageReady(page);

      await expect(page).toHaveScreenshot('coach-dashboard-dark.png', {
        fullPage: false,
        maxDiffPixels: 200,
        threshold: 0.2
      });
    });

    test('client dashboard - dark mode', async ({ page }) => {
      await loginAsClient(page);
      await waitForPageReady(page);

      await expect(page).toHaveScreenshot('client-dashboard-dark.png', {
        fullPage: false,
        maxDiffPixels: 200,
        threshold: 0.2
      });
    });
  });

  test.describe('Component Screenshots', () => {
    test('appointment card', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await loginAsCoach(page);
      await waitForPageReady(page);

      const appointmentCard = page.locator('[data-testid*="appointment"], .appointment-card').first();
      if (await appointmentCard.isVisible()) {
        await expect(appointmentCard).toHaveScreenshot('appointment-card.png', {
          maxDiffPixels: 50,
          threshold: 0.2
        });
      }
    });

    test('client card', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await loginAsCoach(page);
      await page.goto('/clients');
      await waitForPageReady(page);

      const clientCard = page.locator('[data-testid*="client"], .client-card').first();
      if (await clientCard.isVisible()) {
        await expect(clientCard).toHaveScreenshot('client-card.png', {
          maxDiffPixels: 50,
          threshold: 0.2
        });
      }
    });

    test('goal card', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await loginAsClient(page);
      await page.goto('/client/goals');
      await waitForPageReady(page);

      const goalCard = page.locator('[data-testid*="goal"], .goal-card').first();
      if (await goalCard.isVisible()) {
        await expect(goalCard).toHaveScreenshot('goal-card.png', {
          maxDiffPixels: 50,
          threshold: 0.2
        });
      }
    });

    test('coach card', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await loginAsClient(page);
      await page.goto('/client/discover-coaches');
      await waitForPageReady(page);

      const coachCard = page.locator('[data-testid*="coach"], .coach-card').first();
      if (await coachCard.isVisible()) {
        await expect(coachCard).toHaveScreenshot('coach-discovery-card.png', {
          maxDiffPixels: 50,
          threshold: 0.2
        });
      }
    });
  });

  test.describe('Interaction States', () => {
    test('button hover states', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(LOGIN_URLS.coach);
      await waitForPageReady(page);

      const loginButton = page.locator('[data-testid="login-submit"]');
      await loginButton.hover();
      await page.waitForTimeout(300);

      await expect(loginButton).toHaveScreenshot('login-button-hover.png', {
        maxDiffPixels: 30,
        threshold: 0.2
      });
    });

    test('input focus states', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(LOGIN_URLS.coach);
      await waitForPageReady(page);

      const emailInput = page.locator('[data-testid="login-email-input"]');
      await emailInput.focus();
      await page.waitForTimeout(300);

      await expect(emailInput).toHaveScreenshot('email-input-focus.png', {
        maxDiffPixels: 30,
        threshold: 0.2
      });
    });
  });

  test.describe('Form Validation States', () => {
    test('login form validation errors', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(LOGIN_URLS.coach);
      await waitForPageReady(page);

      // Submit empty form
      await page.locator('[data-testid="login-submit"]').click();
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('login-validation-errors.png', {
        fullPage: false,
        maxDiffPixels: 100,
        threshold: 0.2
      });
    });
  });

  test.describe('Loading States', () => {
    test('page loading skeleton', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await loginAsCoach(page);

      // Navigate and capture loading state immediately
      page.goto('/clients', { waitUntil: 'commit' });
      await page.waitForTimeout(100);

      // Loading states are transient, so this might capture content
      // The test validates that either loading state or content is shown
      await expect(page).toHaveScreenshot('page-loading.png', {
        fullPage: false,
        maxDiffPixels: 500, // High tolerance for dynamic content
        threshold: 0.3
      });
    });
  });

  test.describe('Modal and Dialog Screenshots', () => {
    test('confirmation dialog', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await loginAsCoach(page);
      await page.goto('/clients');
      await waitForPageReady(page);

      // Try to trigger a confirmation dialog
      const clientCard = page.locator('[data-testid*="client"], .client-card').first();
      if (await clientCard.isVisible()) {
        await clientCard.click();
        await page.waitForTimeout(500);

        const deleteButton = page.getByRole('button', { name: /delete/i });
        if (await deleteButton.isVisible()) {
          await deleteButton.click();
          await page.waitForTimeout(300);

          const dialog = page.getByRole('dialog');
          if (await dialog.isVisible()) {
            await expect(dialog).toHaveScreenshot('confirmation-dialog.png', {
              maxDiffPixels: 100,
              threshold: 0.2
            });

            // Close dialog
            const cancelButton = page.getByRole('button', { name: /cancel|no/i });
            if (await cancelButton.isVisible()) {
              await cancelButton.click();
            }
          }
        }
      }
    });
  });

  test.describe('Empty States', () => {
    test('empty clients list', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await loginAsCoach(page);
      await page.goto('/clients?filter=nonexistent12345');
      await waitForPageReady(page);

      // May show empty state or no results
      await expect(page).toHaveScreenshot('empty-clients.png', {
        fullPage: false,
        maxDiffPixels: 200,
        threshold: 0.25
      });
    });
  });
});
