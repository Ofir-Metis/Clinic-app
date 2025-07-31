const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Testing empty form submission...');
    
    // Go to auth page
    await page.goto('http://localhost:5175/auth');
    await page.waitForLoadState('networkidle');
    
    // Click submit without filling anything
    await page.click('button[type="submit"]');
    
    // Wait a moment for validation to show
    await page.waitForTimeout(2000);
    
    // Get all text content to see what validation messages appear
    const bodyText = await page.locator('body').textContent();
    console.log('Page content after empty submit:', bodyText?.substring(0, 1000));
    
    // Look for Material-UI form validation
    const textFields = page.locator('.MuiTextField-root');
    const textFieldCount = await textFields.count();
    console.log('\nTextField components found:', textFieldCount);
    
    for (let i = 0; i < textFieldCount; i++) {
      const field = textFields.nth(i);
      const helperText = field.locator('.MuiFormHelperText-root');
      if (await helperText.isVisible()) {
        const text = await helperText.textContent();
        console.log(`Field ${i} helper text: "${text}"`);
      }
    }
    
    // Look for alerts
    const alerts = page.locator('[role="alert"], .MuiAlert-root');
    const alertCount = await alerts.count();
    console.log('\nAlert elements found:', alertCount);
    
    for (let i = 0; i < alertCount; i++) {
      const alert = alerts.nth(i);
      const text = await alert.textContent();
      console.log(`Alert ${i}: "${text}"`);
    }
    
    // Look for any error-related classes or text
    const errorElements = page.locator('.error, .Mui-error, [class*="error"]');
    const errorCount = await errorElements.count();
    console.log('\nError elements found:', errorCount);
    
    for (let i = 0; i < Math.min(errorCount, 5); i++) {
      const error = errorElements.nth(i);
      const text = await error.textContent();
      if (text && text.trim()) {
        console.log(`Error ${i}: "${text.trim()}"`);
      }
    }
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();