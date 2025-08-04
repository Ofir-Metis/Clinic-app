import { Page, expect } from '@playwright/test';
import { UserCredentials } from './user-credentials';

export class AdminUITestSuite {
  private page: Page;
  private baseURL: string;

  constructor(page: Page, baseURL: string) {
    this.page = page;
    this.baseURL = baseURL;
  }

  /**
   * Logs in as an admin user
   */
  async loginAsAdmin(admin: UserCredentials): Promise<void> {
    console.log(`🔐 Logging in as admin: ${admin.email}`);
    
    await this.page.goto(`${this.baseURL}/login`);
    
    // Fill login form
    await this.page.fill('[data-testid="email-input"]', admin.email);
    await this.page.fill('[data-testid="password-input"]', admin.password);
    await this.page.click('[data-testid="login-button"]');
    
    // Wait for navigation to admin dashboard
    await this.page.waitForURL('**/admin/dashboard');
    
    // Verify admin access
    await expect(this.page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="admin-navigation"]')).toBeVisible();
    
    console.log(`✅ Successfully logged in as admin: ${admin.email}`);
  }

  /**
   * Tests admin dashboard overview
   */
  async testDashboardOverview(admin: UserCredentials): Promise<void> {
    console.log('📊 Testing admin dashboard overview...');
    
    await this.loginAsAdmin(admin);
    
    // Test main dashboard widgets
    await expect(this.page.locator('[data-testid="total-users-widget"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="total-therapists-widget"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="total-clients-widget"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="active-sessions-widget"]')).toBeVisible();
    
    // Test system health indicators
    await expect(this.page.locator('[data-testid="system-health-panel"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="database-status"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="api-status"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="storage-status"]')).toBeVisible();
    
    // Test recent activity feed
    await expect(this.page.locator('[data-testid="recent-activity"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="activity-list"]')).toBeVisible();
    
    // Test quick actions
    await expect(this.page.locator('[data-testid="create-user-button"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="system-settings-button"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="backup-button"]')).toBeVisible();
    
    // Test analytics charts
    await expect(this.page.locator('[data-testid="user-growth-chart"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="session-analytics-chart"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="revenue-chart"]')).toBeVisible();
    
    console.log('✅ Dashboard overview tests passed');
  }

  /**
   * Tests user management system
   */
  async testUserManagement(admin: UserCredentials): Promise<void> {
    console.log('👥 Testing user management system...');
    
    await this.loginAsAdmin(admin);
    
    // Navigate to user management
    await this.page.click('[data-testid="users-nav-link"]');
    await this.page.waitForURL('**/admin/users');
    
    // Test user list view
    await expect(this.page.locator('[data-testid="users-table"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="user-row"]').first()).toBeVisible();
    
    // Test user filters
    await this.page.click('[data-testid="role-filter"]');
    await this.page.click('[data-testid="filter-therapists"]');
    await this.page.waitForTimeout(1000);
    
    await this.page.click('[data-testid="role-filter"]');
    await this.page.click('[data-testid="filter-clients"]');
    await this.page.waitForTimeout(1000);
    
    await this.page.click('[data-testid="role-filter"]');
    await this.page.click('[data-testid="filter-all"]');
    
    // Test user search
    await this.page.fill('[data-testid="user-search"]', 'therapist1@clinic-test.com');
    await this.page.waitForTimeout(1000);
    
    // Test user details view
    const userRow = this.page.locator('[data-testid="user-row"]').first();
    await userRow.click();
    await expect(this.page.locator('[data-testid="user-details-panel"]')).toBeVisible();
    
    // Test user profile editing
    await this.page.click('[data-testid="edit-user-button"]');
    await expect(this.page.locator('[data-testid="edit-user-modal"]')).toBeVisible();
    
    // Update user information
    await this.page.fill('[data-testid="user-bio"]', 'Updated user bio for testing');
    await this.page.click('[data-testid="save-user-changes"]');
    await expect(this.page.locator('[data-testid="user-updated-message"]')).toBeVisible();
    
    // Test user status management
    await this.page.click('[data-testid="user-status-dropdown"]');
    await this.page.click('[data-testid="suspend-user"]');
    await expect(this.page.locator('[data-testid="suspend-confirmation"]')).toBeVisible();
    await this.page.click('[data-testid="cancel-suspend"]');
    
    // Test creating new user
    await this.page.click('[data-testid="create-user-button"]');
    await expect(this.page.locator('[data-testid="create-user-modal"]')).toBeVisible();
    
    const timestamp = Date.now();
    await this.page.fill('[data-testid="new-user-name"]', `Test Admin User ${timestamp}`);
    await this.page.fill('[data-testid="new-user-email"]', `admintest${timestamp}@clinic-test.com`);
    await this.page.fill('[data-testid="new-user-password"]', 'TestPass123!');
    
    await this.page.click('[data-testid="new-user-role"]');
    await this.page.click('[data-testid="role-therapist"]');
    
    await this.page.click('[data-testid="create-user-submit"]');
    await expect(this.page.locator('[data-testid="user-created-message"]')).toBeVisible();
    
    console.log('✅ User management tests passed');
  }

