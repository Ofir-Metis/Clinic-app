const puppeteer = require('puppeteer');

async function testFrontendAPICallsAsCoach() {
    console.log('🔍 Testing Frontend API Calls as Coach...');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    // Store all network requests
    const networkRequests = [];
    const consoleErrors = [];
    const failedRequests = [];

    // Monitor network requests
    page.on('request', (request) => {
        if (request.url().includes('localhost:4000') || request.url().includes('/api/')) {
            networkRequests.push({
                method: request.method(),
                url: request.url()
            });
        }
    });

    // Monitor network responses
    page.on('response', (response) => {
        if (response.url().includes('localhost:4000') || response.url().includes('/api/')) {
            if (response.status() >= 400) {
                failedRequests.push({
                    url: response.url(),
                    status: response.status(),
                    statusText: response.statusText()
                });
            }
        }
    });

    // Monitor console errors
    page.on('console', (msg) => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
        }
    });

    try {
        console.log('📍 Step 1: Navigating to frontend...');
        await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('📍 Step 2: Looking for login form...');
        const emailInput = await page.$('input[type="email"], input[name="email"]');
        if (!emailInput) {
            console.log('❌ Email input not found');
            return;
        }

        console.log('📍 Step 3: Logging in as coach@example.com...');
        await page.type('input[type="email"], input[name="email"]', 'coach@example.com');
        await page.type('input[type="password"], input[name="password"]', 'CoachPassword123!');

        // Click login button
        await page.click('button[type="submit"]');

        console.log('📍 Step 4: Waiting for dashboard to load...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log('📍 Step 5: Getting page info...');
        const pageContent = await page.evaluate(() => {
            return {
                title: document.title,
                url: window.location.href,
                bodyText: document.body.innerText.substring(0, 500)
            };
        });

        console.log('\n🎯 ANALYSIS RESULTS:');
        console.log('==================');

        console.log('\n📊 PAGE INFO:');
        console.log('Title:', pageContent.title);
        console.log('URL:', pageContent.url);

        console.log('\n🌐 API REQUESTS MADE:');
        console.log('===================');
        if (networkRequests.length === 0) {
            console.log('❌ NO API REQUESTS DETECTED');
        } else {
            networkRequests.forEach((req, index) => {
                console.log(`${index + 1}. ${req.method} ${req.url}`);
            });
        }

        console.log('\n❌ FAILED REQUESTS:');
        console.log('==================');
        if (failedRequests.length === 0) {
            console.log('✅ No failed requests');
        } else {
            failedRequests.forEach((req, index) => {
                console.log(`${index + 1}. ${req.status} ${req.statusText} - ${req.url}`);
            });
        }

        console.log('\n🚨 CONSOLE ERRORS:');
        console.log('=================');
        if (consoleErrors.length === 0) {
            console.log('✅ No console errors');
        } else {
            consoleErrors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }

        console.log('\n📱 DASHBOARD CONTENT PREVIEW:');
        console.log('============================');
        console.log(pageContent.bodyText);

        // Keep browser open for 30 seconds for manual inspection
        console.log('\n🔍 Browser will stay open for 30 seconds for manual inspection...');
        await new Promise(resolve => setTimeout(resolve, 30000));

        await browser.close();

    } catch (error) {
        console.error('❌ Error during testing:', error.message);
        await browser.close();
        throw error;
    }
}

// Run the test
testFrontendAPICallsAsCoach()
    .then(() => {
        console.log('\n✅ Analysis complete!');
    })
    .catch(error => {
        console.error('❌ Test failed:', error);
    });