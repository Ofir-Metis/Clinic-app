#!/usr/bin/env node

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function testRegistration() {
    // Ensure screenshots directory exists
    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    const browser = await puppeteer.launch({ 
        headless: false,
        devtools: false,
        defaultViewport: { width: 1280, height: 800 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Capture console logs and errors
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
        if (response.url().includes('/auth/register')) {
            console.log(`🔑 Registration API Response: ${response.status()} ${response.statusText()}`);
        }
    });
    
    try {
        console.log('🔍 REGISTRATION TEST - Testing user registration flow');
        console.log('=================================================\n');
        
        // Step 1: Navigate to registration page
        console.log('📍 Step 1: Navigating to registration page...');
        await page.goto('http://localhost:5173/register', { 
            waitUntil: 'networkidle2',
            timeout: 15000 
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const regScreenshot1 = path.join(screenshotsDir, `${new Date().toISOString().replace(/[:.]/g, '-')}_reg-1-page.png`);
        await page.screenshot({ 
            path: regScreenshot1,
            fullPage: true
        });
        console.log('📸 Registration page screenshot saved');
        
        // Check registration form
        const hasRegForm = await page.$('#email') !== null;
        if (!hasRegForm) {
            console.log('❌ Registration form not found!');
            const bodyText = await page.$eval('body', el => el.textContent.substring(0, 500));
            console.log('Page content:', bodyText);
            return;
        }
        console.log('✅ Registration form found');
        
        // Step 2: Fill registration form
        console.log('\n📍 Step 2: Filling registration form...');
        
        const testEmail = `testuser_${Date.now()}@clinic.com`;
        console.log(`Using email: ${testEmail}`);
        
        await page.type('#name', 'Test User');
        await page.type('#email', testEmail);
        await page.type('#password', 'testpass123');
        await page.type('#confirmPassword', 'testpass123');
        
        console.log('✅ All fields filled (name, email, password, confirmPassword)');
        
        const regScreenshot2 = path.join(screenshotsDir, `${new Date().toISOString().replace(/[:.]/g, '-')}_reg-2-filled.png`);
        await page.screenshot({ 
            path: regScreenshot2,
            fullPage: true
        });
        console.log('📸 Registration form filled screenshot saved');
        
        // Step 3: Submit registration
        console.log('\n📍 Step 3: Submitting registration...');
        
        const regButton = await page.$('button[type="submit"]');
        if (regButton) {
            await regButton.click();
            console.log('🔘 Registration button clicked');
        } else {
            console.log('❌ Registration button not found');
            return;
        }
        
        // Wait for response
        console.log('⏳ Waiting for registration response...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const afterRegScreenshot = path.join(screenshotsDir, `${new Date().toISOString().replace(/[:.]/g, '-')}_reg-3-after.png`);
        await page.screenshot({ 
            path: afterRegScreenshot,
            fullPage: true
        });
        console.log('📸 After registration screenshot saved');
        
        // Check result
        const currentUrl = page.url();
        console.log(`📍 Current URL: ${currentUrl}`);
        
        if (currentUrl.includes('/dashboard')) {
            console.log('🎉 SUCCESS! Registration completed and redirected to dashboard!');
            
            // Take dashboard screenshot
            const dashboardScreenshot = path.join(screenshotsDir, `${new Date().toISOString().replace(/[:.]/g, '-')}_reg-4-dashboard.png`);
            await page.screenshot({ 
                path: dashboardScreenshot,
                fullPage: true
            });
            console.log('📸 Dashboard screenshot saved');
            
        } else if (currentUrl.includes('/register')) {
            console.log('⚠️ Still on registration page - check for errors');
            
            // Check for error messages
            const errorMessage = await page.$('.MuiAlert-message');
            if (errorMessage) {
                const errorText = await errorMessage.evaluate(el => el.textContent);
                console.log(`❌ Registration error: ${errorText}`);
            }
            
        } else {
            console.log(`❓ Redirected to: ${currentUrl}`);
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
        
        const errorScreenshot = path.join(screenshotsDir, `${new Date().toISOString().replace(/[:.]/g, '-')}_reg-error.png`);
        await page.screenshot({ 
            path: errorScreenshot,
            fullPage: true
        });
        console.log('📸 Error screenshot saved');
        
    } finally {
        console.log('\n📝 Registration test complete. Check screenshots folder for visual results.');
        await browser.close();
    }
}

testRegistration().catch(console.error);