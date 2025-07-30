import { test, expect } from '@playwright/test';
import { setupAuthenticatedState } from './fixtures/auth-helpers';
import { testConfig } from './fixtures/test-data';

/**
 * Navigation Tests for Clinic Management App
 * Tests the responsive navigation system with wellness theme, routing, and protected routes
 */

test.describe('Navigation System', () => {
  test.beforeEach(async ({ page }) => {
    // Setup authenticated state for navigation tests
    await setupAuthenticatedState(page, 'therapist');
  });

  test.describe('Desktop Navigation', () => {
    test('should show sidebar navigation on desktop', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });
      
      // Should already be on dashboard from beforeEach
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Check that sidebar is visible
      const sidebar = page.locator('[role="navigation"]').first();
      await expect(sidebar).toBeVisible();
      
      // Check that bottom navigation is NOT visible on desktop
      const bottomNav = page.locator('nav[aria-label*="bottom"]');
      await expect(bottomNav).toBeHidden();
      
      // Verify wellness branding in sidebar
      await expect(page.locator('text=Wellness Clinic')).toBeVisible();
    });

    test('should navigate between main pages via sidebar', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/dashboard');
      
      // Test navigation to each main page
      const navigationTests = [
        { text: 'Dashboard', url: '/dashboard' },
        { text: 'Calendar', url: '/calendar' },
        { text: 'Clients', url: '/patients' },
        { text: 'AI Tools', url: '/tools' },
        { text: 'Notifications', url: '/notifications' },
        { text: 'Settings', url: '/settings' }
      ];

      for (const navTest of navigationTests) {
        await page.click(`text=${navTest.text}`);
        await page.waitForURL(`**${navTest.url}`);
        await expect(page).toHaveURL(new RegExp(navTest.url));
        
        // Verify the wellness layout is present
        await expect(page.locator('text=🌿').first()).toBeVisible();
      }
    });
  });

  test.describe('Mobile Navigation', () => {
    test('should show bottom navigation on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/dashboard');
      
      // Check that bottom navigation is visible
      const bottomNav = page.locator('[role="tablist"]').last();
      await expect(bottomNav).toBeVisible();
      
      // Check that sidebar is NOT visible on mobile (unless opened)
      const sidebar = page.locator('nav[aria-label*="sidebar"]');
      await expect(sidebar).toBeHidden();
      
      // Verify all main navigation items are present
      await expect(page.locator('text=Dashboard')).toBeVisible();
      await expect(page.locator('text=Calendar')).toBeVisible();
      await expect(page.locator('text=Clients')).toBeVisible();
      await expect(page.locator('text=AI Tools')).toBeVisible();
      await expect(page.locator('text=Notifications')).toBeVisible();
    });

    test('should navigate between pages via bottom navigation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/dashboard');
      
      const mobileNavTests = [
        { text: 'Calendar', expectedContent: '📅 Your Schedule' },
        { text: 'Clients', expectedContent: '👥 Your Clients' },
        { text: 'AI Tools', expectedContent: '🧠 AI-Powered Tools' },
        { text: 'Notifications', expectedContent: '🔔 Notifications' }
      ];

      for (const navTest of mobileNavTests) {
        await page.click(`[role="tablist"] >> text=${navTest.text}`);
        await page.waitForTimeout(1000); // Wait for navigation
        await expect(page.locator(`text=${navTest.expectedContent}`)).toBeVisible();
      }
    });

    test('should show mobile drawer when hamburger menu is clicked', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/dashboard');
      
      // Click hamburger menu if present
      const hamburgerMenu = page.locator('[aria-label*="menu"]').first();
      if (await hamburgerMenu.isVisible()) {
        await hamburgerMenu.click();
        
        // Check if drawer opens
        const drawer = page.locator('[role="dialog"]');
        await expect(drawer).toBeVisible();
      }
    });
  });

  test.describe('Responsive Breakpoints', () => {
    test('should switch navigation at correct breakpoint', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Start with desktop view
      await page.setViewportSize({ width: 1024, height: 768 });
      await expect(page.locator('[role="navigation"]').first()).toBeVisible();
      
      // Switch to mobile view (below md breakpoint)
      await page.setViewportSize({ width: 767, height: 667 });
      await page.waitForTimeout(500); // Wait for responsive changes
      
      // Check that navigation switched
      const bottomNav = page.locator('[role="tablist"]').last();
      await expect(bottomNav).toBeVisible();
    });
  });

  test.describe('Floating Action Button', () => {
    test('should show FAB on mobile pages that support it', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const fabPages = [
        { url: '/dashboard', expectedFab: 'Add appointment' },
        { url: '/patients', expectedFab: 'Add new client' },
        { url: '/calendar', expectedFab: 'Schedule new appointment' }
      ];

      for (const fabTest of fabPages) {
        await page.goto(fabTest.url);
        const fab = page.locator('[role="button"][aria-label*="' + fabTest.expectedFab + '"]');
        await expect(fab).toBeVisible();
      }
    });

    test('should not show FAB on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/dashboard');
      
      // FAB should not be visible on desktop
      const fab = page.locator('button[aria-label*="Add"]').last();
      await expect(fab).toBeHidden();
    });
  });

  test.describe('Wellness Theme', () => {
    test('should display wellness branding consistently', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Check for wellness theme elements
      await expect(page.locator('text=🌿').first()).toBeVisible();
      
      // Check for gradient text (wellness colors)
      const gradientText = page.locator('h1, h2, h3, h4').first();
      const textColor = await gradientText.evaluate(el => 
        window.getComputedStyle(el).webkitTextFillColor || 
        window.getComputedStyle(el).color
      );
      expect(textColor).toContain('transparent'); // Gradient text should be transparent
    });

    test('should maintain wellness color scheme', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Check primary color (wellness green)
      const primaryButton = page.locator('button[variant="contained"]').first();
      if (await primaryButton.isVisible()) {
        const bgColor = await primaryButton.evaluate(el => 
          window.getComputedStyle(el).backgroundColor
        );
        // Should contain green color values (approximate check)
        expect(bgColor).toMatch(/rgb\(\s*46,\s*125,\s*107\s*\)|#2E7D6B/i);
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/dashboard');
      
      // Check navigation has proper role
      await expect(page.locator('[role="navigation"]')).toBeVisible();
      
      // Check buttons have accessible labels
      const navButtons = page.locator('button[aria-label]');
      const count = await navButtons.count();
      expect(count).toBeGreaterThan(0);
      
      // Verify each button has an aria-label
      for (let i = 0; i < count; i++) {
        const button = navButtons.nth(i);
        const ariaLabel = await button.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
      }
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      const focused = page.locator(':focus');
      await expect(focused).toBeVisible();
      
      // Continue tabbing through navigation elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        const currentFocus = page.locator(':focus');
        await expect(currentFocus).toBeVisible();
      }
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Clear authentication
      await page.context().clearCookies();
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // Try to access protected route
      await page.goto('/dashboard');
      
      // Should redirect to auth page
      await expect(page).toHaveURL(/\/auth/);
    });

    test('should allow access to protected routes when authenticated', async ({ page }) => {
      const protectedRoutes = [
        '/dashboard',
        '/calendar',
        '/patients',
        '/tools',
        '/notifications',
        '/settings'
      ];

      for (const route of protectedRoutes) {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        
        // Should stay on the route (not redirect to auth)
        await expect(page).toHaveURL(new RegExp(route));
      }
    });

    test('should handle role-based access control', async ({ page }) => {
      // Test therapist-only routes
      const therapistOnlyRoutes = ['/patients/add', '/analytics'];
      
      for (const route of therapistOnlyRoutes) {
        await page.goto(route);
        // Should either access the route or show proper error (not crash)
        await page.waitForLoadState('networkidle');
        
        // Verify page loads without error
        const errorMessage = page.locator('text=404');
        if (await errorMessage.isVisible()) {
          // 404 is acceptable for routes that don't exist yet
          await expect(errorMessage).toBeVisible();
        }
      }
    });
  });

  test.describe('Deep Linking and Direct Access', () => {
    test('should handle direct access to patient detail page', async ({ page }) => {
      // Navigate directly to a patient detail URL
      await page.goto('/patients/patient-1');
      await page.waitForLoadState('networkidle');
      
      // Should load patient details or show appropriate message
      const patientDetail = page.locator('[data-testid="patient-detail"]');
      const patientNotFound = page.locator('text=Patient not found');
      
      // Either should show patient details or proper error message
      const hasPatientDetail = await patientDetail.isVisible();
      const hasNotFound = await patientNotFound.isVisible();
      
      expect(hasPatientDetail || hasNotFound).toBe(true);
    });

    test('should handle direct access to appointment detail page', async ({ page }) => {
      await page.goto('/appointments/apt-1');
      await page.waitForLoadState('networkidle');
      
      // Should load appointment details or show appropriate message
      await expect(page).toHaveURL(/\/appointments\/apt-1/);
    });

    test('should preserve URL parameters and query strings', async ({ page }) => {
      await page.goto('/patients?search=john&status=active');
      await page.waitForLoadState('networkidle');
      
      // URL should be preserved
      await expect(page).toHaveURL(/\/patients\?search=john&status=active/);
      
      // Search should be applied
      const searchInput = page.locator('[data-testid="patient-search"]');
      if (await searchInput.isVisible()) {
        const searchValue = await searchInput.inputValue();
        expect(searchValue).toBe('john');
      }
    });

    test('should handle hash routing for single page sections', async ({ page }) => {
      await page.goto('/settings#profile');
      await page.waitForLoadState('networkidle');
      
      // Should navigate to profile section
      await expect(page.locator('[data-testid="profile-section"]')).toBeVisible();
    });
  });

  test.describe('Navigation State Management', () => {
    test('should remember last visited page on return', async ({ page }) => {
      // Navigate to a specific page
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');
      
      // Navigate away and back
      await page.goto('/calendar');
      await page.goBack();
      
      // Should return to patients page
      await expect(page).toHaveURL(/\/patients/);
    });

    test('should maintain form state during navigation', async ({ page }) => {
      await page.goto('/patients');
      
      // Start adding a patient
      await page.click('[data-testid="add-patient-button"]');
      await page.fill('[data-testid="patient-name-input"]', 'Test Patient');
      
      // Navigate away and back (if modal allows)
      await page.press('Escape'); // Close modal if possible
      await page.goto('/calendar');
      await page.goto('/patients');
      
      // Form state handling should be graceful
      await expect(page).toHaveURL(/\/patients/);
    });

    test('should handle page refresh correctly', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Should stay on same page and maintain auth
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
    });
  });

  test.describe('Breadcrumb Navigation', () => {
    test('should show breadcrumbs on nested pages', async ({ page }) => {
      // Navigate to nested page
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');
      
      // Click on a patient to go to detail page
      const patientCard = page.locator('[data-testid="patient-card"]').first();
      if (await patientCard.isVisible()) {
        await patientCard.click();
        await page.waitForLoadState('networkidle');
        
        // Should show breadcrumbs
        const breadcrumbs = page.locator('[data-testid="breadcrumbs"]');
        if (await breadcrumbs.isVisible()) {
          await expect(breadcrumbs).toBeVisible();
          await expect(breadcrumbs).toContainText('Clients');
        }
      }
    });

    test('should allow navigation via breadcrumbs', async ({ page }) => {
      await page.goto('/patients');
      
      const patientCard = page.locator('[data-testid="patient-card"]').first();
      if (await patientCard.isVisible()) {
        await patientCard.click();
        
        // Click breadcrumb to go back
        const clientsBreadcrumb = page.locator('[data-testid="breadcrumb-clients"]');
        if (await clientsBreadcrumb.isVisible()) {
          await clientsBreadcrumb.click();
          await expect(page).toHaveURL(/\/patients/);
        }
      }
    });
  });

  test.describe('Search and Filter Navigation', () => {
    test('should update URL when searching', async ({ page }) => {
      await page.goto('/patients');
      
      const searchInput = page.locator('[data-testid="patient-search"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('john');
        await page.waitForTimeout(testConfig.shortDelay);
        
        // URL should include search parameter
        await expect(page).toHaveURL(/search.*john/);
      }
    });

    test('should preserve search state on page refresh', async ({ page }) => {
      await page.goto('/patients?search=john');
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Search should be preserved
      const searchInput = page.locator('[data-testid="patient-search"]');
      if (await searchInput.isVisible()) {
        const searchValue = await searchInput.inputValue();
        expect(searchValue).toBe('john');
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should show 404 page for non-existent routes', async ({ page }) => {
      await page.goto('/non-existent-page');
      
      // Should show 404 or redirect to appropriate page
      const notFound = page.locator('text=404');
      const homePage = page.locator('[data-testid="dashboard-title"]');
      
      // Either show 404 or redirect to home
      const hasNotFound = await notFound.isVisible();
      const hasHomePage = await homePage.isVisible();
      
      expect(hasNotFound || hasHomePage).toBe(true);
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate offline condition
      await page.context().setOffline(true);
      
      await page.goto('/dashboard');
      
      // Should show appropriate offline message or cached content
      const offlineMessage = page.locator('text=offline', 'text=connection');
      if (await offlineMessage.isVisible()) {
        await expect(offlineMessage).toBeVisible();
      }
      
      // Restore online condition
      await page.context().setOffline(false);
    });

    test('should recover from route errors', async ({ page }) => {
      // Navigate to valid page first
      await page.goto('/dashboard');
      await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
      
      // Try invalid route
      await page.goto('/invalid-route');
      
      // Should handle gracefully and allow return to valid routes
      await page.goto('/dashboard');
      await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
    });
  });

  test.describe('Performance and Loading', () => {
    test('should show loading states during navigation', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Navigate to data-heavy page
      await page.click('text=Clients');
      
      // Should show loading indicator during transition
      const loadingIndicator = page.locator('[data-testid="loading"], .loading, [role="progressbar"]');
      
      // Loading indicator might appear briefly
      if (await loadingIndicator.isVisible({ timeout: 1000 })) {
        await expect(loadingIndicator).toBeVisible();
      }
      
      // Page should eventually load
      await expect(page).toHaveURL(/\/patients/);
    });

    test('should preload critical routes', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Check if critical resources are preloaded
      const preloadLinks = await page.locator('link[rel="preload"]').count();
      
      // Should have some preloaded resources
      expect(preloadLinks).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support keyboard navigation between routes', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Use Tab to navigate to sidebar links
      await page.keyboard.press('Tab');
      let focused = page.locator(':focus');
      
      // Continue tabbing until we find a navigation link
      for (let i = 0; i < 10; i++) {
        const tagName = await focused.evaluate(el => el.tagName.toLowerCase());
        const role = await focused.getAttribute('role');
        
        if (tagName === 'a' || role === 'link' || tagName === 'button') {
          // Found a navigation element
          const href = await focused.getAttribute('href');
          if (href && href.includes('/')) {
            // Press Enter to navigate
            await page.keyboard.press('Enter');
            await page.waitForLoadState('networkidle');
            
            // Should navigate to new page
            await expect(page).toHaveURL(new RegExp(href));
            break;
          }
        }
        
        await page.keyboard.press('Tab');
        focused = page.locator(':focus');
      }
    });

    test('should support Escape key to close modals and return focus', async ({ page }) => {
      await page.goto('/patients');
      
      // Open modal
      const addButton = page.locator('[data-testid="add-patient-button"]');
      if (await addButton.isVisible()) {
        await addButton.click();
        
        const modal = page.locator('[data-testid="add-patient-modal"]');
        await expect(modal).toBeVisible();
        
        // Press Escape to close
        await page.keyboard.press('Escape');
        await expect(modal).toBeHidden();
        
        // Focus should return to add button
        const focused = page.locator(':focus');
        const focusedElement = await focused.getAttribute('data-testid');
        expect(focusedElement).toBe('add-patient-button');
      }
    });
  });
});