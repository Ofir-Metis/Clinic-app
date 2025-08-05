# 🏥 Comprehensive Clinic System Test Suite

Complete end-to-end testing suite for the Clinic Management Application with full system validation.

## 📋 Overview

This test suite provides **comprehensive coverage** of the entire clinic management ecosystem:

### 🔥 **NEW: Enhanced E2E Test Suite**
- **Production-ready testing** with performance benchmarking and security validation
- **Healthcare workflow testing** with HIPAA compliance and clinical documentation
- **Accessibility testing** with WCAG 2.1 AA compliance validation
- **Cross-browser compatibility** testing with mobile responsiveness
- **Security testing** including CSRF protection and input sanitization
- **Error handling validation** with network failure and recovery testing

### 🔥 **NEW: Comprehensive System Tests**
- **Complete database setup** with 165+ realistic user accounts
- **Full API validation** across all microservices
- **Complete UI testing** for all user roles (Admin, Therapist, Client)
- **Cross-user integration** testing with real workflows
- **Automated credential tracking** for manual testing

### 🧪 **Standard E2E Tests**
- **Authentication flows** - Login, registration, logout, password reset
- **Patient management** - CRUD operations, search, filtering  
- **Appointment scheduling** - Creating, editing, canceling appointments
- **Navigation and routing** - Protected routes, deep linking, breadcrumbs
- **Responsive design** - Mobile, tablet, and desktop layouts
- **Cross-browser compatibility** - Chrome, Firefox, Safari
- **Accessibility** - ARIA labels, keyboard navigation, screen readers

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Yarn package manager
- Docker and Docker Compose
- Git

### Installation

```bash
# Clone and setup
git clone <repository>
cd clinic-app

# Install dependencies
yarn install
yarn workspace @clinic/common build

# Install Playwright browsers
npx playwright install
```

### Running Tests

#### 🔥 **NEW: Enhanced E2E Test Suite**
```bash
# Run the complete enhanced E2E test suite (PRODUCTION-READY)
yarn test:enhanced

# Run specific test categories
yarn test:performance      # Performance benchmarking
yarn test:security        # Security validation (CSRF, XSS, JWT)
yarn test:accessibility   # WCAG 2.1 AA compliance
yarn test:mobile          # Mobile responsiveness
yarn test:healthcare      # Healthcare workflows & HIPAA compliance

# Validate test infrastructure
node validate-test-infrastructure.js
```

#### 🔥 **NEW: Comprehensive System Tests**
```bash
# Run the complete comprehensive test suite (DATABASE & USERS)
yarn test:comprehensive

# This will:
# 1. Create 15 therapists + 150+ clients + admin account  
# 2. Test all backend APIs across all microservices
# 3. Test complete UI for therapists, clients, and admin
# 4. Generate credentials for manual testing
# 5. Create detailed test reports
```

#### 🧪 **Standard E2E Tests**
```bash
# Run all standard E2E tests
./scripts/test-e2e.sh

# Run specific browser
./scripts/test-e2e.sh --browser firefox

# Run tests in headed mode (visible browser)
./scripts/test-e2e.sh --headed

# Run specific test suite
./scripts/test-e2e.sh --grep "authentication"

# Debug tests
./scripts/test-e2e.sh --debug --grep "patient"
```

### Manual Setup (Advanced)

```bash
# 1. Start infrastructure
docker compose -f docker-compose.test.yml up -d

# 2. Run migrations
yarn workspace auth-service migration:run
yarn workspace appointments-service migration:run

# 3. Start services
yarn workspace api-gateway start &
yarn workspace auth-service start &
cd frontend && yarn build && yarn preview &

# 4. Run tests
npx playwright test

# 5. View results
npx playwright show-report
```

## 📁 Test Structure

### 🔥 **NEW: Enhanced E2E Test Suite**
```
tests/
├── enhanced-e2e-suite.spec.ts          # 🔥 Production-ready E2E tests
├── healthcare-workflow-tests.spec.ts   # 🔥 Healthcare & HIPAA workflows
├── test-integration.spec.ts            # 🔥 Test infrastructure validation
├── run-enhanced-test-suite.js          # 🔥 Enhanced test runner
├── validate-test-infrastructure.js     # 🔥 Infrastructure validator
└── test-results/                       # 🔥 Enhanced test outputs
    ├── enhanced-e2e-results.json       # Performance & security metrics
    ├── enhanced-test-report.json       # Comprehensive test report
    └── enhanced-test-summary.md        # Executive summary
```