  /**
   * Tests view switching and impersonation features
   */
  async testViewSwitchingAndImpersonation(admin: UserCredentials, therapist: UserCredentials, client: UserCredentials): Promise<void> {
    console.log('🔄 Testing view switching and impersonation...');
    
    await this.loginAsAdmin(admin);
    
    // Test view switcher
    await expect(this.page.locator('[data-testid="view-switcher"]')).toBeVisible();
    
    // Test therapist view
    await this.page.click('[data-testid="view-switcher"]');
    await this.page.click('[data-testid="therapist-view"]');
    await this.page.waitForURL('**/therapist/dashboard');
    await expect(this.page.locator('[data-testid="admin-mode-indicator"]')).toBeVisible();
    
    // Test switching back to admin view
    await this.page.click('[data-testid="admin-mode-indicator"]');
    await this.page.click('[data-testid="switch-to-admin"]');
    await this.page.waitForURL('**/admin/dashboard');
    
    // Test client view
    await this.page.click('[data-testid="view-switcher"]');
    await this.page.click('[data-testid="client-view"]');
    await this.page.waitForURL('**/client/dashboard');
    await expect(this.page.locator('[data-testid="admin-mode-indicator"]')).toBeVisible();
    
    // Switch back to admin
    await this.page.click('[data-testid="admin-mode-indicator"]');
    await this.page.click('[data-testid="switch-to-admin"]');
    await this.page.waitForURL('**/admin/dashboard');
    
    // Test user impersonation
    await this.page.click('[data-testid="users-nav-link"]');
    
    // Search for specific therapist
    await this.page.fill('[data-testid="user-search"]', therapist.email);
    await this.page.waitForTimeout(1000);
    
    // Impersonate therapist
    const therapistRow = this.page.locator(`[data-testid="user-row"][data-email="${therapist.email}"]`);
    await therapistRow.locator('[data-testid="impersonate-button"]').click();
    
    await expect(this.page.locator('[data-testid="impersonation-warning"]')).toBeVisible();
    await this.page.click('[data-testid="confirm-impersonation"]');
    
    // Verify impersonation mode
    await this.page.waitForURL('**/therapist/dashboard');
    await expect(this.page.locator('[data-testid="impersonation-banner"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="impersonation-banner"]')).toContainText(therapist.name);
    
    // Test functionality while impersonating
    await expect(this.page.locator('[data-testid="therapist-dashboard"]')).toBeVisible();
    
    // End impersonation
    await this.page.click('[data-testid="end-impersonation"]');
    await this.page.waitForURL('**/admin/dashboard');
    
    console.log('✅ View switching and impersonation tests passed');
  }

