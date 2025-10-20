const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 720 }
  });

  const page = await browser.newPage();

  // Enable console logging
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url()));

  try {
    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 15000 });

    // Take screenshot of initial page
    await page.screenshot({ path: 'frontend-initial.png', fullPage: true });
    console.log('Initial screenshot saved as frontend-initial.png');

    // Get page title and URL
    const title = await page.title();
    const url = page.url();
    console.log(`Page Title: ${title}`);
    console.log(`Current URL: ${url}`);

    // Check if login form is present
    const loginForm = await page.$('form');
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    const passwordInput = await page.$('input[type="password"], input[name="password"]');

    console.log(`Login form found: ${!!loginForm}`);
    console.log(`Email input found: ${!!emailInput}`);
    console.log(`Password input found: ${!!passwordInput}`);

    if (emailInput && passwordInput) {
      console.log('Attempting login with coach@example.com...');

      // Clear and fill login form
      await emailInput.click({ clickCount: 3 });
      await emailInput.type('coach@example.com');
      await passwordInput.click({ clickCount: 3 });
      await passwordInput.type('CoachPassword123!');

      // Take screenshot before submitting
      await page.screenshot({ path: 'login-form-filled.png', fullPage: true });
      console.log('Login form screenshot saved as login-form-filled.png');

      // Find and click submit button
      const submitButton = await page.$('button[type="submit"]') ||
                          await page.$('button:has-text("Login")') ||
                          await page.$('button:has-text("Sign In")') ||
                          await page.$('input[type="submit"]');

      if (submitButton) {
        await submitButton.click();
        console.log('Login form submitted');

        // Wait for navigation or response
        await page.waitForTimeout(5000);

        // Take screenshot after login attempt
        await page.screenshot({ path: 'after-login-attempt.png', fullPage: true });
        console.log('After login screenshot saved as after-login-attempt.png');

        // Check current URL
        const newUrl = page.url();
        console.log(`URL after login: ${newUrl}`);

        // Look for dashboard elements
        const dashboardCheck = await page.evaluate(() => {
          const elements = {
            mainContent: document.querySelector('main, [role="main"]'),
            navigation: document.querySelector('nav, .navigation'),
            dashboard: document.querySelector('.dashboard, [data-testid="dashboard"]'),
            clients: document.querySelector('.clients, .patients, [data-testid="clients"]'),
            appointments: document.querySelector('.appointments, [data-testid="appointments"]'),
            headers: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent),
            bodyText: document.body.innerText.substring(0, 1000)
          };

          return {
            hasMain: !!elements.mainContent,
            hasNav: !!elements.navigation,
            hasDashboard: !!elements.dashboard,
            hasClients: !!elements.clients,
            hasAppointments: !!elements.appointments,
            headers: elements.headers,
            bodySnippet: elements.bodyText
          };
        });

        console.log('Dashboard analysis:', JSON.stringify(dashboardCheck, null, 2));

        // If on dashboard, try to navigate to specific pages
        if (newUrl.includes('dashboard') || dashboardCheck.hasDashboard) {
          console.log('On dashboard, checking for client data...');

          // Look for client/patient navigation
          const clientLink = await page.$('a[href*="patient"], a[href*="client"], a:has-text("Patients"), a:has-text("Clients")');
          if (clientLink) {
            console.log('Found client/patient link, navigating...');
            await clientLink.click();
            await page.waitForTimeout(3000);

            await page.screenshot({ path: 'clients-page.png', fullPage: true });
            console.log('Clients page screenshot saved');

            // Check for client data
            const clientData = await page.evaluate(() => {
              const clientElements = document.querySelectorAll('[data-testid*="client"], [data-testid*="patient"], .client, .patient');
              return {
                clientCount: clientElements.length,
                hasClientData: clientElements.length > 0,
                pageText: document.body.innerText.includes('No clients') || document.body.innerText.includes('No patients') ? 'Empty state detected' : 'Content detected'
              };
            });

            console.log('Client data analysis:', JSON.stringify(clientData, null, 2));
          }

          // Check appointments
          const appointmentLink = await page.$('a[href*="appointment"], a[href*="calendar"], a:has-text("Appointments"), a:has-text("Calendar")');
          if (appointmentLink) {
            console.log('Found appointment link, navigating...');
            await appointmentLink.click();
            await page.waitForTimeout(3000);

            await page.screenshot({ path: 'appointments-page.png', fullPage: true });
            console.log('Appointments page screenshot saved');

            const appointmentData = await page.evaluate(() => {
              const appointmentElements = document.querySelectorAll('[data-testid*="appointment"], .appointment, .calendar-event');
              return {
                appointmentCount: appointmentElements.length,
                hasAppointmentData: appointmentElements.length > 0,
                calendarPresent: !!document.querySelector('.calendar, [data-testid="calendar"]')
              };
            });

            console.log('Appointment data analysis:', JSON.stringify(appointmentData, null, 2));
          }
        }

      } else {
        console.log('Submit button not found');
        // Try to find any button and see what's available
        const allButtons = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('button')).map(btn => ({
            text: btn.textContent.trim(),
            type: btn.type,
            className: btn.className
          }));
        });
        console.log('Available buttons:', JSON.stringify(allButtons, null, 2));
      }
    } else {
      console.log('Login form elements not found');

      // Analyze what's actually on the page
      const pageAnalysis = await page.evaluate(() => {
        return {
          title: document.title,
          bodyText: document.body.innerText.substring(0, 500),
          formCount: document.querySelectorAll('form').length,
          inputCount: document.querySelectorAll('input').length,
          buttonCount: document.querySelectorAll('button').length,
          h1Text: document.querySelector('h1')?.textContent || 'No H1 found',
          allInputs: Array.from(document.querySelectorAll('input')).map(input => ({
            type: input.type,
            name: input.name,
            placeholder: input.placeholder
          }))
        };
      });

      console.log('Page analysis:', JSON.stringify(pageAnalysis, null, 2));
    }

    // Final screenshot
    await page.screenshot({ path: 'final-state.png', fullPage: true });
    console.log('Final screenshot saved as final-state.png');

  } catch (error) {
    console.error('Error during browser automation:', error.message);
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
    console.log('Error screenshot saved');
  } finally {
    await browser.close();
    console.log('Browser closed');
  }
})();