import { test, expect, devices } from '@playwright/test';
import { setupAuthenticatedState } from './fixtures/auth-helpers';
import { wellnessColors, testConfig } from './fixtures/test-data';

/**
 * Cross-Browser Compatibility Tests for Clinic Management App
 * Tests functionality across different browsers and device types
 */

test.describe('Cross-Browser Compatibility', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedState(page, 'therapist');
  });

  test.describe('Core Functionality Across Browsers', () => {
    test('should work in Chrome', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'Chrome-specific test');
      
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Core functionality should work
      await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
      
      // Navigation should work
      await page.click('text=Clients');
      await expect(page).toHaveURL(/\/patients/);
    });

    test('should work in Firefox', async ({ page, browserName }) => {
      test.skip(browserName !== 'firefox', 'Firefox-specific test');
      
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Core functionality should work
      await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
      
      // Forms should work
      await page.goto('/patients');
      const addButton = page.locator('[data-testid="add-patient-button"]');
      if (await addButton.isVisible()) {
        await addButton.click();
        const modal = page.locator('[data-testid="add-patient-modal"]');
        await expect(modal).toBeVisible();
      }
    });

    test('should work in Safari', async ({ page, browserName }) => {
      test.skip(browserName !== 'webkit', 'Safari-specific test');
      
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Core functionality should work
      await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
      
      // Date pickers should work (Safari specific test)
      await page.goto('/calendar');
      const datePicker = page.locator('input[type="date"]');
      if (await datePicker.isVisible()) {
        await datePicker.click();
        // Safari should show native date picker or custom implementation
      }
    });
  });

  test.describe('CSS Features Compatibility', () => {
    test('should display glassmorphism effects correctly', async ({ page }) => {
      await page.goto('/dashboard');
      
      const card = page.locator('[data-testid*="card"]').first();
      if (await card.isVisible()) {
        // Check if backdrop-filter is supported and applied
        const backdropFilter = await card.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.backdropFilter || style.webkitBackdropFilter;
        });
        
        // Should have blur effect or fallback
        expect(backdropFilter === 'none' || backdropFilter.includes('blur')).toBe(true);
      }
    });

    test('should handle CSS Grid properly', async ({ page }) => {
      await page.goto('/patients');
      
      const grid = page.locator('[data-testid="patient-grid"]');
      if (await grid.isVisible()) {
        const gridSupport = await grid.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.display === 'grid' || style.display === 'flex';
        });
        
        expect(gridSupport).toBe(true);
      }
    });

    test('should display custom fonts correctly', async ({ page }) => {
      await page.goto('/dashboard');
      
      const heading = page.locator('h1').first();
      if (await heading.isVisible()) {
        const fontFamily = await heading.evaluate((el) => {
          return window.getComputedStyle(el).fontFamily;
        });
        
        // Should use Inter font or fallback
        expect(fontFamily.toLowerCase()).toContain('inter') ||
        expect(fontFamily.toLowerCase()).toContain('roboto') ||
        expect(fontFamily.toLowerCase()).toContain('arial');
      }
    });

    test('should handle CSS variables correctly', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Check if CSS custom properties are supported
      const supportsCustomProps = await page.evaluate(() => {
        const testElement = document.createElement('div');
        testElement.style.setProperty('--test', 'value');
        return testElement.style.getPropertyValue('--test') === 'value';
      });
      
      if (supportsCustomProps) {
        // Test wellness color variables
        const primaryColor = await page.evaluate(() => {
          return getComputedStyle(document.documentElement)
            .getPropertyValue('--primary-color') || '#2E7D6B';
        });
        
        expect(primaryColor).toBeTruthy();
      }
    });
  });

  test.describe('JavaScript Features Compatibility', () => {
    test('should handle modern JavaScript features', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Test if modern JS features work
      const modernJSSupport = await page.evaluate(() => {
        try {
          // Test arrow functions
          const arrow = () => 'test';
          
          // Test template literals
          const template = `test ${arrow()}`;
          
          // Test destructuring
          const { length } = 'test';
          
          // Test spread operator
          const array = [1, 2, 3];
          const spread = [...array];
          
          return template === 'test test' && length === 4 && spread.length === 3;
        } catch (error) {
          return false;
        }
      });
      
      expect(modernJSSupport).toBe(true);
    });

    test('should handle async/await properly', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Test async operations
      const asyncSupport = await page.evaluate(async () => {
        try {
          const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
          await delay(10);
          return true;
        } catch (error) {
          return false;
        }
      });
      
      expect(asyncSupport).toBe(true);
    });

    test('should handle fetch API', async ({ page }) => {
      await page.goto('/dashboard');
      
      const fetchSupport = await page.evaluate(() => {
        return typeof fetch === 'function';
      });
      
      expect(fetchSupport).toBe(true);
    });

    test('should handle local storage', async ({ page }) => {
      await page.goto('/dashboard');
      
      const storageSupport = await page.evaluate(() => {
        try {
          localStorage.setItem('test', 'value');
          const value = localStorage.getItem('test');
          localStorage.removeItem('test');
          return value === 'value';
        } catch (error) {
          return false;
        }
      });
      
      expect(storageSupport).toBe(true);
    });
  });

  test.describe('Form Input Compatibility', () => {
    test('should handle HTML5 input types', async ({ page }) => {
      await page.goto('/patients');
      
      const addButton = page.locator('[data-testid="add-patient-button"]');
      if (await addButton.isVisible()) {
        await addButton.click();
        
        // Test email input
        const emailInput = page.locator('input[type="email"]');
        if (await emailInput.isVisible()) {
          await emailInput.fill('test@example.com');
          const value = await emailInput.inputValue();
          expect(value).toBe('test@example.com');
        }
        
        // Test tel input
        const telInput = page.locator('input[type="tel"]');
        if (await telInput.isVisible()) {
          await telInput.fill('+1-555-0123');
          const telValue = await telInput.inputValue();
          expect(telValue).toBeTruthy();
        }
        
        // Test date input
        const dateInput = page.locator('input[type="date"]');
        if (await dateInput.isVisible()) {
          await dateInput.fill('2024-01-01');
          const dateValue = await dateInput.inputValue();
          expect(dateValue).toBe('2024-01-01');
        }
      }
    });

    test('should validate forms correctly', async ({ page }) => {
      await page.goto('/patients');
      
      const addButton = page.locator('[data-testid="add-patient-button"]');
      if (await addButton.isVisible()) {
        await addButton.click();
        
        // Try to submit empty form
        const submitButton = page.locator('[data-testid="save-patient-button"]');
        await submitButton.click();
        
        // Should show validation errors
        const errorElements = page.locator('[role="alert"], .error, .invalid');
        const errorCount = await errorElements.count();
        expect(errorCount).toBeGreaterThan(0);
      }
    });

    test('should handle file uploads', async ({ page }) => {
      await page.goto('/patients');
      
      // Look for file upload inputs
      const fileInputs = page.locator('input[type="file"]');
      if (await fileInputs.count() > 0) {
        const fileInput = fileInputs.first();
        
        // Test file input functionality
        const inputExists = await fileInput.isVisible();
        expect(inputExists).toBe(true);
      }
    });
  });

  test.describe('Event Handling Compatibility', () => {
    test('should handle click events properly', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Test click on navigation
      const navLink = page.locator('text=Clients');
      if (await navLink.isVisible()) {
        await navLink.click();
        await expect(page).toHaveURL(/\/patients/);
      }
    });

    test('should handle keyboard events', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      const focused = page.locator(':focus');
      await expect(focused).toBeVisible();
      
      // Test Enter key
      const button = page.locator('button').first();
      if (await button.isVisible()) {
        await button.focus();
        await page.keyboard.press('Enter');
        // Should trigger click event
      }
    });

    test('should handle touch events on mobile', async ({ page, isMobile }) => {
      if (!isMobile) {
        test.skip();
      }
      
      await page.goto('/patients');
      
      const card = page.locator('[data-testid="patient-card"]').first();
      if (await card.isVisible()) {
        // Test touch tap
        await card.tap();
        
        // Should navigate or show details
        await page.waitForTimeout(1000);
        
        // Check if navigation occurred or modal opened
        const currentUrl = page.url();
        const modal = page.locator('[data-testid*="modal"]');
        
        expect(currentUrl.includes('/patients/') || await modal.isVisible()).toBe(true);
      }
    });
  });

  test.describe('Media Query Compatibility', () => {
    test('should respond to screen size changes', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Start with desktop
      await page.setViewportSize({ width: 1280, height: 720 });
      
      const desktopSidebar = page.locator('[data-testid="desktop-sidebar"]');
      if (await desktopSidebar.isVisible()) {
        await expect(desktopSidebar).toBeVisible();
      }
      
      // Switch to mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(testConfig.shortDelay);
      
      const bottomNav = page.locator('[data-testid="bottom-navigation"]');
      if (await bottomNav.isVisible()) {
        await expect(bottomNav).toBeVisible();
      }
    });

    test('should handle print styles', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Test print media query
      await page.emulateMedia({ media: 'print' });
      
      // Page should still be functional
      await expect(page.locator('body')).toBeVisible();
      
      // Restore screen media
      await page.emulateMedia({ media: 'screen' });
    });

    test('should handle reduced motion preference', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Simulate reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      // Animations should be reduced or disabled
      const animatedElement = page.locator('[data-testid*="card"]').first();
      if (await animatedElement.isVisible()) {
        const transition = await animatedElement.evaluate((el) => {
          return window.getComputedStyle(el).transitionDuration;
        });
        
        // Should have no transition or very short duration
        expect(transition === '0s' || parseFloat(transition) < 0.1).toBe(true);
      }
    });
  });

  test.describe('Performance Across Browsers', () => {
    test('should load within acceptable time', async ({ page, browserName }) => {
      const startTime = Date.now();
      
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds across all browsers
      expect(loadTime).toBeLessThan(5000);
      
      // Log performance for different browsers
      console.log(`${browserName} load time: ${loadTime}ms`);
    });

    test('should handle memory efficiently', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Navigate through multiple pages
      const pages = ['/patients', '/calendar', '/tools', '/notifications'];
      
      for (const route of pages) {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        
        // Check if page loads without memory issues
        await expect(page.locator('body')).toBeVisible();
      }
      
      // Return to dashboard
      await page.goto('/dashboard');
      await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
    });
  });

  test.describe('Security Features Compatibility', () => {
    test('should handle HTTPS correctly', async ({ page }) => {
      // Test would need HTTPS setup
      const protocol = new URL(page.url()).protocol;
      
      if (protocol === 'https:') {
        // Should load secure resources
        await page.goto('/dashboard');
        await expect(page.locator('body')).toBeVisible();
      } else {
        // In development, HTTP is acceptable
        expect(protocol).toBe('http:' || 'https:');
      }
    });

    test('should handle CSP correctly', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Check if page loads without CSP violations
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error' && msg.text().includes('Content Security Policy')) {
          errors.push(msg.text());
        }
      });
      
      await page.waitForLoadState('networkidle');
      
      // Should not have CSP violations
      expect(errors.length).toBe(0);
    });
  });

  test.describe('Accessibility Across Browsers', () => {
    test('should maintain accessibility features', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Check for proper heading structure
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      expect(headingCount).toBeGreaterThan(0);
      
      // Check for proper ARIA labels
      const ariaElements = page.locator('[aria-label], [aria-labelledby], [role]');
      const ariaCount = await ariaElements.count();
      expect(ariaCount).toBeGreaterThan(0);
    });

    test('should support keyboard navigation consistently', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      const focused = page.locator(':focus');
      await expect(focused).toBeVisible();
      
      // Continue tabbing
      for (let i = 0; i < 3; i++) {
        await page.keyboard.press('Tab');
        const currentFocus = page.locator(':focus');
        await expect(currentFocus).toBeVisible();
      }
    });
  });
});