  /**
   * Tests system configuration management
   */
  async testSystemConfiguration(admin: UserCredentials): Promise<void> {
    console.log('⚙️ Testing system configuration management...');
    
    await this.loginAsAdmin(admin);
    
    // Navigate to system settings
    await this.page.click('[data-testid="system-nav-link"]');
    await this.page.waitForURL('**/admin/system');
    
    // Test general settings
    await expect(this.page.locator('[data-testid="general-settings"]')).toBeVisible();
    
    // Test platform configuration
    await this.page.click('[data-testid="platform-config-tab"]');
    await this.page.fill('[data-testid="platform-name"]', 'Clinic Management Test Platform');
    await this.page.fill('[data-testid="support-email"]', 'support@clinic-test.com');
    
    // Test feature flags
    await this.page.click('[data-testid="feature-flags-tab"]');
    await expect(this.page.locator('[data-testid="feature-flags-list"]')).toBeVisible();
    
    await this.page.check('[data-testid="enable-ai-features"]');
    await this.page.check('[data-testid="enable-billing"]');
    await this.page.check('[data-testid="enable-notifications"]');
    
    // Test email configuration
    await this.page.click('[data-testid="email-config-tab"]');
    await this.page.fill('[data-testid="smtp-host"]', 'smtp.example.com');
    await this.page.fill('[data-testid="smtp-port"]', '587');
    await this.page.fill('[data-testid="smtp-username"]', 'noreply@clinic-test.com');
    
    // Test API configuration
    await this.page.click('[data-testid="api-config-tab"]');
    await expect(this.page.locator('[data-testid="api-keys-list"]')).toBeVisible();
    
    // Test rate limiting settings
    await this.page.fill('[data-testid="rate-limit-per-minute"]', '100');
    await this.page.fill('[data-testid="rate-limit-per-hour"]', '1000');
    
    // Save configuration
    await this.page.click('[data-testid="save-config-button"]');
    await expect(this.page.locator('[data-testid="config-saved-message"]')).toBeVisible();
    
    console.log('✅ System configuration tests passed');
  }

  /**
   * Tests security settings and API management
   */
  async testSecurityAndAPIManagement(admin: UserCredentials): Promise<void> {
    console.log('🔒 Testing security settings and API management...');
    
    await this.loginAsAdmin(admin);
    
    // Navigate to security settings
    await this.page.click('[data-testid="security-nav-link"]');
    await this.page.waitForURL('**/admin/security');
    
    // Test security overview
    await expect(this.page.locator('[data-testid="security-dashboard"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="failed-login-attempts"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="active-sessions"]')).toBeVisible();
    
    // Test password policies
    await this.page.click('[data-testid="password-policy-tab"]');
    await this.page.fill('[data-testid="min-password-length"]', '12');
    await this.page.check('[data-testid="require-uppercase"]');
    await this.page.check('[data-testid="require-numbers"]');
    await this.page.check('[data-testid="require-symbols"]');
    
    // Test session management
    await this.page.click('[data-testid="session-management-tab"]');
    await this.page.fill('[data-testid="session-timeout"]', '30');
    await this.page.check('[data-testid="force-logout-on-password-change"]');
    
    // Test API key management
    await this.page.click('[data-testid="api-keys-tab"]');
    await expect(this.page.locator('[data-testid="api-keys-table"]')).toBeVisible();
    
    // Create new API key
    await this.page.click('[data-testid="create-api-key"]');
    await this.page.fill('[data-testid="api-key-name"]', 'Test Integration Key');
    await this.page.click('[data-testid="api-key-scope"]');
    await this.page.check('[data-testid="scope-read"]');
    await this.page.check('[data-testid="scope-write"]');
    
    await this.page.click('[data-testid="generate-api-key"]');
    await expect(this.page.locator('[data-testid="api-key-generated"]')).toBeVisible();
    
    // Test audit logs
    await this.page.click('[data-testid="audit-logs-tab"]');
    await expect(this.page.locator('[data-testid="audit-logs-table"]')).toBeVisible();
    
    // Test log filtering
    await this.page.click('[data-testid="log-level-filter"]');
    await this.page.click('[data-testid="filter-error"]');
    
    await this.page.fill('[data-testid="log-date-from"]', '2024-01-01');
    await this.page.fill('[data-testid="log-date-to"]', '2024-12-31');
    
    await this.page.click('[data-testid="apply-log-filters"]');
    
    console.log('✅ Security and API management tests passed');
  }

