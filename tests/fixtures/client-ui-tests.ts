import { Page, expect } from '@playwright/test';
import { UserCredentials } from './user-credentials';

export class ClientUITestSuite {
  private page: Page;
  private baseURL: string;

  constructor(page: Page, baseURL: string) {
    this.page = page;
    this.baseURL = baseURL;
  }

  /**
   * Logs in as a client user
   */
  async loginAsClient(client: UserCredentials): Promise<void> {
    console.log(`🔐 Logging in as client: ${client.email}`);
    
    await this.page.goto(`${this.baseURL}/login`);
    
    // Fill login form
    await this.page.fill('[data-testid="email-input"]', client.email);
    await this.page.fill('[data-testid="password-input"]', client.password);
    await this.page.click('[data-testid="login-button"]');
    
    // Wait for navigation to client dashboard
    await this.page.waitForURL('**/client/dashboard');
    
    // Verify login success
    await expect(this.page.locator('[data-testid="client-name"]')).toContainText(client.name);
    
    console.log(`✅ Successfully logged in as client: ${client.name}`);
  }

  /**
   * Tests client dashboard and progress tracking
   */
  async testDashboardAndProgress(client: UserCredentials): Promise<void> {
    console.log('📊 Testing client dashboard and progress tracking...');
    
    await this.loginAsClient(client);
    
    // Test dashboard elements
    await expect(this.page.locator('[data-testid="welcome-message"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="progress-overview"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="upcoming-sessions"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="achievements-preview"]')).toBeVisible();
    
    // Test progress charts
    await expect(this.page.locator('[data-testid="progress-chart"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="mood-tracker"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="goals-progress"]')).toBeVisible();
    
    // Test quick actions
    await expect(this.page.locator('[data-testid="book-session-button"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="track-mood-button"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="view-goals-button"]')).toBeVisible();
    
    // Test mood tracking
    await this.page.click('[data-testid="track-mood-button"]');
    await expect(this.page.locator('[data-testid="mood-tracker-modal"]')).toBeVisible();
    
    await this.page.click('[data-testid="mood-great"]');
    await this.page.fill('[data-testid="mood-notes"]', 'Feeling positive today after our last session!');
    await this.page.click('[data-testid="save-mood-button"]');
    
    await expect(this.page.locator('[data-testid="mood-saved-message"]')).toBeVisible();
    
    console.log('✅ Dashboard and progress tests passed');
  }

  /**
   * Tests client goal management
   */
  async testGoalManagement(client: UserCredentials): Promise<void> {
    console.log('🎯 Testing client goal management...');
    
    await this.loginAsClient(client);
    
    // Navigate to goals page
    await this.page.click('[data-testid="goals-nav-link"]');
    await this.page.waitForURL('**/client/goals');
    
    // Test goals overview
    await expect(this.page.locator('[data-testid="goals-overview"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="active-goals"]')).toBeVisible();
    
    // Test creating new goal
    await this.page.click('[data-testid="create-goal-button"]');
    await expect(this.page.locator('[data-testid="goal-modal"]')).toBeVisible();
    
    // Fill goal details
    await this.page.fill('[data-testid="goal-title"]', 'Improve Daily Meditation Practice');
    await this.page.fill('[data-testid="goal-description"]', 'Meditate for 15 minutes every morning');
    
    await this.page.click('[data-testid="goal-category-select"]');
    await this.page.click('[data-testid="personal-growth-option"]');
    
    await this.page.fill('[data-testid="goal-target-date"]', '2025-03-01');
    
    // Set goal milestones
    await this.page.click('[data-testid="add-milestone"]');
    await this.page.fill('[data-testid="milestone-title"]', 'Week 1: 5 minutes daily');
    await this.page.fill('[data-testid="milestone-date"]', '2025-01-07');
    
    await this.page.click('[data-testid="save-goal-button"]');
    await expect(this.page.locator('[data-testid="goal-created-message"]')).toBeVisible();
    
    // Test goal progress tracking
    const goalCard = this.page.locator('[data-testid="goal-card"]').first();
    await goalCard.click();
    
    await expect(this.page.locator('[data-testid="goal-details"]')).toBeVisible();
    
    // Update goal progress
    await this.page.click('[data-testid="update-progress-button"]');
    await this.page.fill('[data-testid="progress-notes"]', 'Completed 3 days of meditation this week');
    await this.page.click('[data-testid="progress-25"]'); // 25% progress
    
    await this.page.click('[data-testid="save-progress-button"]');
    await expect(this.page.locator('[data-testid="progress-updated-message"]')).toBeVisible();
    
    console.log('✅ Goal management tests passed');
  }

