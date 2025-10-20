const puppeteer = require('puppeteer');

async function debugAuthState() {
  console.log('🔍 Debugging Authentication State...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: ['--no-sandbox'],
    defaultViewport: { width: 1280, height: 720 }
  });

  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      console.log('CONSOLE:', msg.text());
    });
    
    // Clear storage
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    console.log('1. Going to dashboard with debug logging...');
    
    await page.goto('http://localhost:5173/dashboard', { 
      waitUntil: 'networkidle2' 
    });
    
    await new Promise(r => setTimeout(r, 3000));
    
    // Check authentication state
    const authState = await page.evaluate(() => {
      // Check all possible token locations
      const tokens = {
        accessToken: localStorage.getItem('accessToken'),
        token: localStorage.getItem('token'),
        clientToken: localStorage.getItem('clientToken'),
        clinic_jwt_token: localStorage.getItem('clinic_jwt_token')
      };
      
      // Check if PrivateRoute component exists
      const hasPrivateRoute = !!document.querySelector('[data-testid="private-route"], [data-component="PrivateRoute"]');
      
      // Check if login elements are present
      const hasLoginForm = !!document.querySelector('input[type="email"], input[placeholder*="Email"]');
      
      // Check current page elements
      const pageElements = {
        isDashboard: !!document.querySelector('[data-testid="dashboard"], .dashboard-content'),
        isLogin: !!document.querySelector('[data-testid="login"], .login-form'),
        hasNavigation: !!document.querySelector('nav, [role="navigation"]'),
        title: document.title,
        url: window.location.href
      };
      
      return {
        tokens,
        hasPrivateRoute,
        hasLoginForm,
        pageElements,
        localStorage: Object.keys(localStorage),
        bodyClasses: document.body.className,
        rootElement: document.getElementById('root')?.innerHTML?.substring(0, 200)
      };
    });
    
    console.log('Auth State Debug:', JSON.stringify(authState, null, 2));
    
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    if (authState.pageElements.isDashboard && !authState.tokens.accessToken) {
      console.log('❌ CRITICAL: Dashboard is loading without authentication token!');
      console.log('   This indicates PrivateRoute is not functioning properly.');
    } else if (authState.pageElements.isLogin) {
      console.log('✅ GOOD: Login page is showing (authentication working)');
    }
    
    await page.screenshot({ path: 'screenshots/debug-auth-state.png' });
    
    // Test if we can manually trigger a navigation
    console.log('\n2. Testing manual navigation to login...');
    await page.goto('http://localhost:5173/login', { 
      waitUntil: 'networkidle2' 
    });
    
    await new Promise(r => setTimeout(r, 2000));
    console.log('Login page URL:', page.url());
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  } finally {
    await browser.close();
  }
}

debugAuthState().catch(console.error);