  /**
   * Tests backup and compliance management
   */
  async testBackupAndCompliance(admin: UserCredentials): Promise<void> {
    console.log('💾 Testing backup and compliance management...');
    
    await this.loginAsAdmin(admin);
    
    // Navigate to backup & compliance
    await this.page.click('[data-testid="backup-nav-link"]');
    await this.page.waitForURL('**/admin/backup');
    
    // Test backup overview
    await expect(this.page.locator('[data-testid="backup-dashboard"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="last-backup-info"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="backup-schedule"]')).toBeVisible();
    
    // Test manual backup
    await this.page.click('[data-testid="create-backup-button"]');
    await expect(this.page.locator('[data-testid="backup-modal"]')).toBeVisible();
    
    await this.page.fill('[data-testid="backup-description"]', 'Manual test backup');
    await this.page.check('[data-testid="include-user-data"]');
    await this.page.check('[data-testid="include-system-config"]');
    
    await this.page.click('[data-testid="start-backup"]');
    await expect(this.page.locator('[data-testid="backup-started-message"]')).toBeVisible();
    
    // Test backup history
    await this.page.click('[data-testid="backup-history-tab"]');
    await expect(this.page.locator('[data-testid="backup-history-table"]')).toBeVisible();
    
    // Test compliance settings
    await this.page.click('[data-testid="compliance-tab"]');
    await expect(this.page.locator('[data-testid="compliance-dashboard"]')).toBeVisible();
    
    // Test GDPR compliance
    await this.page.click('[data-testid="gdpr-settings"]');
    await this.page.check('[data-testid="enable-data-deletion"]');
    await this.page.fill('[data-testid="data-retention-days"]', '2555'); // 7 years
    
    // Test HIPAA compliance
    await this.page.click('[data-testid="hipaa-settings"]');
    await this.page.check('[data-testid="enable-audit-trail"]');
    await this.page.check('[data-testid="encrypt-sensitive-data"]');
    
    // Test data export
    await this.page.click('[data-testid="data-export-tab"]');
    await this.page.click('[data-testid="export-user-data"]');
    await this.page.fill('[data-testid="export-user-email"]', 'client1_1@clinic-test.com');
    
    await this.page.click('[data-testid="start-export"]');
    await expect(this.page.locator('[data-testid="export-started-message"]')).toBeVisible();
    
    console.log('✅ Backup and compliance tests passed');
  }

  /**
   * Tests subscription and billing management
   */
  async testSubscriptionManagement(admin: UserCredentials): Promise<void> {
    console.log('💳 Testing subscription and billing management...');
    
    await this.loginAsAdmin(admin);
    
    // Navigate to billing management
    await this.page.click('[data-testid="billing-nav-link"]');
    await this.page.waitForURL('**/admin/billing');
    
    // Test billing overview
    await expect(this.page.locator('[data-testid="billing-overview"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="total-revenue"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="monthly-recurring-revenue"]')).toBeVisible();
    
    // Test subscription plans
    await this.page.click('[data-testid="subscription-plans-tab"]');
    await expect(this.page.locator('[data-testid="plans-table"]')).toBeVisible();
    
    // Create new subscription plan
    await this.page.click('[data-testid="create-plan-button"]');
    await this.page.fill('[data-testid="plan-name"]', 'Premium Plus Plan');
    await this.page.fill('[data-testid="plan-price"]', '199');
    await this.page.fill('[data-testid="plan-features"]', 'Unlimited sessions, AI analysis, Priority support');
    
    await this.page.click('[data-testid="save-plan"]');
    await expect(this.page.locator('[data-testid="plan-created-message"]')).toBeVisible();
    
    // Test payment methods
    await this.page.click('[data-testid="payment-methods-tab"]');
    await expect(this.page.locator('[data-testid="payment-providers"]')).toBeVisible();
    
    // Test Israeli payment processors
    await this.page.check('[data-testid="enable-tranzila"]');
    await this.page.check('[data-testid="enable-cardcom"]');
    await this.page.check('[data-testid="enable-paypal"]');
    
    // Test billing reports
    await this.page.click('[data-testid="billing-reports-tab"]');
    await this.page.click('[data-testid="generate-revenue-report"]');
    
    await this.page.click('[data-testid="report-period"]');
    await this.page.click('[data-testid="last-quarter"]');
    
    await this.page.click('[data-testid="generate-report"]');
    await expect(this.page.locator('[data-testid="report-generated"]')).toBeVisible();
    
    console.log('✅ Subscription management tests passed');
  }

