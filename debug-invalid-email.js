const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Testing invalid email...');
    
    // Go to auth page
    await page.goto('http://localhost:5174/auth');
    await page.waitForLoadState('networkidle');
    
    // Fill with invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait a moment for validation to show
    await page.waitForTimeout(3000);
    
    // Get all text content to see what validation messages appear
    const bodyText = await page.locator('body').textContent();
    console.log('Page content after invalid email:', bodyText?.substring(0, 1000));
    
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
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();