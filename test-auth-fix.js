const puppeteer = require('puppeteer');

async function testAuthenticationFix() {
  console.log('🔐 Testing Authentication Fix...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
    args: ['--no-sandbox'],
    defaultViewport: { width: 1280, height: 720 }
  });

  try {
    const page = await browser.newPage();
    
    // Clear all localStorage before testing
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    console.log('1. Testing with cleared storage - should redirect to login');
    
    // Try to access dashboard directly
    await page.goto('http://10.100.102.17:5173/dashboard', { 
      waitUntil: 'networkidle2' 
    });
    
    await new Promise(r => setTimeout(r, 3000));
    
    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);
    
    if (currentUrl.includes('/login')) {
      console.log('✅ FIXED: Dashboard now redirects to login when not authenticated');
    } else if (currentUrl.includes('/dashboard')) {
      console.log('❌ ISSUE PERSISTS: Still accessing dashboard without authentication');
    } else {
      console.log('⚠️ UNEXPECTED: Redirected to:', currentUrl);
    }
    
    await page.screenshot({ path: 'screenshots/auth-test-cleared-storage.png' });
    
    console.log('\n2. Testing root path / - should also redirect to login');
    
    await page.goto('http://10.100.102.17:5173/', { 
      waitUntil: 'networkidle2' 
    });
    
    await new Promise(r => setTimeout(r, 3000));
    
    const rootUrl = page.url();
    console.log('   Root redirect URL:', rootUrl);
    
    if (rootUrl.includes('/login')) {
      console.log('✅ FIXED: Root path now redirects to login when not authenticated');
    } else {
      console.log('❌ ISSUE: Root path not properly redirecting to login');
    }
    
    await page.screenshot({ path: 'screenshots/auth-test-root-path.png' });
    
    console.log('\n3. Testing localStorage token presence');
    
    const tokens = await page.evaluate(() => {
      return {
        accessToken: localStorage.getItem('accessToken'),
        token: localStorage.getItem('token'),
        clientToken: localStorage.getItem('clientToken'),
        allKeys: Object.keys(localStorage)
      };
    });
    
    console.log('   Tokens found:', tokens);
    
    if (!tokens.accessToken && !tokens.token && !tokens.clientToken) {
      console.log('✅ GOOD: No authentication tokens found in localStorage');
    } else {
      console.log('⚠️ WARNING: Found tokens that might be auto-set:', tokens);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

testAuthenticationFix().catch(console.error);