  /**
   * Tests system monitoring and health
   */
  async testSystemMonitoring(admin: UserCredentials): Promise<void> {
    console.log('📊 Testing system monitoring and health...');
    
    await this.loginAsAdmin(admin);
    
    // Navigate to monitoring
    await this.page.click('[data-testid="monitoring-nav-link"]');
    await this.page.waitForURL('**/admin/monitoring');
    
    // Test system health dashboard
    await expect(this.page.locator('[data-testid="health-dashboard"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="cpu-usage"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="memory-usage"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="disk-usage"]')).toBeVisible();
    
    // Test service status
    await expect(this.page.locator('[data-testid="services-status"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="database-health"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="redis-health"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="nats-health"]')).toBeVisible();
    
    // Test performance metrics
    await this.page.click('[data-testid="performance-tab"]');
    await expect(this.page.locator('[data-testid="response-times-chart"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="throughput-chart"]')).toBeVisible();
    
    // Test error tracking
    await this.page.click('[data-testid="errors-tab"]');
    await expect(this.page.locator('[data-testid="error-logs"]')).toBeVisible();
    
    // Test alerts configuration
    await this.page.click('[data-testid="alerts-tab"]');
    await expect(this.page.locator('[data-testid="alerts-config"]')).toBeVisible();
    
    // Create new alert
    await this.page.click('[data-testid="create-alert"]');
    await this.page.fill('[data-testid="alert-name"]', 'High CPU Usage');
    await this.page.fill('[data-testid="alert-threshold"]', '80');
    await this.page.fill('[data-testid="alert-email"]', 'admin@clinic-test.com');
    
    await this.page.click('[data-testid="save-alert"]');
    await expect(this.page.locator('[data-testid="alert-created"]')).toBeVisible();
    
    console.log('✅ System monitoring tests passed');
  }

  /**
   * Tests invitation management system
   */
  async testInvitationManagement(admin: UserCredentials): Promise<void> {
    console.log('📧 Testing invitation management...');
    
    await this.loginAsAdmin(admin);
    
    // Navigate to invitations
    await this.page.click('[data-testid="invitations-nav-link"]');
    await this.page.waitForURL('**/admin/invitations');
    
    // Test invitations overview
    await expect(this.page.locator('[data-testid="invitations-dashboard"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="pending-invitations"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="sent-invitations"]')).toBeVisible();
    
    // Test sending therapist invitation
    await this.page.click('[data-testid="invite-therapist-button"]');
    await this.page.fill('[data-testid="therapist-email"]', 'newtherapist@clinic-test.com');
    await this.page.fill('[data-testid="therapist-name"]', 'New Test Therapist');
    await this.page.fill('[data-testid="invitation-message"]', 'Welcome to our clinic platform!');
    
    await this.page.click('[data-testid="send-therapist-invitation"]');
    await expect(this.page.locator('[data-testid="invitation-sent"]')).toBeVisible();
    
    // Test bulk invitations
    await this.page.click('[data-testid="bulk-invite-tab"]');
    await this.page.click('[data-testid="upload-csv"]');
    // Note: File upload would be tested with actual CSV file
    
    // Test invitation templates
    await this.page.click('[data-testid="templates-tab"]');
    await expect(this.page.locator('[data-testid="invitation-templates"]')).toBeVisible();
    
    // Create new template
    await this.page.click('[data-testid="create-template"]');
    await this.page.fill('[data-testid="template-name"]', 'Therapist Welcome');
    await this.page.fill('[data-testid="template-subject"]', 'Welcome to Our Wellness Platform');
    await this.page.fill('[data-testid="template-body"]', 'Welcome aboard! We are excited to have you join our team.');
    
    await this.page.click('[data-testid="save-template"]');
    await expect(this.page.locator('[data-testid="template-saved"]')).toBeVisible();
    
    console.log('✅ Invitation management tests passed');
  }

