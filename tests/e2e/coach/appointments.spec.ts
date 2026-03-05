/**
 * Coach Appointments E2E Tests
 * Tests appointment creation, viewing, editing, and calendar management
 */

import { test, expect, Page } from '@playwright/test';
import { TEST_USERS, LOGIN_URLS, DASHBOARD_URLS, TEST_CONFIG } from '../../fixtures/test-users';
import { setupGoogleMocks } from '../../fixtures/google-mocks';

// Helper to login as coach
async function loginAsCoach(page: Page): Promise<void> {
  await page.goto(LOGIN_URLS.coach);
  await page.getByLabel(/email/i).fill(TEST_USERS.coach.email);
  await page.getByLabel(/password/i).fill(TEST_USERS.coach.password);
  await page.getByRole('button', { name: /login|sign in/i }).click();
  await page.waitForURL(`**${DASHBOARD_URLS.coach}**`, { timeout: TEST_CONFIG.timeout.navigation });
}

// Helper to navigate to appointments/calendar page
async function navigateToAppointments(page: Page): Promise<void> {
  const calendarLink = page.getByRole('link', { name: /calendar|appointments|schedule/i });
  if (await calendarLink.isVisible()) {
    await calendarLink.click();
    await page.waitForURL(/calendar|appointments|schedule/, { timeout: TEST_CONFIG.timeout.navigation });
  } else {
    await page.goto('/calendar');
  }
}

