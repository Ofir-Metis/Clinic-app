const puppeteer = require('puppeteer');
const fs = require('fs');

async function runUITests() {
  console.log('🚀 Starting comprehensive UI/UX testing...');

  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Create screenshots directory if it doesn't exist
    if (!fs.existsSync('screenshots')) {
      fs.mkdirSync('screenshots');
    }

    console.log('📱 LANDING PAGE TEST - Desktop View (1920x1080)');
    console.log('=' * 50);

    // Navigate to application
    await page.goto('http://localhost:5173', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for React app to fully load
    try {
      await page.waitForSelector('#root', { timeout: 10000 });
      console.log('✅ React root element found');
    } catch (e) {
      console.log('⚠️ React root not found, continuing...');
    }

    // Wait additional time for dynamic content
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Take full page screenshot
    await page.screenshot({
      path: 'screenshots/01_landing_page_desktop.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved: 01_landing_page_desktop.png');

    // Get page information
    const title = await page.title();
    const url = page.url();
    console.log(`📄 Page Title: ${title}`);
    console.log(`🌐 Current URL: ${url}`);

    // Analyze page elements
    const elementCounts = await page.evaluate(() => {
      return {
        buttons: document.querySelectorAll('button').length,
        links: document.querySelectorAll('a').length,
        forms: document.querySelectorAll('form').length,
        inputs: document.querySelectorAll('input').length,
        divs: document.querySelectorAll('div').length,
        images: document.querySelectorAll('img').length,
        headings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length
      };
    });

    console.log('📊 Element Analysis:');
    Object.entries(elementCounts).forEach(([element, count]) => {
      console.log(`  ${element}: ${count}`);
    });

    // Check for common UI frameworks
    const frameworkInfo = await page.evaluate(() => {
      const html = document.documentElement.outerHTML;
      return {
        hasMaterialUI: html.includes('Mui') || html.includes('MuiBox') || html.includes('material-ui'),
        hasReact: html.includes('react') || !!document.querySelector('[data-reactroot]'),
        hasBootstrap: html.includes('bootstrap') || html.includes('btn-'),
        hasCSS: document.styleSheets.length > 0
      };
    });

    console.log('🎨 Framework Detection:');
    Object.entries(frameworkInfo).forEach(([framework, detected]) => {
      const status = detected ? '✅' : '❌';
      console.log(`  ${framework}: ${status}`);
    });

    // Test responsive design
    console.log('\n📱 RESPONSIVE DESIGN TESTING');
    console.log('=' * 40);

    // Mobile view (iPhone X)
    await page.setViewport({ width: 375, height: 812 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({
      path: 'screenshots/02_mobile_view_375px.png',
      fullPage: true
    });
    console.log('✅ Mobile screenshot saved: 02_mobile_view_375px.png');

    // Tablet view (iPad)
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({
      path: 'screenshots/03_tablet_view_768px.png',
      fullPage: true
    });
    console.log('✅ Tablet screenshot saved: 03_tablet_view_768px.png');

    // Back to desktop
    await page.setViewport({ width: 1920, height: 1080 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test navigation and interactions
    console.log('\n🔗 NAVIGATION TESTING');
    console.log('=' * 30);

    // Look for navigation elements and links
    const navigationElements = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      const links = Array.from(document.querySelectorAll('a')).map(link => ({
        text: link.textContent?.trim() || '',
        href: link.href || '',
        visible: link.offsetParent !== null
      }));

      return {
        hasNavigation: !!nav,
        visibleLinks: links.filter(link => link.visible && link.text),
        totalLinks: links.length
      };
    });

    console.log(`🧭 Navigation present: ${navigationElements.hasNavigation ? 'Yes' : 'No'}`);
    console.log(`🔗 Total links: ${navigationElements.totalLinks}`);
    console.log(`👁️ Visible links: ${navigationElements.visibleLinks.length}`);

    if (navigationElements.visibleLinks.length > 0) {
      console.log('📋 Visible link texts:');
      navigationElements.visibleLinks.slice(0, 10).forEach((link, index) => {
        console.log(`  ${index + 1}. "${link.text}" -> ${link.href}`);
      });
    }

    // Try to find and test common authentication elements
    console.log('\n🔐 AUTHENTICATION TESTING');
    console.log('=' * 35);

    const authElements = await page.evaluate(() => {
      const searchTerms = ['login', 'signin', 'register', 'signup', 'auth'];
      const foundElements = [];

      searchTerms.forEach(term => {
        // Look for buttons with authentication text
        const buttons = document.querySelectorAll(`button, a, [role="button"]`);
        buttons.forEach(el => {
          const text = el.textContent?.toLowerCase() || '';
          if (text.includes(term)) {
            foundElements.push({
              type: 'button',
              text: el.textContent?.trim(),
              tag: el.tagName.toLowerCase()
            });
          }
        });
      });

      return foundElements;
    });

    console.log(`🔍 Authentication elements found: ${authElements.length}`);
    authElements.forEach((el, index) => {
      console.log(`  ${index + 1}. ${el.tag}: "${el.text}"`);
    });

    // Test forms if present
    console.log('\n📝 FORM TESTING');
    console.log('=' * 20);

    const formInfo = await page.evaluate(() => {
      const forms = document.querySelectorAll('form');
      const inputs = document.querySelectorAll('input, textarea, select');

      return {
        formCount: forms.length,
        inputCount: inputs.length,
        inputTypes: Array.from(inputs).map(input => input.type || input.tagName.toLowerCase())
      };
    });

    console.log(`📄 Forms found: ${formInfo.formCount}`);
    console.log(`📝 Input fields: ${formInfo.inputCount}`);
    if (formInfo.inputTypes.length > 0) {
      const typeCounts = formInfo.inputTypes.reduce((acc, type) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      console.log('📊 Input types:');
      Object.entries(typeCounts).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
    }

    // Color scheme and accessibility check
    console.log('\n🎨 VISUAL DESIGN ANALYSIS');
    console.log('=' * 35);

    const visualInfo = await page.evaluate(() => {
      const computedStyle = window.getComputedStyle(document.body);
      const rootStyles = window.getComputedStyle(document.documentElement);

      return {
        backgroundColor: computedStyle.backgroundColor,
        color: computedStyle.color,
        fontFamily: computedStyle.fontFamily,
        fontSize: computedStyle.fontSize,
        hasCustomProperties: rootStyles.getPropertyValue('--primary-color') !== ''
      };
    });

    console.log('🎨 Design properties:');
    Object.entries(visualInfo).forEach(([prop, value]) => {
      console.log(`  ${prop}: ${value}`);
    });

    console.log('\n✅ UI/UX Testing Completed Successfully!');
    console.log('📁 Screenshots saved in ./screenshots/ directory');

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔐 Browser closed');
    }
  }
}

// Run the tests
runUITests().catch(console.error);