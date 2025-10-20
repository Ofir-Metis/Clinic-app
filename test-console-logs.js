const puppeteer = require('puppeteer');

async function testConsoleLogs() {
  console.log('🔍 Testing Console Logs for Authentication Debug...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 200,
    args: ['--no-sandbox'],
    defaultViewport: { width: 1280, height: 720 }
  });

  try {
    const page = await browser.newPage();
    
    // Capture ALL console messages with detailed info
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      const location = msg.location();
      
      if (text.includes('[RootRedirect]') || text.includes('[PrivateRoute]') || text.includes('Authentication')) {
        console.log(`🔍 [${type.toUpperCase()}] ${text}`);
        if (location.url && !location.url.includes('extension')) {
          console.log(`   📍 at ${location.url}:${location.lineNumber}`);
        }
      } else if (type === 'error' && !text.includes('CORS') && !text.includes('404')) {
        console.log(`❌ [ERROR] ${text}`);
      }
    });
    
    page.on('pageerror', error => {
      console.log(`💥 PAGE ERROR: ${error.message}`);
    });
    
    // Clear storage
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    console.log('Loading root path and monitoring authentication console logs...');
    
    await page.goto('http://localhost:5173/', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
    
    // Wait for React to load and authentication to process
    await new Promise(r => setTimeout(r, 8000));
    
    const finalUrl = page.url();
    console.log(`\\n📍 Final URL: ${finalUrl}`);
    
    // Check if we can see our debug logs
    const hasAuthLogs = await page.evaluate(() => {
      // Check if our console logs were called
      return window.console._authLogsCalled || false;
    });
    
    if (finalUrl.includes('/login')) {
      console.log('✅ SUCCESS: Authentication correctly redirected to login!');
    } else if (finalUrl.includes('/dashboard')) {
      console.log('❌ AUTHENTICATION BYPASS: Still showing dashboard without authentication');
      console.log('   This means our RootRedirect/PrivateRoute components are not working correctly.');
    }
    
    await page.screenshot({ path: 'screenshots/console-logs-test.png' });
    
  } catch (error) {
    console.error('❌ Console logs test error:', error.message);
  } finally {
    await browser.close();
  }
}

testConsoleLogs().catch(console.error);