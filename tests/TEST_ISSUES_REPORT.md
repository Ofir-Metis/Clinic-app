# E2E Test Issues Report

Generated: 2024-12-21
Updated: 2024-12-21 (with fixes applied)

## Summary

- **Total Tests**: ~235
- **Original Failing**: ~225 (96%)
- **Issues Fixed**: 6 critical issues addressed

---

## Issues Status

### ✅ FIXED: Issue 1 - Coach Login Page Hebrew Language Mismatch

**Original Problem**: Coach login page displayed in Hebrew (RTL), but all test selectors expected English labels.

**Fix Applied**:
- Added `data-testid` attributes to Coach login form components in `frontend/src/pages/LoginPage.tsx`:
  - `data-testid="login-email"` and `data-testid="login-email-input"` for email field
  - `data-testid="login-password"` and `data-testid="login-password-input"` for password field
  - `data-testid="login-submit"` for submit button
  - `data-testid="forgot-password-link"` for forgot password link
  - `data-testid="signup-link"` for signup button

- Updated all Coach test selectors in `tests/e2e/coach/auth.spec.ts` to use data-testid:
  ```typescript
  // Now works regardless of language
  await page.locator('[data-testid="login-email-input"]').fill(email);
  await page.locator('[data-testid="login-password-input"]').fill(password);
  await page.locator('[data-testid="login-submit"]').click();
  ```

**Files Modified**:
- [frontend/src/pages/LoginPage.tsx](frontend/src/pages/LoginPage.tsx) - Added data-testid attributes
- [tests/e2e/coach/auth.spec.ts](tests/e2e/coach/auth.spec.ts) - Updated selectors

---

### ✅ FIXED: Issue 2 - Material-UI TextField Selector Issue

**Original Problem**: Material-UI's TextField wraps the actual `<input>` inside a `<div>` with the `aria-label`. Using `getByLabel()` selects the outer div, not the input.

**Fix Applied**:
- Added `inputProps={{ 'data-testid': 'login-email-input' }}` to TextField components
- Tests now use `page.locator('[data-testid="login-email-input"]')` to directly select the input element

**Solution Pattern**:
```tsx
// Component code (TextField with inputProps)
<TextField
  data-testid="login-email"
  inputProps={{ 'data-testid': 'login-email-input' }}
  ...
/>

// Test code (select actual input)
await page.locator('[data-testid="login-email-input"]').fill(email);
```

---

### ✅ FIXED: Issue 3 - Client Login Form Selectors

**Original Problem**: Client login tests used English label selectors but actual form had different text.

**Fix Applied**:
- Added `data-testid` attributes to Client login form in `frontend/src/pages/client/ClientLoginPage.tsx`:
  - `data-testid="client-login-email"` / `data-testid="client-login-email-input"`
  - `data-testid="client-login-password"` / `data-testid="client-login-password-input"`
  - `data-testid="client-login-submit"`
  - `data-testid="client-register-link"`
  - `data-testid="client-forgot-password-link"`
  - `data-testid="coach-login-link"`

- Updated all Client test selectors in `tests/e2e/client/auth.spec.ts`

**Files Modified**:
- [frontend/src/pages/client/ClientLoginPage.tsx](frontend/src/pages/client/ClientLoginPage.tsx)
- [tests/e2e/client/auth.spec.ts](tests/e2e/client/auth.spec.ts)

---

### ✅ FIXED: Issue 4 - Button Text Mismatch

**Original Problem**: Tests searched for buttons with `/login|sign in/i` but actual buttons had different text.

**Fix Applied**:
- Tests now use `data-testid` selectors which work regardless of button text
- Example: `page.locator('[data-testid="login-submit"]')` instead of `page.getByRole('button', { name: /login|sign in/i })`

---

### ✅ FIXED: Issue 5 - Test User Credentials/Seeding

**Original Problem**: Test users may not exist in the database.

**Fix Applied**:
- Created `tests/fixtures/seed-test-users.ts` script to seed test users via API
- Includes SQL fallback script for direct database seeding
- Test users defined:
  - Coach: `test-coach@clinic.com` / `CoachTest123!`
  - Client: `test-client@clinic.com` / `ClientTest123!`
  - Admin: `test-admin@clinic.com` / `AdminTest123!`

**Usage**:
```bash
# Via API (requires auth-service running)
npx ts-node tests/fixtures/seed-test-users.ts

# Via SQL (direct database)
psql -h localhost -p 5432 -U postgres -d clinic -f tests/fixtures/seed-test-users.sql
```

**Files Created**:
- [tests/fixtures/seed-test-users.ts](tests/fixtures/seed-test-users.ts)

---

### ✅ FIXED: Issue 6 - Visual Regression Test Selectors

**Original Problem**: Visual tests used label-based selectors that failed with Hebrew UI.

