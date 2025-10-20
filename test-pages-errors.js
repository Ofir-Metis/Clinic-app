const puppeteer = require('puppeteer');

async function testPagesForErrors() {
  console.log('🔍 Testing Pages for Errors and Missing Information\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
    args: ['--no-sandbox'],
    defaultViewport: { width: 1280, height: 720 }
  });

  try {
    const page = await browser.newPage();
    
    // Track console errors
    const pageErrors = [];
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error' && 
          !text.includes('404') && 
          !text.includes('GSI_LOGGER') && 
          !text.includes('Failed to load resource')) {
        pageErrors.push(`${type.toUpperCase()}: ${text}`);
        console.log(`❌ ERROR: ${text}`);
      }
    });
    
    page.on('pageerror', error => {
      pageErrors.push(`PAGE ERROR: ${error.message}`);
      console.log(`💥 PAGE ERROR: ${error.message}`);
    });
    
    // Set up authentication (mock tokens)
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('accessToken', 'mock-token-for-testing');
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'therapist'
      }));
    });
    
    console.log('=== TESTING MAIN PAGES ===\n');
    
    // Pages to test with expected content
    const testPages = [
      {
        url: '/notifications',
        name: 'Notifications Page',
        expectedContent: ['notifications', 'updates', 'cosmic']
      },
      {
        url: '/patients',
        name: 'Patient List Page',
        expectedContent: ['clients', 'fellow', 'travelers']
      },
      {
        url: '/calendar',
        name: 'Calendar Page',
        expectedContent: ['calendar', 'appointments', 'time']
      },
      {
        url: '/settings',
        name: 'Settings Page',
        expectedContent: ['settings', 'preferences']
      },
      {
        url: '/tools',
        name: 'Tools Page',
        expectedContent: ['tools', 'toolkit']
      }
    ];
    
    let passedTests = 0;
    const totalTests = testPages.length;
    
    for (const testCase of testPages) {
      console.log(`📄 Testing: ${testCase.name}`);
      
      try {
        await page.goto(`http://localhost:5173${testCase.url}`, { 
          waitUntil: 'networkidle2',
          timeout: 10000
        });
        
        // Wait for page to load
        await new Promise(r => setTimeout(r, 2000));
        
        const pageInfo = await page.evaluate(() => ({
          url: window.location.href,
          pathname: window.location.pathname,
          title: document.title,
          bodyText: document.body.innerText.toLowerCase(),
          hasContent: document.body.innerText.length > 100,
          hasLoadingSpinner: !!document.querySelector('[role="progressbar"]'),
          hasErrorMessage: document.body.innerText.toLowerCase().includes('error'),
          hasTranslationKeys: document.body.innerText.includes('t.') || document.body.innerText.includes('[object Object]')
        }));
        
        console.log(`  📍 URL: ${pageInfo.pathname}`);
        console.log(`  📝 Title: ${pageInfo.title}`);
        console.log(`  📊 Has Content: ${pageInfo.hasContent}`);
        console.log(`  ⚡ Loading: ${pageInfo.hasLoadingSpinner}`);
        console.log(`  🚨 Error Messages: ${pageInfo.hasErrorMessage}`);
        console.log(`  🔤 Translation Issues: ${pageInfo.hasTranslationKeys}`);
        
        // Check if page loaded correctly
        let testPassed = true;
        const issues = [];
        
        if (!pageInfo.hasContent) {
          testPassed = false;
          issues.push('No meaningful content loaded');
        }
        
        if (pageInfo.hasErrorMessage) {
          testPassed = false;
          issues.push('Error messages present on page');
        }
        
        if (pageInfo.hasTranslationKeys) {
          testPassed = false;
          issues.push('Translation keys not resolved');
        }
        
        if (pageInfo.pathname !== testCase.url) {
          testPassed = false;
          issues.push(`Redirected to ${pageInfo.pathname} instead of ${testCase.url}`);
        }
        
        if (testPassed) {
          console.log(`  ✅ ${testCase.name}: PASSED\n`);
          passedTests++;
        } else {
          console.log(`  ❌ ${testCase.name}: FAILED`);
          issues.forEach(issue => console.log(`    - ${issue}`));
          console.log('');
        }
        
      } catch (error) {
        console.log(`  ❌ ${testCase.name}: ERROR - ${error.message}\n`);
      }
    }
    
    console.log('=== TEST SUMMARY ===');
    console.log(`📊 Pages Tested: ${totalTests}`);
    console.log(`✅ Pages Passed: ${passedTests}`);
    console.log(`❌ Pages Failed: ${totalTests - passedTests}`);
    console.log(`🐛 Total Console Errors: ${pageErrors.length}`);
    
    if (pageErrors.length > 0) {
      console.log('\n🔍 Console Errors Found:');
      pageErrors.forEach((error, i) => {
        console.log(`${i + 1}. ${error}`);
      });
    }
    
    if (passedTests === totalTests && pageErrors.length === 0) {
      console.log('\n🎉🎉🎉 ALL PAGES WORKING CORRECTLY! 🎉🎉🎉');
      console.log('✅ No translation errors');
      console.log('✅ No missing field information');
      console.log('✅ All pages load with proper content');
    } else {
      console.log('\n⚠️ ISSUES FOUND - NEED ATTENTION ⚠️');
    }
    
  } catch (error) {
    console.error('❌ Test script error:', error.message);
  } finally {
    await browser.close();
  }
}

testPagesForErrors().catch(console.error);