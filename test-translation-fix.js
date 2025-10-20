#!/usr/bin/env node

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function testTranslationFix() {
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
        const errorEntry = `PAGE ERROR: ${err.message}\n${err.stack}`;
        errors.push(errorEntry);
        console.log('❌ ' + errorEntry);
    });
    
    try {
        console.log('🔍 Testing translation fix on development server...');
        
        // Test development server first (should have clearer errors)
        console.log('📍 Testing http://localhost:5175/');
        await page.goto('http://localhost:5175/', { 
            waitUntil: 'networkidle2',
            timeout: 15000 
        });
        
        // Wait for React to render and errors to surface
        console.log('⏳ Waiting for React to render...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Take screenshot of dev server
        const devScreenshot = path.join(screenshotsDir, `${new Date().toISOString().replace(/[:.]/g, '-')}_dev-server-after-fix.png`);
        await page.screenshot({ 
            path: devScreenshot,
            fullPage: true
        });
        console.log('📸 Development server screenshot saved:', devScreenshot);
        
        // Check what's actually rendered
        const bodyText = await page.$eval('body', el => el.textContent.substring(0, 500));
        console.log('📄 Dev Server Content Preview:', bodyText);
        
        // Check if we still see the error page
        const hasErrorBoundary = await page.$('.MuiPaper-root') !== null;
        const hasErrorIcon = await page.$('[data-testid="ErrorOutlineIcon"]') !== null;
        
        if (hasErrorBoundary || hasErrorIcon) {
            console.log('❌ Still showing error page - checking details...');
            
            // Try to get error details
            const errorDetails = await page.evaluate(() => {
                const errorElement = document.querySelector('pre');
                return errorElement ? errorElement.textContent : 'No error details found';
            });
            console.log('🔍 Error Details:', errorDetails);
        } else {
            console.log('✅ No error boundary detected - page appears to be working!');
            
            // Check for login form elements
            const emailField = await page.$('#email') !== null;
            const passwordField = await page.$('#password') !== null;
            const loginButton = await page.$('[type="submit"]') !== null;
            
            console.log('📋 Login form elements:');
            console.log(`  Email field: ${emailField ? '✅' : '❌'}`);
            console.log(`  Password field: ${passwordField ? '✅' : '❌'}`);
            console.log(`  Login button: ${loginButton ? '✅' : '❌'}`);
            
            if (emailField && passwordField && loginButton) {
                console.log('🎉 SUCCESS! Login page is working correctly!');
                
                // Test the production build as well
                console.log('\n📍 Now testing production build at http://localhost:5173/');
                await page.goto('http://localhost:5173/', { 
                    waitUntil: 'networkidle2',
                    timeout: 15000 
                });
                
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                const prodScreenshot = path.join(screenshotsDir, `${new Date().toISOString().replace(/[:.]/g, '-')}_production-after-fix.png`);
                await page.screenshot({ 
                    path: prodScreenshot,
                    fullPage: true
                });
                console.log('📸 Production screenshot saved:', prodScreenshot);
                
                // Check production page
                const prodBodyText = await page.$eval('body', el => el.textContent.substring(0, 500));
                console.log('📄 Production Content Preview:', prodBodyText);
                
                const prodHasError = await page.$('.MuiPaper-root') !== null && 
                                   (await page.evaluate(() => document.body.textContent.includes('Oops! Something went wrong')));
                
                if (prodHasError) {
                    console.log('⚠️ Production still shows error - may need frontend rebuild');
                } else {
                    console.log('✅ Production is also working!');
                    
                    // Test actual login functionality
                    console.log('\n🧪 Testing login functionality...');
                    await page.type('#email', 'test@clinic.com');
                    await page.type('#password', 'test123');
                    
                    const loginTestScreenshot = path.join(screenshotsDir, `${new Date().toISOString().replace(/[:.]/g, '-')}_login-form-filled.png`);
                    await page.screenshot({ 
                        path: loginTestScreenshot,
                        fullPage: true
                    });
                    console.log('📸 Login form with test data screenshot saved:', loginTestScreenshot);
                }
            }
        }
        
        console.log('\n📊 Test Results Summary:');
        console.log(`Total console logs: ${logs.length}`);
        console.log(`Total page errors: ${errors.length}`);
        
        if (errors.length > 0) {
            console.log('\n🚨 Page Errors Found:');
            errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        } else {
            console.log('✅ No JavaScript errors detected!');
        }
        
    } catch (error) {
        console.error('💥 Test failed:', error.message);
        
        const errorScreenshot = path.join(screenshotsDir, `${new Date().toISOString().replace(/[:.]/g, '-')}_test-error.png`);
        await page.screenshot({ 
            path: errorScreenshot,
            fullPage: true
        });
        console.log('📸 Error state screenshot saved:', errorScreenshot);
        
    } finally {
        await browser.close();
    }
}

testTranslationFix().catch(console.error);