  /**
   * Tests client achievements system
   */
  async testAchievementsSystem(client: UserCredentials): Promise<void> {
    console.log('🏆 Testing client achievements system...');
    
    await this.loginAsClient(client);
    
    // Navigate to achievements
    await this.page.click('[data-testid="achievements-nav-link"]');
    await this.page.waitForURL('**/client/achievements');
    
    // Test achievements overview
    await expect(this.page.locator('[data-testid="achievements-overview"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="total-points"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="level-indicator"]')).toBeVisible();
    
    // Test achievement categories
    await this.page.click('[data-testid="category-all"]');
    await this.page.click('[data-testid="category-sessions"]');
    await this.page.click('[data-testid="category-goals"]');
    await this.page.click('[data-testid="category-milestones"]');
    
    // Test achievement details
    const achievementCard = this.page.locator('[data-testid="achievement-card"]').first();
    if (await achievementCard.isVisible()) {
      await achievementCard.click();
      await expect(this.page.locator('[data-testid="achievement-details"]')).toBeVisible();
      await expect(this.page.locator('[data-testid="achievement-description"]')).toBeVisible();
      await expect(this.page.locator('[data-testid="achievement-progress"]')).toBeVisible();
    }
    
    // Test badges and rewards
    await this.page.click('[data-testid="badges-tab"]');
    await expect(this.page.locator('[data-testid="badges-collection"]')).toBeVisible();
    
    // Test leaderboard (if available)
    await this.page.click('[data-testid="leaderboard-tab"]');
    await expect(this.page.locator('[data-testid="leaderboard"]')).toBeVisible();
    
    console.log('✅ Achievements system tests passed');
  }

  /**
   * Tests client booking system
   */
  async testBookingSystem(client: UserCredentials): Promise<void> {
    console.log('📅 Testing client booking system...');
    
    await this.loginAsClient(client);
    
    // Navigate to booking
    await this.page.click('[data-testid="book-session-nav-link"]');
    await this.page.waitForURL('**/client/booking');
    
    // Test coach selection
    await expect(this.page.locator('[data-testid="available-coaches"]')).toBeVisible();
    
    // Select a coach
    const coachCard = this.page.locator('[data-testid="coach-card"]').first();
    await coachCard.click();
    
    // Test coach profile view
    await expect(this.page.locator('[data-testid="coach-profile"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="coach-specializations"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="coach-reviews"]')).toBeVisible();
    
    // Test booking calendar
    await this.page.click('[data-testid="book-with-coach-button"]');
    await expect(this.page.locator('[data-testid="booking-calendar"]')).toBeVisible();
    
    // Select available time slot
    const availableSlot = this.page.locator('[data-testid="available-slot"]').first();
    if (await availableSlot.isVisible()) {
      await availableSlot.click();
      
      // Test session type selection
      await this.page.click('[data-testid="session-type-select"]');
      await this.page.click('[data-testid="video-call-option"]');
      
      // Add session notes
      await this.page.fill('[data-testid="session-goals"]', 'Focus on stress management techniques');
      
      // Confirm booking
      await this.page.click('[data-testid="confirm-booking-button"]');
      await expect(this.page.locator('[data-testid="booking-confirmed-message"]')).toBeVisible();
    }
    
    console.log('✅ Booking system tests passed');
  }

