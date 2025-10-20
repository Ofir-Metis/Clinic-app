const puppeteer = require('puppeteer');
const path = require('path');

async function testAfterRestart() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    const timestamp = Date.now();
    const testUser = {
      email: `after-restart-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: `After Restart User ${timestamp}`
    };
    
    console.log(`🧪 Testing after frontend restart: ${testUser.email}`);
    console.log(`🌐 Using port 5176 (fresh dev server)`);
    
    // Register new user on the fresh frontend
    await page.goto('http://localhost:5176/register', { waitUntil: 'networkidle0' });
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
    
    // Go to clients page
    console.log('\n👥 Testing Clients page after restart...');
    await page.goto('http://localhost:5176/patients', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Take screenshot
    const clientsScreenshot = path.join(__dirname, `screenshots/clients-after-restart-${timestamp}.png`);
    await page.screenshot({ path: clientsScreenshot, fullPage: true });
    console.log(`📸 Clients page screenshot: ${clientsScreenshot}`);
    
    // Analyze content
    const clientsText = await page.evaluate(() => document.body.innerText);
    
    console.log('\n🔍 MOCK DATA CHECK AFTER RESTART:');
    
    const mockDataChecks = {
      hasSarahJohnson: clientsText.includes('Sarah Johnson'),
      hasMichaelChen: clientsText.includes('Michael Chen'),
      hasEmmaJohnson: clientsText.includes('Emma Davis'),
      hasJamesWilson: clientsText.includes('James Wilson'),
      hasMockEmails: clientsText.includes('sarah.johnson@email.com'),
      hasEmptyState: clientsText.includes('No clients yet') || 
                     clientsText.includes('Add Your First Client')
    };
    
    console.log(`   ❌ Contains "Sarah Johnson": ${mockDataChecks.hasSarahJohnson}`);
    console.log(`   ❌ Contains "Michael Chen": ${mockDataChecks.hasMichaelChen}`);
    console.log(`   ❌ Contains "Emma Davis": ${mockDataChecks.hasEmmaJohnson}`);
    console.log(`   ❌ Contains "James Wilson": ${mockDataChecks.hasJamesWilson}`);
    console.log(`   ❌ Contains mock emails: ${mockDataChecks.hasMockEmails}`);
    console.log(`   ✅ Shows proper empty state: ${mockDataChecks.hasEmptyState}`);
    
    const mockDataFound = Object.entries(mockDataChecks)
      .filter(([key, value]) => key !== 'hasEmptyState' && value === true)
      .length;
    
    console.log(`\n📊 MOCK DATA ISSUES: ${mockDataFound}/5`);
    
    if (mockDataFound === 0 && mockDataChecks.hasEmptyState) {
      console.log('🎉 SUCCESS: Mock data removed, showing clean empty state!');
      return { success: true, mockDataRemoved: true };
    } else if (mockDataFound > 0) {
      console.log('❌ PROBLEM: Mock data still present after restart');
      
      // Look for the actual content being displayed
      console.log('\n🔍 ACTUAL PAGE CONTENT SAMPLE:');
      const contentSample = clientsText.split('\n')
        .filter(line => line.trim().length > 0)
        .slice(0, 10)
        .map(line => `"${line.trim()}"`)
        .join('\n   ');
      console.log(`   ${contentSample}`);
      
      return { success: false, mockDataRemoved: false };
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

testAfterRestart().then(result => {
  if (result?.success && result?.mockDataRemoved) {
    console.log('\n🏆 MOCK DATA COMPLETELY REMOVED ✅');
    console.log('✅ Frontend now shows clean, user-specific data!');
  } else {
    console.log('\n❌ Mock data persistence issue detected');
    console.log('🔧 May require additional investigation');
  }
});