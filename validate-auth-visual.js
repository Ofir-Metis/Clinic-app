const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function validateAuthenticationVisual() {
  console.log('🔐 Visual & Logical Authentication Validation Test\n');
  console.log('Testing Production Build at: http://localhost:5173\n');
  
  // Create screenshots directory if it doesn't exist
  const screenshotsDir = './screenshots/validation';
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
    args: ['--no-sandbox', '--disable-web-security'],
    defaultViewport: { width: 1280, height: 720 }
  });

  try {
    const page = await browser.newPage();
    
    // Capture console messages for debugging
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (text.includes('[AuthGuard]') || text.includes('AUTH:')) {
        console.log(`✅ AUTH LOG: ${text}`);
      } else if (type === 'error' && !text.includes('404') && !text.includes('GSI_LOGGER')) {
        console.log(`❌ ERROR: ${text}`);
      }
    });
    
    // Clear all storage before testing
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(";").forEach(c => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      });
    });
    
    console.log('=== TEST 1: ROOT PATH AUTHENTICATION LOGIC ===');
    
    await page.goto('http://localhost:5173/', { 
      waitUntil: 'networkidle2',
      timeout: 15000
    });
    
    // Wait for authentication logic to complete
    await new Promise(r => setTimeout(r, 3000));
    
    const rootTestResult = await page.evaluate(() => {
      return {
        url: window.location.href,
        pathname: window.location.pathname,
        hasLoginForm: !!document.querySelector('form, input[type="email"], input[type="password"]'),
        hasLoginButton: !!document.querySelector('button[type="submit"]') || 
                       Array.from(document.querySelectorAll('button')).some(btn => 
                         btn.textContent.toLowerCase().includes('login')),
        pageTitle: document.title,
        bodyText: document.body.innerText.substring(0, 200),
        localStorage: Object.keys(localStorage),
        isLoginPage: window.location.pathname === '/login',
        authGuardActive: !!document.querySelector('[data-auth-guard]') || 
                        document.body.innerText.includes('Login') ||
                        document.body.innerText.includes('Email') ||
                        document.body.innerText.includes('Password')
      };
    });
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'root-redirect-test.png'),
      fullPage: true 
    });
    
    console.log(`📍 Root URL Result: ${rootTestResult.url}`);
    console.log(`📄 Page Title: ${rootTestResult.pageTitle}`);
    console.log(`🔍 Has Login Form: ${rootTestResult.hasLoginForm}`);
    console.log(`🎯 AuthGuard Active: ${rootTestResult.authGuardActive}`);
    
    if (rootTestResult.isLoginPage && rootTestResult.authGuardActive) {
      console.log('✅ ROOT TEST PASSED: Correctly redirected to login page');
    } else {
      console.log('❌ ROOT TEST FAILED: Authentication bypass detected');
    }
    
    console.log('\n=== TEST 2: DIRECT DASHBOARD ACCESS LOGIC ===');
    
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
    
    const dashboardTestResult = await page.evaluate(() => {
      return {
        url: window.location.href,
        pathname: window.location.pathname,
        hasLoginForm: !!document.querySelector('form, input[type="email"], input[type="password"]'),
        isDashboard: window.location.pathname === '/dashboard',
        isLoginPage: window.location.pathname === '/login',
        pageContent: document.body.innerText.substring(0, 300),
        authBlocked: window.location.pathname !== '/dashboard'
      };
    });
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'dashboard-access-test.png'),
      fullPage: true 
    });
    
    console.log(`📍 Dashboard URL Result: ${dashboardTestResult.url}`);
    console.log(`🚫 Auth Blocked: ${dashboardTestResult.authBlocked}`);
    console.log(`📝 Page Content Preview: ${dashboardTestResult.pageContent.substring(0, 100)}...`);
    
    if (dashboardTestResult.authBlocked && dashboardTestResult.isLoginPage) {
      console.log('✅ DASHBOARD TEST PASSED: Access correctly blocked');
    } else {
      console.log('❌ DASHBOARD TEST FAILED: Unauthorized access allowed');
    }
    
    console.log('\n=== TEST 3: PROTECTED ROUTE ENUMERATION ===');
    
    const protectedRoutes = [
      '/patients', '/calendar', '/settings', '/notifications', 
      '/admin', '/billing', '/tools', '/therapist/profile'
    ];
    
    let protectedRoutesBlocked = 0;
    
    for (const route of protectedRoutes) {
      await page.goto(`http://localhost:5173${route}`, { 
        waitUntil: 'networkidle2',
        timeout: 8000
      });
      
      await new Promise(r => setTimeout(r, 1000));
      
      const routeResult = await page.evaluate(() => ({
        pathname: window.location.pathname,
        isBlocked: window.location.pathname === '/login'
      }));
      
      if (routeResult.isBlocked) {
        protectedRoutesBlocked++;
        console.log(`✅ ${route} -> Blocked (redirected to login)`);
      } else {
        console.log(`❌ ${route} -> NOT BLOCKED (security risk)`);
      }
    }
    
    console.log(`\n📊 Protected Routes Summary: ${protectedRoutesBlocked}/${protectedRoutes.length} properly blocked`);
    
    console.log('\n=== TEST 4: PUBLIC ROUTE ACCESS ===');
    
    const publicRoutes = ['/login', '/register', '/client/login', '/client/register'];
    let publicRoutesAccessible = 0;
    
    for (const route of publicRoutes) {
      await page.goto(`http://localhost:5173${route}`, { 
        waitUntil: 'networkidle2',
        timeout: 8000
      });
      
      await new Promise(r => setTimeout(r, 1000));
      
      const routeResult = await page.evaluate((currentRoute) => ({
        pathname: window.location.pathname,
        hasForm: !!document.querySelector('form, input'),
        accessible: window.location.pathname === currentRoute || window.location.pathname.startsWith(currentRoute)
      }), route);
      
      if (routeResult.accessible) {
        publicRoutesAccessible++;
        console.log(`✅ ${route} -> Accessible (correct)`);
      } else {
        console.log(`❌ ${route} -> NOT ACCESSIBLE (may be misconfigured)`);
      }
    }
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'login-page-final.png'),
      fullPage: true 
    });
    
    console.log(`\n📊 Public Routes Summary: ${publicRoutesAccessible}/${publicRoutes.length} properly accessible`);
    
    console.log('\n=== LOGICAL VALIDATION SUMMARY ===');
    
    const logicalTests = [
      { name: 'Root Redirect', passed: rootTestResult.isLoginPage && rootTestResult.authGuardActive },
      { name: 'Dashboard Block', passed: dashboardTestResult.authBlocked && dashboardTestResult.isLoginPage },
      { name: 'Protected Routes', passed: protectedRoutesBlocked === protectedRoutes.length },
      { name: 'Public Routes', passed: publicRoutesAccessible >= publicRoutes.length - 1 } // Allow 1 failure
    ];
    
    const passedTests = logicalTests.filter(test => test.passed).length;
    const totalTests = logicalTests.length;
    
    console.log('\n🧪 Test Results:');
    logicalTests.forEach(test => {
      console.log(`${test.passed ? '✅' : '❌'} ${test.name}: ${test.passed ? 'PASSED' : 'FAILED'}`);
    });
    
    console.log('\n=== FINAL VALIDATION VERDICT ===');
    
    if (passedTests === totalTests) {
      console.log('🎉🎉🎉 ALL AUTHENTICATION TESTS PASSED! 🎉🎉🎉');
      console.log('✅ AuthGuard implementation is working correctly');
      console.log('✅ No authentication bypass vulnerabilities detected');
      console.log('✅ All protected routes properly secured');
      console.log('✅ Public routes remain accessible');
      console.log('\n📸 Screenshots saved to: ./screenshots/validation/');
    } else {
      console.log('❌❌❌ AUTHENTICATION VALIDATION FAILED! ❌❌❌');
      console.log(`Failed Tests: ${totalTests - passedTests}/${totalTests}`);
      console.log('🚨 Security vulnerabilities may still exist');
    }
    
  } catch (error) {
    console.error('❌ Validation error:', error.message);
  } finally {
    await browser.close();
  }
}

validateAuthenticationVisual().catch(console.error);