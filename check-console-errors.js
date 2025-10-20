const puppeteer = require('puppeteer');

async function checkConsoleErrors() {
  console.log('🔍 Checking for JavaScript Console Errors...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: ['--no-sandbox'],
    defaultViewport: { width: 1280, height: 720 }
  });

  try {
    const page = await browser.newPage();
    
    const errors = [];
    const warnings = [];
    const logs = [];
    
    // Capture all console messages
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      
      switch (type) {
        case 'error':
          errors.push(text);
          break;
        case 'warning':
          warnings.push(text);
          break;
        default:
          logs.push(`[${type.toUpperCase()}] ${text}`);
      }
    });
    
    // Capture JavaScript errors
    page.on('pageerror', error => {
      errors.push(`PAGE ERROR: ${error.message}`);
    });
    
    // Clear storage
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    console.log('1. Loading dashboard to check for errors...');
    
    await page.goto('http://localhost:5173/dashboard', { 
      waitUntil: 'networkidle2' 
    });
    
    await new Promise(r => setTimeout(r, 5000));
    
    console.log('\n=== ERRORS ===');
    if (errors.length === 0) {
      console.log('✅ No JavaScript errors found');
    } else {
      errors.forEach((error, i) => {
        console.log(`❌ Error ${i + 1}: ${error}`);
      });
    }
    
    console.log('\n=== WARNINGS ===');
    if (warnings.length === 0) {
      console.log('✅ No warnings');
    } else {
      warnings.slice(0, 5).forEach((warning, i) => {
        console.log(`⚠️ Warning ${i + 1}: ${warning}`);
      });
    }
    
    // Check if React is working properly
    const reactCheck = await page.evaluate(() => {
      return {
        hasReact: !!window.React,
        hasReactDOM: !!window.ReactDOM,
        rootElement: !!document.getElementById('root'),
        rootContent: document.getElementById('root')?.innerHTML?.length || 0,
        windowErrors: window.errors || 'none'
      };
    });
    
    console.log('\n=== REACT DEBUG ===');
    console.log('React State:', reactCheck);
    
    // Check if PrivateRoute is in the DOM or console
    const privateRouteCheck = await page.evaluate(() => {
      // Look for any references to PrivateRoute in the DOM or global scope
      const bodyHTML = document.body.innerHTML;
      const hasPrivateRouteInDOM = bodyHTML.includes('PrivateRoute');
      
      // Check if there are any navigation-related elements
      const hasNavigateElements = bodyHTML.includes('Navigate') || bodyHTML.includes('redirect');
      
      return {
        hasPrivateRouteInDOM,
        hasNavigateElements,
        currentPath: window.location.pathname,
        currentHref: window.location.href
      };
    });
    
    console.log('\n=== ROUTING DEBUG ===');
    console.log('Routing State:', privateRouteCheck);
    
    if (!privateRouteCheck.hasPrivateRouteInDOM && !privateRouteCheck.hasNavigateElements) {
      console.log('🔍 PrivateRoute may not be functioning - the routing system might have an issue');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

checkConsoleErrors().catch(console.error);