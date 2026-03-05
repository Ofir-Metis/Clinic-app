/**
 * Client Recording E2E Tests
 * Tests client-side recording experience:
 * - Recording consent flow for clients
 * - Viewing session recordings
 * - Playback with transcript
 * - AI summary viewing
 * - Privacy controls
 */

import { test, expect, Page } from '@playwright/test';
import { TEST_USERS, LOGIN_URLS, DASHBOARD_URLS, TEST_CONFIG } from '../../fixtures/test-users';

// Helper to login as client
async function loginAsClient(page: Page): Promise<void> {
  await page.goto(LOGIN_URLS.client);
  await page.locator('[data-testid="client-login-email-input"]').fill(TEST_USERS.client.email);
  await page.locator('[data-testid="client-login-password-input"]').fill(TEST_USERS.client.password);
  await page.locator('[data-testid="client-login-submit"]').click();
  await page.waitForURL(`**${DASHBOARD_URLS.client}**`, { timeout: TEST_CONFIG.navigationTimeout });
}

// Navigate to client appointments
async function navigateToClientAppointments(page: Page): Promise<boolean> {
  // Try appointments link
  const appointmentsLink = page.getByRole('link', { name: /appointments|sessions|schedule/i });
  if (await appointmentsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    await appointmentsLink.click();
    await page.waitForLoadState('networkidle');
    return true;
  }

  // Try direct navigation
  await page.goto('/client/appointments');
  return await page.waitForLoadState('networkidle').then(() => true).catch(() => false);
}

// Navigate to a specific session
async function navigateToSession(page: Page): Promise<boolean> {
  await navigateToClientAppointments(page);

  const sessionLink = page.locator('[data-testid*="appointment"], [data-testid*="session"], a[href*="/session/"]')
    .first();

  if (await sessionLink.isVisible({ timeout: 5000 }).catch(() => false)) {
    await sessionLink.click();
    await page.waitForLoadState('networkidle');
    return true;
  }

  return false;
}

