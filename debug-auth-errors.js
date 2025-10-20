const puppeteer = require('puppeteer');

async function debugAuthErrors() {
  console.log('🔍 Debugging Authentication Errors...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
    args: ['--no-sandbox', '--disable-web-security'],
    defaultViewport: { width: 1280, height: 720 }
  });

  try {
    const page = await browser.newPage();
    
    // Capture all console messages with more detail
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      const location = msg.location();
      
      console.log(`[${type.toUpperCase()}] ${text}`);
      if (location.url && !location.url.includes('extension')) {
        console.log(`   at ${location.url}:${location.lineNumber}:${location.columnNumber}`);
      }
    });
    
    // Capture JavaScript errors with stack traces
    page.on('pageerror', error => {
      console.log(`❌ PAGE ERROR: ${error.message}`);
      if (error.stack) {
        console.log(`   Stack: ${error.stack}`);
      }
    });
    
    // Capture failed requests
    page.on('requestfailed', request => {
      console.log(`🌐 FAILED REQUEST: ${request.url()}`);
      console.log(`   Failure: ${request.failure()?.errorText}`);
    });
    
    // Clear storage
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    console.log('Loading home page with detailed error tracking...\n');
    
    // Navigate and wait for errors
    await page.goto('http://localhost:5173/', { 
      waitUntil: 'networkidle0',
      timeout: 15000
    });
    
    // Wait for any async operations
    await new Promise(r => setTimeout(r, 5000));
    
    // Try to get more info about React/auth state
    const reactInfo = await page.evaluate(() => {
      // Check if React is loaded
      const hasReact = typeof window.React !== 'undefined' || 
                      typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined';
      
      // Check for auth context
      const authContextExists = window.__AUTH_CONTEXT_LOADED__ || false;
      
      // Get any global errors
      const errors = window.__ERRORS__ || [];
      
      // Check DOM structure
      const root = document.getElementById('root');
      const rootContent = root ? root.innerHTML.length : 0;
      
      return {
        hasReact,
        authContextExists,
        errors,
        rootContent,
        url: window.location.href,
        readyState: document.readyState,
        title: document.title
      };
    });
    
    console.log('\n=== REACT/AUTH DEBUG ===');
    console.log(JSON.stringify(reactInfo, null, 2));
    
    // Try to manually trigger auth check
    const authDebug = await page.evaluate(() => {
      try {
        // Look for any auth-related elements or functions
        const authElements = document.querySelectorAll('[data-auth], [data-testid*="auth"]');
        const loginElements = document.querySelectorAll('input[type="email"], form, button');
        
        return {
          authElementsFound: authElements.length,
          loginElementsFound: loginElements.length,
          hasFormElements: loginElements.length > 0,
          currentPage: window.location.pathname
        };
      } catch (e) {
        return { error: e.message };
      }
    });
    
    console.log('\n=== AUTH ELEMENTS DEBUG ===');
    console.log(JSON.stringify(authDebug, null, 2));
    
    await page.screenshot({ path: 'screenshots/debug-auth-errors.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  } finally {
    await browser.close();
  }
}

debugAuthErrors().catch(console.error);