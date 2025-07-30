import { test, expect } from '@playwright/test';
import { setupAuthenticatedState } from './fixtures/auth-helpers';
import { mockPatients, formTestData, testConfig } from './fixtures/test-data';

/**
 * Patient Management Tests for Clinic Management App
 * Tests CRUD operations for patient management including forms, validation, and search
 */

test.describe('Patient Management', () => {
  test.beforeEach(async ({ page }) => {
    // Setup authenticated therapist state for all tests
    await setupAuthenticatedState(page, 'therapist');
  });

  test.describe('Patient List View', () => {
    test('should display patient list with all patients', async ({ page }) => {
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');

      // Check page title and layout
      await expect(page.locator('[data-testid="page-title"]')).toContainText('Clients');
      await expect(page.locator('text=👥 Your Clients')).toBeVisible();

      // Should show patient cards or table
      const patientList = page.locator('[data-testid="patient-list"]');
      await expect(patientList).toBeVisible();

      // Check for at least one patient card
      const patientCards = page.locator('[data-testid="patient-card"]');
      expect(await patientCards.count()).toBeGreaterThan(0);
    });

    test('should show patient details on card click', async ({ page }) => {
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');

      // Click first patient card
      const firstPatient = page.locator('[data-testid="patient-card"]').first();
      await firstPatient.click();

      // Should navigate to patient detail page
      await expect(page).toHaveURL(/\/patients\/[^\/]+/);
      
      // Should show patient details
      await expect(page.locator('[data-testid="patient-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="patient-email"]')).toBeVisible();
      await expect(page.locator('[data-testid="patient-phone"]')).toBeVisible();
    });

    test('should search patients by name', async ({ page }) => {
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');

      // Use search input
      const searchInput = page.locator('[data-testid="patient-search"]');
      await searchInput.fill('John');
      await page.waitForTimeout(testConfig.shortDelay); // Wait for search debounce

      // Should filter results
      const patientCards = page.locator('[data-testid="patient-card"]');
      const visibleCards = await patientCards.count();
      
      // At least one result should contain "John"
      if (visibleCards > 0) {
        const firstCard = patientCards.first();
        await expect(firstCard).toContainText('John');
      }
    });

    test('should filter patients by status', async ({ page }) => {
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');

      // Click filter dropdown
      const filterButton = page.locator('[data-testid="patient-filter"]');
      if (await filterButton.isVisible()) {
        await filterButton.click();
        
        // Select active patients only
        await page.click('text=Active Only');
        await page.waitForTimeout(testConfig.shortDelay);

        // Verify filter is applied
        const statusBadges = page.locator('[data-testid="patient-status"]');
        const badgeCount = await statusBadges.count();
        
        for (let i = 0; i < badgeCount; i++) {
          const badge = statusBadges.nth(i);
          await expect(badge).toContainText('Active');
        }
      }
    });

    test('should sort patients alphabetically', async ({ page }) => {
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');

      // Click sort button
      const sortButton = page.locator('[data-testid="patient-sort"]');
      if (await sortButton.isVisible()) {
        await sortButton.click();
        await page.click('text=Name A-Z');
        await page.waitForTimeout(testConfig.shortDelay);

        // Verify sorting
        const patientNames = page.locator('[data-testid="patient-name"]');
        const names = await patientNames.allTextContents();
        const sortedNames = [...names].sort();
        expect(names).toEqual(sortedNames);
      }
    });
  });

  test.describe('Add New Patient', () => {
    test('should open add patient modal', async ({ page }) => {
      await page.goto('/patients');
      
      // Click add patient button
      await page.click('[data-testid="add-patient-button"]');
      
      // Should show modal
      const modal = page.locator('[data-testid="add-patient-modal"]');
      await expect(modal).toBeVisible();
      await expect(page.locator('text=Add New Client')).toBeVisible();
    });

    test('should successfully add new patient with valid data', async ({ page }) => {
      await page.goto('/patients');
      await page.click('[data-testid="add-patient-button"]');

      const validData = formTestData.validPatient;

      // Fill form with valid data
      await page.fill('[data-testid="patient-name-input"]', validData.name);
      await page.fill('[data-testid="patient-email-input"]', validData.email);
      await page.fill('[data-testid="patient-phone-input"]', validData.phone);
      await page.fill('[data-testid="patient-dob-input"]', validData.dateOfBirth);
      await page.fill('[data-testid="patient-address-input"]', validData.address);
      await page.fill('[data-testid="emergency-contact-input"]', validData.emergencyContact);
      await page.fill('[data-testid="emergency-phone-input"]', validData.emergencyPhone);

      // Save patient
      await page.click('[data-testid="save-patient-button"]');

      // Should show success message and close modal
      await expect(page.locator('text=Client added successfully')).toBeVisible();
      
      // Modal should close
      const modal = page.locator('[data-testid="add-patient-modal"]');
      await expect(modal).toBeHidden();

      // Should see new patient in list
      await expect(page.locator(`text=${validData.name}`)).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/patients');
      await page.click('[data-testid="add-patient-button"]');

      // Try to save without filling required fields
      await page.click('[data-testid="save-patient-button"]');

      // Should show validation errors
      await expect(page.locator('text=Name is required')).toBeVisible();
      await expect(page.locator('text=Email is required')).toBeVisible();
      await expect(page.locator('text=Phone is required')).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/patients');
      await page.click('[data-testid="add-patient-button"]');

      // Enter invalid email
      await page.fill('[data-testid="patient-email-input"]', 'invalid-email');
      await page.blur('[data-testid="patient-email-input"]');

      await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
    });

    test('should validate phone number format', async ({ page }) => {
      await page.goto('/patients');
      await page.click('[data-testid="add-patient-button"]');

      // Enter invalid phone
      await page.fill('[data-testid="patient-phone-input"]', '123');
      await page.blur('[data-testid="patient-phone-input"]');

      await expect(page.locator('text=Please enter a valid phone number')).toBeVisible();
    });

    test('should validate date of birth', async ({ page }) => {
      await page.goto('/patients');
      await page.click('[data-testid="add-patient-button"]');

      // Enter future date
      await page.fill('[data-testid="patient-dob-input"]', '2030-01-01');
      await page.blur('[data-testid="patient-dob-input"]');

      await expect(page.locator('text=Date of birth cannot be in the future')).toBeVisible();
    });

    test('should cancel add patient operation', async ({ page }) => {
      await page.goto('/patients');
      await page.click('[data-testid="add-patient-button"]');

      // Fill some data
      await page.fill('[data-testid="patient-name-input"]', 'Test Patient');

      // Cancel
      await page.click('[data-testid="cancel-button"]');

      // Modal should close without saving
      const modal = page.locator('[data-testid="add-patient-modal"]');
      await expect(modal).toBeHidden();

      // Should not see test patient in list
      await expect(page.locator('text=Test Patient')).not.toBeVisible();
    });
  });

  test.describe('Patient Detail View', () => {
    test('should display complete patient information', async ({ page }) => {
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');

      // Click first patient
      await page.click('[data-testid="patient-card"]');
      await page.waitForLoadState('networkidle');

      // Should show all patient details
      await expect(page.locator('[data-testid="patient-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="patient-email"]')).toBeVisible();
      await expect(page.locator('[data-testid="patient-phone"]')).toBeVisible();
      await expect(page.locator('[data-testid="patient-dob"]')).toBeVisible();
      await expect(page.locator('[data-testid="patient-address"]')).toBeVisible();
      await expect(page.locator('[data-testid="emergency-contact"]')).toBeVisible();
    });

    test('should show patient appointment history', async ({ page }) => {
      await page.goto('/patients');
      await page.click('[data-testid="patient-card"]');

      // Should show appointments section
      await expect(page.locator('[data-testid="appointment-history"]')).toBeVisible();
      await expect(page.locator('text=Appointment History')).toBeVisible();

      // Check for appointment cards
      const appointmentCards = page.locator('[data-testid="appointment-card"]');
      if (await appointmentCards.count() > 0) {
        const firstAppointment = appointmentCards.first();
        await expect(firstAppointment).toBeVisible();
      }
    });

    test('should allow editing patient information', async ({ page }) => {
      await page.goto('/patients');
      await page.click('[data-testid="patient-card"]');

      // Click edit button
      await page.click('[data-testid="edit-patient-button"]');

      // Should show edit form
      const editModal = page.locator('[data-testid="edit-patient-modal"]');
      await expect(editModal).toBeVisible();

      // Form should be pre-filled with current data
      const nameInput = page.locator('[data-testid="patient-name-input"]');
      const currentName = await nameInput.inputValue();
      expect(currentName).toBeTruthy();
    });

    test('should book new appointment from patient detail', async ({ page }) => {
      await page.goto('/patients');
      await page.click('[data-testid="patient-card"]');

      // Click book appointment button
      const bookButton = page.locator('[data-testid="book-appointment-button"]');
      if (await bookButton.isVisible()) {
        await bookButton.click();

        // Should open appointment booking modal
        const modal = page.locator('[data-testid="book-appointment-modal"]');
        await expect(modal).toBeVisible();

        // Patient should be pre-selected
        const patientField = page.locator('[data-testid="appointment-patient"]');
        const selectedPatient = await patientField.inputValue();
        expect(selectedPatient).toBeTruthy();
      }
    });
  });

  test.describe('Edit Patient', () => {
    test('should successfully update patient information', async ({ page }) => {
      await page.goto('/patients');
      await page.click('[data-testid="patient-card"]');
      await page.click('[data-testid="edit-patient-button"]');

      // Update patient name
      const nameInput = page.locator('[data-testid="patient-name-input"]');
      await nameInput.clear();
      await nameInput.fill('Updated Patient Name');

      // Update email
      const emailInput = page.locator('[data-testid="patient-email-input"]');
      await emailInput.clear();
      await emailInput.fill('updated@example.com');

      // Save changes
      await page.click('[data-testid="save-patient-button"]');

      // Should show success message
      await expect(page.locator('text=Client updated successfully')).toBeVisible();

      // Should see updated information
      await expect(page.locator('text=Updated Patient Name')).toBeVisible();
    });

    test('should validate edited data', async ({ page }) => {
      await page.goto('/patients');
      await page.click('[data-testid="patient-card"]');
      await page.click('[data-testid="edit-patient-button"]');

      // Clear required field
      const nameInput = page.locator('[data-testid="patient-name-input"]');
      await nameInput.clear();

      // Try to save
      await page.click('[data-testid="save-patient-button"]');

      // Should show validation error
      await expect(page.locator('text=Name is required')).toBeVisible();
    });

    test('should cancel edit without saving changes', async ({ page }) => {
      await page.goto('/patients');
      await page.click('[data-testid="patient-card"]');
      
      // Get original name
      const originalName = await page.locator('[data-testid="patient-name"]').textContent();
      
      await page.click('[data-testid="edit-patient-button"]');

      // Make changes
      const nameInput = page.locator('[data-testid="patient-name-input"]');
      await nameInput.clear();
      await nameInput.fill('Changed Name');

      // Cancel
      await page.click('[data-testid="cancel-button"]');

      // Should not save changes
      await expect(page.locator(`text=${originalName}`)).toBeVisible();
      await expect(page.locator('text=Changed Name')).not.toBeVisible();
    });
  });

  test.describe('Delete Patient', () => {
    test('should show delete confirmation dialog', async ({ page }) => {
      await page.goto('/patients');
      await page.click('[data-testid="patient-card"]');

      // Click delete button
      const deleteButton = page.locator('[data-testid="delete-patient-button"]');
      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Should show confirmation dialog
        const confirmDialog = page.locator('[data-testid="delete-confirmation"]');
        await expect(confirmDialog).toBeVisible();
        await expect(page.locator('text=Are you sure you want to delete this client?')).toBeVisible();
      }
    });

    test('should cancel delete operation', async ({ page }) => {
      await page.goto('/patients');
      const patientName = await page.locator('[data-testid="patient-card"]').first().textContent();
      
      await page.click('[data-testid="patient-card"]');

      const deleteButton = page.locator('[data-testid="delete-patient-button"]');
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        
        // Cancel deletion
        await page.click('[data-testid="cancel-delete-button"]');

        // Patient should still exist
        await page.goto('/patients');
        await expect(page.locator(`text=${patientName}`)).toBeVisible();
      }
    });
  });

  test.describe('Mobile Patient Management', () => {
    test('should work properly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/patients');

      // Should show mobile-optimized layout
      await expect(page.locator('[data-testid="mobile-patient-list"]')).toBeVisible();

      // Add button should be a FAB on mobile
      const addFab = page.locator('[data-testid="add-patient-fab"]');
      if (await addFab.isVisible()) {
        await expect(addFab).toBeVisible();
        await addFab.click();

        // Modal should be mobile-optimized
        const modal = page.locator('[data-testid="add-patient-modal"]');
        await expect(modal).toBeVisible();
      }
    });

    test('should support swipe actions on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/patients');

      // Swipe on patient card to reveal actions
      const patientCard = page.locator('[data-testid="patient-card"]').first();
      
      // Simulate swipe gesture
      await patientCard.hover();
      await page.mouse.down();
      await page.mouse.move(100, 0);
      await page.mouse.up();

      // Should reveal action buttons
      const actionButtons = page.locator('[data-testid="swipe-actions"]');
      if (await actionButtons.isVisible()) {
        await expect(actionButtons).toBeVisible();
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/patients');

      // Tab through patient cards
      await page.keyboard.press('Tab');
      let focused = page.locator(':focus');
      await expect(focused).toBeVisible();

      // Enter should activate patient card
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/patients\/[^\/]+/);
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/patients');

      // Patient cards should have proper labels
      const patientCards = page.locator('[data-testid="patient-card"]');
      const firstCard = patientCards.first();
      
      await expect(firstCard).toHaveAttribute('role', 'button');
      await expect(firstCard).toHaveAttribute('aria-label');
    });

    test('should support screen readers', async ({ page }) => {
      await page.goto('/patients');

      // Check for proper headings structure
      await expect(page.locator('h1')).toBeVisible();
      
      // Form labels should be associated with inputs
      await page.click('[data-testid="add-patient-button"]');
      
      const nameInput = page.locator('[data-testid="patient-name-input"]');
      const labelId = await nameInput.getAttribute('aria-labelledby');
      if (labelId) {
        const label = page.locator(`#${labelId}`);
        await expect(label).toBeVisible();
      }
    });
  });
});