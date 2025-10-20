const puppeteer = require('puppeteer');
const path = require('path');

async function testWithPassword() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    console.log(`🔍 Testing ofir.bracha@gmail.com with password 'password'`);
    
    // Navigate to login page
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Login
    await page.type('input[name="email"]', 'ofir.bracha@gmail.com');
    await page.type('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Login successful!');
      
      // Test clients page
      console.log('\n👥 Testing Clients page...');
      await page.goto('http://localhost:5173/patients', { waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      // Take screenshot
      const clientsScreenshot = path.join(__dirname, 'screenshots/clients-after-mock-removal.png');
      await page.screenshot({ path: clientsScreenshot, fullPage: true });
      console.log(`📸 Clients page screenshot: ${clientsScreenshot}`);
      
      // Check content
      const clientsText = await page.evaluate(() => document.body.innerText);
      
      console.log('\n🔍 CLIENTS PAGE ANALYSIS:');
      console.log(`   Contains "No clients yet": ${clientsText.includes('No clients yet')}`);
      console.log(`   Contains "Add Your First Client": ${clientsText.includes('Add Your First Client')}`);
      console.log(`   Contains mock name "Sarah Johnson": ${clientsText.includes('Sarah Johnson')}`);
      console.log(`   Contains mock email "sarah.johnson@email.com": ${clientsText.includes('sarah.johnson@email.com')}`);
      
      if (!clientsText.includes('Sarah Johnson') && clientsText.includes('No clients yet')) {
        console.log('🎉 SUCCESS: Mock data completely removed from clients page!');
      } else if (clientsText.includes('Sarah Johnson')) {
        console.log('❌ FAILURE: Mock data still present');
      }
      
      // Test dashboard
      console.log('\n📊 Testing Dashboard...');
      await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const dashboardScreenshot = path.join(__dirname, 'screenshots/dashboard-after-mock-removal.png');
      await page.screenshot({ path: dashboardScreenshot, fullPage: true });
      console.log(`📸 Dashboard screenshot: ${dashboardScreenshot}`);
      
      const dashboardText = await page.evaluate(() => document.body.innerText);
      console.log('\n🔍 DASHBOARD ANALYSIS:');
      console.log(`   Contains "No appointments": ${dashboardText.includes('No appointments')}`);
      console.log(`   Contains "Take some time": ${dashboardText.includes('Take some time')}`);
      
      return {
        success: !clientsText.includes('Sarah Johnson') && clientsText.includes('No clients yet'),
        screenshots: [clientsScreenshot, dashboardScreenshot]
      };
      
    } else {
      console.log('❌ Login failed');
      return { success: false };
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

testWithPassword().then(result => {
  if (result.success) {
    console.log('\n🏆 MOCK DATA REMOVAL VERIFIED: SUCCESS ✅');
  } else {
    console.log('\n❌ Mock data still present or test failed');
  }
});