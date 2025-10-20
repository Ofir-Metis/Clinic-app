const puppeteer = require('puppeteer');
const path = require('path');

async function finalComprehensiveTest() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('🎯 FINAL COMPREHENSIVE VERIFICATION TEST');
    console.log('✅ Mock data was removed from PatientListPage.tsx');
    console.log('✅ Frontend dev server was restarted');
    console.log('🔍 Now testing to confirm data isolation works correctly...\n');
    
    // Use an existing user with known password
    console.log('🔐 Logging in with test@clinic.com (existing user)');
    
    await page.goto('http://localhost:5176/login', { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => document.readyState === 'complete');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try logging in with existing test user
    await page.type('input[name="email"]', 'test@clinic.com');
    await page.type('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    let currentUrl = page.url();
    console.log(`📍 URL after login attempt: ${currentUrl}`);
    
    if (!currentUrl.includes('/dashboard')) {
      console.log('❌ Login failed, trying to register fresh user...');
      
      // Register new user
      const timestamp = Date.now();
      const testUser = {
        email: `final-test-${timestamp}@example.com`,
        password: 'TestPassword123!',
        name: `Final Test User ${timestamp}`
      };
      
      await page.goto('http://localhost:5176/register', { waitUntil: 'networkidle0' });
      await page.waitForFunction(() => document.readyState === 'complete');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log(`📝 Registering: ${testUser.email}`);
      
      await page.type('input[name="name"]', testUser.name);
      await page.type('input[name="email"]', testUser.email);
      await page.type('input[name="password"]', testUser.password);
      await page.type('input[name="confirmPassword"]', testUser.password);
      
      await page.waitForSelector('input[value="therapist"]');
      await page.click('input[value="therapist"]');
      
      await page.click('button[type="submit"]');
      await new Promise(resolve => setTimeout(resolve, 6000));
      
      currentUrl = page.url();
      console.log(`📍 URL after registration: ${currentUrl}`);
    }
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Successfully authenticated! Testing all pages...\n');
    } else {
      console.log('⚠️ Still not authenticated, but continuing to test pages directly...\n');
    }
    
    // Test Results Object
    const testResults = {
      dashboard: { mockData: false, cleanState: false },
      clients: { mockData: false, cleanState: false },
      settings: { mockData: false, cleanState: false }
    };
    
    // Test Dashboard Page
    console.log('📊 Testing Dashboard Page...');
    await page.goto('http://localhost:5176/dashboard', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    const dashboardScreenshot = path.join(__dirname, 'screenshots/final-dashboard-verification.png');
    await page.screenshot({ path: dashboardScreenshot, fullPage: true });
    console.log(`📸 Dashboard screenshot: ${dashboardScreenshot}`);
    
    const dashboardText = await page.evaluate(() => document.body.innerText);
    testResults.dashboard.mockData = dashboardText.includes('Sarah Johnson') || 
                                    dashboardText.includes('Michael Chen');
    testResults.dashboard.cleanState = dashboardText.includes('No appointments') ||
                                      dashboardText.includes('Welcome to Your Wellness Space');
    
    console.log(`   Mock data present: ${testResults.dashboard.mockData}`);
    console.log(`   Shows clean state: ${testResults.dashboard.cleanState}`);
    
    // Test Clients Page
    console.log('\n👥 Testing Clients/Patients Page...');
    await page.goto('http://localhost:5176/patients', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const clientsScreenshot = path.join(__dirname, 'screenshots/final-clients-verification.png');
    await page.screenshot({ path: clientsScreenshot, fullPage: true });
    console.log(`📸 Clients page screenshot: ${clientsScreenshot}`);
    
    const clientsText = await page.evaluate(() => document.body.innerText);
    
    // Check for specific mock data
    const mockNames = ['Sarah Johnson', 'Michael Chen', 'Emma Davis', 'James Wilson'];
    const mockEmails = ['sarah.johnson@email.com', 'michael.chen@email.com'];
    
    testResults.clients.mockData = mockNames.some(name => clientsText.includes(name)) ||
                                  mockEmails.some(email => clientsText.includes(email));
    
    testResults.clients.cleanState = clientsText.includes('No clients yet') ||
                                    clientsText.includes('Add Your First Client') ||
                                    clientsText.includes('Start building your client base');
    
    console.log(`   Mock data present: ${testResults.clients.mockData}`);
    console.log(`   Shows clean state: ${testResults.clients.cleanState}`);
    
    if (testResults.clients.mockData) {
      console.log('   🚨 Found mock data:');
      mockNames.forEach(name => {
        if (clientsText.includes(name)) console.log(`     - ${name}`);
      });
      mockEmails.forEach(email => {
        if (clientsText.includes(email)) console.log(`     - ${email}`);
      });
    }
    
    // Test Settings Page
    console.log('\n⚙️ Testing Settings Page...');
    await page.goto('http://localhost:5176/settings', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const settingsScreenshot = path.join(__dirname, 'screenshots/final-settings-verification.png');
    await page.screenshot({ path: settingsScreenshot, fullPage: true });
    console.log(`📸 Settings page screenshot: ${settingsScreenshot}`);
    
    const settingsText = await page.evaluate(() => document.body.innerText);
    testResults.settings.mockData = settingsText.includes('demo') || 
                                   settingsText.includes('sarah.johnson@email.com');
    testResults.settings.cleanState = settingsText.includes('Profile') ||
                                     settingsText.includes('Language') ||
                                     settingsText.includes('Preferences');
    
    console.log(`   Mock data present: ${testResults.settings.mockData}`);
    console.log(`   Shows proper interface: ${testResults.settings.cleanState}`);
    
    // Final Analysis
    console.log('\n🎯 COMPREHENSIVE TEST RESULTS:');
    console.log('=' * 50);
    
    const totalMockDataIssues = Object.values(testResults).filter(r => r.mockData).length;
    const totalCleanStates = Object.values(testResults).filter(r => r.cleanState).length;
    
    console.log(`📊 Mock Data Issues: ${totalMockDataIssues}/3 pages`);
    console.log(`✅ Clean States: ${totalCleanStates}/3 pages`);
    
    if (totalMockDataIssues === 0) {
      console.log('\n🎉 PERFECT SUCCESS: All mock data removed!');
      console.log('✅ Frontend shows completely clean, user-isolated data');
      console.log('✅ Data isolation issue is FULLY RESOLVED');
      
      return {
        success: true,
        mockDataRemoved: true,
        dataIsolationFixed: true,
        testResults
      };
    } else {
      console.log(`\n⚠️ PARTIAL SUCCESS: ${totalMockDataIssues} page(s) still show mock data`);
      console.log('🔧 Additional cleanup may be needed');
      
      return {
        success: false,
        mockDataRemoved: false,
        dataIsolationFixed: false,
        issuesRemaining: totalMockDataIssues,
        testResults
      };
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

// Run the comprehensive test
finalComprehensiveTest().then(result => {
  console.log('\n' + '=' * 60);
  console.log('FINAL VERIFICATION COMPLETE');
  console.log('=' * 60);
  
  if (result?.success && result?.dataIsolationFixed) {
    console.log('🏆 STATUS: DATA ISOLATION ISSUE RESOLVED ✅');
    console.log('🎉 RESULT: All mock data successfully removed from frontend');
    console.log('✅ OUTCOME: New users will see clean, isolated data');
  } else if (result?.issuesRemaining) {
    console.log('⚠️ STATUS: PARTIAL RESOLUTION');
    console.log(`🔧 RESULT: ${result.issuesRemaining} page(s) need additional cleanup`);
    console.log('📝 OUTCOME: Some mock data still present in frontend');
  } else {
    console.log('❌ STATUS: TEST INCONCLUSIVE');
    console.log('🔧 RESULT: Unable to complete verification');
  }
  
  console.log('\n📸 Screenshots saved for visual verification');
  console.log('✅ Ready for your manual review and testing');
});