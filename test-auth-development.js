const puppeteer = require('puppeteer');

async function testAuthDevelopment() {
  console.log('🔍 Testing Authentication on Development Server (Port 5174)...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 200,
    args: ['--no-sandbox'],
    defaultViewport: { width: 1280, height: 720 }
  });

  try {
    const page = await browser.newPage();
    
    // Capture console messages - look for our authentication logs
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (text.includes('[RootRedirect]') || text.includes('[PrivateRoute]') || text.includes('Authentication')) {
        console.log(`🔍 AUTH LOG [${type.toUpperCase()}]: ${text}`);
      } else if (type === 'error') {
        console.log(`❌ ERROR: ${text}`);
      } else if (type === 'warn') {
        console.log(`⚠️ WARN: ${text}`);
      }
    });
    
    page.on('pageerror', error => {
      console.log(`💥 PAGE ERROR: ${error.message}`);
    });
    
    // Clear storage completely
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    console.log('1. Testing root path authentication on development server...');
    
    await page.goto('http://localhost:5174/', { 
      waitUntil: 'networkidle2',
      timeout: 15000
    });
    
    // Wait for React to load and authentication to process
    await new Promise(r => setTimeout(r, 5000));
    
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/login')) {
      console.log('✅ SUCCESS: Root path correctly redirects to login when not authenticated!');
    } else if (currentUrl.includes('/dashboard')) {
      console.log('❌ AUTHENTICATION BYPASS: Still showing dashboard without authentication');
    } else {
      console.log('🤔 UNEXPECTED: Redirected to unexpected page');
    }
    
    // Test direct dashboard access
    console.log('\\n2. Testing direct dashboard access...');
    
    await page.goto('http://localhost:5174/dashboard', { 
      waitUntil: 'networkidle2',
      timeout: 10000
    });
    
    await new Promise(r => setTimeout(r, 3000));
    
    const dashboardUrl = page.url();
    console.log(`📍 Dashboard URL: ${dashboardUrl}`);
    
    if (dashboardUrl.includes('/login')) {
      console.log('✅ SUCCESS: Dashboard access correctly redirects to login when not authenticated!');
    } else if (dashboardUrl.includes('/dashboard')) {
      console.log('❌ AUTHENTICATION BYPASS: Dashboard still accessible without authentication');
    }
    
    // Check authentication state
    const authState = await page.evaluate(() => {
      return {
        url: window.location.href,
        localStorage: Object.keys(localStorage).reduce((acc, key) => {
          acc[key] = localStorage.getItem(key);
          return acc;
        }, {}),
        hasLoginForm: !!document.querySelector('form, input[type="email"]'),
        pageTitle: document.title,
        bodyContent: document.body.innerText.substring(0, 100)
      };
    });
    
    console.log('\\n=== AUTHENTICATION STATE ===');
    console.log(JSON.stringify(authState, null, 2));
    
    await page.screenshot({ path: 'screenshots/auth-development-test.png', fullPage: true });
    console.log('\\n📸 Screenshot saved: screenshots/auth-development-test.png');
    
    if (authState.hasLoginForm) {
      console.log('\\n✅ FINAL RESULT: Authentication is working correctly!');
    } else if (authState.url.includes('/dashboard')) {
      console.log('\\n❌ FINAL RESULT: Critical authentication bypass vulnerability confirmed!');
    }
    
  } catch (error) {
    console.error('❌ Development auth test error:', error.message);
  } finally {
    await browser.close();
  }
}

testAuthDevelopment().catch(console.error);