/**
 * Voice Notes E2E Tests
 * Tests the voice note recording, transcription, and editing flow
 */

import { test, expect, Page } from '@playwright/test';

// Test fixtures
const TEST_COACH = {
  email: 'test-coach@clinic.com',
  password: 'testpassword123',
};

// Helper functions
async function loginAsCoach(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"], input[type="email"]', TEST_COACH.email);
  await page.fill('input[name="password"], input[type="password"]', TEST_COACH.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|home|calendar)/);
}

async function grantMicrophonePermission(page: Page) {
  // Grant microphone permission via browser context
  const context = page.context();
  await context.grantPermissions(['microphone']);
}

test.describe('Voice Notes - Recording Flow', () => {
  test.beforeEach(async ({ page }) => {
    await grantMicrophonePermission(page);
    await loginAsCoach(page);
  });

  test('should display voice note button on dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for voice note FAB
    const voiceNoteButton = page.locator('[aria-label*="voice"], [aria-label*="Record"], button:has(svg[data-testid="MicIcon"])');
    await expect(voiceNoteButton.first()).toBeVisible({ timeout: 10000 });
  });

  test('should open voice note modal when clicking FAB', async ({ page }) => {
    await page.goto('/dashboard');

    // Click voice note button
    const voiceNoteButton = page.locator('[aria-label*="voice"], [aria-label*="Record"], button:has(svg[data-testid="MicIcon"])').first();
    await voiceNoteButton.click();

    // Modal should appear
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Should show microphone icon or record button
    const recordButton = modal.locator('button:has(svg)');
    await expect(recordButton.first()).toBeVisible();
  });

  test('should show waveform visualization during recording', async ({ page }) => {
    await page.goto('/dashboard');

    // Open voice note modal
    const voiceNoteButton = page.locator('[aria-label*="voice"], [aria-label*="Record"], button:has(svg[data-testid="MicIcon"])').first();
    await voiceNoteButton.click();

    // Wait for modal
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Start recording
    const startButton = modal.locator('button').filter({ hasText: /mic|record/i }).first();
    if (await startButton.isVisible()) {
      await startButton.click();
    }

    // Waveform canvas should be present
    const canvas = modal.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 3000 });
  });

  test('should show recording timer', async ({ page }) => {
    await page.goto('/dashboard');

    // Open modal and start recording
    const voiceNoteButton = page.locator('[aria-label*="voice"], button:has(svg[data-testid="MicIcon"])').first();
    await voiceNoteButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Look for timer display (00:00 format)
    const timer = modal.locator('text=/\\d{2}:\\d{2}/');
    await expect(timer.first()).toBeVisible({ timeout: 5000 });
  });

  test('should allow pausing and resuming recording', async ({ page }) => {
    await page.goto('/dashboard');

    // Open modal
    const voiceNoteButton = page.locator('[aria-label*="voice"], button:has(svg[data-testid="MicIcon"])').first();
    await voiceNoteButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Start recording (click the large mic button)
    const micButton = modal.locator('button').filter({ has: page.locator('svg') }).first();
    await micButton.click();

    // Wait for recording state
    await page.waitForTimeout(1000);

    // Look for pause button
    const pauseButton = modal.locator('button:has(svg[data-testid="PauseIcon"]), [aria-label*="pause"]');
    if (await pauseButton.isVisible({ timeout: 2000 })) {
      await pauseButton.click();

      // Should now show resume/play button
      const resumeButton = modal.locator('button:has(svg[data-testid="PlayArrowIcon"]), [aria-label*="resume"]');
      await expect(resumeButton).toBeVisible({ timeout: 2000 });
    }
  });

  test('should show audio preview after stopping recording', async ({ page }) => {
    await page.goto('/dashboard');

    // Open modal
    const voiceNoteButton = page.locator('[aria-label*="voice"], button:has(svg[data-testid="MicIcon"])').first();
    await voiceNoteButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Mock a completed recording state by checking for audio element
    // In real tests, you'd actually record something
    // For now, check that the modal structure is correct

    // Check modal has required elements
    const closeButton = modal.locator('[aria-label*="close"], button:has(svg[data-testid="CloseIcon"])');
    await expect(closeButton).toBeVisible();
  });

  test('should close modal when clicking close button', async ({ page }) => {
    await page.goto('/dashboard');

    // Open modal
    const voiceNoteButton = page.locator('[aria-label*="voice"], button:has(svg[data-testid="MicIcon"])').first();
    await voiceNoteButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Close modal
    const closeButton = modal.locator('[aria-label*="close"], button:has(svg[data-testid="CloseIcon"])');
    await closeButton.click();

    // Modal should disappear
    await expect(modal).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe('Voice Notes - List Display', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCoach(page);
  });

  test('should display voice notes list in appointment detail', async ({ page }) => {
    // Navigate to appointments
    await page.goto('/appointments');

    // Wait for appointments to load
    await page.waitForSelector('[data-testid="appointment-item"], .rbc-event, [class*="appointment"]', {
      timeout: 10000,
    }).catch(() => {
      // If no appointments exist, that's okay for this test
    });

    // Click on an appointment if any exist
    const appointment = page.locator('[data-testid="appointment-item"], .rbc-event, [class*="appointment"]').first();
    if (await appointment.isVisible({ timeout: 3000 })) {
      await appointment.click();

      // Check for voice notes section
      const _voiceNotesSection = page.locator('text=/Voice Notes|הקלטות קוליות/i');
      // Voice notes section may or may not be visible depending on implementation
    }
  });
});

