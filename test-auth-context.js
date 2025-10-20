const puppeteer = require('puppeteer');

async function testAuthContext() {
  console.log('🔍 Testing AuthContext Hook Values...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 200,
    args: ['--no-sandbox'],
    defaultViewport: { width: 1280, height: 720 }
  });

  try {
    const page = await browser.newPage();
    
    page.on('console', msg => console.log(`[CONSOLE] ${msg.text()}`));
    page.on('pageerror', error => console.log(`[ERROR] ${error.message}`));
    
    // Clear storage completely
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(";").forEach(c => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos) : c;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      });
    });
    
    console.log('Loading page and intercepting useAuth values...');
    
    // Inject script to monitor useAuth hook calls
    await page.evaluateOnNewDocument(() => {
      window.authContextDebug = {
        calls: [],
        values: []
      };
      
      // Override console.log to capture auth-related logs
      const originalLog = console.log;
      console.log = (...args) => {
        const message = args.join(' ');
        if (message.includes('auth') || message.includes('Auth') || message.includes('token')) {
          window.authContextDebug.calls.push(message);
        }
        return originalLog.apply(console, args);
      };
    });
    
    await page.goto('http://localhost:5173/', { 
      waitUntil: 'networkidle0',
      timeout: 10000
    });
    
    // Wait for React to render
    await new Promise(r => setTimeout(r, 3000));
    
    // Try to access auth context values directly
    const authValues = await page.evaluate(() => {
      try {
        // Look for any auth-related variables in window
        const authRelated = {};
        for (let key in window) {
          if (key.toLowerCase().includes('auth') || key.toLowerCase().includes('token')) {
            authRelated[key] = typeof window[key];
          }
        }
        
        // Check localStorage thoroughly
        const storage = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          storage[key] = localStorage.getItem(key);
        }
        
        // Check if React DevTools can help us
        const hasReactDevTools = !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
        
        return {
          authRelated,
          localStorage: storage,
          sessionStorage: Object.keys(sessionStorage).length,
          hasReactDevTools,
          authContextDebug: window.authContextDebug || 'not found',
          currentURL: window.location.href
        };
        
      } catch (e) {
        return { error: e.message, stack: e.stack };
      }
    });
    
    console.log('\\n=== AUTH CONTEXT VALUES ===');
    console.log(JSON.stringify(authValues, null, 2));
    
    // Try to manually check what the auth context would return
    const manualAuthCheck = await page.evaluate(() => {
      try {
        // Simulate what AuthContext.useEffect should find
        const savedAccessToken = localStorage.getItem('accessToken');
        const savedRefreshToken = localStorage.getItem('refreshToken'); 
        const savedUser = localStorage.getItem('user');
        
        // Also check alternative keys that might be used
        const altTokens = {
          clinic_access_token: localStorage.getItem('clinic_access_token'),
          clinic_refresh_token: localStorage.getItem('clinic_refresh_token'),
          clinic_user: localStorage.getItem('clinic_user'),
          authToken: localStorage.getItem('authToken'),
          token: localStorage.getItem('token')
        };
        
        const wouldBeAuthenticated = !!(savedAccessToken && savedUser);
        
        return {
          savedAccessToken: !!savedAccessToken,
          savedRefreshToken: !!savedRefreshToken,
          savedUser: !!savedUser,
          altTokens,
          wouldBeAuthenticated,
          allLocalStorageKeys: Object.keys(localStorage)
        };
        
      } catch (e) {
        return { error: e.message };
      }
    });
    
    console.log('\\n=== MANUAL AUTH CHECK ===');
    console.log(JSON.stringify(manualAuthCheck, null, 2));
    
  } catch (error) {
    console.error('❌ Auth context test error:', error.message);
  } finally {
    await browser.close();
  }
}

testAuthContext().catch(console.error);