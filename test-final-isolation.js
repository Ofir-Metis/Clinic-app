const puppeteer = require('puppeteer');
const path = require('path');

async function testFinalDataIsolation() {
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
      email: `final-test-${timestamp}@example.com`,
      password: 'TestPassword123!',
      fullname: `Final Test User ${timestamp}`
    };
    
    console.log(`🔄 TESTING FINAL DATA ISOLATION with: ${testUser.email}`);
    console.log(`📅 Test run at: ${new Date().toISOString()}`);
    
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
    
    // Select therapist role
    await page.waitForSelector('input[value="therapist"]');
    await page.click('input[value="therapist"]');
    
    console.log('🚀 Submitting registration...');
    
    // Submit registration
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    const currentUrl = page.url();
    console.log(`📍 Current URL after registration: ${currentUrl}`);
    
    // Ensure we're on the dashboard
    if (!currentUrl.includes('/dashboard')) {
      await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log('🔍 ANALYZING DASHBOARD DATA ISOLATION...');
    
    // Take screenshot for visual verification
    const screenshotPath = path.join(__dirname, `screenshots/final-isolation-test-${timestamp}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    
    // More comprehensive content analysis
    const pageContent = await page.content();
    const pageText = await page.evaluate(() => document.body.innerText);
    
    // Check for specific data contamination patterns
    const dataChecks = {
      // Check for existing appointments
      hasAppointments: pageContent.includes('appointment') && !pageText.includes('No appointments'),
      
      // Check for existing clients/patients
      hasClients: (pageContent.includes('client') || pageContent.includes('patient')) && 
                  !pageText.includes('No clients') && !pageText.includes('No patients'),
      
      // Check for existing notes
      hasNotes: pageContent.includes('note') && !pageText.includes('No notes'),
      
      // Check for existing sessions
      hasSessions: pageContent.includes('session') && !pageText.includes('No sessions'),
      
      // Check for specific user emails (shouldn't see other users)
      hasOtherUserEmails: pageText.includes('@clinic.com') || pageText.includes('@example.com'),
      
      // Check for specific user names
      hasOtherUserNames: pageText.includes('demo') || pageText.includes('test'),
      
      // Check for appointment counts > 0
      hasAppointmentCounts: /\d+\s+(appointment|session)/i.test(pageText) && !/0\s+(appointment|session)/i.test(pageText)
    };
    
    console.log('🏥 COMPREHENSIVE DATA ISOLATION ANALYSIS:');
    console.log(`   📅 Has existing appointments: ${dataChecks.hasAppointments}`);
    console.log(`   👥 Has existing clients: ${dataChecks.hasClients}`);
    console.log(`   📝 Has existing notes: ${dataChecks.hasNotes}`);
    console.log(`   🔄 Has existing sessions: ${dataChecks.hasSessions}`);
    console.log(`   📧 Shows other user emails: ${dataChecks.hasOtherUserEmails}`);
    console.log(`   👤 Shows other user names: ${dataChecks.hasOtherUserNames}`);
    console.log(`   🔢 Has appointment counts > 0: ${dataChecks.hasAppointmentCounts}`);
    
    // Calculate isolation score
    const isolationIssues = Object.values(dataChecks).filter(check => check === true);
    const isolationScore = ((7 - isolationIssues.length) / 7 * 100).toFixed(1);
    
    console.log(`\n🎯 DATA ISOLATION SCORE: ${isolationScore}%`);
    
    if (isolationScore === '100.0') {
      console.log('🎉 PERFECT! Complete data isolation achieved!');
      console.log('✅ New user sees completely clean dashboard');
    } else if (isolationScore >= '80.0') {
      console.log('⚠️  MOSTLY ISOLATED: Minor data leakage detected');
      console.log(`❌ ${isolationIssues.length} isolation issue(s) found`);
    } else {
      console.log('❌ ISOLATION FAILURE: Significant data contamination');
      console.log(`🚨 ${isolationIssues.length} critical isolation issues found`);
    }
    
    // Additional specific checks
    const emptyStateMessages = [
      'No appointments',
      'No clients', 
      'No notes',
      'No sessions',
      'Take some time for self-care'
    ];
    
    const foundEmptyStates = emptyStateMessages.filter(msg => 
      pageText.toLowerCase().includes(msg.toLowerCase())
    );
    
    console.log(`\n📊 EMPTY STATE VERIFICATION:`);
    console.log(`   Found ${foundEmptyStates.length}/5 expected empty state messages`);
    foundEmptyStates.forEach(msg => console.log(`   ✅ "${msg}"`));
    
    return {
      isolationScore: parseFloat(isolationScore),
      issues: isolationIssues.length,
      emptyStates: foundEmptyStates.length,
      success: isolationScore === '100.0'
    };
    
  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

// Run the test
testFinalDataIsolation().then(result => {
  if (result.success) {
    console.log('\n🏆 DATA ISOLATION TEST: PASSED ✅');
  } else {
    console.log('\n❌ DATA ISOLATION TEST: FAILED');
  }
});