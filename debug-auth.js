const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to auth page...');
    
    // Listen for console logs and errors
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    page.on('response', response => {
      if (!response.ok()) {
        console.log('FAILED REQUEST:', response.url(), response.status());
      }
    });
    
    await page.goto('http://localhost:5174/auth');
    
    // Wait a bit more for the page to render
    await page.waitForTimeout(5000);
    
    // Check for any React error boundaries
    const errorBoundary = page.locator('text=Something went wrong');
    console.log('Error boundary visible:', await errorBoundary.isVisible());
    
    // Check for any loading indicators
    const loading = page.locator('[role="progressbar"], .loading');
    console.log('Loading indicators count:', await loading.count());
    
    // Get page content to debug
    const bodyText = await page.locator('body').textContent();
    console.log('Page content preview:', bodyText?.substring(0, 200));
    
    console.log('Page title:', await page.title());
    console.log('Page URL:', page.url());
    
    // Check if Sign In tab exists
    const signInTab = page.locator('text=Sign In');
    console.log('Sign In tab visible:', await signInTab.isVisible());
    
    // Look for input fields
    const emailInputs = page.locator('input[type="email"]');
    console.log('Email inputs count:', await emailInputs.count());
    
    const allInputs = page.locator('input');
    console.log('All inputs count:', await allInputs.count());
    
    // Check for text fields
    const textFields = page.locator('input[type="text"]');
    console.log('Text inputs count:', await textFields.count());
    
    // Check for any input
    const anyInput = page.locator('input').first();
    if (await anyInput.isVisible()) {
      console.log('First input type:', await anyInput.getAttribute('type'));
      console.log('First input label:', await anyInput.getAttribute('aria-label'));
    }
    
    // Look for buttons
    const buttons = page.locator('button');
    console.log('Buttons count:', await buttons.count());
    
    for (let i = 0; i < Math.min(await buttons.count(), 3); i++) {
      const button = buttons.nth(i);
      const buttonText = await button.textContent();
      const buttonType = await button.getAttribute('type');
      console.log(`Button ${i}: "${buttonText}", type: ${buttonType}`);
    }
    
    // Wait a moment to see the page
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();