const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Logging in and checking dashboard...');
    
    // Go to auth page and login
    await page.goto('http://localhost:5174/auth');
    await page.fill('input[type="email"]', 'therapist@test.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    console.log('Successfully logged in to dashboard');
    
    // Get page content
    const bodyText = await page.locator('body').textContent();
    console.log('Dashboard content preview:', bodyText?.substring(0, 500));
    
    // Look for headings
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    console.log('\nHeadings found:', headingCount);
    
    for (let i = 0; i < Math.min(headingCount, 5); i++) {
      const heading = headings.nth(i);
      const text = await heading.textContent();
      const tagName = await heading.evaluate(el => el.tagName);
      console.log(`${tagName}: "${text}"`);
    }
    
    // Look for buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    console.log('\nButtons found:', buttonCount);
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      console.log(`Button ${i}: "${text}"`);
    }
    
    // Look for navigation elements
    const navLinks = page.locator('a, [role="link"], nav button');
    const navCount = await navLinks.count();
    console.log('\nNavigation elements found:', navCount);
    
    for (let i = 0; i < Math.min(navCount, 8); i++) {
      const link = navLinks.nth(i);
      const text = await link.textContent();
      if (text && text.trim()) {
        console.log(`Nav ${i}: "${text.trim()}"`);
      }
    }
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();