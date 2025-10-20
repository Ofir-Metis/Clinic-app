const puppeteer = require('puppeteer');

async function testRegistrationPage() {
  console.log('🔐 Testing Registration Page...');

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigate to registration page
    await page.goto('http://localhost:5173/register', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await page.waitForSelector('#root', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Take screenshot of registration page
    await page.screenshot({
      path: 'screenshots/04_registration_page.png',
      fullPage: true
    });
    console.log('✅ Registration page screenshot saved');

    // Analyze registration form
    const registrationInfo = await page.evaluate(() => {
      const forms = document.querySelectorAll('form');
      const inputs = document.querySelectorAll('input');
      const buttons = document.querySelectorAll('button');
      const selects = document.querySelectorAll('select');

      const inputTypes = Array.from(inputs).map(input => ({
        type: input.type,
        placeholder: input.placeholder,
        required: input.required,
        name: input.name
      }));

      const buttonTexts = Array.from(buttons).map(btn => btn.textContent?.trim());

      return {
        formCount: forms.length,
        inputCount: inputs.length,
        buttonCount: buttons.length,
        selectCount: selects.length,
        inputTypes,
        buttonTexts,
        title: document.title,
        url: window.location.href
      };
    });

    console.log('📋 Registration Page Analysis:');
    console.log(`  Title: ${registrationInfo.title}`);
    console.log(`  URL: ${registrationInfo.url}`);
    console.log(`  Forms: ${registrationInfo.formCount}`);
    console.log(`  Inputs: ${registrationInfo.inputCount}`);
    console.log(`  Buttons: ${registrationInfo.buttonCount}`);
    console.log(`  Selects: ${registrationInfo.selectCount}`);

    if (registrationInfo.buttonTexts.length > 0) {
      console.log('🔘 Button texts:');
      registrationInfo.buttonTexts.forEach((text, index) => {
        console.log(`  ${index + 1}. "${text}"`);
      });
    }

    if (registrationInfo.inputTypes.length > 0) {
      console.log('📝 Input fields:');
      registrationInfo.inputTypes.forEach((input, index) => {
        console.log(`  ${index + 1}. Type: ${input.type}, Placeholder: "${input.placeholder}", Required: ${input.required}`);
      });
    }

    // Test mobile responsiveness for registration
    await page.setViewport({ width: 375, height: 812 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({
      path: 'screenshots/05_registration_mobile.png',
      fullPage: true
    });
    console.log('✅ Mobile registration screenshot saved');

  } catch (error) {
    console.error('❌ Error testing registration:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testRegistrationPage().catch(console.error);