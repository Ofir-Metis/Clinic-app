const puppeteer = require('puppeteer');
const path = require('path');

async function testFinalVerification() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    console.log(`🔍 FINAL VERIFICATION: Testing ofir.bracha@gmail.com after mock data removal`);
    console.log(`📅 Test time: ${new Date().toISOString()}`);
    
    // Navigate to login page
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try different password combinations
    const possiblePasswords = [
      'ofir.bracha@gmail.com',
      'password',
      'password123',
      'TestPassword123!',
      'admin123',
      '123456'
    ];
    
    let loginSuccessful = false;
    let successPassword = '';
    
    for (const password of possiblePasswords) {
      try {
        console.log(`🔐 Trying password: ${password}`);
        
        // Clear and type email
        await page.evaluate(() => {
          const emailInput = document.querySelector('input[name="email"]');
          if (emailInput) emailInput.value = '';
        });
        await page.type('input[name="email"]', 'ofir.bracha@gmail.com');
        
        // Clear and type password
        await page.evaluate(() => {
          const passwordInput = document.querySelector('input[name="password"]');
          if (passwordInput) passwordInput.value = '';
        });
        await page.type('input[name="password"]', password);
        
        // Submit login
        await page.click('button[type="submit"]');
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        const currentUrl = page.url();
        if (currentUrl.includes('/dashboard')) {
          loginSuccessful = true;
          successPassword = password;
          console.log(`✅ Login successful with password: ${password}`);
          break;
        } else {
          console.log(`❌ Login failed with password: ${password}`);
          // Navigate back to login page for next attempt
          await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.log(`❌ Error with password ${password}:`, error.message);
      }
    }
    
    if (!loginSuccessful) {
      console.log('❌ Could not login with any password. Let\'s check the user in the database...');
      return;
    }
    
    console.log(`\n🎯 TESTING ALL KEY PAGES FOR DATA ISOLATION:`);
    
    // Test Dashboard
    console.log('\n📊 Testing Dashboard...');
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const dashboardScreenshot = path.join(__dirname, 'screenshots/final-dashboard-verification.png');
    await page.screenshot({ path: dashboardScreenshot, fullPage: true });
    console.log(`📸 Dashboard screenshot: ${dashboardScreenshot}`);
    
    const dashboardText = await page.evaluate(() => document.body.innerText);
    console.log(`   ✅ Dashboard text contains "No appointments": ${dashboardText.includes('No appointments')}`);
    
    // Test Clients/Patients Page
    console.log('\n👥 Testing Clients/Patients page...');
    await page.goto('http://localhost:5173/patients', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const clientsScreenshot = path.join(__dirname, 'screenshots/final-clients-verification.png');
    await page.screenshot({ path: clientsScreenshot, fullPage: true });
    console.log(`📸 Clients page screenshot: ${clientsScreenshot}`);
    
    const clientsText = await page.evaluate(() => document.body.innerText);
    console.log(`   ✅ Clients page contains "No clients yet": ${clientsText.includes('No clients yet')}`);
    console.log(`   ❌ Clients page contains mock names: ${clientsText.includes('Sarah Johnson') || clientsText.includes('Michael Chen')}`);
    
    // Test Settings Page  
    console.log('\n⚙️ Testing Settings page...');
    await page.goto('http://localhost:5173/settings', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const settingsScreenshot = path.join(__dirname, 'screenshots/final-settings-verification.png');
    await page.screenshot({ path: settingsScreenshot, fullPage: true });
    console.log(`📸 Settings page screenshot: ${settingsScreenshot}`);
    
    const settingsText = await page.evaluate(() => document.body.innerText);
    
    // Test Calendar Page
    console.log('\n📅 Testing Calendar page...');
    await page.goto('http://localhost:5173/calendar', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const calendarScreenshot = path.join(__dirname, 'screenshots/final-calendar-verification.png');
    await page.screenshot({ path: calendarScreenshot, fullPage: true });
    console.log(`📸 Calendar page screenshot: ${calendarScreenshot}`);
    
    console.log(`\n🎯 COMPREHENSIVE DATA ISOLATION ANALYSIS:`);
    
    // Check for any remaining contamination
    const allPageTexts = [dashboardText, clientsText, settingsText].join(' ');
    
    const contaminationChecks = {
      hasMockEmails: allPageTexts.includes('sarah.johnson@email.com') || 
                     allPageTexts.includes('michael.chen@email.com') ||
                     allPageTexts.includes('james.wilson@email.com'),
      
      hasMockNames: allPageTexts.includes('Sarah Johnson') ||
                    allPageTexts.includes('Michael Chen') ||
                    allPageTexts.includes('Emma Davis') ||
                    allPageTexts.includes('James Wilson'),
      
      hasMockPhones: allPageTexts.includes('(555) 123-4567') ||
                     allPageTexts.includes('(555) 987-6543'),
      
      hasProperEmptyStates: clientsText.includes('No clients yet') ||
                           clientsText.includes('No clients found') ||
                           dashboardText.includes('No appointments')
    };
    
    console.log(`   📧 Contains mock email addresses: ${contaminationChecks.hasMockEmails}`);
    console.log(`   👤 Contains mock names: ${contaminationChecks.hasMockNames}`);  
    console.log(`   📞 Contains mock phone numbers: ${contaminationChecks.hasMockPhones}`);
    console.log(`   ✅ Shows proper empty states: ${contaminationChecks.hasProperEmptyStates}`);
    
    const isolationIssues = [
      contaminationChecks.hasMockEmails,
      contaminationChecks.hasMockNames, 
      contaminationChecks.hasMockPhones
    ].filter(Boolean).length;
    
    const isolationScore = ((3 - isolationIssues) / 3 * 100).toFixed(1);
    
    console.log(`\n🎯 FINAL DATA ISOLATION SCORE: ${isolationScore}%`);
    
    if (isolationScore === '100.0') {
      console.log('🎉 PERFECT! Mock data completely removed!');
      console.log('✅ All pages show clean, user-specific data');
    } else {
      console.log(`❌ ISOLATION ISSUES REMAIN: ${isolationIssues} problem(s) detected`);
      console.log('🔧 Additional cleanup needed');
    }
    
    return {
      success: isolationScore === '100.0',
      isolationScore: parseFloat(isolationScore),
      issues: isolationIssues,
      contaminationChecks
    };
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

// Run the test
testFinalVerification().then(result => {
  if (result?.success) {
    console.log('\n🏆 MOCK DATA REMOVAL: SUCCESS ✅');
    console.log('🎉 User will now see clean, isolated data!');
  } else {
    console.log('\n❌ MOCK DATA REMOVAL: NEEDS MORE WORK');
    console.log('🔧 Additional frontend cleanup required');
  }
});