### 🔥 **NEW: Comprehensive System Tests**
```
tests/
├── comprehensive-system-test.spec.ts    # 🔥 Main test orchestrator
├── fixtures/
│   ├── test-data-manager.ts            # 🔥 User creation & database setup  
│   ├── user-credentials.ts             # 🔥 Credential management
│   ├── api-test-suite.ts               # 🔥 Backend API validation
│   ├── therapist-ui-tests.ts           # 🔥 Therapist UI test suite
│   ├── client-ui-tests.ts              # 🔥 Client UI test suite
│   └── admin-ui-tests.ts               # 🔥 Admin UI test suite
├── run-comprehensive-tests.js          # 🔥 Automated test runner
├── global-setup.ts                     # 🔥 Test environment setup
├── global-teardown.ts                  # 🔥 Test cleanup
└── playwright.config.ts                # 🔥 Playwright configuration
```

### 🧪 **Standard E2E Tests**
```
tests/
├── fixtures/
│   ├── test-data.ts           # Test data and mock objects
│   └── auth-helpers.ts        # Authentication utilities
├── auth.spec.ts               # Authentication flow tests
├── patient-management.spec.ts # Patient CRUD operations
├── appointment-scheduling.spec.ts # Appointment management
├── navigation.spec.ts         # Navigation and routing
├── responsive-design.spec.ts  # Responsive behavior
├── cross-browser.spec.ts      # Browser compatibility
└── README.md                  # This file
```

## 🔧 Configuration

The Playwright configuration is in `playwright.config.ts`:

```typescript
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:5175',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  }
});
```

### Environment Variables

```bash
# Required for tests
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/clinic_test
NATS_URL=nats://localhost:4222
PLAYWRIGHT_BASE_URL=http://localhost:5175

# Optional
HEADLESS=true
BROWSER=chromium
SLOW_MO=0
```

## 🔥 **NEW: Comprehensive System Test Suite**

### 🎯 What the Comprehensive Tests Do

The comprehensive test suite is a **complete system validation** that goes far beyond standard E2E tests. It creates a realistic clinic environment and validates every aspect of the system.

#### 📊 **Database Setup & User Creation**
- **1 Admin Account**: `ofir@metisight.net` / `123456789` (as requested)
- **15 Therapist Accounts**: Realistic profiles with specializations, experience, pricing
- **150+ Client Accounts**: 10+ clients per therapist with goals and progress data
- **25 Shared Clients**: Clients working with multiple therapists
- **Realistic Relationships**: Client-therapist assignments, appointments, session data

#### 🔗 **Complete Backend API Testing**
- **Authentication APIs**: Login, registration, password reset, JWT validation
- **Therapist APIs**: Profile management, client lists, session notes, billing
- **Client APIs**: Goal management, progress tracking, appointment booking
- **Admin APIs**: User management, system config, impersonation features
- **Integration APIs**: File uploads, AI analysis, Google Calendar, billing systems

#### 🖥️ **Complete UI Testing for All User Types**

**👨‍⚕️ Therapist Interface**:
- Dashboard with statistics and quick actions
- Client management with search/filtering
- Appointment scheduling and calendar integration
- Session notes and recording functionality
- AI-powered session analysis
- Billing dashboard and invoice management
- Settings, profile, and notification management

**👤 Client Interface**:
- Progress tracking dashboard with mood tracking
- Goal setting and achievement system
- Coach discovery and booking system
- Appointment management with video sessions
- Progress sharing with therapists
- Multi-language support (English, Hebrew, Arabic)
- Onboarding flow and friend invitations

**👑 Admin Interface**:
- System overview dashboard
- Complete user management (CRUD operations)
- View switching and user impersonation
- System configuration and feature flags
- Security settings and API management
- Backup, compliance, and audit tools
- Subscription and billing management
- System monitoring and health checks

