const puppeteer = require('puppeteer');
const path = require('path');

async function testCleanUserRegistration() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    // Generate unique test user
    const timestamp = Date.now();
    const testUser = {
      email: `clean-test-${timestamp}@example.com`,
      password: 'TestPassword123!',
      fullname: `Clean Test User ${timestamp}`
    };
    
    console.log(`🧪 Testing clean user registration with: ${testUser.email}`);
    
    // Navigate to registration page
    await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => document.readyState === 'complete');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('📝 Filling registration form...');
    
    // Fill registration form
    await page.type('input[name="name"]', testUser.fullname);
    await page.type('input[name="email"]', testUser.email);
    await page.type('input[name="password"]', testUser.password);
    await page.type('input[name="confirmPassword"]', testUser.password);
    
    // Select therapist role (should be selected by default)
    await page.waitForSelector('input[value="therapist"]');
    await page.click('input[value="therapist"]');
    
    console.log('🚀 Submitting registration...');
    
    // Submit registration
    await page.click('button[type="submit"]');
    
    // Wait for either success redirect or error message
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Check if we're redirected to dashboard (success) or still on registration (error)
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/login')) {
      console.log('✅ Registration successful! User was redirected.');
      
      // If redirected to login, log in
      if (currentUrl.includes('/login')) {
        console.log('🔐 Logging in...');
        await page.type('input[name="email"]', testUser.email);
        await page.type('input[name="password"]', testUser.password);
        await page.click('button[type="submit"]');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      // Check if we reach the dashboard
      await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('🔍 Checking dashboard data isolation...');
      
      // Take screenshot for visual verification
      const screenshotPath = path.join(__dirname, `screenshots/clean-user-dashboard-${timestamp}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`📸 Screenshot saved: ${screenshotPath}`);
      
      // Check for data isolation indicators
      const pageContent = await page.content();
      
      // Look for indicators of existing data (which should NOT be present)
      const hasExistingAppointments = pageContent.includes('appointment') && !pageContent.includes('No appointments');
      const hasExistingClients = pageContent.includes('client') && !pageContent.includes('No clients');
      const hasExistingNotes = pageContent.includes('note') && !pageContent.includes('No notes');
      
      console.log('🏥 Dashboard Content Analysis:');
      console.log(`   - Has existing appointments: ${hasExistingAppointments}`);
      console.log(`   - Has existing clients: ${hasExistingClients}`);
      console.log(`   - Has existing notes: ${hasExistingNotes}`);
      
      if (!hasExistingAppointments && !hasExistingClients && !hasExistingNotes) {
        console.log('🎉 SUCCESS: Clean user registration verified! User sees clean dashboard.');
      } else {
        console.log('❌ FAIL: Data isolation issue - new user sees existing data.');
      }
      
    } else {
      console.log('❌ Registration failed or encountered an error');
      
      // Check for error messages
      const errorElements = await page.$$('[role="alert"], .error, .Mui-error');
      for (const element of errorElements) {
        const errorText = await page.evaluate(el => el.textContent, element);
        console.log(`🚨 Error message: ${errorText}`);
      }
      
      // Take screenshot of error state
      const errorScreenshotPath = path.join(__dirname, `screenshots/registration-error-${timestamp}.png`);
      await page.screenshot({ path: errorScreenshotPath, fullPage: true });
      console.log(`📸 Error screenshot saved: ${errorScreenshotPath}`);
    }
    
  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
  } finally {
    await browser.close();
  }
}

testCleanUserRegistration();