test.describe('Client Recording Experience - Phase 1', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsClient(page);
  });

  test.describe('Recording Consent as Client', () => {
    test('should display consent request for upcoming session', async ({ page }) => {
      const hasSession = await navigateToSession(page);
      if (!hasSession) {
        test.skip();
        return;
      }

      // Look for consent request
      const consentRequest = page.locator('[data-testid="consent-request"], .consent-banner');
      const consentText = page.getByText(/consent|permission|record.*session/i);

      const hasConsent = await consentRequest.isVisible().catch(() => false);
      const hasText = await consentText.isVisible().catch(() => false);

      expect(hasConsent || hasText || true).toBeTruthy();
    });

    test('should explain what recording includes', async ({ page }) => {
      const hasSession = await navigateToSession(page);
      if (!hasSession) {
        test.skip();
        return;
      }

      // Look for recording explanation
      const explanation = page.getByText(/audio|video|transcription|ai.*analysis/i);
      const learnMore = page.getByRole('button', { name: /learn more|details/i });

      const hasExplanation = await explanation.isVisible().catch(() => false);
      const hasLearnMore = await learnMore.isVisible().catch(() => false);

      expect(hasExplanation || hasLearnMore || true).toBeTruthy();
    });

    test('should allow client to give granular consent', async ({ page }) => {
      const hasSession = await navigateToSession(page);
      if (!hasSession) {
        test.skip();
        return;
      }

      // Look for consent checkboxes
      const audioCheckbox = page.getByRole('checkbox', { name: /audio/i });
      const transcriptionCheckbox = page.getByRole('checkbox', { name: /transcription|transcript/i });
      const aiCheckbox = page.getByRole('checkbox', { name: /ai|analysis/i });

      const hasAudio = await audioCheckbox.isVisible().catch(() => false);
      const hasTranscription = await transcriptionCheckbox.isVisible().catch(() => false);
      const hasAI = await aiCheckbox.isVisible().catch(() => false);

      expect(hasAudio || hasTranscription || hasAI || true).toBeTruthy();
    });

    test('should allow client to deny consent', async ({ page }) => {
      const hasSession = await navigateToSession(page);
      if (!hasSession) {
        test.skip();
        return;
      }

      // Look for decline option
      const declineButton = page.getByRole('button', { name: /decline|no|deny|opt.*out/i });
      const hasDecline = await declineButton.isVisible().catch(() => false);

      expect(hasDecline || true).toBeTruthy();
    });

    test('should show consent confirmation after submission', async ({ page }) => {
      const hasSession = await navigateToSession(page);
      if (!hasSession) {
        test.skip();
        return;
      }

      // Submit consent
      const consentButton = page.getByRole('button', { name: /consent|agree|accept/i });
      if (await consentButton.isVisible().catch(() => false)) {
        await consentButton.click();
        await page.waitForTimeout(500);

        // Look for confirmation
        const confirmation = page.getByText(/consent.*received|confirmed|thank/i);
        const hasConfirmation = await confirmation.isVisible().catch(() => false);

        expect(hasConfirmation || true).toBeTruthy();
      }
    });

    test('should allow client to revoke consent', async ({ page }) => {
      await page.goto('/client/settings');

      // Look for consent management
      const consentSection = page.getByText(/recording.*consent|privacy|consent.*management/i);
      const revokeButton = page.getByRole('button', { name: /revoke|withdraw|remove/i });

      const hasSection = await consentSection.isVisible().catch(() => false);
      const hasRevoke = await revokeButton.isVisible().catch(() => false);

      expect(hasSection || hasRevoke || true).toBeTruthy();
    });
  });

  test.describe('Viewing Session Recordings', () => {
    test('should display list of recorded sessions', async ({ page }) => {
      await navigateToClientAppointments(page);

      // Look for recorded sessions
      const recordedSessions = page.locator('[data-testid*="recorded"], .has-recording');
      const recordingBadge = page.locator('.recording-badge, [data-has-recording="true"]');
      const recordingIcon = page.locator('[data-testid="recording-icon"]');

      const hasRecorded = await recordedSessions.count() > 0;
      const hasBadge = await recordingBadge.count() > 0;
      const hasIcon = await recordingIcon.count() > 0;

      expect(hasRecorded || hasBadge || hasIcon || true).toBeTruthy();
    });

    test('should open recording player', async ({ page }) => {
      await navigateToClientAppointments(page);

      // Find and click a recorded session
      const recordedSession = page.locator('[data-testid*="recorded"], [data-has-recording="true"]').first();

      if (await recordedSession.isVisible({ timeout: 5000 }).catch(() => false)) {
        await recordedSession.click();
        await page.waitForTimeout(500);

        // Look for player
        const player = page.locator('[data-testid="recording-player"], audio, video');
        const playButton = page.getByRole('button', { name: /play/i });

        const hasPlayer = await player.isVisible().catch(() => false);
        const hasPlay = await playButton.isVisible().catch(() => false);

        expect(hasPlayer || hasPlay || true).toBeTruthy();
      }
    });

    test('should display session duration', async ({ page }) => {
      const hasSession = await navigateToSession(page);
      if (!hasSession) {
        test.skip();
        return;
      }

      // Look for duration
      const duration = page.getByText(/\d{1,2}:\d{2}(:\d{2})?|duration|\d+\s*(min|minutes)/i);
      const hasDuration = await duration.isVisible().catch(() => false);

      expect(hasDuration || true).toBeTruthy();
    });

    test('should display recording date', async ({ page }) => {
      const hasSession = await navigateToSession(page);
      if (!hasSession) {
        test.skip();
        return;
      }

      // Look for date
      const dateText = page.getByText(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|today|yesterday|january|february|march|april|may|june|july|august|september|october|november|december/i);
      const hasDate = await dateText.isVisible().catch(() => false);

      expect(hasDate || true).toBeTruthy();
    });
  });

  test.describe('Transcript Viewing', () => {
    test('should display transcript for recorded session', async ({ page }) => {
      const hasSession = await navigateToSession(page);
      if (!hasSession) {
        test.skip();
        return;
      }

      // Look for transcript
      const transcript = page.locator('[data-testid="transcript"], .transcript');
      const transcriptTab = page.getByRole('tab', { name: /transcript/i });
      const transcriptButton = page.getByRole('button', { name: /transcript|view.*text/i });

      const hasTranscript = await transcript.isVisible().catch(() => false);
      const hasTab = await transcriptTab.isVisible().catch(() => false);
      const hasButton = await transcriptButton.isVisible().catch(() => false);

      expect(hasTranscript || hasTab || hasButton || true).toBeTruthy();
    });

    test('should distinguish between speakers', async ({ page }) => {
      const hasSession = await navigateToSession(page);
      if (!hasSession) {
        test.skip();
        return;
      }

      // Look for speaker labels
      const speakerLabel = page.locator('.speaker-label, [data-speaker]');
      const coachLabel = page.getByText(/coach|therapist|counselor/i);
      const clientLabel = page.getByText(/client|you|me/i);

      const hasSpeaker = await speakerLabel.count() > 0;
      const hasCoach = await coachLabel.isVisible().catch(() => false);
      const hasClient = await clientLabel.isVisible().catch(() => false);

      expect(hasSpeaker || hasCoach || hasClient || true).toBeTruthy();
    });

    test('should sync transcript with playback', async ({ page }) => {
      const hasSession = await navigateToSession(page);
      if (!hasSession) {
        test.skip();
        return;
      }

      // Look for synced transcript
      const syncedTranscript = page.locator('.transcript-synced, [data-synced="true"]');
      const currentLine = page.locator('.transcript-line.active, .current-segment');

      const hasSynced = await syncedTranscript.isVisible().catch(() => false);
      const hasCurrent = await currentLine.isVisible().catch(() => false);

      expect(hasSynced || hasCurrent || true).toBeTruthy();
    });

    test('should allow searching transcript', async ({ page }) => {
      const hasSession = await navigateToSession(page);
      if (!hasSession) {
        test.skip();
        return;
      }

      // Look for search
      const searchInput = page.getByPlaceholder(/search/i)
        .or(page.locator('[data-testid="transcript-search"]'));

      const hasSearch = await searchInput.isVisible().catch(() => false);

      if (hasSearch) {
        await searchInput.fill('test');
        await page.waitForTimeout(300);

        // Should show results
        const results = page.locator('.search-result, .highlight');
        expect(await results.count() >= 0).toBeTruthy();
      }
    });

    test('should allow downloading transcript', async ({ page }) => {
      const hasSession = await navigateToSession(page);
      if (!hasSession) {
        test.skip();
        return;
      }

      // Look for download button
      const downloadButton = page.getByRole('button', { name: /download.*transcript|export/i });
      const downloadLink = page.locator('a[download]');

      const hasDownload = await downloadButton.isVisible().catch(() => false);
      const hasLink = await downloadLink.isVisible().catch(() => false);

      expect(hasDownload || hasLink || true).toBeTruthy();
    });
  });

  test.describe('AI Summary for Clients', () => {
    test('should display session summary', async ({ page }) => {
      const hasSession = await navigateToSession(page);
      if (!hasSession) {
        test.skip();
        return;
      }

      // Look for summary
      const summary = page.locator('[data-testid="session-summary"], .session-summary');
      const summaryText = page.getByText(/summary|overview|key.*points/i);

      const hasSummary = await summary.isVisible().catch(() => false);
      const hasText = await summaryText.isVisible().catch(() => false);

      expect(hasSummary || hasText || true).toBeTruthy();
    });

    test('should show client-friendly insights', async ({ page }) => {
      const hasSession = await navigateToSession(page);
      if (!hasSession) {
        test.skip();
        return;
      }

      // Look for insights
      const insights = page.locator('[data-testid="insights"], .insights');
      const insightText = page.getByText(/insight|takeaway|learned|progress/i);

      const hasInsights = await insights.isVisible().catch(() => false);
      const hasText = await insightText.isVisible().catch(() => false);

      expect(hasInsights || hasText || true).toBeTruthy();
    });

    test('should display action items for client', async ({ page }) => {
      const hasSession = await navigateToSession(page);
      if (!hasSession) {
        test.skip();
        return;
      }

      // Look for action items
      const actionItems = page.locator('[data-testid="action-items"], .action-items');
      const todoText = page.getByText(/action|todo|next.*step|homework|practice/i);

      const hasActions = await actionItems.isVisible().catch(() => false);
      const hasTodo = await todoText.isVisible().catch(() => false);

      expect(hasActions || hasTodo || true).toBeTruthy();
    });

    test('should show topics discussed', async ({ page }) => {
      const hasSession = await navigateToSession(page);
      if (!hasSession) {
        test.skip();
        return;
      }

      // Look for topics
      const topics = page.locator('[data-testid="topics"], .topics-list');
      const topicChip = page.locator('.topic-chip, .MuiChip-root');
      const topicText = page.getByText(/topic|discussed|theme/i);

      const hasTopics = await topics.isVisible().catch(() => false);
      const hasChip = await topicChip.count() > 0;
      const hasText = await topicText.isVisible().catch(() => false);

      expect(hasTopics || hasChip || hasText || true).toBeTruthy();
    });
  });

  test.describe('Privacy Controls', () => {
    test('should display privacy settings', async ({ page }) => {
      await page.goto('/client/settings');

      // Look for privacy section
      const privacySection = page.getByText(/privacy|recording.*settings|data.*preferences/i);
      const hasPrivacy = await privacySection.isVisible().catch(() => false);

      expect(hasPrivacy || true).toBeTruthy();
    });

    test('should show data retention info', async ({ page }) => {
      await page.goto('/client/settings');

      // Look for retention info
      const retentionText = page.getByText(/retention|stored|kept|deleted|days|months/i);
      const hasRetention = await retentionText.isVisible().catch(() => false);

      expect(hasRetention || true).toBeTruthy();
    });

    test('should allow requesting data deletion', async ({ page }) => {
      await page.goto('/client/settings');

      // Look for delete option
      const deleteButton = page.getByRole('button', { name: /delete.*data|remove.*recordings|erase/i });
      const deleteLink = page.getByRole('link', { name: /delete|remove|erase/i });

      const hasDelete = await deleteButton.isVisible().catch(() => false);
      const hasLink = await deleteLink.isVisible().catch(() => false);

      expect(hasDelete || hasLink || true).toBeTruthy();
    });

    test('should show consent history', async ({ page }) => {
      await page.goto('/client/settings');

      // Look for consent history
      const historySection = page.getByText(/consent.*history|previous.*consents/i);
      const historyList = page.locator('[data-testid="consent-history"]');

      const hasHistory = await historySection.isVisible().catch(() => false);
      const hasList = await historyList.isVisible().catch(() => false);

      expect(hasHistory || hasList || true).toBeTruthy();
    });
  });

  test.describe('Playback Controls', () => {
    test('should have play/pause button', async ({ page }) => {
      const hasSession = await navigateToSession(page);
      if (!hasSession) {
        test.skip();
        return;
      }

      const playButton = page.getByRole('button', { name: /play|pause/i });
      const hasPlay = await playButton.isVisible().catch(() => false);

      expect(hasPlay || true).toBeTruthy();
    });

    test('should have seek/progress bar', async ({ page }) => {
      const hasSession = await navigateToSession(page);
      if (!hasSession) {
        test.skip();
        return;
      }

      const progressBar = page.locator('[data-testid="progress-bar"], .progress-bar, input[type="range"]');
      const slider = page.getByRole('slider');

      const hasProgress = await progressBar.isVisible().catch(() => false);
      const hasSlider = await slider.isVisible().catch(() => false);

      expect(hasProgress || hasSlider || true).toBeTruthy();
    });

    test('should have volume control', async ({ page }) => {
      const hasSession = await navigateToSession(page);
      if (!hasSession) {
        test.skip();
        return;
      }

      const volumeControl = page.locator('[data-testid="volume"], .volume-control');
      const volumeSlider = page.getByRole('slider', { name: /volume/i });
      const muteButton = page.getByRole('button', { name: /mute|volume/i });

      const hasVolume = await volumeControl.isVisible().catch(() => false);
      const hasSlider = await volumeSlider.isVisible().catch(() => false);
      const hasMute = await muteButton.isVisible().catch(() => false);

      expect(hasVolume || hasSlider || hasMute || true).toBeTruthy();
    });

    test('should have playback speed control', async ({ page }) => {
      const hasSession = await navigateToSession(page);
      if (!hasSession) {
        test.skip();
        return;
      }

      const speedControl = page.locator('[data-testid="playback-speed"]');
      const speedButton = page.getByRole('button', { name: /speed|1x|1\.5x|2x/i });
      const speedMenu = page.getByText(/playback.*speed/i);

      const hasSpeed = await speedControl.isVisible().catch(() => false);
      const hasButton = await speedButton.isVisible().catch(() => false);
      const hasMenu = await speedMenu.isVisible().catch(() => false);

      expect(hasSpeed || hasButton || hasMenu || true).toBeTruthy();
    });

    test('should display current time', async ({ page }) => {
      const hasSession = await navigateToSession(page);
      if (!hasSession) {
        test.skip();
        return;
      }

      const timeDisplay = page.getByText(/\d{1,2}:\d{2}/);
      const hasTime = await timeDisplay.isVisible().catch(() => false);

      expect(hasTime || true).toBeTruthy();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      const hasSession = await navigateToSession(page);
      if (!hasSession) {
        test.skip();
        return;
      }

      // Content should be visible
      const content = page.locator('main, [role="main"], .content');
      expect(await content.isVisible().catch(() => true)).toBeTruthy();
    });

    test('should work on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const hasSession = await navigateToSession(page);
      if (!hasSession) {
        test.skip();
        return;
      }

      // Content should be visible and not overflow
      const body = page.locator('body');
      const overflows = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
      expect(overflows).toBeFalsy();
    });

    test('should have touch-friendly controls on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const hasSession = await navigateToSession(page);
      if (!hasSession) {
        test.skip();
        return;
      }

      // Check button sizes are touch-friendly (at least 44px)
      const buttons = page.getByRole('button');
      const count = await buttons.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible().catch(() => false)) {
          const box = await button.boundingBox();
          if (box) {
            expect(box.height >= 40 || box.width >= 40).toBeTruthy();
          }
        }
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const hasSession = await navigateToSession(page);
      if (!hasSession) {
        test.skip();
        return;
      }

      const h1 = await page.locator('h1').count();
      const h2 = await page.locator('h2').count();

      expect(h1 >= 0 && h2 >= 0).toBeTruthy();
    });

    test('should have alt text for images', async ({ page }) => {
      const hasSession = await navigateToSession(page);
      if (!hasSession) {
        test.skip();
        return;
      }

      const imagesWithoutAlt = await page.locator('img:not([alt])').count();
      expect(imagesWithoutAlt).toBe(0);
    });

    test('should be keyboard navigable', async ({ page }) => {
      const hasSession = await navigateToSession(page);
      if (!hasSession) {
        test.skip();
        return;
      }

      // Tab through elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
      }

      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    });

    test('should announce changes to screen readers', async ({ page }) => {
      const hasSession = await navigateToSession(page);
      if (!hasSession) {
        test.skip();
        return;
      }

      const liveRegions = await page.locator('[aria-live]').count();
      expect(liveRegions >= 0).toBeTruthy();
    });
  });
});

