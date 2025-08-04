import { Page, expect } from '@playwright/test';
import { UserCredentials } from './user-credentials';

export class TherapistUITestSuite {
  private page: Page;
  private baseURL: string;

  constructor(page: Page, baseURL: string) {
    this.page = page;
    this.baseURL = baseURL;
  }

  /**
   * Logs in as a therapist user
   */
  async loginAsTherapist(therapist: UserCredentials): Promise<void> {
    console.log(`🔐 Logging in as therapist: ${therapist.email}`);
    
    await this.page.goto(`${this.baseURL}/login`);
    
    // Fill login form
    await this.page.fill('[data-testid="email-input"]', therapist.email);
    await this.page.fill('[data-testid="password-input"]', therapist.password);
    await this.page.click('[data-testid="login-button"]');
    
    // Wait for navigation to therapist dashboard
    await this.page.waitForURL('**/therapist/dashboard');
    
    // Verify login success
    await expect(this.page.locator('[data-testid="therapist-name"]')).toContainText(therapist.name);
    
    console.log(`✅ Successfully logged in as therapist: ${therapist.name}`);
  }

  /**
   * Tests therapist dashboard functionality
   */
  async testDashboardFunctionality(therapist: UserCredentials): Promise<void> {
    console.log('📊 Testing therapist dashboard functionality...');
    
    await this.loginAsTherapist(therapist);
    
    // Test dashboard elements
    await expect(this.page.locator('[data-testid="dashboard-title"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="client-count"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="upcoming-appointments"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="recent-sessions"]')).toBeVisible();
    
    // Test statistics widgets
    await expect(this.page.locator('[data-testid="total-clients-stat"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="sessions-this-week-stat"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="revenue-stat"]')).toBeVisible();
    
    // Test quick actions
    await expect(this.page.locator('[data-testid="new-session-button"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="schedule-appointment-button"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="view-calendar-button"]')).toBeVisible();
    
    console.log('✅ Dashboard functionality tests passed');
  }

  /**
   * Tests client management features
   */
  async testClientManagement(therapist: UserCredentials): Promise<void> {
    console.log('👥 Testing client management functionality...');
    
    await this.loginAsTherapist(therapist);
    
    // Navigate to clients page
    await this.page.click('[data-testid="clients-nav-link"]');
    await this.page.waitForURL('**/therapist/clients');
    
    // Test client list
    await expect(this.page.locator('[data-testid="clients-list"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="client-card"]').first()).toBeVisible();
    
    // Test search functionality
    await this.page.fill('[data-testid="client-search-input"]', 'test');
    await this.page.waitForTimeout(1000); // Wait for search debounce
    
    // Test client filters
    await this.page.click('[data-testid="filter-dropdown"]');
    await this.page.click('[data-testid="filter-active-clients"]');
    
    // Test sorting
    await this.page.click('[data-testid="sort-dropdown"]');
    await this.page.click('[data-testid="sort-by-name"]');
    
    // Test client profile view
    await this.page.click('[data-testid="client-card"]').first();
    await expect(this.page.locator('[data-testid="client-profile"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="client-goals"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="client-progress"]')).toBeVisible();
    
    console.log('✅ Client management tests passed');
  }

