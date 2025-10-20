const puppeteer = require('puppeteer');

async function testNewAuthenticationSystem() {
  console.log('🔐 Testing New Production Authentication System...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
    args: ['--no-sandbox'],
    defaultViewport: { width: 1280, height: 720 }
  });

  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`CONSOLE ERROR: ${msg.text()}`);
      }
    });
    
    // Capture JavaScript errors
    page.on('pageerror', error => {
      console.log(`PAGE ERROR: ${error.message}`);
    });
    
    // Clear all storage
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    console.log('1. Testing root path authentication...');
    
    // Test root path
    await page.goto('http://localhost:5173/', { 
      waitUntil: 'networkidle2',
      timeout: 10000
    });
    
    await new Promise(r => setTimeout(r, 3000));
    
    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);
    
    if (currentUrl.includes('/login')) {
      console.log('✅ SUCCESS: Root path redirects to login when not authenticated');
    } else if (currentUrl.includes('/dashboard')) {
      console.log('❌ ISSUE: Still accessing dashboard without authentication');
    } else {
      console.log('🔍 STATUS: Redirected to:', currentUrl);
    }
    
    await page.screenshot({ path: 'screenshots/new-auth-root-test.png' });
    
    console.log('\n2. Testing direct dashboard access...');
    
    // Test dashboard access
    await page.goto('http://localhost:5173/dashboard', { 
      waitUntil: 'networkidle2',
      timeout: 10000
    });
    
    await new Promise(r => setTimeout(r, 3000));
    
    const dashboardUrl = page.url();
    console.log('   Dashboard access URL:', dashboardUrl);
    
    if (dashboardUrl.includes('/login')) {
      console.log('✅ SUCCESS: Dashboard redirects to login when not authenticated');
    } else if (dashboardUrl.includes('/dashboard')) {
      console.log('❌ CRITICAL: Dashboard still accessible without authentication');
    } else {
      console.log('🔍 STATUS: Dashboard redirected to:', dashboardUrl);
    }
    
    await page.screenshot({ path: 'screenshots/new-auth-dashboard-test.png' });
    
    console.log('\n3. Testing authentication state...');
    
    // Check authentication context
    const authState = await page.evaluate(() => {
      return {
        localStorageKeys: Object.keys(localStorage),
        hasAccessToken: !!localStorage.getItem('clinic_access_token'),
        hasRefreshToken: !!localStorage.getItem('clinic_refresh_token'),
        hasUser: !!localStorage.getItem('clinic_user'),
        pageUrl: window.location.href,
        bodyClasses: document.body.className,
        hasLoadingSpinner: !!document.querySelector('[role="progressbar"]'),
        hasLoginForm: !!document.querySelector('input[type="email"], input[name="email"]')
      };
    });
    
    console.log('   Auth State:', JSON.stringify(authState, null, 2));
    
    if (!authState.hasAccessToken && !authState.hasRefreshToken && !authState.hasUser) {
      console.log('✅ SUCCESS: No authentication tokens stored');
    } else {
      console.log('⚠️ WARNING: Found authentication tokens when should be cleared');
    }
    
    if (authState.hasLoginForm) {
      console.log('✅ SUCCESS: Login form is displayed');
    } else {
      console.log('❌ ISSUE: Login form not found');
    }
    
    console.log('\n4. Testing loading states...');
    
    if (authState.hasLoadingSpinner) {
      console.log('✅ SUCCESS: Loading spinner is shown during auth check');
    } else {
      console.log('ℹ️ INFO: No loading spinner (may have completed)');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    
    // Try to get more information about the error
    try {
      const pageContent = await page.content();
      console.log('Page title:', await page.title());
      console.log('Page URL:', page.url());
    } catch (e) {
      console.log('Could not get page info:', e.message);
    }
  } finally {
    await browser.close();
  }
}

// Run the test
testNewAuthenticationSystem().catch(console.error);