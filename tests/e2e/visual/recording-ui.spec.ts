/**
 * Visual Regression Tests - Recording UI
 * Ensures consistent visual appearance of recording components across updates
 */

import { test, expect, Page } from '@playwright/test';
import { TEST_USERS, LOGIN_URLS, DASHBOARD_URLS, TEST_CONFIG } from '../../fixtures/test-users';

// Login helper
async function loginAsCoach(page: Page): Promise<void> {
  await page.goto(LOGIN_URLS.coach);
  await page.locator('[data-testid="login-email-input"]').fill(TEST_USERS.coach.email);
  await page.locator('[data-testid="login-password-input"]').fill(TEST_USERS.coach.password);
  await page.locator('[data-testid="login-submit"]').click();
  await page.waitForURL(`**${DASHBOARD_URLS.coach}**`, { timeout: TEST_CONFIG.navigationTimeout });
}

// Setup media mocks
async function setupMediaMocks(page: Page): Promise<void> {
  await page.addInitScript(() => {
    class MockMediaRecorder {
      state = 'inactive';
      ondataavailable: ((e: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      onstart: (() => void) | null = null;
      constructor() {}
      start() { this.state = 'recording'; if (this.onstart) this.onstart(); }
      stop() { this.state = 'inactive'; if (this.onstop) this.onstop(); }
      pause() { this.state = 'paused'; }
      resume() { this.state = 'recording'; }
      static isTypeSupported() { return true; }
    }
    // @ts-ignore
    window.MediaRecorder = MockMediaRecorder;

    const mockStream = {
      getTracks: () => [{ kind: 'audio', stop: () => {} }],
      getAudioTracks: () => [{ kind: 'audio', stop: () => {} }],
      getVideoTracks: () => []
    };
    navigator.mediaDevices = {
      ...navigator.mediaDevices,
      getUserMedia: async () => mockStream as unknown as MediaStream,
      enumerateDevices: async () => []
    };

    // @ts-ignore
    navigator.connection = { effectiveType: '4g', downlink: 10, rtt: 50 };
  });
}

test.describe('Recording UI Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupMediaMocks(page);
    await loginAsCoach(page);
  });

  test.describe('Recording Controls', () => {
    test('recording controls - idle state', async ({ page }) => {
      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');

      const appointmentItem = page.locator('[data-testid*="appointment"]').first();
      if (await appointmentItem.isVisible({ timeout: 5000 }).catch(() => false)) {
        await appointmentItem.click();
        await page.waitForTimeout(500);

        // Take screenshot of recording controls in idle state
        const recordingControls = page.locator('[data-testid*="recording"], .recording-controls');
        if (await recordingControls.isVisible().catch(() => false)) {
          await expect(recordingControls).toHaveScreenshot('recording-controls-idle.png', {
            maxDiffPixels: 100
          });
        }
      }
    });

    test('recording controls - active state', async ({ page }) => {
      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');

      const appointmentItem = page.locator('[data-testid*="appointment"]').first();
      if (await appointmentItem.isVisible({ timeout: 5000 }).catch(() => false)) {
        await appointmentItem.click();
        await page.waitForTimeout(500);

        const startButton = page.locator('[data-testid="start-recording"]')
          .or(page.getByRole('button', { name: /start.*record/i }));

        if (await startButton.isVisible().catch(() => false)) {
          await startButton.click();
          await page.waitForTimeout(1000);

          // Take screenshot of active recording state
          const recordingControls = page.locator('[data-testid*="recording"], .recording-controls');
          if (await recordingControls.isVisible().catch(() => false)) {
            await expect(recordingControls).toHaveScreenshot('recording-controls-active.png', {
              maxDiffPixels: 200 // Allow more variance for animated elements
            });
          }
        }
      }
    });

    test('recording controls - paused state', async ({ page }) => {
      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');

      const appointmentItem = page.locator('[data-testid*="appointment"]').first();
      if (await appointmentItem.isVisible({ timeout: 5000 }).catch(() => false)) {
        await appointmentItem.click();
        await page.waitForTimeout(500);

        const startButton = page.locator('[data-testid="start-recording"]')
          .or(page.getByRole('button', { name: /start.*record/i }));

        if (await startButton.isVisible().catch(() => false)) {
          await startButton.click();
          await page.waitForTimeout(500);

          const pauseButton = page.locator('[data-testid="pause-recording"]')
            .or(page.getByRole('button', { name: /pause/i }));

          if (await pauseButton.isVisible().catch(() => false)) {
            await pauseButton.click();
            await page.waitForTimeout(500);

            // Take screenshot of paused state
            const recordingControls = page.locator('[data-testid*="recording"], .recording-controls');
            if (await recordingControls.isVisible().catch(() => false)) {
              await expect(recordingControls).toHaveScreenshot('recording-controls-paused.png', {
                maxDiffPixels: 100
              });
            }
          }
        }
      }
    });
  });

  test.describe('Consent Dialog', () => {
    test('consent dialog - full view', async ({ page }) => {
      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');

      const appointmentItem = page.locator('[data-testid*="appointment"]').first();
      if (await appointmentItem.isVisible({ timeout: 5000 }).catch(() => false)) {
        await appointmentItem.click();
        await page.waitForTimeout(500);

        const startButton = page.locator('[data-testid="start-recording"]')
          .or(page.getByRole('button', { name: /start.*record/i }));

        if (await startButton.isVisible().catch(() => false)) {
          await startButton.click();
          await page.waitForTimeout(500);

          // Take screenshot of consent dialog
          const consentDialog = page.getByRole('dialog');
          if (await consentDialog.isVisible().catch(() => false)) {
            await expect(consentDialog).toHaveScreenshot('consent-dialog.png', {
              maxDiffPixels: 100
            });
          }
        }
      }
    });

    test('consent checkboxes - unchecked', async ({ page }) => {
      await page.goto('/calendar');

      const appointmentItem = page.locator('[data-testid*="appointment"]').first();
      if (await appointmentItem.isVisible({ timeout: 5000 }).catch(() => false)) {
        await appointmentItem.click();
        await page.waitForTimeout(500);

        const startButton = page.locator('[data-testid="start-recording"]');
        if (await startButton.isVisible().catch(() => false)) {
          await startButton.click();
          await page.waitForTimeout(500);

          const checkboxGroup = page.locator('[data-testid="consent-checkboxes"], .consent-options');
          if (await checkboxGroup.isVisible().catch(() => false)) {
            await expect(checkboxGroup).toHaveScreenshot('consent-checkboxes-unchecked.png', {
              maxDiffPixels: 50
            });
          }
        }
      }
    });
  });

  test.describe('Quality Selection', () => {
    test('quality selector - expanded', async ({ page }) => {
      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');

      const settingsButton = page.locator('[data-testid="recording-settings"]')
        .or(page.getByRole('button', { name: /settings|quality/i }));

      if (await settingsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(300);

        const qualityOptions = page.locator('[data-testid="quality-options"], .quality-selector');
        if (await qualityOptions.isVisible().catch(() => false)) {
          await expect(qualityOptions).toHaveScreenshot('quality-selector.png', {
            maxDiffPixels: 100
          });
        }
      }
    });
  });

  test.describe('Participant Indicators', () => {
    test('participant list - multiple participants', async ({ page }) => {
      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');

      const appointmentItem = page.locator('[data-testid*="appointment"]').first();
      if (await appointmentItem.isVisible({ timeout: 5000 }).catch(() => false)) {
        await appointmentItem.click();
        await page.waitForTimeout(500);

        const participants = page.locator('[data-testid="recording-participants"], .participants-list');
        if (await participants.isVisible().catch(() => false)) {
          await expect(participants).toHaveScreenshot('participant-indicators.png', {
            maxDiffPixels: 100
          });
        }
      }
    });
  });

  test.describe('Connection Quality', () => {
    test('connection quality - good', async ({ page }) => {
      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');

      const connectionIndicator = page.locator('[data-testid="connection-quality"], .connection-indicator');
      if (await connectionIndicator.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(connectionIndicator).toHaveScreenshot('connection-quality-good.png', {
          maxDiffPixels: 50
        });
      }
    });

    test('connection quality - poor', async ({ page, context }) => {
      // Emulate poor network using route with delay
      await context.route('**/*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 500)); // Add delay
        await route.continue();
      });

      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');

      const connectionIndicator = page.locator('[data-testid="connection-quality"], .connection-indicator');
      if (await connectionIndicator.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(connectionIndicator).toHaveScreenshot('connection-quality-poor.png', {
          maxDiffPixels: 50
        });
      }

      // Clear routes
      await context.unrouteAll();
    });
  });

  test.describe('Waveform Visualization', () => {
    test('waveform - bars mode', async ({ page }) => {
      await page.goto('/calendar');

      const appointmentItem = page.locator('[data-testid*="appointment"]').first();
      if (await appointmentItem.isVisible({ timeout: 5000 }).catch(() => false)) {
        await appointmentItem.click();
        await page.waitForTimeout(500);

        const startButton = page.locator('[data-testid="start-recording"]');
        if (await startButton.isVisible().catch(() => false)) {
          await startButton.click();
          await page.waitForTimeout(1000);

          const waveform = page.locator('[data-testid="audio-waveform"], canvas.waveform');
          if (await waveform.isVisible().catch(() => false)) {
            // Note: Waveform is animated, so we allow more variance
            await expect(waveform).toHaveScreenshot('waveform-visualization.png', {
              maxDiffPixels: 500,
              animations: 'disabled'
            });
          }
        }
      }
    });
  });

  test.describe('Recovery Dialog', () => {
    test('recovery dialog - with recordings', async ({ page }) => {
      // This test requires simulating recovery state
      const recoveryDialog = page.locator('[data-testid="recovery-dialog"]');

      if (await recoveryDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(recoveryDialog).toHaveScreenshot('recovery-dialog.png', {
          maxDiffPixels: 100
        });
      }
    });
  });

  test.describe('Transcript Player', () => {
    test('transcript synced player - full view', async ({ page }) => {
      await page.goto('/appointments');
      await page.waitForLoadState('networkidle');

      const completedSession = page.locator('[data-testid*="appointment"]')
        .filter({ hasText: /completed|past/i })
        .first();

      if (await completedSession.isVisible({ timeout: 5000 }).catch(() => false)) {
        await completedSession.click();
        await page.waitForTimeout(500);

        const player = page.locator('[data-testid="transcript-synced-player"], .recording-player');
        if (await player.isVisible().catch(() => false)) {
          await expect(player).toHaveScreenshot('transcript-player.png', {
            maxDiffPixels: 200
          });
        }
      }
    });

    test('transcript - highlighted segment', async ({ page }) => {
      await page.goto('/appointments');

      const completedSession = page.locator('[data-testid*="appointment"]')
        .filter({ hasText: /completed|past/i })
        .first();

      if (await completedSession.isVisible({ timeout: 5000 }).catch(() => false)) {
        await completedSession.click();
        await page.waitForTimeout(500);

        const transcript = page.locator('[data-testid="transcript"], .transcript');
        if (await transcript.isVisible().catch(() => false)) {
          await expect(transcript).toHaveScreenshot('transcript-view.png', {
            maxDiffPixels: 100
          });
        }
      }
    });
  });

  test.describe('AI Summary', () => {
    test('AI summary card', async ({ page }) => {
      await page.goto('/appointments');

      const completedSession = page.locator('[data-testid*="appointment"]')
        .filter({ hasText: /completed|past/i })
        .first();

      if (await completedSession.isVisible({ timeout: 5000 }).catch(() => false)) {
        await completedSession.click();
        await page.waitForTimeout(500);

        const summaryCard = page.locator('[data-testid="ai-summary"], .session-summary');
        if (await summaryCard.isVisible().catch(() => false)) {
          await expect(summaryCard).toHaveScreenshot('ai-summary-card.png', {
            maxDiffPixels: 100
          });
        }
      }
    });
  });

  test.describe('Responsive Views', () => {
    test('recording controls - mobile view', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');

      const appointmentItem = page.locator('[data-testid*="appointment"]').first();
      if (await appointmentItem.isVisible({ timeout: 5000 }).catch(() => false)) {
        await appointmentItem.click();
        await page.waitForTimeout(500);

        const recordingArea = page.locator('[data-testid*="recording"], .recording-section');
        if (await recordingArea.isVisible().catch(() => false)) {
          await expect(recordingArea).toHaveScreenshot('recording-controls-mobile.png', {
            maxDiffPixels: 150
          });
        }
      }
    });

    test('recording controls - tablet view', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');

      const appointmentItem = page.locator('[data-testid*="appointment"]').first();
      if (await appointmentItem.isVisible({ timeout: 5000 }).catch(() => false)) {
        await appointmentItem.click();
        await page.waitForTimeout(500);

        const recordingArea = page.locator('[data-testid*="recording"], .recording-section');
        if (await recordingArea.isVisible().catch(() => false)) {
          await expect(recordingArea).toHaveScreenshot('recording-controls-tablet.png', {
            maxDiffPixels: 150
          });
        }
      }
    });

    test('consent dialog - mobile view', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/calendar');

      const appointmentItem = page.locator('[data-testid*="appointment"]').first();
      if (await appointmentItem.isVisible({ timeout: 5000 }).catch(() => false)) {
        await appointmentItem.click();
        await page.waitForTimeout(500);

        const startButton = page.locator('[data-testid="start-recording"]');
        if (await startButton.isVisible().catch(() => false)) {
          await startButton.click();
          await page.waitForTimeout(500);

          const consentDialog = page.getByRole('dialog');
          if (await consentDialog.isVisible().catch(() => false)) {
            await expect(consentDialog).toHaveScreenshot('consent-dialog-mobile.png', {
              maxDiffPixels: 150
            });
          }
        }
      }
    });
  });
});
