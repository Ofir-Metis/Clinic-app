const puppeteer = require('puppeteer');

async function testRootRedirect() {
  console.log('🔍 Testing Root Redirect Component...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 200,
    args: ['--no-sandbox'],
    defaultViewport: { width: 1280, height: 720 }
  });

  try {
    const page = await browser.newPage();
    
    // Detailed console logging
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error' || type === 'warn') {
        console.log(`[${type.toUpperCase()}] ${text}`);
      }
    });
    
    page.on('pageerror', error => {
      console.log(`❌ PAGE ERROR: ${error.message}`);
      if (error.stack) {
        console.log(`   Stack: ${error.stack.split('\n')[0]}`);
      }
    });
    
    // Monitor navigation
    page.on('framenavigated', frame => {
      if (frame === page.mainFrame()) {
        console.log(`🧭 Navigated to: ${frame.url()}`);
      }
    });
    
    // Clear storage
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    console.log('1. Loading root path (/) and monitoring redirect...');
    
    // Load root and monitor what happens
    const response = await page.goto('http://localhost:5173/', { 
      waitUntil: 'networkidle0',
      timeout: 10000
    });
    
    console.log(`   Initial response status: ${response.status()}`);
    
    // Wait for any redirects or React rendering
    await new Promise(r => setTimeout(r, 5000));
    
    // Check current state
    const currentState = await page.evaluate(() => {
      return {
        url: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search,
        title: document.title,
        
        // Check for React Router indicators
        hasRouterProvider: !!document.querySelector('[data-testid*="router"], .MuiBox-root'),
        
        // Check for auth loading states
        hasLoadingSpinner: !!document.querySelector('[role="progressbar"], .loading, [data-testid*="loading"]'),
        
        // Check what's actually rendered
        bodyContent: document.body.innerText.substring(0, 300),
        
        // Check localStorage 
        localStorage: Object.keys(localStorage).reduce((acc, key) => {
          acc[key] = localStorage.getItem(key);
          return acc;
        }, {}),
        
        // Check for error indicators
        hasErrorText: document.body.innerText.includes('error') || document.body.innerText.includes('Error'),
        
        // Check DOM structure
        rootChildren: document.getElementById('root')?.children.length || 0
      };
    });
    
    console.log('\\n=== ROOT REDIRECT STATE ===');
    console.log(JSON.stringify(currentState, null, 2));
    
    // Try to manually trigger auth check by looking for React components
    const reactComponentInfo = await page.evaluate(() => {
      try {
        // Look for React fiber
        const root = document.getElementById('root');
        const hasReactFiber = root && root._reactInternalFiber;
        
        // Check for auth context usage (looking for common auth-related DOM attributes)
        const authIndicators = [];
        document.querySelectorAll('*').forEach(el => {
          if (el.dataset && Object.keys(el.dataset).some(key => key.toLowerCase().includes('auth'))) {
            authIndicators.push(el.tagName + ' with ' + Object.keys(el.dataset).join(','));
          }
        });
        
        return {
          hasReactFiber,
          authIndicators,
          componentCount: document.querySelectorAll('[class*="Mui"]').length
        };
      } catch (e) {
        return { error: e.message };
      }
    });
    
    console.log('\\n=== REACT COMPONENT INFO ===');
    console.log(JSON.stringify(reactComponentInfo, null, 2));
    
    await page.screenshot({ path: 'screenshots/root-redirect-test.png', fullPage: true });
    console.log('\\n📸 Screenshot saved: screenshots/root-redirect-test.png');
    
  } catch (error) {
    console.error('❌ Root redirect test error:', error.message);
  } finally {
    await browser.close();
  }
}

testRootRedirect().catch(console.error);