  /**
   * Tests appointment scheduling system
   */
  async testAppointmentScheduling(therapist: UserCredentials): Promise<void> {
    console.log('📅 Testing appointment scheduling system...');
    
    await this.loginAsTherapist(therapist);
    
    // Navigate to calendar
    await this.page.click('[data-testid="calendar-nav-link"]');
    await this.page.waitForURL('**/therapist/calendar');
    
    // Test calendar view
    await expect(this.page.locator('[data-testid="calendar-container"]')).toBeVisible();
    
    // Test creating new appointment
    await this.page.click('[data-testid="new-appointment-button"]');
    await expect(this.page.locator('[data-testid="appointment-modal"]')).toBeVisible();
    
    // Fill appointment form
    await this.page.click('[data-testid="client-select"]');
    await this.page.click('[data-testid="client-option"]').first();
    
    await this.page.fill('[data-testid="appointment-date"]', '2024-12-25');
    await this.page.fill('[data-testid="appointment-time"]', '14:00');
    
    await this.page.click('[data-testid="appointment-type-select"]');
    await this.page.click('[data-testid="video-call-option"]');
    
    await this.page.fill('[data-testid="appointment-notes"]', 'Test appointment scheduling');
    
    // Save appointment
    await this.page.click('[data-testid="save-appointment-button"]');
    await expect(this.page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Test calendar navigation
    await this.page.click('[data-testid="next-month-button"]');
    await this.page.click('[data-testid="prev-month-button"]');
    
    // Test week/day view switching
    await this.page.click('[data-testid="week-view-button"]');
    await this.page.click('[data-testid="day-view-button"]');
    await this.page.click('[data-testid="month-view-button"]');
    
    console.log('✅ Appointment scheduling tests passed');
  }

  /**
   * Tests session notes and recording functionality
   */
  async testSessionNotesAndRecording(therapist: UserCredentials): Promise<void> {
    console.log('📝 Testing session notes and recording...');
    
    await this.loginAsTherapist(therapist);
    
    // Navigate to sessions
    await this.page.click('[data-testid="sessions-nav-link"]');
    await this.page.waitForURL('**/therapist/sessions');
    
    // Test starting new session
    await this.page.click('[data-testid="new-session-button"]');
    await expect(this.page.locator('[data-testid="session-modal"]')).toBeVisible();
    
    // Select client for session
    await this.page.click('[data-testid="session-client-select"]');
    await this.page.click('[data-testid="session-client-option"]').first();
    
    await this.page.click('[data-testid="start-session-button"]');
    
    // Test session interface
    await expect(this.page.locator('[data-testid="session-interface"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="session-timer"]')).toBeVisible();
    
    // Test recording functionality
    await this.page.click('[data-testid="start-recording-button"]');
    await expect(this.page.locator('[data-testid="recording-indicator"]')).toBeVisible();
    
    await this.page.waitForTimeout(2000); // Simulate recording
    
    await this.page.click('[data-testid="stop-recording-button"]');
    
    // Test session notes
    await this.page.fill('[data-testid="session-notes-textarea"]', 'Test session notes with comprehensive details about the session progress and client insights.');
    
    // Test mood tracking
    await this.page.click('[data-testid="client-mood-select"]');
    await this.page.click('[data-testid="mood-option-positive"]');
    
    // Test session goals
    await this.page.click('[data-testid="add-session-goal"]');
    await this.page.fill('[data-testid="session-goal-input"]', 'Improve communication skills');
    
    // Test homework assignment
    await this.page.fill('[data-testid="homework-textarea"]', 'Practice mindfulness exercises daily');
    
    // Save session
    await this.page.click('[data-testid="save-session-button"]');
    await expect(this.page.locator('[data-testid="session-saved-message"]')).toBeVisible();
    
    console.log('✅ Session notes and recording tests passed');
  }

  /**
   * Tests AI session analysis features
   */
  async testAISessionAnalysis(therapist: UserCredentials): Promise<void> {
    console.log('🤖 Testing AI session analysis features...');
    
    await this.loginAsTherapist(therapist);
    
    // Navigate to AI analysis
    await this.page.click('[data-testid="ai-analysis-nav-link"]');
    await this.page.waitForURL('**/therapist/ai-analysis');
    
    // Test AI dashboard
    await expect(this.page.locator('[data-testid="ai-dashboard"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="session-insights"]')).toBeVisible();
    
    // Test session analysis request
    await this.page.click('[data-testid="analyze-session-button"]');
    await expect(this.page.locator('[data-testid="analysis-modal"]')).toBeVisible();
    
    // Select session for analysis
    await this.page.click('[data-testid="session-select"]');
    await this.page.click('[data-testid="session-option"]').first();
    
    await this.page.click('[data-testid="start-analysis-button"]');
    
    // Wait for analysis (mock)
    await this.page.waitForSelector('[data-testid="analysis-results"]', { timeout: 10000 });
    
    // Test analysis results
    await expect(this.page.locator('[data-testid="sentiment-analysis"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="key-insights"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="recommendations"]')).toBeVisible();
    
    // Test transcription features
    await this.page.click('[data-testid="transcription-tab"]');
    await expect(this.page.locator('[data-testid="session-transcript"]')).toBeVisible();
    
    // Test keyword extraction
    await expect(this.page.locator('[data-testid="extracted-keywords"]')).toBeVisible();
    
    console.log('✅ AI session analysis tests passed');
  }

  /**
   * Tests therapist billing dashboard
   */
  async testBillingDashboard(therapist: UserCredentials): Promise<void> {
    console.log('💳 Testing therapist billing dashboard...');
    
    await this.loginAsTherapist(therapist);
    
    // Navigate to billing
    await this.page.click('[data-testid="billing-nav-link"]');
    await this.page.waitForURL('**/therapist/billing');
    
    // Test billing overview
    await expect(this.page.locator('[data-testid="billing-overview"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="monthly-revenue"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="pending-payments"]')).toBeVisible();
    
    // Test invoices section
    await this.page.click('[data-testid="invoices-tab"]');
    await expect(this.page.locator('[data-testid="invoices-list"]')).toBeVisible();
    
    // Test creating new invoice
    await this.page.click('[data-testid="create-invoice-button"]');
    await expect(this.page.locator('[data-testid="invoice-modal"]')).toBeVisible();
    
    // Fill invoice details
    await this.page.click('[data-testid="invoice-client-select"]');
    await this.page.click('[data-testid="invoice-client-option"]').first();
    
    await this.page.fill('[data-testid="invoice-amount"]', '350');
    await this.page.fill('[data-testid="invoice-description"]', 'Coaching session - December 2024');
    
    await this.page.click('[data-testid="save-invoice-button"]');
    await expect(this.page.locator('[data-testid="invoice-created-message"]')).toBeVisible();
    
    // Test payment methods
    await this.page.click('[data-testid="payment-methods-tab"]');
    await expect(this.page.locator('[data-testid="payment-methods-list"]')).toBeVisible();
    
    console.log('✅ Billing dashboard tests passed');
  }

  /**
   * Tests therapist settings and profile management
   */
  async testSettingsAndProfile(therapist: UserCredentials): Promise<void> {
    console.log('⚙️ Testing settings and profile management...');
    
    await this.loginAsTherapist(therapist);
    
    // Navigate to settings
    await this.page.click('[data-testid="profile-menu"]');
    await this.page.click('[data-testid="settings-link"]');
    await this.page.waitForURL('**/therapist/settings');
    
    // Test profile settings
    await expect(this.page.locator('[data-testid="profile-settings"]')).toBeVisible();
    
    // Update profile information
    await this.page.fill('[data-testid="bio-textarea"]', 'Updated therapist bio for testing purposes');
    
    // Test specializations
    await this.page.click('[data-testid="add-specialization"]');
    await this.page.fill('[data-testid="specialization-input"]', 'Test Specialization');
    await this.page.click('[data-testid="save-specialization"]');
    
    // Test availability settings
    await this.page.click('[data-testid="availability-tab"]');
    await expect(this.page.locator('[data-testid="availability-calendar"]')).toBeVisible();
    
    // Set working hours
    await this.page.click('[data-testid="monday-checkbox"]');
    await this.page.fill('[data-testid="monday-start-time"]', '09:00');
    await this.page.fill('[data-testid="monday-end-time"]', '17:00');
    
    // Test notification preferences
    await this.page.click('[data-testid="notifications-tab"]');
    await this.page.check('[data-testid="email-notifications"]');
    await this.page.check('[data-testid="sms-notifications"]');
    await this.page.check('[data-testid="appointment-reminders"]');
    
    // Test language preferences
    await this.page.click('[data-testid="language-tab"]');
    await this.page.click('[data-testid="language-select"]');
    await this.page.click('[data-testid="language-english"]');
    
    // Save all settings
    await this.page.click('[data-testid="save-settings-button"]');
    await expect(this.page.locator('[data-testid="settings-saved-message"]')).toBeVisible();
    
    console.log('✅ Settings and profile tests passed');
  }

  /**
   * Tests calendar and Google integration
   */
  async testCalendarIntegration(therapist: UserCredentials): Promise<void> {
    console.log('📅 Testing calendar and Google integration...');
    
    await this.loginAsTherapist(therapist);
    
    // Navigate to integrations
    await this.page.click('[data-testid="integrations-nav-link"]');
    await this.page.waitForURL('**/therapist/integrations');
    
    // Test Google Calendar integration
    await expect(this.page.locator('[data-testid="google-calendar-section"]')).toBeVisible();
    
    // Test connection status
    const isConnected = await this.page.locator('[data-testid="google-connected-status"]').isVisible();
    
    if (!isConnected) {
      // Test Google OAuth flow
      await this.page.click('[data-testid="connect-google-button"]');
      // Note: In real testing, this would involve OAuth flow
      console.log('  Google OAuth connection would be tested here');
    }
    
    // Test calendar sync settings
    await this.page.click('[data-testid="sync-settings-tab"]');
    await this.page.check('[data-testid="auto-sync-appointments"]');
    await this.page.check('[data-testid="sync-availability"]');
    
    // Test Gmail integration
    await this.page.click('[data-testid="gmail-tab"]');
    await expect(this.page.locator('[data-testid="gmail-section"]')).toBeVisible();
    
    // Test email templates
    await this.page.click('[data-testid="email-templates-tab"]');
    await expect(this.page.locator('[data-testid="templates-list"]')).toBeVisible();
    
    console.log('✅ Calendar integration tests passed');
  }

  /**
   * Tests analytics and reporting features
   */
  async testAnalyticsAndReporting(therapist: UserCredentials): Promise<void> {
    console.log('📊 Testing analytics and reporting...');
    
    await this.loginAsTherapist(therapist);
    
    // Navigate to analytics
    await this.page.click('[data-testid="analytics-nav-link"]');
    await this.page.waitForURL('**/therapist/analytics');
    
    // Test analytics dashboard
    await expect(this.page.locator('[data-testid="analytics-dashboard"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="client-progress-chart"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="session-stats-chart"]')).toBeVisible();
    
    // Test date range selector
    await this.page.click('[data-testid="date-range-select"]');
    await this.page.click('[data-testid="last-30-days"]');
    
    // Test different chart types
    await this.page.click('[data-testid="chart-type-select"]');
    await this.page.click('[data-testid="bar-chart-option"]');
    
    // Test client performance metrics
    await this.page.click('[data-testid="client-metrics-tab"]');
    await expect(this.page.locator('[data-testid="client-progress-table"]')).toBeVisible();
    
    // Test report generation
    await this.page.click('[data-testid="generate-report-button"]');
    await expect(this.page.locator('[data-testid="report-modal"]')).toBeVisible();
    
    await this.page.click('[data-testid="report-type-select"]');
    await this.page.click('[data-testid="monthly-summary-option"]');
    
    await this.page.click('[data-testid="generate-button"]');
    await expect(this.page.locator('[data-testid="report-generated-message"]')).toBeVisible();
    
    console.log('✅ Analytics and reporting tests passed');
  }

  /**
   * Tests notification center functionality
   */
  async testNotificationCenter(therapist: UserCredentials): Promise<void> {
    console.log('🔔 Testing notification center...');
    
    await this.loginAsTherapist(therapist);
    
    // Test notification icon
    await expect(this.page.locator('[data-testid="notifications-icon"]')).toBeVisible();
    
    // Open notifications panel
    await this.page.click('[data-testid="notifications-icon"]');
    await expect(this.page.locator('[data-testid="notifications-panel"]')).toBeVisible();
    
    // Test notification categories
    await this.page.click('[data-testid="appointments-notifications"]');
    await this.page.click('[data-testid="clients-notifications"]');
    await this.page.click('[data-testid="system-notifications"]');
    
    // Test marking notifications as read
    const notifications = await this.page.locator('[data-testid="notification-item"]').count();
    if (notifications > 0) {
      await this.page.click('[data-testid="notification-item"]').first();
      await this.page.click('[data-testid="mark-as-read"]');
    }
    
    // Test notification settings
    await this.page.click('[data-testid="notification-settings"]');
    await expect(this.page.locator('[data-testid="notification-preferences"]')).toBeVisible();
    
    console.log('✅ Notification center tests passed');
  }

  /**
   * Helper method to create appointment for client (used in cross-user testing)
   */
  async createAppointmentForClient(client: UserCredentials): Promise<void> {
    console.log(`📅 Creating appointment for client: ${client.email}`);
    
    await this.page.click('[data-testid="new-appointment-button"]');
    await this.page.click('[data-testid="client-select"]');
    
    // Search for specific client
    await this.page.fill('[data-testid="client-search"]', client.email);
    await this.page.click(`[data-testid="client-option-${client.email}"]`);
    
    await this.page.fill('[data-testid="appointment-date"]', '2024-12-30');
    await this.page.fill('[data-testid="appointment-time"]', '15:00');
    
    await this.page.click('[data-testid="save-appointment-button"]');
    await expect(this.page.locator('[data-testid="appointment-created-message"]')).toBeVisible();
    
    console.log('✅ Appointment created successfully');
  }
}