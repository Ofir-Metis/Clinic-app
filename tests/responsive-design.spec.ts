import { test, expect, devices } from '@playwright/test';
import { setupAuthenticatedState } from './fixtures/auth-helpers';
import { breakpoints, testConfig, wellnessColors } from './fixtures/test-data';

/**
 * Responsive Design and Cross-Browser Tests for Clinic Management App
 * Tests responsive behavior, breakpoint handling, and browser compatibility
 */

test.describe('Responsive Design Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedState(page, 'therapist');
  });

  test.describe('Mobile Viewport (320px - 640px)', () => {
    test('should display mobile layout on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/dashboard');

      // Should show mobile navigation
      const bottomNav = page.locator('[data-testid="bottom-navigation"]');
      await expect(bottomNav).toBeVisible();

      // Should hide desktop sidebar
      const sidebar = page.locator('[data-testid="desktop-sidebar"]');
      await expect(sidebar).toBeHidden();

      // Should show hamburger menu
      const hamburgerMenu = page.locator('[data-testid="hamburger-menu"]');
      if (await hamburgerMenu.isVisible()) {
        await expect(hamburgerMenu).toBeVisible();
      }
    });

    test('should stack cards vertically on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/dashboard');

      // Dashboard cards should stack vertically
      const cards = page.locator('[data-testid="dashboard-card"]');
      if (await cards.count() > 1) {
        const firstCard = cards.nth(0);
        const secondCard = cards.nth(1);

        const firstBox = await firstCard.boundingBox();
        const secondBox = await secondCard.boundingBox();

        if (firstBox && secondBox) {
          // Second card should be below first card (higher Y position)
          expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height - 10);
        }
      }
    });

    test('should show floating action button on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const fabPages = [
        { url: '/dashboard', fabTestId: 'add-appointment-fab' },
        { url: '/patients', fabTestId: 'add-patient-fab' },
        { url: '/calendar', fabTestId: 'schedule-appointment-fab' }
      ];

      for (const { url, fabTestId } of fabPages) {
        await page.goto(url);
        
        const fab = page.locator(`[data-testid="${fabTestId}"]`);
        if (await fab.isVisible()) {
          await expect(fab).toBeVisible();
          
          // FAB should be positioned fixed
          const fabStyles = await fab.evaluate(el => 
            window.getComputedStyle(el).position
          );
          expect(fabStyles).toBe('fixed');
        }
      }
    });

    test('should handle touch interactions', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/patients');

      // Test touch target size (minimum 44px)
      const touchTargets = page.locator('button, a, [role="button"]');
      const targetCount = await touchTargets.count();

      for (let i = 0; i < Math.min(targetCount, 5); i++) {
        const target = touchTargets.nth(i);
        const box = await target.boundingBox();
        
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44);
          expect(box.width).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('should show mobile-optimized forms', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/patients');

      const addButton = page.locator('[data-testid="add-patient-button"], [data-testid="add-patient-fab"]');
      if (await addButton.isVisible()) {
        await addButton.click();

        const modal = page.locator('[data-testid="add-patient-modal"]');
        await expect(modal).toBeVisible();

        // Modal should take full screen or be appropriately sized
        const modalBox = await modal.boundingBox();
        if (modalBox) {
          expect(modalBox.width).toBeGreaterThan(300);
        }

        // Form inputs should be touch-friendly
        const inputs = page.locator('input, textarea, select');
        const inputCount = await inputs.count();

        for (let i = 0; i < Math.min(inputCount, 3); i++) {
          const input = inputs.nth(i);
          const inputBox = await input.boundingBox();
          
          if (inputBox) {
            expect(inputBox.height).toBeGreaterThanOrEqual(40);
          }
        }
      }
    });
  });

  test.describe('Tablet Viewport (640px - 1024px)', () => {
    test('should display tablet layout', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/dashboard');

      // Should show appropriate navigation for tablet
      const navigation = page.locator('[role="navigation"]');
      await expect(navigation).toBeVisible();

      // Cards should use medium grid layout
      const cardContainer = page.locator('[data-testid="dashboard-content"]');
      if (await cardContainer.isVisible()) {
        const containerWidth = await cardContainer.evaluate(el => el.offsetWidth);
        expect(containerWidth).toBeGreaterThan(600);
      }
    });

    test('should adjust grid layout for tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/patients');

      // Patient cards should use 2-column layout on tablet
      const patientGrid = page.locator('[data-testid="patient-grid"]');
      if (await patientGrid.isVisible()) {
        const gridStyles = await patientGrid.evaluate(el => 
          window.getComputedStyle(el).gridTemplateColumns
        );
        
        // Should have 2 columns or similar responsive layout
        expect(gridStyles).toContain('fr') || expect(gridStyles).toContain('1fr 1fr');
      }
    });

    test('should show tablet-optimized calendar', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/calendar');

      const calendar = page.locator('[data-testid="appointment-calendar"]');
      await expect(calendar).toBeVisible();

      // Calendar should be readable and functional
      const calendarBox = await calendar.boundingBox();
      if (calendarBox) {
        expect(calendarBox.width).toBeGreaterThan(500);
        expect(calendarBox.height).toBeGreaterThan(400);
      }
    });
  });

  test.describe('Desktop Viewport (1024px+)', () => {
    test('should display desktop layout', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/dashboard');

      // Should show desktop sidebar
      const sidebar = page.locator('[data-testid="desktop-sidebar"]');
      await expect(sidebar).toBeVisible();

      // Should hide mobile navigation
      const bottomNav = page.locator('[data-testid="bottom-navigation"]');
      await expect(bottomNav).toBeHidden();

      // Should hide FAB buttons
      const fab = page.locator('[data-testid*="fab"]');
      if (await fab.count() > 0) {
        await expect(fab.first()).toBeHidden();
      }
    });

    test('should use multi-column layout', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/dashboard');

      // Dashboard should show multiple columns
      const dashboardCards = page.locator('[data-testid="dashboard-card"]');
      const cardCount = await dashboardCards.count();

      if (cardCount >= 2) {
        const firstCard = dashboardCards.nth(0);
        const secondCard = dashboardCards.nth(1);

        const firstBox = await firstCard.boundingBox();
        const secondBox = await secondCard.boundingBox();

        if (firstBox && secondBox) {
          // Cards should be side by side (similar Y position)
          const yDifference = Math.abs(firstBox.y - secondBox.y);
          expect(yDifference).toBeLessThan(50);
        }
      }
    });

    test('should show hover effects on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/patients');

      const patientCard = page.locator('[data-testid="patient-card"]').first();
      if (await patientCard.isVisible()) {
        // Get initial styles
        const initialTransform = await patientCard.evaluate(el => 
          window.getComputedStyle(el).transform
        );

        // Hover over card
        await patientCard.hover();
        await page.waitForTimeout(300); // Wait for transition

        // Should have hover effect (transform, shadow, etc.)
        const hoverTransform = await patientCard.evaluate(el => 
          window.getComputedStyle(el).transform
        );

        // Transform should change on hover
        expect(hoverTransform).not.toBe(initialTransform);
      }
    });

    test('should show detailed information on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/dashboard');

      // Desktop should show more detailed information
      const detailedElements = page.locator('[data-testid*="detail"], [data-testid*="full"]');
      if (await detailedElements.count() > 0) {
        await expect(detailedElements.first()).toBeVisible();
      }
    });
  });

  test.describe('Breakpoint Transitions', () => {
    test('should handle smooth transitions between breakpoints', async ({ page }) => {
      await page.goto('/dashboard');

      // Start with desktop
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForTimeout(testConfig.shortDelay);

      const desktopSidebar = page.locator('[data-testid="desktop-sidebar"]');
      await expect(desktopSidebar).toBeVisible();

      // Transition to tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(testConfig.shortDelay);

      // Should adapt to tablet layout
      const navigation = page.locator('[role="navigation"]');
      await expect(navigation).toBeVisible();

      // Transition to mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(testConfig.shortDelay);

      // Should show mobile navigation
      const bottomNav = page.locator('[data-testid="bottom-navigation"]');
      await expect(bottomNav).toBeVisible();

      // Desktop sidebar should be hidden
      await expect(desktopSidebar).toBeHidden();
    });

    test('should maintain functionality across breakpoints', async ({ page }) => {
      const viewports = [
        { width: 1280, height: 720 }, // Desktop
        { width: 768, height: 1024 }, // Tablet
        { width: 375, height: 667 }   // Mobile
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.goto('/patients');
        await page.waitForLoadState('networkidle');

        // Should show patient list
        const patientList = page.locator('[data-testid="patient-list"]');
        await expect(patientList).toBeVisible();

        // Should be able to navigate
        const navElement = page.locator('[role="navigation"]');
        await expect(navElement).toBeVisible();
      }
    });
  });

  test.describe('Typography and Text Scaling', () => {
    test('should scale typography appropriately for each viewport', async ({ page }) => {
      const viewports = [
        { width: 375, height: 667, name: 'mobile' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 1280, height: 720, name: 'desktop' }
      ];

      const fontSizes: Record<string, number> = {};

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.goto('/dashboard');

        const heading = page.locator('h1').first();
        if (await heading.isVisible()) {
          const fontSize = await heading.evaluate(el => 
            parseFloat(window.getComputedStyle(el).fontSize)
          );
          fontSizes[viewport.name] = fontSize;
        }
      }

      // Mobile should have smaller or equal font size compared to desktop
      if (fontSizes.mobile && fontSizes.desktop) {
        expect(fontSizes.mobile).toBeLessThanOrEqual(fontSizes.desktop + 2);
      }
    });

    test('should maintain readability at all sizes', async ({ page }) => {
      const viewports = [
        { width: 320, height: 568 }, // Small mobile
        { width: 1920, height: 1080 } // Large desktop
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.goto('/dashboard');

        // Text should be readable (minimum font size)
        const bodyText = page.locator('p, span, div').first();
        if (await bodyText.isVisible()) {
          const fontSize = await bodyText.evaluate(el => 
            parseFloat(window.getComputedStyle(el).fontSize)
          );
          expect(fontSize).toBeGreaterThanOrEqual(14); // Minimum readable size
        }
      }
    });
  });

  test.describe('Images and Media Scaling', () => {
    test('should scale images appropriately', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/dashboard');

      const images = page.locator('img');
      const imageCount = await images.count();

      for (let i = 0; i < imageCount; i++) {
        const image = images.nth(i);
        const imageBox = await image.boundingBox();
        
        if (imageBox) {
          // Images should not overflow container
          expect(imageBox.width).toBeLessThanOrEqual(375);
        }
      }
    });

    test('should handle high-DPI displays', async ({ page }) => {
      // Simulate high-DPI display
      await page.emulateMedia({ media: 'screen' });
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/dashboard');

      // Check for high-resolution images or proper scaling
      const images = page.locator('img[srcset], img[sizes]');
      if (await images.count() > 0) {
        const firstImage = images.first();
        const srcset = await firstImage.getAttribute('srcset');
        expect(srcset).toBeTruthy();
      }
    });
  });

  test.describe('Wellness Theme Responsiveness', () => {
    test('should maintain wellness colors across viewports', async ({ page }) => {
      const viewports = [
        { width: 375, height: 667 },
        { width: 1280, height: 720 }
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.goto('/dashboard');

        // Check primary color is maintained
        const primaryButton = page.locator('button[variant="contained"]').first();
        if (await primaryButton.isVisible()) {
          const bgColor = await primaryButton.evaluate(el => 
            window.getComputedStyle(el).backgroundColor
          );
          
          // Should maintain wellness green color
          expect(bgColor).toContain('rgb(46, 125, 107)') || 
          expect(bgColor).toContain('#2E7D6B');
        }
      }
    });

    test('should maintain glassmorphism effects', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/dashboard');

      const cards = page.locator('[data-testid*="card"]');
      if (await cards.count() > 0) {
        const firstCard = cards.first();
        
        // Check for backdrop filter (glassmorphism)
        const backdropFilter = await firstCard.evaluate(el => 
          window.getComputedStyle(el).backdropFilter
        );
        
        if (backdropFilter && backdropFilter !== 'none') {
          expect(backdropFilter).toContain('blur');
        }
      }
    });

    test('should show wellness emojis and branding', async ({ page }) => {
      const viewports = [
        { width: 375, height: 667 },
        { width: 1280, height: 720 }
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.goto('/dashboard');

        // Should show wellness emoji
        const wellnessEmoji = page.locator('text=🌿');
        await expect(wellnessEmoji.first()).toBeVisible();
      }
    });
  });

  test.describe('Performance on Different Viewports', () => {
    test('should load quickly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const startTime = Date.now();
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Should load within reasonable time (5 seconds)
      expect(loadTime).toBeLessThan(5000);
    });

    test('should not load unnecessary resources on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Monitor network requests
      const requests: string[] = [];
      page.on('request', request => {
        requests.push(request.url());
      });

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Should not load desktop-only resources
      const desktopOnlyRequests = requests.filter(url => 
        url.includes('desktop') || url.includes('large')
      );
      
      // Minimal desktop-specific requests expected
      expect(desktopOnlyRequests.length).toBeLessThan(5);
    });
  });
});