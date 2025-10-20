const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:5173';

// Test data with unique timestamps
const timestamp = Date.now();
const testTherapist = {
  fullName: 'Test Coach ' + timestamp,
  email: `coach_${timestamp}@test.com`,
  password: 'SecurePass123!',
};

const testClient = {
  fullName: 'Test Client ' + timestamp,
  email: `client_${timestamp}@test.com`,
  password: 'ClientPass123!',
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testTherapistRegistration() {
  console.log('\n=== Testing Therapist/Coach Registration ===');
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: ['--no-sandbox'],
    defaultViewport: { width: 1280, height: 720 }
  });

  try {
    const page = await browser.newPage();
    
    // Navigate to registration
    console.log('1. Navigating to registration page...');
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle2' });
    await delay(2000);
    
    // Fill the form
    console.log('2. Filling registration form...');
    
    // Full Name
    await page.type('input[placeholder="Full Name"]', testTherapist.fullName);
    
    // Email
    await page.type('input[placeholder="Email"]', testTherapist.email);
    
    // Password
    await page.type('input[placeholder="Password"]', testTherapist.password);
    
    // Confirm Password
    await page.type('input[placeholder="Confirm Password"]', testTherapist.password);
    
    // Select Therapist role (should be selected by default)
    const therapistRadio = await page.$('input[type="radio"][value="therapist"]');
    if (therapistRadio) {
      await therapistRadio.click();
    }
    
    console.log('3. Submitting registration form...');
    await page.screenshot({ path: 'screenshots/manual-therapist-reg-filled.png' });
    
    // Click Register button
    await page.click('button:has-text("Register")');
    
    // Wait for navigation or error
    await delay(5000);
    
    const currentUrl = page.url();
    console.log('4. Result URL:', currentUrl);
    await page.screenshot({ path: 'screenshots/manual-therapist-reg-result.png' });
    
    if (currentUrl.includes('dashboard') || currentUrl.includes('login')) {
      console.log('✅ Therapist registration successful!');
      console.log('   Email:', testTherapist.email);
      console.log('   Password:', testTherapist.password);
    } else {
      // Check for error messages
      const errorText = await page.evaluate(() => {
        const alerts = document.querySelectorAll('.MuiAlert-message, .error, [role="alert"]');
        return Array.from(alerts).map(el => el.textContent).join(' ');
      });
      
      if (errorText) {
        console.log('❌ Registration failed with error:', errorText);
      } else {
        console.log('⚠️ Registration status unclear. Current page:', currentUrl);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

async function testClientRegistration() {
  console.log('\n=== Testing Client Registration ===');
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: ['--no-sandbox'],
    defaultViewport: { width: 1280, height: 720 }
  });

  try {
    const page = await browser.newPage();
    
    // Navigate to client registration
    console.log('1. Navigating to client registration page...');
    await page.goto(`${BASE_URL}/client/register`, { waitUntil: 'networkidle2' });
    await delay(2000);
    
    // Check if redirected to regular registration
    const currentUrl = page.url();
    if (!currentUrl.includes('client')) {
      console.log('   Note: Redirected to general registration page');
      await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle2' });
    }
    
    console.log('2. Filling client registration form...');
    
    // Fill form fields
    await page.type('input[placeholder="Full Name"]', testClient.fullName);
    await page.type('input[placeholder="Email"]', testClient.email);
    await page.type('input[placeholder="Password"]', testClient.password);
    await page.type('input[placeholder="Confirm Password"]', testClient.password);
    
    // Select Patient/Client role
    const patientRadio = await page.$('input[type="radio"][value="patient"]');
    if (patientRadio) {
      await patientRadio.click();
      console.log('   Selected Patient/Client role');
    }
    
    console.log('3. Submitting registration form...');
    await page.screenshot({ path: 'screenshots/manual-client-reg-filled.png' });
    
    // Click Register button
    await page.click('button:has-text("Register")');
    
    // Wait for response
    await delay(5000);
    
    const resultUrl = page.url();
    console.log('4. Result URL:', resultUrl);
    await page.screenshot({ path: 'screenshots/manual-client-reg-result.png' });
    
    if (resultUrl.includes('client') || resultUrl.includes('goals') || resultUrl.includes('login')) {
      console.log('✅ Client registration successful!');
      console.log('   Email:', testClient.email);
      console.log('   Password:', testClient.password);
    } else {
      const errorText = await page.evaluate(() => {
        const alerts = document.querySelectorAll('.MuiAlert-message, .error, [role="alert"]');
        return Array.from(alerts).map(el => el.textContent).join(' ');
      });
      
      if (errorText) {
        console.log('❌ Registration failed with error:', errorText);
      } else {
        console.log('⚠️ Registration status unclear. Current page:', resultUrl);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

async function testLogin() {
  console.log('\n=== Testing Login Flow ===');
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: ['--no-sandbox'],
    defaultViewport: { width: 1280, height: 720 }
  });

  try {
    const page = await browser.newPage();
    
    console.log('1. Navigating to login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await delay(2000);
    
    console.log('2. Attempting login with therapist credentials...');
    
    // Try to find email/username field
    const emailField = await page.$('input[type="email"], input[placeholder*="Email"], input[name="email"]');
    if (emailField) {
      await emailField.type(testTherapist.email);
    }
    
    // Try to find password field
    const passwordField = await page.$('input[type="password"], input[placeholder*="Password"]');
    if (passwordField) {
      await passwordField.type(testTherapist.password);
    }
    
    await page.screenshot({ path: 'screenshots/manual-login-filled.png' });
    
    // Find and click login button
    const loginButton = await page.$('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    if (loginButton) {
      await loginButton.click();
    }
    
    await delay(5000);
    
    const resultUrl = page.url();
    console.log('3. Result URL:', resultUrl);
    await page.screenshot({ path: 'screenshots/manual-login-result.png' });
    
    if (resultUrl.includes('dashboard')) {
      console.log('✅ Login successful! Redirected to dashboard');
      
      // Check user info
      const userInfo = await page.evaluate(() => {
        const userElements = document.querySelectorAll('[data-testid*="user"], .user-info, .user-name');
        return Array.from(userElements).map(el => el.textContent).join(' ');
      });
      
      if (userInfo) {
        console.log('   User info found:', userInfo);
      }
    } else {
      console.log('⚠️ Login result unclear. Current page:', resultUrl);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

async function testDashboardFeatures() {
  console.log('\n=== Testing Dashboard Features ===');
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: ['--no-sandbox'],
    defaultViewport: { width: 1280, height: 720 }
  });

  try {
    const page = await browser.newPage();
    
    // First login
    console.log('1. Logging in first...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await delay(1000);
    
    await page.type('input[type="email"], input[placeholder*="Email"]', testTherapist.email);
    await page.type('input[type="password"]', testTherapist.password);
    await page.click('button[type="submit"]');
    await delay(3000);
    
    console.log('2. Exploring dashboard features...');
    await page.screenshot({ path: 'screenshots/manual-dashboard-main.png' });
    
    // Check for main navigation items
    const navItems = await page.evaluate(() => {
      const items = document.querySelectorAll('nav a, nav button, [role="navigation"] a');
      return Array.from(items).map(el => el.textContent?.trim()).filter(Boolean);
    });
    
    console.log('   Found navigation items:', navItems);
    
    // Try to navigate to different sections
    const sections = ['Calendar', 'Clients', 'Settings', 'AI Tools'];
    
    for (const section of sections) {
      const link = await page.$(`a:has-text("${section}"), button:has-text("${section}")`);
      if (link) {
        console.log(`   Clicking on ${section}...`);
        await link.click();
        await delay(2000);
        await page.screenshot({ path: `screenshots/manual-dashboard-${section.toLowerCase()}.png` });
      }
    }
    
    console.log('✅ Dashboard exploration completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Main execution
async function runTests() {
  console.log('🚀 Starting Manual UI Validation Tests');
  console.log('=====================================\n');
  
  // Create screenshots directory if it doesn't exist
  const fs = require('fs');
  if (!fs.existsSync('screenshots')) {
    fs.mkdirSync('screenshots');
  }
  
  await testTherapistRegistration();
  await delay(2000);
  
  await testClientRegistration();
  await delay(2000);
  
  await testLogin();
  await delay(2000);
  
  await testDashboardFeatures();
  
  console.log('\n=====================================');
  console.log('✅ All manual tests completed!');
  console.log('Check the screenshots folder for visual validation');
  console.log('\nTest Credentials Created:');
  console.log('Therapist:', testTherapist.email, '/', testTherapist.password);
  console.log('Client:', testClient.email, '/', testClient.password);
}

runTests().catch(console.error);