#### 🔄 **Cross-User Integration Testing**
- Therapist creates appointment → Client receives and confirms
- Admin impersonates users and validates their interfaces
- Multi-user real-time scenarios and workflows

### 🚀 **Running Comprehensive Tests**

```bash
# Install test dependencies
cd tests
yarn install
yarn install:browsers

# Run the full comprehensive test suite
yarn test:comprehensive

# Alternative: Run Playwright tests directly  
yarn test

# Debug mode with visible browser
yarn test:headed

# Step-by-step debugging
yarn test:debug
```

### 📊 **Test Results & Outputs**

After running comprehensive tests, you'll find these files in `test-results/`:

#### 🔑 **User Credentials (Most Important!)**
- **`test-credentials.json`**: Complete database of all 165+ user accounts
- **`credentials-report.md`**: Human-readable report with all login details

#### 📈 **Test Reports**
- **`comprehensive-test-report.json`**: Detailed test results and system status
- **`test-summary.md`**: Executive summary of the test run
- **`playwright-report.json`**: Playwright-specific results

#### 🎥 **Debug Artifacts**
- **Screenshots**: Captured on test failures
- **Videos**: Screen recordings of failed tests
- **Traces**: Detailed execution traces for debugging

### 🔑 **Manual Testing Credentials**

After running the comprehensive tests, you'll have access to **165+ realistic user accounts**:

#### **Admin Account**
- Email: `ofir@metisight.net`
- Password: `123456789`

#### **Sample Therapist Accounts**
- `therapist1@clinic-test.com` / `therapist1Pass123!`
- `therapist2@clinic-test.com` / `therapist2Pass123!`
- ... up to `therapist15@clinic-test.com`

#### **Sample Client Accounts**
- `client1_1@clinic-test.com` / `client1_1Pass123!`
- `client1_2@clinic-test.com` / `client1_2Pass123!`
- ... over 150 client accounts

#### **Shared Client Examples**
- `shared_client_1@clinic-test.com` / `sharedClient1Pass123!`
- ... 25 clients with multiple therapist relationships

*Complete credentials available in `test-results/credentials-report.md` after running tests*

### 🎯 **Test Coverage**

The comprehensive test suite validates:
- **165+ user accounts** across all roles and relationships
- **50+ API endpoints** with full authentication and authorization
- **100+ UI components** and complete user workflows
- **Cross-browser compatibility** (Chrome, Firefox, Safari)
- **Mobile responsiveness** (Phone, Tablet, Desktop)
- **Multi-language support** (English, Hebrew, Arabic with RTL)
- **Real-time features** (video calls, notifications, live updates)
- **File upload/download** functionality
- **AI integration** (session analysis, transcription)
- **Billing and payment** systems
- **Security and admin** features

### 🔧 **Comprehensive Test Configuration**

Edit settings in `comprehensive-system-test.spec.ts`:
```typescript
const TEST_CONFIG = {
  BASE_URL: 'http://localhost:5173',
  API_URL: 'http://localhost:4000', 
  ADMIN_EMAIL: 'ofir@metisight.net',
  ADMIN_PASSWORD: '123456789',
  THERAPIST_COUNT: 15,              // Number of therapist accounts
  CLIENTS_PER_THERAPIST: 10,        // Clients per therapist
  SHARED_CLIENTS_COUNT: 25,         // Clients with multiple therapists
  TEST_TIMEOUT: 300000,             // 5 minutes per test
};
```

## 🎯 Test Categories

### 1. Authentication Tests (`auth.spec.ts`)

- ✅ Login with valid credentials
- ✅ Registration flow validation
- ✅ Password reset functionality
- ✅ Google OAuth integration
- ✅ Session management
- ✅ Logout and cleanup

```bash
# Run only auth tests
npx playwright test auth.spec.ts
```

### 2. Patient Management (`patient-management.spec.ts`)

- ✅ View patient list with search/filter
- ✅ Add new patient with validation
- ✅ Edit patient information
- ✅ Delete patient with confirmation
- ✅ Patient detail view
- ✅ Mobile swipe actions

```bash
# Run patient tests
npx playwright test patient-management.spec.ts
```

