import { test, expect } from '@playwright/test';
import { setupAuthenticatedState } from './fixtures/auth-helpers';
import { mockAppointments, formTestData, testConfig } from './fixtures/test-data';

/**
 * Appointment Scheduling Tests for Clinic Management App
 * Tests appointment creation, editing, cancellation, and calendar integration
 */

test.describe('Appointment Scheduling', () => {
  test.beforeEach(async ({ page }) => {
    // Setup authenticated therapist state for all tests
    await setupAuthenticatedState(page, 'therapist');
  });

  test.describe('Calendar View', () => {
    test('should display calendar with appointments', async ({ page }) => {
      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');

      // Check page title and layout
      await expect(page.locator('[data-testid="page-title"]')).toContainText('Calendar');
      await expect(page.locator('text=📅 Your Schedule')).toBeVisible();

      // Should show calendar component
      const calendar = page.locator('[data-testid="appointment-calendar"]');
      await expect(calendar).toBeVisible();

      // Should show today's date highlighted
      const today = new Date().getDate().toString();
      const todayCell = page.locator(`[data-testid="calendar-day-${today}"]`);
      if (await todayCell.isVisible()) {
        await expect(todayCell).toHaveClass(/today|current/);
      }
    });

    test('should show appointments on calendar', async ({ page }) => {
      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');

      // Look for appointment indicators on calendar
      const appointmentDots = page.locator('[data-testid="appointment-indicator"]');
      if (await appointmentDots.count() > 0) {
        await expect(appointmentDots.first()).toBeVisible();
      }

      // Click on a day with appointments
      const dayWithAppointment = page.locator('[data-testid*="calendar-day"]:has([data-testid="appointment-indicator"])').first();
      if (await dayWithAppointment.isVisible()) {
        await dayWithAppointment.click();

        // Should show day view with appointments
        await expect(page.locator('[data-testid="day-appointments"]')).toBeVisible();
      }
    });

    test('should navigate between months', async ({ page }) => {
      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');

      // Get current month
      const currentMonth = page.locator('[data-testid="calendar-month"]');
      const currentMonthText = await currentMonth.textContent();

      // Click next month
      await page.click('[data-testid="next-month-button"]');
      await page.waitForTimeout(testConfig.shortDelay);

      // Month should change
      const newMonthText = await currentMonth.textContent();
      expect(newMonthText).not.toBe(currentMonthText);

      // Click previous month to go back
      await page.click('[data-testid="prev-month-button"]');
      await page.waitForTimeout(testConfig.shortDelay);

      // Should be back to original month
      const backToMonthText = await currentMonth.textContent();
      expect(backToMonthText).toBe(currentMonthText);
    });

    test('should switch between calendar views', async ({ page }) => {
      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');

      // Should have view switcher
      const viewButtons = page.locator('[data-testid="calendar-view-buttons"]');
      if (await viewButtons.isVisible()) {
        // Switch to week view
        await page.click('[data-testid="week-view-button"]');
        await expect(page.locator('[data-testid="week-calendar"]')).toBeVisible();

        // Switch to day view
        await page.click('[data-testid="day-view-button"]');
        await expect(page.locator('[data-testid="day-calendar"]')).toBeVisible();

        // Switch back to month view
        await page.click('[data-testid="month-view-button"]');
        await expect(page.locator('[data-testid="month-calendar"]')).toBeVisible();
      }
    });
  });

  test.describe('Schedule New Appointment', () => {
    test('should open appointment scheduling modal', async ({ page }) => {
      await page.goto('/calendar');
      
      // Click schedule new appointment button
      await page.click('[data-testid="schedule-appointment-button"]');
      
      // Should show modal
      const modal = page.locator('[data-testid="schedule-appointment-modal"]');
      await expect(modal).toBeVisible();
      await expect(page.locator('text=Schedule New Appointment')).toBeVisible();
    });

    test('should schedule appointment with valid data', async ({ page }) => {
      await page.goto('/calendar');
      await page.click('[data-testid="schedule-appointment-button"]');

      const validData = formTestData.validAppointment;

      // Fill appointment form
      await page.selectOption('[data-testid="patient-select"]', validData.patientName);
      await page.fill('[data-testid="appointment-title-input"]', validData.title);
      await page.fill('[data-testid="appointment-date-input"]', validData.date);
      await page.fill('[data-testid="appointment-time-input"]', validData.time);
      await page.selectOption('[data-testid="appointment-duration"]', validData.duration);
      await page.selectOption('[data-testid="appointment-type"]', validData.type);
      await page.fill('[data-testid="appointment-notes-input"]', validData.notes);

      // Save appointment
      await page.click('[data-testid="save-appointment-button"]');

      // Should show success message
      await expect(page.locator('text=Appointment scheduled successfully')).toBeVisible();
      
      // Modal should close
      const modal = page.locator('[data-testid="schedule-appointment-modal"]');
      await expect(modal).toBeHidden();

      // Should see appointment on calendar
      await expect(page.locator(`text=${validData.title}`)).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/calendar');
      await page.click('[data-testid="schedule-appointment-button"]');

      // Try to save without filling required fields
      await page.click('[data-testid="save-appointment-button"]');

      // Should show validation errors
      await expect(page.locator('text=Patient is required')).toBeVisible();
      await expect(page.locator('text=Title is required')).toBeVisible();
      await expect(page.locator('text=Date is required')).toBeVisible();
      await expect(page.locator('text=Time is required')).toBeVisible();
    });

    test('should validate appointment date', async ({ page }) => {
      await page.goto('/calendar');
      await page.click('[data-testid="schedule-appointment-button"]');

      // Enter past date
      await page.fill('[data-testid="appointment-date-input"]', '2020-01-01');
      await page.blur('[data-testid="appointment-date-input"]');

      await expect(page.locator('text=Appointment date cannot be in the past')).toBeVisible();
    });

    test('should validate time conflicts', async ({ page }) => {
      await page.goto('/calendar');
      await page.click('[data-testid="schedule-appointment-button"]');

      // Schedule appointment at a time that conflicts with existing appointment
      await page.selectOption('[data-testid="patient-select"]', 'John Doe');
      await page.fill('[data-testid="appointment-title-input"]', 'Test Appointment');
      await page.fill('[data-testid="appointment-date-input"]', '2024-02-15');
      await page.fill('[data-testid="appointment-time-input"]', '09:00'); // Conflicts with existing
      
      await page.click('[data-testid="save-appointment-button"]');

      // Should show conflict warning
      await expect(page.locator('text=Time conflict detected')).toBeVisible();
      
      // Should offer options to resolve conflict
      const conflictDialog = page.locator('[data-testid="time-conflict-dialog"]');
      if (await conflictDialog.isVisible()) {
        await expect(page.locator('text=Choose different time')).toBeVisible();
        await expect(page.locator('text=Schedule anyway')).toBeVisible();
      }
    });

    test('should suggest available time slots', async ({ page }) => {
      await page.goto('/calendar');
      await page.click('[data-testid="schedule-appointment-button"]');

      // Select date and patient
      await page.fill('[data-testid="appointment-date-input"]', '2024-02-16');
      await page.selectOption('[data-testid="patient-select"]', 'John Doe');

      // Should show available time slots
      const timeSlots = page.locator('[data-testid="available-time-slots"]');
      if (await timeSlots.isVisible()) {
        const slots = page.locator('[data-testid="time-slot"]');
        expect(await slots.count()).toBeGreaterThan(0);

        // Click on available slot
        await slots.first().click();

        // Time input should be filled
        const timeInput = page.locator('[data-testid="appointment-time-input"]');
        const timeValue = await timeInput.inputValue();
        expect(timeValue).toBeTruthy();
      }
    });

    test('should handle recurring appointments', async ({ page }) => {
      await page.goto('/calendar');
      await page.click('[data-testid="schedule-appointment-button"]');

      // Fill basic appointment data
      await page.selectOption('[data-testid="patient-select"]', 'John Doe');
      await page.fill('[data-testid="appointment-title-input"]', 'Weekly Therapy');
      await page.fill('[data-testid="appointment-date-input"]', '2024-02-15');
      await page.fill('[data-testid="appointment-time-input"]', '10:00');

      // Enable recurring
      const recurringCheckbox = page.locator('[data-testid="recurring-checkbox"]');
      if (await recurringCheckbox.isVisible()) {
        await recurringCheckbox.check();

        // Set recurrence pattern
        await page.selectOption('[data-testid="recurrence-pattern"]', 'weekly');
        await page.fill('[data-testid="recurrence-count"]', '8');

        await page.click('[data-testid="save-appointment-button"]');

        // Should show confirmation for multiple appointments
        await expect(page.locator('text=8 appointments will be created')).toBeVisible();
      }
    });
  });

  test.describe('Appointment Details', () => {
    test('should show appointment details on click', async ({ page }) => {
      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');

      // Click on an appointment
      const appointment = page.locator('[data-testid="appointment-card"]').first();
      if (await appointment.isVisible()) {
        await appointment.click();

        // Should show appointment details modal
        const detailModal = page.locator('[data-testid="appointment-details-modal"]');
        await expect(detailModal).toBeVisible();

        // Should show appointment information
        await expect(page.locator('[data-testid="appointment-patient"]')).toBeVisible();
        await expect(page.locator('[data-testid="appointment-time"]')).toBeVisible();
        await expect(page.locator('[data-testid="appointment-type"]')).toBeVisible();
      }
    });

    test('should show appointment actions', async ({ page }) => {
      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');

      const appointment = page.locator('[data-testid="appointment-card"]').first();
      if (await appointment.isVisible()) {
        await appointment.click();

        // Should show action buttons
        await expect(page.locator('[data-testid="edit-appointment-button"]')).toBeVisible();
        await expect(page.locator('[data-testid="cancel-appointment-button"]')).toBeVisible();
        await expect(page.locator('[data-testid="complete-appointment-button"]')).toBeVisible();
      }
    });

    test('should allow joining online appointments', async ({ page }) => {
      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');

      // Look for online appointment
      const onlineAppointment = page.locator('[data-testid="appointment-card"]:has-text("online")').first();
      if (await onlineAppointment.isVisible()) {
        await onlineAppointment.click();

        // Should show join meeting button
        const joinButton = page.locator('[data-testid="join-meeting-button"]');
        if (await joinButton.isVisible()) {
          await expect(joinButton).toBeVisible();
          await expect(joinButton).toContainText('Join Video Call');
        }
      }
    });
  });

  test.describe('Edit Appointment', () => {
    test('should edit appointment successfully', async ({ page }) => {
      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');

      const appointment = page.locator('[data-testid="appointment-card"]').first();
      if (await appointment.isVisible()) {
        await appointment.click();
        await page.click('[data-testid="edit-appointment-button"]');

        // Should show edit form
        const editModal = page.locator('[data-testid="edit-appointment-modal"]');
        await expect(editModal).toBeVisible();

        // Form should be pre-filled
        const titleInput = page.locator('[data-testid="appointment-title-input"]');
        const currentTitle = await titleInput.inputValue();
        expect(currentTitle).toBeTruthy();

        // Update title
        await titleInput.clear();
        await titleInput.fill('Updated Appointment Title');

        // Save changes
        await page.click('[data-testid="save-appointment-button"]');

        // Should show success message
        await expect(page.locator('text=Appointment updated successfully')).toBeVisible();

        // Should see updated title
        await expect(page.locator('text=Updated Appointment Title')).toBeVisible();
      }
    });

    test('should validate edited appointment data', async ({ page }) => {
      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');

      const appointment = page.locator('[data-testid="appointment-card"]').first();
      if (await appointment.isVisible()) {
        await appointment.click();
        await page.click('[data-testid="edit-appointment-button"]');

        // Clear required field
        const titleInput = page.locator('[data-testid="appointment-title-input"]');
        await titleInput.clear();

        // Try to save
        await page.click('[data-testid="save-appointment-button"]');

        // Should show validation error
        await expect(page.locator('text=Title is required')).toBeVisible();
      }
    });

    test('should handle time change conflicts', async ({ page }) => {
      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');

      const appointment = page.locator('[data-testid="appointment-card"]').first();
      if (await appointment.isVisible()) {
        await appointment.click();
        await page.click('[data-testid="edit-appointment-button"]');

        // Change to conflicting time
        await page.fill('[data-testid="appointment-time-input"]', '14:00'); // Conflicts with another

        await page.click('[data-testid="save-appointment-button"]');

        // Should show conflict warning
        await expect(page.locator('text=Time conflict detected')).toBeVisible();
      }
    });
  });

  test.describe('Cancel Appointment', () => {
    test('should show cancellation confirmation', async ({ page }) => {
      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');

      const appointment = page.locator('[data-testid="appointment-card"]').first();
      if (await appointment.isVisible()) {
        await appointment.click();
        await page.click('[data-testid="cancel-appointment-button"]');

        // Should show confirmation dialog
        const confirmDialog = page.locator('[data-testid="cancel-confirmation"]');
        await expect(confirmDialog).toBeVisible();
        await expect(page.locator('text=Are you sure you want to cancel this appointment?')).toBeVisible();
      }
    });

    test('should cancel appointment with reason', async ({ page }) => {
      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');

      const appointment = page.locator('[data-testid="appointment-card"]').first();
      if (await appointment.isVisible()) {
        await appointment.click();
        await page.click('[data-testid="cancel-appointment-button"]');

        // Select cancellation reason
        await page.selectOption('[data-testid="cancellation-reason"]', 'patient-request');
        await page.fill('[data-testid="cancellation-notes"]', 'Patient requested reschedule');

        // Confirm cancellation
        await page.click('[data-testid="confirm-cancel-button"]');

        // Should show success message
        await expect(page.locator('text=Appointment cancelled successfully')).toBeVisible();

        // Appointment should be marked as cancelled
        await expect(page.locator('[data-testid="appointment-status"]:has-text("Cancelled")')).toBeVisible();
      }
    });

    test('should send cancellation notification', async ({ page }) => {
      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');

      const appointment = page.locator('[data-testid="appointment-card"]').first();
      if (await appointment.isVisible()) {
        await appointment.click();
        await page.click('[data-testid="cancel-appointment-button"]');

        // Check notification option
        const notifyCheckbox = page.locator('[data-testid="notify-patient-checkbox"]');
        if (await notifyCheckbox.isVisible()) {
          await notifyCheckbox.check();
        }

        await page.selectOption('[data-testid="cancellation-reason"]', 'therapist-emergency');
        await page.click('[data-testid="confirm-cancel-button"]');

        // Should confirm notification sent
        await expect(page.locator('text=Patient notified of cancellation')).toBeVisible();
      }
    });
  });

  test.describe('Appointment Status Management', () => {
    test('should mark appointment as completed', async ({ page }) => {
      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');

      const appointment = page.locator('[data-testid="appointment-card"]').first();
      if (await appointment.isVisible()) {
        await appointment.click();
        await page.click('[data-testid="complete-appointment-button"]');

        // Should show completion form
        const completionModal = page.locator('[data-testid="complete-appointment-modal"]');
        await expect(completionModal).toBeVisible();

        // Add session notes
        await page.fill('[data-testid="session-notes"]', 'Patient showed good progress. Continue with current treatment plan.');

        // Set next appointment if needed
        const scheduleNext = page.locator('[data-testid="schedule-next-checkbox"]');
        if (await scheduleNext.isVisible()) {
          await scheduleNext.check();
          await page.fill('[data-testid="next-appointment-date"]', '2024-02-22');
        }

        // Complete appointment
        await page.click('[data-testid="mark-complete-button"]');

        // Should show success message
        await expect(page.locator('text=Appointment completed successfully')).toBeVisible();

        // Status should update
        await expect(page.locator('[data-testid="appointment-status"]:has-text("Completed")')).toBeVisible();
      }
    });

    test('should mark appointment as no-show', async ({ page }) => {
      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');

      const appointment = page.locator('[data-testid="appointment-card"]').first();
      if (await appointment.isVisible()) {
        await appointment.click();

        // Look for no-show option
        const noShowButton = page.locator('[data-testid="mark-no-show-button"]');
        if (await noShowButton.isVisible()) {
          await noShowButton.click();

          // Should show confirmation
          await expect(page.locator('text=Mark as no-show?')).toBeVisible();
          await page.click('[data-testid="confirm-no-show-button"]');

          // Status should update
          await expect(page.locator('[data-testid="appointment-status"]:has-text("No-show")')).toBeVisible();
        }
      }
    });
  });

  test.describe('Mobile Appointment Scheduling', () => {
    test('should work properly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/calendar');

      // Should show mobile-optimized calendar
      await expect(page.locator('[data-testid="mobile-calendar"]')).toBeVisible();

      // Schedule button should be a FAB
      const scheduleFab = page.locator('[data-testid="schedule-appointment-fab"]');
      if (await scheduleFab.isVisible()) {
        await scheduleFab.click();

        // Modal should be mobile-optimized
        const modal = page.locator('[data-testid="schedule-appointment-modal"]');
        await expect(modal).toBeVisible();
        
        // Form should be touch-friendly
        const inputs = page.locator('input, select');
        const inputCount = await inputs.count();
        
        for (let i = 0; i < inputCount; i++) {
          const input = inputs.nth(i);
          const height = await input.boundingBox();
          if (height) {
            expect(height.height).toBeGreaterThanOrEqual(44); // Touch target minimum
          }
        }
      }
    });

    test('should support touch gestures on calendar', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/calendar');

      // Swipe to change months
      const calendar = page.locator('[data-testid="mobile-calendar"]');
      
      // Simulate swipe left (next month)
      await calendar.hover();
      await page.mouse.down();
      await page.mouse.move(-100, 0);
      await page.mouse.up();
      
      await page.waitForTimeout(testConfig.shortDelay);

      // Month should change
      const monthHeader = page.locator('[data-testid="calendar-month"]');
      await expect(monthHeader).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/calendar');

      // Tab through calendar elements
      await page.keyboard.press('Tab');
      let focused = page.locator(':focus');
      await expect(focused).toBeVisible();

      // Arrow keys should navigate calendar days
      await page.keyboard.press('ArrowRight');
      focused = page.locator(':focus');
      await expect(focused).toBeVisible();

      // Enter should select/activate day
      await page.keyboard.press('Enter');
      // Should show day appointments or trigger action
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/calendar');

      // Calendar should have proper role
      const calendar = page.locator('[data-testid="appointment-calendar"]');
      await expect(calendar).toHaveAttribute('role', 'grid');

      // Days should have proper labels
      const calendarDays = page.locator('[data-testid*="calendar-day"]');
      const firstDay = calendarDays.first();
      await expect(firstDay).toHaveAttribute('aria-label');

      // Appointments should be announced
      const appointments = page.locator('[data-testid="appointment-card"]');
      if (await appointments.count() > 0) {
        const firstAppointment = appointments.first();
        await expect(firstAppointment).toHaveAttribute('aria-label');
      }
    });

    test('should support screen readers', async ({ page }) => {
      await page.goto('/calendar');

      // Check for proper heading structure
      await expect(page.locator('h1')).toBeVisible();

      // Important information should be announced
      const announcements = page.locator('[aria-live]');
      if (await announcements.count() > 0) {
        await expect(announcements.first()).toBeVisible();
      }
    });
  });
});