  /**
   * Tests coach discovery and connection features
   */
  async testCoachDiscovery(client: UserCredentials): Promise<void> {
    console.log('🔍 Testing coach discovery and connection...');
    
    await this.loginAsClient(client);
    
    // Navigate to discover coaches
    await this.page.click('[data-testid="discover-coaches-nav-link"]');
    await this.page.waitForURL('**/client/discover');
    
    // Test search and filters
    await this.page.fill('[data-testid="coach-search"]', 'anxiety');
    await this.page.waitForTimeout(1000);
    
    // Test specialization filters
    await this.page.click('[data-testid="specialization-filter"]');
    await this.page.check('[data-testid="anxiety-filter"]');
    await this.page.check('[data-testid="stress-management-filter"]');
    
    // Test language filters
    await this.page.click('[data-testid="language-filter"]');
    await this.page.check('[data-testid="english-filter"]');
    
    // Test price range filter
    await this.page.click('[data-testid="price-filter"]');
    await this.page.fill('[data-testid="min-price"]', '200');
    await this.page.fill('[data-testid="max-price"]', '500');
    
    // Apply filters
    await this.page.click('[data-testid="apply-filters-button"]');
    
    // Test coach cards
    const coachCards = this.page.locator('[data-testid="coach-card"]');
    const cardCount = await coachCards.count();
    
    if (cardCount > 0) {
      // Test coach profile preview
      await coachCards.first().hover();
      await expect(this.page.locator('[data-testid="coach-preview"]')).toBeVisible();
      
      // Test connecting with coach
      await this.page.click('[data-testid="connect-button"]').first();
      await expect(this.page.locator('[data-testid="connection-modal"]')).toBeVisible();
      
      await this.page.fill('[data-testid="connection-message"]', 'Hi, I would like to work on managing anxiety and stress. Could we schedule an initial consultation?');
      
      await this.page.click('[data-testid="send-connection-request"]');
      await expect(this.page.locator('[data-testid="connection-sent-message"]')).toBeVisible();
    }
    
    console.log('✅ Coach discovery tests passed');
  }

  /**
   * Tests client appointments management
   */
  async testAppointmentsManagement(client: UserCredentials): Promise<void> {
    console.log('📋 Testing client appointments management...');
    
    await this.loginAsClient(client);
    
    // Navigate to appointments
    await this.page.click('[data-testid="appointments-nav-link"]');
    await this.page.waitForURL('**/client/appointments');
    
    // Test appointments overview
    await expect(this.page.locator('[data-testid="appointments-list"]')).toBeVisible();
    
    // Test appointment filters
    await this.page.click('[data-testid="filter-upcoming"]');
    await this.page.click('[data-testid="filter-past"]');
    await this.page.click('[data-testid="filter-all"]');
    
    // Test appointment details
    const appointmentCard = this.page.locator('[data-testid="appointment-card"]').first();
    if (await appointmentCard.isVisible()) {
      await appointmentCard.click();
      await expect(this.page.locator('[data-testid="appointment-details"]')).toBeVisible();
      
      // Test join session (for video appointments)
      const joinButton = this.page.locator('[data-testid="join-session-button"]');
      if (await joinButton.isVisible()) {
        await joinButton.click();
        await expect(this.page.locator('[data-testid="video-interface"]')).toBeVisible();
        
        // Test session controls
        await expect(this.page.locator('[data-testid="mute-button"]')).toBeVisible();
        await expect(this.page.locator('[data-testid="camera-button"]')).toBeVisible();
        await expect(this.page.locator('[data-testid="end-call-button"]')).toBeVisible();
        
        // End session
        await this.page.click('[data-testid="end-call-button"]');
      }
      
      // Test rescheduling
      await this.page.click('[data-testid="reschedule-button"]');
      await expect(this.page.locator('[data-testid="reschedule-modal"]')).toBeVisible();
      
      // Select new time
      const newTimeSlot = this.page.locator('[data-testid="new-time-slot"]').first();
      if (await newTimeSlot.isVisible()) {
        await newTimeSlot.click();
        await this.page.click('[data-testid="confirm-reschedule"]');
        await expect(this.page.locator('[data-testid="reschedule-confirmed"]')).toBeVisible();
      }
    }
    
    console.log('✅ Appointments management tests passed');
  }

