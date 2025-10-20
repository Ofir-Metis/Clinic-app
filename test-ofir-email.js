const puppeteer = require('puppeteer');
const path = require('path');

async function testOfirEmailScenario() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    console.log(`🔍 TESTING SPECIFIC SCENARIO: ofir.bracha@gmail.com`);
    console.log(`📅 Test time: ${new Date().toISOString()}`);
    
    // First, let's try to login with the email to see current state
    console.log('🔐 Attempting to login with ofir.bracha@gmail.com...');
    
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => document.readyState === 'complete');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try logging in
    await page.type('input[name="email"]', 'ofir.bracha@gmail.com');
    await page.type('input[name="password"]', 'password123'); // Common password
    await page.click('button[type="submit"]');
    
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    let currentUrl = page.url();
    console.log(`📍 URL after login attempt: ${currentUrl}`);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Login successful - user exists');
      
      // Test dashboard
      console.log('📊 Testing Dashboard page...');
      await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const dashboardScreenshot = path.join(__dirname, 'screenshots/ofir-dashboard-test.png');
      await page.screenshot({ path: dashboardScreenshot, fullPage: true });
      console.log(`📸 Dashboard screenshot: ${dashboardScreenshot}`);
      
      // Test clients page 
      console.log('👥 Testing Clients page...');
      await page.goto('http://localhost:5173/clients', { waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const clientsScreenshot = path.join(__dirname, 'screenshots/ofir-clients-test.png');
      await page.screenshot({ path: clientsScreenshot, fullPage: true });
      console.log(`📸 Clients screenshot: ${clientsScreenshot}`);
      
      // Test settings page
      console.log('⚙️ Testing Settings page...');
      await page.goto('http://localhost:5173/settings', { waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const settingsScreenshot = path.join(__dirname, 'screenshots/ofir-settings-test.png');
      await page.screenshot({ path: settingsScreenshot, fullPage: true });
      console.log(`📸 Settings screenshot: ${settingsScreenshot}`);
      
      // Analyze content
      const dashboardContent = await page.evaluate(() => {
        return {
          text: document.body.innerText,
          html: document.body.innerHTML
        };
      });
      
      console.log('🔍 CONTENT ANALYSIS:');
      
      // Check for client data contamination
      const hasClientData = dashboardContent.text.includes('client') && 
                           !dashboardContent.text.toLowerCase().includes('no clients');
      
      // Check for therapist information 
      const hasTherapistInfo = dashboardContent.text.includes('therapist') ||
                              dashboardContent.text.includes('Therapist');
      
      // Check for existing appointments
      const hasAppointments = dashboardContent.text.includes('appointment') &&
                             !dashboardContent.text.toLowerCase().includes('no appointments');
      
      console.log(`   👥 Has client data: ${hasClientData}`);
      console.log(`   🩺 Has therapist info: ${hasTherapistInfo}`);
      console.log(`   📅 Has appointments: ${hasAppointments}`);
      
      // Check for specific user emails or names that shouldn't be there
      const otherUserPattern = /@(clinic|example|test)\.com|demo|test/i;
      const hasOtherUserData = otherUserPattern.test(dashboardContent.text);
      console.log(`   📧 Has other user data: ${hasOtherUserData}`);
      
      if (hasClientData || hasTherapistInfo || hasAppointments || hasOtherUserData) {
        console.log('❌ DATA ISOLATION FAILURE CONFIRMED');
        console.log('🚨 User is seeing data from other users');
      } else {
        console.log('✅ Data isolation appears to be working');
      }
      
    } else {
      console.log('❌ Login failed - user might not exist or wrong password');
      console.log('🔄 Let\'s try to register the user instead...');
      
      // Try registration
      await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await page.type('input[name="name"]', 'Ofir Bracha');
      await page.type('input[name="email"]', 'ofir.bracha@gmail.com');
      await page.type('input[name="password"]', 'TestPassword123!');
      await page.type('input[name="confirmPassword"]', 'TestPassword123!');
      
      // Select therapist role
      await page.waitForSelector('input[value="therapist"]');
      await page.click('input[value="therapist"]');
      
      await page.click('button[type="submit"]');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      currentUrl = page.url();
      console.log(`📍 URL after registration: ${currentUrl}`);
      
      if (currentUrl.includes('/dashboard')) {
        console.log('✅ Registration successful');
        
        // Take screenshots of all pages immediately after registration
        const regDashboardScreenshot = path.join(__dirname, 'screenshots/ofir-reg-dashboard.png');
        await page.screenshot({ path: regDashboardScreenshot, fullPage: true });
        console.log(`📸 Post-registration dashboard: ${regDashboardScreenshot}`);
        
        // Check clients page
        await page.goto('http://localhost:5173/clients', { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const regClientsScreenshot = path.join(__dirname, 'screenshots/ofir-reg-clients.png');
        await page.screenshot({ path: regClientsScreenshot, fullPage: true });
        console.log(`📸 Post-registration clients: ${regClientsScreenshot}`);
        
        // Check settings page
        await page.goto('http://localhost:5173/settings', { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const regSettingsScreenshot = path.join(__dirname, 'screenshots/ofir-reg-settings.png');
        await page.screenshot({ path: regSettingsScreenshot, fullPage: true });
        console.log(`📸 Post-registration settings: ${regSettingsScreenshot}`);
        
        // Analyze fresh registration content
        const pageText = await page.evaluate(() => document.body.innerText);
        
        console.log('🔍 FRESH REGISTRATION ANALYSIS:');
        console.log(`   Page text sample: ${pageText.substring(0, 200)}...`);
        
        const hasOtherData = pageText.includes('demo') || 
                           pageText.includes('test@') ||
                           (pageText.includes('client') && !pageText.includes('No clients'));
        
        if (hasOtherData) {
          console.log('❌ FRESH REGISTRATION STILL SHOWS OTHER USER DATA');
        } else {
          console.log('✅ Fresh registration shows clean data');
        }
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    
    // Take error screenshot
    try {
      const errorScreenshot = path.join(__dirname, 'screenshots/ofir-error.png');
      await page.screenshot({ path: errorScreenshot, fullPage: true });
      console.log(`📸 Error screenshot: ${errorScreenshot}`);
    } catch (e) {
      console.log('Could not take error screenshot');
    }
  } finally {
    await browser.close();
  }
}

testOfirEmailScenario();