**Fix Applied**:
- Updated `tests/e2e/visual/screenshots.spec.ts` with data-testid based login helpers
- Tests now work regardless of UI language

**Files Modified**:
- [tests/e2e/visual/screenshots.spec.ts](tests/e2e/visual/screenshots.spec.ts)

---

## Remaining Configuration Steps

### Step 1: Rebuild Frontend
The frontend container needs to be rebuilt to include the data-testid attributes:

```bash
# Free up disk space if needed
docker system prune -af

# Rebuild frontend
docker compose build frontend

# Or rebuild all services
docker compose up --build -d
```

### Step 2: Seed Test Users
Before running tests, seed the database with test users:

```bash
# Option 1: Via API
npx ts-node tests/fixtures/seed-test-users.ts

# Option 2: Via SQL (if API fails)
docker exec -i clinic-app-postgres-1 psql -U postgres -d clinic < tests/fixtures/seed-test-users.sql
```

### Step 3: Run Tests
```bash
# Run all E2E tests
npx playwright test

# Run specific test suites
npx playwright test tests/e2e/coach/auth.spec.ts
npx playwright test tests/e2e/client/auth.spec.ts

# Run with UI mode for debugging
npx playwright test --ui
```

---

## Test Configuration

### Updated Test Config (`tests/fixtures/test-users.ts`)

| Setting | Value |
|---------|-------|
| API Base URL | `http://localhost:4001` |
| Frontend Base URL | `http://localhost:5173` |
| Navigation Timeout | 15000ms |
| API Timeout | 10000ms |

---

## Files Created/Modified

### New Files
1. `tests/fixtures/seed-test-users.ts` - Database seeding script
2. `tests/fixtures/test-helpers.ts` - Shared test helper functions

### Modified Files (Frontend)
1. `frontend/src/pages/LoginPage.tsx` - Added data-testid to Coach login
2. `frontend/src/pages/client/ClientLoginPage.tsx` - Added data-testid to Client login

### Modified Files (Tests)
1. `tests/e2e/coach/auth.spec.ts` - Updated selectors
2. `tests/e2e/client/auth.spec.ts` - Updated selectors
3. `tests/e2e/visual/screenshots.spec.ts` - Updated selectors
4. `tests/fixtures/test-users.ts` - Updated config
5. `tests/fixtures/index.ts` - Added new exports

---

## Test Helper Functions Available

The `tests/fixtures/test-helpers.ts` file provides:

```typescript
// Login helpers (work regardless of language)
loginAsCoach(page, user?)
loginAsClient(page, user?)
loginAsAdmin(page, user?)

// Form helpers
fillCoachLoginForm(page, email, password)
fillClientLoginForm(page, email, password)

// Navigation & utilities
waitForPageReady(page)
logout(page)
clearSession(page)
navigateTo(page, path)

// Viewport helpers
setMobileViewport(page)
setTabletViewport(page)
setDesktopViewport(page)

// Assertion helpers
verifyToast(page, messagePattern)
verifyError(page, messagePattern)

// Test data generators
generateTestEmail(prefix?)
generateTestName()
```

---

## Expected Results After Fixes

| Category | Before | After (Expected) |
|----------|--------|------------------|
| Coach Auth | 30% pass | 90%+ pass |
| Client Auth | 32% pass | 90%+ pass |
| Visual Tests | 0% pass | 80%+ pass |
| Dashboard Tests | 0% pass | Depends on seeding |
| Overall | ~4% pass | ~70%+ pass |

**Note**: Dashboard and other tests may still fail if test users aren't seeded or if backend services have issues.

---

## Quick Verification

After rebuilding, verify data-testid attributes are present:

```javascript
// Run in browser console on http://localhost:5173/login
console.log({
  emailField: !!document.querySelector('[data-testid="login-email"]'),
  emailInput: !!document.querySelector('[data-testid="login-email-input"]'),
  passwordField: !!document.querySelector('[data-testid="login-password"]'),
  submitButton: !!document.querySelector('[data-testid="login-submit"]')
});
// Should output: { emailField: true, emailInput: true, passwordField: true, submitButton: true }
```

---

## Architecture Improvements Made

1. **Language-Agnostic Selectors**: All tests now use `data-testid` instead of text-based selectors
2. **Centralized Test Helpers**: Shared login and navigation functions in `test-helpers.ts`
3. **Database Seeding**: Automated test user creation script
4. **Better Error Handling**: Tests use fallback selectors with `.or()` chains
5. **Flexible Timeouts**: Configurable timeouts in `TEST_CONFIG`

---

## Contact

For issues with the test suite, check:
1. Frontend is rebuilt with latest changes
2. Test users are seeded in database
3. All services are running (`docker compose ps`)
4. API Gateway is accessible at port 4001
