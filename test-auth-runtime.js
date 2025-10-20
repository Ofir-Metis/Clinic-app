const puppeteer = require('puppeteer');

async function testAuthRuntime() {
  console.log('🔍 Testing Authentication Runtime Values...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 300,
    args: ['--no-sandbox'],
    defaultViewport: { width: 1280, height: 720 }
  });

  try {
    const page = await browser.newPage();
    
    // Log everything
    page.on('console', msg => console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`));
    page.on('pageerror', error => {
      console.log(`❌ PAGE ERROR: ${error.message}`);
      if (error.stack) {
        console.log(`   Stack trace: ${error.stack.split('\n').slice(0, 3).join('\n   ')}`);
      }
    });
    
    // Clear storage completely
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Inject debugging into the page
    await page.evaluateOnNewDocument(() => {
      // Store original React error boundary
      window.originalConsoleError = console.error;
      window.authDebugLog = [];
      
      console.error = (...args) => {
        const message = args.join(' ');
        window.authDebugLog.push(`ERROR: ${message}`);
        if (!message.includes('Warning:') && !message.includes('The above error')) {
          window.originalConsoleError.apply(console, args);
        }
      };
      
      // Try to hook into React hooks if possible
      window.authHookCalls = [];
      
      // Override localStorage for debugging
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = function(key) {
        const value = originalGetItem.call(this, key);
        if (key.includes('token') || key.includes('user') || key.includes('auth')) {
          window.authDebugLog.push(`LOCALSTORAGE GET: ${key} = ${value}`);
        }
        return value;
      };
    });
    
    console.log('Loading page and monitoring authentication flow...');
    
    await page.goto('http://localhost:5173/', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    
    // Give React time to load
    await new Promise(r => setTimeout(r, 2000));
    
    // Check what happened during loading
    const debugInfo = await page.evaluate(() => {
      return {
        currentUrl: window.location.href,
        authDebugLog: window.authDebugLog || [],
        
        // Check if we can find any signs of the AuthContext working
        hasAuthProvider: !!document.querySelector('[data-auth-provider]'),
        
        // Check localStorage access
        localStorageAccess: {
          accessToken: localStorage.getItem('accessToken'),
          refreshToken: localStorage.getItem('refreshToken'),
          user: localStorage.getItem('user'),
          allKeys: Object.keys(localStorage)
        },
        
        // Check if we're at the expected page
        isOnDashboard: window.location.pathname === '/dashboard',
        isOnLogin: window.location.pathname === '/login',
        
        // Check DOM for auth-related content
        bodyText: document.body.innerText.substring(0, 200),
        hasLoginButton: !!document.querySelector('button[type="submit"], button:contains("Login")'),
        
        // Check for React components
        hasReactRoot: !!document.getElementById('root')?.children?.length,
        
        // Check for any error messages in DOM
        hasErrorInDOM: document.body.innerText.toLowerCase().includes('error')
      };
    });
    
    console.log('\\n=== RUNTIME DEBUG INFO ===');
    console.log(JSON.stringify(debugInfo, null, 2));
    
    // Wait a bit more to see if there are delayed redirects
    console.log('\\nWaiting for potential delayed redirects...');
    await new Promise(r => setTimeout(r, 5000));
    
    const finalState = await page.evaluate(() => ({
      currentUrl: window.location.href,
      finalPath: window.location.pathname
    }));
    
    console.log('\\n=== FINAL STATE ===');
    console.log(JSON.stringify(finalState, null, 2));
    
    if (finalState.currentUrl.includes('/dashboard')) {
      console.log('\\n❌ AUTHENTICATION BYPASS CONFIRMED');
      console.log('The app is showing the dashboard without authentication tokens!');
    } else if (finalState.currentUrl.includes('/login')) {
      console.log('\\n✅ AUTHENTICATION WORKING');
      console.log('The app correctly redirected to login!');
    } else {
      console.log('\\n🤔 UNEXPECTED REDIRECT');
      console.log('The app redirected to an unexpected page.');
    }
    
    await page.screenshot({ path: 'screenshots/auth-runtime-final.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ Runtime test error:', error.message);
  } finally {
    await browser.close();
  }
}

testAuthRuntime().catch(console.error);