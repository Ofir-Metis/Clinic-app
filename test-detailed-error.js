const puppeteer = require('puppeteer');

async function testDetailedError() {
  console.log('🔍 Testing Detailed Error in Production Build...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
    args: ['--no-sandbox'],
    defaultViewport: { width: 1280, height: 720 }
  });

  try {
    const page = await browser.newPage();
    
    // Capture ALL console messages
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      console.log(`[${type.toUpperCase()}] ${text}`);
    });
    
    page.on('pageerror', error => {
      console.log(`💥 PAGE ERROR:`, error.toString());
      console.log(`💥 ERROR NAME:`, error.name);
      console.log(`💥 ERROR MESSAGE:`, error.message);
      if (error.stack) {
        console.log(`💥 STACK TRACE:\n${error.stack}`);
      }
    });
    
    page.on('error', error => {
      console.log(`🔴 ERROR EVENT:`, error);
    });
    
    page.on('requestfailed', request => {
      const failure = request.failure();
      if (failure && !request.url().includes('favicon')) {
        console.log(`🌐 REQUEST FAILED: ${request.url()}`);
        console.log(`   Reason: ${failure.errorText}`);
      }
    });
    
    // Clear storage
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    console.log('Loading page and looking for error details...');
    
    await page.goto('http://localhost:5173/', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
    
    await new Promise(r => setTimeout(r, 3000));
    
    // Try to get error details from the page
    const errorDetails = await page.evaluate(() => {
      // Look for any error messages in the DOM
      const errorElements = document.querySelectorAll('[class*="error"], .error-message, [data-error]');
      const errors = [];
      errorElements.forEach(el => {
        errors.push(el.textContent);
      });
      
      // Check if there's an error object in window
      const windowError = window.lastError || window.error || null;
      
      return {
        domErrors: errors,
        windowError: windowError ? windowError.toString() : null,
        url: window.location.href,
        hasReactApp: !!document.getElementById('root')?.children?.length
      };
    });
    
    console.log('\n=== ERROR DETAILS ===');
    console.log(JSON.stringify(errorDetails, null, 2));
    
    await page.screenshot({ path: 'screenshots/detailed-error.png' });
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testDetailedError().catch(console.error);