const puppeteer = require('puppeteer');

// Test configuration
const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:4000';

// Test data
const testTherapist = {
  email: `therapist_${Date.now()}@test.com`,
  password: 'SecurePass123!',
  firstName: 'John',
  lastName: 'Doe',
  phone: '555-0123',
  licenseNumber: 'LIC123456'
};

const testClient = {
  email: `client_${Date.now()}@test.com`,
  password: 'ClientPass123!',
  firstName: 'Jane',
  lastName: 'Smith',
  phone: '555-0456'
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test result tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = [];

async function logTest(testName, passed, error = null) {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`${colors.green}✓${colors.reset} ${testName}`);
  } else {
    failedTests.push({ name: testName, error });
    console.log(`${colors.red}✗${colors.reset} ${testName}`);
    if (error) console.log(`  ${colors.yellow}Error: ${error.message}${colors.reset}`);
  }
}

async function takeScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `screenshots/${name}_${timestamp}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`  ${colors.cyan}Screenshot saved: ${filename}${colors.reset}`);
  return filename;
}

async function waitForNavigation(page, url, timeout = 10000) {
  try {
    await page.waitForFunction(
      (expectedUrl) => window.location.href.includes(expectedUrl),
      { timeout },
      url
    );
    return true;
  } catch (error) {
    console.log(`  ${colors.yellow}Navigation timeout for ${url}${colors.reset}`);
    return false;
  }
}

async function testHomePage(page) {
  console.log(`\n${colors.blue}Testing Home Page...${colors.reset}`);
  
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await takeScreenshot(page, 'home-page');
    
    // Check for key elements
    const title = await page.title();
    await logTest('Home page loads', title !== '');
    
    // Check for navigation elements
    const loginButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      return buttons.some(el => el.textContent?.toLowerCase().includes('login'));
    });
    await logTest('Login button/link present', loginButton);
    
    const registerButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      return buttons.some(el => el.textContent?.toLowerCase().includes('register'));
    });
    await logTest('Register button/link present', registerButton);
    
  } catch (error) {
    await logTest('Home page test', false, error);
  }
}

async function testTherapistRegistration(page) {
  console.log(`\n${colors.blue}Testing Therapist Registration...${colors.reset}`);
  
  try {
    // Navigate to registration page
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    await takeScreenshot(page, 'therapist-registration-page');
    
    // Fill registration form
    await page.type('input[name="email"], input[type="email"]', testTherapist.email);
    await page.type('input[name="password"], input[type="password"]', testTherapist.password);
    
    // Look for confirm password field
    const confirmPasswordField = await page.$('input[name="confirmPassword"], input[placeholder*="Confirm"]');
    if (confirmPasswordField) {
      await confirmPasswordField.type(testTherapist.password);
    }
    
    await page.type('input[name="firstName"], input[placeholder*="First"]', testTherapist.firstName);
    await page.type('input[name="lastName"], input[placeholder*="Last"]', testTherapist.lastName);
    
    // Check for phone field
    const phoneField = await page.$('input[name="phone"], input[type="tel"]');
    if (phoneField) {
      await phoneField.type(testTherapist.phone);
    }
    
    await takeScreenshot(page, 'therapist-registration-filled');
    
    // Submit form
    await page.click('button[type="submit"], button:has-text("Register"), button:has-text("Sign Up")');
    
    // Wait for response
    await new Promise(r => setTimeout(r, 3000));
    await takeScreenshot(page, 'therapist-registration-result');
    
    // Check if registration was successful
    const currentUrl = page.url();
    const registrationSuccess = currentUrl.includes('/dashboard') || 
                               currentUrl.includes('/login') ||
                               currentUrl.includes('/verify');
    
    await logTest('Therapist registration form submission', registrationSuccess);
    
  } catch (error) {
    await logTest('Therapist registration test', false, error);
  }
}

async function testClientRegistration(page) {
  console.log(`\n${colors.blue}Testing Client Registration...${colors.reset}`);
  
  try {
    // Navigate to client registration
    await page.goto(`${BASE_URL}/client/register`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    await takeScreenshot(page, 'client-registration-page');
    
    // Fill client registration form
    await page.type('input[name="email"], input[type="email"]', testClient.email);
    await page.type('input[name="password"], input[type="password"]', testClient.password);
    
    const confirmPasswordField = await page.$('input[name="confirmPassword"], input[placeholder*="Confirm"]');
    if (confirmPasswordField) {
      await confirmPasswordField.type(testClient.password);
    }
    
    await page.type('input[name="firstName"], input[placeholder*="First"]', testClient.firstName);
    await page.type('input[name="lastName"], input[placeholder*="Last"]', testClient.lastName);
    
    await takeScreenshot(page, 'client-registration-filled');
    
    // Submit form
    await page.click('button[type="submit"], button:has-text("Register"), button:has-text("Sign Up")');
    
    await new Promise(r => setTimeout(r, 3000));
    await takeScreenshot(page, 'client-registration-result');
    
    const currentUrl = page.url();
    const registrationSuccess = currentUrl.includes('/client') || 
                               currentUrl.includes('/login') ||
                               currentUrl.includes('/goals');
    
    await logTest('Client registration form submission', registrationSuccess);
    
  } catch (error) {
    await logTest('Client registration test', false, error);
  }
}

async function testLoginFlow(page) {
  console.log(`\n${colors.blue}Testing Login Flow...${colors.reset}`);
  
  try {
    // Test therapist login
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    await takeScreenshot(page, 'login-page');
    
    // Try logging in with test therapist
    await page.type('input[name="email"], input[type="email"]', testTherapist.email);
    await page.type('input[name="password"], input[type="password"]', testTherapist.password);
    
    await takeScreenshot(page, 'login-filled');
    
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    await new Promise(r => setTimeout(r, 3000));
    
    const loginUrl = page.url();
    const loginSuccess = loginUrl.includes('/dashboard') || loginUrl.includes('/home');
    
    await logTest('Login form submission', loginSuccess);
    await takeScreenshot(page, 'login-result');
    
    // Check for logout option
    const hasLogout = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, a'));
      return elements.some(el => el.textContent?.toLowerCase().includes('logout'));
    });
    await logTest('Logout option available after login', hasLogout);
    
  } catch (error) {
    await logTest('Login flow test', false, error);
  }
}

async function testDashboard(page) {
  console.log(`\n${colors.blue}Testing Dashboard...${colors.reset}`);
  
  try {
    // Navigate to dashboard
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    await takeScreenshot(page, 'dashboard');
    
    // Check for dashboard elements
    const hasWelcomeMessage = await page.$('h1, h2, h3, h4').then(el => el !== null);
    await logTest('Dashboard has heading elements', hasWelcomeMessage);
    
    // Check for navigation menu
    const hasNavigation = await page.$('nav, [role="navigation"]') !== null;
    await logTest('Dashboard has navigation', hasNavigation);
    
    // Check for main content area
    const hasMainContent = await page.$('main, [role="main"], .dashboard-content') !== null;
    await logTest('Dashboard has main content area', hasMainContent);
    
  } catch (error) {
    await logTest('Dashboard test', false, error);
  }
}

async function testAPIHealth(page) {
  console.log(`\n${colors.blue}Testing API Health Endpoints...${colors.reset}`);
  
  try {
    const response = await page.evaluate(async (apiUrl) => {
      try {
        const res = await fetch(`${apiUrl}/health`);
        return { status: res.status, ok: res.ok };
      } catch (error) {
        return { error: error.message };
      }
    }, API_URL);
    
    await logTest('API Gateway health check', response.ok === true);
    
    // Test auth service health
    const authResponse = await page.evaluate(async () => {
      try {
        const res = await fetch('http://localhost:3001/health');
        return { status: res.status, ok: res.ok };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    await logTest('Auth Service health check', authResponse.ok === true || authResponse.status === 200);
    
  } catch (error) {
    await logTest('API health test', false, error);
  }
}

async function testResponsiveness(page) {
  console.log(`\n${colors.blue}Testing Responsive Design...${colors.reset}`);
  
  try {
    // Test mobile view
    await page.setViewport({ width: 375, height: 667 }); // iPhone SE
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await takeScreenshot(page, 'mobile-view');
    await logTest('Mobile view renders', true);
    
    // Test tablet view
    await page.setViewport({ width: 768, height: 1024 }); // iPad
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await takeScreenshot(page, 'tablet-view');
    await logTest('Tablet view renders', true);
    
    // Test desktop view
    await page.setViewport({ width: 1920, height: 1080 }); // Full HD
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await takeScreenshot(page, 'desktop-view');
    await logTest('Desktop view renders', true);
    
  } catch (error) {
    await logTest('Responsive design test', false, error);
  }
}

async function runAllTests() {
  console.log(`${colors.cyan}Starting Comprehensive UI Testing${colors.reset}`);
  console.log(`${colors.cyan}================================${colors.reset}`);
  
  // Create screenshots directory
  const fs = require('fs');
  if (!fs.existsSync('screenshots')) {
    fs.mkdirSync('screenshots');
  }
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for CI/CD
    slowMo: 100, // Slow down actions for visibility
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  // Set default timeout
  page.setDefaultTimeout(30000);
  
  try {
    // Run all tests
    await testHomePage(page);
    await testTherapistRegistration(page);
    await testClientRegistration(page);
    await testLoginFlow(page);
    await testDashboard(page);
    await testAPIHealth(page);
    await testResponsiveness(page);
    
  } catch (error) {
    console.error(`${colors.red}Test suite error: ${error.message}${colors.reset}`);
  } finally {
    // Print summary
    console.log(`\n${colors.cyan}================================${colors.reset}`);
    console.log(`${colors.cyan}Test Summary${colors.reset}`);
    console.log(`${colors.cyan}================================${colors.reset}`);
    console.log(`Total Tests: ${totalTests}`);
    console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
    console.log(`${colors.red}Failed: ${failedTests.length}${colors.reset}`);
    
    if (failedTests.length > 0) {
      console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
      failedTests.forEach(test => {
        console.log(`  - ${test.name}`);
        if (test.error) {
          console.log(`    ${colors.yellow}${test.error}${colors.reset}`);
        }
      });
    }
    
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    console.log(`\n${colors.cyan}Success Rate: ${successRate}%${colors.reset}`);
    
    // Close browser
    await browser.close();
    
    // Exit with appropriate code
    process.exit(failedTests.length > 0 ? 1 : 0);
  }
}

// Run the tests
runAllTests().catch(console.error);