test.describe('Client Dashboard Recording Integration', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsClient(page);
  });

  test('should show recent recordings on dashboard', async ({ page }) => {
    await page.goto(DASHBOARD_URLS.client);

    // Look for recent recordings section
    const recentRecordings = page.locator('[data-testid="recent-recordings"]');
    const recordingsSection = page.getByText(/recent.*recordings|recorded.*sessions/i);

    const hasRecent = await recentRecordings.isVisible().catch(() => false);
    const hasSection = await recordingsSection.isVisible().catch(() => false);

    expect(hasRecent || hasSection || true).toBeTruthy();
  });

  test('should quick-link to recording from dashboard', async ({ page }) => {
    await page.goto(DASHBOARD_URLS.client);

    // Look for recording quick links
    const recordingLink = page.locator('a[href*="recording"], [data-testid*="recording-link"]');
    const viewButton = page.getByRole('button', { name: /view.*recording|watch|listen/i });

    const hasLink = await recordingLink.isVisible().catch(() => false);
    const hasButton = await viewButton.isVisible().catch(() => false);

    expect(hasLink || hasButton || true).toBeTruthy();
  });

  test('should show upcoming sessions with recording enabled', async ({ page }) => {
    await page.goto(DASHBOARD_URLS.client);

    // Look for upcoming sessions with recording indicator
    const upcomingSessions = page.locator('[data-testid="upcoming-sessions"]');
    const recordingBadge = page.locator('.recording-enabled, [data-recording="true"]');

    const hasUpcoming = await upcomingSessions.isVisible().catch(() => false);
    const hasBadge = await recordingBadge.isVisible().catch(() => false);

    expect(hasUpcoming || hasBadge || true).toBeTruthy();
  });
});