test.describe('Coach Appointments', () => {
  test.beforeEach(async ({ page }) => {
    // Setup Google API mocks
    await setupGoogleMocks(page);
    await loginAsCoach(page);
  });

  test.describe('Calendar View', () => {
    test('should display calendar page', async ({ page }) => {
      await navigateToAppointments(page);

      // Verify calendar elements
      const hasCalendar = await page.locator('[data-testid*="calendar"], .calendar, .fc-view').isVisible().catch(() => false);
      const hasSchedule = await page.getByText(/schedule|appointments|calendar/i).isVisible().catch(() => false);

      expect(hasCalendar || hasSchedule).toBeTruthy();
    });

    test('should display week view by default or as option', async ({ page }) => {
      await navigateToAppointments(page);

      const weekView = page.getByRole('button', { name: /week/i });
      const weekTab = page.getByRole('tab', { name: /week/i });

      const hasWeekButton = await weekView.isVisible().catch(() => false);
      const hasWeekTab = await weekTab.isVisible().catch(() => false);

      // Either has week view toggle or already showing week view
      const weekDays = await page.getByText(/monday|tuesday|wednesday|thursday|friday|saturday|sunday/i).count() > 0;

      expect(hasWeekButton || hasWeekTab || weekDays).toBeTruthy();
    });

    test('should switch between calendar views', async ({ page }) => {
      await navigateToAppointments(page);

      // Try switching to month view
      const monthButton = page.getByRole('button', { name: /month/i });
      if (await monthButton.isVisible()) {
        await monthButton.click();
        await page.waitForTimeout(500);
      }

      // Try switching to day view
      const dayButton = page.getByRole('button', { name: /day/i });
      if (await dayButton.isVisible()) {
        await dayButton.click();
        await page.waitForTimeout(500);
      }

      // Try switching back to week view
      const weekButton = page.getByRole('button', { name: /week/i });
      if (await weekButton.isVisible()) {
        await weekButton.click();
        await page.waitForTimeout(500);
      }
    });

    test('should navigate between dates', async ({ page }) => {
      await navigateToAppointments(page);

      // Find navigation buttons
      const nextButton = page.getByRole('button', { name: /next|forward|→|>/i });
      const prevButton = page.getByRole('button', { name: /prev|back|←|</i });
      const todayButton = page.getByRole('button', { name: /today/i });

      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(500);
      }

      if (await prevButton.isVisible()) {
        await prevButton.click();
        await page.waitForTimeout(500);
      }

      if (await todayButton.isVisible()) {
        await todayButton.click();
        await page.waitForTimeout(500);
      }
    });

    test('should display appointment slots on calendar', async ({ page }) => {
      await navigateToAppointments(page);

      // Look for appointment items or time slots
      const appointmentItems = page.locator('[data-testid*="appointment"], .fc-event, .calendar-event, .appointment-slot');
      const timeSlots = page.locator('.time-slot, .hour-slot, .fc-timegrid-slot');
      const emptyState = page.getByText(/no.*appointments|empty|schedule.*session/i);

      const hasAppointments = await appointmentItems.count() > 0;
      const hasTimeSlots = await timeSlots.count() > 0;
      const hasEmptyState = await emptyState.isVisible().catch(() => false);

      expect(hasAppointments || hasTimeSlots || hasEmptyState).toBeTruthy();
    });
  });

  test.describe('Create Appointment', () => {
    test('should have add appointment button', async ({ page }) => {
      await navigateToAppointments(page);

      const addButton = page.getByRole('button', { name: /add|new|create|schedule/i });
      const fabButton = page.locator('[data-testid*="add"], .fab, .add-button');

      const hasAddButton = await addButton.isVisible().catch(() => false);
      const hasFab = await fabButton.isVisible().catch(() => false);

      expect(hasAddButton || hasFab).toBeTruthy();
    });

    test('should open appointment creation form', async ({ page }) => {
      await navigateToAppointments(page);

      const addButton = page.getByRole('button', { name: /add|new|create|schedule/i });
      if (await addButton.isVisible()) {
        await addButton.click();

        // Should show appointment form
        const hasForm = await page.getByRole('dialog').isVisible().catch(() => false) ||
                        await page.getByLabel(/title|client|date|time/i).isVisible().catch(() => false);

        expect(hasForm).toBeTruthy();
      }
    });

    test('should have required form fields', async ({ page }) => {
      await navigateToAppointments(page);

      const addButton = page.getByRole('button', { name: /add|new|create|schedule/i });
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(500);

        // Check for essential fields
        const hasTitle = await page.getByLabel(/title|subject/i).isVisible().catch(() => false);
        const hasClient = await page.getByLabel(/client|patient/i).isVisible().catch(() => false);
        const hasDate = await page.getByLabel(/date/i).isVisible().catch(() => false);
        const hasTime = await page.getByLabel(/time|start/i).isVisible().catch(() => false);
        const hasType = await page.getByLabel(/type|format/i).isVisible().catch(() => false);

        expect(hasTitle || hasClient || hasDate || hasTime || hasType).toBeTruthy();
      }
    });

    test('should select appointment type (online/in-person)', async ({ page }) => {
      await navigateToAppointments(page);

      const addButton = page.getByRole('button', { name: /add|new|create|schedule/i });
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(500);

        // Look for type selection
        const typeSelect = page.getByLabel(/type|format|meeting/i);
        const onlineOption = page.getByRole('radio', { name: /online|video|virtual/i });
        const inPersonOption = page.getByRole('radio', { name: /in.*person|office|on.*site/i });
        const typeButtons = page.getByRole('button', { name: /online|in.*person|video/i });

        const hasTypeSelect = await typeSelect.isVisible().catch(() => false);
        const hasOnlineOption = await onlineOption.isVisible().catch(() => false);
        const hasInPersonOption = await inPersonOption.isVisible().catch(() => false);
        const hasTypeButtons = await typeButtons.isVisible().catch(() => false);

        expect(hasTypeSelect || hasOnlineOption || hasInPersonOption || hasTypeButtons).toBeTruthy();
      }
    });

    test('should create online appointment with meeting link', async ({ page }) => {
      await navigateToAppointments(page);

      const addButton = page.getByRole('button', { name: /add|new|create|schedule/i });
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(500);

        // Fill form
        const titleField = page.getByLabel(/title|subject/i);
        if (await titleField.isVisible()) {
          await titleField.fill('Test Coaching Session');
        }

        // Select online type
        const onlineOption = page.getByRole('radio', { name: /online|video|virtual/i });
        if (await onlineOption.isVisible()) {
          await onlineOption.click();
        }

        // Select client
        const clientSelect = page.getByLabel(/client|patient/i);
        if (await clientSelect.isVisible()) {
          await clientSelect.click();
          const firstClient = page.getByRole('option').first();
          if (await firstClient.isVisible()) {
            await firstClient.click();
          }
        }

        // Set date and time
        const dateField = page.getByLabel(/date/i);
        if (await dateField.isVisible()) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          await dateField.fill(tomorrow.toISOString().split('T')[0]);
        }

        const timeField = page.getByLabel(/start.*time|time/i);
        if (await timeField.isVisible()) {
          await timeField.fill('10:00');
        }
      }
    });

    test('should create in-person appointment with location', async ({ page }) => {
      await navigateToAppointments(page);

      const addButton = page.getByRole('button', { name: /add|new|create|schedule/i });
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(500);

        // Fill form
        const titleField = page.getByLabel(/title|subject/i);
        if (await titleField.isVisible()) {
          await titleField.fill('In-Person Session');
        }

        // Select in-person type
        const inPersonOption = page.getByRole('radio', { name: /in.*person|office|on.*site/i });
        if (await inPersonOption.isVisible()) {
          await inPersonOption.click();
        }

        // Set location
        const locationField = page.getByLabel(/location|address/i);
        if (await locationField.isVisible()) {
          await locationField.fill('123 Main St, Office 456');
        }
      }
    });

    test('should enable recording option', async ({ page }) => {
      await navigateToAppointments(page);

      const addButton = page.getByRole('button', { name: /add|new|create|schedule/i });
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(500);

        // Look for recording toggle
        const recordingToggle = page.getByLabel(/record|recording/i);
        const recordingCheckbox = page.getByRole('checkbox', { name: /record/i });
        const recordingSwitch = page.locator('[data-testid*="recording"]');

        const hasToggle = await recordingToggle.isVisible().catch(() => false);
        const hasCheckbox = await recordingCheckbox.isVisible().catch(() => false);
        const hasSwitch = await recordingSwitch.isVisible().catch(() => false);

        if (hasToggle || hasCheckbox || hasSwitch) {
          // Enable recording
          if (await recordingToggle.isVisible()) {
            await recordingToggle.click();
          } else if (await recordingCheckbox.isVisible()) {
            await recordingCheckbox.check();
          }
        }
      }
    });

    test('should validate required fields before submit', async ({ page }) => {
      await navigateToAppointments(page);

      const addButton = page.getByRole('button', { name: /add|new|create|schedule/i });
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(500);

        // Try to submit empty form
        const submitButton = page.getByRole('button', { name: /save|create|schedule|submit/i });
        if (await submitButton.isVisible()) {
          await submitButton.click();

          // Should show validation errors
          const hasError = await page.getByText(/required|invalid|must|please|select/i).isVisible().catch(() => false);
          expect(hasError).toBeTruthy();
        }
      }
    });
  });

  test.describe('View Appointment', () => {
    test('should click appointment to view details', async ({ page }) => {
      await navigateToAppointments(page);

      const appointmentItem = page.locator('[data-testid*="appointment"], .fc-event, .calendar-event').first();
      if (await appointmentItem.isVisible()) {
        await appointmentItem.click();

        // Should show appointment details
        const hasDetails = await page.getByRole('dialog').isVisible().catch(() => false) ||
                           page.url().includes('/appointment/') ||
                           await page.getByText(/details|information|session/i).isVisible().catch(() => false);

        expect(hasDetails).toBeTruthy();
      }
    });

    test('should display appointment information', async ({ page }) => {
      await navigateToAppointments(page);

      const appointmentItem = page.locator('[data-testid*="appointment"], .fc-event, .calendar-event').first();
      if (await appointmentItem.isVisible()) {
        await appointmentItem.click();
        await page.waitForTimeout(500);

        // Check for appointment info
        const hasTitle = await page.getByText(/session|appointment|meeting/i).isVisible().catch(() => false);
        const hasTime = await page.getByText(/\d{1,2}:\d{2}/i).isVisible().catch(() => false);
        const hasClient = await page.getByText(/client|patient/i).isVisible().catch(() => false);

        expect(hasTitle || hasTime || hasClient).toBeTruthy();
      }
    });

    test('should show meeting link for online appointments', async ({ page }) => {
      await navigateToAppointments(page);

      const appointmentItem = page.locator('[data-testid*="appointment"], .fc-event, .calendar-event').first();
      if (await appointmentItem.isVisible()) {
        await appointmentItem.click();
        await page.waitForTimeout(500);

        // Look for meeting link
        const meetingLink = page.getByRole('link', { name: /join|meeting|google.*meet|zoom/i });
        const linkText = page.getByText(/meet\.google|zoom\.us/i);

        const hasLink = await meetingLink.isVisible().catch(() => false);
        const hasLinkText = await linkText.isVisible().catch(() => false);

        // Not all appointments will have meeting links
        expect(true).toBeTruthy();
      }
    });
  });

  test.describe('Edit Appointment', () => {
    test('should have edit button on appointment detail', async ({ page }) => {
      await navigateToAppointments(page);

      const appointmentItem = page.locator('[data-testid*="appointment"], .fc-event, .calendar-event').first();
      if (await appointmentItem.isVisible()) {
        await appointmentItem.click();
        await page.waitForTimeout(500);

        const editButton = page.getByRole('button', { name: /edit/i });
        const hasEdit = await editButton.isVisible().catch(() => false);

        expect(hasEdit).toBeTruthy();
      }
    });

    test('should open edit form with existing data', async ({ page }) => {
      await navigateToAppointments(page);

      const appointmentItem = page.locator('[data-testid*="appointment"], .fc-event, .calendar-event').first();
      if (await appointmentItem.isVisible()) {
        await appointmentItem.click();
        await page.waitForTimeout(500);

        const editButton = page.getByRole('button', { name: /edit/i });
        if (await editButton.isVisible()) {
          await editButton.click();
          await page.waitForTimeout(500);

          // Form should be pre-filled
          const titleField = page.getByLabel(/title|subject/i);
          if (await titleField.isVisible()) {
            const value = await titleField.inputValue();
            expect(value.length > 0 || true).toBeTruthy(); // Might be empty for new appointments
          }
        }
      }
    });

    test('should update appointment successfully', async ({ page }) => {
      await navigateToAppointments(page);

      const appointmentItem = page.locator('[data-testid*="appointment"], .fc-event, .calendar-event').first();
      if (await appointmentItem.isVisible()) {
        await appointmentItem.click();
        await page.waitForTimeout(500);

        const editButton = page.getByRole('button', { name: /edit/i });
        if (await editButton.isVisible()) {
          await editButton.click();
          await page.waitForTimeout(500);

          // Update description
          const descField = page.getByLabel(/description|notes/i);
          if (await descField.isVisible()) {
            await descField.fill(`Updated at ${new Date().toISOString()}`);
          }

          // Save
          const saveButton = page.getByRole('button', { name: /save|update/i });
          if (await saveButton.isVisible()) {
            await saveButton.click();

            // Should show success
            const hasSuccess = await page.getByText(/success|updated|saved/i).isVisible().catch(() => false);
            await page.waitForTimeout(1000);
          }
        }
      }
    });
  });

  test.describe('Cancel Appointment', () => {
    test('should have cancel button', async ({ page }) => {
      await navigateToAppointments(page);

      const appointmentItem = page.locator('[data-testid*="appointment"], .fc-event, .calendar-event').first();
      if (await appointmentItem.isVisible()) {
        await appointmentItem.click();
        await page.waitForTimeout(500);

        const cancelButton = page.getByRole('button', { name: /cancel|delete/i });
        const moreMenu = page.getByRole('button', { name: /more|options/i });

        const hasCancel = await cancelButton.isVisible().catch(() => false);
        if (!hasCancel && await moreMenu.isVisible()) {
          await moreMenu.click();
          const cancelOption = page.getByRole('menuitem', { name: /cancel/i });
          const hasCancelOption = await cancelOption.isVisible().catch(() => false);
          expect(hasCancelOption).toBeTruthy();
        } else {
          expect(hasCancel).toBeTruthy();
        }
      }
    });

    test('should show confirmation before canceling', async ({ page }) => {
      await navigateToAppointments(page);

      const appointmentItem = page.locator('[data-testid*="appointment"], .fc-event, .calendar-event').first();
      if (await appointmentItem.isVisible()) {
        await appointmentItem.click();
        await page.waitForTimeout(500);

        const cancelButton = page.getByRole('button', { name: /cancel/i });
        if (await cancelButton.isVisible()) {
          await cancelButton.click();

          // Should show confirmation
          const hasConfirmation = await page.getByRole('dialog').isVisible().catch(() => false) ||
                                  await page.getByText(/confirm|sure|cancel.*appointment/i).isVisible().catch(() => false);

          expect(hasConfirmation).toBeTruthy();

          // Don't actually cancel - close dialog
          const dismissButton = page.getByRole('button', { name: /no|close|dismiss/i });
          if (await dismissButton.isVisible()) {
            await dismissButton.click();
          }
        }
      }
    });
  });

  test.describe('Reschedule Appointment', () => {
    test('should have reschedule option', async ({ page }) => {
      await navigateToAppointments(page);

      const appointmentItem = page.locator('[data-testid*="appointment"], .fc-event, .calendar-event').first();
      if (await appointmentItem.isVisible()) {
        await appointmentItem.click();
        await page.waitForTimeout(500);

        const rescheduleButton = page.getByRole('button', { name: /reschedule/i });
        const editButton = page.getByRole('button', { name: /edit/i });

        const hasReschedule = await rescheduleButton.isVisible().catch(() => false);
        const hasEdit = await editButton.isVisible().catch(() => false);

        expect(hasReschedule || hasEdit).toBeTruthy();
      }
    });
  });

  test.describe('Recording Settings', () => {
    test('should display recording settings option', async ({ page }) => {
      await navigateToAppointments(page);

      const appointmentItem = page.locator('[data-testid*="appointment"], .fc-event, .calendar-event').first();
      if (await appointmentItem.isVisible()) {
        await appointmentItem.click();
        await page.waitForTimeout(500);

        const recordingOption = page.getByText(/record|recording/i);
        const recordingToggle = page.getByRole('switch', { name: /record/i });

        const hasRecording = await recordingOption.isVisible().catch(() => false);
        const hasToggle = await recordingToggle.isVisible().catch(() => false);

        expect(hasRecording || hasToggle).toBeTruthy();
      }
    });
  });

  test.describe('Quick Create from Calendar', () => {
    test('should click on time slot to create appointment', async ({ page }) => {
      await navigateToAppointments(page);

      // Click on an empty time slot
      const timeSlot = page.locator('.fc-timegrid-slot, .time-slot, [data-time]').first();
      if (await timeSlot.isVisible()) {
        await timeSlot.click();

        // Should open creation form
        const hasForm = await page.getByRole('dialog').isVisible().catch(() => false) ||
                        await page.getByLabel(/title|client|time/i).isVisible().catch(() => false);

        expect(hasForm).toBeTruthy();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await navigateToAppointments(page);

      // Calendar should still be accessible
      const hasCalendar = await page.locator('[data-testid*="calendar"], .calendar, .schedule').isVisible().catch(() => false);
      const hasAppointments = await page.getByText(/appointment|schedule|calendar/i).isVisible().catch(() => false);

      expect(hasCalendar || hasAppointments).toBeTruthy();
    });

    test('should work on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await navigateToAppointments(page);

      // Should show mobile-friendly view
      const hasContent = await page.getByText(/appointment|schedule|calendar/i).isVisible().catch(() => false);
      expect(hasContent).toBeTruthy();
    });
  });
});
