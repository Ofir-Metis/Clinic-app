const puppeteer = require('puppeteer');

async function testClientPages() {
  console.log('👤 Testing Client-specific Pages...');

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Test client registration page
    console.log('📝 Testing Client Registration Page...');
    await page.goto('http://localhost:5173/client/register', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    await page.screenshot({
      path: 'screenshots/06_client_registration.png',
      fullPage: true
    });
    console.log('✅ Client registration screenshot saved');

    // Try to access client login
    console.log('🔐 Testing Client Login Page...');
    await page.goto('http://localhost:5173/client/login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    await page.screenshot({
      path: 'screenshots/07_client_login.png',
      fullPage: true
    });
    console.log('✅ Client login screenshot saved');

    // Try to access password reset
    console.log('🧠 Testing Password Reset Page...');
    await page.goto('http://localhost:5173/reset/request', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    await page.screenshot({
      path: 'screenshots/08_password_reset.png',
      fullPage: true
    });
    console.log('✅ Password reset screenshot saved');

    // Try to access unauthorized page to test error handling
    console.log('❌ Testing Unauthorized/404 Pages...');
    await page.goto('http://localhost:5173/dashboard', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    await page.screenshot({
      path: 'screenshots/09_unauthorized_dashboard.png',
      fullPage: true
    });
    console.log('✅ Unauthorized dashboard screenshot saved');

    // Test page with potential error
    await page.goto('http://localhost:5173/admin', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    await page.screenshot({
      path: 'screenshots/10_admin_access.png',
      fullPage: true
    });
    console.log('✅ Admin access screenshot saved');

    // Analyze pages we've visited
    console.log('\n📊 Page Analysis Summary:');

    const allPages = [
      'http://localhost:5173/client/register',
      'http://localhost:5173/client/login',
      'http://localhost:5173/reset/request',
      'http://localhost:5173/dashboard',
      'http://localhost:5173/admin'
    ];

    for (const url of allPages) {
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });

        const pageInfo = await page.evaluate(() => {
          return {
            title: document.title,
            url: window.location.href,
            hasErrorMessage: document.body.textContent.toLowerCase().includes('error'),
            hasLoadingSpinner: !!document.querySelector('[role="progressbar"], .loading, .spinner'),
            formCount: document.querySelectorAll('form').length,
            buttonCount: document.querySelectorAll('button').length
          };
        });

        console.log(`  ${url}:`);
        console.log(`    Title: ${pageInfo.title}`);
        console.log(`    Forms: ${pageInfo.formCount}, Buttons: ${pageInfo.buttonCount}`);
        console.log(`    Has Error: ${pageInfo.hasErrorMessage}, Loading: ${pageInfo.hasLoadingSpinner}`);

      } catch (error) {
        console.log(`  ${url}: Failed to load (${error.message})`);
      }
    }

  } catch (error) {
    console.error('❌ Error testing client pages:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testClientPages().catch(console.error);