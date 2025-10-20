const puppeteer = require('puppeteer');

async function testLocalhost() {
  console.log('🔐 Testing Authentication on localhost:5173...\n');
  
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
    
    console.log('1. Testing localhost dashboard access...');
    
    // Try to access dashboard directly
    await page.goto('http://localhost:5173/dashboard', { 
      waitUntil: 'networkidle2' 
    });
    
    await new Promise(r => setTimeout(r, 3000));
    
    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);
    
    if (currentUrl.includes('/login')) {
      console.log('✅ FIXED: Dashboard redirects to login on localhost');
    } else {
      console.log('❌ ISSUE: Still accessing dashboard without auth on localhost');
    }
    
    await page.screenshot({ path: 'screenshots/localhost-auth-test.png' });
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

testLocalhost().catch(console.error);