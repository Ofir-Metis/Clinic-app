const puppeteer = require('puppeteer');

async function quickUITest() {
  console.log('🔍 Quick UI Access Test\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 200,
    args: ['--no-sandbox'],
    defaultViewport: { width: 1280, height: 720 }
  });

  try {
    const page = await browser.newPage();
    
    console.log('📱 Navigating to application...');
    await page.goto('http://localhost:5173/', { 
      waitUntil: 'networkidle2',
      timeout: 15000
    });
    
    await new Promise(r => setTimeout(r, 3000));
    
    const pageInfo = await page.evaluate(() => ({
      url: window.location.href,
      pathname: window.location.pathname,
      title: document.title,
      hasLoginForm: !!document.querySelector('input[type="email"], input[type="password"]'),
      hasRegisterLink: !!document.querySelector('a[href*="register"]') || document.body.innerText.toLowerCase().includes('register'),
      bodyText: document.body.innerText.substring(0, 300)
    }));
    
    console.log(`📍 Current URL: ${pageInfo.url}`);
    console.log(`📄 Page Title: ${pageInfo.title}`);
    console.log(`🔐 Has Login Form: ${pageInfo.hasLoginForm}`);
    console.log(`📝 Has Register Link: ${pageInfo.hasRegisterLink}`);
    console.log(`📋 Page Content Preview: ${pageInfo.bodyText.substring(0, 100)}...`);
    
    if (pageInfo.pathname === '/login') {
      console.log('\n✅ UI is accessible - Login page loaded correctly');
      console.log('🔑 You can now run the database population script');
      
      // Try to register a test user to see the registration flow
      console.log('\n🧪 Testing registration flow...');
      
      const registerLink = await page.$('a[href*="register"]');
      if (registerLink) {
        await registerLink.click();
        await new Promise(r => setTimeout(r, 2000));
        
        const regInfo = await page.evaluate(() => ({
          url: window.location.href,
          hasForm: !!document.querySelector('form'),
          hasFirstNameField: !!document.querySelector('input[name="firstName"], input[placeholder*="First"]'),
          hasEmailField: !!document.querySelector('input[type="email"]'),
          hasPasswordField: !!document.querySelector('input[type="password"]')
        }));
        
        console.log(`📝 Registration Page Loaded: ${regInfo.url.includes('register')}`);
        console.log(`📋 Has Registration Form: ${regInfo.hasForm}`);
        console.log(`👤 Has Name Fields: ${regInfo.hasFirstNameField}`);
        console.log(`📧 Has Email Field: ${regInfo.hasEmailField}`);
        console.log(`🔒 Has Password Field: ${regInfo.hasPasswordField}`);
        
        if (regInfo.hasForm && regInfo.hasFirstNameField) {
          console.log('\n✅ Registration form is functional - ready for database population!');
        }
      }
    }
    
    console.log('\n📱 Browser will remain open for 20 seconds for manual inspection...');
    await new Promise(r => setTimeout(r, 20000));
    
  } catch (error) {
    console.error('❌ UI test error:', error.message);
  } finally {
    await browser.close();
  }
}

quickUITest().catch(console.error);