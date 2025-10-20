const puppeteer = require('puppeteer');

async function comprehensiveFrontendTest() {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1280, height: 720 }
    });

    const page = await browser.newPage();

    // Enable console logging
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    console.log('🚀 Starting comprehensive frontend test...\n');

    // Step 1: Navigate to the application
    console.log('1. Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 15000 });

    await page.screenshot({ path: 'test-step-1-homepage.png', fullPage: true });
    console.log('✅ Screenshot 1: Homepage saved');

    // Step 2: Fill and submit login form
    console.log('\n2. Logging in with coach@example.com...');

    await page.type('input[type="email"], input[name="email"]', 'coach@example.com');
    await page.type('input[type="password"], input[name="password"]', 'CoachPassword123!');

    await page.screenshot({ path: 'test-step-2-login-filled.png', fullPage: true });
    console.log('✅ Screenshot 2: Login form filled');

    // Submit the form
    await page.click('button[type="submit"]');
    console.log('✅ Login form submitted');

    // Step 3: Wait for dashboard/redirect and take screenshot
    console.log('\n3. Waiting for dashboard to load...');

    // Wait for navigation or dashboard content
    await new Promise(resolve => setTimeout(resolve, 5000));

    await page.screenshot({ path: 'test-step-3-after-login.png', fullPage: true });
    console.log('✅ Screenshot 3: After login state');

    // Check current URL
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);

    // Step 4: Analyze what's visible on the dashboard
    console.log('\n4. Analyzing dashboard content...');

    const dashboardAnalysis = await page.evaluate(() => {
      const analysis = {
        url: window.location.href,
        title: document.title,
        mainContent: document.querySelector('main, [role="main"]') ? 'Main content area found' : 'No main content area',
        loadingStates: document.querySelectorAll('.loading, [data-testid*="loading"], .skeleton').length,
        clientElements: document.querySelectorAll('[data-testid*="client"], [data-testid*="patient"], .client, .patient').length,
        appointmentElements: document.querySelectorAll('[data-testid*="appointment"], .appointment, .calendar').length,
        errorMessages: Array.from(document.querySelectorAll('.error, [data-testid*="error"]')).map(el => el.textContent.trim()),
        visibleText: document.body.innerText.substring(0, 500),
        headerElements: Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => ({
          tag: h.tagName,
          text: h.textContent.trim()
        }))
      };

      return analysis;
    });

    console.log('📊 Dashboard Analysis:');
    console.log('  - URL:', dashboardAnalysis.url);
    console.log('  - Title:', dashboardAnalysis.title);
    console.log('  - Main content:', dashboardAnalysis.mainContent);
    console.log('  - Loading elements:', dashboardAnalysis.loadingStates);
    console.log('  - Client elements:', dashboardAnalysis.clientElements);
    console.log('  - Appointment elements:', dashboardAnalysis.appointmentElements);
    console.log('  - Error messages:', dashboardAnalysis.errorMessages);
    console.log('  - Headers found:', dashboardAnalysis.headerElements);

    // Step 5: Try to navigate to specific pages
    console.log('\n5. Testing navigation to specific pages...');

    // Look for patient/client navigation
    const patientNavs = await page.$$('a[href*="patient"], a[href*="client"], nav a');
    console.log(`📋 Found ${patientNavs.length} navigation links`);

    if (patientNavs.length > 0) {
      console.log('🔗 Trying to click patient/client navigation...');

      // Get text of all navigation links
      const navTexts = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="patient"], a[href*="client"], nav a'));
        return links.map(link => ({
          text: link.textContent.trim(),
          href: link.href
        }));
      });

      console.log('Available navigation:', navTexts);

      // Try to click first relevant link
      try {
        await patientNavs[0].click();
        await new Promise(resolve => setTimeout(resolve, 3000));

        await page.screenshot({ path: 'test-step-5-client-page.png', fullPage: true });
        console.log('✅ Screenshot 4: Client/Patient page');

        const clientPageAnalysis = await page.evaluate(() => ({
          url: window.location.href,
          clientCount: document.querySelectorAll('[data-testid*="client"], .client, .patient-item').length,
          hasEmptyState: document.body.innerText.includes('No clients') || document.body.innerText.includes('No patients') || document.body.innerText.includes('empty'),
          visibleText: document.body.innerText.substring(0, 300)
        }));

        console.log('📊 Client Page Analysis:');
        console.log('  - URL:', clientPageAnalysis.url);
        console.log('  - Client elements found:', clientPageAnalysis.clientCount);
        console.log('  - Has empty state:', clientPageAnalysis.hasEmptyState);
        console.log('  - Page text preview:', clientPageAnalysis.visibleText);

      } catch (navError) {
        console.log('⚠️ Navigation click failed:', navError.message);
      }
    }

    // Step 6: Check for appointments/calendar
    console.log('\n6. Looking for appointments/calendar...');

    const appointmentLinks = await page.$$('a[href*="appointment"], a[href*="calendar"]');
    console.log(`📅 Found ${appointmentLinks.length} appointment/calendar links`);

    if (appointmentLinks.length > 0) {
      try {
        await appointmentLinks[0].click();
        await new Promise(resolve => setTimeout(resolve, 3000));

        await page.screenshot({ path: 'test-step-6-appointments.png', fullPage: true });
        console.log('✅ Screenshot 5: Appointments/Calendar page');

        const appointmentAnalysis = await page.evaluate(() => ({
          url: window.location.href,
          appointmentCount: document.querySelectorAll('[data-testid*="appointment"], .appointment, .calendar-event').length,
          hasCalendar: !!document.querySelector('.calendar, [data-testid="calendar"]'),
          hasEmptyState: document.body.innerText.includes('No appointments') || document.body.innerText.includes('empty'),
          visibleText: document.body.innerText.substring(0, 300)
        }));

        console.log('📊 Appointments Analysis:');
        console.log('  - URL:', appointmentAnalysis.url);
        console.log('  - Appointment elements:', appointmentAnalysis.appointmentCount);
        console.log('  - Has calendar:', appointmentAnalysis.hasCalendar);
        console.log('  - Has empty state:', appointmentAnalysis.hasEmptyState);

      } catch (appointmentError) {
        console.log('⚠️ Appointment navigation failed:', appointmentError.message);
      }
    }

    // Step 7: Final screenshot and summary
    console.log('\n7. Taking final screenshot...');
    await page.screenshot({ path: 'test-step-7-final-state.png', fullPage: true });
    console.log('✅ Screenshot 6: Final state');

    console.log('\n📸 Screenshots saved:');
    console.log('  - test-step-1-homepage.png');
    console.log('  - test-step-2-login-filled.png');
    console.log('  - test-step-3-after-login.png');
    console.log('  - test-step-5-client-page.png (if navigation worked)');
    console.log('  - test-step-6-appointments.png (if navigation worked)');
    console.log('  - test-step-7-final-state.png');

  } catch (error) {
    console.error('❌ Test failed:', error.message);

    if (browser) {
      await browser.newPage().then(page => page.screenshot({ path: 'test-error.png', fullPage: true }));
      console.log('📸 Error screenshot saved as test-error.png');
    }
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n🔚 Browser closed, test complete');
    }
  }
}

comprehensiveFrontendTest();