  /**
   * Tests progress sharing features
   */
  async testProgressSharing(client: UserCredentials): Promise<void> {
    console.log('📤 Testing progress sharing features...');
    
    await this.loginAsClient(client);
    
    // Navigate to progress sharing
    await this.page.click('[data-testid="progress-nav-link"]');
    await this.page.waitForURL('**/client/progress');
    
    // Test progress overview
    await expect(this.page.locator('[data-testid="progress-summary"]')).toBeVisible();
    
    // Test sharing with coach
    await this.page.click('[data-testid="share-progress-button"]');
    await expect(this.page.locator('[data-testid="share-modal"]')).toBeVisible();
    
    // Select coaches to share with
    await this.page.check('[data-testid="coach-checkbox"]');
    
    // Add message
    await this.page.fill('[data-testid="share-message"]', 'Here is my weekly progress update. I have been making good progress on my goals!');
    
    // Select what to share
    await this.page.check('[data-testid="share-goals"]');
    await this.page.check('[data-testid="share-mood-tracker"]');
    await this.page.check('[data-testid="share-achievements"]');
    
    await this.page.click('[data-testid="send-progress-share"]');
    await expect(this.page.locator('[data-testid="progress-shared-message"]')).toBeVisible();
    
    // Test progress reports
    await this.page.click('[data-testid="generate-report-button"]');
    await expect(this.page.locator('[data-testid="report-options"]')).toBeVisible();
    
    await this.page.click('[data-testid="weekly-report"]');
    await this.page.click('[data-testid="generate-button"]');
    
    await expect(this.page.locator('[data-testid="report-generated"]')).toBeVisible();
    
    console.log('✅ Progress sharing tests passed');
  }

  /**
   * Tests client onboarding flow
   */
  async testOnboardingFlow(newClient: UserCredentials): Promise<void> {
    console.log('🚀 Testing client onboarding flow...');
    
    // Start registration
    await this.page.goto(`${this.baseURL}/register`);
    
    // Fill registration form
    await this.page.fill('[data-testid="first-name"]', newClient.name.split(' ')[0]);
    await this.page.fill('[data-testid="last-name"]', newClient.name.split(' ')[1] || 'Test');
    await this.page.fill('[data-testid="email"]', newClient.email);
    await this.page.fill('[data-testid="password"]', newClient.password);
    await this.page.fill('[data-testid="confirm-password"]', newClient.password);
    
    await this.page.check('[data-testid="terms-checkbox"]');
    await this.page.click('[data-testid="register-button"]');
    
    // Test onboarding steps
    await this.page.waitForURL('**/onboarding');
    
    // Step 1: Personal Information
    await expect(this.page.locator('[data-testid="onboarding-step-1"]')).toBeVisible();
    await this.page.fill('[data-testid="age-input"]', '28');
    await this.page.click('[data-testid="gender-select"]');
    await this.page.click('[data-testid="gender-prefer-not-to-say"]');
    
    await this.page.click('[data-testid="next-step-button"]');
    
    // Step 2: Goals and Interests
    await expect(this.page.locator('[data-testid="onboarding-step-2"]')).toBeVisible();
    await this.page.check('[data-testid="goal-stress-management"]');
    await this.page.check('[data-testid="goal-personal-growth"]');
    await this.page.check('[data-testid="goal-work-life-balance"]');
    
    await this.page.click('[data-testid="next-step-button"]');
    
    // Step 3: Preferences
    await expect(this.page.locator('[data-testid="onboarding-step-3"]')).toBeVisible();
    await this.page.click('[data-testid="session-type-video"]');
    await this.page.click('[data-testid="frequency-weekly"]');
    
    await this.page.click('[data-testid="complete-onboarding-button"]');
    
    // Verify onboarding completion
    await this.page.waitForURL('**/client/dashboard');
    await expect(this.page.locator('[data-testid="welcome-tour"]')).toBeVisible();
    
    console.log('✅ Onboarding flow tests passed');
  }

