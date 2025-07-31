const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Starting login test...');
    
    // Listen for navigation
    page.on('framenavigated', frame => {
      console.log('Navigated to:', frame.url());
    });
    
    await page.goto('http://localhost:5174/auth');
    console.log('On auth page');
    
    // Make sure we're on the login tab (first tab should be selected by default)
    const tabs = page.locator('[role="tablist"] button');
    const tabCount = await tabs.count();
    console.log('Tabs count:', tabCount);
    
    for (let i = 0; i < tabCount; i++) {
      const tab = tabs.nth(i);
      const tabText = await tab.textContent();
      const isSelected = await tab.getAttribute('aria-selected');
      console.log(`Tab ${i}: "${tabText}", selected: ${isSelected}`);
    }
    
    // Fill form
    await page.fill('input[type="email"]', 'therapist@test.com');
    console.log('Filled email');
    
    await page.fill('input[type="password"]', 'TestPassword123!');
    console.log('Filled password');
    
    // Look for submit button more specifically  
    const submitButton = page.locator('button[type="submit"]');
    console.log('Submit button count:', await submitButton.count());
    
    if (await submitButton.isVisible()) {
      const buttonText = await submitButton.textContent();
      console.log('Submit button text:', buttonText);
      
      console.log('Clicking submit button...');
      await submitButton.click();
    } else {
      console.log('Submit button not found, trying Login button...');
      await page.click('button:has-text("Login")');
    }
    
    // Wait to see what happens
    await page.waitForTimeout(5000);
    
    console.log('Current URL:', page.url());
    console.log('Page title:', await page.title());
    
    // Check for any errors or loading states
    const errorAlert = page.locator('[role="alert"]');
    if (await errorAlert.isVisible()) {
      console.log('Error message:', await errorAlert.textContent());
    }
    
    // Check for validation errors on inputs
    const emailError = page.locator('input[type="email"] ~ .MuiFormHelperText-root');
    if (await emailError.isVisible()) {
      console.log('Email error:', await emailError.textContent());
    }
    
    const passwordError = page.locator('input[type="password"] ~ .MuiFormHelperText-root');  
    if (await passwordError.isVisible()) {
      console.log('Password error:', await passwordError.textContent());
    }
    
    // Check if there are any helper texts
    const helperTexts = page.locator('.MuiFormHelperText-root');
    const helperCount = await helperTexts.count();
    console.log('Helper texts count:', helperCount);
    
    for (let i = 0; i < helperCount; i++) {
      const helper = helperTexts.nth(i);
      const text = await helper.textContent();
      console.log(`Helper text ${i}:`, text);
    }
    
    const loading = page.locator('[role="progressbar"]');
    if (await loading.isVisible()) {
      console.log('Still loading...');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();