import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Wellness Coaching Platform E2E tests
 * Comprehensive test suite covering Coach, Client, and Admin user journeys
 * Includes visual regression testing with screenshot comparison
 */
export default defineConfig({
  globalSetup: './tests/fixtures/global-setup.ts',
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],

  // Global timeout for each test
  timeout: 60 * 1000,

  // Expect timeout for assertions
  expect: {
    timeout: 10 * 1000,
    // Visual regression settings
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
      animations: 'disabled',
    },
    toMatchSnapshot: {
      threshold: 0.2,
    },
  },

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Default viewport
    viewport: { width: 1280, height: 720 },
    // Action timeout
    actionTimeout: 15 * 1000,
    // Navigation timeout
    navigationTimeout: 30 * 1000,
    // Set locale to English for consistent test selectors
    locale: 'en-US',
    // Set English language in localStorage before each page load
    storageState: {
      cookies: [],
      origins: [{
        origin: 'http://localhost:5173',
        localStorage: [{
          name: 'clinic-app-language',
          value: 'en',
        }],
      }],
    },
  },

  // Test file patterns
  testMatch: [
    '**/e2e/**/*.spec.ts',
    '**/integration/**/*.spec.ts',
  ],

  // Ignore patterns
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
  ],

  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile browsers
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    // Tablet
    {
      name: 'Tablet',
      use: {
        ...devices['iPad Pro 11'],
      },
    },

    // Visual regression tests (run on chromium only)
    {
      name: 'visual',
      testMatch: '**/visual/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        // Consistent viewport for visual tests
        viewport: { width: 1280, height: 800 },
      },
    },

    // Coach tests
    {
      name: 'coach',
      testMatch: '**/coach/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },

    // Client tests
    {
      name: 'client',
      testMatch: '**/client/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },

    // Admin tests
    {
      name: 'admin',
      testMatch: '**/admin/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Output directories
  outputDir: 'test-results/',
  snapshotDir: 'tests/screenshots',

  webServer: {
    command: 'cd frontend && npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