  /**
   * Tests client invitations system
   */
  async testInvitationsSystem(client: UserCredentials): Promise<void> {
    console.log('📧 Testing client invitations system...');
    
    await this.loginAsClient(client);
    
    // Navigate to invitations
    await this.page.click('[data-testid="invitations-nav-link"]');
    await this.page.waitForURL('**/client/invitations');
    
    // Test received invitations
    await expect(this.page.locator('[data-testid="received-invitations"]')).toBeVisible();
    
    // Test sending invitation
    await this.page.click('[data-testid="invite-friend-button"]');
    await expect(this.page.locator('[data-testid="invitation-modal"]')).toBeVisible();
    
    await this.page.fill('[data-testid="friend-email"]', 'friend@example.com');
    await this.page.fill('[data-testid="invitation-message"]', 'Hey! I have been using this wellness platform and thought you might find it helpful too!');
    
    await this.page.click('[data-testid="send-invitation-button"]');
    await expect(this.page.locator('[data-testid="invitation-sent-message"]')).toBeVisible();
    
    // Test invitation tracking
    await this.page.click('[data-testid="sent-invitations-tab"]');
    await expect(this.page.locator('[data-testid="sent-invitations-list"]')).toBeVisible();
    
    console.log('✅ Invitations system tests passed');
  }

  /**
   * Tests multi-language support
   */
  async testMultiLanguageSupport(client: UserCredentials): Promise<void> {
    console.log('🌍 Testing multi-language support...');
    
    await this.loginAsClient(client);
    
    // Test language switcher
    await this.page.click('[data-testid="language-switcher"]');
    await expect(this.page.locator('[data-testid="language-menu"]')).toBeVisible();
    
    // Test Hebrew language
    await this.page.click('[data-testid="language-hebrew"]');
    await this.page.waitForTimeout(1000);
    
    // Verify RTL layout
    const body = await this.page.locator('body');
    const direction = await body.getAttribute('dir');
    expect(direction).toBe('rtl');
    
    // Test Arabic language
    await this.page.click('[data-testid="language-switcher"]');
    await this.page.click('[data-testid="language-arabic"]');
    await this.page.waitForTimeout(1000);
    
    // Verify RTL layout persists
    const directionArabic = await body.getAttribute('dir');
    expect(directionArabic).toBe('rtl');
    
    // Switch back to English
    await this.page.click('[data-testid="language-switcher"]');
    await this.page.click('[data-testid="language-english"]');
    await this.page.waitForTimeout(1000);
    
    // Verify LTR layout
    const directionEnglish = await body.getAttribute('dir');
    expect(directionEnglish).toBe('ltr');
    
    console.log('✅ Multi-language support tests passed');
  }

  /**
   * Helper method to view and confirm appointment (used in cross-user testing)
   */
  async viewAndConfirmAppointment(): Promise<void> {
    console.log('📅 Viewing and confirming appointment...');
    
    // Navigate to appointments
    await this.page.click('[data-testid="appointments-nav-link"]');
    
    // Find newest appointment
    const newestAppointment = this.page.locator('[data-testid="appointment-card"]').first();
    await newestAppointment.click();
    
    // Confirm appointment
    await this.page.click('[data-testid="confirm-appointment-button"]');
    await expect(this.page.locator('[data-testid="appointment-confirmed-message"]')).toBeVisible();
    
    console.log('✅ Appointment confirmed successfully');
  }
}