// Simple test to see exact frontend behavior
const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Listen to all network requests
    const requests = [];
    const responses = [];

    page.on('request', request => {
        requests.push({
            url: request.url(),
            method: request.method(),
            headers: request.headers()
        });
    });

    page.on('response', response => {
        responses.push({
            url: response.url(),
            status: response.status(),
            headers: response.headers()
        });
    });

    try {
        console.log('Going to http://localhost:5173...');
        await page.goto('http://localhost:5173');

        console.log('Page loaded. Taking screenshot...');
        await page.screenshot({ path: 'frontend-initial.png' });

        // Look for login form and login
        const emailInput = await page.$('input[type="email"], input[name="email"]');
        if (emailInput) {
            console.log('Found login form, logging in...');
            await page.type('input[type="email"], input[name="email"]', 'coach@example.com');
            await page.type('input[type="password"], input[name="password"]', 'CoachPassword123!');
            await page.click('button[type="submit"]');

            // Wait for navigation or dashboard to load
            await new Promise(resolve => setTimeout(resolve, 3000));

            console.log('Taking dashboard screenshot...');
            await page.screenshot({ path: 'dashboard-after-login.png' });

            // Get current URL and title
            const url = await page.url();
            const title = await page.title();

            console.log(`Current URL: ${url}`);
            console.log(`Page Title: ${title}`);

            // Log all API requests
            console.log('\n=== API REQUESTS ===');
            const apiRequests = requests.filter(r => r.url.includes('localhost:4000'));
            apiRequests.forEach((req, i) => {
                console.log(`${i + 1}. ${req.method} ${req.url}`);
            });

            console.log('\n=== API RESPONSES ===');
            const apiResponses = responses.filter(r => r.url.includes('localhost:4000'));
            apiResponses.forEach((res, i) => {
                console.log(`${i + 1}. ${res.status} ${res.url}`);
            });

        } else {
            console.log('No login form found');
        }

    } catch (error) {
        console.error('Error:', error);
    }

    // Keep browser open for 10 seconds
    await new Promise(resolve => setTimeout(resolve, 10000));
    await browser.close();

    console.log('Test complete!');
})();