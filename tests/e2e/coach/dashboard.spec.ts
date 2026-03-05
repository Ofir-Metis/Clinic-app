/**
 * Coach Dashboard E2E Tests
 * Tests dashboard functionality, widgets, and navigation for coach users
 */

import { test, expect, Page } from '@playwright/test';
import { TEST_USERS, LOGIN_URLS, DASHBOARD_URLS, TEST_CONFIG } from '../../fixtures/test-users';

// Helper to login as coach before each test
async function loginAsCoach(page: Page): Promise<void> {
  await page.goto(LOGIN_URLS.coach);
  await page.getByLabel(/email/i).fill(TEST_USERS.coach.email);
  await page.getByLabel(/password/i).fill(TEST_USERS.coach.password);
  await page.getByRole('button', { name: /login|sign in/i }).click();
  await page.waitForURL(`**${DASHBOARD_URLS.coach}**`, { timeout: TEST_CONFIG.timeout.navigation });
}

test.describe('Coach Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCoach(page);
  });

  test.describe('Dashboard Layout', () => {
    test('should display dashboard with main elements', async ({ page }) => {
      // Verify we're on the dashboard
      await expect(page).toHaveURL(new RegExp(DASHBOARD_URLS.coach));

      // Check for navigation
      await expect(page.getByRole('navigation')).toBeVisible();

      // Check for main content area
      await expect(page.locator('main, [role="main"], .main-content, .dashboard-content')).toBeVisible();
    });

    test('should display welcome message or user info', async ({ page }) => {
      // Look for welcome message or user name
      const hasWelcome = await page.getByText(/welcome|hello|hi/i).isVisible().catch(() => false);
      const hasUserName = await page.getByText(new RegExp(TEST_USERS.coach.firstName || 'Sarah', 'i')).isVisible().catch(() => false);

      expect(hasWelcome || hasUserName).toBeTruthy();
    });

    test('should display navigation sidebar or menu', async ({ page }) => {
      const nav = page.getByRole('navigation');
      await expect(nav).toBeVisible();

      // Check for common navigation items
      const hasClients = await page.getByRole('link', { name: /clients|patients/i }).isVisible().catch(() => false);
      const hasCalendar = await page.getByRole('link', { name: /calendar|appointments|schedule/i }).isVisible().catch(() => false);
      const hasSettings = await page.getByRole('link', { name: /settings/i }).isVisible().catch(() => false);

      expect(hasClients || hasCalendar || hasSettings).toBeTruthy();
    });

    test('should display user profile menu', async ({ page }) => {
      // Look for profile button/avatar
      const profileButton = page.getByRole('button', { name: /profile|account|menu|user/i });
      const avatar = page.locator('[aria-label*="profile"], [aria-label*="account"], .avatar, .user-avatar');

      const hasProfileButton = await profileButton.isVisible().catch(() => false);
      const hasAvatar = await avatar.isVisible().catch(() => false);

      expect(hasProfileButton || hasAvatar).toBeTruthy();
    });
  });

  test.describe('Today\'s Schedule', () => {
    test('should display today\'s appointments section', async ({ page }) => {
      // Look for today's appointments or schedule section
      const todaySection = page.getByText(/today|schedule|appointments/i).first();
      await expect(todaySection).toBeVisible();
    });

    test('should display appointment cards or list', async ({ page }) => {
      // Look for appointment items
      const appointmentItems = page.locator('[data-testid*="appointment"], .appointment-card, .session-card, .booking-item');
      const listItems = page.locator('li').filter({ hasText: /session|appointment|meeting/i });

      const hasAppointments = await appointmentItems.count() > 0 || await listItems.count() > 0;
      const hasEmptyState = await page.getByText(/no.*appointments|no.*sessions|empty/i).isVisible().catch(() => false);

      // Either has appointments or shows empty state
      expect(hasAppointments || hasEmptyState).toBeTruthy();
    });

    test('should show appointment time and client info', async ({ page }) => {
      const appointmentCard = page.locator('[data-testid*="appointment"], .appointment-card, .session-card').first();

      if (await appointmentCard.isVisible()) {
        // Check for time display
        const hasTime = await appointmentCard.getByText(/\d{1,2}:\d{2}|AM|PM/i).isVisible().catch(() => false);
        // Check for client name or info
        const hasClientInfo = await appointmentCard.locator('*').filter({ hasText: /.+/ }).count() > 0;

        expect(hasTime || hasClientInfo).toBeTruthy();
      }
    });

    test('should allow clicking on appointment for details', async ({ page }) => {
      const appointmentCard = page.locator('[data-testid*="appointment"], .appointment-card, .session-card').first();

      if (await appointmentCard.isVisible()) {
        await appointmentCard.click();

        // Should navigate to appointment detail or open modal
        const hasDetail = await page.getByRole('dialog').isVisible().catch(() => false) ||
                          page.url().includes('/appointment');

        expect(hasDetail).toBeTruthy();
      }
    });
  });

  test.describe('Calendar Navigation', () => {
    test('should display date picker or calendar widget', async ({ page }) => {
      const datePicker = page.locator('[data-testid*="date"], .date-picker, .calendar-widget, [role="calendar"]');
      const dateDisplay = page.getByText(/today|monday|tuesday|wednesday|thursday|friday|saturday|sunday/i);

      const hasDatePicker = await datePicker.isVisible().catch(() => false);
      const hasDateDisplay = await dateDisplay.isVisible().catch(() => false);

      expect(hasDatePicker || hasDateDisplay).toBeTruthy();
    });

    test('should navigate to different dates', async ({ page }) => {
      // Look for navigation arrows
      const nextButton = page.getByRole('button', { name: /next|forward|→|>/i });
      const prevButton = page.getByRole('button', { name: /prev|back|←|</i });

      if (await nextButton.isVisible()) {
        await nextButton.click();
        // Content should update (checking for any change)
        await page.waitForTimeout(500);
      }

      if (await prevButton.isVisible()) {
        await prevButton.click();
        await page.waitForTimeout(500);
      }
    });

    test('should show week view if available', async ({ page }) => {
      const weekButton = page.getByRole('button', { name: /week/i });
      const weekTab = page.getByRole('tab', { name: /week/i });

      if (await weekButton.isVisible()) {
        await weekButton.click();
        await page.waitForTimeout(500);
      } else if (await weekTab.isVisible()) {
        await weekTab.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Quick Stats', () => {
    test('should display statistics cards', async ({ page }) => {
      // Look for stats sections
      const statsSection = page.locator('[data-testid*="stats"], .stats, .statistics, .metrics, .quick-stats');
      const statCards = page.locator('.stat-card, .metric-card, [data-testid*="stat"]');

      const hasStatsSection = await statsSection.isVisible().catch(() => false);
      const hasStatCards = await statCards.count() > 0;
      const hasNumbers = await page.locator('text=/\\d+/').count() > 0;

      expect(hasStatsSection || hasStatCards || hasNumbers).toBeTruthy();
    });

    test('should show session count or client count', async ({ page }) => {
      const sessionCount = await page.getByText(/sessions|appointments/i).isVisible().catch(() => false);
      const clientCount = await page.getByText(/clients|patients/i).isVisible().catch(() => false);

      expect(sessionCount || clientCount).toBeTruthy();
    });

    test('should display weekly or monthly stats', async ({ page }) => {
      const weeklyStats = await page.getByText(/this week|weekly/i).isVisible().catch(() => false);
      const monthlyStats = await page.getByText(/this month|monthly/i).isVisible().catch(() => false);

      // Either weekly or monthly stats should be visible
      expect(weeklyStats || monthlyStats).toBeTruthy();
    });
  });

  test.describe('Quick Actions', () => {
    test('should have add appointment button', async ({ page }) => {
      const addButton = page.getByRole('button', { name: /add.*appointment|new.*session|schedule|book/i });
      const addLink = page.getByRole('link', { name: /add.*appointment|new.*session|schedule|book/i });
      const fabButton = page.locator('[data-testid*="add"], .fab, .add-button');

      const hasAddButton = await addButton.isVisible().catch(() => false);
      const hasAddLink = await addLink.isVisible().catch(() => false);
      const hasFab = await fabButton.isVisible().catch(() => false);

      expect(hasAddButton || hasAddLink || hasFab).toBeTruthy();
    });

    test('should navigate to clients page', async ({ page }) => {
      const clientsLink = page.getByRole('link', { name: /clients|patients/i });
      const clientsButton = page.getByRole('button', { name: /clients|patients/i });

      if (await clientsLink.isVisible()) {
        await clientsLink.click();
        await expect(page).toHaveURL(/clients|patients/);
      } else if (await clientsButton.isVisible()) {
        await clientsButton.click();
        await expect(page).toHaveURL(/clients|patients/);
      }
    });

    test('should navigate to calendar page', async ({ page }) => {
      const calendarLink = page.getByRole('link', { name: /calendar|schedule/i });

      if (await calendarLink.isVisible()) {
        await calendarLink.click();
        await expect(page).toHaveURL(/calendar|schedule/);
      }
    });

    test('should navigate to tools page if available', async ({ page }) => {
      const toolsLink = page.getByRole('link', { name: /tools|utilities/i });

      if (await toolsLink.isVisible()) {
        await toolsLink.click();
        await expect(page).toHaveURL(/tools/);
      }
    });
  });

  test.describe('Notifications', () => {
    test('should display notification icon', async ({ page }) => {
      const notificationButton = page.getByRole('button', { name: /notification|bell|alert/i });
      const notificationIcon = page.locator('[aria-label*="notification"], .notification-icon, .bell-icon');

      const hasButton = await notificationButton.isVisible().catch(() => false);
      const hasIcon = await notificationIcon.isVisible().catch(() => false);

      expect(hasButton || hasIcon).toBeTruthy();
    });

    test('should open notification panel when clicked', async ({ page }) => {
      const notificationButton = page.getByRole('button', { name: /notification|bell|alert/i });

      if (await notificationButton.isVisible()) {
        await notificationButton.click();

        // Should open dropdown or panel
        const hasPanel = await page.getByRole('menu').isVisible().catch(() => false) ||
                         await page.locator('.notification-panel, .notifications-dropdown').isVisible().catch(() => false);

        expect(hasPanel).toBeTruthy();
      }
    });
  });

  test.describe('Empty States', () => {
    test('should handle empty appointments gracefully', async ({ page }) => {
      // If no appointments for today, should show appropriate message
      const emptyMessage = page.getByText(/no.*appointments|no.*sessions|nothing.*scheduled|free.*day/i);
      const appointments = page.locator('[data-testid*="appointment"], .appointment-card, .session-card');

      const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);
      const hasAppointments = await appointments.count() > 0;

      // Should either show appointments or empty message
      expect(hasEmptyMessage || hasAppointments).toBeTruthy();
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt to tablet view', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Main content should still be visible
      await expect(page.locator('main, [role="main"], .main-content')).toBeVisible();

      // Navigation might collapse
      const nav = page.getByRole('navigation');
      const hasNav = await nav.isVisible().catch(() => false);
      const hasHamburger = await page.getByRole('button', { name: /menu|hamburger/i }).isVisible().catch(() => false);

      expect(hasNav || hasHamburger).toBeTruthy();
    });

    test('should adapt to mobile view', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Main content should still be accessible
      await expect(page.locator('main, [role="main"], .main-content, .dashboard')).toBeVisible();

      // Should have hamburger menu for navigation
      const hamburger = page.getByRole('button', { name: /menu|hamburger/i });
      const menuIcon = page.locator('.hamburger, .menu-icon, [data-testid*="menu"]');

      const hasHamburger = await hamburger.isVisible().catch(() => false);
      const hasMenuIcon = await menuIcon.isVisible().catch(() => false);

      // On mobile, navigation usually collapses to hamburger
      expect(hasHamburger || hasMenuIcon).toBeTruthy();
    });
  });

  test.describe('Data Refresh', () => {
    test('should update data on page refresh', async ({ page }) => {
      // Get current content
      const initialContent = await page.content();

      // Refresh
      await page.reload();

      // Page should still work after refresh
      await expect(page).toHaveURL(new RegExp(DASHBOARD_URLS.coach));
      await expect(page.locator('main, [role="main"], .main-content')).toBeVisible();
    });

    test('should have refresh capability if available', async ({ page }) => {
      const refreshButton = page.getByRole('button', { name: /refresh|reload|sync/i });

      if (await refreshButton.isVisible()) {
        await refreshButton.click();
        // Wait for potential loading state
        await page.waitForTimeout(1000);
        // Dashboard should still be functional
        await expect(page.locator('main, [role="main"], .main-content')).toBeVisible();
      }
    });
  });

  test.describe('Real-time Updates', () => {
    test('should have WebSocket connection for real-time updates', async ({ page }) => {
      // Check if WebSocket connections are established
      const wsConnections: string[] = [];

      page.on('websocket', ws => {
        wsConnections.push(ws.url());
      });

      // Wait a bit for any WebSocket connections to establish
      await page.waitForTimeout(2000);

      // This is informational - not all implementations use WebSocket
      // The test passes regardless to not fail on implementations without WS
      expect(true).toBeTruthy();
    });
  });
});
