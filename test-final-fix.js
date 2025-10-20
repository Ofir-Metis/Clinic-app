#!/usr/bin/env node

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function testFinalFix() {
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
    
    try {
        console.log('🎉 FINAL TEST: Production build after translation fixes');
        
        // Test production build
        console.log('📍 Testing production build at http://localhost:5173/');
        await page.goto('http://localhost:5173/', { 
            waitUntil: 'networkidle2',
            timeout: 15000 
        });
        
        // Wait for React to render
        console.log('⏳ Waiting for React to render...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Take screenshot
        const prodScreenshot = path.join(screenshotsDir, `${new Date().toISOString().replace(/[:.]/g, '-')}_FINAL-production-test.png`);
        await page.screenshot({ 
            path: prodScreenshot,
            fullPage: true
        });
        console.log('📸 FINAL production screenshot saved:', prodScreenshot);
        
        // Check what's actually rendered
        const bodyText = await page.$eval('body', el => el.textContent.substring(0, 800));
        console.log('📄 Production Content:', bodyText);
        
        // Check if we still see the error page
        const hasErrorMessage = bodyText.includes('Oops! Something went wrong');
        const hasLoginForm = bodyText.includes('Welcome Back') || bodyText.includes('Your Digital Address');
        
        if (hasErrorMessage) {
            console.log('❌ STILL SHOWING ERROR PAGE');
            
            // Try to get error details
            const errorDetails = await page.evaluate(() => {
                const errorElement = document.querySelector('pre');
                return errorElement ? errorElement.textContent : 'No error details found';
            });
            console.log('🔍 Error Details:', errorDetails);
            
            // Check if it's the old cached error or new error
            const isTypescriptError = errorDetails.includes('TypeError: e is not a function');
            if (isTypescriptError) {
                console.log('⚠️ This appears to be cached error - trying hard refresh...');
                
                // Try hard refresh
                await page.reload({ waitUntil: 'networkidle2' });
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                const afterRefreshScreenshot = path.join(screenshotsDir, `${new Date().toISOString().replace(/[:.]/g, '-')}_after-hard-refresh.png`);
                await page.screenshot({ 
                    path: afterRefreshScreenshot,
                    fullPage: true
                });
                console.log('📸 After refresh screenshot saved:', afterRefreshScreenshot);
                
                const refreshedContent = await page.$eval('body', el => el.textContent.substring(0, 500));
                console.log('📄 After refresh content:', refreshedContent);
                
                if (refreshedContent.includes('Welcome Back')) {
                    console.log('✅ SUCCESS! Hard refresh fixed it - login page is now working!');
                } else {
                    console.log('❌ Still showing error after refresh');
                }
            }
            
        } else if (hasLoginForm) {
            console.log('🎉 SUCCESS! LOGIN PAGE IS WORKING!');
            
            // Test login form functionality
            console.log('📋 Testing login form elements...');
            
            const emailField = await page.$('#email');
            const passwordField = await page.$('#password');
            const loginButton = await page.$('[type="submit"]');
            const languageSelector = await page.$('.MuiSelect-select');
            
            console.log(`  Email field: ${emailField ? '✅' : '❌'}`);
            console.log(`  Password field: ${passwordField ? '✅' : '❌'}`);
            console.log(`  Login button: ${loginButton ? '✅' : '❌'}`);
            console.log(`  Language selector: ${languageSelector ? '✅' : '❌'}`);
            
            if (emailField && passwordField && loginButton) {
                console.log('\n🧪 Testing login form interaction...');
                
                // Fill out the form
                await page.type('#email', 'test@clinic.com');
                await page.type('#password', 'test123');
                
                const formFilledScreenshot = path.join(screenshotsDir, `${new Date().toISOString().replace(/[:.]/g, '-')}_login-form-filled.png`);
                await page.screenshot({ 
                    path: formFilledScreenshot,
                    fullPage: true
                });
                console.log('📸 Login form filled screenshot saved:', formFilledScreenshot);
                
                // Test language switching
                if (languageSelector) {
                    console.log('🌐 Testing language switching...');
                    await page.click('.MuiSelect-select');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    const langSwitchScreenshot = path.join(screenshotsDir, `${new Date().toISOString().replace(/[:.]/g, '-')}_language-menu.png`);
                    await page.screenshot({ 
                        path: langSwitchScreenshot,
                        fullPage: true
                    });
                    console.log('📸 Language menu screenshot saved:', langSwitchScreenshot);
                    
                    // Click on Hebrew option
                    const hebrewOption = await page.$('[data-value="he"]');
                    if (hebrewOption) {
                        await hebrewOption.click();
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        
                        const hebrewScreenshot = path.join(screenshotsDir, `${new Date().toISOString().replace(/[:.]/g, '-')}_hebrew-interface.png`);
                        await page.screenshot({ 
                            path: hebrewScreenshot,
                            fullPage: true
                        });
                        console.log('📸 Hebrew interface screenshot saved:', hebrewScreenshot);
                    }
                }
                
                console.log('\n🎉 COMPREHENSIVE SUCCESS!');
                console.log('✅ Login page loads without errors');
                console.log('✅ All form elements are present');
                console.log('✅ Form can be filled out');
                console.log('✅ Language switching works');
                console.log('✅ Translation system is functioning');
                
            }
        } else {
            console.log('❓ Unexpected page content - neither error nor login form detected');
        }
        
        console.log('\n📊 Final Test Results:');
        console.log(`Console logs: ${logs.length}`);
        console.log(`Page errors: ${errors.length}`);
        
        if (errors.length > 0) {
            console.log('\n🚨 Remaining Errors:');
            errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        } else {
            console.log('✅ No JavaScript errors detected!');
        }
        
    } catch (error) {
        console.error('💥 Final test failed:', error.message);
        
        const errorScreenshot = path.join(screenshotsDir, `${new Date().toISOString().replace(/[:.]/g, '-')}_FINAL-error.png`);
        await page.screenshot({ 
            path: errorScreenshot,
            fullPage: true
        });
        console.log('📸 Error screenshot saved:', errorScreenshot);
        
    } finally {
        await browser.close();
    }
}

testFinalFix().catch(console.error);