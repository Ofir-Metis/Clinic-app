import { test, expect, Page, Browser } from '@playwright/test';

/**
 * Healthcare-Specific Workflow Tests
 * 
 * This test suite focuses on healthcare-specific workflows and compliance:
 * - Patient care workflows
 * - HIPAA compliance validation
 * - Emergency procedures
 * - Clinical documentation
 * - Provider-patient interactions
 * - Healthcare data security
 */

interface HealthcareWorkflowConfig {
  baseURL: string;
  apiURL: string;
  hipaaCompliance: boolean;
  emergencyFeatures: boolean;
  clinicalDocumentation: boolean;
}

const HEALTHCARE_CONFIG: HealthcareWorkflowConfig = {
  baseURL: 'http://localhost:5173',
  apiURL: 'http://localhost:4000',
  hipaaCompliance: true,
  emergencyFeatures: true,
  clinicalDocumentation: true
};

test.describe('🏥 Healthcare Workflow Tests', () => {
  test.setTimeout(300000); // 5 minutes for complex workflows

  test.describe('👨‍⚕️ Clinical Care Workflows', () => {
    test('should complete patient intake and assessment workflow', async ({ page }) => {
      await page.goto(`${HEALTHCARE_CONFIG.baseURL}/therapist/login`);
      
      // Therapist login
      await page.fill('[data-testid="email-input"]', 'therapist1@clinic-test.com');
      await page.fill('[data-testid="password-input"]', 'therapist1Pass123!');
      await page.click('[data-testid="login-button"]');
      
      // Navigate to patient intake
      await page.click('[data-testid="patient-intake-button"]');
      
      // Complete patient intake form
      await page.fill('[data-testid="patient-first-name"]', 'Sarah');
      await page.fill('[data-testid="patient-last-name"]', 'Johnson');
      await page.fill('[data-testid="patient-dob"]', '1985-03-15');
      await page.fill('[data-testid="patient-phone"]', '+1-555-0199');
      await page.fill('[data-testid="patient-email"]', 'sarah.johnson@email.com');
      
      // Medical history
      await page.fill('[data-testid="medical-history"]', 'No significant medical history');
      await page.fill('[data-testid="current-medications"]', 'None');
      await page.fill('[data-testid="allergies"]', 'No known allergies');
      
      // Emergency contact
      await page.fill('[data-testid="emergency-contact-name"]', 'John Johnson');
      await page.fill('[data-testid="emergency-contact-phone"]', '+1-555-0200');
      await page.fill('[data-testid="emergency-contact-relationship"]', 'Spouse');
      
      // Insurance information
      await page.fill('[data-testid="insurance-provider"]', 'Blue Cross');
      await page.fill('[data-testid="insurance-id"]', 'BC123456789');
      
      // Submit intake form
      await page.click('[data-testid="submit-intake-button"]');
      
      // Verify patient created and redirected to assessment
      await expect(page).toHaveURL(/\/therapist\/assessment/);
      await expect(page.locator('[data-testid="patient-assessment-form"]')).toBeVisible();
      
      // Complete initial assessment
      await page.selectOption('[data-testid="wellness-level"]', '7');
      await page.fill('[data-testid="primary-concerns"]', 'Stress management and work-life balance');
      await page.fill('[data-testid="therapy-goals"]', 'Develop coping strategies and improve well-being');
      
      // Save assessment
      await page.click('[data-testid="save-assessment-button"]');
      await expect(page.locator('[data-testid="assessment-saved-message"]')).toBeVisible();
    });

    test('should handle session documentation workflow', async ({ page }) => {
      // Login as therapist
      await loginAsTherapist(page);
      
      // Navigate to today's sessions
      await page.click('[data-testid="todays-sessions"]');
      await page.click('[data-testid="session-card"]').first();
      
      // Start session documentation
      await page.click('[data-testid="document-session-button"]');
      
      // Session details
      await page.fill('[data-testid="session-date"]', new Date().toISOString().split('T')[0]);
      await page.selectOption('[data-testid="session-type"]', 'individual-therapy');
      await page.fill('[data-testid="session-duration"]', '50');
      
      // Clinical notes
      await page.fill('[data-testid="session-notes"]', `
        Session focused on stress management techniques.
        Client reported improved mood since last session.
        Practiced mindfulness exercises and discussed coping strategies.
        Homework: Daily meditation practice for 10 minutes.
        Next session: Continue working on work-life balance.
      `);
      
      // Progress assessment
      await page.selectOption('[data-testid="client-progress"]', 'improving');
      await page.fill('[data-testid="progress-notes"]', 'Client showing positive response to interventions');
      
      // Treatment plan updates
      await page.fill('[data-testid="treatment-plan-updates"]', 'Continue current approach, add relaxation techniques');
      
      // Risk assessment
      await page.selectOption('[data-testid="risk-level"]', 'low');
      await page.fill('[data-testid="risk-notes"]', 'No safety concerns identified');
      
      // Save session documentation
      await page.click('[data-testid="save-session-notes-button"]');
      await expect(page.locator('[data-testid="session-saved-message"]')).toBeVisible();
      
      // Verify documentation appears in client record
      await page.click('[data-testid="view-client-record"]');
      await expect(page.locator('[data-testid="session-history"]')).toContainText('stress management techniques');
    });

    test('should handle treatment plan development', async ({ page }) => {
      await loginAsTherapist(page);
      
      // Access client's treatment plan
      await page.goto(`${HEALTHCARE_CONFIG.baseURL}/therapist/clients`);
      await page.click('[data-testid="client-card"]').first();
      await page.click('[data-testid="treatment-plan-tab"]');
      
      // Create new treatment plan
      await page.click('[data-testid="create-treatment-plan-button"]');
      
      // Treatment goals
      await page.fill('[data-testid="primary-goal-1"]', 'Reduce anxiety symptoms by 50%');
      await page.fill('[data-testid="primary-goal-2"]', 'Improve sleep quality');
      await page.fill('[data-testid="primary-goal-3"]', 'Enhance coping skills');
      
      // Interventions
      await page.fill('[data-testid="intervention-1"]', 'Cognitive Behavioral Therapy techniques');
      await page.fill('[data-testid="intervention-2"]', 'Mindfulness and relaxation training');
      await page.fill('[data-testid="intervention-3"]', 'Sleep hygiene education');
      
      // Timeline and frequency
      await page.selectOption('[data-testid="session-frequency"]', 'weekly');
      await page.fill('[data-testid="estimated-duration"]', '12 weeks');
      
      // Success metrics
      await page.fill('[data-testid="success-metrics"]', 'Reduced anxiety scores, improved sleep diary ratings');
      
      // Save treatment plan
      await page.click('[data-testid="save-treatment-plan-button"]');
      await expect(page.locator('[data-testid="treatment-plan-saved"]')).toBeVisible();
      
      // Verify treatment plan is accessible
      await expect(page.locator('[data-testid="active-treatment-plan"]')).toBeVisible();
    });
  });

  test.describe('🔐 HIPAA Compliance Workflows', () => {
    test('should validate patient consent and privacy workflows', async ({ page }) => {
      await loginAsTherapist(page);
      
      // Access patient consent management
      await page.goto(`${HEALTHCARE_CONFIG.baseURL}/therapist/compliance/consent`);
      
      // Create new consent form
      await page.click('[data-testid="new-consent-form"]');
      
      // Patient information
      await page.fill('[data-testid="patient-name"]', 'Sarah Johnson');
      await page.fill('[data-testid="consent-date"]', new Date().toISOString().split('T')[0]);
      
      // Consent checkboxes
      await page.check('[data-testid="consent-treatment"]');
      await page.check('[data-testid="consent-communication"]');
      await page.check('[data-testid="consent-sharing"]');
      
      // Privacy preferences
      await page.selectOption('[data-testid="communication-method"]', 'secure-portal');
      await page.check('[data-testid="consent-electronic-records"]');
      
      // Signature
      await page.fill('[data-testid="electronic-signature"]', 'Sarah Johnson');
      await page.fill('[data-testid="signature-date"]', new Date().toISOString().split('T')[0]);
      
      // Save consent form
      await page.click('[data-testid="save-consent-form"]');
      await expect(page.locator('[data-testid="consent-saved-message"]')).toBeVisible();
      
      // Verify consent is recorded in audit log
      await page.click('[data-testid="audit-log-tab"]');
      await expect(page.locator('[data-testid="consent-audit-entry"]')).toBeVisible();
    });

    test('should handle data access and sharing requests', async ({ page }) => {
      await loginAsTherapist(page);
      
      // Navigate to data sharing requests
      await page.goto(`${HEALTHCARE_CONFIG.baseURL}/therapist/compliance/data-sharing`);
      
      // Process data access request
      await page.click('[data-testid="pending-request"]').first();
      
      // Review request details
      await expect(page.locator('[data-testid="request-details"]')).toBeVisible();
      await expect(page.locator('[data-testid="requested-data-types"]')).toBeVisible();
      
      // Verify patient authorization
      await page.click('[data-testid="verify-authorization-button"]');
      await expect(page.locator('[data-testid="authorization-status"]')).toContainText('Valid');
      
      // Approve or deny request
      await page.selectOption('[data-testid="request-decision"]', 'approved');
      await page.fill('[data-testid="decision-notes"]', 'Patient authorization verified, sharing approved');
      
      // Process request
      await page.click('[data-testid="process-request-button"]');
      await expect(page.locator('[data-testid="request-processed-message"]')).toBeVisible();
    });

    test('should validate audit trail functionality', async ({ page }) => {
      await loginAsTherapist(page);
      
      // Perform actions that should be audited
      await page.goto(`${HEALTHCARE_CONFIG.baseURL}/therapist/clients`);
      await page.click('[data-testid="client-card"]').first();
      
      // View patient record (should be audited)
      await page.click('[data-testid="view-full-record"]');
      
      // Edit patient information (should be audited)
      await page.click('[data-testid="edit-patient-info"]');
      await page.fill('[data-testid="patient-phone"]', '+1-555-0299');
      await page.click('[data-testid="save-patient-info"]');
      
      // Access audit trail
      await page.goto(`${HEALTHCARE_CONFIG.baseURL}/therapist/compliance/audit`);
      
      // Verify actions are logged
      await expect(page.locator('[data-testid="audit-entry"]')).toContainText('Patient record accessed');
      await expect(page.locator('[data-testid="audit-entry"]')).toContainText('Patient information updated');
      
      // Verify audit entry details
      await page.click('[data-testid="audit-entry"]').first();
      await expect(page.locator('[data-testid="audit-details"]')).toBeVisible();
      await expect(page.locator('[data-testid="audit-timestamp"]')).toBeVisible();
      await expect(page.locator('[data-testid="audit-user"]')).toBeVisible();
      await expect(page.locator('[data-testid="audit-action"]')).toBeVisible();
    });
  });

  test.describe('🚨 Emergency Procedures', () => {
    test('should handle mental health crisis workflows', async ({ page }) => {
      await loginAsTherapist(page);
      
      // Navigate to crisis assessment
      await page.goto(`${HEALTHCARE_CONFIG.baseURL}/therapist/crisis-assessment`);
      
      // Start crisis assessment
      await page.click('[data-testid="start-crisis-assessment"]');
      
      // Patient identification
      await page.fill('[data-testid="patient-name"]', 'Sarah Johnson');
      await page.fill('[data-testid="assessment-date"]', new Date().toISOString().split('T')[0]);
      
      // Risk factors assessment
      await page.check('[data-testid="risk-suicidal-ideation"]');
      await page.selectOption('[data-testid="suicide-risk-level"]', 'moderate');
      await page.fill('[data-testid="risk-details"]', 'Patient expressed thoughts of self-harm');
      
      // Immediate safety measures
      await page.check('[data-testid="safety-plan-created"]');
      await page.check('[data-testid="emergency-contacts-notified"]');
      await page.fill('[data-testid="safety-measures"]', 'Removed potential means, 24/7 supervision arranged');
      
      // Crisis intervention actions
      await page.check('[data-testid="crisis-counseling-provided"]');
      await page.check('[data-testid="psychiatric-consultation"]');
      await page.selectOption('[data-testid="intervention-outcome"]', 'stabilized');
      
      // Follow-up plan
      await page.fill('[data-testid="followup-plan"]', 'Daily check-ins for 1 week, psychiatrist appointment scheduled');
      await page.fill('[data-testid="next-appointment"]', '2024-01-02');
      
      // Submit crisis assessment
      await page.click('[data-testid="submit-crisis-assessment"]');
      await expect(page.locator('[data-testid="crisis-assessment-submitted"]')).toBeVisible();
      
      // Verify emergency notification sent
      await expect(page.locator('[data-testid="emergency-notification-sent"]')).toBeVisible();
    });

    test('should test emergency contact system', async ({ page }) => {
      await loginAsTherapist(page);
      
      // Access emergency contacts
      await page.goto(`${HEALTHCARE_CONFIG.baseURL}/therapist/emergency-contacts`);
      
      // Test emergency alert system
      await page.click('[data-testid="test-emergency-alert"]');
      
      // Verify alert options
      await expect(page.locator('[data-testid="alert-options"]')).toBeVisible();
      await page.selectOption('[data-testid="alert-type"]', 'mental-health-crisis');
      await page.fill('[data-testid="alert-message"]', 'Test emergency alert - patient crisis situation');
      
      // Send test alert
      await page.click('[data-testid="send-test-alert"]');
      await expect(page.locator('[data-testid="alert-sent-confirmation"]')).toBeVisible();
      
      // Verify emergency response workflow
      await page.click('[data-testid="emergency-response-tab"]');
      await expect(page.locator('[data-testid="response-protocol"]')).toBeVisible();
    });
  });

  test.describe('📊 Clinical Documentation', () => {
    test('should validate progress note requirements', async ({ page }) => {
      await loginAsTherapist(page);
      
      // Access progress notes
      await page.goto(`${HEALTHCARE_CONFIG.baseURL}/therapist/progress-notes`);
      
      // Create comprehensive progress note
      await page.click('[data-testid="new-progress-note"]');
      
      // SOAP note format
      await page.fill('[data-testid="subjective-section"]', `
        Patient reports feeling more optimistic this week.
        Sleep has improved with new bedtime routine.
        Still experiencing some work-related stress.
      `);
      
      await page.fill('[data-testid="objective-section"]', `
        Patient appeared alert and engaged during session.
        Good eye contact, appropriate affect.
        Completed homework assignments.
      `);
      
      await page.fill('[data-testid="assessment-section"]', `
        Patient showing positive response to CBT interventions.
        Anxiety symptoms decreased from 8/10 to 5/10.
        Improved coping with work stressors.
      `);
      
      await page.fill('[data-testid="plan-section"]', `
        Continue weekly CBT sessions.
        Introduce advanced relaxation techniques.
        Schedule follow-up in 1 week.
      `);
      
      // Clinical measurements
      await page.selectOption('[data-testid="anxiety-level"]', '5');
      await page.selectOption('[data-testid="mood-rating"]', '7');
      await page.selectOption('[data-testid="functioning-level"]', 'improved');
      
      // Treatment goals progress
      await page.selectOption('[data-testid="goal-1-progress"]', 'on-track');
      await page.selectOption('[data-testid="goal-2-progress"]', 'achieved');
      await page.selectOption('[data-testid="goal-3-progress"]', 'needs-attention');
      
      // Save progress note
      await page.click('[data-testid="save-progress-note"]');
      await expect(page.locator('[data-testid="progress-note-saved"]')).toBeVisible();
      
      // Verify note meets documentation requirements
      await page.click('[data-testid="validate-documentation"]');
      await expect(page.locator('[data-testid="documentation-valid"]')).toBeVisible();
    });

    test('should handle treatment outcome measurements', async ({ page }) => {
      await loginAsTherapist(page);
      
      // Access outcome measurements
      await page.goto(`${HEALTHCARE_CONFIG.baseURL}/therapist/outcome-measures`);
      
      // Complete standardized assessment
      await page.click('[data-testid="complete-assessment"]');
      
      // Select assessment tool
      await page.selectOption('[data-testid="assessment-tool"]', 'GAD-7');
      
      // Complete assessment questions
      const gadQuestions = await page.locator('[data-testid^="gad-question-"]').all();
      for (const question of gadQuestions) {
        await question.selectOption('1'); // Mild anxiety responses
      }
      
      // Submit assessment
      await page.click('[data-testid="submit-assessment"]');
      
      // View assessment results
      await expect(page.locator('[data-testid="assessment-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="severity-level"]')).toContainText('Mild');
      
      // Compare with previous assessments
      await page.click('[data-testid="view-progress-chart"]');
      await expect(page.locator('[data-testid="progress-chart"]')).toBeVisible();
      
      // Generate progress report
      await page.click('[data-testid="generate-progress-report"]');
      await expect(page.locator('[data-testid="progress-report"]')).toBeVisible();
    });
  });

  test.describe('🔄 Provider-Patient Communication', () => {
    test('should test secure messaging system', async ({ browser }) => {
      // Test secure communication between therapist and patient
      const therapistContext = await browser.newContext();
      const patientContext = await browser.newContext();
      const therapistPage = await therapistContext.newPage();
      const patientPage = await patientContext.newPage();
      
      try {
        // Therapist sends secure message
        await loginAsTherapist(therapistPage);
        await therapistPage.goto(`${HEALTHCARE_CONFIG.baseURL}/therapist/messages`);
        await therapistPage.click('[data-testid="compose-message"]');
        
        // Select patient recipient
        await therapistPage.selectOption('[data-testid="message-recipient"]', 'sarah.johnson@email.com');
        await therapistPage.fill('[data-testid="message-subject"]', 'Homework Assignment');
        await therapistPage.fill('[data-testid="message-content"]', `
          Hi Sarah,
          
          Great progress in our last session! Here's your homework for the week:
          1. Practice the breathing exercises daily
          2. Complete the mood tracking worksheet
          3. Try the relaxation technique before bedtime
          
          Let me know if you have any questions.
          
          Best regards,
          Dr. Smith
        `);
        
        // Send message
        await therapistPage.click('[data-testid="send-message"]');
        await expect(therapistPage.locator('[data-testid="message-sent"]')).toBeVisible();
        
        // Patient receives and responds
        await loginAsPatient(patientPage, 'sarah.johnson@email.com');
        await patientPage.goto(`${HEALTHCARE_CONFIG.baseURL}/patient/messages`);
        
        // Check for new message notification
        await expect(patientPage.locator('[data-testid="new-message-notification"]')).toBeVisible();
        
        // Read message
        await patientPage.click('[data-testid="unread-message"]').first();
        await expect(patientPage.locator('[data-testid="message-content"]')).toContainText('breathing exercises');
        
        // Reply to message
        await patientPage.click('[data-testid="reply-button"]');
        await patientPage.fill('[data-testid="reply-content"]', `
          Thank you, Dr. Smith! 
          
          I've been practicing the breathing exercises and they're really helpful.
          I have a question about the mood tracking - should I record it multiple times per day?
          
          Looking forward to our next session.
          
          Sarah
        `);
        
        await patientPage.click('[data-testid="send-reply"]');
        await expect(patientPage.locator('[data-testid="reply-sent"]')).toBeVisible();
        
        // Verify therapist receives reply
        await therapistPage.reload();
        await expect(therapistPage.locator('[data-testid="new-message-notification"]')).toBeVisible();
        
      } finally {
        await therapistContext.close();
        await patientContext.close();
      }
    });

    test('should validate appointment scheduling communications', async ({ page }) => {
      await loginAsTherapist(page);
      
      // Schedule appointment with automatic notifications
      await page.goto(`${HEALTHCARE_CONFIG.baseURL}/therapist/schedule`);
      await page.click('[data-testid="schedule-appointment"]');
      
      // Fill appointment details
      await page.selectOption('[data-testid="patient-select"]', 'sarah.johnson@email.com');
      await page.fill('[data-testid="appointment-date"]', '2024-01-15');
      await page.fill('[data-testid="appointment-time"]', '14:00');
      await page.selectOption('[data-testid="appointment-type"]', 'therapy-session');
      
      // Configure notifications
      await page.check('[data-testid="send-confirmation"]');
      await page.check('[data-testid="send-reminder-24h"]');
      await page.check('[data-testid="send-reminder-1h"]');
      
      // Schedule appointment
      await page.click('[data-testid="confirm-appointment"]');
      await expect(page.locator('[data-testid="appointment-scheduled"]')).toBeVisible();
      
      // Verify notification was sent
      await expect(page.locator('[data-testid="confirmation-sent"]')).toBeVisible();
      
      // Check communication log
      await page.click('[data-testid="communication-log"]');
      await expect(page.locator('[data-testid="notification-entry"]')).toContainText('Appointment confirmation sent');
    });
  });

  // Helper functions for healthcare workflows
  async function loginAsTherapist(page: Page) {
    await page.goto(`${HEALTHCARE_CONFIG.baseURL}/therapist/login`);
    await page.fill('[data-testid="email-input"]', 'therapist1@clinic-test.com');
    await page.fill('[data-testid="password-input"]', 'therapist1Pass123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/\/therapist/);
  }

  async function loginAsPatient(page: Page, email: string) {
    await page.goto(`${HEALTHCARE_CONFIG.baseURL}/patient/login`);
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', 'PatientPass123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/\/patient/);
  }
});