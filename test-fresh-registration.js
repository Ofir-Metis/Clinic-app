const puppeteer = require('puppeteer');
const path = require('path');

async function testFreshRegistration() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    const timestamp = Date.now();
    const testUser = {
      email: `mock-removal-test-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: `Mock Test User ${timestamp}`
    };
    
    console.log(`🧪 Testing mock data removal with fresh user: ${testUser.email}`);
    
    // Register new user
    await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => document.readyState === 'complete');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await page.type('input[name="name"]', testUser.name);
    await page.type('input[name="email"]', testUser.email);
    await page.type('input[name="password"]', testUser.password);
    await page.type('input[name="confirmPassword"]', testUser.password);
    
    await page.waitForSelector('input[value="therapist"]');
    await page.click('input[value="therapist"]');
    
    console.log('🚀 Submitting registration...');
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    const currentUrl = page.url();
    console.log(`Current URL after registration: ${currentUrl}`);
    
    if (!currentUrl.includes('/dashboard')) {
      await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Test Clients/Patients page
    console.log('\n👥 Testing Clients page for mock data...');
    await page.goto('http://localhost:5173/patients', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Take screenshot
    const clientsScreenshot = path.join(__dirname, `screenshots/clients-mock-test-${timestamp}.png`);
    await page.screenshot({ path: clientsScreenshot, fullPage: true });
    console.log(`📸 Clients page screenshot: ${clientsScreenshot}`);
    
    // Analyze content
    const clientsText = await page.evaluate(() => document.body.innerText);
    
    console.log('\n🔍 DETAILED CLIENTS PAGE ANALYSIS:');
    
    const mockDataChecks = {
      hasSarahJohnson: clientsText.includes('Sarah Johnson'),
      hasMichaelChen: clientsText.includes('Michael Chen'),
      hasEmmaJohnson: clientsText.includes('Emma Davis') || clientsText.includes('Emma Johnson'),
      hasJamesWilson: clientsText.includes('James Wilson'),
      hasMockEmails: clientsText.includes('sarah.johnson@email.com') || 
                     clientsText.includes('michael.chen@email.com'),
      hasEmptyState: clientsText.includes('No clients yet') || 
                     clientsText.includes('Add Your First Client') ||
                     clientsText.includes('Start building your client base')
    };
    
    console.log(`   ❌ Contains "Sarah Johnson": ${mockDataChecks.hasSarahJohnson}`);
    console.log(`   ❌ Contains "Michael Chen": ${mockDataChecks.hasMichaelChen}`);
    console.log(`   ❌ Contains "Emma Davis": ${mockDataChecks.hasEmmaJohnson}`);
    console.log(`   ❌ Contains "James Wilson": ${mockDataChecks.hasJamesWilson}`);
    console.log(`   ❌ Contains mock emails: ${mockDataChecks.hasMockEmails}`);
    console.log(`   ✅ Shows empty state: ${mockDataChecks.hasEmptyState}`);
    
    const mockDataFound = Object.entries(mockDataChecks)
      .filter(([key, value]) => key !== 'hasEmptyState' && value === true)
      .length;
    
    console.log(`\n📊 MOCK DATA CONTAMINATION: ${mockDataFound}/5 checks failed`);
    
    if (mockDataFound === 0 && mockDataChecks.hasEmptyState) {
      console.log('🎉 PERFECT: No mock data found, showing proper empty state!');
      return { success: true, cleanData: true };
    } else if (mockDataFound > 0) {
      console.log('❌ PROBLEM: Mock data still present in frontend');
      console.log('🔧 The PatientListPage may still have mock data or caching issues');
      
      // Show a sample of the problematic content
      const problematicContent = clientsText.split('\n')
        .filter(line => 
          line.includes('Sarah') || 
          line.includes('Michael') || 
          line.includes('Emma') || 
          line.includes('James') ||
          line.includes('@email.com')
        )
        .slice(0, 5);
      
      console.log('\n🚨 PROBLEMATIC CONTENT FOUND:');
      problematicContent.forEach(line => console.log(`   "${line.trim()}"`));
      
      return { success: false, mockDataFound, cleanData: false };
    } else {
      console.log('⚠️  WARNING: No mock data but also no empty state shown');
      return { success: false, mockDataFound, cleanData: false };
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

testFreshRegistration().then(result => {
  if (result.success && result.cleanData) {
    console.log('\n🏆 MOCK DATA REMOVAL: COMPLETE SUCCESS ✅');
    console.log('🎉 Frontend shows clean data isolation!');
  } else {
    console.log('\n❌ MOCK DATA REMOVAL: INCOMPLETE');
    console.log('🔧 Frontend still contains hard-coded mock data');
  }
});