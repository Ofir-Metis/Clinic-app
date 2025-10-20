const puppeteer = require('puppeteer');

async function testProductionAuthFinal() {
  console.log('🔐 Final Production Authentication Test...\n');
  console.log('Testing at: http://localhost:5173 (Production Build)\n');
  
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
      
      if (text.includes('[RootRedirect]') || text.includes('[PrivateRoute]')) {
        console.log(`✅ AUTH LOG: ${text}`);
      } else if (type === 'error' && !text.includes('404') && !text.includes('CORS')) {
        console.log(`❌ ERROR: ${text}`);
      }
    });
    
    page.on('pageerror', error => {
      if (error.message !== 'oe') {
        console.log(`💥 PAGE ERROR: ${error.message}`);
      }
    });
    
    // Clear all storage
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
      sessionStorage.clear();
      // Also clear any cookies
      document.cookie.split(";").forEach(c => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      });
    });
    
    console.log('=== TEST 1: ROOT PATH AUTHENTICATION ===');
    
    await page.goto('http://localhost:5173/', { 
      waitUntil: 'networkidle2',
      timeout: 15000
    });
    
    // Wait for authentication check
    await new Promise(r => setTimeout(r, 5000));
    
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/login')) {
      console.log('✅ SUCCESS: Root path correctly redirects to login when not authenticated!');
    } else if (currentUrl.includes('/dashboard')) {
      console.log('❌ CRITICAL: Authentication bypass - dashboard accessible without login!');
    } else {
      console.log('🤔 UNEXPECTED: Redirected to unexpected page:', currentUrl);
    }
    
    // Take screenshot for evidence
    await page.screenshot({ path: 'screenshots/production-auth-root.png' });
    
    console.log('\\n=== TEST 2: DIRECT DASHBOARD ACCESS ===');
    
    // Clear storage again
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await page.goto('http://localhost:5173/dashboard', { 
      waitUntil: 'networkidle2',
      timeout: 10000
    });
    
    await new Promise(r => setTimeout(r, 3000));
    
    const dashboardUrl = page.url();
    console.log(`📍 Dashboard URL: ${dashboardUrl}`);
    
    if (dashboardUrl.includes('/login')) {
      console.log('✅ SUCCESS: Dashboard correctly redirects to login when not authenticated!');
    } else if (dashboardUrl.includes('/dashboard')) {
      console.log('❌ CRITICAL: Dashboard accessible without authentication!');
    }
    
    await page.screenshot({ path: 'screenshots/production-auth-dashboard.png' });
    
    // Check page content
    const pageInfo = await page.evaluate(() => {
      return {
        url: window.location.href,
        pathname: window.location.pathname,
        localStorage: Object.keys(localStorage),
        hasLoginForm: !!document.querySelector('form, input[type="email"], input[type="password"]'),
        pageTitle: document.title,
        bodyText: document.body.innerText.substring(0, 100)
      };
    });
    
    console.log('\\n=== PAGE INFORMATION ===');
    console.log(`URL: ${pageInfo.url}`);
    console.log(`Path: ${pageInfo.pathname}`);
    console.log(`LocalStorage Keys: ${pageInfo.localStorage.join(', ') || 'None'}`);
    console.log(`Has Login Form: ${pageInfo.hasLoginForm ? 'YES' : 'NO'}`);
    console.log(`Page Title: ${pageInfo.pageTitle}`);
    
    console.log('\\n=== FINAL VERDICT ===');
    
    if (pageInfo.pathname === '/login' && pageInfo.hasLoginForm) {
      console.log('✅✅✅ AUTHENTICATION SYSTEM WORKING CORRECTLY IN PRODUCTION! ✅✅✅');
      console.log('The authentication bypass vulnerability has been successfully fixed.');
    } else if (pageInfo.pathname === '/dashboard') {
      console.log('❌❌❌ AUTHENTICATION BYPASS STILL PRESENT! ❌❌❌');
      console.log('Critical security vulnerability not resolved.');
    } else {
      console.log('🤔 UNEXPECTED STATE - Manual verification needed');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

testProductionAuthFinal().catch(console.error);