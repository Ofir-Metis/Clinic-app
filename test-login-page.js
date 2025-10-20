const puppeteer = require('puppeteer');

async function testLoginPage() {
  console.log('🔐 Testing Login Page Directly...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
    args: ['--no-sandbox'],
    defaultViewport: { width: 1280, height: 720 }
  });

  try {
    const page = await browser.newPage();
    
    page.on('console', msg => console.log(`[CONSOLE] ${msg.text()}`));
    page.on('pageerror', error => console.log(`[ERROR] ${error.message}`));
    
    // Clear storage
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    console.log('Testing login page directly...');
    
    await page.goto('http://localhost:5173/login', { 
      waitUntil: 'networkidle2',
      timeout: 10000
    });
    
    await new Promise(r => setTimeout(r, 3000));
    
    const loginPageState = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        hasLoginForm: !!document.querySelector('form'),
        hasEmailInput: !!document.querySelector('input[type="email"]'),
        hasPasswordInput: !!document.querySelector('input[type="password"]'),
        formCount: document.querySelectorAll('form').length,
        inputCount: document.querySelectorAll('input').length,
        bodyText: document.body.innerText.substring(0, 200),
        hasErrors: document.querySelector('.error, [data-testid*="error"]') !== null
      };
    });
    
    console.log('Login page state:', JSON.stringify(loginPageState, null, 2));
    
    await page.screenshot({ path: 'screenshots/login-page-test.png' });
    console.log('Screenshot saved: screenshots/login-page-test.png');
    
  } catch (error) {
    console.error('❌ Login test error:', error.message);
  } finally {
    await browser.close();
  }
}

testLoginPage().catch(console.error);