  /**
   * Tests audit logs and compliance tracking
   */
  async testAuditLogsAndCompliance(admin: UserCredentials): Promise<void> {
    console.log('📋 Testing audit logs and compliance...');
    
    await this.loginAsAdmin(admin);
    
    // Navigate to audit logs
    await this.page.click('[data-testid="audit-nav-link"]');
    await this.page.waitForURL('**/admin/audit');
    
    // Test audit logs table
    await expect(this.page.locator('[data-testid="audit-logs-table"]')).toBeVisible();
    
    // Test log filtering
    await this.page.click('[data-testid="action-filter"]');
    await this.page.click('[data-testid="filter-user-login"]');
    
    await this.page.click('[data-testid="user-filter"]');
    await this.page.fill('[data-testid="user-search"]', 'therapist1@clinic-test.com');
    
    await this.page.fill('[data-testid="date-from"]', '2024-01-01');
    await this.page.fill('[data-testid="date-to"]', '2024-12-31');
    
    await this.page.click('[data-testid="apply-filters"]');
    
    // Test log export
    await this.page.click('[data-testid="export-logs"]');
    await this.page.click('[data-testid="export-format"]');
    await this.page.click('[data-testid="csv-format"]');
    
    await this.page.click('[data-testid="download-export"]');
    await expect(this.page.locator('[data-testid="export-started"]')).toBeVisible();
    
    // Test compliance reports
    await this.page.click('[data-testid="compliance-reports-tab"]');
    await expect(this.page.locator('[data-testid="compliance-dashboard"]')).toBeVisible();
    
    // Generate compliance report
    await this.page.click('[data-testid="generate-compliance-report"]');
    await this.page.click('[data-testid="report-type"]');
    await this.page.click('[data-testid="hipaa-report"]');
    
    await this.page.click('[data-testid="generate-report"]');
    await expect(this.page.locator('[data-testid="report-generated"]')).toBeVisible();
    
    console.log('✅ Audit logs and compliance tests passed');
  }

  /**
   * Helper method to impersonate a user (used in cross-user testing)
   */
  async impersonateUser(user: UserCredentials): Promise<void> {
    console.log(`🎭 Impersonating user: ${user.email}`);
    
    // Navigate to users page
    await this.page.click('[data-testid="users-nav-link"]');
    
    // Search for user
    await this.page.fill('[data-testid="user-search"]', user.email);
    await this.page.waitForTimeout(1000);
    
    // Click impersonate button
    const userRow = this.page.locator(`[data-testid="user-row"][data-email="${user.email}"]`);
    await userRow.locator('[data-testid="impersonate-button"]').click();
    
    await this.page.click('[data-testid="confirm-impersonation"]');
    
    console.log('✅ User impersonation started');
  }

  /**
   * Helper method to verify impersonation view
   */
  async verifyImpersonationView(user: UserCredentials): Promise<void> {
    console.log(`🔍 Verifying impersonation view for: ${user.email}`);
    
    // Verify impersonation banner
    await expect(this.page.locator('[data-testid="impersonation-banner"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="impersonation-banner"]')).toContainText(user.name);
    
    // Verify appropriate dashboard is shown
    if (user.role === 'therapist') {
      await expect(this.page.locator('[data-testid="therapist-dashboard"]')).toBeVisible();
    } else if (user.role === 'client') {
      await expect(this.page.locator('[data-testid="client-dashboard"]')).toBeVisible();
    }
    
    console.log('✅ Impersonation view verified');
  }

  /**
   * Helper method to manage client account (used in cross-user testing)
   */
  async manageClientAccount(client: UserCredentials): Promise<void> {
    console.log(`⚙️ Managing client account: ${client.email}`);
    
    // Navigate to users page
    await this.page.click('[data-testid="users-nav-link"]');
    
    // Search for client
    await this.page.fill('[data-testid="user-search"]', client.email);
    await this.page.waitForTimeout(1000);
    
    // Open client details
    const clientRow = this.page.locator(`[data-testid="user-row"][data-email="${client.email}"]`);
    await clientRow.click();
    
    // Test client management actions
    await expect(this.page.locator('[data-testid="user-details-panel"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="client-goals"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="client-sessions"]')).toBeVisible();
    
    // Test updating client information
    await this.page.click('[data-testid="edit-client-button"]');
    await this.page.fill('[data-testid="client-notes"]', 'Admin note: Client account reviewed and updated');
    await this.page.click('[data-testid="save-client-changes"]');
    
    await expect(this.page.locator('[data-testid="client-updated"]')).toBeVisible();
    
    console.log('✅ Client account management completed');
  }
}