### 3. Appointment Scheduling (`appointment-scheduling.spec.ts`)

- ✅ Calendar view and navigation
- ✅ Schedule new appointments
- ✅ Edit existing appointments
- ✅ Cancel appointments with reasons
- ✅ Time conflict detection
- ✅ Recurring appointments
- ✅ Online meeting integration

```bash
# Run appointment tests
npx playwright test appointment-scheduling.spec.ts
```

### 4. Navigation & Routing (`navigation.spec.ts`)

- ✅ Responsive navigation (desktop/mobile)
- ✅ Protected route authentication
- ✅ Deep linking and direct access
- ✅ Breadcrumb navigation
- ✅ URL parameter preservation
- ✅ Error handling (404, offline)

```bash
# Run navigation tests
npx playwright test navigation.spec.ts
```

### 5. Responsive Design (`responsive-design.spec.ts`)

- ✅ Mobile viewport (320px-640px)
- ✅ Tablet viewport (640px-1024px)
- ✅ Desktop viewport (1024px+)
- ✅ Breakpoint transitions
- ✅ Touch target sizes
- ✅ Typography scaling
- ✅ Wellness theme consistency

```bash
# Run responsive tests
npx playwright test responsive-design.spec.ts
```

### 6. Cross-Browser Compatibility (`cross-browser.spec.ts`)

- ✅ Chrome/Chromium support
- ✅ Firefox compatibility
- ✅ Safari/WebKit support
- ✅ CSS feature detection
- ✅ JavaScript ES6+ features
- ✅ Form input validation
- ✅ Performance across browsers

```bash
# Run cross-browser tests
npx playwright test cross-browser.spec.ts --project=firefox
```

## 📊 Test Data Management

### Mock Data (`fixtures/test-data.ts`)

```typescript
// Example test user
export const testUsers = {
  therapist: {
    email: 'therapist@test.com',
    password: 'TestPassword123!',
    role: 'therapist',
    name: 'Dr. Sarah Wilson'
  }
};

// Example patient data
export const mockPatients = [
  {
    id: 'patient-1',
    name: 'John Doe',
    email: 'john.doe@test.com',
    phone: '+1-555-0123'
  }
];
```

### Authentication Helpers (`fixtures/auth-helpers.ts`)

```typescript
// Quick login for test setup
await setupAuthenticatedState(page, 'therapist');

// Full UI login flow
await loginViaUI(page, testUsers.therapist);

// Validation helpers
await validateLoginSuccess(page, user);
```

## 🎭 Page Object Model

Tests use data-testid attributes for reliable element selection:

```html
<!-- Good: Stable test selectors -->
<button data-testid="add-patient-button">Add Patient</button>
<input data-testid="patient-name-input" />
<div data-testid="patient-card" />

<!-- Avoid: Fragile selectors -->
<button class="btn btn-primary">Add Patient</button>
```

## 🔍 Debugging Tests

### Debug Mode

```bash
# Run tests with browser visible and dev tools
./scripts/test-e2e.sh --debug --headed

# Or manually
npx playwright test --debug --headed
```

### Screenshots and Videos

```bash
# Screenshots saved on failure automatically
test-results/
├── auth-should-login-chromium/
│   ├── test-finished-1.png
│   └── trace.zip
```

### Trace Viewer

```bash
# View detailed execution trace
npx playwright show-trace test-results/trace.zip
```

## 📈 CI/CD Integration

### GitHub Actions (`.github/workflows/playwright-tests.yml`)

- ✅ Runs on push/PR to main branches
- ✅ Multi-browser matrix testing
- ✅ Parallel test execution
- ✅ Test result artifacts
- ✅ Performance monitoring
- ✅ Visual regression testing
- ✅ Accessibility testing

### Local CI Simulation

```bash
# Run tests like CI
CI=true npx playwright test --reporter=github
```

## 🎨 Wellness Theme Testing

The test suite includes specific validations for the wellness-focused design:

```typescript
// Verify wellness colors
const primaryButton = page.locator('button[variant="contained"]');
const bgColor = await primaryButton.evaluate(el => 
  window.getComputedStyle(el).backgroundColor
);
expect(bgColor).toContain('rgb(46, 125, 107)'); // Wellness green
```