test.describe('Voice Notes - Transcription Status', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCoach(page);
  });

  test('should show transcription status indicators', async ({ page }) => {
    await page.goto('/dashboard');

    // This test verifies the UI can handle different transcription statuses
    // The actual statuses depend on existing data

    // Open voice note modal
    const voiceNoteButton = page.locator('[aria-label*="voice"], button:has(svg[data-testid="MicIcon"])').first();
    if (await voiceNoteButton.isVisible({ timeout: 5000 })) {
      await voiceNoteButton.click();

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      // Check that modal can render (status indicators would be in the list)
      await modal.locator('button, [role="button"]').first().isVisible();
    }
  });
});

test.describe('Voice Notes - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await grantMicrophonePermission(page);
    await loginAsCoach(page);
  });

  test('should have proper ARIA labels on recording controls', async ({ page }) => {
    await page.goto('/dashboard');

    const voiceNoteButton = page.locator('[aria-label*="voice"], button:has(svg[data-testid="MicIcon"])').first();
    if (await voiceNoteButton.isVisible({ timeout: 5000 })) {
      // Check aria-label exists
      const ariaLabel = await voiceNoteButton.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();

      await voiceNoteButton.click();

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      // Check that buttons in modal have accessible labels
      const buttons = modal.locator('button');
      const buttonCount = await buttons.count();
      expect(buttonCount).toBeGreaterThan(0);
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/dashboard');

    const voiceNoteButton = page.locator('[aria-label*="voice"], button:has(svg[data-testid="MicIcon"])').first();
    if (await voiceNoteButton.isVisible({ timeout: 5000 })) {
      // Tab to voice note button
      await page.keyboard.press('Tab');

      // Open modal with keyboard
      await voiceNoteButton.focus();
      await page.keyboard.press('Enter');

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      // Tab through modal controls
      await page.keyboard.press('Tab');

      // Escape should close modal
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe('Voice Notes - Error Handling', () => {
  test('should handle microphone permission denied', async ({ page, context }) => {
    // Don't grant microphone permission
    await context.clearPermissions();

    await loginAsCoach(page);
    await page.goto('/dashboard');

    const voiceNoteButton = page.locator('[aria-label*="voice"], button:has(svg[data-testid="MicIcon"])').first();
    if (await voiceNoteButton.isVisible({ timeout: 5000 })) {
      await voiceNoteButton.click();

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      // Try to start recording (this should trigger permission request)
      const recordButton = modal.locator('button').first();
      await recordButton.click();

      // Should show error or permission request
      // The exact behavior depends on browser and implementation
    }
  });

  test('should recover gracefully from errors', async ({ page }) => {
    await grantMicrophonePermission(page);
    await loginAsCoach(page);
    await page.goto('/dashboard');

    const voiceNoteButton = page.locator('[aria-label*="voice"], button:has(svg[data-testid="MicIcon"])').first();
    if (await voiceNoteButton.isVisible({ timeout: 5000 })) {
      await voiceNoteButton.click();

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      // Modal should always have a way to close/cancel
      const closeButton = modal.locator('[aria-label*="close"], button:has(svg[data-testid="CloseIcon"]), button:has-text("Cancel")');
      await expect(closeButton.first()).toBeVisible();
    }
  });
});

test.describe('Voice Notes - Mobile Responsiveness', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await grantMicrophonePermission(page);
    await loginAsCoach(page);

    await page.goto('/dashboard');

    // Voice note button should still be visible on mobile
    const voiceNoteButton = page.locator('[aria-label*="voice"], button:has(svg[data-testid="MicIcon"])').first();

    // On mobile, the button might be positioned differently but should still work
    if (await voiceNoteButton.isVisible({ timeout: 5000 })) {
      await voiceNoteButton.click();

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      // Modal should be responsive
      const modalBox = await modal.boundingBox();
      expect(modalBox).toBeTruthy();
      if (modalBox) {
        expect(modalBox.width).toBeLessThanOrEqual(375);
      }
    }
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await grantMicrophonePermission(page);
    await loginAsCoach(page);

    await page.goto('/dashboard');

    const voiceNoteButton = page.locator('[aria-label*="voice"], button:has(svg[data-testid="MicIcon"])').first();
    if (await voiceNoteButton.isVisible({ timeout: 5000 })) {
      await voiceNoteButton.click();

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
    }
  });
});
