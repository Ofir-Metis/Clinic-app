const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Testing wrong password...');
    
    // Go to auth page
    await page.goto('http://localhost:5174/auth');
    await page.waitForLoadState('networkidle');
    
    // Fill with valid email but wrong password
    await page.fill('input[type="email"]', 'therapist@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for authentication to complete and see what happens
    await page.waitForTimeout(5000);
    
    // Get current URL and content
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    const bodyText = await page.locator('body').textContent();
    console.log('Page content after wrong password:', bodyText?.substring(0, 1000));
    
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