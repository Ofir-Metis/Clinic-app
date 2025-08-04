import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Comprehensive Clinic System Tests
 * 
 * This configuration supports:
 * - Cross-browser testing (Chrome, Firefox, Safari)
 * - Mobile viewport testing
 * - Video recording for debugging
 * - Screenshots on failure
 * - Parallel test execution
 */

export default defineConfig({
  testDir: './',
  /* Maximum time one test can run for */
  timeout: 300 * 1000, // 5 minutes
  expect: {
    /* Maximum time expect() should wait for the condition to be met */
    timeout: 10000
  },
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/playwright-report.json' }],
    ['junit', { outputFile: 'test-results/junit-report.xml' }]
  ],
  /* Shared settings for all the projects below */
  use: {
    /* Maximum time each action such as `click()` can take */
    actionTimeout: 10000,
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: 'http://localhost:5173',
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    /* Record video on failure */
    video: 'retain-on-failure',
    /* Ignore HTTPS errors */
    ignoreHTTPSErrors: true,
  },

  /* Configure projects for major browsers */
  projects: [
    /* Desktop browsers */
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
    },

    /* Mobile viewports */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Tablet viewports */
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    },
  ],

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: 'test-results/',

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'yarn workspace @clinic/api-gateway start:dev',
      port: 4000,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd frontend && yarn dev',
      port: 5173,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    }
  ],

  /* Global test setup */
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
});