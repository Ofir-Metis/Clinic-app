const puppeteer = require('puppeteer');

async function debugAuthState() {
  console.log('🔍 Debugging Frontend Authentication State...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
    args: ['--no-sandbox', '--disable-web-security'],
    defaultViewport: { width: 1280, height: 720 }
  });

  try {
    const page = await browser.newPage();
    
    // Capture console messages
    page.on('console', msg => {
      const type = msg.type();
      console.log(`[${type.toUpperCase()}] ${msg.text()}`);
    });
    
    // Capture errors
    page.on('pageerror', error => {
      console.log(`❌ PAGE ERROR: ${error.message}`);
    });
    
    // Clear storage
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    console.log('1. Loading home page and checking React App...');
    
    await page.goto('http://localhost:5173/', { 
      waitUntil: 'networkidle2',
      timeout: 15000
    });
    
    await new Promise(r => setTimeout(r, 5000));
    
    // Check if React app is loaded and working
    const appState = await page.evaluate(() => {
      const root = document.getElementById('root');
      const hasReactApp = root && root.children.length > 0;
      
      // Try to access the auth context if possible
      let authContextState = 'unknown';
      try {
        // Look for auth context indicators in the DOM
        const authElements = document.querySelectorAll('[data-testid*="auth"], [data-auth]');
        const loadingElements = document.querySelectorAll('[role="progressbar"], .loading, [data-testid*="loading"]');
        const loginElements = document.querySelectorAll('form, input[type="email"], input[type="password"], [data-testid*="login"]');
        
        authContextState = {
          authElements: authElements.length,
          loadingElements: loadingElements.length,
          loginElements: loginElements.length,
          bodyContent: document.body.innerText.substring(0, 200),
          currentPath: window.location.pathname
        };
      } catch (e) {
        authContextState = `Error: ${e.message}`;
      }
      
      return {
        hasReactApp,
        rootHTML: root ? root.innerHTML.substring(0, 500) : 'No root element',
        url: window.location.href,
        title: document.title,
        authContextState,
        localStorageKeys: Object.keys(localStorage),
        sessionStorageKeys: Object.keys(sessionStorage)
      };
    });
    
    console.log('\\n=== REACT APP DEBUG ===');
    console.log(JSON.stringify(appState, null, 2));
    
    // Try to trigger React dev tools or check for React components
    const reactInfo = await page.evaluate(() => {
      // Check for React
      const hasReact = typeof window.React !== 'undefined';
      const hasReactDevTools = typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined';
      
      // Check for Material-UI
      const hasMUI = document.querySelector('[class*="MuiBox-root"], [class*="MuiContainer-root"]') !== null;
      
      // Check for Router
      const hasRouter = window.location.pathname !== '/';
      
      return {
        hasReact,
        hasReactDevTools,
        hasMUI,
        hasRouter,
        pathname: window.location.pathname
      };
    });
    
    console.log('\\n=== REACT FEATURES DEBUG ===');
    console.log(JSON.stringify(reactInfo, null, 2));
    
    // Take screenshot for visual inspection
    await page.screenshot({ path: 'screenshots/auth-debug-state.png', fullPage: true });
    console.log('\\n📸 Screenshot saved: screenshots/auth-debug-state.png');
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  } finally {
    await browser.close();
  }
}

debugAuthState().catch(console.error);