# 🧪 Playwright E2E Test Suite

Comprehensive end-to-end testing suite for the Clinic Management Application using Playwright.

## 📋 Overview

This test suite provides thorough coverage of the clinic management application including:

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

```bash
# Run all tests (recommended)
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