### Theme Elements Tested

- ✅ Wellness color palette (#2E7D6B primary)
- ✅ Glassmorphism effects (backdrop-filter: blur)
- ✅ Wellness emojis (🌿, 🌱, ✨)
- ✅ Therapeutic language ("Clients" vs "Patients")
- ✅ Gradient text effects
- ✅ Responsive spacing system

## 📱 Mobile Testing

### Touch Interactions

```typescript
// Test minimum touch target size
const touchTargets = page.locator('button, a, [role="button"]');
for (const target of touchTargets) {
  const box = await target.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44); // 44px minimum
}
```

### Mobile-Specific Features

- ✅ Bottom navigation on mobile
- ✅ Floating Action Buttons (FAB)
- ✅ Swipe gestures
- ✅ Mobile-optimized forms
- ✅ Touch-friendly inputs

## ♿ Accessibility Testing

### ARIA and Semantic HTML

```typescript
// Verify proper ARIA labels
await expect(page.locator('[data-testid="add-patient-button"]'))
  .toHaveAttribute('aria-label');

// Check heading structure
const headings = page.locator('h1, h2, h3, h4, h5, h6');
expect(await headings.count()).toBeGreaterThan(0);
```

### Keyboard Navigation

```typescript
// Test tab navigation
await page.keyboard.press('Tab');
const focused = page.locator(':focus');
await expect(focused).toBeVisible();
```

## 🚨 Troubleshooting

### Common Issues

**Services not starting:**
```bash
# Check service health
docker compose -f docker-compose.test.yml ps
docker compose -f docker-compose.test.yml logs

# Reset containers
docker compose -f docker-compose.test.yml down
docker system prune -f
```

**Tests timing out:**
```bash
# Increase timeout in playwright.config.ts
timeout: 60 * 1000, // 60 seconds

# Or per test
test('slow test', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes
});
```

**Browser not found:**
```bash
# Reinstall browsers
npx playwright install --force
```

**Port conflicts:**
```bash
# Check what's using ports
netstat -tulpn | grep :5175
lsof -i :4000

# Kill processes
pkill -f "yarn workspace"
```

### Performance Issues

**Slow tests:**
```bash
# Run with performance profiling
npx playwright test --trace=on

# Reduce parallelism
npx playwright test --workers=1
```

**Memory issues:**
```bash
# Monitor memory usage
docker stats

# Restart services between test suites
```

## 📋 Test Checklist

Before committing changes, ensure:

- [ ] All existing tests pass
- [ ] New features have corresponding tests
- [ ] Tests use data-testid attributes
- [ ] Mobile and desktop views tested
- [ ] Accessibility requirements met
- [ ] Error cases handled
- [ ] Performance impact considered

## 🤝 Contributing

### Adding New Tests

1. **Create test file** in appropriate category
2. **Use existing fixtures** for test data
3. **Follow naming conventions** (`feature.spec.ts`)
4. **Add data-testid** attributes to components
5. **Test responsive behavior**
6. **Include accessibility checks**

### Test Naming Convention

```typescript
test.describe('Feature Name', () => {
  test.describe('Sub-feature', () => {
    test('should perform specific action', async ({ page }) => {
      // Test implementation
    });
  });
});
```

### Best Practices

- ✅ Use descriptive test names
- ✅ Group related tests in describe blocks
- ✅ Setup authenticated state in beforeEach
- ✅ Clean up after tests
- ✅ Use page object patterns for complex interactions
- ✅ Test both success and error cases
- ✅ Validate loading states and transitions

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [Accessibility Testing](https://playwright.dev/docs/accessibility-testing)
- [Visual Comparisons](https://playwright.dev/docs/test-screenshots)
- [CI/CD Integration](https://playwright.dev/docs/ci)

## 📞 Support

For questions or issues with the test suite:

1. Check this README
2. Review test output and traces
3. Check existing issues in the repository
4. Create new issue with:
   - Test command used
   - Error messages
   - Environment details
   - Steps to reproduce

---

**Happy Testing! 🧪✨**

The test suite ensures the clinic management application provides a reliable, accessible, and delightful experience for healthcare professionals and their clients.