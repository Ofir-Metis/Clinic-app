#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

console.log('🎭 Starting comprehensive browser testing with screenshots...\n');

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
}

async function takeScreenshot(page, name, description) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${timestamp}_${name}.png`;
    const filepath = path.join(screenshotsDir, filename);
    
    await page.screenshot({ 
        path: filepath, 
        fullPage: true,
        type: 'png'
    });
    
    console.log(`📸 Screenshot: ${description}`);
    console.log(`   Saved as: ${filename}\n`);
    
    return filename;
}

async function testSystemExperience() {
    const browser = await puppeteer.launch({ 
        headless: false, // Show browser for debugging
        defaultViewport: { width: 1280, height: 800 },
        args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
    });
    
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => console.log('🌐 Browser Console:', msg.text()));
    page.on('pageerror', err => console.log('❌ Page Error:', err.message));
    page.on('requestfailed', req => console.log('🚫 Request Failed:', req.url(), req.failure().errorText));
    
    try {
        console.log('🔍 Test 1: Loading main page...');
        
        // Test 1: Load main page
        await page.goto('http://localhost:5173/', { 
            waitUntil: 'networkidle2',
            timeout: 10000 
        });
        
        await takeScreenshot(page, 'main-page', 'Main page initial load');
        
        // Check if we see an error page
        const errorContent = await page.$eval('body', el => el.textContent).catch(() => '');
        if (errorContent.includes('Oops! Something went wrong') || errorContent.includes('something unexpected happened')) {
            console.log('❌ Still seeing error page on main load');
            await takeScreenshot(page, 'error-page', 'Error page detected');
        } else {
            console.log('✅ Main page loaded without error message');
        }
        
        // Wait for React to render
        await page.waitForTimeout(2000);
        await takeScreenshot(page, 'main-page-after-wait', 'Main page after React render');
        
        console.log('🔍 Test 2: Navigating to login page...');
        
        // Test 2: Navigate to login
        await page.goto('http://localhost:5173/login', { 
            waitUntil: 'networkidle2',
            timeout: 10000 
        });
        
        await takeScreenshot(page, 'login-page', 'Login page load');
        
        // Check for login form elements
        const hasLoginForm = await page.$('form') !== null;
        const hasEmailField = await page.$('input[type="email"], input[name="email"]') !== null;
        const hasPasswordField = await page.$('input[type="password"], input[name="password"]') !== null;
        
        console.log(`   Login form present: ${hasLoginForm}`);
        console.log(`   Email field present: ${hasEmailField}`);
        console.log(`   Password field present: ${hasPasswordField}`);
        
        if (hasLoginForm && hasEmailField && hasPasswordField) {
            console.log('✅ Login form is properly rendered');
            
            console.log('🔍 Test 3: Testing login with created user...');
            
            // Test 3: Try to login with the user we created
            await page.type('input[type="email"], input[name="email"]', 'test@clinic.com');
            await page.type('input[type="password"], input[name="password"]', 'TestPassword123');
            
            await takeScreenshot(page, 'login-form-filled', 'Login form filled out');
            
            // Click login button
            await page.click('button[type="submit"], button:contains("Login"), button:contains("Sign In")');
            
            // Wait for navigation or response
            await page.waitForTimeout(3000);
            
            await takeScreenshot(page, 'after-login-attempt', 'After login attempt');
            
            // Check if we're redirected to dashboard
            const currentUrl = page.url();
            console.log(`   Current URL after login: ${currentUrl}`);
            
            if (currentUrl.includes('/dashboard') || currentUrl.includes('/client')) {
                console.log('✅ Login successful - redirected to dashboard');
                
                console.log('🔍 Test 4: Exploring dashboard...');
                await takeScreenshot(page, 'dashboard', 'User dashboard after login');
                
                // Test navigation
                const navLinks = await page.$$('a, button');
                console.log(`   Found ${navLinks.length} navigation elements`);
                
                // Try to click on different sections
                const linkTexts = await page.$$eval('a', links => 
                    links.map(link => link.textContent.trim()).filter(text => text.length > 0)
                );
                console.log(`   Available links: ${linkTexts.slice(0, 10).join(', ')}...`);
                
            } else {
                console.log('⚠️  Login did not redirect to dashboard');
                
                // Check for error messages
                const pageText = await page.$eval('body', el => el.textContent);
                if (pageText.includes('Invalid') || pageText.includes('error') || pageText.includes('failed')) {
                    console.log('❌ Login failed with error message');
                } else {
                    console.log('❓ Login status unclear');
                }
            }
        } else {
            console.log('❌ Login form not properly rendered');
        }
        
        console.log('🔍 Test 5: Testing registration page...');
        
        // Test 5: Check registration page
        await page.goto('http://localhost:5173/register', { 
            waitUntil: 'networkidle2',
            timeout: 10000 
        });
        
        await takeScreenshot(page, 'register-page', 'Registration page');
        
        console.log('🔍 Test 6: Testing client registration...');
        
        // Test 6: Check client registration
        await page.goto('http://localhost:5173/client/register', { 
            waitUntil: 'networkidle2',
            timeout: 10000 
        });
        
        await takeScreenshot(page, 'client-register-page', 'Client registration page');
        
        console.log('🔍 Test 7: Network analysis...');
        
        // Test 7: Check network requests
        const responses = [];
        page.on('response', response => {
            responses.push({
                url: response.url(),
                status: response.status(),
                statusText: response.statusText()
            });
        });
        
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
        
        console.log('   Network requests made:');
        responses.slice(-10).forEach(resp => {
            console.log(`   ${resp.status} ${resp.url}`);
        });
        
        await takeScreenshot(page, 'final-state', 'Final system state');
        
    } catch (error) {
        console.error('❌ Browser test failed:', error.message);
        await takeScreenshot(page, 'error-state', 'Error state screenshot');
    } finally {
        await browser.close();
    }
}

// Run the test
testSystemExperience().then(() => {
    console.log('🎉 Browser testing completed!');
    console.log(`📁 Screenshots saved in: ${screenshotsDir}`);
}).catch(error => {
    console.error('💥 Test suite failed:', error);
});