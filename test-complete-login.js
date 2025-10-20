#!/usr/bin/env node

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function testCompleteLogin() {
    // Ensure screenshots directory exists
    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    const browser = await puppeteer.launch({ 
        headless: false,
        devtools: true,
        defaultViewport: { width: 1280, height: 800 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Capture all console logs and errors
    const logs = [];
    const errors = [];
    
    page.on('console', msg => {
        const logEntry = `${msg.type().toUpperCase()}: ${msg.text()}`;
        logs.push(logEntry);
        console.log('🌐 ' + logEntry);
    });
    
    page.on('pageerror', err => {
        const errorEntry = `PAGE ERROR: ${err.message}`;
        errors.push(errorEntry);
        console.log('❌ ' + errorEntry);
    });

    page.on('response', response => {
        if (response.url().includes('/auth/login')) {
            console.log(`🔑 Login API Response: ${response.status()} ${response.statusText()}`);
        }
    });
    
    try {
        console.log('🔍 COMPLETE LOGIN TEST - Testing actual authentication and dashboard access');
        console.log('=============================================================\n');
        
        // Step 1: Navigate to login page
        console.log('📍 Step 1: Navigating to login page...');
        await page.goto('http://localhost:5173/login', { 
            waitUntil: 'networkidle2',
            timeout: 15000 
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const loginScreenshot1 = path.join(screenshotsDir, `${new Date().toISOString().replace(/[:.]/g, '-')}_1-login-page.png`);
        await page.screenshot({ 
            path: loginScreenshot1,
            fullPage: true
        });
        console.log('📸 Login page screenshot saved');
        
        // Check if login page loaded correctly
        const hasLoginForm = await page.$('#email') !== null;
        if (!hasLoginForm) {
            console.log('❌ Login form not found! Checking page content...');
            const bodyText = await page.$eval('body', el => el.textContent.substring(0, 500));
            console.log('Page content:', bodyText);
            
            // Check if it's showing an error
            const hasError = bodyText.includes('Oops! Something went wrong');
            if (hasError) {
                console.log('❌ Error page is showing. Translation fix may not be complete.');
                return;
            }
        } else {
            console.log('✅ Login form found');
        }
        
        // Step 2: Fill in login credentials
        console.log('\n📍 Step 2: Filling in login credentials...');
        
        // Use the working demo account
        await page.type('#email', 'demo@clinic.com');
        await page.type('#password', 'demo123');
        
        const loginFilledScreenshot = path.join(screenshotsDir, `${new Date().toISOString().replace(/[:.]/g, '-')}_2-login-filled.png`);
        await page.screenshot({ 
            path: loginFilledScreenshot,
            fullPage: true
        });
        console.log('📸 Login form filled screenshot saved');
        
        // Step 3: Submit login form
        console.log('\n📍 Step 3: Submitting login form...');
        
        // Click the login button
        const loginButton = await page.$('button[type="submit"]');
        if (loginButton) {
            await loginButton.click();
            console.log('🔘 Login button clicked');
        } else {
            console.log('❌ Login button not found');
            return;
        }
        
        // Wait for navigation or error
        console.log('⏳ Waiting for authentication response...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const afterLoginScreenshot = path.join(screenshotsDir, `${new Date().toISOString().replace(/[:.]/g, '-')}_3-after-login.png`);
        await page.screenshot({ 
            path: afterLoginScreenshot,
            fullPage: true
        });
        console.log('📸 After login screenshot saved');
        
        // Check current URL
        const currentUrl = page.url();
        console.log(`📍 Current URL: ${currentUrl}`);
        
        // Check if we're on the dashboard
        if (currentUrl.includes('/dashboard')) {
            console.log('🎉 SUCCESS! Redirected to dashboard!');
            
            // Take dashboard screenshot
            const dashboardScreenshot = path.join(screenshotsDir, `${new Date().toISOString().replace(/[:.]/g, '-')}_4-dashboard.png`);
            await page.screenshot({ 
                path: dashboardScreenshot,
                fullPage: true
            });
            console.log('📸 Dashboard screenshot saved');
            
            // Check dashboard content
            const dashboardContent = await page.$eval('body', el => el.textContent.substring(0, 500));
            console.log('Dashboard content preview:', dashboardContent);
            
            // Check for error on dashboard
            if (dashboardContent.includes('Oops! Something went wrong')) {
                console.log('❌ Dashboard showing error - translation issue with DashboardPage');
            } else if (dashboardContent.includes('Welcome') || dashboardContent.includes('Dashboard')) {
                console.log('✅ Dashboard loaded successfully!');
            }
            
        } else if (currentUrl.includes('/login')) {
            console.log('⚠️ Still on login page - authentication may have failed');
            
            // Check for error messages
            const errorMessage = await page.$('.MuiAlert-message');
            if (errorMessage) {
                const errorText = await errorMessage.evaluate(el => el.textContent);
                console.log(`❌ Login error: ${errorText}`);
            }
            
            // Check API response in network tab
            console.log('🔍 Checking network responses...');
            
        } else {
            console.log(`❓ Redirected to unexpected page: ${currentUrl}`);
        }
        
        // Step 4: Test registration flow
        console.log('\n📍 Step 4: Testing registration flow...');
        await page.goto('http://localhost:5173/register', { 
            waitUntil: 'networkidle2',
            timeout: 15000 
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const registerScreenshot = path.join(screenshotsDir, `${new Date().toISOString().replace(/[:.]/g, '-')}_5-register-page.png`);
        await page.screenshot({ 
            path: registerScreenshot,
            fullPage: true
        });
        console.log('📸 Registration page screenshot saved');
        
        // Check registration page content
        const registerContent = await page.$eval('body', el => el.textContent.substring(0, 500));
        if (registerContent.includes('Oops! Something went wrong')) {
            console.log('❌ Registration page showing error');
        } else if (registerContent.includes('Register') || registerContent.includes('Sign Up')) {
            console.log('✅ Registration page loaded successfully');
        }
        
        console.log('\n📊 Test Summary:');
        console.log('=================');
        console.log(`Console logs: ${logs.length}`);
        console.log(`Page errors: ${errors.length}`);
        
        if (errors.length > 0) {
            console.log('\n🚨 JavaScript Errors:');
            errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }
        
    } catch (error) {
        console.error('💥 Test failed:', error.message);
        
        const errorScreenshot = path.join(screenshotsDir, `${new Date().toISOString().replace(/[:.]/g, '-')}_error.png`);
        await page.screenshot({ 
            path: errorScreenshot,
            fullPage: true
        });
        console.log('📸 Error screenshot saved');
        
    } finally {
        console.log('\n📝 Test complete. Check screenshots folder for visual results.');
        await browser.close();
    }
}

testCompleteLogin().catch(console.error);